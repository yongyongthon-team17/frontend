 /**
 * 검증된 시설별 실제 사진 (scripts/collect-facility-images.mjs apply 가 생성한다. 직접 고치지 말 것).
 * 출처·라이선스 전체 기록: docs/facility-images/sources.json
 * 사진이 없는 시설은 여기 없고, 매퍼가 백엔드 이미지 → 유형별 기본 이미지 순으로 대신한다.
 */
export const facilityImages: Record<string, string> = {
  "1": "/images/facilities/1.jpg", // 용인중앙도서관
  "3": "/images/facilities/3.jpg", // 동백도서관
  "5": "/images/facilities/5.jpg", // 창덕도서관
  "9": "/images/facilities/9.jpg", // 기흥도서관
  "10": "/images/facilities/10.jpg", // 구성도서관
  "11": "/images/facilities/11.jpg", // 보라도서관
  "12": "/images/facilities/12.jpg", // 흥덕도서관
  "13": "/images/facilities/13.jpg", // 서농도서관
  "14": "/images/facilities/14.jpg", // 영덕도서관
  "17": "/images/facilities/17.jpg", // 죽전도서관
  "69": "/images/facilities/69.jpg", // 수지구청
  "123": "/images/facilities/123.jpg", // 스카이글빛작은도서관
  "139": "/images/facilities/139.jpg", // 자이안도서관
  "144": "/images/facilities/144.jpg", // 서천아이파크도서관
  "158": "/images/facilities/158.jpg", // 마북e편한세상작은도서관
  "190": "/images/facilities/190.jpg", // 갤러리북카페작은도서관
  "201": "/images/facilities/201.jpg", // 힐스테이트구성작은도서관
  "132": "/images/facilities/132.jpg", // 신동백롯데캐슬에코2단지영어도서관
  "155": "/images/facilities/155.jpg", // 해오름도서관
  "178": "/images/facilities/178.jpg", // 해와달작은도서관
  "2": "/images/facilities/2.jpg", // 포곡도서관
  "4": "/images/facilities/4.jpg", // 모현도서관
  "6": "/images/facilities/6.jpg", // 남사도서관
  "16": "/images/facilities/16.jpg", // 수지도서관
  "18": "/images/facilities/18.jpg", // 상현도서관
  "19": "/images/facilities/19.jpg", // 동천도서관
  "129": "/images/facilities/129.jpg", // 소곤소곤도서관
  "153": "/images/facilities/153.jpg", // 서부교회도서관
}

/** 사진 저작자 표시 문구(CC BY·BY-SA는 표시 의무가 있다) */
export const facilityImageCredits: Record<string, string> = {
  "1": "Bykim2012 / CC0 / Wikimedia Commons",
  "3": "Bykim2012 / CC0 / Wikimedia Commons",
  "5": "Bykim2012 / CC0 / Wikimedia Commons",
  "9": "Bykim2012 / CC0 / Wikimedia Commons",
  "10": "Bykim2012 / CC0 / Wikimedia Commons",
  "11": "Bykim2012 / CC0 / Wikimedia Commons",
  "12": "Bykim2012 / CC0 / Wikimedia Commons",
  "13": "Bykim2012 / CC0 / Wikimedia Commons",
  "14": "Bykim2012 / CC0 / Wikimedia Commons",
  "17": "Bykim2012 / CC0 / Wikimedia Commons",
  "69": "Bykim2012 / CC0 / Wikimedia Commons",
  "123": "Bykim2012 / CC0 / Wikimedia Commons",
  "139": "Bykim2012 / CC0 / Wikimedia Commons",
  "144": "Bykim2012 / CC0 / Wikimedia Commons",
  "158": "Bykim2012 / CC0 / Wikimedia Commons",
  "190": "Bykim2012 / CC0 / Wikimedia Commons",
  "201": "Bykim2012 / CC0 / Wikimedia Commons",
  "132": "출처 입력",
  "155": "출처 입력",
  "178": "출처 입력",
  "2": "출처 확인 필요",
  "4": "출처 확인 필요",
  "6": "출처 확인 필요",
  "16": "출처 확인 필요",
  "18": "출처 확인 필요",
  "19": "출처 확인 필요",
  "129": "출처 확인 필요",
  "153": "출처 확인 필요",
}