# PROJECT_STATUS

## Current Version

- Current version: v1.3.5 Routine Copy & 8h Streak
- Previous baseline: v1.3.4 Navigation, Monthly Report & Fold
- Storage key: `focus_manager_v1`
- Service worker cache: `focusmanager-v1-3-5`

## Current Stable Candidate

`FocusManager_PWA_v1_3_5_routine_copy_8h_streak.zip`

## v1.3.5 Summary

이번 버전은 공부 플래너의 반복 입력 부담을 줄이고, 월별 리포트에서 8시간 이상 공부한 날의 연속성을 확인할 수 있게 만든 소규모 기능 강화 버전입니다.

## Added

- 전날 계획을 선택 날짜로 복사
- 선택 날짜 계획을 사용자가 고른 대상 날짜로 복사
- 복사된 계획은 새 대기 계획으로 생성
- 8시간 이상 공부한 날의 월별 최장 연속 기록
- 8시간 이상 공부한 날의 현재/월말 기준 연속 기록

## Verification

- `app.js` JavaScript syntax check passed
- `sw.js` JavaScript syntax check passed
- `manifest.webmanifest` JSON check passed
- ZIP integrity check passed
- Existing storage key preserved
- GitHub backup token exclusion policy preserved

## Next Candidate Ideas

- 계획 템플릿 저장
- 주간 루틴 일괄 생성
- 계획 순서 직접 변경
- 월별 8시간 달성 캘린더 표시
