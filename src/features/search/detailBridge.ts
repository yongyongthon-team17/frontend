import { USE_MOCK } from "../../api/client"
import { MOCK_FACILITIES } from "../../data/mockFacilities"
import type { Facility, FacilitySummary } from "../../types/facility"

/**
 * 목록 항목 → 상세 Drawer용 Facility.
 * A03(시설 상세) 연동 전까지의 임시 연결이며, A03 담당이 이 파일을 교체한다.
 *
 * - mock 모드: 같은 id의 mock 원본을 그대로 넘긴다(7일치 운영시간·전화·편의시설 유지).
 * - API 모드: A02에 있는 공통 필드만 넘긴다. 상세 필드는 만들어 넣지 않으므로
 *   Drawer는 "운영정보 확인 필요" / "정보 없음"으로 표시된다.
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
