const STORAGE_KEY = 'focus_manager_v1';
const DEFAULT_DATA = {
  version: '1.3.0',
  settings: {
    dailyTargetHours: 6,
    weeklyTargetHours: 40,
    categoryGoals: { daily: {}, weekly: {} },
    sound: true,
    autoReflection: true,
    examDate: null,
    githubBackup: {
      enabled: false,
      owner: '',
      repo: '',
      branch: 'main',
      path: 'data/focusmanager_backup.json',
      token: '',
      autoOnSessionEnd: false,
      lastBackupAt: null,
      lastRestoreAt: null,
      lastStatus: 'GitHub 백업 미설정',
    },
  },
  categories: [
    { id: 'law_insurance', name: '보험업법', color: '#c9a227', phase: '1차' },
    { id: 'law_contract', name: '보험계약법(상법)', color: '#c9a227', phase: '1차' },
    { id: 'theory', name: '손해사정이론', color: '#c9a227', phase: '1차' },
    { id: 'english', name: '영어', color: '#c9a227', phase: '1차' },
    { id: 'medical', name: '의학이론', color: '#2f8f6f', phase: '2차' },
    { id: 'liability', name: '책임보험·산재보험', color: '#2f8f6f', phase: '2차' },
    { id: 'third_party', name: '제3보험', color: '#2f8f6f', phase: '2차' },
    { id: 'auto', name: '자동차보험', color: '#2f8f6f', phase: '2차' },
    { id: 'break', name: '휴식', color: '#7d7772', phase: '기타' },
  ],
  sessions: [],
  plans: [],
  activeSession: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let data = loadData();
let currentView = 'dashboard';
let selectedPresetMinutes = 25;
let selectedMood = 'focused';
let tickTimer = null;
let clockTimer = null;
let deferredPrompt = null;
let editingSessionId = null;

const pageTitles = {
  dashboard: '대시보드',
  session: '세션',
  timeline: '타임라인',
  planner: '플래너',
  reports: '리포트',
  settings: '설정',
};

const STUDY_TYPE_LABELS = {
  theory: '이론',
  past: '기출',
  memorize: '암기',
  wrong: '오답',
  answer: '답안작성',
  review: '복습',
  etc: '기타',
};

const ROUND_LABELS = {
  none: '미지정',
  '1': '1회독',
  '2': '2회독',
  '3': '3회독',
  '4': '4회독',
  '5plus': '5회독+',
  final: '최종정리',
};

function mergeSettings(settings = {}) {
  const githubBackup = {
    ...DEFAULT_DATA.settings.githubBackup,
    ...(settings.githubBackup || {}),
  };
  const categoryGoals = {
    daily: { ...(settings.categoryGoals?.daily || {}) },
    weekly: { ...(settings.categoryGoals?.weekly || {}) },
  };
  return {
    ...DEFAULT_DATA.settings,
    ...settings,
    weeklyTargetHours: Number.isFinite(Number(settings.weeklyTargetHours)) ? Number(settings.weeklyTargetHours) : DEFAULT_DATA.settings.weeklyTargetHours,
    categoryGoals,
    githubBackup,
  };
}

function normalizePlan(plan = {}) {
  const date = plan.date || todayKey();
  const targetMinutes = Number(plan.targetMinutes || minutesBetween(plan.startTime, plan.endTime) || 25);
  return {
    id: plan.id || `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    date,
    title: plan.title || plan.intention || '계획 없는 공부',
    categoryId: plan.categoryId || DEFAULT_DATA.categories[0].id,
    sessionType: normalizeStudyType(plan.sessionType),
    round: normalizeRound(plan.round),
    part: plan.part || '',
    startTime: plan.startTime || '',
    endTime: plan.endTime || '',
    targetMinutes: Math.max(5, Math.min(600, targetMinutes || 25)),
    status: plan.status || 'planned',
    linkedSessionId: plan.linkedSessionId || null,
    createdAt: plan.createdAt || new Date().toISOString(),
    completedAt: plan.completedAt || null,
  };
}

function normalizeImportedData(imported) {
  const source = imported?.app === 'FocusManager' && imported.data ? imported.data : imported;
  if (!source || !Array.isArray(source.sessions) || !Array.isArray(source.categories)) throw new Error('invalid data');
  return {
    ...structuredClone(DEFAULT_DATA),
    ...source,
    version: DEFAULT_DATA.version,
    settings: mergeSettings(source.settings || {}),
    categories: source.categories.length ? source.categories : DEFAULT_DATA.categories,
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    plans: Array.isArray(source.plans) ? source.plans.map(normalizePlan) : [],
    activeSession: source.activeSession || null,
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    return normalizeImportedData(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load data', error);
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData(message = '저장됨') {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const status = $('#storageStatus');
  if (status) status.textContent = `${message} · ${formatClock(new Date())}`;
}

function backupSafeData() {
  const snapshot = structuredClone(data);
  snapshot.version = DEFAULT_DATA.version;
  if (snapshot.settings?.githubBackup) {
    snapshot.settings.githubBackup = {
      ...snapshot.settings.githubBackup,
      token: '',
    };
  }
  return snapshot;
}

function makeBackupEnvelope() {
  return {
    app: 'FocusManager',
    backupVersion: '1.0',
    version: DEFAULT_DATA.version,
    storageKey: STORAGE_KEY,
    backupAt: new Date().toISOString(),
    source: location.href,
    data: backupSafeData(),
  };
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
}

function formatClock(date) {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function formatFloatingClock(date = new Date()) {
  const time = new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  const datePart = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })
    .format(date)
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();
  return `${time} · ${datePart}`;
}

function updateFloatingClock() {
  const clock = $('#floatingClock');
  if (!clock) return;
  const now = new Date();
  clock.textContent = formatFloatingClock(now);
  clock.dateTime = now.toISOString();
}

function startFloatingClock() {
  if (clockTimer) clearInterval(clockTimer);
  updateFloatingClock();
  clockTimer = setInterval(updateFloatingClock, 1000);
}

function formatDuration(ms, compact = true) {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (compact) {
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
  }
  const sec = Math.floor((Math.max(0, ms) % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function sessionDuration(session, now = Date.now()) {
  const end = session.endAt ? new Date(session.endAt).getTime() : now;
  const start = new Date(session.startAt).getTime();
  const paused = totalPausedMs(session, now);
  return Math.max(0, end - start - paused);
}

function totalPausedMs(session, now = Date.now()) {
  const pauses = Array.isArray(session.pauses) ? session.pauses : [];
  return pauses.reduce((sum, pause) => {
    const start = new Date(pause.start).getTime();
    const end = pause.end ? new Date(pause.end).getTime() : now;
    return sum + Math.max(0, end - start);
  }, 0);
}

function getCategory(id) {
  return data.categories.find((cat) => cat.id === id) || data.categories[0];
}

function completedSessions() {
  return data.sessions.filter((session) => session.status === 'completed');
}

function sessionsForDate(dateStr) {
  return completedSessions().filter((session) => todayKey(new Date(session.startAt)) === dateStr);
}

function minutesBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function planDurationMinutes(plan) {
  return Math.max(5, Math.min(600, Number(plan.targetMinutes || minutesBetween(plan.startTime, plan.endTime) || 25)));
}

function plansForDate(dateStr) {
  return (data.plans || []).filter((plan) => plan.date === dateStr).sort((a, b) => {
    const at = a.startTime || '99:99';
    const bt = b.startTime || '99:99';
    return at.localeCompare(bt);
  });
}

function weekKeysFor(dateStr = todayKey()) {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return todayKey(d);
  });
}

function actualMsForDate(dateStr, categoryId = null) {
  let total = sessionsForDate(dateStr)
    .filter((session) => !categoryId || session.categoryId === categoryId)
    .reduce((sum, session) => sum + sessionDuration(session), 0);
  if (dateStr === todayKey() && data.activeSession && (!categoryId || data.activeSession.categoryId === categoryId)) {
    total += sessionDuration(data.activeSession);
  }
  return total;
}

function actualMsForWeek(dateStr = todayKey(), categoryId = null) {
  return weekKeysFor(dateStr).reduce((sum, key) => sum + actualMsForDate(key, categoryId), 0);
}

function plannedMsForDate(dateStr, categoryId = null) {
  return plansForDate(dateStr)
    .filter((plan) => !categoryId || plan.categoryId === categoryId)
    .reduce((sum, plan) => sum + planDurationMinutes(plan) * 60000, 0);
}

function linkedSessionForPlan(plan) {
  return plan.linkedSessionId ? data.sessions.find((session) => session.id === plan.linkedSessionId) : null;
}

function planComputedStatus(plan) {
  if (linkedSessionForPlan(plan)) return 'completed';
  if (data.activeSession?.linkedPlanId === plan.id) return 'active';
  return 'planned';
}


function startTicker() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (data.activeSession) {
      checkTargetReached();
      renderActiveSession();
      renderDashboard(false);
    }
  }, 1000);
}

function checkTargetReached() {
  const session = data.activeSession;
  if (!session || !session.targetMinutes || session.isPaused || session.targetNotified) return;
  const elapsed = sessionDuration(session);
  if (elapsed >= session.targetMinutes * 60000) {
    session.targetNotified = true;
    saveData('목표 시간 도달');
    if (data.settings.sound) playDing();
    toast(`목표 시간(${session.targetMinutes}분)에 도달했습니다. 계속하거나 세션을 종료하세요.`);
  }
}

function switchView(view) {
  currentView = view;
  $$('.view').forEach((el) => el.classList.remove('active-view'));
  $(`#${view}View`)?.classList.add('active-view');
  $$('.nav-item, .mobile-nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
  $('#pageTitle').textContent = pageTitles[view] || 'FocusManager';
  renderAll(false);
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el.timer);
  el.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderAll(showToast = false) {
  $('#todayLabel').textContent = dateLabel();
  renderCategorySelects();
  renderActiveSession();
  renderDashboard();
  renderTimeline();
  renderPlanner();
  renderReports();
  renderSettings();
  renderSuggestions();
  if (showToast) toast('화면을 업데이트했습니다.');
}

function categoryOptionsHtml(current) {
  const groups = new Map();
  data.categories.forEach((cat) => {
    const key = cat.phase || '기타';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cat);
  });
  return Array.from(groups.entries()).map(([phase, cats]) => `
    <optgroup label="${escapeAttr(phase)}">
      ${cats.map((cat) => `<option value="${cat.id}" ${cat.id === current ? 'selected' : ''}>${escapeHtml(cat.name)}</option>`).join('')}
    </optgroup>`).join('');
}

function renderCategorySelects() {
  const currentSessionCategory = $('#categorySelect')?.value || data.activeSession?.categoryId || data.categories[0]?.id;
  const currentPlanCategory = $('#planCategory')?.value || data.categories[0]?.id;
  const sessionSelect = $('#categorySelect');
  if (sessionSelect) {
    const selected = data.categories.some((cat) => cat.id === currentSessionCategory) ? currentSessionCategory : data.categories[0]?.id;
    sessionSelect.innerHTML = categoryOptionsHtml(selected);
    sessionSelect.value = selected;
  }
  const planSelect = $('#planCategory');
  if (planSelect) {
    const selected = data.categories.some((cat) => cat.id === currentPlanCategory) ? currentPlanCategory : data.categories[0]?.id;
    planSelect.innerHTML = categoryOptionsHtml(selected);
    planSelect.value = selected;
  }
}

function renderDashboard() {
  const today = todayKey();
  const todaySessions = sessionsForDate(today);
  const todayMs = todaySessions.reduce((sum, session) => sum + sessionDuration(session), 0) + (data.activeSession && todayKey(new Date(data.activeSession.startAt)) === today ? sessionDuration(data.activeSession) : 0);
  const targetMs = data.settings.dailyTargetHours * 3600000;
  const progress = targetMs ? Math.min(100, Math.round((todayMs / targetMs) * 100)) : 0;

  $('#metricTodayFocus').textContent = formatDuration(todayMs);
  $('#metricSessionCount').textContent = String(todaySessions.length);
  $('#metricLongest').textContent = formatDuration(Math.max(0, ...todaySessions.map((s) => sessionDuration(s))));
  $('#metricTopCategory').textContent = topCategoryName(todaySessions);
  $('#todayProgressBar').style.width = `${progress}%`;
  $('#todayProgressText').textContent = `${progress}% 달성`;
  $('#todayTargetText').textContent = `목표 ${data.settings.dailyTargetHours}h`;

  const dday = dDayInfo();
  const sealEl = $('#examSeal');
  if (sealEl) {
    if (dday) {
      sealEl.hidden = false;
      $('#examSealLabel').textContent = dday.label;
      $('#examSealDate').textContent = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(`${data.settings.examDate}T00:00:00`));
    } else {
      sealEl.hidden = true;
    }
  }

  const active = data.activeSession;
  $('#nowSessionTitle').textContent = active ? active.title || '제목 없는 세션' : '진행 중인 세션 없음';
  $('#nowSessionMeta').textContent = active ? `${getCategory(active.categoryId).name} · ${sessionMetaText(active)} · ${active.isPaused ? '일시정지' : active.targetNotified ? '목표 시간 초과' : '진행 중'}` : '세션 화면에서 오늘의 의도를 입력하고 시작하세요.';
  $('#dashboardTimer').textContent = active ? formatDuration(sessionDuration(active), false) : '00:00:00';
  $('#dashboardStartBtn').textContent = active ? '세션으로 이동' : '세션 시작';
  $('#dashboardEndBtn').hidden = !active;

  renderDashboardPlans(today, todayMs, targetMs);
  renderMiniTimeline(todaySessions);
  renderRecentSessions();
}

function renderDashboardPlans(dateStr, actualMs, targetMs) {
  const list = $('#dashboardPlanList');
  const summary = $('#dashboardGoalSummary');
  if (list) list.innerHTML = planListHtml(plansForDate(dateStr), true) || '<p class="muted">오늘 계획이 없습니다. 플래너에서 공부 계획을 추가하세요.</p>';
  if (summary) {
    const plannedMs = plannedMsForDate(dateStr);
    const weekActual = actualMsForWeek(dateStr);
    const weekTarget = (data.settings.weeklyTargetHours || 40) * 3600000;
    summary.innerHTML = `
      ${goalProgressHtml('오늘 목표', actualMs, targetMs || 1)}
      ${goalProgressHtml('오늘 계획 대비', actualMs, plannedMs || 1)}
      ${goalProgressHtml('이번 주 목표', weekActual, weekTarget || 1)}
    `;
  }
}

function goalProgressHtml(label, actualMs, targetMs) {
  const pct = targetMs ? Math.min(100, Math.round((actualMs / targetMs) * 100)) : 0;
  return `<div class="goal-progress">
    <div class="goal-progress-head"><span>${escapeHtml(label)}</span><strong>${formatDuration(actualMs)} / ${formatDuration(targetMs)}</strong></div>
    <div class="track"><div class="fill" style="width:${pct}%"></div></div>
  </div>`;
}

function topCategoryName(sessions) {
  if (!sessions.length) return '-';
  const sums = new Map();
  sessions.forEach((session) => {
    sums.set(session.categoryId, (sums.get(session.categoryId) || 0) + sessionDuration(session));
  });
  const [catId] = Array.from(sums.entries()).sort((a, b) => b[1] - a[1])[0];
  return getCategory(catId).name;
}

function renderMiniTimeline(sessions) {
  const el = $('#miniTimeline');
  if (!sessions.length && !data.activeSession) {
    el.innerHTML = '<p class="muted">오늘 완료된 세션이 없습니다.</p>';
    return;
  }
  const items = [...sessions, ...(data.activeSession ? [data.activeSession] : [])]
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
    .slice(0, 5);
  el.innerHTML = items.map((session) => {
    const cat = getCategory(session.categoryId);
    const end = session.endAt ? formatClock(new Date(session.endAt)) : '진행 중';
    return `<div class="mini-row" style="border-left: 4px solid ${cat.color}">
      <div class="time">${formatClock(new Date(session.startAt))}<br>${end}</div>
      <div class="name">${escapeHtml(session.title || '제목 없는 세션')}<div class="meta-badge-row">${sessionMetaBadges(session)}</div></div>
      <div class="duration">${formatDuration(sessionDuration(session))}</div>
    </div>`;
  }).join('');
}

function renderRecentSessions() {
  const el = $('#recentSessions');
  const items = completedSessions().slice().sort((a, b) => new Date(b.endAt) - new Date(a.endAt)).slice(0, 6);
  if (!items.length) {
    el.classList.add('empty-list');
    el.textContent = '아직 기록이 없습니다.';
    return;
  }
  el.classList.remove('empty-list');
  el.innerHTML = items.map((session) => {
    const cat = getCategory(session.categoryId);
    return `<article class="session-item" style="border-left: 4px solid ${cat.color}">
      <div class="session-item-head">
        <strong>${escapeHtml(session.title || '제목 없는 세션')}</strong>
        <button class="edit-button" data-edit-session="${session.id}" aria-label="세션 수정">수정</button>
      </div>
      <span>${todayKey(new Date(session.startAt))} · ${escapeHtml(cat.name)} · ${sessionMetaHtml(session)} · ${formatDuration(sessionDuration(session))} · ${moodLabel(session.mood)}</span>
    </article>`;
  }).join('');
}

function renderActiveSession() {
  const session = data.activeSession;
  const timerText = session ? formatDuration(sessionDuration(session), false) : '00:00:00';
  $('#sessionTimer').textContent = timerText;
  const overtime = session && session.targetNotified;
  $('#sessionStateText').textContent = session ? (session.isPaused ? '일시정지 중' : overtime ? '목표 시간 초과 · 진행 중' : '진행 중') : '대기 중';
  $('#sessionStateText').classList.toggle('overtime', !!overtime && !session?.isPaused);
  $('#startPauseBtn').textContent = session ? (session.isPaused ? 'RESUME SESSION' : 'PAUSE SESSION') : 'START SESSION';
  $('#finishSessionBtn').hidden = !session;
  $('#intentionInput').disabled = !!session;
  $('#categorySelect').disabled = !!session;
  $('#sessionTypeSelect').disabled = !!session;
  $('#roundSelect').disabled = !!session;
  $('#partInput').disabled = !!session;
  $('#reflectionNote').disabled = !session;
  $('#activeSummary').innerHTML = session ? activeSummaryHtml(session) : '세션을 시작하면 요약이 표시됩니다.';

  if (session) {
    $('#intentionInput').value = session.title || '';
    $('#categorySelect').value = session.categoryId;
    $('#sessionTypeSelect').value = normalizeStudyType(session.sessionType);
    $('#roundSelect').value = normalizeRound(session.round);
    $('#partInput').value = session.part || '';
  }
  updateDialProgress(session);
}

function activeSummaryHtml(session) {
  const cat = getCategory(session.categoryId);
  const preset = session.targetMinutes ? `목표 ${session.targetMinutes}분` : '자유 세션';
  return `<strong>${escapeHtml(session.title || '제목 없는 세션')}</strong><br>
    ${cat.name} · ${preset}<br>
    ${sessionMetaHtml(session)}<br>
    시작 ${formatClock(new Date(session.startAt))} · 현재 ${formatDuration(sessionDuration(session))}<br>
    휴식 ${formatDuration(totalPausedMs(session))}`;
}

function updateDialProgress(session) {
  const circle = $('#dialProgress');
  const circumference = 552.92;
  if (!session || !session.targetMinutes) {
    circle.style.strokeDashoffset = session ? circumference * 0.22 : circumference;
    circle.style.stroke = 'var(--accent)';
    return;
  }
  const ratio = Math.min(1, sessionDuration(session) / (session.targetMinutes * 60000));
  circle.style.strokeDashoffset = String(circumference * (1 - ratio));
  circle.style.stroke = session.targetNotified ? 'var(--warning)' : 'var(--accent)';
}

function renderTimeline() {
  const input = $('#timelineDate');
  if (!input.value) input.value = todayKey();
  const dateStr = input.value;
  const sessions = sessionsForDate(dateStr);
  if (dateStr === todayKey() && data.activeSession) sessions.push(data.activeSession);

  const startHour = 5;
  const endHour = 24;
  const rowHeight = 52;
  const totalHours = endHour - startHour;
  const labels = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);
  const blocks = sessions.map((session) => timelineBlock(session, startHour, rowHeight, totalHours)).join('');

  $('#timelineWrapper').innerHTML = `
    <div class="time-labels">${labels.map((hour) => `<div>${String(hour).padStart(2, '0')}:00</div>`).join('')}</div>
    <div class="timeline-lane">${blocks || '<p class="muted" style="padding:18px">해당 날짜의 세션 기록이 없습니다.</p>'}</div>`;
}

