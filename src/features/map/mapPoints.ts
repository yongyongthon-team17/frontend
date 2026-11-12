import type { FacilitySummary } from "../../types/facility"

export interface MapPoint {
  facility: FacilitySummary
  latitude: number
  longitude: number
  /** 목록 순서(1부터). 마커 번호 배지에 쓴다 */
  order: number
}

const isCoord = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value)

/** 좌표가 있는 시설만 마커 대상으로 고른다. 좌표 없는 시설은 목록에만 남는다 */
export function withCoords(facilities: FacilitySummary[]): MapPoint[] {
  const points: MapPoint[] = []
  facilities.forEach((facility, index) => {
    if (isCoord(facility.latitude) && isCoord(facility.longitude)) {
      points.push({
        facility,
        latitude: facility.latitude,
        longitude: facility.longitude,
        order: index + 1,
      })
    }
  })
  return points
}
