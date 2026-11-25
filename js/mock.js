/* =====================================================================
   체험 모드 (config.js 가 비어 있을 때)
   Supabase 함수(supabase_codeshare.sql)와 똑같은 이름·규칙으로 흉내 내요.
   기록은 이 브라우저(localStorage)에만 남아요.
     학생: 10101 김민트 / 1111, 10102 이감자 / 2222, 10103 박새싹 (처음 들어오면 비밀번호를 정해요)
     멘토 비밀번호: mentor-demo-1234
   ===================================================================== */
'use strict';

window.MockDB = (() => {
  const KEY = 'pyshare_demo_v6';
  const MENTOR = 'mentor-demo-1234';
  const now = () => new Date().toISOString();
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

  const GAME1 = `import random

answer = random.randint(1, 50)
guess = int(input("1~50 사이 숫자를 맞혀 보세요: "))
if guess == answer:
    print("정답!")
else:
    print("아쉬워요. 정답은", answer)
`;
  const GAME2 = `import random

answer = random.randint(1, 50)
tries = 0

while True:
    guess = int(input("1~50 사이 숫자: "))
    tries += 1
    if guess < answer:
        print("업! ⬆")
    elif guess > answer:
        print("다운! ⬇")
    else:
        print(f"정답! {tries}번 만에 맞혔어요 🎉")
        break
`;
  const GAME3 = `import random

answer = random.randint(1, 50)
tries = 0
print("숫자 맞히기 게임! 1부터 50 사이 숫자를 생각했어요.")

while True:
    text = input("숫자: ")
    if not text.isdigit():
        print("숫자만 적어 주세요!")
        continue
    guess = int(text)
    tries += 1
    if guess < answer:
        print("업! ⬆")
    elif guess > answer:
        print("다운! ⬇")
    else:
        print(f"정답! {tries}번 만에 맞혔어요 🎉")
        break
`;
  const MENU1 = `import random

menus = ["돈가스", "김치볶음밥", "떡볶이", "카레", "비빔밥"]
print("오늘의 추천 메뉴는...")
print("👉", random.choice(menus))
`;
  const MENU2 = `import random
import time

menus = ["돈가스", "김치볶음밥", "떡볶이", "카레", "비빔밥", "마라탕"]
count = int(input("며칠 치 메뉴를 뽑을까요? "))

for day in range(1, count + 1):
    print(f"{day}일째 메뉴를 고르는 중", end="")
    for _ in range(3):
        time.sleep(0.3)
        print(".", end="")
    print(" 👉", random.choice(menus))
`;
  // 체험용 웹앱: 이감자의 "급식 메뉴 뽑기" 를 AI로 바꿨다고 치고 넣어 둔 HTML
  const MENU_APP = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>급식 메뉴 뽑기</title><style>
body{margin:0;font-family:system-ui,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#fff7ec;color:#2b2118;display:grid;place-items:center;min-height:100vh}
.box{width:min(420px,92vw);background:#fff;border-radius:20px;padding:26px;box-shadow:0 12px 30px -14px #c2410c66;text-align:center}
h1{margin:0 0 6px;font-size:24px}p{color:#7c6a58;margin:0 0 18px}
label{display:block;font-weight:700;margin-bottom:8px}input{width:90px;font-size:20px;padding:8px;text-align:center;border:2px solid #fdba74;border-radius:12px}
button{margin-left:8px;font-size:17px;font-weight:700;padding:10px 18px;border:0;border-radius:12px;background:#ea580c;color:#fff;cursor:pointer}
ol{text-align:left;padding-left:24px;font-size:18px;line-height:2}li span{font-weight:800;color:#c2410c}
</style></head><body><div class="box"><h1>🍱 급식 메뉴 뽑기</h1><p>오늘 뭐 먹지? 랜덤으로 골라 줘요.</p>
<form id="f"><label for="n">며칠 치 메뉴를 뽑을까요?</label><input id="n" type="number" min="1" max="7" value="3"><button>뽑기</button></form><ol id="out"></ol></div>
<script>
var menus = ["돈가스", "김치볶음밥", "떡볶이", "카레", "비빔밥", "마라탕"];
document.getElementById("f").addEventListener("submit", function (e) {
  e.preventDefault();
  var n = Math.max(1, Math.min(7, parseInt(document.getElementById("n").value, 10) || 1));
  var out = document.getElementById("out"); out.innerHTML = "";
  var day = 1;
  (function next() {
    if (day > n) return;
    var li = document.createElement("li"); li.textContent = day + "일째 메뉴를 고르는 중"; out.appendChild(li);
    var dots = 0, t = setInterval(function () {
      dots++; li.textContent += ".";
      if (dots === 3) { clearInterval(t); var b = document.createElement("span"); b.textContent = " 👉 " + menus[Math.floor(Math.random() * menus.length)]; li.appendChild(b); day++; next(); }
    }, 250);
  })();
});
</script></body></html>`;
  const GUGU = `dan = int(input("몇 단을 볼까요? "))

for i in range(1, 10):
    print(f"{dan} x {i} = {dan * i}")
`;

  function seed() {
    return {
      seq: { m: 3, p: 4, v: 20, f: 2 },
      members: [
        { id: 1, code: 'DEMOTOKENMINT001', sid: '10101', nickname: '김민트', pin: '1111', pin_fails: 0, active: true, created_at: ago(60 * 24 * 7) },
        { id: 2, code: 'DEMOTOKENCHIP002', sid: '10102', nickname: '이감자', pin: '2222', pin_fails: 0, active: true, created_at: ago(60 * 24 * 7) },
        { id: 3, code: 'DEMOTOKENSSAK003', sid: '10103', nickname: '박새싹', pin: null, pin_fails: 0, active: true, created_at: ago(60 * 24 * 2) },
      ],
      projects: [
        { id: 1, member_id: 1, week: 4, title: '숫자 맞히기 게임', description: '1~50 사이 숫자를 맞혀요. 업다운 힌트를 줘요!', shared: true, created_at: ago(60 * 24 * 6), updated_at: ago(35) },
        { id: 2, member_id: 2, week: 3, title: '급식 메뉴 뽑기', description: '오늘 뭐 먹지? 랜덤으로 골라 줘요.', shared: true, created_at: ago(60 * 24 * 5), updated_at: ago(60 * 3), final_no: 2, final_at: ago(60 * 2), webapp: MENU_APP, webapp_no: 2, webapp_at: ago(60) },
        { id: 3, member_id: 2, week: 3, title: '구구단 표', description: '원하는 단을 입력하면 구구단을 보여 줘요.', shared: true, created_at: ago(60 * 24 * 4), updated_at: ago(60 * 24 * 2) },
        { id: 4, member_id: 1, week: null, title: '연습장', description: '이것저것 시험해 보는 곳', shared: false, created_at: ago(60 * 24 * 3), updated_at: ago(60 * 24) },
      ],
      versions: [
        { id: 1, project_id: 1, no: 1, code: GAME1, note: '처음 만듦', created_at: ago(60 * 24 * 6) },
        { id: 2, project_id: 1, no: 2, code: GAME2, note: '여러 번 시도할 수 있게 while 추가', created_at: ago(60 * 24 * 2) },
        { id: 3, project_id: 1, no: 3, code: GAME3, note: '숫자가 아닌 값 입력 막기', created_at: ago(35) },
        { id: 4, project_id: 2, no: 1, code: MENU1, note: '처음 만듦', created_at: ago(60 * 24 * 5) },
        { id: 5, project_id: 2, no: 2, code: MENU2, note: '여러 날 뽑기 + 두근두근 점점점', created_at: ago(60 * 3) },
        { id: 6, project_id: 3, no: 1, code: GUGU, note: '처음 만듦', created_at: ago(60 * 24 * 4) },
        { id: 7, project_id: 4, no: 1, code: 'print("나만 보는 연습장")\n', note: '처음 만듦', created_at: ago(60 * 24 * 3) },
      ],
      share_mode: 'final',
      sheets: [
        { member_id: 1, week: 2, saved_at: ago(60 * 24 * 14), submitted_at: ago(60 * 24 * 14), has_image: false,
          items: [
            { section: '1. 분야 고르기', label: '고른 분야', value: '① 데이터 분석' },
            { section: '2. 아이디어 2가지 꺼내기', label: '아이디어 1', value: '시험 기간에 공부 계획 세우기가 귀찮다' },
            { section: '2. 아이디어 2가지 꺼내기', label: '아이디어 2', value: '우리 반은 몇 시에 자는지 궁금하다' },
            { section: '3. 주제를 한 문장으로', label: '누구를 위해', value: '우리 반 친구들' },
            { section: '3. 주제를 한 문장으로', label: '무엇을 만들어서', value: '수면시간 그래프' },
            { section: '3. 주제를 한 문장으로', label: '알아낼 것 · 해결할 것', value: '잠을 많이 자는 게 도움이 되는지 알아본다' },
            { section: '3. 주제를 한 문장으로', label: '완성된 문장', value: '나는 우리 반 친구들를 위해 수면시간 그래프을 만들어서 잠을 많이 자는 게 도움이 되는지 알아본다한다.' },
            { section: '5. 다음 시간까지 준비', label: '내가 할 일', value: '수면시간 설문 구글폼 만들기' },
          ],
          summary: { topic: '수면시간 그래프 — 잠을 많이 자는 게 도움이 되는지 알아본다', progress: '', fields: ['① 데이터 분석'] },
          answers: { picked: ['data'], sid: '10101', sname: '김민트', sdate: '', mix: '', idea1: '시험 기간에 공부 계획 세우기가 귀찮다', idea2: '우리 반은 몇 시에 자는지 궁금하다',
            who: '우리 반 친구들', what: '수면시간 그래프', goal: '잠을 많이 자는 게 도움이 되는지 알아본다', mine: '수면시간 설문 구글폼 만들기', c1: true, c2: true, c3: false } },
      ],
      feedback: [
        { id: 1, project_id: 1, version_no: 2, body: 'while True와 break로 반복을 잘 끝냈어요! 숫자가 아닌 글자를 넣으면 어떻게 되는지 한 번 시험해 보고, 막는 방법도 생각해 봐요.', seen: true, created_at: ago(60 * 24) },
        { id: 2, project_id: 1, version_no: 3, body: 'isdigit()로 잘 막았어요 👍 다음 도전: 시도 횟수를 7번으로 제한하고, 실패하면 정답을 알려 주게 바꿔 볼까요?', seen: false, created_at: ago(20) },
      ],
    };
  }

  let db;
  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.members) db = seed();
    if (!db.sheets) db.sheets = [];
    if (!db.share_mode) db.share_mode = 'final';
  }
  // 체험 모드의 활동지 이미지는 크기 때문에 따로 보관해요
  const imgKey = (mid, week) => `pyshare_demo_img_${mid}_${week}`;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  load();

  class MockErr extends Error { constructor(m) { super(m); this.user = true; } }
  const err = (m) => { throw new MockErr(m); };
  const norm = (t) => String(t || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const lines = (c) => (c === '' ? 0 : c.split('\n').length);
  const latest = (pid) => db.versions.filter((v) => v.project_id === pid).sort((a, b) => b.no - a.no)[0];
  const member = (id) => db.members.find((m) => m.id === id);
  const proj = (id) => db.projects.find((p) => p.id === Number(id));

  function who(code) {
    const m = db.members.find((x) => x.code === norm(code) && x.active);
    if (m) return { mid: m.id, mentor: false };
    if (code === MENTOR) return { mid: null, mentor: true };
    err('로그인 정보가 맞지 않아요. 다시 로그인해 주세요.');
  }
  function mentorOnly(code) { if (!who(code).mentor) err('멘토만 할 수 있어요.'); }
  function canSee(code, id) {
    const w = who(code); const p = proj(id);
    if (!p) err('프로젝트를 찾을 수 없어요. 지워졌을 수 있어요.');
    const mine = w.mid != null && p.member_id === w.mid;
    if (mine || w.mentor) return { mine, mentor: w.mentor, p };
    if (!member(p.member_id).active) err('지금은 볼 수 없는 프로젝트예요.');
    if (db.share_mode === 'all') { if (!p.shared) err('친구가 나만 보기로 바꾼 프로젝트예요.'); return { mine, mentor: false, p }; }
    if (db.share_mode === 'final') err('친구 완성작은 웹앱으로만 볼 수 있어요.');
    err('지금은 친구 코드를 볼 수 없어요.');
  }
  const ver = (pid, no) => db.versions.find((v) => v.project_id === pid && v.no === no);
  function owner(code, id) {
    const w = who(code); const p = proj(id);
    if (w.mid == null || !p || p.member_id !== w.mid) err('내 프로젝트만 고칠 수 있어요.');
    return p;
  }
  function checkText(t, d) {
    if (!String(t || '').trim()) err('프로젝트 이름을 적어 주세요.');
    if (String(t).length > 60) err('프로젝트 이름은 60글자까지예요.');
    if (String(d || '').length > 300) err('설명은 300글자까지예요.');
  }
  const nn = (t) => String(t || '').replace(/\s/g, '');
  function checkWeek(w) { if (w != null && (w < 1 || w > 20)) err('주차는 1~20 사이로 골라 주세요.'); }
  const sheetOut = (x) => ({ week: x.week, answers: x.answers, summary: x.summary, has_image: !!x.has_image, saved_at: x.saved_at, submitted_at: x.submitted_at });
  function checkMember(sid, name) {
    if (!/^[0-9]{4,10}$/.test(String(sid || '').trim())) err('학번은 숫자로 적어 주세요 (예: 10101).');
    if (!nn(name)) err('이름을 적어 주세요.');
    if (String(name).trim().length > 20) err('이름은 20글자까지예요.');
  }
  function newCode() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c;
    do { c = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => a[b % 32]).join(''); } while (db.members.some((m) => m.code === c));
    return c;
  }

  const F = {
    cs_student_login({ p_sid, p_name, p_pin, p_pin2 }) {
      const m = db.members.find((x) => x.sid === String(p_sid || '').trim() && nn(x.nickname) === nn(p_name) && x.active);
      if (!m) err('명단에서 찾을 수 없어요. 학번과 이름을 확인하거나 멘토에게 물어봐 주세요.');
      if (!/^[0-9]{4}$/.test(p_pin || '')) err('비밀번호는 숫자 4자리예요.');
      if (m.pin == null) {
        if (p_pin2 == null) return { first: true, nickname: m.nickname };
        if (p_pin2 !== p_pin) err('두 번 적은 비밀번호가 달라요. 다시 적어 주세요.');
        m.pin = p_pin; m.pin_fails = 0; save();
      } else {
        if (m.pin_fails >= 10) err('비밀번호를 10번 틀려서 잠겼어요. 멘토에게 초기화를 부탁해 주세요.');
        if (m.pin !== p_pin) {
          m.pin_fails++; save();
          return { error: m.pin_fails >= 10 ? '비밀번호를 10번 틀려서 잠겼어요. 멘토에게 초기화를 부탁해 주세요.'
            : `비밀번호가 맞지 않아요. (${m.pin_fails}/10번 틀림) 잊었으면 멘토에게 초기화를 부탁해 주세요.` };
        }
        if (m.pin_fails) { m.pin_fails = 0; save(); }
      }
      return { token: m.code, role: 'student', id: m.id, nickname: m.nickname, sid: m.sid };
    },
    cs_login({ p_code }) {
      const w = who(p_code);
      if (w.mentor) return { role: 'mentor', nickname: '멘토' };
      const m = member(w.mid); return { role: 'student', id: m.id, nickname: m.nickname, sid: m.sid };
    },
    cs_share_mode({ p_code }) { who(p_code); return { mode: db.share_mode }; },
    cs_m_share_mode({ p_code, p_mode }) {
      mentorOnly(p_code);
      if (!['all', 'final', 'none'].includes(p_mode)) err('공개 방법을 골라 주세요.');
      db.share_mode = p_mode; save(); return { mode: p_mode };
    },
    cs_webapp({ p_code, p_id }) {
      const w = who(p_code); const p = proj(p_id);
      if (!p) err('프로젝트를 찾을 수 없어요. 지워졌을 수 있어요.');
      const m = member(p.member_id), mine = w.mid != null && p.member_id === w.mid;
      if (!(mine || w.mentor)) {
        if (!m.active) err('지금은 볼 수 없는 프로젝트예요.');
        if (!((db.share_mode === 'final' && p.final_no != null) || (db.share_mode === 'all' && p.shared))) {
          err(db.share_mode === 'none' ? '지금은 친구 작품을 볼 수 없어요.' : '아직 완성작으로 내지 않은 프로젝트예요.');
        }
      }
      return { id: p.id, title: p.title, description: p.description, week: p.week ?? null, nickname: m.nickname, mine, mentor: w.mentor,
        final_no: p.final_no ?? null, final_at: p.final_at ?? null, html: p.webapp ?? null, webapp_no: p.webapp_no ?? null, webapp_at: p.webapp_at ?? null };
    },
    cs_m_webapp_save({ p_code, p_id, p_html, p_no }) {
      mentorOnly(p_code); const p = proj(p_id);
      if (!p) err('프로젝트를 찾을 수 없어요.');
      if (!String(p_html || '').trim()) { p.webapp = null; p.webapp_no = null; p.webapp_at = null; save(); return { ok: true, deleted: true }; }
      if (String(p_html).length > 600000) err('웹앱 HTML이 너무 커요 (60만 글자까지).');
      if (p_no != null && !ver(p.id, Number(p_no))) err('그 버전을 찾을 수 없어요.');
      p.webapp = String(p_html); p.webapp_no = p_no == null ? null : Number(p_no); p.webapp_at = now(); save();
      return { ok: true, webapp_no: p.webapp_no };
    },
    cs_finalize({ p_code, p_id, p_no }) {
      const p = owner(p_code, p_id);
      if (p_no == null) { p.final_no = null; p.final_at = null; save(); return { ok: true, final_no: null }; }
      if (!ver(p.id, Number(p_no))) err('그 버전을 찾을 수 없어요.');
      db.projects.forEach((x) => { if (x.member_id === p.member_id && x.id !== p.id) { x.final_no = null; x.final_at = null; } });
      p.final_no = Number(p_no); p.final_at = now(); save();
      return { ok: true, final_no: p.final_no };
    },
    cs_list({ p_code }) {
      const w = who(p_code), mode = db.share_mode;
      const fo = (p) => !w.mentor && p.member_id !== w.mid && mode === 'final';
      const t = (p) => (fo(p) ? p.final_at : p.updated_at) || '';
      return db.projects
        .filter((p) => w.mentor || p.member_id === w.mid || (member(p.member_id).active && ((mode === 'all' && p.shared) || (mode === 'final' && p.final_no != null))))
        .sort((a, b) => t(b).localeCompare(t(a)))
        .map((p) => {
          const v = latest(p.id), hide = fo(p); const mine = p.member_id === w.mid;
          return {
            id: p.id, title: p.title, description: p.description, shared: p.shared, week: p.week ?? null, nickname: member(p.member_id).nickname,
            sid: w.mentor ? member(p.member_id).sid : null, mine, updated_at: t(p), final_no: p.final_no ?? null, final_at: p.final_at ?? null,
            has_webapp: !!p.webapp, webapp_no: p.webapp_no ?? null, webapp_at: p.webapp_at ?? null,
            versions: hide ? null : v.no, preview: hide ? '' : v.code.slice(0, 400), lines: hide ? null : lines(v.code),
            unseen: mine ? db.feedback.filter((f) => f.project_id === p.id && !f.seen).length : 0,
            feedback: w.mentor ? db.feedback.filter((f) => f.project_id === p.id).length : 0,
          };
        });
    },
    cs_get({ p_code, p_id }) {
      const c = canSee(p_code, p_id); const p = c.p; const v = latest(p.id);
      const fb = (c.mine || c.mentor)
        ? db.feedback.filter((f) => f.project_id === p.id).sort((a, b) => b.id - a.id).map((f) => ({ id: f.id, version_no: f.version_no, body: f.body, seen: f.seen, created_at: f.created_at }))
        : null;
      const r = {
        id: p.id, title: p.title, description: p.description, shared: p.shared, week: p.week ?? null, nickname: member(p.member_id).nickname,
        sid: c.mentor ? member(p.member_id).sid : null, mine: c.mine, mentor: c.mentor,
        updated_at: p.updated_at, final_no: p.final_no ?? null, final_at: p.final_at ?? null,
        has_webapp: !!p.webapp, webapp_no: p.webapp_no ?? null, webapp_at: p.webapp_at ?? null,
        latest: { no: v.no, code: v.code, note: v.note, created_at: v.created_at },
        versions: db.versions.filter((x) => x.project_id === p.id).sort((a, b) => b.no - a.no).map((x) => ({ no: x.no, note: x.note, created_at: x.created_at, lines: lines(x.code) })),
        feedback: fb,
      };
      if (c.mine) { db.feedback.forEach((f) => { if (f.project_id === p.id) f.seen = true; }); save(); }
      return r;
    },
    cs_version({ p_code, p_id, p_no }) {
      canSee(p_code, p_id);
      const v = db.versions.find((x) => x.project_id === Number(p_id) && x.no === Number(p_no));
      if (!v) err('그 버전을 찾을 수 없어요.');
      return { no: v.no, code: v.code, note: v.note, created_at: v.created_at };
    },
    cs_create({ p_code, p_title, p_desc, p_shared, p_src, p_week }) {
      const w = who(p_code);
      if (w.mid == null) err('프로젝트는 학생 코드로 들어와서 만들어요.');
      checkText(p_title, p_desc);
      checkWeek(p_week);
      if (db.projects.filter((p) => p.member_id === w.mid).length >= 30) err('프로젝트는 30개까지 만들 수 있어요.');
      const id = ++db.seq.p;
      db.projects.push({ id, member_id: w.mid, week: p_week ?? null, title: p_title.trim(), description: String(p_desc || '').trim(), shared: p_shared !== false, created_at: now(), updated_at: now() });
      db.versions.push({ id: ++db.seq.v, project_id: id, no: 1, code: p_src || '', note: '처음 만듦', created_at: now() });
      save(); return { id, no: 1 };
    },
    cs_save({ p_code, p_id, p_src, p_note }) {
      const p = owner(p_code, p_id);
      if (String(p_src || '').length > 100000) err('코드가 너무 길어요 (10만 글자까지).');
      if (String(p_note || '').length > 100) err('저장 메모는 100글자까지예요.');
      const last = latest(p.id);
      if (last.code === (p_src || '')) return { no: last.no, unchanged: true };
      const no = last.no + 1;
      db.versions.push({ id: ++db.seq.v, project_id: p.id, no, code: p_src || '', note: String(p_note || '').trim(), created_at: now() });
      p.updated_at = now(); save(); return { no, unchanged: false };
    },
    cs_update({ p_code, p_id, p_title, p_desc, p_shared, p_week }) {
      const p = owner(p_code, p_id); checkText(p_title, p_desc); checkWeek(p_week); p.week = p_week ?? null;
      p.title = p_title.trim(); p.description = String(p_desc || '').trim(); if (p_shared != null) p.shared = !!p_shared;
      save(); return { ok: true };
    },
    cs_delete({ p_code, p_id, p_confirm }) {
      const c = canSee(p_code, p_id);
      if (!(c.mine || c.mentor)) err('내 프로젝트만 지울 수 있어요.');
      if (String(p_confirm || '').trim() !== c.p.title) err('확인 칸에 프로젝트 이름을 똑같이 적어 주세요.');
      db.projects = db.projects.filter((p) => p.id !== c.p.id);
      db.versions = db.versions.filter((v) => v.project_id !== c.p.id);
      db.feedback = db.feedback.filter((f) => f.project_id !== c.p.id);
      save(); return { ok: true };
    },
    cs_sheet_get({ p_code, p_week, p_mid }) {
      const w = who(p_code); const mid = w.mentor ? Number(p_mid) : w.mid;
      if (!mid) err('어느 학생의 활동지인지 골라 주세요.');
      const x = db.sheets.find((s) => s.member_id === mid && s.week === Number(p_week));
      return x ? sheetOut(x) : null;
    },
    cs_sheet_save({ p_code, p_week, p_answers, p_summary }) {
      const w = who(p_code); if (w.mid == null) err('활동지는 학생으로 들어와서 써요.');
      checkWeek(p_week);
      let x = db.sheets.find((s) => s.member_id === w.mid && s.week === Number(p_week));
      if (!x) { x = { member_id: w.mid, week: Number(p_week), submitted_at: null, has_image: false }; db.sheets.push(x); }
      x.answers = p_answers || {}; x.summary = p_summary || {}; x.saved_at = now(); save();
      return { saved_at: x.saved_at };
    },
    cs_sheet_submit({ p_code, p_week, p_answers, p_summary, p_image, p_items }) {
      const w = who(p_code); if (w.mid == null) err('활동지는 학생으로 들어와서 제출해요.');
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(p_image || '')) err('활동지 이미지가 올바르지 않아요.');
      try { localStorage.setItem(imgKey(w.mid, p_week), p_image); } catch (e) { err('체험 모드 저장 공간이 부족해요. 이미지는 저장하지 못했어요.'); }
      const r = F.cs_sheet_save({ p_code, p_week, p_answers, p_summary });
      const x = db.sheets.find((s) => s.member_id === w.mid && s.week === Number(p_week));
      if (!Array.isArray(p_items || [])) err('항목 모양이 맞지 않아요.');
      x.items = (p_items || []).slice(0, 300).map((i) => ({ section: String(i.section || '').slice(0, 200), label: String(i.label || '').slice(0, 200), value: String(i.value || '').slice(0, 5000) }));
      x.has_image = true; x.submitted_at = r.saved_at; save();
      return { submitted_at: x.submitted_at, items: x.items.length };
    },
    cs_sheet_items({ p_code, p_week, p_mid }) {
      const w = who(p_code); const mid = w.mentor ? Number(p_mid) : w.mid;
      const x = db.sheets.find((s) => s.member_id === mid && s.week === Number(p_week));
      return x && x.items ? x.items : [];
    },
    cs_m_sheet_items({ p_code, p_week }) {
      mentorOnly(p_code);
      return db.sheets.filter((x) => x.week === Number(p_week) && x.items).flatMap((x) => x.items.map((i, k) => ({ member_id: x.member_id, ord: k + 1, ...i })));
    },
    cs_sheet_image({ p_code, p_week, p_mid }) {
      const w = who(p_code); const mid = w.mentor ? Number(p_mid) : w.mid;
      const x = db.sheets.find((s) => s.member_id === mid && s.week === Number(p_week));
      let image = null; try { image = localStorage.getItem(imgKey(mid, p_week)); } catch (e) {}
      return x && x.has_image && image ? { image, submitted_at: x.submitted_at } : null;
    },
    cs_sheet_mine({ p_code }) {
      const w = who(p_code); if (w.mid == null) return [];
      return db.sheets.filter((s) => s.member_id === w.mid).sort((a, b) => a.week - b.week).map(sheetOut).map(({ answers, ...r }) => r);
    },
    cs_m_sheets({ p_code }) {
      mentorOnly(p_code);
      return db.sheets.map((x) => ({ member_id: x.member_id, week: x.week, summary: x.summary, has_image: !!x.has_image, saved_at: x.saved_at, submitted_at: x.submitted_at }));
    },
    cs_m_members({ p_code }) {
      mentorOnly(p_code);
      return db.members.slice().sort((x, y) => String(x.sid).localeCompare(String(y.sid))).map((m) => {
        const pids = db.projects.filter((p) => p.member_id === m.id).map((p) => p.id);
        const vs = db.versions.filter((v) => pids.includes(v.project_id));
        return { id: m.id, sid: m.sid, nickname: m.nickname, active: m.active, created_at: m.created_at, has_pin: m.pin != null, locked: m.pin_fails >= 10,
          projects: pids.length, saves: vs.length, last_save: vs.length ? vs.map((v) => v.created_at).sort().pop() : null };
      });
    },
    cs_m_add({ p_code, p_sid, p_name }) {
      mentorOnly(p_code); checkMember(p_sid, p_name);
      if (db.members.some((m) => m.sid === String(p_sid).trim())) err('이미 명단에 있는 학번이에요: ' + String(p_sid).trim());
      const id = ++db.seq.m;
      db.members.push({ id, code: newCode(), sid: String(p_sid).trim(), nickname: p_name.trim(), pin: null, pin_fails: 0, active: true, created_at: now() });
      save(); return { id };
    },
    cs_m_update({ p_code, p_mid, p_sid, p_name, p_active }) {
      mentorOnly(p_code); checkMember(p_sid, p_name);
      const m = member(Number(p_mid)); if (!m) err('학생을 찾을 수 없어요.');
      if (db.members.some((x) => x.sid === String(p_sid).trim() && x.id !== m.id)) err('이미 명단에 있는 학번이에요: ' + String(p_sid).trim());
      m.sid = String(p_sid).trim(); m.nickname = p_name.trim(); if (p_active != null) m.active = !!p_active; save(); return { ok: true };
    },
    cs_m_reset_pin({ p_code, p_mid }) {
      mentorOnly(p_code);
      const m = member(Number(p_mid)); if (!m) err('학생을 찾을 수 없어요.');
      m.pin = null; m.pin_fails = 0; m.code = newCode(); save(); return { ok: true };
    },
    cs_m_remove({ p_code, p_mid, p_confirm }) {
      mentorOnly(p_code);
      const m = member(Number(p_mid)); if (!m) err('학생을 찾을 수 없어요.');
      if (String(p_confirm || '').trim() !== m.nickname) err('확인 칸에 이름을 똑같이 적어 주세요.');
      const pids = db.projects.filter((p) => p.member_id === m.id).map((p) => p.id);
      db.members = db.members.filter((x) => x.id !== m.id);
      db.projects = db.projects.filter((p) => !pids.includes(p.id));
      db.versions = db.versions.filter((v) => !pids.includes(v.project_id));
      db.feedback = db.feedback.filter((f) => !pids.includes(f.project_id));
      db.sheets = db.sheets.filter((x) => x.member_id !== m.id);
      save(); return { ok: true };
    },
    cs_m_feedback({ p_code, p_id, p_no, p_body }) {
      mentorOnly(p_code);
      if (!String(p_body || '').trim()) err('피드백 내용을 적어 주세요.');
      if (String(p_body).length > 2000) err('피드백은 2000글자까지예요.');
      if (!proj(p_id)) err('프로젝트를 찾을 수 없어요.');
      const id = ++db.seq.f;
      db.feedback.push({ id, project_id: Number(p_id), version_no: p_no, body: p_body.trim(), seen: false, created_at: now() });
      save(); return { id };
    },
    cs_m_feedback_delete({ p_code, p_fid }) {
      mentorOnly(p_code);
      db.feedback = db.feedback.filter((f) => f.id !== Number(p_fid)); save(); return { ok: true };
    },
  };

  return {
    async call(fn, args) {
      await new Promise((r) => setTimeout(r, 120));
      load();
      if (!F[fn]) err('서버 함수를 찾을 수 없어요: ' + fn);
      return JSON.parse(JSON.stringify(F[fn](args || {})));
    },
    reset() { db = seed(); save(); },
    MENTOR,
  };
})();
