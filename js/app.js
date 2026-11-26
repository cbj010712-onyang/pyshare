/* =====================================================================
   파이랩 · 화면
   화면은 주소 뒤 # 으로 바뀌어요
     #login   학생: 학번·이름·비밀번호 4자리 / 멘토: 멘토 비밀번호
     #home    홈 (학생: 이어서 할 주차·최근 코드 / 멘토: 대시보드)
     #mine    내 코드 (학생)        #friends 친구들 코드·완성작 (학생)
     #codes   모든 코드 (멘토)
     #p12     12번 프로젝트 (편집기 + 실행 결과 + 기록 + 피드백)
     #w3      3주차 화면 (활동지 + 이번 주 코드 / 멘토는 주차별 현황)
     #members 학생 관리 (멘토만)
   ===================================================================== */
'use strict';

/* ---------- 작은 도구 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mkStore = (area) => ({
  get(k) { try { return JSON.parse(window[area].getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { window[area].setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { window[area].removeItem(k); } catch (e) {} },
});
const LS = mkStore('localStorage'), SS = mkStore('sessionStorage');
const KEY_CODE = DEMO ? 'pyshare_demo_code' : 'pyshare_code';
const draftKey = (pid) => `pyshare_${DEMO ? 'demo_' : ''}draft_${S.me && S.me.id}_${pid}`;

const pad = (n) => String(n).padStart(2, '0');
function ago(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return '방금';
  if (s < 3600) return Math.floor(s / 60) + '분 전';
  if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  if (s < 172800) return '어제';
  const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
function when(iso) { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
const isWide = () => matchMedia('(min-width: 960px)').matches;
// 받침이 있으면 a(을·이·은), 없으면 b(를·가·는)
const josa = (w, a, b) => { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };
// 선 아이콘 (글자색을 따라가요)
const IC = {
  home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  code: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>',
  friends: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6M15.2 14.6c2.5-.4 4.5.9 5.3 3.6"/>',
  users: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5"/>',
  chart: '<path d="M5 20V10M12 20V5M19 20v-7"/>',
  down: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  data: '<path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14.5 3.5V8H19M9 12.5h7M9 16.5h7"/>',
};
const icon = (k) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ''}</svg>`;

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); toast('복사했어요'); }
  catch (e) {
    openModal(`<h2>복사하기</h2><p class="muted">아래 글을 길게 누르거나 Ctrl+C 로 복사해 주세요.</p>
      <textarea class="copybox" readonly rows="6">${esc(text)}</textarea>
      <div class="modal-actions"><button class="btn" data-close>닫기</button></div>`);
    const ta = $('.copybox'); ta.focus(); ta.select();
  }
}

/* ---------- 모달 · 서랍 ---------- */
let modalReturn = null;
function openModal(html, bind) {
  modalReturn = document.activeElement;
  $('#modalCard').innerHTML = html;
  $('#modal').hidden = false;
  $$('[data-close]', $('#modalCard')).forEach((b) => b.addEventListener('click', closeModal));
  bind && bind($('#modalCard'));
  const f = $('#modalCard').querySelector('input, textarea, select, button.primary, button');
  f && f.focus();
}
function closeModal() { $('#modal').hidden = true; $('#modalCard').innerHTML = ''; modalReturn && modalReturn.focus && modalReturn.focus(); }
$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });

function openDrawer(title, html, bind) {
  $('#drawerTitle').textContent = title;
  $('#drawerBody').innerHTML = html;
  $('#drawer').hidden = false; $('#scrim').hidden = false;
  bind && bind($('#drawerBody'));
  $('#drawerClose').focus();
}
function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; }
$('#drawerClose').addEventListener('click', closeDrawer);
$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#modal').hidden) closeModal(); else if (!$('#drawer').hidden) closeDrawer();
});

/* ---------- 상태 ---------- */
const S = { code: null, me: null, list: null, sheets: null, members: null, filter: 'all', wfilter: 'all', q: '', back: null, shareMode: 'final', P: null, loginMsg: '', seq: 0 };
const WEEKS = window.PYSHARE_WEEKS || [];
const FIELDS = window.PYSHARE_FIELDS || {};
const exOf = (wk, id) => ((weekOf(wk) || {}).examples || []).find((x) => x.id === id);
// 내 분야: 가장 최근에 쓴 활동지에서 고른 분야 (예: ['web'])
function myFields(sheets, upTo) {
  const xs = (sheets || []).filter((x) => x.week <= upTo && x.summary && (x.summary.fields || []).length).sort((a, b) => b.week - a.week);
  if (!xs.length) return [];
  return xs[0].summary.fields.map((name) => Object.keys(FIELDS).find((k) => FIELDS[k] === name)).filter(Boolean);
}
function todoHTML(w, doneSet, interactive) {
  return `<ol class="todo">${(w.todo || []).map((t, i) => `<li class="${doneSet.has(i) ? 'done' : ''}">
    ${interactive ? `<label class="tcheck" title="다 했으면 체크"><input type="checkbox" data-ti="${i}" ${doneSet.has(i) ? 'checked' : ''}><span class="tnum">${i + 1}</span></label>` : `<span class="tnum">${i + 1}</span>`}
    <div class="tbody"><b>${esc(t.t)}</b><p>${esc(t.d)}</p>
      ${t.sub ? `<ul>${t.sub.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${interactive && t.act === 'sheet' && w.sheet ? `<a class="btn tiny" href="${esc(w.sheet)}">활동지 열기 →</a>` : ''}
      ${interactive && t.act === 'code' && (w.examples || []).length ? `<button class="btn tiny" data-goex>예시 코드 보기 ↓</button>` : ''}
    </div></li>`).join('')}</ol>`;
}
function exampleCards(w, mineF, canStart) {
  const list = (w.examples || []).slice().sort((a, b) => (mineF.includes(b.field) ? 1 : 0) - (mineF.includes(a.field) ? 1 : 0));
  return `<div class="examples">${list.map((x) => `<div class="excard ${mineF.includes(x.field) ? 'mine' : ''}">
      <div class="ex-top"><span class="fbadge f-${esc(x.field)}">${esc(FIELDS[x.field] || x.field)}</span>${mineF.includes(x.field) ? '<span class="badge new">내 분야</span>' : ''}</div>
      <h3>${esc(x.title)}</h3><p class="desc">${esc(x.desc)}</p>
      ${(x.files || []).length ? `<p class="ex-files">${x.files.map((f) => `<span class="fchip">${icon('data')}${esc(f)}</span>`).join('')}<span class="muted small">예시 CSV를 읽어요</span></p>` : ''}
      <details><summary>코드 미리 보기 · ${x.code.split('\n').length}줄</summary><pre class="excode">${esc(x.code)}</pre></details>
      ${canStart ? `<button class="btn primary" data-ex="${esc(x.id)}">이 예시로 코드 시작</button>` : ''}
    </div>`).join('')}</div>`;
}
const weekOf = (n) => WEEKS.find((w) => w.no === Number(n));
const wtag = (n) => (n ? `<span class="wtag">${Number(n)}주차</span>` : '');
const weekOptions = (sel) => `<option value="">주차 없음 (자유)</option>` +
  WEEKS.map((w) => `<option value="${w.no}" ${Number(sel) === w.no ? 'selected' : ''}>${w.no}주차 · ${esc(w.title)}</option>`).join('');
function sheetState(x) {
  if (!x) return { cls: 'none', text: '아직 안 씀' };
  if (x.submitted_at) return { cls: 'done', text: '제출함 ' + when(x.submitted_at) };
  return { cls: 'draft', text: '작성 중 · ' + when(x.saved_at) };
}
// 학생이 이 주차를 끝냈는지: 활동지가 있는 주는 제출, 없는 주는 그 주 코드가 하나라도 있으면
function weekDone(w, L, sheets) {
  if (w.sheet) { const x = (sheets || []).find((s) => s.week === w.no); return !!(x && x.submitted_at); }
  return (L || []).some((p) => p.mine && p.week === w.no);
}
// 아직 안 끝난 첫 주차 (다 끝났으면 마지막 주차)
const currentWeek = (L, sheets) => WEEKS.find((w) => !weekDone(w, L, sheets)) || WEEKS[WEEKS.length - 1] || null;
const todoKey = (n) => `pyshare_${DEMO ? 'demo_' : ''}todo_${S.me.id}_${n}`;
const meter = (pct) => `<span class="meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span>`;
// 프로젝트 화면의 [←] 이 어디로 돌아갈지 (목록 또는 주차 화면)
const backTo = () => S.back || { href: '#home', label: '홈' };
// 친구 코드 공개 방법 (멘토가 정해요)
const SHARE_MODES = { all: '주차별 모두', final: '완성작만', none: '안 보임' };
const finalBadge = (p) => (p.final_no ? `<span class="badge final">★ 완성작 v${p.final_no}</span>` : '');
// 친구 완성작 카드: 코드 대신 웹앱으로 열려요
function appCard(p) {
  const q = [p.title, p.nickname, p.description].filter(Boolean).join(' ').toLowerCase();
  const inner = `<div class="app-thumb" aria-hidden="true"><span>${esc((p.title || '?').trim().slice(0, 1))}</span></div>
    <div class="card-top"><span class="nick">${esc(p.nickname)}</span>${finalBadge(p).replace(/ v\d+/, '')}</div>
    <h3>${esc(p.title)}</h3>${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
    <div class="meta">${wtag(p.week)}<span class="grow"></span>${p.has_webapp ? '<b class="go">웹앱 열기 →</b>' : '<span>웹앱 준비 중…</span>'}</div>`;
  return p.has_webapp ? `<a class="card appcard" href="#a${p.id}" data-q="${esc(q)}">${inner}</a>`
    : `<div class="card appcard wait" data-q="${esc(q)}" title="멘토가 웹앱을 만들고 있어요">${inner}</div>`;
}
async function loadShareMode() { try { S.shareMode = (await call('cs_share_mode')).mode || 'final'; } catch (e) { if (!e.message) throw e; } return S.shareMode; }

// 서버 부르기 + 로그인 풀림 처리
async function call(fn, args = {}) {
  try { return await rpc(fn, { p_code: S.code, ...args }); }
  catch (e) {
    if (e.user && /다시 로그인해 주세요/.test(e.message)) {
      logout('로그인이 풀렸어요. 비밀번호가 초기화됐거나 쉬는 중일 수 있어요. 다시 들어와 주세요.');
      throw new ApiError('', true);
    }
    throw e;
  }
}
const showErr = (e) => { if (e && e.message) toast(e.message, 'bad'); };

function logout(msg) {
  if (S.P && S.P.dirty && !confirmLeave()) return;
  LS.del(KEY_CODE); SS.del(KEY_CODE);
  S.code = null; S.me = null; S.list = null; S.sheets = null; S.members = null; S.loginMsg = msg || '';
  S.q = ''; S.back = null; S.filter = 'all'; S.wfilter = 'all';
  loginMode = 'student';   // 공용 컴퓨터에서 다음 사람이 바로 학생 칸을 보게
  disposeProject();
  if (location.hash !== '#login') location.hash = '#login'; else route();
}
const confirmLeave = () => true;   // 저장 안 한 코드는 이 기기 임시 저장으로 남아요

/* ---------- 위쪽 막대 ---------- */
function renderTop() {
  const r = $('#topRight');
  if (!S.me) { r.innerHTML = DEMO ? '<span class="pill demo">체험 모드</span>' : ''; return; }
  const mentor = S.me.role === 'mentor';
  r.innerHTML = `
    ${DEMO ? '<span class="pill demo">체험 모드</span>' : ''}
    <span class="pill who ${mentor ? 'mentor' : ''}">${mentor ? '멘토' : esc(S.me.nickname)}</span>
    <button class="btn ghost small" id="logoutBtn">나가기</button>`;
  $('#logoutBtn').addEventListener('click', () => logout());
}

/* ---------- 길 찾기 ---------- */
function route() {
  const h = location.hash.slice(1);
  const pm = /^p(\d+)$/.exec(h), am = /^a(\d+)$/.exec(h);
  if (S.P && (!pm || Number(pm[1]) !== S.P.id)) disposeProject();
  closeDrawer(); closeSide(); if (!$('#modal').hidden) closeModal();
  document.body.classList.remove('wa-lock');
  // 코드·웹앱 화면은 넓게 쓰려고 왼쪽 메뉴를 접어요 (☰ 로 열기)
  document.body.classList.toggle('focus', !!(pm || am));
  S.seq++;
  renderTop();
  renderSide();
  if (!S.me) return viewLogin();
  if (h === 'members' && S.me.role === 'mentor') return viewMembers();
  if (pm) { if (!S.P) viewProject(Number(pm[1])); return; }
  if (am) return viewWebapp(Number(am[1]));
  const wm = /^w(\d+)$/.exec(h);
  if (wm && weekOf(wm[1])) return viewWeek(Number(wm[1]));
  return viewHome(TABS[h] ? h : 'home');
}

/* =====================================================================
   1) 로그인
   ===================================================================== */
let loginMode = 'student';
function viewLogin() {
  document.title = '파이랩 · 온양고 파이썬 멘토링';
  const journey = WEEKS.map((w) => `<li><span class="jn">${w.no}주차</span><span class="jt">${esc(w.title)}</span></li>`).join('');
  $('#app').innerHTML = `
  <section class="login">
    <div class="login-intro">
      <p class="eyebrow">고1 AI 프로젝트 멘토링</p>
      <h1>내가 정한 주제로<br>파이썬 프로젝트를 끝까지</h1>
      <p class="lead">파이랩에서 주차별 활동지를 쓰고, 코드를 저장하고 실행해요. 멘토 피드백을 받으며 고쳐서 발표회에서 보여 줘요.</p>
    </div>
    <div class="login-card">
      <h2 class="login-title">들어가기</h2>
      <div class="tabs" role="tablist" aria-label="누가 들어오나요">
        <button type="button" role="tab" data-mode="student">학생</button>
        <button type="button" role="tab" data-mode="mentor">멘토</button>
      </div>
      <form id="loginForm" novalidate>
        <div id="stuFields">
          <div class="two">
            <div><label for="sidIn">학번</label><input id="sidIn" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="10101"></div>
            <div><label for="nameIn">이름</label><input id="nameIn" autocomplete="off" maxlength="20" placeholder="김민수"></div>
          </div>
          <label for="pinIn">비밀번호 4자리</label>
          <input id="pinIn" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="숫자 4자리">
          <div id="pin2Wrap" hidden>
            <p class="first-note"><b id="firstName"></b>, 처음 왔네요! 방금 적은 4자리가 내 비밀번호가 돼요. 확인을 위해 한 번 더 적어 주세요.</p>
            <label for="pin2In">비밀번호 한 번 더</label>
            <input id="pin2In" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="숫자 4자리">
          </div>
        </div>
        <div id="menFields" hidden>
          <label for="mpwIn">멘토 비밀번호</label>
          <div class="pw-row">
            <input id="mpwIn" type="password" autocomplete="off" spellcheck="false">
            <button type="button" class="btn ghost small" id="peek" aria-pressed="false">보기</button>
          </div>
        </div>
        <label class="check"><input type="checkbox" id="keep" checked> 이 기기에서 계속 로그인</label>
        <button class="btn primary big" id="loginBtn">들어가기</button>
        <p class="form-err" id="loginErr" role="alert">${esc(S.loginMsg)}</p>
      </form>
      <p class="login-note">학생 명단은 멘토가 미리 등록해요. 처음 들어올 때 비밀번호 4자리를 정하고, 잊으면 멘토가 초기화해 줘요.
        학교 공용 컴퓨터에서는 <b>계속 로그인</b>을 끄고, 다 쓰면 <b>나가기</b>를 눌러요.</p>
      ${DEMO ? `<div class="demo-box"><b>체험 모드</b> · 이 브라우저에만 저장돼요<br>
        학생: <code>10101 김민트</code> 비밀번호 <code>1111</code> · <code>10102 이감자</code> <code>2222</code><br>
        처음 들어오는 학생: <code>10103 박새싹</code> (비밀번호를 정해 봐요)<br>
        멘토: <code>${esc(MockDB.MENTOR)}</code></div>` : ''}
    </div>
    <div class="login-more">
      ${WEEKS.length ? `<div class="journey-box"><p class="jh">${WEEKS[0].no}주차부터 ${WEEKS[WEEKS.length - 1].no}주차까지 이렇게 해요</p><ol class="journey">${journey}</ol></div>` : ''}
      <ul class="login-points">
        <li><span class="lp-ic" aria-hidden="true">▶</span><div><b>설치 없이 바로 실행</b><span>브라우저에서 파이썬이 돌아가요. CSV 데이터도 읽을 수 있어요.</span></div></li>
        <li><span class="lp-ic" aria-hidden="true">v2</span><div><b>저장할 때마다 버전 기록</b><span>v1, v2…로 쌓여서 언제든 예전 코드로 돌아가요.</span></div></li>
        <li><span class="lp-ic" aria-hidden="true">💬</span><div><b>멘토 피드백</b><span>버전마다 멘토가 조언을 남기고, 완성작은 웹앱이 돼요.</span></div></li>
      </ul>
    </div>
  </section>`;
  S.loginMsg = '';
  const err = (m) => { $('#loginErr').textContent = m; };
  const setMode = (mode) => {
    loginMode = mode;
    $$('.tabs [data-mode]').forEach((b) => { const on = b.dataset.mode === mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $('#stuFields').hidden = mode !== 'student'; $('#menFields').hidden = mode !== 'mentor';
    err('');
    (mode === 'student' ? $('#sidIn') : $('#mpwIn')).focus({ preventScroll: true });
  };
  $$('.tabs [data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  // 학번·이름을 바꾸면 "처음 왔어요" 칸은 닫아요
  const resetFirst = () => { $('#pin2Wrap').hidden = true; $('#pin2In').value = ''; $('#loginBtn').textContent = '들어가기'; };
  $('#sidIn').addEventListener('input', resetFirst); $('#nameIn').addEventListener('input', resetFirst);
  $$('.pin').forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, '').slice(0, 4); }));
  $('#peek').addEventListener('click', (e) => {
    const inp = $('#mpwIn'), show = inp.type === 'password'; inp.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? '가리기' : '보기'; e.currentTarget.setAttribute('aria-pressed', String(show));
  });
  const done = (token, me) => {
    S.code = token; S.me = me;
    ($('#keep').checked ? LS : SS).set(KEY_CODE, token);
    if (location.hash === '#login') location.hash = '#home'; else route();
  };
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); err('');
    const btn = $('#loginBtn');
    if (loginMode === 'mentor') {
      const pw = $('#mpwIn').value;
      if (!pw) { err('멘토 비밀번호를 적어 주세요.'); return; }
      btn.disabled = true;
      try {
        const me = await rpc('cs_login', { p_code: pw });
        if (me.role !== 'mentor') throw new ApiError('멘토 비밀번호가 맞지 않아요.', true);
        done(pw, me);
      } catch (x) { err(/다시 로그인/.test(x.message) ? '멘토 비밀번호가 맞지 않아요.' : x.message); btn.disabled = false; $('#mpwIn').select(); }
      return;
    }
    const sid = $('#sidIn').value.trim(), name = $('#nameIn').value.trim(), pin = $('#pinIn').value;
    const first = !$('#pin2Wrap').hidden, pin2 = $('#pin2In').value;
    if (!/^[0-9]{4,10}$/.test(sid)) { err('학번을 숫자로 적어 주세요. (예: 10101)'); $('#sidIn').focus(); return; }
    if (!name) { err('이름을 적어 주세요.'); $('#nameIn').focus(); return; }
    if (!/^[0-9]{4}$/.test(pin)) { err('비밀번호는 숫자 4자리예요.'); $('#pinIn').focus(); return; }
    if (first && !/^[0-9]{4}$/.test(pin2)) { err('비밀번호를 한 번 더 적어 주세요.'); $('#pin2In').focus(); return; }
    btn.disabled = true;
    try {
      const r = await rpc('cs_student_login', { p_sid: sid, p_name: name, p_pin: pin, p_pin2: first ? pin2 : null });
      btn.disabled = false;
      if (r.first) {
        $('#firstName').textContent = r.nickname; $('#pin2Wrap').hidden = false;
        btn.textContent = '비밀번호 정하고 들어가기'; $('#pin2In').focus(); return;
      }
      if (r.error) { err(r.error); $('#pinIn').value = ''; $('#pinIn').focus(); return; }
      done(r.token, { role: r.role, id: r.id, nickname: r.nickname, sid: r.sid });
    } catch (x) { err(x.message); btn.disabled = false; if (first) { $('#pin2In').value = ''; $('#pin2In').focus(); } }
  });
  setMode(loginMode);
}

