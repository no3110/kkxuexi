/* hash 路由（site-engineer 维护）
 * - 路由表由 app.js 注入；页面对象形如 { title: string|fn(ctx), render(ctx) -> HTMLElement, destroy?() }
 * - 切页时先调用上一页 destroy()（图表 destroy、定时器清理），再渲染新页面
 * - 渲染异常不会白屏：捕获后渲染错误卡片，并写入 window.__LQ_ERRORS__
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var routes = [];
  var fallbackPage = null;
  var currentPage = null;
  var currentCtx = null;
  var currentRaw = null;
  var started = false;
  var refreshers = [];

  function report(message) {
    try {
      if (LQ.errors && LQ.errors.push) LQ.errors.push(message);
      else (global.__LQ_ERRORS__ = global.__LQ_ERRORS__ || []).push(message);
    } catch (err) { /* ignore */ }
  }

  function decode(value) {
    try { return decodeURIComponent(value); } catch (err) { return value; }
  }

  /* 解析 hash：#/lesson/m01-01?x=1 -> {path:'/lesson/m01-01', query:{x:'1'}} */
  function parseHash(hash) {
    var raw = (hash === undefined || hash === null ? (global.location.hash || '') : hash).replace(/^#/, '');
    if (!raw) return { path: '/', query: {}, anchor: null, raw: '#/' };
    if (raw.charAt(0) !== '/') return { path: null, query: {}, anchor: raw, raw: '#' + raw };
    var qIndex = raw.indexOf('?');
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var queryRaw = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    var query = {};
    if (queryRaw) {
      queryRaw.split('&').forEach(function (pair) {
        if (!pair) return;
        var eq = pair.indexOf('=');
        var key = eq >= 0 ? pair.slice(0, eq) : pair;
        var value = eq >= 0 ? pair.slice(eq + 1) : '';
        query[decode(key)] = decode(value.replace(/\+/g, ' '));
      });
    }
    return { path: path, query: query, anchor: null, raw: '#' + raw };
  }

  function matchRoute(path) {
    var segments = path.split('/').filter(function (s) { return s !== ''; });
    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];
      var parts = route.segments;
      if (parts.length !== segments.length) continue;
      var params = {};
      var ok = true;
      for (var j = 0; j < parts.length; j++) {
        var part = parts[j];
        if (part.charAt(0) === ':') {
          params[part.slice(1)] = decode(segments[j]);
        } else if (part !== segments[j]) {
          ok = false;
          break;
        }
      }
      if (ok) return { route: route, params: params };
    }
    return null;
  }

  function destroyCurrent() {
    if (currentPage && typeof currentPage.destroy === 'function') {
      try { currentPage.destroy(); } catch (err) {
        report('页面销毁异常: ' + (err && err.message ? err.message : err));
      }
    }
    currentPage = null;
    currentCtx = null;
    refreshers = [];
  }

  function renderErrorPage(err, ctx) {
    var page = (LQ.pages && LQ.pages.error) ? LQ.pages.error : null;
    if (page && typeof page.render === 'function') {
      try { return page.render({ error: err, route: ctx }); } catch (inner) { /* fall through */ }
    }
    var box = document.createElement('div');
    box.className = 'error-page';
    var title = document.createElement('h1');
    title.className = 'error-title';
    title.textContent = '页面加载出错';
    var text = document.createElement('p');
    text.className = 'error-text';
    text.textContent = String(err && err.message ? err.message : err);
    box.appendChild(title);
    box.appendChild(text);
    return box;
  }

  function scrollTop() {
    try {
      global.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    } catch (err) { /* ignore */ }
  }

  function render(force) {
    var parsed = parseHash();
    // 页内锚点（如 #main-content）不参与路由，交还给浏览器滚动
    if (parsed.path === null) return;
    if (!force && parsed.raw === currentRaw && currentPage) return;

    var main = document.getElementById('main-content');
    if (!main) return;

    var matched = matchRoute(parsed.path);
    var page = matched ? matched.route.page : fallbackPage;
    var ctx = {
      path: parsed.path,
      params: matched ? matched.params : {},
      query: parsed.query,
      raw: parsed.raw,
      page: null
    };

    destroyCurrent();

    // 侧栏默认收起，由具体页面（课程页）在 render 中重新填充
    if (LQ.ui && LQ.ui.clearSidebar) LQ.ui.clearSidebar();
    if (LQ.ui && LQ.ui.closeDrawer) LQ.ui.closeDrawer();

    var node = null;
    var renderFailed = false;
    if (page && typeof page.render === 'function') {
      try {
        node = page.render(ctx);
      } catch (err) {
        renderFailed = true;
        report('渲染路由 ' + parsed.path + ' 失败: ' + (err && err.stack ? err.stack : err));
        node = renderErrorPage(err, ctx);
      }
    } else {
      renderFailed = true;
      report('路由 ' + parsed.path + ' 没有对应页面');
      node = renderErrorPage(new Error('该路由没有对应的页面：' + parsed.path), ctx);
    }

    main.innerHTML = '';
    if (node && node.nodeType === 1) main.appendChild(node);
    else if (typeof node === 'string') main.innerHTML = node;

    currentPage = page || null;
    currentCtx = ctx;
    currentRaw = parsed.raw;

    // 进度条宽度统一在这一层写入
    if (LQ.ui && LQ.ui.paintBars) LQ.ui.paintBars(main);

    // <title>
    var title = null;
    try {
      if (page) title = typeof page.title === 'function' ? page.title(ctx) : page.title;
    } catch (err) { title = null; }
    document.title = (title ? title + ' · ' : '') + '订单流与价格行为 · 0→实战学习系统';

    if (LQ.ui && LQ.ui.setActiveNav) LQ.ui.setActiveNav(parsed.path);

    // body 上的运行时标记（QA / 无头浏览器依赖）
    try {
      document.body.setAttribute('data-route', global.location.hash || '#/');
      document.body.setAttribute('data-ready', '1');
    } catch (err) { /* ignore */ }

    scrollTop();
    try { main.focus({ preventScroll: true }); } catch (err) { /* ignore */ }

    if (LQ.app && typeof LQ.app.onRouteRendered === 'function') {
      try { LQ.app.onRouteRendered(ctx, renderFailed); } catch (err) {
        report('onRouteRendered 异常: ' + (err && err.message ? err.message : err));
      }
    }

    if (LQ.ui && LQ.ui.updateProgress) {
      try { LQ.ui.updateProgress(); } catch (err) { /* ignore */ }
    }
  }

  function onHashChange() {
    var raw = global.location.hash || '';
    if (raw && raw.charAt(0) === '#' && raw.charAt(1) !== '/') return; // 页内锚点
    render(false);
  }

  var router = {
    add: function (pattern, page) {
      var clean = pattern.charAt(0) === '/' ? pattern : '/' + pattern;
      routes.push({
        pattern: clean,
        segments: clean.split('/').filter(function (s) { return s !== ''; }),
        page: page
      });
      // 越长越具体的路由优先（参数段少者优先）
      routes.sort(function (a, b) { return b.segments.length - a.segments.length; });
      return router;
    },

    setFallback: function (page) { fallbackPage = page; return router; },

    start: function () {
      if (started) return;
      started = true;
      global.addEventListener('hashchange', onHashChange);
      if (!global.location.hash) {
        try { global.location.hash = '#/'; } catch (err) { /* ignore */ }
      }
      render(true);
    },

    render: function (force) { render(force !== false); },

    go: function (path, force) {
      var target = path || '#/';
      if (target.charAt(0) !== '#') target = '#' + (target.charAt(0) === '/' ? target : '/' + target);
      try {
        if (global.location.hash === target && force !== false) { render(true); return; }
        global.location.hash = target;
        if (global.location.hash === target && currentRaw !== target) render(false);
      } catch (err) {
        report('路由跳转失败: ' + (err && err.message ? err.message : err));
      }
    },

    parse: parseHash,
    currentPath: function () { return currentCtx ? currentCtx.path : null; },
    context: function () { return currentCtx; },
    currentRaw: function () { return currentRaw; },
    isStarted: function () { return started; },

    /* 页面可在 render 中注册刷新函数（store 变化时重绘局部数字，不整页重排） */
    addRefresh: function (fn) {
      if (typeof fn === 'function') refreshers.push(fn);
    },
    runRefreshers: function () {
      refreshers.forEach(function (fn) {
        try { fn(); } catch (err) {
          report('刷新 UI 失败: ' + (err && err.message ? err.message : err));
        }
      });
    },
    clearRefreshers: function () { refreshers = []; }
  };

  LQ.router = router;
})(typeof window !== 'undefined' ? window : globalThis);
