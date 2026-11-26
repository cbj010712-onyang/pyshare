/* =====================================================================
   멘토링 아카이브 · 더한 기능 (지금은 미리보기 전용)
     #progress  진행 현황표 (멘토) + 참여 확인서
     #fbq       피드백 빠르게 쓰기 (멘토)
     #show      발표회 모드 (멘토)
     주차 공지, 마무리 모드, 버전 비교
   app.js 뒤에 불러와요. app.js 의 $, call, S, esc 같은 도구를 그대로 써요.
   서버 함수: cs_class, cs_m_week_notice, cs_m_close (supabase_codeshare.sql)
   ===================================================================== */
'use strict';

Object.assign(IC, {
  mega: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  pen: '<path d="M5 19l1-4L16 5l3 3L9 18z"/><path d="M14 7l3 3"/>',
  stage: '<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 20l4.5-2 4.5 2-1.5-6.5"/>',
});

/* ---------- 주차 공지 ---------- */
async function loadClass() {
  try { S.cls = await call('cs_class'); }
  catch (e) { if (!e.message) throw e; S.cls = S.cls || { closed: false, notices: {} }; }
  applyClosed();
  return S.cls;
}
function applyClosed() {
  document.body.classList.toggle('is-closed', !!(S.me && S.me.role !== 'mentor' && S.cls && S.cls.closed));
}
const isClosed = () => !!(S.cls && S.cls.closed);
// 주차 공지: { note, at }
const noticeOf = (n) => { const x = S.cls && S.cls.notices && S.cls.notices[n]; return x && x.note ? x : null; };
function noticeBox(n) {
  const x = noticeOf(n); if (!x) return '';
  return `<div class="notice">${icon('mega')}<div><b>멘토 공지 · ${Number(n)}주차 <span class="nt-at">${x.at ? ago(x.at) : ''}</span></b><p>${esc(x.note)}</p></div></div>`;
}
// 학생 홈: 지금 주차 공지 + 7일 안에 새로 쓴 다른 주차 공지 (최대 2개, 지금 주차 먼저)
function noticesFor(cur) {
  const fresh = (x) => x.at && Date.now() - new Date(x.at) < 7 * 86400000;
  const ns = WEEKS.map((w) => w.no).filter((n) => { const x = noticeOf(n); return x && (n === cur || fresh(x)); });
  ns.sort((a, b) => (a === cur ? -1 : b === cur ? 1 : new Date(noticeOf(b).at) - new Date(noticeOf(a).at)));
  return ns.slice(0, 2).map(noticeBox).join('');
}
function closedBar() {
  if (!isClosed()) return '';
  return `<div class="closed-bar">${icon('lock')}<div><b>활동이 마무리됐어요</b>
    <p>지금은 기록을 읽기만 할 수 있어요. 코드 저장·활동지 제출은 닫혔어요. 내 코드와 활동지는 [내 결과물 받기]로 한 번에 내려받아 두세요.</p></div></div>`;
}

// 멘토: 주차 화면의 공지 칸
function noticeEditor(n) {
  const x = noticeOf(n) || {};
  return `<div class="panel notice-edit"><h2>${icon('mega')} ${Number(n)}주차 공지</h2>
    <p class="muted small">학생의 ${Number(n)}주차 화면 맨 위에 보여요. 지금 이 주차를 하는 학생과, 공지를 쓴 뒤 7일 동안은 다른 학생의 홈에도 보여요.</p>
    <form id="ntForm" class="nt-form" novalidate>
      <label class="grow"><span class="sr">공지</span><textarea id="ntNote" rows="2" maxlength="300" placeholder="예) 설문 CSV는 [데이터]에 올려 두세요. 금요일 수업 전까지 활동지 제출!">${esc(x.note || '')}</textarea></label>
      <div class="nt-acts"><button class="btn primary small" id="ntOk">저장</button>${x.note ? '<button type="button" class="btn ghost small" id="ntDel">지우기</button>' : ''}</div>
    </form><p class="muted small nt-foot">300글자까지${x.at ? ` · 마지막으로 고친 때 ${when(x.at)}` : ''}</p><p class="form-err" id="ntErr" role="alert"></p></div>`;
}
function bindNoticeEditor(n, after) {
  const f = $('#ntForm'); if (!f) return;
  const send = async (note) => {
    try { await call('cs_m_week_notice', { p_week: n, p_note: note }); await loadClass(); toast(note.trim() ? '공지를 저장했어요' : '공지를 지웠어요', 'good'); after(); }
    catch (e) { $('#ntErr').textContent = e.message || ''; }
  };
  f.addEventListener('submit', (e) => { e.preventDefault(); send($('#ntNote').value); });
  $('#ntDel') && $('#ntDel').addEventListener('click', () => send(''));
}

