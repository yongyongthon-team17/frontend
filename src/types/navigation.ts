export type AppScreen = "home" | "search" | "map"

/** 검색 실행 후 이동할 수 있는 화면 */
export type SearchDestination = Extract<AppScreen, "search" | "map">
