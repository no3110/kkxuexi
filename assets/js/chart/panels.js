/* ==========================================================================
 * 图表引擎 · 附加面板（chart-engineer 维护）
 * 成交量 / Delta / CVD / ATR / MA / 成交量分布 Profile / Footprint / Ladder。
 * 由 scenario.panels 开关；引擎负责布局（rect），本文件只负责在给定 rect 内绘制。
 * 依赖：LQ.chart.palette / tones / helpers / indicators（先加载）。
 * ========================================================================== */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var C = LQ.chart = LQ.chart || {};
  var H = C.helpers;
  var P = C.palette;
  var I = C.indicators;

  var PANE_LABELS = {
    volume: '成交量 VOL',
    delta: 'DELTA 买卖差',
    cvd: 'CVD 累计 Delta',
    atr: 'ATR 波动率',
    ladder: '订单簿 LADDER'
  };

  function withAlpha(color, alpha) {
    if (typeof color !== 'string') return color;
    var m = /^#([0-9a-f]{6})$/i.exec(color);
    if (m) {
      var v = parseInt(m[1], 16);
      return 'rgba(' + ((v >> 16) & 255) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',' + alpha + ')';
    }
    m = /^#([0-9a-f]{3})$/i.exec(color);
    if (m) {
      var s = m[1];
      return 'rgba(' + parseInt(s[0] + s[0], 16) + ',' + parseInt(s[1] + s[1], 16) + ',' + parseInt(s[2] + s[2], 16) + ',' + alpha + ')';
    }
    return color;
  }

  /* 带描边光晕的文字：保证数字压在量柱上仍然可读 */
  function haloText(ctx, text, x, y) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(7,10,16,0.82)';
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function normalizePanels(raw) {
    raw = raw || {};
    var ma = [];
    if (Array.isArray(raw.ma)) {
      raw.ma.forEach(function (v) {
        var n = Math.round(Number(v));
        if (isFinite(n) && n > 1 && n <= 300 && ma.indexOf(n) < 0) ma.push(n);
      });
    }
    return {
      volume: raw.volume !== false,
      delta: !!raw.delta,
      cvd: raw.cvd === undefined ? !!raw.delta : !!raw.cvd,
      footprint: !!raw.footprint,
      profile: !!raw.profile,
      ladder: !!raw.ladder,
      atr: !!raw.atr,
      atrPeriod: H.clamp(Math.round(H.num(raw.atrPeriod, 14)), 2, 50),
      ma: ma.slice(0, 3)
    };
  }

  /* 一次算好、逐帧复用的序列 */
  function buildSeries(scenario, panels) {
    var bars = scenario.bars;
    var cvd = new Array(bars.length), cvdBars = new Array(bars.length), total = 0, day = null;
    bars.forEach(function (bar, index) {
      if (scenario.cvdResetDaily && bar.day !== day) { total = 0; day = bar.day; }
      var open = total, high = total, low = total, deltaPath = Array.isArray(bar.deltaPath) && bar.deltaPath.length ? bar.deltaPath : [I.deltaOf(bar)];
      deltaPath.forEach(function (delta) { total += delta; high = Math.max(high, total); low = Math.min(low, total); });
      var delta = I.deltaOf(bar), close = total;
      cvd[index] = close;
      cvdBars[index] = { o: open, h: high, l: low, c: close, delta: delta };
    });
    return {
      cvd: cvd,
      cvdBars: cvdBars,
      ma: panels.ma.map(function (period, idx) {
        return { period: period, values: I.ma(bars, period), color: P.ma[idx % P.ma.length] };
      }),
      atr: panels.atr ? { period: panels.atrPeriod, values: I.atr(bars, panels.atrPeriod) } : null
    };
  }

  /* 竖排面板的初始高度建议（引擎会在空间不足时统一缩放） */
  function paneDefs(panels, narrow) {
    var defs = [];
    if (panels.volume) defs.push({ key: 'volume', h: narrow ? 36 : 46 });
    if (panels.delta) defs.push({ key: 'delta', h: narrow ? 30 : 36 });
    if (panels.cvd) defs.push({ key: 'cvd', h: narrow ? 30 : 36 });
    if (panels.atr) defs.push({ key: 'atr', h: narrow ? 30 : 36 });
    return defs;
  }
  var LADDER_BOTTOM_H = { wide: 150, narrow: 126 };

  function viewRange(eng) {
    var n = eng.bars.length;
    return {
      from: Math.max(0, Math.floor(eng.view.from) - 1),
      to: Math.min(n - 1, Math.ceil(eng.view.to) + 1)
    };
  }
  function strictRange(eng) {
    var n = eng.bars.length;
    return {
      from: Math.max(0, Math.ceil(eng.view.from - 0.5)),
      to: Math.min(n - 1, Math.floor(eng.view.to + 0.5))
    };
  }
  function hoverIndex(eng) {
    if (eng.hover && eng.hover.active && eng.hover.bar !== null) {
      return H.clamp(Math.round(eng.hover.bar), 0, eng.bars.length - 1);
    }
    return H.clamp(Math.round(eng.view.to), 0, eng.bars.length - 1);
  }
  function replayIndex(eng) {
    if (!eng.replayPreview) return -1;
    return Number.isInteger(eng.replayPreview.barIndex) ? eng.replayPreview.barIndex : Math.round(eng.view.to + 1);
  }
  function replayVisible(eng) {
    var index = replayIndex(eng);
    return index >= 0 && index <= eng.bars.length && eng.view.to >= eng.bars.length - 2;
  }
  function replayCvd(eng) {
    if (!replayVisible(eng)) return null;
    var preview = eng.replayPreview, index = replayIndex(eng), previousIndex = index - 1;
    var previousBar = previousIndex >= 0 ? eng.bars[previousIndex] : null;
    var previous = previousIndex >= 0 ? eng.series.cvdBars[previousIndex] : null;
    var day = preview.day === undefined ? (eng.bars[index] || previousBar || {}).day : preview.day;
    var open = previousBar && previousBar.day === day && previous ? previous.c : 0;
    var high = open, low = open, close = open;
    var path = Array.isArray(preview.deltaPath) && preview.deltaPath.length ? preview.deltaPath : [preview.delta || 0];
    path.forEach(function (delta) { close += delta; high = Math.max(high, close); low = Math.min(low, close); });
    return { index: index, o: open, h: high, l: low, c: close, delta: preview.delta || 0 };
  }
  function replayAtr(eng) {
    if (!replayVisible(eng) || !eng.series.atr) return null;
    var preview = eng.replayPreview, index = replayIndex(eng), period = eng.series.atr.period;
    var values = eng.series.atr.values;
    if (index < period - 1) return null;
    var previousClose = index > 0 ? eng.bars[index - 1].c : preview.o;
    var tr = Math.max(preview.h - preview.l, Math.abs(preview.h - previousClose), Math.abs(preview.l - previousClose));
    var value;
    if (index >= period) {
      var prior = values[index - 1];
      if (!isFinite(prior)) return null;
      value = (prior * (period - 1) + tr) / period;
    } else {
      var total = tr;
      for (var i = 1; i < index; i++) {
        var bar = eng.bars[i], prevClose = eng.bars[i - 1].c;
        total += Math.max(bar.h - bar.l, Math.abs(bar.h - prevClose), Math.abs(bar.l - prevClose));
      }
      var first = eng.bars[0];
      total += Math.max(first.h - first.l, Math.abs(first.h - first.o), Math.abs(first.l - first.o));
      value = total / period;
    }
    return isFinite(value) ? { index: index, value: value } : null;
  }

  function paneLabel(ctx, rect, text, valueText, valueColor) {
    H.setFont(ctx, C.sizes.paneLabel, '500');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = P.textFaint;
    ctx.fillText(text, rect.x + 7, rect.y + 9);
    if (valueText) {
      H.setFont(ctx, C.sizes.paneLabel, '600', true);
      ctx.textAlign = 'right';
      ctx.fillStyle = valueColor || P.textDim;
      ctx.fillText(valueText, rect.right - 7, rect.y + 9);
    }
  }

  function paneInner(rect) {
    return { top: rect.y + 15, bottom: rect.bottom - 3 };
  }

  function columnValue(ctx, eng, rect, x, y, value, hovered) {
    if (!hovered && eng.barW < 6) return;
    var narrow = eng.barW < 22, fontSize = narrow ? 7 : H.clamp(eng.barW * 0.42, 8, 10), text = H.fmtCompact(value);
    if (!narrow && !hovered && text.length * fontSize * 0.62 > eng.barW - 2) return;
    ctx.save(); ctx.font = '500 ' + fontSize + 'px ' + C.fonts.mono; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d6e1eb';
    var labelY = H.clamp(y, rect.y + 23, rect.bottom - 7);
    if (narrow) { ctx.translate(x, labelY); ctx.rotate(-Math.PI / 2); haloText(ctx, text, 0, 0); }
    else haloText(ctx, text, x, labelY);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 成交量                                                              */
  /* ------------------------------------------------------------------ */
  function drawVolume(ctx, eng, rect) {
    var bars = eng.bars, r = strictRange(eng), live = replayVisible(eng), preview = live ? eng.replayPreview : null;
    var previewIndex = live ? replayIndex(eng) : -1;
    if (r.to < r.from) return;
    var maxV = 0, i;
    for (i = r.from; i <= r.to; i++) if (i !== previewIndex) maxV = Math.max(maxV, bars[i].v);
    if (live) maxV = Math.max(maxV, preview.v || 0);
    if (!(maxV > 0)) return;
    var inner = paneInner(rect);
    var scale = (inner.bottom - inner.top) / maxV;
    var bw = eng.barW;
    var w = H.clamp(bw * 0.62, 1, 22);
    var lastIdx = hoverIndex(eng);
    for (i = r.from; i <= r.to; i++) {
      if (i === previewIndex) continue;
      var b = bars[i];
      var x = eng.xOfBar(i) - w / 2;
      var h = Math.max(1, b.v * scale);
      ctx.fillStyle = b.c >= b.o ? P.volumeUp : P.volumeDown;
      if (i === lastIdx) ctx.fillStyle = b.c >= b.o ? P.bull : P.bear;
      ctx.fillRect(x, inner.bottom - h, w, h);
      columnValue(ctx, eng, rect, eng.xOfBar(i), inner.bottom - h - 6, b.v, i === lastIdx);
    }
    if (live) {
      var previewX = eng.xOfBar(previewIndex), previewHeight = Math.max(1, (preview.v || 0) * scale);
      ctx.fillStyle = preview.c >= preview.o ? P.volumeUp : P.volumeDown;
      ctx.fillRect(previewX - w / 2, inner.bottom - previewHeight, w, previewHeight);
      columnValue(ctx, eng, rect, previewX, inner.bottom - previewHeight - 6, preview.v || 0, true);
    }
    ctx.strokeStyle = P.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.x, Math.round(inner.bottom) + 0.5);
    ctx.lineTo(rect.right, Math.round(inner.bottom) + 0.5);
    ctx.stroke();
    var b0 = live ? preview : bars[lastIdx];
    paneLabel(ctx, rect, PANE_LABELS.volume, H.fmtCompact(b0.v) + ' · ' + (eng.formatTime ? eng.formatTime(b0.t) : H.timeLabel(b0.t, 0, 'auto')), b0.c >= b0.o ? P.bullText : P.bearText);
  }

  /* ------------------------------------------------------------------ */
  /* Delta 柱状                                                          */
  /* ------------------------------------------------------------------ */
  function drawDelta(ctx, eng, rect) {
    var bars = eng.bars, r = strictRange(eng), live = replayVisible(eng), preview = live ? eng.replayPreview : null;
    var previewIndex = live ? replayIndex(eng) : -1;
    if (r.to < r.from) return;
    var maxAbs = 0, i;
    for (i = r.from; i <= r.to; i++) if (i !== previewIndex) maxAbs = Math.max(maxAbs, Math.abs(I.deltaOf(bars[i])));
    if (live) maxAbs = Math.max(maxAbs, Math.abs(preview.delta || 0));
    if (!(maxAbs > 0)) return;
    var inner = paneInner(rect);
    var mid = (inner.top + inner.bottom) / 2;
    var half = (inner.bottom - inner.top) / 2 - 1;
    var scale = half / maxAbs;
    var bw = eng.barW;
    var w = H.clamp(bw * 0.55, 1, 20);
    var lastIdx = hoverIndex(eng);
    for (i = r.from; i <= r.to; i++) {
      if (i === previewIndex) continue;
      var d = I.deltaOf(bars[i]);
      var h = Math.max(1, Math.abs(d) * scale);
      var x = eng.xOfBar(i) - w / 2;
      ctx.fillStyle = d >= 0 ? P.deltaPos : P.deltaNeg;
      if (i !== lastIdx) ctx.globalAlpha = 0.72;
      ctx.fillRect(x, d >= 0 ? mid - h : mid, w, h);
      ctx.globalAlpha = 1;
      columnValue(ctx, eng, rect, eng.xOfBar(i), d >= 0 ? mid - h - 6 : mid + h + 6, d, i === lastIdx);
    }
    if (live) {
      var previewDelta = preview.delta || 0, previewX = eng.xOfBar(previewIndex);
      var previewHeight = Math.max(1, Math.abs(previewDelta) * scale);
      ctx.fillStyle = previewDelta >= 0 ? P.deltaPos : P.deltaNeg;
      ctx.fillRect(previewX - w / 2, previewDelta >= 0 ? mid - previewHeight : mid, w, previewHeight);
      columnValue(ctx, eng, rect, previewX, previewDelta >= 0 ? mid - previewHeight - 6 : mid + previewHeight + 6, previewDelta, true);
    }
    ctx.strokeStyle = P.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.x, Math.round(mid) + 0.5);
    ctx.lineTo(rect.right, Math.round(mid) + 0.5);
    ctx.stroke();
    var dv = live ? preview.delta || 0 : I.deltaOf(bars[lastIdx]);
    paneLabel(ctx, rect, PANE_LABELS.delta, (dv >= 0 ? '+' : '') + H.fmtCompact(dv), dv >= 0 ? P.bullText : P.bearText);
  }

  /* ------------------------------------------------------------------ */
  /* 折线类面板（CVD / ATR 共用一个实现）                                 */
  /* ------------------------------------------------------------------ */
  function drawLinePane(ctx, eng, rect, values, color, label, valueFmt, valueSuffix, override) {
    var r = viewRange(eng);
    var liveOverride = override && override.index >= r.from && override.index <= r.to + 1 ? override : null;
    var min = Infinity, max = -Infinity, i, v;
    for (i = r.from; i <= r.to; i++) {
      v = liveOverride && i === liveOverride.index ? liveOverride.value : values[i];
      if (v === null || v === undefined || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (liveOverride && liveOverride.index > r.to && isFinite(liveOverride.value)) {
      min = Math.min(min, liveOverride.value); max = Math.max(max, liveOverride.value);
    }
    if (!isFinite(min) || !isFinite(max)) return;
    var span = max - min;
    var pad = span > 0 ? span * 0.16 : Math.max(Math.abs(max) * 0.05, 1);
    min -= pad; max += pad;
    var inner = paneInner(rect);
    var top = inner.top, bot = inner.bottom;
    function yOf(val) { return bot - (val - min) / (max - min) * (bot - top); }
    var pts = [];
    for (i = r.from; i <= r.to; i++) {
      v = liveOverride && i === liveOverride.index ? liveOverride.value : values[i];
      if (v === null || v === undefined || !isFinite(v)) continue;
      pts.push({ x: eng.xOfBar(i), y: yOf(v), v: v });
    }
    if (liveOverride && liveOverride.index > r.to && isFinite(liveOverride.value)) {
      pts.push({ x: eng.xOfBar(liveOverride.index), y: yOf(liveOverride.value), v: liveOverride.value });
    }
    if (pts.length < 2) return;
    // 面积填充
    var grad = ctx.createLinearGradient(0, top, 0, bot);
    grad.addColorStop(0, withAlpha(color, 0.20));
    grad.addColorStop(1, withAlpha(color, 0.01));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, bot);
    for (i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length - 1].x, bot);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // 零轴
    if (min < 0 && max > 0) {
      ctx.strokeStyle = P.axisLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(rect.x, Math.round(yOf(0)) + 0.5);
      ctx.lineTo(rect.right, Math.round(yOf(0)) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // 折线
    ctx.beginPath();
    for (i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // 右端小圆点
    var lastPt = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    var idx = hoverIndex(eng);
    var cur = liveOverride && liveOverride.index === idx ? liveOverride.value : values[idx];
    if (liveOverride && liveOverride.index > idx) cur = liveOverride.value;
    if (cur === undefined) cur = lastPt.v;
    paneLabel(ctx, rect, label, (valueSuffix || '') + valueFmt(cur), color);
  }

  function drawCvdBars(ctx, eng, rect) {
    var values = eng.series.cvdBars, r = strictRange(eng), live = replayVisible(eng), preview = live ? replayCvd(eng) : null;
    var previewIndex = live ? replayIndex(eng) : -1, min = Infinity, max = -Infinity, i;
    for (i = r.from; i <= r.to; i++) {
      if (i === previewIndex) continue;
      var item = values[i]; if (!item) continue;
      min = Math.min(min, item.l, item.o, item.c); max = Math.max(max, item.h, item.o, item.c);
    }
    if (preview) { min = Math.min(min, preview.l, preview.o, preview.c); max = Math.max(max, preview.h, preview.o, preview.c); }
    if (!isFinite(min) || !isFinite(max)) return;
    var pad = Math.max((max - min) * 0.12, eng.scenario.tick || 1), inner = paneInner(rect);
    min -= pad; max += pad;
    function yOf(value) { return inner.bottom - (value - min) / Math.max(1e-9, max - min) * (inner.bottom - inner.top); }
    var width = H.clamp(eng.barW * 0.62, 1, 18), bodyWidth = H.clamp(eng.barW * 0.48, 1, 14), last = hoverIndex(eng);
    if (min < 0 && max > 0) {
      var zeroY = yOf(0); ctx.strokeStyle = P.axisLine; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rect.x, Math.round(zeroY) + 0.5); ctx.lineTo(rect.right, Math.round(zeroY) + 0.5); ctx.stroke();
    }
    for (i = r.from; i <= r.to; i++) {
      if (i === previewIndex) continue;
      var candle = values[i]; if (!candle) continue;
      var up = candle.c >= candle.o, x = eng.xOfBar(i), yO = yOf(candle.o), yC = yOf(candle.c);
      var color = up ? P.deltaPos : P.deltaNeg;
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1, Math.min(2, eng.barW * 0.08));
      ctx.globalAlpha = i === last ? 1 : 0.76;
      ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, yOf(candle.h)); ctx.lineTo(Math.round(x) + 0.5, yOf(candle.l)); ctx.stroke();
      ctx.fillRect(x - bodyWidth / 2, Math.min(yO, yC), bodyWidth, Math.max(1, Math.abs(yC - yO)));
      ctx.globalAlpha = 1;
      columnValue(ctx, eng, rect, x, (yO + yC) / 2, candle.delta, i === last);
    }
    if (preview) {
      var cvdOpen = preview.o, cvdClose = preview.c, previewX = eng.xOfBar(previewIndex), previewUp = cvdClose >= cvdOpen;
      ctx.strokeStyle = previewUp ? P.deltaPos : P.deltaNeg; ctx.fillStyle = ctx.strokeStyle; ctx.globalAlpha = 0.82;
      ctx.beginPath(); ctx.moveTo(Math.round(previewX) + 0.5, yOf(preview.h)); ctx.lineTo(Math.round(previewX) + 0.5, yOf(preview.l)); ctx.stroke();
      ctx.fillRect(previewX - bodyWidth / 2, Math.min(yOf(cvdOpen), yOf(cvdClose)), bodyWidth, Math.max(1, Math.abs(yOf(cvdOpen) - yOf(cvdClose))));
      columnValue(ctx, eng, rect, previewX, (yOf(cvdOpen) + yOf(cvdClose)) / 2, preview.delta, true);
      ctx.globalAlpha = 1;
    }
    var current = preview ? preview.c : (eng.series.cvd[last] || 0);
    paneLabel(ctx, rect, PANE_LABELS.cvd + ' · 颜色=本柱Delta', (current >= 0 ? '+' : '') + H.fmtCompact(current), current >= 0 ? P.bullText : P.bearText);
  }

  /* ------------------------------------------------------------------ */
  /* 主图叠加：MA 均线                                                    */
  /* ------------------------------------------------------------------ */
  function drawMA(ctx, eng) {
    var plot = eng.plot;
    if (!eng.series || !eng.series.ma.length) return;
    var r = viewRange(eng);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    eng.series.ma.forEach(function (line) {
      ctx.beginPath();
      var started = false;
      for (var i = r.from; i <= r.to; i++) {
        var v = line.values[i];
        if (v === null || v === undefined || !isFinite(v)) { started = false; continue; }
        var x = eng.xOfBar(i), y = eng.yOfPrice(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.95;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 主图右侧叠加：成交量分布 Profile                                     */
  /* ------------------------------------------------------------------ */
  function drawProfile(ctx, eng) {
    var plot = eng.plot;
    var r = strictRange(eng);
    if (r.to <= r.from) return;
    var binCount = H.clamp(Math.round(plot.h / 9), 12, 32);
    var vp = I.volumeProfile(eng.bars, r.from, r.to, binCount, eng.yMin, eng.yMax);
    if (!vp || !(vp.max > 0)) return;
    var maxW = H.clamp(plot.w * 0.2, 56, 128);
    var right = plot.right - 3;
    // 背景压暗，保证直方图在 K 线之上可读
    ctx.fillStyle = P.profileBg;
    ctx.fillRect(right - maxW - 4, plot.y, maxW + 4, plot.h);
    // POC / VAH / VAL 水平线
    var levels = [
      { p: vp.vah, color: P.vah, alpha: 0.34, dash: [3, 5] },
      { p: vp.val, color: P.val, alpha: 0.34, dash: [3, 5] },
      { p: vp.poc, color: P.poc, alpha: 0.62, dash: [5, 4] }
    ];
    levels.forEach(function (lv) {
      var y = eng.yOfPrice(lv.p);
      if (y < plot.y || y > plot.bottom) return;
      ctx.save();
      ctx.strokeStyle = lv.color;
      ctx.globalAlpha = lv.alpha;
      ctx.lineWidth = 1;
      ctx.setLineDash(lv.dash);
      ctx.beginPath();
      ctx.moveTo(plot.x, Math.round(y) + 0.5);
      ctx.lineTo(plot.right, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.restore();
    });
    // 直方图
    var binH = plot.h / vp.bins.length;
    var vaLow = Math.min(vp.pocIndex, Math.max(0, vp.bins.length - 1)), vaHi = vaLow;
    // 用 VAH/VAL 反推 value area 覆盖的 bin 范围
    for (var bi = 0; bi < vp.bins.length; bi++) {
      var mid = (vp.bins[bi].y0 + vp.bins[bi].y1) / 2;
      if (mid >= vp.val && mid <= vp.vah) { if (bi < vaLow) vaLow = bi; if (bi > vaHi) vaHi = bi; }
    }
    for (var i = 0; i < vp.bins.length; i++) {
      var bw = (vp.bins[i].vol / vp.max) * maxW;
      if (bw < 1) bw = 1;
      var y = plot.y + plot.h - (i + 1) * binH;
      var inVA = i >= vaLow && i <= vaHi;
      ctx.fillStyle = i === vp.pocIndex
        ? 'rgba(240, 185, 11, 0.42)'
        : (inVA ? 'rgba(120, 160, 210, 0.26)' : 'rgba(120, 140, 165, 0.15)');
      ctx.fillRect(right - bw, y + 0.5, bw, Math.max(1, binH - 1));
    }
    // 图例（放在 labels 层，避免被裁切）
    if (eng.labels) {
      var legend = eng.narrow
        ? 'POC ' + H.fmtFixed(vp.poc, Math.min(4, H.priceDecimals(vp.poc)))
        : 'POC ' + H.fmtFixed(vp.poc, Math.min(4, H.priceDecimals(vp.poc))) +
          ' · VA ' + H.fmtFixed(vp.val, Math.min(4, H.priceDecimals(vp.val))) +
          '–' + H.fmtFixed(vp.vah, Math.min(4, H.priceDecimals(vp.vah)));
      eng.labels.add(legend, {
        x: plot.right - 4, y: plot.y + 26, align: 'right', vAlign: 'below', offset: 2,
        color: P.poc, border: 'rgba(240,185,11,0.5)', font: eng.narrow ? 9 : 9.5,
        maxWidth: Math.min(260, plot.w * 0.7)
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* 主图：Footprint 足迹模式                                            */
  /* ------------------------------------------------------------------ */
  function footprintState(eng) {
    if (!eng.panels.footprint) return null;
    var count = Math.max(1, eng.view.to - eng.view.from + 1);
    var barW = eng.plot.w / count;
    var minW = eng.narrow ? 30 : 34;
    var r = strictRange(eng);
    var hasData = false;
    for (var i = r.from; i <= r.to; i++) {
      var fp = eng.bars[i] && eng.bars[i].fp;
      if (fp && Array.isArray(fp.bins) && fp.bins.length) { hasData = true; break; }
    }
    if (!hasData) return { ok: false, reason: 'nodata' };
    if (barW < minW) return { ok: false, reason: 'dense' };
    return { ok: true, barW: barW };
  }

  function drawFootprint(ctx, eng) {
    var plot = eng.plot;
    var bars = eng.bars;
    var r = strictRange(eng);
    var barW = eng.barW;
    var lastIdx = hoverIndex(eng);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    for (var i = r.from; i <= r.to; i++) {
      var b = bars[i];
      var xC = eng.xOfBar(i);
      var left = xC - barW / 2 + 0.5;
      var right = xC + barW / 2 - 0.5;
      var colW = Math.max(2, right - left);
      var fp = b.fp;
      if (!fp || !Array.isArray(fp.bins) || !fp.bins.length) {
        // 没有足迹数据的 bar：退化为普通蜡烛，避免出现空洞
        drawMiniCandle(ctx, eng, b, xC, barW);
        continue;
      }
      var bins = fp.bins;
      var yTop = eng.yOfPrice(b.h), yBot = eng.yOfPrice(b.l);
      if (yBot - yTop < 2) continue;
      // 列底色：让连续的足迹列在深色背景上被识别为一个整体
      ctx.fillStyle = 'rgba(148,163,184,0.05)';
      ctx.fillRect(left, yTop, colW, Math.max(1, yBot - yTop));
      // 行高自适应：数字行至少约 9.5px 高；竖向像素不足时合并相邻价格档（带上汇总量）
      var binPx = Math.max(0.4, (yBot - yTop) / bins.length);
      var group = Math.max(1, Math.ceil(9.5 / binPx));
      var rows = Math.ceil(bins.length / group);
      var rowPx = (yBot - yTop) / rows;
      var font = H.clamp(Math.min(colW / 5.4, rowPx * 0.62), 6.8, 11);
      var showText = rowPx >= font + 1.6 && colW >= 26;
      var pocRow = 0, pocTotal = -1, r2;
      var rowVals = [];
      for (r2 = 0; r2 < rows; r2++) {
        var startBin = r2 * group, endBin = Math.min(bins.length - 1, startBin + group - 1);
        var bid = 0, ask = 0;
        for (var k = startBin; k <= endBin; k++) { bid += bins[k][1] || 0; ask += bins[k][2] || 0; }
        rowVals.push({ bid: bid, ask: ask, start: startBin, end: endBin, total: bid + ask });
        if (bid + ask > pocTotal) { pocTotal = bid + ask; pocRow = r2; }
      }
      for (r2 = 0; r2 < rows; r2++) {
        var rv = rowVals[r2];
        // bins[k][0] 是价格档下沿；价格越高 y 越小
        var priceLow = bins[rv.start][0];
        var priceHigh = bins[rv.end][0] + (fp.step || (bins.length > 1 ? bins[1][0] - bins[0][0] : 0.01));
        var cellTop = eng.yOfPrice(priceHigh);
        var cellBot = eng.yOfPrice(priceLow);
        var cellH = Math.max(1, cellBot - cellTop);
        var imbalance = rv.ask - rv.bid;
        var bg = P.fpBalanced;
        if (imbalance > (rv.bid + rv.ask) * 0.16) bg = P.fpAsk;
        else if (imbalance < -(rv.bid + rv.ask) * 0.16) bg = P.fpBid;
        if (r2 === pocRow) bg = P.fpPoc;
        ctx.fillStyle = bg;
        ctx.fillRect(left + 0.5, cellTop, Math.max(1, colW - 1), cellH);
        if (cellH >= 2) {
          ctx.strokeStyle = 'rgba(9,13,20,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(left, Math.round(cellBot) + 0.5);
          ctx.lineTo(right, Math.round(cellBot) + 0.5);
          ctx.stroke();
        }
        if (showText) {
          H.setFont(ctx, font, r2 === pocRow ? '700' : '400', true);
          ctx.textBaseline = 'middle';
          var cy = cellTop + cellH / 2 + 0.5;
          var bidTxt = I.fpNum(rv.bid), askTxt = I.fpNum(rv.ask), sepTxt = '×';
          var wBid = ctx.measureText(bidTxt).width;
          var wSep = ctx.measureText(sepTxt).width;
          var wAsk = ctx.measureText(askTxt).width;
          var total = wBid + wSep + wAsk + 2;
          var sx = (left + right) / 2 - total / 2;
          ctx.save();
          ctx.beginPath();
          ctx.rect(left + 1, cellTop, colW - 2, cellH);
          ctx.clip();
          ctx.textAlign = 'left';
          ctx.fillStyle = r2 === pocRow ? '#ffc9c4' : '#eb9b95';
          ctx.fillText(bidTxt, sx, cy);
          ctx.fillStyle = 'rgba(148,163,184,0.62)';
          ctx.fillText(sepTxt, sx + wBid, cy);
          ctx.fillStyle = r2 === pocRow ? '#c0f5ec' : '#7fd4c3';
          ctx.fillText(askTxt, sx + wBid + wSep, cy);
          ctx.restore();
        }
      }
      // 列的左右边界 + 方向条（用实体范围表现开收盘方向）
      ctx.strokeStyle = 'rgba(148,163,184,0.17)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(left) + 0.5, yTop);
      ctx.lineTo(Math.round(left) + 0.5, yBot);
      ctx.moveTo(Math.round(right) + 0.5, yTop);
      ctx.lineTo(Math.round(right) + 0.5, yBot);
      ctx.stroke();
      var oY = eng.yOfPrice(b.o), cY = eng.yOfPrice(b.c);
      ctx.fillStyle = b.c >= b.o ? P.bull : P.bear;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(left + 1, Math.min(oY, cY), 2.5, Math.max(1, Math.abs(cY - oY)));
      ctx.globalAlpha = 1;
      if (i === lastIdx) {
        ctx.strokeStyle = 'rgba(203,213,225,0.26)';
        ctx.lineWidth = 1;
        ctx.strokeRect(left + 0.5, yTop + 0.5, Math.max(1, colW - 1), Math.max(1, yBot - yTop - 1));
      }
    }
    ctx.restore();
  }

  function drawMiniCandle(ctx, eng, b, xC, barW) {
    var w = H.clamp(barW * 0.5, 1, 8);
    ctx.strokeStyle = b.c >= b.o ? P.bull : P.bear;
    ctx.lineWidth = Math.max(1, w * 0.25);
    ctx.beginPath();
    ctx.moveTo(xC, eng.yOfPrice(b.h));
    ctx.lineTo(xC, eng.yOfPrice(b.l));
    ctx.stroke();
    ctx.fillStyle = b.c >= b.o ? P.bull : P.bear;
    var yO = eng.yOfPrice(b.o), yC = eng.yOfPrice(b.c);
    ctx.fillRect(xC - w / 2, Math.min(yO, yC), w, Math.max(1, Math.abs(yC - yO)));
  }

  /* ------------------------------------------------------------------ */
  /* Ladder 订单簿面板                                                   */
  /* ------------------------------------------------------------------ */
  function drawLadder(ctx, eng, rect, side) {
    if (!eng.scenario) return;
    var headerH = 20;
    var available = rect.h - headerH - 4;
    var half = H.clamp(Math.floor(available / 26), 2, 6);
    var levelCount = half * 2 + 1;
    var data = I.ladder(eng.scenario, hoverIndex(eng), {
      levels: levelCount, priceMin: eng.yMin, priceMax: eng.yMax
    });
    if (!data) return;
    var rows = data.levels.length;
    var rowH = Math.min(side ? 26 : 24, available / rows);
    var usedH = rows * rowH;
    var startY = rect.y + headerH + 2 + Math.max(0, (available - usedH) / 2);
    var centerX = rect.x + rect.w / 2;
    var priceW = side ? H.clamp(Math.round(rect.w * 0.36), 50, 88) : H.clamp(Math.round(rect.w * 0.14), 66, 100);
    var priceLeft = centerX - priceW / 2, priceRight = centerX + priceW / 2;
    var barMaxW = side
      ? Math.max(14, (rect.w - priceW) / 2 - 12)
      : Math.max(40, (rect.w - priceW) / 2 - 18);
    // 背景
    ctx.fillStyle = P.ladderBg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // 表头
    H.setFont(ctx, C.sizes.paneLabel, '600');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = P.textDim;
    ctx.fillText('订单簿 LADDER', rect.x + 7, rect.y + 10);
    H.setFont(ctx, C.sizes.paneLabel, '500', true);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.textFaint;
    var wideBottom = !side && rect.w >= 560;
    var info;
    if (wideBottom) {
      info = '中间价 ' + H.fmtFixed(data.close, data.priceDecimals) +
        ' · 点差 ' + H.fmtFixed(data.spread, Math.max(1, data.decimals)) +
        ' · bar #' + data.barIndex + ' ' + (eng.formatTime ? eng.formatTime(data.time) : H.timeLabel(data.time, 0, 'auto'));
    } else if (side) {
      info = '点差 ' + H.fmtFixed(data.spread, Math.max(1, data.decimals));
    } else {
      info = '点差 ' + H.fmtFixed(data.spread, Math.max(1, data.decimals)) +
        ' · #' + data.barIndex + ' ' + (eng.formatTime ? eng.formatTime(data.time) : H.timeLabel(data.time, 0, 'auto'));
    }
    ctx.fillText(info, rect.right - 7, rect.y + 10);
    if (wideBottom) {
      H.setFont(ctx, C.sizes.paneLabel, '500');
      ctx.textAlign = 'right';
      ctx.fillStyle = P.bid;
      ctx.fillText('BID 买盘', priceLeft - 8, rect.y + 10);
      ctx.textAlign = 'left';
      ctx.fillStyle = P.ask;
      ctx.fillText('卖盘 ASK', priceRight + 8, rect.y + 10);
    }
    // 买一/卖一分界
    var midY = startY + half * rowH;
    ctx.strokeStyle = 'rgba(148,163,184,0.22)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(rect.x + 5, Math.round(midY) + 0.5);
    ctx.lineTo(rect.right - 5, Math.round(midY) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    // 档位
    for (var i = 0; i < rows; i++) {
      var lv = data.levels[i];
      var y = startY + i * rowH;
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(148,163,184,0.028)';
        ctx.fillRect(rect.x + 2, y, rect.w - 4, rowH);
      }
      if (lv.wall) {
        ctx.fillStyle = lv.wall === 'bid' ? 'rgba(38,166,154,0.12)' : 'rgba(239,83,80,0.12)';
        ctx.fillRect(rect.x + 2, y, rect.w - 4, rowH);
      } else if (lv.best) {
        ctx.fillStyle = 'rgba(148,163,184,0.055)';
        ctx.fillRect(rect.x + 2, y, rect.w - 4, rowH);
      }
      var barH = Math.max(2, Math.min(rowH - 4, side ? 7 : 8));
      var barY = y + (rowH - barH) / 2;
      if (lv.bid > 0) {
        var bw = Math.max(1, (lv.bid / data.max) * barMaxW);
        ctx.fillStyle = lv.wall ? P.bid : P.bidDim;
        ctx.fillRect(priceLeft - 4 - bw, barY, bw, barH);
        if (lv.wall) {
          ctx.strokeStyle = P.wallBid;
          ctx.lineWidth = 1;
          ctx.strokeRect(priceLeft - 4 - bw + 0.5, barY + 0.5, Math.max(1, bw - 1), Math.max(1, barH - 1));
        }
      }
      if (lv.ask > 0) {
        var aw = Math.max(1, (lv.ask / data.max) * barMaxW);
        ctx.fillStyle = lv.wall ? P.ask : P.askDim;
        ctx.fillRect(priceRight + 4, barY, aw, barH);
        if (lv.wall) {
          ctx.strokeStyle = P.wallAsk;
          ctx.lineWidth = 1;
          ctx.strokeRect(priceRight + 4.5, barY + 0.5, Math.max(1, aw - 1), Math.max(1, barH - 1));
        }
      }
      if (lv.best) {
        ctx.fillStyle = lv.side === 'bid' ? P.bull : P.bear;
        ctx.fillRect(rect.x + 2, y + 1, 2, Math.max(1, rowH - 2));
      }
      // 价格
      H.setFont(ctx, side ? 9.5 : 10.5, lv.best ? '700' : (lv.wall ? '600' : '400'), true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = lv.side === 'bid' ? '#9fe6d6' : '#f6b3af';
      if (lv.best) ctx.fillStyle = lv.side === 'bid' ? P.bullText : P.bearText;
      ctx.fillText(H.fmtFixed(lv.price, data.decimals), centerX, y + rowH / 2 + 0.5);
      // 量（贴近价格列，量柱向外延伸）
      if (rowH >= 10) {
        H.setFont(ctx, side ? 8.5 : 9, '500', true);
        if (lv.bid > 0) {
          ctx.textAlign = 'right';
          ctx.fillStyle = lv.wall ? P.wallBid : (lv.best ? P.bid : P.textDim);
          haloText(ctx, H.fmtCompact(lv.bid), priceLeft - 6, y + rowH / 2 + 0.5);
        }
        if (lv.ask > 0) {
          ctx.textAlign = 'left';
          ctx.fillStyle = lv.wall ? P.wallAsk : (lv.best ? P.ask : P.textDim);
          haloText(ctx, H.fmtCompact(lv.ask), priceRight + 6, y + rowH / 2 + 0.5);
        }
      }
      if (lv.wall && rowH >= 12 && !side) {
        H.setFont(ctx, 9, '600');
        ctx.textAlign = lv.wall === 'bid' ? 'right' : 'left';
        ctx.fillStyle = lv.wall === 'bid' ? P.wallBid : P.wallAsk;
        var wallX = lv.wall === 'bid'
          ? priceLeft - 6 - Math.max(1, (lv.bid / data.max) * barMaxW) - 6
          : priceRight + 6 + Math.max(1, (lv.ask / data.max) * barMaxW) + 6;
        wallX = H.clamp(wallX, rect.x + 26, rect.right - 26);
        ctx.fillText(lv.wall === 'bid' ? '买墙' : '卖墙', wallX, y + rowH / 2 + 0.5);
      }
    }
    if (!side && rect.w > 420) {
      H.setFont(ctx, 8.5, '400');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = P.textFaint;
      ctx.fillText('委托簿为示意数据：档位间距随价格轴自适应，亮色标记为合成大额挂单', rect.x + 7, rect.bottom - 8);
    }
  }

  C.panels = {
    normalizePanels: normalizePanels,
    buildSeries: buildSeries,
    paneDefs: paneDefs,
    ladderBottomHeight: LADDER_BOTTOM_H,
    viewRange: viewRange,
    strictRange: strictRange,
    hoverIndex: hoverIndex,
    footprintState: footprintState,
    drawPane: function (ctx, eng, item, rect) {
      if (!rect || rect.h < 4) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      if (item.key === 'volume') drawVolume(ctx, eng, rect);
      else if (item.key === 'delta') drawDelta(ctx, eng, rect);
      else if (item.key === 'cvd') {
        drawCvdBars(ctx, eng, rect);
      } else if (item.key === 'atr') {
        if (eng.series.atr) {
          drawLinePane(ctx, eng, rect, eng.series.atr.values, P.atr,
            'ATR(' + eng.series.atr.period + ')',
            function (v) { return H.fmtFixed(v, 2); }, '', replayAtr(eng));
        }
      }
      ctx.restore();
    },
    drawMA: drawMA,
    drawProfile: drawProfile,
    drawFootprint: drawFootprint,
    drawLadder: drawLadder
  };
})(typeof window !== 'undefined' ? window : globalThis);
