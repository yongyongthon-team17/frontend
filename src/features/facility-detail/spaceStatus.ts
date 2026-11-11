import type { AvailabilityKind, SpaceDetail } from "../../types/facility"
import { toMinutes } from "../../utils/timeUtils"

/**
 * 백엔드 availability.status(최종 판정) → 기존 상태 카드 종류.
 * - AVAILABLE → available
 * - UNKNOWN → unknown (휴관으로 보지 않는다)
 * - UNAVAILABLE → 희망 시간 일부라도 운영하면 partial, 아니면 closed (문구만 나눈다)
 */
export function toStatusKind(
  space: SpaceDetail,
  startTime: string,
  endTime: string,
): AvailabilityKind {
  if (space.status === "AVAILABLE") return "available"
  if (space.status === "UNKNOWN") return "unknown"
  if (!space.selectedHours || space.selectedHours.closed) return "closed"
  if (!space.unavailableIntervals.length) return "closed"
  const total = toMinutes(endTime) - toMinutes(startTime)
  const gapMinutes = space.unavailableIntervals.reduce(
    (sum, gap) => sum + Math.max(0, toMinutes(gap.end) - toMinutes(gap.start)),
    0,
  )
  return gapMinutes < total ? "partial" : "closed"
}
