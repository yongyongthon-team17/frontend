import type { Facility, SearchFilters } from "../types/facility"
import { getAvailability } from "./timeUtils"

export function filterFacilities(
  facilities: Facility[],
  filters: SearchFilters,
) {
  const keyword = filters.keyword.trim().toLocaleLowerCase("ko-KR")
  return facilities.filter((facility) => {
    const matchesKeyword =
      !keyword ||
      facility.name.toLocaleLowerCase("ko-KR").includes(keyword) ||
      facility.address.toLocaleLowerCase("ko-KR").includes(keyword)
    const matchesDistrict =
      filters.district === "전체" || facility.district === filters.district
    const matchesType =
      filters.facilityType === "전체" || facility.type === filters.facilityType
    const availability = getAvailability(
      facility.weeklyHours[filters.weekday],
      filters.startTime,
      filters.endTime,
    )
    return (
      matchesKeyword &&
      matchesDistrict &&
      matchesType &&
      availability.kind === "available"
    )
  })
}
