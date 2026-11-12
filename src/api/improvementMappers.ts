/**
 * A04 응답 DTO → AI 카드용 화면 모델 변환. 서버 값은 가공하지 않고 표시용으로만 고른다.
 * (통합 개선안 COMPLETE·PARTIAL은 같은 모양으로 보여주고, UNAVAILABLE이면 문장을 숨긴다.)
 */
import type { DailyHours } from "../types/facility"
import { formatHours, toMinutes } from "../utils/timeUtils"
import { ApiError } from "./client"
import type { ImprovementItemDto } from "./improvement.types"
import type { ImprovementResult } from "./improvementApi"

/**
 * generated: 제안 생성됨 / none: 서버가 부족한 점을 찾지 못해 LLM 없이 고정 문구를 준 경우(재시도 대상 아님)
 * limited: 호출 한도 초과 / failed: 생성 실패
 */
export type AiSpaceStatus = "generated" | "none" | "limited" | "failed"

export interface AiGap {
  start: string
  end: string
}

export interface AiSpaceView {
  /** 같은 시설 안에서 공간을 구분하는 키(spaceType) */
  key: string
  spaceLabel: string
  /** 공간이 2개 이상일 때만 이름을 보여준다 */
  showLabel: boolean
  status: AiSpaceStatus
  /** 희망 시간 기준 공간 이용 상태. UNKNOWN이면 운영시간을 몰라 "운영하지 않는 구간"을 판단할 수 없다 */
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN"
  /** 선택 요일 실제 운영시간 문구 ("09:00–18:00", "휴관" 등) */
  operatingHours: string
  /** 첫 운영 구간의 시작 시각. 제안 운영시간 범위를 만들 때 쓴다 */
  firstOpen: string | null
  gaps: AiGap[]
  currentClosingTime: string | null
  proposedClosingTime: string | null
  /** 서버 문구. 한도 초과·생성 실패 안내에 그대로 쓴다 */
  reason: string | null
  alternatives: string[]
  /** UNAVAILABLE이면 null */
  integratedText: string | null
  requiresReservation: boolean
  limitations: string[]
}

export interface AiResultView {
  spaces: AiSpaceView[]
  disclaimer: string
  /** 분석할 공간이 하나도 없는 시설 */
  isEmpty: boolean
  /** 선택 요일 운영시간을 알 수 없는 공간 수 */
  unknownSpaceCount: number
  /** 한도에 걸린 항목이 하나라도 있으면 true */
  hasLimited: boolean
  /** 한도 초과 시 다시 시도할 수 있기까지 남은 초(Retry-After) */
  retryAfterSeconds: number | null
  /** 서버가 아닌 샘플 데이터인지 */
  isDemo: boolean
}

/**
 * AI 호출 한도에 걸렸는지는 서버 문구가 아니라 신호로 판단한다.
 * 한도에 걸린 항목이 있으면 서버가 meta.warnings에 RATE_LIMITED(시설 번호 포함)와
 * 응답 헤더 Retry-After를 함께 준다. 둘 중 하나라도 있으면 한도 초과로 본다.
 */
export function isRateLimited(
  result: Pick<ImprovementResult, "warnings" | "retryAfterSeconds">,
  facilityId: string,
): boolean {
  return (
    result.retryAfterSeconds !== null ||
    result.warnings.some(
      (warning) =>
        warning.code === "RATE_LIMITED" &&
        (warning.facilityId === null || warning.facilityId === facilityId),
    )
  )
}

function toDailyHours(item: ImprovementItemDto): DailyHours | undefined {
  const { state, intervals } = item.selectedSchedule
  if (state === "CLOSED") return { closed: true, intervals: [] }
  if (!intervals.length) return undefined
  return {
    closed: false,
    intervals: intervals.map((i) => ({ open: i.openTime, close: i.closeTime })),
  }
}

/**
 * 생성된 항목이 아니면: 한도 초과 신호가 있으면 limited, 서버 고정 문구(통합 문장 text가 있는 UNAVAILABLE)면 none,
 * 그 외(문장이 없는 UNAVAILABLE)는 failed
 */
export function spaceStatusOf(
  item: ImprovementItemDto,
  rateLimited: boolean,
): AiSpaceStatus {
  if (item.proposalStatus === "GENERATED") return "generated"
  if (rateLimited) return "limited"
  return item.integratedSuggestion.text ? "none" : "failed"
}

function toSpaceView(
  item: ImprovementItemDto,
  showLabel: boolean,
  rateLimited: boolean,
): AiSpaceView {
  const status = spaceStatusOf(item, rateLimited)
  const text = item.integratedSuggestion.text
  return {
    key: item.spaceType,
    spaceLabel: item.spaceLabel,
    showLabel,
    status,
    availabilityStatus: item.availability.status,
    operatingHours: formatHours(toDailyHours(item)),
    firstOpen: item.selectedSchedule.intervals[0]?.openTime ?? null,
    gaps: (item.availability.unavailableIntervals ?? []).map((g) => ({
      start: g.startTime,
      end: g.endTime,
    })),
    currentClosingTime: item.currentClosingTime,
    proposedClosingTime: item.proposedClosingTime,
    reason: item.proposalReason,
    alternatives: status === "generated" ? item.alternatives : [],
    integratedText:
      status === "none" ||
      (status === "generated" && item.integratedSuggestion.status !== "UNAVAILABLE")
        ? text
        : null,
    requiresReservation: item.availability.requiresReservation,
    limitations: item.limitations,
  }
}

export function toAiResultView(result: ImprovementResult): AiResultView {
  const { data } = result
  const showLabel = data.items.length > 1
  const spaces = data.items.map((item) =>
    toSpaceView(item, showLabel, isRateLimited(result, item.facility.facilityId)),
  )
  return {
    spaces,
    disclaimer: data.disclaimer,
    isEmpty: spaces.length === 0,
    unknownSpaceCount: data.unknownSpaceCount,
    hasLimited: spaces.some((space) => space.status === "limited"),
    retryAfterSeconds: result.retryAfterSeconds,
    isDemo: result.isDemo,
  }
}

/** 희망 시간(분) 중 운영하지 않는 구간을 뺀, 실제 운영하는 비율(0~100) */
export function coveredPercent(
  startTime: string,
  endTime: string,
  gaps: AiGap[],
): number {
  const total = toMinutes(endTime) - toMinutes(startTime)
  if (total <= 0) return 0
  const gapMinutes = gaps.reduce(
    (sum, gap) => sum + Math.max(0, toMinutes(gap.end) - toMinutes(gap.start)),
    0,
  )
  return Math.round((Math.max(0, total - gapMinutes) / total) * 100)
}

/** 호출 실패를 사용자에게 보여줄 문구로 바꾼다 */
export function aiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "TIMEOUT":
        return "AI 분석이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요."
      case "NETWORK_ERROR":
        return "서버에 연결할 수 없어요. 네트워크를 확인한 뒤 다시 시도해 주세요."
      case "FACILITY_NOT_FOUND":
        return "시설 정보를 찾을 수 없어요."
      case "INVALID_REQUEST":
      case "INVALID_TIME_RANGE":
        return "검색 조건을 확인한 뒤 다시 시도해 주세요."
      case "DATA_UNAVAILABLE":
        return "서비스를 잠시 사용할 수 없어요. 잠시 후 다시 시도해 주세요."
    }
  }
  return "AI 개선안을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
}
