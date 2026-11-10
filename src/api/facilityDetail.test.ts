import { afterEach, describe, expect, it, vi } from "vitest"
import type { DetailCriteria, SpaceDetail } from "../types/facility"
import { toStatusKind } from "../features/facility-detail/spaceStatus"
import { ApiError } from "./client"
import type { FacilityDetailItemDto } from "./facilityDetail.types"
import { getFacilityDetail } from "./facilityDetailApi"
import {
  isValidFacilityId,
  toFacilityDetail,
  toFacilityDetailQuery,
} from "./mappers"

/** 개발 서버 실제 응답(시설 1) 형태를 줄인 예시 */
const facilityDto: FacilityDetailItemDto = {
  facilityId: "2",
  typeId: 1,
  typeName: "도서관",
  district: "처인구",
  accessType: "OPEN_HOURS",
  name: "포곡도서관",
  address: "경기도 용인시 처인구 포곡읍 포곡로278번길 8",
  imageUrl: "/images/default/library.png",
  coordinates: { latitude: 37.278904, longitude: 127.232565 },
  phone: "031-6193-1290",
  closedDayNote: "첫째 주 월+셋째 주 월",
  dataUpdatedAt: "2026-09-17",
  amenities: ["열람실"],
  spaces: [
    {
      spaceType: "GENERAL",
      spaceLabel: "종합자료실",
      selectedSchedule: {
        dayOfWeek: 6,
        state: "OPEN",
        intervals: [{ openTime: "07:00", closeTime: "22:00" }],
      },
      availability: {
        status: "UNAVAILABLE",
        basis: "WEEKLY_SCHEDULE",
        requiresReservation: false,
        unavailableIntervals: [{ startTime: "06:00", endTime: "07:00" }],
      },
      weeklyHours: [
        { dayOfWeek: 0, state: "CLOSED", intervals: [] },
        {
          dayOfWeek: 6,
          state: "OPEN",
          intervals: [{ openTime: "07:00", closeTime: "22:00" }],
        },
        { dayOfWeek: 2, state: "UNKNOWN", intervals: [] },
      ],
    },
    {
      spaceType: "READING",
      spaceLabel: "열람실",
      selectedSchedule: { dayOfWeek: 6, state: "UNKNOWN", intervals: [] },
      availability: {
        status: "UNKNOWN",
        basis: "WEEKLY_SCHEDULE",
        requiresReservation: false,
        unavailableIntervals: null,
      },
      weeklyHours: [],
    },
  ],
}

/** 화면 weekday 0 = 일요일 → API dayOfWeek 6 */
const criteria: DetailCriteria = { weekday: 0, startTime: "06:00", endTime: "08:00" }

describe("A03 쿼리·id", () => {
  it("요일은 API 기준으로 바꾸고 시간은 HH:mm 그대로 보낸다", () => {
    expect(toFacilityDetailQuery(criteria)).toEqual({
      dayOfWeek: 6,
      startTime: "06:00",
      endTime: "08:00",
    })
  })

  it.each([
    ["1", true],
    ["123", true],
    ["0", false],
    ["012", false],
    ["-1", false],
    ["1.5", false],
    ["abc", false],
    ["demo-lib-suji-01", false],
    ["", false],
  ])("facilityId %s → %s", (id, expected) => {
    expect(isValidFacilityId(id)).toBe(expected)
  })
})

describe("toFacilityDetail", () => {
  const facility = toFacilityDetail(facilityDto)

  it("시설 정보를 화면 타입으로 옮긴다", () => {
    expect(facility).toMatchObject({
      id: "2",
      name: "포곡도서관",
      type: "도서관",
      phone: "031-6193-1290",
      amenities: ["열람실"],
      updatedAt: "2026-09-17",
      closedDayNote: "첫째 주 월+셋째 주 월",
      imageUrl: "/images/default/library.svg",
      latitude: 37.278904,
    })
  })

  it("백엔드 status를 그대로 쓰고, 이용 불가여도 전체 공간을 유지한다", () => {
    expect(facility.spaces?.map((space) => space.status)).toEqual([
      "UNAVAILABLE",
      "UNKNOWN",
    ])
    expect(facility.spaces?.[0].unavailableIntervals).toEqual([
      { start: "06:00", end: "07:00" },
    ])
    expect(facility.spaces?.[1].unavailableIntervals).toEqual([])
  })

  it("요일별 운영시간: API 요일 → 화면 요일, UNKNOWN은 휴관이 아니라 키 없음", () => {
    const weekly = facility.spaces?.[0].weeklyHours ?? {}
    expect(weekly[1]).toEqual({ closed: true, intervals: [] }) // API 0=월 → 화면 1
    expect(weekly[0]).toEqual({
      closed: false,
      intervals: [{ open: "07:00", close: "22:00" }],
    }) // API 6=일 → 화면 0
    expect(weekly[3]).toBeUndefined() // API 2=수, UNKNOWN
    expect(facility.spaces?.[1].selectedHours).toBeUndefined()
  })

  it("모르는 status 값은 UNKNOWN으로 둔다", () => {
    const dto = structuredClone(facilityDto)
    ;(dto.spaces[0].availability as { status: string }).status = "SOMETHING_NEW"
    expect(toFacilityDetail(dto).spaces?.[0].status).toBe("UNKNOWN")
  })

  it("선택 필드가 null이어도 동작한다", () => {
    const result = toFacilityDetail({
      ...facilityDto,
      phone: null,
      closedDayNote: null,
      dataUpdatedAt: null,
      amenities: null,
      imageUrl: null,
      spaces: [],
    })
    expect(result.phone).toBeUndefined()
    expect(result.amenities).toEqual([])
    expect(result.spaces).toEqual([])
    expect(result.imageUrl).toBe("/images/default/library.svg")
  })
})

