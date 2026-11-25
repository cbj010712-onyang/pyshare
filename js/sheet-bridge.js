/* =====================================================================
   활동지 ↔ 공유방 다리
   활동지(week2.html 등)는 원래 쓰는 내용을 이 기기(localStorage)에만 저장했어요.
   이 파일이 그 저장을 가로채서 공유방 서버에도 저장해요.
     · 들어올 때: 공유방 로그인 확인 → 서버에 저장된 답을 불러와 활동지에 채움
     · 쓰는 동안: 1초쯤 멈추면 서버에 자동 저장 (cs_sheet_save)
     · [제출하기]: 항목별 답(구역·질문·답) + 자동으로 만든 활동지 이미지 + 전체 답을 서버에 저장 (cs_sheet_submit)
     · 제출한 활동지는 위쪽 띠의 [이미지로 받기]로 언제든 내려받아요
     · 학번·이름은 로그인 정보로 채우고 고칠 수 없게 해요
     · 멘토: 그냥 열면 미리보기(저장 안 됨), ?member=학생번호 로 열면 그 학생의 답을 읽기 전용으로 봐요
     · [지난주 활동지 불러오기]: 지난주 답을 옆 칸에 띄워 놓고 보충·수정해요. 비어 있는 분야·주제는 저절로 채워요
       (?carry=3 으로 열면 3주차 답이 바로 열려요. 채우는 방법은 활동지의 window.SheetCarry 가 정해요)
   활동지 쪽에서 바꾼 곳은 4군데예요 (KEY, 마지막 시작 줄, 제출 버튼, 파일 저장 버튼).
   ===================================================================== */
'use strict';

