# FocusManager Project Status

## Current baseline

- Current version: v1.3.2
- Baseline type: Elapsed Time Indicator on v1.3.1 Persistence Hotfix
- Storage: localStorage first + mirror/last-good slots + IndexedDB safety copy
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
- Existing storage key was preserved.
- Persistence helper syntax and service worker syntax checks passed.
- Floating clock/session indicator logic was updated without changing stored data shape.

## v1.3.2 additions

- Expanded the fixed top clock badge into an active-session status indicator
- Added elapsed time display while a session is running
- Added remaining time display for timed sessions
- Added overtime display after the target time is exceeded
- Added expected end time display
- Added 30-minute milestone state display
- Added paused-state display in the top badge
- Updated service worker cache to `focusmanager-v1-3-2`

## v1.3.1 hotfix additions

- Added localStorage mirror slot: `focus_manager_v1_mirror`
- Added last-known-good slot: `focus_manager_v1_last_good`
- Added IndexedDB safety copy under `focus_manager_persistence`
- Added automatic restore from a better safety copy when the primary save is empty or weaker
- Added pagehide/beforeunload/visibilitychange persistence flush
- Improved partial/corrupt data normalization to avoid falling back to a blank default too easily
- Updated service worker cache to `focusmanager-v1-3-1`

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
- Session edit modal metadata support
- Report cards for study type and round distribution

## Development rule

Use the latest confirmed stable ZIP as baseline, preserve existing working behavior, and make minimal scoped changes only.
