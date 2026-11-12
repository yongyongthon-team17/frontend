import { Clock3, Lightbulb, LoaderCircle, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { isAbortError } from "../../api/client"
import { getImprovement } from "../../api/improvementApi"
import {
  aiErrorMessage,
  toAiResultView,
  type AiResultView,
} from "../../api/improvementMappers"
import type { Facility, SearchFilters } from "../../types/facility"
import { AiNotice } from "./AiNotice"
import { SpaceProposalCard } from "./SpaceProposalCard"

interface Props {
  facility: Facility
  filters: SearchFilters
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "complete"; view: AiResultView }
  | { kind: "error"; message: string }

/** AI가 오래 걸릴 때 추가 안내를 띄우기까지의 시간(서버는 최대 30초 처리) */
const SLOW_NOTICE_MS = 5000

const RetryButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-bold text-text-secondary transition hover:border-primary hover:text-text-primary"
  >
    <RotateCcw className="h-4 w-4" /> 다시 시도
  </button>
)

export function AiRecommendation({ facility, filters }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" })
  const [slow, setSlow] = useState(false)
  const controller = useRef<AbortController | null>(null)

  // 시설이나 검색 조건이 바뀌면 진행 중인 요청을 취소하고 처음 상태로 돌린다.
  // (이전 조건의 늦은 응답이 새 화면을 덮어쓰지 않게 한다)
  useEffect(() => {
    setState({ kind: "idle" })
    setSlow(false)
    return () => controller.current?.abort()
  }, [
    facility.id,
    filters.keyword,
    filters.district,
    filters.weekday,
    filters.startTime,
    filters.endTime,
    filters.facilityTypeId,
  ])

  const analyze = async () => {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setState({ kind: "loading" })
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_NOTICE_MS)
    try {
      const result = await getImprovement(facility, filters, current.signal)
      if (current.signal.aborted) return
      setState({ kind: "complete", view: toAiResultView(result) })
    } catch (error) {
      if (current.signal.aborted || isAbortError(error)) return
      setState({ kind: "error", message: aiErrorMessage(error) })
    } finally {
      clearTimeout(slowTimer)
    }
  }

  const needsRetry =
    state.kind === "complete" &&
    state.view.spaces.some(
      (space) => space.status === "limited" || space.status === "failed",
    )
  // 공간이 여럿이어도 서버 고정 안내 문장은 한 번만 보여준다
  const limitations =
    state.kind === "complete"
      ? Array.from(new Set(state.view.spaces.flatMap((s) => s.limitations)))
      : []

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

      {state.kind === "idle" && (
        <button
          onClick={analyze}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-button-text transition hover:bg-primary-hover active:translate-y-px active:bg-primary-active"
        >
          <Lightbulb className="h-4 w-4" />
          AI 개선안 추천받기
        </button>
      )}

      {state.kind === "loading" && (
        <div
          role="status"
          className="mt-5 flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background-soft px-4 py-5 text-center"
        >
          <div className="flex items-center gap-3 text-sm font-bold text-forest">
            <LoaderCircle className="h-5 w-5 animate-spin text-accent-sky" />
            AI가 개선안을 만들고 있어요
          </div>
          {slow && (
            <p className="text-xs text-text-secondary">
              조금 더 걸리고 있어요. 최대 30초 정도 걸릴 수 있어요.
            </p>
          )}
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-5">
          <AiNotice tone="error" title="AI 개선안을 불러오지 못했어요">
            {state.message}
          </AiNotice>
          <RetryButton onClick={analyze} />
        </div>
      )}

      {state.kind === "complete" && (
        <div className="mt-5 animate-[fade-in_.25s_ease-out]">
          {state.view.isEmpty ? (
            <div className="rounded-xl bg-background-soft p-4">
              <p className="text-sm font-extrabold text-forest">
                운영시간 개선 제안
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                이 시설은 분석할 공간 정보가 없어요. 시설에 운영시간을 확인해 보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {state.view.spaces.map((space) => (
                <SpaceProposalCard
                  key={space.key}
                  space={space}
                  filters={filters}
                />
              ))}
            </div>
          )}

          {needsRetry && <RetryButton onClick={analyze} />}

          {state.view.isDemo && (
            <div className="mt-4 flex gap-2 rounded-lg border border-dashed border-border px-3 py-2.5">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-secondary" />
              <p className="text-[11px] leading-relaxed text-text-secondary">
                샘플 데이터로 보여드리는 화면입니다. AI API는 아직 연결되어 있지
                않습니다.
              </p>
            </div>
          )}

          {limitations.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-text-secondary">
              {limitations.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-text-secondary/70">
            {state.view.disclaimer}
          </p>
        </div>
      )}
    </section>
  )
}
