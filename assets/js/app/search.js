/* 全局搜索对话框（site-engineer 维护）
 * 范围：课程 / 模块 / 术语 / 情景。Ctrl+K 或点击顶部搜索按钮打开，Esc 关闭。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var isOpen = false;
  var results = [];
  var activeIndex = -1;
  var lastFocused = null;

  function dialogEl() { return document.getElementById('search-dialog'); }

  var TYPE_LABEL = { lesson: '课程', module: '模块', glossary: '术语', scenario: '情景', action: '页面' };

  function buildIndex() {
    var items = [];
    // 站点常用页面
    [
      { type: 'action', title: '学习路线图', sub: '阶段 0-7 完整路线与关卡', href: '#/roadmap' },
      { type: 'action', title: LQ.site.planWeeks() + ' 周学习计划', sub: '每周任务与每日训练清单', href: '#/plan' },
      { type: 'action', title: '实战考核', sub: '综合测验 / 图表判读 / 成绩与错题', href: '#/exam' },
      { type: 'action', title: '真实案例库', sub: 'NQ / GC 真实历史行情与数据来源', href: '#/real' },
      { type: 'action', title: '训练工具', sub: '情景图表库 / 仓位与 R 计算器 / ATR 止损计算器', href: '#/tools' },
      { type: 'action', title: '术语表', sub: '搜索与按模块筛选', href: '#/glossary' },
      { type: 'action', title: '参考资料', sub: '全部课程的外部来源', href: '#/references' }
    ].forEach(function (item) { items.push(item); });

    LQ.site.modules().forEach(function (mod) {
      items.push({
        type: 'module',
        title: mod.title,
        sub: (mod.stageName || '') + ' · ' + (mod.tagline || ''),
        href: '#/module/' + encodeURIComponent(mod.id),
        haystack: (mod.title + ' ' + (mod.en || '') + ' ' + (mod.summary || '') + ' ' + (mod.tagline || '')).toLowerCase()
      });
    });

    LQ.site.lessons().forEach(function (lesson) {
      var mod = LQ.site.module(lesson.moduleId);
      items.push({
        type: 'lesson',
        title: lesson.title,
        sub: (mod ? mod.title : '') + ' · ' + (lesson.minutes ? lesson.minutes + ' 分钟' : ''),
        href: '#/lesson/' + encodeURIComponent(lesson.id),
        haystack: ((lesson.id || '') + ' ' + (lesson.title || '') + ' ' + (lesson.summary || '') + ' ' + (lesson.en || '')).toLowerCase()
      });
    });

    LQ.site.glossary().forEach(function (item) {
      items.push({
        type: 'glossary',
        title: item.term,
        sub: (item.en ? item.en + ' · ' : '') + (item.def || ''),
        href: '#/glossary',
        haystack: ((item.term || '') + ' ' + (item.en || '') + ' ' + (item.def || '') + ' ' + ((item.aliases || []).join(' '))).toLowerCase()
      });
    });

    var scenarios = [];
    try {
      scenarios = (LQ.data && typeof LQ.data.listScenarios === 'function') ? LQ.data.listScenarios() : [];
    } catch (err) { scenarios = []; }
    scenarios.forEach(function (scenario) {
      items.push({
        type: 'scenario',
        title: scenario.title || scenario.id,
        sub: [scenario.id, scenario.symbol, scenario.timeframe].filter(Boolean).join(' · '),
        href: '#/tools?scenario=' + encodeURIComponent(scenario.id),
        haystack: ((scenario.id || '') + ' ' + (scenario.title || '') + ' ' + (scenario.description || '')).toLowerCase()
      });
    });

    return items;
  }

  function search(keyword) {
    var query = String(keyword || '').trim().toLowerCase();
    if (!query) {
      return buildIndex().filter(function (item) { return item.type === 'action' || item.type === 'module'; }).slice(0, 10);
    }
    var words = query.split(/\s+/).filter(Boolean);
    var all = buildIndex();
    var matched = all.filter(function (item) {
      var hay = item.haystack || ((item.title || '') + ' ' + (item.sub || '')).toLowerCase();
      return words.every(function (word) { return hay.indexOf(word) !== -1; });
    });
    var weight = { lesson: 0, module: 1, glossary: 2, scenario: 3, action: 4 };
    matched.sort(function (a, b) {
      var at = (a.title || '').toLowerCase().indexOf(query) === 0 ? 0 : 1;
      var bt = (b.title || '').toLowerCase().indexOf(query) === 0 ? 0 : 1;
      if (at !== bt) return at - bt;
      return (weight[a.type] || 0) - (weight[b.type] || 0);
    });
    return matched.slice(0, 20);
  }

  function resultHTML(item) {
    var iconName = item.type === 'lesson' ? 'book' : item.type === 'module' ? 'layers' : item.type === 'glossary' ? 'list' : item.type === 'scenario' ? 'chart' : 'compass';
    return '<button type="button" class="search-result" data-href="' + LQ.ui.esc(item.href) + '" role="option">' +
      LQ.ui.icon(iconName) +
      '<span class="search-result-main"><span class="search-result-title">' + LQ.ui.esc(item.title) + '</span>' +
      '<span class="search-result-sub">' + LQ.ui.esc(item.sub || '') + '</span></span>' +
      '<span class="search-result-type">' + LQ.ui.esc(TYPE_LABEL[item.type] || '') + '</span>' +
      '</button>';
  }

  function renderResults(keyword) {
    var root = dialogEl();
    if (!root) return;
    var list = root.querySelector('.search-results');
    if (!list) return;
    results = search(keyword);
    activeIndex = results.length ? 0 : -1;
    if (!results.length) {
      list.innerHTML = '<div class="search-empty">' + LQ.ui.esc('没有找到匹配的内容，换个关键词试试。') + '</div>';
      return;
    }
    var groups = {};
    results.forEach(function (item, index) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push({ item: item, index: index });
    });
    var html = '';
    Object.keys(groups).forEach(function (type) {
      html += '<div class="search-group-label">' + LQ.ui.esc(TYPE_LABEL[type] || type) + '</div>';
      groups[type].forEach(function (entry) {
        html += resultHTML(entry.item);
      });
    });
    list.innerHTML = html;
    var first = list.querySelector('.search-result');
    if (first) first.classList.add('is-active');
  }

  function setActive(index) {
    var root = dialogEl();
    if (!root) return;
    var nodes = root.querySelectorAll('.search-result');
    if (!nodes.length) return;
    if (index < 0) index = nodes.length - 1;
    if (index >= nodes.length) index = 0;
    activeIndex = index;
    Array.prototype.forEach.call(nodes, function (node, i) {
      node.classList.toggle('is-active', i === index);
    });
    nodes[index].scrollIntoView({ block: 'nearest' });
  }

  function activate(index) {
    var root = dialogEl();
    if (!root) return;
    var nodes = root.querySelectorAll('.search-result');
    var node = nodes[index];
    if (!node) return;
    var href = node.getAttribute('data-href');
    close();
    if (href) LQ.router.go(href);
  }

  function onKeyDown(event) {
    if (!isOpen) {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      activate(activeIndex);
    }
  }

  function open() {
    var root = dialogEl();
    if (!root || isOpen) return;
    isOpen = true;
    lastFocused = document.activeElement;
    root.hidden = false;
    document.body.classList.add('dialog-open');
    root.innerHTML =
      '<div class="search-panel" role="dialog" aria-modal="true" aria-label="全站搜索">' +
      '<div class="search-head">' + LQ.ui.icon('search') +
      '<input class="search-input" id="search-input" type="search" autocomplete="off" spellcheck="false" placeholder="搜索课程 / 术语 / 情景……" aria-label="搜索关键词">' +
      '<button type="button" class="icon-btn btn-sm search-close" id="search-close" aria-label="关闭搜索">' + LQ.ui.icon('close') + '</button>' +
      '</div>' +
      '<div class="search-results" role="listbox" aria-label="搜索结果"></div>' +
      '<div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd>选择</span><span><kbd>Enter</kbd>打开</span><span><kbd>Esc</kbd>关闭</span><span>' + LQ.ui.esc('共 ' + LQ.site.lessonCount() + ' 课') + '</span></div>' +
      '</div>';

    var input = root.querySelector('.search-input');
    var closeBtn = root.querySelector('#search-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (input) {
      input.addEventListener('input', function () { renderResults(input.value); });
      input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
          // 交给全局键盘处理器
          onKeyDown(event);
        }
      });
      setTimeout(function () { try { input.focus(); } catch (err) { /* ignore */ } }, 30);
    }
    root.addEventListener('click', function (event) {
      var target = event.target;
      if (target === root) { close(); return; }
      var result = target && target.closest ? target.closest('.search-result') : null;
      if (result) {
        var href = result.getAttribute('data-href');
        close();
        if (href) LQ.router.go(href);
      }
    });
    renderResults('');
  }

  function close() {
    var root = dialogEl();
    if (!root || !isOpen) return;
    isOpen = false;
    root.hidden = true;
    root.innerHTML = '';
    document.body.classList.remove('dialog-open');
    if (lastFocused && lastFocused.focus) {
      try { lastFocused.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
    }
  }

  document.addEventListener('keydown', onKeyDown);

  LQ.search = {
    open: open,
    close: close,
    toggle: function () { if (isOpen) close(); else open(); },
    isOpen: function () { return isOpen; },
    search: search
  };
})(typeof window !== 'undefined' ? window : globalThis);
