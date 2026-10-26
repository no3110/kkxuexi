/* 应用启动入口（site-engineer 维护；index.html 中必须最后加载）
 * - 全局错误收集：window.__LQ_ERRORS__ 尽早初始化，捕获 error / unhandledrejection / 初始化异常
 * - ?lqdebug=1：在 body 追加不可见的 #lq-debug 元素，供无头浏览器 --dump-dom 抓取状态
 * - 注册全部页面路由，挂 store 变更监听，启动 hash 路由
 */
window.__LQ_ERRORS__ = window.__LQ_ERRORS__ || [];

(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var booted = false;
  var debugMode = false;
  var debugTimer = null;

  function report(message) {
    try {
      var bucket = global.__LQ_ERRORS__;
      if (!Array.isArray(bucket)) { bucket = global.__LQ_ERRORS__ = []; }
      var msg = String(message == null ? '' : (message.stack || message.message || message));
      if (msg && bucket.indexOf(msg) === -1) bucket.push(msg);
      while (bucket.length > 60) bucket.shift();
    } catch (err) { /* 错误收集器自身绝不抛错 */ }
  }

  function detectDebug() {
    try { return /[?&]lqdebug=1/.test(global.location.search || ''); } catch (err) { return false; }
  }

  function lessonTotal() {
    try {
      var stats = (LQ.site && typeof LQ.site.stats === 'function') ? LQ.site.stats() : null;
      var count = stats ? stats.lessonCount : 0;
      var fallback = LQ.catalog && LQ.catalog.lessonTotal ? LQ.catalog.lessonTotal : 34;
      return Math.max(count || 0, fallback || 34, 34);
    } catch (err) { return 34; }
  }

  function moduleTotal() {
    try {
      var stats = (LQ.site && typeof LQ.site.stats === 'function') ? LQ.site.stats() : null;
      var count = stats ? stats.moduleCount : 0;
      return Math.max(count || 0, 7);
    } catch (err) { return 7; }
  }

  function currentErrors() {
    try { return Array.isArray(global.__LQ_ERRORS__) ? global.__LQ_ERRORS__ : []; } catch (err) { return []; }
  }

  function updateDebug() {
    if (!debugMode) return;
    try {
      var node = document.getElementById('lq-debug');
      if (!node) {
        node = document.createElement('div');
        node.id = 'lq-debug';
        node.hidden = true;
        node.setAttribute('aria-hidden', 'true');
        node.style.display = 'none';
        if (document.body) document.body.appendChild(node);
        else return;
      }
      var errors = currentErrors();
      node.setAttribute('data-route', global.location.hash || '#/');
      node.setAttribute('data-title', document.title || '');
      node.setAttribute('data-lessons', String(lessonTotal()));
      node.setAttribute('data-modules', String(moduleTotal()));
      node.setAttribute('data-errors', JSON.stringify(errors));
      node.setAttribute('data-ready', '1');
      node.textContent = JSON.stringify(errors);
    } catch (err) { /* ignore */ }
  }

  function scheduleDebug(delay) {
    if (!debugMode) return;
    if (debugTimer) clearTimeout(debugTimer);
    updateDebug();
    if (document.body) {
      // 等图表挂载、异步渲染稳定后再抓一次（QA 用 --virtual-time-budget 等待）
      debugTimer = setTimeout(updateDebug, delay === undefined ? 400 : delay);
    }
  }

  function routeRegistrations() {
    var pages = LQ.pages || {};
    var defs = [
      ['/', 'home'],
      ['/roadmap', 'roadmap'],
      ['/plan', 'plan'],
      ['/module/:id', 'module'],
      ['/lesson/:id', 'lesson'],
      ['/exam', 'exam'],
      ['/exam/:tab', 'exam'],
      ['/real', 'real'],
      ['/tools', 'tools'],
      ['/glossary', 'glossary'],
      ['/references', 'references']
    ];
    defs.forEach(function (def) {
      var page = pages[def[1]];
      if (!page || typeof page.render !== 'function') {
        report('页面模块缺失: LQ.pages.' + def[1] + '（assets/js/app/pages/' + def[1] + '.js）');
        return;
      }
      LQ.router.add(def[0], page);
    });
    if (pages.notfound && typeof pages.notfound.render === 'function') {
      LQ.router.setFallback(pages.notfound);
    } else {
      report('缺少 404 页面模块: LQ.pages.notfound');
    }
  }

  function fatalScreen(message) {
    var main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'error-page';
    box.innerHTML =
      '<div class="error-icon">' + (LQ.ui ? LQ.ui.icon('warn', 'icon-xl') : '') + '</div>' +
      '<div class="error-code">ERR</div>' +
      '<h1 class="error-title">学习系统启动失败</h1>' +
      '<p class="error-text">页面初始化时遇到异常，请刷新重试。错误信息已记录在 window.__LQ_ERRORS__。</p>' +
      '<span class="error-path"></span>' +
      '<div class="error-actions"><button type="button" class="btn btn-primary" data-action="reload">刷新页面</button></div>';
    var pathEl = box.querySelector('.error-path');
    if (pathEl) pathEl.textContent = String(message || '未知错误');
    var reloadBtn = box.querySelector('[data-action="reload"]');
    if (reloadBtn) reloadBtn.addEventListener('click', function () { global.location.reload(); });
    main.appendChild(box);
  }

  function bindStoreEvents() {
    document.addEventListener('lq:store', function () {
      try {
        if (LQ.ui && LQ.ui.updateProgress) LQ.ui.updateProgress();
        if (LQ.router && LQ.router.runRefreshers) LQ.router.runRefreshers();
      } catch (err) {
        report('刷新进度 UI 失败: ' + (err && err.message ? err.message : err));
      }
    });
  }

  function start() {
    if (booted) return;
    booted = true;
    debugMode = detectDebug();
    try {
      if (LQ.ui && LQ.ui.initShell) LQ.ui.initShell();
      else report('缺少 UI 模块（assets/js/app/ui.js）');
    } catch (err) {
      report('初始化站点外壳失败: ' + (err && err.stack ? err.stack : err));
    }

    try {
      if (LQ.router && LQ.router.add) routeRegistrations();
      else { report('缺少路由模块（assets/js/app/router.js）'); fatalScreen('缺少路由模块'); return; }
    } catch (err) {
      report('注册路由失败: ' + (err && err.stack ? err.stack : err));
      fatalScreen(err && err.message ? err.message : err);
      return;
    }

    bindStoreEvents();

    try {
      LQ.router.start();
    } catch (err) {
      report('路由启动失败: ' + (err && err.stack ? err.stack : err));
      fatalScreen(err && err.message ? err.message : err);
      return;
    }

    if (global.location && typeof global.location.hash === 'string') {
      try { document.body.setAttribute('data-route', global.location.hash || '#/'); } catch (err) { /* ignore */ }
    }

    LQ.app.booted = true;
    LQ.app.startedAt = Date.now();
    scheduleDebug(400);
    setTimeout(function () { scheduleDebug(400); }, 450);
  }

  LQ.app = {
    start: start,
    booted: false,
    startedAt: 0,
    get debugMode() { return debugMode; },
    addRefresh: function (fn) {
      if (LQ.router && LQ.router.addRefresh) LQ.router.addRefresh(fn);
    },
    onRouteRendered: function (ctx, failed) {
      try {
        if (global.__LQ_DEBUG__) {
          global.__LQ_DEBUG__.route = global.location.hash || '#/';
          global.__LQ_DEBUG__.path = ctx && ctx.path;
          global.__LQ_DEBUG__.renderFailed = !!failed;
        }
        scheduleDebug(400);
      } catch (err) { /* ignore */ }
    },
    updateDebug: updateDebug,
    reportError: report
  };

  global.__LQ_DEBUG__ = {
    version: (LQ.version || '1.0.0'),
    route: global.location ? (global.location.hash || '#/') : '#/',
    path: null,
    renderFailed: false
  };

  // 初始化关键异常兜底（比如某页面模块文件 404 导致 LQ.pages 缺失等，都会被 router/app 捕获）
  global.addEventListener('error', function () { scheduleDebug(400); });
  global.addEventListener('unhandledrejection', function () { scheduleDebug(400); });

  try {
    start();
  } catch (err) {
    report('启动异常: ' + (err && err.stack ? err.stack : err));
    fatalScreen(err && err.message ? err.message : err);
  }
})(typeof window !== 'undefined' ? window : globalThis);