/* =====================================================================
   2) 로그인 후: 왼쪽 메뉴 + 홈 / 내 코드 / 친구들 / (멘토) 대시보드·모든 코드
   ===================================================================== */
const TABS = { home: '홈', mine: '내 코드', friends: '친구들', codes: '모든 코드' };
const todayText = () => new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
const byRecent = (a, b) => new Date(b.updated_at) - new Date(a.updated_at);

// 왼쪽 메뉴: 넓은 화면에서는 늘 보이고, 좁은 화면·코드 화면에서는 ☰ 로 열어요
function renderSide() {
  const side = $('#side');
  if (!S.me) { side.hidden = true; side.innerHTML = ''; document.body.classList.remove('has-side', 'side-open'); return; }
  document.body.classList.add('has-side'); side.hidden = false;
  const mentor = S.me.role === 'mentor', h = location.hash.slice(1) || 'home';
  const L = S.list || [], sheets = S.sheets || [];
  const cur = (k) => (h === k ? ' aria-current="page"' : '');
  const num = (n, cls = '') => (n ? `<span class="side-num ${cls}">${n}</span>` : '');
  const link = (k, ic, label, extra = '') => `<a class="side-link" href="#${k}"${cur(k)}>${icon(ic)}<span class="sl-t">${label}</span>${extra}</a>`;
  let top;
  if (mentor) {
    top = link('home', 'chart', '대시보드') + link('codes', 'code', '모든 코드', num(L.length)) + link('members', 'users', '학생 관리');
  } else {
    const mine = L.filter((p) => p.mine), unseen = mine.reduce((s, p) => s + (p.unseen || 0), 0);
    top = `<button class="btn primary side-new" id="sideNew">${icon('plus')}<span>새 코드</span></button>`
      + link('home', 'home', '홈') + link('mine', 'code', '내 코드', unseen ? `<span class="side-num new" title="새 피드백">${unseen}</span>` : num(mine.length))
      + (S.shareMode === 'none' ? '' : link('friends', 'friends', S.shareMode === 'final' ? '친구들 완성작' : '친구들 코드', num(L.filter((p) => !p.mine).length)));
  }
  const wcur = !mentor && S.list ? currentWeek(L, sheets) : null;
  const weeks = WEEKS.map((w) => {
    const st = !mentor && S.list ? (weekDone(w, L, sheets) ? 'done' : wcur && wcur.no === w.no ? 'cur' : '') : '';
    return `<a class="side-wk ${st}" href="#w${w.no}"${cur('w' + w.no)}><span class="sw-dot" aria-hidden="true">${st === 'done' ? '✓' : w.no}</span>
      <span class="sw-t"><small>${w.no}주차${st === 'cur' ? ' · 지금' : st === 'done' ? ' · 끝' : ''}</small>${esc(w.title)}</span></a>`;
  }).join('');
  side.innerHTML = `<div class="side-sec">${top}</div>
    ${WEEKS.length ? `<div class="side-sec"><p class="side-h">주차별 활동</p><div class="side-weeks">${weeks}</div></div>` : ''}
    <div class="side-sec side-foot">
      ${mentor || L.some((p) => p.mine) || sheets.some((x) => x.submitted_at) ? `<button class="side-link" id="sideRes">${icon('down')}<span class="sl-t">${mentor ? '결과물 받기 (zip)' : '내 결과물 받기'}</span></button>` : ''}
      <p class="side-me">${mentor ? '멘토로 들어왔어요' : `${S.me.sid ? `<span class="sidtag">${esc(S.me.sid)}</span>` : ''}${esc(S.me.nickname)}`}</p>
    </div>`;
  $('#sideNew') && $('#sideNew').addEventListener('click', () => { closeSide(); newProjectModal(wcur ? wcur.no : ''); });
  $('#sideRes') && $('#sideRes').addEventListener('click', async () => {
    closeSide();
    try {
      if (mentor && !S.members) S.members = await call('cs_m_members');
      if (!S.sheets && WEEKS.length) S.sheets = await call(mentor ? 'cs_m_sheets' : 'cs_sheet_mine');
    } catch (e) { showErr(e); return; }
    resultsModal(mentor ? { sheets: S.sheets || [], members: S.members || [] } : { sheets: S.sheets || [] });
  });
}
function openSide() { document.body.classList.add('side-open'); $('#sideScrim').hidden = false; $('#navBtn').setAttribute('aria-expanded', 'true'); const a = $('#side a, #side button'); a && a.focus({ preventScroll: true }); }
function closeSide() { if (!document.body.classList.contains('side-open')) return; document.body.classList.remove('side-open'); $('#sideScrim').hidden = true; $('#navBtn').setAttribute('aria-expanded', 'false'); }
$('#navBtn').addEventListener('click', () => (document.body.classList.contains('side-open') ? closeSide() : openSide()));
$('#sideScrim').addEventListener('click', closeSide);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSide(); });

