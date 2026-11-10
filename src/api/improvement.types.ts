/**
 * A04 POST /api/v1/improvement-analyses 응답 data (backend docs/06 A04).
 * 서버 명세를 그대로 옮긴 DTO이며, 화면용 모델은 improvementMappers.ts에서 만든다.
 */

export type SpaceTypeDto = "GENERAL" | "READING" | "DEFAULT"

export interface ImprovementTimeIntervalDto {
  openTime: string
  closeTime: string
}

export interface ImprovementGapDto {
  startTime: string
  endTime: string
}

export interface ImprovementItemDto {
  facility: { facilityId: string; name: string }
  spaceType: SpaceTypeDto
  /** space_name 그대로(종합자료실, 열람실, 시설 전체 등) */
  spaceLabel: string
  selectedSchedule: {
    dayOfWeek: number
    /** OPEN / CLOSED / UNKNOWN 등 */
    state: string
    intervals: ImprovementTimeIntervalDto[]
  }
  availability: {
    status: string
    requiresReservation: boolean
    unavailableIntervals: ImprovementGapDto[]
  }
  currentClosingTime: string | null
  proposedClosingTime: string | null
  proposalStatus: "GENERATED" | "UNAVAILABLE"
  /** 서버가 사실로 만든 고정 문장. 한도 초과면 "AI 호출 한도를 초과했습니다. N초 후 …" */
  proposalReason: string | null
  alternatives: string[]
  integratedSuggestion: {
    status: "COMPLETE" | "PARTIAL" | "UNAVAILABLE"
    text: string | null
  }
  suggestionId: string | null
  cache: { status: string; createdAt: string | null }
  limitations: string[]
}

export interface ImprovementDto {
  candidateCount: number
  facilityCount: number
  unknownSpaceCount: number
  items: ImprovementItemDto[]
  disclaimer: string
}
