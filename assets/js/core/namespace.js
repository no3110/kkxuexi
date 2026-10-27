/* 全局命名空间与通用工具（Lead 维护 · 冻结） */
(function (global) {
  'use strict';

  var LQ = global.LQ || {};
  global.LQ = LQ;
  LQ.version = '3.2.0';

  var ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  LQ.util = {
    escapeHtml: function (value) {
      if (value === null || value === undefined) return '';
      return String(value).replace(/[&<>"']/g, function (ch) { return ESCAPE_MAP[ch]; });
    },

    clamp: function (n, min, max) {
      n = Number(n);
      if (!isFinite(n)) return min;
      return n < min ? min : (n > max ? max : n);
    },

    formatNum: function (n, digits) {
      var d = digits === undefined ? 0 : Math.max(0, Math.min(8, digits));
      var x = Number(n);
      if (!isFinite(x)) return '—';
      var fixed = x.toFixed(d);
      var parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    },

    formatPrice: function (n) {
      var x = Number(n);
      if (!isFinite(x)) return '—';
      var abs = Math.abs(x);
      var digits = abs >= 1000 ? 1 : abs >= 100 ? 2 : abs >= 1 ? 3 : 4;
      return x.toFixed(digits).replace(/\.?0+$/, function (m) { return m === '.0000' || m === '.000' || m === '.00' || m === '.0' ? '' : m; });
    },

    debounce: function (fn, wait) {
      var timer = null;
      return function () {
        var ctx = this, args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { timer = null; fn.apply(ctx, args); }, Math.max(0, wait || 100));
      };
    },

    throttleRaf: function (fn) {
      var scheduled = false, lastArgs = null, self = null;
      return function () {
        lastArgs = arguments; self = this;
        if (scheduled) return;
        scheduled = true;
        var raf = global.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
        raf(function () { scheduled = false; fn.apply(self, lastArgs); });
      };
    },

    el: function (tag, className, text) {
      var node = document.createElement(tag || 'div');
      if (className) node.className = className;
      if (text !== undefined && text !== null) node.textContent = String(text);
      return node;
    },

    uid: function (prefix) {
      return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
