import { useCallback, useEffect, useRef, useState } from "react"
import { getFacilities } from "../../api/facilityApi"
import { ApiError, isAbortError } from "../../api/client"
import type {
  FacilitySummary,
  SearchFilters,
  SearchWarning,
} from "../../types/facility"
import type { SearchDestination } from "../../types/navigation"

/** v2: facilityType(문자열) → facilityTypeId(A01 typeId). 이전 형식 값은 버린다 */
const STORAGE_KEY = "jigeumgayong-search-v2"

const today = new Date().getDay()
const weekendDefaults = today === 0 ? ["10:00", "12:00"] : ["16:00", "18:00"]

const DEFAULT_FILTERS: SearchFilters = {
  keyword: "",
  district: "전체",
  weekday: today,
  startTime: today === 0 || today === 6 ? weekendDefaults[0] : "18:00",
  endTime: today === 0 || today === 6 ? weekendDefaults[1] : "20:00",
  facilityTypeId: null,
}

interface PersistedSearch {
  draft: SearchFilters
  applied: SearchFilters
  submitted: boolean
}

function isFilters(value: unknown): value is SearchFilters {
  if (typeof value !== "object" || value === null) return false
  const filters = value as Record<string, unknown>
  return (
    typeof filters.keyword === "string" &&
    typeof filters.district === "string" &&
    typeof filters.weekday === "number" &&
    typeof filters.startTime === "string" &&
    typeof filters.endTime === "string" &&
    (filters.facilityTypeId === null || typeof filters.facilityTypeId === "number")
  )
}

function loadPersistedSearch(): PersistedSearch | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    if (!value) return null
    const parsed = JSON.parse(value) as Partial<PersistedSearch>
    if (!isFilters(parsed.draft) || !isFilters(parsed.applied)) return null
    return {
      draft: parsed.draft,
      applied: parsed.applied,
      submitted: parsed.submitted === true,
    }
  } catch {
    return null
  }
}

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError({
        status: 0,
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      })
}

interface Options {
  /** 검색이 끝난 뒤(성공·실패) 결과 화면으로 이동할 때 호출 */
  onComplete: (destination: SearchDestination) => void
}

/**
 * 검색 조건(draft: 입력 중 / applied: 적용됨), 검색 여부, 로딩·에러 상태와
 * 검색 결과를 관리한다. 조건은 sessionStorage에 저장되어 새로고침 후에도 유지된다.
 *
 * 새 요청을 보내면 이전 요청은 abort하고, 요청 순번이 최신이 아닌 응답은 버린다.
 * 그래서 늦게 도착한 이전 응답이 새 결과를 덮어쓰지 않는다.
 */
export function useFacilitySearch({ onComplete }: Options) {
  const persisted = useRef(loadPersistedSearch()).current
  const [draft, setDraft] = useState(persisted?.draft ?? DEFAULT_FILTERS)
  const [applied, setApplied] = useState(persisted?.applied ?? DEFAULT_FILTERS)
  const [submitted, setSubmitted] = useState(persisted?.submitted ?? false)
  const [loading, setLoading] = useState(false)
  const [errorInfo, setErrorInfo] = useState<ApiError | null>(null)
  const [results, setResults] = useState<FacilitySummary[]>([])
  const [availableCount, setAvailableCount] = useState(0)
  const [warnings, setWarnings] = useState<SearchWarning[]>([])

  const controllerRef = useRef<AbortController | null>(null)
  const requestSeqRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ draft, applied, submitted }),
      )
    } catch {
      // 저장소를 쓸 수 없어도 검색은 계속한다
    }
  }, [draft, applied, submitted])

  const runSearch = useCallback(
    async (filters: SearchFilters, destination?: SearchDestination) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const seq = ++requestSeqRef.current

      setApplied(filters)
      setSubmitted(true)
      setLoading(true)
      setErrorInfo(null)

      try {
        const result = await getFacilities(filters, controller.signal)
        if (seq !== requestSeqRef.current) return
        setResults(result.items)
        setAvailableCount(result.availableCount)
        setWarnings(result.warnings)
      } catch (error) {
        if (isAbortError(error) || seq !== requestSeqRef.current) return
        const apiError = toApiError(error)
        console.error(
          `[A02] 시설 검색 실패 code=${apiError.code} status=${apiError.status} requestId=${apiError.requestId ?? "-"}`,
          apiError,
        )
        setResults([])
        setAvailableCount(0)
        setWarnings([])
        setErrorInfo(apiError)
      }

      if (seq !== requestSeqRef.current) return
      setLoading(false)
      if (controllerRef.current === controller) controllerRef.current = null
      if (destination) onCompleteRef.current(destination)
    },
    [],
  )

  // 새로고침 등으로 검색 완료 상태가 복원되면 결과는 저장돼 있지 않으므로 다시 요청한다
  useEffect(() => {
    if (persisted?.submitted) void runSearch(persisted.applied)
    return () => {
      requestSeqRef.current += 1
      controllerRef.current?.abort()
    }
  }, [persisted, runSearch])

  const performSearch = (destination: SearchDestination = "search") => {
    if (draft.endTime <= draft.startTime) return
    void runSearch(draft, destination)
  }

  const retrySearch = (destination: SearchDestination) => {
    void runSearch(applied, destination)
  }

  /** 유형 칩은 검색 버튼 없이 즉시 결과에 반영된다(검색 전이면 조건만 바꾼다) */
  const setType = (facilityTypeId: SearchFilters["facilityTypeId"]) => {
    setDraft((current) => ({ ...current, facilityTypeId }))
    if (submitted) {
      void runSearch({ ...applied, facilityTypeId })
    } else {
      setApplied((current) => ({ ...current, facilityTypeId }))
    }
  }

  return {
    draft,
    setDraft,
    applied,
    submitted,
    loading,
    error: errorInfo !== null,
    errorInfo,
    results,
    availableCount,
    warnings,
    performSearch,
    retrySearch,
    setType,
  }
}
