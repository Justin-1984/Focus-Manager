# FocusManager Project Status

## Current baseline

- Current version: v1.0.0 Initial
- Baseline type: first stable prototype candidate
- Storage: localStorage only
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
- JavaScript syntax check completed with `node --check app.js`.
- Package is ready for manual browser testing and GitHub Pages deployment.

## Do not change casually

- Local data key: `focus_manager_v1`
- Data shape: settings, categories, sessions, activeSession
- Session lifecycle: active → paused/resumed → completed

## Next recommended update

v1.1 should focus only on study-use improvements:

- 과목/파트 필드
- 기출/이론/암기/오답 세션 타입
- 오늘 공부 체크리스트
- 시험공부용 리포트 카드
