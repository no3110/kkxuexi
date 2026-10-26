/* 全站错误收集器（site-engineer 维护）
 * 目标：无头浏览器（chrome --dump-dom）与 QA 可以读取 window.__LQ_ERRORS__ 判定页面是否健康。
 * 必须在 app.js 之前加载，且 app.js 第一行也会做一次兜底初始化。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  if (!Array.isArray(global.__LQ_ERRORS__)) global.__LQ_ERRORS__ = [];
  var bucket = global.__LQ_ERRORS__;

  function stringify(value) {
    try {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (value && value.stack) return String(value.stack);
      if (value && value.message) return String(value.message);
      return String(value);
    } catch (err) {
      return '[无法读取错误信息]';
    }
  }

  function push(message) {
    var msg = stringify(message).slice(0, 2000);
    if (!msg) return msg;
    // 相同错误只记录一次，避免图表 resize 循环之类刷屏
    if (bucket.indexOf(msg) === -1) bucket.push(msg);
    while (bucket.length > 60) bucket.shift();
    return msg;
  }

  LQ.errors = {
    list: function () { return bucket.slice(); },
    push: push,
    clear: function () { bucket.length = 0; },
    count: function () { return bucket.length; }
  };

  function install() {
    if (global.__LQ_ERRORS_INSTALLED__) return;
    global.__LQ_ERRORS_INSTALLED__ = true;

    // 运行期 JS 异常 / 资源加载失败（capture 才能收到 script、link 的 error 事件）
    global.addEventListener('error', function (event) {
      try {
        if (event && event.message) {
          var where = event.filename ? ' @ ' + event.filename + (event.lineno ? ':' + event.lineno : '') : '';
          push('未捕获异常: ' + event.message + where);
          return;
        }
        var target = event && event.target;
        if (target && target !== global) {
          var src = target.src || target.href || target.currentSrc || '';
          if (src) push('资源加载失败: ' + src);
        }
      } catch (err) { /* 错误收集器自身绝不抛错 */ }
    }, true);

    // Promise 未处理拒绝
    global.addEventListener('unhandledrejection', function (event) {
      try {
        var reason = event && event.reason;
        push('未处理的 Promise 拒绝: ' + stringify(reason));
      } catch (err) { /* ignore */ }
    });
  }

  install();
  LQ.errors.installed = true;
})(typeof window !== 'undefined' ? window : globalThis);
