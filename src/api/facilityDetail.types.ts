/**
 * A03 GET /api/v1/facilities/{facilityId} 응답 DTO.
 * 명세는 계약 검토 중이라 개발 서버 실제 응답(2026-11-11 확인)을 기준으로 옮겼다.
 * A02와 겹치는 구조는 facilitySearch.types.ts의 DTO를 재사용한다. 요일은 API 기준 0=월 … 6=일.
 */
import type {
  CriteriaDto,
  DayScheduleDto,
  FacilitySearchItemDto,
  SpaceAvailabilityDto,
} from "./facilitySearch.types"

/** A02 공간 판정 + 7일치 운영시간 */
export interface FacilityDetailSpaceDto extends SpaceAvailabilityDto {
  weeklyHours: DayScheduleDto[]
}

export interface FacilityDetailItemDto
  extends Omit<FacilitySearchItemDto, "distanceMeters" | "availableSpaces"> {
  phone: string | null
  closedDayNote: string | null
  dataUpdatedAt: string | null
  amenities: string[] | null
  /** 판정 결과와 관계없이 시설의 전체 공간 */
  spaces: FacilityDetailSpaceDto[]
}

/** A03 응답 data */
export interface FacilityDetailDto {
  criteria: Pick<CriteriaDto, "dayOfWeek" | "startTime" | "endTime">
  facility: FacilityDetailItemDto
}
