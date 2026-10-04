/* Calculation engine: safe recursive-descent parser (no eval). */
(function (g) {
  'use strict';
  var BAD = 'Invalid expression';
  var FN = {
    sin: function (x, d) { return Math.sin(d ? x * Math.PI / 180 : x); },
    cos: function (x, d) { return Math.cos(d ? x * Math.PI / 180 : x); },
    tan: function (x, d) {
      if (d && Math.abs(x % 180) === 90) throw new Error('Invalid input');
      return Math.tan(d ? x * Math.PI / 180 : x);
    },
    log: function (x) { if (x <= 0) throw new Error('Invalid input'); return Math.log10(x); },
    ln: function (x) { if (x <= 0) throw new Error('Invalid input'); return Math.log(x); }
  };

  function tokenize(s) {
    var t = [], i = 0, m, rest;
    while (i < s.length) {
      rest = s.slice(i);
      if (/^\s/.test(rest)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { t.push({ n: parseFloat(m[1]) }); i += m[1].length; continue; }
      if ((m = /^[a-z]+/i.exec(rest))) { t.push({ w: m[0] }); i += m[0].length; continue; }
      t.push({ o: rest[0] }); i++;
    }
    return t;
  }

  function evaluate(src, deg) {
    var open = (src.match(/\(/g) || []).length - (src.match(/\)/g) || []).length;
    var t = tokenize(src + ')'.repeat(Math.max(0, open))), p = 0;
    function is(c) { return t[p] && (t[p].o === c); }
    function bad() { return new Error(BAD); }
    function expr() {
      var v = term();
      for (;;) {
        if (is('+')) { p++; v += term(); }
        else if (is('−') || is('-')) { p++; v -= term(); }
        else return v;
      }
    }
    function term() {
      var v = unary(), d;
      for (;;) {
        if (is('×') || is('*')) { p++; v *= unary(); }
        else if (is('÷') || is('/')) {
          p++; d = unary();
          if (d === 0) throw new Error('Cannot divide by zero');
          v /= d;
        } else return v;
      }
    }
    function unary() {
      if (is('−') || is('-')) { p++; return -unary(); }
      if (is('+')) { p++; return unary(); }
      return power();
    }
    function power() { var b = post(); if (is('^')) { p++; return Math.pow(b, unary()); } return b; }
    function post() { var v = prim(); while (is('%')) { p++; v /= 100; } return v; }
    function group() { var v = expr(); if (!is(')')) throw bad(); p++; return v; }
    function prim() {
      var k = t[p++];
      if (!k) throw bad();
      if ('n' in k) return k.n;
      if (k.o === '(') return group();
      if (k.o === 'π') return Math.PI;
      if (k.o === '√') { var v = prim(); if (v < 0) throw new Error('Invalid input'); return Math.sqrt(v); }
      if (k.w === 'e') return Math.E;
      if (k.w && FN[k.w]) { if (!is('(')) throw bad(); p++; return FN[k.w](group(), deg); }
      throw bad();
    }
    var r = expr();
    if (p < t.length) throw bad();
    if (!isFinite(r)) throw new Error('Invalid input');
    return Math.abs(r) < 1e-12 ? 0 : r;
  }

  function format(n) {
    var a = Math.abs(n);
    if (a >= 1e15 || (a > 0 && a < 1e-9)) return n.toExponential(6).replace(/\.?0+e/, 'e');
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 10 }).format(+n.toPrecision(12));
  }
  function raw(n) { return (+n.toPrecision(12)).toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 20 }); }

  g.Calc = { evaluate: evaluate, format: format, raw: raw };
})(window);
