const STORAGE_KEY = 'focus_manager_v1';
const DEFAULT_DATA = {
  version: '1.0.0',
  settings: {
    dailyTargetHours: 6,
    sound: true,
    autoReflection: true,
  },
  categories: [
    { id: 'study', name: '공부', color: '#ef4e4e' },
    { id: 'work', name: '작업', color: '#31d464' },
    { id: 'reading', name: '독서', color: '#f4a340' },
    { id: 'research', name: '리서치', color: '#9acd32' },
    { id: 'break', name: '휴식', color: '#7d7d7d' },
  ],
  sessions: [],
  activeSession: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let data = loadData();
let currentView = 'dashboard';
let selectedPresetMinutes = 25;
let selectedMood = 'focused';
let tickTimer = null;
let deferredPrompt = null;

const pageTitles = {
  dashboard: '대시보드',
  session: '세션',
  timeline: '타임라인',
  reports: '리포트',
  settings: '설정',
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_DATA.categories,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      activeSession: parsed.activeSession || null,
    };
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

function startTicker() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (data.activeSession) {
      renderActiveSession();
      renderDashboard(false);
    }
  }, 1000);
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
  renderReports();
  renderSettings();
  renderSuggestions();
  if (showToast) toast('화면을 업데이트했습니다.');
}

