/* History store backed by localStorage (fails safely if unavailable). */
(function (g) {
  'use strict';
  var KEY = 'calcx.history', MAX = 50, items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; if (!Array.isArray(items)) items = []; } catch (e) { items = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  g.CalcXHistory = {
    all: function () { return items.slice(); },
    add: function (expr, result) {
      if (items[0] && items[0].expr === expr && items[0].result === result) return;
      items.unshift({ id: Date.now() + Math.random().toString(36).slice(2, 6), expr: expr, result: result, ts: Date.now() });
      items = items.slice(0, MAX); save();
    },
    remove: function (id) { items = items.filter(function (i) { return i.id !== id; }); save(); },
    clear: function () { items = []; save(); }
  };
})(window);
