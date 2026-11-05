import type { District, FacilityTypeFilter } from "../types/facility"

/** 시설 유형 필터 칩 순서 */
export const FACILITY_TYPES: FacilityTypeFilter[] = [
  "전체",
  "공공도서관",
  "평생학습관",
  "생활체육시설",
]

/** 검색 폼 지역 선택 옵션 순서 ("전체"는 별도 라벨로 표시) */
export const DISTRICTS: District[] = ["수지구", "기흥구", "처인구"]