/* ---------- 멘토 대시보드: 운영 칸 (마무리 모드) ---------- */
function opsPanel() {
  const on = isClosed();
  return `<div class="panel ops-panel ${on ? 'is-on' : ''}">
    <div class="ops-head"><h2>${icon('lock')} 활동 마무리</h2>
      <div class="seg2" role="radiogroup" aria-label="마무리 모드">
        <button type="button" role="radio" aria-checked="${!on}" class="${on ? '' : 'on'}" data-closemode="0">진행 중</button>
        <button type="button" role="radio" aria-checked="${on}" class="${on ? 'on' : ''}" data-closemode="1">마무리 (읽기 전용)</button></div></div>
    <p class="muted small">${on ? `${S.cls.closed_at ? when(S.cls.closed_at) + '에 ' : ''}마무리했어요. 학생은 로그인해서 기록을 보고 결과물을 내려받을 수만 있어요. 저장·제출·웹앱 요청은 막혀요.`
      : '발표회가 끝나면 마무리로 바꿔요. 학생 기록이 실수로 바뀌거나 지워지지 않게 읽기 전용으로 잠가요. 언제든 다시 진행 중으로 돌릴 수 있어요.'}</p>
    <div class="panel-actions"><button class="btn small" id="cleanBtn">개인정보 정리 안내</button></div>
  </div>`;
}
function bindOps(after) {
  $$('.ops-panel [data-closemode]').forEach((b) => b.addEventListener('click', () => {
    const want = b.dataset.closemode === '1';
    if (want === isClosed()) return;
    if (!want) return setClosed(false, after);
    openModal(`<h2>${icon('lock')} 활동을 마무리할까요?</h2>
      <p>학생은 계속 로그인할 수 있지만 <b>읽기만</b> 할 수 있어요. 코드 저장, 활동지·보고서 제출, 데이터 올리기, 웹앱 요청이 모두 막혀요.</p>
      <p class="muted small">멘토는 그대로 피드백을 남기고 웹앱을 올릴 수 있어요. 다시 [진행 중]을 누르면 풀려요.</p>
      <div class="modal-actions"><button class="btn" data-close>취소</button><button class="btn primary" id="clOk">마무리하기</button></div>`, (m) => {
      $('#clOk', m).addEventListener('click', () => { closeModal(); setClosed(true, after); });
    });
  }));
  $('#cleanBtn') && $('#cleanBtn').addEventListener('click', cleanupGuide);
}
async function setClosed(on, after) {
  try { await call('cs_m_close', { p_on: on }); await loadClass(); toast(on ? '마무리 모드로 바꿨어요. 학생은 읽기만 할 수 있어요.' : '다시 진행 중으로 바꿨어요', 'good'); after(); }
  catch (e) { showErr(e); }
}
// 활동이 끝난 뒤 학생 개인정보를 정리하는 순서 (안내만, 자동으로 지우지 않아요)
function cleanupGuide() {
  const steps = [
    ['결과물부터 받아 두기', '대시보드의 [⬇ 결과물 받기 (zip)]로 학생마다 완성작·웹앱·주차별 코드·활동지를 받아요. 진행 현황표의 [CSV로 받기]와 참여 확인서도 이때 함께 저장해요.'],
    ['학생에게 나눠 주기', '학생이 [내 결과물 받기]로 직접 받게 하거나, 받은 zip을 학생에게 전해요. 받은 zip에는 이름·학번이 있으니 공유 드라이브에 오래 두지 않아요.'],
    ['마무리 모드로 잠그기', '위의 [마무리 (읽기 전용)]을 눌러 더 바뀌지 않게 해요. 학생이 결과물을 받을 시간을 1~2주 주면 좋아요.'],
    ['학생 지우기', '학생 관리에서 학생마다 [지우기]를 눌러요. 프로젝트·버전·피드백·활동지·올린 CSV가 함께 지워지고 되돌릴 수 없어요.'],
    ['깃허브 웹앱 정리', '깃허브 저장소의 apps 폴더에 올린 p번호.html 파일을 지우거나, 저장소를 비공개(Private)로 바꿔요. 웹앱 안에 이름이 적혀 있지 않은지도 확인해요.'],
    ['Supabase 정리', '다음 기수에 쓰지 않으면 Supabase 프로젝트를 일시 중지(Pause)하거나 삭제해요. 다시 쓴다면 멘토 비밀번호를 새로 바꿔요.'],
    ['내 컴퓨터 정리', '내려받은 zip·CSV·확인서 PDF 중 필요 없는 것은 지워요. 학교에 내야 하는 것만 남겨요.'],
  ];
  openModal(`<h2>개인정보 정리 안내</h2>
    <p class="muted small">활동이 끝나면 이 순서로 정리해요. 이 화면은 안내만 하고, 아무것도 자동으로 지우지 않아요.</p>
    <ol class="clean-steps">${steps.map(([t, d]) => `<li><b>${esc(t)}</b><p>${esc(d)}</p></li>`).join('')}</ol>
    <div class="modal-actions"><a class="btn" href="#members" data-close>학생 관리로</a><button class="btn primary" data-close>알겠어요</button></div>`);
  $('#modalCard').classList.add('wide');
}

/* =====================================================================
   버전 비교: 두 버전의 코드를 줄 단위로 비교해요 (LCS)
   ===================================================================== */
function lineDiff(oldText, newText) {
  const A = String(oldText).replace(/\n$/, '').split('\n'), B = String(newText).replace(/\n$/, '').split('\n');
  const n = A.length, m = B.length;
  let s = 0; while (s < n && s < m && A[s] === B[s]) s++;
  let e = 0; while (e < n - s && e < m - s && A[n - 1 - e] === B[m - 1 - e]) e++;
  const a = A.slice(s, n - e), b = B.slice(s, m - e), N = a.length, M = b.length;
  const rows = [];
  for (let i = 0; i < s; i++) rows.push({ t: '=', x: i + 1, y: i + 1, s: A[i] });
  if (N * M > 4e6) {   // 너무 길면 통째로 지움·추가로 보여요
    a.forEach((t, i) => rows.push({ t: '-', x: s + i + 1, s: t }));
    b.forEach((t, j) => rows.push({ t: '+', y: s + j + 1, s: t }));
  } else {
    // dp[i][j] = a[i:] 와 b[j:] 의 가장 긴 같은 줄 수
    const W = M + 1, dp = new Uint32Array((N + 1) * W);
    for (let i = N - 1; i >= 0; i--) for (let j = M - 1; j >= 0; j--) {
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    }
    let i = 0, j = 0;
    while (i < N || j < M) {
      if (i < N && j < M && a[i] === b[j]) { rows.push({ t: '=', x: s + i + 1, y: s + j + 1, s: a[i] }); i++; j++; }
      else if (j < M && (i >= N || dp[i * W + j + 1] >= dp[(i + 1) * W + j])) { rows.push({ t: '+', y: s + j + 1, s: b[j] }); j++; }
      else { rows.push({ t: '-', x: s + i + 1, s: a[i] }); i++; }
    }
  }
  for (let k = 0; k < e; k++) rows.push({ t: '=', x: n - e + k + 1, y: m - e + k + 1, s: A[n - e + k] });
  return rows;
}
// 바뀐 곳 주변 3줄만 보이고, 길게 같은 곳은 접어요
function diffHTML(rows) {
  const add = rows.filter((r) => r.t === '+').length, del = rows.filter((r) => r.t === '-').length;
  if (!add && !del) return { add, del, html: '<div class="empty small">두 버전의 코드가 똑같아요.</div>' };
  const near = rows.map(() => false);
  rows.forEach((r, k) => { if (r.t !== '=') for (let d = -3; d <= 3; d++) if (rows[k + d]) near[k + d] = true; });
  let html = '', skip = 0;
  const flush = () => { if (skip) { html += `<tr class="fold"><td colspan="4">⋯ 같은 줄 ${skip}개</td></tr>`; skip = 0; } };
  rows.forEach((r, k) => {
    if (!near[k]) { skip++; return; }
    flush();
    html += `<tr class="${r.t === '+' ? 'add' : r.t === '-' ? 'del' : ''}"><td class="ln">${r.x || ''}</td><td class="ln">${r.y || ''}</td><td class="sg">${r.t === '=' ? '' : r.t === '+' ? '+' : '−'}</td><td class="cd">${esc(r.s) || ' '}</td></tr>`;
  });
  flush();
  return { add, del, html: `<div class="diff-wrap"><table class="diff"><tbody>${html}</tbody></table></div>` };
}
// 기록에서 두 버전 고르기 → 비교 창
async function compareModal(fromNo, toNo) {
  const P = S.P, d = P.data, cache = P.vcache || (P.vcache = {});
  const get = async (no) => cache[no] || (cache[no] = await call('cs_version', { p_id: P.id, p_no: no }));
  const opts = (sel) => d.versions.map((v) => `<option value="${v.no}" ${v.no === sel ? 'selected' : ''}>v${v.no}${v.note ? ' · ' + esc(v.note.slice(0, 24)) : ''}</option>`).join('');
  openModal(`<h2>↔ 버전 비교</h2>
    <div class="cmp-pick"><label>이전<select id="cmpA">${opts(fromNo)}</select></label><span class="cmp-arrow" aria-hidden="true">→</span>
      <label>이후<select id="cmpB">${opts(toNo)}</select></label><span class="grow"></span><span class="cmp-sum" id="cmpSum"></span></div>
    <div id="cmpBody"><div class="loading">비교하는 중…</div></div>
    <p class="muted small cmp-legend"><span class="lg add">+ 새로 생긴 줄</span><span class="lg del">− 없어진 줄</span> 바뀐 곳 주변만 보여요.</p>
    <div class="modal-actions"><button class="btn" data-close>닫기</button></div>`, (m) => {
    const run = async () => {
      const a = Number($('#cmpA', m).value), b = Number($('#cmpB', m).value);
      $('#cmpBody', m).innerHTML = '<div class="loading">비교하는 중…</div>';
      try {
        const [va, vb] = await Promise.all([get(a), get(b)]);
        const r = diffHTML(lineDiff(va.code, vb.code));
        $('#cmpSum', m).innerHTML = `<b class="plus">+${r.add}</b> <b class="minus">−${r.del}</b>`;
        $('#cmpBody', m).innerHTML = `${vb.note ? `<p class="small cmp-note"><span class="vtag">v${vb.no}</span> ${esc(vb.note)}</p>` : ''}${r.html}`;
      } catch (e) { $('#cmpBody', m).innerHTML = `<div class="loading bad">${esc(e.message || '불러오지 못했어요')}</div>`; }
    };
    $('#cmpA', m).addEventListener('change', run); $('#cmpB', m).addEventListener('change', run);
    run();
  });
  $('#modalCard').classList.add('wide');
}