function timelineBlock(session, startHour, rowHeight, totalHours) {
  const cat = getCategory(session.categoryId);
  const start = new Date(session.startAt);
  const end = session.endAt ? new Date(session.endAt) : new Date();
  const startMin = (start.getHours() - startHour) * 60 + start.getMinutes();
  const durationMin = Math.max(8, (end - start - totalPausedMs(session)) / 60000);
  const top = Math.max(0, (startMin / 60) * rowHeight);
  const height = Math.max(34, (durationMin / 60) * rowHeight);
  const maxHeight = totalHours * rowHeight;
  const safeTop = Math.min(maxHeight - 34, top);
  const safeHeight = Math.min(height, maxHeight - safeTop);
  const editable = session.status === 'completed';
  const editAttr = editable ? ` data-edit-session="${session.id}" role="button" tabindex="0"` : '';
  return `<div class="timeline-block${editable ? ' is-editable' : ''}" style="top:${safeTop}px;height:${safeHeight}px;background:${cat.color}"${editAttr}>
    <strong>${escapeHtml(session.title || '제목 없는 세션')}</strong>
    <span>${formatClock(start)} - ${session.endAt ? formatClock(end) : '진행 중'} · ${formatDuration(sessionDuration(session))} · ${sessionMetaHtml(session)}</span>
  </div>`;
}

