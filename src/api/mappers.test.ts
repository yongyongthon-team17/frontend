import { describe, expect, it } from "vitest"
import type { SearchFilters } from "../types/facility"
import { buildQuery } from "./client"
import type { FacilitySearchItemDto } from "./facilitySearch.types"
import {
  FALLBACK_IMAGE_URL,
  fromApiDayOfWeek,
  resolveImageUrl,
  toApiDayOfWeek,
  toFacilitySearchQuery,
  toFacilitySummary,
} from "./mappers"

describe("요일 변환 (화면 0=일 ↔ API 0=월)", () => {
  // [화면 요일, API 요일]
  const pairs: [number, number][] = [
    [0, 6], // 일
    [1, 0], // 월
    [2, 1], // 화
    [3, 2], // 수
    [4, 3], // 목
    [5, 4], // 금
    [6, 5], // 토
  ]

  it.each(pairs)("화면 %i → API %i", (screen, api) => {
    expect(toApiDayOfWeek(screen)).toBe(api)
  })

  it.each(pairs)("API로 갔다가 돌아오면 원래 값 (화면 %i)", (screen, api) => {
    expect(fromApiDayOfWeek(api)).toBe(screen)
    expect(fromApiDayOfWeek(toApiDayOfWeek(screen))).toBe(screen)
  })
})

describe("이미지 URL", () => {
  it("null이면 typeName으로 기본 이미지를 고른다", () => {
    expect(resolveImageUrl(null, "도서관")).toBe("/images/default/library.svg")
    expect(resolveImageUrl(null, "생활체육시설")).toBe("/images/default/sports.svg")
    expect(resolveImageUrl(null, "주민자치센터")).toBe(
      "/images/default/admin_center.svg",
    )
    expect(resolveImageUrl(null, "보건소")).toBe("/images/default/health.svg")
    expect(resolveImageUrl(null, "평생학습관")).toBe("/images/default/lifelong.svg")
    expect(resolveImageUrl(null, "문화센터")).toBe("/images/default/culture.svg")
  })

  it("매핑이 없는 유형은 공통 대체 이미지", () => {
    expect(resolveImageUrl(null, "새유형")).toBe(FALLBACK_IMAGE_URL)
  })

  it("백엔드 기본 이미지 경로는 이름을 유지하고 확장자만 맞춘다", () => {
    expect(resolveImageUrl("/images/default/library.png", "도서관")).toBe(
      "/images/default/library.svg",
    )
  })

  it("그 외 URL은 그대로", () => {
    expect(resolveImageUrl("https://example.com/a.jpg", "도서관")).toBe(
      "https://example.com/a.jpg",
    )
  })
})

describe("A02 쿼리", () => {
  const base: SearchFilters = {
    keyword: "  ",
    district: "전체",
    weekday: 2, // 화
    startTime: "19:00",
    endTime: "21:00",
    facilityTypeId: null,
  }

  it("전체·빈 값은 키를 생략하고 요일은 API 코드로 보낸다", () => {
    expect(buildQuery(toFacilitySearchQuery(base))).toBe(
      "?dayOfWeek=1&startTime=19%3A00&endTime=21%3A00",
    )
  })

  it("한글은 UTF-8 퍼센트 인코딩, 유형은 facilityTypeIds로 보낸다", () => {
    const query = buildQuery(
      toFacilitySearchQuery({
        ...base,
        keyword: " 도서관 ",
        district: "수지구",
        facilityTypeId: 1,
        weekday: 0, // 일
      }),
    )
    expect(query).toBe(
      "?keyword=%EB%8F%84%EC%84%9C%EA%B4%80&district=%EC%88%98%EC%A7%80%EA%B5%AC&facilityTypeIds=1&dayOfWeek=6&startTime=19%3A00&endTime=21%3A00",
    )
  })

  it("배열은 같은 키를 반복한다", () => {
    expect(buildQuery({ facilityTypeIds: [1, 2] })).toBe(
      "?facilityTypeIds=1&facilityTypeIds=2",
    )
  })
})

