import { CalendarDays } from "lucide-react"
import { coveredPercent, type AiSpaceView } from "../../api/improvementMappers"
import type { SearchFilters } from "../../types/facility"
import { AiNotice } from "./AiNotice"

interface Props {
  space: AiSpaceView
  filters: SearchFilters
}

/** 공간 하나의 분석 결과: 운영시간 비교 + AI 제안(대안 목록, 통합 개선안) 또는 안내 */
export function SpaceProposalCard({ space, filters }: Props) {
  const hasGap = space.gaps.length > 0
  const proposedHours =
    space.status !== "generated"
      ? "제안을 만들지 못했어요"
      : space.proposedClosingTime && space.firstOpen
        ? `${space.firstOpen}–${space.proposedClosingTime}`
        : "종료 연장 외 대안을 검토해 주세요"

  return (
    <div>
      {space.showLabel && (
        <p className="mb-2 inline-flex rounded-full bg-primary-light px-3 py-1 text-xs font-extrabold text-forest">
          {space.spaceLabel}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-ice-blue p-4">
        <p className="text-sm font-extrabold text-forest">운영시간 분석 결과</p>
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
              {space.operatingHours}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">운영하지 않는 구간</p>
            <p
              className={`mt-1 font-extrabold ${hasGap ? "text-warning" : "text-success"}`}
            >
              {hasGap
                ? space.gaps.map((gap) => `${gap.start}–${gap.end}`).join(", ")
                : "없음"}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">제안 운영시간</p>
            <p className="mt-1 font-extrabold text-text-primary">
              {proposedHours}
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
                width: `${coveredPercent(filters.startTime, filters.endTime, space.gaps)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[10px] text-text-secondary">
            파란색은 희망 시간 중 실제 운영하는 구간입니다.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {space.status === "generated" && (
          <div className="rounded-xl bg-background-soft p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary-active" />
              <p className="text-sm font-extrabold text-forest">
                운영시간 개선 제안
              </p>
            </div>
            {space.alternatives.length > 0 && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
                {space.alternatives.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {space.integratedText && (
              <p
                className={`text-sm leading-6 text-text-secondary ${
                  space.alternatives.length > 0
                    ? "mt-3 border-t border-border pt-3"
                    : ""
                }`}
              >
                {space.integratedText}
              </p>
            )}
          </div>
        )}
        {space.status === "limited" && (
          <AiNotice tone="warning" title="AI 요청이 많아 잠시 기다려야 해요">
            {space.reason}
          </AiNotice>
        )}
        {space.status === "failed" && (
          <AiNotice tone="error" title="AI 제안을 생성하지 못했어요">
            위 운영시간 정보를 참고해 주세요. 잠시 후 다시 시도할 수 있어요.
          </AiNotice>
        )}
      </div>
    </div>
  )
}
