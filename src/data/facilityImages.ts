/**
 * 검증된 시설별 실제 사진 (scripts/collect-facility-images.mjs apply 가 생성한다. 직접 고치지 말 것).
 * 출처·라이선스 전체 기록: docs/facility-images/sources.json
 * 사진이 없는 시설은 여기 없고, 매퍼가 백엔드 이미지 → 유형별 기본 이미지 순으로 대신한다.
 */
export const facilityImages: Record<string, string> = {
  "1": "/images/facilities/1.jpg", // 용인중앙도서관
  "9": "/images/facilities/9.jpg", // 기흥도서관
  "12": "/images/facilities/12.jpg", // 흥덕도서관
  "17": "/images/facilities/17.jpg", // 죽전도서관
}

/** 사진 저작자 표시 문구(CC BY·BY-SA는 표시 의무가 있다) */
export const facilityImageCredits: Record<string, string> = {
  "1": "Bykim2012 / CC0 / Wikimedia Commons",
  "9": "Bykim2012 / CC0 / Wikimedia Commons",
  "12": "Bykim2012 / CC0 / Wikimedia Commons",
  "17": "Bykim2012 / CC0 / Wikimedia Commons",
}
