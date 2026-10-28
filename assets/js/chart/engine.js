/* ==========================================================================
 * 图表引擎 · 核心（chart-engineer 维护）
 * 负责：DOM/Canvas 挂载、DPR 自适应、多面板布局、坐标轴与网格、K 线绘制、
 * 视口（缩放/平移/复位）、十字线、交互事件、ResizeObserver、销毁清理。
 * 依赖：LQ.chart.palette / helpers / indicators / overlays / panels（先加载）。
 * ========================================================================== */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var C = LQ.chart = LQ.chart || {};
  var H = C.helpers;
  var P = C.palette;
  var O = C.overlays;
  var PN = C.panels;

  var DEFAULT_HEIGHT = 420;
  var MOBILE_HEIGHT = 360;
  var SMALL_HEIGHT = 350;
  var TOOLBAR_HEIGHT = 48; // V2 画线工具栏高度（chart 内容高度之外）

  var TOOL_DEFS = [
    { tool: 'hline', label: '水平线', title: '点击图表创建水平线' },
    { tool: 'trend', label: '趋势线', title: '拖拽创建趋势线（segment）' },
    { tool: 'fib', label: '斐波', title: '拖拽创建斐波那契回撤/扩展' },
    { tool: 'vprofile', label: '区间VP', title: '拖拽创建固定区间成交量分布' },
    { tool: 'clear', label: '清除', title: '清除全部画线' }
  ];

  function isFn(f) { return typeof f === 'function'; }
  function raf(fn) {
    if (global.requestAnimationFrame) return global.requestAnimationFrame(fn);
    return global.setTimeout(fn, 16);
  }
  function caf(id) {
    if (global.cancelAnimationFrame) { global.cancelAnimationFrame(id); return; }
    global.clearTimeout(id);
  }

  function Engine(container, options) {
    this.options = options || {};
    // 价格轴 / 时间轴拖拽拉伸默认开启；显式传 false 才关闭
    if (this.options.axisScale === undefined) this.options.axisScale = true;
    if (this.options.timeAxisScale === undefined) this.options.timeAxisScale = true;
    this.host = (container && isFn(container.appendChild)) ? container : null;
    this.destroyed = false;

    this.scenario = null;
    this.scenarioError = '';
    this.bars = [];
    this.series = null;
    this.panels = PN.normalizePanels({});
    this.annRaw = null;
    this.anns = [];
    this.view = null;
    this.initialViewport = null;

    this.hover = { active: false, bar: null, x: 0, y: 0, inPlot: false, price: null };
    this.drag = null;
    this.ptrs = {};
    this.pinch = null;
    this.lastTap = null;

    this.wrapper = null;
    this.canvas = null;
    this.ctx = null;
    this.infoBar = null;
    this.infoEls = null;
    this.observer = null;
    this._offs = [];
    this._handlers = {};
    this._raf = null;
    this._rafIsTimeout = false;
    this._dpr = 1;
    this._cssW = 0;
    this._cssH = 0;
    this._autoHeight = 0;
    this._explicitHeight = 0;
    this._layoutError = null;
    this.labels = null;

    this.plot = { x: 0, y: 0, w: 0, h: 0, right: 0, bottom: 0 };
    this.axis = { x: 0, w: 0 };
    this.timeAxis = { y: 0, h: 0 };
    this.panes = [];
    this.paneSizeOverrides = Object.create(null);
    this._paneLayout = [];
    this.paneResizeDrag = null;
    this.axisScaleDrag = null;
    this.timeZoomDrag = null;
    this.priceScaleOverride = null;
    this.axisHits = null;
    this.heightResize = null;
    this.selection = null;
    this.ladderSide = false;
    this.ladderRect = null;
    this.narrow = false;
    this.barW = 4;
    this.trailingBars = 0;
    this.yMin = 0;
    this.yMax = 1;
    this.priceTicks = [];
    this.timeTicks = [];
    this.priceDecimals = 2;

    /* ---- V2：画线工具 / 自动摆动结构 / 成交量分布统计 ---- */
    this.toolsEnabled = !!this.options.tools;
    this.tool = null;                 // 当前激活工具：hline|trend|fib|vprofile
    this.toolbar = null;
    this.toolButtons = {};
    this._toolbarH = 0;
    this._baseH = 0;
    this._toolDraw = null;            // 正在拖拽创建画线的状态
    this.draftRaw = null;
    this.draftAnn = null;
    this.drawings = [];               // 原始 drawing 对象（与标注同构）
    this.drawingAnns = [];            // 解析后的 drawing（用于渲染/计算价格轴）
    this.autoSwingsEnabled = !!this.options.autoSwings;
    this.swings = null;
    this.swingsBars = null;
    this._onDrawingChange = isFn(this.options.onDrawingChange) ? this.options.onDrawingChange : null;
    this._initialDrawings = Array.isArray(this.options.drawings) ? this.options.drawings : null;
  }

  /* ================================================================ *
   * 挂载
   * ================================================================ */
  Engine.prototype.mount = function () {
    this._buildDom();
    this._resolveScenario();
    this._prepareData();
    this._bindEvents();
    this._setupObserver();
    this.resize();
    return this;
  };

  Engine.prototype._buildDom = function () {
    var self = this;
    var doc = global.document;
    if (!doc) return;
    var wrapper = doc.createElement('div');
    wrapper.className = 'lq-chart';
    var explicit = H.num(this.options.height, 0);
    this._explicitHeight = explicit > 0 ? H.clamp(Math.round(explicit), 180, 2400) : 0;
    wrapper.style.cssText = [
      'position:relative',
      'display:block',
      'width:100%',
      'box-sizing:border-box',
      'height:' + (this._explicitHeight || DEFAULT_HEIGHT) + 'px',
      'background:' + P.bg,
      'border:1px solid rgba(148,163,184,0.16)',
      'border-radius:10px',
      'overflow:hidden',
      'font-family:' + C.fonts.family,
      'color:' + P.text,
      'line-height:normal',
      '-webkit-user-select:none',
      'user-select:none',
      '-webkit-tap-highlight-color:transparent',
      'touch-action:none'
    ].join(';');

    var canvas = doc.createElement('canvas');
    canvas.style.cssText = 'position:absolute;left:0;right:0;bottom:0;top:0;display:block;cursor:crosshair;touch-action:pan-y;';
    canvas.setAttribute('role', 'img');
    var info = doc.createElement('div');
    info.className = 'lq-chart-info';
    info.style.cssText = [
      'position:absolute', 'left:0', 'top:0', 'right:0', 'height:26px',
      'display:flex', 'align-items:center', 'gap:10px',
      'padding:0 10px', 'box-sizing:border-box',
      'font-family:' + C.fonts.family,
      'font-size:' + C.sizes.info + 'px',
      'color:' + P.textDim,
      'background:linear-gradient(180deg, rgba(8,11,17,0.94) 0%, rgba(8,11,17,0.72) 62%, rgba(8,11,17,0) 100%)',
      'pointer-events:none', 'white-space:nowrap', 'overflow:hidden', 'z-index:2',
      'font-variant-numeric:tabular-nums'
    ].join(';');
    var resizeHandle = null;
    if (this.options.resizableHeight) {
      resizeHandle = doc.createElement('button');
      resizeHandle.type = 'button';
      resizeHandle.className = 'lq-chart-resize-handle';
      resizeHandle.setAttribute('aria-label', '拖动调整图表高度');
      resizeHandle.title = '拖动调整图表高度';
      resizeHandle.style.cssText = 'position:absolute;left:50%;bottom:2px;transform:translateX(-50%);z-index:5;width:52px;height:12px;padding:0;border:0;background:transparent;cursor:ns-resize;touch-action:none';
      resizeHandle.innerHTML = '<span style="display:block;width:30px;height:3px;border-radius:2px;background:#65758b;margin:auto"></span>';
    }
    wrapper.appendChild(canvas);
    wrapper.appendChild(info);
    // 价格轴 / 时间轴触控热区：touch-action:none，手机上在轴上拖动不会滚动页面
    if (this.options.interactive !== false && (this.options.axisScale || this.options.timeAxisScale)) {
      this.axisHits = {};
      [['price', 'ns-resize', '上下拖动拉伸价格轴，双击恢复自动'], ['time', 'ew-resize', '左右拖动拉伸时间轴，双击复原'], ['corner', 'pointer', '复原视图']].forEach(function (def) {
        var hit = doc.createElement('div');
        hit.className = 'lq-axis-hit lq-axis-hit--' + def[0];
        hit.title = def[2];
        hit.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:3;touch-action:none;cursor:' + def[1] + ';background:transparent';
        wrapper.appendChild(hit);
        self.axisHits[def[0]] = hit;
      });
    }
    if (resizeHandle) wrapper.appendChild(resizeHandle);
    if (resizeHandle) this._bindHeightResize(resizeHandle);
    if (this.host) this.host.appendChild(wrapper);
    this.wrapper = wrapper;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.infoBar = info;
    // V2：画线工具栏（在 canvas 之上的独立 DOM 行，不遮挡图表）
    if (this.toolsEnabled) this._buildToolbar();
    if (!this.ctx) {
      C.warn('无法获取 Canvas 2D 上下文，图表降级为占位符');
      this.scenarioError = '当前浏览器不支持 Canvas 2D';
    }
  };

  /* ---------------------------------------------------------------- *
   * V2：画线工具栏（键盘可聚焦、移动端单行可横向滚动、按钮≥40px）
   * ---------------------------------------------------------------- */
  Engine.prototype._buildToolbar = function () {
    var doc = global.document;
    if (!doc || !this.wrapper || this.toolbar) return;
    var bar = doc.createElement('div');
    bar.className = 'lq-chart-tools';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', '图表画线工具');
    bar.style.cssText = [
      'position:absolute', 'left:0', 'right:0', 'top:0', 'z-index:4',
      'height:' + TOOLBAR_HEIGHT + 'px', 'box-sizing:border-box',
      'display:flex', 'align-items:center', 'gap:6px',
      'padding:4px 8px', 'overflow-x:auto', 'overflow-y:hidden',
      'background:rgba(8,12,18,0.96)',
      'border-bottom:1px solid rgba(148,163,184,0.18)',
      'white-space:nowrap', 'scrollbar-width:thin',
      'font-family:' + C.fonts.family
    ].join(';');
    var self = this;
    TOOL_DEFS.forEach(function (def) {
      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'lq-chart-tool-btn';
      btn.setAttribute('data-tool', def.tool);
      btn.setAttribute('title', def.title);
      btn.setAttribute('aria-label', def.label + '：' + def.title);
      btn.textContent = def.label;
      btn.style.cssText = [
        'flex:0 0 auto', 'min-height:40px', 'min-width:44px',
        'padding:0 10px', 'border-radius:6px', 'cursor:pointer',
        'border:1px solid rgba(148,163,184,0.30)',
        'background:rgba(148,163,184,0.10)',
        'color:' + P.text, 'font-size:11.5px',
        'font-family:' + C.fonts.family
      ].join(';');
      btn.addEventListener('click', function () { self._onToolbarClick(def.tool); });
      bar.appendChild(btn);
      if (def.tool !== 'clear') self.toolButtons[def.tool] = btn;
    });
    this.toolbar = bar;
    this.wrapper.insertBefore(bar, this.wrapper.firstChild);
    this._syncToolbar();
  };

  Engine.prototype._syncToolbar = function () {
    if (!this.toolbar) return;
    var active = this.tool;
    var self = this;
    Object.keys(this.toolButtons).forEach(function (key) {
      var btn = self.toolButtons[key];
      var isActive = key === active;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.style.background = isActive ? 'rgba(74,168,255,0.26)' : 'rgba(148,163,184,0.10)';
      btn.style.borderColor = isActive ? 'rgba(74,168,255,0.80)' : 'rgba(148,163,184,0.30)';
      btn.style.color = isActive ? '#cfe6ff' : P.text;
    });
  };

  Engine.prototype._onToolbarClick = function (tool) {
    if (this.destroyed) return;
    if (tool === 'clear') {
      this.clearDrawings();
      return;
    }
    this._setTool(this.tool === tool ? null : tool);
  };

  Engine.prototype._setTool = function (tool) {
    this.tool = tool || null;
    if (this._toolDraw) this._cancelDraft();
    this.hover.active = false;
    if (this.canvas) this.canvas.style.touchAction = this.tool ? 'none' : 'pan-y';
    this._syncToolbar();
    this._invalidate();
  };

  Engine.prototype._resolveScenario = function () {
    var opt = this.options.scenario;
    var sc = null;
    if (opt && typeof opt === 'object') sc = opt;
    else if (typeof opt === 'string') {
      if (LQ.data && isFn(LQ.data.getScenario)) sc = LQ.data.getScenario(opt);
    }
    if (!sc) {
      this.scenarioError = opt
        ? '情景不存在或未注册：' + (typeof opt === 'string' ? opt : '(未知对象)')
        : '缺少 scenario 参数（请传入情景 id 或情景对象）';
      C.warn(this.scenarioError);
      return;
    }
    if (!Array.isArray(sc.bars) || !sc.bars.length) {
      this.scenarioError = '情景缺少 K 线数据：' + (sc.id || '(无 id)');
      C.warn(this.scenarioError);
      return;
    }
    this.scenario = sc;
    this.bars = sc.bars;
  };

  Engine.prototype._prepareData = function () {
    if (!this.scenario) return;
    this.panels = PN.normalizePanels(this.scenario.panels || {});
    this.series = PN.buildSeries(this.scenario, this.panels);
    this.annRaw = this.options.annotations === undefined ? 'all' : this.options.annotations;
    this.anns = O.resolve(this.annRaw, this.scenario);
    var vp = this.options.viewport;
    if (vp && isFinite(Number(vp.from)) && isFinite(Number(vp.to))) {
      this.initialViewport = { from: Number(vp.from), to: Number(vp.to) };
    }
    // V2：初始画线（可选）+ 自动摆动结构缓存
    if (this._initialDrawings) {
      this._applyDrawings(this._initialDrawings, false);
      this._initialDrawings = null;
    }
    this._ensureSwings();
    this._buildInfoBar();
    if (this.canvas) {
      this.canvas.setAttribute('aria-label',
        (this.scenario.title || this.scenario.id) + ' K 线图（可缩放、拖动、双击复位；数据为模拟数据，仅用于教学）');
    }
  };

  /* ---------------------------------------------------------------- *
   * V2：自动摆动结构（分形左右各 3 根，HH/HL/LH/LL）
   * ---------------------------------------------------------------- */
  Engine.prototype._ensureSwings = function () {
    if (!this.autoSwingsEnabled) { this.swings = null; return; }
    if (this.swings && this.swingsBars === this.bars) return;
    var list = C.indicators.findSwings(this.bars, 3);
    C.indicators.classifySwings(list);
    this.swings = { list: list };
    this.swingsBars = this.bars;
  };

  /* ---------------------------------------------------------------- *
   * 顶部信息条（OHLCV / 涨跌幅 / Delta / MA）
   * ---------------------------------------------------------------- */
  Engine.prototype._buildInfoBar = function () {
    var info = this.infoBar;
    if (!info || !global.document) return;
    var doc = global.document;
    info.textContent = '';
    var els = this.infoEls = { sym: null, time: null, ohlc: [], chg: null, vol: null, delta: null, ma: [], hint: null };
    var base = 'flex:0 0 auto;white-space:nowrap;';
    function mk(styles, text) {
      var s = doc.createElement('span');
      s.style.cssText = base + (styles || '');
      if (text !== undefined) s.textContent = text;
      info.appendChild(s);
      return s;
    }
    els.sym = mk('font-weight:600;color:' + P.text + ';', '—');
    els.time = mk('color:' + P.textDim + ';font-family:' + C.fonts.mono + ';font-size:' + (C.sizes.info - 0.5) + 'px;', '—');
    var labels = ['开', '高', '低', '收'];
    for (var i = 0; i < labels.length; i++) {
      var wrap = doc.createElement('span');
      wrap.style.cssText = base + 'display:inline-flex;align-items:baseline;gap:2px;';
      var lab = doc.createElement('span');
      lab.textContent = labels[i];
      lab.style.cssText = 'color:' + P.textFaint + ';font-size:' + (C.sizes.info - 1) + 'px;';
      var val = doc.createElement('span');
      val.textContent = '—';
      val.style.cssText = 'color:' + P.text + ';font-variant-numeric:tabular-nums;';
      wrap.appendChild(lab);
      wrap.appendChild(val);
      info.appendChild(wrap);
      els.ohlc.push({ root: wrap, value: val });
    }
    els.chg = mk('font-weight:600;font-variant-numeric:tabular-nums;', '+0.00 (0.00%)');
    els.vol = (function () {
      var wrap = doc.createElement('span');
      wrap.style.cssText = base + 'display:inline-flex;align-items:baseline;gap:2px;';
      var lab = doc.createElement('span');
      lab.textContent = '量';
      lab.style.cssText = 'color:' + P.textFaint + ';font-size:' + (C.sizes.info - 1) + 'px;';
      var value = doc.createElement('span');
      value.textContent = '—';
      value.style.cssText = 'color:' + P.textDim + ';font-variant-numeric:tabular-nums;';
      wrap.appendChild(lab);
      wrap.appendChild(value);
      info.appendChild(wrap);
      return { root: wrap, value: value };
    })();
    els.delta = (function () {
      var wrap = doc.createElement('span');
      wrap.style.cssText = base + 'display:inline-flex;align-items:baseline;gap:2px;';
      var lab = doc.createElement('span');
      lab.textContent = 'Δ';
      lab.style.cssText = 'color:' + P.textFaint + ';';
      var value = doc.createElement('span');
      value.textContent = '—';
      value.style.cssText = 'font-variant-numeric:tabular-nums;color:' + P.textDim + ';';
      wrap.appendChild(lab);
      wrap.appendChild(value);
      info.appendChild(wrap);
      return { root: wrap, value: value };
    })();
    this.panels.ma.forEach(function (period, idx) {
      var wrap = doc.createElement('span');
      wrap.style.cssText = base + 'display:inline-flex;align-items:baseline;gap:4px;';
      var dot = doc.createElement('span');
      dot.style.cssText = 'color:' + P.ma[idx % P.ma.length] + ';font-size:8px;line-height:1;';
      dot.textContent = '●';
      var value = doc.createElement('span');
      value.textContent = 'MA' + period + ' —';
      value.style.cssText = 'color:' + P.ma[idx % P.ma.length] + ';font-variant-numeric:tabular-nums;';
      wrap.appendChild(dot);
      wrap.appendChild(value);
      info.appendChild(wrap);
      els.ma.push({ root: wrap, value: value });
    });
    els.hint = mk('margin-left:auto;color:' + P.textFaint + ';font-size:' + (C.sizes.info - 1) + 'px;', '滚轮缩放 · 拖拽平移 · 双击复位');
    if (this.options.compact) info.style.display = 'none';
  };

  Engine.prototype._layoutInfoBar = function () {
    var e = this.infoEls;
    if (!e || !this.infoBar) return;
    if (this.options.compact) { this.infoBar.style.display = 'none'; return; }
    this.infoBar.style.display = 'flex';
    var w = this._cssW;
    e.sym.style.display = w >= 600 ? '' : 'none';
    e.time.style.display = w >= 430 ? '' : 'none';
    e.vol.root.style.display = w >= 500 ? '' : 'none';
    e.delta.root.style.display = (this.panels.delta && w >= 600) ? '' : 'none';
    for (var i = 0; i < e.ma.length; i++) e.ma[i].root.style.display = w >= 700 ? '' : 'none';
    e.hint.style.display = w >= 900 ? '' : 'none';
  };

  Engine.prototype._updateInfo = function () {
    var e = this.infoEls;
    if (!e) return;
    if (!this.scenario) {
      e.sym.style.display = '';
      e.sym.textContent = '图表数据缺失';
      e.time.style.display = 'none';
      e.chg.style.display = 'none';
      e.vol.root.style.display = 'none';
      e.delta.root.style.display = 'none';
      for (var m = 0; m < e.ma.length; m++) e.ma[m].root.style.display = 'none';
      for (var i = 0; i < e.ohlc.length; i++) { e.ohlc[i].value.textContent = '—'; }
      return;
    }
    var n = this.bars.length;
    var hov = this.hover && this.hover.active && this.hover.bar !== null && this.hover.bar !== undefined;
    var idx = hov ? H.clamp(this.hover.bar, 0, n - 1) : n - 1;
    var b = this.bars[idx];
    if (!b) return;
    var prev = idx > 0 ? this.bars[idx - 1].c : b.o;
    var chg = b.c - prev;
    var pct = prev ? (chg / prev) * 100 : 0;
    var up = chg >= 0;
    var color = up ? P.bullText : P.bearText;
    var dec = Math.min(4, H.priceDecimals(b.c));
    e.sym.textContent = (this.scenario.symbol || this.scenario.id || '') + ' · ' + (this.scenario.timeframe || '');
    e.time.textContent = this.formatTime ? this.formatTime(b.t) : H.timeLabel(b.t, 0, this.narrow ? 'auto' : 'full');
    var fields = [b.o, b.h, b.l, b.c];
    for (var f = 0; f < 4; f++) e.ohlc[f].value.textContent = H.fmtFixed(fields[f], dec);
    e.chg.textContent = (up ? '+' : '') + H.fmtFixed(chg, dec) + ' (' + (up ? '+' : '') + pct.toFixed(2) + '%)';
    e.chg.style.color = color;
    e.vol.value.textContent = H.fmtInt(b.v);
    if (this.panels.delta) {
      var dv = C.indicators.deltaOf(b);
      e.delta.value.textContent = (dv >= 0 ? '+' : '') + H.fmtFixed(dv, dv >= 0 ? 1 : 1);
      e.delta.value.style.color = dv >= 0 ? P.bullText : P.bearText;
    }
    for (var k = 0; k < this.series.ma.length; k++) {
      var line = this.series.ma[k];
      var field = e.ma[k];
      if (!field) continue;
      var v = line.values[idx];
      field.value.textContent = 'MA' + line.period + ' ' + (v === null || v === undefined ? '—' : H.fmtFixed(v, Math.min(4, H.priceDecimals(v))));
    }
  };

  /* ================================================================ *
   * 尺寸 / 布局
   * ================================================================ */
  Engine.prototype._measure = function () {
    if (!this.wrapper) return false;
    var w = this.wrapper.clientWidth || 0;
    var auto = DEFAULT_HEIGHT;
    if (w > 0 && w < 560) auto = MOBILE_HEIGHT;
    if (w > 0 && w < 400) auto = SMALL_HEIGHT;
    this._autoHeight = auto;
    this._baseH = this._explicitHeight || auto;
    if (this.options.fillHeight && this.host) {
      // 跟随容器高度（全屏 / 课件舞台）：容器必须有确定高度，否则退回固定高度
      var hostH = Math.round(this.host.clientHeight || 0);
      if (hostH >= 180) this._baseH = hostH - ((this.toolsEnabled && this.toolbar) ? TOOLBAR_HEIGHT : 0);
    }
    this._toolbarH = (this.toolsEnabled && this.toolbar) ? TOOLBAR_HEIGHT : 0;
    var total = this._baseH + this._toolbarH;
    var hCss = total + 'px';
    if (this.wrapper.style.height !== hCss) this.wrapper.style.height = hCss;
    if (this.toolbar) {
      this.toolbar.style.display = this._toolbarH ? 'flex' : 'none';
      this.toolbar.style.top = '0px';
    }
    if (this.canvas) {
      this.canvas.style.top = this._toolbarH + 'px';
      this.canvas.style.bottom = '0px';
    }
    if (this.infoBar) this.infoBar.style.top = this._toolbarH + 'px';
    this._cssW = Math.max(0, Math.round(w));
    // clientHeight 不含边框；减去工具栏高度得到 canvas 绘制区高度（与一期行为一致）
    this._cssH = Math.max(0, Math.round((this.wrapper.clientHeight || 0) - this._toolbarH));
    return this._cssW > 0 && this._cssH > 0;
  };

  Engine.prototype._resizeCanvas = function () {
    if (!this.canvas || !this.ctx) return false;
    var dpr = H.clamp(Number(global.devicePixelRatio) || 1, 1, 3);
    var pw = Math.max(1, Math.round(this._cssW * dpr));
    var ph = Math.max(1, Math.round(this._cssH * dpr));
    if (this.canvas.width !== pw) this.canvas.width = pw;
    if (this.canvas.height !== ph) this.canvas.height = ph;
    this._dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  Engine.prototype._layout = function () {
    var w = this._cssW, h = this._cssH;
    this.narrow = w < 560;
    var compact = !!this.options.compact;
    var padL = this.narrow ? 6 : 8;
    var padT = compact ? 8 : (this.narrow ? 26 : 28);
    var padB = 0;
    var timeH = this.narrow ? 18 : 20;
    var axisW = this.narrow ? 48 : 64;
    var gap = this.narrow ? 3 : 4;

    var defs = PN.paneDefs(this.panels, this.narrow);
    if (h < 200) defs = [];
    else if (h < 270) defs = defs.slice(0, 1);
    var ladderSide = !!(this.panels.ladder && w >= 680);
    this.ladderSide = ladderSide;
    if (ladderSide) this.ladderRect = { x: 0, y: 0, w: 0, h: 0 };
    if (this.panels.ladder && !ladderSide) {
      defs.push({ key: 'ladder', h: this.narrow ? PN.ladderBottomHeight.narrow : PN.ladderBottomHeight.wide });
    }

    var plotW = w - padL - axisW;
    if (ladderSide) {
      var ladderW = H.clamp(Math.round(w * 0.18), 150, 220);
      plotW = w - padL - axisW - ladderW;
    }
    plotW = Math.max(60, plotW);

    var available = h - padT - padB - timeH - defs.length * gap;
    var i, paneTotal = 0;
    defs.forEach(function (def) {
      if (this.paneSizeOverrides[def.key]) def.h = this.paneSizeOverrides[def.key];
      def.h = Math.max(24, def.h); paneTotal += def.h;
    }, this);
    var minMain = H.clamp(available * 0.34, 72, 150);
    if (paneTotal > available - minMain && paneTotal > 0) {
      var fit = Math.max(0.2, (available - minMain) / paneTotal);
      paneTotal = 0;
      defs.forEach(function (def) { def.h = Math.max(24, Math.round(def.h * fit)); paneTotal += def.h; });
    }
    var mainH = Math.max(64, available - paneTotal);

    this.plot = { x: padL, y: padT, w: plotW, h: mainH, right: padL + plotW, bottom: padT + mainH };
    this.axis = { x: padL + plotW, w: axisW };
    this.timeAxis = { y: h - timeH, h: timeH };
    this.panes = [];
    this._paneLayout = [{ key: 'main', h: mainH, y: this.plot.y, bottom: this.plot.bottom }];
    var y = this.plot.bottom;
    for (i = 0; i < defs.length; i++) {
      y += gap;
      this.panes.push({ key: defs[i].key, x: padL, y: y, w: plotW, h: defs[i].h, right: padL + plotW, bottom: y + defs[i].h });
      this._paneLayout.push({ key: defs[i].key, h: defs[i].h, y: y, bottom: y + defs[i].h });
      y += defs[i].h;
    }
    this.lastPaneBottom = this.panes.length ? this.panes[this.panes.length - 1].bottom : this.plot.bottom;
    if (ladderSide) {
      // 侧边 ladder 铺满主图到时间轴之间的整个高度，像真实 DOM 一样撑满右栏
      var ladderBottom = this.timeAxis.y - 2;
      this.ladderRect = {
        x: this.axis.x + axisW,
        y: this.plot.y,
        w: Math.max(90, w - (this.axis.x + axisW) - 6),
        h: Math.max(80, ladderBottom - this.plot.y),
        right: w - 6,
        bottom: ladderBottom
      };
    }
    this.gap = gap;
    this._layoutInfoBar();
    this._layoutAxisHits();
  };

  Engine.prototype._layoutAxisHits = function () {
    if (!this.axisHits) return;
    var top = this._toolbarH || 0, plot = this.plot, axis = this.axis, ta = this.timeAxis;
    function place(el, show, x, y, w, h) {
      if (!el) return;
      el.style.display = show ? 'block' : 'none';
      if (!show) return;
      el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y + top) + 'px';
      el.style.width = Math.max(0, Math.round(w)) + 'px'; el.style.height = Math.max(0, Math.round(h)) + 'px';
    }
    place(this.axisHits.price, !!this.options.axisScale, axis.x, plot.y, axis.w, plot.h);
    place(this.axisHits.time, !!this.options.timeAxisScale, plot.x, ta.y, plot.w, ta.h);
    place(this.axisHits.corner, true, axis.x, ta.y, axis.w, ta.h);
  };

  Engine.prototype.resizePaneBoundary = function (boundary, delta, initialTop) {
    if (!this._paneLayout || boundary < 0 || boundary >= this._paneLayout.length - 1) return false;
    var top = this._paneLayout[boundary], bottom = this._paneLayout[boundary + 1];
    var minTop = boundary === 0 ? 90 : 36, minBottom = 36;
    var total = top.h + bottom.h;
    var nextTop = H.clamp((isFinite(Number(initialTop)) ? Number(initialTop) : top.h) + delta, minTop, total - minBottom);
    if (boundary > 0) this.paneSizeOverrides[top.key] = nextTop;
    this.paneSizeOverrides[bottom.key] = total - nextTop;
    this.resize();
    return true;
  };

  Engine.prototype._paneBoundaryAt = function (pos) {
    if (!this.options.paneResizing || pos.x < this.plot.x || pos.x > this.plot.right) return -1;
    for (var i = 0; i < this._paneLayout.length - 1; i++) {
      if (Math.abs(pos.y - this._paneLayout[i].bottom) <= 7) return i;
    }
    return -1;
  };

  Engine.prototype._bindHeightResize = function (handle) {
    var self = this, id = null;
    function down(e) {
      e.preventDefault(); e.stopPropagation(); id = e.pointerId;
      self.heightResize = { startY: e.clientY, startHeight: self._baseH || H.num(self.options.height, DEFAULT_HEIGHT) };
      try { handle.setPointerCapture(id); } catch (_) {}
    }
    function move(e) {
      if (id !== e.pointerId || !self.heightResize) return;
      var height = H.clamp(self.heightResize.startHeight + e.clientY - self.heightResize.startY, 300, 1800);
      self._explicitHeight = Math.round(height);
      self.options.height = self._explicitHeight;
      self.resize();
    }
    function up(e) {
      if (id !== e.pointerId) return;
      try { handle.releasePointerCapture(id); } catch (_) {}
      if (typeof self.options.onHeightChange === 'function') self.options.onHeightChange(self._explicitHeight);
      id = null; self.heightResize = null;
    }
    this._on(handle, 'pointerdown', down);
    this._on(handle, 'pointermove', move);
    this._on(handle, 'pointerup', up);
    this._on(handle, 'pointercancel', up);
  };

  Engine.prototype._computeDefaultView = function () {
    var n = this.bars.length;
    if (n < 2) return { from: 0, to: Math.max(0, n - 1) };
    if (this.initialViewport) {
      return this._clampView({ from: this.initialViewport.from, to: this.initialViewport.to });
    }
    if (this.panels.footprint && this.plot && this.plot.w > 0) {
      var minW = this.narrow ? 30 : 34;
      var maxCount = Math.max(6, Math.floor(this.plot.w / minW));
      // 足迹模式需要放大才能看清数字：优先把“当前标注涉及的范围 + 上下文”放进视口
      var xr = this._annXRange();
      if (xr) {
        var wantCount = Math.ceil(xr[1] - xr[0]) + 9;
        var mid = (xr[0] + xr[1]) / 2;
        if (wantCount > maxCount) wantCount = maxCount; // 标注跨度太大时，以标注中心居中裁切
        var from = Math.round(mid - wantCount / 2);
        var to = from + wantCount - 1;
        return this._clampView({ from: from, to: to });
      }
      var count = H.clamp(Math.floor(this.plot.w / (this.narrow ? 40 : 54)), 8, Math.min(n, 36));
      return this._clampView({ from: n - count, to: n - 1 });
    }
    return this._clampView({ from: 0, to: n - 1 });
  };

  /* 当前标注覆盖的 x 范围（用于足迹模式自动取景） */
  Engine.prototype._annXRange = function () {
    var lo = Infinity, hi = -Infinity;
    function add(x) { if (typeof x === 'number' && isFinite(x)) { if (x < lo) lo = x; if (x > hi) hi = x; } }
    (this.anns || []).forEach(function (a) {
      if (!a) return;
      if (a.kind === 'marker' || a.kind === 'text') add(a.x);
      else if (a.kind === 'hline') { add(a.x1); add(a.x2); }
      else { add(a.x1); add(a.x2); }
    });
    if (!isFinite(lo) || !isFinite(hi)) return null;
    return [lo, hi];
  };

  Engine.prototype._clampView = function (v) {
    var n = this.bars.length;
    if (n < 10) return { from: 0, to: Math.max(0, n - 1) };
    var maxSpan = Math.max(1, n - 1);
    var minSpan = Math.min(9, maxSpan);
    var from = H.num(v && v.from, 0);
    var to = H.num(v && v.to, n - 1);
    if (to < from) { var t = from; from = to; to = t; }
    var span = to - from;
    var mid;
    if (span > maxSpan) { span = maxSpan; mid = (from + to) / 2; from = mid - span / 2; to = from + span; }
    if (span < minSpan) { span = minSpan; mid = (from + to) / 2; from = mid - span / 2; to = from + span; }
    if (from < 0) { to += -from; from = 0; }
    if (to > n - 1) { from -= (to - (n - 1)); to = n - 1; }
    if (from < 0) from = 0;
    if (to > n - 1) to = n - 1;
    return { from: from, to: to };
  };

  Engine.prototype.xOfBar = function (i) {
    return this.plot.x + ((i - this.view.from) + 0.5) * this.barW;
  };
  Engine.prototype.yOfPrice = function (p) {
    var span = this.yMax - this.yMin;
    if (!(span > 0)) span = 1;
    return this.plot.y + (this.yMax - p) / span * this.plot.h;
  };
  Engine.prototype.priceAtY = function (y) {
    var span = this.yMax - this.yMin;
    return this.yMin + (this.plot.bottom - y) / Math.max(1, this.plot.h) * span;
  };

  /* ================================================================ *
   * 公开方法（由 chart.js 包装成冻结 API）
   * ================================================================ */
  Engine.prototype.resize = function () {
    if (this.destroyed) return this;
    try {
      if (!this._measure()) return this;
      if (!this._resizeCanvas()) return this;
      if (!this.scenario) {
        this._drawPlaceholder();
        this._updateInfo();
        return this;
      }
      this._layout();
      if (!this.view) this.view = this._computeDefaultView();
      this.view = this._clampView(this.view);
      this.barW = this.plot.w / Math.max(1, this.view.to - this.view.from + 1 + this.trailingBars);
      this._draw();
    } catch (err) {
      this._handleError(err);
    }
    return this;
  };

  Engine.prototype.setHeight = function (height) {
    if (this.destroyed) return this;
    var h = H.num(height, 0);
    this._explicitHeight = h > 0 ? H.clamp(Math.round(h), 180, 2400) : 0;
    this.options.height = this._explicitHeight || undefined;
    return this.resize();
  };

  Engine.prototype.resetPriceScale = function () {
    if (this.destroyed) return this;
    this.priceScaleOverride = null;
    this._invalidate();
    return this;
  };

  Engine.prototype.setAnnotations = function (list) {
    if (this.destroyed) return this;
    this.annRaw = list;
    try {
      this.anns = this.scenario ? O.resolve(list, this.scenario) : [];
    } catch (err) {
      this.anns = [];
      C.warn('setAnnotations 解析失败，已忽略该批标注', err);
    }
    this._invalidate();
    return this;
  };

  Engine.prototype.setViewport = function (vp) {
    if (this.destroyed || !this.scenario || !vp) return this;
    var from = H.num(vp.from, this.view ? this.view.from : 0);
    var to = H.num(vp.to, this.view ? this.view.to : this.bars.length - 1);
    this.view = this._clampView({ from: from, to: to });
    this.hover.active = false;
    this._notifyViewport();
    this._invalidate();
    return this;
  };

  Engine.prototype.resetViewport = function () {
    if (this.destroyed || !this.scenario) return this;
    this.view = this._computeDefaultView();
    this.hover.active = false;
    this._notifyViewport();
    this._invalidate();
    return this;
  };

  Engine.prototype.getScenario = function () {
    return this.scenario;
  };

  Engine.prototype._notifyViewport = function () {
    if (typeof this.options.onViewportChange !== 'function' || !this.view) return;
    try { this.options.onViewportChange({ from: this.view.from, to: this.view.to, count: this.bars.length }); }
    catch (err) { C.warn('onViewportChange callback failed', err); }
  };

  /* ================================================================ *
   * V2 公开方法：画线 / 自动摆动 / 区间成交量统计
   * ================================================================ */
  function clonePlain(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (err) { return value; }
  }

  Engine.prototype._applyDrawings = function (list, emit) {
    var source = Array.isArray(list) ? list : [];
    this.drawings = [];
    var valid = [];
    for (var i = 0; i < source.length; i++) {
      var raw = source[i];
      if (!raw || typeof raw !== 'object') continue;
      var copy = clonePlain(raw);
      var ann = O.normalize(copy);
      if (!ann) continue;
      this.drawings.push(copy);
      valid.push(copy);
    }
    this.drawingAnns = this.scenario ? O.resolve(valid, this.scenario) : [];
    if (emit) this._emitDrawings({ type: 'set' });
    this._refreshNow();
  };

  Engine.prototype._emitDrawings = function (change) {
    if (!this._onDrawingChange) return;
    try { this._onDrawingChange(this.getDrawings(), change || { type: 'set' }); } catch (err) { C.warn('onDrawingChange 回调异常', err); }
  };

  Engine.prototype.getDrawings = function () {
    return clonePlain(this.drawings || []);
  };

  Engine.prototype.setDrawings = function (list) {
    if (this.destroyed) return this;
    this._applyDrawings(list, true);
    return this;
  };

  Engine.prototype.clearDrawings = function () {
    if (this.destroyed) return this;
    this.drawings = [];
    this.drawingAnns = [];
    this._toolDraw = null;
    this.draftRaw = null;
    this.draftAnn = null;
    this._emitDrawings({ type: 'clear' });
    this._refreshNow();
    return this;
  };

  Engine.prototype.removeSelectedDrawing = function () {
    if (!this.selection || this.selection.type !== 'drawing') return false;
    var index = this.selection.index;
    if (index < 0 || index >= this.drawings.length) return false;
    this.drawings.splice(index, 1); this.selection = null;
    if (typeof this.options.onSelectionChange === 'function') this.options.onSelectionChange(null);
    this.drawingAnns = this.scenario ? O.resolve(this.drawings, this.scenario) : [];
    this._emitDrawings({ type: 'delete', index: index }); this._refreshNow();
    return true;
  };

  Engine.prototype.setToolsEnabled = function (enabled) {
    if (this.destroyed) return this;
    this.toolsEnabled = !!enabled;
    if (this.toolsEnabled && !this.toolbar) this._buildToolbar();
    if (!this.toolsEnabled) this._setTool(null);
    else this._syncToolbar();
    this.resize();
    return this;
  };

  Engine.prototype.setAutoSwings = function (enabled) {
    if (this.destroyed) return this;
    this.autoSwingsEnabled = !!enabled;
    if (!this.autoSwingsEnabled) this.swings = null;
    else { this.swings = null; this._ensureSwings(); }
    this._refreshNow();
    return this;
  };

  /* 区间成交量分布的只读统计（QA 独立复算用） */
  Engine.prototype.getProfileStats = function (input) {
    if (!this.scenario || !this.bars || !this.bars.length) return null;
    var opts = input || {};
    if (input && (input.kind === 'vprofile' || input.kind === 'vpline')) {
      var range = input.kind === 'vpline' ? (input.range || input) : input;
      opts = { x1: range.x1, x2: range.x2, bins: input.bins, vaPercent: input.vaPercent };
    }
    var x1 = H.num(opts.x1, 0);
    var x2 = H.num(opts.x2, this.bars.length - 1);
    var bins = H.clamp(Math.round(H.num(opts.bins, 24)), 6, 60);
    var vaPercent = H.clamp(H.num(opts.vaPercent, H.num(opts.va, 0.7)), 0.05, 0.99);
    return C.indicators.profileStats(this.bars, { x1: x1, x2: x2, bins: bins, vaPercent: vaPercent });
  };

  /* ================================================================ *
   * V2：画线工具交互（点击/拖拽创建，Esc 取消）
   * ================================================================ */
  Engine.prototype._barAtX = function (x) {
    var bar = this.view.from + (x - this.plot.x) / Math.max(0.001, this.barW) - 0.5;
    return H.clamp(bar, 0, this.bars.length - 1);
  };
  Engine.prototype._priceAtYClamped = function (y) {
    var py = H.clamp(y, this.plot.y, this.plot.bottom);
    return this.priceAtY(py);
  };

  Engine.prototype._beginToolDraw = function (e, pos) {
    var bar = this._barAtX(pos.x);
    var price = this._priceAtYClamped(pos.y);
    this._toolDraw = {
      id: e.pointerId, tool: this.tool, startX: pos.x, startY: pos.y,
      startBar: bar, startPrice: price, moved: false
    };
    this.draftRaw = this._makeDraft(this.tool, bar, price, bar, price);
    this.draftAnn = this.scenario ? O.resolve([this.draftRaw], this.scenario)[0] || null : null;
    this.hover.active = false;
    this._invalidate();
  };

  Engine.prototype._makeDraft = function (tool, x1, y1, x2, y2) {
    var a, b;
    if (x1 > x2) { a = x2; b = x1; } else { a = x1; b = x2; }
    if (tool === 'hline') {
      return { kind: 'hline', x1: null, x2: null, y: y2, label: '', tone: 'info' };
    }
    if (tool === 'trend') {
      return { kind: 'segment', x1: x1, y1: y1, x2: x2, y2: y2, label: '', tone: 'info', width: 1.8 };
    }
    if (tool === 'fib') {
      return {
        kind: 'fib', x1: x1, y1: y1, x2: x2, y2: y2, label: '',
        levels: [0.382, 0.5, 0.618, 0.705, 0.79, 1.272, 1.618],
        levelLabels: null, levelsLabels: ['0.382', '0.5', '0.618', '0.705', '0.79', '1.272 扩展', '1.618 扩展'],
        showExtension: true, tone: 'info', band: true
      };
    }
    if (tool === 'vprofile') {
      return {
        kind: 'vprofile', x1: Math.round(a), x2: Math.round(b),
        bins: 24, side: 'right', label: '区间成交分布', tone: 'info'
      };
    }
    return null;
  };

  Engine.prototype._updateToolDraw = function (pos) {
    var td = this._toolDraw;
    if (!td) return;
    if (!td.moved && (Math.abs(pos.x - td.startX) > 3 || Math.abs(pos.y - td.startY) > 3)) td.moved = true;
    var bar = this._barAtX(pos.x);
    var price = this._priceAtYClamped(pos.y);
    td.endBar = bar;
    td.endPrice = price;
    td.endX = pos.x;
    td.endY = pos.y;
    this.draftRaw = this._makeDraft(td.tool, td.startBar, td.startPrice, bar, price);
    if (td.tool === 'vprofile') {
      this.draftAnn = { kind: 'zone', x1: Math.min(td.startBar, bar), x2: Math.max(td.startBar, bar),
        y1: this.yMin, y2: this.yMax, tone: 'info', label: '成交分布选区' };
    } else this.draftAnn = this.scenario ? O.resolve([this.draftRaw], this.scenario)[0] || null : null;
    this._invalidate();
  };

  Engine.prototype._applyDrawingDefaults = function (raw) {
    // 让画线与教学标注同构，同时补充可读的默认样式
    if (!raw || typeof raw !== 'object') return raw;
    if (!raw.tone) raw.tone = 'info';
    if (raw.kind === 'hline' && !raw.label) raw.label = '';
    if (raw.kind === 'vprofile' && !raw.label) raw.label = '区间成交分布';
    if (raw.kind === 'fib' && !raw.levels) raw.levels = [0.382, 0.5, 0.618, 0.705, 0.79];
    return raw;
  };

  Engine.prototype._finalizeToolDraw = function (pos) {
    var td = this._toolDraw;
    if (!td) return;
    this._updateToolDraw(pos);
    var draft = this.draftRaw;
    this._toolDraw = null;
    var drawBar = this._barAtX(pos.x);
    var drawPrice = this._priceAtYClamped(pos.y);
    var tooSmall = Math.abs(pos.x - td.startX) < 4 && Math.abs(pos.y - td.startY) < 4;
    var raw = null;
    if (td.tool === 'hline') {
      raw = { kind: 'hline', x1: null, x2: null, y: drawPrice, label: '', tone: 'info' };
    } else if (td.tool === 'trend' || td.tool === 'fib') {
      if (tooSmall) { this._cancelDraft(); return; }
      raw = Object.assign({}, draft);
    } else if (td.tool === 'vprofile') {
      var x1 = td.startBar, x2 = drawBar;
      if (Math.abs(x2 - x1) < 2) {
        x1 = Math.round(this.view.from);
        x2 = Math.round(this.view.to);
      }
      if (x1 > x2) { var t = x1; x1 = x2; x2 = t; }
      x1 = H.clamp(Math.round(x1), 0, this.bars.length - 1);
      x2 = H.clamp(Math.round(x2), 1, this.bars.length - 1);
      if (x2 <= x1) x2 = H.clamp(x1 + 2, 1, this.bars.length - 1);
      raw = { kind: 'vprofile', x1: x1, x2: x2, bins: 24, side: 'right', label: '区间成交分布', tone: 'info' };
    }
    this.draftRaw = null;
    this.draftAnn = null;
    if (!raw) { this._invalidate(); return; }
    this._applyDrawingDefaults(raw);
    if (!O.normalize(raw)) { this._invalidate(); return; }
    this.drawings.push(raw);
    this.drawingAnns = this.scenario ? O.resolve(this.drawings, this.scenario) : [];
    this._emitDrawings({ type: 'add', index: this.drawings.length - 1 });
    this._refreshNow();
  };

  Engine.prototype._cancelDraft = function () {
    this._toolDraw = null;
    this.draftRaw = null;
    this.draftAnn = null;
    this._invalidate();
  };

  Engine.prototype._onKeyDown = function (e) {
    if (this.destroyed) return;
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    if (this._toolDraw || this.draftRaw) { this._cancelDraft(); }
    else if (this.tool) { this._setTool(null); }
    if (this.canvas) this.canvas.style.touchAction = this.tool ? 'none' : 'pan-y';
  };

  /* 画线/开关类操作需要“立即”体现在画布上（QA/截图/用户感知），已布局时同步重绘 */
  Engine.prototype._refreshNow = function () {
    if (this.destroyed) return;
    if (this.ctx && this._cssW > 0 && this._cssH > 0 && this.plot && this.plot.w > 0 && this.scenario) {
      try { this._draw(); } catch (err) { this._handleError(err); }
    } else {
      this._invalidate();
    }
  };

  Engine.prototype.destroy = function () {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this._raf !== null) {
      if (this._rafIsTimeout) global.clearTimeout(this._raf);
      else caf(this._raf);
      this._raf = null;
    }
    var i;
    for (i = 0; i < this._offs.length; i++) {
      var off = this._offs[i];
      try { off[0].removeEventListener(off[1], off[2], off[3]); } catch (err) { /* noop */ }
    }
    this._offs = [];
    this._handlers = {};
    if (this.observer) {
      try { this.observer.disconnect(); } catch (err) { /* noop */ }
      this.observer = null;
    }
    this.drag = null;
    this.pinch = null;
    this.ptrs = {};
    this._toolDraw = null;
    this.draftRaw = null;
    this.draftAnn = null;
    this.tool = null;
    this.toolButtons = {};
    this.toolbar = null;
    this.drawings = [];
    this.drawingAnns = [];
    this.swings = null;
    this.swingsBars = null;
    this._onDrawingChange = null;
    this.labels = null;
    this.anns = [];
    this._clipLabels = null;
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
    this.canvas = null;
    this.ctx = null;
    this.infoBar = null;
    this.infoEls = null;
    this.series = null;
    this.bars = [];
    this.scenario = null;
  };

  /* ================================================================ *
   * 绘制
   * ================================================================ */
  Engine.prototype._invalidate = function () {
    if (this.destroyed) return;
    if (this._raf !== null) return;
    var self = this;
    this._rafIsTimeout = !global.requestAnimationFrame;
    this._raf = raf(function () {
      self._raf = null;
      try { self._draw(); } catch (err) { self._handleError(err); }
    });
  };

  Engine.prototype._handleError = function (err) {
    if (!this._layoutError) {
      this._layoutError = err;
      C.error('图表绘制失败（已降级，不影响页面其余部分）：' + (err && err.message), err);
    }
    try {
      if (this.ctx && this._cssW > 0 && this._cssH > 0) this._drawPlaceholder('图表渲染出现异常，已降级显示');
    } catch (e2) { /* noop */ }
  };

  Engine.prototype._computeScale = function (anns) {
    var n = this.bars.length, view = this.view;
    var i0 = Math.max(0, Math.floor(view.from));
    var i1 = Math.min(n - 1, Math.ceil(view.to));
    var lo = Infinity, hi = -Infinity, i, b;
    for (i = i0; i <= i1; i++) {
      b = this.bars[i];
      if (!b) continue;
      var bl = H.num(b.l, NaN), bh = H.num(b.h, NaN);
      if (isFinite(bl) && bl < lo) lo = bl;
      if (isFinite(bh) && bh > hi) hi = bh;
    }
    if (this.replayPreview && view.to >= n - 2) {
      var previewLow = H.num(this.replayPreview.l, NaN), previewHigh = H.num(this.replayPreview.h, NaN);
      if (isFinite(previewLow)) lo = Math.min(lo, previewLow);
      if (isFinite(previewHigh)) hi = Math.max(hi, previewHigh);
    }
    var annRange = O.collectPriceRange(anns || this.anns, view, n, this.bars);
    if (annRange) { lo = Math.min(lo, annRange[0]); hi = Math.max(hi, annRange[1]); }
    if (!isFinite(lo) || !isFinite(hi)) {
      b = this.bars[n - 1];
      lo = H.num(b && b.l, 0);
      hi = H.num(b && b.h, 1);
    }
    if (!(hi > lo)) {
      var p0 = Math.max(Math.abs(hi) * 0.001, 0.5);
      lo -= p0; hi += p0;
    }
    var pad = (hi - lo) * 0.075;
    this.yMin = lo - pad;
    this.yMax = hi + pad;
    if (this.priceScaleOverride && this.priceScaleOverride.max > this.priceScaleOverride.min) {
      this.yMin = this.priceScaleOverride.min;
      this.yMax = this.priceScaleOverride.max;
    }

    var target = H.clamp(Math.round(this.plot.h / 32), 3, 10);
    var step = H.niceStep((this.yMax - this.yMin) / target);
    var decimals = H.decimalsForStep(step);
    this.priceDecimals = decimals;
    this.priceTicks = [];
    var start = Math.ceil(this.yMin / step) * step;
    for (var p = start; p <= this.yMax + step * 0.001; p += step) {
      this.priceTicks.push({ price: p, y: this.yOfPrice(p), label: H.fmtFixed(p, decimals) });
      if (this.priceTicks.length > 16) break;
    }
    // 时间轴刻度
    var spanBars = view.to - view.from;
    var interval = H.num(this.scenario.intervalMs, 0);
    if (!interval) interval = (n > 1 ? H.num(this.bars[1].t, 0) - H.num(this.bars[0].t, 0) : 3600000) || 3600000;
    var spanMs = spanBars * interval;
    var stepBars = H.timeStepBars(this.narrow ? 66 : 92, this.barW);
    // 视口跨过自然日时，时间标签带上日期，避免出现两个 01:00 的歧义
    var firstBar = this.bars[Math.max(0, Math.floor(view.from))];
    var lastBar = this.bars[Math.min(n - 1, Math.ceil(view.to))];
    var crossDay = firstBar && lastBar &&
      Math.floor(H.num(firstBar.t, 0) / 864e5) !== Math.floor(H.num(lastBar.t, 0) / 864e5);
    var timeMode = (crossDay && spanMs <= 864e5 * 5) ? 'day' : 'auto';
    this.timeTicks = [];
    var first = Math.ceil(view.from / stepBars) * stepBars;
    for (var idx = first; idx <= view.to + 0.001; idx += stepBars) {
      var bi = H.clamp(Math.round(idx), 0, n - 1);
      this.timeTicks.push({
        i: idx,
        x: this.xOfBar(idx),
        label: this.formatTime ? this.formatTime(this.bars[bi].t) : H.timeLabel(this.bars[bi].t, spanMs, timeMode)
      });
      if (this.timeTicks.length > 24) break;
    }
  };

  /* V2：参与渲染/价格轴计算的全部标注 = scenario 标注 + 用户画线 */
  Engine.prototype._allAnns = function () {
    if (!this.drawingAnns || !this.drawingAnns.length) return this.anns || [];
    return (this.anns || []).concat(this.drawingAnns);
  };

  Engine.prototype._draw = function () {
    if (this.destroyed || !this.ctx) return;
    var ctx = this.ctx, w = this._cssW, h = this._cssH;
    if (!(w > 0 && h > 0)) return;
    if (!this.scenario) { this._drawPlaceholder(); this._updateInfo(); return; }
    if (!this.plot || !this.plot.w) this._layout();
    this.view = this._clampView(this.view);
    this.barW = this.plot.w / Math.max(1, this.view.to - this.view.from + 1 + this.trailingBars);
    if (this.panels.footprint && this.barW >= 22) {
      for (var fi = Math.max(0, Math.floor(this.view.from)); fi <= Math.min(this.bars.length - 1, Math.ceil(this.view.to)); fi++) {
        if (this.bars[fi].getFootprint) this.bars[fi].getFootprint();
      }
    }
    var anns = this._allAnns();
    this._ensureSwings();
    this._computeScale(this.options.scaleDrawings === false ? this.anns : anns);

    ctx.save();
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);

    this.labels = new O.LabelLayer(ctx, this.plot);
    this._drawBackgrounds();
    this._drawGrids();
    this._drawHoverBand();

    var fpState = PN.footprintState(this);
    O.drawFills(ctx, this, anns);
    if (fpState && fpState.ok) PN.drawFootprint(ctx, this);
    else this._drawCandles();
    if (this.panels.ma.length) PN.drawMA(ctx, this);
    O.drawLines(ctx, this, anns);
    if (this.panels.profile) PN.drawProfile(ctx, this);
    O.drawDataOverlays(ctx, this, anns);
    // V2：正在拖拽创建的画线实时预览
    if (this.draftAnn) {
      O.drawLines(ctx, this, [this.draftAnn]);
      O.drawDataOverlays(ctx, this, [this.draftAnn]);
    }
    this._drawPanes();
    if (this.ladderSide && this.ladderRect && this.ladderRect.w > 20) {
      PN.drawLadder(ctx, this, this.ladderRect, true);
    }
    this._drawAxes();
    this._drawFootprintBadge(fpState);
    this._drawCrosshair();
    O.drawLabels(ctx, this, anns);
    // V2：自动摆动结构标签最后加（碰撞时自动隐藏，不压住教学标注）
    O.drawAutoSwings(ctx, this);
    this.labels.flush();
    this.labels = null;
    ctx.restore();
    this._updateInfo();
  };

  Engine.prototype._drawBackgrounds = function () {
    var ctx = this.ctx, plot = this.plot, w = this._cssW;
    ctx.fillStyle = P.plotBg;
    ctx.fillRect(plot.x, plot.y, plot.w, plot.h);
    ctx.fillStyle = 'rgba(7,10,15,0.55)';
    ctx.fillRect(plot.right, plot.y, this.axis.w, plot.h);
    ctx.fillRect(0, this.timeAxis.y, w, this.timeAxis.h);
    for (var i = 0; i < this.panes.length; i++) {
      var pn = this.panes[i];
      ctx.fillStyle = i % 2 === 0 ? P.paneBg : P.paneBgAlt;
      ctx.fillRect(pn.x, pn.y, pn.w, pn.h);
    }
    if (this.ladderSide && this.ladderRect) {
      ctx.fillStyle = P.ladderBg;
      ctx.fillRect(this.ladderRect.x, this.ladderRect.y, this.ladderRect.w, this.ladderRect.h);
    }
    // 绘图区边框
    ctx.strokeStyle = 'rgba(148,163,184,0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, plot.w - 1, plot.h - 1);
  };

  Engine.prototype._drawGrids = function () {
    var ctx = this.ctx, plot = this.plot, i, t;
    var bottom = this.lastPaneBottom || plot.bottom;
    ctx.strokeStyle = P.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < this.priceTicks.length; i++) {
      t = this.priceTicks[i];
      var y = Math.round(t.y) + 0.5;
      if (y <= plot.y || y >= plot.bottom) continue;
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.right, y);
    }
    for (i = 0; i < this.timeTicks.length; i++) {
      t = this.timeTicks[i];
      var x = Math.round(t.x) + 0.5;
      if (x <= plot.x || x >= plot.right) continue;
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, bottom);
    }
    ctx.stroke();
    // 面板分隔线
    ctx.strokeStyle = P.axisLine;
    ctx.beginPath();
    for (i = 0; i < this.panes.length; i++) {
      var py = Math.round(this.panes[i].y) + 0.5;
      ctx.moveTo(this.panes[i].x, py);
      ctx.lineTo(this.panes[i].right, py);
    }
    ctx.stroke();
  };

  Engine.prototype._drawCandles = function () {
    var ctx = this.ctx, plot = this.plot, bars = this.bars, view = this.view;
    var n = bars.length;
    var from = Math.max(0, Math.floor(view.from) - 1);
    var to = Math.min(n - 1, Math.ceil(view.to) + 1);
    var bw = this.barW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    for (var i = from; i <= to; i++) {
      if (this.replayPreview && this.view.to >= n - 2 && this.replayPreview.barIndex === i) continue;
      var b = bars[i];
      if (!b) continue;
      var o = H.num(b.o, NaN), hh = H.num(b.h, NaN), ll = H.num(b.l, NaN), c = H.num(b.c, NaN);
      if (![o, hh, ll, c].every(isFinite)) continue;
      var x = this.xOfBar(i);
      var xr = Math.round(x) + 0.5;
      var yO = this.yOfPrice(o), yC = this.yOfPrice(c);
      var yH = this.yOfPrice(hh), yL = this.yOfPrice(ll);
      var up = c >= o;
      var color = up ? P.bull : P.bear;
      if (bw < 1.4) { color = up ? P.volumeUp : P.volumeDown; }
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.96;
      ctx.lineWidth = bw >= 8 ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(xr, yH);
      ctx.lineTo(xr, yL);
      ctx.stroke();
      if (bw >= 2.4) {
        var bodyW = H.clamp(bw * 0.68, 1, 20);
        var top = Math.min(yO, yC);
        var hgt = Math.max(1, Math.abs(yC - yO));
        ctx.fillRect(x - bodyW / 2, top, bodyW, hgt);
      } else {
        ctx.fillRect(xr - 0.5, Math.min(yO, yC), 1, Math.max(1, Math.abs(yC - yO)));
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  Engine.prototype._drawHoverBand = function () {
    if (!this.hover.active || this.hover.bar === null || this.hover.bar === undefined) return;
    var i = H.clamp(this.hover.bar, 0, this.bars.length - 1);
    if (i < this.view.from - 1 || i > this.view.to + 1) return;
    var half = Math.max(1, this.barW / 2);
    var x = this.xOfBar(i);
    this.ctx.fillStyle = 'rgba(203,213,225,0.055)';
    this.ctx.fillRect(x - half, this.plot.y, half * 2, this.plot.h);
  };

  Engine.prototype._drawPanes = function () {
    for (var i = 0; i < this.panes.length; i++) {
      var pn = this.panes[i];
      if (pn.key === 'ladder') PN.drawLadder(this.ctx, this, pn, false);
      else PN.drawPane(this.ctx, this, pn, pn);
    }
    // 各面板顶端细分隔线
    this.ctx.strokeStyle = P.axisLine;
    this.ctx.lineWidth = 1;
    for (var k = 0; k < this.panes.length; k++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.panes[k].x, Math.round(this.panes[k].y) + 0.5);
      this.ctx.lineTo(this.panes[k].right, Math.round(this.panes[k].y) + 0.5);
      this.ctx.stroke();
    }
    if (this.options.paneResizing) {
      var separators = [this.plot.bottom].concat(this.panes.slice(0, -1).map(function (pane) { return pane.bottom; }));
      this.ctx.fillStyle = 'rgba(125,211,252,0.58)';
      separators.forEach(function (y) { this.ctx.fillRect(this.plot.x + this.plot.w * 0.46, Math.round(y) - 1, this.plot.w * 0.08, 3); }, this);
    }
  };

  Engine.prototype._drawAxes = function () {
    var ctx = this.ctx, plot = this.plot, axis = this.axis, ta = this.timeAxis;
    var axisFont = this.narrow ? C.sizes.axisNarrow : C.sizes.axis;
    // 价格轴
    ctx.strokeStyle = P.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(plot.right) + 0.5, plot.y);
    ctx.lineTo(Math.round(plot.right) + 0.5, plot.bottom);
    ctx.stroke();
    H.setFont(ctx, axisFont, '400', true);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = P.axisText;
    for (var i = 0; i < this.priceTicks.length; i++) {
      var t = this.priceTicks[i];
      if (t.y < plot.y + 2 || t.y > plot.bottom - 2) continue;
      ctx.fillText(t.label, plot.right + 6, t.y + 0.5);
    }
    // 时间轴
    var bottomY = Math.round(ta.y) + 0.5;
    ctx.strokeStyle = P.axisLine;
    ctx.beginPath();
    ctx.moveTo(plot.x, bottomY);
    ctx.lineTo(plot.right, bottomY);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, ta.y, plot.w, ta.h);
    ctx.clip();
    H.setFont(ctx, axisFont, '400', true);
    ctx.textAlign = 'center';
    ctx.fillStyle = P.axisText;
    for (var k = 0; k < this.timeTicks.length; k++) {
      var tt = this.timeTicks[k];
      if (tt.x < plot.x - 1 || tt.x > plot.right + 1) continue;
      var tw = ctx.measureText(tt.label).width;
      var tx = H.clamp(tt.x, plot.x + tw / 2 + 2, plot.right - tw / 2 - 2);
      ctx.fillText(tt.label, tx, ta.y + ta.h / 2 + 1);
    }
    ctx.restore();
    if (this._interactive()) {
      // 右下角：复原按钮；价格轴手动拉伸时高亮提示
      var manual = !!this.priceScaleOverride;
      var cx = axis.x + 4, cy = ta.y + 2, cw = Math.max(20, axis.w - 8), ch = Math.max(12, ta.h - 4);
      ctx.fillStyle = manual ? 'rgba(240,185,11,0.18)' : 'rgba(148,163,184,0.10)';
      ctx.fillRect(cx, cy, cw, ch);
      H.setFont(ctx, axisFont - 1, '600', false);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = manual ? '#f0b90b' : P.axisText;
      ctx.fillText(manual ? '⟲ 自动' : '⟲ 复原', cx + cw / 2, cy + ch / 2 + 0.5);
    }
  };

  Engine.prototype._drawCrosshair = function () {
    var hv = this.hover;
    if (!hv || !hv.active) return;
    var ctx = this.ctx, plot = this.plot;
    if (hv.x < plot.x || hv.x > plot.right) return;
    if (hv.y < plot.y || hv.y > (this.lastPaneBottom || plot.bottom)) return;
    var bar = H.clamp(hv.bar === null ? 0 : hv.bar, 0, this.bars.length - 1);
    var x = this.xOfBar(hv.i !== undefined ? hv.i : bar);
    // 若十字线柱已滚出视野则用光标 x
    if (x < plot.x - 2 || x > plot.right + 2) x = H.clamp(hv.x, plot.x, plot.right);
    var inPlot = hv.y >= plot.y && hv.y <= plot.bottom;
    ctx.save();
    ctx.strokeStyle = P.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, plot.y);
    ctx.lineTo(Math.round(x) + 0.5, this.lastPaneBottom || plot.bottom);
    if (inPlot) {
      ctx.moveTo(plot.x, Math.round(hv.y) + 0.5);
      ctx.lineTo(plot.right, Math.round(hv.y) + 0.5);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // 价格标签（贴在价格轴上）
    if (inPlot) {
      var price = this.priceAtY(hv.y);
      var dec = Math.max(this.priceDecimals, 2);
      var label = H.fmtFixed(price, Math.min(4, dec));
      var chipW = this.axis.w - 6;
      var chipH = 17;
      ctx.fillStyle = P.crosshairBg;
      H.roundRect(ctx, plot.right + 3, hv.y - chipH / 2, chipW, chipH, 3);
      ctx.fill();
      H.setFont(ctx, this.narrow ? C.sizes.axisNarrow : C.sizes.axis, '600', true);
      ctx.fillStyle = P.crosshairText;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(label, plot.right + 3 + chipW / 2, hv.y + 0.5);
    }
    // 时间标签（贴在时间轴上）
    var barData = this.bars[bar];
    if (barData) {
      var spanMs = (this.view.to - this.view.from) * H.num(this.scenario.intervalMs, 3600000);
      var tLabel = this.formatTime ? this.formatTime(barData.t) : H.timeLabel(barData.t, spanMs, 'full');
      H.setFont(ctx, this.narrow ? C.sizes.axisNarrow : C.sizes.axis, '500', true);
      var tw = ctx.measureText(tLabel).width + 12;
      var tx = H.clamp(x - tw / 2, plot.x, plot.right - tw);
      var ty = this.timeAxis.y + 2;
      ctx.fillStyle = P.crosshairBg;
      H.roundRect(ctx, tx, ty, tw, 16, 3);
      ctx.fill();
      ctx.fillStyle = P.crosshairText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tLabel, tx + tw / 2, ty + 8.5);
    }
    ctx.restore();
  };

  Engine.prototype._drawFootprintBadge = function (state) {
    if (!state || !this.labels) return;
    var plot = this.plot;
    var y = plot.y + (this.options.compact ? 8 : 6);
    var font = this.narrow ? 9 : 9.5;
    if (state.ok) {
      this.labels.add(this.narrow ? '足迹 · 买×卖' : 'FOOTPRINT 足迹：买量×卖量 · 黄色行=该 K 线 POC', {
        x: plot.x + 5, y: y, align: 'left', vAlign: 'below', offset: 1,
        color: '#9fd0ff', border: 'rgba(74,168,255,0.42)', font: font,
        maxWidth: Math.min(330, plot.w - 12)
      });
    } else {
      var msg = state.reason === 'dense'
        ? '足迹数据过密：滚轮放大或双击复位后再看每档 bid×ask'
        : '该情景没有足迹数据（panels.footprint=true 但没有 bar.fp）';
      this.labels.add(msg, {
        x: plot.x + plot.w / 2, y: y, align: 'center', vAlign: 'below', offset: 1,
        color: '#ffd666', border: 'rgba(240,185,11,0.42)', font: font,
        maxWidth: Math.min(420, plot.w - 12)
      });
    }
  };

  Engine.prototype._drawPlaceholder = function (customMsg) {
    if (!this.ctx) return;
    var ctx = this.ctx, w = this._cssW, h = this._cssH;
    if (!(w > 0 && h > 0)) return;
    ctx.save();
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    var pw = Math.min(w - 28, 520);
    var ph = Math.min(h - 28, 128);
    var px = (w - pw) / 2, py = (h - ph) / 2;
    ctx.fillStyle = 'rgba(240,185,11,0.04)';
    H.roundRect(ctx, px, py, pw, ph, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,185,11,0.42)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    H.roundRect(ctx, px + 0.5, py + 0.5, pw - 1, ph - 1, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    H.setFont(ctx, 14, '600');
    ctx.fillStyle = P.placeholderText;
    ctx.fillText('图表数据缺失', w / 2, py + ph * 0.3);
    H.setFont(ctx, 11, '400');
    ctx.fillStyle = P.textDim;
    var msg = customMsg || this.scenarioError || '情景不存在或没有 K 线数据';
    var maxLen = Math.max(10, Math.floor(pw / 7));
    if (msg.length > maxLen) msg = msg.slice(0, maxLen - 1) + '…';
    ctx.fillText(msg, w / 2, py + ph * 0.56);
    if (pw > 300) {
      H.setFont(ctx, 10, '400');
      ctx.fillStyle = P.textFaint;
      ctx.fillText('请检查情景 id 是否已在 LQ.data.registerScenario() 注册', w / 2, py + ph * 0.78);
    }
    ctx.restore();
  };

  /* ================================================================ *
   * 交互
   * ================================================================ */
  Engine.prototype._interactive = function () {
    return this.options.interactive !== false && this.scenario && !this.destroyed;
  };

  Engine.prototype._on = function (target, type, fn, opts) {
    if (!target || !isFn(target.addEventListener)) return;
    target.addEventListener(type, fn, opts);
    this._offs.push([target, type, fn, opts]);
  };

  Engine.prototype._setupObserver = function () {
    var self = this;
    if (typeof global.ResizeObserver === 'function' && this.wrapper) {
      try {
        this.observer = new global.ResizeObserver(function () { self.resize(); });
        this.observer.observe(this.wrapper);
        if (this.options.fillHeight && this.host) this.observer.observe(this.host);
      } catch (err) {
        this.observer = null;
      }
    }
    if (!this.observer) {
      this._on(global, 'resize', function () { self.resize(); });
    }
  };

  Engine.prototype._bindEvents = function () {
    var self = this;
    var canvas = this.canvas;
    if (!canvas) return;
    var h = this._handlers;
    h.wheel = function (e) { self._onWheel(e); };
    h.pointerdown = function (e) { self._onPointerDown(e); };
    h.pointermove = function (e) { self._onPointerMove(e); };
    h.pointerup = function (e) { self._onPointerUp(e); };
    h.pointercancel = function (e) { self._onPointerUp(e); };
    h.pointerleave = function (e) { self._onPointerLeave(e); };
    h.dblclick = function (e) { self._onDblClick(e); };
    h.contextmenu = function (e) { e.preventDefault(); };
    this._on(canvas, 'wheel', h.wheel, { passive: false });
    this._on(canvas, 'pointerdown', h.pointerdown);
    this._on(canvas, 'pointermove', h.pointermove);
    this._on(canvas, 'pointerup', h.pointerup);
    this._on(canvas, 'pointercancel', h.pointercancel);
    this._on(canvas, 'pointerleave', h.pointerleave);
    this._on(canvas, 'dblclick', h.dblclick);
    this._on(canvas, 'contextmenu', h.contextmenu);
    if (this.axisHits) {
      Object.keys(this.axisHits).forEach(function (key) {
        var el = self.axisHits[key];
        self._on(el, 'wheel', h.wheel, { passive: false });
        self._on(el, 'pointerdown', h.pointerdown);
        self._on(el, 'pointermove', h.pointermove);
        self._on(el, 'pointerup', h.pointerup);
        self._on(el, 'pointercancel', h.pointercancel);
        self._on(el, 'dblclick', h.dblclick);
        self._on(el, 'contextmenu', h.contextmenu);
      });
    }
    // V2：Esc 取消画线 / 退出当前工具
    if (global.document) {
      h.keydown = function (e) { self._onKeyDown(e); };
      this._on(global.document, 'keydown', h.keydown);
    }
  };

  Engine.prototype._pointerPos = function (e) {
    var rect = this.canvas ? this.canvas.getBoundingClientRect() : null;
    if (!rect) return { x: 0, y: 0 };
    // 手机竖屏下用 CSS 旋转 90° 模拟横屏：屏幕坐标需要转回画布坐标
    if (this.wrapper && this.wrapper.closest && this.wrapper.closest('.is-rotated')) {
      return { x: e.clientY - rect.top, y: rect.right - e.clientX };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  Engine.prototype._onWheel = function (e) {
    if (!this._interactive()) return;
    e.preventDefault();
    var pos = this._pointerPos(e);
    var plot = this.plot, n = this.bars.length;
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= 100;
    if (this.options.axisScale && pos.x >= plot.right && pos.x <= plot.right + this.axis.w && pos.y >= plot.y && pos.y <= plot.bottom) {
      var anchorPrice = this.priceAtY(H.clamp(pos.y, plot.y, plot.bottom));
      var oldRange = this.yMax - this.yMin, nextRange = H.clamp(oldRange * Math.exp(dy * 0.002), Math.max(0.000001, oldRange * 0.02), oldRange * 50);
      var fracPrice = H.clamp((anchorPrice - this.yMin) / Math.max(0.000001, oldRange), 0, 1);
      this.priceScaleOverride = { min: anchorPrice - fracPrice * nextRange, max: anchorPrice + (1 - fracPrice) * nextRange };
      this._invalidate(); return;
    }
    if (pos.x < plot.x || pos.x > plot.right) return;
    var span = this.view.to - this.view.from;
    var dx = e.deltaX || 0;
    if (e.deltaMode === 1) dx *= 16;
    else if (e.deltaMode === 2) dx *= 100;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) {
      // 触控板左右滑 / Shift+滚轮：平移
      var shift = dx / Math.max(0.001, this.barW);
      this.view = this._clampView({ from: this.view.from + shift, to: this.view.to + shift });
      this._notifyViewport();
      this.hover.active = false;
      this._invalidate();
      return;
    }
    var maxSpan = Math.max(1, n - 1);
    var minSpan = Math.min(9, maxSpan);
    var factor = Math.pow(1.0018, dy);
    var newSpan = H.clamp(span * factor, minSpan, maxSpan);
    if (Math.abs(newSpan - span) < 1e-4) return;
    var frac = H.clamp((pos.x - plot.x) / plot.w, 0, 1);
    var anchor = this.view.from + frac * (span + 1 + this.trailingBars) - 0.5;
    var newFrom = anchor + 0.5 - frac * (newSpan + 1 + this.trailingBars);
    this.view = this._clampView({ from: newFrom, to: newFrom + newSpan });
    this._notifyViewport();
    this.hover.active = false;
    this._invalidate();
  };

  Engine.prototype._setHover = function (x, y) {
    if (!this.scenario || !this._cssW) return;
    var plot = this.plot;
    if (x < plot.x || x > plot.right) { this.hover.active = false; return; }
    if (y < plot.y || y > (this.lastPaneBottom || plot.bottom)) { this.hover.active = false; return; }
    var bar = Math.round(this.view.from + (x - plot.x) / this.barW - 0.5);
    bar = H.clamp(bar, 0, this.bars.length - 1);
    this.hover = {
      active: true,
      bar: bar,
      i: bar,
      x: x,
      y: y,
      inPlot: y >= plot.y && y <= plot.bottom,
      price: y >= plot.y && y <= plot.bottom ? this.priceAtY(y) : null
    };
  };

  Engine.prototype._onPointerDown = function (e) {
    if (!this._interactive()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var pos = this._pointerPos(e);
    if (!this.tool && pos.x >= this.plot.right && pos.x <= this.plot.right + this.axis.w && pos.y >= this.timeAxis.y) {
      e.preventDefault();
      this.priceScaleOverride = null;
      this.resetViewport();
      return;
    }
    var boundary = this._paneBoundaryAt(pos);
    if (boundary >= 0) {
      var pair = this._paneLayout[boundary], next = this._paneLayout[boundary + 1];
      this.paneResizeDrag = { id: e.pointerId, boundary: boundary, startY: pos.y, startTop: pair.h, total: pair.h + next.h };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.canvas.style.cursor = 'ns-resize'; return;
    }
    if (this.options.axisScale && pos.x >= this.plot.right && pos.x <= this.plot.right + this.axis.w && pos.y >= this.plot.y && pos.y <= this.plot.bottom && !this.tool) {
      this.axisScaleDrag = { id: e.pointerId, startY: pos.y, min: this.yMin, max: this.yMax, anchor: this.priceAtY(pos.y) };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.canvas.style.cursor = 'ns-resize'; return;
    }
    if (this.options.timeAxisScale && pos.y >= this.timeAxis.y && pos.x >= this.plot.x && pos.x <= this.plot.right && !this.tool) {
      this.timeZoomDrag = { id: e.pointerId, startX: pos.x, from: this.view.from, to: this.view.to };
      try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this.canvas.style.cursor = 'ew-resize'; return;
    }
    // V2：画线工具激活时，按下开始创建画线（而不是平移）
    if (this.tool) {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      this.ptrs[e.pointerId] = { x: pos.x, y: pos.y, type: e.pointerType };
      this._beginToolDraw(e, pos);
      return;
    }
    this.ptrs[e.pointerId] = { x: pos.x, y: pos.y, type: e.pointerType };
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    var count = Object.keys(this.ptrs).length;
    if (count === 1) {
      this.drag = {
        id: e.pointerId, startX: pos.x, startY: pos.y, lastX: pos.x,
        from: this.view.from, to: this.view.to, moved: false, pointerType: e.pointerType,
        price: this.priceScaleOverride ? { min: this.priceScaleOverride.min, max: this.priceScaleOverride.max } : null
      };
    } else if (count === 2) {
      this.drag = null;
      this._startPinch();
    }
  };

  Engine.prototype._startPinch = function () {
    var ids = Object.keys(this.ptrs);
    if (ids.length !== 2 || !this._interactive()) { this.pinch = null; return; }
    var a = this.ptrs[ids[0]], b = this.ptrs[ids[1]];
    var sepX = Math.abs(a.x - b.x), sepY = Math.abs(a.y - b.y);
    this.pinch = {
      // 两指横向分开 → 缩放时间；两指上下分开 → 拉伸价格
      mode: sepY > sepX * 1.4 && sepY > 40 ? 'price' : 'time',
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      sepY: Math.max(20, sepY),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2,
      min: this.yMin, max: this.yMax,
      from: this.view.from, to: this.view.to
    };
    this.hover.active = false;
  };

  Engine.prototype._onPointerMove = function (e) {
    if (!this._interactive()) return;
    var pos = this._pointerPos(e);
    if (this.ptrs[e.pointerId]) { this.ptrs[e.pointerId].x = pos.x; this.ptrs[e.pointerId].y = pos.y; }
    if (!this.scenario) return;
    if (this.paneResizeDrag && this.paneResizeDrag.id === e.pointerId) {
      this.resizePaneBoundary(this.paneResizeDrag.boundary, pos.y - this.paneResizeDrag.startY, this.paneResizeDrag.startTop);
      return;
    }
    if (this.axisScaleDrag && this.axisScaleDrag.id === e.pointerId) {
      var scale = this.axisScaleDrag, initialRange = scale.max - scale.min;
      var nextRange = H.clamp(initialRange * Math.exp((pos.y - scale.startY) * 0.005), Math.max(0.000001, initialRange * 0.02), initialRange * 50);
      var anchorFrac = H.clamp((scale.anchor - scale.min) / initialRange, 0, 1);
      this.priceScaleOverride = { min: scale.anchor - anchorFrac * nextRange, max: scale.anchor + (1 - anchorFrac) * nextRange };
      this._invalidate(); return;
    }
    if (this.timeZoomDrag && this.timeZoomDrag.id === e.pointerId) {
      var zoom = this.timeZoomDrag, span = zoom.to - zoom.from, nBars = this.bars.length;
      var nextSpan = H.clamp(span * Math.exp((pos.x - zoom.startX) * 0.006), Math.min(9, nBars - 1), nBars - 1);
      var center = (zoom.from + zoom.to) / 2;
      this.view = this._clampView({ from: center - nextSpan / 2, to: center + nextSpan / 2 });
      this._notifyViewport();
      this._invalidate(); return;
    }
    // V2：拖拽创建画线时的实时预览
    if (this._toolDraw && this._toolDraw.id === e.pointerId) {
      this._updateToolDraw(pos);
      return;
    }
    // 双指缩放
    if (this.pinch && Object.keys(this.ptrs).length >= 2) {
      var ids = Object.keys(this.ptrs);
      var a = this.ptrs[ids[0]], b = this.ptrs[ids[1]];
      if (this.pinch.mode === 'price') {
        var range0 = this.pinch.max - this.pinch.min;
        var ratio = this.pinch.sepY / Math.max(20, Math.abs(a.y - b.y));
        var nextR = H.clamp(range0 * ratio, Math.max(0.000001, range0 * 0.02), range0 * 50);
        var span0p = Math.max(1, this.plot.h);
        var fracY = H.clamp((this.plot.bottom - this.pinch.midY) / span0p, 0, 1);
        var anchorP = this.pinch.min + fracY * range0;
        this.priceScaleOverride = { min: anchorP - fracY * nextR, max: anchorP + (1 - fracY) * nextR };
        this._invalidate();
        return;
      }
      var dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      var midX = (a.x + b.x) / 2;
      var plot = this.plot, n = this.bars.length;
      var factor = this.pinch.dist / dist;
      var span = this.pinch.to - this.pinch.from;
      var maxSpan = Math.max(1, n - 1);
      var minSpan = Math.min(9, maxSpan);
      var newSpan = H.clamp(span * factor, minSpan, maxSpan);
      var frac = H.clamp((midX - plot.x) / plot.w, 0, 1);
      var anchor = this.pinch.from + frac * (span + 1 + this.trailingBars) - 0.5;
      var newFrom = anchor + 0.5 - frac * (newSpan + 1 + this.trailingBars);
      this.view = this._clampView({ from: newFrom, to: newFrom + newSpan });
      this._notifyViewport();
      this._invalidate();
      return;
    }
    if (this.drag && this.drag.id === e.pointerId) {
      var dx = pos.x - this.drag.startX;
      var dy = pos.y - this.drag.startY;
      if (!this.drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) this.drag.moved = true;
      if (this.drag.moved) {
        var span0 = this.drag.to - this.drag.from;
        var bw = this.plot.w / Math.max(1, span0 + 1 + this.trailingBars);
        var shiftBars = -dx / Math.max(0.001, bw);
        this.view = this._clampView({ from: this.drag.from + shiftBars, to: this.drag.to + shiftBars });
        if (this.drag.price) {
          // 价格轴被手动拉伸后，拖动 K 线区域同时上下平移价格
          var pr = this.drag.price, shiftPrice = dy / Math.max(1, this.plot.h) * (pr.max - pr.min);
          this.priceScaleOverride = { min: pr.min + shiftPrice, max: pr.max + shiftPrice };
        }
        this._notifyViewport();
        this.hover.active = false;
        if (this.canvas) this.canvas.style.cursor = 'grabbing';
        this._invalidate();
      } else if (e.pointerType === 'mouse') {
        this._setHover(pos.x, pos.y);
        this._invalidate();
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      if (this.options.paneResizing && this._paneBoundaryAt(pos) >= 0) { this.canvas.style.cursor = 'ns-resize'; return; }
      if (this.options.axisScale && pos.x >= this.plot.right && pos.x <= this.plot.right + this.axis.w && pos.y >= this.plot.y && pos.y <= this.plot.bottom) { this.canvas.style.cursor = 'ns-resize'; return; }
      if (this.options.timeAxisScale && pos.y >= this.timeAxis.y && pos.x >= this.plot.x && pos.x <= this.plot.right) { this.canvas.style.cursor = 'ew-resize'; return; }
      if (this.options.drawingEdit) {
        var editHit = this._annotationHit(pos) || this._drawingHit(pos);
        if (editHit) { this.canvas.style.cursor = editHit.handle && editHit.handle !== 'body' ? 'crosshair' : 'move'; return; }
      }
      if (this.canvas) this.canvas.style.cursor = 'crosshair';
      this._setHover(pos.x, pos.y);
      this._invalidate();
    }
  };

  Engine.prototype._onPointerUp = function (e) {
    if ((this.paneResizeDrag && this.paneResizeDrag.id === e.pointerId) ||
        (this.axisScaleDrag && this.axisScaleDrag.id === e.pointerId) ||
        (this.timeZoomDrag && this.timeZoomDrag.id === e.pointerId)) {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      this.paneResizeDrag = null; this.axisScaleDrag = null; this.timeZoomDrag = null;
      if (this.canvas) this.canvas.style.cursor = 'crosshair';
      this._invalidate(); return;
    }
    // V2：结束画线创建
    if (this._toolDraw && this._toolDraw.id === e.pointerId) {
      var posT = this._pointerPos(e);
      try { if (this.canvas) this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      delete this.ptrs[e.pointerId];
      this._finalizeToolDraw(posT);
      return;
    }
    var had = !!this.ptrs[e.pointerId];
    delete this.ptrs[e.pointerId];
    try { if (this.canvas) this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    if (this.pinch && Object.keys(this.ptrs).length < 2) this.pinch = null;
    var drag = this.drag && this.drag.id === e.pointerId ? this.drag : null;
    if (drag) {
      this.drag = null;
      if (this.canvas) this.canvas.style.cursor = 'crosshair';
    }
    if (!this.scenario) return;
    if (!drag || drag.moved) { if (drag) this._invalidate(); return; }
    var pos = this._pointerPos(e);
    if (e.pointerType === 'touch') {
      var now = Date.now();
      if (this.lastTap && now - this.lastTap.t < 320 &&
        Math.abs(pos.x - this.lastTap.x) < 28 && Math.abs(pos.y - this.lastTap.y) < 28) {
        this.lastTap = null;
        this.resetViewport();
        return;
      }
      this.lastTap = { t: now, x: pos.x, y: pos.y };
      this._setHover(pos.x, pos.y);
    } else {
      this._setHover(pos.x, pos.y);
    }
    this._invalidate();
  };

  Engine.prototype._onPointerLeave = function (e) {
    if (this._toolDraw) return;
    if (this.drag || Object.keys(this.ptrs).length) return;
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (this.hover.active) {
      this.hover.active = false;
      this._invalidate();
    }
  };

  Engine.prototype._onDblClick = function (e) {
    if (!this._interactive()) return;
    if (this.tool) return; // 画线工具激活时双击不重置视口
    e.preventDefault();
    var pos = this._pointerPos(e);
    if (this.options.axisScale && pos.x >= this.plot.right && pos.x <= this.plot.right + this.axis.w && pos.y >= this.plot.y && pos.y <= this.plot.bottom) {
      this.priceScaleOverride = null; this._invalidate(); return;
    }
    if (pos.y < this.timeAxis.y) this.priceScaleOverride = null;
    this.resetViewport();
  };

  C.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
