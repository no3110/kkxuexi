/* 情景数据生成器（Lead 维护 · 冻结）
 * 用固定 seed + 价格故事线 path 生成可复现的模拟 K 线，并按需合成 Delta / Footprint 数据。
 * 输出结构见 CONTRACT.md 第 5 节。所有图都是教学用模拟数据，不是真实行情。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var D = LQ.data = LQ.data || {};

  D.timeframes = {
    '1m': 60 * 1000, '3m': 3 * 60 * 1000, '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000, '30m': 30 * 60 * 1000,
    '1H': 60 * 60 * 1000, '2H': 2 * 60 * 60 * 1000, '4H': 4 * 60 * 60 * 1000,
    '1D': 24 * 60 * 60 * 1000, '1W': 7 * 24 * 60 * 60 * 1000
  };

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  D.rng = function (seed) { return mulberry32(Number(seed) || 1); };

  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function round(value, digits) {
    var p = Math.pow(10, digits === undefined ? 2 : digits);
    return Math.round(Number(value) * p) / p;
  }

  function interpolate(path, x) {
    if (x <= path[0][0]) return path[0][1];
    for (var i = 1; i < path.length; i++) {
      if (x <= path[i][0]) {
        var a = path[i - 1], b = path[i];
        var span = b[0] - a[0];
        if (span <= 0) return b[1];
        var t = (x - a[0]) / span;
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return path[path.length - 1][1];
  }

  function normalizePanels(raw) {
    raw = raw || {};
    var ma = Array.isArray(raw.ma) ? raw.ma.filter(function (n) { return isFinite(Number(n)) && Number(n) > 1; }).map(Number) : [];
    return {
      volume: raw.volume !== false,
      delta: !!raw.delta,
      cvd: !!raw.cvd || !!raw.delta,
      footprint: !!raw.footprint,
      profile: !!raw.profile,
      ladder: !!raw.ladder,
      atr: !!raw.atr,
      atrPeriod: Math.max(2, Math.round(num(raw.atrPeriod, 14))),
      ma: ma
    };
  }

  /* 逻辑 Delta：收盘越靠近最高价，主动买越多；再用随机噪声避免每根都“教科书”。 */
  function synthDelta(bar, rnd, tick) {
    var range = Math.max(tick, bar.h - bar.l);
    var closePos = (bar.c - bar.l) / range;
    var bodyDir = (bar.c - bar.o) / range;
    var buyRatio = 0.5 + (closePos - 0.5) * 0.34 + bodyDir * 0.12 + (rnd() * 2 - 1) * 0.06;
    buyRatio = Math.min(0.86, Math.max(0.14, buyRatio));
    return round(bar.v * (buyRatio * 2 - 1), 2);
  }

  /* 每根 K 线的足迹：在 low..high 之间切价格档，成交量和 delta 按钟形分布摊到各档。 */
  function buildFootprint(bar, delta, rnd, tick) {
    var range = Math.max(tick, bar.h - bar.l);
    var bins = Math.round(range / tick);
    bins = Math.max(6, Math.min(24, bins));
    var step = range / bins;
    var askTotal = Math.max(0, (bar.v + delta) / 2);
    var bidTotal = Math.max(0, (bar.v - delta) / 2);
    var center = (bar.o + bar.c) / 2;
    var centerPos = (center - bar.l) / range;
    var weights = [], sum = 0, k;
    for (k = 0; k < bins; k++) {
      var pos = (k + 0.5) / bins;
      var w = Math.exp(-Math.pow((pos - centerPos) / 0.5, 2)) * (0.75 + rnd() * 0.5);
      weights.push(w);
      sum += w;
    }
    var rows = [];
    for (k = 0; k < bins; k++) {
      var share = weights[k] / sum;
      rows.push([
        round(bar.l + step * k, 4),
        round(bidTotal * share, 2),
        round(askTotal * share, 2)
      ]);
    }
    return { step: round(step, 6), bins: rows };
  }

  /* 事件标注校验：越界只记 warning（图表会裁剪），不阻断加载。 */
  function validateEvents(events, bars, id) {
    var warnings = [];
    if (!events || typeof events !== 'object') return warnings;
    var n = bars.length;
    var minLow = Infinity, maxHigh = -Infinity;
    bars.forEach(function (b) { if (b.l < minLow) minLow = b.l; if (b.h > maxHigh) maxHigh = b.h; });
    var range = Math.max(0.0001, maxHigh - minLow);
    function checkX(value, label) {
      if (value === null || value === undefined) return;
      if (!isFinite(value) || value < 0 || value > n - 1) {
        warnings.push('情景 ' + id + ' 事件 ' + label + ' 的 x=' + value + ' 超出 bar 范围 [0,' + (n - 1) + ']');
      }
    }
    function checkY(value, label) {
      if (value === null || value === undefined) return;
      if (!isFinite(value)) {
        warnings.push('情景 ' + id + ' 事件 ' + label + ' 的 y 不是有效数字');
        return;
      }
      if (value < minLow - range * 0.6 || value > maxHigh + range * 0.6) {
        warnings.push('情景 ' + id + ' 事件 ' + label + ' 的 y=' + value + ' 远离价格区间 [' + round(minLow, 2) + ',' + round(maxHigh, 2) + ']');
      }
    }
    Object.keys(events).forEach(function (key) {
      var ev = events[key], label = key + '(' + (ev && ev.kind) + ')';
      if (!ev || typeof ev !== 'object') { warnings.push('情景 ' + id + ' 事件 ' + key + ' 不是对象'); return; }
      var kind = ev.kind;
      if (kind === 'zone' || kind === 'hline' || kind === 'segment' || kind === 'range') {
        checkX(ev.x1, label + '.x1'); checkX(ev.x2, label + '.x2');
      }
      if (kind === 'marker' || kind === 'text') { checkX(ev.x, label + '.x'); checkY(ev.y, label + '.y'); }
      if (kind === 'zone') { checkY(ev.y1, label + '.y1'); checkY(ev.y2, label + '.y2'); }
      if (kind === 'hline') { checkY(ev.y, label + '.y'); }
      if (kind === 'segment') { checkY(ev.y1, label + '.y1'); checkY(ev.y2, label + '.y2'); }
      if (kind === 'fib') { checkY(ev.y1, label + '.y1'); checkY(ev.y2, label + '.y2'); }
      if (kind === 'range' && ev.y1 !== undefined) { checkY(ev.y1, label + '.y1'); checkY(ev.y2, label + '.y2'); }
    });
    return warnings;
  }

  /**
   * 构建情景数据。cfg 见 CONTRACT.md 5 节。
   */
  D.buildScenario = function (cfg) {
    if (!cfg || !cfg.id) throw new Error('buildScenario: 缺少 id');
    var id = cfg.id;
    var path = Array.isArray(cfg.path) ? cfg.path : [];
    if (path.length < 2) throw new Error('buildScenario(' + id + '): path 至少需要 2 个点');
    var lastX = Math.round(Number(path[path.length - 1][0]));
    var N = Math.round(num(cfg.bars, lastX + 1));
    if (!(N >= 20)) throw new Error('buildScenario(' + id + '): bars 至少 20 根');
    var prevX = -1;
    path.forEach(function (p) {
      var x = Math.round(Number(p[0])), y = Number(p[1]);
      if (!isFinite(x) || !isFinite(y)) throw new Error('buildScenario(' + id + '): path 点必须是数字');
      if (x <= prevX) throw new Error('buildScenario(' + id + '): path 的 x 必须递增');
      if (x < 0 || x >= N) throw new Error('buildScenario(' + id + '): path x=' + x + ' 超出 bars 范围');
      prevX = x;
    });

    var rnd = mulberry32(num(cfg.seed, 1));
    var noise = Math.max(0, num(cfg.noise, 0.15));
    var wick = Math.max(0.0001, num(cfg.wick, 0.18));
    var tick = Math.max(0.0001, num(cfg.tick, 0.01));
    var volBase = Math.max(1, num(cfg.volumeBase, 1000));
    var volMove = Math.max(0, num(cfg.volumeOnMove, 1.2));
    var startPrice = num(cfg.startPrice, path[0][1]);
    var intervalMs = num(cfg.intervalMs, D.timeframes[cfg.timeframe] || D.timeframes['1H']);
    var startTime = num(cfg.startTime, Date.UTC(2025, 2, 3, 1, 0, 0));

    var anchors = {};
    path.forEach(function (p) { anchors[Math.round(p[0])] = true; });

    var closes = [], residual = 0, i;
    for (i = 0; i < N; i++) {
      if (anchors[i]) residual = 0;
      else residual = residual * 0.62 + (rnd() * 2 - 1) * noise;
      closes.push(interpolate(path, i) + residual);
    }

    var bars = [], prevClose = startPrice;
    for (i = 0; i < N; i++) {
      var c = closes[i];
      var o = i === 0 ? startPrice : prevClose;
      var upW = wick * (0.35 + rnd() * 0.9);
      var dnW = wick * (0.35 + rnd() * 0.9);
      bars.push({
        i: i,
        t: startTime + i * intervalMs,
        o: round(o, 4),
        h: round(Math.max(o, c) + upW, 4),
        l: round(Math.min(o, c) - dnW, 4),
        c: round(c, 4),
        v: 0
      });
      prevClose = c;
    }

    // 成交量：与实体/振幅正相关，叠加随机
    var bodies = bars.map(function (b) { return Math.abs(b.c - b.o); }).sort(function (a, b) { return a - b; });
    var avgBody = Math.max(tick, bodies[Math.floor(bodies.length / 2)] || tick);
    bars.forEach(function (b) {
      var move = Math.abs(b.c - b.o) + (b.h - b.l) * 0.25;
      var factor = 1 + volMove * Math.min(2.2, Math.max(0, move / avgBody - 0.7));
      b.v = round(volBase * (0.68 + rnd() * 0.64) * factor, 1);
    });

    // 精确覆盖（形态教学用）：先覆盖 OHLCV，再校验收盘与影线关系
    if (cfg.overrides && typeof cfg.overrides === 'object') {
      Object.keys(cfg.overrides).forEach(function (key) {
        var idx = Number(key), ov = cfg.overrides[key], b = bars[idx];
        if (!b || !ov) return;
        ['o', 'h', 'l', 'c', 'v'].forEach(function (f) {
          if (ov[f] !== undefined && isFinite(Number(ov[f]))) b[f] = round(Number(ov[f]), 4);
        });
        if (ov.v !== undefined) b.v = Math.max(1, Number(ov.v));
      });
    }
    bars.forEach(function (b) {
      b.h = Math.max(b.h, b.o, b.c);
      b.l = Math.min(b.l, b.o, b.c);
      if (!(b.v > 0)) b.v = volBase;
    });

    var panels = normalizePanels(cfg.panels);

    // Delta / 足迹
    bars.forEach(function (b) {
      var d = (cfg.deltaOverrides && cfg.deltaOverrides[b.i] !== undefined)
        ? Number(cfg.deltaOverrides[b.i])
        : synthDelta(b, rnd, tick);
      b.d = round(d, 2);
      if (panels.footprint) b.fp = buildFootprint(b, b.d, rnd, tick);
    });

    var warnings = validateEvents(cfg.events, bars, id);

    var scenario = {
      id: id,
      title: cfg.title || id,
      module: cfg.module || 'demo',
      lesson: cfg.lesson || null,
      symbol: cfg.symbol || 'DEMO',
      timeframe: cfg.timeframe || '1H',
      intervalMs: intervalMs,
      bars: bars,
      events: cfg.events || {},
      panels: panels,
      description: cfg.description || '',
      dataNote: cfg.dataNote || '模拟数据，仅用于教学',
      warnings: warnings
    };
    return scenario;
  };

  /* ---------- 标注小工具 ---------- */
  D.zone = function (x1, x2, y1, y2, label, tone) {
    return { kind: 'zone', x1: x1, x2: x2, y1: y1, y2: y2, label: label || '', tone: tone || 'info' };
  };
  D.hline = function (x1, x2, y, label, tone) {
    return { kind: 'hline', x1: x1, x2: x2, y: y, label: label || '', tone: tone || 'neutral' };
  };
  D.marker = function (x, y, text, position, tone) {
    return { kind: 'marker', x: x, y: y, text: text || '', position: position || 'below', tone: tone || 'info' };
  };
  D.segment = function (x1, y1, x2, y2, label, tone, opts) {
    var out = { kind: 'segment', x1: x1, y1: y1, x2: x2, y2: y2, label: label || '', tone: tone || 'neutral' };
    if (opts) { if (opts.arrow) out.arrow = true; if (opts.dashed) out.dashed = true; if (opts.width) out.width = opts.width; }
    return out;
  };
  D.text = function (x, y, text, tone) {
    return { kind: 'text', x: x, y: y, text: text || '', tone: tone || 'neutral' };
  };
  D.fib = function (x1, y1, x2, y2, levels, label, tone) {
    return {
      kind: 'fib', x1: x1, y1: y1, x2: x2, y2: y2,
      levels: Array.isArray(levels) && levels.length ? levels : [0.382, 0.5, 0.618, 0.705, 0.79],
      label: label || '', tone: tone || 'info'
    };
  };
  D.range = function (x1, x2, label, tone, opts) {
    var out = { kind: 'range', x1: x1, x2: x2, label: label || '', tone: tone || 'info' };
    if (opts) { if (opts.y1 !== undefined) out.y1 = opts.y1; if (opts.y2 !== undefined) out.y2 = opts.y2; }
    return out;
  };
  D.vprofile = function (x1, x2, opts) {
    opts = opts || {};
    return {
      kind: 'vprofile', x1: x1, x2: x2,
      bins: Math.max(6, Math.min(60, Math.round(opts.bins || 24))),
      showPOC: opts.showPOC !== false,
      showVA: opts.showVA !== false,
      side: opts.side || 'right',
      label: opts.label || '区间成交量分布',
      tone: opts.tone || 'info',
      hideLabels: !!opts.hideLabels
    };
  };
  D.vpline = function (x1, x2, level, range, label, tone) {
    return { kind: 'vpline', x1: x1, x2: x2, level: level || 'poc', range: range || null, label: label || '', tone: tone || 'info' };
  };

  function hashString(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return h >>> 0;
  }

  /**
   * 真实行情情景：从已注册数据集切片生成，成交量真实；Delta/Footprint 为教学估算。
   * 数据集 bars 格式：[[timestampMs,o,h,l,c,v], ...]
   */
  D.buildRealScenario = function (cfg) {
    if (!cfg || !cfg.id) throw new Error('buildRealScenario: 缺少 id');
    var id = cfg.id;
    var ds = (typeof D.getDataset === 'function') ? D.getDataset(cfg.dataset) : null;
    if (!ds) throw new Error('buildRealScenario(' + id + '): 未知数据集 ' + cfg.dataset);
    var from = (cfg.slice && cfg.slice.from !== undefined) ? Math.max(0, cfg.slice.from) : 0;
    var to = (cfg.slice && cfg.slice.to !== undefined) ? Math.min(ds.bars.length - 1, cfg.slice.to) : ds.bars.length - 1;
    if (to - from < 20) throw new Error('buildRealScenario(' + id + '): 切片 bar 太少');
    var raw = ds.bars.slice(from, to + 1);
    var rnd = mulberry32(cfg.seed || hashString(id));
    var panels = normalizePanels(cfg.panels);
    var bars = [];
    raw.forEach(function (row, idx) {
      var o = Number(row[1]), h = Number(row[2]), l = Number(row[3]), c = Number(row[4]), v = Number(row[5]);
      if (!isFinite(o) || !isFinite(h) || !isFinite(l) || !isFinite(c)) return;
      bars.push({ i: idx, t: Number(row[0]), o: o, h: Math.max(h, o, c), l: Math.min(l, o, c), c: c, v: isFinite(v) && v > 0 ? v : 0 });
    });
    var vols = bars.map(function (b) { return b.v; }).filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
    var medianV = vols.length ? vols[Math.floor(vols.length / 2)] : 1000;
    bars.forEach(function (b) {
      if (!(b.v > 0)) b.v = medianV * 0.6;
      b.o = round(b.o, 2); b.h = round(b.h, 2); b.l = round(b.l, 2); b.c = round(b.c, 2);
      var d = (cfg.deltaOverrides && cfg.deltaOverrides[b.i] !== undefined) ? Number(cfg.deltaOverrides[b.i]) : synthDelta(b, rnd, 0.25);
      b.d = round(d, 2);
      if (panels.footprint) b.fp = buildFootprint(b, b.d, rnd, 0.25);
    });
    var warnings = validateEvents(cfg.events, bars, id);
    function isoRange(a, b) {
      var fmt = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
      return fmt(a) + ' ~ ' + fmt(b);
    }
    var scenarioRange = isoRange(bars[0].t, bars[bars.length - 1].t);
    var dataNote = cfg.dataNote || ('真实历史数据 · ' + ds.source + ' · ' + ds.symbol + ' ' + ds.interval +
      ' · ' + scenarioRange + '；订单流内部数据（Delta/Footprint）为教学估算，非真实逐笔数据');
    return {
      id: id,
      title: cfg.title || id,
      module: cfg.module || 'real',
      lesson: cfg.lesson || null,
      symbol: cfg.symbol || ds.symbol,
      timeframe: cfg.timeframe || ds.interval,
      intervalMs: cfg.intervalMs || D.timeframes[cfg.timeframe] || D.timeframes['1D'],
      bars: bars,
      events: cfg.events || {},
      panels: panels,
      description: cfg.description || '',
      dataNote: dataNote,
      dataSource: {
        type: 'real',
        datasetId: ds.id,
        source: ds.source,
        sourceUrl: ds.sourceUrl,
        fetchedAt: ds.fetchedAt,
        range: scenarioRange,
        datasetRange: ds.range,
        symbol: ds.symbol,
        interval: ds.interval
      },
      warnings: warnings
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
