# FocusManager PWA v1.3.6 Date Nav & Monthly Report Fix

FocusManager PWA는 공부와 업무 집중 세션을 기록하고, 하루를 제대로 썼는지 확인하기 위한 개인용 집중 분석 앱입니다.

v1.3.6은 v1.3.5 Routine Copy & 8h Streak를 기준으로 **타임라인/플래너 날짜 이동 UI**와 **월별 리포트 빈 데이터 표시**를 정리한 모바일 사용성 핫픽스입니다.

## 핵심 흐름

의도 설정 → 집중 세션 실행 → 회고 기록 → 타임라인 정리 → 플래너 계획 비교 → 리포트 분석

## v1.3.6 수정 기능

- 타임라인 날짜 이동 버튼을 `전날 / 오늘 / 다음날` 순서로 한 줄 표시
- 플래너 날짜 이동 버튼을 `전날 / 오늘 / 다음날` 순서로 한 줄 표시
- 모바일에서 날짜 이동 버튼이 2줄로 어긋나던 레이아웃 수정
- 월별 리포트가 데이터가 없는 달에도 숨지지 않고 `기록 없음`과 0값 요약을 표시하도록 보강
- 월 선택값이 비어 있거나 비정상일 때 현재 월로 안전 보정
- service worker cache version `focusmanager-v1-3-6` 적용

## 기존 유지 기능

- 계획 복사
- 전날 계획 가져오기
- 선택 날짜 계획 복사
- 월별 8시간 이상 공부한 날 수
- 월별 8시간 최장 연속 기록
- 현재/월말 기준 8시간 연속 기록
- 대시보드 / 타임라인 / 플래너 / 리포트 접기·펼치기
- 앱 강제 업데이트 버튼
- 상단 고정 현재시간/경과시간/남은시간/종료예정/오늘 목표 남은 시간 표시
- 상단 세션 저장 버튼
- 공부 플래너
- GitHub 백업 / 복원
- JSON 백업 / 복원
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
?v=1.3.6
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
