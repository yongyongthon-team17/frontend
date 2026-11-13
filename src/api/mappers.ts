/**
 * API DTO ↔ 화면 타입 변환은 이 파일 한 곳에서만 한다.
 * 특히 요일 코드(화면 0=일, API 0=월) 변환은 toApiDayOfWeek / fromApiDayOfWeek만 쓴다.
 */
import type {
  DailyHours,
  DetailCriteria,
  Facility,
  FacilitySummary,
  SearchFilters,
  SearchOptions,
  SearchWarning,
  SpaceAvailabilityStatus,
  SpaceDetail,
} from "../types/facility"
import { facilityImages } from "../data/facilityImages"
import { getAvailability } from "../utils/timeUtils"
import type { ApiWarning, QueryValue } from "./client"
import type {
  FacilityDetailItemDto,
  FacilityDetailSpaceDto,
} from "./facilityDetail.types"
import type {
  DayScheduleDto,
  FacilitySearchItemDto,
  FacilitySearchOptionsDto,
} from "./facilitySearch.types"

// ── 요일 ─────────────────────────────────────────────

/** 화면 요일(0=일 … 6=토) → API 요일(0=월 … 6=일) */
export function toApiDayOfWeek(weekday: number): number {
  return (weekday + 6) % 7
}

/** API 요일(0=월 … 6=일) → 화면 요일(0=일 … 6=토) */
export function fromApiDayOfWeek(dayOfWeek: number): number {
  return (dayOfWeek + 1) % 7
}

// ── 이미지 ───────────────────────────────────────────

export const DEFAULT_IMAGE_DIR = "/images/default"
/**
 * 기본 이미지 확장자. 지금은 임시 단색 SVG다.
 * 실제 PNG로 바꿀 때는 같은 이름의 파일을 넣고 이 값만 "png"로 바꾼다.
 */
export const DEFAULT_IMAGE_EXT = "svg"

/** A01/A02 typeName → 기본 이미지 파일 이름(확장자 제외) */
export const TYPE_IMAGE_NAMES: Record<string, string> = {
  도서관: "library",
  생활체육시설: "sports",
  주민자치센터: "admin_center",
  보건소: "health",
  평생학습관: "lifelong",
  문화센터: "culture",
}

export const FALLBACK_IMAGE_URL = `${DEFAULT_IMAGE_DIR}/fallback.${DEFAULT_IMAGE_EXT}`

const DEFAULT_IMAGE_PATH = /^\/images\/default\/([A-Za-z0-9_-]+)\.[A-Za-z0-9]+$/

/** 유형별 기본 이미지. 매핑이 없는 유형은 공통 대체 이미지 */
export function getTypeImageUrl(typeName: string): string {
  const name = TYPE_IMAGE_NAMES[typeName]
  return name ? `${DEFAULT_IMAGE_DIR}/${name}.${DEFAULT_IMAGE_EXT}` : FALLBACK_IMAGE_URL
}

/**
 * 시설 이미지 URL을 정한다. 우선순위:
 * 1. 검증된 시설별 실제 사진(src/data/facilityImages.ts, facilityId가 있을 때)
 * 2. 백엔드가 주는 실제 이미지 URL(그대로)
 * 3. 유형별 기본 이미지 — 백엔드의 `/images/default/<이름>.png`는 프론트 public에서 서빙하며
 *    확장자만 DEFAULT_IMAGE_EXT로 맞추고, null이면 typeName으로 고른다
 * 4. 공통 대체 이미지(매핑이 없는 유형)
 */
export function resolveImageUrl(
  imageUrl: string | null,
  typeName: string,
  facilityId?: string,
): string {
  const verified = facilityId ? facilityImages[facilityId] : undefined
  if (verified) return verified
  if (imageUrl) {
    const match = DEFAULT_IMAGE_PATH.exec(imageUrl)
    return match
      ? `${DEFAULT_IMAGE_DIR}/${match[1]}.${DEFAULT_IMAGE_EXT}`
      : imageUrl
  }
  return getTypeImageUrl(typeName)
}