window.SheetBridge = (() => {
  const WEEK = Number(document.currentScript.dataset.week);
  const TOKEN_KEY = DEMO ? 'pyshare_demo_code' : 'pyshare_code';
  const ST = Storage.prototype, oGet = ST.getItem, oSet = ST.setItem, oRem = ST.removeItem;
  const params = new URLSearchParams(location.search);
  const viewMid = Number(params.get('member')) || null;

  let tok = null, me = null, mode = 'none', fullKey = null, silent = false;
  let timer = null, inflight = false, pending = false;

  function readToken() {
    for (const area of [sessionStorage, localStorage]) {
      try { const v = JSON.parse(oGet.call(area, TOKEN_KEY)); if (v) return v; } catch (e) {}
    }
    return null;
  }
  tok = readToken();
  const hash = (s) => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); };
  const lsGet = (k) => { try { return oGet.call(localStorage, k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { oSet.call(localStorage, k, v); } catch (e) {} };
  const lsDel = (k) => { try { oRem.call(localStorage, k); } catch (e) {} };
  const hhmm = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const back = `./#w${WEEK}`;

  // ---- 화면 위쪽 띠 (공유방 위쪽 막대와 같은 모양) ----
  function strip() {
    if (document.getElementById('sbStrip')) return;
    const el = document.createElement('header');
    el.className = 'sb-strip'; el.id = 'sbStrip';
    el.innerHTML = `<a class="sb-brand" href="./#home"><span class="sb-prompt" aria-hidden="true">&gt;&gt;&gt;</span><span class="sb-name">파이썬 코드 공유방</span></a>
      <a class="sb-week" href="${back}">← ${WEEK}주차로</a>
      <span class="sb-status" id="sbStatus" role="status"></span>
      <button type="button" class="sb-dl" id="sbDl" hidden>제출한 이미지 받기</button>
      <span class="sb-who" id="sbWho"></span>`;
    document.body.prepend(el);
    el.querySelector('#sbDl').addEventListener('click', downloadSubmitted);
  }
  function status(text, bad) {
    const s = document.getElementById('sbStatus'); if (s) { s.textContent = text; s.classList.toggle('bad', !!bad); }
    const b = document.querySelector('.bar .saved'); if (b) b.textContent = text;
  }
  function gate(msg) {
    const g = document.createElement('div'); g.className = 'sb-gate';
    g.innerHTML = `<div><b>${msg}</b><p>활동지는 공유방에 로그인한 뒤에 쓸 수 있어요. 쓴 내용은 공유방에 저장돼서 다른 기기에서도 이어서 쓸 수 있어요.</p><a href="${back}">공유방으로 가기</a></div>`;
    document.body.appendChild(g);
  }
  function note(text) {
    const n = document.createElement('div'); n.className = 'sb-note'; n.textContent = text;
    const main = document.querySelector('main'); if (main) main.prepend(n);
  }

  // ---- 서버 저장 ----
  const dirtyKey = () => fullKey + '::dirty';
  function answers() { try { return JSON.parse(lsGet(fullKey) || '{}') || {}; } catch (e) { return {}; } }
  function summary() {
    const v = (sel) => { const el = document.querySelector(sel); return el ? String(el.value ?? el.textContent ?? '').trim() : ''; };
    let topic = v('#topic');
    if (!topic) topic = [v('#what'), v('#goal')].filter(Boolean).join(' — ');
    return {
      topic: topic.slice(0, 200),
      progress: v('#progText').slice(0, 60),
      fields: [...document.querySelectorAll('.field-btn[aria-pressed="true"] strong')].map((x) => x.textContent.trim()).slice(0, 2),
    };
  }
  // 제출할 때 화면에 나온 순서대로 항목을 뽑아요: { section: 구역, label: 질문, value: 답 }
  function items() {
    const out = [];
    const clean = (t) => String(t || '').replace(/\s*\([^()]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
    const sectionOf = (el) => {
      const sec = el.closest('section'); const h = sec && sec.querySelector('h2');
      let name = '기본 정보';
      if (h) {
        const n = h.querySelector('.n'), rest = [...h.childNodes].filter((x) => x !== n).map((x) => x.textContent).join('');
        name = ((n ? n.textContent.trim() + '. ' : '') + rest).replace(/\s+/g, ' ').trim();
      }
      const task = el.closest('.task'); const tt = task && task.querySelector('.task-title');
      if (tt) name += ' › ' + tt.textContent.trim();
      return name;
    };
    const push = (el, label, value) => out.push({ section: sectionOf(el), label: clean(label) || '(이름 없음)', value: String(value ?? '').trim() });
    const sel = 'main .fields, main input, main textarea, main select, main [data-confirm], main [data-done], main .task, main #sentence';
    document.querySelectorAll(sel).forEach((el) => {
      if (el.id === 'promptText') return;
      if (el.classList.contains('fields')) {
        push(el, '고른 분야', [...el.querySelectorAll('.field-btn[aria-pressed="true"] strong')].map((x) => x.textContent.trim()).join(', '));
      } else if (el.classList.contains('task')) {
        if (el.querySelector('.box')) push(el, '완료 여부', el.classList.contains('done') ? '완료' : '아직');
      } else if (el.id === 'sentence') {
        push(el, '완성된 문장', el.textContent.replace(/^완성된 문장/, ''));
      } else if (el.dataset.confirm || el.dataset.done) {
        push(el, el.dataset.confirm ? '모두 확인했어요' : el.textContent, el.classList.contains('on') ? '예' : '아니오');
      } else if (el.type === 'checkbox') {
        const t = el.closest('label'); const span = t && t.querySelector('span');
        push(el, span ? span.childNodes[0].textContent : el.id, el.checked ? '예' : '아니오');
      } else {
        const lab = el.id && document.querySelector(`label[for="${el.id}"]`);
        push(el, (lab && lab.textContent) || el.getAttribute('aria-label') || el.placeholder || el.id, el.value);
      }
    });
    return out;
  }
  function schedule(ms = 1200) {
    if (mode !== 'student') return;
    lsSet(dirtyKey(), '1');
    status('저장 중…');
    clearTimeout(timer); timer = setTimeout(flush, ms);
  }
  async function flush() {
    if (mode !== 'student') return;
    if (inflight) { pending = true; return; }
    inflight = true;
    try {
      const r = await rpc('cs_sheet_save', { p_code: tok, p_week: WEEK, p_answers: answers(), p_summary: summary() });
      lsDel(dirtyKey()); status('공유방에 저장됨 ' + hhmm(r.saved_at));
    } catch (e) {
      status(e.user ? e.message : '저장 실패 · 인터넷 연결을 확인해요 (이 기기에는 남아 있어요)', true);
      if (!e.user) { clearTimeout(timer); timer = setTimeout(flush, 5000); }
    } finally {
      inflight = false;
      if (pending) { pending = false; flush(); }
    }
  }
  // 활동지가 localStorage 에 저장할 때마다 서버 저장을 예약해요
  ST.setItem = function (k, v) { oSet.call(this, k, v); if (this === localStorage && k === fullKey && !silent) schedule(); };
  ST.removeItem = function (k) { oRem.call(this, k); if (this === localStorage && k === fullKey && !silent) schedule(); };
  window.addEventListener('beforeunload', (e) => { if (mode === 'student' && (timer || inflight) && lsGet(dirtyKey())) { flush(); e.preventDefault(); e.returnValue = ''; } });

  function writeLocal(obj) { silent = true; try { if (obj) oSet.call(localStorage, fullKey, JSON.stringify(obj)); else oRem.call(localStorage, fullKey); } catch (e) {} silent = false; }

  // ---- 학번·이름 채우기 ----
  function fillWho() {
    const sid = document.getElementById('sid'), nm = document.getElementById('sname');
    let changed = false;
    if (sid && me.sid && sid.value !== me.sid) { sid.value = me.sid; changed = true; }
    if (nm && me.nickname && nm.value !== me.nickname) { nm.value = me.nickname; changed = true; }
    [sid, nm].forEach((x) => { if (x) { x.readOnly = true; x.title = '공유방 로그인 정보로 채워져요'; } });
    if (changed && typeof window.save === 'function') window.save();
  }
  function lockAll() {
    document.body.classList.add('sb-view');
    document.querySelectorAll('main input, main textarea, main select').forEach((x) => { x.readOnly = true; x.tabIndex = -1; });
    document.querySelectorAll('main button:not([data-toggle])').forEach((b) => { b.disabled = true; });
    const bar = document.querySelector('.bar'); if (bar) bar.style.display = 'none';
  }

  // ---- 지난주 활동지 불러오기: 지난주 답을 옆 칸에 띄워 놓고 보충·수정 ----
  const escH = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 조사 고르기: 앞 낱말 끝 글자에 받침이 있으면 '을', 없으면 '를'
  const josa = (w, a, b) => { const c = String(w).trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };
  // 지난주 답에서 이어 쓸 것: 고른 분야, 주제 (2주차는 "나는 … 를 위해 …" 문장이 주제예요)
  function carryFrom(a) {
    if (!a) return {};
    if (a.state) return { picked: Array.isArray(a.state.picked) ? a.state.picked : [], topic: String(a.topic || '').trim() };
    const t = (k) => String(a[k] || '').trim();
    const topic = t('who') && t('what') && t('goal')
      ? `나는 ${t('who')}${josa(t('who'), '을', '를')} 위해 ${t('what')}${josa(t('what'), '을', '를')} 만들어서 ${t('goal')}${/다\.?$/.test(t('goal')) ? '' : '한다'}`.replace(/\.?$/, '.') : '';
    return { picked: Array.isArray(a.picked) ? a.picked : [], topic };
  }
  const prevSheetWeeks = () => (window.PYSHARE_WEEKS || []).filter((w) => w.sheet && w.no < WEEK).map((w) => w.no);
  function carryBar() {
    const weeks = prevSheetWeeks();
    if (!weeks.length || mode !== 'student') return;
    const last = weeks[weeks.length - 1];
    const bar = document.createElement('div'); bar.className = 'sb-carry';
    bar.innerHTML = `<div><b>↻ 지난주 활동지 불러오기</b><span>지난주 답을 옆에 띄워 놓고 보충하고 고쳐요. 비어 있는 분야와 주제는 저절로 채워요.</span></div>
      <div class="sb-carry-btns">${weeks.slice().reverse().map((n) => `<button type="button" data-cw="${n}" class="${n === last ? 'on' : ''}">${n}주차 불러오기</button>`).join('')}</div>`;
    const who = document.querySelector('main .who');
    if (who) who.after(bar); else { const m = document.querySelector('main .sheet') || document.querySelector('main'); m && m.prepend(bar); }
    bar.querySelectorAll('[data-cw]').forEach((b) => b.addEventListener('click', () => openRef(Number(b.dataset.cw))));
    const ask = Number(params.get('carry'));
    if (ask && weeks.includes(ask)) openRef(ask);
  }
  let refEl = null;
  // 아래쪽 [제출하기] 막대를 가리지 않게, 좁은 화면에서는 그 위에 띄워요
  function barGap() {
    const bar = document.querySelector('.bar');
    document.documentElement.style.setProperty('--sb-bar-h', bar && innerWidth < 1240 ? bar.offsetHeight + 'px' : '0px');
  }
  addEventListener('resize', () => { if (refEl) barGap(); });
  function closeRef() { if (refEl) { refEl.remove(); refEl = null; document.body.classList.remove('sb-ref-on'); } }
  async function openRef(n) {
    closeRef();
    const weeks = prevSheetWeeks();
    refEl = document.createElement('aside'); refEl.className = 'sb-ref'; refEl.setAttribute('aria-label', `${n}주차 내 답`);
    refEl.innerHTML = `<div class="sb-ref-head"><b>${n}주차 내 답</b>
        ${weeks.length > 1 ? `<span class="sb-ref-wk">${weeks.map((k) => `<button type="button" data-rw="${k}" class="${k === n ? 'on' : ''}">${k}주차</button>`).join('')}</span>` : ''}
        <button type="button" class="sb-ref-x" aria-label="닫기">✕</button></div>
      <div class="sb-ref-body"><p class="sb-ref-msg">불러오는 중…</p></div>`;
    document.body.appendChild(refEl); document.body.classList.add('sb-ref-on');
    barGap();
    const box = refEl;
    box.querySelector('.sb-ref-x').addEventListener('click', closeRef);
    box.querySelectorAll('[data-rw]').forEach((b) => b.addEventListener('click', () => openRef(Number(b.dataset.rw))));
    const body = box.querySelector('.sb-ref-body');
    let sheet, items;
    try { [sheet, items] = await Promise.all([rpc('cs_sheet_get', { p_code: tok, p_week: n }), rpc('cs_sheet_items', { p_code: tok, p_week: n })]); }
    catch (e) { if (refEl === box) body.innerHTML = `<p class="sb-ref-msg bad">${escH(e.message || '불러오지 못했어요.')}</p>`; return; }
    if (refEl !== box) return;
    const sheetUrl = ((window.PYSHARE_WEEKS || []).find((w) => w.no === n) || {}).sheet;
    if (!sheet || !sheet.answers || !Object.keys(sheet.answers).length) {
      body.innerHTML = `<p class="sb-ref-msg">${n}주차 활동지를 아직 쓰지 않았어요.${sheetUrl ? ` <a href="${escH(sheetUrl)}">${n}주차 활동지 열기</a>` : ''}</p>`; return;
    }
    // 1) 분야·주제 채우기 (비어 있을 때만)
    const c = carryFrom(sheet.answers);
    const filled = typeof window.SheetCarry === 'function' ? window.SheetCarry(c, false) || [] : [];
    const cur = document.getElementById('topic');
    const topicDiff = c.topic && cur && cur.value.trim() && cur.value.trim() !== c.topic;
    let html = `<div class="sb-ref-top">
      ${filled.length ? `<p class="sb-ref-ok">✓ ${filled.join('·')}를 ${n}주차 답으로 채웠어요. 고쳐서 이번 주에 맞게 다듬어요.</p>` : ''}
      ${c.topic ? `<p class="sb-ref-topic"><span>${n}주차 주제</span>${escH(c.topic)}${topicDiff ? ' <button type="button" class="sb-mini" id="sbUseTopic">이 주제로 바꾸기</button>' : ''}</p>` : ''}
      <p class="sb-ref-meta">${sheet.submitted_at ? '제출 ' + hhmm(sheet.submitted_at) : '저장 ' + hhmm(sheet.saved_at) + ' · 아직 제출 안 함'}
        ${sheet.has_image ? ' · <button type="button" class="sb-mini" id="sbRefImg">활동지 이미지 보기</button>' : ''}</p></div>`;
    // 2) 항목별 답 + 복사 버튼
    if (items && items.length) {
      let last = null;
      html += '<dl class="sb-ref-items">' + items.map((it, i) => {
        const head = it.section !== last ? `<dt>${escH(it.section)}</dt>` : ''; last = it.section;
        const v = String(it.value || '').trim();
        if (!v || v === '아니오' || v === '아직') return head;
        const long = v.includes('\n') || v.length > 60;
        return `${head}<dd><span class="lab">${escH(it.label)}</span>${long ? `<pre>${escH(v)}</pre>` : `<span class="val">${escH(v)}</span>`}
          ${v === '예' || v === '완료' ? '' : `<button type="button" class="sb-mini" data-copy="${i}">복사</button>`}</dd>`;
      }).join('') + '</dl>';
    } else {
      html += `<p class="sb-ref-msg">항목별 답은 [제출하기]를 누른 활동지만 보여요.${sheetUrl ? ` <a href="${escH(sheetUrl)}">${n}주차 활동지를 열어</a> 맨 아래 [제출하기]를 눌러 주세요.` : ''}</p>`;
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      const v = String(items[Number(b.dataset.copy)].value || '').trim();
      try { await navigator.clipboard.writeText(v); b.textContent = '복사함 ✓'; }
      catch (e) { const r = document.createRange(); const t = b.previousElementSibling; r.selectNodeContents(t); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = 'Ctrl+C'; }
      setTimeout(() => { b.textContent = '복사'; }, 1600);
    }));
    const ut = body.querySelector('#sbUseTopic');
    ut && ut.addEventListener('click', () => { window.SheetCarry && window.SheetCarry({ topic: c.topic }, true); ut.remove(); });
    const ib = body.querySelector('#sbRefImg');
    ib && ib.addEventListener('click', async () => {
      ib.disabled = true;
      try { const r = await rpc('cs_sheet_image', { p_code: tok, p_week: n }); if (r) showImage(r.image, `활동지_${me.nickname}_${n}주차.jpg`, `${n}주차 활동지`); }
      catch (e) { status(e.message, true); }
      ib.disabled = false;
    });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && refEl && !document.querySelector('.modal.on')) closeRef(); });

  // ---- 지난주 활동지 이미지 받기 ----
  function prevButton() {
    const ol = document.querySelector('.steps-mini');
    const weeks = (window.PYSHARE_WEEKS || []).filter((w) => w.sheet && w.no < WEEK);
    if (!ol || !weeks.length || mode !== 'student') return;
    const prev = weeks[weeks.length - 1].no;
    const box = document.createElement('div'); box.className = 'sb-prev';
    box.innerHTML = `<button type="button">공유방에 제출한 ${prev}주차 활동지 이미지 받기</button> <span style="font-size:.85rem;color:var(--sub)" role="status"></span>`;
    ol.after(box);
    const msg = box.querySelector('span');
    box.querySelector('button').addEventListener('click', async () => {
      msg.textContent = '불러오는 중…';
      try {
        const r = await rpc('cs_sheet_image', { p_code: tok, p_week: prev });
        if (!r) { msg.textContent = `${prev}주차 활동지를 아직 제출하지 않았어요. 공유방에서 ${prev}주차 활동지를 열어 [제출하기]를 눌러 주세요.`; return; }
        msg.textContent = '';
        showImage(r.image, `활동지_${me.nickname}_${prev}주차.jpg`);
      } catch (e) { msg.textContent = e.message; }
    });
  }
  function showImage(src, name, title) {
    const m = document.createElement('div'); m.className = 'modal on';
    m.innerHTML = `<div class="modal-box"><h2 style="margin-bottom:10px">${escH(title || '지난주 활동지')}</h2><img alt="지난주 활동지 이미지">
      <p>이 이미지를 내 기기에 받은 뒤 AI에게 올려요. 휴대폰은 이미지를 길게 눌러 저장할 수도 있어요.</p>
      <div class="modal-actions"><button type="button" class="ghost">닫기</button><button type="button" class="primary">파일로 받기</button></div></div>`;
    m.querySelector('img').src = src;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.addEventListener('click', (e) => { if (e.target === m) close(); });
    m.querySelector('.ghost').addEventListener('click', close);
    m.querySelector('.primary').addEventListener('click', () => download(src, name));
  }

  async function downloadSubmitted() {
    const b = document.getElementById('sbDl'); const old = b.textContent;
    b.disabled = true; b.textContent = '불러오는 중…';
    try {
      const r = await rpc('cs_sheet_image', { p_code: tok, p_week: WEEK, p_mid: viewMid });
      if (r) download(r.image, `활동지_${WEEK}주차_${(me && me.nickname) || ''}.jpg`);
      else status('아직 제출한 이미지가 없어요', true);
    } catch (e) { status(e.message, true); }
    b.disabled = false; b.textContent = old;
  }

  // ---- 파일로 받기 ----
  function download(data, name) {
    const a = document.createElement('a');
    a.href = typeof data === 'string' ? data : URL.createObjectURL(data);
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // ---- 제출용 그림: 폭을 900px로 줄이고 JPEG로 (서버 용량 아끼기) ----
  function toJpeg(canvas) {
    const s = Math.min(1, 900 / canvas.width);
    const c = document.createElement('canvas');
    c.width = Math.round(canvas.width * s); c.height = Math.round(canvas.height * s);
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(canvas, 0, 0, c.width, c.height);
    let q = 0.85, d = c.toDataURL('image/jpeg', q);
    while (d.length > 2500000 && q > 0.4) { q -= 0.15; d = c.toDataURL('image/jpeg', q); }
    return d;
  }

  return {
    week: WEEK,
    key(base) {
      fullKey = `${base}::${viewMid ? 'view' : (tok ? 'u' + hash(tok) : 'none')}`;
      return fullKey;
    },
    async start(key, init) {
      fullKey = key;
      strip();
      if (!tok) { gate('공유방에 먼저 로그인해 주세요.'); return; }
      status('불러오는 중…');
      try { me = await rpc('cs_login', { p_code: tok }); }
      catch (e) { gate(e.user ? '로그인이 풀렸어요. 공유방에서 다시 들어와 주세요.' : e.message); return; }

      if (me.role === 'mentor') {
        if (viewMid) {
          try {
            const r = await rpc('cs_sheet_get', { p_code: tok, p_week: WEEK, p_mid: viewMid });
            writeLocal(r ? r.answers : null);
            mode = 'view'; init(); lockAll();
            if (r && r.has_image) document.getElementById('sbDl').hidden = false;
            document.getElementById('sbWho').textContent = '멘토 · 읽기 전용';
            status(r ? (r.submitted_at ? '제출 ' + hhmm(r.submitted_at) : '저장 ' + hhmm(r.saved_at) + ' · 아직 제출 안 함') : '이 학생은 아직 이 활동지를 쓰지 않았어요');
          } catch (e) { gate(e.message); }
          return;
        }
        mode = 'preview'; writeLocal(null); init();
        document.getElementById('sbWho').textContent = '멘토 · 미리보기';
        note('멘토 미리보기예요. 써 볼 수 있지만 공유방에는 저장되지 않아요.');
        status('저장 안 됨 (미리보기)');
        return;
      }

      mode = 'student';
      document.getElementById('sbWho').textContent = `${me.sid || ''} ${me.nickname}`.trim();
      let server = null, failed = false;
      try { server = await rpc('cs_sheet_get', { p_code: tok, p_week: WEEK }); } catch (e) { failed = true; }
      const localDirty = !!lsGet(dirtyKey()) && lsGet(fullKey);
      if (!localDirty && server && server.answers && Object.keys(server.answers).length) writeLocal(server.answers);
      init();
      fillWho();
      prevButton();
      carryBar();
      if (localDirty) schedule(300);                 // 지난번에 못 올린 내용부터 올려요
      else if (failed) status('공유방에서 불러오지 못했어요. 이 기기에 있는 내용으로 열었어요.', true);
      else if (server) status(server.submitted_at ? `제출함 ${hhmm(server.submitted_at)} · 고치면 다시 제출해요` : `공유방에 저장됨 ${hhmm(server.saved_at)}`);
      else status('쓰는 대로 공유방에 저장돼요');
      if (server && server.has_image) document.getElementById('sbDl').hidden = false;
    },
    async submit(canvas) {
      if (mode !== 'student') return { ok: false, msg: mode === 'view' ? '멘토 보기에서는 제출하지 않아요.' : '멘토 미리보기라 공유방에는 제출되지 않아요.' };
      clearTimeout(timer); timer = null;
      try {
        const its = items();
        const r = await rpc('cs_sheet_submit', { p_code: tok, p_week: WEEK, p_answers: answers(), p_summary: summary(), p_image: toJpeg(canvas), p_items: its });
        lsDel(dirtyKey());
        status('제출함 ' + hhmm(r.submitted_at));
        document.getElementById('sbDl').hidden = false;
        return { ok: true, msg: `제출했어요! 항목 ${r.items ?? its.length}개의 답과 활동지 이미지가 공유방에 저장됐어요. 이미지가 필요하면 [이미지로 받기]를 눌러요.` };
      } catch (e) {
        status('제출 실패', true);
        return { ok: false, msg: '제출하지 못했어요: ' + (e.message || '다시 눌러 주세요.') };
      }
    },
    download,
  };
})();
