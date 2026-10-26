/* 404 与页面异常兜底（site-engineer 维护） */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function actionButtonsHTML(extraHTML) {
    return '<div class="error-actions">' +
      '<a class="btn btn-primary" href="#/">' + LQ.ui.icon('home') + '返回首页</a>' +
      '<a class="btn btn-outline" href="#/roadmap">' + LQ.ui.icon('route') + '学习路线图</a>' +
      '<button type="button" class="btn btn-ghost" data-action="open-search">' + LQ.ui.icon('search') + '搜索课程</button>' +
      (extraHTML || '') +
      '</div>';
  }

  function bindActions(root) {
    var btn = root.querySelector('[data-action="open-search"]');
    if (btn) btn.addEventListener('click', function () {
      if (LQ.search && LQ.search.open) LQ.search.open();
    });
  }

  LQ.pages.notfound = {
    title: '页面不存在',
    render: function (ctx) {
      var custom = ctx && ctx.title ? ctx : null;
      var path = ctx && ctx.path ? ctx.path : (global.location.hash || '');
      var title = custom ? custom.title : '页面不存在';
      var message = custom && custom.message
        ? custom.message
        : '你访问的地址不在本站的任何路由中。可能是链接拼写有误，或页面已经改名。';
      var page = document.createElement('div');
      page.className = 'page';
      page.innerHTML =
        '<div class="error-page">' +
        '<div class="error-icon">' + LQ.ui.icon('compass', 'icon-xl') + '</div>' +
        '<div class="error-code">404</div>' +
        '<h1 class="error-title">' + esc(title) + '</h1>' +
        '<p class="error-text">' + esc(message) + '</p>' +
        (path ? '<span class="error-path">' + esc(path) + '</span>' : '') +
        actionButtonsHTML() +
        '</div>';
      bindActions(page);
      return page;
    }
  };

  LQ.pages.error = {
    title: '页面加载出错',
    render: function (ctx) {
      var error = ctx && ctx.error ? ctx.error : null;
      var message = error && error.message ? error.message : String(error || '未知错误');
      var stack = error && error.stack ? String(error.stack) : '';
      var page = document.createElement('div');
      page.className = 'page';
      page.innerHTML =
        '<div class="error-page">' +
        '<div class="error-icon">' + LQ.ui.icon('warn', 'icon-xl') + '</div>' +
        '<div class="error-code">ERR</div>' +
        '<h1 class="error-title">页面加载出错</h1>' +
        '<p class="error-text">' + esc('这个页面在渲染时遇到异常。错误已记录到 window.__LQ_ERRORS__，其他页面仍可正常使用。') + '</p>' +
        '<span class="error-path">' + esc(message) + '</span>' +
        actionButtonsHTML('<button type="button" class="btn btn-outline" data-action="retry">' + LQ.ui.icon('reset') + '重试</button>') +
        (stack ? '<details class="error-details"><summary class="text-xs muted">查看错误详情</summary><pre><code>' + esc(stack) + '</code></pre></details>' : '') +
        '</div>';
      bindActions(page);
      var retry = page.querySelector('[data-action="retry"]');
      if (retry) retry.addEventListener('click', function () {
        if (LQ.router && LQ.router.render) LQ.router.render(true);
      });
      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
