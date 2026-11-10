/**
 * A03 GET /api/v1/facilities/{facilityId} — 시설 상세 및 공간별 운영시간.
 * 시설이 있으면 이용 불가(UNAVAILABLE)여도 200으로 전체 정보가 온다.
 */
import type { DetailCriteria, Facility, SearchWarning } from "../types/facility"
import { apiGet, ApiError, USE_MOCK } from "./client"
import type { FacilityDetailDto } from "./facilityDetail.types"
import {
  isValidFacilityId,
  toFacilityDetail,
  toFacilityDetailQuery,
  toSearchWarnings,
} from "./mappers"
import { getMockFacilityDetail } from "./mockFacilityApi"

export interface FacilityDetailResult {
  facility: Facility
  warnings: SearchWarning[]
  requestId: string | null
}

export async function getFacilityDetail(
  facilityId: string,
  filters: DetailCriteria,
  signal?: AbortSignal,
): Promise<FacilityDetailResult> {
  if (USE_MOCK) return getMockFacilityDetail(facilityId, filters, signal)
  // 잘못된 id는 서버에 보내지 않고 서버와 같은 오류 코드로 처리한다
  if (!isValidFacilityId(facilityId)) {
    throw new ApiError({
      status: 400,
      code: "INVALID_REQUEST",
      message: "시설 번호 형식이 올바르지 않습니다.",
      details: [{ field: "facilityId", reason: "INVALID_FORMAT" }],
    })
  }
  const { data, meta, requestId } = await apiGet<FacilityDetailDto>(
    `/api/v1/facilities/${encodeURIComponent(facilityId)}`,
    toFacilityDetailQuery(filters),
    { signal },
  )
  return {
    facility: toFacilityDetail(data.facility),
    warnings: toSearchWarnings(meta.warnings),
    requestId,
  }
}
