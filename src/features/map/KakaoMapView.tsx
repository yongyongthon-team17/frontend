import { useEffect, useRef } from "react"
import { AVAILABILITY_BADGE } from "../../components/common/AvailabilityBadge"
import type { FacilitySummary } from "../../types/facility"
import { withCoords, type MapPoint } from "./mapPoints"

/** 용인시청. 마커가 0~1개일 때 중심 */
const YONGIN_CENTER = { lat: 37.2411, lng: 127.1776 }
/** 용인시 전체가 들어오는 확대 수준 */
const YONGIN_LEVEL = 9
/** 이 수준 이하로 확대하면 클러스터를 풀고 개별 마커만 보인다 */
const CLUSTER_MIN_LEVEL = 6

/**
 * setBounds 여백(px). 모바일 지도는 하단 시트 위에서 끝나므로(MAP_CONTAINER_CLASS)
 * 상단 조건 카드만큼만 크게 둔다
 */
const DESKTOP_PADDING = { top: 70, right: 60, bottom: 50, left: 60 }
const MOBILE_PADDING = { top: 230, right: 40, bottom: 40, left: 40 }
const DESKTOP_QUERY = "(min-width: 1024px)"

/**
 * 카카오 로고·축척(지도 왼쪽 아래)은 이용 조건상 가리면 안 된다.
 * 모바일(lg 미만)은 하단 시트(bottom-20, 접힘 높이 92px)와 내비가 지도 아래쪽을 덮으므로
 * 지도 영역을 접힌 시트 위(80 + 92 + 여백 = 180px)에서 끝낸다
 */
const MAP_CONTAINER_CLASS =
  "absolute inset-x-0 top-0 bottom-[180px] isolate z-0 lg:bottom-0"

const CLUSTER_STYLE = {
  borderRadius: "999px",
  border: "3px solid #fff",
  color: "#fff",
  textAlign: "center",
  fontWeight: "800",
  fontSize: "13px",
  boxShadow: "0 2px 6px rgba(36, 70, 93, 0.25)",
}
const CLUSTER_STYLES = [
  { ...CLUSTER_STYLE, width: "40px", height: "40px", lineHeight: "34px", background: "rgba(146, 201, 236, 0.95)" },
  { ...CLUSTER_STYLE, width: "48px", height: "48px", lineHeight: "42px", background: "rgba(105, 172, 216, 0.95)" },
  { ...CLUSTER_STYLE, width: "56px", height: "56px", lineHeight: "50px", background: "rgba(36, 70, 93, 0.92)" },
]

// lucide MapPin과 같은 모양(오버레이는 React 밖 DOM이라 SVG를 직접 쓴다)
const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

/** 이용 가능은 기존 하늘색(선택 시 진한 색), 이용 불가·확인 필요는 상태 색을 유지한다 */
function markerFill(status: FacilitySummary["availabilityStatus"], selected: boolean) {
  if (status === "AVAILABLE") return selected ? "bg-deep-sky" : AVAILABILITY_BADGE.AVAILABLE.markerClassName
  return AVAILABILITY_BADGE[status].markerClassName
}

/** 마커 DOM 내용을 그린다. 선택 상태가 바뀔 때 해당 마커만 다시 그린다 */
function paintMarker(element: HTMLButtonElement, point: MapPoint, selected: boolean) {
  const { facility, order } = point
  element.className = `relative flex flex-col items-center transition-transform ${
    selected ? "scale-110" : "hover:scale-105"
  }`
  element.setAttribute("aria-pressed", String(selected))
  element.innerHTML = `
    ${
      selected
        ? `<span class="absolute bottom-[64px] left-1/2 hidden w-max max-w-[190px] -translate-x-1/2 truncate rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white lg:block">${escapeHtml(facility.name)}</span>`
        : ""
    }
    <span class="flex h-10 w-10 items-center justify-center rounded-full border-[3px] text-white shadow-md ${
      selected ? `border-primary ${markerFill(facility.availabilityStatus, true)}` : `border-white ${markerFill(facility.availabilityStatus, false)}`
    }">${PIN_SVG}</span>
    <span class="mt-1 inline-flex min-w-5 justify-center rounded-full border border-border bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-forest">${order}</span>`
}

interface MarkerEntry {
  point: MapPoint
  element: HTMLButtonElement
  overlay: kakao.maps.CustomOverlay
}

