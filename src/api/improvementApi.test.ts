import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError } from "./client"
import { IMPROVEMENT_TIMEOUT_MS, getImprovement } from "./improvementApi"
import type { Facility, SearchFilters } from "../types/facility"

const facility: Facility = {
  id: "23",
  name: "예시 공공도서관",
  type: "도서관",
  district: "수지구",
  address: "용인시 수지구",
  latitude: 37.3,
  longitude: 127.1,
  weeklyHours: {},
}

/** 화면 weekday 2 = 화요일 → API dayOfWeek 1 */
const filters: SearchFilters = {
  keyword: "  ",
  district: "수지구",
  weekday: 2,
  startTime: "19:00",
  endTime: "21:00",
  facilityTypeId: 1,
}

const okBody = {
  data: {
    candidateCount: 0,
    facilityCount: 0,
    unknownSpaceCount: 0,
    items: [],
    disclaimer: "참고용",
  },
  meta: {
    requestId: "req-1",
    generatedAt: "2026-11-10T20:00:00+09:00",
    warnings: [{ code: "WEEKLY_SCHEDULE_ONLY", message: "m", facilityId: null }],
  },
}

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("getImprovement 요청", () => {
  it("POST /api/v1/improvement-analyses에 facilityId·criteria·X-Client-Id를 보낸다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody))
    vi.stubGlobal("fetch", fetchMock)

    await getImprovement(facility, filters)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("/api/v1/improvement-analyses")
    expect(init.method).toBe("POST")
    const headers = init.headers as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json")
    expect(headers["X-Client-Id"]).toMatch(/^[0-9a-f-]{36}$/i)

    // facilityId는 문자열, 빈 keyword는 키에서 빠지고, 요일은 API 코드(0=월)로 바뀐다
    expect(JSON.parse(init.body as string)).toEqual({
      facilityId: "23",
      criteria: {
        district: "수지구",
        facilityTypeIds: [1],
        dayOfWeek: 1,
        startTime: "19:00",
        endTime: "21:00",
      },
    })
  })

  it("같은 브라우저에서는 X-Client-Id가 매번 같다", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse(okBody))
    vi.stubGlobal("fetch", fetchMock)

    await getImprovement(facility, filters)
    await getImprovement(facility, filters)

    const ids = fetchMock.mock.calls.map(
      ([, init]) => (init as RequestInit & { headers: Record<string, string> }).headers["X-Client-Id"],
    )
    expect(ids[0]).toBe(ids[1])
  })
})

describe("getImprovement 응답", () => {
  it("data·경고·샘플 여부를 돌려주고 Retry-After가 없으면 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(okBody)))

    const result = await getImprovement(facility, filters)

    expect(result.data.items).toEqual([])
    expect(result.warnings).toHaveLength(1)
    expect(result.isDemo).toBe(false)
    expect(result.retryAfterSeconds).toBeNull()
    expect(result.requestId).toBe("req-1")
  })

  it("한도 초과 응답의 Retry-After 헤더를 초 단위로 읽는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(okBody, { headers: { "Content-Type": "application/json", "Retry-After": "175" } })),
    )

    expect((await getImprovement(facility, filters)).retryAfterSeconds).toBe(175)
  })

  it("Retry-After가 숫자가 아니면 null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(okBody, { headers: { "Content-Type": "application/json", "Retry-After": "soon" } })),
    )

    expect((await getImprovement(facility, filters)).retryAfterSeconds).toBeNull()
  })
})

describe("getImprovement 오류", () => {
  it("404 FACILITY_NOT_FOUND를 ApiError로 던진다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: "FACILITY_NOT_FOUND", message: "시설을 찾을 수 없습니다.", details: [] } },
          { status: 404 },
        ),
      ),
    )

    await expect(getImprovement(facility, filters)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "FACILITY_NOT_FOUND",
    })
  })

  it("연결 실패는 NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))

    await expect(getImprovement(facility, filters)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    })
  })

  it("35초 안에 응답이 없으면 TIMEOUT, 그 전에는 기다린다", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          )
        }),
      ),
    )

    const pending = getImprovement(facility, filters)
    const assertion = expect(pending).rejects.toMatchObject({ code: "TIMEOUT" })
    await vi.advanceTimersByTimeAsync(IMPROVEMENT_TIMEOUT_MS - 1)
    await vi.advanceTimersByTimeAsync(1)
    await assertion
    await expect(pending).rejects.toBeInstanceOf(ApiError)
  })

  it("호출 측 취소는 AbortError로 던진다(오류 화면을 띄우지 않기 위함)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          )
        }),
      ),
    )
    const controller = new AbortController()

    const pending = getImprovement(facility, filters, controller.signal)
    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
  })
})
