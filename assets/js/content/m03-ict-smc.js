/* 模块三 · ICT / SMC 聪明钱概念（content-b 维护）
 * 内容：6 课 + 7 个教学情景 + 14 条术语。
 * 所有情景均为模拟数据，仅用于教学；不构成任何投资建议。
 */
(function () {
  'use strict';
  var S = LQ.data;

  /* ============================ 教学情景 ============================ */

  S.registerScenario(S.buildScenario({
    id: 'ict-structure',
    title: 'BOS 与 CHoCH：一段趋势如何转折',
    module: 'm03',
    lesson: 'm03-01',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3101,
    startTime: Date.UTC(2025, 8, 1, 9, 0, 0),
    tick: 0.05,
    path: [[0, 100.0], [8, 101.6], [14, 100.9], [24, 103.4], [32, 102.5], [42, 105.0], [50, 104.0], [58, 105.6], [66, 103.4], [74, 104.6], [82, 102.6], [90, 103.4], [99, 101.2]],
    noise: 0.14,
    wick: 0.18,
    volumeBase: 1200,
    volumeOnMove: 1.3,
    panels: { volume: true, ma: [20] },
    events: {
      'prior-high-1': S.hline(0, 99, 101.6, '前高 101.6（突破后转为支撑）', 'neutral'),
      'hl-1': S.marker(14, 100.55, 'HL 更高的低点', 'below', 'bull'),
      'bos-1': S.marker(24, 103.7, 'BOS：收盘突破前高', 'above', 'bull'),
      'hh-2': S.marker(42, 105.3, 'HH + 新的 BOS', 'above', 'bull'),
      'hl-2': S.marker(50, 103.72, 'HL 104.0：多头结构最后防线', 'below', 'bull'),
      'hl-line': S.hline(50, 99, 104.0, '关键 HL 104.0（结构分界线）', 'warn'),
      'mss': S.marker(66, 103.05, 'MSS/CHoCH：收盘跌破 HL，结构转空', 'below', 'bear'),
      'lh': S.marker(74, 104.85, 'LH 更低高点（反弹无力）', 'above', 'bear'),
      'll': S.marker(82, 102.36, 'LL 更低低点（空头 BOS）', 'below', 'bear'),
      'bos-down': S.marker(90, 103.66, 'LH 之后继续下行', 'above', 'bear'),
      'uptrend-box': S.zone(24, 50, 102.5, 105.0, '上升段：HH + HL 序列', 'bull')
    },
    description: '上升趋势连续 BOS 后，价格跌破最后一个 HL，形成 CHoCH/MSS，随后转为 LH + LL 的下降结构。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-liquidity',
    title: '前高前低的止损池：流动性就在那里',
    module: 'm03',
    lesson: 'm03-02',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3102,
    startTime: Date.UTC(2025, 8, 8, 9, 0, 0),
    tick: 0.05,
    path: [[0, 100.8], [10, 101.8], [18, 100.8], [26, 101.85], [34, 100.85], [42, 101.8], [50, 100.7], [60, 102.5], [64, 101.7], [72, 100.3], [78, 99.4], [86, 100.5], [94, 99.6], [99, 100.2]],
    noise: 0.12,
    wick: 0.2,
    volumeBase: 1100,
    volumeOnMove: 1.35,
    overrides: {
      10: { o: 101.75, h: 101.9, l: 101.55, c: 101.65, v: 1400 },
      18: { o: 100.85, h: 100.95, l: 100.7, c: 100.8, v: 1400 },
      26: { o: 101.6, h: 101.9, l: 101.45, c: 101.6, v: 1500 },
      34: { o: 100.95, h: 101.1, l: 100.7, c: 100.85, v: 1500 },
      42: { o: 101.7, h: 101.9, l: 101.6, c: 101.65, v: 1500 },
      50: { o: 100.9, h: 101.0, l: 99.85, c: 100.85, v: 2500 },
      60: { o: 101.8, h: 102.9, l: 101.75, c: 101.9, v: 2700 }
    },
    panels: { volume: true },
    events: {
      'bsl': S.hline(0, 99, 101.85, '买方流动性 Buy-side Liquidity', 'warn'),
      'ssl': S.hline(0, 99, 100.75, '卖方流动性 Sell-side Liquidity', 'warn'),
      'eqh-1': S.marker(10, 102.0, '等高点 EQH：上方挂着空头止损', 'above', 'neutral'),
      'eqh-2': S.marker(26, 102.0, 'EQH 再次确认', 'above', 'neutral'),
      'eqh-3': S.marker(42, 102.0, 'EQH 第三次：止损池越堆越厚', 'above', 'neutral'),
      'eql-1': S.marker(18, 100.6, '等低点 EQL：下方挂着多头止损', 'below', 'neutral'),
      'eql-2': S.marker(34, 100.6, 'EQL 再次确认', 'below', 'neutral'),
      'sweep-low': S.marker(50, 99.6, '扫下方止损后收回（假跌破）', 'below', 'warn'),
      'sweep-high': S.marker(60, 103.05, '扫上方止损后跌回（SFP）', 'above', 'warn'),
      'range-box': S.zone(8, 55, 100.7, 101.9, '盘整区：流动性在两侧堆积', 'info'),
      'drop': S.segment(64, 101.7, 78, 99.4, '止损被吃后加速', 'bear', { arrow: true })
    },
    description: '区间内等高点与等低点反复出现，止损池在两侧堆积；先扫下方止损、再扫上方止损，最后向下加速。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-sweep',
    title: '扫荡 → 位移 → 回踩：一次完整的多头模型',
    module: 'm03',
    lesson: 'm03-03',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3103,
    startTime: Date.UTC(2025, 8, 15, 9, 0, 0),
    tick: 0.05,
    path: [[0, 105.0], [10, 103.8], [18, 104.5], [26, 102.9], [34, 103.6], [42, 101.8], [50, 102.3], [56, 100.9], [62, 101.3], [66, 101.0], [74, 103.9], [80, 104.3], [86, 103.4], [90, 101.95], [95, 103.9], [99, 105.1]],
    noise: 0.13,
    wick: 0.2,
    volumeBase: 1250,
    volumeOnMove: 1.45,
    overrides: {
      66: { o: 101.2, h: 101.35, l: 100.1, c: 101.15, v: 2600 },
      68: { o: 101.43, h: 101.75, l: 101.35, c: 101.7, v: 4100 },
      69: { o: 101.7, h: 102.45, l: 101.65, c: 102.38, v: 5500 },
      70: { o: 102.38, h: 102.75, l: 102.2, c: 102.6, v: 4000 }
    },
    panels: { volume: true, ma: [20] },
    events: {
      'prior-low': S.hline(0, 99, 100.9, '前低 100.9（卖方流动性）', 'neutral'),
      'sweep': S.marker(66, 99.95, '扫荡前低：影线破位、收盘收回', 'below', 'warn'),
      'displacement': S.segment(67, 101.3, 80, 104.3, '位移 Displacement：连续放量阳线', 'bull', { arrow: true }),
      'ob-zone': S.zone(65, 68, 100.95, 101.75, '看涨订单块 OB（扫荡后收回的实体）', 'bull'),
      'fvg-zone': S.zone(68, 70, 101.75, 102.2, 'FVG 公允价值缺口：回踩区', 'info'),
      'ce': S.hline(70, 99, 101.98, '缺口 50%（CE）', 'neutral'),
      'retest': S.marker(90, 101.6, '回踩 FVG：填掉一半以上', 'below', 'bull'),
      'entry': S.marker(92, 103.1, '模型入场点', 'above', 'info'),
      'target': S.hline(90, 99, 105.0, '目标：前高 / 上方流动性', 'bull'),
      'stop': S.hline(80, 99, 100.1, '止损：扫荡低点下方', 'bear')
    },
    description: '价格先扫掉前低止损，然后放量位移向上，留下订单块与 FVG；回踩缺口后延续上涨。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-ob',
    title: '订单块：机构成本区怎么找',
    module: 'm03',
    lesson: 'm03-04',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3104,
    startTime: Date.UTC(2025, 8, 22, 9, 0, 0),
    tick: 0.05,
    path: [[0, 104.0], [8, 102.6], [16, 103.2], [24, 101.5], [28, 101.0], [32, 100.7], [36, 100.9], [42, 103.4], [50, 104.6], [58, 103.5], [66, 101.6], [72, 101.2], [80, 103.8], [88, 105.2], [94, 104.4], [99, 106.0]],
    noise: 0.13,
    wick: 0.2,
    volumeBase: 1200,
    volumeOnMove: 1.4,
    overrides: {
      32: { o: 101.1, h: 101.25, l: 100.6, c: 100.75, v: 1800 },
      33: { o: 100.75, h: 101.5, l: 100.7, c: 101.4, v: 2800 },
      37: { o: 100.9, h: 101.3, l: 100.82, c: 101.25, v: 5800 },
      38: { o: 101.28, h: 101.95, l: 101.22, c: 101.88, v: 4800 },
      39: { o: 101.88, h: 102.4, l: 101.75, c: 102.32, v: 4200 },
      72: { o: 101.7, h: 101.85, l: 100.95, c: 101.6, v: 2200 }
    },
    panels: { volume: true, ma: [20] },
    events: {
      'ob': S.zone(31, 32, 100.6, 101.25, '看涨订单块 OB：位移前最后一根阴线', 'bull'),
      'sweep-low': S.marker(32, 100.5, 'OB 下方先扫掉止损', 'below', 'warn'),
      'displacement': S.segment(34, 101.4, 46, 103.9, '位移：一口气脱离成本区', 'bull', { arrow: true }),
      'fvg': S.zone(37, 39, 101.3, 101.75, '位移留下的 FVG', 'info'),
      'mid-high': S.marker(50, 104.85, '位移高点（第一目标）', 'above', 'bull'),
      'retest': S.marker(72, 100.85, '回踩 OB：影线插进去又被买回', 'below', 'bull'),
      'entry': S.marker(74, 102.2, 'OB 内入场', 'above', 'info'),
      'stop': S.hline(60, 99, 100.4, '止损：OB 下沿之外', 'bear'),
      'target': S.hline(72, 99, 105.2, '目标：前高上方流动性', 'bull')
    },
    description: '下跌末端出现最后一根阴线（订单块），随后放量位移向上；价格回踩 OB 获得支撑后继续上涨。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-fvg',
    title: '公允价值缺口：三根 K 线之间的真空带',
    module: 'm03',
    lesson: 'm03-04',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3105,
    startTime: Date.UTC(2025, 8, 29, 9, 0, 0),
    tick: 0.05,
    path: [[0, 104.5], [8, 103.0], [14, 103.6], [20, 102.2], [26, 102.8], [32, 101.6], [36, 102.0], [42, 104.8], [48, 105.6], [56, 104.8], [62, 103.6], [70, 104.2], [78, 105.8], [86, 105.2], [94, 106.6], [99, 107.2]],
    noise: 0.13,
    wick: 0.18,
    volumeBase: 1200,
    volumeOnMove: 1.4,
    overrides: {
      39: { o: 102.94, h: 103.45, l: 102.8, c: 103.35, v: 4200 },
      40: { o: 103.35, h: 104.15, l: 103.3, c: 104.05, v: 4900 },
      41: { o: 104.05, h: 104.6, l: 103.85, c: 104.45, v: 5200 }
    },
    panels: { volume: true, ma: [20] },
    events: {
      'mss-up': S.marker(42, 104.95, 'MSS：突破下跌结构最后一个 LH', 'above', 'bull'),
      'impulse': S.segment(33, 102.0, 48, 105.4, '位移腿 impulse', 'bull', { arrow: true }),
      'fvg': S.zone(39, 41, 103.45, 103.85, 'FVG：三根 K 线中间的真空带', 'info'),
      'ce': S.hline(41, 99, 103.65, '缺口 50%（CE）', 'neutral'),
      'fill': S.marker(62, 103.25, '回踩到缺口下沿（几乎全补）', 'below', 'bull'),
      'entry': S.marker(64, 104.15, '缺口内限价入场', 'above', 'info'),
      'target': S.hline(62, 99, 105.6, '目标一：前高', 'bull'),
      'stop': S.hline(56, 99, 102.6, '止损：缺口完全失效', 'bear')
    },
    description: '快速上涨在三根 K 线之间留下未成交价格带（FVG）；价格回补 50% 后继续上攻。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-premium',
    title: '溢价 / 折价与 OTE：只在对的一侧入场',
    module: 'm03',
    lesson: 'm03-05',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3106,
    startTime: Date.UTC(2025, 9, 6, 9, 0, 0),
    tick: 0.05,
    path: [[0, 100.4], [8, 102.4], [14, 101.4], [26, 105.0], [34, 103.9], [46, 107.6], [54, 106.4], [62, 110.2], [70, 108.6], [78, 107.2], [86, 105.8], [92, 104.0], [98, 104.8], [106, 106.9], [113, 108.4], [119, 109.6]],
    noise: 0.15,
    wick: 0.19,
    volumeBase: 1250,
    volumeOnMove: 1.35,
    panels: { volume: true, ma: [20] },
    events: {
      'range-high': S.hline(null, 119, 110.2, '交易区间上沿（deal range high）', 'bear'),
      'range-low': S.hline(null, 119, 100.4, '交易区间下沿（deal range low）', 'neutral'),
      'eq': S.hline(null, 119, 105.3, '均衡点 EQ 50%', 'neutral'),
      'premium': S.zone(62, 119, 105.3, 110.2, '溢价区 Premium：只找做空', 'bear'),
      'discount': S.zone(62, 119, 100.4, 105.3, '折价区 Discount：只找做多', 'bull'),
      'ote': S.zone(86, 100, 102.5, 104.2, 'OTE 0.62–0.79 入场带', 'info'),
      'high': S.marker(62, 110.55, '触及区间上沿：溢价', 'above', 'bear'),
      'pullback': S.marker(92, 103.72, '回踩进折价 + OTE', 'below', 'bull'),
      'entry': S.marker(96, 105.1, '折价区入场', 'above', 'info'),
      'target': S.hline(92, 119, 109.6, '目标：回到区间上沿附近', 'bull')
    },
    description: '先画好交易区间与 50% 均衡点，只在折价区的 OTE 带做多、溢价区做空；价格回踩 OTE 后回到区间上沿。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'ict-model',
    title: '完整模型：扫荡 → 位移 → 回踩 → 入场',
    module: 'm03',
    lesson: 'm03-06',
    symbol: 'SIM-1H',
    timeframe: '1H',
    seed: 3107,
    startTime: Date.UTC(2025, 9, 13, 9, 0, 0),
    tick: 0.05,
    path: [[0, 102.0], [8, 103.0], [14, 102.4], [22, 104.2], [28, 103.6], [34, 105.6], [38, 106.4], [44, 104.6], [50, 102.6], [56, 101.0], [62, 101.6], [68, 104.4], [74, 103.6], [82, 101.2], [90, 100.0], [99, 98.8]],
    noise: 0.14,
    wick: 0.2,
    volumeBase: 1300,
    volumeOnMove: 1.45,
    overrides: {
      38: { o: 105.7, h: 106.6, l: 105.4, c: 105.45, v: 2900 }
    },
    panels: { volume: true },
    events: {
      'prior-high': S.hline(0, 99, 105.6, '前高：买方流动性池', 'neutral'),
      'sweep': S.marker(38, 106.8, '第 1 步 · 扫荡前高（Sweep）', 'above', 'warn'),
      'displacement': S.segment(40, 105.2, 54, 101.6, '第 2 步 · 位移：一口气砸穿结构', 'bear', { arrow: true }),
      'mss': S.marker(48, 102.75, 'MSS：跌破上升结构确认转空', 'below', 'bear'),
      'ob': S.zone(36, 38, 105.66, 106.43, '看跌订单块 OB（位移前最后一根阳线）', 'bear'),
      'fvg': S.zone(42, 44, 104.41, 105.07, 'FVG：位移留下的大缺口', 'info'),
      'retrace': S.marker(68, 104.75, '第 3 步 · 回踩 FVG/OB 区域', 'above', 'bear'),
      'entry': S.marker(70, 104.45, '第 4 步 · 模型入场', 'above', 'info'),
      'stop': S.hline(60, 99, 106.2, '止损：扫荡高点之外', 'bear'),
      'tp1': S.hline(68, 99, 100.9, 'TP1：前低', 'bull'),
      'tp2': S.hline(68, 99, 98.8, 'TP2：下方流动性', 'bull')
    },
    description: '先扫前高拿流动性，再位移跌破结构（MSS），回踩 OB/FVG 后入场做空，止损放在扫荡高点之外，目标前低与下方流动性。'
  }));

  /* ============================ 模块注册 ============================ */
  LQ.content.registerModule({
    id: 'm03',
    order: 3,
    stage: 3,
    stageName: '阶段三 · 机构思维框架',
    title: 'ICT/SMC 聪明钱概念',
    en: 'ICT / Smart Money Concepts',
    tagline: '把“假突破”翻译成“流动性扫荡”，把“回踩”翻译成“订单块”。',
    summary: '这一模块用 ICT/SMC 的语言重新解释价格行为：市场结构如何确认与转折、前高前低为什么是磁铁、扫荡和位移怎么区分真假突破，以及订单块、FVG、溢价折价如何组成一套可复盘的入场模型。这套框架属于经验方法、存在争议与失效场景，不构成投资建议，请先用模拟盘验证并控制风险。',
    minutes: 110,
    level: '进阶',
    accent: '#8b7cf6',
    icon: 'structure',
    outcomes: [
      '能用 BOS / CHoCH / MSS 给任意一张图标注结构，而不是凭感觉说“多头”',
      '能画出流动性池，分清“扫荡”与“真突破”，并用位移做二次确认',
      '能找到订单块与 FVG，知道它们何时有效、何时直接失效',
      '能按“扫荡→位移→回踩→入场”四步写出带止损止盈的模拟交易计划'
    ],
    lessons: [
      {
        id: 'm03-01',
        title: '市场结构：BOS、CHoCH 与 MSS',
        en: 'Market Structure: BOS, CHoCH & MSS',
        minutes: 18,
        level: '进阶',
        summary: '用摆动点的“创新高 / 跌破前低”给趋势下定义，分清结构延续与结构转折。',
        outcomes: [
          '能在一张图上标出最近的高低点序列，并用它判断当前是上升结构、下降结构还是震荡',
          '能区分 BOS、CHoCH 与 MSS，知道三者出现的先后关系',
          '能用“收盘确认 + 位移”过滤掉大部分假结构信号'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '想象你在一栋没有电梯的楼里往上爬。每上一层的平台都比上一层高，这就是“更高高点 + 更高低点”的上升结构。某天你发现，脚下的平台突然比上一层的平台低了——不是你多走了一步，而是这栋楼的图纸被改了。市场结构的转折，本质上就是这种“台阶方向”的改变。'
          },
          {
            type: 'p',
            text: '在 ICT/SMC 这套语言里，市场结构（Market Structure）不是用指标算出来的，而是用**摆动点**（swing point）画出来的：把最近几个明显的波峰、波谷按时间顺序排好，比较它们的高低关系。**结构突破**（Break of Structure, BOS）指价格沿原方向越过最近一个摆动点，说明趋势还在延续；**性质转变**（Change of Character, CHoCH）指价格第一次反向突破结构点，说明节奏被打断，可能转入震荡或反转。这套语言里最常用的三个信号，下面一次讲清。'
          },
          {
            type: 'list', items: [
              '**BOS 结构突破**：上升结构中，收盘价越过前一个摆动高点；下降结构中，收盘价跌破前一个摆动低点。它回答的是“趋势还在不在”。',
              '**CHoCH 性质转变**：上升结构中，收盘价第一次跌破最近一个已确认的更高低点；下降结构对称。它回答的是“节奏有没有变”。',
              '**MSS 市场结构转变**：CHoCH 发生在一次流动性扫荡之后，并且伴随明显的位移（Displacement，连续大实体 K 线）。它回答的是“转折是否得到确认”。'
            ]
          },
          {
            type: 'table',
            head: ['信号', '触发条件', '在说什么', '常见误用'],
            rows: [
              ['BOS', '收盘越过最近摆动点，方向与趋势一致', '趋势延续，回踩偏多 / 偏空', '用影线突破当确认'],
              ['CHoCH', '第一次反向收盘突破结构点', '节奏被打断，可能转震荡', '一出现就反手重仓'],
              ['MSS', '扫荡 + 位移 + 反向破结构', '转折得到二次确认', '忽略位移，把普通回调当 MSS']
            ],
            caption: '三者不是互斥概念，而是同一条证据链上的不同阶段。'
          },
          {
            type: 'chart',
            scenario: 'ict-structure',
            caption: '图 1 · 上升结构如何被 CHoCH 打断、再转成下降结构（模拟数据，仅用于教学）',
            height: 430,
            steps: [
              {
                title: '第 1 步：先确认多头结构',
                text: '标注 `hl-1` 是更高的低点，`prior-high-1` 是它前面的前高；价格随后在 `bos-1` 处收盘越过前高，完成第一次 BOS。先有 HL 抬高，再有 BOS，多头结构才算成立，缺一不可。',
                annotations: ['prior-high-1', 'hl-1', 'bos-1'],
                focus: { from: 4, to: 30 }
              },
              {
                title: '第 2 步：BOS 连续出现，但要盯住最后防线',
                text: '`hh-2` 处价格再创新高并完成第二次 BOS，说明趋势在延续；此时真正要记住的是 `hl-2` 这个更高的低点，`hl-line` 把它画成一条分界线——它一破，多头结构就失效。',
                annotations: ['hh-2', 'hl-2', 'hl-line'],
                focus: { from: 28, to: 56 }
              },
              {
                title: '第 3 步：CHoCH / MSS 出现',
                text: '价格在 `mss` 处收盘跌破 104.0 的 HL，形成 CHoCH；由于此前上方刚做过一次冲高，这里可以被视为 MSS。注意反弹到 `lh` 时没能回到前高，说明卖方开始占优。',
                annotations: ['hl-line', 'mss', 'lh'],
                focus: { from: 52, to: 78 }
              },
              {
                title: '第 4 步：结构反转后的确认',
                text: '`ll` 处价格跌破前一个摆动低点，完成空头方向的 BOS；`bos-down` 之后反弹依旧没有创出更高高点，下降结构成立。到这里才谈得上“顺着新结构找空”，而不是在 CHoCH 那一刻就追。',
                annotations: ['mss', 'lh', 'll', 'bos-down'],
                focus: { from: 72, to: 99 }
              }
            ]
          },
          {
            type: 'list', items: [
              '**规则一 · 只用已收盘的 K 线**：盘中影线刺破不算，必须等这根 K 线收盘再看，否则同一根 K 线里你会来回改结论。',
              '**规则二 · 摆动点要左右确认**：常用做法是要求左右各 2 根 K 线都不超过它，避免把一根毛刺当成结构点。',
              '**规则三 · 先大后小**：先在 4H / 1H 上确定主结构，再到 15m / 5m 上找入场；小级别的 CHoCH 很可能只是大级别的一次回调。',
              '**规则四 · 结构点要写下来**：把最近一个 HL、LH 的具体价格记在交易计划里，破位时按计划执行，而不是临场感觉。'
            ]
          },
          {
            type: 'callout', tone: 'key', title: '一句话记住',
            text: 'BOS 是“趋势还在”的证据，CHoCH 是“节奏变了”的警报，MSS 是“转折确认”的判决书。三者按顺序出现，才值得你改变方向。'
          },
          {
            type: 'p',
            text: '**什么时候这套框架会失效？** 结构判定最大的敌人是**震荡市**：在窄幅区间里，价格会反复上下穿越摆动点，BOS 和 CHoCH 一天出现好几次，每一次都像真的。另一个失效场景是**重要数据或新闻**，一根巨量 K 线可以直接击穿多个结构位，让所有“结构点”瞬间过期。所以这套框架必须配上环境过滤：区间中部不标结构、数据窗口不交易、大级别趋势明确时不逆势找小反转。'
          },
          {
            type: 'checklist', title: '复盘这张图时，用这四条自检',
            items: [
              '我标的最高点、最低点，是不是“已确认的摆动点”，而不是随手画的高点？',
              '这次突破是收盘突破，还是只有影线突破？',
              '如果出现了 CHoCH，它前面有没有扫荡和位移？',
              '我准备进场的方向，和大一级别结构是同向还是逆向？'
            ]
          },
          {
            type: 'p',
            text: '最后要诚实地说：ICT/SMC 是一套**经验框架**，不是被学术界验证过的定价理论。它把“假突破、止损被扫、机构建仓”这些现象组织成了可以复盘的流程，但机构到底怎么想，我们无法直接观测。请务必用模拟盘或极小仓位验证，把“结构判定”当成提高胜率的过滤器，而不是预测未来的水晶球。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '上升趋势中，价格收盘跌破最近一个已确认的更高低点（HL），按本课定义这首先意味着什么？',
              options: [
                '趋势已经确认转空，可以立刻反手做空',
                '出现 CHoCH，趋势可能由多转空，但还需要位移与回踩来确认',
                '只是一次普通回调，应该继续加仓做多',
                '说明前高一定会被再次突破'
              ],
              answer: 1,
              why: '跌破最后一个 HL 是 CHoCH 的第一信号，说明节奏被打断；但框架要求配合流动性与位移确认，单凭一次跌破不足以直接反手。'
            },
            {
              q: '下面哪一种情况不能算作一次有效的 BOS？',
              options: [
                '收盘价站上前一个摆动高点后继续上涨',
                '影线刺破前高但收盘又跌回区间内',
                '回调结束后再次收盘突破前高',
                '上升结构中收盘突破前一个摆动高点'
              ],
              answer: 1,
              why: 'BOS 要求收盘越过结构点；只有影线刺破、收盘收回，属于流动性扫荡的典型形态，恰恰是“假突破”的候选。'
            },
            {
              q: '为什么 ICT 框架通常要求 MSS 之前先出现流动性扫荡？',
              options: [
                '因为扫荡可以让散户不敢进场',
                '因为扫荡把前高前低的止损单吃掉，机构更容易反向推动价格',
                '因为扫荡一定会带来反转',
                '因为扫荡可以精确预测反转点位'
              ],
              answer: 1,
              why: '扫荡的意义是“清掉障碍并获取对手盘”，有了这个前提，随后的位移与结构破位才更可能延续。反转从不保证发生。'
            }
          ]
        },
        sources: [
          { title: '交易中的市场结构转变（MSS）', url: 'https://www.fxopen-zh.com/cn/trading-skills/market-structure-shift-meaning-and-use-in-ict-trading-3/', note: 'MSS 的定义与使用场景' },
          { title: 'ICT Trading Strategy: Order Blocks, FVGs and Killzones（ThinkMarkets）', url: 'https://www.thinkmarkets.com/en/trading-academy/technical-analysis/ict-trading-strategy-smart-money-for-inner-circle-traders/' },
          { title: 'ICT Trading Strategy: The Core Framework Explained', url: 'https://www.theinnercircletraders.com/ict-trading-strategy-the-core-framework-explained/' }
        ]
      },
      {
        id: 'm03-02',
        title: '流动性：前高前低与止损池',
        en: 'Liquidity: Prior Highs/Lows & Stop Pools',
        minutes: 17,
        level: '进阶',
        summary: '为什么前高前低总是被“精确”刺一下？把止损单看成燃料，理解价格的磁铁效应。',
        outcomes: [
          '能在一张图上圈出买方流动性与卖方流动性所在的位置',
          '理解“止损池”为什么堆在前高前低和等高等低处，并能画出 EQH / EQL',
          '能判断一次刺破是“取流动性”还是“真突破”的第一层证据'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '冬天山坡上积了很厚的雪，平时安安静静。有人在山顶放了一枪，积雪顺着坡面轰然而下——那一枪本身没多大能量，真正推动雪崩的是早就堆在那里的雪。市场里的“流动性”就是这层积雪：前高、前低后面堆着大量止损单和突破单，价格只要轻轻一戳，就可能引发连锁成交。'
          },
          {
            type: 'p',
            text: '在 ICT/SMC 框架里，**流动性**（Liquidity）不是一个指标，而是一种对“订单在哪里”的推断：散户习惯把止损放在前高之上、前低之下，把突破单挂在前高前低的另一侧；做市商和机构知道这些位置，于是价格经常被推过去“取走”这些订单。前高上方的止损叫**买方流动性**（Buy-side Liquidity），因为触发后是买入成交；前低下方的叫**卖方流动性**（Sell-side Liquidity）。注意，这是行为推断，不是你能在行情软件里直接看到的挂单数据。止损池通常堆在下面几个位置：'
          },
          {
            type: 'list', items: [
              '**前高与前低**：最经典的止损位，尤其是刚形成的、被反复提到的高低点。',
              '**等高点与等低点**（Equal Highs / Equal Lows，EQH / EQL）：两次以上几乎相同的高点或低点，说明一批人的止损挤在同一个价位，磁铁效应更强。',
              '**整数关口与日内高低点**：心理价位、昨日高低点、亚洲盘区间高低点，同样是止损密集区。',
              '**趋势线与通道边缘**：画得越“标准”，相信的人越多，止损越集中。'
            ]
          },
          {
            type: 'table',
            head: ['类型', '位置', '触发后成交方向', '理论上的作用'],
            rows: [
              ['买方流动性', '前高、等高点上方', '空头止损 + 突破买入', '价格上冲取单，容易冲高回落'],
              ['卖方流动性', '前低、等低点下方', '多头止损 + 突破卖出', '价格下探取单，容易探底回升'],
              ['均衡点', '区间 50% 位置', '双向挂单', '多空成本分界，常作中枢']
            ],
            caption: '“触发后成交方向”是理解扫荡的关键：谁被止损，谁就成了对手盘。'
          },
          {
            type: 'chart',
            scenario: 'ict-liquidity',
            caption: '图 1 · 等高点与等低点把止损池标了出来（模拟数据，仅用于教学）',
            height: 430,
            steps: [
              {
                title: '第 1 步：先画出盘整区的两条边',
                text: '`range-box` 标出盘整区，上沿大约 101.9、下沿大约 100.7。先不要猜方向，先把这两条边画出来——它们是后面所有流动性故事的舞台，也是判断“有没有取到单”的基准。',
                annotations: ['range-box', 'bsl', 'ssl'],
                focus: { from: 4, to: 45 }
              },
              {
                title: '第 2 步：等高点 = 上方止损池',
                text: '`eqh-1`、`eqh-2`、`eqh-3` 三次摸到几乎相同的位置，说明上方堆着一批空头止损与突破买单。`bsl` 这条线就是买方流动性；价格越是反复测试不破，这个池子就越“厚”。',
                annotations: ['range-box', 'eqh-1', 'eqh-2', 'eqh-3', 'bsl'],
                focus: { from: 4, to: 48 }
              },
              {
                title: '第 3 步：下方的等低点同样在积攒',
                text: '`eql-1`、`eql-2` 把下方多次触及的位置连起来，`ssl` 就是卖方流动性所在。到这里你应形成一个假设：上下两边都有止损池，价格最终会先“取”其中一边，再决定方向。',
                annotations: ['eql-1', 'eql-2', 'ssl'],
                focus: { from: 12, to: 46 }
              },
              {
                title: '第 4 步：两次扫荡，方向才出来',
                text: '`sweep-low` 先向下刺破 EQL 后收回，`sweep-high` 再向上刺破 EQH 后跌回区间。两次都是“取完单就走”，随后 `drop` 加速下跌——这说明上方的突破是假的，下方被扫掉的是真止损。',
                annotations: ['sweep-low', 'sweep-high', 'drop'],
                focus: { from: 40, to: 84 }
              }
            ]
          },
          {
            type: 'p',
            text: '**怎么区分“取流动性”与“真突破”？** 只看一根影线是分不出来的，必须看**刺破之后的动作**。取流动性的典型剧本是：刺破关键位 → 触发一批止损 → 但价格没有跟随，反而快速收回区间 → 随后朝反方向位移。真突破的剧本则是：收盘站到关键位之外 → 回踩确认 → 继续推进。两条证据里，“收盘位置”和“有没有位移”是核心，影线长度只是线索。还要记住一点：扫荡可以发生多次，同一个池子被反复测试，直到某一方彻底失去耐心。'
          },
          {
            type: 'callout', tone: 'warn', title: '这套框架容易翻车的地方',
            text: '趋势日里，前高会被一次次突破，每一次都像“扫荡失败”；数据公布前后，流动性瞬间变化，止损池的位置会被瞬间改写。所以“流动性”只能当假设，不能当承诺；把它和你的结构、时段过滤一起用，胜率才可能稳定。'
          },
          {
            type: 'checklist', title: '开盘前 3 分钟，给自己列一张流动性地图',
            items: [
              '今天上方最近的两个前高 / 等高点在哪？',
              '下方最近的两个前低 / 等低点在哪？',
              '价格现在离哪一边更近？如果被扫，反方向的第一目标在哪？',
              '今天有没有重要数据？有的话这一段流动性地图作废多少？'
            ]
          },
          {
            type: 'p',
            text: '需要强调：所谓“机构故意扫止损”是一种**叙事框架**，你无法从 K 线证明谁在操作。我们能观测到的只有“刺破后是否收回、是否有位移”这些结果。请把本课内容当成一套组织观察的语言，用模拟盘记录每次扫荡后续 10 根 K 线的表现，自己统计它在你交易的品种上到底有没有统计优势。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '前低下方通常被称作哪种流动性？触发后主要是谁在成交？',
              options: [
                '买方流动性，触发空头回补',
                '卖方流动性，触发多头止损卖出',
                '中性流动性，触发限价单成交',
                '买方流动性，触发多头加仓'
              ],
              answer: 1,
              why: '前低下方的止损是多头的保护性卖单，被击穿后属于主动卖出成交，所以叫卖方流动性。'
            },
            {
              q: '价格刺破前高后立刻收回区间内，最合理的解读是？',
              options: [
                '突破了，应该追多',
                '可能是在取买方流动性，需要看是否出现反方向位移',
                '说明这个前高完全没用，以后不用再看',
                '说明主力在吸筹，可以直接重仓做多'
              ],
              answer: 1,
              why: '刺破后收回是扫荡的典型特征，但还要等位移与结构确认；单凭一次收回就重仓，是把假设当结论。'
            },
            {
              q: '等高点（EQH）为什么比普通前高更值得关注？',
              options: [
                '因为它在图上更好看',
                '因为两次以上触及相同价位，说明止损与挂单更集中',
                '因为等高点出现后一定会大跌',
                '因为等高点代表成交量最大'
              ],
              answer: 1,
              why: '等高点意味着多个时间点的人都把止损放在相近位置，止损池更集中，但最终往哪边走仍需其他证据。'
            }
          ]
        },
        sources: [
          { title: 'Liquidity in Trading: Complete Guide — Order Blocks, Raids & Kill Zones', url: 'https://www.quantum-algo.com/blog/guides/liquidity-trading-complete-guide/' },
          { title: 'ICT Trading Strategy: Order Blocks, FVGs and Killzones（ThinkMarkets）', url: 'https://www.thinkmarkets.com/en/trading-academy/technical-analysis/ict-trading-strategy-smart-money-for-inner-circle-traders/' },
          { title: 'ICT 核心概念：什么是内圈交易', url: 'https://www.fxopen-zh.com/cn/trading-skills/what-are-the-inner-circle-trading-concepts-3/' }
        ]
      },
      {
        id: 'm03-03',
        title: '流动性扫荡：假突破的另一种说法',
        en: 'Liquidity Sweep',
        minutes: 18,
        level: '进阶',
        summary: '刺破前低又收回，是陷阱还是机会？学会用“扫荡 + 位移”过滤假突破。',
        outcomes: [
          '能用四个特征识别一次典型的流动性扫荡',
          '能区分扫荡、假突破与真突破，并知道各自后续怎么走',
          '能按“扫荡→位移→回踩”的顺序等待入场，而不是在刺破瞬间追单'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '打篮球时，进攻球员先做一个逼真的投篮假动作，防守人跳起来封盖，他却收球从旁边突破。假动作骗的不是球，是你的反应。流动性扫荡就是价格做的假动作：它先突破前低，把追空的人和抄底多头的止损一起骗出来，然后才朝真正的方向走。'
          },
          {
            type: 'p',
            text: '**流动性扫荡**（Liquidity Sweep，也叫 stop run、SFP）指价格短暂刺穿前高或前低，触发一批止损，却没有延续，而是迅速收回。它的关键不是“破没破”，而是**破完之后的收盘位置和后续走势**。在 ICT/SMC 的叙事里，扫荡是机构“清场”的动作：先让对手的止损成交，自己拿到足够的对手盘，再推动价格离开这个区域。'
          },
          {
            type: 'list', items: [
              '**刺破关键位**：价格必须真的越过前高 / 前低，只差一点不算扫荡。',
              '**收盘收回**：K 线收盘回到结构点之内，影线留下“长针”，说明突破没有获得认可。',
              '**位移跟随**：扫荡之后出现连续大实体 K 线，快速离开扫荡区域，这是机构参与的证据。',
              '**留下缺口**：位移常在中间留下 FVG，回踩缺口时是风险收益比较好的位置。'
            ]
          },
          {
            type: 'table',
            head: ['形态', '刺破关键位', '收盘位置', '后续走势', '含义'],
            rows: [
              ['流动性扫荡', '刺破', '收回结构内', '反向位移', '止损被吃，方向可能反转'],
              ['假突破', '刺破', '收回但横盘', '继续震荡', '没有位移，方向未定'],
              ['真突破', '站上', '收在结构外', '回踩后延续', '结构被认可，趋势延续']
            ],
            caption: '三者外形相近，区别在于收盘与位移；不要用“影线长”单独下结论。'
          },
          {
            type: 'chart',
            scenario: 'ict-sweep',
            caption: '图 1 · 扫前低 → 位移 → 回踩 FVG → 延续上涨（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先找到被瞄准的前低',
                text: '`prior-low` 是下跌过程中最后一个明显前低，大约 100.9。它是卖方流动性的入口：一旦跌破，多头止损会被触发，同时也吸引追空的突破单——这两种单子都是别人的燃料。',
                annotations: ['prior-low'],
                focus: { from: 28, to: 60 }
              },
              {
                title: '第 2 步：看这根长下影 K 线',
                text: '`sweep` 标注的那根 K 线最低到了 100.1，明显跌破前低，但收盘回到 101.15，重新站回前低上方。影线是“取单”的痕迹，收盘才是市场最终表态，两者合起来才是扫荡。',
                annotations: ['prior-low', 'sweep'],
                focus: { from: 56, to: 72 }
              },
              {
                title: '第 3 步：位移把方向说清楚',
                text: '`displacement` 这一段几乎全是放量阳线，从 101 一带一口气推到 104 上方，中间留下 `fvg-zone` 的缺口和 `ob-zone` 的订单块。没有这段位移，前面的收回可能只是慢慢阴跌中的一次反抽。',
                annotations: ['sweep', 'ob-zone', 'displacement', 'fvg-zone'],
                focus: { from: 62, to: 82 }
              },
              {
                title: '第 4 步：回踩才是入场点',
                text: '`retest` 处价格回落到缺口下沿附近，低点正好踩进 `fvg-zone`，但没有跌破 `stop` 这条扫荡低点防线；随后 `entry` 之后开始新一轮上涨，`target` 指向前高上方的流动性。',
                annotations: ['fvg-zone', 'retest', 'entry', 'stop', 'target'],
                focus: { from: 82, to: 99 }
              }
            ]
          },
          {
            type: 'flow',
            caption: '把扫荡变成可执行的流程，而不是看图说话。',
            items: ['找前高/前低', '等刺破', '等收盘收回', '等位移', '等回踩 OB/FVG', '入场并设止损']
          },
          {
            type: 'p',
            text: '为什么扫荡之后更容易出现反向行情？一种解释是止损连锁：跌破前低时，多头止损变成市价卖单，追空者同时卖出，价格被“额外”的卖压推低；等这批单子成交完，卖压突然消失，机构在低位接到的筹码反而推动价格快速反弹。另一种解释更朴素：关键位被破后，原来的多头结构已经不再成立，市场的持仓成本被重置。两种解释都无法被 K 线证实，但它们的共同结论是——**刺破之后的走势比刺破本身更重要**。'
          },
          {
            type: 'callout', tone: 'pitfall', title: '最常见的三个误用',
            text: '第一，看到长下影就当扫荡，忽略收盘位置；第二，扫荡出现后立刻满仓抄底，不等位移和回踩；第三，把“扫荡”当成必然反转，在趋势日里被连续单边行情打脸。请把扫荡当成“提高关注度”的信号，而不是开仓信号。'
          },
          {
            type: 'p',
            text: '**什么情况下扫荡会直接失效？** 如果价格刺破前低后没有收回，而是收在前低下方并继续走低，那说明这是真突破，扫荡假设当场作废；如果收回之后连续多根 K 线横盘、没有位移，说明多空只是暂时平衡，不宜把回踩当机会。另一个容易忽略的条件是**级别**：15 分钟图上的扫荡在 4 小时图上可能只是一根普通阴线，所以一定要问自己“这次扫荡针对的是哪一级别的流动性”。\n最后再强调一次：扫荡属于经验框架，不同交易者对同一根 K 线可能给出完全不同的标注。它的价值在于强制你等待确认、把止损放对位置；它不能保证反转。请先在模拟盘里统计：在你交易的品种与时段上，扫荡后 10 到 20 根 K 线的表现是否真的优于随机。'
          },
          {
            type: 'checklist', title: '遇到“破位又收回”时，按顺序问自己',
            items: [
              '被刺破的是哪个级别的前高 / 前低？',
              '这根 K 线收盘在哪里？有没有收回结构内？',
              '接下来有没有连续大实体 K 线（位移）？',
              '回踩位置在哪？止损放在扫荡低点之外，我能不能接受？'
            ]
          }
        ],
        quiz: {
          questions: [
            {
              q: '判断一次跌破前低是不是“流动性扫荡”，最关键的两条证据是？',
              options: [
                '影线够长、成交量够小',
                '收盘收回前低上方、随后出现反向位移',
                '跌破幅度超过 1%、连续三根阴线',
                '出现 MACD 底背离、RSI 超卖'
              ],
              answer: 1,
              why: '扫荡看的是“刺破后收回”与“收回后位移”，影线只是线索；指标背离不属于 ICT 框架的确认条件。'
            },
            {
              q: '扫荡出现后，比较合理的入场时机是？',
              options: [
                '扫荡 K 线还没收盘时立刻抄底',
                '等位移出现、价格回踩 OB 或 FVG 时再考虑',
                '等价格涨回前高再追多',
                '只要看到长影线就满仓'
              ],
              answer: 1,
              why: '回踩结构位能给出更近的止损和更好的风险收益比；未收盘就进场等于押注这根 K 线一定收回来。'
            },
            {
              q: '价格刺破前低后没有收回、直接收在前低下方并继续下跌，说明什么？',
              options: [
                '扫荡失败，这是真突破，扫荡假设应当作废',
                '这是二次扫荡，可以继续抄底',
                '一定会反弹到前低',
                '说明流动性不存在'
              ],
              answer: 0,
              why: '扫荡的核心是“收回”；收在结构外并延续，说明这次破位被市场接受，原假设应立刻放弃。'
            }
          ]
        },
        sources: [
          { title: 'Liquidity in Trading: Complete Guide — Order Blocks, Raids & Kill Zones', url: 'https://www.quantum-algo.com/blog/guides/liquidity-trading-complete-guide/' },
          { title: 'ICT FVG vs Order Block: Differences and How to Use Both', url: 'https://www.theinnercircletraders.com/fvg-vs-order-block/' },
          { title: '交易中的市场结构转变（MSS）', url: 'https://www.fxopen-zh.com/cn/trading-skills/market-structure-shift-meaning-and-use-in-ict-trading-3/' }
        ]
      },
      {
        id: 'm03-04',
        title: '订单块 OB 与公允价值缺口 FVG',
        en: 'Order Block & Fair Value Gap',
        minutes: 20,
        level: '进阶',
        summary: '一个找“机构成本区”，一个找“没成交的真空带”，两张图把这两个核心概念讲透。',
        outcomes: [
          '能找出位移前最后一根反向 K 线，并把它画成订单块',
          '能识别三根 K 线之间留下的 FVG，并知道 50% 位置（CE）的意义',
          '能说清 OB 与 FVG 的区别，以及它们失效的条件'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲两个生活场景',
            text: '订单块像批发商的“进货价”：他上一次在这个价位大批买入，价格再回到这里时，他大概率还愿意再买一次。公允价值缺口像楼梯少了一级：价格一口气跨了三级台阶，中间那级没人踩过，回头时往往要补踩一下才安心。前者是成本区，后者是真空带——两个概念都来自同一个动作：快速位移。'
          },
          {
            type: 'p',
            text: '**订单块**（Order Block, OB）是 ICT/SMC 框架里对“机构成本区”的称呼：在快速位移之前，最后一根**反向** K 线所在的区域。上涨位移之前的最后一根阴线叫看涨订单块，下跌位移之前的最后一根阳线叫看跌订单块。之所以强调“反向”，是因为框架假设：机构在拉升或砸盘前，会先在这根 K 线里悄悄吸筹或派发，而这根 K 线的价格区间就成了后来的成本参考。识别订单块只需三步：'
          },
          {
            type: 'list', items: [
              '**先找位移**：没有明显位移，就没有“机构参与”的证据，也就不值得标 OB。',
              '**回看位移前的最后一根反向 K 线**：它的开盘价到收盘价（有时包含影线）构成 OB 区间。',
              '**等回踩**：价格回到 OB 区间时观察反应——出现长下影、吞没或再度位移，OB 才算被验证。'
            ]
          },
          {
            type: 'chart',
            scenario: 'ict-ob',
            caption: '图 1 · 看涨订单块：位移前最后一根阴线 + 回踩验证（模拟数据，仅用于教学）',
            height: 430,
            steps: [
              {
                title: '第 1 步：先看这根阴线',
                text: '`ob` 标出的区域是 100.6 到 101.25，对应下跌末端的一根阴线；它下方 `sweep-low` 还先扫掉了一次止损。这里不能只看“跌得久”，必须等到后面出现明显位移，才回头确定它是 OB。',
                annotations: ['ob', 'sweep-low'],
                focus: { from: 24, to: 40 }
              },
              {
                title: '第 2 步：位移确认机构参与',
                text: '`displacement` 这一段连续阳线从 101 附近拉到 104 上方，`mid-high` 是这波位移的高点。位移越干脆、越放量，前面的 OB 越值得信任；如果只是磨磨蹭蹭涨上去，OB 的含金量要打折扣。',
                annotations: ['ob', 'displacement', 'mid-high'],
                focus: { from: 30, to: 54 }
              },
              {
                title: '第 3 步：回踩 OB 是入场窗口',
                text: '`retest` 处价格回落到 101 附近，影线插进 `ob` 区间但收盘收回，随后在 `entry` 一带重新向上。回踩时最理想的形态是“碰到 OB 立刻有反应”，拖得越久、收盘越深，OB 越可能失效。',
                annotations: ['ob', 'retest', 'entry'],
                focus: { from: 56, to: 82 }
              },
              {
                title: '第 4 步：止损与目标怎么放',
                text: '`stop` 放在 OB 下沿之下（100.4 一带），因为如果价格真正跌破成本区，故事就讲不通了；`target` 指向前高上方的流动性。止损距离与目标距离的比值，才是决定这笔交易值不值得做的关键。',
                annotations: ['stop', 'target', 'mid-high'],
                focus: { from: 40, to: 99 }
              }
            ]
          },
          {
            type: 'p',
            text: '**公允价值缺口**（Fair Value Gap, FVG）指三根 K 线构成的真空带：第一根的高点低于第三根的低点（上涨中），或第一根的低点高于第三根的高点（下跌中）。换句话说，中间那根 K 线跑得太快，买卖双方在其中一段价格上几乎没有成交。框架认为价格有“回到公允价格”的倾向，所以 FVG 常被当作回踩入场区或止盈目标。'
          },
          {
            type: 'list', items: [
              '**入场**：等价格回补缺口的一部分（常见是 50% 位置，即 CE）再顺势进场。',
              '**目标**：如果当前持仓前方有未回补的 FVG，可以把它列为部分止盈位。',
              '**失效**：价格收盘完全穿过缺口并继续走，说明缺口没有提供支撑 / 阻力，应从图上删掉。'
            ]
          },
          {
            type: 'chart',
            scenario: 'ict-fvg',
            caption: '图 2 · FVG：位移留下的真空带，回踩 50% 后延续（模拟数据，仅用于教学）',
            height: 430,
            steps: [
              {
                title: '第 1 步：先确认这是个“能留下缺口”的位移',
                text: '`impulse` 这一段从 101.6 一气拉到 105 上方，`mss-up` 说明它同时突破了下跌结构的最后一个更低高点。只有这种带结构突破的快速位移，留下的缺口才更值得等回踩，普通小波动留下的缺口意义不大。',
                annotations: ['impulse', 'mss-up'],
                focus: { from: 28, to: 52 }
              },
              {
                title: '第 2 步：把缺口画出来',
                text: '`fvg` 区域的下沿是第三根 K 线的最低点，上沿是第一根 K 线的最高点，`ce` 是缺口中点。图上这段真空带当时没有成交，意味着价格再回来时这里缺少“筹码支撑”，容易快速滑过。',
                annotations: ['fvg', 'ce'],
                focus: { from: 34, to: 50 }
              },
              {
                title: '第 3 步：回踩到缺口下沿',
                text: '`fill` 所在的 K 线最低几乎完全回补了缺口，正好停在缺口下沿附近，随后没有继续跌破。注意：如果它收盘跌穿整个缺口，这个 FVG 就应该被判失效，而不是“再等等看”。',
                annotations: ['fvg', 'ce', 'fill'],
                focus: { from: 52, to: 70 }
              },
              {
                title: '第 4 步：缺口内进场，止损放缺口之外',
                text: '`entry` 在缺口内进场，`stop` 放在缺口完全失效的位置，`target` 指向前高。这笔交易的核心不是“缺口一定撑住”，而是“撑住我就赚一段，撑不住我亏很小”，风险收益比在进场前就该算清楚。',
                annotations: ['entry', 'stop', 'target'],
                focus: { from: 58, to: 99 }
              }
            ]
          },
          {
            type: 'compare',
            left: {
              title: '订单块 OB',
              items: [
                '本质：位移前的反向 K 线区间，代表成本区',
                '位置：位移的起点，通常离当前价格较近',
                '确认：回踩有反应（影线、吞没、再位移）',
                '失效：收盘跌破（看涨 OB）或站上（看跌 OB）'
              ]
            },
            right: {
              title: '公允价值缺口 FVG',
              items: [
                '本质：三根 K 线之间的未成交真空带',
                '位置：位移的中段，常与 OB 相邻',
                '确认：回补 50% 后出现反应',
                '失效：收盘完全穿过缺口并延续'
              ]
            }
          },
          {
            type: 'callout', tone: 'warn', title: '两个概念共同的坑',
            text: '第一，事后标注偏差：图上能找出很多“看起来完美”的 OB 和 FVG，但当时你并不知道哪一段会变成位移；第二，周期越小越不可靠：5 分钟图上的缺口可能一分钟就被填掉。不要用这两个概念解释所有行情，它们只是“回踩入场”的候选位置。\n最后要说明：OB 与 FVG 的“有效性”在交易社区里争议很大——支持者认为它们代表机构的成本与流动性分布，反对者认为这是典型的事后拟合。比较务实的做法是固定一套定义（比如“位移 + 反向 K 线 + 回踩不破”），在模拟盘里记录 30 到 50 次，统计胜率、平均盈亏比与最大回撤，再决定要不要用于实盘。'
          },
          {
            type: 'checklist', title: '下一次复盘，用这张清单检查你的标注',
            items: [
              '这个 OB / FVG 之前，有没有我能指出来的位移？',
              '回踩时价格是收盘站稳还是直接跌穿？',
              '我的止损放在结构失效点，还是放在“希望它别跌”的位置？',
              '如果我错了，亏损是不是明显小于我预期能赚到的？'
            ]
          }
        ],
        quiz: {
          questions: [
            {
              q: '看涨订单块（bullish OB）通常指的是哪一根 K 线？',
              options: [
                '上涨位移中最长的一根阳线',
                '上涨位移之前的最后一根阴线',
                '下跌趋势中成交量最大的一根阴线',
                '任意一根带长下影线的 K 线'
              ],
              answer: 1,
              why: 'OB 定义的关键是“位移前的最后一根反向 K 线”，看涨方向对应阴线；没有位移就无法确认它是 OB。'
            },
            {
              q: '上涨趋势中形成的 FVG，回踩时最常见的第一观察位是？',
              options: [
                '缺口上沿',
                '缺口 50% 位置（CE）',
                '缺口下方一根 K 线的最低价',
                '前高上方'
              ],
              answer: 1,
              why: '缺口中点（Consequent Encroachment）是最常被引用的回补观察位，但并不是必然止跌的位置。'
            },
            {
              q: '下面哪种情况说明一个看涨 OB 大概率已经失效？',
              options: [
                '价格回踩时出现长下影',
                '价格收盘跌破 OB 下沿并继续下跌',
                '价格回踩时成交量缩小',
                '价格在 OB 上方横盘'
              ],
              answer: 1,
              why: 'OB 代表成本区，收盘有效跌破意味着原假设被推翻；长下影与缩量反而是常见的回踩特征。'
            }
          ]
        },
        sources: [
          { title: 'ICT FVG vs Order Block: Differences and How to Use Both', url: 'https://www.theinnercircletraders.com/fvg-vs-order-block/' },
          { title: 'ICT Trading Strategy: Order Blocks, FVGs and Killzones（ThinkMarkets）', url: 'https://www.thinkmarkets.com/en/trading-academy/technical-analysis/ict-trading-strategy-smart-money-for-inner-circle-traders/' },
          { title: 'ICT Trading — The Inner Circle Traders', url: 'https://www.theinnercircletraders.com/' }
        ]
      },
      {
        id: 'm03-05',
        title: '溢价/折价、均衡与 OTE',
        en: 'Premium / Discount, Equilibrium & OTE',
        minutes: 17,
        level: '进阶',
        summary: '先画区间再谈方向：只在“打折区”做多、在“加价区”做空，并用时段过滤信号。',
        outcomes: [
          '能画出交易区间与 50% 均衡点，并标出溢价区与折价区',
          '能用 OTE（0.62–0.79 回撤带）约束自己的追单冲动',
          '知道为什么同一形态在不同时段（killzone）有效性差异很大'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '一件衣服原价 110 元，你的心理价位是 100 元。它涨到 110 时你嫌贵，跌到 100 时你才觉得“可以买”。市场也一样：同一段行情，价格在区间上半部分时买，等于用加价买；在区间下半部分时买，才是打折。ICT 把这叫溢价（Premium）与折价（Discount）。'
          },
          {
            type: 'p',
            text: '做法很简单：先取一段明显的**交易区间**（dealing range），用它的最高点和最低点连线，中点就是**均衡点**（Equilibrium, EQ，也就是 50% 回撤位）。均衡点以上叫**溢价区**（Premium），以下叫**折价区**（Discount）。框架的操作偏好是：在折价区只找做多机会，在溢价区只找做空机会，区间中部不追单——因为中部既没有位置优势，也没有明确的止损参照。画交易区间时，遵守下面四条规则：'
          },
          {
            type: 'list', items: [
              '**用最明显的摆动高低点**：一眼就能看到的高低点，比精确到小数点的“完美区间”更可靠。',
              '**先大后小**：日线 / 4 小时区间决定大方向偏好，15 分钟区间只用来择时。',
              '**区间会更新**：价格创出新高 / 新低后，旧区间作废，要重新画，而不是硬套原来的 50%。',
              '**区间是假设不是事实**：换一种画法，均衡点就会移动，所以要把画法写进交易计划，保持一致性。'
            ]
          },
          {
            type: 'table',
            head: ['价格位置', '框架偏好', '理由', '常见错误'],
            rows: [
              ['溢价区（EQ 以上）', '只找做空', '上方空间小、下方空间大，止损可放在区间高点外', '在溢价区追多'],
              ['折价区（EQ 以下）', '只找做多', '下跌空间有限，止损可放在区间低点外', '在折价区追空'],
              ['均衡点附近', '观望 / 等突破', '多空成本接近，方向不明', '区间中部开仓']
            ],
            caption: '方向偏好来自位置，不来自你希望价格往哪走。'
          },
          {
            type: 'chart',
            scenario: 'ict-premium',
            caption: '图 1 · 交易区间、溢价折价与 OTE 回踩（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先画区间和均衡点',
                text: '`range-low` 在 100.4，`range-high` 在 110.2，`eq` 把中点 105.3 画了出来。在这张图上，105.3 以上是溢价、以下是折价，所有“追不追”的问题先被这条线切成两半。',
                annotations: ['range-low', 'range-high', 'eq'],
                focus: { from: 0, to: 62 }
              },
              {
                title: '第 2 步：给区域上色，建立方向偏好',
                text: '`premium` 与 `discount` 把区间切成上、下两块。注意它们是从区间高点、高点向下铺的固定区域，不会随价格移动；这是有意为之——你的偏好应该由区间决定，而不是由最近三根 K 线决定。',
                annotations: ['premium', 'discount', 'eq'],
                focus: { from: 58, to: 119 }
              },
              {
                title: '第 3 步：溢价区只等空，折价区只等多',
                text: '`high` 处价格触及区间上沿，属于溢价区，框架里这里只考虑做空或观望；等价格回落，`pullback` 回到折价区并且进入 `ote` 带，才轮到做多的剧本登场。',
                annotations: ['high', 'premium', 'pullback', 'ote'],
                focus: { from: 56, to: 100 }
              },
              {
                title: '第 4 步：OTE 带里找触发',
                text: '`ote` 是 0.62 到 0.79 的回撤带，`entry` 在带内企稳后向上，`target` 指回区间上沿。这里要提醒：OTE 不是“必到点”，只是风险收益比较好的候选区，触发形态（影线、吞没、位移）仍然要给。',
                annotations: ['ote', 'entry', 'target'],
                focus: { from: 82, to: 119 }
              }
            ]
          },
          {
            type: 'p',
            text: '**最优交易入场区**（Optimal Trade Entry, OTE）是 ICT 体系里对回撤深度的偏好：把一段推进浪的高点和低点连线，回撤到 0.62 到 0.79 之间的区域，就是 OTE 带。它来自斐波那契回撤，但和传统用法不同——重点不是“精确的 0.618”，而是“在这一带里，止损可以放得很近、目标可以放得很远”。如果价格只回撤到 0.3 就继续走，不必懊恼，那说明行情比预期更强，只是这趟车不适合你的风险参数。'
          },
          {
            type: 'p',
            text: '**时段过滤**：**关键时段**（Killzone）指的是流动性最集中、最容易出现位移的时间窗口。常见说法包括伦敦盘前的准备时段、伦敦开盘后的 1 到 2 小时、纽约开盘后的 1 到 2 小时，以及纽约午盘的 Silver Bullet 窗口。这些时间在不同资料里略有出入，也受夏令时影响，最重要的是按你所在时区对齐、固定同一套窗口。在清淡的亚洲午盘或假期，同样的扫荡、OB 形态经常只是磨人，没有位移可跟。'
          },
          {
            type: 'callout', tone: 'warn', title: '溢价折价最容易失效的场景',
            text: '强趋势里价格可以长期待在溢价区不回来，“等折价”会错过整段行情；区间本身画错（比如把上影线当区间高点），均衡点就会失真。记住：溢价折价是**位置过滤器**，不是入场信号，更不是让你逆着强趋势硬等。'
          },
          {
            type: 'checklist', title: '开仓前，先回答这四个位置问题',
            items: [
              '我用的交易区间是哪一段？高低点是怎么选的？',
              '当前价格在均衡点上方还是下方？',
              '如果价格继续走，我的止损放在区间外侧能承受吗？',
              '现在是不是一个活跃时段？如果不在，我愿不愿意等到 killzone？'
            ]
          },
          {
            type: 'p',
            text: '和本模块其他概念一样，溢价折价与 OTE 属于**经验框架**：它们把“追高杀低”这种直觉错误变成了可检查的规则，但规则本身没有统计学保证。建议在模拟盘里固定一套画法，记录每次在溢价 / 折价区开单的结果，三个月后再决定是否保留这套过滤器。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '一段区间的高点是 110、低点是 100，均衡点在哪里？价格 106 属于哪个区域？',
              options: [
                '均衡点 105，106 属于溢价区',
                '均衡点 110，106 属于折价区',
                '均衡点 100，106 属于溢价区',
                '均衡点 105，106 属于折价区'
              ],
              answer: 0,
              why: '均衡点 = (110 + 100) / 2 = 105；106 高于 105，位于溢价区。'
            },
            {
              q: '按 ICT 框架，价格回撤到 OTE 带（0.62–0.79）时，比较合理的做法是？',
              options: [
                '无脑满仓做多，因为 OTE 一定有效',
                '把它当候选入场区，等触发形态出现再进场',
                '在 OTE 带里做空',
                '等价格跌破区间低点再进场'
              ],
              answer: 1,
              why: 'OTE 只是位置条件，还需要触发形态与结构配合；直接满仓是把概率工具当成确定性。'
            },
            {
              q: '为什么同样的 OB / 扫荡形态，在不同时段效果可能差很多？',
              options: [
                '因为时段影响了指标的参数',
                '因为活跃时段参与者和流动性更多，更容易出现位移，清淡时段则容易磨盘',
                '因为时段决定了 K 线颜色',
                '因为 killzone 会改变价格的计算方式'
              ],
              answer: 1,
              why: 'killzone 的意义在于流动性与参与者密度，同样的形态在有量的时段更容易走出方向，这是经验观察而非定律。'
            }
          ]
        },
        sources: [
          { title: 'ICT Trading Strategy: Order Blocks, FVGs and Killzones（ThinkMarkets）', url: 'https://www.thinkmarkets.com/en/trading-academy/technical-analysis/ict-trading-strategy-smart-money-for-inner-circle-traders/' },
          { title: 'ICT Silver Bullet Strategy: Times and Setup Rules', url: 'https://www.snappchart.app/blog/strategy-playbooks/ict-silver-bullet-strategy' },
          { title: 'ICT FVG vs Order Block: Differences and How to Use Both', url: 'https://www.theinnercircletraders.com/fvg-vs-order-block/' }
        ]
      },
      {
        id: 'm03-06',
        title: '完整入场模型：扫荡→位移→回踩',
        en: 'The Complete Entry Model',
        minutes: 20,
        level: '进阶',
        summary: '把前五课拼成一条流水线：先等证据，再等位置，最后才算仓位与止损。',
        outcomes: [
          '能按“扫荡→位移→回踩→入场→止损止盈”五步写出完整交易计划',
          '理解为什么顺序不能乱，以及每一步缺失时应该放弃交易',
          '能用 SMT 跨品种背离作为辅助确认，而不是单独开仓理由'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '谈判时最忌讳一上来就亮底牌。老练的人先试探对方（扫荡），再明确表态（位移），等对方还价（回踩），确认立场后才签约（入场）。ICT 的完整入场模型就是这套流程：每一步都在收集对方的信息，任何一步信息不对，都有权起身离场。'
          },
          {
            type: 'p',
            text: '**完整入场模型**（很多资料称之为 ICT 2022 Model 或 2022 模型的变体）把前面几课串成一个固定顺序：①价格扫荡前高 / 前低，取走流动性；②出现反向**位移**，同时跌破 / 突破结构，形成 MSS；③价格回踩到位移留下的**订单块**或 **FVG**；④在回踩区等触发形态后入场；⑤止损放在扫荡极值之外，目标放在对侧流动性。它的核心不是预测，而是**等一个已经把错误代价压到很小的位置**。'
          },
          {
            type: 'flow',
            caption: '顺序是模型的一部分：跳过任何一步，都等于放弃了它提供的证据。',
            items: ['扫荡流动性', '位移 + MSS', '回踩 OB / FVG', '触发入场', '止损 + 目标']
          },
          {
            type: 'chart',
            scenario: 'ict-model',
            caption: '图 1 · 空头版完整模型：扫前高 → 位移 → 回踩 FVG → 入场（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：扫荡前高，取买方流动性',
                text: '`prior-high` 把前高 105.6 画了出来。`sweep` 那根 K 线最高冲到 106.6，收盘却回到 105.45——刺破前高又收回，说明上方的止损和突破单被扫掉了，但价格没有获得延续。',
                annotations: ['prior-high', 'sweep'],
                focus: { from: 18, to: 42 }
              },
              {
                title: '第 2 步：位移 + MSS，方向反转',
                text: '`displacement` 段连续大阴线快速下杀，`mss` 处跌破了上升结构的最后一个 HL，结构由多转空。上方 `ob` 是位移前最后一根阳线的区域，它是后面回踩要看的第一个位置。',
                annotations: ['sweep', 'displacement', 'mss', 'ob'],
                focus: { from: 34, to: 60 }
              },
              {
                title: '第 3 步：等回踩，不要追',
                text: '价格下杀到 101 附近后反弹，`retrace` 回到 104.4 一带，正好进入 `fvg` 缺口的下沿。这里是最容易犯错的时刻：很多人会在下跌途中追空，而模型要求等价格回到结构位再动手。',
                annotations: ['fvg', 'retrace'],
                focus: { from: 40, to: 74 }
              },
              {
                title: '第 4 步：入场、止损、目标一起写',
                text: '`entry` 在缺口附近给出触发，`stop` 放在扫荡高点 106.2 之外，`tp1` 是前低 100.9，`tp2` 是下方流动性 98.8。先算风险：如果止损距入场约 1.8、第一目标约 3.5，那么这笔交易的 R 倍数约为 2:1，才有讨论价值。',
                annotations: ['entry', 'stop', 'tp1', 'tp2'],
                focus: { from: 60, to: 99 }
              }
            ]
          },
          {
            type: 'list', items: [
              '**没有扫荡就入场**：你拿不到“止损放在哪里”的天然参照，也不知道对手盘是否被清掉。',
              '**没有位移就等回踩**：慢慢阴跌 / 阴涨留下的“缺口”和“订单块”往往只是普通波动，回踩命中率低。',
              '**没有回踩就追单**：止损被迫放远，风险收益比迅速恶化，一次正常回调就能把你洗出去。',
              '**没有触发形态就进场**：回踩区只是“候选区”，价格可以在里面横很久，也可以直接穿过去。'
            ]
          },
          {
            type: 'table',
            head: ['步骤', '要看什么', '证据不足时怎么办'],
            rows: [
              ['扫荡', '刺破前高 / 前低后收盘收回', '放弃，等下一次'],
              ['位移 + MSS', '连续大实体 K 线 + 结构破坏', '降级为观察，不进场'],
              ['回踩 OB / FVG', '价格回到结构位且有反应', '等，不追'],
              ['触发', '影线 / 吞没 / 再次位移', '没有触发就不进场'],
              ['风控', '止损放扫荡极值外，R ≥ 2', '达不到就换品种或放弃']
            ],
            caption: '把“不满足就放弃”写进规则，才叫模型；只挑满足的看，叫事后解释。'
          },
          {
            type: 'p',
            text: '**SMT 跨品种背离（辅助确认，不是开仓理由）**：**跨品种背离**（Smart Money Technique, SMT）看的是两个高度相关的品种是否同步：比如纳指与标普、欧元与英镑。如果价格 A 扫荡后创出新高，而高度相关的价格 B 没有同步创新高，说明这次上冲可能只是 A 的流动性事件，衰竭概率上升。SMT 的价值在于**帮你识别“这次扫荡可能是真的”**，但它不能代替结构确认，更不能单独开仓——相关性会在新闻、政策、财报季突然失效，两个品种也可能各有各的流动性故事。'
          },
          {
            type: 'p',
            text: '**风控：模型的下半场。** 模型给的是入场位置，风控决定你能不能活下来。止损的天然位置是扫荡极值之外（因为那个位置一旦被收盘越过，整个假设就不成立了）；目标优先看对侧流动性和前高前低，其次才看 POC 之类的成交密集区。更关键的是**仓位**：先算“如果止损被打掉，我亏多少”，再决定做多少手，而不是反过来。任何一次交易的亏损都不应该超过账户的固定百分比（常见是 1% 以内，具体看你的风险承受能力）。'
          },
          {
            type: 'callout', tone: 'pitfall', title: '模型最容易被玩坏的两种方式',
            text: '第一种是“事后拼图”：行情走完后，总能在图上找到一次扫荡、一段位移、一个缺口，然后宣称模型有效。第二种是“强套模型”：在震荡市里硬找扫荡和 MSS，每天交易十几次。请在收盘前截图并标注，再对照结果统计，而不是用已经走完的图证明自己。\n最后再交代立场：本课讲的是一套**经验框架**，它把“等确认、控风险”这些正确的习惯包装成了具体步骤，但它既不能保证方向，也不能保证收益。真实交易中还会遇到滑点、流动性不足、隔夜跳空、新闻冲击。请先用模拟盘完整执行至少 30 笔，记录每笔的步骤是否齐全、R 倍数、结果与情绪，再决定是否把它带进实盘。'
          },
          {
            type: 'checklist', title: '下单前的完整检查表',
            items: [
              '这次交易我站在哪一级别的结构方向上？',
              '扫荡的是哪个流动性池？取单后有没有收回？',
              '位移是否破坏了结构（MSS）？',
              '回踩位置是 OB 还是 FVG？触发形态出现了吗？',
              '止损在哪？R 倍数多少？如果连亏三次，我还能继续执行吗？'
            ]
          }
        ],
        quiz: {
          questions: [
            {
              q: '完整入场模型的第三步是什么？',
              options: [
                '扫荡前高 / 前低',
                '出现反向位移',
                '价格回踩到 OB 或 FVG',
                '设置止损并计算仓位'
              ],
              answer: 2,
              why: '顺序是扫荡 → 位移（含 MSS）→ 回踩 OB/FVG → 触发入场 → 风控；回踩是第三步。'
            },
            {
              q: '按本课模型，止损最合理的位置是？',
              options: [
                '扫荡极值之外（假设失效的位置）',
                '入场价下方固定 20 个点',
                'OB 区间的正中间',
                '前一个交易日的收盘价'
              ],
              answer: 0,
              why: '止损应该放在“故事不再成立”的位置，即扫荡极值之外；固定点数与模型逻辑无关。'
            },
            {
              q: 'SMT 跨品种背离的作用是？',
              options: [
                '单独构成开仓信号',
                '辅助判断扫荡后的衰竭，但仍需结构确认',
                '预测精确的反转点位',
                '保证相关品种一定同步反转'
              ],
              answer: 1,
              why: 'SMT 只是一层辅助证据，相关性会失效，必须与结构、位移、回踩一起使用。'
            }
          ]
        },
        sources: [
          { title: 'ICT Trading Strategy: The Core Framework Explained', url: 'https://www.theinnercircletraders.com/ict-trading-strategy-the-core-framework-explained/' },
          { title: 'How traders read the ICT SMT divergence（Equiti 教学）', url: 'https://www.equiti-me.com/uae-en/news/trading-ideas/ict-smt-divergence-correlated-markets/' },
          { title: 'Liquidity in Trading: Complete Guide — Order Blocks, Raids & Kill Zones', url: 'https://www.quantum-algo.com/blog/guides/liquidity-trading-complete-guide/' }
        ]
      }
    ],
    sources: [
      { title: 'ICT Trading — The Inner Circle Traders', url: 'https://www.theinnercircletraders.com/' },
      { title: 'ICT FVG vs Order Block: Differences and How to Use Both', url: 'https://www.theinnercircletraders.com/fvg-vs-order-block/' },
      { title: 'ICT Trading Strategy: Order Blocks, FVGs and Killzones（ThinkMarkets 教学）', url: 'https://www.thinkmarkets.com/en/trading-academy/technical-analysis/ict-trading-strategy-smart-money-for-inner-circle-traders/' },
      { title: 'How traders read the ICT SMT divergence（Equiti 教学）', url: 'https://www.equiti-me.com/uae-en/news/trading-ideas/ict-smt-divergence-correlated-markets/' },
      { title: '交易中的市场结构转变（MSS）', url: 'https://www.fxopen-zh.com/cn/trading-skills/market-structure-shift-meaning-and-use-in-ict-trading-3/' },
      { title: 'Liquidity in Trading: Complete Guide — Order Blocks, Raids & Kill Zones', url: 'https://www.quantum-algo.com/blog/guides/liquidity-trading-complete-guide/' }
    ]
  });

  /* ============================ 术语表 ============================ */
  LQ.content.registerGlossary([
    { term: '结构突破', en: 'Break of Structure (BOS)', def: '收盘价越过最近一个已确认摆动高点（上升结构）或摆动低点（下降结构），代表当前趋势继续延伸。', moduleId: 'm03', aliases: ['BOS'] },
    { term: '性质转变', en: 'Change of Character (CHoCH)', def: '价格第一次反向突破最近的结构点，原有趋势节奏被打断；常与 MSS 混用，但更强调“第一次”。', moduleId: 'm03', aliases: ['CHoCH'] },
    { term: '市场结构转变', en: 'Market Structure Shift (MSS)', def: '流动性被扫荡后，价格反向击穿结构点并伴随位移，用来确认趋势由多转空或由空转多。', moduleId: 'm03', aliases: ['MSS'] },
    { term: '流动性池', en: 'Liquidity Pool', def: '前高、前低、等高点等止损单密集的价格区域；价格常被吸引过去“取走”这些止损，是 ICT 框架的核心磁铁。', moduleId: 'm03', aliases: ['流动性', '止损池'] },
    { term: '流动性扫荡', en: 'Liquidity Sweep', def: '价格短暂刺穿前高或前低后迅速收回，触发止损却无法延续，常是反转前的“清场”动作。', moduleId: 'm03', aliases: ['扫荡', 'Sweep'] },
    { term: '订单块', en: 'Order Block (OB)', def: '机构建仓留下的最后一根反向 K 线区域；价格回踩该区域可视为连续入场位，需配合结构与位移。', moduleId: 'm03', aliases: ['OB', '订单区'] },
    { term: '公允价值缺口', en: 'Fair Value Gap (FVG)', def: '快速位移中相邻 K 线之间留下的未成交价格带；价格常回补一部分后再延续，可用作入场或目标。', moduleId: 'm03', aliases: ['FVG', '缺口'] },
    { term: '溢价区', en: 'Premium', def: '交易区间 50% 均衡点以上的区域；ICT 框架认为在溢价区只找做空机会，追多的风险收益比差。', moduleId: 'm03', aliases: ['Premium', '溢价'] },
    { term: '折价区', en: 'Discount', def: '交易区间 50% 均衡点以下的区域；ICT 框架认为在折价区只找做多机会，与溢价区对称。', moduleId: 'm03', aliases: ['Discount', '折价'] },
    { term: '均衡点', en: 'Equilibrium', def: '一段交易区间最高价与最低价的中点（50% 回撤位），用于区分溢价与折价，是强弱分界。', moduleId: 'm03', aliases: ['EQ', '50% 回撤'] },
    { term: '最优交易入场区', en: 'Optimal Trade Entry (OTE)', def: '回撤到 0.62–0.79 之间的区域；ICT 认为此处风险收益比最好，但并非每次都会给到。', moduleId: 'm03', aliases: ['OTE'] },
    { term: '关键时段', en: 'Killzone', def: '伦敦、纽约等流动性集中的时段窗口；同一形态在活跃时段更容易走出位移，清淡时段假信号更多。', moduleId: 'm03', aliases: ['Killzone', '时段窗口'] },
    { term: '跨品种背离', en: 'Smart Money Technique (SMT)', def: '两个高度相关品种（如 NQ 与 ES）一个创新高、另一个没有，用来提示扫荡后的衰竭。', moduleId: 'm03', aliases: ['SMT', 'SMT 背离'] },
    { term: '位移', en: 'Displacement', def: '连续大实体 K 线快速脱离某个价格区，通常留下 FVG 并确认机构参与；是区分扫荡与真实突破的关键。', moduleId: 'm03', aliases: ['Displacement'] }
  ]);
})();
