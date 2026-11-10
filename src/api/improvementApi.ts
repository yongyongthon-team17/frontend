/**
 * A04 AI 운영시간 개선안.
 * VITE_USE_MOCK=true면 mockImprovementApi의 샘플 데이터를, 아니면 서버(POST /api/v1/improvement-analyses)를 호출한다.
 * 시설 상세 패널에서 사용자가 버튼을 눌렀을 때만 호출한다(AI 호출 한도·크레딧 보호).
 */
import type { Facility, SearchFilters } from "../types/facility"
import { USE_MOCK, apiPost, type ApiWarning } from "./client"
import { getClientId } from "./clientId"
import type { ImprovementDto } from "./improvement.types"
import { toFacilitySearchQuery } from "./mappers"
import { getMockImprovement } from "./mockImprovementApi"

export interface ImprovementResult {
  data: ImprovementDto
  warnings: ApiWarning[]
  /** 한도에 걸린 항목이 있을 때 다시 시도할 수 있기까지 남은 초. 없으면 null */
  retryAfterSeconds: number | null
  requestId: string | null
  /** 서버가 아닌 샘플 데이터이면 true (화면에 샘플 안내를 표시한다) */
  isDemo: boolean
}

/** 서버가 LLM 호출 20초·요청 전체 30초로 제한하므로 그보다 길게 기다린다 */
export const IMPROVEMENT_TIMEOUT_MS = 35_000

/** A04 POST /api/v1/improvement-analyses */
export async function getImprovement(
  facility: Facility,
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<ImprovementResult> {
  if (USE_MOCK) return getMockImprovement(facility, filters, { signal })

  // facilityId는 문자열 그대로 보낸다. criteria는 A02와 같은 여섯 필드(값이 없는 키는 JSON에서 빠진다).
  const { data, meta, requestId, retryAfterSeconds } = await apiPost<ImprovementDto>(
    "/api/v1/improvement-analyses",
    { facilityId: facility.id, criteria: toFacilitySearchQuery(filters) },
    {
      signal,
      timeoutMs: IMPROVEMENT_TIMEOUT_MS,
      // 브라우저별 익명 ID. AI 호출 한도의 개인 키로 쓰이며 서버는 저장·로그에 남기지 않는다
      headers: { "X-Client-Id": getClientId() },
    },
  )
  return { data, warnings: meta.warnings, retryAfterSeconds, requestId, isDemo: false }
}
