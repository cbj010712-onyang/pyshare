/* =====================================================================
   파이썬 실행기 (화면 쪽)
   - py-worker.js 를 만들고, 코드를 보내고, 출력을 받아서 콘솔에 그려요
   - input() 요청이 오면 입력칸을 띄우고, 답을 워커로 바로 보내요 (실시간 입력)
     (input()을 실시간으로 못 바꾸는 드문 코드는 서비스 워커(sw.js)로 보내요)
   - [멈춤]은 워커를 통째로 끝내고 새로 만들어요
   ===================================================================== */
'use strict';

const PyRunner = (() => {
  const MAX_OUT = 200000;            // 콘솔에 쌓이는 글자 수 한도 (무한 출력 막기)
  let swReg = null;
  let swTried = null;

  // 서비스 워커는 처음 한 번만 등록해요. (artifact 미리보기·file:// 에서는 없어요)
  function ensureSW() {
    if (swTried) return swTried;
    swTried = (async () => {
      if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
      try {
        await navigator.serviceWorker.register('sw.js');
        const ready = navigator.serviceWorker.ready;
        swReg = await Promise.race([ready, new Promise((r) => setTimeout(() => r(null), 4000))]);
        return swReg;
      } catch (e) { return null; }
    })();
    return swTried;
  }

  class Runner {
    /**
     * ui = { out(kind, text), image(src), askInput(prompt) , status(text), done(info), ready(info) }
     */
    constructor(ui) {
      this.ui = ui;
      this.worker = null;
      this.ready = null;
      this.running = false;
      this.interactive = false;
      this.inputId = null;
      this.inputVia = '';
      this.outCount = 0;
    }

    start() {
      if (this.ready) return this.ready;
      const cfg = window.PYSHARE_CONFIG || {};
      const indexURL = new URL(cfg.pyodide || 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/', location.href).href;
      this.ready = (async () => {
        await ensureSW();
        const w = new Worker('js/py-worker.js?v=20261126c');
        this.worker = w;
        const base = new URL('.', location.href).href;
        await new Promise((resolve, reject) => {
          w.onmessage = (e) => {
            const d = e.data || {};
            if (d.t === 'ready') { this.interactive = !!d.interactive; this.ui.ready?.(d); resolve(); }
            else if (d.t === 'status') this.ui.status?.(d.s);
            else if (d.t === 'fatal') reject(new Error(d.s));
          };
          w.onerror = (e) => reject(new Error(e.message || '파이썬을 불러오지 못했어요.'));
          setTimeout(() => reject(new Error('TIMEOUT')), 90000);   // 90초 안에 준비가 안 되면 포기
          w.postMessage({ t: 'init', indexURL, stdlibJs: cfg.pyodideStdlibJs || '', inputURL: base + '__py_input__', sleepURL: base + '__py_sleep__' });
        });
        w.onmessage = (e) => this._msg(e.data || {});
        w.onerror = (e) => { this._finish({ ok: false, fatal: true, name: 'Error', hint: '' }); this.ui.out('err', '\n' + (e.message || '실행기 오류') + '\n'); };
      })();
      this.ready.catch(() => { this.ready = null; this.worker?.terminate(); this.worker = null; });
      return this.ready;
    }

    // files: [{ name: 'study_survey.csv', text: '...' }] → 실행 폴더에 넣어 줘요
    async run(code, preset, files) {
      if (this.running) return;
      await this.start();
      this.running = true;
      this.outCount = 0;
      this.worker.postMessage({ t: 'run', code, preset: preset || [], files: files || [] });
    }

    // 무한 반복·입력 기다리는 중에도 바로 멈춰요. 워커를 새로 만들어야 해서 다음 실행은 1~2초 걸려요.
    stop(reason) {
      if (!this.worker) return;
      this.worker.terminate();
      this.worker = null; this.ready = null;
      const was = this.running;
      this.running = false; this.inputId = null;
      if (was) this.ui.done?.({ ok: false, stopped: true, reason });
      this.start().catch(() => {});
    }

    dispose() { this.worker?.terminate(); this.worker = null; this.ready = null; this.running = false; }

    // 입력칸에서 엔터를 누르면
    sendInput(value) {
      if (!this.inputId) return false;
      const id = this.inputId; this.inputId = null;
      if (this.inputVia === 'msg') {
        if (!this.worker) return false;
        this.worker.postMessage({ t: 'input', id, value: String(value) });
        return true;
      }
      const target = swReg && swReg.active;
      if (!target) return false;
      target.postMessage({ type: 'py-input', id, value: String(value) });
      return true;
    }

    _finish(info) {
      this.running = false; this.inputId = null;
      this.ui.done?.(info);
    }

    _msg(d) {
      switch (d.t) {
        case 'out': case 'err': case 'echo': {
          const s = String(d.s || '');
          this.outCount += s.length;
          if (this.outCount > MAX_OUT) {
            this.ui.out(d.t, s.slice(0, Math.max(0, MAX_OUT - (this.outCount - s.length))));
            this.stop('출력이 너무 많아서 멈췄어요. 끝나지 않는 반복(while True 등)이 있는지 확인해 보세요.');
            return;
          }
          this.ui.out(d.t, d.t === 'echo' ? s + '\n' : s);
          break;
        }
        case 'input': this.inputId = String(d.id); this.inputVia = d.via === 'msg' ? 'msg' : 'sw'; this.ui.askInput?.(String(d.prompt || '')); break;
        case 'img': if (/^[A-Za-z0-9+/=]+$/.test(d.b64 || '')) this.ui.image?.('data:image/png;base64,' + d.b64); break;
        case 'status': this.ui.status?.(String(d.s || '')); break;
        case 'done': this._finish({ ok: !!d.ok, line: Number(d.line) || null, name: String(d.name || ''), hint: String(d.hint || '') }); break;
        case 'fatal': this.ui.out('err', String(d.s) + '\n'); this._finish({ ok: false, fatal: true }); break;
      }
    }
  }

  return { Runner, ensureSW };
})();
