/* ==========================================================================
 * 图表引擎 · 教学标注层（chart-engineer 维护）
 * 负责 7 种标注（zone / hline / marker / segment / text / fib / range）的
 * 解析、参与价格轴范围计算、分段绘制，以及带背景/防重叠/防溢出的标签层。
 * 依赖：LQ.chart.palette / tones / helpers（indicators.js，先加载）。
 * ========================================================================== */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var C = LQ.chart = LQ.chart || {};
  var H = C.helpers;
  var P = C.palette;

  var KINDS = {
    zone: 1, hline: 1, marker: 1, segment: 1, text: 1, fib: 1, range: 1,
    vprofile: 1, vpline: 1
  };
  var TONE_NAMES = { bull: 1, bear: 1, neutral: 1, info: 1, warn: 1 };
  var DEFAULT_FIB_LEVELS = [0.382, 0.5, 0.618, 0.705, 0.79];
  var MAX_FIB_LEVEL = 5; // 允许 1.272 / 1.618 / 2 / 2.618 等扩展位（上限 5）

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function num(v, fallback) { return H.num(v, fallback); }
  function clamp(v, a, b) { return H.clamp(v, a, b); }

  /* 单条原始标注 → 内部规范化对象；无效返回 null（不抛异常） */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var kind = raw.kind || raw.type;
    if (!KINDS[kind]) return null;
    var ann = {
      kind: kind,
      tone: TONE_NAMES[raw.tone] ? raw.tone : 'neutral',
      label: raw.label !== undefined && raw.label !== null ? String(raw.label)
        : (raw.text !== undefined && raw.text !== null ? String(raw.text) : ''),
      raw: raw
    };
    var t;
    switch (kind) {
      case 'zone':
        ann.x1 = num(raw.x1, 0);
        ann.x2 = num(raw.x2, ann.x1);
        ann.y1 = num(raw.y1, NaN);
        ann.y2 = num(raw.y2, NaN);
        if (!isNum(ann.y1) || !isNum(ann.y2)) return null;
        if (ann.y1 > ann.y2) { t = ann.y1; ann.y1 = ann.y2; ann.y2 = t; }
        if (ann.x1 > ann.x2) { t = ann.x1; ann.x1 = ann.x2; ann.x2 = t; }
        ann.hatch = !!raw.hatch; // V2：斜线填充（OB / FVG 区分）
        break;
      case 'hline':
        ann.x1 = raw.x1 === null || raw.x1 === undefined ? null : num(raw.x1, null);
        ann.x2 = raw.x2 === null || raw.x2 === undefined ? null : num(raw.x2, null);
        ann.y = num(raw.y, NaN);
        if (!isNum(ann.y)) return null;
        break;
      case 'marker':
        ann.x = num(raw.x, NaN);
        ann.y = num(raw.y, NaN);
        if (!isNum(ann.x) || !isNum(ann.y)) return null;
        ann.position = raw.position === 'below' ? 'below' : 'above';
        ann.text = ann.label;
        break;
      case 'segment':
        ann.x1 = num(raw.x1, NaN); ann.y1 = num(raw.y1, NaN);
        ann.x2 = num(raw.x2, NaN); ann.y2 = num(raw.y2, NaN);
        if (![ann.x1, ann.y1, ann.x2, ann.y2].every(isNum)) return null;
        ann.arrow = !!raw.arrow;
        ann.dashed = !!raw.dashed;
        ann.width = clamp(num(raw.width, 1.5) || 1.5, 1, 4);
        break;
      case 'text':
        ann.x = num(raw.x, NaN);
        ann.y = num(raw.y, NaN);
        if (!isNum(ann.x) || !isNum(ann.y)) return null;
        ann.text = ann.label;
        break;
      case 'fib':
        ann.x1 = num(raw.x1, NaN); ann.y1 = num(raw.y1, NaN);
        ann.x2 = num(raw.x2, NaN); ann.y2 = num(raw.y2, NaN);
        if (![ann.x1, ann.y1, ann.x2, ann.y2].every(isNum)) return null;
        ann.levels = [];
        if (Array.isArray(raw.levels)) {
          raw.levels.forEach(function (lv) {
            var n = Number(lv);
            // V2：允许 >1 的扩展位（1.272 / 1.618 / 2 ...）
            if (isFinite(n) && n > 0 && n <= MAX_FIB_LEVEL) ann.levels.push(n);
          });
        }
        if (!ann.levels.length) ann.levels = DEFAULT_FIB_LEVELS.slice();
        ann.levelsLabels = null;
        if (Array.isArray(raw.levelsLabels)) {
          ann.levelsLabels = ann.levels.map(function (lv, idx) {
            var v = raw.levelsLabels[idx];
            return v === undefined || v === null ? null : String(v);
          });
        } else if (raw.levelsLabels && typeof raw.levelsLabels === 'object') {
          // 兼容 map 形式：{ '1.272': '127.2%', '1.618': '161.8%' }（QA / 内容作者都可能用）
          ann.levelsLabels = ann.levels.map(function (lv, idx) {
            var v = raw.levelsLabels[String(lv)];
            if (v === undefined) v = raw.levelsLabels[idx];
            if (v === undefined) {
              Object.keys(raw.levelsLabels).some(function (key) {
                var n = Number(key);
                if (isFinite(n) && Math.abs(n - lv) < 1e-9) { v = raw.levelsLabels[key]; return true; }
                return false;
              });
            }
            return v === undefined || v === null ? null : String(v);
          });
        }
        ann.showExtension = raw.showExtension !== false;
        ann.band = raw.band === true; // V2：回撤区浅色带（显式开启）
        break;
      case 'range':
        ann.x1 = num(raw.x1, 0);
        ann.x2 = num(raw.x2, ann.x1);
        if (ann.x1 > ann.x2) { t = ann.x1; ann.x1 = ann.x2; ann.x2 = t; }
        ann.y1 = raw.y1 === undefined || raw.y1 === null ? null : num(raw.y1, null);
        ann.y2 = raw.y2 === undefined || raw.y2 === null ? null : num(raw.y2, null);
        if (ann.y1 !== null && ann.y2 !== null && ann.y1 > ann.y2) { t = ann.y1; ann.y1 = ann.y2; ann.y2 = t; }
        break;
      case 'vprofile':
        ann.x1 = num(raw.x1, NaN);
        ann.x2 = num(raw.x2, NaN);
        if (!isNum(ann.x1) || !isNum(ann.x2)) return null;
        if (ann.x1 > ann.x2) { t = ann.x1; ann.x1 = ann.x2; ann.x2 = t; }
        ann.bins = clamp(Math.round(num(raw.bins, 24)), 6, 60);
        ann.showPOC = raw.showPOC !== false;
        ann.showVA = raw.showVA !== false;
        ann.side = raw.side === 'left' || raw.side === 'float' ? raw.side : 'right';
        ann.hideLabels = !!raw.hideLabels;
        ann.vaPercent = clamp(num(raw.vaPercent, 0.7), 0.05, 0.99);
        break;
      case 'vpline':
        ann.x1 = num(raw.x1, NaN);
        ann.x2 = num(raw.x2, NaN);
        if (!isNum(ann.x1) || !isNum(ann.x2)) return null;
        if (ann.x1 > ann.x2) { t = ann.x1; ann.x1 = ann.x2; ann.x2 = t; }
        ann.level = raw.level === 'vah' || raw.level === 'val' ? raw.level : 'poc';
        var rng = raw.range && isNum(num(raw.range.x1, NaN)) && isNum(num(raw.range.x2, NaN))
          ? { x1: num(raw.range.x1, ann.x1), x2: num(raw.range.x2, ann.x2) }
          : { x1: ann.x1, x2: ann.x2 };
        if (rng.x1 > rng.x2) { t = rng.x1; rng.x1 = rng.x2; rng.x2 = t; }
        ann.range = rng;
        ann.hideLabels = !!raw.hideLabels;
        break;
      default:
        return null;
    }
    return ann;
  }

  /* setAnnotations 列表解析：支持 'all' / 事件 id 字符串 / 原始标注对象 / 单值 */
  function resolve(list, scenario) {
    var events = (scenario && scenario.events) || {};
    var out = [];
    var seenRaw = [];
    var warned = {};

    function pushRaw(raw) {
      if (!raw || typeof raw !== 'object') return;
      if (seenRaw.indexOf(raw) >= 0) return;
      var ann = normalize(raw);
      if (!ann) return;
      seenRaw.push(raw);
      out.push(ann);
    }
    function pushItem(item) {
      if (item === null || item === undefined) return;
      if (typeof item === 'string') {
        if (item === 'all') {
          Object.keys(events).forEach(function (key) { pushRaw(events[key]); });
        } else if (events[item]) {
          pushRaw(events[item]);
        } else if (!warned[item]) {
          warned[item] = true;
          C.warn('setAnnotations: 情景 ' + ((scenario && scenario.id) || '?') + ' 中不存在事件 id "' + item + '"');
        }
        return;
      }
      if (Array.isArray(item)) { item.forEach(pushItem); return; }
      if (typeof item === 'object') pushRaw(item);
    }
    if (typeof list === 'string' || Array.isArray(list)) pushItem(list);
    else pushItem(list);
    return out;
  }

  /* vprofile / vpline 的统计结果（带缓存：同一 bars/区间只算一次） */
  function rangeProfileOf(bars, x1, x2, bins, vaPercent) {
    if (!Array.isArray(bars) || !bars.length) return null;
    var data = C.indicators.rangeVolumeProfile(bars, x1, x2, bins || 24, vaPercent);
    return data;
  }
  function vpOf(ann, bars) {
    if (!ann || !Array.isArray(bars) || !bars.length) return null;
    var key = ann.x1 + '|' + ann.x2 + '|' + (ann.bins || 24) + '|' + (ann.vaPercent || 0.7);
    if (ann._vp && ann._vp.bars === bars && ann._vp.key === key) return ann._vp.data;
    var data = rangeProfileOf(bars, ann.x1, ann.x2, ann.bins, ann.vaPercent);
    ann._vp = { bars: bars, key: key, data: data };
    return data;
  }
  function vplineData(ann, bars) {
    if (!ann || !ann.range) return null;
    var key = ann.range.x1 + '|' + ann.range.x2 + '|' + (ann.bins || 24) + '|' + (ann.vaPercent || 0.7);
    if (ann._vp && ann._vp.bars === bars && ann._vp.key === key) return ann._vp.data;
    var data = rangeProfileOf(bars, ann.range.x1, ann.range.x2, ann.bins, ann.vaPercent);
    ann._vp = { bars: bars, key: key, data: data };
    return data;
  }

  /* 把标注纳入价格轴范围（只统计与当前可见区间有交集的标注） */
  function collectPriceRange(anns, view, n, bars) {
    var lo = Infinity, hi = -Infinity;
    function add(y) { if (isNum(y)) { if (y < lo) lo = y; if (y > hi) hi = y; } }
    var from = view.from - 0.51, to = view.to + 0.51;
    function xVisible(x) { return isNum(x) && x >= from && x <= to; }
    function spanVisible(a, b) {
      var x1 = isNum(a) ? a : 0, x2 = isNum(b) ? b : n - 1;
      if (x2 < x1) { var t = x1; x1 = x2; x2 = t; }
      return x2 >= from && x1 <= to;
    }
    if (!Array.isArray(anns)) return null;
    for (var i = 0; i < anns.length; i++) {
      var a = anns[i];
      switch (a.kind) {
        case 'zone':
          if (spanVisible(a.x1, a.x2)) { add(a.y1); add(a.y2); }
          break;
        case 'range':
          if (spanVisible(a.x1, a.x2)) {
            if (isNum(a.y1) && isNum(a.y2)) { add(a.y1); add(a.y2); }
          }
          break;
        case 'hline':
          var l = a.x1 === null ? 0 : a.x1;
          var r = a.x2 === null ? n - 1 : a.x2;
          if (r >= from && l <= to) add(a.y);
          break;
        case 'marker':
        case 'text':
          if (xVisible(a.x)) add(a.y);
          break;
        case 'segment':
          if (spanVisible(a.x1, a.x2)) { add(a.y1); add(a.y2); }
          break;
        case 'fib':
          if (a.x2 <= to) {
            add(a.y1); add(a.y2);
            for (var k = 0; k < a.levels.length; k++) {
              if (a.levels[k] > 1 && !a.showExtension) continue;
              add(a.y2 + (a.y1 - a.y2) * a.levels[k]);
            }
          }
          break;
        case 'vprofile':
          var vp = vpOf(a, bars);
          if (vp) {
            add(vp.lo); add(vp.hi);
            if (a.showPOC) add(vp.poc);
            if (a.showVA) { add(vp.vah); add(vp.val); }
          }
          break;
        case 'vpline':
          var vpl = vplineData(a, bars);
          if (vpl) add(vpl[a.level === 'vah' ? 'vah' : (a.level === 'val' ? 'val' : 'poc')]);
          break;
      }
    }
    if (!isFinite(lo) || !isFinite(hi)) return null;
    return [lo, hi];
  }

  /* ------------------------------------------------------------------ *
   * 标签层：统一负责“文字背景、边界内收、标注间避让”
   * ------------------------------------------------------------------ */
  function LabelLayer(ctx, plot) {
    this.ctx = ctx;
    this.plot = plot;
    this.items = [];
    this.rects = [];
  }
  LabelLayer.prototype.collides = function (r) {
    for (var i = 0; i < this.rects.length; i++) {
      var o = this.rects[i];
      if (r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y) return true;
    }
    return false;
  };
  /* opts: x,y 锚点；align: left|right|center；vAlign: above|below|middle；
   * color/border/bg/font/weight/padX/padY/offset/maxWidth/hideOnCollision/bold */
  LabelLayer.prototype.add = function (text, opts) {
    text = text === null || text === undefined ? '' : String(text).trim();
    if (!text) return null;
    opts = opts || {};
    var ctx = this.ctx, plot = this.plot;
    var fontSize = opts.font || C.sizes.label;
    var weight = opts.weight || '400';
    H.setFont(ctx, fontSize, weight);
    var padX = opts.padX === undefined ? 6 : opts.padX;
    var padY = opts.padY === undefined ? 3 : opts.padY;
    var maxWidth = opts.maxWidth || Math.min(260, plot.w * 0.66);
    var drawText = text;
    var tw = ctx.measureText(drawText).width;
    if (tw + padX * 2 > maxWidth) {
      while (drawText.length > 1 && tw + padX * 2 > maxWidth) {
        drawText = drawText.slice(0, -1);
        tw = ctx.measureText(drawText + '…').width;
      }
      drawText += '…';
      tw = ctx.measureText(drawText).width;
    }
    var w = Math.ceil(tw + padX * 2);
    var h = Math.ceil(fontSize + padY * 2);
    var vAlign = opts.vAlign || 'above';
    var align = opts.align || 'left';
    var offset = opts.offset === undefined ? 4 : opts.offset;
    var dx = align === 'right' ? -w : (align === 'center' ? -w / 2 : 0);
    // offsets 可按标签类型定制（例如 fib 档位标签用居中对齐 + 22px 间距互相避让）
    var dyList = Array.isArray(opts.offsets) ? opts.offsets
      : vAlign === 'above' ? [0, -22, -44, -66, -88, -110]
        : vAlign === 'below' ? [0, 22, 44, 66, -22, 88]
          : [0, -22, 22, -44, 44, -66, 66, -88, 88];
    var minX = plot.x + 2, maxX = plot.right - w - 2;
    var minY = plot.y + 2, maxY = plot.bottom - h - 2;
    var chosen = null, fallback = null, i;
    for (i = 0; i < dyList.length; i++) {
      var rect = {
        x: opts.x + dx,
        y: vAlign === 'above' ? opts.y - offset - h + dyList[i]
          : vAlign === 'below' ? opts.y + offset + dyList[i]
            : opts.y - h / 2 + dyList[i],
        w: w, h: h
      };
      rect.x = clamp(rect.x, minX, Math.max(minX, maxX));
      rect.y = clamp(rect.y, minY, Math.max(minY, maxY));
      if (!fallback) fallback = rect;
      if (!this.collides(rect)) { chosen = rect; break; }
    }
    if (!chosen) {
      if (opts.hideOnCollision) return null;
      chosen = fallback;
    }
    var item = {
      text: drawText, rect: chosen, fontSize: fontSize, weight: weight,
      color: opts.color || P.text,
      border: opts.border || P.chipBorder,
      bg: opts.bg || P.chipBg,
      radius: opts.radius === undefined ? 3 : opts.radius,
      bold: !!opts.bold
    };
    this.items.push(item);
    // 碰撞矩形留 2px 呼吸位
    this.rects.push({ x: chosen.x - 2, y: chosen.y - 2, w: chosen.w + 4, h: chosen.h + 4 });
    return item;
  };
  LabelLayer.prototype.flush = function () {
    var ctx = this.ctx;
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i], r = it.rect;
      ctx.save();
      ctx.globalAlpha = 1;
      H.setFont(ctx, it.fontSize, it.weight);
      ctx.fillStyle = it.bg;
      H.roundRect(ctx, r.x, r.y, r.w, r.h, it.radius);
      ctx.fill();
      if (it.border) {
        ctx.strokeStyle = it.border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = it.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.text, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
      ctx.restore();
    }
    this.items = [];
    this.rects = [];
  };

  /* ------------------------------------------------------------------ *
   * 绘制：背景填充层 → 线层 → 标签层
   * ------------------------------------------------------------------ */
  function clipPlot(ctx, plot) {
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
  }

  function drawFills(ctx, eng, anns) {
    if (!anns || !anns.length) return;
    var plot = eng.plot, view = eng.view;
    ctx.save();
    clipPlot(ctx, plot);
    for (var i = 0; i < anns.length; i++) {
      var a = anns[i], t = C.tone(a.tone);
      if (a.kind === 'zone') {
        var x1 = eng.xOfBar(a.x1), x2 = eng.xOfBar(a.x2);
        var yTop = eng.yOfPrice(a.y2), yBot = eng.yOfPrice(a.y1);
        ctx.fillStyle = t.fill;
        ctx.fillRect(x1, yTop, Math.max(1, x2 - x1), Math.max(1, yBot - yTop));
        ctx.strokeStyle = t.strong;
        ctx.lineWidth = 1;
        ctx.strokeRect(H.clamp(x1, plot.x - 2, plot.right + 2) + 0.5,
          H.clamp(yTop, plot.y - 2, plot.bottom + 2) + 0.5,
          Math.max(1, x2 - x1), Math.max(1, yBot - yTop));
        // V2：斜线填充（区分 OB / FVG 等区域）
        if (a.hatch && x2 - x1 > 2 && yBot - yTop > 2) {
          var zx = H.clamp(x1, plot.x - 2, plot.right + 2);
          var zy = H.clamp(yTop, plot.y - 2, plot.bottom + 2);
          var zw = Math.max(1, Math.min(x2, plot.right + 2) - zx);
          var zh = Math.max(1, Math.min(yBot, plot.bottom + 2) - zy);
          if (zw > 4 && zh > 4) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(zx, zy, zw, zh);
            ctx.clip();
            ctx.strokeStyle = t.strong;
            ctx.globalAlpha = 0.55;
            ctx.lineWidth = 1;
            for (var hx = zx - zh; hx < zx + zw; hx += 8) {
              ctx.beginPath();
              ctx.moveTo(hx, zy + zh);
              ctx.lineTo(hx + zh, zy);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      } else if (a.kind === 'range') {
        var rx1 = eng.xOfBar(a.x1), rx2 = eng.xOfBar(a.x2);
        var ry1 = plot.y, ry2 = plot.bottom;
        if (a.y1 !== null && a.y2 !== null) { ry1 = eng.yOfPrice(a.y2); ry2 = eng.yOfPrice(a.y1); }
        ctx.fillStyle = t.fill;
        ctx.fillRect(rx1, ry1, Math.max(1, rx2 - rx1), Math.max(1, ry2 - ry1));
        ctx.strokeStyle = t.strong;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(rx1 + 0.5, ry1); ctx.lineTo(rx1 + 0.5, ry2);
        ctx.moveTo(rx2 - 0.5, ry1); ctx.lineTo(rx2 - 0.5, ry2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  function drawLines(ctx, eng, anns) {
    if (!anns || !anns.length) return;
    var plot = eng.plot;
    ctx.save();
    clipPlot(ctx, plot);
    for (var i = 0; i < anns.length; i++) {
      var a = anns[i], t = C.tone(a.tone);
      if (a.kind === 'hline') {
        var y = eng.yOfPrice(a.y);
        if (y < plot.y - 30 || y > plot.bottom + 30) continue;
        var lx = a.x1 === null ? plot.x : eng.xOfBar(a.x1);
        var rx = a.x2 === null ? plot.right : eng.xOfBar(a.x2);
        lx = H.clamp(lx, plot.x - 4, plot.right + 4);
        rx = H.clamp(rx, plot.x - 4, plot.right + 4);
        if (rx <= lx) { var tmp = lx; lx = rx; rx = tmp; }
        ctx.strokeStyle = t.line;
        ctx.globalAlpha = 0.82;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(lx, Math.round(y) + 0.5);
        ctx.lineTo(rx, Math.round(y) + 0.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (a.kind === 'segment') {
        var sx1 = eng.xOfBar(a.x1), sy1 = eng.yOfPrice(a.y1);
        var sx2 = eng.xOfBar(a.x2), sy2 = eng.yOfPrice(a.y2);
        ctx.strokeStyle = t.line;
        ctx.lineWidth = a.width;
        ctx.globalAlpha = 0.92;
        ctx.setLineDash(a.dashed ? [6, 5] : []);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.setLineDash([]);
        var len = Math.sqrt((sx2 - sx1) * (sx2 - sx1) + (sy2 - sy1) * (sy2 - sy1));
        if (a.arrow && len > 14) {
          ctx.fillStyle = t.line;
          H.arrow(ctx, sx1, sy1, sx2, sy2, Math.min(10, Math.max(7, len * 0.12)));
        }
        ctx.globalAlpha = 1;
      } else if (a.kind === 'fib') {
        var fx2 = eng.xOfBar(a.x2);
        if (fx2 > plot.right + 8) continue;
        var fy1 = eng.yOfPrice(a.y1), fy2 = eng.yOfPrice(a.y2);
        var lineStart = Math.max(fx2, plot.x);
        // V2：回撤区浅色带（在 0.5 与 0.618 之间，若 levels 含两位）
        if (a.band) {
          var rets = a.levels.filter(function (lv) { return lv <= 1; });
          if (rets.length >= 2) {
            function nearest(arr, target) {
              var best = arr[0], bd = Infinity;
              arr.forEach(function (v) { var d = Math.abs(v - target); if (d < bd) { bd = d; best = v; } });
              return best;
            }
            var lvA = nearest(rets, 0.5), lvB = nearest(rets, 0.618);
            var pA = a.y2 + (a.y1 - a.y2) * lvA;
            var pB = a.y2 + (a.y1 - a.y2) * lvB;
            var bandTop = eng.yOfPrice(Math.max(pA, pB));
            var bandBot = eng.yOfPrice(Math.min(pA, pB));
            if (bandBot > bandTop + 1) {
              ctx.fillStyle = t.fill;
              ctx.globalAlpha = 0.75;
              ctx.fillRect(lineStart, bandTop, plot.right - lineStart, bandBot - bandTop);
              ctx.globalAlpha = 1;
            }
          }
        }
        // 摆动腿连线
        ctx.strokeStyle = t.line;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(eng.xOfBar(a.x1), fy1);
        ctx.lineTo(fx2, fy2);
        ctx.moveTo(fx2, fy1);
        ctx.lineTo(fx2, fy2);
        ctx.stroke();
        // 回撤位 / 扩展位水平线（从 x2 延伸到画布右缘）
        for (var k = 0; k < a.levels.length; k++) {
          var lv = a.levels[k];
          if (lv > 1 && !a.showExtension) continue;
          var price = a.y2 + (a.y1 - a.y2) * lv;
          var py = eng.yOfPrice(price);
          if (py < plot.y - 20 || py > plot.bottom + 20) continue;
          if (lv > 1) {
            ctx.globalAlpha = 0.42;
            ctx.setLineDash([2, 4]);
          } else {
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([5, 5]);
          }
          ctx.beginPath();
          ctx.moveTo(lineStart, Math.round(py) + 0.5);
          ctx.lineTo(plot.right, Math.round(py) + 0.5);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      } else if (a.kind === 'marker') {
        var mx = eng.xOfBar(a.x), my = eng.yOfPrice(a.y);
        if (mx < plot.x - 10 || mx > plot.right + 10) continue;
        if (my < plot.y - 20 || my > plot.bottom + 20) continue;
        var above = a.position !== 'below';
        ctx.fillStyle = t.line;
        ctx.beginPath();
        if (above) {
          ctx.moveTo(mx, my);
          ctx.lineTo(mx - 4.5, my - 8);
          ctx.lineTo(mx + 4.5, my - 8);
        } else {
          ctx.moveTo(mx, my);
          ctx.lineTo(mx - 4.5, my + 8);
          ctx.lineTo(mx + 4.5, my + 8);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function ratioText(r) {
    var s = r.toFixed(3);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function drawLabels(ctx, eng, anns) {
    if (!anns || !anns.length) return;
    var plot = eng.plot, L = eng.labels, view = eng.view;
    if (!L) return;
    var narrow = eng.narrow;
    var fontSize = narrow ? C.sizes.labelNarrow : C.sizes.label;
    for (var i = 0; i < anns.length; i++) {
      var a = anns[i], t = C.tone(a.tone);
      if (a.kind === 'marker') {
        var mx = eng.xOfBar(a.x), my = eng.yOfPrice(a.y);
        if (mx < plot.x - 30 || mx > plot.right + 30) continue;
        if (my < plot.y - 40 || my > plot.bottom + 40) continue;
        var above = a.position !== 'below';
        L.add(a.text, {
          x: mx, y: my + (above ? -9 : 9),
          align: 'center', vAlign: above ? 'above' : 'below',
          color: t.text, border: t.line, font: fontSize, weight: '600',
          maxWidth: Math.min(200, plot.w * 0.55)
        });
      } else if (a.kind === 'hline') {
        if (!a.label) continue;
        var hy = eng.yOfPrice(a.y);
        if (hy < plot.y - 20 || hy > plot.bottom + 20) continue;
        var lx = a.x1 === null ? plot.x : eng.xOfBar(a.x1);
        var rx = a.x2 === null ? plot.right : eng.xOfBar(a.x2);
        if (rx < plot.x - 20 || lx > plot.right + 20) continue;
        var anchorX = Math.min(rx, plot.right) - 3;
        if (anchorX - 120 < plot.x) anchorX = Math.min(plot.right, Math.max(lx, plot.x) + 90);
        L.add(a.label, {
          x: anchorX, y: hy,
          align: 'right', vAlign: 'above', offset: 2,
          color: t.text, border: t.line, font: fontSize,
          maxWidth: Math.min(190, plot.w * 0.5)
        });
      } else if (a.kind === 'zone') {
        if (!a.label) continue;
        var zx1 = Math.max(eng.xOfBar(a.x1), plot.x);
        var zx2 = Math.min(eng.xOfBar(a.x2), plot.right);
        if (zx2 < plot.x || zx1 > plot.right) continue;
        var zTop = eng.yOfPrice(a.y2), zBot = eng.yOfPrice(a.y1);
        if (zBot < plot.y - 20 || zTop > plot.bottom + 20) continue;
        var inside = (zBot - zTop) >= 24 && (zx2 - zx1) >= 60;
        L.add(a.label, {
          x: Math.max(zx1 + 4, plot.x + 2), y: inside ? zTop + 1 : zTop - 1,
          align: 'left', vAlign: inside ? 'below' : 'above', offset: inside ? 1 : 3,
          color: t.text, border: t.line, font: fontSize,
          maxWidth: Math.min(220, plot.w * 0.5)
        });
      } else if (a.kind === 'range') {
        if (!a.label) continue;
        var rx1 = eng.xOfBar(a.x1), rx2 = eng.xOfBar(a.x2);
        if (rx2 < plot.x || rx1 > plot.right) continue;
        L.add(a.label, {
          x: (Math.max(rx1, plot.x) + Math.min(rx2, plot.right)) / 2,
          y: plot.y + 1, align: 'center', vAlign: 'below', offset: 2,
          color: t.text, border: t.line, font: fontSize,
          maxWidth: Math.min(220, plot.w * 0.45)
        });
      } else if (a.kind === 'segment') {
        if (!a.label) continue;
        var midX = (eng.xOfBar(a.x1) + eng.xOfBar(a.x2)) / 2;
        var midY = (eng.yOfPrice(a.y1) + eng.yOfPrice(a.y2)) / 2;
        if (midX < plot.x - 30 || midX > plot.right + 30) continue;
        if (midY < plot.y - 20 || midY > plot.bottom + 20) continue;
        L.add(a.label, {
          x: midX, y: midY, align: 'center', vAlign: 'above', offset: 7,
          color: t.text, border: t.line, font: fontSize,
          maxWidth: Math.min(200, plot.w * 0.5)
        });
      } else if (a.kind === 'text') {
        var tx = eng.xOfBar(a.x), ty = eng.yOfPrice(a.y);
        if (tx < plot.x - 30 || tx > plot.right + 30) continue;
        if (ty < plot.y - 20 || ty > plot.bottom + 20) continue;
        L.add(a.text, {
          x: tx, y: ty, align: 'center', vAlign: 'middle', offset: 0,
          color: t.text, border: t.line, font: fontSize, weight: '500',
          maxWidth: Math.min(220, plot.w * 0.55)
        });
      } else if (a.kind === 'fib') {
        var fx2 = eng.xOfBar(a.x2);
        if (fx2 > plot.right + 8) continue;
        var fyTop = Math.min(eng.yOfPrice(a.y1), eng.yOfPrice(a.y2));
        if (a.label) {
          L.add(a.label, {
            x: Math.min(Math.max(fx2, plot.x + 40), plot.right - 70),
            y: fyTop - 4, align: 'center', vAlign: 'above', offset: 2,
            color: t.text, border: t.line, font: fontSize,
            maxWidth: Math.min(210, plot.w * 0.5)
          });
        }
        // 档位标签：多个 level 常常非常接近，先按价格线位置排序做纵向错位排布，
        // 再用引导线指回真实价位，避免标签互相遮挡或干脆全部被隐藏。
        var items = [];
        for (var k = 0; k < a.levels.length; k++) {
          var lv = a.levels[k];
          if (lv > 1 && !a.showExtension) continue;
          var price = a.y2 + (a.y1 - a.y2) * lv;
          var py = eng.yOfPrice(price);
          if (py < plot.y - 12 || py > plot.bottom + 12) continue;
          var priceTxt = H.fmtFixed(price, Math.min(4, H.priceDecimals(price)));
          var custom = a.levelsLabels && a.levelsLabels[k];
          items.push({
            py: py,
            text: (custom ? custom + ' ' : ratioText(lv) + ' ') + priceTxt,
            ext: lv > 1
          });
        }
        if (items.length) {
          var minGap = narrow ? 17 : 19;
          var topLimit = plot.y + 10, bottomLimit = plot.bottom - 10;
          items.sort(function (p1, p2) { return p1.py - p2.py; });
          var stack = [], si;
          for (si = 0; si < items.length; si++) {
            var wantY = H.clamp(items[si].py, topLimit, bottomLimit);
            var yPos = stack.length ? Math.max(wantY, stack[stack.length - 1].y + minGap) : wantY;
            stack.push({ y: yPos, item: items[si] });
          }
          var overflow = stack[stack.length - 1].y - bottomLimit;
          if (overflow > 0) {
            for (si = stack.length - 1; si >= 0; si--) {
              var cap = si === stack.length - 1 ? bottomLimit : stack[si + 1].y - minGap;
              if (stack[si].y > cap) stack[si].y = cap;
            }
          }
          if (stack[0].y < topLimit) {
            var compressed = stack.length > 1
              ? Math.min(minGap, (bottomLimit - topLimit) / (stack.length - 1))
              : minGap;
            for (si = 0; si < stack.length; si++) stack[si].y = topLimit + si * compressed;
          }
          for (si = 0; si < stack.length; si++) {
            var entry = stack[si];
            var chip = L.add(entry.item.text, {
              x: plot.right - 3, y: entry.y, align: 'right', vAlign: 'middle', offset: 0,
              color: t.text, border: t.line, font: narrow ? 9 : 9.5,
              hideOnCollision: true, maxWidth: 140
            });
            if (!chip) continue;
            var chipMid = chip.rect.y + chip.rect.h / 2;
            ctx.save();
            ctx.strokeStyle = t.line;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(plot.right - 1, Math.round(entry.item.py) + 0.5);
            ctx.lineTo(plot.right - 1, Math.round(chipMid) + 0.5);
            ctx.stroke();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = t.line;
            ctx.beginPath();
            ctx.arc(plot.right - 1, entry.item.py, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      } else if (a.kind === 'vprofile') {
        var vpLabel = vpOf(a, eng.bars);
        if (!vpLabel || a.hideLabels) continue;
        var geomL = vprofileGeom(eng, a);
        var x1px = H.clamp(eng.xOfBar(a.x1), plot.x, plot.right);
        var x2px = H.clamp(eng.xOfBar(a.x2), plot.x, plot.right);
        var valueX = Math.max(x1px, x2px) - 2;
        if (a.x2 < view.from || a.x1 > view.to) {
          valueX = geomL.side === 'left' ? geomL.panelLeft + geomL.barMax : geomL.panelRight;
        }
        var vals = [];
        if (a.showVA) {
          vals.push({ p: vpLabel.vah, name: 'VAH', color: P.vah });
          vals.push({ p: vpLabel.val, name: 'VAL', color: P.val });
        }
        if (a.showPOC) vals.push({ p: vpLabel.poc, name: 'POC', color: P.poc });
        vals.forEach(function (it) {
          var yy = eng.yOfPrice(it.p);
          if (yy < plot.y + 2 || yy > plot.bottom - 2) return;
          L.add(it.name + ' ' + H.fmtFixed(it.p, Math.min(4, H.priceDecimals(it.p))), {
            x: valueX, y: yy, align: 'right', vAlign: 'above', offset: 2,
            color: it.color, border: it.color, font: narrow ? 9 : 9.5,
            hideOnCollision: true, maxWidth: 130, offsets: [0, -18, 18, -36, 36]
          });
        });
        if (a.label) {
          var lblAnchorX = geomL.side === 'float'
            ? H.clamp(geomL.anchorX, plot.x + 8, plot.right - 8)
            : (geomL.side === 'left' ? plot.x + 6 : plot.right - 6);
          L.add(a.label, {
            x: lblAnchorX,
            y: plot.y + 30,
            align: geomL.side === 'float' ? 'center' : (geomL.side === 'left' ? 'left' : 'right'),
            vAlign: 'below', offset: 1,
            color: t.text, border: t.line, font: narrow ? 9 : 9.5,
            maxWidth: Math.min(200, plot.w * 0.42)
          });
        }
      } else if (a.kind === 'vpline') {
        if (a.hideLabels) continue;
        var vplLabel = vplineData(a, eng.bars);
        if (!vplLabel) continue;
        var lvlPrice = vplLabel[a.level === 'vah' ? 'vah' : (a.level === 'val' ? 'val' : 'poc')];
        var ly = eng.yOfPrice(lvlPrice);
        if (ly < plot.y + 2 || ly > plot.bottom - 2) continue;
        var lvColor = a.level === 'poc' ? P.poc : P.vah;
        var lvName = a.level === 'poc' ? 'POC' : (a.level === 'vah' ? 'VAH' : 'VAL');
        var priceTxt = H.fmtFixed(lvlPrice, Math.min(4, H.priceDecimals(lvlPrice)));
        L.add(a.label ? (a.label + ' ' + priceTxt) : (lvName + ' ' + priceTxt), {
          x: H.clamp(eng.xOfBar(a.range.x2), plot.x + 40, plot.right) - 3, y: ly,
          align: 'right', vAlign: 'above', offset: 2,
          color: lvColor, border: lvColor, font: narrow ? 9 : 9.5,
          hideOnCollision: true, maxWidth: 160
        });
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * V2：固定区间成交量分布（vprofile）/ value-area 单线（vpline）
   * ------------------------------------------------------------------ */
  function vprofileGeom(eng, a) {
    var plot = eng.plot;
    var side = a.side || 'right';
    var maxW = H.clamp(plot.w * (side === 'float' ? 0.20 : 0.22), 48, side === 'float' ? 130 : 156);
    var anchorX, panelLeft, panelRight, barSide = side;
    if (side === 'left') {
      anchorX = plot.x + 4;
      panelLeft = anchorX;
      panelRight = anchorX + maxW;
      barSide = 'left';
    } else if (side === 'float') {
      // 浮动分布：贴着 x2 放置；右侧空间不够就放到 x2 左侧，避免压住右侧滚动 profile 面板
      anchorX = H.clamp(eng.xOfBar(a.x2), plot.x + 20, plot.right - 20);
      if (anchorX + maxW + 10 <= plot.right) {
        panelLeft = anchorX + 8;
        panelRight = panelLeft + maxW;
        barSide = 'left'; // 从面板左缘向右生长
      } else {
        panelRight = anchorX - 8;
        panelLeft = panelRight - maxW;
        barSide = 'right'; // 从面板右缘向左生长
      }
    } else {
      anchorX = plot.right - 4;
      // 若同时开启了滚动区间 Profile 面板，把固定区间分布让到面板左侧，避免两个直方图重叠
      if (eng.panels && eng.panels.profile) {
        var profileW = H.clamp(plot.w * 0.2, 56, 128) + 8;
        anchorX = Math.max(plot.x + maxW + 12, plot.right - 4 - profileW);
      }
      panelLeft = anchorX - maxW;
      panelRight = anchorX;
      barSide = 'right';
    }
    panelLeft = Math.max(plot.x + 2, panelLeft);
    panelRight = Math.min(plot.right - 2, panelRight);
    return {
      side: side, barSide: barSide, anchorX: anchorX,
      panelLeft: panelLeft, panelRight: panelRight,
      barMax: Math.max(10, panelRight - panelLeft),
      labelX: side === 'float' ? anchorX : (side === 'left' ? panelLeft : panelRight)
    };
  }

  function drawVProfile(ctx, eng, a) {
    var plot = eng.plot, t = C.tone(a.tone);
    var vp = vpOf(a, eng.bars);
    if (!vp) return;
    var geom = vprofileGeom(eng, a);
    var yOf = function (p) { return eng.yOfPrice(p); };
    var i;
    // 区间边界竖虚线（帮助看清聚合的是哪一段 K 线）
    var x1 = eng.xOfBar(a.x1), x2 = eng.xOfBar(a.x2);
    if (x2 >= plot.x && x1 <= plot.right) {
      ctx.save();
      ctx.strokeStyle = t.line;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      [x1, x2].forEach(function (x) {
        var px = H.clamp(x, plot.x, plot.right);
        ctx.beginPath();
        ctx.moveTo(px, plot.y);
        ctx.lineTo(px, plot.bottom);
        ctx.stroke();
      });
      ctx.restore();
    }
    // 半透明面板
    var panelTop = H.clamp(yOf(vp.hi), plot.y + 1, plot.bottom - 1);
    var panelBot = H.clamp(yOf(vp.lo), plot.y + 1, plot.bottom - 1);
    if (panelBot - panelTop < 6 || geom.barMax < 12) return;
    ctx.save();
    clipPlot(ctx, plot);
    ctx.fillStyle = 'rgba(8,12,18,0.66)';
    ctx.fillRect(geom.panelLeft - 1, panelTop - 1, geom.barMax + 2, panelBot - panelTop + 2);
    ctx.strokeStyle = t.strong;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.strokeRect(geom.panelLeft - 0.5, panelTop - 0.5, geom.barMax + 1, panelBot - panelTop + 1);
    ctx.globalAlpha = 1;
    // 直方图
    // 通过 VAH/VAL 反推 value area 的 bin 索引范围
    var vaLo = 0, vaHi = vp.bins.length - 1;
    for (i = 0; i < vp.bins.length; i++) {
      if (vp.bins[i].price >= vp.val) { vaLo = i; break; }
    }
    for (i = vp.bins.length - 1; i >= 0; i--) {
      if (vp.bins[i].price <= vp.vah) { vaHi = i; break; }
    }
    for (i = 0; i < vp.bins.length; i++) {
      var bin = vp.bins[i];
      var yTop = yOf(bin.high), yBot = yOf(bin.low);
      var barH = Math.max(1, yBot - yTop - 0.6);
      var len = vp.max > 0 ? (bin.volume / vp.max) * geom.barMax : 0;
      if (len < 0.6) continue;
      var bx = geom.barSide === 'left' ? geom.panelLeft + 1 : geom.panelRight - 1 - len;
      var isPoc = i === vp.pocIndex;
      var isVa = i >= vaLo && i <= vaHi;
      ctx.fillStyle = isPoc
        ? 'rgba(240,185,11,0.88)'
        : (isVa ? 'rgba(122,168,220,0.55)' : 'rgba(120,140,165,0.30)');
      ctx.fillRect(bx, yTop + 0.3, Math.max(1, len), barH);
    }
    // POC / VAH / VAL 三条水平虚线（画在区间范围内）
    var lx1 = H.clamp(Math.min(x1, x2), plot.x, plot.right);
    var lx2 = H.clamp(Math.max(x1, x2), plot.x, plot.right);
    if (lx2 - lx1 > 2) {
      var lines = [];
      if (a.showVA) {
        lines.push({ p: vp.vah, color: P.vah, alpha: 0.62, dash: [4, 4], w: 1 });
        lines.push({ p: vp.val, color: P.val, alpha: 0.62, dash: [4, 4], w: 1 });
      }
      if (a.showPOC) lines.push({ p: vp.poc, color: P.poc, alpha: 0.95, dash: [6, 4], w: 1.6 });
      lines.forEach(function (ln) {
        var y = yOf(ln.p);
        if (y < plot.y || y > plot.bottom) return;
        ctx.strokeStyle = ln.color;
        ctx.globalAlpha = ln.alpha;
        ctx.lineWidth = ln.w;
        ctx.setLineDash(ln.dash);
        ctx.beginPath();
        ctx.moveTo(lx1, Math.round(y) + 0.5);
        ctx.lineTo(lx2, Math.round(y) + 0.5);
        ctx.stroke();
      });
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawVLine(ctx, eng, a) {
    var plot = eng.plot, t = C.tone(a.tone);
    var vpl = vplineData(a, eng.bars);
    if (!vpl) return;
    var price = vpl[a.level === 'vah' ? 'vah' : (a.level === 'val' ? 'val' : 'poc')];
    var y = eng.yOfPrice(price);
    if (y < plot.y - 10 || y > plot.bottom + 10) return;
    var x1 = H.clamp(eng.xOfBar(a.range.x1), plot.x, plot.right);
    var x2 = H.clamp(eng.xOfBar(a.range.x2), plot.x, plot.right);
    if (x2 - x1 < 2) return;
    var color = a.level === 'poc' ? P.poc : (a.level === 'vah' ? P.vah : P.val);
    ctx.save();
    clipPlot(ctx, plot);
    ctx.strokeStyle = color;
    ctx.globalAlpha = a.level === 'poc' ? 0.92 : 0.68;
    ctx.lineWidth = a.level === 'poc' ? 1.5 : 1.1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, Math.round(y) + 0.5);
    ctx.lineTo(x2, Math.round(y) + 0.5);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawDataOverlays(ctx, eng, anns) {
    if (!anns || !anns.length) return;
    for (var i = 0; i < anns.length; i++) {
      var a = anns[i];
      if (a.kind === 'vprofile') drawVProfile(ctx, eng, a);
      else if (a.kind === 'vpline') drawVLine(ctx, eng, a);
    }
  }

  /* ------------------------------------------------------------------ *
   * V2：自动摆动结构（分形 HH/HL/LH/LL）——小字标签，可开关
   * 标注标签优先（先注册），摆动标签碰撞时自动隐藏，避免压住教学标注。
   * ------------------------------------------------------------------ */
  function drawAutoSwings(ctx, eng) {
    var sw = eng.swings;
    if (!sw || !sw.list || !sw.list.length) return;
    var plot = eng.plot;
    var list = sw.list;
    var visible = list.filter(function (s) {
      var x = eng.xOfBar(s.index);
      return x >= plot.x - 8 && x <= plot.right + 8;
    });
    if (!visible.length) return;
    // 摆动点连线（很淡，帮助看出结构方向）
    ctx.save();
    clipPlot(ctx, plot);
    ctx.strokeStyle = 'rgba(148,163,184,0.30)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    for (var i = 0; i < visible.length; i++) {
      var sx = eng.xOfBar(visible[i].index);
      var sy = eng.yOfPrice(visible[i].price);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // 摆动点小圆点
    visible.forEach(function (s) {
      var x = eng.xOfBar(s.index), y = eng.yOfPrice(s.price);
      ctx.fillStyle = s.type === 'H' ? P.bear : P.bull;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    var L = eng.labels;
    if (!L) return;
    visible.forEach(function (s) {
      var x = eng.xOfBar(s.index), y = eng.yOfPrice(s.price);
      if (y < plot.y - 12 || y > plot.bottom + 12) return;
      var isHigh = s.type === 'H';
      L.add(s.label, {
        x: x, y: y + (isHigh ? -6 : 6),
        align: 'center', vAlign: isHigh ? 'above' : 'below', offset: 2,
        color: isHigh ? P.bearText : P.bullText,
        border: 'rgba(148,163,184,0.30)',
        bg: 'rgba(9,13,20,0.80)',
        font: eng.narrow ? 8 : 8.5, weight: '600',
        padX: 3, padY: 1, maxWidth: 40,
        hideOnCollision: true,
        offsets: [0, -13, 13, -26, 26]
      });
    });
  }

  C.overlays = {
    KINDS: KINDS,
    normalize: normalize,
    resolve: resolve,
    collectPriceRange: collectPriceRange,
    rangeProfileOf: rangeProfileOf,
    vpOf: vpOf,
    vprofileGeom: vprofileGeom,
    fibLevelPrice: function (ann, level) { return ann.y2 + (ann.y1 - ann.y2) * level; },
    LabelLayer: LabelLayer,
    drawFills: drawFills,
    drawLines: drawLines,
    drawLabels: drawLabels,
    drawDataOverlays: drawDataOverlays,
    drawAutoSwings: drawAutoSwings
  };
})(typeof window !== 'undefined' ? window : globalThis);