// 홈·내 코드·친구들·모든 코드
async function viewHome(tab = 'home') {
  const mentor = S.me.role === 'mentor', tok = S.seq;
  if (mentor && (tab === 'mine' || tab === 'friends')) tab = 'home';
  if (!mentor && tab === 'codes') tab = 'home';
  document.title = `${tab === 'home' && mentor ? '대시보드' : TABS[tab]} · 파이랩`;
  if (!S.list) $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let sheets = [], members = [];
  try {
    [S.list, sheets, members] = await Promise.all([
      call('cs_list'),
      WEEKS.length ? call(mentor ? 'cs_m_sheets' : 'cs_sheet_mine') : [],
      mentor ? call('cs_m_members') : [],
      loadShareMode(),
    ]);
  } catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)} <button class="btn small" id="retry">다시</button></div>`, $('#retry').addEventListener('click', route); return; }
  if (tok !== S.seq) return;   // 그 사이 다른 화면으로 갔으면 그만
  sheets = sheets || []; members = members || [];
  S.sheets = sheets; if (mentor) S.members = members;
  renderSide();
  S.back = { href: '#' + tab, label: tab === 'home' && mentor ? '대시보드' : TABS[tab] };
  const L = S.list;
  const card = (p) => {
    const peek = (p.preview || '').split('\n').slice(0, 5).join('\n');
    const q = [p.title, p.nickname, p.sid, p.description].filter(Boolean).join(' ').toLowerCase();
    return `<a class="card" href="#p${p.id}" data-q="${esc(q)}">
      <div class="card-top"><span class="nick">${p.sid ? `<span class="sidtag">${esc(p.sid)}</span>` : ''}${esc(p.nickname)}${p.mine ? ' <small>(나)</small>' : ''}</span>
        <span class="badges">${finalBadge(p)}${p.has_webapp ? '<span class="badge web">웹앱</span>' : ''}${!p.shared && !p.final_no && S.shareMode === 'all' ? '<span class="badge lock">🔒 나만 보기</span>' : ''}
        ${p.unseen ? `<span class="badge new">새 피드백 ${p.unseen}</span>` : ''}
        ${mentor && p.feedback ? `<span class="badge">피드백 ${p.feedback}</span>` : ''}</span></div>
      <h3>${esc(p.title)}</h3>
      ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
      <pre class="peek">${esc(peek) || '<span class="muted"># 아직 비어 있어요</span>'}</pre>
      <div class="meta">${wtag(p.week)}<span class="vtag">v${p.versions}</span><span>${p.lines}줄</span><span class="grow"></span><span>${ago(p.updated_at)}</span></div>
    </a>`;
  };
  // 목록 화면 위쪽: 주차 칩 + 찾기
  const filterBar = (list, extra = '') => {
    const used = [...new Set(list.map((p) => p.week).filter(Boolean))].sort((a, b) => a - b);
    if (S.wfilter !== 'all' && S.wfilter !== 'none' && !used.includes(Number(S.wfilter))) S.wfilter = 'all';
    const chips = used.length ? `<div class="chips" role="group" aria-label="주차별 보기">
      <button class="chip wchip ${S.wfilter === 'all' ? 'on' : ''}" data-w="all">전체</button>
      ${used.map((n) => `<button class="chip wchip ${S.wfilter === String(n) ? 'on' : ''}" data-w="${n}">${n}주차</button>`).join('')}
      <button class="chip wchip ${S.wfilter === 'none' ? 'on' : ''}" data-w="none">주차 없음</button></div>` : '';
    return `<div class="filterbar">${extra}${chips}<label class="search"><span class="sr">코드 찾기</span>
      <input type="search" id="q" value="${esc(S.q)}" placeholder="이름·제목으로 찾기" autocomplete="off" enterkeyhint="search"><kbd aria-hidden="true">/</kbd></label></div>`;
  };
  const byWeek = (p) => S.wfilter === 'all' || (S.wfilter === 'none' ? !p.week : p.week === Number(S.wfilter));
  const noMatch = '<div class="empty small nomatch" hidden>찾는 코드가 없어요. 다른 낱말로 찾아보세요.</div>';
  const more = (href, label) => `<a class="more" href="${href}">${label} →</a>`;
  let html;

  if (mentor && tab === 'home') {
    const act = members.filter((m) => m.active);
    // 지금 주차: 활동지·코드가 가장 최근에 있었던 주차
    const used = [...sheets.map((x) => x.week), ...L.map((p) => p.week)].filter(Boolean);
    const wNow = weekOf(used.length ? Math.max(...used) : (WEEKS[0] || {}).no);
    const subNow = wNow ? sheets.filter((x) => x.week === wNow.no && x.submitted_at).length : 0;
    const today = L.filter((p) => Date.now() - new Date(p.updated_at) < 86400000).length;
    const finals = L.filter((p) => p.final_no), noFb = L.filter((p) => !p.feedback).length;
    const stat = (label, big, sub, href) => `<${href ? `a href="${href}"` : 'div'} class="stat"><span class="st-l">${label}</span><b class="st-n">${big}</b><span class="st-s">${sub}</span></${href ? 'a' : 'div'}>`;
    html = `<section class="home dash">
      <div class="greet"><p class="eyebrow">${esc(todayText())}</p><h1>멘토 대시보드</h1>
        <p class="muted">학생 ${act.length}명이 활동 중이에요. 주차를 누르면 학생별 활동지와 코드를 볼 수 있어요.</p></div>
      <div class="stats">
        ${stat('활동 중인 학생', `${act.length}<small>명</small>`, `<a href="#members">학생 관리 →</a>`)}
        ${wNow && wNow.sheet ? stat(`${wNow.no}주차 활동지`, `${subNow}<small>/${act.length}</small>`, '제출했어요', `#w${wNow.no}`) : stat('지금 주차', wNow ? `${wNow.no}<small>주차</small>` : '-', wNow ? esc(wNow.title) : '', wNow ? `#w${wNow.no}` : '')}
        ${stat('오늘 저장된 코드', `${today}<small>개</small>`, `전체 ${L.length}개`, '#codes')}
        ${stat('피드백 없는 코드', `${noFb}<small>개</small>`, '피드백을 기다려요', '#codes')}
        ${stat('완성작', `${finals.length}<small>개</small>`, `웹앱 ${finals.filter((p) => p.has_webapp).length}개`)}
      </div>
      <div class="sec-head"><h1>주차별 활동</h1></div>
      ${weekCards(L, sheets, members, true)}
      ${sharePanel(L, members)}
      <div class="sec-head row"><div><h1>최근 저장된 코드</h1><p class="muted">학생들이 방금 저장한 코드부터 보여요.</p></div>${L.length ? more('#codes', '모든 코드') : ''}</div>
      ${L.length ? `<div class="grid">${L.slice().sort(byRecent).slice(0, 6).map(card).join('')}</div>`
        : '<div class="empty">아직 코드가 없어요. <a href="#members">학생 관리</a>에서 학생 명단(학번·이름)을 먼저 등록해 주세요.</div>'}
    </section>`;
  } else if (mentor) {
    const names = [...new Map(L.map((p) => [p.nickname, p.sid])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
    if (S.filter !== 'all' && S.filter !== '★final' && !names.some(([n]) => n === S.filter)) S.filter = 'all';
    const who = S.filter === 'all' ? L : S.filter === '★final' ? L.filter((p) => p.final_no) : L.filter((p) => p.nickname === S.filter);
    const shown = who.filter(byWeek);
    const sel = names.length > 1 ? `<select id="whoSel" aria-label="학생 고르기"><option value="all">학생 전체</option><option value="★final" ${S.filter === '★final' ? 'selected' : ''}>★ 완성작만</option>
      ${names.map(([n, sid]) => `<option value="${esc(n)}" ${S.filter === n ? 'selected' : ''}>${sid ? esc(sid) + ' ' : ''}${esc(n)}</option>`).join('')}</select>` : '';
    html = `<section class="home">
      <div class="sec-head first row"><div><h1>모든 코드 <span class="count">${L.length}</span></h1>
        <p class="muted">최근에 저장한 순서예요. 나만 보기 코드도 멘토에게는 보여요.</p></div></div>
      ${filterBar(who, sel)}
      ${shown.length ? `<div class="grid" data-list>${shown.map(card).join('')}</div>${noMatch}`
        : `<div class="empty">${L.length ? '고른 조건에 맞는 코드가 없어요.' : '아직 코드가 없어요. <a href="#members">학생 관리</a>에서 학생 명단(학번·이름)을 먼저 등록해 주세요.'}</div>`}
    </section>`;
  } else if (tab === 'home') {
    const mine = L.filter((p) => p.mine).sort(byRecent), others = L.filter((p) => !p.mine);
    const w = currentWeek(L, sheets), allDone = WEEKS.length && WEEKS.every((k) => weekDone(k, L, sheets));
    const line = allDone ? '모든 주차를 끝냈어요. 발표회에서 멋지게 보여 줘요!'
      : w ? `지금은 <b>${w.no}주차 · ${esc(w.title)}</b>${josa(w.title, '을', '를')} 할 차례예요.` : '오늘도 한 줄씩 만들어 봐요.';
    const fresh = others.slice().sort(byRecent).slice(0, 3);
    html = `<section class="home">
      <div class="greet"><p class="eyebrow">${esc(todayText())}</p><h1>${esc(S.me.nickname)}, 반가워요 👋</h1><p class="muted">${line}</p></div>
      ${heroHTML(L, sheets)}
      <div class="sec-head row"><div><h1>주차별 활동</h1><p class="muted">한 주에 하나씩, 활동지와 코드를 마치면 ✓ 표시가 붙어요.</p></div></div>
      ${weekCards(L, sheets, members, false)}
      <div class="sec-head row"><div><h1>최근 내 코드 <span class="count">${mine.length}</span></h1></div>
        <div class="head-acts">${mine.length > 3 ? more('#mine', '내 코드 모두 보기') : ''}<button class="btn small" id="homeNew">+ 새 코드</button></div></div>
      ${mine.length ? `<div class="grid">${mine.slice(0, 3).map(card).join('')}</div>`
        : `<div class="empty">아직 만든 코드가 없어요. ${w ? `<a href="#w${w.no}">${w.no}주차 화면</a>의 <b>예시 코드</b>로 시작하면 쉬워요.` : '[+ 새 코드]를 눌러 시작해요.'}</div>`}
      ${S.shareMode === 'none' ? '' : `<div class="sec-head row"><div><h1>${S.shareMode === 'final' ? '친구들 완성작' : '친구들 코드'} <span class="count">${others.length}</span></h1>
          <p class="muted">${S.shareMode === 'final' ? '친구들이 낸 완성작을 웹앱으로 써 볼 수 있어요.' : '열어서 실행해 보고 고쳐 볼 수 있어요.'}</p></div>${others.length > 3 ? more('#friends', '모두 보기') : ''}</div>
        ${others.length ? `<div class="grid">${fresh.map(S.shareMode === 'final' ? appCard : card).join('')}</div>`
          : `<div class="empty small">${S.shareMode === 'final' ? '아직 완성작을 낸 친구가 없어요. 5~6주차에 하나씩 모여요.' : '아직 친구들이 공개한 코드가 없어요.'}</div>`}`}
    </section>`;
  } else if (tab === 'mine') {
    const all = L.filter((p) => p.mine), myFinal = all.find((p) => p.final_no), mine = all.filter(byWeek);
    html = `<section class="home">
      <div class="sec-head first row"><div><h1>내 코드 <span class="count" data-count="mine">${mine.length}</span></h1>
        ${myFinal ? `<p class="muted">완성작: <a href="#p${myFinal.id}">${esc(myFinal.title)}</a> v${myFinal.final_no}</p>`
          : all.length ? '<p class="muted">가장 잘 만든 코드를 열어 <b>★ 완성작으로 내기</b>를 누르면 친구들에게 보여요.</p>' : ''}</div>
        <div class="head-acts">${all.length || sheets.some((x) => x.submitted_at) ? '<button class="btn small" id="resBtn" title="완성작·웹앱·주차별 코드·활동지를 zip 하나로">⬇ 내 결과물</button>' : ''}<button class="btn primary small" id="newBtn">+ 새 코드</button></div></div>
      ${all.length ? filterBar(all) : ''}
      ${mine.length ? `<div class="grid" data-list="mine">${mine.map(card).join('')}</div>${noMatch}`
        : `<div class="empty">${all.length ? '이 주차에는 내 코드가 없어요.' : '아직 만든 코드가 없어요. 주차 화면의 <b>예시 코드</b>로 시작하거나 [+ 새 코드]를 눌러요.'}</div>`}
    </section>`;
  } else {
    const all = L.filter((p) => !p.mine), others = all.filter(byWeek), fin = S.shareMode === 'final';
    html = `<section class="home">
      <div class="sec-head first"><h1>${fin ? '친구들 완성작' : '친구들 코드'} <span class="count" data-count="others">${others.length}</span></h1>
        <p class="muted">${S.shareMode === 'none' ? '' : fin ? '친구들이 완성작으로 낸 프로젝트를 웹앱으로 써 볼 수 있어요. 웹앱은 멘토가 만들어 올려 줘요.'
          : '열어서 실행하고 고쳐 볼 수 있어요. 친구 코드는 저장되지 않으니 마음껏 실험해요.'}</p></div>
      ${S.shareMode === 'none' ? '<div class="empty">지금은 친구 코드를 볼 수 없어요. 발표회 때 멘토가 열어 줄 거예요.</div>'
        : `${all.length ? filterBar(all) : ''}${others.length ? `<div class="grid" data-list="others">${others.map(fin ? appCard : card).join('')}</div>${noMatch}`
          : `<div class="empty">${fin ? '아직 완성작을 낸 친구가 없어요. 5~6주차에 하나씩 모여요.' : '아직 친구들이 공개한 코드가 없어요.'}</div>`}`}
    </section>`;
  }
  $('#app').innerHTML = html;
  $('#whoSel') && $('#whoSel').addEventListener('change', (e) => { S.filter = e.target.value; S.seq++; viewHome(tab); });
  $$('.share-panel [data-mode]').forEach((b) => b.addEventListener('click', async () => {
    if (b.classList.contains('on')) return;
    try { await call('cs_m_share_mode', { p_mode: b.dataset.mode }); S.shareMode = b.dataset.mode; toast(`친구 코드 공개: ${SHARE_MODES[b.dataset.mode]}`, 'good'); S.seq++; viewHome(tab); }
    catch (err) { showErr(err); }
  }));
  $$('.chip[data-w]').forEach((b) => b.addEventListener('click', () => { S.wfilter = b.dataset.w; S.seq++; viewHome(tab); }));
  const cw = !mentor ? currentWeek(L, sheets) : null;
  $('#newBtn') && $('#newBtn').addEventListener('click', () => newProjectModal(/^\d+$/.test(S.wfilter) ? Number(S.wfilter) : ''));
  $('#homeNew') && $('#homeNew').addEventListener('click', () => newProjectModal(cw ? cw.no : ''));
  $('#resBtn') && $('#resBtn').addEventListener('click', () => resultsModal({ sheets }));
  $('#resAll') && $('#resAll').addEventListener('click', () => resultsModal({ sheets, members }));
  $('#heroNew') && $('#heroNew').addEventListener('click', (e) => newProjectModal(Number(e.currentTarget.dataset.week)));
  // 찾기: 다시 그리지 않고 카드만 숨겨요 (입력하던 자리가 그대로)
  const applySearch = () => {
    const words = S.q.toLowerCase().split(/\s+/).filter(Boolean);
    $$('[data-list]').forEach((g) => {
      let n = 0;
      $$('.card', g).forEach((c) => { const ok = words.every((w) => c.dataset.q.includes(w)); c.hidden = !ok; if (ok) n++; });
      g.hidden = !n; g.nextElementSibling && g.nextElementSibling.classList.contains('nomatch') && (g.nextElementSibling.hidden = !!n);
      const cnt = $(`[data-count="${g.dataset.list}"]`); if (cnt) cnt.textContent = n;
    });
  };
  $('#q') && $('#q').addEventListener('input', (e) => { S.q = e.target.value; applySearch(); });
  if (S.q && $('#q')) applySearch();
}

// 멘토: 친구 코드 공개 방법 정하기 + 완성작 낸 학생 수
function sharePanel(L, members) {
  const act = members.filter((m) => m.active);
  const finals = new Set(L.filter((p) => p.final_no).map((p) => p.nickname));
  const n = act.filter((m) => finals.has(m.nickname)).length;
  const desc = { all: '학생들이 "친구에게 공개"로 둔 코드를 주차 상관없이 모두 볼 수 있어요.',
    final: '친구들에게는 완성작을 웹앱으로만 보여 줘요. 코드는 안 보여요. 완성작 카드의 [🖥 웹앱 만들기]에서 웹앱을 올려 주세요.',
    none: '학생은 자기 코드만 볼 수 있어요.' };
  return `<div class="panel share-panel">
    <div class="sp-head"><h2>친구 코드 공개</h2>
      <div class="seg2" role="radiogroup" aria-label="친구 코드 공개 방법">${Object.entries(SHARE_MODES).map(([k, t]) =>
        `<button type="button" role="radio" aria-checked="${S.shareMode === k}" class="${S.shareMode === k ? 'on' : ''}" data-mode="${k}">${t}</button>`).join('')}</div></div>
    <p class="muted small" id="spDesc">${desc[S.shareMode]}</p>
    <div class="sp-final">${meter(act.length ? n / act.length * 100 : 0)}<span><b>${n}</b> / ${act.length}명 완성작 냄 · 웹앱 <b>${L.filter((p) => p.final_no && p.has_webapp).length}</b>개</span>
      <span class="grow"></span><button class="btn small" id="resAll" title="학생마다 완성작·웹앱·주차별 코드·활동지를 폴더로">⬇ 결과물 받기 (zip)</button></div>
  </div>`;
}

// 학생 홈 맨 위: 이어서 할 주차 + (새 피드백 / 최근에 고친 코드)
function heroHTML(L, sheets) {
  const w = currentWeek(L, sheets);
  const mine = L.filter((p) => p.mine).sort(byRecent), recent = mine[0];
  const fb = mine.filter((p) => p.unseen);
  const last = mine.find((p) => !p.unseen);   // 새 피드백 목록에 없는 최근 코드
  if (!w && !recent) return '';
  let main = '';
  if (w) {
    const doneSet = new Set(LS.get(todoKey(w.no)) || []), total = (w.todo || []).length;
    const x = sheets.find((s) => s.week === w.no);
    const allDone = WEEKS.every((k) => weekDone(k, L, sheets));
    const nextI = (w.todo || []).findIndex((t, i) => !doneSet.has(i));
    main = `<div class="hero-main">
      <p class="eyebrow">${allDone ? '모든 주차를 끝냈어요 🎉' : '이어서 할 주차'}</p>
      <h1><span class="hero-wk">${w.no}주차</span> ${esc(w.title)}</h1>
      ${w.goal ? `<p class="hero-goal">${esc(w.goal)}</p>` : ''}
      ${total ? `<div class="hero-prog">${meter(doneSet.size / total * 100)}<span>할 일 ${doneSet.size}/${total}</span></div>` : ''}
      ${nextI >= 0 && !allDone ? `<p class="hero-next"><span>다음 할 일</span>${esc(w.todo[nextI].t)}</p>` : ''}
      <div class="hero-acts"><a class="btn primary" href="#w${w.no}">할 일 보러 가기 →</a>
        ${w.sheet ? `<a class="btn" href="${esc(w.sheet)}">${x ? '활동지 이어 쓰기' : '활동지 쓰기'}</a>` : `<button class="btn" id="heroNew" data-week="${w.no}">이번 주 코드 만들기</button>`}</div>
    </div>`;
  }
  const side = fb.length || recent ? `<div class="hero-recent hero-side">
      ${fb.length ? `<span class="eyebrow">새 피드백 ${fb.reduce((s, p) => s + p.unseen, 0)}개</span>
        ${fb.slice(0, 3).map((p) => `<a class="fb-row" href="#p${p.id}"><b>${esc(p.title)}</b><span class="badge new">${p.unseen}</span></a>`).join('')}
        <span class="muted small">멘토가 남긴 조언을 읽고 코드를 고쳐 봐요.</span>` : ''}
      ${last ? `<span class="eyebrow ${fb.length ? 'gap' : ''}">최근에 고친 코드</span>
        <a class="fb-row recent" href="#p${last.id}"><b>${esc(last.title)}</b><span class="muted small">${last.week ? last.week + '주차 · ' : ''}v${last.versions} · ${ago(last.updated_at)}</span></a>
        ${fb.length ? '' : `<a class="go" href="#p${last.id}">이어서 코딩 →</a>`}` : ''}
    </div>` : '';
  return `<div class="hero">${main}${side}</div>`;
}

// 주차 카드 줄
function weekCards(L, sheets, members, mentor) {
  if (!WEEKS.length) return '';
  const active = members.filter((m) => m.active).length;
  const cur = mentor ? null : currentWeek(L, sheets);
  const cards = WEEKS.map((w) => {
    const code = L.filter((p) => p.week === w.no && (mentor || p.mine)).length;
    let sub, cls = '', flag = '';
    if (mentor) {
      const done = sheets.filter((x) => x.week === w.no && x.submitted_at).length;
      sub = w.sheet ? `${meter(active ? done / active * 100 : 0)}<span class="wk-sub">활동지 제출 ${done}/${active} · 코드 ${code}개</span>`
        : `<span class="wk-sub">활동지 없음 · 코드 ${code}개</span>`;
    } else {
      const x = sheets.find((s) => s.week === w.no);
      const st = w.sheet ? (x && x.submitted_at ? '활동지 제출' : x ? '활동지 쓰는 중' : '활동지 아직') : '코드만 내는 주';
      if (weekDone(w, L, sheets)) { cls = 'is-done'; flag = '<span class="wk-flag done">✓ 끝</span>'; }
      else if (cur && cur.no === w.no) { cls = 'is-cur'; flag = '<span class="wk-flag cur">지금</span>'; }
      sub = `<span class="wk-sub">${st} · 내 코드 ${code}개</span>`;
    }
    return `<a class="wk ${cls}" href="#w${w.no}"><span class="wk-top"><span class="wk-no">${w.no}<small>주차</small></span>${flag}</span>
      <span class="wk-title">${esc(w.title)}</span>${sub}</a>`;
  }).join('');
  return `<nav class="weeks" aria-label="주차">${cards}</nav>`;
}

// 지난 코드: n주차보다 앞 주차의 내 코드 중 가장 최근 주차 (완성작 → 최근에 고친 것 순)
function prevCodeOf(L, n) {
  const xs = (L || []).filter((p) => p.mine && p.week && p.week < n);
  if (!xs.length) return null;
  const top = Math.max(...xs.map((p) => p.week));
  return xs.filter((p) => p.week === top).sort((a, b) => (b.final_no ? 1 : 0) - (a.final_no ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))[0];
}
// 지난 코드를 이번 주 코드로: 맨 위 제목 줄의 주차를 바꾸고, 어디서 불러왔는지 한 줄 남겨요
function carryCode(p, code, title, wk) {
  const lines = String(code).split('\n');
  const from = `# 불러온 코드: ${p.week ? p.week + '주차 ' : ''}「${p.title}」 v${p.versions}`;
  const at = lines.slice(0, 4).findIndex((l) => /^# 만든 사람/.test(l));
  if (at < 0) return `# ${title}${wk ? ` (${wk}주차)` : ''}\n# 만든 사람: ${S.me.nickname}\n${from}\n\n${code}`;   // 머리 주석이 없던 코드
  if (/^# .+\(\d+주차\)\s*$/.test(lines[0] || '')) lines[0] = `# ${title}${wk ? ` (${wk}주차)` : ''}`;
  lines.splice(at + 1, 0, from);
  return lines.join('\n');
}

// "/" 를 누르면 찾기 칸으로
window.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.CodeMirror'))) return;
  const q = $('#q'); if (q && $('#modal').hidden) { e.preventDefault(); q.focus(); q.select(); }
});

/* =====================================================================
   2-1) 주차 화면
   ===================================================================== */
