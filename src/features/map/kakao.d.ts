// 카카오맵 JavaScript SDK 중 이 앱이 쓰는 부분만 선언한다(공식 타입 패키지 없이).
// https://apis.map.kakao.com/web/documentation/

declare namespace kakao.maps {
  function load(callback: () => void): void

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class LatLngBounds {
    constructor()
    extend(latlng: LatLng): void
    contain(latlng: LatLng): boolean
  }

  interface MapOptions {
    center: LatLng
    level?: number
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    getCenter(): LatLng
    setLevel(level: number, options?: { animate?: boolean }): void
    getLevel(): number
    getBounds(): LatLngBounds
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ): void
    panTo(latlng: LatLng): void
    relayout(): void
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: HTMLElement | string
    map?: Map
    clickable?: boolean
    xAnchor?: number
    yAnchor?: number
    zIndex?: number
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    getMap(): Map | null
    setZIndex(zIndex: number): void
    getPosition(): LatLng
  }

  interface MarkerClustererOptions {
    map?: Map
    markers?: CustomOverlay[]
    gridSize?: number
    averageCenter?: boolean
    minLevel?: number
    minClusterSize?: number
    disableClickZoom?: boolean
    calculator?: number[]
    styles?: Partial<CSSStyleDeclaration>[]
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions)
    addMarker(marker: CustomOverlay, nodraw?: boolean): void
    addMarkers(markers: CustomOverlay[], nodraw?: boolean): void
    removeMarker(marker: CustomOverlay, nodraw?: boolean): void
    removeMarkers(markers: CustomOverlay[], nodraw?: boolean): void
    clear(): void
    redraw(): void
  }
}

interface Window {
  kakao?: typeof kakao
}
