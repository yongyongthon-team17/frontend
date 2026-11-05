import type { AvailabilityResult, DailyHours, TimeGap } from "../types/facility"

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
export const TIME_STEP_MINUTES = 30

export const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

export const TIME_OPTIONS = Array.from(
  { length: (23 * 60 + 30 - 6 * 60) / TIME_STEP_MINUTES + 1 },
  (_, index) => toTime(6 * 60 + index * TIME_STEP_MINUTES),
)

export function formatHours(hours?: DailyHours) {
  if (!hours) return "운영정보 없음"
  if (hours.closed) return "휴관"
  if (!hours.intervals.length) return "운영정보 없음"
  return hours.intervals.map(({ open, close }) => `${open}–${close}`).join(", ")
}

export function getAvailability(
  hours: DailyHours | undefined,
  startTime: string,
  endTime: string,
): AvailabilityResult {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const total = Math.max(0, end - start)
  if (!hours || (!hours.closed && !hours.intervals.length)) {
    return { kind: "unknown", coveredMinutes: 0, gapMinutes: total, gaps: [] }
  }
  if (hours.closed) {
    return {
      kind: "closed",
      coveredMinutes: 0,
      gapMinutes: total,
      gaps: [{ start: startTime, end: endTime }],
    }
  }

  const ranges = hours.intervals
    .map((interval) => ({
      start: Math.max(start, toMinutes(interval.open)),
      end: Math.min(end, toMinutes(interval.close)),
    }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start)

  let cursor = start
  let covered = 0
  const gaps: TimeGap[] = []
  ranges.forEach((range) => {
    if (range.start > cursor)
      gaps.push({ start: toTime(cursor), end: toTime(range.start) })
    const effectiveStart = Math.max(cursor, range.start)
    if (range.end > effectiveStart) covered += range.end - effectiveStart
    cursor = Math.max(cursor, range.end)
  })
  if (cursor < end) gaps.push({ start: toTime(cursor), end: toTime(end) })

  const gapMinutes = Math.max(0, total - covered)
  return {
    kind: gapMinutes === 0 ? "available" : covered > 0 ? "partial" : "closed",
    coveredMinutes: covered,
    gapMinutes,
    gaps,
  }
}

export const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`
}
