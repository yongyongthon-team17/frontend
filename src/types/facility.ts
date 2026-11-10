/** mock 데이터 작성용 유형명. 실제 유형은 A01 facilityTypes(typeId)를 쓴다 */
export type FacilityType = "공공도서관" | "평생학습관" | "생활체육시설"
export type District = "수지구" | "기흥구" | "처인구"
export type AccessType = "OPEN_HOURS" | "RESERVATION" | "ALWAYS_OPEN"

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

/**
 * 시설 상세 타입(상세 Drawer·AI·교통 영역에서 사용).
 * 7일치 운영시간·전화·편의시설·교통은 A03·A05 연동에서 채운다.
 */
export interface Facility {
  id: string
  name: string
  /** 유형명. mock은 FacilityType, API는 A01/A02 typeName */
  type: string
  district: string
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

/** 선택 요일에 희망 시간을 충족하는 공간과 그 운영 구간 */
export interface SpaceHours {
  /** GENERAL / READING / DEFAULT */
  spaceType: string
  /** space_name 그대로(종합자료실, 열람실, 시설 전체 등) */
  spaceLabel: string
  intervals: OperatingInterval[]
}

/** 목록·지도용 시설. A02 Item에서 매핑하며 상세 전용 필드는 두지 않는다 */
export interface FacilitySummary {
  id: string
  name: string
  typeId: number
  typeName: string
  /** 수지구/기흥구/처인구 (API 문자열 그대로) */
  district: string
  address: string
  latitude: number | null
  longitude: number | null
  /** 매퍼가 해석을 마친 이미지 URL */
  imageUrl: string
  /** 받아만 둔다. 예약 필요 배지는 이번 범위 밖 */
  accessType: AccessType
  availableSpaces: SpaceHours[]
}

/** A01 시설 유형 선택지 */
export interface FacilityTypeOption {
  typeId: number
  name: string
}

export interface SearchOptions {
  facilityTypes: FacilityTypeOption[]
}

/** 시설 검색 결과와 함께 전달되는 안내 */
export interface SearchWarning {
  code: string
  message: string
  facilityId: string | null
}

export interface SearchFilters {
  keyword: string
  district: "전체" | District
  /** 0=일 … 6=토 (Date.getDay 기준). API 요일 코드로는 mappers에서만 변환한다 */
  weekday: number
  startTime: string
  endTime: string
  /** null = 전체 */
  facilityTypeId: number | null
}

export type ViewMode = "list" | "map"
export type AvailabilityKind = "available" | "partial" | "closed" | "unknown"

export interface AvailabilityResult {
  kind: AvailabilityKind
  coveredMinutes: number
  gapMinutes: number
  gaps: TimeGap[]
}
