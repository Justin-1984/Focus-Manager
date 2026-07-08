# FocusManager Project Status

## Current baseline

- Current version: v1.3.0
- Baseline type: Study Planner Foundation on v1.2.2 Sticky Clock
- Storage: localStorage first
- Storage key: `focus_manager_v1` unchanged
- Backup: JSON export/import + GitHub manual backup/restore + optional session-end auto backup
- Deployment target: GitHub Pages PWA
- Supported screens: iPhone, iPad, PC browser

## Verified in this package

- Required core files included
  - index.html
  - styles.css
  - app.js
  - manifest.webmanifest
  - sw.js
  - icons
  - README.md
  - CHANGELOG.md
  - PROJECT_STATUS.md
- JavaScript syntax check passed with `node --check app.js`.
- Service worker syntax check passed with `node --check sw.js`.
- Manifest JSON structure validated.
- DOM id references used by app.js were cross-checked against index.html.
- Basic mocked runtime smoke test passed.
- Existing storage key was preserved.

## v1.3.0 additions

- Added Planner navigation item
- Added internal study planner screen
- Added daily total goal setting
- Added weekly goal setting
- Added category-level daily and weekly goals
- Added date-based study plan creation
- Added planned session list by selected date
- Added direct session start from a planned item
- Added “load plan into session form” action
- Added planned session completion linkage to actual session record
- Added plan deletion
- Added dashboard “오늘 계획” card
- Added dashboard “목표 달성률” card
- Added plan-vs-actual achievement display
- Added `plans` to backup payload
- Added `weeklyTargetHours` and `categoryGoals` to settings
- Updated service worker cache to `focusmanager-v1-3-0`

## Retained from v1.2.x

- Fixed top current-time badge
- GitHub backup settings
- GitHub manual backup
- GitHub restore
- Optional session-end automatic GitHub backup
- GitHub token exclusion from backup payload
- JSON backup/restore
- Mobile modal hidden-state hotfix
- Session edit modal

## Retained from v1.1.x

- 손해사정사 과목 카테고리
- Session type field
  - 이론 / 기출 / 암기 / 오답 / 답안작성 / 복습 / 기타
- Round field
  - 미지정 / 1회독 / 2회독 / 3회독 / 4회독 / 5회독+ / 최종정리
- Part/range field
- Edit modal support for session type, round, and part/range
- Study type report
- Round status report
- Study metadata badges in recent records and mini timeline

## Data shape

Core data remains FocusManager-only.

```text
settings
categories
sessions
plans
activeSession
```

`plans` are internal FocusManager study plans. They are not Apple Calendar or Google Calendar events.

## Do not change casually

- Local data key: `focus_manager_v1`
- FocusManager-only backup payload
- GitHub token exclusion from backup payload
- Session lifecycle: active → paused/resumed → completed
- Category phase grouping: 1차 / 2차 / 기타
- Existing JSON backup/restore compatibility
- PWA deployment assumptions for GitHub Pages

## Known limitations

- No Apple Calendar integration by design in this version
- No Google Calendar integration
- No real-time multi-device sync yet
- No automatic conflict merge yet
- GitHub restore overwrites current local data after confirmation
- If multiple devices record independently, the latest restored backup can overwrite another device's local-only changes
- No native app/site blocking or Mac system control from PWA alone

## Next recommended update

v1.3.1 should focus on planner UX stabilization:

- 계획 수정 기능
- 계획 복사/다음 날로 복제
- 오늘 미완료 계획 표시 개선
- 계획 완료율 주간 요약
- 모바일 플래너 입력 폼 간격 조정

After that, v1.4 can strengthen exam-study dashboard reporting.
