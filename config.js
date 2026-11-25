// =====================================================================
// 여기만 고치면 돼요. (퀴즈와 같은 Supabase 프로젝트라면 퀴즈 config.js 의 값을 그대로 써도 돼요)
//  url : Supabase Project URL        예) https://abcdefgh.supabase.co
//  key : Publishable key (sb_publishable_...) 또는 예전 anon 키 (eyJ...)
//        ⚠ secret / service_role 키는 절대 넣지 마세요.
//  둘 다 비어 있으면 '체험 모드'로 돌아가요 (이 브라우저에만 저장).
// =====================================================================
window.PYSHARE_CONFIG = {
  url: 'https://alzriwpscgffbobiefjf.supabase.co',
  key: 'sb_publishable_P6ZvISkSuRh45NTTyt4ZqA_bjNMxpfs',
  // 파이썬 실행기(Pyodide) 주소. 보통은 바꾸지 않아요.
  pyodide: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
};
