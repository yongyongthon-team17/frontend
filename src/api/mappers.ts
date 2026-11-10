/**
 * API DTO ↔ 화면 타입 변환은 이 파일 한 곳에서만 한다.
 * 특히 요일 코드(화면 0=일, API 0=월) 변환은 toApiDayOfWeek / fromApiDayOfWeek만 쓴다.
 */
import type {
  Facility,
  FacilitySummary,
  SearchFilters,
  SearchOptions,
  SearchWarning,
} from "../types/facility"
import type { ApiWarning, QueryValue } from "./client"
import type {
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

/**
 * 시설 이미지 URL을 정한다.
 * - null이면 typeName으로 기본 이미지를 고르고, 매핑이 없으면 공통 대체 이미지
 * - 백엔드가 주는 `/images/default/<이름>.png`는 프론트 public에서 서빙하며 확장자만 DEFAULT_IMAGE_EXT로 맞춘다
 * - 그 외 URL은 그대로
 */
export function resolveImageUrl(imageUrl: string | null, typeName: string): string {
  if (imageUrl) {
    const match = DEFAULT_IMAGE_PATH.exec(imageUrl)
    return match
      ? `${DEFAULT_IMAGE_DIR}/${match[1]}.${DEFAULT_IMAGE_EXT}`
      : imageUrl
  }
  const name = TYPE_IMAGE_NAMES[typeName]
  return name ? `${DEFAULT_IMAGE_DIR}/${name}.${DEFAULT_IMAGE_EXT}` : FALLBACK_IMAGE_URL
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
    imageUrl: resolveImageUrl(item.imageUrl, item.typeName),
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
