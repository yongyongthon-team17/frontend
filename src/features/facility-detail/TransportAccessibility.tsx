import { useEffect, useState } from "react"
import {
  BusFront,
  ExternalLink,
  LoaderCircle,
  MapPin,
  RotateCcw,
} from "lucide-react"
import { isAbortError } from "../../api/client"
import type { TransportSummary } from "../../api/transport.types"
import { getTransportAccessibility } from "../../api/transportApi"
import type { Facility } from "../../types/facility"

interface Props {
  facility: Facility
}

/** A05 요청 상태: 불러오는 중 / 실패 / 성공 */
type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "done"; data: TransportSummary }

export function TransportAccessibility({ facility }: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" })
  const [retryCount, setRetryCount] = useState(0)
  const hasLocation = facility.latitude !== null && facility.longitude !== null

  // 시설이 바뀌거나 '다시 시도'를 누르면 A05를 새로 부른다
  useEffect(() => {
    const controller = new AbortController()
    setState({ kind: "loading" })
    getTransportAccessibility(facility.id, controller.signal)
      .then((data) => setState({ kind: "done", data }))
      .catch((error: unknown) => {
        // 창을 닫아서 취소된 요청은 오류로 표시하지 않는다
        if (isAbortError(error)) return
        setState({ kind: "error" })
      })
    return () => controller.abort()
  }, [facility.id, retryCount])

  const summary = state.kind === "done" ? state.data : null
  const hasStopCount =
    summary !== null && summary.available && summary.stopCount !== null

  const badgeLabel =
    state.kind === "loading"
      ? "확인 중"
      : state.kind === "error"
        ? "불러오기 실패"
        : hasStopCount
          ? "정류장 정보 제공"
          : "정보 준비 중"

  return (
    <section className="border-t border-border pt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="section-title">교통 접근성</h3>
        <div className="flex items-center gap-1.5">
          {summary?.grade && (
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-bold text-forest">
              등급 {summary.grade}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              hasStopCount
                ? "bg-success-light text-success"
                : "bg-muted-surface text-text-secondary"
            }`}
          >
            {badgeLabel}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background-soft">
        <span className="absolute left-3 top-3 rounded-md border border-border bg-white px-2 py-1 text-[10px] font-bold text-text-secondary">
          지도 API 연결 전
        </span>
        {hasLocation ? (
          <div className="flex max-w-[85%] flex-col items-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-primary">
              <MapPin className="h-5 w-5 text-white" fill="currentColor" />
            </span>
            <p className="mt-2 truncate text-sm font-extrabold text-forest">
              {facility.name}
            </p>
            <p className="mt-1 text-[10px] text-text-secondary">
              위치 좌표 {facility.latitude?.toFixed(4)},{" "}
              {facility.longitude?.toFixed(4)}
            </p>
          </div>
        ) : (
          <p className="text-xs font-semibold text-text-secondary">
            위치 정보가 제공되지 않습니다.
          </p>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <BusFront className="h-4 w-4 text-accent-sky" />
          <p className="text-sm font-extrabold text-forest">주변 버스 정류장</p>
        </div>

        {state.kind === "loading" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted-surface px-4 py-4">
            <LoaderCircle className="h-4 w-4 animate-spin text-accent-sky" />
            <p className="text-xs text-text-secondary">
              교통 정보를 불러오고 있어요
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted-surface px-4 py-4 text-center">
            <p className="text-xs text-text-secondary">
              교통 정보를 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-text-primary hover:bg-primary-hover"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 다시 시도
            </button>
          </div>
        )}

        {summary &&
          (hasStopCount ? (
            <div className="rounded-xl border border-border bg-muted-surface p-4">
              <p className="text-sm text-text-secondary">
                반경{" "}
                <span className="font-bold text-text-primary">
                  {summary.radiusMeters}m
                </span>{" "}
                안 버스 정류장
              </p>
              <p className="mt-1 text-2xl font-extrabold text-forest">
                {summary.stopCount}개
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted-surface px-4 py-4 text-center">
              <p className="text-xs leading-5 text-text-secondary">
                교통정보가 제공되지 않습니다.
              </p>
            </div>
          ))}

        {summary && summary.notes.length > 0 && (
          <ul className="mt-2 space-y-1">
            {summary.notes.map((note) => (
              <li
                key={note}
                className="text-[11px] leading-4 text-text-secondary"
              >
                · {note}
              </li>
            ))}
          </ul>
        )}
      </div>

      {facility.transport?.externalMapUrl && (
        <a
          href={facility.transport.externalMapUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-white text-sm font-bold text-forest transition hover:bg-background-soft"
        >
          교통정보 보기 <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </section>
  )
}