// =====================================================================
// 파이썬 실행 워커 (Pyodide)
// 화면과 따로 도는 공간이라, 무한 반복이 생겨도 화면은 멈추지 않고
// [멈춤]을 누르면 화면이 이 워커를 통째로 끝내요.
// 워커는 로그인 정보(localStorage)에 접근할 수 없어서 친구 코드를 실행해도 안전해요.
// =====================================================================
// 보안 설정(CSP)이 WebAssembly를 막으면 Pyodide가 대답 없이 멈춰요. 그때 화면에 바로 알려요.
self.addEventListener('securitypolicyviolation', (e) => {
  postMessage({ t: 'fatal', s: 'BLOCKED ' + (e.effectiveDirective || e.violatedDirective || '') });
});

let py = null;
let INPUT_URL = '', SLEEP_URL = '';
let interactive = false;      // 서비스 워커가 있으면 input()을 그때그때 받아요
let presetInput = [];         // 없으면 미리 적어 둔 입력값을 한 줄씩 써요

// ---- 출력 모아서 보내기 (너무 자주 보내면 화면이 느려져요) ----
let buf = '', bufKind = 'out', last = 0;
function flush() {
  if (buf) { postMessage({ t: bufKind, s: buf }); buf = ''; }
  last = Date.now();
}
function write(kind, s) {
  if (kind !== bufKind) { flush(); bufKind = kind; }
  buf += s;
  if (buf.length > 4096 || Date.now() - last > 40) flush();
}

// ---- 동기 요청 (워커 안에서만 허용돼요) ----
function syncGet(url) {
  const x = new XMLHttpRequest();
  x.open('GET', url, false);
  x.send();
  return x;
}
function detectInteractive() {
  try {
    const x = syncGet(INPUT_URL + '?ping=1&_=' + Date.now());
    return x.status === 200 && JSON.parse(x.responseText).pong === true;
  } catch (e) { return false; }
}

function readInput(prompt) {
  flush();
  if (!interactive) {
    if (presetInput.length) {
      const v = presetInput.shift();
      postMessage({ t: 'echo', s: v });
      return v;
    }
    throw new Error('NO_PRESET_INPUT');
  }
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  postMessage({ t: 'input', id, prompt: String(prompt || '') });
  for (;;) {
    const x = syncGet(INPUT_URL + '?id=' + id + '&_=' + Date.now());
    if (x.status !== 200) throw new Error('INPUT_BRIDGE_FAILED');
    const r = JSON.parse(x.responseText);
    if (r.ok) return r.value;
    // r.retry: 서비스 워커가 50초마다 연결을 새로 해요. 계속 기다려요.
  }
}

// 실시간 입력: 파이썬이 이 약속(Promise)을 기다리는 동안 워커는 자유로워서 화면의 답을 받을 수 있어요
let pendingInput = null;
function askInput(prompt) {
  flush();
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return new Promise((resolve) => {
    pendingInput = { id, resolve };
    postMessage({ t: 'input', id, prompt: String(prompt || ''), via: 'msg' });
  });
}

function sleep(sec) {
  flush();
  const ms = Math.max(0, Number(sec) * 1000 || 0);
  if (interactive) {
    let left = ms;
    while (left > 0) { const step = Math.min(left, 30000); syncGet(SLEEP_URL + '?ms=' + step + '&_=' + Math.random()); left -= step; }
  } else {
    const end = Date.now() + ms;
    while (Date.now() < end) { /* 기다리기 */ }
  }
}