/* =====================================================================
   진행 현황표 (#progress): 학생 × 주차
   ===================================================================== */
let PG = null;   // 마지막으로 불러온 현황 (확인서에도 써요)
function progressRows(L, sheets, members) {
  return members.map((m) => {
    const ps = L.filter((p) => p.nickname === m.nickname && p.sid === m.sid);
    const weeks = WEEKS.map((w) => {
      const x = sheets.find((s) => s.member_id === m.id && s.week === w.no);
      const codes = ps.filter((p) => p.week === w.no).length;
      const done = w.sheet ? !!(x && x.submitted_at) : codes > 0;
      const st = done ? 'done' : x || codes ? 'part' : 'none';
      return { no: w.no, st, codes, sheet: w.sheet ? (x ? (x.submitted_at ? '제출' : '작성 중') : '안 씀') : null, at: x && x.submitted_at };
    });
    const fin = ps.find((p) => p.final_no);
    const req = ps.find((p) => reqState(p) === 'wait');
    return { m, ps, weeks, fin, web: fin && fin.has_webapp ? 'done' : req ? 'wait' : ps.some((p) => p.has_webapp) ? 'old' : 'none',
      doneN: weeks.filter((x) => x.st === 'done').length };
  });
}
const PG_MARK = { done: '✓', part: '◐', none: '' };
const PG_TEXT = { done: '끝냄', part: '하는 중', none: '아직' };
async function viewProgress() {
  document.title = '진행 현황표 · 멘토링 아카이브';
  const tok = S.seq;
  $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let L, sheets, members;
  try { [L, sheets, members] = await Promise.all([call('cs_list'), call('cs_m_sheets'), call('cs_m_members'), loadClass()]); }
  catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)}</div>`; return; }
  if (tok !== S.seq) return;
  S.list = L; S.sheets = sheets; S.members = members; renderSide();
  S.back = { href: '#progress', label: '진행 현황표' };
  const act = members.filter((m) => m.active);
  const rows = progressRows(L, sheets, act);
  // 밀린 학생: 반의 절반 이상이 끝낸 주차를 아직 못 끝낸 학생
  const busy = WEEKS.map((w, i) => rows.filter((r) => r.weeks[i].st === 'done').length * 2 >= rows.length && rows.length > 1);
  rows.forEach((r) => { r.behind = r.weeks.filter((x, i) => busy[i] && x.st !== 'done').map((x) => x.no); });
  PG = { rows, L, sheets, members: act };
  const f = S.pgFilter || 'all';
  const show = (r) => f === 'all' || (f === 'behind' && r.behind.length) || (f === 'nofin' && !r.fin) || (f === 'web' && r.web === 'wait');
  const n = { behind: rows.filter((r) => r.behind.length).length, nofin: rows.filter((r) => !r.fin).length, web: rows.filter((r) => r.web === 'wait').length };
  const head = WEEKS.map((w) => `<th scope="col" class="pg-wk"><b>${w.no}주차</b><small>${esc(w.sheet ? sheetName(w) : '코드')}</small></th>`).join('');
  const body = rows.map((r) => `<tr ${show(r) ? '' : 'hidden'}>
      <th scope="row" class="pg-who"><span class="sidtag">${esc(r.m.sid)}</span>${esc(r.m.nickname)}</th>
      ${r.weeks.map((x) => `<td class="pg ${x.st}${r.behind.includes(x.no) ? ' behind' : ''}" title="${x.no}주차 · ${PG_TEXT[x.st]}${x.sheet ? ' · 활동지 ' + x.sheet : ''} · 코드 ${x.codes}개">
        <a href="#w${x.no}"><span class="pg-m" aria-hidden="true">${PG_MARK[x.st]}</span><span class="pg-t">${PG_TEXT[x.st]}</span><small>코드 ${x.codes}</small></a></td>`).join('')}
      <td class="pg-fin">${r.fin ? `<a href="#p${r.fin.id}">★ ${esc(r.fin.title)}</a>` : '<span class="muted">아직</span>'}</td>
      <td class="pg-web">${r.web === 'done' ? `<a class="badge web" href="#a${r.fin.id}">완성</a>` : r.web === 'wait' ? '<span class="badge new">요청함</span>' : '<span class="muted">-</span>'}</td>
      <td class="pg-last muted small">${r.m.saves}번 · ${r.m.last_save ? ago(r.m.last_save) : '-'}</td>
      <td><button class="btn tiny" data-cert="${r.m.id}">${icon('award')}확인서</button></td></tr>`).join('');
  const foot = WEEKS.map((w, i) => { const k = rows.filter((r) => r.weeks[i].st === 'done').length; return `<td>${k}/${rows.length}</td>`; }).join('');
  $('#app').innerHTML = `<section class="progress">
    <div class="week-nav"><a class="back" href="#home">← 대시보드</a></div>
    <div class="sec-head first row"><div><h1>진행 현황표 <span class="count">${rows.length}명</span></h1>
      <p class="muted">활동지가 있는 주는 <b>제출</b>, 없는 주는 <b>그 주 코드 1개 이상</b>이면 끝낸 거예요. 칸을 누르면 그 주차 화면으로 가요.</p></div>
      <div class="head-acts"><button class="btn small" id="pgCsv">${icon('down')} CSV로 받기</button><button class="btn small" id="pgCertAll">${icon('award')} 확인서 모두</button></div></div>
    <div class="pg-bar"><div class="chips" role="group" aria-label="학생 거르기">
      <button class="chip ${f === 'all' ? 'on' : ''}" data-pf="all">전체 ${rows.length}</button>
      <button class="chip ${f === 'behind' ? 'on' : ''}" data-pf="behind" title="반의 절반 이상이 끝낸 주차를 아직 못 끝낸 학생">밀린 학생 ${n.behind}</button>
      <button class="chip ${f === 'nofin' ? 'on' : ''}" data-pf="nofin">완성작 아직 ${n.nofin}</button>
      <button class="chip ${f === 'web' ? 'on' : ''}" data-pf="web">웹앱 요청 ${n.web}</button></div>
      <p class="pg-legend small"><span class="pg-key done">✓ 끝냄</span><span class="pg-key part">◐ 하는 중</span><span class="pg-key none">아직</span><span class="pg-key behind">빨간 테두리: 반 절반 이상이 끝낸 주차를 아직 못 함</span></p></div>
    ${rows.length ? `<div class="pg-scroll"><table class="pg-table">
      <thead><tr><th scope="col">학생</th>${head}<th scope="col">완성작</th><th scope="col">웹앱</th><th scope="col">저장</th><th scope="col"><span class="sr">확인서</span></th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><th scope="row">끝낸 학생</th>${foot}<td>${rows.filter((r) => r.fin).length}/${rows.length}</td><td>${rows.filter((r) => r.web === 'done').length}/${rows.length}</td><td></td><td></td></tr></tfoot>
    </table></div>` : '<div class="empty">학생 명단이 비어 있어요. <a href="#members">학생 관리</a>에서 먼저 등록해 주세요.</div>'}
  </section>`;
  $$('[data-pf]').forEach((b) => b.addEventListener('click', () => { S.pgFilter = b.dataset.pf; S.seq++; viewProgress(); }));
  $$('[data-cert]').forEach((b) => b.addEventListener('click', () => certOverlay([Number(b.dataset.cert)])));
  $('#pgCertAll') && $('#pgCertAll').addEventListener('click', () => certOverlay(rows.filter(show).map((r) => r.m.id)));
  $('#pgCsv') && $('#pgCsv').addEventListener('click', () => {
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['학번', '이름', ...WEEKS.map((w) => `${w.no}주차`), '완성작', '웹앱', '저장 횟수', '마지막 저장'].map(q).join(',')];
    rows.forEach((r) => lines.push([r.m.sid, r.m.nickname, ...r.weeks.map((x) => `${PG_TEXT[x.st]}${x.sheet ? ` (활동지 ${x.sheet})` : ''} 코드 ${x.codes}`),
      r.fin ? `${r.fin.title} v${r.fin.final_no}` : '', { done: '완성', wait: '요청함', old: '예전 웹앱', none: '' }[r.web], r.m.saves, r.m.last_save ? when(r.m.last_save) : ''].map(q).join(',')));
    saveBlob(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), `진행현황_${stamp()}.csv`);
  });
}

/* ---------- 참여 확인서 ---------- */
const CERT_KEY = 'pyshare_cert_opts';
function certDefaults() {
  const ms = (PG && PG.members) || [];
  const first = ms.map((m) => m.created_at).filter(Boolean).sort()[0];
  const fmt = (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  return { program: '고1 AI 프로젝트 멘토링 (파이썬)', period: `${fmt(first ? new Date(first) : new Date())} ~ ${fmt(new Date())}`, mentor: '', date: new Date().toISOString().slice(0, 10) };
}
function certPage(r, o, k) {
  const fin = r.fin, rep = WEEKS.find((w) => w.sheetName);
  const repDone = rep && r.weeks.find((x) => x.no === rep.no).st === 'done';
  const [y, mo, d] = (o.date || '').split('-').map(Number);
  return `<article class="cert-page">
    <p class="cert-no">제 ${new Date().getFullYear()}-${String(k + 1).padStart(2, '0')} 호</p>
    <h1>참 여 확 인 서</h1>
    <table class="cert-who"><tbody>
      <tr><th>이름</th><td>${esc(r.m.nickname)}</td><th>학번</th><td>${esc(r.m.sid)}</td></tr>
      <tr><th>프로그램</th><td colspan="3">${esc(o.program)}</td></tr>
      <tr><th>기간</th><td colspan="3">${esc(o.period)}</td></tr></tbody></table>
    <h2>주차별 활동</h2>
    <table class="cert-wk"><thead><tr><th>주차</th><th>활동</th><th>한 일</th><th>참여</th></tr></thead><tbody>
      ${WEEKS.map((w, i) => { const x = r.weeks[i]; return `<tr><td>${w.no}주차</td><td>${esc(w.title)}</td>
        <td>${[x.sheet ? `${esc(sheetName(w))} ${esc(x.sheet)}` : '', `코드 ${x.codes}개`].filter(Boolean).join(' · ')}</td><td class="c">${x.st === 'done' ? '○' : x.st === 'none' ? '' : '△'}</td></tr>`; }).join('')}
    </tbody></table>
    <h2>만든 것</h2>
    <ul class="cert-made">
      <li><b>완성작</b>${fin ? `「${esc(fin.title)}」 (코드 v${fin.final_no})` : '없음'}</li>
      <li><b>웹앱</b>${r.web === 'done' ? '완성작을 웹앱으로 만들어 발표함' : '없음'}</li>
      <li><b>코드 저장</b>프로젝트 ${r.ps.length}개 · 저장 ${r.m.saves}번</li>
      ${rep ? `<li><b>${esc(sheetName(rep))}</b>${repDone ? '제출함' : '제출하지 않음'}</li>` : ''}
    </ul>
    <p class="cert-text">위 학생은 위 기간 동안 ${esc(o.program)}에 참여하여 주제를 정하고, 파이썬 코드를 직접 작성·개선하여 결과물을 만들었음을 확인합니다.</p>
    <p class="cert-date">${y ? `${y}년 ${mo}월 ${d}일` : ''}</p>
    <p class="cert-sign">멘토 <span class="cert-name">${esc(o.mentor) || '&nbsp;'}</span> (서명)</p>
  </article>`;
}
function certOverlay(ids) {
  if (!PG) return;
  const rows = PG.rows.filter((r) => ids.includes(r.m.id));
  if (!rows.length) { toast('확인서를 만들 학생이 없어요'); return; }
  let o; try { o = { ...certDefaults(), ...(JSON.parse(localStorage.getItem(CERT_KEY)) || {}) }; } catch (e) { o = certDefaults(); }
  const wrap = document.createElement('div');
  wrap.className = 'cert-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', '참여 확인서');
  wrap.innerHTML = `<div class="cert-tools">
      <div class="ct-head"><h2>${icon('award')} 참여 확인서 <span class="count">${rows.length}장</span></h2><span class="grow"></span>
        <button class="btn primary" id="ctPrint">인쇄 · PDF로 저장</button><button class="btn ghost icon" id="ctClose" aria-label="닫기">✕</button></div>
      <div class="ct-form">
        <label>프로그램<input id="ctProg" value="${esc(o.program)}" maxlength="60"></label>
        <label>기간<input id="ctPeriod" value="${esc(o.period)}" maxlength="40"></label>
        <label>발급일<input type="date" id="ctDate" value="${esc(o.date)}"></label>
        <label>멘토 이름<input id="ctMentor" value="${esc(o.mentor)}" maxlength="20" placeholder="서명 옆에 들어가요"></label></div>
      <p class="muted small">한 사람이 한 장이에요. 인쇄 창에서 대상을 <b>PDF로 저장</b>으로 고르면 파일로 받아요. 미리보기(아티팩트) 안에서는 인쇄 창이 열리지 않을 수 있어요.</p>
    </div><div class="cert-pages" id="ctPages"></div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('cert-open');
  const paint = () => { $('#ctPages', wrap).innerHTML = rows.map((r, k) => certPage(r, o, k)).join(''); };
  paint();
  [['ctProg', 'program'], ['ctPeriod', 'period'], ['ctDate', 'date'], ['ctMentor', 'mentor']].forEach(([id, k]) => $('#' + id, wrap).addEventListener('input', (e) => {
    o[k] = e.target.value; try { localStorage.setItem(CERT_KEY, JSON.stringify({ program: o.program, mentor: o.mentor })); } catch (err) {}
    paint();
  }));
  const close = () => { wrap.remove(); document.body.classList.remove('cert-open'); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('#ctClose', wrap).addEventListener('click', close);
  $('#ctPrint', wrap).addEventListener('click', () => { try { window.print(); } catch (e) {} });
  window.addEventListener('hashchange', close, { once: true });
  $('#ctClose', wrap).focus();
}

