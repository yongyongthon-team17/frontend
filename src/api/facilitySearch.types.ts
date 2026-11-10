/**
 * A01·A02 응답 DTO (backend docs/06_API_명세서.md v0.3,
 * FacilitySearchOptionsResponse / FacilitySearchResponse 기준).
 * 요일은 API 기준 0=월 … 6=일이다.
 */

export interface FacilityTypeOptionDto {
  typeId: number
  name: string
  defaultImageUrl: string | null
}

export interface DayOptionDto {
  value: number
  label: string
}

/** A01 GET /api/v1/facility-search-options 의 data */
export interface FacilitySearchOptionsDto {
  facilityTypes: FacilityTypeOptionDto[]
  districts: string[]
  daysOfWeek: DayOptionDto[]
  defaultDayOfWeek: number
  timeZone: string
}

export interface CriteriaDto {
  keyword: string | null
  district: string | null
  facilityTypeIds: number[]
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface TimeIntervalDto {
  openTime: string
  closeTime: string
}

export interface DayScheduleDto {
  dayOfWeek: number
  state: "OPEN" | "CLOSED" | "UNKNOWN"
  intervals: TimeIntervalDto[]
}

export interface GapDto {
  startTime: string
  endTime: string
}

export interface AvailabilityDto {
  status: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN"
  basis: "WEEKLY_SCHEDULE" | "ACCESS_TYPE"
  requiresReservation: boolean
  unavailableIntervals: GapDto[] | null
}

export interface SpaceAvailabilityDto {
  spaceType: string
  spaceLabel: string
  selectedSchedule: DayScheduleDto
  availability: AvailabilityDto
}

export interface FacilitySearchItemDto {
  facilityId: string
  typeId: number
  typeName: string
  district: string
  accessType: "OPEN_HOURS" | "RESERVATION" | "ALWAYS_OPEN"
  name: string
  address: string
  imageUrl: string | null
  coordinates: { latitude: number; longitude: number }
  distanceMeters: number | null
  availableSpaces: SpaceAvailabilityDto[]
}

/** A02 GET /api/v1/facilities 의 data */
export interface FacilitySearchDto {
  criteria: CriteriaDto
  items: FacilitySearchItemDto[]
  totalCount: number
  matchedSpaceCount: number
  unknownSpaceCount: number
}
