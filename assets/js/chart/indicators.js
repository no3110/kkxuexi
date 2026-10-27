/* ==========================================================================
 * 图表引擎 · 主题 / 共享工具 / 指标计算（chart-engineer 维护）
 * 纯 Canvas2D、零依赖、零网络；classic script IIFE，挂到 window.LQ.chart。
 * 本文件是 chart 目录第一个加载的脚本，负责创建 LQ.chart 命名空间、
 * 集中定义全部颜色（palette / tones）以及 MA / ATR / CVD / 成交量分布 /
 * 订单簿 ladder 的确定性合成。
 * ========================================================================== */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var C = LQ.chart = LQ.chart || {};

  C.VERSION = '1.0.0';

  /* ------------------------------------------------------------------ *
   * 字体
   * ------------------------------------------------------------------ */
  C.fonts = {
    family: '"Segoe UI", "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
  };
  C.font = function (size, weight, mono) {
    return (weight ? weight + ' ' : '') + size + 'px ' + (mono ? C.fonts.mono : C.fonts.family);
  };
  C.sizes = {
    axis: 10, axisNarrow: 9,
    label: 10.5, labelNarrow: 9.5,
    paneLabel: 9,
    info: 11, infoNarrow: 10
  };

  /* ------------------------------------------------------------------ *
   * 主题色板（全部颜色集中在这里；网站是深色主题）
   * ------------------------------------------------------------------ */
  var P = C.palette = {
    bg: '#0b0f16',
    plotBg: '#0b1018',
    paneBg: '#0a0e15',
    paneBgAlt: '#0c1119',
    chipBg: 'rgba(9, 13, 20, 0.93)',
    chipBorder: 'rgba(148, 163, 184, 0.30)',
    grid: 'rgba(148, 163, 184, 0.075)',
    gridStrong: 'rgba(148, 163, 184, 0.14)',
    axisLine: 'rgba(148, 163, 184, 0.20)',
    axisText: '#8493a6',
    axisTextDim: '#5f6c7d',
    text: '#dbe4ee',
    textDim: '#97a4b5',
    textFaint: '#6b7889',
    bull: '#26a69a',
    bullText: '#5fe0d2',
    bear: '#ef5350',
    bearText: '#ff8a84',
    neutral: '#9aa7b8',
    info: '#4aa8ff',
    warn: '#f0b90b',
    crosshair: 'rgba(203, 213, 225, 0.55)',
    crosshairBg: '#334155',
    crosshairText: '#f1f5f9',
    volumeUp: 'rgba(38, 166, 154, 0.42)',
    volumeDown: 'rgba(239, 83, 80, 0.42)',
    volumeUpDim: 'rgba(38, 166, 154, 0.24)',
    volumeDownDim: 'rgba(239, 83, 80, 0.24)',
    deltaPos: '#2ea88f',
    deltaNeg: '#e0554f',
    cvd: '#f0b90b',
    atr: '#a78bfa',
    ma: ['#f0b90b', '#4aa8ff', '#c084fc'],
    poc: '#f0b90b',
    vah: '#4aa8ff',
    val: '#4aa8ff',
    fpText: '#d3deea',
    fpTextDim: '#8b99ab',
    fpBalanced: 'rgba(148, 163, 184, 0.075)',
    fpAsk: 'rgba(38, 166, 154, 0.20)',
    fpBid: 'rgba(239, 83, 80, 0.20)',
    fpPoc: 'rgba(240, 185, 11, 0.22)',
    bid: '#2ea88f',
    bidDim: 'rgba(46, 168, 143, 0.30)',
    ask: '#ef5350',
    askDim: 'rgba(239, 83, 80, 0.30)',
    wallBid: '#54e0c4',
    wallAsk: '#ff8a84',
    ladderBg: '#080c12',
    ladderMid: 'rgba(148, 163, 184, 0.10)',
    profileBg: 'rgba(8, 12, 18, 0.55)',
    hintBg: 'rgba(9, 13, 20, 0.78)',
    placeholderText: '#f0b90b'
  };

  /* tone 映射：bull / bear / neutral / info / warn */
  C.tones = {
    bull: { line: P.bull, fill: 'rgba(38, 166, 154, 0.16)', strong: 'rgba(38, 166, 154, 0.34)', text: P.bullText },
    bear: { line: P.bear, fill: 'rgba(239, 83, 80, 0.16)', strong: 'rgba(239, 83, 80, 0.34)', text: P.bearText },
    neutral: { line: '#9aa7b8', fill: 'rgba(148, 163, 184, 0.10)', strong: 'rgba(148, 163, 184, 0.30)', text: '#c8d2de' },
    info: { line: P.info, fill: 'rgba(74, 168, 255, 0.13)', strong: 'rgba(74, 168, 255, 0.32)', text: '#8cc7ff' },
    warn: { line: P.warn, fill: 'rgba(240, 185, 11, 0.14)', strong: 'rgba(240, 185, 11, 0.32)', text: '#ffd666' }
  };
  C.tone = function (name) { return C.tones[name] || C.tones.neutral; };

  /* ------------------------------------------------------------------ *
   * 通用小工具
   * ------------------------------------------------------------------ */
  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) return min;
    return n < min ? min : (n > max ? max : n);
  }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function num(v, fallback) {
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return fallback;
    var n = Number(v);
    return isFinite(n) ? n : fallback;
  }
  function pad2(n) { n = Math.floor(n); return n < 10 ? '0' + n : '' + n; }
  function mean(arr) {
    if (!arr || !arr.length) return 0;
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }
  function roundToStep(value, step) {
    step = Math.abs(Number(step)) || 1;
    return Math.round(Number(value) / step) * step;
  }
  /* 把任意步长整理成 1 / 2 / 2.5 / 5 / 10 × 10^n 的“好看步长” */
  function niceStep(raw) {
    var x = Math.abs(Number(raw));
    if (!isFinite(x) || x <= 0) return 1;
    var exp = Math.floor(Math.log(x) / Math.LN10);
    var base = Math.pow(10, exp);
    var f = x / base;
    var m = f <= 1 ? 1 : (f <= 2 ? 2 : (f <= 2.5 ? 2.5 : (f <= 5 ? 5 : 10)));
    return m * base;
  }
  /* 步长需要几位小数才能精确显示 */
  function decimalsForStep(step) {
    var s = Math.abs(Number(step));
    if (!isFinite(s) || s === 0) return 2;
    for (var d = 0; d <= 6; d++) {
      var p = Math.pow(10, d);
      if (Math.abs(Math.round(s * p) / p - s) <= s * 1e-6 + 1e-12) return d;
    }
    return 4;
  }
  function priceDecimals(value) {
    var abs = Math.abs(Number(value)) || 0;
    if (abs >= 10000) return 1;
    if (abs >= 1000) return 1;
    if (abs >= 100) return 2;
    if (abs >= 10) return 3;
    if (abs >= 1) return 4;
    return 5;
  }
  function trimZeros(s) { return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
  function fmtCompact(n) {
    var x = Number(n);
    if (!isFinite(x)) return '—';
    var abs = Math.abs(x), sign = x < 0 ? '-' : '';
    if (abs >= 1e9) return sign + trimZeros((abs / 1e9).toFixed(2)) + 'B';
    if (abs >= 1e6) return sign + trimZeros((abs / 1e6).toFixed(2)) + 'M';
    if (abs >= 1e4) return sign + trimZeros((abs / 1e3).toFixed(1)) + 'K';
    if (abs >= 1000) return sign + trimZeros((abs / 1e3).toFixed(2)) + 'K';
    if (abs >= 100) return sign + String(Math.round(abs));
    if (abs >= 10) return sign + trimZeros((Math.round(abs * 10) / 10).toString());
    if (abs >= 1) return sign + trimZeros((Math.round(abs * 100) / 100).toString());
    if (abs === 0) return '0';
    return sign + trimZeros((Math.round(abs * 1000) / 1000).toString());
  }
  function fmtInt(n) {
    var x = Number(n);
    if (!isFinite(x)) return '—';
    var s = String(Math.round(x)), sign = '';
    if (s.charAt(0) === '-') { sign = '-'; s = s.slice(1); }
    return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function fmtFixed(n, digits) {
    var x = Number(n);
    if (!isFinite(x)) return '—';
    return x.toFixed(clamp(digits, 0, 6));
  }
  function hashCode(str) {
    var h = 2166136261, s = String(str);
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* 与 data/generator.js 同款确定性伪随机（避免依赖加载顺序） */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* 时间轴标签（统一用 UTC，保证任何时区下截图一致；数据本身是模拟的） */
  function timeLabel(ms, spanMs, mode) {
    var t = Number(ms);
    if (!isFinite(t)) return '';
    var d = new Date(t);
    if (isNaN(d.getTime())) return '';
    var MM = pad2(d.getUTCMonth() + 1), DD = pad2(d.getUTCDate());
    var HH = pad2(d.getUTCHours()), MI = pad2(d.getUTCMinutes());
    var YY = d.getUTCFullYear();
    if (mode === 'full') return YY + '-' + MM + '-' + DD + ' ' + HH + ':' + MI;
    if (mode === 'day') return DD + ' ' + HH + ':' + MI;
    spanMs = Number(spanMs) || 0;
    if (spanMs > 864e5 * 45) return YY + '-' + MM;
    if (spanMs > 864e5 * 5) return MM + '-' + DD;
    if (spanMs > 864e5 * 1.5) return DD + ' ' + HH + ':' + MI;
    return HH + ':' + MI;
  }
  /* 时间轴刻度间隔（以 bar 数为单位） */
  function timeStepBars(targetPx, barW) {
    var need = Math.max(1, Math.ceil((Number(targetPx) || 80) / Math.max(1, barW)));
    var steps = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 50, 100, 200, 500];
    for (var i = 0; i < steps.length; i++) if (steps[i] >= need) return steps[i];
    return 1000;
  }
  function roundRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  /* 可复现的“系统字体”绘制（每次绘制前显式设置字体，避免串档） */
  function setFont(ctx, size, weight, mono) { ctx.font = C.font(size, weight, mono); }

  C.helpers = {
    clamp: clamp,
    isNum: isNum,
    num: num,
    mean: mean,
    pad2: pad2,
    roundToStep: roundToStep,
    niceStep: niceStep,
    decimalsForStep: decimalsForStep,
    priceDecimals: priceDecimals,
    fmtCompact: fmtCompact,
    fmtInt: fmtInt,
    fmtFixed: fmtFixed,
    fmtPrice: function (n, digits) {
      var d = digits === undefined ? priceDecimals(n) : digits;
      return fmtFixed(n, d);
    },
    trimZeros: trimZeros,
    hashCode: hashCode,
    rng: mulberry32,
    hashRng: function (key) { return mulberry32(hashCode(key)); },
    timeLabel: timeLabel,
    timeStepBars: timeStepBars,
    roundRect: roundRect,
    setFont: setFont,
    arrow: function (ctx, x1, y1, x2, y2, size) {
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var len = size || 8;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - len * Math.cos(ang - Math.PI / 7), y2 - len * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(x2 - len * Math.cos(ang + Math.PI / 7), y2 - len * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    }
  };

  C.warn = function (msg, detail) {
    if (typeof console !== 'undefined' && console.warn) {
      if (detail !== undefined) console.warn('[LQ.chart] ' + msg, detail);
      else console.warn('[LQ.chart] ' + msg);
    }
  };
  C.error = function (msg, detail) {
    if (typeof console !== 'undefined' && console.error) {
      if (detail !== undefined) console.error('[LQ.chart] ' + msg, detail);
      else console.error('[LQ.chart] ' + msg);
    }
  };

  /* ------------------------------------------------------------------ *
   * 指标计算（只在 mount / 数据变化时算一次，draw 时复用）
   * ------------------------------------------------------------------ */
  var H = C.helpers;
  var I = C.indicators = {};

  I.deltaOf = function (bar) {
    if (!bar) return 0;
    if (isNum(bar.delta)) return bar.delta;
    if (isNum(bar.d)) return bar.d;
    var range = Math.max(1e-9, bar.h - bar.l);
    return (num(bar.v, 0)) * (((bar.c - bar.l) / range) * 2 - 1);
  };

  I.ma = function (bars, period) {
    var n = bars.length, out = new Array(n), sum = 0;
    period = Math.max(1, Math.round(period || 20));
    for (var i = 0; i < n; i++) {
      sum += bars[i].c;
      if (i >= period) sum -= bars[i - period].c;
      out[i] = i >= period - 1 ? sum / period : null;
    }
    return out;
  };

  I.atr = function (bars, period) {
    var n = bars.length, out = new Array(n);
    period = Math.max(2, Math.round(period || 14));
    var sumTr = 0, prev = null;
    for (var i = 0; i < n; i++) {
      var tr = i === 0
        ? (bars[0].h - bars[0].l)
        : Math.max(bars[i].h - bars[i].l, Math.abs(bars[i].h - bars[i - 1].c), Math.abs(bars[i].l - bars[i - 1].c));
      if (!isFinite(tr) || tr < 0) tr = 0;
      if (i < period) {
        sumTr += tr;
        if (i === period - 1) { prev = sumTr / period; out[i] = prev; }
        else out[i] = null;
      } else {
        prev = (prev * (period - 1) + tr) / period;
        out[i] = prev;
      }
    }
    return out;
  };

  I.cvd = function (bars) {
    var out = new Array(bars.length), acc = 0;
    for (var i = 0; i < bars.length; i++) { acc += I.deltaOf(bars[i]); out[i] = acc; }
    return out;
  };

  /* 成交量分布（Volume Profile）：把每根 bar 的成交量按钟形权重摊到价格档。
   * 返回 { bins:[{y0,y1,vol}], max, total, pocIndex, poc, vah, val, step } */
  I.volumeProfile = function (bars, from, to, binCount, minPrice, maxPrice) {
    var lo = Math.min(minPrice, maxPrice), hi = Math.max(minPrice, maxPrice);
    if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1e-12) return null;
    binCount = clamp(Math.round(binCount || 24), 8, 40);
    var step = (hi - lo) / binCount;
    var vols = new Array(binCount), i, k;
    for (k = 0; k < binCount; k++) vols[k] = 0;
    var start = Math.max(0, Math.floor(from));
    var end = Math.min(bars.length - 1, Math.ceil(to));
    for (i = start; i <= end; i++) {
      var b = bars[i];
      if (!b) continue;
      if (typeof b.getFootprint === 'function') {
        b.getFootprint().bins.forEach(function (row) { var index = clamp(Math.floor((row[0] - lo) / step), 0, binCount - 1); vols[index] += row[1] + row[2]; });
        continue;
      }
      var bl = Math.max(b.l, lo), bh = Math.min(b.h, hi);
      if (!(bh > bl)) {
        var tp = clamp((b.h + b.l + b.c) / 3, lo, hi);
        var ti = clamp(Math.floor((tp - lo) / step), 0, binCount - 1);
        vols[ti] += num(b.v, 0);
        continue;
      }
      var b0 = clamp(Math.floor((bl - lo) / step), 0, binCount - 1);
      var b1 = clamp(Math.floor((bh - lo) / step), 0, binCount - 1);
      var center = clamp(b.c, bl, bh);
      var width = Math.max(step * 1.1, (bh - bl) * 0.45);
      var weights = [], total = 0;
      for (k = b0; k <= b1; k++) {
        var mid = lo + (k + 0.5) * step;
        var w = Math.exp(-Math.pow((mid - center) / width, 2)) * 0.72 + 0.28;
        weights.push(w);
        total += w;
      }
      if (!(total > 0)) continue;
      for (k = 0; k < weights.length; k++) vols[b0 + k] += num(b.v, 0) * weights[k] / total;
    }
    var totalVol = 0, maxVol = 0, pocIndex = 0;
    for (k = 0; k < binCount; k++) {
      totalVol += vols[k];
      if (vols[k] > maxVol) { maxVol = vols[k]; pocIndex = k; }
    }
    if (!(totalVol > 0)) return null;
    // 70% Value Area：从 POC 向两侧扩张，每次加入较大的一侧
    var target = totalVol * 0.7, acc = vols[pocIndex], loIdx = pocIndex, hiIdx = pocIndex;
    while (acc < target && (loIdx > 0 || hiIdx < binCount - 1)) {
      var up = hiIdx < binCount - 1 ? vols[hiIdx + 1] : -1;
      var down = loIdx > 0 ? vols[loIdx - 1] : -1;
      if (up >= down) { hiIdx++; acc += up; } else { loIdx--; acc += down; }
    }
    var bins = [];
    for (k = 0; k < binCount; k++) {
      bins.push({ y0: lo + k * step, y1: lo + (k + 1) * step, vol: vols[k] });
    }
    return {
      bins: bins, max: maxVol, total: totalVol, step: step,
      pocIndex: pocIndex,
      poc: lo + (pocIndex + 0.5) * step,
      vah: lo + (hiIdx + 1) * step,
      val: lo + loIdx * step
    };
  };

  /* 订单簿 ladder：按 scenario.id + bar 下标确定性合成买卖档位（不依赖额外数据）。
   * 档位价格对齐主图价格轴（按可见价格范围自适应间距），因此 scenario.events 里
   * 标注了“买墙/卖墙/大额挂单”的 hline 会被吸附到最近的档位并放大成挂单墙，
   * 保证“图上标注”和“订单簿面板”讲的是同一个价位。 */
  I.ladder = function (scenario, barIndex, opts) {
    if (scenario && typeof scenario.book === 'function') return scenario.book(barIndex, opts || {});
    opts = opts || {};
    var bars = (scenario && scenario.bars) || [];
    if (!bars.length) return null;
    var idx = clamp(Math.round(num(barIndex, bars.length - 1)), 0, bars.length - 1);
    var bar = bars[idx];
    var dec = clamp(priceDecimals(bar.c), 1, 4);
    var tick = Math.pow(10, -dec);
    var levelCount = clamp(Math.round(num(opts.levels, 9) || 9), 5, 15);
    if (levelCount % 2 === 0) levelCount += 1; // 保持以中间价对称
    var half = (levelCount - 1) / 2;
    var priceMin = num(opts.priceMin, NaN), priceMax = num(opts.priceMax, NaN);
    var visibleRange = (isFinite(priceMin) && isFinite(priceMax) && priceMax > priceMin)
      ? (priceMax - priceMin) : Math.max(bar.h - bar.l, tick * 10);
    var step = H.niceStep(visibleRange / Math.max(6, levelCount) * 1.25);
    if (!(step > 0)) step = tick * 10;
    step = Math.max(step, tick * 3);
    var stepDecimals = clamp(decimalsForStep(step), 0, 4);
    var center = roundToStep(bar.c, step);
    // 平均成交量：取当前 bar 附近 ±6 根，让量柱尺度与图上的成交量面板一致
    var sum = 0, cnt = 0;
    for (var i = Math.max(0, idx - 6); i <= Math.min(bars.length - 1, idx + 6); i++) { sum += num(bars[i].v, 0); cnt++; }
    var avgVol = cnt ? sum / cnt : 1000;
    var rnd = H.hashRng(String((scenario && scenario.id) || 'scenario') + '|ladder|' + idx);
    var base = Math.max(1, avgVol * 0.02);
    var levels = [], k, p;
    for (k = half; k >= -half; k--) {
      p = roundToStep(center + k * step, step);
      levels.push({
        price: p,
        bid: 0, ask: 0,
        wall: null,
        side: k > 0 ? 'ask' : 'bid',
        best: false
      });
    }
    var bestBidPrice = center;
    var bestAskPrice = roundToStep(center + step, step);
    levels.forEach(function (lv) {
      var size = base * (0.25 + rnd() * 1.6);
      if (lv.side === 'ask') lv.ask = Math.max(1, Math.round(size));
      else lv.bid = Math.max(1, Math.round(size));
      lv.best = (lv.price === bestBidPrice) || (lv.price === bestAskPrice);
    });
    // 把 scenario.events 里的“墙”标注吸附到最近档位
    var wallSides = {};
    var events = (scenario && scenario.events) || {};
    Object.keys(events).forEach(function (key) {
      var ev = events[key];
      if (!ev || ev.kind !== 'hline') return;
      var label = String(ev.label === undefined ? '' : ev.label);
      if (!/墙|大额|挂单|wall/i.test(label)) return;
      var price = num(ev.y, NaN);
      if (!isFinite(price)) return;
      var bestRow = null, bestDist = Infinity;
      levels.forEach(function (lv) {
        var d = Math.abs(lv.price - price);
        if (d < bestDist) { bestDist = d; bestRow = lv; }
      });
      if (!bestRow || bestDist > step * 1.2) return;
      var side = ev.tone === 'bull' ? 'bid' : (ev.tone === 'bear' ? 'ask' : (price >= center ? 'ask' : 'bid'));
      var size = Math.round(base * (5 + rnd() * 3));
      if (side === 'ask') {
        bestRow.bid = 0;
        bestRow.ask = Math.max(bestRow.ask, size);
        bestRow.wall = 'ask';
      } else {
        bestRow.ask = 0;
        bestRow.bid = Math.max(bestRow.bid, size);
        bestRow.wall = 'bid';
      }
      bestRow.side = side;
      wallSides[side] = true;
    });
    // 若某一侧没有标注墙，按种子补 1 个自然挂单墙，保证面板有教学素材
    ['bid', 'ask'].forEach(function (side) {
      if (wallSides[side]) return;
      if (rnd() < 0.35) return;
      var pool = levels.filter(function (lv) { return lv.side === side && !lv.best; });
      if (!pool.length) return;
      var pick = pool[Math.floor(rnd() * pool.length)];
      var size = Math.round(base * (4 + rnd() * 3));
      if (side === 'ask') pick.ask = Math.max(pick.ask, size);
      else pick.bid = Math.max(pick.bid, size);
      pick.wall = side;
    });
    var maxSize = 0;
    levels.forEach(function (lv) { maxSize = Math.max(maxSize, lv.bid, lv.ask); });
    return {
      barIndex: idx,
      time: bar.t,
      close: bar.c,
      mid: bar.c,
      tick: tick,
      step: step,
      decimals: Math.max(stepDecimals, 0),
      priceDecimals: dec,
      bestBid: bestBidPrice,
      bestAsk: bestAskPrice,
      spread: roundToStep(bestAskPrice - bestBidPrice, tick),
      levels: levels,
      max: maxSize,
      avg: avgVol
    };
  };

  /* ================================================================== *
   * V2：固定区间成交量分布（vprofile / vpline）
   * 把 bars[x1..x2] 每根 bar 的成交量按键 high-low 价格区间近似均匀地摊到
   * 价格档上，返回 POC / VAH / VAL 等（供 vprofile 标注、vpline 与 QA 断言使用）。
   * vaPercent 默认 0.7（70% Value Area）。
   * ------------------------------------------------------------------ */
  I.rangeVolumeProfile = function (bars, x1, x2, binCount, vaPercent) {
    if (!Array.isArray(bars) || !bars.length) return null;
    var from = clamp(Math.round(num(x1, 0)), 0, bars.length - 1);
    var to = clamp(Math.round(num(x2, bars.length - 1)), 0, bars.length - 1);
    if (from > to) { var t = from; from = to; to = t; }
    binCount = clamp(Math.round(num(binCount, 24)), 6, 60);
    vaPercent = clamp(num(vaPercent, 0.7), 0.05, 0.99);
    var lo = Infinity, hi = -Infinity, i, b;
    for (i = from; i <= to; i++) {
      b = bars[i];
      if (!b) continue;
      if (num(b.l, NaN) < lo) lo = num(b.l, NaN);
      if (num(b.h, NaN) > hi) hi = num(b.h, NaN);
    }
    if (!isFinite(lo) || !isFinite(hi)) return null;
    if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
    var span = hi - lo;
    var step = span / binCount;
    var vols = new Array(binCount), k;
    for (k = 0; k < binCount; k++) vols[k] = 0;
    for (i = from; i <= to; i++) {
      b = bars[i];
      if (!b) continue;
      var v = num(b.v, 0);
      if (!(v > 0)) continue;
      if (typeof b.getFootprint === 'function') {
        b.getFootprint().bins.forEach(function (row) { var index = clamp(Math.floor((row[0] - lo) / step), 0, binCount - 1); vols[index] += row[1] + row[2]; });
        continue;
      }
      var bl = Math.max(num(b.l, lo), lo), bh = Math.min(num(b.h, hi), hi);
      var barSpan = bh - bl;
      if (!(barSpan > 0)) {
        var bi = clamp(Math.floor((clamp(num(b.c, lo), lo, hi) - lo) / step), 0, binCount - 1);
        vols[bi] += v;
        continue;
      }
      var b0 = clamp(Math.floor((bl - lo) / step), 0, binCount - 1);
      var b1 = clamp(Math.floor((bh - lo) / step), 0, binCount - 1);
      for (k = b0; k <= b1; k++) {
        var binLo = lo + k * step, binHi = binLo + step;
        var overlap = Math.min(binHi, bh) - Math.max(binLo, bl);
        if (overlap > 0) vols[k] += v * (overlap / barSpan);
      }
    }
    var total = 0, maxVol = 0, pocIndex = 0;
    for (k = 0; k < binCount; k++) {
      total += vols[k];
      if (vols[k] > maxVol) { maxVol = vols[k]; pocIndex = k; }
    }
    if (!(total > 0)) return null;
    // Value Area：从 POC 向两侧扩张，每次并入较大的一侧，直到累计达到 vaPercent
    var target = total * vaPercent, acc = vols[pocIndex], loIdx = pocIndex, hiIdx = pocIndex;
    while (acc < target && (loIdx > 0 || hiIdx < binCount - 1)) {
      var up = hiIdx < binCount - 1 ? vols[hiIdx + 1] : -1;
      var down = loIdx > 0 ? vols[loIdx - 1] : -1;
      if (up >= down) { hiIdx++; acc += up; } else { loIdx--; acc += down; }
    }
    var bins = [];
    for (k = 0; k < binCount; k++) {
      bins.push({
        low: lo + k * step,
        high: lo + (k + 1) * step,
        price: lo + (k + 0.5) * step,
        volume: vols[k]
      });
    }
    return {
      from: from, to: to, bins: bins, max: maxVol, total: total, totalVolume: total,
      step: step, lo: lo, hi: hi, pocIndex: pocIndex,
      poc: lo + (pocIndex + 0.5) * step,
      vah: lo + (hiIdx + 1) * step,
      val: lo + loIdx * step,
      vaVolume: acc, vaPercent: vaPercent, binCount: binCount
    };
  };

  /* vprofile / vpline 的统计结果（供 QA 独立复算比较的只读结构） */
  I.profileStats = function (bars, opts) {
    opts = opts || {};
    var data = I.rangeVolumeProfile(bars, opts.x1, opts.x2, opts.bins, opts.vaPercent);
    if (!data) return null;
    return {
      poc: data.poc, vah: data.vah, val: data.val,
      totalVolume: data.totalVolume, vaPercent: data.vaPercent,
      pocIndex: data.pocIndex, step: data.step,
      from: data.from, to: data.to, lo: data.lo, hi: data.hi,
      bins: data.bins.map(function (b) { return { price: b.price, low: b.low, high: b.high, volume: b.volume }; })
    };
  };

  /* ================================================================== *
   * V2：分形摆动点（左右各 k 根确认）与 HH/HL/LH/LL 分类
   * ------------------------------------------------------------------ */
  I.findSwings = function (bars, k) {
    bars = Array.isArray(bars) ? bars : [];
    k = clamp(Math.round(num(k, 3)), 1, 10);
    var out = [];
    for (var i = k; i < bars.length - k; i++) {
      var b = bars[i];
      if (!b) continue;
      var hi = num(b.h, NaN), lo = num(b.l, NaN);
      if (!isFinite(hi) || !isFinite(lo)) continue;
      var isHigh = true, isLow = true;
      for (var j = 1; j <= k; j++) {
        var l = bars[i - j], r = bars[i + j];
        if (!l || !r) { isHigh = false; isLow = false; break; }
        if (!(hi > num(l.h, NaN)) || !(hi > num(r.h, NaN))) isHigh = false;
        if (!(lo < num(l.l, NaN)) || !(lo < num(r.l, NaN))) isLow = false;
        if (!isHigh && !isLow) break;
      }
      // 一根 bar 同时包住左右（极少见）：按实体方向归为高点
      if (isHigh && isLow) isLow = false;
      if (isHigh) out.push({ index: i, type: 'H', price: hi });
      else if (isLow) out.push({ index: i, type: 'L', price: lo });
    }
    return out;
  };

  /* 按时间顺序把摆动点标为 HH/HL/LH/LL；每类第一个标 H / L */
  I.classifySwings = function (swings) {
    swings = Array.isArray(swings) ? swings : [];
    var prevHigh = null, prevLow = null, highCount = 0, lowCount = 0;
    for (var i = 0; i < swings.length; i++) {
      var s = swings[i];
      if (!s) continue;
      if (s.type === 'H') {
        highCount++;
        if (prevHigh === null) s.label = 'H';
        else s.label = s.price > prevHigh ? 'HH' : (s.price < prevHigh ? 'LH' : 'H');
        prevHigh = s.price;
      } else {
        lowCount++;
        if (prevLow === null) s.label = 'L';
        else s.label = s.price > prevLow ? 'HL' : (s.price < prevLow ? 'LL' : 'L');
        prevLow = s.price;
      }
    }
    return swings;
  };

  /* 供 footprint 使用的单个数字（足迹单元格里空间很小） */
  I.fpNum = function (n) {
    var x = Number(n);
    if (!isFinite(x) || x <= 0) return '0';
    if (x >= 100000) return trimZeros((x / 1000).toFixed(0)) + 'K';
    if (x >= 10000) return trimZeros((x / 1000).toFixed(1)) + 'K';
    if (x >= 1000) return trimZeros((x / 1000).toFixed(2)) + 'K';
    return String(Math.round(x));
  };

})(typeof window !== 'undefined' ? window : globalThis);
