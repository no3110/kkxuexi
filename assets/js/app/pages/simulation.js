/* Trading lab: persisted 30-day assessment, semantic drawings and evidence-based review. */
(function () {
  'use strict';
  var S = LQ.sim, esc = LQ.util.escapeHtml, activeDestroy = null;
  var presets = [
    { id: 'support', tool: 'hline', label: '支撑', tone: 'bull', lesson: 'm00-04', reason: '历史低点附近出现承接；跌破并接受更低价格时失效。' },
    { id: 'resistance', tool: 'hline', label: '阻力', tone: 'bear', lesson: 'm00-04', reason: '历史高点附近出现抛压；突破并接受更高价格时失效。' },
    { id: 'trend-bull', tool: 'trend', label: '多头趋势线', tone: 'bull', lesson: 'm01-04', reason: '连接依次抬高的低点，观察HH/HL结构。' },
    { id: 'trend-bear', tool: 'trend', label: '空头趋势线', tone: 'bear', lesson: 'm01-04', reason: '连接依次降低的高点，观察LH/LL结构。' },
    { id: 'bos-bull', tool: 'hline', label: '多头 BOS', tone: 'bull', lesson: 'm03-01', reason: '上涨背景下收盘突破前高，结构延续的候选证据。' },
    { id: 'bos-bear', tool: 'hline', label: '空头 BOS', tone: 'bear', lesson: 'm03-01', reason: '下跌背景下收盘跌破前低，结构延续的候选证据。' },
    { id: 'choch-bull', tool: 'hline', label: '多头 CHoCH', tone: 'bull', lesson: 'm03-01', reason: '下跌背景下突破最近保护性高点，观察结构转变。' },
    { id: 'choch-bear', tool: 'hline', label: '空头 CHoCH', tone: 'bear', lesson: 'm03-01', reason: '上涨背景下跌破最近保护性低点，观察结构转变。' },
    { id: 'ob-bull', tool: 'zone', label: '需求区 / 多头 OB', tone: 'bull', lesson: 'm03-04', reason: '向上位移前的候选订单块，需要结构突破与回踩证据。' },
    { id: 'ob-bear', tool: 'zone', label: '供给区 / 空头 OB', tone: 'bear', lesson: 'm03-04', reason: '向下位移前的候选订单块，需要结构突破与回踩证据。' },
    { id: 'fvg-bull', tool: 'zone', label: '多头 FVG', tone: 'bull', lesson: 'm03-04', reason: '三根K线中第一根高点低于第三根低点的未重叠区。' },
    { id: 'fvg-bear', tool: 'zone', label: '空头 FVG', tone: 'bear', lesson: 'm03-04', reason: '三根K线中第一根低点高于第三根高点的未重叠区。' },
    { id: 'sweep-low', tool: 'marker', label: '扫低后收回', tone: 'bull', lesson: 'm03-03', reason: '价格跌穿前低后收回，观察卖方流动性扫荡。' },
    { id: 'sweep-high', tool: 'marker', label: '扫高后收回', tone: 'bear', lesson: 'm03-03', reason: '价格越过前高后收回，观察买方流动性扫荡。' },
    { id: 'pin-bull', tool: 'marker', label: '异常 K · 长下影', tone: 'bull', lesson: 'm02-02', reason: '下影明显长于实体，结合支撑位置观察拒绝。' },
    { id: 'pin-bear', tool: 'marker', label: '异常 K · 长上影', tone: 'bear', lesson: 'm02-02', reason: '上影明显长于实体，结合阻力位置观察拒绝。' },
    { id: 'absorption', tool: 'marker', label: '吸收候选', tone: 'warn', lesson: 'm04-04', reason: '主动成交量较大但价格进展有限，需要后续确认。' },
    { id: 'cvd-divergence', tool: 'marker', label: 'CVD 背离候选', tone: 'warn', lesson: 'm04-03', reason: '价格创新高/低时，累计Delta未同步确认。' },
    { id: 'spring', tool: 'marker', label: 'Spring / 测试', tone: 'bull', lesson: 'm05-03', reason: '区间下沿跌破收回，结合测试量能判断。' },
    { id: 'upthrust', tool: 'marker', label: 'Upthrust', tone: 'bear', lesson: 'm05-04', reason: '区间上沿向上试探后失败，结合量价判断。' },
    { id: 'profile', tool: 'vprofile', label: '成交分布 / 价值区', tone: 'info', lesson: 'm08-03', reason: '指定已发生区间的成交量分布，观察POC与70%价值区。' },
    { id: 'fib', tool: 'fib', label: '溢价折价 / OTE', tone: 'info', lesson: 'm03-05', reason: '连接一段摆动，观察均衡位与回撤区，不把比例当成必然反转。' },
    { id: 'stop', tool: 'hline', label: '调整止损线', tone: 'bear', lesson: 'm06-02', reason: '按当前持仓方向设置止损，所有修改都会记入日志。' },
    { id: 'target', tool: 'hline', label: '调整止盈线', tone: 'bull', lesson: 'm07-02', reason: '按当前持仓方向设置目标，修改保留记录。' }
  ];
  function money(value) { return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function signed(value) { return (value > 0 ? '+' : '') + money(value); }
  function time(t, zone) { return new Intl.DateTimeFormat('zh-CN', { timeZone: zone || 'America/New_York', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(t)); }
  function status(a) { return { active: '考核进行中', passed: '盈利目标达成 · 通关', failed: '触及亏损底线 · 失败', expired: '30日结束 · 未达标', ended: '已结束 · 自主复盘' }[a.status] || a.status; }
  function download(a) {
    var url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'orderflow-simulation-v1', account: a }, null, 2)], { type: 'application/json' }));
    var link = document.createElement('a'); link.href = url; link.download = a.id + '-' + a.config.symbol + '.json'; link.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  LQ.pages.simulation = {
    title: '模拟实战 · 30日考核',
    render: function () {
      var page = document.createElement('div'); page.className = 'page simulation-page';
      var a = S.load(), market = null, engine = null, aggregation = null, replayFrame = null, playing = false;
      var destroyed = false, busy = false, controller = null, inspecting = false, followLatest = true, selected = null, persistWarning = false;
      var lastScaleFollowedPrice = null;
      var forming = null, replayLast = 0, replayBudget = 0;
      var generationOverlay = null, generatingMarket = false;
      function toast(message) { LQ.ui.toast(message); }
      function generationStatus(message) {
        var statusNode = generationOverlay && generationOverlay.querySelector('[data-generation-status]');
        if (statusNode) statusNode.textContent = message;
      }
      function stopGeneration() {
        if (!controller || !generatingMarket) return;
        generationStatus('正在停止并丢弃本次生成…');
        var stopButton = generationOverlay && generationOverlay.querySelector('[data-sim-generation-stop]');
        if (stopButton) stopButton.disabled = true;
        controller.abort();
      }
      function generationClickGuard(event) {
        if (!generatingMarket) return;
        if (event.target.closest && event.target.closest('[data-sim-generation-stop]')) return;
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      }
      function generationKeyGuard(event) {
        if (!generatingMarket) return;
        if (event.key === 'Escape') { event.preventDefault(); stopGeneration(); return; }
        if (event.key === 'Tab') {
          event.preventDefault();
          if (generationOverlay) generationOverlay.querySelector('[data-sim-generation-stop]').focus();
          return;
        }
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      }
      function generationBeforeUnload(event) {
        if (!generatingMarket) return;
        event.preventDefault(); event.returnValue = '';
      }
      function startGenerationLock() {
        generatingMarket = true;
        generationOverlay = document.createElement('div');
        generationOverlay.className = 'sim-generation-overlay';
        generationOverlay.setAttribute('role', 'alertdialog');
        generationOverlay.setAttribute('aria-modal', 'true');
        generationOverlay.setAttribute('aria-labelledby', 'sim-generation-title');
        generationOverlay.innerHTML = '<div class="sim-generation-dialog"><span class="sim-generation-spinner" aria-hidden="true"></span><h2 id="sim-generation-title">正在生成模拟市场</h2><p data-generation-status aria-live="polite">AI 正在设计前30日历史与后30日考核情景，请保持此页面打开。</p><small>平台会校验60个交易日的波动率、时段参数及消息事件；通过后再逐日构建K线与订单流。停止前不会替换当前考核。</small><button type="button" class="btn btn-ghost" data-sim-generation-stop>停止生成</button></div>';
        document.body.appendChild(generationOverlay);
        document.body.classList.add('sim-generating');
        generationOverlay.querySelector('[data-sim-generation-stop]').addEventListener('click', stopGeneration);
        generationOverlay.querySelector('[data-sim-generation-stop]').focus();
        document.addEventListener('click', generationClickGuard, true);
        document.addEventListener('keydown', generationKeyGuard, true);
        window.addEventListener('beforeunload', generationBeforeUnload);
      }
      function endGenerationLock() {
        generatingMarket = false;
        document.removeEventListener('click', generationClickGuard, true);
        document.removeEventListener('keydown', generationKeyGuard, true);
        window.removeEventListener('beforeunload', generationBeforeUnload);
        document.body.classList.remove('sim-generating');
        if (generationOverlay && generationOverlay.parentNode) generationOverlay.parentNode.removeChild(generationOverlay);
        generationOverlay = null;
      }
      function save() {
        if (a && !S.save(a) && !persistWarning) { persistWarning = true; toast('浏览器存储空间不足，请导出考核记录，避免刷新后丢失。'); }
        if (a && a.status !== 'active') { try { S.archive(a); } catch (_) {} }
      }
      function pause() {
        playing = false; replayLast = 0;
        if (replayFrame !== null) clearTimeout(replayFrame);
        replayFrame = null;
        var b = page.querySelector('[data-sim-play]'); if (b) b.textContent = '▶ 播放行情';
      }
      function disposeChart() { if (engine) { engine.destroy(); engine = null; } }
      function dateToday() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
      function setupHTML() {
        return '<section class="sim-intro"><div><div class="sim-eyebrow"><span class="sim-dot"></span> THE EXECUTION LAB / 模拟训练</div><h1>把学到的知识，<br><em>放进市场里验证。</em></h1><p>从标记第一条支撑线，到执行完整的交易计划。用30个模拟交易日，看看你的判断经不经得起波动。</p>' +
          '<div class="sim-intro-rules"><div><b>$50,000</b><span>模拟账户</span></div><div><b>−$2,000</b><span>固定亏损额度</span></div><div><b>+$3,000</b><span>通关目标</span></div></div>' +
          '<div class="sim-intro-note">先读图 → 标记依据 → 设置风险 → 模拟执行 → 复盘补课</div></div><div class="sim-setup-card"><span class="sim-eyebrow">开始一场新的训练</span><h2>选择你的考核市场</h2><div class="sim-contracts">' +
          '<label><input type="radio" name="sim-symbol" value="MNQ" checked><span><b>MNQ</b><small>微型纳指</small><em>$0.50 / 跳 · $2 / 点</em></span></label>' +
          '<label><input type="radio" name="sim-symbol" value="MGC"><span><b>MGC</b><small>微型黄金</small><em>$1.00 / 跳 · $10 / 点</em></span></label></div>' +
          '<label class="sim-field">第一个考核交易日<input type="date" data-sim-start-date value="' + dateToday() + '"></label><p class="text-xs muted">系统同时准备前30个交易日供分析。遇周末顺延；按常规周交易，未建模交易所节假日与提前收市。</p>' +
          '<button type="button" class="btn btn-primary" data-sim-create="ai">✦ AI 生成市场并开始</button><button type="button" class="btn btn-outline" data-sim-create="local">使用本地模拟开始</button><button type="button" class="btn btn-ghost" data-sim-cancel hidden>取消生成</button>' +
          (a ? '<button type="button" class="btn btn-ghost" data-sim-resume>返回当前考核</button>' : '') +
          '<p class="text-xs muted">AI设计60日市场环境，固定种子模拟器生成一致的K线与订单流。生成行情属于虚构训练数据。</p><div role="status" data-sim-setup-status></div></div></section>' +
          '<div class="sim-features"><div><b>01 / 贴近盘段的波动</b><p>纽约时间18:00至次日17:00，含每日休市、周末及夏令时；亚洲、欧洲、纽约时段采用不同流动性。</p></div><div><b>02 / 有依据的标注</b><p>趋势、流动性、订单块、FVG、异常K线与风控线均有固定名称和知识点，不用手写交易理由。</p></div><div><b>03 / 可追溯的复盘</b><p>入场前的K线、指标与标注一并保存，回看胜率、手续费、回撤，以及哪些知识还没掌握。</p></div></div>' +
          '<section class="panel"><div class="sim-archives-head"><h2>最近的考核</h2><button type="button" class="btn btn-sm btn-ghost" data-sim-clear-all>清除全部模拟记录</button></div><div data-sim-archives>' + archivesHTML() + '</div></section>';
      }
      function archivesHTML() {
        var list = S.archives();
        return list.length ? list.map(function (record, i) { return '<div class="sim-archive-row"><span>' + esc(record.config.symbol) + ' · ' + esc(status(record)) + ' · ' + signed(record.cash - 50000) + ' · ' + record.trades.length + ' 笔</span><div class="sim-archive-actions"><button type="button" class="btn btn-sm btn-outline" data-sim-archive="' + i + '">导出完整记录</button><button type="button" class="btn btn-sm btn-ghost" data-sim-delete-archive="' + esc(record.id) + '">删除</button></div></div>'; }).join('') : '<p class="muted text-sm">结束的考核会保存在此浏览器。最近保留10场，也可随时导出完整记录。</p>';
      }
      function setup() { pause(); discardForming(); disposeChart(); page.innerHTML = setupHTML(); }
      function current() { return market.bars[a.cursor]; }
      function ensureMarket() { market = S.generate(a.config); }
      function previewFor(index, step) {
        var source = market.bars[index], progress = Math.max(0, Math.min(source.path.length, step));
        var complete = Math.floor(progress), fraction = progress - complete, high = source.o, low = source.o, volume = 0, delta = 0, pv = 0;
        for (var i = 0; i < complete; i++) {
          var completedPrice = source.path[Math.min(i + 1, source.path.length - 1)];
          high = Math.max(high, completedPrice); low = Math.min(low, completedPrice);
          var qty = source.buy[i] + source.sell[i]; volume += qty; delta += source.deltaPath[i]; pv += source.path[i] * qty;
        }
        var close = complete >= source.path.length ? source.path[source.path.length - 1]
          : source.path[Math.min(complete, source.path.length - 1)] +
            (source.path[Math.min(complete + 1, source.path.length - 1)] - source.path[Math.min(complete, source.path.length - 1)]) * fraction;
        var partialIndex = Math.min(source.path.length - 1, complete);
        if (fraction > 0 && complete < source.path.length) {
          high = Math.max(high, close); low = Math.min(low, close);
          var partialQty = (source.buy[partialIndex] + source.sell[partialIndex]) * fraction;
          volume += partialQty; delta += source.deltaPath[partialIndex] * fraction; pv += close * partialQty;
        }
        var minutes = Number(a.timeframe) || 1, bucket = Math.floor((index % S.PER_DAY) / minutes);
        var last = aggregation && aggregation.bars[aggregation.bars.length - 1];
        var base = last && last.day === source.day && last.bucket === bucket ? last : null;
        var partialDeltaPath = source.deltaPath.slice(0, complete);
        if (fraction > 0 && complete < source.deltaPath.length) partialDeltaPath.push(source.deltaPath[complete] * fraction);
        var previewDeltaPath = (base && Array.isArray(base.deltaPath) ? base.deltaPath : []).concat(partialDeltaPath);
        return { t: base ? base.t : source.t, o: base ? base.o : source.o,
          h: Math.max(high, base ? base.h : -Infinity), l: Math.min(low, base ? base.l : Infinity), c: close,
          v: volume + (base ? base.v : 0), delta: delta + (base ? base.delta : 0),
          pv: pv + (base ? base.pv : 0), step: step, day: source.day,
          barIndex: base ? aggregation.bars.length - 1 : aggregation.bars.length,
          deltaPath: previewDeltaPath,
          progressPct: Math.floor(progress / source.path.length * 100) };
      }
      function renderForming() {
        if (!forming || !engine) return;
        forming.preview = previewFor(forming.index, forming.step);
        if (followLatest && engine.priceScaleOverride) {
          var anchor = Number.isFinite(lastScaleFollowedPrice) ? lastScaleFollowedPrice : market.bars[forming.index].o;
          var priceShift = forming.preview.c - anchor;
          engine.priceScaleOverride.min += priceShift; engine.priceScaleOverride.max += priceShift;
        }
        if (followLatest) lastScaleFollowedPrice = forming.preview.c;
        engine.setReplayPreview(forming.preview);
        var source = market.bars[forming.index], clockNode = page.querySelector('[data-sim-clock]'), priceNode = page.querySelector('[data-sim-price]');
        var progress = page.querySelector('[data-sim-forming]');
        if (clockNode) clockNode.textContent = time(source.t + 60000) + ' 纽约 · K线形成';
        var beijingNode = page.querySelector('[data-sim-beijing]');
        if (beijingNode) beijingNode.textContent = time(source.t + 60000, 'Asia/Shanghai') + ' 北京';
        if (priceNode) priceNode.textContent = forming.preview.c.toFixed(2);
        if (progress) progress.textContent = forming.preview.progressPct + '%';
      }
      function discardForming() {
        forming = null; replayBudget = 0;
        if (engine && engine.setReplayPreview) engine.setReplayPreview(null);
        var progress = page.querySelector('[data-sim-forming]'); if (progress) progress.textContent = '';
      }
      async function create(source) {
        if (busy) return;
        if (source === 'ai' && !LQ.ai.settings().apiKey) { LQ.ai.revealSettings(); toast('先在页面底部保存AI密钥；也可以选择本地模拟。'); return; }
        var symbol = page.querySelector('[name="sim-symbol"]:checked').value, date = page.querySelector('[data-sim-start-date]').value;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast('请选择考核开始日期'); return; }
        busy = true; controller = new AbortController();
        page.querySelector('[data-sim-cancel]').hidden = false;
        page.querySelectorAll('[data-sim-create]').forEach(function (b) { b.disabled = true; });
        var message = page.querySelector('[data-sim-setup-status]');
        var config = { symbol: symbol, start: date, seed: crypto.getRandomValues(new Uint32Array(1))[0], source: source, model: source === 'ai' ? LQ.ai.settings().model : null };
        if (source === 'ai') startGenerationLock();
        try {
          message.textContent = source === 'ai' ? '正在生成60日环境，请稍候…（最长3分钟）' : '正在准备60日模拟成交数据…';
          config.plans = source === 'ai' ? S.validatePlans(await LQ.ai.request(S.marketPrompt, { symbol: symbol, dates: S.dates(date), seed: config.seed }, controller.signal)) : S.localPlans(config.seed);
          if (destroyed) return;
          if (source === 'ai') generationStatus('已验证60日参数，正在按日期逐步生成市场数据…');
          var nextMarket = await S.generateAsync(config, function (completed, total) {
            var status = '正在构建市场数据：第' + completed + ' / ' + total + '个交易日';
            message.textContent = status;
            if (source === 'ai') generationStatus(status + '（纽约、伦敦、亚洲时段及逐笔订单流）');
          }, controller.signal);
          if (destroyed || controller.signal.aborted) return;
          var nextAccount = S.create(config);
          if (a) S.archive(a);
          a = nextAccount; market = nextMarket; save(); busy = false; workbench();
        } catch (err) {
          if (!destroyed && message.isConnected) message.textContent = controller && controller.signal.aborted ? '已停止生成，原考核保持不变。' : err.message;
        } finally {
          endGenerationLock(); busy = false;
          if (!destroyed) { page.querySelectorAll('[data-sim-create]').forEach(function (b) { b.disabled = false; }); var cancel = page.querySelector('[data-sim-cancel]'); if (cancel) cancel.hidden = true; }
        }
      }
      function workbench() {
        pause(); discardForming(); disposeChart(); inspecting = false; followLatest = true;
        if (!market) ensureMarket();
        var c = S.contracts[a.config.symbol];
        page.innerHTML = '<header class="sim-head"><div><div class="sim-eyebrow"><span class="sim-dot"></span> EXECUTION LAB / 30日模拟考核</div><h1>' + a.config.symbol + ' <span>' + esc(c.name) + '</span><small class="sim-source">' + (a.config.source === 'ai' ? 'AI 情景 · ' + esc(a.config.model) : '本地模拟') + '</small></h1></div><div class="flex gap-8"><button class="btn btn-sm btn-outline" type="button" data-sim-export>导出记录</button><button class="btn btn-sm btn-ghost" type="button" data-sim-new>新建考核</button><button class="btn btn-sm btn-ghost" type="button" data-sim-clear-current>删除本场记录</button></div></header>' +
          '<div class="sim-metrics"><div><span>账户净值</span><b data-metric="equity"></b></div><div><span>已实现 / 浮动盈亏</span><b data-metric="pnl"></b></div><div><span>距失败底线</span><b data-metric="allowance"></b></div><div><span>距盈利目标</span><b data-metric="target"></b></div><div><span>最大净值回撤</span><b data-metric="dd"></b></div><div><span>交易日进度</span><b data-metric="day"></b></div></div>' +
          '<div class="sim-market-bar"><span class="sim-market-state" data-sim-state></span><span data-sim-clock></span><span data-sim-beijing></span><span class="sim-synthetic">模拟行情 · OHLCV / 足迹 / 深度均为合成</span></div>' +
          '<div class="sim-workspace"><section class="sim-chart-panel"><div class="sim-chart-toolbar"><div class="sim-timeframes">' +
          [['1', '1分'], ['5', '5分'], ['15', '15分'], ['30', '30分'], ['60', '1小时']].map(function (tf) { return '<button type="button" data-sim-tf="' + tf[0] + '" aria-pressed="' + (a.timeframe === tf[0]) + '">' + tf[1] + '</button>'; }).join('') +
          '</div><div class="sim-toolbar-actions"><div class="sim-session-jumps" role="group" aria-label="跳转到当前交易日盘段"><span>盘段</span>' + [{ id: '亚洲', label: '亚洲' }, { id: '欧洲', label: '伦敦' }, { id: '纽约', label: '纽约' }].map(function (item) { return '<button type="button" data-sim-session-jump="' + item.id + '" title="逐根模拟至本交易日' + item.label + '盘，不跳过止损和止盈">' + item.label + '</button>'; }).join('') + '</div><select class="sim-history-select" aria-label="定位历史交易日" data-sim-history-day><option value="">历史日定位</option>' + market.dates.slice(0, 30).map(function (date, i) { return '<option value="' + i + '">' + date + '</option>'; }).join('') + '</select><button type="button" class="btn btn-sm btn-ghost" data-sim-history>前30天</button><button type="button" class="btn btn-sm btn-ghost" data-sim-live data-sim-focus title="聚焦最新行情并恢复自动跟随">聚焦最新</button><button type="button" class="btn btn-sm btn-ghost" data-sim-full>⛶ 全屏</button></div></div>' +
          '<div class="sim-indicators">' + [['volume', '成交量', 'm04-02'], ['delta', 'Delta', 'm04-03', '每柱表示主动买量减主动卖量；可以与价格涨跌方向不同。'], ['cvd', 'CVD', 'm04-03', '数值是累计Delta；柱色只表示本柱Delta，价格与CVD可以背离。'], ['footprint', '足迹', 'm04-02'], ['profile', '成交分布', 'm04-05'], ['ladder', '订单簿', 'm04-01'], ['atr', 'ATR', 'm06-01'], ['swings', '结构', 'm01-04'], ['vwap', 'VWAP', 'm04-05'], ['fvg', 'FVG 候选', 'm03-04'], ['orderBlock', '订单块候选', 'm03-04']].map(function (x) { return '<label title="' + (x[3] || '对应课程 ' + x[2]) + '"><input type="checkbox" data-sim-indicator="' + x[0] + '"' + (a.indicators[x[0]] ? ' checked' : '') + '>' + x[1] + '</label>'; }).join('') + '</div>' +
          '<div class="sim-chart-body"><aside class="sim-draw-tools" aria-label="知识点绘图工具"><button type="button" class="is-selected" data-sim-hand title="拖动浏览 · Esc取消绘图">✥<small>浏览</small></button>' +
          [['水平位', 'support'], ['趋势线', 'trend-bull'], ['结构', 'bos-bull'], ['区域', 'ob-bull'], ['异常K', 'pin-bull'], ['订单流', 'absorption'], ['价值区', 'profile'], ['风控', 'stop']].map(function (x, i) { return '<button type="button" data-sim-category="' + x[1] + '" title="' + x[0] + '">' + ['─', '╱', '↗', '▧', '◇', '≋', '▥', '⊣'][i] + '<small>' + x[0] + '</small></button>'; }).join('') +
          '<button type="button" data-sim-undo title="撤销最近标注">↶<small>撤销</small></button></aside><div class="sim-chart-canvas" data-sim-chart></div></div><div class="sim-context-menu" data-sim-context hidden role="menu" aria-label="图表交易菜单"></div>' +
          '<div class="sim-draw-palette"><label>知识点工具<select data-sim-preset><option value="">拖动 / 选择</option>' + presets.map(function (p) { return '<option value="' + p.id + '">' + esc(p.label) + '</option>'; }).join('') + '</select></label><div class="sim-draw-actions"><button class="btn btn-sm btn-ghost" type="button" data-sim-clear-drawings' + (a.drawings.length ? '' : ' disabled') + '>清空全部画线</button><p data-sim-draw-hint>右键交易 · 右键选中线删除 · 拖动空白平移 · 拖分隔线调副图。</p></div></div>' +
          '<div class="sim-selection" data-sim-selection hidden><span data-sim-selection-label></span><button class="btn btn-sm btn-outline" type="button" data-sim-delete-selected>删除选中画线</button><small>拖动端点或线条编辑；右键也可删除当前选中绘制</small></div>' +
          '<div class="sim-replay"><button class="btn btn-sm btn-primary" type="button" data-sim-play>▶ 播放行情</button><button class="btn btn-sm btn-outline" type="button" data-sim-step>下一根 1分</button><label>速度<select data-sim-speed><option value="1">1× 实时</option><option value="60">60×</option><option value="300" selected>300×</option><option value="900">900×</option><option value="3600">3600×</option></select></label><button class="btn btn-sm btn-outline" type="button" data-sim-skip>跳过当天 →</button><span data-sim-forming aria-live="polite"></span><span data-sim-day-progress></span></div></section>' +
          '<aside class="sim-ticket"><div class="sim-ticket-title"><h2>模拟委托</h2><span>USD</span></div><div class="sim-last-price"><span>' + a.config.symbol + ' · 当前价格</span><b data-sim-price></b></div>' +
          '<label class="sim-field">入场模型（可不选）<select data-order="strategy"><option value="">不指定 · 由AI按行情归纳</option><option value="趋势回踩">趋势回踩</option><option value="扫荡 → 位移 → 回踩">扫荡 → 位移 → 回踩</option><option value="价值区回归">价值区回归</option><option value="吸收反转">吸收反转</option><option value="Spring / Upthrust">Spring / Upthrust</option><option value="结构突破">结构突破</option></select><small class="sim-model-help" data-order-model-help></small></label>' +
          '<details class="sim-model-guide"><summary>这些模型是什么意思？</summary><dl><dt>趋势回踩</dt><dd>顺着高低点结构方向，等价格回撤到支撑或阻力，再观察入场。</dd><dt>扫荡 → 位移 → 回踩</dt><dd>先扫过前高或前低，再出现明显位移，等回踩后按方向计划。</dd><dt>价值区回归</dt><dd>区间行情中，观察偏离成交密集区的价格是否回到价值区或 POC。</dd><dt>吸收反转</dt><dd>主动买卖较强但价格推进有限，等后续反向确认，不凭单根柱判断。</dd><dt>Spring / Upthrust</dt><dd>区间边缘假突破后重新收回，结合成交量与后续测试判断。</dd><dt>结构突破</dt><dd>观察收盘是否突破前一摆动高点或低点，并按突破方向制定计划。</dd></dl><p>可以一直留空。AI会按入场当时的行情、指标、价格和标注独立复盘；手动选择只是你的计划备注，不会被当成正确答案。</p></details>' +
          '<div class="sim-order-fields"><label class="sim-field">委托类型<select data-order="type"><option value="market">市价单</option><option value="limit">限价单</option><option value="stop">突破触发单</option></select></label><label class="sim-field">数量 / 手<input data-order="qty" type="number" min="1" max="20" step="1" value="1"></label></div>' +
          '<label class="sim-field" data-order-price-label hidden>挂单价格<input data-order="price" type="number" min="0" step="' + c.tick + '"></label>' +
          '<div class="sim-order-fields"><label class="sim-field">止损距离 / 点<input data-order="stopDistance" type="number" min="' + c.tick + '" step="' + c.tick + '" value="' + c.stop + '"></label><label class="sim-field">止盈距离 / 点<input data-order="targetDistance" type="number" min="' + c.tick + '" step="' + c.tick + '" value="' + c.stop * 2 + '"></label></div>' +
          '<div class="sim-risk-preview" data-sim-risk></div><div class="sim-order-buttons"><button type="button" data-sim-order="1">买入 / 做多</button><button type="button" data-sim-order="-1">卖出 / 做空</button></div>' +
          '<p class="sim-cost-note">模拟手续费每手单边$0.62；市价/止损单按1跳不利滑点。挂单需未来价格触发，止盈按目标限价。所有成本计入净值。</p>' +
          '<div class="sim-position" data-sim-position></div><div class="sim-ticket-foot"><span>固定失败底线<b>$48,000</b></span><span>账户盈利目标<b>$53,000</b></span></div><button class="btn btn-sm btn-outline" type="button" data-sim-finish>结束考核并复盘</button><p class="sim-cost-note">跳日仍逐笔执行止损止盈和净值检查。平台采用固定底线，最大回撤单独统计。</p></aside></div>' +
          '<section class="sim-journal"><div class="sim-journal-head"><div><span class="sim-eyebrow">YOUR DECISIONS, RECORDED</span><h2>交易与标注复盘</h2></div><div class="flex gap-8 flex-wrap"><button type="button" class="btn btn-sm btn-outline" data-sim-grade="local">本地规则评分</button><button type="button" class="btn btn-sm btn-primary" data-sim-grade="ai">✦ AI 逐笔评估</button><button type="button" class="btn btn-sm btn-ghost" data-sim-cancel hidden>取消请求</button></div></div><div role="status" data-sim-review-status></div><div class="sim-journal-stats" data-sim-stats></div><div data-sim-journal></div><div data-sim-report></div></section>' +
          '<details class="sim-annotations panel"><summary>知识点标注与依据 <span data-sim-annotation-count></span></summary><div data-sim-annotations></div></details>' +
          '<section class="panel"><h2>交易日记录</h2><p class="muted text-sm">已完成日期的账户快照；可用图表“前30天”和拖动查看考核前历史。</p><div class="sim-days" data-sim-days></div></section>';
        engine = new LQ.chart.Engine(page.querySelector('[data-sim-chart]'), { scenario: { id: a.id, title: '模拟考核', symbol: a.config.symbol, timeframe: a.timeframe + 'm', tick: c.tick, bars: market.bars.slice(0, a.cursor + 1), panels: a.indicators, events: {} }, height: a.chartHeight || 560, viewport: { from: Math.max(0, a.cursor - 100), to: a.cursor }, tools: false, drawingEdit: true, paneResizing: true, axisScale: true, timeAxisScale: true, resizableHeight: true, scaleDrawings: false, annotations: [],
          onHeightChange: function (height) { a.chartHeight = height; save(); }, onViewportChange: viewportChanged, onDrawingChange: drawingChanged, onSelectionChange: selectionChanged, onAnnotationDrag: annotationDragged });
        engine.paneSizeOverrides = Object.assign(engine.paneSizeOverrides, { volume: 82, delta: 74, cvd: 74, atr: 68 });
        engine.formatTime = function (t) { return time(t) + ' NY'; };
        engine.mount(); refreshChart(true); sync(); renderReport(); updateModelHint();
      }
      function mapDrawing(d) {
        var copy = Object.assign({}, d);
        ['x', 'x1', 'x2'].forEach(function (k) { if (typeof d[k] === 'number') copy[k] = aggregation.mapping[Math.max(0, Math.min(a.cursor, Math.round(d[k])))]; });
        return copy;
      }
      function refreshChart(follow, scaleAnchor) {
        if (!engine) return;
        follow = !!follow && followLatest;
        var previousClose = engine.bars && engine.bars.length ? engine.bars[engine.bars.length - 1].c : null;
        var bars = market.bars.slice(0, a.cursor + 1);
        aggregation = S.aggregate(bars, a.timeframe, a.config.symbol);
        var latestGroup = aggregation.bars[aggregation.bars.length - 1];
        if (follow && engine.priceScaleOverride && previousClose !== null && latestGroup) {
          var anchor = Number.isFinite(scaleAnchor) ? scaleAnchor : Number.isFinite(lastScaleFollowedPrice) ? lastScaleFollowedPrice : previousClose;
          var priceShift = latestGroup.c - anchor;
          engine.priceScaleOverride.min += priceShift;
          engine.priceScaleOverride.max += priceShift;
        }
        if (follow && latestGroup) lastScaleFollowedPrice = latestGroup.c;
        engine.autoSwingsEnabled = a.indicators.swings;
        var pv = 0, volume = 0, lastDay = -1;
        engine.vwapValues = aggregation.bars.map(function (b) { if (lastDay !== b.day) { pv = 0; volume = 0; lastDay = b.day; } pv += b.pv; volume += b.v; return pv / Math.max(1, volume); });
        engine.showVwap = a.indicators.vwap;
        engine.updateSeries({ id: a.id, title: '模拟考核', symbol: a.config.symbol, timeframe: a.timeframe + 'm', tick: S.contracts[a.config.symbol].tick, bars: aggregation.bars, panels: a.indicators, events: {}, cvdResetDaily: true,
          book: function (index, opts) { var g = aggregation.bars[Math.max(0, Math.min(aggregation.bars.length - 1, Math.round(index)))]; var book = S.depth(market.bars[g._indices[g._indices.length - 1]], a.config.symbol, a.config.seed, opts.levels); book.barIndex = Math.round(index); return book; } }, follow);
        var annotations = [], p = a.position, end = aggregation.bars.length - 1;
        if (p) { [['entry', '持仓均价', 'info'], ['stop', '止损', 'bear'], ['target', '止盈', 'bull']].forEach(function (x) { annotations.push({ kind: 'hline', x1: null, x2: null, y: p[x[0]], label: x[1] + ' ' + p[x[0]].toFixed(2), tone: x[2], editable: x[0] === 'stop' || x[0] === 'target' ? x[0] : null }); }); }
        if (a.pending) annotations.push({ kind: 'hline', y: a.pending.price, label: '待触发委托', tone: 'warn' });
        a.trades.slice(-80).forEach(function (t) {
          annotations.push({ kind: 'marker', x: aggregation.mapping[t.entryIndex], y: t.entry, label: t.side === 1 ? '买入' : '卖出', tone: t.side === 1 ? 'bull' : 'bear', pos: 'below' });
          annotations.push({ kind: 'marker', x: aggregation.mapping[t.exitIndex], y: t.exit, label: signed(t.net), tone: t.net >= 0 ? 'bull' : 'bear', pos: 'above' });
        });
        if (a.indicators.fvg || a.indicators.orderBlock) {
          annotations = annotations.concat(S.detectZones(aggregation.bars, a.config.symbol, { fvg: a.indicators.fvg, orderBlock: a.indicators.orderBlock, lookback: engine.narrow ? 160 : 240 }));
        }
        engine.setAnnotations(annotations);
        engine._applyDrawings(a.drawings.map(mapDrawing), false);
        if (follow) {
          var visibleBars = a.indicators.footprint ? 11 : (engine.narrow ? 30 : 40);
          engine.setViewport({ from: Math.max(0, end - visibleBars + 1), to: end });
        }
        if (forming) renderForming();
      }
      function choosePreset(id) {
        if (!engine || busy) return;
        pause(); selected = presets.find(function (p) { return p.id === id; }) || null;
        engine.setPreset(selected);
        page.querySelector('[data-sim-preset]').value = selected ? selected.id : '';
        page.querySelector('[data-sim-draw-hint]').textContent = selected ? selected.label + '：' + selected.reason + (['trend', 'fib', 'zone', 'vprofile'].includes(selected.tool) ? ' 依次点击两个端点，也可拖拽。' : ' 在目标位置点击。') : '滚轮缩放 · 拖动浏览 · 双击复位。';
        page.querySelectorAll('[data-sim-hand], [data-sim-category]').forEach(function (b) { b.classList.toggle('is-selected', !selected ? b.hasAttribute('data-sim-hand') : b.getAttribute('data-sim-category') === id); });
      }
      function chartIndexToSource(index) {
        var group = aggregation.bars[Math.max(0, Math.min(aggregation.bars.length - 1, Math.round(index)))];
        return group._indices[group._indices.length - 1];
      }
      function saveDrawingMetadata(copy) {
        copy.pointTimes = {};
        ['x', 'x1', 'x2'].forEach(function (key) { if (typeof copy[key] === 'number') copy.pointTimes[key] = market.bars[copy[key]].t; });
        return copy;
      }
      function sourceDrawing(chartDrawing) {
        var copy = Object.assign({}, chartDrawing);
        ['x', 'x1', 'x2'].forEach(function (key) { if (typeof copy[key] === 'number') copy[key] = chartIndexToSource(copy[key]); });
        return saveDrawingMetadata(copy);
      }
      function viewportChanged(view) {
        if (!a || !view || busy) return;
        var historyView = view.to < view.count - 1.5;
        var wasFollowing = followLatest;
        followLatest = !historyView;
        inspecting = historyView;
        if (followLatest && !wasFollowing && engine.priceScaleOverride && aggregation) {
          var latestPrice = forming && forming.preview ? forming.preview.c : aggregation.bars[aggregation.bars.length - 1].c;
          var scaleSpan = engine.priceScaleOverride.max - engine.priceScaleOverride.min;
          engine.priceScaleOverride = { min: latestPrice - scaleSpan / 2, max: latestPrice + scaleSpan / 2 };
          lastScaleFollowedPrice = latestPrice; engine._invalidate();
        }
        var state = page.querySelector('[data-sim-state]');
        if (state) state.textContent = status(a) + (historyView ? ' · 正在浏览历史' : ' · ' + current().session + '时段');
        var select = page.querySelector('[data-sim-history-day]'); if (select && !historyView) select.value = '';
        page.querySelectorAll('[data-sim-order]').forEach(function (button) { button.disabled = busy || a.status !== 'active' || historyView || !!a.position || !!a.pending; });
      }
      function selectionChanged(selection) {
        if (selection && playing) pause();
        var host = page.querySelector('[data-sim-selection]'); if (!host) return;
        host.hidden = !selection;
        if (!selection) return;
        if (selection.type === 'annotation') {
          host.querySelector('[data-sim-selection-label]').textContent = selection.concept === 'stop' ? '已选择止损线：拖动后按合约跳动校验' : '已选择止盈线：拖动后按合约跳动校验';
          host.querySelector('[data-sim-delete-selected]').hidden = true;
        } else {
          var item = engine.getDrawings()[selection.index];
          host.querySelector('[data-sim-selection-label]').textContent = item ? '已选择：' + item.label : '已选择画线';
          host.querySelector('[data-sim-delete-selected]').hidden = false;
        }
      }
      function deleteSelectedDrawing() { if (engine) engine.removeSelectedDrawing(); }
      function focusLatest() {
        if (!engine || !aggregation) return;
        followLatest = true; inspecting = false;
        var end = aggregation.bars.length - 1;
        var count = Math.max(a.indicators.footprint ? 11 : 10, Math.round(engine.view.to - engine.view.from + 1));
        if (engine.priceScaleOverride) {
          var scaleSpan = engine.priceScaleOverride.max - engine.priceScaleOverride.min;
          var latestPrice = forming && forming.preview ? forming.preview.c : aggregation.bars[end].c;
          engine.priceScaleOverride = { min: latestPrice - scaleSpan / 2, max: latestPrice + scaleSpan / 2 };
        }
        lastScaleFollowedPrice = forming && forming.preview ? forming.preview.c : aggregation.bars[end].c;
        engine.setViewport({ from: Math.max(0, end - count + 1), to: end });
        var selector = page.querySelector('[data-sim-history-day]'); if (selector) selector.value = '';
        sync();
      }
      function annotationDragged(change) {
        if (!change || busy) return;
        pause();
        try {
          S.amend(a, market.bars, change.concept, change.after);
          a.events.push({ type: 'bracket-adjustment', concept: change.concept, from: change.before, price: change.after, at: current().t });
          a.report = null; save(); sync(); refreshChart(false);
          LQ.ui.toast((change.concept === 'stop' ? '止损' : '止盈') + '已移动，调整已记录。');
        } catch (err) { refreshChart(false); sync(); toast(err.message); }
      }
      function drawingChanged(list, change) {
        if (!aggregation || !a || busy) return;
        change = change || { type: 'add', index: list.length - 1 };
        if (change.type === 'delete' || change.type === 'clear') {
          if (change.type === 'delete') a.drawings.splice(change.index, 1);
          else a.drawings = [];
          a.report = null; save(); sync(); return;
        }
        if (change.type === 'set') {
          a.drawings = list.filter(function (item) { return item && item.concept; }).map(sourceDrawing);
          a.report = null; save(); sync(); return;
        }
        if (change.type === 'edit') {
          var edited = sourceDrawing(list[change.index]);
          if ((edited.concept === 'trend-bull' && (edited.x2 <= edited.x1 || edited.y2 <= edited.y1)) ||
              (edited.concept === 'trend-bear' && (edited.x2 <= edited.x1 || edited.y2 >= edited.y1))) {
            toast('这条多空趋势线方向不符合定义，已撤销本次移动。'); refreshChart(false); return;
          }
          a.drawings[change.index] = edited;
          a.events.push({ type: 'drawing-edit', drawingId: edited.id, concept: edited.concept, at: current().t });
          a.report = null; save(); sync(); return;
        }
        var last = list[list.length - 1];
        if (!last || !last.concept) return;
        if (a.drawings.length >= 200) { toast('本场最多200个标注，请删除不需要的标注后再画。'); refreshChart(false); return; }
        var copy = Object.assign({}, last), preset = presets.find(function (p) { return p.id === copy.concept; });
        ['x', 'x1', 'x2'].forEach(function (key) { if (typeof copy[key] === 'number') { var group = aggregation.bars[Math.max(0, Math.min(aggregation.bars.length - 1, Math.round(copy[key])))]; copy[key] = group._indices[group._indices.length - 1]; } });
        if ((copy.concept === 'trend-bull' && (copy.x2 <= copy.x1 || copy.y2 <= copy.y1)) || (copy.concept === 'trend-bear' && (copy.x2 <= copy.x1 || copy.y2 >= copy.y1))) { toast('请从左到右连接：多头低点抬高，空头高点降低。'); refreshChart(false); return; }
        try {
          if (copy.concept === 'stop' || copy.concept === 'target') {
            S.amend(a, market.bars, copy.concept, copy.y);
            a.events.push({ type: 'bracket-adjustment', concept: copy.concept, price: copy.y, at: current().t });
          } else {
            if (copy.kind === 'marker') { var b = market.bars[copy.x]; copy.y = preset.tone === 'bull' ? b.l : b.h; }
            copy.id = 'mark-' + Date.now() + '-' + a.drawings.length; copy.createdIndex = a.cursor; copy.createdAt = current().t;
            copy.pointTimes = {};
            saveDrawingMetadata(copy);
            a.drawings.push(copy); a.report = null;
          }
          save(); sync(); refreshChart(false);
        } catch (err) { toast(err.message); refreshChart(false); }
        selected = null; page.querySelector('[data-sim-preset]').value = '';
      }
      function values() {
        var v = {}; page.querySelectorAll('[data-order]').forEach(function (el) { v[el.getAttribute('data-order')] = el.value; }); return v;
      }
      function updateModelHint() {
        var target = page.querySelector('[data-order-model-help]'), select = page.querySelector('[data-order="strategy"]');
        if (!target || !select) return;
        var notes = {
          '': '可留空。AI会根据入场时的结构、区域、Delta、CVD和波动，独立归纳你实际采用的条件。',
          '趋势回踩': '顺当前高低点结构方向，等待价格回撤到支撑或阻力后入场。',
          '扫荡 → 位移 → 回踩': '先观察前高/前低被扫过，再确认强位移，等待回踩后入场。',
          '价值区回归': '价格偏离成交密集区后，观察是否回到价值区或POC。',
          '吸收反转': '主动成交较强但价格推进有限，等待反向确认后入场。',
          'Spring / Upthrust': '区间边界假突破后收回，结合量能和后续测试判断。',
          '结构突破': '价格收盘突破前一结构高点或低点，按突破方向计划。'
        };
        target.textContent = notes[select.value] || notes[''];
      }
      function riskPreview() {
        if (!a || !page.querySelector('[data-sim-risk]')) return;
        var v = values(), c = S.contracts[a.config.symbol], risk = Number(v.stopDistance) * c.point * Number(v.qty) + 2 * c.fee * Number(v.qty) + 2 * c.tick * c.point * Number(v.qty);
        page.querySelector('[data-sim-risk]').textContent = Number.isFinite(risk) ? '预计止损风险 ' + money(risk) + ' · 计划盈亏比 ' + (Number(v.targetDistance) / Math.max(c.tick, Number(v.stopDistance))).toFixed(2) : '请填写有效的委托参数';
      }
      function sync() {
        if (!a || !page.querySelector('[data-sim-price]')) return;
        var b = current(), p = a.position, stats = S.stats(a), day = Math.min(30, b.day - 29);
        var metrics = { equity: money(a.equity), pnl: signed(stats.net) + ' / ' + signed(stats.floating), allowance: money(Math.max(0, a.equity - 48000)), target: money(Math.max(0, 53000 - a.equity)), dd: money(a.maxDrawdown), day: String(day).padStart(2, '0') + ' / 30' };
        page.querySelectorAll('[data-metric]').forEach(function (el) { el.textContent = metrics[el.dataset.metric]; });
        page.querySelector('[data-sim-state]').textContent = status(a) + (inspecting ? ' · 正在浏览历史' : ' · ' + b.session + '时段');
        if (!inspecting) page.querySelector('[data-sim-history-day]').value = '';
        page.querySelector('[data-sim-state]').classList.toggle('is-ended', a.status !== 'active');
        page.querySelector('[data-sim-clock]').textContent = time(b.t + 60000) + ' 纽约';
        page.querySelector('[data-sim-beijing]').textContent = time(b.t + 60000, 'Asia/Shanghai') + ' 北京';
        page.querySelector('[data-sim-price]').textContent = b.c.toFixed(2);
        page.querySelector('[data-sim-day-progress]').textContent = '本日 ' + Math.round((a.cursor % S.PER_DAY + 1) / S.PER_DAY * 100) + '%';
        page.querySelectorAll('[data-sim-order], [data-sim-play], [data-sim-step], [data-sim-skip], [data-sim-finish]').forEach(function (el) { el.disabled = busy || a.status !== 'active' || (el.hasAttribute('data-sim-order') && (inspecting || !!a.position || !!a.pending)); });
        page.querySelector('[data-sim-position]').innerHTML = p ? '<span class="sim-eyebrow">当前持仓</span><b>' + (p.side === 1 ? '多头' : '空头') + ' ' + p.qty + '手 · ' + p.entry.toFixed(2) + '</b><span>浮动 ' + signed(stats.floating) + '</span><span>止损 ' + p.stop.toFixed(2) + ' / 止盈 ' + p.target.toFixed(2) + '</span><button type="button" class="btn btn-outline btn-sm" data-sim-close' + (busy ? ' disabled' : '') + '>按当前市价平仓</button>' : a.pending ? '<b>等待触发 · ' + (a.pending.side === 1 ? '买入' : '卖出') + ' ' + a.pending.qty + '手</b><span>委托价 ' + a.pending.price.toFixed(2) + '</span><button type="button" class="btn btn-outline btn-sm" data-sim-cancel-order' + (busy ? ' disabled' : '') + '>撤销挂单</button>' : '<span class="muted">目前空仓</span><small>先在图上标记依据，再选择模型与风险。</small>';
        page.querySelector('[data-sim-stats]').innerHTML = [['成交笔数', stats.count], ['胜率', stats.winRate + '%'], ['净期望 / 笔', money(stats.expectancy)], ['盈利因子', stats.profitFactor === null ? '∞' : stats.profitFactor], ['累计费用', money(stats.fees)]].map(function (x) { return '<span>' + x[0] + '<b>' + x[1] + '</b></span>'; }).join('');
        page.querySelector('[data-sim-journal]').innerHTML = a.trades.length ? '<div class="table-wrap"><table><thead><tr><th>交易</th><th>入场 / 平仓 · 纽约</th><th>方向 / 手数</th><th>成交价 · 委托价</th><th>Delta / ATR</th><th>净盈亏 / R</th><th>模型备注 / 依据</th></tr></thead><tbody>' + a.trades.slice().reverse().map(function (t) { var values = (t.fillEvidence || t.evidence).indicatorValues || {}; return '<tr><td><button class="sim-trade-link" type="button" data-sim-trade="' + t.id + '">' + esc(t.id) + '</button></td><td>' + time(t.entryTime) + '<br>' + time(t.exitTime) + '</td><td>' + (t.side === 1 ? '多' : '空') + ' / ' + t.qty + '</td><td>' + t.entry.toFixed(2) + (t.submittedPrice == null ? '' : ' · ' + Number(t.submittedPrice).toFixed(2)) + ' → ' + t.exit.toFixed(2) + '</td><td>' + (values.latestDelta >= 0 ? '+' : '') + Number(values.latestDelta || 0).toFixed(0) + ' / ' + Number(values.atr14 || 0).toFixed(2) + '</td><td class="' + (t.net >= 0 ? 'sim-positive' : 'sim-negative') + '">' + signed(t.net) + '<br>' + t.r + 'R</td><td>' + esc(t.strategy || '未指定 · AI分析') + ' · ' + t.evidence.drawings.length + ' 标注</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="sim-empty"><span>⌁</span><b>你的第一笔交易，从一个判断开始</b><p>图表、指标和标注已就绪。选择知识点工具，在图上留下你的依据。</p></div>';
        page.querySelector('[data-sim-annotation-count]').textContent = a.drawings.length + ' 项';
        page.querySelector('[data-sim-annotations]').innerHTML = a.drawings.slice().reverse().map(function (d) { return '<div class="sim-annotation-row"><div><b>' + esc(d.label) + '</b><span>' + esc(d.rationale) + '</span><small>' + time(d.createdAt) + ' · ' + (d.y !== undefined ? '价格 ' + d.y.toFixed(2) : '端点 ' + d.y1 + ' → ' + d.y2) + ' · <a href="#/lesson/' + esc(d.lessonId) + '">复习知识点</a></small></div><button type="button" class="btn btn-ghost btn-sm" data-sim-delete-mark="' + esc(d.id) + '">删除</button></div>'; }).join('') || '<p class="muted text-sm">标注后自动补充名称、理由与课程链接。正确与否会在复盘中评估。</p>';
        page.querySelector('[data-sim-days]').innerHTML = a.days.map(function (d) { return '<button type="button" data-sim-day="' + d.day + '"><span>第' + d.day + '日</span><b>' + money(d.equity) + '</b></button>'; }).join('') || '<span class="muted text-sm">第一个交易日结束后显示记录。</span>';
        var clearDrawings = page.querySelector('[data-sim-clear-drawings]'); if (clearDrawings) clearDrawings.disabled = !a.drawings.length;
        riskPreview();
      }
      function closeContextMenu() {
        var menu = page.querySelector('[data-sim-context]'); if (menu) menu.hidden = true;
      }
      function openContextMenu(event) {
        var chartHost = event.target && event.target.closest ? event.target.closest('[data-sim-chart]') : null;
        if (!chartHost || !engine) return;
        event.preventDefault();
        var drawingSelected = engine.selection && engine.selection.type === 'drawing';
        if (busy) return;
        if (!drawingSelected && (inspecting || a.status !== 'active')) { toast(inspecting ? '历史行情不能下单，先回到当前' : '当前考核不能下单'); return; }
        var pos = engine._pointerPos(event);
        if (pos.x < engine.plot.x || pos.x > engine.plot.right || pos.y < engine.plot.y || pos.y > engine.plot.bottom) return;
        var barIndex = Math.max(0, Math.min(engine.bars.length - 1, Math.round(engine._barAtX(pos.x))));
        var price = S.round(engine.priceAtY(pos.y), a.config.symbol), bar = engine.bars[barIndex];
        var menu = page.querySelector('[data-sim-context]'), bounds = page.querySelector('.sim-chart-body').getBoundingClientRect();
        var actions = drawingSelected ? [['delete-drawing', '删除当前选中的绘制']] : [['market-long', '市价买入 / 做多'], ['market-short', '市价卖出 / 做空'], ['limit-long', '按图中价格挂买入限价'], ['limit-short', '按图中价格挂卖出限价'], ['stop-long', '按图中价格挂买入突破'], ['stop-short', '按图中价格挂卖出突破']];
        if (!drawingSelected && a.position) actions.push(['move-stop', '将止损移到此处'], ['move-target', '将止盈移到此处']);
        menu.innerHTML = '<div class="sim-context-price">' + a.config.symbol + ' · ' + price.toFixed(S.contracts[a.config.symbol].tick === 0.1 ? 1 : 2) + '<small>' + time(bar.t) + ' NY</small></div>' +
          actions.map(function (x) { return '<button type="button" role="menuitem" data-context-action="' + x[0] + '" data-context-price="' + price + '">' + x[1] + '</button>'; }).join('');
        menu.style.left = Math.max(6, Math.min(bounds.width - 224, event.clientX - bounds.left)) + 'px';
        menu.style.maxHeight = Math.max(160, bounds.height - 12) + 'px'; menu.style.overflowY = 'auto'; menu.hidden = false;
        menu.style.top = Math.max(6, Math.min(bounds.height - menu.offsetHeight - 6, event.clientY - bounds.top)) + 'px';
      }
      function contextAction(button) {
        var parts = button.dataset.contextAction.split('-'), action = parts[0], sideName = parts[1], price = Number(button.dataset.contextPrice);
        closeContextMenu(); pause();
        if (action === 'delete' && sideName === 'drawing') { if (engine) engine.removeSelectedDrawing(); return; }
        settleForming();
        if (action === 'move') {
          try {
            S.amend(a, market.bars, sideName, price);
            a.events.push({ type: 'bracket-adjustment', concept: sideName, price: price, at: current().t });
            a.report = null; save(); refreshChart(false); sync();
          } catch (err) { toast(err.message); }
          return;
        }
        var v = values(); v.side = sideName === 'long' ? 1 : -1; v.price = price;
        if (action === 'market') v.type = 'market';
        else v.type = action === 'limit' ? 'limit' : 'stop';
        v.source = 'chart-right-click';
        try { S.place(a, market.bars, v); if (engine) engine.priceScaleOverride = null; a.report = null; refreshChart(false); sync(); save(); }
        catch (err) { toast(err.message); }
      }
      function renderReport() {
        var host = page.querySelector('[data-sim-report]'); if (!host) return;
        var report = a.report;
        if (!report) { host.innerHTML = ''; return; }
        host.innerHTML = '<div class="sim-report"><div class="sim-report-score"><b>' + report.score + '<small>/100</small></b><span>' + (report.source === 'ai' ? 'AI 评估 · ' + esc(report.model) : '本地规则评估') + '</span></div><div><h3>从这次执行，看下一步学什么</h3><p>' + esc(report.summary) + '</p><div class="sim-report-dimensions">' + [['risk', '风险', 35], ['plan', '计划', 20], ['evidence', '证据', 20], ['execution', '执行', 25]].map(function (x) { return '<span>' + x[1] + '<b>' + report.dimensions[x[0]] + ' / ' + x[2] + '</b></span>'; }).join('') + '</div><p class="text-xs muted">过程评分用于学习反馈；考核通关由账户净值规则决定。</p>' + report.weaknesses.map(function (w) { return '<a class="sim-review-link" href="#/lesson/' + esc(w.lessonId) + '"><b>复习：' + esc(LQ.site.lesson(w.lessonId).title) + '</b><span>' + esc(w.reason) + '</span> →</a>'; }).join('') + '</div></div>' + (report.trades.length ? '<div class="sim-trade-reviews">' + report.trades.map(function (t) { return '<div><b>' + esc(t.id) + ' · ' + t.score + '分</b><p>' + esc(t.feedback) + '</p></div>'; }).join('') + '</div>' : '');
      }
      async function grade(source) {
        if (busy) return; pause();
        if (!a.trades.length) { toast('先完成一笔交易，再开始评估。'); return; }
        if (source === 'ai' && !LQ.ai.settings().apiKey) { LQ.ai.revealSettings(); toast('请在页面底部保存AI密钥'); return; }
        var message = page.querySelector('[data-sim-review-status]');
        if (source === 'local') { a.report = S.localReport(a); save(); renderReport(); return; }
        busy = true; controller = new AbortController(); sync(); engine.setPreset(null);
        page.querySelector('[data-sim-cancel]').hidden = false;
        var frozen = JSON.parse(JSON.stringify(a)), reports = [], batches = Math.ceil(frozen.trades.length / 20);
        try {
          for (var i = 0; i < batches; i++) {
            message.textContent = '正在评估第 ' + (i + 1) + ' / ' + batches + ' 批，完整保留每笔入场证据…';
            var batch = Object.assign({}, frozen, { trades: frozen.trades.slice(i * 20, (i + 1) * 20) });
            var payload = S.reviewPayload(batch); payload.overallStats = S.stats(frozen);
            reports.push(S.validateReport(await LQ.ai.request(S.reviewPrompt, payload, controller.signal), batch));
            if (destroyed) return;
          }
          var dims = { risk: 0, plan: 0, evidence: 0, execution: 0 }, weaknesses = [], reviews = [];
          reports.forEach(function (r) { var weight = r.trades.length / frozen.trades.length; Object.keys(dims).forEach(function (k) { dims[k] += r.dimensions[k] * weight; }); weaknesses = weaknesses.concat(r.weaknesses); reviews = reviews.concat(r.trades); });
          Object.keys(dims).forEach(function (k) { dims[k] = Math.round(dims[k]); });
          a.report = { source: 'ai', model: LQ.ai.settings().model, score: Object.values(dims).reduce(function (n, x) { return n + x; }, 0), dimensions: dims,
            summary: reports.map(function (r, i) { return reports.length > 1 ? '第' + (i + 1) + '批：' + r.summary : r.summary; }).join('\n'), weaknesses: weaknesses, trades: reviews, at: new Date().toISOString() };
          save(); renderReport(); message.textContent = '已完成全部 ' + frozen.trades.length + ' 笔交易评估';
        } catch (err) { if (!destroyed) message.textContent = err.message; }
        finally { busy = false; if (!destroyed) { page.querySelector('[data-sim-cancel]').hidden = true; sync(); } }
      }
      function applyClosedBars(count, scaleAnchor) {
        if (busy || a.status !== 'active') return;
        S.advance(a, market.bars, count); a.report = null;
        if (a.status !== 'active') { pause(); discardForming(); try { S.archive(a); } catch (_) {} toast(status(a)); }
        refreshChart(followLatest, scaleAnchor); sync(); save();
      }
      function advance(count) {
        if (busy || a.status !== 'active') return;
        discardForming(); applyClosedBars(count);
      }
      function playbackTick(now) {
        if (!playing || destroyed || !engine) return;
        var elapsed = replayLast ? Math.max(0, Math.min(250, now - replayLast)) : 0;
        replayLast = now;
        replayBudget += elapsed * Number(page.querySelector('[data-sim-speed]').value) * 12 / 60000;
        var available = Math.max(0, market.bars.length - 1 - a.cursor);
        var completed = Math.min(available, Math.floor(replayBudget / 12));
        if (completed > 0) {
          var scaleAnchor = lastScaleFollowedPrice;
          replayBudget -= completed * 12; forming = null;
          if (engine.setReplayPreview) engine.setReplayPreview(null);
          var formingStatus = page.querySelector('[data-sim-forming]'); if (formingStatus) formingStatus.textContent = '';
          var statusBefore = a.status;
          applyClosedBars(completed, scaleAnchor);
          if (statusBefore === 'active' && a.status !== 'active') return;
        }
        if (a.cursor < market.bars.length - 1 && replayBudget > 0) {
          var step = Math.min(market.bars[forming ? forming.index : a.cursor + 1].path.length, replayBudget);
          if (!forming) forming = { index: a.cursor + 1, step: 0, preview: null };
          if (forming.index === a.cursor + 1 && step > forming.step + 0.001) { forming.step = step; renderForming(); }
        }
        if (playing) replayFrame = setTimeout(function () { playbackTick(performance.now()); }, 33);
      }
      function settleForming() {
        if (!forming || !a || a.status !== 'active') return;
        pause(); discardForming(); applyClosedBars(1);
      }
      function jumpToSession(session) {
        if (busy || a.status !== 'active') return;
        pause(); discardForming(); followLatest = true; inspecting = false;
        var day = market.bars[a.cursor].day, dayEnd = Math.min(market.bars.length, (day + 1) * S.PER_DAY), target = -1;
        for (var i = a.cursor; i < dayEnd; i++) {
          if (market.bars[i].session === session) { target = i; break; }
        }
        if (target < 0) { focusLatest(); toast('本交易日' + session + '盘已结束，请跳过当天后再选择。'); return; }
        if (target === a.cursor) { focusLatest(); toast('当前已在' + session + '盘'); return; }
        advance(target - a.cursor); focusLatest();
      }
      function dismissContextMenu(event) {
        if (event.target && event.target.closest && event.target.closest('[data-sim-context]')) return;
        closeContextMenu();
      }
      function fullscreenChanged() {
        var workspace = page.querySelector('.sim-workspace'), active = !!workspace && document.fullscreenElement === workspace;
        page.classList.toggle('sim-fullscreen-active', active);
        page.classList.toggle('sim-fullscreen-mode', active);
        var button = page.querySelector('[data-sim-full]');
        if (button) button.textContent = active ? '⛶ 退出全屏' : '⛶ 全屏';
        requestAnimationFrame(function () { if (engine) engine.resize(); });
      }
      document.addEventListener('pointerdown', dismissContextMenu, true);
      document.addEventListener('fullscreenchange', fullscreenChanged);
      page.addEventListener('input', function (e) { if (e.target.hasAttribute('data-order')) riskPreview(); });
      page.addEventListener('contextmenu', openContextMenu);
      page.addEventListener('change', function (e) {
        var el = e.target;
        if (el.hasAttribute('data-sim-indicator') && !busy) {
          a.indicators[el.dataset.simIndicator] = el.checked;
          if (el.dataset.simIndicator === 'footprint' && el.checked) { followLatest = true; inspecting = false; }
          refreshChart(el.dataset.simIndicator === 'footprint'); save();
        }
        if (el.hasAttribute('data-sim-preset')) choosePreset(el.value);
        if (el.hasAttribute('data-sim-history-day') && el.value !== '' && !busy) {
          pause(); discardForming(); inspecting = true; followLatest = false; var start = Number(el.value) * S.PER_DAY;
          engine.setViewport({ from: aggregation.mapping[start], to: aggregation.mapping[start + S.PER_DAY - 1] }); sync();
        }
        if (el.getAttribute('data-order') === 'type') page.querySelector('[data-order-price-label]').hidden = el.value === 'market';
        if (el.getAttribute('data-order') === 'strategy') updateModelHint();
      });
      page.addEventListener('click', async function (e) {
        if (!e.target.closest('[data-sim-context]')) closeContextMenu();
        var button = e.target.closest('button'); if (!button || button.disabled) return;
        if (button.hasAttribute('data-context-action')) { contextAction(button); return; }
        if (button.hasAttribute('data-sim-delete-selected')) { deleteSelectedDrawing(); return; }
        if (button.hasAttribute('data-sim-clear-drawings')) {
          LQ.ui.confirmThen(button, function () {
            if (engine) engine.clearDrawings();
            a.drawings = []; a.report = null; save(); sync(); refreshChart(false);
            toast('已清空本场全部手动画线与区域');
          });
          return;
        }
        if (button.hasAttribute('data-sim-cancel')) { if (controller) controller.abort(); return; }
        if (button.hasAttribute('data-sim-create')) { create(button.dataset.simCreate); return; }
        if (button.hasAttribute('data-sim-archive')) { download(S.archives()[Number(button.dataset.simArchive)]); return; }
        if (button.hasAttribute('data-sim-delete-archive')) {
          LQ.ui.confirmThen(button, function () {
            if (!S.removeArchive(button.dataset.simDeleteArchive)) { toast('删除失败，请检查浏览器存储空间。'); return; }
            var archiveSlot = page.querySelector('[data-sim-archives]');
            if (archiveSlot) archiveSlot.innerHTML = archivesHTML();
            toast('已删除这条模拟记录');
          });
          return;
        }
        if (button.hasAttribute('data-sim-clear-all')) {
          LQ.ui.confirmThen(button, function () {
            if (!S.clearRecords()) { toast('清除失败，请检查浏览器存储空间。'); return; }
            a = null; market = null; setup(); toast('已清除全部模拟记录');
          });
          return;
        }
        if (button.hasAttribute('data-sim-clear-current')) {
          LQ.ui.confirmThen(button, function () {
            pause();
            if (!S.clearCurrent(a && a.id)) { toast('删除失败，请检查浏览器存储空间。'); return; }
            a = null; market = null; disposeChart(); setup(); toast('已删除本场模拟记录');
          });
          return;
        }
        if (busy) return;
        try {
          if (button.hasAttribute('data-sim-resume')) workbench();
          else if (button.hasAttribute('data-sim-new')) setup();
          else if (button.hasAttribute('data-sim-export')) download(a);
          else if (button.hasAttribute('data-sim-order')) { pause(); settleForming(); var v = values(); v.side = Number(button.dataset.simOrder); S.place(a, market.bars, v); if (engine) engine.priceScaleOverride = null; a.report = null; refreshChart(false); sync(); save(); }
          else if (button.hasAttribute('data-sim-close')) { pause(); settleForming(); S.close(a, market.bars, current().c, '手动平仓'); refreshChart(false); sync(); save(); }
          else if (button.hasAttribute('data-sim-cancel-order')) { pause(); settleForming(); a.events.push({ type: 'cancel-order', at: current().t, order: a.pending }); a.pending = null; refreshChart(false); sync(); save(); }
          else if (button.hasAttribute('data-sim-step')) { pause(); advance(1); }
          else if (button.hasAttribute('data-sim-play')) {
            if (playing) pause(); else { choosePreset(''); playing = true; replayLast = 0; button.textContent = 'Ⅱ 暂停行情'; replayFrame = setTimeout(function () { playbackTick(performance.now()); }, 33); }
          }
          else if (button.hasAttribute('data-sim-skip')) { pause(); advance(S.PER_DAY - a.cursor % S.PER_DAY); }
          else if (button.hasAttribute('data-sim-finish')) { pause(); settleForming(); S.close(a, market.bars, current().c, '主动结束考核'); a.pending = null; if (a.status === 'active') a.status = 'ended'; a.endedAt = current().t; S.archive(a); save(); refreshChart(false); sync(); }
          else if (button.hasAttribute('data-sim-tf')) {
            pause(); var firstGroup = aggregation.bars[Math.max(0, Math.floor(engine.view.from))], lastGroup = aggregation.bars[Math.min(aggregation.bars.length - 1, Math.ceil(engine.view.to))];
            var fromIndex = firstGroup._indices[0], toIndex = lastGroup._indices[lastGroup._indices.length - 1];
            a.timeframe = button.dataset.simTf;
            page.querySelectorAll('[data-sim-tf]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.simTf === a.timeframe)); });
            refreshChart(!inspecting);
            if (inspecting) engine.setViewport({ from: aggregation.mapping[fromIndex], to: aggregation.mapping[toIndex] });
            save();
          }
          else if (button.hasAttribute('data-sim-category')) choosePreset(button.dataset.simCategory);
          else if (button.hasAttribute('data-sim-hand')) choosePreset('');
          else if (button.hasAttribute('data-sim-undo')) { a.drawings.pop(); a.report = null; refreshChart(false); sync(); save(); }
          else if (button.hasAttribute('data-sim-delete-mark')) { a.drawings = a.drawings.filter(function (d) { return d.id !== button.dataset.simDeleteMark; }); a.report = null; refreshChart(false); sync(); save(); }
          else if (button.hasAttribute('data-sim-session-jump')) jumpToSession(button.dataset.simSessionJump);
          else if (button.hasAttribute('data-sim-history')) { pause(); discardForming(); inspecting = true; followLatest = false; var end = aggregation.mapping[S.HISTORY - 1]; engine.setViewport({ from: 0, to: end }); sync(); }
          else if (button.hasAttribute('data-sim-focus') || button.hasAttribute('data-sim-live')) focusLatest();
          else if (button.hasAttribute('data-sim-day')) { pause(); discardForming(); inspecting = true; followLatest = false; var index = S.HISTORY + (Number(button.dataset.simDay) - 1) * S.PER_DAY; engine.setViewport({ from: aggregation.mapping[index], to: aggregation.mapping[Math.min(a.cursor, index + S.PER_DAY - 1)] }); sync(); }
          else if (button.hasAttribute('data-sim-trade')) {
            pause(); inspecting = true; var trade = a.trades.find(function (t) { return t.id === button.dataset.simTrade; });
            engine.setViewport({ from: aggregation.mapping[Math.max(0, trade.entryIndex - 90)], to: aggregation.mapping[Math.min(a.cursor, trade.exitIndex + 30)] });
            engine._applyDrawings(trade.evidence.drawings.map(mapDrawing), false); sync();
            toast('正在回看 ' + trade.id + '：显示入场时的标注快照'); page.querySelector('[data-sim-chart]').scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
          else if (button.hasAttribute('data-sim-full')) { var workspace = page.querySelector('.sim-workspace'); if (document.fullscreenElement) await document.exitFullscreen(); else await workspace.requestFullscreen(); }
          else if (button.hasAttribute('data-sim-grade')) grade(button.dataset.simGrade);
        } catch (err) { toast(err.message); }
      });
      function visibility() { if (document.hidden) pause(); }
      document.addEventListener('visibilitychange', visibility);
      activeDestroy = function () { destroyed = true; if (generatingMarket) { stopGeneration(); endGenerationLock(); } pause(); discardForming(); save(); disposeChart(); if (controller) controller.abort(); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('pointerdown', dismissContextMenu, true); document.removeEventListener('fullscreenchange', fullscreenChanged); };
      if (a) { try { ensureMarket(); workbench(); } catch (err) { setup(); toast('历史考核无法载入：' + err.message); } } else setup();
      return page;
    },
    destroy: function () { if (activeDestroy) activeDestroy(); activeDestroy = null; }
  };
})();