// ---- 파이썬 쪽 준비 코드 ----
const SETUP = String.raw`
import sys, builtins, traceback, linecache, time
import _bridge

class _Out:
    def __init__(self, kind): self.kind = kind
    def write(self, s):
        s = str(s)
        if s: _bridge.write(self.kind, s)
        return len(s)
    def flush(self): _bridge.flush()
    def isatty(self): return False
    @property
    def encoding(self): return 'utf-8'

sys.stdout = _Out('out')
sys.stderr = _Out('err')

def _input(prompt=''):
    prompt = '' if prompt is None else str(prompt)
    if prompt: sys.stdout.write(prompt)
    try:
        return _bridge.read_input(prompt)
    except Exception as e:
        if 'NO_PRESET_INPUT' in str(e):
            raise EOFError('이 코드는 input()이 lambda·클래스 본문·__init__ 같은 곳에 있어서 입력을 받을 수 없어요. input()을 보통 함수(def) 안이나 함수 밖으로 옮겨 보세요.') from None
        raise
builtins.input = _input

def _sleep(sec):
    _bridge.sleep(float(sec))
time.sleep = _sleep

HINTS = {
    'NameError': '이름을 찾지 못했어요. 변수·함수 이름의 철자, 대소문자, 따옴표를 빠뜨리지 않았는지 확인해 보세요.',
    'SyntaxError': '파이썬 문법에 맞지 않는 곳이 있어요. 괄호·따옴표 짝, if/for/def 줄 끝의 콜론(:)을 확인해 보세요.',
    'IndentationError': '들여쓰기가 맞지 않아요. 같은 블록은 같은 칸(보통 스페이스 4칸)만큼 들여써야 해요.',
    'TabError': '탭과 스페이스가 섞였어요. 들여쓰기를 스페이스로 통일해 보세요.',
    'TypeError': '자료형이 맞지 않아요. 예: 글자 + 숫자는 안 돼요. int()나 str()로 바꿔 보세요.',
    'ValueError': '값이 알맞지 않아요. 예: int("abc")처럼 숫자가 아닌 글자를 숫자로 바꾸려 했는지 확인해 보세요.',
    'ZeroDivisionError': '0으로 나눌 수 없어요. 나누는 수가 0이 되는 경우를 if로 먼저 막아 보세요.',
    'IndexError': '리스트 범위를 벗어났어요. 번호는 0부터 시작하고, 마지막 번호는 len() - 1이에요.',
    'KeyError': '딕셔너리에 없는 키를 찾았어요. 키 이름의 철자나 in 으로 먼저 확인해 보세요.',
    'AttributeError': '그 자료에는 그런 기능(메서드)이 없어요. 철자나 자료형을 확인해 보세요.',
    'RecursionError': '함수가 자기 자신을 너무 많이 불렀어요. 멈추는 조건이 있는지 확인해 보세요.',
    'EOFError': '',
}
NO_MODULE = {'turtle': 'turtle은 웹 브라우저에서는 쓸 수 없어요.', 'pygame': 'pygame은 웹 브라우저에서는 쓸 수 없어요.',
             'tkinter': 'tkinter(창 만들기)는 웹 브라우저에서는 쓸 수 없어요.'}

# ---- 실시간 입력: input()을 "기다릴 수 있는" 호출로 바꿔서 실행해요 ----
# 브라우저 워커는 멈춰 서서 기다릴 수 없어서, 코드의 input()을 await input() 으로 바꾸고
# input()을 부르는 함수는 async def 로, 그 함수를 부르는 곳에는 await 를 붙여요. (줄 번호는 그대로)
import ast, asyncio, inspect

class _NoAsync(Exception): pass

async def _ps_input(prompt=''):
    prompt = '' if prompt is None else str(prompt)
    if prompt: sys.stdout.write(prompt)
    sys.stdout.flush()
    v = await _bridge.ask_input(prompt)
    return str(v)

async def _ps_maybe(v):
    if inspect.isawaitable(v):
        return await v
    return v

# __init__ 안에서 input()을 쓰는 클래스: 객체를 만든 뒤 기다릴 수 있는 _ps_ainit 를 불러요
async def _ps_new(cls, *a, **k):
    obj = cls.__new__(cls)
    init = getattr(obj, '_ps_ainit', None)
    if init is not None:
        await init(*a, **k)
    else:
        obj.__init__(*a, **k)
    return obj

async def _ps_init_of(sup, *a, **k):
    init = getattr(sup, '_ps_ainit', None)
    if init is not None:
        return await init(*a, **k)
    return sup.__init__(*a, **k)

async def _ps_sleep(sec):
    sys.stdout.flush()
    await asyncio.sleep(max(0.0, float(sec)))

_SCOPES = (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef, ast.Module)

def _asyncify(tree):
    parent = {}
    for p in ast.walk(tree):
        for c in ast.iter_child_nodes(p):
            parent[c] = p
    def scope(n):
        p = parent.get(n)
        while p is not None and not isinstance(p, _SCOPES):
            p = parent.get(p)
        return p
    sleep_names = {'sleep'} if any(isinstance(n, ast.ImportFrom) and n.module == 'time' and any(a.name == 'sleep' and not a.asname for a in n.names) for n in ast.walk(tree)) else set()
    def is_input(c): return isinstance(c.func, ast.Name) and c.func.id == 'input'
    def is_sleep(c):
        f = c.func
        return (isinstance(f, ast.Attribute) and f.attr == 'sleep' and isinstance(f.value, ast.Name) and f.value.id == 'time') or \
               (isinstance(f, ast.Name) and f.id in sleep_names)
    def callee(c):
        f = c.func
        return f.id if isinstance(f, ast.Name) else f.attr if isinstance(f, ast.Attribute) else None
    def own_yield(fn):
        for n in ast.walk(fn):
            if isinstance(n, (ast.Yield, ast.YieldFrom)) and scope(n) is fn: return True
        return False
    calls = [n for n in ast.walk(tree) if isinstance(n, ast.Call)]
    called = {id(c.func) for c in calls}
    # ask = input 처럼 input 을 값으로 넘기는 경우
    input_vals = {n for n in ast.walk(tree) if isinstance(n, ast.Name) and n.id == 'input' and isinstance(n.ctx, ast.Load) and id(n) not in called}
    if not any(is_input(c) for c in calls) and not any(is_sleep(c) for c in calls) and not input_vals:
        return tree, False
    adefs, names, init_classes = set(), set(), set()
    classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
    changed = True
    while changed:
        changed = False
        for c in calls:
            if not (is_input(c) or callee(c) in names): continue
            sc = scope(c)
            if isinstance(sc, ast.Module) or sc in adefs or isinstance(sc, ast.AsyncFunctionDef): continue
            if isinstance(sc, (ast.Lambda, ast.ClassDef)) or own_yield(sc): raise _NoAsync()
            if sc.name.startswith('__') and sc.name.endswith('__'):
                if sc.name != '__init__' or not isinstance(scope(sc), ast.ClassDef): raise _NoAsync()
                cls = scope(sc)
                init_classes.add(cls.name); names.update((cls.name, '__init__'))
            adefs.add(sc); names.add(sc.name); changed = True
        # __init__ 을 물려받는 자식 클래스도 같은 방식으로 만들어요
        for cd in classes:
            if cd.name in init_classes: continue
            own_init = any(isinstance(b, (ast.FunctionDef, ast.AsyncFunctionDef)) and b.name == '__init__' for b in cd.body)
            if not own_init and any(isinstance(bs, ast.Name) and bs.id in init_classes for bs in cd.bases):
                init_classes.add(cd.name); names.add(cd.name); changed = True
    # 변수에 담긴 함수(menu['1'](), f = ask; f())도 기다릴 수 있게: 이름을 모르는 호출만 감싸요
    known = set(dir(builtins))
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)) and n not in adefs: known.add(n.name)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            for a in n.names: known.add((a.asname or a.name).split('.')[0])
    known -= names
    def maybe_async(c):
        if not names and not input_vals: return False
        f = c.func
        if isinstance(f, ast.Name): return f.id not in known
        return isinstance(f, (ast.Subscript, ast.Call))
    def is_async_ctx(n):
        sc = scope(n)
        return isinstance(sc, (ast.Module, ast.AsyncFunctionDef)) or sc in adefs
    def wrap(c, fn, args, kws):
        call = ast.Call(func=ast.Name(id=fn, ctx=ast.Load()), args=args, keywords=kws)
        return ast.copy_location(ast.Await(value=ast.copy_location(call, c)), c)
    class T(ast.NodeTransformer):
        def visit_FunctionDef(self, node):
            self.generic_visit(node)
            if node in adefs:
                fields = {f: getattr(node, f) for f in node._fields}
                if node.name == '__init__': fields['name'] = '_ps_ainit'
                return ast.copy_location(ast.AsyncFunctionDef(**fields), node)
            return node
        def visit_Call(self, node):
            orig = node
            self.generic_visit(node)
            if not is_async_ctx(orig): return node
            if is_input(orig): return wrap(orig, '_ps_input', node.args, node.keywords)
            if is_sleep(orig): return wrap(orig, '_ps_sleep', node.args, node.keywords)
            f = node.func
            if isinstance(f, ast.Name) and f.id in init_classes:
                return wrap(orig, '_ps_new', [ast.Name(id=f.id, ctx=ast.Load())] + node.args, node.keywords)
            if init_classes and isinstance(f, ast.Attribute) and f.attr == '__init__':
                return wrap(orig, '_ps_init_of', [f.value] + node.args, node.keywords)
            if callee(orig) in names or maybe_async(orig): return wrap(orig, '_ps_maybe', [node], [])
            return node
        def visit_Name(self, node):
            if node in input_vals: return ast.copy_location(ast.Name(id='_ps_input', ctx=ast.Load()), node)
            return node
        def visit_GeneratorExp(self, node):
            # sum(x for x in ...) 안에서 기다려야 하면 리스트로 바꿔요 (async 제너레이터는 sum이 못 읽어요)
            self.generic_visit(node)
            if any(isinstance(n, ast.Await) for n in ast.walk(node)):
                return ast.copy_location(ast.ListComp(elt=node.elt, generators=node.generators), node)
            return node
    tree = T().visit(tree)
    ast.fix_missing_locations(tree)
    return tree, True

def _report(e):
    te = traceback.TracebackException.from_exception(e)
    te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename == 'main.py'])
    sys.stdout.flush()
    sys.stderr.write(''.join(te.format()))
    line = None
    if isinstance(e, SyntaxError) and e.filename == 'main.py':
        line = e.lineno
    elif te.stack:
        line = te.stack[-1].lineno
    name = type(e).__name__
    hint = HINTS.get(name, '')
    if name == 'ModuleNotFoundError':
        mod = (getattr(e, 'name', '') or '').split('.')[0]
        hint = NO_MODULE.get(mod, '이 사이트에서는 파이썬 기본 모듈(random, math, time 등)과 numpy·matplotlib 정도만 쓸 수 있어요.')
    if isinstance(e, KeyboardInterrupt): hint = ''
    return [line, name, hint]

# 반환: 'sync' 이면 예전 방식(_run)으로 다시 실행, None 이면 성공, 리스트면 오류 정보
async def _run_async(src):
    linecache.cache['main.py'] = (len(src), None, src.splitlines(True), 'main.py')
    try:
        tree = ast.parse(src, 'main.py')
    except SyntaxError as e:
        return _report(e)
    try:
        tree, changed = _asyncify(tree)
    except _NoAsync:
        return 'sync'
    g = {'__name__': '__main__', '__builtins__': builtins,
         '_ps_input': _ps_input, '_ps_maybe': _ps_maybe, '_ps_sleep': _ps_sleep,
         '_ps_new': _ps_new, '_ps_init_of': _ps_init_of}
    try:
        code = compile(tree, 'main.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        r = eval(code, g)
        if inspect.iscoroutine(r):
            await r
    except SystemExit:
        pass
    except BaseException as e:
        return _report(e)
    finally:
        sys.stdout.flush()
    return None

def _run(src):
    linecache.cache['main.py'] = (len(src), None, src.splitlines(True), 'main.py')
    g = {'__name__': '__main__', '__builtins__': builtins}
    try:
        exec(compile(src, 'main.py', 'exec'), g)
    except SystemExit:
        pass
    except BaseException as e:
        te = traceback.TracebackException.from_exception(e)
        te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename == 'main.py'])
        sys.stdout.flush()
        sys.stderr.write(''.join(te.format()))
        line = None
        if isinstance(e, SyntaxError) and e.filename == 'main.py':
            line = e.lineno
        elif te.stack:
            line = te.stack[-1].lineno
        name = type(e).__name__
        hint = HINTS.get(name, '')
        if name == 'ModuleNotFoundError':
            mod = (getattr(e, 'name', '') or '').split('.')[0]
            hint = NO_MODULE.get(mod, '이 사이트에서는 파이썬 기본 모듈(random, math, time 등)과 numpy·matplotlib 정도만 쓸 수 있어요.')
        if isinstance(e, KeyboardInterrupt): hint = ''
        return [line, name, hint]
    finally:
        sys.stdout.flush()
    return None
`;

