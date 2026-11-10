import { describe, expect, it } from "vitest"
import { ApiError } from "./client"
import type { ImprovementResult } from "./improvementApi"
import {
  aiErrorMessage,
  coveredPercent,
  spaceStatusOf,
  toAiResultView,
} from "./improvementMappers"
import { getMockImprovement, getMockScenario, type MockScenario } from "./mockImprovementApi"
import type { Facility, SearchFilters } from "../types/facility"

const facility: Facility = {
  id: "23",
  name: "예시 공공도서관",
  type: "도서관",
  district: "수지구",
  address: "용인시 수지구",
  latitude: 37.3,
  longitude: 127.1,
  weeklyHours: {},
}

/** 화요일(화면 weekday 2) 19:00–21:00 */
const filters: SearchFilters = {
  keyword: "",
  district: "전체",
  weekday: 2,
  startTime: "19:00",
  endTime: "21:00",
  facilityTypeId: null,
}

const sample = (scenario: MockScenario): Promise<ImprovementResult> =>
  getMockImprovement(facility, filters, { scenario, delayMs: 0 })

describe("toAiResultView 시나리오", () => {
  it("공간이 1개면 공간 이름을 숨기고 운영시간과 제안을 채운다", async () => {
    const view = toAiResultView(await sample("normal"))
    expect(view.isEmpty).toBe(false)
    expect(view.spaces).toHaveLength(1)
    const space = view.spaces[0]
    expect(space.showLabel).toBe(false)
    expect(space.status).toBe("generated")
    expect(space.operatingHours).toBe("09:00–20:00")
    expect(space.gaps).toEqual([{ start: "20:00", end: "21:00" }])
    expect(space.currentClosingTime).toBe("20:00")
    expect(space.proposedClosingTime).toBe("21:00")
    expect(space.alternatives).toHaveLength(2)
    expect(space.integratedText).toContain("정류장 4개")
    expect(view.isDemo).toBe(true)
    expect(view.retryAfterSeconds).toBeNull()
  })

  it("공간이 2개 이상이면 이름을 보여주고 서버 순서를 유지한다", async () => {
    const view = toAiResultView(await sample("spaces"))
    expect(view.spaces.map((s) => s.spaceLabel)).toEqual(["종합자료실", "열람실"])
    expect(view.spaces.every((s) => s.showLabel)).toBe(true)
    expect(view.spaces[0].gaps).not.toEqual(view.spaces[1].gaps)
  })

  it("통합 개선안 PARTIAL도 문장을 그대로 보여준다", async () => {
    const view = toAiResultView(await sample("partial"))
    const space = view.spaces[0]
    expect(space.status).toBe("generated")
    expect(space.integratedText).toContain("연장하는 방안")
    expect(space.integratedText).not.toContain("정류장")
  })

  it("통합 개선안이 UNAVAILABLE이면 문장을 숨긴다", async () => {
    const result = await sample("normal")
    result.data.items[0].integratedSuggestion = { status: "UNAVAILABLE", text: null }
    const space = toAiResultView(result).spaces[0]
    expect(space.integratedText).toBeNull()
    expect(space.alternatives).toHaveLength(2)
  })

  it("후보가 없으면 isEmpty이고 미확인 공간 수를 전달한다", async () => {
    const view = toAiResultView(await sample("empty"))
    expect(view.isEmpty).toBe(true)
    expect(view.spaces).toEqual([])
    expect(view.unknownSpaceCount).toBe(0)

    const result = await sample("empty")
    result.data.unknownSpaceCount = 2
    expect(toAiResultView(result).unknownSpaceCount).toBe(2)
  })

  it("AI 생성 실패는 failed이고 제안 문장을 비운다(운영시간 값은 유지)", async () => {
    const view = toAiResultView(await sample("failed"))
    const space = view.spaces[0]
    expect(space.status).toBe("failed")
    expect(space.alternatives).toEqual([])
    expect(space.integratedText).toBeNull()
    expect(space.operatingHours).toBe("09:00–20:00")
    expect(space.gaps).toHaveLength(1)
    expect(view.hasLimited).toBe(false)
  })

  it("한도 초과는 limited이고 서버 문구와 Retry-After를 전달한다", async () => {
    const view = toAiResultView(await sample("limit"))
    const space = view.spaces[0]
    expect(space.status).toBe("limited")
    expect(space.reason).toContain("호출 한도")
    expect(view.hasLimited).toBe(true)
    expect(view.retryAfterSeconds).toBe(150)
  })

  it("서버 오류 시나리오는 ApiError(DATA_UNAVAILABLE)로 거절한다", async () => {
    await expect(sample("error")).rejects.toMatchObject({
      name: "ApiError",
      code: "DATA_UNAVAILABLE",
    })
  })

  it("휴관·운영정보 없음 문구를 만든다", async () => {
    const closed = await sample("normal")
    closed.data.items[0].selectedSchedule = {
      dayOfWeek: 1,
      state: "CLOSED",
      intervals: [],
    }
    expect(toAiResultView(closed).spaces[0].operatingHours).toBe("휴관")

    const unknown = await sample("normal")
    unknown.data.items[0].selectedSchedule = {
      dayOfWeek: 1,
      state: "UNKNOWN",
      intervals: [],
    }
    expect(toAiResultView(unknown).spaces[0].operatingHours).toBe("운영정보 없음")
  })
})

