/**
 * A04 샘플 데이터. 서버 없이 AI 카드의 모든 상태를 눈으로 확인하기 위한 것이다.
 *
 * 시나리오는 URL 쿼리로 고른다. 예) http://localhost:5173/?aiScenario=limit#/search
 *   normal(기본) / spaces(공간 2개) / partial(교통 근거 없음) / empty(개선 대상 없음)
 *   failed(AI 생성 실패) / limit(AI 호출 한도 초과) / slow(12초 지연) / error(서버 오류)
 * 샘플 값은 서버 명세(docs/06 A04)의 응답 모양을 따르며 실제 시설 정보와 무관하다.
 */
import type { Facility, SearchFilters } from "../types/facility"
import { WEEKDAYS, toMinutes, toTime } from "../utils/timeUtils"
import { ApiError } from "./client"
import type { ImprovementDto, ImprovementItemDto, SpaceTypeDto } from "./improvement.types"
import type { ImprovementResult } from "./improvementApi"
import { toApiDayOfWeek } from "./mappers"

export type MockScenario =
  | "normal"
  | "spaces"
  | "partial"
  | "empty"
  | "failed"
  | "limit"
  | "slow"
  | "error"

const SCENARIOS: MockScenario[] = [
  "normal",
  "spaces",
  "partial",
  "empty",
  "failed",
  "limit",
  "slow",
  "error",
]

const DEFAULT_DELAY_MS = 900
const SLOW_DELAY_MS = 12_000
const LIMIT_RETRY_SECONDS = 150

const DISCLAIMER =
  "AI 제안은 참고 의견이며 공식 운영시간이나 확정된 정책이 아닙니다. 실제 이용 전 공식 홈페이지 또는 전화로 확인하세요."

const LIMITATIONS = [
  "주간 정규시간 기준이며 공휴일·주차별 휴관을 판정하지 않습니다.",
  "정류장 개수 외 시간대별 운행자료가 없습니다.",
  "운영 인력·예산·시설 규정을 검토한 확정 정책이 아닙니다.",
]

/** URL 쿼리 ?aiScenario= 값. 없거나 알 수 없으면 normal */
export function getMockScenario(search?: string): MockScenario {
  const text =
    search ?? (typeof window === "undefined" ? "" : window.location.search)
  const value = new URLSearchParams(text).get("aiScenario")
  return SCENARIOS.find((scenario) => scenario === value) ?? "normal"
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (signal?.aborted) return abort()
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort)
      resolve()
    }, ms)
    signal?.addEventListener("abort", abort, { once: true })
  })
}

interface SpaceSample {
  spaceType: SpaceTypeDto
  label: string
  /** 샘플 현재 종료 시각(HH:mm) */
  closing: string
}