function renderPlanner() {
  const dateInput = $('#plannerDate');
  if (!dateInput) return;
  if (!dateInput.value) dateInput.value = todayKey();
  const dateStr = dateInput.value;
  const dailyInput = $('#dailyGoalInput');
  const weeklyInput = $('#weeklyGoalInput');
  if (dailyInput) dailyInput.value = data.settings.dailyTargetHours || 6;
  if (weeklyInput) weeklyInput.value = data.settings.weeklyTargetHours || 40;
  renderPlannerSummary(dateStr);
  renderCategoryGoalEditor(dateStr);
  const planList = $('#planList');
  if (planList) planList.innerHTML = planListHtml(plansForDate(dateStr), false) || '<p class="muted">선택한 날짜의 계획이 없습니다.</p>';
}

function renderPlannerSummary(dateStr) {
  const el = $('#plannerSummary');
  if (!el) return;
  const actualMs = actualMsForDate(dateStr);
  const plannedMs = plannedMsForDate(dateStr);
  const dailyTargetMs = (data.settings.dailyTargetHours || 6) * 3600000;
  const weekActualMs = actualMsForWeek(dateStr);
  const weeklyTargetMs = (data.settings.weeklyTargetHours || 40) * 3600000;
  const planCount = plansForDate(dateStr).length;
  const doneCount = plansForDate(dateStr).filter((plan) => planComputedStatus(plan) === 'completed').length;
  el.innerHTML = `
    <div class="summary-tile"><span>선택 날짜 실제</span><strong>${formatDuration(actualMs)}</strong><small>목표 ${formatDuration(dailyTargetMs)}</small></div>
    <div class="summary-tile"><span>계획 대비</span><strong>${plannedMs ? Math.round((actualMs / plannedMs) * 100) : 0}%</strong><small>${formatDuration(plannedMs)} 계획</small></div>
    <div class="summary-tile"><span>계획 완료</span><strong>${doneCount}/${planCount}</strong><small>예정 세션 기준</small></div>
    <div class="summary-tile"><span>이번 주 실제</span><strong>${formatDuration(weekActualMs)}</strong><small>목표 ${formatDuration(weeklyTargetMs)}</small></div>
  `;
}