async function viewWeek(n) {
  const w = weekOf(n), mentor = S.me.role === 'mentor', tok = S.seq;
  document.title = `${n}주차 · 파이랩`;
  $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let L, sheets, members = [];
  try {
    [L, sheets, members] = await Promise.all([
      call('cs_list'),
      w.sheet ? call(mentor ? 'cs_m_sheets' : 'cs_sheet_mine') : [],
      mentor ? call('cs_m_members') : [],
      mentor ? null : loadShareMode(),
    ]);
  } catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)}</div>`; return; }
  if (tok !== S.seq) return;
  S.list = L;
  if (w.sheet) S.sheets = sheets || [];
  if (mentor) S.members = members || [];
  renderSide();
  S.back = { href: '#w' + n, label: n + '주차' };
  const i = WEEKS.indexOf(w), prev = WEEKS[i - 1], next = WEEKS[i + 1];
  const codes = L.filter((p) => p.week === n);
  const nav = `<div class="week-nav"><a class="back" href="#home">← 홈</a><span class="grow"></span>
    <div class="pager">${prev ? `<a class="btn small" href="#w${prev.no}" aria-label="${prev.no}주차로">‹ ${prev.no}주차</a>` : ''}${next ? `<a class="btn small" href="#w${next.no}" aria-label="${next.no}주차로">${next.no}주차 ›</a>` : ''}</div></div>`;
  const head = `<div class="week-head"><p class="eyebrow">${n}주차</p><h1>${esc(w.title)}</h1>${w.goal ? `<p class="goal-line"><b>이번 주 목표</b>${esc(w.goal)}</p>` : ''}</div>`;
  const row = (p) => `<a class="crow" href="#p${p.id}"><b>${esc(p.title)}</b><span class="muted">${mentor || !p.mine ? esc(p.nickname) + ' · ' : ''}v${p.versions} · ${ago(p.updated_at)}</span></a>`;

  if (!mentor) {
    const mine = codes.filter((p) => p.mine), others = codes.filter((p) => !p.mine);
    const x = (sheets || []).find((s) => s.week === n), st = sheetState(x);
    const mineF = myFields(sheets, n);
    const tkey = todoKey(n);
    const doneSet = new Set(LS.get(tkey) || []);
    const total = (w.todo || []).length;
    const prevP = prevCodeOf(L, n);
    const prevSheet = WEEKS.filter((k) => k.sheet && k.no < n).pop();
    const isLast = w === WEEKS[WEEKS.length - 1];
    $('#app').innerHTML = `<section class="week">${nav}${head}
      <div class="week-main">
        <div class="week-side">
          <div class="panel">
            <h2>활동지 ${w.sheet ? `<span class="wk-state ${st.cls}">${esc(st.text)}</span>` : ''}</h2>
            ${w.sheet ? `${x && x.summary && x.summary.topic ? `<p class="small">주제: <b>${esc(x.summary.topic)}</b></p>` : ''}
              ${x && x.summary && x.summary.progress ? `<p class="small muted">${esc(x.summary.progress)}</p>` : ''}
              <div class="panel-actions"><a class="btn primary" href="${esc(w.sheet)}">${x ? '활동지 이어 쓰기' : '활동지 쓰기'}</a>
              ${x && x.has_image ? `<button class="btn" id="myImg">제출본 보기</button><button class="btn" id="myDl">이미지로 받기</button>` : ''}</div>
              ${prevSheet ? `<p class="carry-line"><a href="${esc(w.sheet)}?carry=${prevSheet.no}">↻ ${prevSheet.no}주차 활동지 불러와서 쓰기</a><span class="muted small">지난주 답을 옆에 띄워 놓고 보충·수정해요</span></p>` : ''}
              <p class="muted small">쓰는 대로 저장돼요. 다 쓰면 활동지 맨 아래 [제출하기]를 눌러요.</p>`
            : '<p class="muted small">이번 주는 활동지가 없어요. 할 일과 예시 코드를 따라 코드를 제출해요.</p>'}
          </div>
          <div class="panel">
            <h2>이번 주 내 코드 <span class="count">${mine.length}</span></h2>
            ${mine.length ? `<div class="crows">${mine.map(row).join('')}</div>` : '<p class="muted small">아직 없어요. 아래 예시 코드로 시작하면 쉬워요.</p>'}
            ${prevP ? `<div class="carry-box"><button class="btn ${mine.length ? '' : 'primary'}" id="weekCarry">↻ 지난 코드 불러오기</button>
              <span class="muted small">${prevP.week}주차 「${esc(prevP.title)}」 v${prevP.versions}${prevP.final_no ? ' ★' : ''}를 복사해서 이번 주 코드로 이어서 고쳐요. 지난 코드는 그대로 남아요.</span></div>` : ''}
            <div class="panel-actions">${(w.examples || []).length ? '<button class="btn" data-goex>예시 코드 고르기 ↓</button>' : ''}<button class="btn ghost" id="weekNew">+ 빈 코드</button></div>
          </div>
          ${isLast ? `<div class="panel res-panel"><h2>마지막 정리: 내 결과물 받기</h2>
            <p class="muted small">완성작 코드(.py)와 웹앱(.html), 주차별 코드, 제출한 활동지를 zip 하나로 받아요. 발표 자료나 포트폴리오로 보관해요.</p>
            <div class="panel-actions"><button class="btn primary" id="weekRes">⬇ 내 결과물 내려받기</button></div></div>` : ''}
        </div>
        <div class="panel todo-panel">
          <div class="todo-head"><h2>이번 주 할 일</h2><span class="count" id="todoCount">${doneSet.size}/${total}</span></div>
          <div id="todoMeter">${meter(total ? doneSet.size / total * 100 : 0)}</div>
          ${todoHTML(w, doneSet, true)}
          <p class="muted small todo-foot">다 한 일은 번호를 눌러 체크해요. 체크는 이 기기에만 남아요.</p>
        </div>
      </div>
      ${(w.examples || []).length ? `<div class="sec-head" id="exHead"><h1>${n}주차 예시 코드</h1>
        <p class="muted">예시로 시작해서 내 주제로 바꿔요. 맨 위 주석의 "할 일"을 차례로 하고, ▶ 실행한 뒤 [저장]하면 제출 끝이에요.${mineF.length ? ' 내 분야 예시가 맨 앞에 있어요.' : ''}</p></div>
        ${exampleCards(w, mineF, true)}` : ''}
      ${S.shareMode === 'all' ? `<div class="sec-head"><h1>친구들의 ${n}주차 코드 <span class="count">${others.length}</span></h1></div>
      ${others.length ? `<div class="crows wide">${others.map(row).join('')}</div>` : '<div class="empty small">아직 친구들이 공개한 이번 주 코드가 없어요.</div>'}`
        : S.shareMode === 'final' ? '<p class="muted small week-foot">친구 코드는 <a href="#friends">친구들 완성작</a>에서 볼 수 있어요.</p>' : ''}
    </section>`;
    // 아직 안 한 첫 번째 일에 "다음" 표시
    const markNext = () => {
      const lis = $$('.todo-panel .todo > li');
      lis.forEach((li) => li.classList.remove('next'));
      const nx = lis.find((li) => !li.classList.contains('done')); nx && nx.classList.add('next');
    };
    markNext();
    $$('[data-ti]').forEach((c) => c.addEventListener('change', () => {
      const i = Number(c.dataset.ti); if (c.checked) doneSet.add(i); else doneSet.delete(i);
      LS.set(tkey, [...doneSet]); c.closest('li').classList.toggle('done', c.checked);
      $('#todoCount').textContent = `${doneSet.size}/${total}`;
      $('#todoMeter').innerHTML = meter(total ? doneSet.size / total * 100 : 0);
      markNext();
      if (doneSet.size === total && c.checked) toast(`${n}주차 할 일을 다 체크했어요!`, 'good');
    }));
    $$('[data-goex]').forEach((b) => b.addEventListener('click', () => $('#exHead').scrollIntoView({ behavior: 'smooth', block: 'start' })));
    $$('[data-ex]').forEach((b) => b.addEventListener('click', () => newProjectModal(n, b.dataset.ex)));
    $('#weekNew').addEventListener('click', () => newProjectModal(n, ''));
    $('#weekCarry') && $('#weekCarry').addEventListener('click', () => newProjectModal(n, 'p:' + prevP.id));
    $('#weekRes') && $('#weekRes').addEventListener('click', () => resultsModal({ sheets }));
    $('#myImg') && $('#myImg').addEventListener('click', () => imageModal(n, null, `${S.me.nickname} · ${n}주차 활동지`));
    $('#myDl') && $('#myDl').addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true;
      try { const r = await call('cs_sheet_image', { p_week: n }); if (r) saveDataUrl(r.image, fileName(`${S.me.nickname} ${n}주차 활동지`)); else toast('제출한 이미지가 없어요'); }
      catch (err) { showErr(err); }
      b.disabled = false;
    });
    return;
  }

  // 멘토: 학생 × 이번 주
  const ms = members.filter((m) => m.active);
  const xs = (sheets || []).filter((s) => s.week === n);
  const done = xs.filter((x) => x.submitted_at).length, draft = xs.filter((x) => !x.submitted_at).length;
  $('#app').innerHTML = `<section class="week">${nav}${head}
    <details class="panel mentor-todo"><summary><b>학생이 이번 주에 할 일</b> <span class="muted small">${(w.todo || []).length}개 · 예시 코드 ${(w.examples || []).length}개</span></summary>
      ${todoHTML(w, new Set(), false)}${(w.examples || []).length ? `<h3 class="ex-h">예시 코드</h3>${exampleCards(w, [], false)}` : ''}</details>
    <div class="week-stats panel">
      <div class="ws-left">
        ${w.sheet ? `<div class="ws-num"><b>${done}</b><span>/ ${ms.length}명 제출</span></div>${meter(ms.length ? done / ms.length * 100 : 0)}
        <div class="chips ws-filter" role="group" aria-label="상태별 보기">
          <button class="chip on" data-st="all">전체 ${ms.length}</button><button class="chip" data-st="done">제출 ${done}</button>
          <button class="chip" data-st="draft">작성 중 ${draft}</button><button class="chip" data-st="none">아직 ${Math.max(0, ms.length - done - draft)}</button></div>`
        : `<div class="ws-num"><b>${codes.length}</b><span>개 코드 · 이번 주는 활동지가 없어요</span></div>`}
      </div>
      ${w.sheet ? `<div class="ws-acts"><a class="btn small" href="${esc(w.sheet)}">활동지 미리보기</a><button class="btn small" id="csvBtn">항목별 답 CSV</button></div>` : ''}
    </div>
    ${ms.length ? `<div class="wtable" role="table" aria-label="${n}주차 학생별 현황">
      <div class="wrow head" role="row"><span>학번</span><span>이름</span><span>활동지</span><span>진행 · 주제</span><span>이번 주 코드</span><span>보기</span></div>
      ${ms.map((m) => {
        const x = xs.find((s) => s.member_id === m.id), st = sheetState(x);
        const pc = codes.filter((p) => p.nickname === m.nickname && p.sid === m.sid);
        return `<div class="wrow" role="row" data-st="${st.cls}">
          <span class="msid">${esc(m.sid || '-')}</span><span class="mnick">${esc(m.nickname)}</span>
          <span>${w.sheet ? `<span class="wk-state ${st.cls}">${esc(st.text)}</span>` : '-'}</span>
          <span class="small">${x && x.summary ? `${x.summary.progress ? `<b>${esc(x.summary.progress)}</b><br>` : ''}${esc(x.summary.topic || '')}` : ''}</span>
          <span class="small">${pc.map((p) => `<a href="#p${p.id}">${esc(p.title)}</a>`).join('<br>') || '<span class="muted">없음</span>'}</span>
          <span class="wacts">${x && x.has_image ? `<button class="btn tiny" data-img="${m.id}" data-name="${esc(m.nickname)}">이미지</button>` : ''}
            ${x ? `<a class="btn ghost tiny" href="${esc(w.sheet)}?member=${m.id}">답 보기</a>` : ''}</span>
        </div>`;
      }).join('')}
    </div>` : '<div class="empty">학생 명단이 비어 있어요. <a href="#members">학생 관리</a>에서 먼저 등록해 주세요.</div>'}
  </section>`;
  $$('.ws-filter [data-st]').forEach((b) => b.addEventListener('click', () => {
    $$('.ws-filter .chip').forEach((c) => c.classList.toggle('on', c === b));
    $$('.wrow[data-st]').forEach((r) => { r.hidden = b.dataset.st !== 'all' && r.dataset.st !== b.dataset.st; });
  }));
  $$('[data-img]').forEach((b) => b.addEventListener('click', () => imageModal(n, Number(b.dataset.img), `${b.dataset.name} · ${n}주차 활동지`)));
  $('#csvBtn') && $('#csvBtn').addEventListener('click', () => weekCsv(n, ms, xs));
}

// 파일 이름·내려받기
const fileName = (t) => String(t).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_');
function saveDataUrl(href, name) {
  const a = document.createElement('a'); a.href = href; a.download = name.includes('.') ? name : name + '.jpg';
  document.body.appendChild(a); a.click(); a.remove();
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob); saveDataUrl(url, name);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
const stamp = () => { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };

/* =====================================================================
   2-2) 결과물 내려받기 (zip)
   학생: 내 결과물 한 묶음 / 멘토: 학생 한 명 또는 반 전체
   묶음 안: 완성작 코드(.py)와 웹앱(.html), 주차별 코드, 활동지 이미지와 항목별 답, 읽어 보세요.txt
   ===================================================================== */
// 활동지 항목별 답을 읽기 쉬운 글로
function itemsText(week, items, submittedAt) {
  const out = [`[${week}주차 활동지] ${submittedAt ? '제출 ' + when(submittedAt) : ''}`.trim(), ''];
  let last = null;
  items.forEach((i) => {
    if (i.section !== last) { if (last !== null) out.push(''); out.push('■ ' + i.section); last = i.section; }
    const v = String(i.value || '').trim();
    out.push(v.includes('\n') ? `- ${i.label}:\n${v.split('\n').map((l) => '    ' + l).join('\n')}` : `- ${i.label}: ${v || '(비어 있음)'}`);
  });
  return out.join('\r\n').replace(/\r?\n/g, '\r\n');
}
// 학생 한 명의 결과물 파일들. who = { sid, nickname, mid(멘토가 받을 때) }, projects = 그 학생 프로젝트(cs_list 줄)
async function resultFiles(who, projects, sheets, opt, tick) {
  const root = fileName(`${who.sid ? who.sid + '_' : ''}${who.nickname}_결과물`) + '/';
  const files = [], notes = [`${who.sid ? who.sid + ' ' : ''}${who.nickname} · 파이랩 결과물`, `받은 날: ${new Date().toLocaleString('ko-KR')}`, ''];
  const fin = projects.find((p) => p.final_no);
  if (fin) {
    const v = await call('cs_version', { p_id: fin.id, p_no: fin.final_no }); tick();
    files.push({ name: `${root}완성작/${fileName(fin.title)}_v${fin.final_no}.py`, data: v.code });
    notes.push(`★ 완성작: ${fin.title} (v${fin.final_no}${fin.week ? ` · ${fin.week}주차` : ''})`);
    if (fin.description) notes.push(`  설명: ${fin.description}`);
    notes.push(`  코드: 완성작/${fileName(fin.title)}_v${fin.final_no}.py`);
    if (fin.has_webapp) {
      const a = await call('cs_webapp', { p_id: fin.id }); tick();
      if (a && a.html) {
        files.push({ name: `${root}완성작/${fileName(fin.title)}_웹앱.html`, data: a.html });
        notes.push(`  웹앱: 완성작/${fileName(fin.title)}_웹앱.html (두 번 눌러 브라우저로 열어요${a.webapp_no ? ` · v${a.webapp_no} 코드로 만듦` : ''})`);
      }
    } else notes.push('  웹앱: 아직 없어요');
  } else notes.push('★ 완성작: 아직 내지 않았어요');
  if (opt.code && projects.length) {
    notes.push('', '주차별 코드 (마지막으로 저장한 버전)');
    const list = projects.slice().sort((a, b) => (a.week || 99) - (b.week || 99) || String(a.title).localeCompare(String(b.title)));
    for (const p of list) {
      const v = await call('cs_version', { p_id: p.id, p_no: p.versions }); tick();
      const nm = `${p.week ? p.week + '주차_' : '주차없음_'}${fileName(p.title)}_v${p.versions}.py`;
      files.push({ name: `${root}주차별_코드/${nm}`, data: v.code });
      notes.push(`  ${nm}${p.final_no ? '  ★ 완성작' : ''}`);
    }
  }
  if (opt.sheets) {
    const xs = sheets.filter((x) => x.submitted_at).sort((a, b) => a.week - b.week);
    if (xs.length) notes.push('', '활동지 (제출한 것)');
    for (const x of xs) {
      const [img, items] = await Promise.all([
        x.has_image ? call('cs_sheet_image', { p_week: x.week, p_mid: who.mid || null }) : null,
        call('cs_sheet_items', { p_week: x.week, p_mid: who.mid || null }),
      ]); tick();
      if (img && img.image) files.push({ name: `${root}활동지/${x.week}주차_활동지${MiniZip.extOf(img.image)}`, data: MiniZip.fromDataUrl(img.image) });
      if (items && items.length) files.push({ name: `${root}활동지/${x.week}주차_활동지_답.txt`, data: itemsText(x.week, items, x.submitted_at) });
      notes.push(`  ${x.week}주차: ${img && img.image ? '이미지' : ''}${img && img.image && items && items.length ? ' + ' : ''}${items && items.length ? `항목별 답 ${items.length}개` : ''}`);
    }
  }
  if (opt.data) {
    const fs = (await call(who.mid ? 'cs_m_files' : 'cs_files', who.mid ? { p_mid: who.mid } : {})) || []; tick();
    if (fs.length) notes.push('', '올린 데이터 파일 (CSV)');
    fs.forEach((f) => { files.push({ name: `${root}데이터/${fileName(f.name)}`, data: '\uFEFF' + f.content }); notes.push(`  데이터/${fileName(f.name)}`); });
  }
  files.unshift({ name: `${root}읽어 보세요.txt`, data: notes.join('\r\n') });
  return files;
}
// 몇 번 서버를 부르는지 (진행 막대용)
const resultSteps = (projects, sheets, opt) => {
  const fin = projects.find((p) => p.final_no);
  return (fin ? 1 + (fin.has_webapp ? 1 : 0) : 0) + (opt.code ? projects.length : 0) + (opt.sheets ? sheets.filter((x) => x.submitted_at).length : 0) + (opt.data ? 1 : 0);
};
// 내려받기 창. 학생: ctx = { sheets } / 멘토: ctx = { sheets(전체), members }
function resultsModal(ctx) {
  const mentor = S.me.role === 'mentor', L = S.list || [];
  const ms = mentor ? (ctx.members || []).filter((m) => m.active || L.some((p) => p.sid === m.sid && p.nickname === m.nickname)) : [];
  const projOf = (m) => L.filter((p) => p.sid === m.sid && p.nickname === m.nickname);
  const mineN = L.filter((p) => p.mine).length;
  openModal(`<h2>${mentor ? '학생 결과물 내려받기' : '내 결과물 내려받기'}</h2>
    <p class="muted">${mentor ? '학생마다 폴더 하나씩, zip 파일 하나로 받아요.' : '내가 만든 것을 zip 파일 하나로 받아요. 발표 자료나 포트폴리오로 보관해요.'}</p>
    <form id="rsForm" novalidate>
      ${mentor ? `<label for="rsWho">누구 것을 받을까요?</label><select id="rsWho"><option value="all">학생 전체 (${ms.length}명)</option>
        ${ms.map((m) => `<option value="${m.id}">${esc(m.sid || '')} ${esc(m.nickname)}${projOf(m).some((p) => p.final_no) ? ' ★' : ''}</option>`).join('')}</select>` : ''}
      <fieldset class="rs-opts"><legend>담을 것</legend>
        <label><input type="checkbox" checked disabled> ★ 완성작 코드(.py)와 웹앱(.html)</label>
        <label><input type="checkbox" id="rsCode" checked> 주차별 코드 (마지막 저장 버전)${mentor ? '' : ` · ${mineN}개`}</label>
        <label><input type="checkbox" id="rsSheets" checked> 제출한 활동지 이미지와 항목별 답</label>
        <label><input type="checkbox" id="rsData" checked> 올린 데이터 파일 (CSV)</label>
      </fieldset>
      <div class="rs-prog" id="rsProg" hidden>${meter(0)}<span id="rsMsg">준비 중…</span></div>
      <p class="form-err" id="rsErr" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>닫기</button><button class="btn primary" id="rsOk">⬇ zip으로 받기</button></div>
    </form>`, (m) => {
    $('#rsForm', m).addEventListener('submit', async (e) => {
      e.preventDefault();
      const opt = { code: $('#rsCode', m).checked, sheets: $('#rsSheets', m).checked, data: $('#rsData', m).checked };
      const ok = $('#rsOk', m), prog = $('#rsProg', m), msg = $('#rsMsg', m), err = $('#rsErr', m);
      // 활동지 목록은 받을 때 새로 불러와요 (활동지가 없는 주차 화면에서 열어도 빠지지 않게)
      try { ctx.sheets = (await call(mentor ? 'cs_m_sheets' : 'cs_sheet_mine')) || []; }
      catch (ex) { err.textContent = ex.message || '불러오지 못했어요.'; return; }
      // 받을 학생 목록: [{ who, projects, sheets }]
      let jobs;
      if (mentor) {
        const pick = $('#rsWho', m).value;
        jobs = ms.filter((x) => pick === 'all' || String(x.id) === pick)
          .map((x) => ({ who: { sid: x.sid, nickname: x.nickname, mid: x.id }, projects: projOf(x), sheets: (ctx.sheets || []).filter((s) => s.member_id === x.id) }))
          .filter((j) => j.projects.length || j.sheets.some((s) => s.submitted_at));
      } else {
        jobs = [{ who: { sid: S.me.sid, nickname: S.me.nickname }, projects: L.filter((p) => p.mine), sheets: ctx.sheets || [] }];
      }
      if (!jobs.length || (!mentor && !jobs[0].projects.length && !jobs[0].sheets.some((s) => s.submitted_at))) { err.textContent = '아직 받을 결과물이 없어요.'; return; }
      const total = jobs.reduce((s, j) => s + resultSteps(j.projects, j.sheets, opt), 0) || 1;
      let done = 0;
      const tick = () => { done++; prog.querySelector('.meter i').style.width = Math.min(100, done / total * 100) + '%'; };
      ok.disabled = true; prog.hidden = false; err.textContent = '';
      try {
        const files = [];
        for (const j of jobs) {
          msg.textContent = `${j.who.nickname} 결과물 모으는 중… (${jobs.indexOf(j) + 1}/${jobs.length})`;
          files.push(...await resultFiles(j.who, j.projects, j.sheets, opt, tick));
        }
        msg.textContent = 'zip 만드는 중…';
        const blob = MiniZip.make(files);
        const tag = (w) => fileName([w.sid, w.nickname].filter(Boolean).join('_'));
        const name = mentor ? (jobs.length > 1 ? `파이랩_결과물_전체_${stamp()}.zip` : `파이랩_결과물_${tag(jobs[0].who)}_${stamp()}.zip`)
          : `파이랩_${tag(S.me)}_결과물.zip`;
        saveBlob(blob, name);
        msg.textContent = `받았어요 · 파일 ${files.length}개 (${(blob.size / 1048576).toFixed(1)}MB)`;
        prog.querySelector('.meter i').style.width = '100%';
        toast('결과물을 내려받았어요', 'good');
      } catch (ex) { err.textContent = ex.message || '내려받지 못했어요. 다시 해 주세요.'; prog.hidden = true; }
      ok.disabled = false;
    });
  });
}

// 멘토: 한 주차의 항목별 답을 학생 × 항목 표(CSV)로. 엑셀에서 한글이 깨지지 않게 BOM을 붙여요.
async function weekCsv(n, ms, xs) {
  let rows;
  try { rows = await call('cs_m_sheet_items', { p_week: n }); } catch (e) { return showErr(e); }
  if (!rows.length) { toast('아직 제출한 학생이 없어요'); return; }
  const cols = [];   // 처음 나온 순서대로 "구역 › 질문"
  rows.forEach((r) => { const k = `${r.section} › ${r.label}`; if (!cols.includes(k)) cols.push(k); });
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['학번', '이름', '제출 시각', ...cols].map(q).join(',')];
  ms.forEach((m) => {
    const mine = rows.filter((r) => r.member_id === m.id); if (!mine.length) return;
    const x = xs.find((s) => s.member_id === m.id);
    const val = Object.fromEntries(mine.map((r) => [`${r.section} › ${r.label}`, r.value]));
    lines.push([m.sid, m.nickname, x && x.submitted_at ? when(x.submitted_at) : '', ...cols.map((c) => val[c] ?? '')].map(q).join(','));
  });
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); saveDataUrl(url, `${n}주차_활동지_항목별_답.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function imageModal(week, mid, title) {
  openModal(`<h2>${esc(title)}</h2>
    <div class="tabs2" role="tablist"><button class="on" data-tab="img">이미지</button><button data-tab="items">항목별 답</button></div>
    <div class="imgbox" data-pane="img"><p class="muted">불러오는 중…</p></div>
    <div class="itembox" data-pane="items" hidden><p class="muted">불러오는 중…</p></div>
    <div class="modal-actions"><button class="btn" data-close>닫기</button><button class="btn primary" id="imgDl" hidden>이미지로 받기</button></div>`, (c) => {
    $$('[data-tab]', c).forEach((b) => b.addEventListener('click', () => {
      $$('[data-tab]', c).forEach((x) => x.classList.toggle('on', x === b));
      $$('[data-pane]', c).forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
    }));
  });
  try {
    const [r, items] = await Promise.all([call('cs_sheet_image', { p_week: week, p_mid: mid }), call('cs_sheet_items', { p_week: week, p_mid: mid })]);
    const box = $('.imgbox'); if (!box) return;
    if (!r) box.innerHTML = '<p class="muted">제출한 이미지가 없어요.</p>';
    else {
      box.innerHTML = `<img class="sheet-img" alt="${esc(title)}"><p class="muted small">제출 ${when(r.submitted_at)}</p>`;
      $('.sheet-img').src = r.image;
      const dl = $('#imgDl'); dl.hidden = false; dl.addEventListener('click', () => saveDataUrl(r.image, fileName(title) + '.jpg'));
    }
    let last = '';
    $('.itembox').innerHTML = items.length ? `<dl class="items">${items.map((i) => {
      const head = i.section !== last ? `<dt class="isec">${esc(i.section)}</dt>` : ''; last = i.section;
      return `${head}<dd><span class="ilab">${esc(i.label)}</span><span class="ival ${i.value ? '' : 'empty'}">${esc(i.value || '(비어 있음)')}</span></dd>`;
    }).join('')}</dl>` : '<p class="muted">제출한 항목이 없어요.</p>';
  } catch (e) { const box = $('.imgbox'); if (box && e.message) box.innerHTML = `<p class="form-err">${esc(e.message)}</p>`; }
}

