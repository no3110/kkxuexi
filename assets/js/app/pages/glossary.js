/* 术语表（site-engineer 维护）：搜索 + 按模块筛选 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function glossaryHaystack(item) {
    return [item.term || '', item.en || '', item.def || '', (item.aliases || []).join(' ')]
      .join(' ').toLowerCase();
  }

  function itemHTML(item) {
    var mod = LQ.site.module(item.moduleId);
    var aliases = Array.isArray(item.aliases) && item.aliases.length
      ? '<span class="glossary-aliases">' + esc('别名：' + item.aliases.join('、')) + '</span>' : '';
    return '<article class="glossary-item" data-glossary-item data-module="' + esc(item.moduleId || '') + '" data-haystack="' + esc(glossaryHaystack(item)) + '">' +
      '<div class="glossary-term"><b>' + esc(item.term) + '</b>' +
      (item.en ? '<span class="glossary-en">' + esc(item.en) + '</span>' : '') + '</div>' +
      '<p class="glossary-def">' + esc(item.def) + '</p>' +
      '<div class="glossary-foot">' + aliases +
      (mod ? '<a class="glossary-module-link" href="#/module/' + encodeURIComponent(mod.id) + '">' + esc(mod.title) + '</a>' : '') +
      '</div></article>';
  }

  LQ.pages.glossary = {
    title: '术语表',
    render: function () {
      var page = document.createElement('div');
      page.className = 'page glossary-page';
      var items = LQ.site.glossary();

      var filterChips = '<button type="button" class="chip is-active" data-module-filter="" aria-pressed="true">全部' +
        '<span class="chip-count">' + items.length + '</span></button>';
      LQ.catalog.moduleOrder.forEach(function (modId) {
        var count = items.filter(function (item) { return item.moduleId === modId; }).length;
        if (!count) return;
        var mod = LQ.site.module(modId);
        filterChips += '<button type="button" class="chip" data-module-filter="' + esc(modId) + '" aria-pressed="false">' +
          esc(mod ? mod.title : modId) + '<span class="chip-count">' + count + '</span></button>';
      });
      var unknownCount = items.filter(function (item) { return LQ.catalog.moduleOrder.indexOf(item.moduleId) === -1; }).length;
      if (unknownCount) {
        filterChips += '<button type="button" class="chip" data-module-filter="__other" aria-pressed="false">其他' +
          '<span class="chip-count">' + unknownCount + '</span></button>';
      }

      var listHTML = items.map(itemHTML).join('');
      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('术语表') + '</div>' +
        '<h1 class="page-title">' + esc('术语不是用来背的，是用来对齐的') + '</h1>' +
        '<p class="page-lead">' + esc('同一件事，不同流派叫法不同。这里按模块整理全站术语，每个都给一句人话定义。先搜再学，遇到陌生词就回来查。') + '</p>' +
        '</div>' +
        (items.length ? '' : LQ.ui.noticeHTML('术语表随课程内容加载。如果这里为空，说明课程内容脚本尚未就绪，刷新页面后再看。', 'warn', 'warn')) +
        '<div class="glossary-toolbar">' +
        '<div class="glossary-search-wrap">' + LQ.ui.icon('search') +
        '<input class="glossary-search" id="glossary-search" type="search" placeholder="搜索术语、英文名或别名……" autocomplete="off" aria-label="搜索术语">' +
        '</div>' +
        '<span class="glossary-count" data-glossary-count>' + esc('共 ' + items.length + ' 条') + '</span>' +
        '</div>' +
        (items.length ? '<div class="glossary-filters chip-row" data-glossary-filters>' + filterChips + '</div>' : '') +
        '<div class="glossary-list" data-glossary-list>' + (items.length ? listHTML : LQ.ui.emptyHTML('还没有术语', '课程内容加载后，这里会自动出现按模块分类的术语。')) + '</div>' +
        '<div class="empty hidden" data-glossary-empty>' + LQ.ui.icon('search') +
        '<div class="empty-title">没有匹配的术语</div>' +
        '<p class="empty-text">换个关键词，或者点「全部」看所有术语。</p></div>';

      var state = { module: '', keyword: '' };
      var input = page.querySelector('#glossary-search');

      function applyFilter() {
        var nodes = page.querySelectorAll('[data-glossary-item]');
        var visible = 0;
        Array.prototype.forEach.call(nodes, function (node) {
          var moduleOk = true;
          if (state.module === '__other') moduleOk = LQ.catalog.moduleOrder.indexOf(node.getAttribute('data-module')) === -1;
          else if (state.module) moduleOk = node.getAttribute('data-module') === state.module;
          var hay = node.getAttribute('data-haystack') || '';
          var keywordOk = !state.keyword || hay.indexOf(state.keyword) !== -1;
          var show = moduleOk && keywordOk;
          node.hidden = false;
          node.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        var count = page.querySelector('[data-glossary-count]');
        if (count) count.textContent = '显示 ' + visible + ' / ' + nodes.length + ' 条';
        var empty = page.querySelector('[data-glossary-empty]');
        if (empty) empty.classList.toggle('hidden', visible !== 0 || nodes.length === 0);
      }

      if (input) {
        input.addEventListener('input', LQ.ui.debounce(function () {
          state.keyword = input.value.trim().toLowerCase();
          applyFilter();
        }, 120));
      }

      var filters = page.querySelector('[data-glossary-filters]');
      if (filters) {
        filters.addEventListener('click', function (event) {
          var chip = event.target && event.target.closest ? event.target.closest('[data-module-filter]') : null;
          if (!chip) return;
          state.module = chip.getAttribute('data-module-filter');
          Array.prototype.forEach.call(filters.querySelectorAll('[data-module-filter]'), function (node) {
            var active = node === chip;
            node.classList.toggle('is-active', active);
            node.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          applyFilter();
        });
      }

      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
