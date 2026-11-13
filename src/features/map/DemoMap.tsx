import { MapPin } from "lucide-react"
import { useMemo } from "react"
import { AVAILABILITY_BADGE } from "../../components/common/AvailabilityBadge"
import type { FacilitySummary } from "../../types/facility"
import { withCoords } from "./mapPoints"

// 카카오맵 SDK를 쓸 수 없을 때(키 없음 · 로드 실패 · 미등록 도메인) 보여주는 간이 지도.
// 좌표 비율로 마커를 배치한다.

interface MapBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

/** 용인시 전체 범위(대략). 결과가 0~1건이면 이 범위를 쓴다 */
const YONGIN_BOUNDS: MapBounds = {
  minLat: 37.09,
  maxLat: 37.37,
  minLng: 127.04,
  maxLng: 127.43,
}

/** 결과가 한곳에 몰렸을 때 지나치게 확대되지 않도록 하는 최소 폭(도) */
const MIN_SPAN = 0.02
/** 결과 범위 바깥 여백 비율(각 변) */
const PADDING_RATIO = 0.08

/** 현재 결과 좌표의 최소·최대값에 여백을 둔 지도 범위 */
function computeBounds(
  points: { latitude: number; longitude: number }[],
): MapBounds {
  if (points.length < 2) return YONGIN_BOUNDS

  const lats = points.map((point) => point.latitude)
  const lngs = points.map((point) => point.longitude)
  const expand = (min: number, max: number) => {
    const center = (min + max) / 2
    const span = Math.max(max - min, MIN_SPAN) * (1 + PADDING_RATIO * 2)
    return [center - span / 2, center + span / 2] as const
  }
  const [minLat, maxLat] = expand(Math.min(...lats), Math.max(...lats))
  const [minLng, maxLng] = expand(Math.min(...lngs), Math.max(...lngs))
  return { minLat, maxLat, minLng, maxLng }
}

// 마커가 화면 가장자리·상단 패널에 가리지 않도록 쓰는 화면 영역(%)
const AREA = { left: 15, right: 88, top: 13, bottom: 82 }

const position = (
  point: { latitude: number; longitude: number },
  bounds: MapBounds,
) => {
  const x = (point.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)
  const y = (bounds.maxLat - point.latitude) / (bounds.maxLat - bounds.minLat)
  const clamp = (value: number) => Math.min(1, Math.max(0, value))
  return {
    left: `${AREA.left + clamp(x) * (AREA.right - AREA.left)}%`,
    top: `${AREA.top + clamp(y) * (AREA.bottom - AREA.top)}%`,
  }
}

interface Props {
  facilities: FacilitySummary[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function DemoMap({ facilities, selectedId, onSelect }: Props) {
  const points = useMemo(() => withCoords(facilities), [facilities])
  const bounds = useMemo(() => computeBounds(points), [points])

  return (
    <div className="demo-map absolute inset-0 bg-background-soft">
      <div className="absolute left-5 top-5 z-20 hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-text-secondary lg:flex">
        <MapPin className="h-4 w-4 text-accent-sky" />
        카카오맵을 불러오지 못해 간이 지도로 표시합니다
      </div>
      <div className="absolute inset-0 opacity-80">
        <span className="map-road road-a" />
        <span className="map-road road-b" />
        <span className="map-road road-c" />
        <span className="map-river" />
        <span className="map-park park-a" />
        <span className="map-park park-b" />
        <span className="absolute left-[46%] top-[43%] text-xs font-bold text-text-secondary/70">
          기흥구
        </span>
        <span className="absolute left-[22%] top-[27%] text-xs font-bold text-text-secondary/70">
          수지구
        </span>
        <span className="absolute left-[73%] top-[67%] text-xs font-bold text-text-secondary/70">
          처인구
        </span>
      </div>
      {points.map(({ facility, latitude, longitude, order }) => {
        const selected = selectedId === facility.id
        return (
          <button
            key={facility.id}
            onClick={() => onSelect(facility.id)}
            style={position({ latitude, longitude }, bounds)}
            aria-label={`${facility.name} 마커`}
            className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-all ${
              selected ? "z-20 scale-110" : "hover:scale-105"
            }`}
          >
            {selected && (
              <span className="absolute bottom-[44px] left-1/2 hidden w-max max-w-[190px] -translate-x-1/2 rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white lg:block">
                {facility.name}
              </span>
            )}
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] ${
                selected
                  ? `border-primary ${facility.availabilityStatus === "AVAILABLE" ? "bg-deep-sky" : AVAILABILITY_BADGE[facility.availabilityStatus].markerClassName}`
                  : `border-white ${AVAILABILITY_BADGE[facility.availabilityStatus].markerClassName}`
              }`}
            >
              <MapPin className="h-5 w-5 text-white" fill="currentColor" />
            </span>
            <span className="mt-1 inline-flex min-w-5 justify-center rounded-full border border-border bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-forest">
              {order}
            </span>
          </button>
        )
      })}
    </div>
  )
}
