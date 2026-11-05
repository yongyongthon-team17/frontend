## 프론트엔드 협업 규칙

### 1. 브랜치 규칙

`main` 브랜치에 직접 작업하거나 push하지 않습니다.

작업별로 브랜치를 생성하고 Pull Request를 통해 병합합니다.

**브랜치 이름 형식**

- `feat/기능명` — 새로운 기능
- `fix/기능명` — 오류 수정
- `refactor/기능명` — 코드 구조 개선
- `chore/작업명` — 환경 설정 및 기타 작업
- `docs/작업명` — 문서 수정

예시:
- `feat/search-filter`
- `feat/facility-detail`
- `feat/ai-recommendation`
- `fix/search-error`
- `docs/readme`

### 2. 커밋 메시지 규칙

**형식:** `type: 작업 내용`

| Type | 설명 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 코드 개선 |
| `style` | UI 스타일 수정 |
| `docs` | 문서 수정 |
| `chore` | 환경 설정 및 기타 |
| `test` | 테스트 추가 및 수정 |

예시:

```bash
git commit -m "feat: 시설 검색 필터 기능 구현"
git commit -m "fix: 검색 결과 없음 화면 오류 수정"
git commit -m "refactor: 검색 상태 관리 로직 분리"
```

### 3. Pull Request 규칙

1. 작업은 개인 브랜치에서 진행합니다.
2. PR 생성 전 로컬 실행 및 빌드를 확인합니다.
3. PR 제목은 커밋 메시지 규칙과 동일하게 작성합니다.
4. PR 설명에는 작업 내용, 테스트 결과, 변경 화면이 있다면 스크린샷을 첨부합니다.
5. 상대방이 코드를 확인한 뒤 `main`에 병합합니다.
6. 다른 사람이 수정 중인 파일은 사전 협의 없이 변경하지 않습니다.

**PR 템플릿**

```md
## 작업 내용
-

## 변경 파일
-

## 테스트
- [ ] 로컬 실행 확인
- [ ] 빌드 성공
- [ ] 기존 기능 정상 동작

## 참고 사항
-
```

### 4. 작업 시작 및 종료

**작업 시작 전**

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/기능명
```

**작업 완료 후**

```bash
pnpm exec tsc --noEmit
pnpm build
git add .
git commit -m "feat: 작업 내용"
git push -u origin 브랜치명
```

이후 GitHub에서 PR을 생성합니다.

### 5. 개발 시 주의 사항

- 기존 UI 디자인과 반응형 레이아웃을 임의로 변경하지 않습니다.
- 공통 타입이나 API 응답 형식 변경 시 팀원과 먼저 공유합니다.
- 새로운 라이브러리 설치 전 팀원과 협의합니다.
- `.env`, `.env.local`, `node_modules/`, `dist/` 등은 GitHub에 업로드하지 않습니다.
- 기능 개발 시 로딩, 오류, 결과 없음 상태를 함께 고려합니다.
- 충돌이 발생하면 임의로 코드를 삭제하거나 덮어쓰지 않고 팀원과 확인합니다.
