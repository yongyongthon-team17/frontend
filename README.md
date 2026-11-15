폴더 구조

src/
├─ main.tsx, App.tsx      # 진입점, 화면 전환과 전역 상태
├─ api/                   # API 호출 (client → *Api → mappers)
│  ├─ client.ts           # fetch 래퍼: 타임아웃·취소·오류 envelope 처리
│  ├─ facilityApi.ts      # A01 검색 선택지, A02 시설 검색
│  ├─ facilityDetailApi.ts# A03 시설 상세
│  ├─ improvementApi.ts   # A04 AI 운영시간 개선안
│  ├─ transportApi.ts     # A05 교통 접근성
│  ├─ mappers.ts          # 서버 DTO → 화면용 타입 변환, 이미지 우선순위
│  └─ mock*.ts            # VITE_USE_MOCK=true일 때 쓰는 가짜 API
├─ features/
│  ├─ search/             # 홈·검색 화면, 검색 상태 훅
│  ├─ map/                # 지도 화면 (카카오맵 / 간이 지도)
│  ├─ facility-detail/    # 시설 상세 Drawer, 교통 접근성
│  └─ ai/                 # AI 개선안 카드
├─ components/            # 레이아웃(Header·Footer·BottomNav), 공통 상태 패널
├─ data/                  # mock 시설, 검증된 시설 사진 목록
├─ types/                 # 화면에서 쓰는 공통 타입
└─ utils/                 # 시간 포맷, 이미지 fallback

1. 화면 전환 (App.tsx)
라우터 라이브러리 없이 URL 해시로 화면을 바꿉니다: #/home, #/search, #/map.
hashchange 이벤트를 받아 screen 상태를 바꾸고, 열려 있던 상세 Drawer를 닫습니다.
검색 상태(useFacilitySearch)는 App에서 한 번만 만들고 세 화면에 props로 내려줍니다. 그래서 화면을 옮겨도 검색 조건과 결과가 유지됩니다.
검색 전에 지도 탭을 누르면 먼저 현재 조건으로 검색한 뒤 #/map으로 이동합니다.

2. 검색 흐름 (A01 · A02)
앱이 시작되면 useSearchOptions가 A01 GET /api/v1/facility-search-options로 시설 유형 목록을 불러옵니다. 실패해도 "전체" 칩만 남고 검색은 계속 됩니다.
사용자가 홈/검색 화면에서 지역·요일·시간·키워드를 입력하면 draft(입력 중인 조건)가 바뀝니다.
검색 버튼 → performSearch() → draft를 applied(적용된 조건)로 확정하고 A02 GET /api/v1/facilities를 호출합니다.
응답은 mappers.ts에서 화면용 FacilitySummary로 바뀌고, 검색이 끝나면 결과 화면(#/search 또는 #/map)으로 이동합니다.
유형 칩은 검색 버튼 없이 바로 다시 검색합니다(setType).
검색 상태 관리 포인트

draft / applied를 나눠서, 입력 중인 값이 결과 화면 조건을 바로 바꾸지 않게 했습니다.
조건은 sessionStorage에 저장되어 새로고침해도 유지되고, 이미 검색했던 상태면 자동으로 다시 검색합니다.
새 검색을 보내면 이전 요청은 AbortController로 취소하고, 요청 순번(requestSeqRef)이 최신이 아닌 응답은 버립니다. 늦게 온 응답이 새 결과를 덮어쓰지 않습니다.
종료 시간이 시작 시간보다 빠르면 검색하지 않습니다.

3. 지도 화면
kakaoLoader.ts가 카카오맵 SDK를 한 번만 동적으로 불러옵니다.
키가 없거나, 등록되지 않은 도메인이거나, 10초 안에 로드되지 않으면 DemoMap(간이 지도)으로 대신 표시합니다.
지도 화면에서 조건을 바꿀 때는 MapFilterModal에서 draft를 수정하고 다시 검색합니다.

4. 시설 상세 (A03 · A04 · A05)
목록이나 지도에서 시설을 누르면 detailBridge.toDetailFacility()가 A02 요약 정보로 초기 상세 객체를 만들고 Drawer를 엽니다. 그래서 상단 정보는 바로 보입니다.
useFacilityDetail이 A03 GET /api/v1/facilities/{id}로 공간별 운영시간·전화번호·편의시설을 불러와 내용을 채웁니다. 시설이나 요일·시간이 바뀌면 이전 요청을 취소하고 다시 요청합니다.
TransportAccessibility가 A05 GET /api/v1/facilities/{id}/transport-accessibility로 주변 정류장 정보를 불러옵니다.
AiRecommendation은 사용자가 버튼을 눌렀을 때만 A04 POST /api/v1/improvement-analyses를 호출합니다(AI 호출 한도 보호).
브라우저별 익명 ID(X-Client-Id, clientId.ts)를 함께 보내고, 타임아웃은 35초입니다.
한도에 걸리면 Retry-After 헤더를 읽어 다시 시도까지 남은 시간을 보여줍니다.

5. API 공통 처리 (api/client.ts)
모든 API는 apiGet / apiPost를 거칩니다.

컴포넌트/훅 → *Api.ts (USE_MOCK이면 mock 반환) → client.ts(fetch) → mappers.ts → 화면 타입
성공 응답 { data, meta }, 오류 응답 { error: { code, message, details } } 형식을 처리합니다.
실패는 모두 ApiError(status · code · requestId)로 통일합니다.
서버 미기동/CORS 거부 → NETWORK_ERROR
시간 초과(기본 15초) → TIMEOUT
형식이 맞지 않는 응답 → INVALID_RESPONSE
호출 측에서 취소한 요청은 AbortError로 그대로 던지고, 화면에는 오류로 표시하지 않습니다.
쿼리에서 null·빈 문자열은 생략하고, 배열은 같은 키를 반복합니다(buildQuery).

6. 시설 이미지
mappers.ts가 아래 순서로 이미지를 고릅니다.

검증된 시설별 실제 사진 (src/data/facilityImages.ts)
시설 유형별 기본 이미지 - 화면에서 이미지 로드에 실패하면 utils/imageFallback.ts가 유형별 기본 이미지 → 공통 대체 이미지 순으로 바꾸고, 모두 실패하면 이미지를 숨깁니다.
시설 사진 목록은 scripts/collect-facility-images.mjs가 만듭니다. 출처·라이선스 기록은 docs/facility-images/sources.json에 있습니다.

pnpm images:collect   # 후보 수집
pnpm images:apply     # 검토 결과를 facilityImages.ts에 반영

7. 환경 변수와 API 연결 방식
.env.example을 .env.local로 복사해서 씁니다. (VITE_* 값은 dev 서버를 다시 시작해야 반영됩니다.)

상황	설정	동작
개발 (기본)	VITE_API_BASE_URL= 비움	/api/...로 호출 → vite 프록시가 배포 백엔드로 전달
로컬 백엔드	VITE_PROXY_TARGET=http://localhost:8080	프록시 대상만 로컬로 변경
프로덕션	VITE_API_BASE_URL=https://api.jigeumgayong.site	백엔드로 직접 호출
백엔드 없이 화면만	VITE_USE_MOCK=true	src/data/mockFacilities.ts 사용
지도	VITE_KAKAO_JS_KEY	비어 있거나 미등록 도메인이면 간이 지도
배포 서버 CORS가 localhost를 허용하지 않아서, 개발 중에는 vite 프록시가 Origin 헤더를 지우고 서버 간 요청으로 보냅니다(vite.config.ts).

