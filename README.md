# FocusManager PWA v1.3.5 Routine Copy & 8h Streak

FocusManager PWA는 공부와 업무 집중 세션을 기록하고, 하루를 제대로 썼는지 확인하기 위한 개인용 집중 분석 앱입니다.

v1.3.5는 v1.3.4 Navigation, Monthly Report & Fold를 기준으로 **반복 공부 루틴 복사**와 **8시간 이상 공부한 날의 연속 기록**을 추가한 버전입니다.

## 핵심 흐름

의도 설정 → 집중 세션 실행 → 회고 기록 → 타임라인 정리 → 플래너 계획 비교 → 리포트 분석

## v1.3.5 추가 기능

- 플래너에 `계획 복사` 카드 추가
- 선택 날짜 기준 `전날 계획 가져오기`
- 선택 날짜의 계획을 대상 날짜로 복사
- 복사 시 완료 기록/연결 세션은 복사하지 않고 새 대기 계획으로 생성
- 대상 날짜에 기존 계획이 있을 경우 추가 여부 확인
- 월별 리포트에 `8시간 최장 연속` 표시
- 월별 리포트에 `현재/월말 8시간 연속` 표시
- 월별 리포트 요약 카드가 6개로 늘어나도 반응형으로 정렬되도록 개선
- service worker cache version `focusmanager-v1-3-5` 적용

## 기존 유지 기능

- 대시보드
- 집중 세션 시작 / 일시정지 / 재개 / 종료
- 25분 / 50분 / 90분 / 자유 세션
- 집중 의도 입력
- 과목 / 카테고리 선택
- 세션 타입 기록
  - 이론
  - 기출
  - 암기
  - 오답
  - 답안작성
  - 복습
  - 기타
- 회독 단계 기록
- 파트 / 범위 기록
- 세션 종료 후 회고 메모
- 집중 / 보통 / 산만 상태 기록
- 오늘 타임라인
- 최근 7일 / 14일 / 30일 리포트
- 월별 리포트
- 8시간 이상 공부한 날 수
- 카테고리별 집중 시간 분석
- 하루 목표 시간 설정
- 주간 목표 시간 설정
- 과목별 일일/주간 목표
- 날짜별 공부 계획
- 계획에서 바로 세션 시작
- 계획 대비 실제 달성률
- 상단 고정 현재시간/경과시간/남은시간/종료예정/오늘 목표 남은 시간 표시
- 상단 세션 저장 버튼
- JSON 백업 / 복원
- GitHub 백업 / 복원
- 세션 종료 후 선택적 GitHub 자동 백업
- 앱 강제 업데이트 버튼
- localStorage + mirror + last_good + IndexedDB 안전 복사본
- PWA manifest / service worker
- iPhone / iPad / PC 반응형 UI
- 다크모드 기반 UI

## 배포 방법

ZIP 압축을 풀고 저장소 루트에 아래 파일들이 위치하도록 업로드합니다.

```text
index.html
styles.css
app.js
manifest.webmanifest
sw.js
icons/
README.md
CHANGELOG.md
PROJECT_STATUS.md
```

GitHub Pages는 `main / root`로 설정합니다.

업데이트 후 캐시가 남아 있으면 설정 화면의 **앱 강제 업데이트** 버튼을 누르거나 아래처럼 접속합니다.

```text
?v=1.3.5
```

## 데이터 기준

저장 키는 계속 유지합니다.

```text
focus_manager_v1
```

GitHub 토큰은 백업 JSON에 포함하지 않고 현재 기기의 localStorage에만 저장합니다.

## 개발 원칙

- 마지막 정상 Stable ZIP 기준으로 작업
- 기존 정상 기능 보존
- 불필요한 리팩토링 금지
- 요청 범위 중심의 최소 수정
- README / CHANGELOG / PROJECT_STATUS 동시 업데이트
- PWA / GitHub Pages 배포 기준 유지
