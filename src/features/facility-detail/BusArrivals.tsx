import { useEffect, useState } from "react"
import { Clock, LoaderCircle, RotateCcw } from "lucide-react"
import { isAbortError } from "../../api/client"
import type { BusArrivalSummary } from "../../api/transport.types"
import { getBusArrivals } from "../../api/transportApi"
import type { Facility } from "../../types/facility"

interface Props {
  facility: Facility
}

/** 요청 상태: 불러오는 중 / 실패 / 성공 */
type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "done"; data: BusArrivalSummary }

/** 도착 예정 문구. 정보가 없으면 '도착 정보 없음' */
function arrivalText(minutesLeft: number | null, stopsLeft: number | null) {
  if (minutesLeft === null) return "도착 정보 없음"
  const time = minutesLeft <= 1 ? "곧 도착" : `${minutesLeft}분 후`
  return stopsLeft !== null ? `${time} · ${stopsLeft}정거장 전` : time
}

function EmptyBox({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted-surface px-4 py-4 text-center">
      <p className="text-xs leading-5 text-text-secondary">{children}</p>
    </div>
  )
}

/** 시설 주변 정류장의 실시간 버스 도착 정보 (A06). 다른 교통 정보와 따로 불러온다. */
export function BusArrivals({ facility }: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" })
  const [reloadCount, setReloadCount] = useState(0)

  // 시설이 바뀌거나 '새로고침'을 누르면 다시 부른다
  useEffect(() => {
    const controller = new AbortController()
    setState({ kind: "loading" })
    getBusArrivals(facility.id, controller.signal)
      .then((data) => setState({ kind: "done", data }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        setState({ kind: "error" })
      })
    return () => controller.abort()
  }, [facility.id, reloadCount])

  const data = state.kind === "done" ? state.data : null

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent-sky" />
          <p className="text-sm font-extrabold text-forest">실시간 도착 정보</p>
        </div>
        {state.kind !== "loading" && data?.status !== "NOT_ENABLED" && (
          <button
            type="button"
            onClick={() => setReloadCount((count) => count + 1)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-text-secondary hover:bg-muted-surface"
          >
            <RotateCcw className="h-3 w-3" /> 새로고침
          </button>
        )}
      </div>

      {state.kind === "loading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted-surface px-4 py-4">
          <LoaderCircle className="h-4 w-4 animate-spin text-accent-sky" />
          <p className="text-xs text-text-secondary">
            도착 정보를 불러오고 있어요
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <EmptyBox>실시간 도착 정보를 불러올 수 없어요.</EmptyBox>
      )}

      {data?.status === "NOT_ENABLED" && (
        <EmptyBox>실시간 도착 정보는 준비 중이에요.</EmptyBox>
      )}

      {data?.status === "UNAVAILABLE" && (
        <EmptyBox>실시간 도착 정보를 불러올 수 없어요.</EmptyBox>
      )}

      {data?.status === "AVAILABLE" &&
        (data.stops.length === 0 ? (
          <EmptyBox>
            {`시설 근처(${data.radiusMeters}m)에 버스 정류장이 없어요.`}
          </EmptyBox>
        ) : (
          <div className="space-y-3">
            {data.stops.map((stop) => (
              <div
                key={stop.stopId}
                className="rounded-xl border border-border bg-muted-surface p-4"
              >
                <p className="text-xs text-text-secondary">
                  <span className="font-bold text-text-primary">
                    {stop.name}
                  </span>{" "}
                  · 약 {stop.distanceMeters}m
                </p>
                {stop.arrivals.length === 0 ? (
                  <p className="mt-3 text-center text-xs leading-5 text-text-secondary">
                    현재 도착 예정인 버스가 없어요.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {stop.arrivals.map((arrival, index) => (
                      <li
                        key={`${arrival.routeName}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                      >
                        <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-extrabold text-forest">
                          {arrival.routeName}
                        </span>
                        <p className="shrink-0 text-xs font-bold text-text-primary">
                          {arrivalText(arrival.minutesLeft, arrival.stopsLeft)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}

      <p className="mt-2 text-[11px] leading-4 text-text-secondary">
        · 지금 운행 중인 버스의 실시간 정보예요. 막차·첫차 시간은 알려주지 않아요.
      </p>
    </div>
  )
}
