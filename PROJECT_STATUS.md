# PROJECT_STATUS

## Current Status

- Project: FocusManager PWA
- Current version: v1.3.7 Date Input Layout Hotfix
- Previous baseline: v1.3.6 Date Nav & Monthly Report Fix
- Stable candidate: Yes
- Service worker cache: `focusmanager-v1-3-7`
- Storage key: `focus_manager_v1`

## Current ZIP

`FocusManager_PWA_v1_3_7_date_input_layout_hotfix.zip`

## v1.3.7 Summary

This version fixes a mobile layout issue where the native iOS/Safari date picker field could overflow or visually break inside timeline/planner cards. The fix keeps the one-line `전날 / 오늘 / 다음날` navigation from v1.3.6 while constraining the date input to the card width.

## Safety Notes

- No data schema change
- No storage key change
- No GitHub backup behavior change
- No planner data migration required
- Existing sessions/plans remain compatible