function buildItem(
  facility: Facility,
  filters: SearchFilters,
  space: SpaceSample,
  scenario: MockScenario,
): ImprovementItemDto {
  const day = WEEKDAYS[filters.weekday]
  const { startTime, endTime } = filters
  const base: ImprovementItemDto = {
    facility: { facilityId: facility.id, name: facility.name },
    spaceType: space.spaceType,
    spaceLabel: space.label,
    selectedSchedule: {
      dayOfWeek: toApiDayOfWeek(filters.weekday),
      state: "OPEN",
      intervals: [{ openTime: "09:00", closeTime: space.closing }],
    },
    availability: {
      status: "UNAVAILABLE",
      requiresReservation: false,
      unavailableIntervals: [{ startTime: space.closing, endTime }],
    },
    currentClosingTime: space.closing,
    proposedClosingTime: endTime,
    proposalStatus: "GENERATED",
    proposalReason: `${space.label}의 운영 종료(${space.closing})가 희망 이용 시간(${startTime}–${endTime})보다 빠릅니다.`,
    alternatives: [
      `${day}요일 ${space.label} 운영 종료를 ${endTime}까지 연장하는 방안을 검토할 수 있습니다.`,
      `${day}요일 한정 시범 야간 운영 후 이용 현황을 확인하는 방안을 검토할 수 있습니다.`,
    ],
    integratedSuggestion: {
      status: "COMPLETE",
      text: `${space.label}의 ${day}요일 운영 종료를 ${endTime}까지 연장하는 방안을 검토할 수 있습니다. 시설 500m 내 정류장 4개가 있으며, 실제 운행은 별도 확인이 필요합니다.`,
    },
    suggestionId: "demo",
    cache: { status: "CREATED", createdAt: null },
    limitations: LIMITATIONS,
  }

  if (scenario === "partial") {
    base.integratedSuggestion = {
      status: "PARTIAL",
      text: `${space.label}의 ${day}요일 운영 종료를 ${endTime}까지 연장하는 방안을 검토할 수 있습니다.`,
    }
  }
  if (scenario === "failed") {
    return {
      ...base,
      proposedClosingTime: null,
      proposalStatus: "UNAVAILABLE",
      proposalReason: "AI 제안을 생성하지 못했습니다.",
      alternatives: [],
      integratedSuggestion: { status: "UNAVAILABLE", text: null },
      suggestionId: null,
      cache: { status: "UNAVAILABLE", createdAt: null },
    }
  }
  if (scenario === "limit") {
    return {
      ...base,
      proposedClosingTime: null,
      proposalStatus: "UNAVAILABLE",
      proposalReason: `AI 호출 한도를 초과했습니다. ${LIMIT_RETRY_SECONDS}초 후 다시 시도해 주세요.`,
      alternatives: [],
      integratedSuggestion: { status: "UNAVAILABLE", text: null },
      suggestionId: null,
      cache: { status: "UNAVAILABLE", createdAt: null },
    }
  }
  return base
}

/** 희망 시간 안에 운영하지 않는 구간이 생기도록 샘플 종료 시각을 정한다 */
function sampleClosing(filters: SearchFilters, offsetMinutes: number): string {
  const start = toMinutes(filters.startTime)
  const end = toMinutes(filters.endTime)
  return toTime(Math.max(start, end - offsetMinutes))
}

export async function getMockImprovement(
  facility: Facility,
  filters: SearchFilters,
  options: { signal?: AbortSignal; scenario?: MockScenario; delayMs?: number } = {},
): Promise<ImprovementResult> {
  const scenario = options.scenario ?? getMockScenario()
  const delay =
    options.delayMs ?? (scenario === "slow" ? SLOW_DELAY_MS : DEFAULT_DELAY_MS)
  await wait(delay, options.signal)

  if (scenario === "error") {
    throw new ApiError({
      status: 503,
      code: "DATA_UNAVAILABLE",
      message: "샘플: 서비스를 사용할 수 없습니다.",
    })
  }

  const spaces: SpaceSample[] =
    scenario === "empty"
      ? []
      : scenario === "spaces"
        ? [
            { spaceType: "GENERAL", label: "종합자료실", closing: sampleClosing(filters, 60) },
            { spaceType: "READING", label: "열람실", closing: sampleClosing(filters, 30) },
          ]
        : [{ spaceType: "DEFAULT", label: "시설 전체", closing: sampleClosing(filters, 60) }]

  const items = spaces.map((space) => buildItem(facility, filters, space, scenario))
  const limited = scenario === "limit"
  const data: ImprovementDto = {
    candidateCount: items.length,
    facilityCount: items.length ? 1 : 0,
    unknownSpaceCount: 0,
    items,
    disclaimer: DISCLAIMER,
  }
  return {
    data,
    warnings: [
      {
        code: "WEEKLY_SCHEDULE_ONLY",
        message: "정규 운영시간 기준입니다. 공휴일·임시휴관과 예약 여부는 별도 확인하세요.",
        facilityId: null,
      },
      ...(limited
        ? [
            {
              code: "RATE_LIMITED",
              message: "AI 호출 한도를 초과했습니다.",
              facilityId: facility.id,
            },
          ]
        : []),
    ],
    retryAfterSeconds: limited ? LIMIT_RETRY_SECONDS : null,
    requestId: null,
    isDemo: true,
  }
}
