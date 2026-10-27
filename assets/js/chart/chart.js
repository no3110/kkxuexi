/* ==========================================================================
 * 图表引擎 · 对外唯一入口（chart-engineer 维护）
 *   var chart = LQ.chart.create(container, options)
 *   options: { scenario, height, annotations, viewport, interactive, compact,
 *              tools, autoSwings, drawings, onDrawingChange }   // V2 新增
 *   chart.setAnnotations / setViewport / resetViewport / resize / destroy /
 *         getScenario / el
 *   V2：chart.getDrawings() / setDrawings(list) / clearDrawings() /
 *         setToolsEnabled(bool) / setAutoSwings(bool) / getProfileStats(input)
 *   另提供只读工具：LQ.chart.getProfileStats(input, scenarioOrBars)
 * 冻结 API 见 CONTRACT.md 3.6 与 CONTRACT-V2.md 3 节；异常全部内部消化。
 * ========================================================================== */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var C = LQ.chart = LQ.chart || {};

  C.VERSION = '2.0.0';

  function noop() { }

  function makeFallback(container, message) {
    var doc = global.document;
    var el = doc ? doc.createElement('div') : null;
    if (el) {
      el.className = 'lq-chart lq-chart--error';
      el.style.cssText = [
        'position:relative', 'display:flex', 'align-items:center', 'justify-content:center',
        'width:100%', 'min-height:180px', 'height:240px', 'box-sizing:border-box',
        'background:#0b0f16', 'border:1px dashed rgba(240,185,11,0.45)', 'border-radius:10px',
        'color:#ffd666',
        'font-family:"Segoe UI","Microsoft YaHei","PingFang SC",-apple-system,Arial,sans-serif',
        'font-size:12px', 'text-align:center', 'padding:16px', 'white-space:normal'
      ].join(';');
      el.textContent = message || '图表组件加载失败';
      if (container && typeof container.appendChild === 'function') container.appendChild(el);
    }
    var safe = {
      el: el,
      setAnnotations: noop,
      setViewport: noop,
      resetViewport: noop,
      resize: noop,
      destroy: function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
        el = null;
      },
      getScenario: function () { return null; },
      getDrawings: function () { return []; },
      getSelection: function () { return null; },
      removeSelectedDrawing: function () { return false; },
      setDrawings: noop,
      clearDrawings: noop,
      setToolsEnabled: noop,
      setAutoSwings: noop,
      getProfileStats: function () { return null; }
    };
    return safe;
  }

  /* 只读统计工具：LQ.chart.getProfileStats({x1,x2,bins,vaPercent}, scenarioOrBars)
   * - 第一个参数也可以是 vprofile / vpline 标注对象（自动取 x1/x2/bins）
   * - 第二个参数支持：情景对象 / 情景 id / bars 数组；省略时尝试 input.scenario */
  C.getProfileStats = function (input, source) {
    if (!C.indicators || typeof C.indicators.profileStats !== 'function') return null;
    var opts = input || {};
    var range = opts;
    if (opts.kind === 'vprofile' || opts.kind === 'vpline') {
      range = opts.kind === 'vpline' ? (opts.range || opts) : opts;
    }
    var bars = null;
    if (Array.isArray(source)) bars = source;
    else if (source && Array.isArray(source.bars)) bars = source.bars;
    else if (typeof source === 'string' && LQ.data && typeof LQ.data.getScenario === 'function') {
      var sc = LQ.data.getScenario(source);
      if (sc) bars = sc.bars;
    } else if (opts.scenario && LQ.data && typeof LQ.data.getScenario === 'function') {
      var sc2 = LQ.data.getScenario(opts.scenario);
      if (sc2) bars = sc2.bars;
    }
    if (!bars) return null;
    return C.indicators.profileStats(bars, {
      x1: range.x1,
      x2: range.x2,
      bins: range.bins === undefined ? opts.bins : range.bins,
      vaPercent: range.vaPercent === undefined ? opts.vaPercent : range.vaPercent
    });
  };

  /**
   * 创建图表实例。
   * @param {HTMLElement} container 挂载容器（宽度随容器；高度由 options.height / 默认 420 决定）
   * @param {Object} options 见 CONTRACT.md 3.6 / CONTRACT-V2.md 3 节
   */
  C.create = function (container, options) {
    var opts = options || {};
    if (!C.Engine) {
      C.error('图表核心 engine.js 未加载，返回空占位');
      return makeFallback(container, '图表核心脚本未加载（engine.js）');
    }
    var engine;
    try {
      engine = new C.Engine(container, opts);
      engine.mount();
    } catch (err) {
      C.error('图表初始化失败，已降级为占位符', err);
      try { if (engine) engine.destroy(); } catch (e2) { /* noop */ }
      return makeFallback(container, '图表初始化失败：' + (err && err.message ? err.message : '未知错误'));
    }
    var api = {
      el: engine.wrapper,
      setAnnotations: function (list) { engine.setAnnotations(list); return api; },
      setViewport: function (vp) { engine.setViewport(vp); return api; },
      resetViewport: function () { engine.resetViewport(); return api; },
      resize: function () { engine.resize(); return api; },
      destroy: function () { engine.destroy(); },
      getScenario: function () { return engine.getScenario(); },
      /* ---- V2 ---- */
      getDrawings: function () { return engine.getDrawings(); },
      getSelection: function () { return engine.selection ? JSON.parse(JSON.stringify(engine.selection)) : null; },
      removeSelectedDrawing: function () { return engine.removeSelectedDrawing(); },
      setDrawings: function (list) { engine.setDrawings(list); return api; },
      clearDrawings: function () { engine.clearDrawings(); return api; },
      setToolsEnabled: function (enabled) { engine.setToolsEnabled(enabled); return api; },
      setAutoSwings: function (enabled) { engine.setAutoSwings(enabled); return api; },
      getProfileStats: function (input) { return engine.getProfileStats(input); }
    };
    return api;
  };
})(typeof window !== 'undefined' ? window : globalThis);