describe("A02 Item → FacilitySummary", () => {
  const item: FacilitySearchItemDto = {
    facilityId: "101",
    typeId: 1,
    typeName: "도서관",
    district: "수지구",
    accessType: "OPEN_HOURS",
    name: "예시 공공도서관",
    address: "용인시 수지구 예시 주소",
    imageUrl: "/images/default/library.png",
    coordinates: { latitude: 37.32, longitude: 127.1 },
    distanceMeters: null,
    availableSpaces: [
      {
        spaceType: "READING",
        spaceLabel: "열람실",
        selectedSchedule: {
          dayOfWeek: 1,
          state: "OPEN",
          intervals: [{ openTime: "09:00", closeTime: "22:00" }],
        },
        availability: {
          status: "AVAILABLE",
          basis: "WEEKLY_SCHEDULE",
          requiresReservation: false,
          unavailableIntervals: [],
        },
      },
    ],
  }

  it("명세 예시 응답을 목록 타입으로 바꾼다", () => {
    expect(toFacilitySummary(item)).toEqual({
      id: "101",
      name: "예시 공공도서관",
      typeId: 1,
      typeName: "도서관",
      district: "수지구",
      address: "용인시 수지구 예시 주소",
      latitude: 37.32,
      longitude: 127.1,
      imageUrl: "/images/default/library.svg",
      accessType: "OPEN_HOURS",
      availabilityStatus: "AVAILABLE",
      availableSpaces: [
        {
          spaceType: "READING",
          spaceLabel: "열람실",
          intervals: [{ open: "09:00", close: "22:00" }],
        },
      ],
    })
  })

  it("availabilityStatus를 그대로 옮기고, 이전 서버처럼 필드가 없으면 이용 가능으로 본다", () => {
    expect(
      toFacilitySummary({ ...item, availabilityStatus: "UNAVAILABLE" }).availabilityStatus,
    ).toBe("UNAVAILABLE")
    expect(
      toFacilitySummary({ ...item, availabilityStatus: "UNKNOWN" }).availabilityStatus,
    ).toBe("UNKNOWN")
    expect(toFacilitySummary({ ...item, availabilityStatus: undefined }).availabilityStatus).toBe(
      "AVAILABLE",
    )
  })

  it("이용 불가·확인 필요 시설도 공간별 운영 구간을 그대로 담는다", () => {
    const unavailable = toFacilitySummary({
      ...item,
      availabilityStatus: "UNAVAILABLE",
      availableSpaces: [
        {
          ...item.availableSpaces[0],
          selectedSchedule: {
            dayOfWeek: 1,
            state: "OPEN",
            intervals: [{ openTime: "09:00", closeTime: "18:00" }],
          },
          availability: {
            status: "UNAVAILABLE",
            basis: "WEEKLY_SCHEDULE",
            requiresReservation: false,
            unavailableIntervals: [{ startTime: "19:00", endTime: "21:00" }],
          },
        },
      ],
    })
    expect(unavailable.availableSpaces[0].intervals).toEqual([{ open: "09:00", close: "18:00" }])

    const unknown = toFacilitySummary({
      ...item,
      availabilityStatus: "UNKNOWN",
      availableSpaces: [
        {
          ...item.availableSpaces[0],
          selectedSchedule: { dayOfWeek: 1, state: "UNKNOWN", intervals: [] },
          availability: {
            status: "UNKNOWN",
            basis: "WEEKLY_SCHEDULE",
            requiresReservation: false,
            unavailableIntervals: null,
          },
        },
      ],
    })
    expect(unknown.availableSpaces[0].intervals).toEqual([])
  })

  it("imageUrl이 null이면 typeName으로 기본 이미지", () => {
    expect(
      toFacilitySummary({ ...item, typeName: "보건소", imageUrl: null }).imageUrl,
    ).toBe("/images/default/health.svg")
  })
})
