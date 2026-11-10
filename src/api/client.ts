/**
 * 공통 API 클라이언트 (backend docs/07 §3.4 성공 envelope, §3.5 오류 형식).
 */

/** VITE_USE_MOCK=true면 백엔드 대신 mock 데이터를 쓴다 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

/**
 * 백엔드 기본 주소(끝 슬래시 제거).
 * 비어 있으면 상대 경로(/api/...)로 호출한다. 개발 모드에서는 vite 프록시(VITE_PROXY_TARGET)를 탄다.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "")

if (!BASE_URL && !import.meta.env.DEV && !USE_MOCK) {
  console.warn(
    "[api] VITE_API_BASE_URL이 설정되지 않아 같은 오리진의 /api로 호출합니다. 배포 환경변수를 확인하세요.",
  )
}

export interface ApiWarning {
  code: string
  message: string
  facilityId: string | null
}

export interface ApiMeta {
  requestId: string
  generatedAt: string
  warnings: ApiWarning[]
}

export interface ApiErrorDetail {
  field: string
  reason: string
}

export interface ApiResult<T> {
  data: T
  meta: ApiMeta
  /** 응답 헤더 X-Request-Id (없으면 meta.requestId) */
  requestId: string | null
  /** 응답 헤더 Retry-After(초). A04에서 AI 호출 한도에 걸린 항목이 있을 때만 온다. 없으면 null */
  retryAfterSeconds: number | null
}

export class ApiError extends Error {
  readonly status: number
  /** 백엔드 오류 코드. 응답 본문이 없으면 NETWORK_ERROR / HTTP_<status> */
  readonly code: string
  readonly details: ApiErrorDetail[]
  readonly requestId: string | null

  constructor(params: {
    status: number
    code: string
    message: string
    details?: ApiErrorDetail[]
    requestId?: string | null
  }) {
    super(params.message)
    this.name = "ApiError"
    this.status = params.status
    this.code = params.code
    this.details = params.details ?? []
    this.requestId = params.requestId ?? null
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: unknown }).name === "AbortError"
  )
}

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<string | number>

/**
 * 쿼리스트링을 만든다. 한글은 URLSearchParams가 UTF-8 퍼센트 인코딩한다.
 * null·undefined·빈 문자열은 키를 생략하고(07 §3.6), 배열은 같은 키를 반복한다.
 */
export function buildQuery(query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") continue
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)))
    } else {
      params.append(key, String(value))
    }
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

/** GET 기본 타임아웃. 오래 걸리는 API(A04 등)는 호출할 때 timeoutMs로 늘린다 */
export const DEFAULT_TIMEOUT_MS = 15_000

export interface RequestOptions {
  /** 호출 측 취소 신호. 취소되면 AbortError를 그대로 던진다(오류로 표시하지 않음) */
  signal?: AbortSignal
  /** 응답 본문까지 받는 제한 시간(ms). 넘으면 ApiError(code: "TIMEOUT") */
  timeoutMs?: number
  /** 추가 요청 헤더(예: A04의 X-Client-Id) */
  headers?: Record<string, string>
}

const timeoutError = (timeoutMs: number) =>
  new ApiError({
    status: 0,
    code: "TIMEOUT",
    message: `서버 응답이 ${Math.round(timeoutMs / 1000)}초 안에 오지 않았습니다.`,
  })

function isErrorBody(body: unknown): body is {
  error: { code: string; message: string; details?: ApiErrorDetail[]; requestId?: string }
} {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error: unknown }).error === "object" &&
    (body as { error: unknown }).error !== null
  )
}

function isSuccessBody<T>(body: unknown): body is { data: T; meta: ApiMeta } {
  return (
    typeof body === "object" && body !== null && "data" in body && "meta" in body
  )
}

export function apiGet<T>(
  path: string,
  query?: Record<string, QueryValue>,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  return request<T>("GET", `${BASE_URL}${path}${buildQuery(query)}`, options)
}

/** JSON 본문을 보내는 POST (A04 등). body는 JSON.stringify로 직렬화한다 */
export function apiPost<T>(
  path: string,
  body: unknown,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  return request<T>("POST", `${BASE_URL}${path}`, options, body)
}

/** Retry-After 헤더(초 단위 정수)를 읽는다. 없거나 숫자가 아니면 null */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

async function request<T>(
  method: "GET" | "POST",
  url: string,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS, headers }: RequestOptions,
  requestBody?: unknown,
): Promise<ApiResult<T>> {
  // 호출 측 signal과 타임아웃을 하나의 내부 controller로 묶는다.
  // 어느 쪽 때문에 중단됐는지 기록해 두고, 사용자 취소는 AbortError, 타임아웃은 TIMEOUT으로 구분한다.
  const controller = new AbortController()
  let timedOut = false
  const abortByCaller = () => controller.abort(signal?.reason)
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
  signal?.addEventListener("abort", abortByCaller, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  const rethrowAbort = (error: unknown) => {
    if (timedOut) throw timeoutError(timeoutMs)
    if (signal?.aborted || isAbortError(error)) {
      throw isAbortError(error) ? error : new DOMException("Aborted", "AbortError")
    }
  }

  let response: Response
  let body: unknown = null
  try {
    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(requestBody === undefined ? {} : { "Content-Type": "application/json" }),
          ...headers,
        },
        body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
        signal: controller.signal,
      })
    } catch (error) {
      rethrowAbort(error)
      // 백엔드 미기동, CORS 거부 등 응답 자체를 받지 못한 경우
      throw new ApiError({
        status: 0,
        code: "NETWORK_ERROR",
        message: "서버에 연결할 수 없습니다.",
      })
    }

    try {
      body = await response.json()
    } catch (error) {
      rethrowAbort(error)
      body = null
    }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", abortByCaller)
  }

  const headerRequestId = response.headers.get("X-Request-Id")

  if (!response.ok) {
    if (isErrorBody(body)) {
      throw new ApiError({
        status: response.status,
        code: body.error.code,
        message: body.error.message,
        details: body.error.details,
        requestId: headerRequestId ?? body.error.requestId ?? null,
      })
    }
    throw new ApiError({
      status: response.status,
      code: `HTTP_${response.status}`,
      message: "요청을 처리하지 못했습니다.",
      requestId: headerRequestId,
    })
  }

  if (!isSuccessBody<T>(body)) {
    throw new ApiError({
      status: response.status,
      code: "INVALID_RESPONSE",
      message: "응답 형식이 올바르지 않습니다.",
      requestId: headerRequestId,
    })
  }

  return {
    data: body.data,
    meta: { ...body.meta, warnings: body.meta.warnings ?? [] },
    requestId: headerRequestId ?? body.meta.requestId ?? null,
    retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
  }
}
