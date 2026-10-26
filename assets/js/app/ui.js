/* 站点外壳与通用 UI 组件（site-engineer 维护）
 * 所有动态文本进入 DOM 前必须经过 esc()（纯文本）或 LQ.inline()（课程行内标记，内部已转义）。
 * innerHTML 只用于本文件/页面文件中由我们手写的静态模板 + 已转义插值。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var esc = function (value) { return LQ.util.escapeHtml(value); };
  var inline = function (value) { return LQ.inline(value); };

  /* ---------- 内联 SVG 图标（全部为本站静态手写路径，不引入外部资源） ---------- */
  var ICONS = {
    logo: '<path d="M4 17l5-6 4 4 6.5-8.5 2.5 2.5" /><path d="M3 21h18" />',
    home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" />',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" />',
    tools: '<path d="M20 7a4 4 0 0 1-5.2 3.8L6.2 19.4 4.6 17.8l8.6-8.6A4 4 0 0 1 17 4l-2.6 2.6 3 3L20 7z" />',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" /><path d="M4 17.5A2 2 0 0 1 6 16h13" /><path d="M8 3v13" />',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />',
    search: '<circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />',
    menu: '<path d="M4 7h16M4 12h16M4 17h16" />',
    close: '<path d="M6 6l12 12M18 6L6 18" />',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" />',
    'check-circle': '<circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9" />',
    circle: '<circle cx="12" cy="12" r="8.5" />',
    'arrow-right': '<path d="M4 12h15" /><path d="M13 6l6 6-6 6" />',
    'arrow-left': '<path d="M20 12H5" /><path d="M11 6l-6 6 6 6" />',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none" />',
    pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none" />',
    reset: '<path d="M4 5v5h5" /><path d="M4.6 10a8 8 0 1 1 1.6 7.2" />',
    external: '<path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5H5V6h5" />',
    clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.4 2" />',
    'chevron-right': '<path d="M9 5l7 7-7 7" />',
    'chevron-down': '<path d="M6 9l6 6 6-6" />',
    info: '<circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />',
    warn: '<path d="M12 3.5L22 20H2z" /><path d="M12 9v5M12 17h.01" />',
    bulb: '<path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.2c.7.6 1 1.5 1 2.4h6c0-.9.3-1.8 1-2.4A6 6 0 0 0 12 3z" />',
    key: '<circle cx="15.5" cy="8.5" r="4.5" /><path d="M12.3 11.7L4 20v-3h3v-3h3" />',
    target: '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />',
    chart: '<path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" />',
    trend: '<path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" />',
    structure: '<rect x="3" y="4" width="6" height="6" rx="1" /><rect x="15" y="4" width="6" height="6" rx="1" /><rect x="3" y="14" width="6" height="6" rx="1" /><rect x="15" y="14" width="6" height="6" rx="1" /><path d="M9 7h6M9 17h6M6 10v4M18 10v4" />',
    flow: '<path d="M3 8h13" /><path d="M13 5l3 3-3 3" /><path d="M21 16H8" /><path d="M11 13l-3 3 3 3" />',
    shield: '<path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z" /><path d="M9 12l2.2 2.2L15.5 10" />',
    layers: '<path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 17l9 5 9-5" />',
    flame: '<path d="M12 22c4 0 7-2.8 7-6.6 0-3-2-5.5-4-7.6-1 2.2-2 3.2-2 3.2S12.5 9 12 5.5c-2 2.2-5 5.2-5 9.9C7 19.2 8.7 22 12 22z" />',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z" />',
    list: '<path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" />',
    file: '<path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" />',
    'x-circle': '<circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" />',
    compass: '<circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" />',
    route: '<circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H14a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5.5" />',
    lightning: '<path d="M13 2L4 14h6l-1 8 9-12h-6z" />'
  };

  function icon(name, className) {
    var body = ICONS[name] || ICONS.info;
    return '<svg class="icon ' + (className || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  /* ---------- 进度环 / 进度条 ---------- */
  function ringHTML(pct, opts) {
    opts = opts || {};
    var value = LQ.util.clamp(Math.round(Number(pct) || 0), 0, 100);
    var cls = 'progress-ring' + (opts.className ? ' ' + opts.className : '');
    var label = opts.label || ('学习进度 ' + value + '%');
    return '<span class="' + cls + '" role="img" aria-label="' + esc(label) + '">' +
      '<svg viewBox="0 0 36 36" aria-hidden="true">' +
      '<circle class="ring-bg" cx="18" cy="18" r="15.9155" stroke-width="3.2" />' +
      '<circle class="ring-fg" cx="18" cy="18" r="15.9155" stroke-width="3.2" stroke-dasharray="' + value + ' ' + (100 - value) + '" />' +
      '</svg><span class="ring-text">' + value + '%</span></span>';
  }

  function barHTML(pct) {
    var value = LQ.util.clamp(Math.round(Number(pct) || 0), 0, 100);
    return '<div class="progress" role="progressbar" aria-valuenow="' + value + '" aria-valuemin="0" aria-valuemax="100"><span data-bar-value="' + value + '"></span></div>';
  }

  /* 进度条宽度用 JS 写入（避免在 HTML 字符串里写内联 style） */
  function paintBars(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-bar-value]') : [];
    Array.prototype.forEach.call(nodes, function (node) {
      var value = LQ.util.clamp(Number(node.getAttribute('data-bar-value')) || 0, 0, 100);
      node.style.width = value + '%';
    });
  }

  function badge(text, tone, iconName) {
    return '<span class="badge' + (tone ? ' badge-' + tone : '') + '">' + (iconName ? icon(iconName) : '') + esc(text) + '</span>';
  }

  function emptyHTML(title, text, extraHTML) {
    return '<div class="empty">' + icon('compass') +
      '<div class="empty-title">' + esc(title || '暂无内容') + '</div>' +
      (text ? '<p class="empty-text">' + esc(text) + '</p>' : '') +
      (extraHTML || '') + '</div>';
  }

  /* 数据来源短名：'GitHub · domzack/mgc-ohlcv-data（CME ...）' → 'GitHub · domzack/mgc-ohlcv-data' */
  function sourceShortName(source) {
    var s = String(source || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    var cut = s.indexOf('（');
    if (cut < 0) cut = s.indexOf('(');
    if (cut > 0) s = s.slice(0, cut).trim();
    return s;
  }

  /* 数据来源徽标：真实数据（module=real / dataNote 含"真实"）必须显示真实来源，不能标成模拟。
   * 优先使用 scenario.dataSource.source（Lead 的 real 数据自带），其次 dataset.source，
   * 最后从 dataNote 推断；V2 CONTRACT §2/§7.1：真实数据透明。 */
  function dataBadge(scenario) {
    var isReal = false;
    var note = '';
    if (!scenario) return '<span class="badge badge-muted chart-data-badge">' + icon('info') + esc('数据加载中') + '</span>';
    note = String(scenario.dataNote || '');
    isReal = scenario.module === 'real' || note.indexOf('真实') !== -1;
    if (!isReal) {
      return '<span class="badge badge-warn chart-data-badge">' + icon('warn') + esc('模拟数据 · 仅用于教学') + '</span>';
    }
    var dataSource = scenario.dataSource || null;
    var dataset = null;
    try {
      if (scenario.dataset && LQ.data && typeof LQ.data.getDataset === 'function') dataset = LQ.data.getDataset(scenario.dataset);
    } catch (err) { dataset = null; }
    var source = (dataSource && dataSource.source) || (dataset && dataset.source) || '';
    var symbol = (dataSource && dataSource.symbol) || (dataset && dataset.symbol) || scenario.symbol || '';
    if (!source) {
      if (/Yahoo/i.test(note)) source = 'Yahoo Finance';
      else if (/GitHub/i.test(note)) {
        var m = note.match(/GitHub\s*·?\s*([^\s·（(]+(?:\/[^\s·（(]+)?)/i);
        source = m ? 'GitHub · ' + m[1] : 'GitHub 开源数据';
      } else source = '外部真实数据源';
    }
    var shortSource = sourceShortName(source) || '外部真实数据源';
    var label = '真实数据 · ' + shortSource + (symbol ? ' ' + symbol : '');
    var title = note || ('真实历史数据 · ' + source + (symbol ? ' · ' + symbol : ''));
    return '<span class="badge badge-info chart-data-badge" title="' + esc(title) + '">' + icon('chart') + esc(label) + '</span>';
  }

  function scenarioIsReal(scenario) {
    if (!scenario) return false;
    if (scenario.module === 'real') return true;
    return String(scenario.dataNote || '').indexOf('真实') !== -1;
  }

  function noticeHTML(text, tone, iconName) {
    return '<div class="notice' + (tone ? ' notice-' + tone : '') + '">' + icon(iconName || 'info') +
      '<div>' + inline(text) + '</div></div>';
  }

  /* ---------- Toast ---------- */
  function toast(message, tone) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var node = document.createElement('div');
    node.className = 'toast' + (tone === 'bad' ? ' toast-bad' : '');
    node.innerHTML = icon(tone === 'bad' ? 'warn' : 'check-circle');
    var span = document.createElement('span');
    span.textContent = String(message);
    node.appendChild(span);
    root.appendChild(node);
    setTimeout(function () {
      node.classList.add('is-leaving');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 220);
    }, 2600);
  }

  /* ---------- 导航配置 ---------- */
  var NAV = [
    { href: '#/', route: '/', label: '首页', icon: 'home' },
    { href: '#/roadmap', route: '/roadmap', label: '路线图', icon: 'route' },
    { href: '#/plan', route: '/plan', label: '学习计划', icon: 'calendar' },
    { href: '#/exam', route: '/exam', label: '实战考核', icon: 'target' },
    { href: '#/real', route: '/real', label: '真实案例', icon: 'chart' },
    { href: '#/tools', route: '/tools', label: '工具', icon: 'tools' },
    { href: '#/glossary', route: '/glossary', label: '术语表', icon: 'book' },
    { href: '#/references', route: '/references', label: '参考资料', icon: 'link' }
  ];

  /* 移动端底部快捷栏（≤900px 显示；点击区 ≥44px，由 CSS 保证） */
  var BOTTOM_NAV = [
    { href: '#/', route: '/', label: '首页', icon: 'home', key: 'home' },
    { href: '#/roadmap', route: '/roadmap', label: '路线图', icon: 'route', key: 'roadmap' },
    { href: '#/exam', route: '/exam', label: '考核', icon: 'target', key: 'exam' },
    { href: '#/tools', route: '/tools', label: '工具', icon: 'tools', key: 'tools' },
    { href: '#/?focus=progress', route: '/', label: '进度', icon: 'chart', key: 'progress' }
  ];

  var drawerOpen = false;

  function navHTML(kind) {
    return NAV.map(function (item) {
      if (kind === 'drawer') {
        return '<a class="drawer-link" data-nav-route="' + item.route + '" href="' + item.href + '">' +
          icon(item.icon) + '<span>' + esc(item.label) + '</span></a>';
      }
      return '<a class="nav-link" data-nav-route="' + item.route + '" href="' + item.href + '">' +
        icon(item.icon) + '<span>' + esc(item.label) + '</span></a>';
    }).join('');
  }

  function brandHTML() {
    return '<a class="brand" href="#/" aria-label="订单流与价格行为学习系统 · 首页">' +
      '<span class="brand-logo">' + icon('trend') + '</span>' +
      '<span class="brand-text"><span class="brand-name">订单流 · 价格行为</span>' +
      '<span class="brand-sub">0→实战学习系统</span></span></a>';
  }

  function progressLabels() {
    var sum = LQ.site.summary();
    return {
      label: '<span class="header-progress-label"><b>' + sum.done + ' / ' + sum.total + ' 课</b><span>已完成</span></span>',
      drawer: '<div class="drawer-progress-label"><b>' + sum.done + ' / ' + sum.total + '</b> 课已完成 · ' + sum.pct + '%</div>'
    };
  }

  function updateProgress() {
    var sum = LQ.site.summary();
    var header = document.getElementById('header-progress');
    if (header) {
      header.innerHTML = ringHTML(sum.pct, { label: '总学习进度 ' + sum.pct + '%' }) + progressLabels().label;
      header.setAttribute('aria-label', '总学习进度：已完成 ' + sum.done + ' / ' + sum.total + ' 课');
    }
    var drawer = document.getElementById('drawer-progress');
    if (drawer) {
      drawer.innerHTML = ringHTML(sum.pct, { label: '总学习进度 ' + sum.pct + '%' }) +
        '<div class="drawer-progress-label"><b>' + sum.done + ' / ' + sum.total + '</b> 课已完成 · ' + sum.pct + '%</div>';
    }
    var bottomProgress = document.querySelector('[data-bottom-progress]');
    if (bottomProgress) bottomProgress.textContent = sum.pct + '%';
  }

  /* ---------- 底部快捷栏（移动端） ---------- */
  function bottomNavHTML() {
    return BOTTOM_NAV.map(function (item) {
      return '<a class="bottom-nav-item" data-nav-item data-bottom-key="' + item.key + '" data-bottom-route="' + item.route + '" href="' + item.href + '" aria-label="' + esc(item.label) + '">' +
        icon(item.icon) + '<span class="bottom-nav-label">' + esc(item.label) + '</span>' +
        (item.key === 'progress' ? '<span class="bottom-nav-pct" data-bottom-progress>0%</span>' : '') +
        '</a>';
    }).join('');
  }

  function buildBottomNav() {
    if (document.getElementById('bottom-nav')) return;
    var nav = document.createElement('nav');
    nav.id = 'bottom-nav';
    nav.className = 'bottom-nav';
    nav.setAttribute('data-bottom-nav', '');
    nav.setAttribute('aria-label', '快捷导航');
    nav.innerHTML = bottomNavHTML();
    document.body.appendChild(nav);
  }

  /* ---------- 抽屉 ---------- */
  function drawerEl() { return document.getElementById('nav-drawer'); }
  function backdropEl() { return document.getElementById('drawer-backdrop'); }

  function openDrawer() {
    var drawer = drawerEl(), backdrop = backdropEl();
    if (!drawer || !backdrop) return;
    drawerOpen = true;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    document.body.classList.add('drawer-open');
    var btn = document.getElementById('menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    var drawer = drawerEl(), backdrop = backdropEl();
    if (!drawer) return;
    drawerOpen = false;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('drawer-open');
    var btn = document.getElementById('menu-btn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleDrawer() { if (drawerOpen) closeDrawer(); else openDrawer(); }

  function buildDrawer() {
    if (drawerEl()) return;
    var backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'drawer-backdrop';
    backdrop.id = 'drawer-backdrop';
    backdrop.setAttribute('aria-label', '关闭导航');
    backdrop.hidden = true;
    backdrop.addEventListener('click', closeDrawer);

    var drawer = document.createElement('aside');
    drawer.className = 'nav-drawer';
    drawer.id = 'nav-drawer';
    drawer.setAttribute('aria-label', '站点导航');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML =
      '<div class="drawer-head"><span class="drawer-title">' + esc('导航') + '</span>' +
      '<button type="button" class="icon-btn" id="drawer-close" aria-label="关闭导航">' + icon('close') + '</button></div>' +
      '<nav class="drawer-nav" aria-label="移动端导航">' + navHTML('drawer') + '</nav>' +
      '<div class="drawer-meta">' +
      '<div class="drawer-progress" id="drawer-progress"></div>' +
      '<div class="drawer-tip">' + esc('本站为离线静态站点：所有图表为模拟数据，仅用于教学演示，不构成任何投资建议。') + '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    var closeBtn = drawer.querySelector('#drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a') : null;
      if (link) closeDrawer();
    });
  }

  /* ---------- 外壳渲染 ---------- */
  function initShell() {
    var header = document.getElementById('site-header');
    if (header) {
      header.innerHTML =
        '<div class="header-inner">' + brandHTML() +
        '<nav class="main-nav" aria-label="主导航">' + navHTML('nav') + '</nav>' +
        '<div class="header-actions">' +
        '<button type="button" class="icon-btn" id="search-open" aria-label="搜索课程、术语与情景" title="搜索（Ctrl+K）">' +
        icon('search') + '<span>搜索</span><kbd class="kbd">Ctrl K</kbd></button>' +
        '<a class="header-progress" id="header-progress" href="#/" aria-label="学习进度"></a>' +
        '<button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="打开导航菜单" aria-controls="nav-drawer" aria-expanded="false">' + icon('menu') + '</button>' +
        '</div></div>';
    }

    var footer = document.getElementById('site-footer');
    if (footer) {
      var stats = LQ.site.stats ? LQ.site.stats() : { lessonCount: 0, moduleCount: 0 };
      var planWeeks = LQ.site.planWeeks ? LQ.site.planWeeks() : 10;
      footer.innerHTML =
        '<div class="footer-inner">' +
        '<div>' +
        '<div class="footer-brand"><span class="brand-logo">' + icon('trend') + '</span><span>订单流与价格行为 · 0→实战学习系统</span></div>' +
        '<p class="footer-desc">' + esc('一套完整的自学路线：道氏理论 → 价格行为 → ICT/SMC → 订单流 → 拍卖理论 → 威科夫 → ATR 风控 → 综合实战 → 真实 NQ/GC 案例，共 ' + stats.moduleCount + ' 个模块 / ' + stats.lessonCount + ' 课。模拟图表与真实历史数据都配套交互讲解、自测与实战考核。') + '</p>' +
        '<div class="footer-disclaimer">' + icon('warn') + '<span>' + esc('教学演示站点：模拟图表仅用于教学；真实案例为真实历史 OHLCV（来源见真实案例页各数据集），Delta/足迹为教学估算，不构成投资建议。') + '</span></div>' +
        '</div>' +
        '<div>' +
        '<div class="footer-links">' +
        '<a href="#/roadmap">学习路线图</a><a href="#/plan">' + esc(planWeeks + ' 周学习计划') + '</a><a href="#/exam">实战考核</a>' +
        '<a href="#/real">真实案例库</a><a href="#/tools">训练工具</a>' +
        '<a href="#/glossary">术语表</a><a href="#/references">参考资料</a><a href="#/lesson/m01-01">从第一课开始</a>' +
        '</div>' +
        '<p class="footer-desc mt-16">' + esc('纯静态 · PWA 可安装 · 离线可用 · 零外部依赖') + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="footer-bottom"><span>' + icon('lock') + esc('本地进度与成绩保存在你的浏览器中，不上传任何数据') + '</span><span>' + esc('双击 index.html 即可离线学习 · 手机可添加到主屏幕') + '</span></div>';
    }

    buildDrawer();
    buildBottomNav();
    updateProgress();

    var menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', toggleDrawer);
    var searchBtn = document.getElementById('search-open');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        if (LQ.search && LQ.search.open) LQ.search.open();
      });
    }
  }

  /* ---------- 当前导航高亮 ---------- */
  function setActiveNav(routePath) {
    var best = null;
    NAV.forEach(function (item) {
      if (routePath === item.route) best = item.route;
    });
    if (!best) {
      if (routePath.indexOf('/module/') === 0 || routePath.indexOf('/lesson/') === 0) best = '/roadmap';
    }
    var nodes = document.querySelectorAll('[data-nav-route]');
    Array.prototype.forEach.call(nodes, function (node) {
      if (best && node.getAttribute('data-nav-route') === best) node.setAttribute('aria-current', 'page');
      else node.removeAttribute('aria-current');
    });
    // 底部快捷栏高亮（进度项仅在首页时与首页一起高亮）
    var bottomNodes = document.querySelectorAll('[data-bottom-key]');
    Array.prototype.forEach.call(bottomNodes, function (node) {
      var key = node.getAttribute('data-bottom-key');
      var active = false;
      if (key === 'home') active = routePath === '/';
      else if (key === 'progress') active = routePath === '/';
      else if (key === 'exam') active = routePath === '/exam';
      else if (key === 'roadmap') active = routePath === '/roadmap' || routePath.indexOf('/module/') === 0 || routePath.indexOf('/lesson/') === 0;
      else if (key === 'tools') active = routePath === '/tools';
      if (active) node.setAttribute('aria-current', 'page');
      else node.removeAttribute('aria-current');
    });
  }

  /* ---------- 侧栏（课程页目录） ---------- */
  function showSidebar(html) {
    var aside = document.getElementById('site-sidebar');
    var layout = document.getElementById('site-layout');
    if (!aside) return;
    aside.innerHTML = html;
    aside.hidden = false;
    if (layout) layout.classList.add('has-sidebar');
  }

  function clearSidebar() {
    var aside = document.getElementById('site-sidebar');
    var layout = document.getElementById('site-layout');
    if (aside) { aside.innerHTML = ''; aside.hidden = true; aside.classList.remove('mobile-open'); }
    if (layout) layout.classList.remove('has-sidebar');
  }

  function toggleSidebar() {
    var aside = document.getElementById('site-sidebar');
    if (!aside || aside.hidden) return;
    aside.classList.toggle('mobile-open');
    if (aside.classList.contains('mobile-open') && aside.scrollIntoView) {
      try { aside.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* ignore */ }
    }
  }

  /* ---------- 二次确认按钮（替代 window.confirm，无头环境也能用） ---------- */
  function confirmThen(button, onConfirm) {
    if (!button) return;
    var original = button.getAttribute('data-original-label') || button.textContent;
    if (button.getAttribute('data-confirming') === '1') {
      button.removeAttribute('data-confirming');
      button.textContent = original;
      button.classList.remove('is-confirming');
      onConfirm();
      return;
    }
    button.setAttribute('data-confirming', '1');
    button.setAttribute('data-original-label', original);
    button.textContent = '再次点击确认';
    button.classList.add('is-confirming');
    setTimeout(function () {
      if (button.getAttribute('data-confirming') === '1') {
        button.removeAttribute('data-confirming');
        button.textContent = original;
        button.classList.remove('is-confirming');
      }
    }, 4000);
  }

  function moduleClass(id) {
    var known = ['m00', 'm01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09'];
    if (known.indexOf(id) !== -1) return 'mod-' + id;
    return 'mod-demo';
  }

  function moduleIcon(name) {
    var known = ['trend', 'structure', 'flow', 'book', 'chart', 'shield', 'target', 'layers'];
    return known.indexOf(name) !== -1 ? name : 'chart';
  }

  function debounce(fn, wait) { return LQ.util.debounce(fn, wait); }

  /* 图表手势补绘：
   * 图表引擎通过 requestAnimationFrame 合并重绘；当页面处于被遮挡的 iframe / 后台标签页时
   * rAF 会被浏览器节流甚至暂停，导致滚轮缩放/拖拽/双击复位后画面不刷新。
   * 这里在交互结束后补一次同步 chart.resize()（引擎内部会立即按当前 view 重绘）。
   * 返回一个 cleanup 函数，页面 destroy 时调用。 */
  function attachChartRepaintGuard(chart, root) {
    if (!chart || typeof chart.resize !== 'function' || !root || !root.addEventListener) return null;
    var timer = null;
    var types = ['wheel', 'pointerup', 'pointercancel', 'touchend', 'dblclick'];
    function nudge() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        try { chart.resize(); } catch (err) { /* 引擎内部已自行降级 */ }
      }, 140);
    }
    types.forEach(function (type) { root.addEventListener(type, nudge, { passive: true, capture: true }); });
    return function cleanup() {
      if (timer) { clearTimeout(timer); timer = null; }
      types.forEach(function (type) { root.removeEventListener(type, nudge, { passive: true, capture: true }); });
    };
  }

  function formatNum(n, digits) { return LQ.util.formatNum(n, digits); }
  function formatPrice(n) { return LQ.util.formatPrice(n); }

  LQ.ui = {
    esc: esc,
    inline: inline,
    icon: icon,
    ringHTML: ringHTML,
    barHTML: barHTML,
    paintBars: paintBars,
    badge: badge,
    dataBadge: dataBadge,
    scenarioIsReal: scenarioIsReal,
    emptyHTML: emptyHTML,
    noticeHTML: noticeHTML,
    toast: toast,
    initShell: initShell,
    updateProgress: updateProgress,
    setActiveNav: setActiveNav,
    showSidebar: showSidebar,
    clearSidebar: clearSidebar,
    toggleSidebar: toggleSidebar,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    toggleDrawer: toggleDrawer,
    confirmThen: confirmThen,
    attachChartRepaintGuard: attachChartRepaintGuard,
    moduleClass: moduleClass,
    moduleIcon: moduleIcon,
    debounce: debounce,
    formatNum: formatNum,
    formatPrice: formatPrice,
    nav: NAV
  };
})(typeof window !== 'undefined' ? window : globalThis);