// ── A01 ──────────────────────────────────────────────

export function toSearchOptions(dto: FacilitySearchOptionsDto): SearchOptions {
  return {
    facilityTypes: dto.facilityTypes.map(({ typeId, name }) => ({ typeId, name })),
  }
}

// ── A02 ──────────────────────────────────────────────

/** 화면 검색 조건 → A02 쿼리. 생략 값은 키를 보내지 않는다(07 §3.6) */
export function toFacilitySearchQuery(
  filters: SearchFilters,
): Record<string, QueryValue> {
  const keyword = filters.keyword.trim()
  return {
    keyword: keyword || undefined,
    district: filters.district === "전체" ? undefined : filters.district,
    facilityTypeIds:
      filters.facilityTypeId === null ? undefined : [filters.facilityTypeId],
    dayOfWeek: toApiDayOfWeek(filters.weekday),
    startTime: filters.startTime,
    endTime: filters.endTime,
  }
}

const toNumberOrNull = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return value === null || value === undefined || !Number.isFinite(number)
    ? null
    : number
}

export function toFacilitySummary(item: FacilitySearchItemDto): FacilitySummary {
  return {
    id: item.facilityId,
    name: item.name,
    typeId: item.typeId,
    typeName: item.typeName,
    district: item.district,
    address: item.address,
    latitude: toNumberOrNull(item.coordinates?.latitude),
    longitude: toNumberOrNull(item.coordinates?.longitude),
    imageUrl: resolveImageUrl(item.imageUrl, item.typeName, item.facilityId),
    accessType: item.accessType,
    availableSpaces: item.availableSpaces.map((space) => ({
      spaceType: space.spaceType,
      spaceLabel: space.spaceLabel,
      intervals: space.selectedSchedule.intervals.map(({ openTime, closeTime }) => ({
        open: openTime,
        close: closeTime,
      })),
    })),
  }
}

export function toSearchWarnings(warnings: ApiWarning[]): SearchWarning[] {
  return warnings.map(({ code, message, facilityId }) => ({
    code,
    message,
    facilityId: facilityId ?? null,
  }))
}

// ── A03 ──────────────────────────────────────────────

/**
 * 화면 검색 조건 → A03 쿼리(dayOfWeek·startTime·endTime 모두 필수).
 * 시간은 A02와 같은 HH:mm으로 보낸다. 명세 초안은 HH였지만 실제 서버는 HH:mm만 받는다.
 */
export function toFacilityDetailQuery(
  filters: DetailCriteria,
): Record<string, QueryValue> {
  return {
    dayOfWeek: toApiDayOfWeek(filters.weekday),
    startTime: filters.startTime,
    endTime: filters.endTime,
  }
}

/** A03 facilityId는 10진수 양수 문자열이다 */
export const isValidFacilityId = (facilityId: string) => /^[1-9]\d*$/.test(facilityId)

/** OPEN → 운영 구간, CLOSED → 휴관, UNKNOWN(그 외) → undefined(운영정보 없음, 휴관 아님) */
function toDailyHours(schedule: DayScheduleDto): DailyHours | undefined {
  if (schedule.state === "CLOSED") return { closed: true, intervals: [] }
  if (schedule.state === "OPEN") {
    return {
      closed: false,
      intervals: schedule.intervals.map(({ openTime, closeTime }) => ({
        open: openTime,
        close: closeTime,
      })),
    }
  }
  return undefined
}

function toWeeklyHours(schedules: DayScheduleDto[]): Record<number, DailyHours> {
  const weeklyHours: Record<number, DailyHours> = {}
  for (const schedule of schedules) {
    const hours = toDailyHours(schedule)
    if (hours) weeklyHours[fromApiDayOfWeek(schedule.dayOfWeek)] = hours
  }
  return weeklyHours
}

