import { MOCK_FACILITIES } from "../data/mockFacilities"
import type { Facility } from "../types/facility"

/**
 * 시설 목록 조회 인터페이스.
 * 현재는 mock 데이터를 그대로 반환한다. 백엔드 연동 시 이 파일의 구현만 교체한다.
 */
export function getFacilities(): Facility[] {
  return MOCK_FACILITIES
}
