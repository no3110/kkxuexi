/* 工具页（site-engineer 维护）
 * ① 情景图表库（遍历 LQ.data.listScenarios()，点击预览，LQ.chart 缺失时降级）
 * ② 仓位 / R 倍数计算器
 * ③ ATR 止损计算器
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function parseNum(value) {
    if (value === null || value === undefined) return NaN;
    var text = String(value).replace(/,/g, '').trim();
    if (!text) return NaN;
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text)) return NaN;
    var n = Number(text);
    return isFinite(n) ? n : NaN;
  }

  function fmt(n, digits) {
    if (!isFinite(n)) return '—';
    return LQ.util.formatNum(n, digits === undefined ? 2 : digits);
  }

  function hasChartEngine() { return LQ.site.chromeOK(); }

  /* ============================ 情景图表库 ============================ */

  function scenarioGroups() {
    var scenarios = [];
    try { scenarios = LQ.data && LQ.data.listScenarios ? LQ.data.listScenarios() : []; } catch (err) { scenarios = []; }
    var groups = {};
    scenarios.forEach(function (scenario) {
      var key = scenario.module || 'demo';
      if (!groups[key]) groups[key] = [];
      groups[key].push(scenario);
    });
    var order = LQ.catalog.moduleOrder.slice();
    var keys = Object.keys(groups).sort(function (a, b) {
      var ai = order.indexOf(a), bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a < b ? -1 : 1;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return keys.map(function (key) {
      var mod = LQ.site.module(key);
      return {
        key: key,
        title: key === 'demo' ? '示例情景（图表引擎 / 标注示例）' : ((mod && mod.title) || key),
        stageName: key === 'demo' ? '不挂在课程里，供调试与参考' : ((mod && mod.stageName) || ''),
        scenarios: groups[key]
      };
    });
  }

  function scenarioCardHTML(scenario) {
    var panels = [];
    var p = scenario.panels || {};
    ['volume', 'delta', 'cvd', 'footprint', 'profile', 'ladder', 'atr'].forEach(function (name) {
      if (p[name]) panels.push(name);
    });
    if (Array.isArray(p.ma) && p.ma.length) panels.push('ma' + p.ma.join('/'));
    var bars = scenario.bars ? scenario.bars.length : 0;
    return '<button type="button" class="scenario-card" data-scenario-card="' + esc(scenario.id) + '">' +
      '<span class="scenario-title">' + esc(scenario.title || scenario.id) + '</span>' +
      '<span class="scenario-id">' + esc(scenario.id) + '</span>' +
      '<span class="scenario-meta">' +
      '<span class="badge badge-muted">' + esc(bars + ' 根') + '</span>' +
      '<span class="badge badge-muted">' + esc((scenario.symbol || '') + ' · ' + (scenario.timeframe || '')) + '</span>' +
      (panels.length ? '<span class="badge badge-info">' + esc(panels.join(' / ')) + '</span>' : '') +
      LQ.ui.dataBadge(scenario) +
      '</span>' +
      '<span class="scenario-desc">' + esc(scenario.description || '') + '</span>' +
      '</button>';
  }

  function libraryHTML() {
    var groups = scenarioGroups();
    if (!groups.length) {
      return LQ.ui.emptyHTML('情景库为空', '情景数据由内容脚本注册，可能尚未加载。刷新页面后再试。');
    }
    var html = '<div class="scenario-preview" data-scenario-preview hidden></div>' +
      '<div class="notice"><div>' + esc('模拟情景为教学数据（固定随机种子生成）；标注「真实数据」的情景来自外部真实数据源（具体来源见卡片徽标），Delta / 足迹为教学估算。图可滚轮缩放、拖拽平移、双击复位。点击任意情景卡片即可在这里预览。') + '</div></div>';
    groups.forEach(function (group) {
      html += '<section class="scenario-group">' +
        '<div class="scenario-group-head"><h3>' + esc(group.title) + '</h3>' +
        '<span class="text-xs dim">' + esc(group.stageName + ' · ' + group.scenarios.length + ' 个情景') + '</span></div>' +
        '<div class="scenario-cards">' + group.scenarios.map(scenarioCardHTML).join('') + '</div>' +
        '</section>';
    });
    return html;
  }

  function previewChartHeight() {
    var w = global.innerWidth || 1200;
    if (w <= 640) return 360;
    if (w <= 900) return 400;
    return 480;
  }

  function previewHTML(scenario) {
    var mod = LQ.site.module(scenario.module);
    var panels = scenario.panels || {};
    var panelNames = [];
    ['volume', 'delta', 'cvd', 'footprint', 'profile', 'ladder', 'atr'].forEach(function (name) { if (panels[name]) panelNames.push(name); });
    if (Array.isArray(panels.ma) && panels.ma.length) panelNames.push('MA' + panels.ma.join('/'));
    var lessonLink = '';
    if (scenario.lesson) {
      var lesson = LQ.site.lesson(scenario.lesson);
      if (lesson) lessonLink = '<a class="btn btn-ghost btn-sm" href="#/lesson/' + encodeURIComponent(scenario.lesson) + '">' + LQ.ui.icon('book') + '所属课程：' + esc(lesson.title) + '</a>';
    }
    return '<div class="scenario-preview-head">' +
      '<div><div class="scenario-preview-title">' + esc(scenario.title || scenario.id) + '</div>' +
      '<p class="scenario-preview-sub">' + esc([scenario.id, scenario.symbol, scenario.timeframe, (scenario.bars ? scenario.bars.length : 0) + ' 根 K 线', (mod && mod.title) || scenario.module || ''].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="flex gap-8 items-center flex-wrap">' +
      LQ.ui.dataBadge(scenario) +
      lessonLink +
      (panelNames.length ? '<span class="badge badge-info">' + esc(panelNames.join(' / ')) + '</span>' : '') +
      '<button type="button" class="btn btn-ghost btn-sm" data-preview-close>' + LQ.ui.icon('close') + '关闭预览</button>' +
      '</div></div>' +
      '<div class="scenario-preview-body"><div class="chart-canvas" data-preview-canvas></div></div>' +
      (scenario.description ? '<p class="scenario-desc">' + esc(scenario.description) + '</p>' : '');
  }

  /* ============================ 计算器 ============================ */

  function fieldHTML(opts) {
    return '<div class="calc-field' + (opts.full ? ' is-full' : '') + '">' +
      '<label class="calc-label" for="' + esc(opts.id) + '">' + esc(opts.label) +
      (opts.unit ? '<span class="unit">' + esc(opts.unit) + '</span>' : '') + '</label>' +
      (opts.textarea ? '' : '<input class="calc-input" id="' + esc(opts.id) + '" data-field="' + esc(opts.field) + '" type="text" inputmode="decimal" autocomplete="off" placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value === undefined ? '' : opts.value) + '">') +
      '<span class="calc-field-err" data-err="' + esc(opts.field) + '"></span>' +
      '</div>';
  }

  function resultRowHTML(key, label, primary, hint) {
    return '<div class="calc-result-row' + (primary ? ' is-primary' : '') + '">' +
      '<span>' + esc(label) + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</span>' +
      '<b data-result="' + esc(key) + '">—</b></div>';
  }

  function positionCalcHTML() {
    return '<div class="calc-card" data-calc="position">' +
      '<div class="calc-head"><div class="calc-icon">' + LQ.ui.icon('target') + '</div>' +
      '<div><h3>仓位 / R 倍数计算器</h3><p>先定风险，再定仓位；用 R 倍数统一衡量每一笔交易。</p></div></div>' +
      '<div class="calc-fields">' +
      fieldHTML({ id: 'pos-account', field: 'account', label: '账户资金', unit: 'USD', placeholder: '10000', value: '10000' }) +
      fieldHTML({ id: 'pos-risk', field: 'riskPct', label: '单笔风险', unit: '%', placeholder: '1', value: '1' }) +
      fieldHTML({ id: 'pos-entry', field: 'entry', label: '入场价', placeholder: '例如 100.50' }) +
      fieldHTML({ id: 'pos-stop', field: 'stop', label: '止损价', placeholder: '例如 99.20' }) +
      fieldHTML({ id: 'pos-target', field: 'target', label: '目标价（可选）', placeholder: '例如 103.10', full: true }) +
      '</div>' +
      '<div class="calc-actions"><button type="button" class="btn btn-primary" data-calc-run="position">' + LQ.ui.icon('check-circle') + '计算</button>' +
      '<button type="button" class="btn btn-ghost" data-calc-reset="position">' + LQ.ui.icon('reset') + '重置</button></div>' +
      '<div class="calc-error hidden" data-calc-error="position"></div>' +
      '<div class="calc-results">' +
      resultRowHTML('riskAmount', '风险金额（最多亏）', true) +
      resultRowHTML('stopDistance', '止损距离（价）') +
      resultRowHTML('stopPct', '止损距离占比') +
      resultRowHTML('size', '建议仓位（单位）', true, '风险金额 ÷ 止损距离') +
      resultRowHTML('notional', '名义价值') +
      resultRowHTML('rMultiple', '目标 R 倍数', false, '目标距离 ÷ 止损距离') +
      '</div>' +
      '<div class="calc-formula">' + esc('公式：风险金额 = 账户 × 风险%；仓位 = 风险金额 ÷ |入场价 − 止损价|；R 倍数 = |目标价 − 入场价| ÷ |入场价 − 止损价|。') + '</div>' +
      '</div>';
  }

  function atrCalcHTML() {
    return '<div class="calc-card" data-calc="atr">' +
      '<div class="calc-head"><div class="calc-icon">' + LQ.ui.icon('shield') + '</div>' +
      '<div><h3>ATR 止损计算器</h3><p>用波动率定止损距离，避免止损被正常波动打掉。</p></div></div>' +
      '<div class="calc-fields">' +
      fieldHTML({ id: 'atr-atr', field: 'atr', label: 'ATR 值', unit: '价格单位', placeholder: '例如 1.25' }) +
      fieldHTML({ id: 'atr-mult', field: 'mult', label: 'ATR 倍数', placeholder: '2', value: '2' }) +
      fieldHTML({ id: 'atr-entry', field: 'entry', label: '入场价', placeholder: '例如 100.50' }) +
      '<div class="calc-field"><label class="calc-label" for="atr-direction">方向</label>' +
      '<select class="calc-select" id="atr-direction" data-field="direction">' +
      '<option value="long">做多（止损在下方）</option><option value="short">做空（止损在上方）</option>' +
      '</select><span class="calc-field-err" data-err="direction"></span></div>' +
      '</div>' +
      '<div class="calc-actions"><button type="button" class="btn btn-primary" data-calc-run="atr">' + LQ.ui.icon('check-circle') + '计算</button>' +
      '<button type="button" class="btn btn-ghost" data-calc-reset="atr">' + LQ.ui.icon('reset') + '重置</button></div>' +
      '<div class="calc-error hidden" data-calc-error="atr"></div>' +
      '<div class="calc-results">' +
      resultRowHTML('stop', '建议止损价', true) +
      resultRowHTML('distance', '止损距离（价）') +
      resultRowHTML('stopPct', '止损距离占比') +
      '</div>' +
      '<div class="calc-formula">' + esc('公式：止损距离 = ATR × 倍数；多头止损 = 入场价 − 距离，空头止损 = 入场价 + 距离。ATR 的周期与倍数要在计划里写死，不要临时改。') + '</div>' +
      '</div>';
  }

  /* ============================ 绑定 ============================ */

  function setErr(page, field, message) {
    var err = page.querySelector('[data-err="' + field + '"]');
    if (err) err.textContent = message || '';
    var input = page.querySelector('[data-field="' + field + '"]');
    if (input) input.classList.toggle('is-error', !!message);
  }

  function setCalcError(page, which, message) {
    var box = page.querySelector('[data-calc-error="' + which + '"]');
    if (!box) return;
    if (message) {
      box.textContent = message;
      box.classList.remove('hidden');
    } else {
      box.textContent = '';
      box.classList.add('hidden');
    }
  }

  function setResults(page, which, values) {
    var card = page.querySelector('[data-calc="' + which + '"]');
    if (!card) return;
    card.querySelectorAll('[data-result]').forEach(function (node) {
      var key = node.getAttribute('data-result');
      node.textContent = values[key] !== undefined ? values[key] : '—';
    });
  }

  function readField(page, which, field) {
    var card = page.querySelector('[data-calc="' + which + '"]');
    var input = card ? card.querySelector('[data-field="' + field + '"]') : null;
    if (!input) return '';
    return input.value;
  }

  function resetCalc(page, which) {
    var card = page.querySelector('[data-calc="' + which + '"]');
    if (!card) return;
    if (which === 'position') {
      card.querySelector('[data-field="account"]').value = '10000';
      card.querySelector('[data-field="riskPct"]').value = '1';
      card.querySelector('[data-field="entry"]').value = '';
      card.querySelector('[data-field="stop"]').value = '';
      card.querySelector('[data-field="target"]').value = '';
    } else {
      card.querySelector('[data-field="atr"]').value = '';
      card.querySelector('[data-field="mult"]').value = '2';
      card.querySelector('[data-field="entry"]').value = '';
      card.querySelector('[data-field="direction"]').value = 'long';
    }
    ['account', 'riskPct', 'entry', 'stop', 'target', 'atr', 'mult', 'direction'].forEach(function (field) {
      setErr(page, field, '');
    });
    setCalcError(page, which, '');
    setResults(page, which, {});
  }

  function computePosition(page) {
    var account = parseNum(readField(page, 'position', 'account'));
    var riskPct = parseNum(readField(page, 'position', 'riskPct'));
    var entry = parseNum(readField(page, 'position', 'entry'));
    var stop = parseNum(readField(page, 'position', 'stop'));
    var target = parseNum(readField(page, 'position', 'target'));
    var errors = {};

    ['account', 'riskPct', 'entry', 'stop'].forEach(function (field) { setErr(page, field, ''); });
    if (!isFinite(account) || account <= 0) errors.account = '请输入大于 0 的账户资金';
    if (!isFinite(riskPct) || riskPct <= 0) errors.riskPct = '风险 % 必须大于 0';
    else if (riskPct > 100) errors.riskPct = '风险 % 不能超过 100';
    if (!isFinite(entry) || entry <= 0) errors.entry = '请输入大于 0 的入场价';
    if (!isFinite(stop) || stop <= 0) errors.stop = '请输入大于 0 的止损价';
    else if (isFinite(entry) && entry > 0 && Math.abs(entry - stop) < 1e-12) errors.stop = '止损价不能等于入场价（除零）';
    var targetProvided = readField(page, 'position', 'target').trim() !== '';
    if (targetProvided) {
      if (!isFinite(target) || target <= 0) errors.target = '目标价必须大于 0，或留空';
      else if (isFinite(entry) && entry > 0 && Math.abs(target - entry) < 1e-12) errors.target = '目标价不能等于入场价';
    }
    Object.keys(errors).forEach(function (field) { setErr(page, field, errors[field]); });
    if (Object.keys(errors).length) {
      setCalcError(page, 'position', '请检查输入：' + Object.keys(errors).map(function (f) { return errors[f]; }).join('；') + '。');
      setResults(page, 'position', {});
      return;
    }
    setCalcError(page, 'position', '');

    var riskAmount = account * riskPct / 100;
    var stopDistance = Math.abs(entry - stop);
    var size = riskAmount / stopDistance;
    var notional = size * entry;
    var stopPct = stopDistance / entry * 100;
    var rMultiple = targetProvided ? Math.abs(target - entry) / stopDistance : NaN;
    var directionText = targetProvided
      ? (Math.abs(target - entry) < 1e-12 ? '' : ((target > entry) === (entry > stop) ? '顺势' : '逆势/反转'))
      : '';

    setResults(page, 'position', {
      riskAmount: '$' + fmt(riskAmount, 2),
      stopDistance: fmt(stopDistance, 4),
      stopPct: fmt(stopPct, 2) + '%',
      size: fmt(size, 2),
      notional: '$' + fmt(notional, 2),
      rMultiple: isFinite(rMultiple) ? fmt(rMultiple, 2) + ' R' + (directionText ? '（' + directionText + '）' : '') : '—'
    });
  }

  function computeATR(page) {
    var atr = parseNum(readField(page, 'atr', 'atr'));
    var mult = parseNum(readField(page, 'atr', 'mult'));
    var entry = parseNum(readField(page, 'atr', 'entry'));
    var directionInput = page.querySelector('[data-calc="atr"] [data-field="direction"]');
    var direction = directionInput ? directionInput.value : 'long';
    var errors = {};

    ['atr', 'mult', 'entry'].forEach(function (field) { setErr(page, field, ''); });
    if (!isFinite(atr) || atr <= 0) errors.atr = 'ATR 必须大于 0';
    if (!isFinite(mult) || mult <= 0) errors.mult = 'ATR 倍数必须大于 0';
    if (!isFinite(entry) || entry <= 0) errors.entry = '请输入大于 0 的入场价';
    var distance = (isFinite(atr) && isFinite(mult)) ? atr * mult : NaN;
    var stop = NaN;
    if (isFinite(distance) && isFinite(entry)) {
      stop = direction === 'long' ? entry - distance : entry + distance;
      if (direction === 'long' && stop <= 0) errors.atr = 'ATR × 倍数 超过入场价，无法做多止损，请检查输入';
      if (direction === 'short' && stop <= 0) errors.atr = '计算出的止损价 ≤ 0，请检查输入';
    }
    Object.keys(errors).forEach(function (field) { setErr(page, field, errors[field]); });
    if (Object.keys(errors).length) {
      setCalcError(page, 'atr', '请检查输入：' + Object.keys(errors).map(function (f) { return errors[f]; }).join('；') + '。');
      setResults(page, 'atr', {});
      return;
    }
    setCalcError(page, 'atr', '');
    var stopPct = Math.abs(stop - entry) / entry * 100;
    setResults(page, 'atr', {
      stop: fmt(stop, 4),
      distance: fmt(distance, 4),
      stopPct: fmt(stopPct, 2) + '%'
    });
  }

  function bindCalculators(page) {
    page.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var run = target.closest('[data-calc-run]');
      if (run) {
        var which = run.getAttribute('data-calc-run');
        if (which === 'position') computePosition(page);
        else computeATR(page);
        return;
      }
      var reset = target.closest('[data-calc-reset]');
      if (reset) {
        resetCalc(page, reset.getAttribute('data-calc-reset'));
      }
    });
    page.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || !target.getAttribute) return;
      var field = target.getAttribute('data-field');
      if (!field) return;
      var card = target.closest ? target.closest('[data-calc]') : null;
      if (!card) return;
      var which = card.getAttribute('data-calc');
      if (which === 'position') computePosition(page);
      else computeATR(page);
    });
    page.addEventListener('change', function (event) {
      var target = event.target;
      if (target && target.getAttribute && target.getAttribute('data-field') === 'direction') computeATR(page);
    });
    // 初始计算一次（默认值有账户/风险/倍数时给出空结果提示）
    computePosition(page);
    computeATR(page);
  }

  /* ============================ 页面 ============================ */

  LQ.pages.tools = {
    title: '训练工具',
    render: function (ctx) {
      var page = document.createElement('div');
      page.className = 'page tools-page';
      var state = { chart: null, scenarioId: null };

      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('训练工具') + '</div>' +
        '<h1 class="page-title">' + esc('看图、算仓位、定止损') + '</h1>' +
        '<p class="page-lead">' + esc('三个最常用的训练工具：浏览全部教学情景图、按风险反推仓位、用 ATR 定止损。计算器只做数学，不判断方向。') + '</p>' +
        '</div>' +
        '<div class="tool-tabs" role="tablist" aria-label="工具选择">' +
        '<button type="button" class="tool-tab" role="tab" data-tab="scenarios" aria-selected="true">' + LQ.ui.icon('chart') + '情景图表库</button>' +
        '<button type="button" class="tool-tab" role="tab" data-tab="position" aria-selected="false">' + LQ.ui.icon('target') + '仓位 / R 倍数</button>' +
        '<button type="button" class="tool-tab" role="tab" data-tab="atr" aria-selected="false">' + LQ.ui.icon('shield') + 'ATR 止损</button>' +
        '</div>' +
        '<div class="tool-panel" data-panel="scenarios">' + libraryHTML() + '</div>' +
        '<div class="tool-panel hidden" data-panel="position"><div class="calc-grid">' + positionCalcHTML() +
        '<div class="calc-card"><div class="calc-head"><div class="calc-icon">' + LQ.ui.icon('bulb') + '</div>' +
        '<div><h3>怎么用这两个数字</h3><p>先算风险，再看仓位。</p></div></div>' +
        '<ul class="text-sm muted mb-0">' +
        '<li>' + esc('先把「单笔风险」固定为账户的 1%（新手建议 0.5%）。') + '</li>' +
        '<li>' + esc('止损距离由结构或 ATR 决定，不是由想下多少手决定。') + '</li>' +
        '<li>' + esc('R 倍数是统一衡量标准：赚 2R 就是赚 2 倍风险。') + '</li>' +
        '<li>' + esc('目标 R 小于 1.5 的交易，长期很难覆盖成本与错误率。') + '</li>' +
        '<li>' + esc('这里的仓位是理论值，实际下单要按最小下单单位取整。') + '</li>' +
        '</ul></div></div>' +
        '</div>' +
        '<div class="tool-panel hidden" data-panel="atr"><div class="calc-grid">' + atrCalcHTML() +
        '<div class="calc-card"><div class="calc-head"><div class="calc-icon">' + LQ.ui.icon('bulb') + '</div>' +
        '<div><h3>ATR 止损要点</h3><p>止损要放在正常波动之外。</p></div></div>' +
        '<ul class="text-sm muted mb-0">' +
        '<li>' + esc('ATR 用真实波幅衡量波动率，周期常用 14。') + '</li>' +
        '<li>' + esc('止损距离太小会被噪声打掉，太大会让仓位变得很小。常用 1.5-2.5 倍 ATR。') + '</li>' +
        '<li>' + esc('顺势时可以用「ATR 移动止损」：每创新高/新低就把止损推进一次。') + '</li>' +
        '<li>' + esc('ATR 只看波动，不看结构；关键位处的止损通常比纯 ATR 更可靠。') + '</li>' +
        '</ul></div></div>' +
        '</div>';

      function destroyPreview() {
        if (state.repaintCleanup) {
          try { state.repaintCleanup(); } catch (err) { /* ignore */ }
          state.repaintCleanup = null;
        }
        if (state.chart && typeof state.chart.destroy === 'function') {
          try { state.chart.destroy(); } catch (err) { /* ignore */ }
        }
        state.chart = null;
      }

      function setPreview(scenarioId) {
        var preview = page.querySelector('[data-scenario-preview]');
        if (!preview) return;
        var scenario = null;
        try { scenario = LQ.data.getScenario(scenarioId); } catch (err) { scenario = null; }
        if (!scenario) {
          LQ.ui.toast('没有找到情景：' + scenarioId, 'bad');
          return;
        }
        destroyPreview();
        state.scenarioId = scenarioId;
        preview.hidden = false;
        preview.innerHTML = previewHTML(scenario);

        var canvas = preview.querySelector('[data-preview-canvas]');
        if (!canvas) return;
        if (!hasChartEngine()) {
          canvas.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('chart') +
            '<div class="chart-fallback-title">图表引擎尚未加载</div>' +
            '<div class="chart-fallback-text">' + esc('assets/js/chart/*.js 就绪后，这里会显示可缩放的 K 线图。') + '</div></div>';
        } else {
          try {
            state.chart = LQ.chart.create(canvas, {
              scenario: scenario,
              height: previewChartHeight(),
              annotations: Object.keys(scenario.events || {}),
              interactive: true
            });
            // 被遮挡 iframe / 后台标签页里 rAF 会被节流，交互后补一次同步重绘
            if (state.chart && LQ.ui.attachChartRepaintGuard) {
              state.repaintCleanup = LQ.ui.attachChartRepaintGuard(state.chart, preview);
            }
          } catch (err) {
            canvas.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('warn') +
              '<div class="chart-fallback-title">图表渲染出错</div>' +
              '<div class="chart-fallback-text">' + esc(err && err.message ? err.message : String(err)) + '</div></div>';
            if (LQ.errors) LQ.errors.push('工具页图表渲染失败: ' + (err && err.message ? err.message : err));
          }
        }
        Array.prototype.forEach.call(page.querySelectorAll('[data-scenario-card]'), function (card) {
          card.classList.toggle('is-active', card.getAttribute('data-scenario-card') === scenarioId);
        });
        preview.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      function showTab(name) {
        Array.prototype.forEach.call(page.querySelectorAll('.tool-tab'), function (tab) {
          tab.setAttribute('aria-selected', tab.getAttribute('data-tab') === name ? 'true' : 'false');
        });
        Array.prototype.forEach.call(page.querySelectorAll('[data-panel]'), function (panel) {
          panel.classList.toggle('hidden', panel.getAttribute('data-panel') !== name);
        });
        if (state.chart && typeof state.chart.resize === 'function') {
          try { state.chart.resize(); } catch (err) { /* ignore */ }
        }
      }

      page.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var tab = target.closest('[data-tab]');
        if (tab) { showTab(tab.getAttribute('data-tab')); return; }
        var card = target.closest('[data-scenario-card]');
        if (card) { setPreview(card.getAttribute('data-scenario-card')); return; }
        var closeBtn = target.closest('[data-preview-close]');
        if (closeBtn) {
          destroyPreview();
          var preview = page.querySelector('[data-scenario-preview]');
          if (preview) { preview.hidden = true; preview.innerHTML = ''; }
          state.scenarioId = null;
          Array.prototype.forEach.call(page.querySelectorAll('[data-scenario-card]'), function (el) { el.classList.remove('is-active'); });
        }
      });

      bindCalculators(page);

      var requestedScenario = ctx.query && ctx.query.scenario ? ctx.query.scenario : null;
      var requestedTab = ctx.query && ctx.query.tab ? ctx.query.tab : null;
      if (requestedTab && ['scenarios', 'position', 'atr'].indexOf(requestedTab) !== -1) showTab(requestedTab);
      if (requestedScenario) {
        showTab('scenarios');
        setTimeout(function () { if (page.isConnected) setPreview(requestedScenario); }, 0);
      }

      // 图表实例随路由销毁
      page.__lqDestroy = function () { destroyPreview(); };
      return page;
    },
    destroy: function () {
      var main = document.getElementById('main-content');
      var page = main ? main.querySelector('.tools-page') : null;
      if (page && typeof page.__lqDestroy === 'function') {
        try { page.__lqDestroy(); } catch (err) { /* ignore */ }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
