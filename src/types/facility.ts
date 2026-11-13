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

/** A03 공간별 이용 가능 여부. 백엔드 availability.status를 그대로 쓴다(최종 판정 기준) */
export type SpaceAvailabilityStatus = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN"

/** A03 공간별 상세(선택 시간 판정 + 7일치 운영시간) */
export interface SpaceDetail {
  /** GENERAL / READING / DEFAULT */
  spaceType: string
  spaceLabel: string
  status: SpaceAvailabilityStatus
  requiresReservation: boolean
  /** 선택 요일 운영 정보. 운영정보를 알 수 없으면(UNKNOWN) undefined — 휴관으로 보지 않는다 */
  selectedHours?: DailyHours
  /** 희망 시간 중 운영하지 않는 구간 */
  unavailableIntervals: TimeGap[]
  /** 화면 요일(0=일) 기준. 운영정보를 알 수 없는 요일은 키가 없다 */
  weeklyHours: Record<number, DailyHours>
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
  /** A03 공간별 운영시간·이용 가능 여부. 상세 응답을 받기 전에는 없다 */
  spaces?: SpaceDetail[]
  /** A03 운영 참고 문구(휴관일 등, 원천 문구 그대로) */
  closedDayNote?: string
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
  /** A02 시설 이용 상태: 공간 중 하나라도 이용 가능하면 AVAILABLE, 아니면 닫힌 공간이 있으면 UNAVAILABLE, 전부 모르면 UNKNOWN */
  availabilityStatus: SpaceAvailabilityStatus
  /** 선택 요일 공간별 운영 구간(이용 불가 공간 포함) */
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

/** A03 상세 조회에 쓰는 검색 조건(요일·시간만) */
export type DetailCriteria = Pick<SearchFilters, "weekday" | "startTime" | "endTime">

export type ViewMode = "list" | "map"
export type AvailabilityKind = "available" | "partial" | "closed" | "unknown"

export interface AvailabilityResult {
  kind: AvailabilityKind
  coveredMinutes: number
  gapMinutes: number
  gaps: TimeGap[]
}
