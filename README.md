## 지금가용 | 프론트엔드

기술 스택: React · TypeScript · Vite · Kakao Maps SDK

## 주요 기능

| ID | 기능 | 주요 구현 내용 |
|---|---|---|
| F01 | 화면 전환 및 상태 관리 | 해시 기반 라우팅, 화면 간 검색 상태 공유 |
| F02 | 공공시설 검색 | 지역·요일·시간·유형별 검색 및 필터링 |
| F03 | 지도 기반 시설 탐색 | Kakao Maps SDK 연동, 시설 위치 시각화 |
| F04 | 시설 상세 정보 | 운영시간·편의시설·공간별 정보 조회 |
| F05 | 교통 접근성 | 시설 주변 버스 정류장 정보 제공 |
| F06 | AI 운영 개선안 | AI 분석 API 연동 및 개선안 결과 표시 |
| F07 | API 통신 관리 | 공통 API 처리, 데이터 매핑 및 오류 대응 |
| F08 | 검색 상태 유지 | 검색 조건 저장·복원 및 비동기 요청 관리 |
| F09 | 시설 이미지 관리 | 시설별 이미지 매핑 및 대체 이미지 처리 |
| F10 | 개발 환경 구성 | Mock API, 환경 변수 및 Vite 프록시 설정 |

## 프로젝트 구조

```text
src/
├── main.tsx, App.tsx       # 진입점, 화면 전환 및 전역 상태
├── api/                    # API 호출 및 데이터 변환
│   ├── client.ts           # 공통 API 처리 (타임아웃·취소·오류)
│   ├── facilityApi.ts      # A01 검색 선택지, A02 시설 검색
│   ├── facilityDetailApi.ts # A03 시설 상세
│   ├── improvementApi.ts   # A04 AI 운영시간 개선안
│   ├── transportApi.ts     # A05 교통 접근성
│   ├── mappers.ts          # API 응답 데이터 변환 및 이미지 매핑
│   └── mock*.ts            # Mock API
├── features/
│   ├── search/             # 홈·검색 화면 및 검색 상태 관리
│   ├── map/                # 지도 화면 및 Kakao Maps SDK 연동
│   ├── facility-detail/    # 시설 상세 Drawer 및 교통 접근성
│   └── ai/                 # AI 운영 개선안 표시
├── components/             # 공통 UI 및 레이아웃 컴포넌트
├── data/                   # Mock 데이터 및 시설 이미지
├── types/                  # 공통 TypeScript 타입
└── utils/                  # 시간 포맷 및 이미지 예외 처리
```

## 기술 스택

| 구분 | 기술 |
|---|---|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| Map | Kakao Maps SDK |
| API | REST API, Fetch API |
| State Management | React Hooks, sessionStorage |

## 시작하기

### 설치 및 실행

```bash
git clone https://github.com/yongyongthon-team17/frontend.git
cd frontend

pnpm install
cp .env.example .env.local
pnpm dev
```

실행 후 http://localhost:5173 에서 확인할 수 있습니다.

## 환경 변수

`.env.example`을 참고하여 `.env.local` 파일을 생성합니다.

| 변수 | 용도 | 비고 |
|---|---|---|
| VITE_API_BASE_URL | 백엔드 API 주소 | 비워두면 Vite 프록시 사용 |
| VITE_PROXY_TARGET | 프록시 대상 서버 | 로컬 백엔드 연결 가능 |
| VITE_USE_MOCK | Mock API 사용 여부 | true 설정 시 Mock 데이터 사용 |
| VITE_KAKAO_JS_KEY | Kakao Maps JavaScript 키 | 미설정 시 간이 지도 표시 |

환경 변수 변경 후에는 개발 서버를 재시작해야 합니다.

## API 연동 구조

```text
사용자 입력
    ↓
React 컴포넌트
    ↓
Custom Hooks (상태 관리)
    ↓
API 모듈 (*Api.ts)
    ↓
공통 API 클라이언트 (client.ts)
    ↓
Spring Boot Backend
    ↓
응답 데이터 변환 (mappers.ts)
    ↓
화면 렌더링
```

- 모든 API 요청은 공통 클라이언트를 통해 처리합니다.
- API 응답은 화면에서 사용하는 타입으로 변환합니다.
- 요청 취소 및 오류 처리를 공통화하여 안정성을 높였습니다.
- Mock API를 지원하여 백엔드 연결 없이도 화면을 개발할 수 있습니다.
