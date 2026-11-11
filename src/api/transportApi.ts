/**
 * A05 교통 접근성
 * GET /api/v1/facilities/{facilityId}/transport-accessibility
 */
import { apiGet, USE_MOCK } from "./client"
import type {
  TransportAccessibilityDto,
  TransportSummary,
} from "./transport.types"

/** 서버 모양(Dto)을 화면 모양(Summary)으로 */
function toTransportSummary(dto: TransportAccessibilityDto): TransportSummary {
  const { accessibility } = dto
  return {
    status: accessibility.status,
    available: accessibility.status === "AVAILABLE",
    radiusMeters: accessibility.radiusMeters,
    stopCount: accessibility.stopCount,
    grade: accessibility.grade,
    notes: accessibility.notes ?? [],
  }
}

/** VITE_USE_MOCK=true일 때 쓰는 가짜 데이터 */
const MOCK_TRANSPORT: TransportAccessibilityDto = {
  facilityId: "mock",
  accessibility: {
    status: "AVAILABLE",
    radiusMeters: 500,
    stopCount: 14,
    grade: null,
    notes: [
      "등급 기준은 추가 논의가 필요합니다.",
      "정류장 수는 시간대별 운행 가능성을 의미하지 않습니다.",
    ],
  },
}

/** A05 시설 교통 접근성 조회 */
export async function getTransportAccessibility(
  facilityId: string,
  signal?: AbortSignal,
): Promise<TransportSummary> {
  if (USE_MOCK) {
    return toTransportSummary({ ...MOCK_TRANSPORT, facilityId })
  }
  const { data } = await apiGet<TransportAccessibilityDto>(
    `/api/v1/facilities/${encodeURIComponent(facilityId)}/transport-accessibility`,
    undefined,
    { signal },
  )
  return toTransportSummary(data)
}