function newProjectModal(defWeek, exId) {
  const minePs = (S.list || []).filter((p) => p.mine);
  const pastOf = (wk) => minePs.filter((p) => !wk || (p.week && p.week < wk))
    .sort((a, b) => (b.week || 0) - (a.week || 0) || new Date(b.updated_at) - new Date(a.updated_at));
  const projOf = (v) => (String(v).startsWith('p:') ? minePs.find((p) => String(p.id) === v.slice(2)) : null);
  const exOptions = (wk) => {
    const w = weekOf(wk), list = (w && w.examples) || [], past = pastOf(wk);
    return `<option value="">빈 코드 (print 한 줄)</option>`
      + (list.length ? `<optgroup label="${wk ? wk + '주차 ' : ''}예시 코드">${list.map((x) => `<option value="${esc(x.id)}">${esc(FIELDS[x.field] ? FIELDS[x.field] + ' · ' : '')}${esc(x.title)}</option>`).join('')}</optgroup>` : '')
      + (past.length ? `<optgroup label="↻ 내 지난 코드 불러오기">${past.map((p) => `<option value="p:${p.id}">${p.week ? p.week + '주차 · ' : ''}${esc(p.title)} (v${p.versions}${p.final_no ? ' ★' : ''})</option>`).join('')}</optgroup>` : '');
  };
  openModal(`<h2>새 코드</h2>
    <form id="npForm" novalidate>
      ${WEEKS.length ? `<label for="npWeek">몇 주차 코드인가요?</label><select id="npWeek">${weekOptions(defWeek)}</select>` : ''}
      <label for="npEx">시작 코드</label><select id="npEx"></select>
      <p class="muted small" id="npExDesc"></p>
      <label for="npTitle">이름</label>
      <input id="npTitle" maxlength="60" placeholder="예) 숫자 맞히기 게임" required>
      <label for="npDesc">한 줄 설명 <span class="muted">(선택)</span></label>
      <input id="npDesc" maxlength="300" placeholder="어떤 프로그램인지 친구에게 소개해요">
      <fieldset class="seg"><legend>누가 볼 수 있나요?</legend>
        <label><input type="radio" name="sh" value="1" checked> 친구에게 공개</label>
        <label><input type="radio" name="sh" value="0"> 나만 보기</label>
      </fieldset>
      <p class="form-err" id="npErr" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary" id="npOk">만들기</button></div>
    </form>`, (m) => {
    const wkSel = $('#npWeek', m), exSel = $('#npEx', m), titleIn = $('#npTitle', m);
    let autoTitle = '', autoDesc = '';
    const descIn = $('#npDesc', m);
    const curWeek = () => (wkSel && wkSel.value ? Number(wkSel.value) : null);
    const syncEx = () => {
      const x = exOf(curWeek(), exSel.value), pp = projOf(exSel.value);
      $('#npExDesc', m).textContent = x ? x.desc : pp ? `${pp.week ? pp.week + '주차 ' : ''}「${pp.title}」의 마지막 저장본(v${pp.versions})을 복사해서 시작해요. 지난 코드는 그대로 남아요.` : '';
      const t = x ? x.title : pp ? pp.title : '';
      if (t && (!titleIn.value || titleIn.value === autoTitle)) { titleIn.value = autoTitle = t; }
      if (!t && titleIn.value === autoTitle) { titleIn.value = autoTitle = ''; }
      const dd = pp ? pp.description || '' : '';
      if (descIn.value === autoDesc) { descIn.value = autoDesc = dd; }
    };
    const fillEx = (pick) => { exSel.innerHTML = exOptions(curWeek()); exSel.value = pick || ''; if (exSel.value !== (pick || '')) exSel.value = ''; syncEx(); };
    fillEx(exId);
    wkSel && wkSel.addEventListener('change', () => fillEx(''));
    exSel.addEventListener('change', syncEx);
    if (exId) titleIn.select();
    $('#npForm', m).addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = titleIn.value.trim();
      if (!title) { $('#npErr', m).textContent = '이름을 적어 주세요.'; titleIn.focus(); return; }
      $('#npOk', m).disabled = true;
      const wk = curWeek(), x = exOf(wk, exSel.value), pp = projOf(exSel.value);
      const headLines = `# ${title}${wk ? ` (${wk}주차)` : ''}\n# 만든 사람: ${S.me.nickname}\n`;
      let src = x ? `${headLines}# 시작한 예시: ${x.title}\n\n${x.code}` : `${headLines}\nprint("안녕하세요!")\n`;
      try {
        if (pp) src = carryCode(pp, (await call('cs_version', { p_id: pp.id, p_no: pp.versions })).code, title, wk);
        const r = await call('cs_create', { p_title: title, p_desc: $('#npDesc', m).value, p_shared: $('input[name=sh]:checked', m).value === '1', p_src: src, p_week: wk });
        closeModal(); S.list = null; location.hash = '#p' + r.id;
      } catch (err) { $('#npErr', m).textContent = err.message; $('#npOk', m).disabled = false; }
    });
  });
}

/* =====================================================================
   3) 프로젝트 화면
   ===================================================================== */
function disposeProject() {
  const P = S.P; if (!P) return;
  P.runner && P.runner.dispose();
  window.removeEventListener('keydown', P.onKey);
  S.P = null;
}

window.addEventListener('beforeunload', (e) => {
  if (S.P && S.P.dirty) { e.preventDefault(); e.returnValue = ''; }
});

async function viewProject(id) {
  const P = S.P = { id, data: null, cm: null, runner: null, isReady: false, dirty: false, viewing: null, workCode: null, errLine: null, silent: false, t0: 0 };
  $('#app').innerHTML = '<div class="loading">프로젝트 여는 중…</div>';
  try { P.data = await call('cs_get', { p_id: id }); }
  catch (e) {
    if (S.P !== P) return;
    $('#app').innerHTML = `<div class="loading bad">${esc(e.message || '열 수 없어요.')} <a class="btn small" href="#home">홈으로</a></div>`;
    S.P = null; return;
  }
  if (S.P !== P) return;
  const d = P.data;
  P.unseenAtOpen = (d.feedback || []).filter((f) => !f.seen).map((f) => f.id);
  document.title = `${d.title} · 파이랩`;
  renderProject();

  // 저장 안 한 코드가 이 기기에 남아 있으면 이어서 보여 줘요
  let start = d.latest.code;
  if (d.mine) {
    const dr = LS.get(draftKey(id));
    if (dr && typeof dr.code === 'string' && dr.code !== d.latest.code) {
      start = dr.code;
      showBanner('draft', `<b>저장하지 않은 코드</b>를 이어서 보여 줘요${dr.base && dr.base !== d.latest.no ? ` (v${dr.base}에서 고치던 것)` : ''}. 저장하려면 <b>저장</b>을 눌러요.`,
        `<button class="btn small" data-act="discard">마지막 저장본(v${d.latest.no})으로</button>`);
    }
  }
  makeEditor(start);
  updateDirty();
  if (P.unseenAtOpen.length) setTimeout(() => S.P === P && openFeedback(), 300);
  startRunner();
}

function renderProject() {
  const P = S.P, d = P.data, mentor = S.me.role === 'mentor';
  const fbCount = (d.feedback || []).length, unseen = (d.feedback || []).filter((f) => !f.seen).length;
  const bk = backTo();
  $('#app').innerHTML = `
  <section class="project">
    <div class="proj-head">
      <a class="back" href="${esc(bk.href)}">← ${esc(bk.label)}</a>
      <div class="ptitle">
        <h1>${esc(d.title)}</h1>
        <p class="psub">${d.week ? `<a class="wtag" href="#w${d.week}">${d.week}주차</a><span class="dot">·</span>` : ''}<span class="nick">${d.sid ? esc(d.sid) + ' ' : ''}${esc(d.nickname)}</span>${d.mine ? ' (나)' : ''}
          <span class="dot">·</span>${d.final_no ? `<span class="badge final">★ 완성작 v${d.final_no}</span>` : d.shared ? '친구에게 공개' : '🔒 나만 보기'}
          <span class="dot">·</span>최신 <span class="vtag">v${d.latest.no}</span> ${ago(d.updated_at)}</p>
        ${d.description ? `<p class="pdesc">${esc(d.description)}</p>` : ''}
      </div>
    </div>
    <div class="toolbar" role="toolbar" aria-label="프로젝트 도구">
      <button class="btn run" id="runBtn" disabled>▶ 실행 <kbd>Ctrl+Enter</kbd></button>
      <button class="btn stop" id="stopBtn" disabled>■ 멈춤</button>
      <span class="sep"></span>
      ${d.mine ? `<button class="btn primary" id="saveBtn">저장 <kbd>Ctrl+S</kbd></button><span class="dirty" id="dirty" hidden>● 저장 안 됨</span>
           <button class="btn final-btn ${d.final_no ? 'is-final' : ''}" id="finalBtn">${finalLabel(d)}</button>`
        : `<span class="note">${mentor ? '멘토 보기 · 고쳐서 실행해 볼 수 있지만 저장되지 않아요' : '친구 코드 · 고쳐서 실행해 볼 수 있지만 저장되지 않아요'}</span>
           <button class="btn small" id="resetBtn" hidden>원래대로</button>`}
      <span class="grow"></span>
      ${mentor ? `<a class="btn" href="#a${d.id}">${d.has_webapp ? '🖥 웹앱' : '🖥 웹앱 만들기'}</a>` : d.has_webapp ? `<a class="btn" href="#a${d.id}">🖥 웹앱 보기</a>` : ''}
      <button class="btn" id="dataBtn" title="CSV 데이터 파일 보기·올리기" aria-label="데이터 파일">${icon('data')}<span class="lbl"> 데이터</span></button>
      <button class="btn" id="histBtn">기록 <span class="vtag">v${d.latest.no}</span></button>
      <button class="btn" id="dlBtn" title="지금 편집기의 코드를 .py 파일로 받아요" aria-label=".py 파일로 받기">⬇<span class="lbl"> .py</span></button>
      ${d.mine || mentor ? `<button class="btn" id="fbBtn">피드백${fbCount ? ` <span class="num">${fbCount}</span>` : ''}${unseen ? '<i class="newdot" aria-label="새 피드백"></i>' : ''}</button>` : ''}
      ${d.mine || mentor ? `<button class="btn" id="setBtn" aria-label="설정">⚙<span class="lbl"> 설정</span></button>` : ''}
    </div>
    <div class="banner" id="banner" hidden></div>
    <div class="work">
      <div class="editor-wrap" id="editorWrap"><div class="ed-label"><span>main.py</span><span id="cursorPos"></span></div><div id="editor"></div></div>
      <section class="console" id="console" aria-label="실행 결과">
        <div class="con-head"><span class="con-title">실행 결과</span><span class="con-status" id="conStatus">파이썬 준비 중…</span>
          <button class="con-clear" id="conClear">지우기</button></div>
        <div class="con-body" id="conBody">
          <pre class="con-out" id="conOut"></pre>
          <form class="con-in" id="conIn" hidden autocomplete="off">
            <input id="conInput" aria-label="입력값" enterkeyhint="send" autocapitalize="off" spellcheck="false">
            <button class="btn small">보내기 ↵</button>
          </form>
        </div>
        <div class="con-hint" id="conHint" hidden></div>
      </section>
    </div>
  </section>`;

  $('#runBtn').addEventListener('click', runCode);
  $('#stopBtn').addEventListener('click', () => P.runner && P.runner.stop());
  $('#conClear').addEventListener('click', clearConsole);
  $('#histBtn').addEventListener('click', openHistory);
  $('#dataBtn').addEventListener('click', openData);
  $('#dlBtn').addEventListener('click', () => {
    const code = P.cm ? P.cm.getValue() : P.data.latest.code;
    const no = P.viewing ? P.viewing.no : P.data.latest.no, changed = !P.viewing && code !== P.data.latest.code;
    saveBlob(new Blob([code], { type: 'text/x-python;charset=utf-8' }), `${fileName(P.data.title)}_v${no}${changed ? '_고치는중' : ''}.py`);
  });
  $('#fbBtn') && $('#fbBtn').addEventListener('click', openFeedback);
  $('#setBtn') && $('#setBtn').addEventListener('click', openSettings);
  $('#saveBtn') && $('#saveBtn').addEventListener('click', saveModal);
  $('#finalBtn') && $('#finalBtn').addEventListener('click', finalModal);
  $('#resetBtn') && $('#resetBtn').addEventListener('click', () => { setCode(P.data.latest.code); updateDirty(); });
  $('#conIn').addEventListener('submit', (e) => { e.preventDefault(); sendInput(); });
  $('#banner').addEventListener('click', onBannerClick);
  P.onKey = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'Enter') { e.preventDefault(); if (!P.runner || !P.runner.running) runCode(); }
    if (mod && (e.key === 's' || e.key === 'S') && P.data.mine) { e.preventDefault(); if ($('#modal').hidden) saveModal(); }
  };
  window.addEventListener('keydown', P.onKey);
}

/* =====================================================================
   3-1) 웹앱 화면 (#a12): 격리된 iframe 안에서 웹앱을 실행해요
   - sandbox 에 allow-same-origin 이 없어서, 웹앱은 파이랩의 로그인 정보(localStorage)를 읽을 수 없어요
   ===================================================================== */
