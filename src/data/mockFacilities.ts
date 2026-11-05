import type { DailyHours, Facility } from "../types/facility"

const open = (start: string, end: string): DailyHours => ({
  closed: false,
  intervals: [{ open: start, close: end }],
})
const split = (
  first: [string, string],
  second: [string, string],
): DailyHours => ({
  closed: false,
  intervals: [
    { open: first[0], close: first[1] },
    { open: second[0], close: second[1] },
  ],
})
const closed: DailyHours = { closed: true, intervals: [] }

const libraryPhoto =
  "https://images.unsplash.com/photo-1788377756275-e0e9a5e8531c?auto=format&fit=crop&w=1200&q=82"
const libraryPhoto2 =
  "https://images.unsplash.com/photo-1791698557101-47d6ebe10b71?auto=format&fit=crop&w=1200&q=82"
const sportsPhoto =
  "https://images.unsplash.com/photo-1559369064-c4d65141e408?auto=format&fit=crop&w=1200&q=82"
const sportsPhoto2 =
  "https://images.unsplash.com/photo-1761971976282-b2bb051a5474?auto=format&fit=crop&w=1200&q=82"
const learningPhoto =
  "https://images.unsplash.com/photo-1635625203639-b793c70ba6c9?auto=format&fit=crop&w=1200&q=82"

export const MOCK_FACILITIES: Facility[] = [
  {
    id: "demo-lib-suji-01",
    name: "온마루 공공도서관",
    type: "공공도서관",
    district: "수지구",
    address: "용인시 수지구 가상로 24",
    latitude: 37.3222,
    longitude: 127.0968,
    phone: "031-000-1024",
    imageUrl: libraryPhoto,
    imageAlt: "높은 서가가 있는 현대적인 도서관 내부",
    amenities: ["열람실", "무선인터넷", "유아자료실"],
    updatedAt: "2025. 02. 14.",
    weeklyHours: {
      0: open("10:00", "18:00"),
      1: closed,
      2: open("09:00", "22:00"),
      3: open("09:00", "22:00"),
      4: open("09:00", "22:00"),
      5: open("09:00", "22:00"),
      6: open("10:00", "20:00"),
    },
  },
  {
    id: "demo-lib-giheung-01",
    name: "느티나무 열린도서관",
    type: "공공도서관",
    district: "기흥구",
    address: "용인시 기흥구 가상중앙로 81",
    latitude: 37.275,
    longitude: 127.115,
    imageUrl: libraryPhoto2,
    imageAlt: "곡선형 서가가 있는 넓은 도서관",
    amenities: ["디지털자료실", "주차"],
    updatedAt: "2025. 02. 11.",
    weeklyHours: {
      0: closed,
      1: open("09:00", "20:00"),
      2: open("09:00", "21:00"),
      3: open("09:00", "21:00"),
      4: open("09:00", "21:00"),
      5: open("09:00", "20:00"),
      6: open("09:00", "18:00"),
    },
  },
  {
    id: "demo-learn-suji-01",
    name: "수지 배움뜰",
    type: "평생학습관",
    district: "수지구",
    address: "용인시 수지구 가상샘길 12",
    latitude: 37.31,
    longitude: 127.087,
    imageUrl: learningPhoto,
    imageAlt: "창밖 나무가 보이는 밝은 학습 공간",
    amenities: ["강의실", "엘리베이터"],
    updatedAt: "2025. 02. 08.",
    weeklyHours: {
      0: closed,
      1: open("09:00", "21:30"),
      2: open("09:00", "21:30"),
      3: open("09:00", "21:30"),
      4: open("09:00", "21:30"),
      5: open("09:00", "18:00"),
      6: open("10:00", "17:00"),
    },
  },
  {
    id: "demo-sports-giheung-01",
    name: "기흥 더라인 체육관",
    type: "생활체육시설",
    district: "기흥구",
    address: "용인시 기흥구 가상호수로 53",
    latitude: 37.268,
    longitude: 127.108,
    imageUrl: sportsPhoto,
    imageAlt: "밝은 실내 농구 코트",
    amenities: ["실내체육관", "탈의실", "주차"],
    updatedAt: "2025. 02. 17.",
    weeklyHours: {
      0: open("09:00", "18:00"),
      1: open("06:00", "22:00"),
      2: open("06:00", "22:00"),
      3: open("06:00", "22:00"),
      4: open("06:00", "22:00"),
      5: open("06:00", "22:00"),
      6: open("08:00", "20:00"),
    },
  },
  {
    id: "demo-sports-cheoin-01",
    name: "처인 모두의 스포츠센터",
    type: "생활체육시설",
    district: "처인구",
    address: "용인시 처인구 가상금학로 105",
    latitude: 37.235,
    longitude: 127.202,
    imageUrl: sportsPhoto2,
    imageAlt: "운동기구가 놓인 현대적인 체육시설",
    amenities: ["헬스장", "샤워실"],
    updatedAt: "2025. 02. 12.",
    weeklyHours: {
      0: closed,
      1: split(["06:00", "12:00"], ["14:00", "22:00"]),
      2: split(["06:00", "12:00"], ["14:00", "22:00"]),
      3: split(["06:00", "12:00"], ["14:00", "22:00"]),
      4: split(["06:00", "12:00"], ["14:00", "22:00"]),
      5: open("06:00", "20:00"),
      6: open("08:00", "18:00"),
    },
  },
  {
    id: "demo-learn-cheoin-01",
    name: "처인 시민배움관",
    type: "평생학습관",
    district: "처인구",
    address: "용인시 처인구 가상문예로 37",
    latitude: 37.241,
    longitude: 127.187,
    imageUrl: learningPhoto,
    imageAlt: "자연광이 드는 학습 공간",
    amenities: ["다목적실", "휴게공간"],
    updatedAt: "2025. 02. 06.",
    weeklyHours: {
      0: closed,
      1: open("09:00", "18:00"),
      2: open("09:00", "22:00"),
      3: open("09:00", "18:00"),
      4: open("09:00", "22:00"),
      5: open("09:00", "18:00"),
      6: closed,
    },
  },
]
