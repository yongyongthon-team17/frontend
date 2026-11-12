import { useEffect, useRef } from "react"
import { ExternalLink, MapPin } from "lucide-react"
import { useKakaoMaps } from "../map/kakaoLoader"

/** 동네(반경 수백 m)가 보이는 확대 수준 */
const MINIMAP_LEVEL = 4

interface Props {
  name: string
  latitude: number | null
  longitude: number | null
}

const BOX_CLASS =
  "relative mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background-soft"

/**
 * 시설 위치 미니맵. SDK는 지도 화면과 같은 loadKakaoMaps() 캐시를 공유하므로
 * 상세 패널을 여러 번 열어도 스크립트는 한 번만 붙는다.
 * 키 없음·로드 실패·좌표 없음이면 자리표시로 대신한다.
 */
export function FacilityMiniMap({ name, latitude, longitude }: Props) {
  const status = useKakaoMaps()
  const hasLocation = latitude !== null && longitude !== null

  return (
    <>
      {hasLocation && status === "ready" ? (
        <KakaoMiniMap name={name} latitude={latitude} longitude={longitude} />
      ) : hasLocation && status === "loading" ? (
        <div className={`${BOX_CLASS} animate-pulse`}>
          <p className="flex items-center gap-2 text-xs font-bold text-text-secondary">
            <MapPin className="h-4 w-4 text-accent-sky" /> 지도를 불러오는 중…
          </p>
        </div>
      ) : (
        <div className={BOX_CLASS}>
          {hasLocation && (
            <span className="absolute left-3 top-3 rounded-md border border-border bg-white px-2 py-1 text-[10px] font-bold text-text-secondary">
              지도를 불러오지 못했어요
            </span>
          )}
          {hasLocation ? (
            <div className="flex max-w-[85%] flex-col items-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-primary">
                <MapPin className="h-5 w-5 text-white" fill="currentColor" />
              </span>
              <p className="mt-2 truncate text-sm font-extrabold text-forest">
                {name}
              </p>
              <p className="mt-1 text-[10px] text-text-secondary">
                위치 좌표 {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            </div>
          ) : (
            <p className="text-xs font-semibold text-text-secondary">
              위치 정보가 제공되지 않습니다.
            </p>
          )}
        </div>
      )}

      {hasLocation && (
        <a
          href={`https://map.kakao.com/link/map/${encodeURIComponent(name)},${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-accent-sky hover:underline"
        >
          카카오맵에서 보기 <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </>
  )
}

interface KakaoProps {
  name: string
  latitude: number
  longitude: number
}

function KakaoMiniMap({ name, latitude, longitude }: KakaoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markerRef = useRef<kakao.maps.Marker | null>(null)
  const centerRef = useRef({ latitude, longitude })
  centerRef.current = { latitude, longitude }

  /** 컨테이너 크기를 다시 재고 시설 좌표로 중심을 맞춘다 */
  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    const { maps } = window.kakao!
    const { latitude: lat, longitude: lng } = centerRef.current
    map.relayout()
    map.setCenter(new maps.LatLng(lat, lng))
  }

  // 지도와 마커는 한 번만 만든다(StrictMode 재실행에도 재사용)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const { maps } = window.kakao!
    if (!mapRef.current) {
      const position = new maps.LatLng(latitude, longitude)
      const map = new maps.Map(container, {
        center: position,
        level: MINIMAP_LEVEL,
        // 패널 스크롤을 방해하지 않도록 조작을 막는다
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        keyboardShortcuts: false,
      })
      mapRef.current = map
      markerRef.current = new maps.Marker({ position, map, title: name })
    }

    // 패널 열림 애니메이션·화면 폭 변화로 크기가 바뀌면 다시 맞춘다
    const observer = new ResizeObserver(recenter)
    observer.observe(container)
    // 상세 패널(drawer-enter)이 transform 애니메이션을 끝낸 뒤 한 번 더 맞춘다
    const dialog = container.closest<HTMLElement>('[role="dialog"]')
    dialog?.addEventListener("animationend", recenter)
    return () => {
      observer.disconnect()
      dialog?.removeEventListener("animationend", recenter)
    }
    // 처음 만들 때만 좌표를 쓰고, 이후 변경은 아래 effect가 처리한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 다른 시설로 바뀌면 마커와 중심을 옮긴다
  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    const { maps } = window.kakao!
    marker.setPosition(new maps.LatLng(latitude, longitude))
    marker.setTitle(name)
    recenter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, name])

  return (
    <div
      className={BOX_CLASS}
      role="img"
      aria-label={`${name} 위치 지도`}
    >
      {/* 지도 위 터치·휠이 패널 스크롤로 넘어가도록 포인터 이벤트를 끈다 */}
      <div ref={containerRef} className="pointer-events-none absolute inset-0" />
    </div>
  )
}
