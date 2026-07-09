# Changelog

## v1.3.1

- 긴급 수정: 앱을 껐다 켠 뒤 데이터가 초기화되는 현상을 방지하기 위한 저장 안정화 패치
- 추가: `focus_manager_v1_mirror` 보조 저장 슬롯 추가
- 추가: `focus_manager_v1_last_good` 마지막 정상 데이터 저장 슬롯 추가
- 추가: IndexedDB 안전 복사본 저장/자동 복구 로직 추가
- 추가: 앱 종료, 페이지 숨김, 백그라운드 전환 시 추가 저장 처리
- 개선: 저장 데이터 로딩 시 primary/mirror/last-good 중 더 온전한 데이터를 선택하도록 개선
- 개선: 손상되거나 일부 필드가 누락된 데이터도 가능한 범위에서 기본값과 병합해 복구
- 유지: 기존 기본 저장 키 `focus_manager_v1` 유지
- 유지: v1.3.0 공부 플래너 기능, v1.2.x GitHub 백업, 고정 시계, 모달 핫픽스 유지
- 갱신: service worker cache version `focusmanager-v1-3-1`로 변경

## v1.3.0

- 추가: 앱 내부 공부 플래너 화면 추가
- 추가: 오늘 총 공부 목표 설정
- 추가: 이번 주 목표 시간 설정
- 추가: 과목별 일일/주간 목표 설정
- 추가: 날짜별 공부 계획 추가 기능
  - 의도/할 일
  - 과목/카테고리
  - 세션 타입
  - 회독 단계
  - 파트/범위
  - 시작/종료 시간 또는 목표 분
- 추가: 선택 날짜 계획 목록 표시
- 추가: 계획에서 바로 집중 세션 시작
- 추가: 계획을 세션 화면에 불러오기
- 추가: 계획 완료 시 실제 세션 기록과 연결
- 추가: 대시보드에 오늘 계획 카드 추가
- 추가: 대시보드에 오늘 목표/계획 대비/이번 주 목표 달성률 카드 추가
- 변경: 데이터 구조에 `plans` 추가
- 변경: 설정 구조에 `weeklyTargetHours`, `categoryGoals` 추가
- 유지: 저장 키 `focus_manager_v1` 유지
- 유지: 기존 JSON/GitHub 백업 호환성 유지
- 유지: GitHub token은 백업 파일에 포함하지 않음
- 갱신: service worker cache version `focusmanager-v1-3-0`로 변경

## v1.2.2

- 추가: 화면 상단에 항상 표시되는 현재시간 배지 추가
- 개선: 스크롤을 내려도 현재 시간을 확인할 수 있도록 fixed 위치 적용
- 개선: iPhone/iPad safe-area를 고려한 상단 여백과 위치 보정
- 개선: 시계 배지는 클릭을 방해하지 않도록 `pointer-events: none` 적용
- 유지: v1.2.1 모달 핫픽스, GitHub 백업/복원 기능, 저장 키 `focus_manager_v1` 유지
- 갱신: service worker cache version `focusmanager-v1-2-2`로 변경

## v1.2.1

- 긴급 수정: iPhone/Safari에서 `hidden` 속성이 `.modal-overlay`의 `display:flex`에 의해 무시되어 세션 수정 모달이 앱 시작 시 항상 보이던 문제 수정
- 수정: 전역 `[hidden]` 및 `.modal-overlay[hidden]` 숨김 규칙 추가
- 개선: 세션 수정 모달 상단 닫기 버튼 추가
- 개선: 모바일 화면에서 수정 모달이 화면 높이를 넘을 때 내부 스크롤과 하단 버튼 접근성이 유지되도록 CSS 보강
- 유지: GitHub 백업/복원 기능, 저장 키 `focus_manager_v1`, 기존 데이터 구조 유지
- 갱신: service worker cache version `focusmanager-v1-2-1`로 변경

## v1.2.0

- 추가: GitHub 백업 설정 UI 추가
  - Owner
  - Repo
  - Branch
  - Backup path
  - GitHub token
- 추가: GitHub Contents API 기반 수동 백업 기능 추가
- 추가: GitHub 백업 파일 복원 기능 추가
- 추가: 세션 종료 후 자동 GitHub 백업 옵션 추가
- 추가: GitHub 백업 상태 표시
  - 마지막 백업 시간
  - 마지막 복원 시간
  - 성공/실패 메시지
