export type FacilityType = "공공도서관" | "평생학습관" | "생활체육시설"
export type District = "수지구" | "기흥구" | "처인구"
export type FacilityTypeFilter = "전체" | FacilityType

export interface OperatingInterval {
  open: string
  close: string
}

export interface TimeGap {
  start: string
  end: string
}

export interface DailyHours {
  closed: boolean
  intervals: OperatingInterval[]
}

export interface TransitStation {
  name: string
  walkingMinutes?: number
  busRoutes?: string[]
}

export interface TransportAccessibility {
  statusLabel?: string
  stations?: TransitStation[]
  externalMapUrl?: string
}

export interface Facility {
  id: string
  name: string
  type: FacilityType
  district: District
  address: string
  latitude: number | null
  longitude: number | null
  phone?: string
  website?: string
  imageUrl?: string
  imageAlt?: string
  amenities?: string[]
  updatedAt?: string
  transport?: TransportAccessibility
  weeklyHours: Record<number, DailyHours>
}

export interface SearchFilters {
  keyword: string
  district: "전체" | District
  weekday: number
  startTime: string
  endTime: string
  facilityType: FacilityTypeFilter
}

export type ViewMode = "list" | "map"
export type AvailabilityKind = "available" | "partial" | "closed" | "unknown"

export interface AvailabilityResult {
  kind: AvailabilityKind
  coveredMinutes: number
  gapMinutes: number
  gaps: TimeGap[]
}