function renderCategoryGoalEditor(dateStr) {
  const el = $('#categoryGoalEditor');
  if (!el) return;
  const goals = data.settings.categoryGoals || { daily: {}, weekly: {} };
  el.innerHTML = data.categories.filter((cat) => cat.id !== 'break').map((cat) => {
    const daily = goals.daily?.[cat.id] || '';
    const weekly = goals.weekly?.[cat.id] || '';
    const dailyMs = Number(daily || 0) * 3600000;
    const weeklyMs = Number(weekly || 0) * 3600000;
    const actualDaily = actualMsForDate(dateStr, cat.id);
    const actualWeekly = actualMsForWeek(dateStr, cat.id);
    const hint = [dailyMs ? `일 ${formatDuration(actualDaily)}/${formatDuration(dailyMs)}` : '', weeklyMs ? `주 ${formatDuration(actualWeekly)}/${formatDuration(weeklyMs)}` : ''].filter(Boolean).join(' · ');
    return `<div class="goal-row">
      <div class="goal-row-name"><span class="color-dot" style="background:${cat.color}"></span><div><strong>${escapeHtml(cat.name)}</strong><br><small class="muted">${hint || '목표 미설정'}</small></div></div>
      <label class="field-label">일 목표<input class="text-input" data-goal-daily="${cat.id}" type="number" min="0" max="16" step="0.5" value="${escapeAttr(daily)}" /></label>
      <label class="field-label">주 목표<input class="text-input" data-goal-weekly="${cat.id}" type="number" min="0" max="80" step="0.5" value="${escapeAttr(weekly)}" /></label>
    </div>`;
  }).join('');
}

function planListHtml(plans, compact = false) {
  return plans.map((plan) => {
    const cat = getCategory(plan.categoryId);
    const status = planComputedStatus(plan);
    const linked = linkedSessionForPlan(plan);
    const timeText = plan.startTime && plan.endTime ? `${plan.startTime} - ${plan.endTime}` : `${planDurationMinutes(plan)}분 계획`;
    const statusLabel = status === 'completed' ? '완료' : status === 'active' ? '진행 중' : '대기';
    const statusClass = status === 'completed' ? 'done' : status === 'active' ? 'now' : '';
    const cardClass = status === 'completed' ? ' completed' : status === 'active' ? ' active-plan' : '';
    const linkedText = linked ? ` · 실제 ${formatDuration(sessionDuration(linked))}` : '';
    const actions = compact ? '' : `<div class="plan-actions">
      <button class="primary-button" data-start-plan="${plan.id}" ${status !== 'planned' ? 'disabled' : ''}>이 계획으로 시작</button>
      <button class="ghost-button" data-fill-plan="${plan.id}" ${data.activeSession ? 'disabled' : ''}>세션에 불러오기</button>
      <button class="ghost-button" data-delete-plan="${plan.id}">삭제</button>
    </div>`;
    return `<article class="plan-card${cardClass}" style="border-left:4px solid ${cat.color}">
      <div class="plan-head">
        <div><strong>${escapeHtml(plan.title || '계획 없는 공부')}</strong><div class="plan-meta">${escapeHtml(timeText)} · ${escapeHtml(cat.name)} · ${studyTypeLabel(plan.sessionType)} · ${roundLabel(plan.round)}${plan.part ? ` · ${escapeHtml(plan.part)}` : ''}${linkedText}</div></div>
        <span class="plan-status ${statusClass}">${statusLabel}</span>
      </div>
      ${actions}
    </article>`;
  }).join('');
}

function savePlannerGoals() {
  const daily = Number($('#dailyGoalInput')?.value);
  const weekly = Number($('#weeklyGoalInput')?.value);
  if (Number.isFinite(daily)) data.settings.dailyTargetHours = Math.max(0.5, Math.min(16, daily));
  if (Number.isFinite(weekly)) data.settings.weeklyTargetHours = Math.max(1, Math.min(100, weekly));
  const categoryGoals = { daily: {}, weekly: {} };
  $$('[data-goal-daily]').forEach((input) => {
    const val = Number(input.value);
    if (Number.isFinite(val) && val > 0) categoryGoals.daily[input.dataset.goalDaily] = val;
  });
  $$('[data-goal-weekly]').forEach((input) => {
    const val = Number(input.value);
    if (Number.isFinite(val) && val > 0) categoryGoals.weekly[input.dataset.goalWeekly] = val;
  });
  data.settings.categoryGoals = categoryGoals;
  const settingsTarget = $('#targetHours');
  if (settingsTarget) settingsTarget.value = data.settings.dailyTargetHours;
  saveData('목표 저장');
  renderAll();
  toast('공부 목표를 저장했습니다.');
}

function addPlan() {
  const date = $('#plannerDate')?.value || todayKey();
  const title = $('#planIntention')?.value.trim() || '계획 없는 공부';
  const categoryId = $('#planCategory')?.value || data.categories[0]?.id;
  const startTime = $('#planStart')?.value || '';
  const endTime = $('#planEnd')?.value || '';
  const manualMinutes = Number($('#planMinutes')?.value || 0);
  const targetMinutes = Number.isFinite(manualMinutes) && manualMinutes > 0 ? manualMinutes : minutesBetween(startTime, endTime) || selectedPresetMinutes || 25;
  const plan = normalizePlan({
    id: `p_${Date.now()}`,
    date,
    title,
    categoryId,
    sessionType: $('#planType')?.value || 'theory',
    round: $('#planRound')?.value || 'none',
    part: $('#planPart')?.value.trim() || '',
    startTime,
    endTime,
    targetMinutes,
    status: 'planned',
    createdAt: new Date().toISOString(),
  });
  data.plans = Array.isArray(data.plans) ? data.plans : [];
  data.plans.push(plan);
  ['#planIntention', '#planPart', '#planStart', '#planEnd', '#planMinutes'].forEach((selector) => { const el = $(selector); if (el) el.value = ''; });
  saveData('계획 추가');
  renderAll();
  toast('공부 계획을 추가했습니다.');
}

