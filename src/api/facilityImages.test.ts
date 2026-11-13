import { describe, expect, it, vi } from "vitest"
import { getImageFallbacks } from "../utils/imageFallback"
import { FALLBACK_IMAGE_URL, getTypeImageUrl, resolveImageUrl } from "./mappers"

vi.mock("../data/facilityImages", () => ({
  facilityImages: { "9001": "/images/facilities/9001.jpg" },
  facilityImageCredits: {},
}))

describe("시설별 실제 사진 우선순위", () => {
  it("1. 검증된 시설 사진이 있으면 백엔드 이미지보다 먼저 쓴다", () => {
    expect(resolveImageUrl("/images/default/library.png", "도서관", "9001")).toBe(
      "/images/facilities/9001.jpg",
    )
    expect(resolveImageUrl("https://example.com/a.jpg", "도서관", "9001")).toBe(
      "/images/facilities/9001.jpg",
    )
  })

  it("2. 사진이 없는 시설은 백엔드 실제 이미지 URL", () => {
    expect(resolveImageUrl("https://example.com/a.jpg", "도서관", "9002")).toBe(
      "https://example.com/a.jpg",
    )
  })

  it("3. 그다음 유형별 기본 이미지, 4. 공통 대체 이미지", () => {
    expect(resolveImageUrl("/images/default/sports.png", "생활체육시설", "9002")).toBe(
      "/images/default/sports.svg",
    )
    expect(resolveImageUrl(null, "보건소", "9002")).toBe("/images/default/health.svg")
    expect(resolveImageUrl(null, "새유형", "9002")).toBe(FALLBACK_IMAGE_URL)
  })

  it("다른 시설의 사진을 빌려 쓰지 않는다", () => {
    expect(resolveImageUrl(null, "도서관", "9002")).toBe(getTypeImageUrl("도서관"))
  })
})

describe("이미지 로드 실패 대체 순서", () => {
  it("유형별 기본 이미지 → 공통 대체 이미지", () => {
    expect(getImageFallbacks("도서관")).toEqual([
      "/images/default/library.svg",
      FALLBACK_IMAGE_URL,
    ])
  })

  it("매핑 없는 유형은 공통 대체 이미지 하나", () => {
    expect(getImageFallbacks("새유형")).toEqual([FALLBACK_IMAGE_URL])
  })
})
