/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 백엔드 기본 주소. 비우면 상대 경로(/api)로 호출(개발 모드는 vite 프록시) */
  readonly VITE_API_BASE_URL?: string
  /** "true"이면 백엔드 대신 mock 데이터를 쓴다 */
  readonly VITE_USE_MOCK?: string
  /** 카카오맵 JavaScript 키. 비어 있거나 로드에 실패하면 간이 지도로 대체 */
  readonly VITE_KAKAO_JS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
