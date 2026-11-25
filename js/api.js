/* =====================================================================
   서버 부르기 (Supabase RPC)
   - 모든 읽기·쓰기는 supabase_codeshare.sql 의 cs_ 함수로만 해요 (표는 잠겨 있어요)
   - 모든 함수에 로그인 열쇠(p_code)를 같이 보내고, 서버가 누구인지 확인해요
   - config.js 가 비어 있으면 체험 모드(mock.js)로 돌아가요
   ===================================================================== */
'use strict';

const CFG = window.PYSHARE_CONFIG || {};
const DEMO = !CFG.url || !CFG.key || /여기에/.test(CFG.url + CFG.key);

class ApiError extends Error {
  constructor(msg, user) { super(msg); this.user = user; }
}

const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

async function rpc(fn, args = {}, tries = 3) {
  if (DEMO) {
    try { return await window.MockDB.call(fn, args); }
    catch (e) { throw new ApiError(e.message, true); }
  }
  const url = CFG.url.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn;
  const headers = { 'Content-Type': 'application/json', apikey: CFG.key };
  if (CFG.key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + CFG.key;   // 예전 anon 키
  for (let k = 1; ; k++) {
    let res;
    try { res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(args) }); }
    catch (e) {
      if (k < tries) { await sleepMs(600 * k); continue; }
      throw new ApiError('인터넷 연결을 확인하고 다시 해 주세요.', false);
    }
    const txt = await res.text();
    let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (res.ok) return data;
    if (data && data.code === 'P0001') throw new ApiError(data.message, true);   // 사람에게 보여 줄 안내
    if (res.status >= 500 && k < tries) { await sleepMs(700 * k); continue; }
    throw new ApiError(res.status === 404
      ? '서버 함수를 찾을 수 없어요. supabase_codeshare.sql 을 실행했는지 확인해 주세요.'
      : '서버와 연결이 잠깐 끊겼어요. 다시 해 주세요.', false);
  }
}
