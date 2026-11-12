import type { Facility, SearchFilters } from "../../types/facility"
import { getAvailability } from "../../utils/timeUtils"

/**
 * mock 모드 전용 클라이언트 필터. API 모드에서는 서버(A02)가 거른다.
 * @param facilityType 선택한 유형명 (null = 전체)
 * @param includeUnavailable true이면 희망 시간에 이용할 수 없는 시설도 포함한다(A02와 같은 동작)
 */
export function filterFacilities(
  facilities: Facility[],
  filters: SearchFilters,
  facilityType: string | null,
  includeUnavailable = false,
) {
  const keyword = filters.keyword.trim().toLocaleLowerCase("ko-KR")
  return facilities.filter((facility) => {
    const matchesKeyword =
      !keyword ||
      facility.name.toLocaleLowerCase("ko-KR").includes(keyword) ||
      facility.address.toLocaleLowerCase("ko-KR").includes(keyword)
    const matchesDistrict =
      filters.district === "전체" || facility.district === filters.district
    const matchesType = facilityType === null || facility.type === facilityType
    const availability = getAvailability(
      facility.weeklyHours[filters.weekday],
      filters.startTime,
      filters.endTime,
    )
    return (
      matchesKeyword &&
      matchesDistrict &&
      matchesType &&
      (includeUnavailable || availability.kind === "available")
    )
  })
}
