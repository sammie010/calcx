/* UI controller: state, input rules, rendering, keyboard, history, theme. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var exprEl = $('expr'), resEl = $('result'), msgEl = $('msg'), sci = $('sci');
  var state = { expr: '', done: false, last: '', deg: true, err: '' };
  var OPS = '+−×÷^', FNRE = /(sin|cos|tan|log|ln|√)\($/;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function lastCh() { return state.expr.slice(-1); }
  function needsMul() { return /[0-9.)πe%]$/.test(state.expr); }
  function segment() { return (/[0-9.]*$/.exec(state.expr) || [''])[0]; }
  function tryEval() { try { return Calc.evaluate(state.expr, state.deg); } catch (e) { return null; } }

  function press(k) {
    var ch = lastCh(), seg, open;
    if (state.err) { state.expr = ''; state.err = ''; state.done = false; }
    if (k === 'AC') { state.expr = ''; state.done = false; return render(); }
    if (k === 'DEL') {
      if (state.done) { state.done = false; }
      state.expr = FNRE.test(state.expr) ? state.expr.replace(FNRE, '') : state.expr.slice(0, -1);
      return render();
    }
    if (k === '=') return equals();
    if (state.done) {
      var isOp = OPS.indexOf(k) > -1 || k === '%' || k === '^2';
      state.expr = isOp ? state.last : '';
      state.done = false; ch = lastCh();
    }
    if (/^[0-9]$|^00$/.test(k)) {
      seg = segment();
      if (needsMul() && !seg) state.expr += '×';
      if (seg === '0' && k !== '00') state.expr = state.expr.slice(0, -1);
      if (k === '00' && (seg === '' || seg === '0')) k = seg === '0' ? '' : '0';
      if (seg.replace('.', '').length >= 15) return;
      state.expr += k;
    } else if (k === '.') {
      seg = segment();
      if (seg.indexOf('.') > -1) return;
      state.expr += seg ? '.' : (needsMul() ? '×0.' : '0.');
    } else if (OPS.indexOf(k) > -1 || k === '^2') {
      if (k === '^2') { if (/[0-9.)πe]$/.test(state.expr)) state.expr += '^2'; return render(); }
      if (!state.expr || ch === '(' || FNRE.test(state.expr)) { if (k === '−') state.expr += k; }
      else if (OPS.indexOf(ch) > -1) state.expr = state.expr.slice(0, -1) + k;
      else state.expr += k;
    } else if (k === '%') {
      if (/[0-9.)]$/.test(state.expr)) state.expr += '%';
    } else if (k === '±') {
      var s2 = state.expr.replace(/(^|[(×÷^])−(\d*\.?\d*)$/, '$1$2');
      state.expr = s2 !== state.expr ? s2 : state.expr.replace(/(\d*\.?\d+)$/, '−$1');
    } else if (k === ')') {
      open = (state.expr.match(/\(/g) || []).length - (state.expr.match(/\)/g) || []).length;
      if (open > 0 && /[0-9.)πe%]$/.test(state.expr)) state.expr += ')';
    } else {
      if (needsMul()) state.expr += '×';
      state.expr += k;
    }
    render();
  }

  function equals() {
    if (!state.expr || state.done) return;
    var shown = state.expr;
    try {
      var v = Calc.evaluate(state.expr, state.deg), r = Calc.format(v);
      state.last = Calc.raw(v); state.done = true;
      state.expr = shown; state.result = r;
      CalcXHistory.add(shown, r); renderHistory();
    } catch (e) { state.err = e.message; }
    render();
  }

  function fit() {
    resEl.style.fontSize = '';
    var size = parseFloat(getComputedStyle(resEl).fontSize);
    while (resEl.scrollWidth > resEl.clientWidth && size > 20) { size -= 2; resEl.style.fontSize = size + 'px'; }
  }

  function render() {
    exprEl.textContent = state.expr;
    exprEl.scrollLeft = exprEl.scrollWidth;
    var out = '0';
    if (state.err) out = 'Error';
    else if (state.done) out = state.result;
    else if (state.expr) {
      var v = /[+−×÷^%]|\(|√/.test(state.expr) ? tryEval() : null;
      out = v !== null ? Calc.format(v) : (segment() || '0');
    }
    resEl.textContent = out;
    resEl.classList.toggle('is-error', !!state.err);
    resEl.classList.toggle('is-final', state.done);
    msgEl.textContent = state.err;
    fit();
  }

  /* History UI */
  function renderHistory() {
    var list = $('histList'), items = CalcXHistory.all();
    list.textContent = '';
    $('histEmpty').hidden = items.length > 0;
    $('clearHist').disabled = !items.length;
    items.forEach(function (it) {
      var li = document.createElement('li'), use = document.createElement('button'), del = document.createElement('button');
      use.className = 'h-use'; use.setAttribute('aria-label', 'Reuse ' + it.expr + ' equals ' + it.result);
      var a = document.createElement('span'), b = document.createElement('strong'), c = document.createElement('time');
      a.textContent = it.expr; b.textContent = '= ' + it.result;
      c.textContent = new Date(it.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      use.append(a, b, c);
      use.onclick = function () { state.expr = it.expr; state.done = false; state.err = ''; render(); setHistory(false); };
      del.className = 'h-del'; del.textContent = '✕'; del.setAttribute('aria-label', 'Delete this entry');
      del.onclick = function () { CalcXHistory.remove(it.id); renderHistory(); };
      li.append(use, del); list.append(li);
    });
  }
  function setHistory(on) {
    document.body.classList.toggle('hist-open', on);
    $('histToggle').setAttribute('aria-expanded', String(on));
  }

  /* Mode / angle / theme */
  function setMode(m) {
    var isSci = m === 'scientific';
    sci.hidden = !isSci; $('angle').hidden = !isSci;
    $('tab-basic').setAttribute('aria-selected', String(!isSci));
    $('tab-sci').setAttribute('aria-selected', String(isSci));
    document.body.classList.toggle('is-sci', isSci);
    store.set('calcx.mode', m); fit();
  }
  function syncTheme() {
    var d = CalcXTheme.current() === 'dark';
    $('themeToggle').textContent = d ? '☀' : '☾';
    $('themeToggle').setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k);
    var m = e.target.closest('[data-mode]'); if (m) setMode(m.dataset.mode);
  });
  $('themeToggle').onclick = function () { CalcXTheme.toggle(); syncTheme(); };
  $('angle').onclick = function () {
    state.deg = !state.deg; this.textContent = state.deg ? 'DEG' : 'RAD';
    this.setAttribute('aria-label', 'Angle unit: ' + (state.deg ? 'degrees' : 'radians')); render();
  };
  $('histToggle').onclick = function () { setHistory(!document.body.classList.contains('hist-open')); };
  $('closeHist').onclick = $('scrim').onclick = function () { setHistory(false); };
  $('clearHist').onclick = function () { CalcXHistory.clear(); renderHistory(); };

  var KEYMAP = { '*': '×', '/': '÷', '-': '−', 'Enter': '=', '=': '=', 'Escape': 'AC', 'Backspace': 'DEL', ',': '.', 'x': '×', 'X': '×' };
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && document.body.classList.contains('hist-open')) return setHistory(false);
    if (e.target.closest && e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
    var k = KEYMAP[e.key] || e.key;
    if (/^[0-9.+%^()]$/.test(k) || '−×÷=AC DEL'.split(' ').concat(['=']).indexOf(k) > -1 || k === 'AC' || k === 'DEL') {
      e.preventDefault(); press(k);
      var el = document.querySelector('[data-k="' + k + '"]');
      if (el) { el.classList.add('pressed'); setTimeout(function () { el.classList.remove('pressed'); }, 120); }
    }
  });

  window.addEventListener('resize', fit);
  syncTheme(); renderHistory(); setMode(store.get('calcx.mode') === 'scientific' ? 'scientific' : 'basic'); render();
})();