/* =====================================================================
   피드백 빠르게 쓰기 (#fbq): 피드백을 기다리는 코드를 하나씩
   ===================================================================== */
const QUICK = [
  ['잘한 점', ['반복문으로 같은 일을 깔끔하게 줄였어요 👍', '변수 이름이 읽기 쉬워요.', '주석으로 무엇을 하는지 잘 설명했어요.',
    '잘못된 입력까지 생각한 점이 좋아요.', '실행 결과가 보기 좋게 나와요.', '지난 피드백을 반영해서 잘 고쳤어요!']],
  ['다음 도전', ['같은 코드가 되풀이되는 곳을 함수(def)로 묶어 볼까요?', '숫자가 아닌 값을 넣으면 어떻게 되는지 시험해 봐요.',
    '결과를 그래프로 그리면 한눈에 보여요.', '처음 쓰는 친구도 알 수 있게 사용법을 print로 안내해 봐요.', '결과에서 알게 된 점을 한 문장으로 print 해 봐요.']],
  ['고칠 점', ['에러 메시지의 맨 마지막 줄을 먼저 읽어 봐요.', '들여쓰기(칸 띄우기)가 맞는지 확인해요.',
    '변수 이름을 안에 든 값이 보이게 바꿔 봐요.', 'CSV 파일 이름이 코드와 똑같은지 확인해요.']],
];
const QK = 'pyshare_fbq_mine';
const myPhrases = () => { try { return JSON.parse(localStorage.getItem(QK)) || []; } catch (e) { return []; } };
const setMyPhrases = (xs) => { try { localStorage.setItem(QK, JSON.stringify(xs.slice(0, 20))); } catch (e) {} };
// 피드백이 하나도 없거나, 마지막 피드백 뒤에 새 버전을 저장한 코드
const fbNeed = (L) => (L || []).filter((p) => (p.versions || 0) > (p.fb_last_no || 0)).sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
async function viewFbQueue() {
  document.title = '피드백 쓰기 · 멘토링 아카이브';
  const tok = S.seq;
  $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let L; try { L = await call('cs_list'); } catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)}</div>`; return; }
  if (tok !== S.seq) return;
  S.list = L; renderSide();
  S.back = { href: '#fbq', label: '피드백 쓰기' };
  const Q = { list: fbNeed(L), cur: null, done: 0 };
  $('#app').innerHTML = `<section class="fbq">
    <div class="week-nav"><a class="back" href="#home">← 대시보드</a></div>
    <div class="sec-head first"><h1>피드백 빠르게 쓰기 <span class="count" id="fqCount">${Q.list.length}</span></h1>
      <p class="muted">피드백이 없거나, 마지막 피드백 뒤에 새 버전을 저장한 코드예요. 오래 기다린 것부터 보여요.</p></div>
    <div class="fbq-grid"><nav class="fbq-list" id="fqList" aria-label="피드백을 기다리는 코드"></nav><div class="fbq-main" id="fqMain"></div></div>
  </section>`;
  const list = () => {
    $('#fqCount').textContent = Q.list.length;
    $('#fqList').innerHTML = Q.list.length ? Q.list.map((p) => `<button class="fq-row ${Q.cur === p.id ? 'on' : ''}" data-id="${p.id}" ${Q.cur === p.id ? 'aria-current="true"' : ''}>
        <b>${esc(p.title)}</b><span class="muted small">${p.sid ? esc(p.sid) + ' ' : ''}${esc(p.nickname)}${p.week ? ` · ${p.week}주차` : ''}</span>
        <span class="fq-why">${p.fb_last_no ? `v${p.fb_last_no} 피드백 뒤 <b>v${p.versions}</b>까지 저장` : `피드백 없음 · <b>v${p.versions}</b>`} · ${ago(p.updated_at)}</span></button>`).join('')
      : '<div class="empty small">기다리는 코드가 없어요 🎉</div>';
    $$('.fq-row').forEach((b) => b.addEventListener('click', () => pick(Number(b.dataset.id))));
  };
  const pick = async (id) => {
    Q.cur = id; list();
    const main = $('#fqMain'); main.innerHTML = '<div class="loading">코드 여는 중…</div>';
    let d, old = null;
    try {
      d = await call('cs_get', { p_id: id });
      const p = Q.list.find((x) => x.id === id);
      if (p && p.fb_last_no && p.fb_last_no < d.latest.no) old = await call('cs_version', { p_id: id, p_no: p.fb_last_no });
    } catch (e) { main.innerHTML = `<div class="loading bad">${esc(e.message || '열 수 없어요')}</div>`; return; }
    if (Q.cur !== id || tok !== S.seq) return;
    const lines = d.latest.code.split('\n');
    const code = `<div class="fq-code"><table class="diff plain"><tbody>${lines.map((t, i) => `<tr><td class="ln">${i + 1}</td><td class="cd">${esc(t) || ' '}</td></tr>`).join('')}</tbody></table></div>`;
    const df = old ? diffHTML(lineDiff(old.code, d.latest.code)) : null;
    const prev = (d.feedback || []).slice(0, 2);
    const mine = myPhrases();
    main.innerHTML = `<div class="fq-head"><div><h2>${esc(d.title)}</h2>
        <p class="muted small">${d.sid ? esc(d.sid) + ' ' : ''}${esc(d.nickname)}${d.week ? ` · ${d.week}주차` : ''} · <span class="vtag">v${d.latest.no}</span> ${esc(d.latest.note || '')} · ${ago(d.latest.created_at)}</p></div>
        <a class="btn small" href="#p${d.id}">편집기에서 열기 · 실행</a></div>
      ${d.description ? `<p class="small fq-desc">${esc(d.description)}</p>` : ''}
      ${df ? `<div class="seg2 fq-tabs" role="tablist"><button role="tab" class="on" aria-selected="true" data-tab="diff">v${old.no} 피드백 뒤 바뀐 곳 <b class="plus">+${df.add}</b> <b class="minus">−${df.del}</b></button><button role="tab" aria-selected="false" data-tab="code">지금 코드 전체</button></div>` : ''}
      <div id="fqView">${df ? df.html : code}</div>
      ${prev.length ? `<details class="fq-prev"><summary>지난 피드백 ${d.feedback.length}개</summary>${prev.map((f) => `<p class="small"><span class="vtag">v${f.version_no}</span> ${esc(f.body)} <span class="muted">· ${f.seen ? '읽음' : '안 읽음'}</span></p>`).join('')}</details>` : ''}
      <form class="fq-form" id="fqForm" novalidate>
        <div class="fq-quick">${QUICK.map(([h, xs]) => `<div class="fq-group"><span class="fq-gh">${h}</span>${xs.map((t) => `<button type="button" class="qchip" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>`).join('')}
          <div class="fq-group"><span class="fq-gh">내 문구</span>${mine.map((t, i) => `<span class="qchip mine"><button type="button" data-q="${esc(t)}">${esc(t)}</button><button type="button" class="qx" data-qx="${i}" aria-label="내 문구 지우기">✕</button></span>`).join('')}
            <button type="button" class="btn ghost tiny" id="fqSave">+ 지금 쓴 글을 내 문구로</button></div></div>
        <label for="fqText" class="sr">피드백</label>
        <textarea id="fqText" rows="4" maxlength="2000" placeholder="문구를 눌러 넣고, 이 학생에게 맞게 조금 고쳐요. 잘한 점 하나 + 다음 도전 하나면 충분해요."></textarea>
        <p class="form-err" id="fqErr" role="alert"></p>
        <div class="fq-acts"><span class="muted small"><span class="vtag">v${d.latest.no}</span>에 남겨요 · ${esc(d.nickname)}에게만 보여요</span><span class="grow"></span>
          <button type="button" class="btn" id="fqSkip">건너뛰기</button><button class="btn primary" id="fqOk">남기고 다음 →</button></div>
      </form>`;
    $$('[data-tab]', main).forEach((b) => b.addEventListener('click', () => {
      $$('[data-tab]', main).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      $('#fqView').innerHTML = b.dataset.tab === 'diff' ? df.html : code;
    }));
    const ta = $('#fqText');
    $$('[data-q]', main).forEach((b) => b.addEventListener('click', () => {
      const v = ta.value.replace(/\s+$/, ''); ta.value = (v ? v + (/[.!?요👍]$/.test(v) ? ' ' : '\n') : '') + b.dataset.q; ta.focus();
    }));
    $$('[data-qx]', main).forEach((b) => b.addEventListener('click', () => { const xs = myPhrases(); xs.splice(Number(b.dataset.qx), 1); setMyPhrases(xs); pick(id); }));
    $('#fqSave').addEventListener('click', () => {
      const t = ta.value.trim(); if (!t) { $('#fqErr').textContent = '먼저 문구를 적어 주세요.'; return; }
      if (t.length > 120) { $('#fqErr').textContent = '내 문구는 120글자까지예요.'; return; }
      const xs = myPhrases(); if (!xs.includes(t)) xs.push(t); setMyPhrases(xs); toast('내 문구에 넣었어요', 'good');
      const keep = t; pick(id).then(() => { $('#fqText') && ($('#fqText').value = keep); });
    });
    const next = () => { const i = Q.list.findIndex((x) => x.id === id); const n = Q.list[i + 1] || Q.list[0]; if (n && n.id !== id) pick(n.id); else { Q.cur = null; list(); $('#fqMain').innerHTML = '<div class="empty">다 썼어요! 오늘 남긴 피드백 ' + Q.done + '개 🎉</div>'; } };
    $('#fqSkip').addEventListener('click', next);
    $('#fqForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = ta.value.trim(); if (!body) { $('#fqErr').textContent = '피드백 내용을 적어 주세요.'; return; }
      $('#fqOk').disabled = true;
      try {
        await call('cs_m_feedback', { p_id: id, p_no: d.latest.no, p_body: body });
        Q.done++; toast(`${d.nickname}에게 피드백을 남겼어요`, 'good');
        const i = Q.list.findIndex((x) => x.id === id), after = Q.list[i + 1] || Q.list[i - 1];
        Q.list.splice(i, 1);
        const p = (S.list || []).find((x) => x.id === id); if (p) { p.fb_last_no = d.latest.no; p.feedback = (p.feedback || 0) + 1; }
        renderSide();
        if (after) pick(after.id); else { Q.cur = null; list(); $('#fqMain').innerHTML = `<div class="empty">다 썼어요! 오늘 남긴 피드백 ${Q.done}개 🎉</div>`; }
      } catch (err) { $('#fqErr').textContent = err.message || ''; $('#fqOk').disabled = false; }
    });
  };
  list();
  if (Q.list.length) pick(Q.list[0].id);
  else $('#fqMain').innerHTML = '<div class="empty">피드백을 기다리는 코드가 없어요 🎉</div>';
}

