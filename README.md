# FocusManager PWA v1.3.7 Date Input Layout Hotfix

v1.3.7은 v1.3.6 Date Nav & Monthly Report Fix를 기준으로 모바일 Safari/iOS PWA에서 날짜 선택 박스가 카드 밖으로 밀리거나 깨져 보이는 문제를 수정한 긴급 UI 핫픽스입니다.

## v1.3.7 수정 기능

- 타임라인 날짜 선택 박스 모바일 레이아웃 보정
- 플래너 날짜 선택 박스 모바일 레이아웃 보정
- iOS Safari `input[type=date]` 기본 렌더링으로 인한 폭/정렬 깨짐 방지
- 날짜 입력 필드에 `min-width: 0`, `max-width: 100%`, `appearance: none` 보강
- 날짜 텍스트 중앙 정렬 유지
- 기존 `전날 / 오늘 / 다음날` 한 줄 버튼 유지
- 월별 리포트 빈 데이터 표시 유지
- 저장 키 `focus_manager_v1` 유지
- service worker cache version `focusmanager-v1-3-7` 적용

## 유지 기능

- 공부 플래너
- 날짜별 계획
- 계획 복사
- 8시간 이상 공부일 수 / 연속 기록
- GitHub 백업
- 앱 강제 업데이트
- 상단 고정 시계 / 세션 경과 표시
- 저장 안정화 보조 슬롯

## 배포 방법

ZIP 압축을 풀고 GitHub 저장소의 기존 파일을 전부 덮어쓴 뒤 커밋합니다.

강제 확인 주소:

```text
?v=1.3.7
```

또는 앱 설정의 **앱 강제 업데이트** 버튼을 사용합니다.