interface Props {
  facilities: FacilitySummary[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function KakaoMapView({ facilities, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null)
  const markersRef = useRef(new Map<string, MarkerEntry>())
  /** 클러스터에서 빼서 지도에 직접 올려 둔 마커(선택된 마커) */
  const pinnedIdRef = useRef<string | null>(null)
  const onSelectRef = useRef(onSelect)
  const selectedIdRef = useRef(selectedId)
  onSelectRef.current = onSelect
  selectedIdRef.current = selectedId

  /** 선택된 마커는 클러스터 밖에서 항상 보이게, 나머지는 클러스터에 둔다 */
  const syncSelection = (nextId: string | undefined, pan: boolean) => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer) return
    const markers = markersRef.current
    const prevId = pinnedIdRef.current
    const next = nextId ? markers.get(nextId) : undefined

    if (prevId && prevId !== nextId) {
      const prev = markers.get(prevId)
      if (prev) {
        prev.overlay.setMap(null)
        prev.overlay.setZIndex(1)
        paintMarker(prev.element, prev.point, false)
        clusterer.addMarker(prev.overlay)
      }
      pinnedIdRef.current = null
    }

    if (next && pinnedIdRef.current !== nextId) {
      clusterer.removeMarker(next.overlay)
      next.overlay.setZIndex(10)
      next.overlay.setMap(map)
      paintMarker(next.element, next.point, true)
      pinnedIdRef.current = nextId!
    }

    if (next && pan) {
      const position = next.overlay.getPosition()
      if (!map.getBounds().contain(position)) map.panTo(position)
    }
  }

  // 지도와 클러스터러는 한 번만 만든다(StrictMode 재실행에도 재사용)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (!mapRef.current) {
      const { maps } = window.kakao!
      const map = new maps.Map(container, {
        center: new maps.LatLng(YONGIN_CENTER.lat, YONGIN_CENTER.lng),
        level: YONGIN_LEVEL,
      })
      mapRef.current = map
      clustererRef.current = new maps.MarkerClusterer({
        map,
        averageCenter: true,
        gridSize: 60,
        minLevel: CLUSTER_MIN_LEVEL,
        calculator: [10, 50],
        styles: CLUSTER_STYLES as Partial<CSSStyleDeclaration>[],
      })
    }
    // 목록 패널·화면 폭 변화 등 컨테이너 크기가 바뀌면 타일을 다시 맞춘다
    const observer = new ResizeObserver(() => mapRef.current?.relayout())
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // 결과가 바뀌면 마커를 새로 만들고 모든 마커가 보이게 범위를 맞춘다
  useEffect(() => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer) return
    const { maps } = window.kakao!
    const markers = markersRef.current
    const points = withCoords(facilities)

    for (const point of points) {
      const element = document.createElement("button")
      element.type = "button"
      element.setAttribute("aria-label", `${point.facility.name} 마커`)
      element.addEventListener("click", (event) => {
        event.stopPropagation()
        onSelectRef.current(point.facility.id)
      })
      paintMarker(element, point, false)
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(point.latitude, point.longitude),
        content: element,
        clickable: true,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 1,
      })
      markers.set(point.facility.id, { point, element, overlay })
    }
    clusterer.addMarkers([...markers.values()].map((entry) => entry.overlay))
    syncSelection(selectedIdRef.current, false)

    map.relayout()
    if (points.length >= 2) {
      const bounds = new maps.LatLngBounds()
      for (const entry of markers.values()) bounds.extend(entry.overlay.getPosition())
      const padding = window.matchMedia(DESKTOP_QUERY).matches
        ? DESKTOP_PADDING
        : MOBILE_PADDING
      map.setBounds(bounds, padding.top, padding.right, padding.bottom, padding.left)
    } else {
      map.setLevel(YONGIN_LEVEL)
      map.setCenter(new maps.LatLng(YONGIN_CENTER.lat, YONGIN_CENTER.lng))
    }

    return () => {
      clusterer.clear()
      for (const entry of markers.values()) entry.overlay.setMap(null)
      markers.clear()
      pinnedIdRef.current = null
    }
    // syncSelection은 ref만 읽으므로 의존성에서 뺀다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilities])

  // 목록에서 고른 시설을 마커에 반영한다
  useEffect(() => {
    syncSelection(selectedId, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return <div ref={containerRef} className={MAP_CONTAINER_CLASS} />
}