function fillSessionFromPlan(planId) {
  const plan = data.plans.find((item) => item.id === planId);
  if (!plan || data.activeSession) return;
  $('#intentionInput').value = plan.title || '';
  $('#categorySelect').value = plan.categoryId;
  $('#sessionTypeSelect').value = normalizeStudyType(plan.sessionType);
  $('#roundSelect').value = normalizeRound(plan.round);
  $('#partInput').value = plan.part || '';
  selectedPresetMinutes = planDurationMinutes(plan);
  $$('.chip').forEach((chip) => chip.classList.toggle('active', Number(chip.dataset.minutes || 0) === selectedPresetMinutes));
  switchView('session');
  toast('계획을 세션 화면에 불러왔습니다.');
}

function startPlanSession(planId) {
  if (data.activeSession) return toast('진행 중인 세션을 먼저 종료하세요.');
  const plan = data.plans.find((item) => item.id === planId);
  if (!plan) return;
  data.activeSession = {
    id: `s_${Date.now()}`,
    linkedPlanId: plan.id,
    title: plan.title || '계획 없는 공부',
    categoryId: plan.categoryId,
    sessionType: normalizeStudyType(plan.sessionType),
    round: normalizeRound(plan.round),
    part: plan.part || '',
    targetMinutes: planDurationMinutes(plan),
    startAt: new Date().toISOString(),
    endAt: null,
    pauses: [],
    isPaused: false,
    mood: selectedMood,
    note: '',
    status: 'active',
  };
  plan.status = 'active';
  saveData('계획 세션 시작');
  renderAll();
  switchView('session');
  toast('계획 세션을 시작했습니다.');
}

function deletePlan(planId) {
  const plan = data.plans.find((item) => item.id === planId);
  if (!plan) return;
  if (planComputedStatus(plan) === 'active') return toast('진행 중인 계획은 삭제할 수 없습니다.');
  if (!confirm('이 공부 계획을 삭제할까요? 실제 세션 기록은 삭제되지 않습니다.')) return;
  data.plans = data.plans.filter((item) => item.id !== planId);
  saveData('계획 삭제');
  renderAll();
  toast('공부 계획을 삭제했습니다.');
}

function renderReports() {
  const days = Number($('#reportRange').value || 7);
  const end = new Date();
  const dayKeys = Array.from({ length: days }, (_, idx) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (days - 1 - idx));
    return todayKey(d);
  });
  const sessions = completedSessions().filter((s) => dayKeys.includes(todayKey(new Date(s.startAt))));
  const dailyMs = new Map(dayKeys.map((key) => [key, 0]));
  sessions.forEach((session) => {
    const key = todayKey(new Date(session.startAt));
    dailyMs.set(key, (dailyMs.get(key) || 0) + sessionDuration(session));
  });
  renderDailyChart(dayKeys, dailyMs);
  renderCategoryReport(sessions);
  renderPatternReport(sessions);
  renderStudyTypeReport(sessions);
  renderRoundReport(sessions);
}

