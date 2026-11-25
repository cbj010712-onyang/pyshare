// =====================================================================
// 입력 다리 (서비스 워커)
// 파이썬은 워커 안에서 돌아가요. 워커가 input()에서 "멈춰서 기다리려면"
// 동기 요청(XHR)을 보내고, 여기서 화면이 답을 줄 때까지 응답을 미뤄요.
//   워커 ──(동기 요청 __py_input__?id=..)──▶ 서비스 워커 ──(기다림)
//   화면 ──(postMessage {id, value})──────▶ 서비스 워커 ──▶ 워커에 응답
// time.sleep()도 같은 방법으로 CPU를 쓰지 않고 기다려요 (__py_sleep__).
// =====================================================================
const waiting = new Map();   // id → 응답 보내는 함수 (워커가 먼저 온 경우)
const answers = new Map();   // id → 값 (화면 답이 먼저 온 경우)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.type !== 'py-input' || typeof d.id !== 'string') return;
  const value = String(d.value ?? '');
  const send = waiting.get(d.id);
  if (send) { waiting.delete(d.id); send({ ok: true, value }); }
  else answers.set(d.id, value);
});

const json = (o) => new Response(JSON.stringify(o), {
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('/__py_input__')) {
    if (url.searchParams.has('ping')) { e.respondWith(json({ pong: true })); return; }
    const id = url.searchParams.get('id') || '';
    e.respondWith(new Promise((resolve) => {
      if (answers.has(id)) { const v = answers.get(id); answers.delete(id); resolve(json({ ok: true, value: v })); return; }
      // 너무 오래 붙잡지 않도록 50초마다 "다시 물어봐" 응답 → 워커가 다시 요청해요
      const timer = setTimeout(() => { waiting.delete(id); resolve(json({ retry: true })); }, 50000);
      waiting.set(id, (o) => { clearTimeout(timer); resolve(json(o)); });
    }));
    return;
  }

  if (url.pathname.endsWith('/__py_sleep__')) {
    const ms = Math.min(Math.max(Number(url.searchParams.get('ms')) || 0, 0), 30000);
    e.respondWith(new Promise((r) => setTimeout(() => r(json({ ok: true })), ms)));
  }
});