const WA_SANDBOX = 'allow-scripts allow-forms allow-modals';
let waKey = null, waFiles = [];
function waPrompt(d, code, no) {
  return `아래 파이썬 코드는 고등학교 1학년 학생이 멘토링 프로젝트에서 직접 만든 코드예요.
친구들이 브라우저에서 바로 써 볼 수 있는 웹앱으로 바꿔 주세요.

[프로젝트]
- 제목: ${d.title}
${d.description ? `- 설명: ${d.description}\n` : ''}- 만든 사람: ${d.nickname}
${d.week ? `- ${d.week}주차 코드 · ` : '- '}v${no}

[꼭 지킬 것]
1. HTML 파일 하나로 만들어 주세요. CSS와 JavaScript는 모두 파일 안에 넣고, 바깥 파일·라이브러리·글꼴·이미지 주소는 불러오지 마세요.
2. 파이썬 코드의 규칙·계산·문장은 그대로 옮겨 주세요. 새 기능은 넣지 말고, 학생이 직접 짠 로직이 화면에 그대로 드러나게 해 주세요.
3. input()은 입력칸·버튼·선택지로, print()는 화면의 결과 영역으로 바꿔 주세요. 잘못된 입력에는 친절한 한국어 안내를 보여 주세요.
4. localStorage, sessionStorage, 쿠키, prompt()는 쓰지 마세요 (격리된 화면에서 실행돼요).
5. 화면 글자는 모두 한국어로, 휴대폰에서도 보기 좋게 만들어 주세요. 주제에 어울리는 색과 큰 제목을 써 주세요.
6. 맨 아래에 작게 "만든 사람: ${d.nickname} · 파이썬 코드를 웹앱으로 바꿨어요"를 넣어 주세요.
7. 설명 없이 완성된 HTML 코드만 \`\`\`html 블록 하나로 주세요.

[파이썬 코드]
\`\`\`python
${code}
\`\`\`${csvForPrompt(code, waFiles)}`;
}
// claude.ai 답을 통째로 붙여 넣어도 ```html ... ``` 안쪽만 꺼내요
function waClean(text) {
  const t = String(text || '').trim();
  const m = /```(?:html)?\s*\n([\s\S]*?)```/i.exec(t);
  return (m ? m[1] : t).trim();
}
function waFrame(html) {
  const f = document.createElement('iframe');
  f.setAttribute('sandbox', WA_SANDBOX);
  f.setAttribute('title', '웹앱');
  f.setAttribute('referrerpolicy', 'no-referrer');
  f.srcdoc = html;
  return f;
}
async function viewWebapp(id) {
  const tok = S.seq, mentor = S.me.role === 'mentor';
  $('#app').innerHTML = '<div class="loading">웹앱 여는 중…</div>';
  let a, d = null;
  try {
    [a, d] = await Promise.all([call('cs_webapp', { p_id: id }), mentor ? call('cs_get', { p_id: id }) : null]);
  } catch (e) {
    if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)} <a class="btn small" href="#home">홈으로</a></div>`;
    return;
  }
  if (tok !== S.seq) return;
  document.title = `${a.title} · 웹앱 · 파이랩`;
  // 프롬프트에 넣을 CSV 미리 받기 (예시 + 학생이 올린 파일)
  waFiles = [];
  if (mentor) { CSVS.forEach((c) => sampleText(c.name).catch(() => {})); call('cs_project_files', { p_id: id }).then((f) => { waFiles = f || []; }, () => {}); }
  const bk = backTo(), canCode = a.mine || a.mentor;
  const stale = a.html && a.final_no && a.webapp_no && a.webapp_no !== a.final_no;
  $('#app').innerHTML = `<section class="webapp">
    <div class="week-nav"><a class="back" href="${esc(bk.href)}">← ${esc(bk.label)}</a><span class="grow"></span>
      ${canCode ? `<a class="btn small" href="#p${a.id}">코드 보기</a>` : ''}</div>
    <div class="wa-head">
      <p class="eyebrow">${a.week ? `${a.week}주차 · ` : ''}${esc(a.nickname)}${a.mine ? ' (나)' : ''}</p>
      <h1>${esc(a.title)}</h1>
      ${a.description ? `<p class="muted">${esc(a.description)}</p>` : ''}
      <p class="wa-meta">${a.final_no ? `<span class="badge final">★ 완성작</span>` : ''}${a.html ? `<span class="badge web">웹앱${a.webapp_no ? ` · v${a.webapp_no} 코드로 만듦` : ''}</span> <span class="muted small">${ago(a.webapp_at)}</span>` : ''}</p>
    </div>
    ${mentor ? `<details class="panel wa-tools" ${a.html ? '' : 'open'}><summary><b>웹앱 만들기·바꾸기</b> <span class="muted small">멘토만 보여요</span></summary>
      ${stale ? `<p class="warnline">이 웹앱은 v${a.webapp_no} 코드로 만들었는데, 지금 완성작은 v${a.final_no}예요. 새로 만들면 좋아요.</p>` : ''}
      <ol class="wa-steps">
        <li><b>변환 프롬프트 복사</b> · 어느 버전으로 만들까요?
          <div class="wa-row"><select id="waNo" aria-label="버전">${(d.versions || []).map((v) => `<option value="${v.no}" ${v.no === (a.final_no || d.latest.no) ? 'selected' : ''}>v${v.no}${v.no === a.final_no ? ' ★ 완성작' : ''}${v.note ? ' · ' + esc(v.note) : ''}</option>`).join('')}</select>
          <button class="btn" id="waCopy">프롬프트 복사</button></div></li>
        <li><b>claude.ai에 붙여 넣고</b> 받은 답을 그대로 아래에 붙여 넣어요 (<code>\`\`\`html</code> 표시는 저절로 빼요).
          <textarea id="waHtml" rows="7" spellcheck="false" placeholder="<!doctype html> ... 또는 Claude의 답 전체"></textarea></li>
        <li><b>미리 보고 저장</b>해요. 저장하면 ${S.shareMode === 'final' ? '친구들 완성작 목록에 바로 보여요' : '학생과 멘토가 볼 수 있어요'}.
          <div class="wa-row"><button class="btn" id="waPreview">미리 보기</button><button class="btn primary" id="waSave">저장</button>
          ${a.html ? '<span class="grow"></span><button class="btn ghost danger" id="waDel">웹앱 지우기</button>' : ''}</div></li>
      </ol>
      <p class="form-err" id="waErr" role="alert"></p>
    </details>` : ''}
    <div class="wa-stage" id="waStage">
      <div class="wa-bar"><span class="wa-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="wa-name" id="waName">${esc(a.title)}</span>
        <span class="grow"></span>${canCode && a.html ? '<button class="btn tiny" id="waDl" title="저장된 웹앱을 .html 파일로 받아요">⬇ HTML</button>' : ''}<button class="btn tiny" id="waReload" ${a.html ? '' : 'hidden'}>처음부터</button><button class="btn tiny" id="waFull" ${a.html ? '' : 'hidden'}>크게 보기</button></div>
      <div class="wa-body" id="waBody">${a.html ? '' : `<div class="wa-empty"><b>웹앱을 만드는 중이에요</b><p class="muted">${mentor ? '위의 [웹앱 만들기·바꾸기]에서 올려 주세요.' : '멘토가 이 코드를 웹앱으로 바꿔서 올려 줄 거예요. 조금만 기다려 주세요.'}</p></div>`}</div>
    </div>
  </section>`;
  let shown = a.html || '';
  const show = (html, label) => {
    shown = html; $('#waBody').innerHTML = ''; $('#waBody').appendChild(waFrame(html));
    $('#waReload').hidden = false; $('#waFull').hidden = false; $('#waName').textContent = label || a.title;
  };
  if (a.html) show(a.html);
  $('#waReload').addEventListener('click', () => shown && show(shown, $('#waName').textContent));
  $('#waDl') && $('#waDl').addEventListener('click', () => saveBlob(new Blob([a.html], { type: 'text/html;charset=utf-8' }), `${fileName(a.title)}_웹앱.html`));
  const stage = $('#waStage');
  const full = (on) => { stage.classList.toggle('full', on); document.body.classList.toggle('wa-lock', on); $('#waFull').textContent = on ? '닫기 ✕' : '크게 보기'; };
  $('#waFull').addEventListener('click', () => full(!stage.classList.contains('full')));
  if (waKey) document.removeEventListener('keydown', waKey);
  waKey = (e) => { if (e.key === 'Escape' && stage.isConnected && stage.classList.contains('full')) full(false); };
  document.addEventListener('keydown', waKey);
  if (!mentor) return;
  const errEl = $('#waErr');
  $('#waCopy').addEventListener('click', async (e) => {
    const no = Number($('#waNo').value); errEl.textContent = '';
    try {
      const v = no === d.latest.no ? d.latest : await call('cs_version', { p_id: id, p_no: no });
      await copyText(waPrompt(a, v.code, no), e.currentTarget);
    } catch (err) { errEl.textContent = err.message || '복사하지 못했어요.'; }
  });
  const pasted = () => {
    const h = waClean($('#waHtml').value);
    if (!h) { errEl.textContent = 'Claude가 준 HTML을 붙여 넣어 주세요.'; return null; }
    if (!/<(html|body|div|main|script|style|h1|form|button)\b/i.test(h)) { errEl.textContent = 'HTML이 아닌 것 같아요. Claude의 답에서 html 코드 부분을 붙여 넣어 주세요.'; return null; }
    errEl.textContent = ''; return h;
  };
  $('#waPreview').addEventListener('click', () => { const h = pasted(); if (h) { show(h, `${a.title} · 미리 보기 (아직 저장 안 함)`); stage.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  $('#waSave').addEventListener('click', async (e) => {
    const h = pasted(); if (!h) return;
    const b = e.currentTarget; b.disabled = true;
    try { await call('cs_m_webapp_save', { p_id: id, p_html: h, p_no: Number($('#waNo').value) }); S.list = null; toast('웹앱을 저장했어요', 'good'); S.seq++; viewWebapp(id); }
    catch (err) { errEl.textContent = err.message; b.disabled = false; }
  });
  $('#waDel') && $('#waDel').addEventListener('click', () => openModal(`<h2>웹앱 지우기</h2><p>${esc(a.title)}의 웹앱을 지울까요? 코드는 그대로 남아요.</p>
    <div class="modal-actions"><button class="btn" data-close>취소</button><button class="btn danger" id="wdOk">지우기</button></div>`, (m) => {
    $('#wdOk', m).addEventListener('click', async () => {
      try { await call('cs_m_webapp_save', { p_id: id, p_html: '', p_no: null }); closeModal(); S.list = null; toast('웹앱을 지웠어요'); S.seq++; viewWebapp(id); }
      catch (err) { showErr(err); }
    });
  }));
}

/* ---------- 완성작으로 내기 ---------- */
const finalLabel = (d) => (d.final_no ? `★ 완성작 v${d.final_no}` : '★ 완성작으로 내기');
function finalModal() {
  const P = S.P, d = P.data, last = d.latest.no;
  if (P.dirty) {
    openModal(`<h2>먼저 저장해요</h2>
      <p>저장하지 않은 코드가 있어요. 완성작은 <b>저장된 버전</b>으로 내요. 지금 코드를 완성작으로 내려면 먼저 저장해 주세요.</p>
      <div class="modal-actions"><button class="btn" data-close>닫기</button><button class="btn primary" id="fmSave">저장하기</button></div>`,
      (m) => $('#fmSave', m).addEventListener('click', () => { closeModal(); saveModal(); }));
    return;
  }
  const cur = d.final_no;
  const other = !cur && (S.list || []).find((p) => p.mine && p.final_no && p.id !== d.id);
  const shareNote = S.shareMode === 'none' ? '지금은 멘토가 친구 코드 공개를 꺼 두어서, 공개되면 그때 친구들에게 보여요.'
    : S.shareMode === 'all' ? '친구들 목록에 ★ 완성작 표시가 붙어요.' : '친구들에게는 이 버전만 보여요. 중간 코드와 버전 기록은 안 보여요.';
  openModal(`<h2>★ 완성작으로 내기</h2>
    ${cur ? `<p>지금 완성작은 <span class="vtag">v${cur}</span> 이에요${d.final_at ? ` (${when(d.final_at)})` : ''}.</p>` : ''}
    <p>${cur && cur === last ? '가장 최근 저장 버전이 이미 완성작이에요.' : `<span class="vtag">v${last}</span>${d.latest.note ? ` "${esc(d.latest.note)}"` : ''} 를 완성작으로 낼까요?`}</p>
    <ul class="fm-list">
      <li>${shareNote}</li>
      <li>더 고쳐서 저장해도 완성작은 그대로예요. 바꾸고 싶으면 다시 눌러요.</li>
      <li>완성작은 한 사람에 하나예요.${other ? ` 지금 완성작인 <b>${esc(other.title)}</b>는 풀려요.` : ''}</li>
    </ul>
    <p class="form-err" id="fmErr" role="alert"></p>
    <div class="modal-actions">
      ${cur ? '<button class="btn ghost danger" id="fmOff">완성작 취소</button><span class="grow"></span>' : ''}
      <button class="btn" data-close>닫기</button>
      ${cur === last ? '' : `<button class="btn primary" id="fmOk">${cur ? `v${last}로 바꾸기` : '완성작으로 내기'}</button>`}
    </div>`, (m) => {
    const go = async (no, btn) => {
      btn.disabled = true;
      try {
        await call('cs_finalize', { p_id: d.id, p_no: no });
        d.final_no = no; d.final_at = no ? new Date().toISOString() : null; S.list = null;
        closeModal();
        const b = $('#finalBtn'); if (b) { b.textContent = finalLabel(d); b.classList.toggle('is-final', !!no); }
        toast(no ? `v${no}를 완성작으로 냈어요` : '완성작을 취소했어요', 'good');
      } catch (err) { $('#fmErr', m).textContent = err.message; btn.disabled = false; }
    };
    $('#fmOk', m) && $('#fmOk', m).addEventListener('click', (e) => go(last, e.currentTarget));
    $('#fmOff', m) && $('#fmOff', m).addEventListener('click', (e) => go(null, e.currentTarget));
  });
}

/* ---------- 편집기 ---------- */
function makeEditor(code) {
  const P = S.P;
  if (!window.CodeMirror) {
    $('#editor').innerHTML = '<p class="loading bad">편집기를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.</p>';
    return;
  }
  P.cm = CodeMirror($('#editor'), {
    value: code, mode: 'python', theme: 'pyshare',
    lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,
    matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
    inputStyle: 'contenteditable', spellcheck: false, autocorrect: false, autocapitalize: false,
    screenReaderLabel: '파이썬 코드 편집기',
    extraKeys: {
      Tab: (cm) => cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('    ', 'end'),
      'Shift-Tab': (cm) => cm.indentSelection('subtract'),
      'Ctrl-/': toggleComment, 'Cmd-/': toggleComment,
    },
  });
  P.cm.on('change', () => {
    if (P.silent) return;
    clearErrLine();
    if (P.viewing) return;
    updateDirty();
    if (P.data.mine) {
      clearTimeout(P.draftT);
      P.draftT = setTimeout(() => {
        const v = P.cm.getValue();
        if (v === P.data.latest.code) LS.del(draftKey(P.id)); else LS.set(draftKey(P.id), { code: v, base: P.data.latest.no, at: Date.now() });
      }, 400);
    }
  });
  P.cm.on('cursorActivity', () => { const c = P.cm.getCursor(); $('#cursorPos').textContent = `${c.line + 1}줄 ${c.ch + 1}칸`; });
  if (!isWide()) { /* 휴대폰에서는 바로 키보드가 뜨지 않게 */ } else P.cm.focus();
}
function toggleComment(cm) {
  const from = cm.getCursor('from').line, to = cm.getCursor('to').line;
  const ls = []; for (let i = from; i <= to; i++) ls.push(cm.getLine(i));
  const all = ls.filter((l) => l.trim()).every((l) => /^\s*#/.test(l));
  cm.operation(() => {
    for (let i = from; i <= to; i++) {
      const l = cm.getLine(i); if (!l.trim()) continue;
      if (all) { const m = /^(\s*)# ?/.exec(l); cm.replaceRange(m[1], { line: i, ch: 0 }, { line: i, ch: m[0].length }); }
      else { const ind = /^\s*/.exec(l)[0].length; cm.replaceRange('# ', { line: i, ch: ind }); }
    }
  });
}
function setCode(code) { const P = S.P; P.silent = true; P.cm.setValue(code); P.silent = false; clearErrLine(); }
function updateDirty() {
  const P = S.P; if (!P || !P.cm) return;
  const differs = !P.viewing && P.cm.getValue() !== P.data.latest.code;
  if (P.data.mine) { P.dirty = differs; $('#dirty').hidden = !differs; }
  else if ($('#resetBtn')) $('#resetBtn').hidden = !differs;
  if (!differs && !P.viewing) hideBanner('draft');
}
function clearErrLine() {
  const P = S.P; if (!P || P.errLine == null || !P.cm) return;
  P.cm.removeLineClass(P.errLine, 'background', 'cm-errline'); P.errLine = null;
}

/* ---------- 안내 띠 (예전 버전 보기 · 임시 저장) ---------- */
function showBanner(kind, msg, actions) {
  const b = $('#banner'); b.dataset.kind = kind; b.className = 'banner ' + kind;
  b.innerHTML = `<span class="banner-msg">${msg}</span><span class="banner-actions">${actions}</span>`; b.hidden = false;
}
function hideBanner(kind) { const b = $('#banner'); if (b && (!kind || b.dataset.kind === kind)) { b.hidden = true; b.dataset.kind = ''; } }
function onBannerClick(e) {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const P = S.P;
  if (a.dataset.act === 'discard') { setCode(P.data.latest.code); LS.del(draftKey(P.id)); updateDirty(); hideBanner(); toast(`v${P.data.latest.no} 저장본으로 돌아왔어요`); }
  if (a.dataset.act === 'back') exitVersion();
  if (a.dataset.act === 'restore') restoreModal(P.viewing);
}

/* ---------- 실행 ---------- */
/* =====================================================================
   3-0) 데이터 파일 (CSV)
   - 예시 CSV: csv 폴더의 파일 (weeks.js 의 PYSHARE_CSV)
   - 내 CSV: 학생이 올린 파일. 파이랩 서버(cs_files)에 저장돼서 다른 컴퓨터와 멘토 화면에서도 쓸 수 있어요.
     (학생 본인과 멘토만 볼 수 있고, 친구에게는 안 보여요. 한 사람에 10개, 파일 하나 300KB까지)
   - ▶ 실행할 때 예시 CSV와 그 프로젝트 주인이 올린 CSV를 실행 폴더에 넣어 줘서 pd.read_csv("이름.csv") 로 읽어요
   ===================================================================== */
const CSVS = window.PYSHARE_CSV || [];
const CSV_MAX = 300 * 1024;        // 파일 하나 300KB까지 (설문 응답 수천 줄)
const csvCache = {};
async function sampleText(name) {
  if (csvCache[name] != null) return csvCache[name];
  const r = await fetch('csv/' + encodeURIComponent(name));
  if (!r.ok) throw new Error('예시 CSV를 불러오지 못했어요.');
  return (csvCache[name] = (await r.text()).replace(/^﻿/, ''));
}
// 지금 연 프로젝트의 주인이 올린 파일 (주인 · 멘토만 받아요. 친구는 빈 목록). S.P.files 에 기억해 둬요.
async function projectFiles(force) {
  const P = S.P; if (!P || !P.data) return [];
  if (P.files && !force) return P.files;
  if (!(P.data.mine || S.me.role === 'mentor')) return (P.files = []);
  try { P.files = (await call('cs_project_files', { p_id: P.id })) || []; } catch (e) { P.files = P.files || []; }
  return P.files;
}
// 실행할 때 넣을 파일 목록 (올린 CSV가 예시와 이름이 같으면 올린 것이 이겨요)
async function runFiles() {
  const out = {};
  await Promise.all(CSVS.map(async (c) => { try { out[c.name] = await sampleText(c.name); } catch (e) {} }));
  (await projectFiles()).forEach((f) => { out[f.name] = f.content; });
  return Object.entries(out).map(([name, text]) => ({ name, text }));
}
// 올린 파일 글자 읽기: UTF-8 이 아니면 엑셀 한글(CP949)로 읽어서 UTF-8 로 바꿔요
function decodeCsv(buf) {
  const u8 = new Uint8Array(buf);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, ''); }
  catch (e) { try { return new TextDecoder('euc-kr').decode(u8); } catch (x) { return null; } }
}
// 미리 보기용 CSV 나누기 (따옴표 안의 쉼표·줄바꿈도 처리)
function parseCsv(text, maxRows = 6) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
      if (rows.length >= maxRows) return rows;
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const csvRows = (t) => Math.max(0, String(t).split(/\r\n|\n|\r/).filter((l) => l.trim()).length - 1);
const safeCsvName = (n) => {
  let b = String(n || 'data.csv').replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').replace(/^\.+/, '').slice(0, 60) || 'data';
  return b + '.csv';
};
function csvTable(text) {
  const rows = parseCsv(text, 6);
  if (!rows.length) return '<p class="muted small">비어 있어요</p>';
  const [head, ...body] = rows;
  return `<div class="df-table"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${body.map((r) => `<tr>${head.map((_, i) => `<td>${esc(r[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const readSnippet = (name, code) => `${/import pandas as pd/.test(code) ? '' : 'import pandas as pd\n\n'}df = pd.read_csv("${name}")
print(len(df), "줄")
print(df.columns.tolist())   # 열(질문) 이름 보기
`;
// 편집기 위 [📄 데이터] 서랍
async function openData() {
  const P = S.P; if (!P) return;
  const mentor = S.me.role === 'mentor', mine = !!P.data.mine;
  openDrawer('데이터 파일 (CSV)', '<p class="muted">불러오는 중…</p>');
  const texts = {};
  await Promise.all([
    ...CSVS.map(async (c) => { try { texts[c.name] = await sampleText(c.name); } catch (e) { texts[c.name] = null; } }),
    projectFiles(true),
  ]);
  if (S.P !== P || $('#drawer').hidden) return;
  const canEdit = P.cm && !P.viewing;
  const fileBox = (name, text, about, removable) => `<div class="dfile">
      <div class="df-top"><code class="df-name">${esc(name)}</code><span class="muted small">${text == null ? '불러오지 못함' : `${csvRows(text)}줄 · ${(parseCsv(text, 1)[0] || []).length}칸`}</span></div>
      ${about ? `<p class="small df-about">${about}</p>` : ''}
      ${text != null ? `<details><summary>미리 보기</summary>${csvTable(text)}</details>` : ''}
      <div class="df-acts">${canEdit && text != null ? `<button class="btn tiny" data-ins="${esc(name)}">읽는 코드 넣기</button>` : ''}
        <button class="btn tiny" data-cp="${esc(name)}">이름 복사</button>
        ${text != null ? `<button class="btn tiny ghost" data-dl="${esc(name)}">내려받기</button>` : ''}
        ${removable ? `<button class="btn tiny ghost danger" data-rm="${esc(name)}">지우기</button>` : ''}</div>
    </div>`;
  const render = () => {
    const up = P.files || [];
    const kb = (n) => (n < 1024 ? n + 'B' : Math.round(n / 1024) + 'KB');
    const head = mine ? `내 CSV <span class="muted small">${up.length}/10개 · 파이랩에 저장돼요</span>`
      : mentor ? `${esc(P.data.nickname)}${josa(P.data.nickname, '이', '가')} 올린 CSV` : '';
    $('#drawerBody').innerHTML = `
      <p class="small">코드에서 파일 이름으로 읽어요. <code>pd.read_csv("study_survey.csv")</code></p>
      ${mine || mentor ? `<h3 class="df-h">${head}</h3>
        ${up.length ? up.map((f) => fileBox(f.name, f.content, `올린 날 ${when(f.updated_at)} · ${kb(f.size || 0)}`, mine)).join('')
          : `<p class="muted small">${mine ? '아직 없어요. 내 설문 응답 CSV를 올려 보세요.' : '아직 올린 파일이 없어요.'}</p>`}
        ${mine ? `<label class="btn primary df-up" for="csvUp">${icon('plus')} CSV 올리기</label>
          <input type="file" id="csvUp" class="sr" accept=".csv,.tsv,.txt,text/csv">
          <p class="form-err" id="csvErr" role="alert"></p>
          <ul class="df-tips small muted">
            <li>구글폼: 응답 탭 → Sheets에 연결 → 파일 → 다운로드 → CSV</li>
            <li>이름·학번·이메일 같은 개인정보 칸은 지우고 올려요.</li>
            <li>엑셀에서 저장한 CSV도 한글이 깨지지 않게 바꿔서 올려요.</li>
            <li>올린 파일은 나와 멘토만 볼 수 있어요. 다른 컴퓨터에서 들어와도 그대로 있어요.</li>
            <li>같은 이름으로 다시 올리면 새 내용으로 바뀌어요.</li>
          </ul>` : ''}`
      : '<p class="muted small df-note">친구가 올린 CSV는 친구와 멘토만 볼 수 있어요. 친구 코드가 CSV를 읽으면 여기서는 실행되지 않을 수 있어요.</p>'}
      <h3 class="df-h">예시 CSV</h3>
      ${CSVS.map((c) => fileBox(c.name, texts[c.name], `<b>${esc(c.title)}</b> · ${esc(c.desc)}`, false)).join('') || '<p class="muted small">예시 파일이 없어요.</p>'}`;
    const all = () => ({ ...texts, ...Object.fromEntries((P.files || []).map((f) => [f.name, f.content])) });
    const body = $('#drawerBody');
    $$('[data-ins]', body).forEach((b) => b.addEventListener('click', () => {
      const cm = S.P && S.P.cm; if (!cm) return;
      const pos = cm.getCursor(), line = cm.getLine(pos.line);
      const snip = readSnippet(b.dataset.ins, cm.getValue());
      cm.replaceRange((line.trim() ? '\n' : '') + snip, line.trim() ? { line: pos.line, ch: line.length } : { line: pos.line, ch: 0 });
      closeDrawer(); cm.focus(); toast('읽는 코드를 넣었어요. ▶ 실행해 보세요');
    }));
    $$('[data-cp]', body).forEach((b) => b.addEventListener('click', () => copyText(b.dataset.cp, b)));
    $$('[data-dl]', body).forEach((b) => b.addEventListener('click', () => {
      const t = all()[b.dataset.dl]; if (t == null) return;
      saveBlob(new Blob(['\uFEFF' + t], { type: 'text/csv;charset=utf-8' }), b.dataset.dl);
    }));
    // 지우기는 두 번 눌러야 해요 (한 번 누르면 "정말 지우기"로 바뀌어요)
    $$('[data-rm]', body).forEach((b) => b.addEventListener('click', async () => {
      if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = '정말 지우기'; b.classList.remove('ghost'); return; }
      b.disabled = true;
      try { await call('cs_file_delete', { p_name: b.dataset.rm }); await projectFiles(true); toast('지웠어요'); render(); }
      catch (e) { b.disabled = false; showErr(e); }
    }));
    const inp = $('#csvUp', body);
    inp && inp.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
      const err = (m) => { $('#csvErr').textContent = m; };
      if (f.size > CSV_MAX) { err(`파일이 너무 커요 (${Math.round(f.size / 1024)}KB). 300KB까지 올릴 수 있어요.`); return; }
      const text = decodeCsv(await f.arrayBuffer());
      if (text == null || !text.trim()) { err('CSV 글자를 읽지 못했어요.'); return; }
      const name = safeCsvName(f.name), again = (P.files || []).some((x) => x.name === name);
      const lab = $('.df-up', body); lab.classList.add('busy'); lab.textContent = '올리는 중…';
      try {
        await call('cs_file_save', { p_name: name, p_content: text });
        await projectFiles(true);
        toast(again ? `같은 이름 파일을 새 내용으로 바꿨어요: ${name}` : `올렸어요: ${name}`, 'good'); render();
      } catch (ex) { render(); $('#csvErr') && ($('#csvErr').textContent = ex.message || '올리지 못했어요.'); }
    });
  };
  render();
}
// 웹앱 프롬프트에 붙일 데이터 (예시 CSV는 내용까지, 학생 CSV는 이름만)
function csvForPrompt(code, files) {
  const names = [...new Set((String(code).match(/["']([^"'\n]+\.csv)["']/gi) || []).map((m) => m.slice(1, -1)))];
  if (!names.length) return '';
  const mine = Object.fromEntries((files || []).map((f) => [f.name, { text: f.content }]));
  return '\n\n[데이터 파일]\n이 코드는 CSV 파일을 읽어요. 웹앱 안에 CSV 내용을 문자열로 그대로 넣고, pandas가 하던 계산은 JavaScript로 똑같이 해 주세요.\n'
    + names.map((n) => {
      const t = (mine[n] && mine[n].text) || csvCache[n];
      return t ? `--- ${n} ---\n${t.trim()}` : `--- ${n} ---\n(파일을 찾지 못했어요. 학생에게 받아서 여기에 붙여 넣어 주세요.)`;
    }).join('\n\n');
}

function startRunner() {
  const P = S.P;
  if (CFG.noRun) {   // 미리보기처럼 실행기를 못 쓰는 곳
    $('#conStatus').textContent = '실행 꺼짐';
    showHint('warn', esc(CFG.noRun));
    return;
  }
  P.runner = new PyRunner.Runner({
    out: (kind, text) => conWrite(kind, text),
    image: (src) => { const img = new Image(); img.src = src; img.className = 'con-img'; img.alt = '그래프'; $('#conOut').appendChild(img); scrollCon(); },
    askInput: () => {
      $('#conStatus').textContent = '입력을 기다려요';
      const f = $('#conIn'); f.hidden = false;
      const i = $('#conInput'); i.value = ''; i.focus({ preventScroll: true }); scrollCon();
    },
    status: (s) => { if (s) $('#conStatus').textContent = s; else if (P.runner && P.runner.running) $('#conStatus').textContent = '실행 중…'; },
    ready: (info) => {
      runFiles().catch(() => {});
      if (S.P !== P) return;
      P.isReady = true;
      if (/준비/.test($('#conStatus').textContent)) $('#conStatus').textContent = '준비됨';
      $('#runBtn').disabled = false;
    },
    done: (info) => onDone(info),
  });
  P.runner.start().catch((e) => {
    if (S.P !== P) return;
    $('#conStatus').textContent = '준비 실패';
    const msg = /^BLOCKED/.test(e.message)
      ? '이 화면의 보안 설정이 파이썬 실행기(WebAssembly)를 막고 있어요. GitHub Pages에 올린 사이트에서는 실행돼요.'
      : /^TIMEOUT/.test(e.message) ? '파이썬 실행기가 90초 안에 준비되지 않았어요. 인터넷 연결을 확인하고 새로고침해 주세요.'
      : '파이썬 실행기를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.';
    showHint('bad', `${msg} <span class="muted">(${esc(e.message)})</span>`);
    $('#runBtn').disabled = false;
  });
}

function clearConsole() { $('#conOut').textContent = ''; $('#conHint').hidden = true; }
function scrollCon() { const b = $('#conBody'); b.scrollTop = b.scrollHeight; }
function conWrite(kind, text) {
  const out = $('#conOut');
  const last = out.lastChild;
  if (last && last.nodeType === 1 && last.dataset.k === kind) last.appendChild(document.createTextNode(text));
  else { const sp = document.createElement('span'); sp.dataset.k = kind; sp.className = 'k-' + kind; sp.textContent = text; out.appendChild(sp); }
  scrollCon();
}
function showHint(kind, html) { const h = $('#conHint'); h.className = 'con-hint ' + kind; h.innerHTML = html; h.hidden = false; }

async function runCode() {
  const P = S.P; if (!P || !P.cm || !P.runner || P.runner.running) return;
  clearConsole(); clearErrLine();
  $('#runBtn').disabled = true; $('#stopBtn').disabled = false;
  $('#conStatus').textContent = '실행 중…';
  P.t0 = performance.now();
  if (!isWide()) $('#console').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try { await P.runner.run(P.cm.getValue(), null, await runFiles()); $('#conStatus').textContent = '실행 중…'; }
  catch (e) { onDone({ ok: false, fatal: true }); showHint('bad', '파이썬 실행기를 불러오지 못했어요. 새로고침해 주세요.'); }
}

function sendInput() {
  const P = S.P, v = $('#conInput').value;
  if (!P.runner.sendInput(v)) { toast('입력을 보내지 못했어요. 새로고침해 주세요.', 'bad'); return; }
  $('#conIn').hidden = true;
  conWrite('echo', v + '\n');
  $('#conStatus').textContent = '실행 중…';
}

function onDone(info) {
  const P = S.P; if (!P) return;
  $('#runBtn').disabled = false; $('#stopBtn').disabled = true; $('#conIn').hidden = true;
  const sec = ((performance.now() - P.t0) / 1000).toFixed(1);
  if (info.stopped) {
    $('#conStatus').textContent = '멈췄어요';
    conWrite('sys', '\n■ 멈췄어요\n');
    if (info.reason) showHint('warn', esc(info.reason));
    return;
  }
  if (info.ok) {
    $('#conStatus').textContent = `끝 · ${sec}초`;
    if (!$('#conOut').textContent && !$('#conOut').querySelector('img')) conWrite('sys', '(화면에 출력한 것이 없어요. print()로 결과를 보여 줘요)\n');
    return;
  }
  $('#conStatus').textContent = info.line ? `오류 · ${info.line}번째 줄` : '오류';
  if (info.line && P.cm && !P.viewing) {
    P.errLine = info.line - 1;
    P.cm.addLineClass(P.errLine, 'background', 'cm-errline');
    P.cm.scrollIntoView({ line: P.errLine, ch: 0 }, 80);
  } else if (info.line && P.cm) {
    P.errLine = info.line - 1; P.cm.addLineClass(P.errLine, 'background', 'cm-errline');
  }
  if (info.hint) showHint('tip', `<b>${esc(info.name)}</b> ${info.line ? `· ${info.line}번째 줄` : ''}<br>${esc(info.hint)}`);
}

/* ---------- 저장 ---------- */
function saveModal() {
  const P = S.P; if (!P || !P.data.mine) return;
  if (P.viewing) { toast('예전 버전을 보는 중이에요. 먼저 지금 코드로 돌아가 주세요.'); return; }
  if (!P.dirty) { toast(`바뀐 게 없어요. 지금 코드가 v${P.data.latest.no}이에요.`); return; }
  openModal(`<h2>저장하기 <span class="vtag">v${P.data.latest.no + 1}</span></h2>
    <form id="svForm" novalidate>
      <label for="svNote">무엇을 바꿨나요? <span class="muted">(선택 · 나중에 기록에서 찾기 쉬워요)</span></label>
      <input id="svNote" maxlength="100" placeholder="예) 시도 횟수 7번으로 제한">
      <p class="form-err" id="svErr" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary" id="svOk">저장</button></div>
    </form>`, (m) => {
    $('#svForm', m).addEventListener('submit', async (e) => {
      e.preventDefault(); $('#svOk', m).disabled = true;
      try { await doSave(P.cm.getValue(), $('#svNote', m).value); closeModal(); }
      catch (err) { $('#svErr', m).textContent = err.message; $('#svOk', m).disabled = false; }
    });
  });
}
async function doSave(code, note) {
  const P = S.P;
  const r = await call('cs_save', { p_id: P.id, p_src: code, p_note: note || '' });
  toast(r.unchanged ? `바뀐 게 없어서 v${r.no} 그대로예요` : `v${r.no}로 저장했어요`, 'good');
  await reloadProject();
  LS.del(draftKey(P.id));
}
async function reloadProject() {
  const P = S.P;
  const keep = P.cm ? P.cm.getValue() : null;
  const viewing = P.viewing;
  P.data = await call('cs_get', { p_id: P.id });
  if (S.P !== P) return;
  // 위쪽 막대·도구만 다시 그리고, 편집기·실행 결과는 그대로 둬요
  const ed = $('#editorWrap'), con = $('#console');
  renderProject();
  $('#editorWrap').replaceWith(ed); $('#console').replaceWith(con);
  const running = !!(P.runner && P.runner.running);
  $('#runBtn').disabled = running || !P.isReady;
  $('#stopBtn').disabled = !running;
  if (viewing) { P.viewing = null; P.cm.setOption('readOnly', false); $('#editorWrap').classList.remove('old'); setCode(P.workCode != null ? P.workCode : keep); }
  updateDirty();
}

/* ---------- 버전 기록 ---------- */
function openHistory() {
  const P = S.P, d = P.data;
  const cur = P.viewing ? P.viewing.no : d.latest.no;
  openDrawer(`기록 · 버전 ${d.versions.length}개`, `
    <p class="muted small">저장할 때마다 버전이 하나씩 쌓여요. 눌러서 예전 코드를 보고, 실행해 볼 수 있어요.</p>
    <ol class="vlist">${d.versions.map((v) => `
      <li><button class="vitem ${v.no === cur ? 'on' : ''}" data-no="${v.no}" ${v.no === cur ? 'aria-current="true"' : ''}>
        <span class="vtag">v${v.no}</span>
        <span class="vnote">${v.note ? esc(v.note) : '<span class="muted">메모 없음</span>'}</span>
        <span class="vmeta">${when(v.created_at)} · ${v.lines}줄${v.no === d.latest.no ? ' · <b>최신</b>' : ''}</span>
      </button></li>`).join('')}</ol>`, (b) => {
    $$('.vitem', b).forEach((btn) => btn.addEventListener('click', () => { closeDrawer(); openVersion(Number(btn.dataset.no)); }));
  });
}
async function openVersion(no) {
  const P = S.P;
  if (no === P.data.latest.no) { if (P.viewing) exitVersion(); return; }
  let v;
  try { v = await call('cs_version', { p_id: P.id, p_no: no }); } catch (e) { return showErr(e); }
  if (S.P !== P) return;
  if (!P.viewing) P.workCode = P.cm.getValue();
  P.viewing = v;
  setCode(v.code);
  P.cm.setOption('readOnly', true);
  $('#editorWrap').classList.add('old');
  showBanner('old', `<b>v${v.no}</b> 보는 중 · ${v.note ? esc(v.note) + ' · ' : ''}${when(v.created_at)}
    <span class="muted">· 읽기 전용이에요. 실행은 해 볼 수 있어요.</span>`,
    `<button class="btn small" data-act="back">지금 코드로 돌아가기</button>
    ${P.data.mine ? `<button class="btn small primary" data-act="restore">이 버전으로 되돌리기</button>` : ''}`);
  updateDirty();
}
function exitVersion() {
  const P = S.P; if (!P.viewing) return;
  P.viewing = null;
  setCode(P.workCode != null ? P.workCode : P.data.latest.code);
  P.cm.setOption('readOnly', false);
  $('#editorWrap').classList.remove('old');
  hideBanner('old');
  updateDirty();
}
function restoreModal(v) {
  const P = S.P;
  openModal(`<h2>v${v.no}으로 되돌릴까요?</h2>
    <p>v${v.no} 코드를 <b>새 버전 v${P.data.latest.no + 1}</b>로 저장해요. 지금까지의 버전은 기록에 그대로 남아서, 언제든 다시 돌아갈 수 있어요.</p>
    ${P.dirty ? '<p class="warnline">저장하지 않은 고침은 사라져요.</p>' : ''}
    <p class="form-err" id="rsErr" role="alert"></p>
    <div class="modal-actions"><button class="btn" data-close>취소</button><button class="btn primary" id="rsOk">되돌리기</button></div>`, (m) => {
    $('#rsOk', m).addEventListener('click', async () => {
      $('#rsOk', m).disabled = true;
      try {
        const code = v.code;
        P.viewing = null; P.cm.setOption('readOnly', false); $('#editorWrap').classList.remove('old'); hideBanner();
        setCode(code);
        await doSave(code, `v${v.no}로 되돌림`);
        closeModal();
      } catch (err) { $('#rsErr', m).textContent = err.message; $('#rsOk', m).disabled = false; }
    });
  });
}

/* ---------- 피드백 ---------- */
function openFeedback() {
  const P = S.P, d = P.data, mentor = S.me.role === 'mentor';
  const list = d.feedback || [];
  const atNo = P.viewing ? P.viewing.no : d.latest.no;
  openDrawer('멘토 피드백', `
    ${mentor ? `<form class="fb-form" id="fbForm">
      <label for="fbText">피드백 남기기 <span class="muted">· ${esc(d.nickname)}에게만 보여요</span></label>
      <textarea id="fbText" rows="4" maxlength="2000" placeholder="잘한 점 하나 + 다음 도전 하나를 적어 주면 좋아요"></textarea>
      <div class="fb-actions"><span class="muted small">지금 보고 있는 <span class="vtag">v${atNo}</span>에 남겨요</span><button class="btn primary small" id="fbOk">남기기</button></div>
      <p class="form-err" id="fbErr" role="alert"></p>
    </form>` : `<p class="muted small">멘토가 남긴 피드백이에요. 나와 멘토만 볼 수 있어요.</p>`}
    ${list.length ? `<ul class="fblist">${list.map((f) => `
      <li class="fb ${P.unseenAtOpen.includes(f.id) && !mentor ? 'fresh' : ''}">
        <div class="fb-meta">${f.version_no ? `<button class="vtag link" data-no="${f.version_no}" title="이 버전 보기">v${f.version_no}</button> 보고` : ''} · ${when(f.created_at)}
          ${P.unseenAtOpen.includes(f.id) && !mentor ? '<span class="badge new">새 글</span>' : ''}
          ${mentor ? (f.seen ? '<span class="muted small">학생이 읽음</span>' : '<span class="muted small">아직 안 읽음</span>') : ''}</div>
        <p class="fb-body">${esc(f.body)}</p>
        ${mentor ? `<button class="btn ghost small del" data-fid="${f.id}">지우기</button>` : ''}
      </li>`).join('')}</ul>` : `<div class="empty small">아직 피드백이 없어요.</div>`}`, (b) => {
    $$('[data-no]', b).forEach((x) => x.addEventListener('click', () => { closeDrawer(); openVersion(Number(x.dataset.no)); }));
    $$('.del', b).forEach((x) => x.addEventListener('click', async () => {
      if (x.dataset.sure !== '1') { x.dataset.sure = '1'; x.textContent = '정말 지울까요?'; x.classList.add('danger'); return; }
      try { await call('cs_m_feedback_delete', { p_fid: Number(x.dataset.fid) }); await reloadProject(); openFeedback(); } catch (e) { showErr(e); }
    }));
    const form = $('#fbForm', b);
    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = $('#fbText', b).value.trim();
      if (!body) { $('#fbErr', b).textContent = '피드백 내용을 적어 주세요.'; return; }
      $('#fbOk', b).disabled = true;
      try { await call('cs_m_feedback', { p_id: P.id, p_no: atNo, p_body: body }); toast('피드백을 남겼어요', 'good'); const wasViewing = P.viewing; await reloadProject(); if (wasViewing) openVersion(wasViewing.no); openFeedback(); }
      catch (err) { $('#fbErr', b).textContent = err.message; $('#fbOk', b).disabled = false; }
    });
  });
  P.unseenAtOpen = P.unseenAtOpen.slice();   // 한 번 연 뒤에도 '새 글' 표시는 이 화면에 있는 동안 유지
  const dot = $('#fbBtn .newdot'); dot && dot.remove();
}

