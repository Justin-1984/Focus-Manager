# FocusManager Project Status

## Current baseline

- Current version: v1.2.1
- Baseline type: Modal Hotfix on v1.2.0 GitHub Backup Foundation
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
- Existing storage key and base data shape were preserved.

## v1.2.1 hotfix additions

- Fixed mobile/Safari modal overlay hidden-state bug
- Added explicit global `[hidden]` and `.modal-overlay[hidden]` rules
- Added close button to the session edit modal
- Improved mobile modal scroll and button access
- Updated service worker cache to `focusmanager-v1-2-1`

## v1.2.0 additions

- GitHub backup settings panel
- GitHub manual backup
- GitHub restore
- Session-end automatic backup option
- GitHub backup status display
- Last backup/restore timestamp fields
- GitHub token clear button
- Backup envelope format for JSON/GitHub backups
- Token exclusion from backup payload
- Import compatibility for old raw JSON backups and new envelope backups

## v1.1.2 retained features

- Session type field
  - 이론 / 기출 / 암기 / 오답 / 답안작성 / 복습 / 기타
- Round field
  - 미지정 / 1회독 / 2회독 / 3회독 / 4회독 / 5회독+ / 최종정리
- Part/range field
- Edit modal support for session type, round, and part/range
- Study type report
- Round status report
- Study metadata badges in recent records and mini timeline

## Do not change casually

- Local data key: `focus_manager_v1`
- Core data shape: settings, categories, sessions, activeSession
- Session lifecycle: active → paused/resumed → completed
- Category phase grouping: 1차 / 2차 / 기타
- Existing JSON backup/restore compatibility
- GitHub backup should remain FocusManager-only and must not include AssetManager/BenefitManager data models
- PWA deployment assumptions for GitHub Pages

## Known limitations

- No real-time multi-device sync yet
- No automatic conflict merge yet
- GitHub restore overwrites current local data after confirmation
- If multiple devices record independently, the latest restored backup can overwrite another device's local-only changes
- No native app/site blocking or Mac system control from PWA alone

## Next recommended update

v1.2.2 should focus on backup UX stabilization:

- 백업 성공/실패 메시지 더 명확하게 표시
- 복원 전 백업 파일 요약 미리보기
- 마지막 백업 카드 대시보드 표시 여부 검토
- 토큰/저장소 설정 안내 문구 보강

After that, v1.3 should return to exam-study dashboard improvements:

- 오늘 공부량 요약 카드
- 과목별 누적 시간
- 과목별 회독 진행률
- 목표 대비 부족 시간
- 시험일 기준 남은 기간별 공부 페이스 표시