describe("toStatusKind (백엔드 status → 상태 카드)", () => {
  const base: SpaceDetail = {
    spaceType: "DEFAULT",
    spaceLabel: "시설 전체",
    status: "AVAILABLE",
    requiresReservation: false,
    selectedHours: { closed: false, intervals: [{ open: "07:00", close: "22:00" }] },
    unavailableIntervals: [],
    weeklyHours: {},
  }

  it("AVAILABLE → available", () => {
    expect(toStatusKind(base, "06:00", "08:00")).toBe("available")
  })

  it("UNKNOWN은 휴관으로 보지 않는다", () => {
    expect(
      toStatusKind({ ...base, status: "UNKNOWN", selectedHours: undefined }, "06:00", "08:00"),
    ).toBe("unknown")
    expect(
      toStatusKind(
        { ...base, status: "UNKNOWN", selectedHours: { closed: true, intervals: [] } },
        "06:00",
        "08:00",
      ),
    ).toBe("unknown")
  })

  it("UNAVAILABLE: 일부 운영이면 partial, 전부 미운영이면 closed", () => {
    const unavailable = { ...base, status: "UNAVAILABLE" as const }
    expect(
      toStatusKind(
        { ...unavailable, unavailableIntervals: [{ start: "06:00", end: "07:00" }] },
        "06:00",
        "08:00",
      ),
    ).toBe("partial")
    expect(
      toStatusKind(
        { ...unavailable, unavailableIntervals: [{ start: "06:00", end: "08:00" }] },
        "06:00",
        "08:00",
      ),
    ).toBe("closed")
    expect(
      toStatusKind(
        { ...unavailable, selectedHours: { closed: true, intervals: [] } },
        "06:00",
        "08:00",
      ),
    ).toBe("closed")
  })

  it("백엔드가 AVAILABLE이면 화면 계산과 달라도 available", () => {
    expect(
      toStatusKind({ ...base, selectedHours: undefined }, "06:00", "08:00"),
    ).toBe("available")
  })
})

describe("getFacilityDetail 요청", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("GET /api/v1/facilities/{id}에 요일·시간 쿼리를 보내고 warnings를 돌려준다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { criteria: { dayOfWeek: 6, startTime: "06:00", endTime: "08:00" }, facility: facilityDto },
          meta: {
            requestId: "req-1",
            generatedAt: "2026-11-11T00:00:00+09:00",
            warnings: [{ code: "WEEKLY_SCHEDULE_ONLY", message: "정규 운영시간 기준입니다.", facilityId: null }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await getFacilityDetail("2", criteria)

    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain("/api/v1/facilities/2?")
    expect(url).toContain("dayOfWeek=6")
    expect(url).toContain("startTime=06%3A00")
    expect(url).toContain("endTime=08%3A00")
    expect(result.facility.id).toBe("2")
    expect(result.warnings).toEqual([
      { code: "WEEKLY_SCHEDULE_ONLY", message: "정규 운영시간 기준입니다.", facilityId: null },
    ])
  })

  it("잘못된 facilityId는 요청하지 않고 INVALID_REQUEST로 실패한다", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await expect(getFacilityDetail("abc", criteria)).rejects.toMatchObject({
      code: "INVALID_REQUEST",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("404 FACILITY_NOT_FOUND를 ApiError로 전달한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: "FACILITY_NOT_FOUND", message: "시설을 찾을 수 없습니다.", details: [], requestId: "req-x" },
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      ),
    )
    const error = await getFacilityDetail("999999", criteria).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: "FACILITY_NOT_FOUND" })
  })
})