const SHOW_PLOTS = String.raw`
def _show_plots():
    import sys
    if 'matplotlib.pyplot' not in sys.modules: return
    import io, base64
    plt = sys.modules['matplotlib.pyplot']
    for n in plt.get_fignums():
        fig = plt.figure(n)
        b = io.BytesIO()
        fig.savefig(b, format='png', dpi=100, bbox_inches='tight')
        _bridge.image(base64.b64encode(b.getvalue()).decode())
    plt.close('all')
`;

// python_stdlib.zip 을 올릴 수 없는 곳(예: 미리보기)에서는 같은 내용을 스크립트(base64)로 받아서
// Pyodide가 zip을 가지러 갈 때 메모리에서 바로 건네줘요.
function useInlineStdlib(indexURL, file) {
  importScripts(indexURL + file);
  const bin = atob(self.__PYODIDE_STDLIB_B64 || '');
  self.__PYODIDE_STDLIB_B64 = null;
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const realFetch = self.fetch.bind(self);
  self.fetch = (u, o) => String((u && u.url) || u).endsWith('python_stdlib.zip')
    ? Promise.resolve(new Response(bytes.slice(), { status: 200, headers: { 'Content-Type': 'application/zip' } }))
    : realFetch(u, o);
}

async function init(indexURL, stdlibJs) {
  postMessage({ t: 'status', s: '파이썬 준비 중…' });
  importScripts(indexURL + 'pyodide.js');
  if (stdlibJs) useInlineStdlib(indexURL, stdlibJs);
  py = await loadPyodide({ indexURL });
  py.registerJsModule('_bridge', {
    write, flush,
    read_input: readInput,
    ask_input: askInput,
    sleep,
    image: (b64) => { flush(); postMessage({ t: 'img', b64: String(b64) }); },
  });
  py.runPython(SETUP);
  py.runPython(SHOW_PLOTS);
  interactive = detectInteractive();
  postMessage({ t: 'ready', interactive, version: py.version });
}

