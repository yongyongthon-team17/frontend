import { useEffect, useState } from "react"
import { getSearchOptions } from "../../api/facilityApi"
import { isAbortError } from "../../api/client"
import type { FacilityTypeOption } from "../../types/facility"

/**
 * A01 검색 선택지를 앱 시작 시 한 번 불러온다.
 * 실패하면 유형 목록은 빈 배열이고, 칩에는 "전체"만 남는다(검색은 계속 가능).
 */
export function useSearchOptions() {
  const [facilityTypes, setFacilityTypes] = useState<FacilityTypeOption[]>([])

  useEffect(() => {
    const controller = new AbortController()
    getSearchOptions(controller.signal)
      .then((options) => setFacilityTypes(options.facilityTypes))
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        console.error("[A01] 검색 선택지 조회 실패", error)
      })
    return () => controller.abort()
  }, [])

  return { facilityTypes }
}