/* =====================================================================
   발표회 모드 (#show): 큰 화면에 학생 · 제목 · 한 줄 소개 · 웹앱 · 타이머
   ===================================================================== */
const SHOW_KEY = 'pyshare_show';
async function viewShow() {
  document.title = '발표회 모드 · 멘토링 아카이브';
  const tok = S.seq;
  $('#app').innerHTML = '<div class="loading">불러오는 중…</div>';
  let L, members;
  try { [L, members] = await Promise.all([call('cs_list'), call('cs_m_members')]); }
  catch (e) { if (e.message && tok === S.seq) $('#app').innerHTML = `<div class="loading bad">${esc(e.message)}</div>`; return; }
  if (tok !== S.seq) return;
  S.list = L; S.members = members; renderSide();
  // 발표할 프로젝트: 완성작, 없으면 가장 최근에 고친 코드
  const people = members.filter((m) => m.active).map((m) => {
    const ps = L.filter((p) => p.nickname === m.nickname && p.sid === m.sid);
    const p = ps.find((x) => x.final_no) || ps.slice().sort(byRecent)[0] || null;
    return { m, p, fin: !!(p && p.final_no) };
  });
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(SHOW_KEY)) || {}; } catch (e) {}
  const known = new Set(people.map((x) => x.m.id));
  let order = (saved.order || []).filter((id) => known.has(id));
  people.forEach((x) => { if (!order.includes(x.m.id)) order.push(x.m.id); });
  const on = new Set(saved.on ? saved.on.filter((id) => known.has(id)) : people.filter((x) => x.fin).map((x) => x.m.id));
  let mins = saved.mins || 3;
  const keep = () => { try { localStorage.setItem(SHOW_KEY, JSON.stringify({ order, on: [...on], mins })); } catch (e) {} };
  const byId = (id) => people.find((x) => x.m.id === id);

  const setup = () => {
    document.body.classList.remove('show-mode');
    const n = order.filter((id) => on.has(id)).length;
    $('#app').innerHTML = `<section class="show-setup">
      <div class="week-nav"><a class="back" href="#home">← 대시보드</a></div>
      <div class="sec-head first"><h1>${icon('stage')} 발표회 모드</h1>
        <p class="muted">TV·프로젝터 화면에 띄워 두고 순서대로 진행해요. 발표하는 동안 <kbd>←</kbd> <kbd>→</kbd> 이전·다음, <kbd>Space</kbd> 타이머 시작·멈춤, <kbd>Esc</kbd> 순서 화면으로.</p></div>
      <div class="show-grid">
        <div class="panel"><div class="ss-head"><h2>발표 순서 <span class="count">${n}명</span></h2><span class="grow"></span>
            <button class="btn small" id="ssShuffle">🔀 섞기</button><button class="btn small" id="ssSid">학번순</button></div>
          <p class="muted small">체크한 학생만 발표해요. 처음에는 완성작을 낸 학생이 체크돼 있어요.</p>
          <ol class="ss-list">${order.map((id, i) => { const x = byId(id); return `<li class="${on.has(id) ? '' : 'off'}">
            <label class="ss-pick"><input type="checkbox" data-on="${id}" ${on.has(id) ? 'checked' : ''}><span class="ss-no">${i + 1}</span>
              <span class="ss-who"><b>${esc(x.m.nickname)}</b> <span class="muted small">${esc(x.m.sid)}</span>
              <span class="small">${x.p ? `${x.fin ? '★ ' : ''}「${esc(x.p.title)}」${x.p.has_webapp ? ' · 웹앱 ✓' : ' · 웹앱 없음'}` : '<span class="muted">아직 코드 없음</span>'}</span></span></label>
            <span class="ss-move"><button class="btn ghost tiny" data-up="${i}" ${i ? '' : 'disabled'} aria-label="위로">↑</button><button class="btn ghost tiny" data-dn="${i}" ${i < order.length - 1 ? '' : 'disabled'} aria-label="아래로">↓</button></span></li>`; }).join('')}</ol></div>
        <div class="panel ss-start"><h2>발표 시간</h2>
          <div class="seg2" role="radiogroup" aria-label="한 사람 발표 시간">${[2, 3, 4, 5].map((k) => `<button type="button" role="radio" aria-checked="${k === mins}" class="${k === mins ? 'on' : ''}" data-min="${k}">${k}분</button>`).join('')}</div>
          <p class="muted small">30초 남으면 노랗게, 시간이 지나면 빨갛게 바뀌고 넘긴 시간을 세요. 소리는 나지 않아요.</p>
          <button class="btn primary big" id="ssGo" ${n ? '' : 'disabled'}>▶ 발표 시작 (${n}명)</button></div>
      </div></section>`;
    $$('[data-on]').forEach((c) => c.addEventListener('change', () => { const id = Number(c.dataset.on); c.checked ? on.add(id) : on.delete(id); keep(); setup(); }));
    $$('[data-up]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.up); [order[i - 1], order[i]] = [order[i], order[i - 1]]; keep(); setup(); $(`[data-up="${i - 1}"]`) && $(`[data-up="${i - 1}"]`).focus(); }));
    $$('[data-dn]').forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.dn); [order[i + 1], order[i]] = [order[i], order[i + 1]]; keep(); setup(); $(`[data-dn="${i + 1}"]`) && $(`[data-dn="${i + 1}"]`).focus(); }));
    $('#ssShuffle').addEventListener('click', () => {
      const pick = order.filter((id) => on.has(id)), rest = order.filter((id) => !on.has(id));
      for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
      order = [...pick, ...rest]; keep(); setup(); toast('순서를 섞었어요');
    });
    $('#ssSid').addEventListener('click', () => { order.sort((a, b) => String(byId(a).m.sid).localeCompare(String(byId(b).m.sid))); keep(); setup(); });
    $$('[data-min]').forEach((b) => b.addEventListener('click', () => { mins = Number(b.dataset.min); keep(); setup(); }));
    $('#ssGo').addEventListener('click', () => stage(0));
  };

  // ---- 발표 화면 ----
  const T = { left: 0, run: false, end: 0, tick: null };
  const intro = {}, apps = {};
  const reportWeek = (WEEKS.find((w) => w.sheetName) || {}).no;
  const getIntro = async (x) => {
    if (intro[x.m.id] !== undefined) return intro[x.m.id];
    let a = null; try { a = reportWeek ? await call('cs_sheet_get', { p_week: reportWeek, p_mid: x.m.id }) : null; } catch (e) {}
    const f = (a && a.answers && a.answers.f) || {}, sd = (a && a.answers && a.answers.seed) || {};
    return (intro[x.m.id] = { title: f.title || sd.title || (x.p && x.p.title) || '', line: f.oneLine || sd.oneLine || (x.p && x.p.description) || '' });
  };
  const getApp = async (x) => {
    if (!x.p || !x.p.has_webapp) return null;
    if (apps[x.p.id] !== undefined) return apps[x.p.id];
    try { return (apps[x.p.id] = (await call('cs_webapp', { p_id: x.p.id })).html || null); } catch (e) { return null; }
  };
  const fmt = (s) => { const a = Math.abs(Math.round(s)); return `${s < 0 ? '+' : ''}${Math.floor(a / 60)}:${pad(a % 60)}`; };
  const paintTimer = () => {
    const el = $('#tm'); if (!el) return;
    const s = T.run ? (T.end - Date.now()) / 1000 : T.left;
    $('#tmT').textContent = fmt(s < 0 ? Math.floor(s) : Math.ceil(s));
    el.classList.toggle('warn', s <= 30 && s > 0); el.classList.toggle('over', s <= 0);
    $('#tmBar').style.width = `${Math.max(0, Math.min(100, (1 - s / (mins * 60)) * 100))}%`;
    $('#tmGo').textContent = T.run ? '❚❚ 멈춤' : s < mins * 60 ? '▶ 이어서' : '▶ 시작';
  };
  const timer = (cmd) => {
    if (cmd === 'reset') { clearInterval(T.tick); T.run = false; T.left = mins * 60; }
    else if (cmd === 'toggle') {
      if (T.run) { T.left = (T.end - Date.now()) / 1000; T.run = false; clearInterval(T.tick); }
      else { T.end = Date.now() + T.left * 1000; T.run = true; T.tick = setInterval(paintTimer, 250); }
    }
    paintTimer();
  };
  let list = [], at = 0;
  const stage = async (i) => {
    list = order.filter((id) => on.has(id)).map(byId);
    if (!list.length) return setup();
    at = Math.max(0, Math.min(list.length - 1, i));
    const x = list[at], nx = list[at + 1];
    document.body.classList.add('show-mode');
    timer('reset');
    $('#app').innerHTML = `<section class="stage" aria-live="polite">
      <header class="st-top"><span class="st-count">${at + 1} <small>/ ${list.length}</small></span><span class="st-brand">${icon('stage')} 발표회</span><span class="grow"></span>
        <button class="btn ghost small" id="stFull">전체 화면</button><button class="btn ghost small" id="stExit">순서 화면 (Esc)</button></header>
      <div class="st-body">
        <div class="st-info">
          <p class="st-sid">${esc(x.m.sid)}</p><h1 class="st-name">${esc(x.m.nickname)}</h1>
          <h2 class="st-title" id="stTitle">${x.p ? esc(x.p.title) : ''}</h2><p class="st-line" id="stLine"></p>
          <div class="timer" id="tm"><b id="tmT">${fmt(mins * 60)}</b><div class="tm-bar"><i id="tmBar"></i></div>
            <div class="tm-acts"><button class="btn primary" id="tmGo">▶ 시작</button><button class="btn" id="tmReset" aria-label="타이머 처음으로">↺ 처음으로</button></div></div>
          <p class="st-next">${nx ? `다음 발표 · <b>${esc(nx.m.nickname)}</b>${nx.p ? ` 「${esc(nx.p.title)}」` : ''}` : '마지막 발표예요 👏'}</p>
        </div>
        <div class="st-app" id="stApp"><div class="st-empty">불러오는 중…</div></div>
      </div>
      <footer class="st-nav"><button class="btn big" id="stPrev" ${at ? '' : 'disabled'}>◀ 이전</button>
        <span class="st-dots">${list.map((y, k) => `<button class="st-dot ${k === at ? 'on' : k < at ? 'past' : ''}" data-go="${k}" aria-label="${k + 1}번 ${esc(y.m.nickname)}"></button>`).join('')}</span>
        <button class="btn big primary" id="stNext">${nx ? '다음 ▶' : '끝 ✓'}</button></footer>
    </section>`;
    $('#tmGo').addEventListener('click', () => timer('toggle'));
    $('#tmReset').addEventListener('click', () => timer('reset'));
    $('#stPrev').addEventListener('click', () => stage(at - 1));
    $('#stNext').addEventListener('click', () => (nx ? stage(at + 1) : finish()));
    $('#stExit').addEventListener('click', () => { timer('reset'); setup(); });
    $('#stFull').addEventListener('click', () => { const r = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); r && r.catch && r.catch(() => toast('이 화면에서는 전체 화면을 쓸 수 없어요')); });
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => stage(Number(b.dataset.go))));
    const me = at;
    const [it, html] = await Promise.all([getIntro(x), getApp(x)]);
    if (me !== at || !$('#stApp')) return;
    if (it.title) $('#stTitle').textContent = it.title;
    $('#stLine').textContent = it.line;
    const box = $('#stApp');
    if (html) { box.innerHTML = ''; box.appendChild(waFrame(html)); }
    else box.innerHTML = `<div class="st-empty">${x.p ? `<b>웹앱이 아직 없어요</b><p>코드 화면으로 발표해요.</p><a class="btn" href="#p${x.p.id}">코드 열기</a>` : '<b>발표할 코드가 없어요</b>'}</div>`;
    nx && getIntro(nx);   // 다음 사람 미리 불러 두기
  };
  const finish = () => {
    timer('reset');
    $('#app').innerHTML = `<section class="stage done"><div class="st-fin"><p class="st-brand">${icon('stage')} 발표회</p><h1>모두 수고했어요 👏</h1>
      <p>${list.length}명이 발표했어요.</p><div class="panel-actions"><button class="btn big" id="finBack">순서 화면으로</button><a class="btn big primary" href="#progress">진행 현황표 · 확인서</a></div></div></section>`;
    $('#finBack').addEventListener('click', setup);
  };
  const onKey = (e) => {
    if (!document.body.classList.contains('show-mode') || location.hash !== '#show') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); $('#stNext') ? $('#stNext').click() : null; }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); $('#stPrev') && !$('#stPrev').disabled && $('#stPrev').click(); }
    else if (e.key === ' ' && $('#tm')) { e.preventDefault(); timer('toggle'); }
    else if (e.key === 'Escape') { timer('reset'); setup(); }
  };
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => { document.removeEventListener('keydown', onKey); clearInterval(T.tick); document.body.classList.remove('show-mode'); }, { once: true });
  setup();
}