describe("spaceStatusOf", () => {
  it("GENERATED가 아니면 사유에 '호출 한도'가 있을 때만 limited", async () => {
    const result = await sample("failed")
    const item = result.data.items[0]
    expect(spaceStatusOf(item)).toBe("failed")
    item.proposalReason = "AI 호출 한도를 초과했습니다. 10초 후 다시 시도해 주세요."
    expect(spaceStatusOf(item)).toBe("limited")
    item.proposalReason = null
    expect(spaceStatusOf(item)).toBe("failed")
  })
})

describe("getMockScenario", () => {
  it("쿼리 값을 시나리오로 읽고, 없거나 모르는 값이면 normal", () => {
    expect(getMockScenario("?aiScenario=limit")).toBe("limit")
    expect(getMockScenario("?x=1&aiScenario=spaces")).toBe("spaces")
    expect(getMockScenario("?aiScenario=unknown")).toBe("normal")
    expect(getMockScenario("")).toBe("normal")
  })
})

describe("coveredPercent", () => {
  it("희망 시간 중 운영하는 비율을 계산한다", () => {
    expect(coveredPercent("19:00", "21:00", [{ start: "20:00", end: "21:00" }])).toBe(50)
    expect(coveredPercent("19:00", "21:00", [])).toBe(100)
    expect(coveredPercent("19:00", "21:00", [{ start: "19:00", end: "21:00" }])).toBe(0)
  })

  it("잘못된 구간이면 0", () => {
    expect(coveredPercent("21:00", "19:00", [])).toBe(0)
  })
})

describe("aiErrorMessage", () => {
  const apiError = (code: string) =>
    new ApiError({ status: 0, code, message: "원문" })

  it("오류 코드별로 사용자 문구를 고르고, 모르면 기본 문구", () => {
    expect(aiErrorMessage(apiError("TIMEOUT"))).toContain("오래 걸리고")
    expect(aiErrorMessage(apiError("NETWORK_ERROR"))).toContain("연결할 수 없어요")
    expect(aiErrorMessage(apiError("FACILITY_NOT_FOUND"))).toContain("찾을 수 없어요")
    expect(aiErrorMessage(apiError("DATA_UNAVAILABLE"))).toContain("사용할 수 없어요")
    expect(aiErrorMessage(apiError("SOMETHING_ELSE"))).toContain("불러오지 못했어요")
    expect(aiErrorMessage(new Error("x"))).toContain("불러오지 못했어요")
  })
})