async function run(code, preset) {
  presetInput = Array.isArray(preset) ? preset.slice() : [];
  buf = ''; last = Date.now();
  try {
    // import numpy / matplotlib 이 있으면 먼저 불러와요 (처음 한 번은 오래 걸려요)
    const imports = py.pyodide_py.code.find_imports(code).toJs();
    const want = imports.filter((m) => ['numpy', 'matplotlib', 'pandas'].includes(m));
    if (want.length) {
      postMessage({ t: 'status', s: want.join(', ') + ' 불러오는 중… (처음엔 조금 걸려요)' });
      await py.loadPackage(want.includes('matplotlib') ? [...want, 'matplotlib'] : want);
      if (want.includes('matplotlib')) {
        py.runPython("import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as _plt\n_plt.show = lambda *a, **k: _show_plots()");
      }
      postMessage({ t: 'status', s: '' });
    }
  } catch (e) {
    // 문법 오류면 find_imports가 실패해요. 그대로 실행해서 오류 안내를 보여 줘요.
  }
  const asyncFn = py.globals.get('_run_async');
  let res = null;
  try {
    res = await asyncFn(code);
    if (res === 'sync') {   // 실시간 입력으로 못 바꾸는 코드: 예전 방식
      const runFn = py.globals.get('_run');
      try { res = runFn(code); } finally { runFn.destroy(); }
    }
    py.runPython('_show_plots()');
  } catch (e) {
    flush();
    postMessage({ t: 'err', s: String(e && e.message || e) + '\n' });
  } finally {
    asyncFn.destroy();
    pendingInput = null;
  }
  flush();
  let info = null;
  if (res && typeof res !== 'string') { info = res.toJs(); res.destroy?.(); }
  postMessage({ t: 'done', ok: !info, line: info ? info[0] : null, name: info ? info[1] : '', hint: info ? info[2] : '' });
}

self.onmessage = async (e) => {
  const d = e.data || {};
  try {
    if (d.t === 'init') {
      INPUT_URL = d.inputURL; SLEEP_URL = d.sleepURL;
      await init(d.indexURL, d.stdlibJs);
    } else if (d.t === 'input') {
      const p = pendingInput;
      if (p && p.id === d.id) { pendingInput = null; p.resolve(String(d.value ?? '')); }
    } else if (d.t === 'run') {
      await run(String(d.code || ''), d.preset);
    }
  } catch (err) {
    postMessage({ t: 'fatal', s: String(err && err.message || err) });
  }
};
