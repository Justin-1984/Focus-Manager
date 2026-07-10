# CHANGELOG

## v1.3.5

### Added

- 플래너 `계획 복사` 카드 추가
- `전날 계획 가져오기` 버튼 추가
- 선택 날짜의 계획을 대상 날짜로 복사하는 기능 추가
- 계획 복사 시 완료 기록, linkedSessionId, completedAt을 제거하고 새 대기 계획으로 생성
- 대상 날짜에 기존 계획이 있을 때 추가 확인 처리
- 월별 리포트에 `8시간 최장 연속` 카드 추가
- 월별 리포트에 `현재/월말 연속` 카드 추가

### Improved

- 월별 리포트 카드가 6개로 늘어나도 모바일/PC에서 자동 정렬되도록 compact summary grid 개선
- 반복 루틴을 매일 다시 입력하지 않고 복사해서 쓸 수 있도록 플래너 사용성 개선

### Kept

- v1.3.4 날짜 이동 버튼 유지
- v1.3.4 월별 8시간 이상 공부한 날 수 유지
- v1.3.4 접기/펼치기 UI 유지
- v1.3.3 앱 강제 업데이트 버튼 유지
- v1.3.2 상단 경과시간 표시 유지
- v1.3.1 저장 안정화 유지
- GitHub 백업/복원 유지
- 저장 키 `focus_manager_v1` 유지

### Changed

- service worker cache version: `focusmanager-v1-3-5`
- app data version: `1.3.5`