- 추가: GitHub 토큰 삭제 버튼 추가
- 변경: JSON 내보내기를 v1.2 envelope 구조로 변경
- 변경: JSON 가져오기는 기존 raw 데이터와 v1.2 envelope 데이터를 모두 지원
- 보안: GitHub token은 백업 파일에 포함하지 않고 각 기기 localStorage에만 보관
- 유지: 저장 키 `focus_manager_v1` 유지
- 유지: 기존 세션/카테고리/공부 메타데이터 구조와 호환
- 갱신: service worker cache version `focusmanager-v1-2-0`로 변경

## v1.1.2

- 점검: Claude 업데이트 v1.1.1 기준 파일 구조, 필수 PWA 파일, JavaScript 문법, manifest JSON 구조 확인
- 수정: README가 v1.0.0으로 남아 있던 문서 버전 불일치 정리
- 수정: PROJECT_STATUS의 다음 단계 문구가 v1.1/v1.2로 섞여 있던 부분 정리
- 추가: 세션 타입 필드 추가
  - 이론 / 기출 / 암기 / 오답 / 답안작성 / 복습 / 기타
- 추가: 회독 단계 필드 추가
  - 미지정 / 1회독 / 2회독 / 3회독 / 4회독 / 5회독+ / 최종정리
- 추가: 파트/범위 입력 필드 추가
- 추가: 최근 기록, 미니 타임라인, 상세 요약, 타임라인 블록에 공부 메타정보 표시
- 추가: 완료 세션 수정 모달에서 세션 타입/회독/파트 수정 가능
- 추가: 리포트에 공부 방식 분포와 회독 현황 카드 추가
- 유지: `focus_manager_v1` 저장 키 유지로 기존 로컬 데이터와 호환
- 갱신: service worker cache version `focusmanager-v1-1-2`로 변경

## v1.1.1

- 수정: 지정 시간(25/50/90분) 세션이 목표 시간에 도달해도 타이머가 알림 없이 계속 진행되던 문제 개선
  - 목표 시간 도달 시 알림음 + 토스트 1회 발생, 세션 상태를 "목표 시간 초과"로 표시, 다이얼 색상 변경
  - 자동 종료는 하지 않음 (사용자가 계속하거나 직접 종료 선택)
- 추가: 완료된 세션 기록 수정 기능
  - 대시보드 "최근 기록"의 각 항목에 [수정] 버튼 추가
  - 타임라인의 완료된 세션 블록을 클릭하면 수정 모달 오픈
  - 수정 모달에서 제목/카테고리/기분/메모 변경 및 기록 삭제 가능
  - 정보 입력 없이 제출한 세션도 사후에 보완할 수 있어 리포트 분석 정확도 개선

## v1.1.0

- 기본 카테고리를 손해사정사 시험과목으로 교체 (1차: 보험업법/보험계약법/손해사정이론/영어, 2차: 의학이론/책임보험·산재보험/제3보험/자동차보험)
- 카테고리 선택을 1차/2차/기타 단계별 그룹(optgroup)으로 표시
- 카테고리 추가 시 시험 단계(phase) 지정 가능
- 리포트 일별 차트를 div 막대 → SVG 부드러운 라인/영역 차트로 교체
- 대시보드 히어로에 시험 D-day 씰(seal) 배지 추가 (설정에서 시험일 입력)
- 시각 아이덴티티 개편: 네이비 배경 + 골드/그린 톤, 헤딩에 서리프 디스플레이 폰트, 타이머에 모노스페이스 폰트 적용
- manifest/메타 theme-color를 새 팔레트에 맞춰 업데이트
- service worker 캐시 버전 v1.1.0으로 갱신
- 데이터 저장 키(`focus_manager_v1`)와 기존 sessions/categories 구조는 유지 (settings에 examDate 필드 추가, 카테고리에 phase 필드 추가 — 기존 사용자 데이터와 호환)

## v1.0.0 Initial

- FocusManager PWA 신규 생성
- 대시보드/세션/타임라인/리포트/설정 메뉴 구성
- 로컬 저장 기반 세션 기록 엔진 추가
- 집중 세션 시작/일시정지/재개/종료 기능 추가
- 회고 메모 및 집중 상태 기록 추가
- 날짜별 타임라인 추가
- 최근 7/14/30일 리포트 추가
- 카테고리 관리 추가
- JSON 백업/복원 추가
- PWA manifest 및 service worker 추가
- iPhone/iPad/PC 반응형 UI 적용
