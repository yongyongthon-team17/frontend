import { useCallback, useEffect, useState } from "react"
import { ApiError, isAbortError } from "../../api/client"
import {
  getFacilityDetail,
  type FacilityDetailResult,
} from "../../api/facilityDetailApi"
import type { DetailCriteria } from "../../types/facility"

function toApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError({
        status: 0,
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      })
}

/**
 * A03 상세를 불러온다. 시설이나 요일·시간이 바뀌면 이전 요청을 취소하고 다시 요청한다.
 * 같은 시설의 이전 응답(data)은 다시 불러오는 동안에도 유지해 시설 정보가 깜빡이지 않게 한다.
 */
export function useFacilityDetail(
  facilityId: string,
  { weekday, startTime, endTime }: DetailCriteria,
) {
  const [data, setData] = useState<FacilityDetailResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setData((current) => (current?.facility.id === facilityId ? current : null))
    setLoading(true)
    setError(null)

    getFacilityDetail(facilityId, { weekday, startTime, endTime }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted || isAbortError(caught)) return
        const apiError = toApiError(caught)
        console.error(
          `[A03] 시설 상세 조회 실패 code=${apiError.code} status=${apiError.status} requestId=${apiError.requestId ?? "-"}`,
          apiError,
        )
        setError(apiError)
        setLoading(false)
      })

    return () => controller.abort()
  }, [facilityId, weekday, startTime, endTime, reloadKey])

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, loading, error, retry }
}
