/**
 * VITE_USE_MOCK=true일 때 쓰는 A01·A02 대체 구현. src/data/mockFacilities.ts를 화면 쪽에서 거른다.
 */
import { MOCK_FACILITIES } from "../data/mockFacilities"
import { filterFacilities } from "../features/search/facilityFilters"
import type { FacilityTypeOption, SearchFilters } from "../types/facility"
import type { FacilitySearchResult } from "./facilityApi"
import { mockFacilityToSummary } from "./mappers"

/** mock 유형 → 임시 typeId (실제 DB typeId와 무관) */
export const MOCK_FACILITY_TYPES: FacilityTypeOption[] = [
  { typeId: 1, name: "공공도서관" },
  { typeId: 2, name: "평생학습관" },
  { typeId: 3, name: "생활체육시설" },
]

const MOCK_DELAY_MS = 420

const typeIdOf = (typeName: string) =>
  MOCK_FACILITY_TYPES.find((type) => type.name === typeName)?.typeId ?? 0

function wait(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (signal?.aborted) return abort()
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", abort)
      resolve()
    }, MOCK_DELAY_MS)
    signal?.addEventListener("abort", abort, { once: true })
  })
}

export async function getMockSearchOptions(signal?: AbortSignal) {
  await wait(signal)
  return { facilityTypes: MOCK_FACILITY_TYPES }
}

export async function getMockFacilities(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<FacilitySearchResult> {
  await wait(signal)
  const facilityType =
    filters.facilityTypeId === null
      ? null
      : (MOCK_FACILITY_TYPES.find((type) => type.typeId === filters.facilityTypeId)
          ?.name ?? null)
  const items = filterFacilities(MOCK_FACILITIES, filters, facilityType).map(
    (facility) =>
      mockFacilityToSummary(facility, filters.weekday, typeIdOf(facility.type)),
  )
  return { items, warnings: [], unknownSpaceCount: 0, requestId: null }
}