function renderCategorySelects() {
  const select = $('#categorySelect');
  if (!select) return;
  const current = select.value || data.activeSession?.categoryId || 'study';
  select.innerHTML = data.categories.map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
  select.value = data.categories.some((cat) => cat.id === current) ? current : data.categories[0]?.id;
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

  const active = data.activeSession;
  $('#nowSessionTitle').textContent = active ? active.title || '제목 없는 세션' : '진행 중인 세션 없음';
  $('#nowSessionMeta').textContent = active ? `${getCategory(active.categoryId).name} · ${active.isPaused ? '일시정지' : '진행 중'}` : '세션 화면에서 오늘의 의도를 입력하고 시작하세요.';
  $('#dashboardTimer').textContent = active ? formatDuration(sessionDuration(active), false) : '00:00:00';
  $('#dashboardStartBtn').textContent = active ? '세션으로 이동' : '세션 시작';
  $('#dashboardEndBtn').hidden = !active;

  renderMiniTimeline(todaySessions);
  renderRecentSessions();
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
      <div class="name">${escapeHtml(session.title || '제목 없는 세션')}</div>
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
      <strong>${escapeHtml(session.title || '제목 없는 세션')}</strong>
      <span>${todayKey(new Date(session.startAt))} · ${cat.name} · ${formatDuration(sessionDuration(session))} · ${moodLabel(session.mood)}</span>
    </article>`;
  }).join('');
}

function renderActiveSession() {
  const session = data.activeSession;
  const timerText = session ? formatDuration(sessionDuration(session), false) : '00:00:00';
  $('#sessionTimer').textContent = timerText;
  $('#sessionStateText').textContent = session ? (session.isPaused ? '일시정지 중' : '진행 중') : '대기 중';
  $('#startPauseBtn').textContent = session ? (session.isPaused ? 'RESUME SESSION' : 'PAUSE SESSION') : 'START SESSION';
  $('#finishSessionBtn').hidden = !session;
  $('#intentionInput').disabled = !!session;
  $('#categorySelect').disabled = !!session;
  $('#reflectionNote').disabled = !session;
  $('#activeSummary').innerHTML = session ? activeSummaryHtml(session) : '세션을 시작하면 요약이 표시됩니다.';

  if (session) {
    $('#intentionInput').value = session.title || '';
    $('#categorySelect').value = session.categoryId;
  }
  updateDialProgress(session);
}

function activeSummaryHtml(session) {
  const cat = getCategory(session.categoryId);
  const preset = session.targetMinutes ? `목표 ${session.targetMinutes}분` : '자유 세션';
  return `<strong>${escapeHtml(session.title || '제목 없는 세션')}</strong><br>
    ${cat.name} · ${preset}<br>
    시작 ${formatClock(new Date(session.startAt))} · 현재 ${formatDuration(sessionDuration(session))}<br>
    휴식 ${formatDuration(totalPausedMs(session))}`;
}

function updateDialProgress(session) {
  const circle = $('#dialProgress');
  const circumference = 552.92;
  if (!session || !session.targetMinutes) {
    circle.style.strokeDashoffset = session ? circumference * 0.22 : circumference;
    return;
  }
  const ratio = Math.min(1, sessionDuration(session) / (session.targetMinutes * 60000));
  circle.style.strokeDashoffset = String(circumference * (1 - ratio));
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
  return `<div class="timeline-block" style="top:${safeTop}px;height:${safeHeight}px;background:${cat.color}">
    <strong>${escapeHtml(session.title || '제목 없는 세션')}</strong>
    <span>${formatClock(start)} - ${session.endAt ? formatClock(end) : '진행 중'} · ${formatDuration(sessionDuration(session))}</span>
  </div>`;
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
  const maxMs = Math.max(1, ...Array.from(dailyMs.values()));
  $('#dailyChart').innerHTML = dayKeys.map((key) => {
    const ms = dailyMs.get(key) || 0;
    const date = new Date(`${key}T00:00:00`);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    return `<div class="day-bar">
      <div class="bar" style="height:${Math.max(4, (ms / maxMs) * 190)}px"></div>
      <span>${label}</span>
      <small>${formatDuration(ms)}</small>
    </div>`;
  }).join('');

  renderCategoryReport(sessions);
  renderPatternReport(sessions);
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
  $('#categoryEditor').innerHTML = data.categories.map((cat) => `
    <div class="category-edit-row">
      <span class="color-dot" style="background:${cat.color}"></span>
      <span>${escapeHtml(cat.name)}</span>
      <button class="link-button" data-remove-category="${cat.id}" ${cat.id === 'study' ? 'disabled' : ''}>삭제</button>
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
  data.activeSession = {
    id: `s_${Date.now()}`,
    title,
    categoryId,
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
  data.sessions.push(session);
  data.activeSession = null;
  $('#reflectionNote').value = '';
  saveData('세션 종료');
  if (data.settings.sound) playDing();
  renderAll();
  switchView('dashboard');
  toast('세션 기록을 저장했습니다.');
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

function saveSettings() {
  const target = Number($('#targetHours').value);
  data.settings.dailyTargetHours = Number.isFinite(target) ? Math.max(0.5, Math.min(16, target)) : 6;
  data.settings.sound = $('#soundToggle').checked;
  data.settings.autoReflection = $('#autoReflectionToggle').checked;
  saveData('설정 저장');
  renderAll();
  toast('설정을 저장했습니다.');
}

function addCategory() {
  const name = $('#newCategoryName').value.trim();
  const color = $('#newCategoryColor').value || '#ef4e4e';
  if (!name) return toast('카테고리명을 입력하세요.');
  const id = `cat_${Date.now()}`;
  data.categories.push({ id, name, color });
  $('#newCategoryName').value = '';
  saveData('카테고리 추가');
  renderAll();
  toast('카테고리를 추가했습니다.');
}

function removeCategory(id) {
  if (id === 'study') return;
  const used = data.sessions.some((s) => s.categoryId === id) || data.activeSession?.categoryId === id;
  if (used && !confirm('이미 사용된 카테고리입니다. 삭제하면 해당 기록이 공부 카테고리로 이동합니다. 계속할까요?')) return;
  data.sessions.forEach((s) => { if (s.categoryId === id) s.categoryId = 'study'; });
  if (data.activeSession?.categoryId === id) data.activeSession.categoryId = 'study';
  data.categories = data.categories.filter((cat) => cat.id !== id);
  saveData('카테고리 삭제');
  renderAll();
  toast('카테고리를 삭제했습니다.');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
    if (!Array.isArray(imported.sessions) || !Array.isArray(imported.categories)) throw new Error('invalid data');
    data = {
      ...structuredClone(DEFAULT_DATA),
      ...imported,
      settings: { ...DEFAULT_DATA.settings, ...(imported.settings || {}) },
    };
    saveData('백업 복원');
    renderAll();
    toast('백업을 복원했습니다.');
  } catch (error) {
    console.error(error);
    toast('복원 파일을 확인해주세요.');
  }
}

function resetData() {
  if (!confirm('모든 세션 기록과 설정을 초기화할까요?')) return;
  data = structuredClone(DEFAULT_DATA);
  saveData('초기화');
  renderAll();
  toast('데이터를 초기화했습니다.');
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
  });

  $$('.chip').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chip').forEach((item) => item.classList.remove('active'));
    chip.classList.add('active');
    selectedPresetMinutes = Number(chip.dataset.minutes || 0);
  }));

  $$('.mood').forEach((mood) => mood.addEventListener('click', () => {
    $$('.mood').forEach((item) => item.classList.remove('active'));
    mood.classList.add('active');
    selectedMood = mood.dataset.mood;
  }));

  $('#quickSessionBtn').addEventListener('click', () => switchView('session'));
  $('#dashboardStartBtn').addEventListener('click', () => data.activeSession ? switchView('session') : startSession());
  $('#dashboardEndBtn').addEventListener('click', finishSession);
  $('#startPauseBtn').addEventListener('click', () => data.activeSession ? togglePause() : startSession());
  $('#finishSessionBtn').addEventListener('click', finishSession);
  $('#timelineDate').addEventListener('change', renderTimeline);
  $('#reportRange').addEventListener('change', renderReports);
  $('#saveSettingsBtn').addEventListener('click', saveSettings);
  $('#addCategoryBtn').addEventListener('click', addCategory);
  $('#exportBtn').addEventListener('click', exportBackup);
  $('#importFile').addEventListener('change', (event) => importBackup(event.target.files[0]));
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
  renderAll();
}

init();
