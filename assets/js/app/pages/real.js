/* 真实案例库 #/real（site-engineer 维护 · V2）
 * 数据来源：Lead 的 assets/js/data/real/nq-gc.js（LQ.data.listDatasets / module==='real' 的共享情景）
 * 页面职责：
 *  - 展示数据集：品种 / 周期 / 时间范围 / 抓取时间 / 来源（运行时读取 dataset.source，不写死 Yahoo/GitHub）
 *  - 展示真实情景：标题、周期、说明、数据来源；点击预览真实 K 线（可缩放/平移）
 *  - 醒目标注边界：K 线/成交量是真实历史数据；Delta / 足迹 / 订单流内部数据为教学估算
 *  - 聚合引用真实情景的课程（m09 真实案例）
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };
  var inline = function (v) { return LQ.inline(v); };

  function chartHeight() {
    var width = global.innerWidth || 1200;
    if (width <= 480) return 290;
    if (width <= 640) return 320;
    if (width <= 900) return 370;
    return 440;
  }

  function datasetCardHTML(dataset) {
    var bars = Array.isArray(dataset.bars) ? dataset.bars.length : 0;
    return '<article class="real-dataset-card" data-real-dataset="' + esc(dataset.id) + '">' +
      '<div class="real-dataset-head">' +
      '<div class="real-symbol">' + esc(dataset.symbol || '—') + '</div>' +
      '<div class="real-dataset-title">' + esc(dataset.name || dataset.id) + '</div>' +
      '<span class="badge badge-info">' + esc(dataset.timeframeLabel || dataset.interval || '') + '</span>' +
      '</div>' +
      '<dl class="real-meta">' +
      '<div><dt>时间范围</dt><dd>' + esc(dataset.range || '—') + '</dd></div>' +
      '<div><dt>K 线数量</dt><dd>' + esc(bars + ' 根') + '</dd></div>' +
      '<div><dt>抓取日期</dt><dd>' + esc(dataset.fetchedAt || '—') + '</dd></div>' +
      '</dl>' +
      (dataset.source ? '<p class="real-source">' + LQ.ui.icon('link') +
        (dataset.sourceUrl
          ? '<a href="' + esc(dataset.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(dataset.source) + '</a>'
          : esc(dataset.source)) +
        '</p>' : '') +
      (dataset.note ? '<p class="real-note">' + esc(dataset.note) + '</p>' : '') +
      '</article>';
  }

  function scenarioCardHTML(scenario) {
    var bars = Array.isArray(scenario.bars) ? scenario.bars.length : 0;
    var dataset = scenario.dataset ? LQ.site.dataset(scenario.dataset) : null;
    var symbol = (dataset && dataset.symbol) || scenario.symbol || '';
    var range = dataset ? dataset.range : '';
    return '<button type="button" class="real-scenario-card" data-real-scenario="' + esc(scenario.id) + '">' +
      '<span class="real-scenario-title">' + esc(scenario.title || scenario.id) + '</span>' +
      '<span class="scenario-meta">' +
      '<span class="badge badge-info">' + esc(symbol + ' · ' + (scenario.timeframe || '')) + '</span>' +
      '<span class="badge badge-muted">' + esc(bars + ' 根') + '</span>' +
      (range ? '<span class="badge badge-muted">' + esc(range) + '</span>' : '') +
      LQ.ui.dataBadge(scenario) +
      '</span>' +
      '<span class="scenario-desc">' + esc(scenario.description || '点击预览真实 K 线') + '</span>' +
      '</button>';
  }

  /* 来源短名：'GitHub · domzack/mgc-ohlcv-data（CME ...）' → 'GitHub · domzack/mgc-ohlcv-data' */
  function sourceShortName(source) {
    var s = String(source || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    var cut = s.indexOf('（');
    if (cut < 0) cut = s.indexOf('(');
    if (cut > 0) s = s.slice(0, cut).trim();
    return s;
  }

  /* 边界说明里的来源清单完全由数据集动态生成（Yahoo / GitHub 都可能出现），不写死单一来源 */
  function sourcesSentence() {
    var datasets = LQ.site.datasets();
    if (!datasets.length) return '外部真实数据源（详情见下方数据集卡片）';
    var groups = {};
    var order = [];
    datasets.forEach(function (dataset) {
      var key = String(dataset.source || dataset.sourceUrl || '未知来源');
      if (!groups[key]) { groups[key] = { source: key, items: [] }; order.push(key); }
      var label = (dataset.symbol || '') + ' ' + (dataset.timeframeLabel || dataset.interval || '');
      groups[key].items.push(label.trim());
    });
    return order.map(function (key) {
      var group = groups[key];
      return group.items.join(' / ') + '：' + sourceShortName(group.source);
    }).join('；');
  }

  function boundaryHTML() {
    var detail = 'K 线与成交量：真实历史 OHLCV，来源 ' + sourcesSentence() + '（已剔除缺失数据）。Delta、CVD、足迹、成交量分布的内部成交结构：教学估算，由真实 K 线合成，并非真实逐笔订单流。';
    return '<div class="real-boundary" data-real-boundary>' +
      '<div class="real-boundary-icon">' + LQ.ui.icon('warn', 'icon-lg') + '</div>' +
      '<div><b>' + esc('数据边界说明（务必先读）') + '</b>' +
      '<p class="mb-0">' + esc(detail) + '</p></div>' +
      '</div>';
  }

  function realLessonsHTML() {
    var lessons = LQ.site.moduleLessons('m09');
    if (!lessons.length) return '';
    return '<section class="panel">' +
      '<div class="panel-title">' + LQ.ui.icon('book') + '真实案例课程（' + lessons.length + ' 课）</div>' +
      '<div class="lesson-cards">' + lessons.map(function (lesson) {
        return '<a class="lesson-card" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' +
          '<span class="lesson-card-num">' + esc(String(lesson.id).slice(-2)) + '</span>' +
          '<span class="lesson-card-main">' +
          '<span class="lesson-card-title">' + esc(lesson.title) + '</span>' +
          '<span class="lesson-card-summary">' + esc(lesson.summary || '') + '</span>' +
          '</span>' +
          '<span class="lesson-card-side">' + LQ.ui.icon('chevron-right') + '</span></a>';
      }).join('') + '</div>' +
      '</section>';
  }

  LQ.pages.real = {
    title: '真实案例库',
    render: function () {
      var page = document.createElement('div');
      page.className = 'page real-page';
      var state = { chart: null, cleanup: null, scenarioId: null };

      var datasets = LQ.site.datasets();
      var scenarios = LQ.site.realScenarios();

      function destroyPreview() {
        if (state.cleanup) { try { state.cleanup(); } catch (err) { /* ignore */ } state.cleanup = null; }
        if (state.chart && typeof state.chart.destroy === 'function') {
          try { state.chart.destroy(); } catch (err) { /* ignore */ }
        }
        state.chart = null;
      }

      function previewHTML(scenario) {
        var dataset = scenario.dataset ? LQ.site.dataset(scenario.dataset) : null;
        var meta = [scenario.id, (dataset && dataset.symbol) || scenario.symbol, scenario.timeframe, (dataset && dataset.range) || '']
          .filter(Boolean).join(' · ');
        return '<div class="real-preview-head">' +
          '<div><div class="real-preview-title">' + esc(scenario.title || scenario.id) + '</div>' +
          '<p class="scenario-preview-sub">' + esc(meta) + '</p></div>' +
          '<div class="flex gap-8 items-center flex-wrap">' +
          LQ.ui.dataBadge(scenario) +
          (dataset && dataset.sourceUrl ? '<a class="btn btn-ghost btn-sm" href="' + esc(dataset.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + LQ.ui.icon('external') + '数据来源' + '</a>' : '') +
          '<button type="button" class="btn btn-ghost btn-sm" data-real-close>' + LQ.ui.icon('close') + '关闭预览</button>' +
          '</div></div>' +
          '<div class="real-preview-chart" data-real-chart></div>' +
          (scenario.dataNote ? '<p class="real-note real-preview-note">' + esc(scenario.dataNote) + '</p>' : '');
      }

      function setPreview(scenarioId) {
        var scenario = LQ.site.scenario(scenarioId);
        var preview = page.querySelector('[data-real-preview]');
        if (!scenario || !preview) {
          LQ.ui.toast('情景尚未加载：' + scenarioId, 'bad');
          return;
        }
        destroyPreview();
        state.scenarioId = scenarioId;
        preview.hidden = false;
        preview.innerHTML = previewHTML(scenario);
        var slot = preview.querySelector('[data-real-chart]');
        if (!slot) return;
        if (!LQ.site.chromeOK()) {
          slot.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('chart') +
            '<div class="chart-fallback-title">图表引擎尚未加载</div>' +
            '<div class="chart-fallback-text">' + esc('assets/js/chart/*.js 就绪后即可预览真实 K 线。') + '</div></div>';
          return;
        }
        try {
          var annotations = [];
          if (scenario.events) {
            Object.keys(scenario.events).forEach(function (key) { annotations.push(key); });
          }
          state.chart = LQ.chart.create(slot, {
            scenario: scenario,
            height: chartHeight(),
            annotations: annotations,
            interactive: true
          });
          if (state.chart && LQ.ui.attachChartRepaintGuard) {
            state.cleanup = LQ.ui.attachChartRepaintGuard(state.chart, slot);
          }
        } catch (err) {
          slot.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('warn') +
            '<div class="chart-fallback-title">图表渲染出错</div>' +
            '<div class="chart-fallback-text">' + esc(err && err.message ? err.message : String(err)) + '</div></div>';
          if (LQ.errors) LQ.errors.push('真实案例图表渲染失败: ' + (err && err.message ? err.message : err));
        }
        Array.prototype.forEach.call(page.querySelectorAll('[data-real-scenario]'), function (card) {
          card.classList.toggle('is-active', card.getAttribute('data-real-scenario') === scenarioId);
        });
        try { preview.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* ignore */ }
      }

      var dataSection;
      if (!datasets.length && !scenarios.length) {
        dataSection = LQ.ui.noticeHTML('真实数据尚未加载：assets/js/data/real/nq-gc.js 由 Lead 提供（真实历史 OHLCV，来源见数据集注册信息），加载后这里会显示数据集与真实情景。', 'warn', 'warn') +
          LQ.ui.emptyHTML('还没有真实数据', '真实案例数据文件就绪后刷新页面即可查看；课程内容不受影响。');
      } else {
        dataSection = '<div class="real-datasets">' + (datasets.length
          ? datasets.map(datasetCardHTML).join('')
          : LQ.ui.emptyHTML('数据集尚未加载', '真实情景可预览，但数据集元信息（来源/范围）尚未注册。')) + '</div>';
      }

      var scenarioSection = scenarios.length
        ? '<div class="real-preview" data-real-preview hidden></div>' +
          '<div class="real-scenario-cards">' + scenarios.map(scenarioCardHTML).join('') + '</div>'
        : (datasets.length ? LQ.ui.emptyHTML('真实情景尚未注册', '数据集已就绪，但还没有 module=real 的共享情景；内容脚本加载后会出现。') : '');

      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('真实案例库') + '</div>' +
        '<h1 class="page-title">' + esc('在真实 NQ / GC 行情上练习判断') + '</h1>' +
        '<p class="page-lead">' + esc('这里使用真实历史 OHLCV 而不是模拟数据（各数据集的来源、周期与时间范围见下方卡片）。先读边界说明，再点开真实情景，用学过的结构、订单流与拍卖框架独立判断。') + '</p>' +
        '</div>' +
        boundaryHTML() +
        '<section class="real-section">' +
        '<div class="section-head"><h2>' + LQ.ui.icon('chart') + ' 数据集</h2>' +
        '<span class="text-xs dim">' + esc(datasets.length + ' 个数据集 · ' + scenarios.length + ' 个真实情景') + '</span></div>' +
        dataSection +
        '</section>' +
        (scenarioSection ? '<section class="real-section">' +
          '<div class="section-head"><h2>' + LQ.ui.icon('layers') + ' 真实情景预览</h2>' +
          '<span class="text-xs dim">' + esc('点击卡片预览；可滚轮缩放、拖拽平移') + '</span></div>' +
          scenarioSection +
          '</section>' : '') +
        realLessonsHTML() +
        '<section class="panel mt-24">' +
        '<div class="panel-title">' + LQ.ui.icon('bulb') + '怎么用真实案例练习' +
        '</div><ul class="text-sm muted mb-0">' +
        '<li>' + esc('先不打开标注，自己用结构（HH/HL、BOS）与价值区（POC/VAH/VAL）描述这段行情。') + '</li>' +
        '<li>' + esc('再打开 m09 课程对照讲解，检查自己的判断漏掉了什么。') + '</li>' +
        '<li>' + esc('真实数据里没有标准答案；重点是写出依据、失效条件和数据来源，而不是猜方向。') + '</li>' +
        '<li>' + esc('Delta / 足迹是教学估算：可以练习读法，但不要把它当成真实逐笔证据。') + '</li>' +
        '</ul></section>';

      page.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var card = target.closest('[data-real-scenario]');
        if (card) { setPreview(card.getAttribute('data-real-scenario')); return; }
        var closeBtn = target.closest('[data-real-close]');
        if (closeBtn) {
          destroyPreview();
          var preview = page.querySelector('[data-real-preview]');
          if (preview) { preview.hidden = true; preview.innerHTML = ''; }
          state.scenarioId = null;
          Array.prototype.forEach.call(page.querySelectorAll('[data-real-scenario]'), function (el) { el.classList.remove('is-active'); });
        }
      });

      page.__lqDestroy = function () { destroyPreview(); };
      return page;
    },
    destroy: function () {
      var main = document.getElementById('main-content');
      var page = main ? main.querySelector('.real-page') : null;
      if (page && typeof page.__lqDestroy === 'function') {
        try { page.__lqDestroy(); } catch (err) { /* ignore */ }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
