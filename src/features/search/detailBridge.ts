import { USE_MOCK } from "../../api/client"
import { MOCK_FACILITIES } from "../../data/mockFacilities"
import type { Facility, FacilitySummary } from "../../types/facility"

/**
 * 목록 항목 → 상세 Drawer의 초기 Facility.
 * Drawer는 이 값으로 상단 정보를 바로 그린 뒤, A03(useFacilityDetail) 응답이 오면 상세로 바꾼다.
 * id는 A03 facilityId로 그대로 쓰이므로 바꾸지 않는다.
 *
 * - mock 모드: 같은 id의 mock 원본을 그대로 넘긴다.
 * - API 모드: A02에 있는 공통 필드만 넘긴다. 전화·편의시설·공간별 운영시간은 A03 응답에서 채운다.
 */
export function toDetailFacility(summary: FacilitySummary): Facility {
  if (USE_MOCK) {
    const original = MOCK_FACILITIES.find((facility) => facility.id === summary.id)
    if (original) return original
  }
  return {
    id: summary.id,
    name: summary.name,
    type: summary.typeName,
    district: summary.district,
    address: summary.address,
    latitude: summary.latitude,
    longitude: summary.longitude,
    imageUrl: summary.imageUrl,
    weeklyHours: {},
  }
}
