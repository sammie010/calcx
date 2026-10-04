/* Applies saved/system theme before first paint. */
(function (g) {
  var KEY = 'calcx.theme', root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) { root.setAttribute('data-theme', t); }
  var initial = get() || (g.matchMedia && g.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  apply(initial);
  g.CalcXTheme = {
    current: function () { return root.getAttribute('data-theme'); },
    toggle: function () {
      var t = this.current() === 'dark' ? 'light' : 'dark';
      apply(t);
      try { localStorage.setItem(KEY, t); } catch (e) {}
      return t;
    }
  };
})(window);
