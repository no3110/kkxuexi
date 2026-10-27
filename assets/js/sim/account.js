/* Simulation ledger. Cash/equity, fills and evidence are independent of the chart UI. */
(function () {
  'use strict';
  var S = LQ.sim;
  var KEY = 'lq.sim.account.v1', ARCHIVE = 'lq.sim.archive.v1';
  S.load = function () {
    try {
      var a = JSON.parse(localStorage.getItem(KEY));
      if (!a || a.version !== S.VERSION) return null;
      if (a.config && !Number.isInteger(a.config.marketVersion)) a.config.marketVersion = 1;
      return a;
    } catch (_) { return null; }
  };
  S.save = function (a) { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (_) { return false; } };
  S.archives = function () { try { return JSON.parse(localStorage.getItem(ARCHIVE) || '[]'); } catch (_) { return []; } };
  S.removeArchive = function (id) {
    try {
      var records = S.archives().filter(function (record) { return record.id !== id; });
      if (records.length) localStorage.setItem(ARCHIVE, JSON.stringify(records));
      else localStorage.removeItem(ARCHIVE);
      return true;
    } catch (_) { return false; }
  };
  S.clearCurrent = function (id) {
    try {
      localStorage.removeItem(KEY);
      return !id || S.removeArchive(id);
    } catch (_) { return false; }
  };
  S.clearRecords = function () {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(ARCHIVE);
      return true;
    } catch (_) { return false; }
  };
  S.archive = function (a) {
    var records = S.archives().filter(function (r) { return r.id !== a.id; });
    records.unshift(JSON.parse(JSON.stringify(a)));
    localStorage.setItem(ARCHIVE, JSON.stringify(records.slice(0, 10)));
  };
  S.create = function (config) {
    if (!S.contracts[config.symbol]) throw new Error('请选择 MNQ 或 MGC');
    config = Object.assign({}, config, { marketVersion: Number.isInteger(config.marketVersion) ? config.marketVersion : 2 });
    return { version: S.VERSION, id: 'sim-' + Date.now(), config: config, cursor: S.HISTORY,
      cash: 50000, equity: 50000, peak: 50000, maxDrawdown: 0, status: 'active',
      position: null, pending: null, trades: [], drawings: [], events: [], days: [],
      indicators: { volume: true, delta: false, cvd: true, footprint: false, profile: false, ladder: false, atr: false, swings: false, vwap: false, fvg: false, orderBlock: false },
      timeframe: '5', createdAt: new Date().toISOString(), report: null };
  };
  S.pnl = function (a, price) { var p = a.position; return p ? (price - p.entry) * p.side * p.qty * S.contracts[a.config.symbol].point : 0; };
  S.measure = function (a, price) {
    a.equity = +(a.cash + S.pnl(a, price)).toFixed(2);
    a.peak = Math.max(a.peak, a.equity);
    a.maxDrawdown = +Math.max(a.maxDrawdown, a.peak - a.equity).toFixed(2);
  };
  function evidence(a, bars) {
    var start = a.cursor - a.cursor % S.PER_DAY, cvd = 0, pv = 0, volume = 0, levels = new Map();
    var cvdValues = [], atr = 0, atrCount = 0;
    for (var i = start; i <= a.cursor; i++) {
      var bar = bars[i]; cvd += bar.delta; pv += bar.pv || bar.c * bar.v; volume += bar.v;
      if (i >= a.cursor - 23) cvdValues.push([bar.t, cvd]);
      if (a.indicators.profile) S.footprint(bar, S.contracts[a.config.symbol].tick).bins.forEach(function (row) { levels.set(row[0], (levels.get(row[0]) || 0) + row[1] + row[2]); });
    }
    for (var j = Math.max(0, a.cursor - 13); j <= a.cursor; j++) {
      var b = bars[j], prev = bars[Math.max(0, j - 1)].c;
      atr += Math.max(b.h - b.l, Math.abs(b.h - prev), Math.abs(b.l - prev)); atrCount++;
    }
    var minutes = Math.max(1, Number(a.timeframe) || 1);
    var sessionOffset = a.cursor - start;
    var groupStart = start + Math.floor(sessionOffset / minutes) * minutes;
    var current = bars[a.cursor], chartBar = { t: bars[groupStart].t, o: bars[groupStart].o, h: -Infinity, l: Infinity, c: current.c, v: 0, delta: 0, pv: 0 };
    for (var k = groupStart; k <= a.cursor; k++) {
      chartBar.h = Math.max(chartBar.h, bars[k].h); chartBar.l = Math.min(chartBar.l, bars[k].l);
      chartBar.v += bars[k].v; chartBar.delta += bars[k].delta; chartBar.pv += bars[k].pv || bars[k].c * bars[k].v;
    }
    var flowWindowBars = Math.min(60, Math.max(6, minutes * 6));
    var flowStart = Math.max(start, a.cursor - flowWindowBars + 1), flowDelta = 0, flowVolume = 0;
    for (var fw = flowStart; fw <= a.cursor; fw++) { flowDelta += bars[fw].delta; flowVolume += bars[fw].v; }
    var flowPriceChange = current.c - bars[flowStart].o, flowThreshold = S.contracts[a.config.symbol].tick * 2;
    var hasPriceDirection = Math.abs(flowPriceChange) >= flowThreshold;
    var hasDeltaImbalance = Math.abs(flowDelta) >= Math.max(1, flowVolume * 0.025);
    var diverges = hasPriceDirection && hasDeltaImbalance && Math.sign(flowPriceChange) !== Math.sign(flowDelta);
    var flowRelationship = diverges ? (flowPriceChange > 0 ? 'price-up-delta-down' : 'price-down-delta-up')
      : !hasPriceDirection || !hasDeltaImbalance ? 'mixed-or-balanced' : flowPriceChange > 0 ? 'price-up-delta-up' : 'price-down-delta-down';
    var trueRanges = [], atrIndex = a.cursor, atrGroups = Math.max(28, 14 * 2);
    while (atrIndex >= 0 && trueRanges.length < atrGroups) {
      var atrDayStart = atrIndex - atrIndex % S.PER_DAY;
      var atrGroupStart = atrDayStart + Math.floor((atrIndex - atrDayStart) / minutes) * minutes;
      var atrGroupEnd = Math.min(a.cursor, atrDayStart + S.PER_DAY - 1, atrGroupStart + minutes - 1);
      var atrHigh = -Infinity, atrLow = Infinity;
      for (var q = atrGroupStart; q <= atrGroupEnd; q++) { atrHigh = Math.max(atrHigh, bars[q].h); atrLow = Math.min(atrLow, bars[q].l); }
      var priorClose = bars[Math.max(0, atrGroupStart - 1)].c;
      trueRanges.push(Math.max(atrHigh - atrLow, Math.abs(atrHigh - priorClose), Math.abs(atrLow - priorClose)));
      atrIndex = atrGroupStart - 1;
    }
    trueRanges.reverse();
    var atrTf = 0;
    if (trueRanges.length >= 14) {
      for (var ai = 0; ai < 14; ai++) atrTf += trueRanges[ai];
      atrTf /= 14;
      for (var aj = 14; aj < trueRanges.length; aj++) atrTf = (atrTf * 13 + trueRanges[aj]) / 14;
    } else atrTf = trueRanges.reduce(function (sum, value) { return sum + value; }, 0) / Math.max(1, trueRanges.length);
    var profile = null;
    if (levels.size) {
      var rows = Array.from(levels.entries()).sort(function (x, y) { return x[0] - y[0]; }), poc = 0;
      rows.forEach(function (row, k) { if (row[1] > rows[poc][1]) poc = k; });
      var lo = poc, hi = poc, sum = rows[poc][1], target = volume * 0.7;
      while (sum < target && (lo > 0 || hi < rows.length - 1)) {
        if (hi < rows.length - 1 && (lo === 0 || rows[hi + 1][1] >= rows[lo - 1][1])) { hi++; sum += rows[hi][1]; }
        else { lo--; sum += rows[lo][1]; }
      }
      profile = { scope: 'current trading day', poc: rows[poc][0], val: rows[lo][0], vah: rows[hi][0] };
    }
    var autoZones = [];
    var visibleChartBars = S.aggregate(bars.slice(Math.max(0, start - S.PER_DAY), a.cursor + 1), a.timeframe, a.config.symbol).bars;
    var swingDivergence = S.flowSwings(visibleChartBars, a.config.symbol);
    if (a.indicators.fvg || a.indicators.orderBlock) {
      var chartBars = S.aggregate(bars.slice(0, a.cursor + 1), a.timeframe, a.config.symbol).bars;
      autoZones = S.detectZones(chartBars, a.config.symbol, { fvg: a.indicators.fvg, orderBlock: a.indicators.orderBlock, lookback: 240 })
        .map(function (zone) { return { concept: zone.concept, label: zone.label, x1Time: chartBars[zone.x1] && chartBars[zone.x1].t,
          x2Time: chartBars[zone.x2] && chartBars[zone.x2].t, low: zone.y1, high: zone.y2, rationale: zone.rationale }; });
    }
    return { at: bars[a.cursor].t, cursor: a.cursor, symbol: a.config.symbol, timeframe: a.timeframe,
      indicators: Object.assign({}, a.indicators), drawings: JSON.parse(JSON.stringify(a.drawings)),
      automaticZones: autoZones,
      session: bars[a.cursor].session, orderBook: a.indicators.ladder ? S.depth(bars[a.cursor], a.config.symbol, a.config.seed, 11) : null,
      footprint: a.indicators.footprint ? bars.slice(Math.max(0, a.cursor - 5), a.cursor + 1).map(function (b) { return { t: b.t, bins: S.footprint(b, S.contracts[a.config.symbol].tick).bins }; }) : [],
      indicatorValues: { cvdScope: 'assessment day reset', sourceTimeframe: '1m', chartTimeframe: a.timeframe, cvd: cvdValues, latestCvd: cvd,
        latestDelta: chartBar.delta, latestVolume: chartBar.v, latestBar: chartBar,
        flowWindow: { bars: a.cursor - flowStart + 1, minutes: a.cursor - flowStart + 1, priceChange: flowPriceChange, delta: flowDelta,
          deltaShare: flowVolume ? flowDelta / flowVolume : 0, volume: flowVolume, cvdChange: flowDelta,
          relationship: flowRelationship, divergence: diverges },
        swingDivergence: swingDivergence,
        vwap: pv / Math.max(1, volume), atr14: atrTf, atr14Timeframe: a.timeframe, atr14Method: 'Wilder true range', atr14Simple: atr / Math.max(1, atrCount), sessionProfile: profile },
      candles: bars.slice(Math.max(0, a.cursor - 23), a.cursor + 1).map(function (b) { return [b.t, b.o, b.h, b.l, b.c, b.v, b.delta]; }) };
  }
  function brackets(a, order, entry) {
    return { stop: S.round(entry - order.side * order.stopDistance, a.config.symbol), target: S.round(entry + order.side * order.targetDistance, a.config.symbol) };
  }
  function enter(a, bars, order, price) {
    var c = S.contracts[a.config.symbol], entry = S.round(price + order.side * c.tick, a.config.symbol);
    if (order.type === 'limit') entry = order.side === 1 ? Math.min(entry, order.price) : Math.max(entry, order.price);
    var levels = brackets(a, order, entry);
    a.cash = +(a.cash - c.fee * order.qty).toFixed(2);
    var fillEvidence = evidence(a, bars);
    a.position = { id: 'trade-' + (a.trades.length + 1), side: order.side, qty: order.qty, entry: entry,
      stop: levels.stop, target: levels.target, initialStop: levels.stop, initialTarget: levels.target,
      initialRisk: +(Math.abs(entry - levels.stop) * order.qty * c.point + 2 * c.fee * order.qty).toFixed(2),
      strategy: order.strategy, entryIndex: a.cursor, entryTime: bars[a.cursor].t,
      evidence: order.type === 'market' ? fillEvidence : order.evidence, fillEvidence: fillEvidence,
      entryFee: +(c.fee * order.qty).toFixed(2), adjustments: [], mae: 0, mfe: 0, orderType: order.type,
      referencePrice: bars[a.cursor].c, submittedPrice: order.type === 'market' ? null : order.price,
      requestedStopDistance: order.stopDistance, requestedTargetDistance: order.targetDistance,
      initialStopPrice: levels.stop, initialTargetPrice: levels.target,
      timeframe: a.timeframe, orderSource: order.source || 'ticket', orderPlacedIndex: order.placedIndex, orderEvidence: order.evidence };
    a.pending = null;
    S.measure(a, price);
  }
  S.place = function (a, bars, values) {
    if (a.status !== 'active') throw new Error('本次考核已结束，请查看复盘或新建考核。');
    if (a.position || a.pending) throw new Error('请先平仓或撤销挂单。');
    if (a.trades.length >= 500) throw new Error('本次考核最多记录500笔交易，请完成复盘后开始新的考核。');
    var c = S.contracts[a.config.symbol], qty = Number(values.qty), stop = Number(values.stopDistance), target = Number(values.targetDistance);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20 || ![1, -1].includes(values.side)) throw new Error('手数需为1至20的整数。');
    if (!Number.isFinite(stop) || !Number.isFinite(target) || stop < c.tick || target < c.tick) throw new Error('止损和止盈距离至少为一个最小跳动。');
    var price = Number(values.price), type = values.type || 'market', now = bars[a.cursor].c;
    if (!['market', 'limit', 'stop'].includes(type)) throw new Error('不支持的委托类型');
    if (type !== 'market' && (!Number.isFinite(price) || price <= 0 || Math.abs(S.round(price, a.config.symbol) - price) > 0.00001)) throw new Error('挂单价格需符合最小跳动。');
    if (type === 'limit' && (values.side === 1 ? price >= now : price <= now)) throw new Error('买入限价应低于现价，卖出限价应高于现价。');
    if (type === 'stop' && (values.side === 1 ? price <= now : price >= now)) throw new Error('买入突破价应高于现价，卖出突破价应低于现价。');
    if (stop * qty * c.point + qty * (2 * c.fee + 2 * c.tick * c.point) >= a.equity - 48000) throw new Error('本笔计划风险已超过剩余亏损额度，请减少手数或止损距离。');
    var order = { side: values.side, qty: qty, stopDistance: S.round(stop, a.config.symbol), targetDistance: S.round(target, a.config.symbol),
      strategy: String(values.strategy || '').slice(0, 80), source: values.source || 'ticket',
      type: type, price: price, placedIndex: a.cursor, evidence: evidence(a, bars) };
    if (type === 'market') enter(a, bars, order, now);
    else a.pending = order;
    return order;
  };
  S.close = function (a, bars, price, reason, options) {
    if (!a.position) return;
    options = options || {};
    var p = a.position, c = S.contracts[a.config.symbol];
    var exit = S.round(price - (options.limit ? 0 : p.side * c.tick), a.config.symbol);
    var gross = +((exit - p.entry) * p.side * p.qty * c.point).toFixed(2), fee = +(c.fee * p.qty).toFixed(2);
    a.cash = +(a.cash + gross - fee).toFixed(2);
    var trade = Object.assign({}, p, { exit: exit, exitTime: bars[a.cursor].t, exitIndex: a.cursor, exitEvidence: evidence(a, bars),
      reason: reason || '手动平仓', gross: gross, fees: +(p.entryFee + fee).toFixed(2), net: +(gross - p.entryFee - fee).toFixed(2),
      r: p.initialRisk ? +((gross - p.entryFee - fee) / p.initialRisk).toFixed(2) : 0,
      exitCandles: bars.slice(Math.max(0, a.cursor - 5), a.cursor + 1).map(function (b) { return [b.t, b.o, b.h, b.l, b.c, b.v, b.delta]; }) });
    a.trades.push(trade); a.position = null; a.report = null;
    S.measure(a, exit);
    check(a, bars, price);
    return trade;
  };
  function check(a, bars, price) {
    if (a.status !== 'active') return;
    S.measure(a, price);
    var reserve = a.position ? S.contracts[a.config.symbol].fee * a.position.qty + S.contracts[a.config.symbol].tick * S.contracts[a.config.symbol].point * a.position.qty : 0;
    if (a.equity - reserve <= 48000) {
      a.status = 'failed'; a.pending = null;
      S.close(a, bars, price, '触及固定亏损底线');
      a.endedAt = bars[a.cursor].t;
    } else if (a.equity - reserve >= 53000) {
      a.status = 'passed'; a.pending = null;
      S.close(a, bars, price, '达到盈利目标');
      a.endedAt = bars[a.cursor].t;
    }
  }
  S.amend = function (a, bars, field, price) {
    if (!a.position || a.status !== 'active') throw new Error('目前没有可调整的持仓。');
    if (!['stop', 'target'].includes(field) || !Number.isFinite(price)) throw new Error('无效的止损止盈价格');
    var p = a.position, rounded = S.round(price, a.config.symbol), now = bars[a.cursor].c;
    if (field === 'stop' && (p.side === 1 ? rounded >= now : rounded <= now)) throw new Error('止损需放在当前价格的亏损方向一侧。');
    if (field === 'target' && (p.side === 1 ? rounded <= now : rounded >= now)) throw new Error('止盈需放在当前价格的盈利方向一侧。');
    p.adjustments.push({ field: field, from: p[field], to: rounded, at: bars[a.cursor].t, cursor: a.cursor, widened: field === 'stop' && (p.side === 1 ? rounded < p.stop : rounded > p.stop) });
    p[field] = rounded;
  };
  S.advance = function (a, bars, count) {
    if (a.status !== 'active') return 0;
    var advanced = 0;
    while (advanced < count && a.cursor < bars.length - 1 && a.status === 'active') {
      a.cursor++; advanced++;
      var b = bars[a.cursor], prev = bars[a.cursor - 1];
      if (prev.day !== b.day) {
        a.days.push({ day: prev.day - 29, equity: a.equity, cash: a.cash, trades: a.trades.length });
      }
      var path = [b.o].concat(b.path);
      for (var j = 0; j < path.length && a.status === 'active'; j++) {
        var price = path[j], p = a.position, pending = a.pending;
        if (pending) {
          var crossed = pending.type === 'limit' ? (pending.side === 1 ? price <= pending.price : price >= pending.price) : (pending.side === 1 ? price >= pending.price : price <= pending.price);
          if (crossed) { enter(a, bars, pending, price); p = a.position; }
        }
        if (p) {
          var unrealized = S.pnl(a, price); p.mae = Math.min(p.mae, unrealized); p.mfe = Math.max(p.mfe, unrealized);
          // Account limits are checked before bracket fills; a gap can exceed the loss floor.
          check(a, bars, price);
          if (a.position && a.status === 'active') {
            if (p.side === 1 ? price <= p.stop : price >= p.stop) S.close(a, bars, price, '止损成交');
            else if (p.side === 1 ? price >= p.target : price <= p.target) S.close(a, bars, p.target, '止盈成交', { limit: true });
          }
        }
        check(a, bars, price);
      }
    }
    if (a.cursor === bars.length - 1 && a.status === 'active') {
      S.close(a, bars, bars[a.cursor].c, '第30日到期平仓');
      a.pending = null;
      if (a.status === 'active') a.status = 'expired';
      a.endedAt = bars[a.cursor].t;
      a.days.push({ day: 30, equity: a.equity, cash: a.cash, trades: a.trades.length });
    }
    return advanced;
  };
  S.stats = function (a) {
    var trades = a.trades, wins = trades.filter(function (t) { return t.net > 0; }), losses = trades.filter(function (t) { return t.net < 0; });
    var profit = wins.reduce(function (n, t) { return n + t.net; }, 0), loss = -losses.reduce(function (n, t) { return n + t.net; }, 0);
    return { count: trades.length, wins: wins.length, losses: losses.length,
      winRate: trades.length ? +(wins.length / trades.length * 100).toFixed(1) : 0,
      net: +(a.cash - 50000).toFixed(2), floating: +(a.equity - a.cash).toFixed(2), drawdown: a.maxDrawdown,
      fees: +(trades.reduce(function (n, t) { return n + t.fees; }, 0) + (a.position ? a.position.entryFee : 0)).toFixed(2),
      profitFactor: loss ? +(profit / loss).toFixed(2) : profit ? null : 0,
      expectancy: trades.length ? +((a.cash - 50000 + (a.position ? a.position.entryFee : 0)) / trades.length).toFixed(2) : 0 };
  };
  S.localReport = function (a) {
    var trades = a.trades, n = trades.length;
    if (!n) throw new Error('至少完成一笔交易后再复盘。');
    var safe = trades.filter(function (t) { return t.initialRisk <= 250; }).length / n;
    var widening = trades.filter(function (t) { return t.adjustments.some(function (x) { return x.widened; }); }).length / n;
    var evidenceCount = trades.filter(function (t) { return (t.fillEvidence || t.evidence).drawings.some(function (d) { return d.concept !== 'stop' && d.concept !== 'target'; }); }).length / n;
    var planned = trades.filter(function (t) { return Math.abs(t.initialTarget - t.entry) / Math.abs(t.entry - t.initialStop) >= 1.5; }).length / n;
    var dimensions = { risk: Math.round(35 * safe * (1 - widening * 0.6)), plan: Math.round(20 * planned), evidence: Math.round(20 * evidenceCount), execution: Math.round(25 * (1 - Math.min(1, a.maxDrawdown / 2000))) };
    var weaknesses = [];
    if (safe < 1 || widening) weaknesses.push({ lessonId: 'm06-03', reason: '有单笔计划风险超过250美元，或持仓后放宽止损的记录。' });
    if (evidenceCount < 1) weaknesses.push({ lessonId: 'm04-06', reason: '部分入场前缺少知识点标注证据。标注存在只代表已记录，正确性需要逐图复核。' });
    if (planned < 1) weaknesses.push({ lessonId: 'm07-02', reason: '部分入场的计划盈亏比低于1.5。' });
    return { source: 'local', score: Object.values(dimensions).reduce(function (n, x) { return n + x; }, 0), dimensions: dimensions,
      summary: '本地规则评分基于仓位风险、止损调整、标注记录、计划盈亏比和回撤。它不能证明形态判断正确，也不替代AI逐笔评估。', weaknesses: weaknesses, trades: [], at: new Date().toISOString() };
  };
  S.reviewPayload = function (a) {
    return { rules: { initial: 50000, lossFloor: 48000, profitTarget: 53000, days: 30, lossType: 'fixed equity floor including unrealized pnl and fees' },
      symbol: a.config.symbol, source: a.config.source, stats: S.stats(a), status: a.status,
      annotations: a.drawings, events: a.events, trades: a.trades, currentPosition: a.position,
      courseLessons: LQ.site.lessons().map(function (l) { return { id: l.id, title: l.title }; }) };
  };
  S.validateReport = function (raw, a) {
    var caps = { risk: 35, plan: 20, evidence: 20, execution: 25 };
    if (!raw || typeof raw.summary !== 'string' || !raw.dimensions || !Array.isArray(raw.weaknesses) || !Array.isArray(raw.trades)) throw new Error('AI评估格式不完整，请重试。');
    var dimensions = {}, validIds = a.trades.map(function (t) { return t.id; });
    Object.keys(caps).forEach(function (key) { var v = raw.dimensions[key]; if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > caps[key]) throw new Error('AI评分维度无效：' + key); dimensions[key] = Math.round(v); });
    var reviews = raw.trades.map(function (t) { if (!t || !validIds.includes(t.id) || typeof t.feedback !== 'string' || !Number.isFinite(t.score) || t.score < 0 || t.score > 100) throw new Error('AI逐笔评估包含无效交易'); return { id: t.id, score: Math.round(t.score), feedback: t.feedback.slice(0, 3000) }; });
    if (new Set(reviews.map(function (r) { return r.id; })).size !== a.trades.length || reviews.length !== a.trades.length) throw new Error('AI未完成全部交易的逐笔评估，请重试。');
    return { source: 'ai', model: LQ.ai.settings().model, score: Object.values(dimensions).reduce(function (n, x) { return n + x; }, 0), dimensions: dimensions,
      summary: raw.summary.slice(0, 6000), weaknesses: raw.weaknesses.filter(function (w) { return w && LQ.site.lesson(w.lessonId) && typeof w.reason === 'string'; }).map(function (w) { return { lessonId: w.lessonId, reason: w.reason.slice(0, 2000) }; }),
      trades: reviews, at: new Date().toISOString() };
  };
  S.reviewPrompt = '你是中文订单流学习教练。仅评估提供的虚构模拟交易与入场时可见数据，不泄露或假设未来，不给实盘建议。按风险35/交易计划20/标注证据20/执行25打分，收益不能代替过程。先独立判断每笔入场时属于趋势、区间震荡或反转环境，再说明做多/做空方向、买卖区域和趋势/结构是否一致；不要把可选的strategy备注当作已验证事实，strategy为空时自行从入场前K线、Delta、CVD、ATR、VWAP、成交区与图上知识点推断。必须把价格变化和订单流分开判断：Delta是所选窗口主动买量减主动卖量，CVD是Delta的累计；CVD柱颜色只表示该柱Delta增减，不代表价格涨跌，也不代表累计CVD在零轴上方。上涨但Delta/CVD走弱、下跌但Delta/CVD走强可能是吸收/背离候选；结合成交量、价格进展、位置与后续确认，不要仅凭一项指标断言庄家吸筹或派发。indicatorValues.flowWindow只汇总入场前可见窗口内的价格变化、Delta与成交量，divergence只代表窗口方向相反的候选，不等同于摆动高低点背离。indicatorValues.swingDivergence提供同一交易日内两侧各两根K线确认的价格摆动点及其当时CVD，bullish/bearish.candidate也只是候选；不能把候选直接判为交易信号，需核对点位、足迹和后续已发生确认；不能使用或猜测生成器隐藏阶段、未来路径与真实主体意图。核对委托参考价、实际成交价、止损止盈、手续费、滑点、回撤、止损放宽。drawings有固定concept、价格和时间；candles是[t,o,h,l,c,v,delta]；latestBar是所选周期的已完成K线，indicatorValues含入场时Delta、CVD、ATR、VWAP与flowWindow。挂单同时有orderEvidence（委托提交时）与fillEvidence（实际成交时），评价成交决策时优先使用fillEvidence，并比较下单时依据是否仍有效。exitEvidence是退出当刻可见数据，只用于复盘退出动作，不可反推入场决策。不得把只有标注就当正确，证据不足直说。返回JSON {"dimensions":{"risk":0,"plan":0,"evidence":0,"execution":0},"summary":"通俗讲解", "weaknesses":[{"lessonId":"仅可使用提供的课程id","reason":"缺失知识点与具体改进"}],"trades":[{"id":"每一笔交易id，全部逐笔且不重复","score":0,"feedback":"结合市场状态、方向、区域、实际点位和标注讲解理由"}]}。所有数值有效、各维度不得超过上限。交易成绩通关由账户规则决定，AI分数只做学习评估。';
})();