function renderDailyChart(dayKeys, dailyMs) {
  const el = $('#dailyChart');
  if (!el) return;
  const values = dayKeys.map((key) => (dailyMs.get(key) || 0) / 3600000);
  const maxVal = Math.max(1, ...values);
  const width = 100;
  const height = 42;
  const padY = 4;
  const step = dayKeys.length > 1 ? width / (dayKeys.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = dayKeys.length > 1 ? i * step : width / 2;
    const y = height - padY - (v / maxVal) * (height - padY * 2);
    return [x, y];
  });

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;

  const dots = points.map(([x, y], i) => {
    const hours = values[i];
    const date = new Date(`${dayKeys[i]}T00:00:00`);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    return `<circle cx="${x}" cy="${y}" r="1.6" class="chart-dot"><title>${label} · ${formatDuration(hours * 3600000)}</title></circle>`;
  }).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="chart-svg">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-2)" stop-opacity="0.38" />
          <stop offset="100%" stop-color="var(--accent-2)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#chartFill)" stroke="none" />
      <path d="${linePath}" fill="none" stroke="var(--accent-2)" stroke-width="0.9" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
    </svg>
    <div class="chart-axis">${dayKeys.map((key) => {
      const date = new Date(`${key}T00:00:00`);
      return `<span>${date.getMonth() + 1}/${date.getDate()}</span>`;
    }).join('')}</div>`;
}

function smoothPath(points) {
  if (points.length < 2) {
    const [x, y] = points[0] || [0, 0];
    return `M ${x},${y}`;
  }
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

function renderCategoryReport(sessions) {
  const el = $('#categoryReport');
  if (!sessions.length) {
    el.innerHTML = '<p class="muted">분석할 세션 기록이 없습니다.</p>';
    return;
  }
  const sums = new Map();
  sessions.forEach((session) => sums.set(session.categoryId, (sums.get(session.categoryId) || 0) + sessionDuration(session)));
  const total = Array.from(sums.values()).reduce((a, b) => a + b, 0) || 1;
  el.innerHTML = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]).map(([catId, ms]) => {
    const cat = getCategory(catId);
    const pct = Math.round((ms / total) * 100);
    return `<div class="category-line">
      <span>${escapeHtml(cat.name)}</span>
      <div class="track"><div class="fill" style="width:${pct}%;background:${cat.color}"></div></div>
      <strong>${formatDuration(ms)}</strong>
    </div>`;
  }).join('');
}


function renderStudyTypeReport(sessions) {
  const el = $('#studyTypeReport');
  if (!el) return;
  if (!sessions.length) {
    el.innerHTML = '<p class="muted">세션 타입이 기록되면 이론/기출/암기 비중이 표시됩니다.</p>';
    return;
  }
  const sums = new Map();
  sessions.forEach((session) => {
    const key = normalizeStudyType(session.sessionType);
    sums.set(key, (sums.get(key) || 0) + sessionDuration(session));
  });
  const total = Array.from(sums.values()).reduce((a, b) => a + b, 0) || 1;
  el.innerHTML = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]).map(([type, ms]) => {
    const pct = Math.round((ms / total) * 100);
    return `<div class="category-line">
      <span>${studyTypeLabel(type)}</span>
      <div class="track"><div class="fill" style="width:${pct}%;background:var(--accent-2)"></div></div>
      <strong>${formatDuration(ms)}</strong>
    </div>`;
  }).join('');
}

function renderRoundReport(sessions) {
  const el = $('#roundReport');
  if (!el) return;
  if (!sessions.length) {
    el.innerHTML = '<p class="muted">회독 단계가 쌓이면 회독별 누적 시간이 표시됩니다.</p>';
    return;
  }
  const sums = new Map();
  sessions.forEach((session) => {
    const key = normalizeRound(session.round);
    sums.set(key, (sums.get(key) || 0) + sessionDuration(session));
  });
  el.innerHTML = Array.from(sums.entries()).sort((a, b) => b[1] - a[1]).map(([round, ms]) => `
    <div class="pattern-pill"><strong>${roundLabel(round)}</strong><br>${formatDuration(ms)} 누적</div>`).join('');
}

function renderPatternReport(sessions) {
  const el = $('#patternReport');
  if (!sessions.length) {
    el.innerHTML = '<p class="muted">기록이 쌓이면 집중 시간대와 패턴이 표시됩니다.</p>';
    return;
  }
  const hourMap = new Map();
  sessions.forEach((session) => {
    const hour = new Date(session.startAt).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + sessionDuration(session));
  });
  const [bestHour, bestMs] = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const totalMs = sessions.reduce((sum, s) => sum + sessionDuration(s), 0);
  const avgMs = totalMs / sessions.length;
  const focused = sessions.filter((s) => s.mood === 'focused').length;
  el.innerHTML = `
    <div class="pattern-pill"><strong>${String(bestHour).padStart(2, '0')}:00대</strong><br>가장 집중 시간이 많았습니다. ${formatDuration(bestMs)}</div>
    <div class="pattern-pill"><strong>${formatDuration(avgMs)}</strong><br>평균 세션 길이입니다.</div>
    <div class="pattern-pill"><strong>${Math.round((focused / sessions.length) * 100)}%</strong><br>집중으로 기록한 세션 비율입니다.</div>`;
}

function renderSettings() {
  $('#targetHours').value = data.settings.dailyTargetHours;
  $('#soundToggle').checked = !!data.settings.sound;
  $('#autoReflectionToggle').checked = !!data.settings.autoReflection;
  const examInput = $('#examDateInput');
  if (examInput) examInput.value = data.settings.examDate || '';

  const github = data.settings.githubBackup || DEFAULT_DATA.settings.githubBackup;
  const setValue = (selector, value) => { const el = $(selector); if (el) el.value = value || ''; };
  const setChecked = (selector, value) => { const el = $(selector); if (el) el.checked = !!value; };
  setChecked('#githubBackupEnabled', github.enabled);
  setChecked('#githubAutoOnSessionEnd', github.autoOnSessionEnd);
  setValue('#githubOwner', github.owner);
  setValue('#githubRepo', github.repo);
  setValue('#githubBranch', github.branch || 'main');
  setValue('#githubPath', github.path || 'data/focusmanager_backup.json');
  setValue('#githubToken', github.token);
  const githubStatus = $('#githubBackupStatus');
  if (githubStatus) githubStatus.innerHTML = githubStatusText(github);

  const firstId = data.categories[0]?.id;
  $('#categoryEditor').innerHTML = data.categories.map((cat) => `
    <div class="category-edit-row">
      <span class="color-dot" style="background:${cat.color}"></span>
      <span>${escapeHtml(cat.name)}<small class="phase-tag">${escapeHtml(cat.phase || '기타')}</small></span>
      <button class="link-button" data-remove-category="${cat.id}" ${cat.id === firstId ? 'disabled' : ''}>삭제</button>
    </div>`).join('');
}

function renderSuggestions() {
  const list = $('#intentionSuggestions');
  const titles = Array.from(new Set(completedSessions().map((s) => s.title).filter(Boolean))).slice(-5).reverse();
  list.innerHTML = titles.map((title) => `<button data-suggestion="${escapeAttr(title)}">${escapeHtml(title)}</button>`).join('');
}

function startSession() {
  if (data.activeSession) {
    switchView('session');
    return;
  }
  const title = $('#intentionInput').value.trim() || '제목 없는 세션';
  const categoryId = $('#categorySelect').value || data.categories[0].id;
  const sessionType = normalizeStudyType($('#sessionTypeSelect').value);
  const round = normalizeRound($('#roundSelect').value);
  const part = $('#partInput').value.trim();
  data.activeSession = {
    id: `s_${Date.now()}`,
    title,
    categoryId,
    sessionType,
    round,
    part,
    targetMinutes: selectedPresetMinutes,
    startAt: new Date().toISOString(),
    endAt: null,
    pauses: [],
    isPaused: false,
    mood: selectedMood,
    note: '',
    status: 'active',
  };
  saveData('세션 시작');
  renderAll();
  switchView('session');
  toast('세션을 시작했습니다.');
}

function togglePause() {
  const session = data.activeSession;
  if (!session) return startSession();
  const now = new Date().toISOString();
  if (session.isPaused) {
    const lastPause = session.pauses[session.pauses.length - 1];
    if (lastPause && !lastPause.end) lastPause.end = now;
    session.isPaused = false;
    saveData('세션 재개');
    toast('세션을 재개했습니다.');
  } else {
    session.pauses.push({ start: now, end: null });
    session.isPaused = true;
    saveData('세션 일시정지');
    toast('세션을 일시정지했습니다.');
  }
  renderAll();
}

function finishSession() {
  const session = data.activeSession;
  if (!session) return;
  const now = new Date().toISOString();
  if (session.isPaused) {
    const lastPause = session.pauses[session.pauses.length - 1];
    if (lastPause && !lastPause.end) lastPause.end = now;
  }
  session.endAt = now;
  session.status = 'completed';
  session.isPaused = false;
  session.mood = selectedMood;
  session.note = $('#reflectionNote').value.trim();
  if (session.linkedPlanId) {
    const plan = data.plans.find((item) => item.id === session.linkedPlanId);
    if (plan) {
      plan.status = 'completed';
      plan.linkedSessionId = session.id;
      plan.completedAt = now;
    }
  }
  data.sessions.push(session);
  data.activeSession = null;
  $('#reflectionNote').value = '';
  $('#partInput').value = '';
  saveData('세션 종료');
  if (data.settings.sound) playDing();
  renderAll();
  switchView('dashboard');
  toast('세션 기록을 저장했습니다.');
  queueAutoGitHubBackup();
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.38);
  } catch (error) {
    console.warn('Audio unavailable', error);
  }
}

function applySettingsFromForm() {
  const target = Number($('#targetHours').value);
  data.settings.dailyTargetHours = Number.isFinite(target) ? Math.max(0.5, Math.min(16, target)) : 6;
  data.settings.sound = $('#soundToggle').checked;
  data.settings.autoReflection = $('#autoReflectionToggle').checked;
  data.settings.weeklyTargetHours = Number.isFinite(Number(data.settings.weeklyTargetHours)) ? data.settings.weeklyTargetHours : DEFAULT_DATA.settings.weeklyTargetHours;
  data.settings.categoryGoals = data.settings.categoryGoals || { daily: {}, weekly: {} };
  const examDateInput = $('#examDateInput')?.value;
  data.settings.examDate = examDateInput || null;

  const currentGithub = data.settings.githubBackup || structuredClone(DEFAULT_DATA.settings.githubBackup);
  data.settings.githubBackup = {
    ...structuredClone(DEFAULT_DATA.settings.githubBackup),
    ...currentGithub,
    enabled: !!$('#githubBackupEnabled')?.checked,
    autoOnSessionEnd: !!$('#githubAutoOnSessionEnd')?.checked,
    owner: $('#githubOwner')?.value.trim() || '',
    repo: $('#githubRepo')?.value.trim() || '',
    branch: $('#githubBranch')?.value.trim() || 'main',
    path: $('#githubPath')?.value.trim() || 'data/focusmanager_backup.json',
    token: $('#githubToken')?.value.trim() || '',
  };
}

function saveSettings() {
  applySettingsFromForm();
  saveData('설정 저장');
  renderAll();
  toast('설정을 저장했습니다.');
}

function dDayInfo() {
  if (!data.settings.examDate) return null;
  const today = new Date(`${todayKey()}T00:00:00`);
  const target = new Date(`${data.settings.examDate}T00:00:00`);
  const diffDays = Math.round((target - today) / 86400000);
  return { diffDays, label: diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-DAY' : `D+${Math.abs(diffDays)}` };
}

function addCategory() {
  const name = $('#newCategoryName').value.trim();
  const color = $('#newCategoryColor').value || '#c9a227';
  const phase = $('#newCategoryPhase')?.value || '기타';
  if (!name) return toast('카테고리명을 입력하세요.');
  const id = `cat_${Date.now()}`;
  data.categories.push({ id, name, color, phase });
  $('#newCategoryName').value = '';
  saveData('카테고리 추가');
  renderAll();
  toast('카테고리를 추가했습니다.');
}

function removeCategory(id) {
  const fallbackId = data.categories[0]?.id;
  if (id === fallbackId) return;
  const used = data.sessions.some((s) => s.categoryId === id) || data.activeSession?.categoryId === id;
  if (used && !confirm(`이미 사용된 카테고리입니다. 삭제하면 해당 기록이 "${getCategory(fallbackId).name}" 카테고리로 이동합니다. 계속할까요?`)) return;
  data.sessions.forEach((s) => { if (s.categoryId === id) s.categoryId = fallbackId; });
  (data.plans || []).forEach((plan) => { if (plan.categoryId === id) plan.categoryId = fallbackId; });
  if (data.activeSession?.categoryId === id) data.activeSession.categoryId = fallbackId;
  if (data.settings.categoryGoals) {
    delete data.settings.categoryGoals.daily?.[id];
    delete data.settings.categoryGoals.weekly?.[id];
  }
  data.categories = data.categories.filter((cat) => cat.id !== id);
  saveData('카테고리 삭제');
  renderAll();
  toast('카테고리를 삭제했습니다.');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(makeBackupEnvelope(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focusmanager-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    const currentGithub = data.settings.githubBackup;
    data = normalizeImportedData(imported);
    data.settings.githubBackup = {
      ...DEFAULT_DATA.settings.githubBackup,
      ...currentGithub,
      lastRestoreAt: new Date().toISOString(),
      lastStatus: 'JSON 백업 복원 완료',
    };
    saveData('백업 복원');
    renderAll();
    toast('백업을 복원했습니다.');
  } catch (error) {
    console.error(error);
    toast('복원 파일을 확인해주세요.');
  }
}

function githubStatusText(github) {
  const lines = [];
  lines.push(`<strong>${escapeHtml(github.lastStatus || 'GitHub 백업 미설정')}</strong>`);
  if (github.lastBackupAt) lines.push(`마지막 백업: ${escapeHtml(formatDateTime(github.lastBackupAt))}`);
  if (github.lastRestoreAt) lines.push(`마지막 복원: ${escapeHtml(formatDateTime(github.lastRestoreAt))}`);
  if (!github.token) lines.push('토큰은 이 기기 localStorage에만 저장됩니다. GitHub 백업 파일에는 포함하지 않습니다.');
  return lines.map((line) => `<span>${line}</span>`).join('');
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function githubConfig() {
  const github = data.settings.githubBackup || DEFAULT_DATA.settings.githubBackup;
  return {
    ...github,
    owner: (github.owner || '').trim(),
    repo: (github.repo || '').trim(),
    branch: (github.branch || 'main').trim(),
    path: (github.path || 'data/focusmanager_backup.json').trim().replace(/^\/+/, ''),
    token: (github.token || '').trim(),
  };
}

function validateGithubConfig(config, needToken = true) {
  if (!config.owner || !config.repo || !config.branch || !config.path) throw new Error('GitHub owner/repo/branch/path 설정이 필요합니다.');
  if (needToken && !config.token) throw new Error('GitHub fine-grained token 또는 classic token이 필요합니다.');
}

function githubContentsUrl(config) {
  const path = config.path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${path}`;
}

