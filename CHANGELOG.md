# CHANGELOG

## v1.3.7

### Fixed

- 모바일 Safari/iOS PWA에서 타임라인/플래너 날짜 선택 박스가 카드 밖으로 밀려 보이는 문제 수정
- `input[type=date]` 네이티브 컨트롤의 기본 폭/정렬 영향으로 생기는 날짜 박스 깨짐 방지
- 날짜 입력 박스에 `max-width: 100%`, `min-width: 0`, `appearance: none`, 중앙 정렬 스타일 보강

### Kept

- v1.3.6 날짜 이동 버튼 정렬 유지
- 월별 리포트 빈 데이터 표시 유지
- v1.3.5 계획 복사 및 8시간 연속 기록 유지
- GitHub 백업 유지
- 앱 강제 업데이트 유지
- 저장 안정화 유지

### Technical

- app data version: `1.3.7`
- service worker cache version: `focusmanager-v1-3-7`
- localStorage key unchanged: `focus_manager_v1`
