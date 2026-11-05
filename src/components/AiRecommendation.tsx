import { CalendarDays, Clock3, Lightbulb, LoaderCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { Facility, SearchFilters } from "../types/facility"
import {
  WEEKDAYS,
  formatDuration,
  formatHours,
  getAvailability,
  toMinutes,
} from "../utils/timeUtils"

interface Props {
  facility: Facility
  filters: SearchFilters
}

export function AiRecommendation({ facility, filters }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "complete">("idle")
  const timer = useRef<number | null>(null)
  const hours = facility.weeklyHours[filters.weekday]
  const availability = getAvailability(
    hours,
    filters.startTime,
    filters.endTime,
  )
  const desiredMinutes =
    toMinutes(filters.endTime) - toMinutes(filters.startTime)
  const currentEnd = hours?.intervals[hours.intervals.length - 1]?.close
  const suggestedEnd =
    availability.kind === "partial" && currentEnd
      ? filters.endTime > currentEnd
        ? filters.endTime
        : currentEnd
      : null

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const analyze = () => {
    setStatus("loading")
    timer.current = window.setTimeout(() => setStatus("complete"), 850)
  }

  return (
    <section className="border-t border-border pt-7">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-primary-light p-2.5 text-forest">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h3 className="section-title">운영시간 개선 제안</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            선택한 시설과 희망 시간을 비교해 검토 가능한 방향을 제안합니다.
          </p>
        </div>
      </div>

      {status === "idle" && (
        <button
          onClick={analyze}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-button-text transition hover:bg-primary-hover active:translate-y-px active:bg-primary-active"
        >
          <Lightbulb className="h-4 w-4" />
          AI 개선안 추천받기
        </button>
      )}

      {status === "loading" && (
        <div className="mt-5 flex h-24 items-center justify-center gap-3 rounded-xl border border-border bg-background-soft text-sm font-bold text-forest">
          <LoaderCircle className="h-5 w-5 animate-spin text-accent-sky" />
          운영시간을 비교하고 있어요
        </div>
      )}

      {status === "complete" && (
        <div className="mt-5 animate-[fade-in_.25s_ease-out]">
          <div className="rounded-2xl border border-border bg-ice-blue p-4">
            <p className="text-sm font-extrabold text-forest">
              운영시간 분석 결과
            </p>
            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 text-xs sm:grid-cols-2">
              <div>
                <p className="text-text-secondary">희망 이용시간</p>
                <p className="mt-1 font-extrabold text-text-primary">
                  {filters.startTime}–{filters.endTime}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">실제 운영시간</p>
                <p className="mt-1 font-extrabold text-text-primary">
                  {formatHours(hours)}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">운영하지 않는 구간</p>
                <p
                  className={`mt-1 font-extrabold ${
                    availability.gapMinutes ? "text-warning" : "text-success"
                  }`}
                >
                  {availability.gapMinutes
                    ? availability.gaps
                        .map((gap) => `${gap.start}–${gap.end}`)
                        .join(", ")
                    : "없음"}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">제안 운영시간</p>
                <p className="mt-1 font-extrabold text-text-primary">
                  {suggestedEnd && hours?.intervals[0]
                    ? `${hours.intervals[0].open}–${suggestedEnd}`
                    : "변경 불필요"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[10px] font-semibold text-text-secondary">
                <span>{filters.startTime}</span>
                <span>{filters.endTime}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-warning-light">
                <div
                  className="h-full rounded-full bg-main-sky"
                  style={{
                    width: `${Math.round((availability.coveredMinutes / desiredMinutes) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[10px] text-text-secondary">
                초록색은 희망 시간 중 실제 운영하는 구간입니다.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-background-soft p-4">
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-active" />
              <p className="text-sm font-extrabold text-forest">
                운영시간 개선 제안
              </p>
            </div>
            {availability.kind === "available" ? (
              <p className="text-sm leading-6 text-text-secondary">
                선택한 시간에는 정상적으로 운영하고 있어요. 현재 선택 조건에서는
                운영시간 연장이 필요하지 않습니다.
              </p>
            ) : availability.kind === "unknown" ? (
              <p className="text-sm leading-6 text-text-secondary">
                운영정보가 충분하지 않아 개선안을 만들지 않았어요. 시설 운영정보
                확인이 먼저 필요합니다.
              </p>
            ) : (
              <p className="text-sm leading-6 text-text-secondary">
                {WEEKDAYS[filters.weekday]}요일 희망 시간 중{" "}
                <strong className="text-warning">
                  {formatDuration(availability.gapMinutes)}
                </strong>
                은 이용할 수 없어요. 공백 구간에 한해 운영 연장 시범 적용을
                검토할 수 있습니다.
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-2 rounded-lg border border-dashed border-border px-3 py-2.5">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-secondary" />
            <p className="text-[11px] leading-relaxed text-text-secondary">
              운영시간 비교 로직으로 생성한 데모 제안입니다. AI API는 연결되어
              있지 않습니다.
            </p>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-text-secondary/70">
            본 개선안은 운영정보를 바탕으로 작성된 참고용 제안이며 실제 시설
            운영정책을 의미하지 않습니다.
          </p>
        </div>
      )}
    </section>
  )
}