async function githubApi(url, options = {}, config = githubConfig()) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {}),
  };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;
  if (options.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `GitHub API 오류: ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function toBase64Unicode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64Unicode(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function setGithubStatus(status) {
  data.settings.githubBackup = {
    ...DEFAULT_DATA.settings.githubBackup,
    ...(data.settings.githubBackup || {}),
    lastStatus: status,
  };
  const el = $('#githubBackupStatus');
  if (el) el.innerHTML = githubStatusText(data.settings.githubBackup);
}

async function backupToGitHub(manual = true) {
  applySettingsFromForm();
  const config = githubConfig();
  try {
    validateGithubConfig(config, true);
    setGithubStatus('GitHub 백업 중...');
    const url = githubContentsUrl(config);
    let sha = null;
    try {
      const current = await githubApi(`${url}?ref=${encodeURIComponent(config.branch)}`, {}, config);
      sha = current.sha || null;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const body = {
      message: `FocusManager backup ${new Date().toISOString()}`,
      branch: config.branch,
      content: toBase64Unicode(JSON.stringify(makeBackupEnvelope(), null, 2)),
      ...(sha ? { sha } : {}),
    };
    await githubApi(url, { method: 'PUT', body: JSON.stringify(body) }, config);
    data.settings.githubBackup.lastBackupAt = new Date().toISOString();
    data.settings.githubBackup.lastStatus = manual ? 'GitHub 수동 백업 완료' : '세션 종료 자동 백업 완료';
    saveData(manual ? 'GitHub 백업 완료' : '자동 백업 완료');
    renderSettings();
    toast(manual ? 'GitHub 백업을 완료했습니다.' : '세션 종료 자동 백업 완료');
  } catch (error) {
    console.error(error);
    data.settings.githubBackup.lastStatus = `GitHub 백업 실패: ${error.message}`;
    saveData('GitHub 백업 실패');
    renderSettings();
    if (manual) toast('GitHub 백업 설정을 확인해주세요.');
  }
}

async function restoreFromGitHub() {
  applySettingsFromForm();
  const config = githubConfig();
  try {
    validateGithubConfig(config, false);
    if (!confirm('GitHub 백업 데이터로 현재 기록을 덮어쓸까요? 현재 기기의 GitHub 설정은 유지됩니다.')) return;
    setGithubStatus('GitHub 복원 중...');
    const url = `${githubContentsUrl(config)}?ref=${encodeURIComponent(config.branch)}`;
    const file = await githubApi(url, {}, config);
    const imported = JSON.parse(fromBase64Unicode(file.content));
    const currentGithub = data.settings.githubBackup;
    data = normalizeImportedData(imported);
    data.settings.githubBackup = {
      ...DEFAULT_DATA.settings.githubBackup,
      ...currentGithub,
      lastRestoreAt: new Date().toISOString(),
      lastStatus: 'GitHub 백업 복원 완료',
    };
    saveData('GitHub 복원');
    renderAll();
    toast('GitHub 백업을 복원했습니다.');
  } catch (error) {
    console.error(error);
    data.settings.githubBackup.lastStatus = `GitHub 복원 실패: ${error.message}`;
    saveData('GitHub 복원 실패');
    renderSettings();
    toast('GitHub 복원 설정을 확인해주세요.');
  }
}

function clearGithubToken() {
  data.settings.githubBackup = {
    ...DEFAULT_DATA.settings.githubBackup,
    ...(data.settings.githubBackup || {}),
    token: '',
    lastStatus: 'GitHub 토큰 삭제됨',
  };
  const tokenInput = $('#githubToken');
  if (tokenInput) tokenInput.value = '';
  saveData('GitHub 토큰 삭제');
  renderSettings();
  toast('GitHub 토큰을 삭제했습니다.');
}

function queueAutoGitHubBackup() {
  const github = data.settings.githubBackup || {};
  if (!github.enabled || !github.autoOnSessionEnd || !github.owner || !github.repo || !github.token) return;
  backupToGitHub(false);
}

function resetData() {
  if (!confirm('모든 세션 기록과 설정을 초기화할까요?')) return;
  data = structuredClone(DEFAULT_DATA);
  saveData('초기화');
  renderAll();
  toast('데이터를 초기화했습니다.');
}


function normalizeStudyType(type) {
  return STUDY_TYPE_LABELS[type] ? type : 'theory';
}

function normalizeRound(round) {
  return ROUND_LABELS[round] ? round : 'none';
}

function studyTypeLabel(type) {
  return STUDY_TYPE_LABELS[normalizeStudyType(type)];
}

function roundLabel(round) {
  return ROUND_LABELS[normalizeRound(round)];
}

function sessionMetaParts(session) {
  const parts = [studyTypeLabel(session.sessionType)];
  const round = normalizeRound(session.round);
  if (round !== 'none') parts.push(roundLabel(round));
  if (session.part) parts.push(session.part);
  return parts;
}

function sessionMetaText(session) {
  return sessionMetaParts(session).join(' · ');
}

function sessionMetaHtml(session) {
  return sessionMetaParts(session).map((part) => escapeHtml(part)).join(' · ');
}

function sessionMetaBadges(session) {
  return sessionMetaParts(session).map((part) => `<span class="meta-badge">${escapeHtml(part)}</span>`).join('');
}

function moodLabel(mood) {
  return ({ focused: '집중', neutral: '보통', distracted: '산만' })[mood] || '보통';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function openEditModal(id) {
  const session = data.sessions.find((s) => s.id === id);
  if (!session) return;
  editingSessionId = id;
  $('#editTitle').value = session.title || '';
  renderEditCategoryOptions(session.categoryId);
  $('#editSessionType').value = normalizeStudyType(session.sessionType);
  $('#editRound').value = normalizeRound(session.round);
  $('#editPart').value = session.part || '';
  $$('#editMoodRow .mood').forEach((btn) => btn.classList.toggle('active', btn.dataset.editMood === (session.mood || 'neutral')));
  $('#editNote').value = session.note || '';
  $('#editModal').hidden = false;
}

function closeEditModal() {
  $('#editModal').hidden = true;
  editingSessionId = null;
}

function renderEditCategoryOptions(selectedId) {
  const select = $('#editCategory');
  const groups = new Map();
  data.categories.forEach((cat) => {
    const key = cat.phase || '기타';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cat);
  });
  select.innerHTML = Array.from(groups.entries()).map(([phase, cats]) => `
    <optgroup label="${escapeAttr(phase)}">
      ${cats.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
    </optgroup>`).join('');
  select.value = selectedId;
}

function saveSessionEdit() {
  const session = data.sessions.find((s) => s.id === editingSessionId);
  if (!session) return;
  session.title = $('#editTitle').value.trim() || '제목 없는 세션';
  session.categoryId = $('#editCategory').value || session.categoryId;
  session.sessionType = normalizeStudyType($('#editSessionType').value);
  session.round = normalizeRound($('#editRound').value);
  session.part = $('#editPart').value.trim();
  const activeMoodBtn = $('#editMoodRow .mood.active');
  session.mood = activeMoodBtn ? activeMoodBtn.dataset.editMood : session.mood;
  session.note = $('#editNote').value.trim();
  saveData('세션 수정');
  closeEditModal();
  renderAll();
  toast('세션 기록을 수정했습니다.');
}

function deleteSessionRecord() {
  if (!editingSessionId) return;
  if (!confirm('이 세션 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
  data.sessions = data.sessions.filter((s) => s.id !== editingSessionId);
  (data.plans || []).forEach((plan) => {
    if (plan.linkedSessionId === editingSessionId) {
      plan.linkedSessionId = null;
      plan.completedAt = null;
      plan.status = 'planned';
    }
  });
  saveData('세션 삭제');
  closeEditModal();
  renderAll();
  toast('세션 기록을 삭제했습니다.');
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-view]');
    if (nav) switchView(nav.dataset.view);

    const jump = event.target.closest('[data-jump]');
    if (jump) switchView(jump.dataset.jump);

    const suggestion = event.target.closest('[data-suggestion]');
    if (suggestion && !data.activeSession) $('#intentionInput').value = suggestion.dataset.suggestion;

    const removeBtn = event.target.closest('[data-remove-category]');
    if (removeBtn && !removeBtn.disabled) removeCategory(removeBtn.dataset.removeCategory);

    const editTrigger = event.target.closest('[data-edit-session]');
    if (editTrigger) openEditModal(editTrigger.dataset.editSession);

    const startPlanBtn = event.target.closest('[data-start-plan]');
    if (startPlanBtn && !startPlanBtn.disabled) startPlanSession(startPlanBtn.dataset.startPlan);

    const fillPlanBtn = event.target.closest('[data-fill-plan]');
    if (fillPlanBtn && !fillPlanBtn.disabled) fillSessionFromPlan(fillPlanBtn.dataset.fillPlan);

    const deletePlanBtn = event.target.closest('[data-delete-plan]');
    if (deletePlanBtn) deletePlan(deletePlanBtn.dataset.deletePlan);

    const editMoodBtn = event.target.closest('[data-edit-mood]');
    if (editMoodBtn) {
      $$('#editMoodRow .mood').forEach((item) => item.classList.remove('active'));
      editMoodBtn.classList.add('active');
    }

    if (event.target.closest('#editSaveBtn')) saveSessionEdit();
    if (event.target.closest('#editCancelBtn')) closeEditModal();
    if (event.target.closest('#editCloseBtn')) closeEditModal();
    if (event.target.closest('#editDeleteBtn')) deleteSessionRecord();
    if (event.target.id === 'editModal') closeEditModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#editModal').hidden) closeEditModal();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-edit-session]')) {
      event.preventDefault();
      openEditModal(event.target.dataset.editSession);
    }
  });

  $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chip').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    selectedPresetMinutes = Number(chip.dataset.minutes || 0);
  }));

  $$('.mood').forEach((mood) => {
    if (mood.dataset.editMood) return;
    mood.addEventListener('click', () => {
      $$('.mood').forEach((item) => { if (!item.dataset.editMood) item.classList.remove('active'); });
      mood.classList.add('active');
      selectedMood = mood.dataset.mood;
    });
  });

  $('#quickSessionBtn').addEventListener('click', () => switchView('session'));
  $('#dashboardStartBtn').addEventListener('click', () => data.activeSession ? switchView('session') : startSession());
  $('#dashboardEndBtn').addEventListener('click', finishSession);
  $('#startPauseBtn').addEventListener('click', () => data.activeSession ? togglePause() : startSession());
  $('#finishSessionBtn').addEventListener('click', finishSession);
  $('#timelineDate').addEventListener('change', renderTimeline);
  $('#plannerDate')?.addEventListener('change', renderPlanner);
  $('#savePlannerGoalsBtn')?.addEventListener('click', savePlannerGoals);
  $('#addPlanBtn')?.addEventListener('click', addPlan);
  $('#reportRange').addEventListener('change', renderReports);
  $('#saveSettingsBtn').addEventListener('click', saveSettings);
  $('#addCategoryBtn').addEventListener('click', addCategory);
  $('#exportBtn').addEventListener('click', exportBackup);
  $('#importFile').addEventListener('change', (event) => importBackup(event.target.files[0]));
  $('#githubBackupBtn')?.addEventListener('click', () => backupToGitHub(true));
  $('#githubRestoreBtn')?.addEventListener('click', restoreFromGitHub);
  $('#clearGithubTokenBtn')?.addEventListener('click', clearGithubToken);
  $('#resetBtn').addEventListener('click', resetData);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#installBtn').hidden = true;
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker failed', error));
  }
}

function init() {
  bindEvents();
  registerServiceWorker();
  startTicker();
  startFloatingClock();
  renderAll();
}

init();
