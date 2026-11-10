/**
 * A01 검색 선택지 · A02 시간대별 시설 검색.
 * A03~A05(상세·AI·교통)는 별도 파일에 둔다.
 */
import type {
  FacilitySummary,
  SearchFilters,
  SearchOptions,
  SearchWarning,
} from "../types/facility"
import { apiGet, USE_MOCK } from "./client"
import type {
  FacilitySearchDto,
  FacilitySearchOptionsDto,
} from "./facilitySearch.types"
import {
  toFacilitySearchQuery,
  toFacilitySummary,
  toSearchOptions,
  toSearchWarnings,
} from "./mappers"
import { getMockFacilities, getMockSearchOptions } from "./mockFacilityApi"

export interface FacilitySearchResult {
  items: FacilitySummary[]
  warnings: SearchWarning[]
  /** 운영시간을 알 수 없어 판정에서 빠진 공간 수 (화면 표시는 아직 없음) */
  unknownSpaceCount: number
  requestId: string | null
}

/** A01 GET /api/v1/facility-search-options */
export async function getSearchOptions(signal?: AbortSignal): Promise<SearchOptions> {
  if (USE_MOCK) return getMockSearchOptions(signal)
  const { data } = await apiGet<FacilitySearchOptionsDto>(
    "/api/v1/facility-search-options",
    undefined,
    { signal },
  )
  return toSearchOptions(data)
}

/** A02 GET /api/v1/facilities */
export async function getFacilities(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<FacilitySearchResult> {
  if (USE_MOCK) return getMockFacilities(filters, signal)
  const { data, meta, requestId } = await apiGet<FacilitySearchDto>(
    "/api/v1/facilities",
    toFacilitySearchQuery(filters),
    { signal },
  )
  return {
    items: data.items.map(toFacilitySummary),
    warnings: toSearchWarnings(meta.warnings),
    unknownSpaceCount: data.unknownSpaceCount,
    requestId,
  }
}
