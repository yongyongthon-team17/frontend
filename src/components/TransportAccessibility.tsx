import { BusFront, ExternalLink, MapPin } from "lucide-react"
import type { Facility } from "../types/facility"

interface Props {
  facility: Facility
}

export function TransportAccessibility({ facility }: Props) {
  const stations = facility.transport?.stations ?? []
  const hasTransitData = stations.length > 0
  const hasLocation = facility.latitude !== null && facility.longitude !== null

  return (
    <section className="border-t border-border pt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="section-title">교통 접근성</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            hasTransitData
              ? "bg-success-light text-success"
              : "bg-muted-surface text-text-secondary"
          }`}
        >
          {facility.transport?.statusLabel ??
            (hasTransitData ? "대중교통 정보 제공" : "정보 준비 중")}
        </span>
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
          <p className="text-sm font-extrabold text-forest">인근 정류장</p>
        </div>
        {hasTransitData ? (
          <div className="space-y-2">
            {stations.map((station) => (
              <div
                key={station.name}
                className="rounded-xl border border-border bg-muted-surface p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-text-primary">
                    {station.name}
                  </p>
                  {station.walkingMinutes !== undefined && (
                    <span className="text-xs text-text-secondary">
                      도보 {station.walkingMinutes}분
                    </span>
                  )}
                </div>
                {!!station.busRoutes?.length && (
                  <p className="mt-2 text-xs text-text-secondary">
                    버스 {station.busRoutes.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted-surface px-4 py-4 text-center">
            <p className="text-xs leading-5 text-text-secondary">
              교통정보가 제공되지 않습니다.
            </p>
          </div>
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
