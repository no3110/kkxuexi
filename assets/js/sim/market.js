/* Deterministic synthetic market. AI chooses regimes; one seeded tape drives OHLC, volume, delta and fills. */
(function (global) {
  'use strict';
  var LQ = global.LQ;
  var SIM = LQ.sim = LQ.sim || {};
  SIM.VERSION = 1;
  SIM.PER_DAY = 1380;
  SIM.HISTORY = 30 * SIM.PER_DAY;
  SIM.contracts = {
    MNQ: { name: '微型纳指', tick: 0.25, point: 2, start: 21500, volatility: 1.8, stop: 40, fee: 0.62 },
    MGC: { name: '微型黄金', tick: 0.1, point: 10, start: 2700, volatility: 0.28, stop: 8, fee: 0.62 }
  };
  var AUCTION_PHASES = {
    accumulation: { price: 0.22, flow: -0.11, absorption: 0.94, activity: 1.08, label: '吸收卖压（吸筹候选）' },
    markup: { price: 1, flow: 0.11, absorption: 0.38, activity: 1.14, label: '向上位移' },
    reaccumulation: { price: 0.34, flow: -0.08, absorption: 0.88, activity: 0.86, label: '回撤中吸收卖压（再吸筹候选）' },
    distribution: { price: -0.7, flow: 0.11, absorption: 0.94, activity: 1.08, label: '吸收买压（派发候选）' },
    markdown: { price: -1, flow: -0.11, absorption: 0.38, activity: 1.14, label: '向下位移' },
    redistribution: { price: -0.34, flow: 0.08, absorption: 0.88, activity: 0.86, label: '反弹中吸收买压（再派发候选）' }
  };
  var AUCTION_SEQUENCES = {
    range: ['accumulation', 'markup', 'distribution', 'markdown', 'markup', 'markdown'],
    'trend-up': ['accumulation', 'markup', 'reaccumulation', 'markup', 'distribution', 'markup'],
    'trend-down': ['distribution', 'markdown', 'redistribution', 'markdown', 'accumulation', 'markdown'],
    reversal: ['accumulation', 'markup', 'distribution', 'markdown', 'markup', 'markdown']
  };
  SIM.round = function (value, symbol) { var tick = SIM.contracts[symbol].tick; return Number((Math.round(value / tick) * tick).toFixed(2)); };
  function offset(date, zone) {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(date));
    return Number(parts.find(function (p) { return p.type === 'hour'; }).value) - new Date(date).getUTCHours();
  }
  function bell(minute, center, width) { var z = (minute - center) / width; return Math.exp(-0.5 * z * z); }
  SIM.dates = function (start) {
    var first = new Date(start + 'T12:00:00Z');
    if (!Number.isFinite(first.getTime())) throw new Error('请选择有效的考核开始日期');
    while (first.getUTCDay() === 0 || first.getUTCDay() === 6) first.setUTCDate(first.getUTCDate() + 1);
    var history = [], d = new Date(first);
    while (history.length < 30) { d.setUTCDate(d.getUTCDate() - 1); if (d.getUTCDay() % 6) history.unshift(d.toISOString().slice(0, 10)); }
    var future = []; d = new Date(first);
    while (future.length < 30) { if (d.getUTCDay() % 6) future.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
    return history.concat(future);
  };
  SIM.localPlans = function (seed) {
    var rnd = LQ.data.rng(seed), regimes = ['range', 'trend-up', 'trend-down', 'reversal'];
    var previousRegime = regimes[Math.floor(rnd() * regimes.length)], previousVolatility = 1;
    return Array.from({ length: 60 }, function (_, i) {
      var regime = i > 0 && rnd() < 0.68 ? previousRegime : regimes[Math.floor(rnd() * regimes.length)];
      previousRegime = regime;
      previousVolatility = Math.max(0.55, Math.min(1.85, previousVolatility + (rnd() - 0.48) * 0.3));
      var drift = regime === 'range' ? 0.008 + rnd() * 0.024 : 0.022 + rnd() * 0.07;
      return { day: i, regime: regime, volatility: +previousVolatility.toFixed(2),
        drift: +drift.toFixed(3), asia: 0.55, europe: 1.0, newyork: 1.5,
        eventMinute: 870 + Math.floor(rnd() * 150), eventStrength: +(1.5 + rnd() * 1.5).toFixed(2),
        event: ['常规流动性变化', '模拟经济数据窗口', '模拟风险偏好变化', '模拟利率预期变化'][Math.floor(rnd() * 4)] };
    });
  };
  SIM.validatePlans = function (raw) {
    if (!raw || !Array.isArray(raw.days) || raw.days.length !== 60) throw new Error('AI 需要返回完整的 60 个交易日情景，当前响应不完整。');
    function num(v, lo, hi) { return typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi; }
    return raw.days.map(function (p, i) {
      if (!p || p.day !== i || !['range', 'trend-up', 'trend-down', 'reversal'].includes(p.regime) ||
        !num(p.volatility, 0.35, 2.5) || !num(p.drift, 0, 0.12) || !num(p.asia, 0.2, 1.5) ||
        !num(p.europe, 0.4, 2) || !num(p.newyork, 0.6, 3) || !Number.isInteger(p.eventMinute) ||
        !num(p.eventMinute, 0, 1379) || !num(p.eventStrength, 1, 4) || typeof p.event !== 'string') throw new Error('AI 第 ' + (i + 1) + ' 日参数无效，未替换现有考核。');
      return { day: i, regime: p.regime, volatility: p.volatility, drift: p.drift, asia: p.asia, europe: p.europe,
        newyork: p.newyork, eventMinute: p.eventMinute, eventStrength: p.eventStrength, event: p.event.slice(0, 100) };
    });
  };
  SIM.createGenerator = function (config) {
    var contract = SIM.contracts[config.symbol];
    var legacyMarket = config.marketVersion === 1;
    if (!contract) throw new Error('不支持的合约');
    if (!Array.isArray(config.plans) || config.plans.length !== 60) throw new Error('市场情景必须包含完整的60个交易日');
    var rnd = LQ.data.rng(config.seed), dates = SIM.dates(config.start), bars = [], price = contract.start, day = 0;
    function appendDay() {
      if (day >= config.plans.length) return false;
      var plan = config.plans[day];
      var noon = Date.parse(dates[day] + 'T12:00:00Z');
      var nyOffset = offset(noon, 'America/New_York'), londonOffset = offset(noon, 'Europe/London');
      var start = noon - 12 * 3600000 - 6 * 3600000 - nyOffset * 3600000;
      if (day > 0 && rnd() < 0.25) price = Math.max(contract.tick, SIM.round(price + (rnd() - 0.5) * contract.volatility * 16, config.symbol));
      var anchor = price;
      var phaseNames = (AUCTION_SEQUENCES[plan.regime] || AUCTION_SEQUENCES.range).slice();
      if (!legacyMarket) {
        // A regime describes a bias, not a timetable or a guaranteed outcome.
        var rotation = Math.floor(rnd() * phaseNames.length);
        phaseNames = phaseNames.slice(rotation).concat(phaseNames.slice(0, rotation));
      }
      var phaseDurations = [], remainingMinutes = SIM.PER_DAY;
      if (!legacyMarket) {
        for (var phaseSlot = 0; phaseSlot < 5; phaseSlot++) {
          var phasesAfter = 5 - phaseSlot;
          var minDuration = Math.max(185, remainingMinutes - phasesAfter * 275);
          var maxDuration = Math.min(275, remainingMinutes - phasesAfter * 185);
          var phaseDuration = Math.max(minDuration, Math.min(maxDuration, 230 + Math.floor((rnd() - 0.5) * 72)));
          phaseDurations.push(phaseDuration); remainingMinutes -= phaseDuration;
        }
        phaseDurations.push(remainingMinutes);
      }
      var phaseEnds = [], phaseTotal = 0;
      phaseDurations.forEach(function (duration) { phaseTotal += duration; phaseEnds.push(phaseTotal); });
      var phaseIndex = 0, flowMemory = 0, phaseStrength = 1, phasePriceStrength = 1, activityMemory = 1;
      for (var m = 0; m < SIM.PER_DAY; m++) {
        var previousPhaseIndex = phaseIndex;
        if (!legacyMarket) while (phaseIndex < phaseEnds.length - 1 && m >= phaseEnds[phaseIndex]) phaseIndex++;
        if (!legacyMarket && (m === 0 || previousPhaseIndex !== phaseIndex)) {
          phaseStrength = 0.45 + rnd() * 1.1;
          phasePriceStrength = 0.45 + rnd() * 1.1;
        }
        var swingIndex = legacyMarket ? Math.min(5, Math.floor(m / 230)) : phaseIndex;
        var phaseName = legacyMarket ? null : phaseNames[phaseIndex], phase = legacyMarket ? null : AUCTION_PHASES[phaseName];
        var time = start + m * 60000, stamp = new Date(time), utcHour = stamp.getUTCHours(), minute = stamp.getUTCMinutes();
        var nyHour = (utcHour + nyOffset + 24) % 24, londonHour = (utcHour + londonOffset + 24) % 24;
        var session = nyHour >= 8 && nyHour < 17 ? '纽约' : londonHour >= 8 && londonHour < 16 ? '欧洲' : '亚洲';
        var factor = session === '纽约' ? plan.newyork : session === '欧洲' ? plan.europe : plan.asia;
        var localHour = session === '纽约' ? nyHour : session === '欧洲' ? londonHour : (utcHour + 8) % 24;
        var localMinute = (localHour * 60 + minute) % 1440;
        var volatilityCurve = 1, volumeCurve = 1;
        if (session === '纽约') {
          if ((nyHour === 9 && minute >= 30) || nyHour === 10 && minute < 30) factor *= 1.25;
          else if (nyHour >= 12 && nyHour < 14) factor *= 0.68;
          else if (nyHour >= 15 && nyHour < 16) factor *= 1.2;
          volatilityCurve = 0.82 + bell(localMinute, 570, 38) * 0.68 + bell(localMinute, 650, 78) * 0.2 + bell(localMinute, 950, 62) * 0.4;
          volumeCurve = 0.5 + bell(localMinute, 570, 48) * 0.95 + bell(localMinute, 615, 75) * 0.28 + bell(localMinute, 950, 72) * 0.58;
          if (localMinute >= 720 && localMinute < 840) { volatilityCurve *= 0.72; volumeCurve *= 0.58; }
        } else if (session === '欧洲') {
          if (localHour === 8) factor *= 1.3;
          volatilityCurve = 0.78 + bell(localMinute, 480, 45) * 0.72;
          volumeCurve = 0.45 + bell(localMinute, 480, 54) * 1.25;
        } else {
          if (localHour === 9) factor *= 1.18;
          volatilityCurve = 0.72 + bell(localMinute, 540, 60) * 0.42;
          volumeCurve = 0.42 + bell(localMinute, 540, 68) * 0.72;
        }
        var news = Math.abs(m - plan.eventMinute) < 8 ? plan.eventStrength : 1;
        var vol = contract.volatility * plan.volatility * factor * volatilityCurve * news;
        var direction = plan.regime === 'trend-up' ? 1 : plan.regime === 'trend-down' ? -1 : plan.regime === 'reversal' ? (m < 690 ? 1 : -1) : 0;
        var swing = [0.8, -0.24, 1.08, -0.42, 0.74, 0.12][swingIndex];
        direction *= swing;
        if (!legacyMarket) {
          activityMemory = Math.max(0.25, Math.min(3, activityMemory * 0.9 + (0.3 + rnd() * 1.4) * 0.1));
          volumeCurve *= phase.activity * activityMemory * (rnd() < 0.035 ? 1.5 + rnd() * 1.8 : 1);
        }
        var path = [], buy = [], sell = [], deltaPath = [], o = price, high = price, low = price, volume = 0, delta = 0, pv = 0;
        var flowBias = 0, campaignDrift = 0;
        if (legacyMarket) flowBias = Math.max(-0.28, Math.min(0.28, (rnd() + rnd() - 1) * 0.28 + direction * 0.025));
        else {
          flowMemory = Math.max(-0.44, Math.min(0.44, flowMemory * 0.86 + phase.flow * phaseStrength * 0.14 + (rnd() + rnd() - 1) * 0.16));
          campaignDrift = phase.price * phasePriceStrength * vol * 0.055;
        }
        for (var j = 0; j < 12; j++) {
          var noise = (rnd() + rnd() + rnd() - 1.5) * 1.7;
          var pullback = plan.regime === 'range' ? (anchor - price) * 0.0045 : (direction < 0 ? (anchor - price) * 0.00025 : 0);
          var flowImpact = legacyMarket ? 0 : flowMemory * (1 - phase.absorption) * vol * 0.22 / 12;
          var next = j === 0 ? price : Math.max(contract.tick, SIM.round(price + noise * vol / Math.sqrt(12) + direction * plan.drift * vol / 3.5 + campaignDrift / 12 + flowImpact + pullback, config.symbol));
          var pulse = 0.1 + rnd() * 2.7;
          if (news > 1) pulse *= 0.6 + rnd() * 2;
          var qty = Math.max(2, Math.round((config.symbol === 'MNQ' ? 22 : 9) * factor * volumeCurve * news * pulse));
          var pricePressure = next > price ? 0.1 : next < price ? -0.1 : 0;
          var buyQty;
          if (legacyMarket) buyQty = Math.round(qty * Math.max(0.03, Math.min(0.97, 0.5 + flowBias + pricePressure + (rnd() - 0.5) * 0.66)));
          else {
            var tapeFlow = flowMemory * 0.88 + phase.flow * phaseStrength * 0.12 + pricePressure * (1 - phase.absorption) * 0.12 + (rnd() - 0.5) * 0.58;
            buyQty = Math.round(qty * Math.max(0.04, Math.min(0.96, 0.5 + tapeFlow)));
          }
          var stepDelta = 2 * buyQty - qty;
          if (!legacyMarket && j > 0) {
            // Signed aggressive trades move price through available/replenished liquidity.
            // In absorption, that impact is muted; liquidity repricing may move against Delta.
            var signedPressure = stepDelta / Math.max(1, qty);
            var liquidityImpact = signedPressure * (1 - phase.absorption) * vol * 0.12;
            next = Math.max(contract.tick, SIM.round(price + noise * vol / Math.sqrt(12) +
              direction * plan.drift * vol / 3.5 + campaignDrift / 12 + liquidityImpact + pullback, config.symbol));
          }
          path.push(next); buy.push(buyQty); sell.push(qty - buyQty); deltaPath.push(stepDelta);
          volume += qty; delta += stepDelta; pv += next * qty;
          price = next; high = Math.max(high, next); low = Math.min(low, next);
        }
        bars.push({ t: time, o: o, h: high, l: low, c: price, v: volume, delta: delta, pv: pv, path: path, buy: buy, sell: sell, deltaPath: deltaPath, activity: volumeCurve, day: day, session: session, localMinute: localMinute, marketPhase: phaseName, phaseLabel: phase && phase.label || null });
      }
      day++;
      return true;
    }
    return { next: appendDay, progress: function () { return day; }, result: function () { return { bars: bars, dates: dates }; } };
  };
  SIM.generate = function (config) {
    var generator = SIM.createGenerator(config);
    while (generator.next()) { /* synchronous legacy path for unit consumers */ }
    return generator.result();
  };
  SIM.generateAsync = function (config, onProgress, signal) {
    var generator;
    try { generator = SIM.createGenerator(config); } catch (err) { return Promise.reject(err); }
    return new Promise(function (resolve, reject) {
      function next() {
        if (signal && signal.aborted) { reject(new Error('已停止生成，现有考核未更改。')); return; }
        try {
          if (!generator.next()) { resolve(generator.result()); return; }
          if (typeof onProgress === 'function') onProgress(generator.progress(), config.plans.length);
          setTimeout(next, 0);
        } catch (err) { reject(err); }
      }
      setTimeout(next, 0);
    });
  };
  SIM.footprint = function (bar, tick) {
    if (bar.fp) return bar.fp;
    var levels = new Map();
    bar.path.forEach(function (price, i) {
      var key = Math.round(price / tick), row = levels.get(key) || [Number((key * tick).toFixed(2)), 0, 0];
      row[1] += bar.sell[i]; row[2] += bar.buy[i]; levels.set(key, row);
    });
    bar.fp = { step: tick, bins: Array.from(levels.values()).sort(function (a, b) { return a[0] - b[0]; }) };
    return bar.fp;
  };
  SIM.detectZones = function (bars, symbol, options) {
    options = options || {};
    var tick = SIM.contracts[symbol] ? SIM.contracts[symbol].tick : 0.25;
    var start = Math.max(2, bars.length - (options.lookback || 240)), end = bars.length - 1, zones = [], fvgCount = 0, obCount = 0;
    function add(kind, index, x1, y1, y2, tone, label, rationale) {
      zones.push({ kind: 'zone', x1: x1, x2: end, y1: Math.min(y1, y2), y2: Math.max(y1, y2), tone: tone,
        label: label, hatch: kind === 'ob', concept: kind, atIndex: index, rationale: rationale });
    }
    if (options.fvg) {
      for (var i = start; i <= end && fvgCount < 18; i++) {
        var left = bars[i - 2], current = bars[i], gapUp = current.l - left.h, gapDown = left.l - current.h;
        if (gapUp >= tick && current.c > current.o) {
          var filledUp = false;
          for (var fu = i + 1; fu <= end; fu++) if (bars[fu].l <= left.h) { filledUp = true; break; }
          if (!filledUp) { add('fvg', i, i - 2, left.h, current.l, 'bull', 'FVG 多', '三根K线之间留有未回补的向上价格空档；仅作候选区域。'); fvgCount++; }
        } else if (gapDown >= tick && current.c < current.o) {
          var filledDown = false;
          for (var fd = i + 1; fd <= end; fd++) if (bars[fd].h >= left.l) { filledDown = true; break; }
          if (!filledDown) { add('fvg', i, i - 2, current.h, left.l, 'bear', 'FVG 空', '三根K线之间留有未回补的向下价格空档；仅作候选区域。'); fvgCount++; }
        }
      }
    }
    if (options.orderBlock) {
      for (var k = Math.max(start + 5, 15); k <= end && obCount < 12; k++) {
        var b = bars[k], tr = 0, trCount = 0;
        for (var ti = Math.max(1, k - 13); ti <= k - 1; ti++) {
          var prior = bars[ti - 1]; tr += Math.max(bars[ti].h - bars[ti].l, Math.abs(bars[ti].h - prior.c), Math.abs(bars[ti].l - prior.c)); trCount++;
        }
        var atr = tr / Math.max(1, trCount), body = Math.abs(b.c - b.o), swingHigh = -Infinity, swingLow = Infinity;
        for (var si = k - 5; si < k; si++) { swingHigh = Math.max(swingHigh, bars[si].h); swingLow = Math.min(swingLow, bars[si].l); }
        var bullish = b.c > b.o && b.c > swingHigh && body >= atr * 0.72;
        var bearish = b.c < b.o && b.c < swingLow && body >= atr * 0.72;
        if (!bullish && !bearish) continue;
        var origin = -1;
        for (var oi = k - 1; oi >= Math.max(0, k - 5); oi--) {
          if (bullish ? bars[oi].c < bars[oi].o : bars[oi].c > bars[oi].o) { origin = oi; break; }
        }
        if (origin < 0) continue;
        var candle = bars[origin], invalid = false;
        for (var vi = k + 1; vi <= end; vi++) if (bullish ? bars[vi].c < candle.l : bars[vi].c > candle.h) { invalid = true; break; }
        if (invalid) continue;
        add('ob', k, origin, candle.l, candle.h, bullish ? 'bull' : 'bear', bullish ? '需求 OB' : '供给 OB',
          '位移突破后最近的反向K线候选区；需要回踩和后续确认，不代表真实挂单分布。'); obCount++;
      }
    }
    return zones;
  };
  SIM.aggregate = function (bars, timeframe, symbol) {
    var minutes = Number(timeframe) || 1, result = [], mapping = [];
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i], group = result[result.length - 1];
      if (!group || group.day !== b.day || Math.floor((i % SIM.PER_DAY) / minutes) !== group.bucket) {
        group = { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: 0, delta: 0, pv: 0, day: b.day, bucket: Math.floor((i % SIM.PER_DAY) / minutes), _indices: [], deltaPath: [] }; result.push(group);
      }
      group.h = Math.max(group.h, b.h); group.l = Math.min(group.l, b.l); group.c = b.c; group.v += b.v; group.delta += b.delta; group.pv += b.pv;
      group.marketPhase = b.marketPhase || group.marketPhase; group.phaseLabel = b.phaseLabel || group.phaseLabel;
      if (Array.isArray(b.deltaPath)) group.deltaPath.push.apply(group.deltaPath, b.deltaPath);
      else group.deltaPath.push(b.delta);
      group._indices.push(i); mapping[i] = result.length - 1;
    }
    result.forEach(function (g) { g.getFootprint = function () {
      if (g.fp) return g.fp;
      var levels = new Map();
      g._indices.forEach(function (index) { SIM.footprint(bars[index], SIM.contracts[symbol].tick).bins.forEach(function (r) {
        var row = levels.get(r[0]) || [r[0], 0, 0]; row[1] += r[1]; row[2] += r[2]; levels.set(r[0], row);
      }); });
      g.fp = { step: SIM.contracts[symbol].tick, bins: Array.from(levels.values()).sort(function (a, b) { return a[0] - b[0]; }) };
      return g.fp;
    }; });
    result.slice(-100).forEach(function (g) { g.getFootprint(); });
    return { bars: result, mapping: mapping };
  };
  SIM.flowSwings = function (bars, symbol) {
    var tick = SIM.contracts[symbol].tick, highs = [], lows = [], total = 0, day = null, cvd = [];
    bars.forEach(function (bar, i) {
      if (bar.day !== day) { total = 0; day = bar.day; }
      total += bar.delta || 0; cvd[i] = total;
    });
    for (var i = Math.max(2, bars.length - 120); i < bars.length - 2; i++) {
      var b = bars[i];
      if (bars[i - 2].day !== b.day || bars[i + 2].day !== b.day) continue;
      var isHigh = b.h > bars[i - 1].h && b.h > bars[i - 2].h && b.h >= bars[i + 1].h && b.h >= bars[i + 2].h;
      var isLow = b.l < bars[i - 1].l && b.l < bars[i - 2].l && b.l <= bars[i + 1].l && b.l <= bars[i + 2].l;
      if (isHigh) highs.push({ t: b.t, price: b.h, cvd: cvd[i], day: b.day, confirmedAt: bars[i + 2].t });
      if (isLow) lows.push({ t: b.t, price: b.l, cvd: cvd[i], day: b.day, confirmedAt: bars[i + 2].t });
    }
    function compare(points, bullish) {
      var current = points[points.length - 1], previous = points[points.length - 2];
      if (!current || !previous || previous.day !== current.day || current.day !== day) return null;
      var priceDifference = current.price - previous.price, cvdDifference = current.cvd - previous.cvd;
      var candidate = bullish ? priceDifference <= -tick && cvdDifference > 0 : priceDifference >= tick && cvdDifference < 0;
      return { previous: previous, current: current, priceDifference: priceDifference, cvdDifference: cvdDifference, candidate: candidate };
    }
    return { method: 'two confirmed price pivots, two bars each side; same trading day; no future beyond snapshot',
      bearish: compare(highs, false), bullish: compare(lows, true) };
  };
  SIM.depth = function (bar, symbol, seed, count) {
    var tick = SIM.contracts[symbol].tick, rnd = LQ.data.rng((seed ^ Math.floor(bar.t / 60000)) >>> 0);
    var half = Math.floor((count || 11) / 2), levels = [], max = 1, total = 0;
    for (var j = half; j >= -half; j--) {
      var price = SIM.round(bar.c + j * tick, symbol), ask = j > 0 ? Math.round((0.4 + rnd() * 2.4) * bar.v / 5) : 0;
      var bid = j <= 0 ? Math.round((0.4 + rnd() * 2.4) * bar.v / 5) : 0;
      max = Math.max(max, bid, ask); total += bid + ask;
      levels.push({ price: price, bid: bid, ask: ask, side: j > 0 ? 'ask' : 'bid', best: j === 0 || j === 1 });
    }
    return { barIndex: 0, time: bar.t, close: bar.c, mid: bar.c, tick: tick, step: tick, decimals: symbol === 'MNQ' ? 2 : 1,
      priceDecimals: symbol === 'MNQ' ? 2 : 1, bestBid: bar.c, bestAsk: SIM.round(bar.c + tick, symbol), spread: tick, levels: levels, max: max, avg: total / levels.length };
  };
  SIM.marketPrompt = '你是训练市场情景设计器，生成纯虚构但具有期货日内特征的60个交易日（前30天历史，后30天盲测）。不得声称真实交易所数据、真实订单流或预测。返回JSON {"days":[{"day":0,"regime":"range","volatility":1,"drift":0.03,"asia":0.55,"europe":1,"newyork":1.5,"eventMinute":900,"eventStrength":2,"event":"模拟数据窗口"},...]}。day必须0到59，regime仅range/trend-up/trend-down/reversal；volatility 0.35到2.5，drift 0到0.12，asia 0.2到1.5，europe 0.4到2，newyork 0.6到3，eventMinute整数0到1379（自纽约前日18:00起的分钟偏移），eventStrength 1到4。相邻日应有持续与切换；同时包含趋势回撤、平衡震荡、反转、波动聚集和短时消息冲击。纽约开盘与收盘流动性/振幅通常比午盘高，亚洲、伦敦和纽约波动特征应有差异。真实模拟市场可能出现阶段性吸收卖压（吸筹候选）、向上位移、再吸收、吸收买压（派发候选）、向下位移和再派发；价格与Delta/CVD可以背离，不要强行让指标跟随K线。实际这些阶段、OHLC、活动量、逐笔主动买卖估算、Delta/CVD、足迹和成交分布都由平台固定种子微观结构生成，本地与AI情景共用同一生成规则；模型标签只是虚构教学假设，不能证明庄家、机构意图或真实交易所订单流。输出情景参数，不返回合成指标。输出完整60日，不要省略或附加字段。';
})(window);