/** 계약 검토 중이라 모르는 값이 오면 UNKNOWN으로 둔다(이용 불가로 단정하지 않음) */
function toAvailabilityStatus(status: string): SpaceAvailabilityStatus {
  return status === "AVAILABLE" || status === "UNAVAILABLE" ? status : "UNKNOWN"
}

function toSpaceDetail(space: FacilityDetailSpaceDto): SpaceDetail {
  return {
    spaceType: space.spaceType,
    spaceLabel: space.spaceLabel,
    status: toAvailabilityStatus(space.availability.status),
    requiresReservation: space.availability.requiresReservation,
    selectedHours: toDailyHours(space.selectedSchedule),
    unavailableIntervals: (space.availability.unavailableIntervals ?? []).map(
      ({ startTime, endTime }) => ({ start: startTime, end: endTime }),
    ),
    weeklyHours: toWeeklyHours(space.weeklyHours ?? []),
  }
}

/**
 * A03 시설 → 상세 Facility.
 * 운영시간은 공간별(spaces)로만 둔다. 시설 단위 weeklyHours는 공간이 여럿일 수 있어 비워 둔다.
 */
export function toFacilityDetail(dto: FacilityDetailItemDto): Facility {
  return {
    id: dto.facilityId,
    name: dto.name,
    type: dto.typeName,
    district: dto.district,
    address: dto.address,
    latitude: toNumberOrNull(dto.coordinates?.latitude),
    longitude: toNumberOrNull(dto.coordinates?.longitude),
    phone: dto.phone ?? undefined,
    imageUrl: resolveImageUrl(dto.imageUrl, dto.typeName, dto.facilityId),
    amenities: dto.amenities ?? [],
    updatedAt: dto.dataUpdatedAt ?? undefined,
    closedDayNote: dto.closedDayNote ?? undefined,
    weeklyHours: {},
    spaces: dto.spaces.map(toSpaceDetail),
  }
}

// ── mock ─────────────────────────────────────────────

/**
 * mock 상세 데이터 → 목록 타입. id를 그대로 유지해 상세 Drawer가 원본을 다시 찾을 수 있게 한다.
 * mock 데이터는 화면 요일(0=일) 기준이라 요일 변환이 필요 없다.
 */
export function mockFacilityToSummary(
  facility: Facility,
  weekday: number,
  typeId: number,
): FacilitySummary {
  return {
    id: facility.id,
    name: facility.name,
    typeId,
    typeName: facility.type,
    district: facility.district,
    address: facility.address,
    latitude: facility.latitude,
    longitude: facility.longitude,
    imageUrl: facility.imageUrl ?? resolveImageUrl(null, facility.type),
    accessType: "OPEN_HOURS",
    availableSpaces: [
      {
        spaceType: "DEFAULT",
        spaceLabel: "시설 전체",
        intervals: facility.weeklyHours[weekday]?.intervals ?? [],
      },
    ],
  }
}

/**
 * mock 상세 데이터 → A03 형태 상세(단일 DEFAULT 공간).
 * 백엔드 판정이 없으므로 화면 계산(getAvailability)으로 상태를 만든다.
 */
export function mockFacilityToDetail(
  facility: Facility,
  filters: DetailCriteria,
): Facility {
  const selectedHours = facility.weeklyHours[filters.weekday]
  const availability = getAvailability(selectedHours, filters.startTime, filters.endTime)
  const status: SpaceAvailabilityStatus =
    availability.kind === "available"
      ? "AVAILABLE"
      : availability.kind === "unknown"
        ? "UNKNOWN"
        : "UNAVAILABLE"
  return {
    ...facility,
    spaces: [
      {
        spaceType: "DEFAULT",
        spaceLabel: "시설 전체",
        status,
        requiresReservation: false,
        selectedHours,
        unavailableIntervals: status === "UNAVAILABLE" ? availability.gaps : [],
        weeklyHours: facility.weeklyHours,
      },
    ],
  }
}