/* ---------- 설정 ---------- */
function openSettings() {
  const P = S.P, d = P.data;
  openModal(`<h2>프로젝트 설정</h2>
    ${d.mine ? `<form id="stForm" novalidate>
      <label for="stTitle">이름</label><input id="stTitle" maxlength="60" value="${esc(d.title)}">
      <label for="stDesc">한 줄 설명</label><input id="stDesc" maxlength="300" value="${esc(d.description)}">
      ${WEEKS.length ? `<label for="stWeek">주차</label><select id="stWeek">${weekOptions(d.week)}</select>` : ''}
      <fieldset class="seg"><legend>누가 볼 수 있나요?</legend>
        <label><input type="radio" name="sh" value="1" ${d.shared ? 'checked' : ''}> 친구에게 공개</label>
        <label><input type="radio" name="sh" value="0" ${d.shared ? '' : 'checked'}> 나만 보기</label>
      </fieldset>
      <p class="muted small">나만 보기여도 멘토는 볼 수 있어요.</p>
      <p class="form-err" id="stErr" role="alert"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>닫기</button><button class="btn primary" id="stOk">바꾸기</button></div>
    </form>` : `<p class="muted">멘토는 학생 프로젝트를 지울 수만 있어요. 이름·공개 설정은 학생이 바꿔요.</p>`}
    <div class="danger-zone">
      <h3>프로젝트 지우기</h3>
      <p class="muted small">모든 버전과 피드백이 함께 지워지고 되돌릴 수 없어요. 확인을 위해 프로젝트 이름 <b>${esc(d.title)}</b>을(를) 똑같이 적어 주세요.</p>
      <div class="del-row"><input id="delIn" aria-label="프로젝트 이름 확인" placeholder="${esc(d.title)}"><button class="btn danger" id="delOk">지우기</button></div>
      <p class="form-err" id="delErr" role="alert"></p>
    </div>
    ${d.mine ? '' : '<div class="modal-actions"><button class="btn" data-close>닫기</button></div>'}`, (m) => {
    const f = $('#stForm', m);
    f && f.addEventListener('submit', async (e) => {
      e.preventDefault(); $('#stOk', m).disabled = true;
      try {
        await call('cs_update', { p_id: P.id, p_title: $('#stTitle', m).value, p_desc: $('#stDesc', m).value, p_shared: $('input[name=sh]:checked', m).value === '1', p_week: $('#stWeek', m) && $('#stWeek', m).value ? Number($('#stWeek', m).value) : null });
        closeModal(); toast('바꿨어요', 'good'); S.list = null; await reloadProject(); document.title = `${P.data.title} · 파이랩`;
      } catch (err) { $('#stErr', m).textContent = err.message; $('#stOk', m).disabled = false; }
    });
    $('#delOk', m).addEventListener('click', async () => {
      $('#delOk', m).disabled = true;
      try {
        await call('cs_delete', { p_id: P.id, p_confirm: $('#delIn', m).value });
        LS.del(draftKey(P.id)); P.dirty = false; closeModal(); toast('지웠어요'); S.list = null; location.hash = '#home';
      } catch (err) { $('#delErr', m).textContent = err.message; $('#delOk', m).disabled = false; }
    });
  });
}

