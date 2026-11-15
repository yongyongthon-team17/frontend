/**
 * A05 교통 접근성 타입.
 * GET /api/v1/facilities/{facilityId}/transport-accessibility
 */

export interface TransportAccessibilityDto {
  facilityId: string
  accessibility: {
    status: string
    radiusMeters: number
    stopCount: number | null
    grade: string | null
    notes?: string[]
  }
}

export interface TransportSummary {
  status: string
  available: boolean
  radiusMeters: number
  stopCount: number | null
  grade: string | null
  notes: string[]
}

/**
 * A06 시설 주변 실시간 버스 도착 정보.
 * GET /api/v1/facilities/{facilityId}/bus-arrivals
 * status: AVAILABLE=조회 성공(정류장 0곳 가능) / UNAVAILABLE=외부 API 실패·키 없음 / NOT_ENABLED=서버 스위치 꺼짐
 */
export interface BusArrivalDto {
  facilityId: string
  status: string
  radiusMeters: number
  stops: {
    stopId: string
    name: string
    distanceMeters: number
    arrivals: {
      routeName: string
      minutesLeft: number | null
      stopsLeft: number | null
    }[]
  }[]
}

export interface BusArrivalSummary {
  status: string
  radiusMeters: number
  stops: BusArrivalDto["stops"]
}