/* =====================================================================
   4) 학생 관리 (멘토)
   ===================================================================== */
async function viewMembers() {
  document.title = '학생 관리 · 파이랩';
  const tok = S.seq;
  if (!$('.members')) $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let M;
  try { M = await call('cs_m_members'); } catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)}</div>`; return; }
  if (tok !== S.seq || location.hash !== '#members') return;
  const pinCell = (m) => m.locked ? '<span class="badge bad">잠김</span>' : m.has_pin ? '<span class="badge">정함</span>' : '<span class="muted">아직 안 정함</span>';
  $('#app').innerHTML = `
  <section class="members">
    <div class="week-nav"><a class="back" href="#home">← 대시보드</a></div>
    <div class="sec-head first"><h1>학생 관리 <span class="count">${M.length}</span></h1>
      <p class="muted">명단에 있는 학생만 학번·이름으로 들어올 수 있어요. 처음 들어올 때 학생이 비밀번호 4자리를 정해요.</p></div>
    <div class="panel add-panel">
    <h2>학생 추가</h2>
    <form class="add-row" id="addForm" novalidate>
      <input id="sidAdd" inputmode="numeric" maxlength="10" placeholder="학번 (예: 10101)" aria-label="학번">
      <input id="nameAdd" maxlength="20" placeholder="이름" aria-label="이름">
      <button class="btn primary">명단에 추가</button>
    </form>
    <details class="bulk">
      <summary>여러 명 한 번에 추가</summary>
      <p class="muted small"><b>학번 이름</b>을 한 줄에 한 명씩 적거나, <b>10101김민수, 10102이지은</b>처럼 쉼표로 이어 적어도 돼요. 엑셀에서 두 칸을 복사해 붙여 넣어도 돼요.</p>
      <textarea id="bulkIn" rows="4" placeholder="10101 김민수&#10;10102이지은, 10103박서준"></textarea>
      <button class="btn small" id="bulkOk">모두 추가</button>
    </details>
    <p class="form-err" id="addErr" role="alert"></p>
    </div>
    ${M.length ? `
    <div class="mtable" role="table" aria-label="학생 명단">
      <div class="mrow head" role="row"><span role="columnheader">학번</span><span role="columnheader">이름</span><span role="columnheader">비밀번호</span><span role="columnheader">프로젝트</span><span role="columnheader">저장</span><span role="columnheader">마지막 저장</span><span role="columnheader">상태</span><span role="columnheader">관리</span></div>
      ${M.map((m) => `
      <div class="mrow ${m.active ? '' : 'off'}" role="row" data-id="${m.id}">
        <span class="msid" role="cell">${esc(m.sid || '-')}</span>
        <span class="mnick" role="cell">${esc(m.nickname)}</span>
        <span role="cell"><i class="ml">비밀번호</i>${pinCell(m)}</span>
        <span role="cell"><i class="ml">프로젝트</i>${m.projects}</span>
        <span role="cell"><i class="ml">저장</i>${m.saves}번</span>
        <span role="cell"><i class="ml">마지막 저장</i>${m.last_save ? ago(m.last_save) : '-'}</span>
        <span class="mstate" role="cell"><button class="btn tiny ${m.active ? 'on' : ''}" data-act="toggle">${m.active ? '사용 중' : '쉬는 중'}</button></span>
        <span class="macts" role="cell">
          <button class="btn ghost tiny" data-act="edit">학번·이름 고치기</button>
          <button class="btn ghost tiny" data-act="reset" ${m.has_pin || m.locked ? '' : 'disabled'}>비밀번호 초기화</button>
          <button class="btn ghost tiny danger" data-act="remove">지우기</button></span>
      </div>`).join('')}
    </div>
    <p class="muted small members-foot">쉬는 중인 학생은 로그인할 수 없고, 프로젝트도 친구들에게 안 보여요 (기록은 남아요). 비밀번호를 10번 틀리면 잠기고, 초기화하면 풀려요.</p>`
    : '<div class="empty">아직 명단이 비어 있어요. 위에서 학번과 이름을 적어 추가해 주세요.</div>'}
  </section>`;

  $('#addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sid = $('#sidAdd').value.trim(), name = $('#nameAdd').value.trim();
    try { await call('cs_m_add', { p_sid: sid, p_name: name }); toast(`${name} 학생을 추가했어요`, 'good'); await viewMembers(); $('#sidAdd') && $('#sidAdd').focus(); }
    catch (err) { $('#addErr').textContent = err.message; }
  });
  $('#bulkOk').addEventListener('click', async () => {
    const { people, leftover } = parseRoster($('#bulkIn').value);
    if (!people.length) { $('#addErr').textContent = '"10101 김민수"처럼 학번과 이름을 적어 주세요.'; return; }
    $('#bulkOk').disabled = true;
    let ok = 0; const bad = leftover.map((t) => `${t}: 학번과 이름을 알아보지 못했어요`);
    for (const [sid, name] of people) {
      try { await call('cs_m_add', { p_sid: sid, p_name: name }); ok++; }
      catch (err) { bad.push(`${sid} ${name}: ${err.message}`); }
    }
    await viewMembers();
    toast(`${ok}명 추가했어요`, ok ? 'good' : '');
    if (bad.length) $('#addErr').textContent = '추가하지 못한 줄 — ' + bad.join(' / ');
  });
  $$('.mrow[data-id]').forEach((row) => {
    const m = M.find((x) => x.id === Number(row.dataset.id));
    row.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
      if (b.dataset.act === 'toggle') return memberUpdate(m, m.sid, m.nickname, !m.active);
      if (b.dataset.act === 'edit') return editModal(m);
      if (b.dataset.act === 'reset') return resetPinModal(m);
      if (b.dataset.act === 'remove') return removeModal(m);
    });
  });
}
// 명단 붙여 넣기 읽기: "10101 김민수" 한 줄씩, "10428정지안, 10313안호준" 한 줄에 여러 명,
// 엑셀에서 두 칸 복사(탭) 모두 돼요. 학번(숫자 4~10자리) 바로 뒤의 글자를 이름으로 봐요.
function parseRoster(text) {
  const people = [], re = /(\d{4,10})[\s,]*([^\d,\n\t]+)/g;
  let m;
  while ((m = re.exec(text))) { const name = m[2].trim(); if (name) people.push([m[1], name]); }
  const leftover = text.replace(re, ' ').split(/[\s,]+/).filter(Boolean);
  return { people, leftover };
}
async function memberUpdate(m, sid, name, active) {
  try { await call('cs_m_update', { p_mid: m.id, p_sid: sid, p_name: name, p_active: active }); S.list = null; await viewMembers(); }
  catch (e) { showErr(e); }
}
function editModal(m) {
  openModal(`<h2>학번·이름 고치기</h2><form id="edForm" novalidate>
    <label for="edSid">학번</label><input id="edSid" inputmode="numeric" maxlength="10" value="${esc(m.sid || '')}">
    <label for="edName">이름</label><input id="edName" maxlength="20" value="${esc(m.nickname)}">
    <p class="muted small">학생은 바뀐 학번·이름으로 들어와요. 비밀번호와 프로젝트는 그대로예요.</p>
    <p class="form-err" id="edErr" role="alert"></p>
    <div class="modal-actions"><button type="button" class="btn" data-close>취소</button><button class="btn primary">바꾸기</button></div></form>`, (c) => {
    $('#edForm', c).addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await call('cs_m_update', { p_mid: m.id, p_sid: $('#edSid', c).value, p_name: $('#edName', c).value, p_active: m.active }); closeModal(); S.list = null; viewMembers(); }
      catch (err) { $('#edErr', c).textContent = err.message; }
    });
  });
}
function resetPinModal(m) {
  openModal(`<h2>${esc(m.nickname)}의 비밀번호를 초기화할까요?</h2>
    <p>비밀번호를 잊었거나 10번 틀려 잠겼을 때 써요. 학생은 다음에 들어올 때 <b>새 비밀번호 4자리</b>를 정해요.
    다른 기기에 로그인돼 있던 것도 풀려요. 프로젝트는 그대로 남아요.</p>
    <p class="warnline">초기화한 뒤에는 학생이 바로 들어와서 새 비밀번호를 정하게 해 주세요. 그 전에 다른 사람이 먼저 정할 수도 있어요.</p>
    <p class="form-err" id="rpErr" role="alert"></p>
    <div class="modal-actions"><button class="btn" data-close>취소</button><button class="btn primary" id="rpOk">초기화</button></div>`, (c) => {
    $('#rpOk', c).addEventListener('click', async () => {
      try { await call('cs_m_reset_pin', { p_mid: m.id }); closeModal(); toast('초기화했어요', 'good'); viewMembers(); }
      catch (err) { $('#rpErr', c).textContent = err.message; }
    });
  });
}
function removeModal(m) {
  openModal(`<h2>${esc(m.nickname)} 지우기</h2>
    <p>이 학생의 <b>프로젝트 ${m.projects}개와 모든 버전·피드백</b>이 함께 지워지고 되돌릴 수 없어요.
    잠깐 막기만 하려면 <b>쉬는 중</b>으로 바꾸세요.</p>
    <label for="rmIn">확인: 이름 <b>${esc(m.nickname)}</b>을(를) 똑같이 적어 주세요</label><input id="rmIn">
    <p class="form-err" id="rmErr" role="alert"></p>
    <div class="modal-actions"><button class="btn" data-close>취소</button><button class="btn danger" id="rmOk">지우기</button></div>`, (c) => {
    $('#rmOk', c).addEventListener('click', async () => {
      try { await call('cs_m_remove', { p_mid: m.id, p_confirm: $('#rmIn', c).value }); closeModal(); toast('지웠어요'); S.list = null; viewMembers(); }
      catch (err) { $('#rmErr', c).textContent = err.message; }
    });
  });
}

/* =====================================================================
   시작
   ===================================================================== */
(async function boot() {
  window.addEventListener('hashchange', route);
  PyRunner.ensureSW();   // 입력 다리를 미리 준비 (처음 방문 때)
  const saved = SS.get(KEY_CODE) || LS.get(KEY_CODE);
  if (saved) {
    try { S.me = await rpc('cs_login', { p_code: saved }); S.code = saved; }
    catch (e) {
      if (e.user) { LS.del(KEY_CODE); SS.del(KEY_CODE); S.loginMsg = '로그인이 풀렸어요. 다시 들어와 주세요.'; }
      else S.loginMsg = e.message;
    }
  }
  route();
})();
