/* 模块四 · 订单流（content-b 维护）
 * 内容：6 课 + 6 个教学情景 + 14 条术语。
 * 所有情景均为模拟数据，仅用于教学；不构成任何投资建议。
 */
(function () {
  'use strict';
  var S = LQ.data;

  /* ============================ 教学情景 ============================ */

  S.registerScenario(S.buildScenario({
    id: 'of-orderbook',
    title: '订单簿：挂单、点差与两侧的墙',
    module: 'm04',
    lesson: 'm04-01',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4101,
    startTime: Date.UTC(2025, 9, 20, 13, 30, 0),
    tick: 0.05,
    path: [[0, 100.2], [10, 100.9], [18, 100.25], [26, 101.1], [34, 100.5], [42, 101.15], [50, 100.6], [58, 101.3], [66, 100.8], [74, 101.4], [82, 101.0], [89, 101.55]],
    noise: 0.09,
    wick: 0.14,
    volumeBase: 850,
    volumeOnMove: 1.25,
    panels: { volume: true, delta: true, cvd: true, ladder: true },
    events: {
      'bid-wall': S.hline(null, 89, 99.95, '买墙：下方大额挂单', 'bull'),
      'ask-wall': S.hline(null, 89, 101.6, '卖墙：上方大额挂单', 'bear'),
      'bounce-1': S.marker(26, 100.15, '价格砸向买墙后被弹回', 'below', 'bull'),
      'wall-pull': S.marker(58, 101.45, '卖墙被吃掉 / 撤单，价格上破', 'above', 'warn'),
      'spread-note': S.text(64, 100.35, '点差 = 最优卖价 − 最优买价，越窄流动性越好', 'info'),
      'ladder-note': S.text(4, 101.45, '右下面板：左买右卖，柱长代表挂单量', 'info')
    },
    description: '订单簿演示：买卖两侧的大额挂单（墙）、点差与价格在墙之间的反应；数据为确定性合成。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'of-footprint',
    title: '足迹图：每根 K 线内部的买卖量',
    module: 'm04',
    lesson: 'm04-02',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4102,
    startTime: Date.UTC(2025, 9, 21, 13, 30, 0),
    tick: 0.05,
    path: [[0, 101.0], [10, 100.2], [20, 99.4], [28, 99.6], [38, 100.4], [46, 100.0], [56, 101.2], [64, 100.6], [74, 101.8], [84, 102.4], [92, 101.9], [99, 102.8]],
    noise: 0.09,
    wick: 0.14,
    volumeBase: 900,
    volumeOnMove: 1.35,
    overrides: {
      22: { o: 99.55, h: 99.8, l: 99.2, c: 99.7, v: 3400 },
      24: { o: 99.7, h: 99.85, l: 99.35, c: 99.6, v: 2900 },
      56: { o: 100.6, h: 101.35, l: 100.5, c: 101.2, v: 3600 }
    },
    deltaOverrides: { 22: -2100, 24: -1500, 56: 1600 },
    panels: { volume: true, delta: true, cvd: true, footprint: true },
    events: {
      'absorb-zone': S.zone(20, 26, 99.2, 99.85, '放量但价格不跌：吸收区', 'warn'),
      'absorb-bar': S.marker(22, 99.05, 'Delta 大负、收盘拉回', 'below', 'bull'),
      'poc-note': S.text(6, 100.85, '足迹每根 K 线会高亮该根成交最密的价位', 'info'),
      'break-bar': S.marker(56, 101.55, '放量突破，足迹买方占优', 'above', 'bull'),
      'retest': S.marker(64, 100.35, '回踩足迹密集区', 'below', 'bull'),
      'fp-note': S.text(70, 102.6, '足迹：左侧主动卖、右侧主动买', 'info')
    },
    description: '足迹图演示：同一根 K 线内不同价格的主动买卖量、放量吸收与突破；数字为确定性合成。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'of-delta',
    title: 'Delta 背离：价格新高，力量没跟上',
    module: 'm04',
    lesson: 'm04-03',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4103,
    startTime: Date.UTC(2025, 9, 22, 13, 30, 0),
    tick: 0.05,
    path: [[0, 100.0], [8, 101.0], [14, 100.4], [24, 102.0], [32, 101.4], [42, 103.2], [50, 102.6], [60, 104.2], [68, 103.6], [76, 104.8], [82, 104.0], [90, 102.4], [99, 101.6]],
    noise: 0.1,
    wick: 0.15,
    volumeBase: 900,
    volumeOnMove: 1.3,
    deltaOverrides: {
      8: 900, 24: 1500, 40: 1700, 42: 1900, 44: 1600, 46: 1500,
      58: 1300, 60: 1100, 62: 700,
      72: 400, 73: -900, 74: -1200, 75: -1500, 76: -1600, 77: -800,
      78: -700, 80: -500, 82: -900, 84: -800, 88: -900, 92: -1100
    },
    panels: { volume: true, delta: true, cvd: true },
    events: {
      'high-1': S.marker(42, 103.5, '第一波新高：Delta 同步走强', 'above', 'bull'),
      'high-mid': S.marker(60, 104.45, '第二波：Delta 仍为正但已减弱', 'above', 'info'),
      'high-2': S.marker(76, 105.0, '更高高点：Delta 反而转负', 'above', 'warn'),
      'div-zone': S.zone(68, 84, 104.3, 105.05, '价格新高 / Delta 未新高 = 背离', 'warn'),
      'drop': S.marker(92, 102.2, '背离后价格回落', 'below', 'bear'),
      'cvd-note': S.text(50, 105.0, '看下方 CVD：高点没有同步抬高', 'info')
    },
    description: 'Delta 演示：同样的上涨，第一波 Delta 强劲、第二波 Delta 转弱，形成价格与力量的背离。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'of-absorption',
    title: '吸收：放量却跌不动的地方',
    module: 'm04',
    lesson: 'm04-04',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4104,
    startTime: Date.UTC(2025, 9, 23, 13, 30, 0),
    tick: 0.05,
    path: [[0, 102.0], [10, 101.2], [18, 100.4], [24, 100.0], [28, 100.3], [34, 100.7], [42, 100.2], [50, 101.0], [58, 101.6], [66, 101.2], [76, 102.2], [84, 102.8], [92, 102.4], [99, 103.2]],
    noise: 0.09,
    wick: 0.14,
    volumeBase: 950,
    volumeOnMove: 1.3,
    overrides: {
      22: { o: 100.35, h: 100.5, l: 99.85, c: 100.35, v: 3800 },
      24: { o: 100.35, h: 100.5, l: 99.9, c: 100.3, v: 3200 },
      42: { o: 100.3, h: 100.55, l: 99.95, c: 100.45, v: 3600 },
      56: { o: 101.1, h: 101.7, l: 101.0, c: 101.6, v: 3400 }
    },
    deltaOverrides: { 22: -2600, 24: -2000, 42: -2400, 56: 1800 },
    panels: { volume: true, delta: true, cvd: true, footprint: true },
    events: {
      'absorb-zone': S.zone(20, 28, 99.8, 100.6, '吸收区：主动卖被限价买吃掉', 'warn'),
      'sweep': S.marker(22, 99.7, '扫低点后收回', 'below', 'bull'),
      'retest-2': S.marker(42, 99.8, '第二次测试仍不破', 'below', 'bull'),
      'support': S.hline(null, 99, 100.6, '支撑带（吸收区上沿）', 'bull'),
      'breakout': S.marker(56, 101.85, '吸收之后：位移突破', 'above', 'bull'),
      'absorb-note': S.text(64, 100.45, '足迹低档 bid 量远大于 ask 量', 'info')
    },
    description: '吸收演示：价格两次探向支撑，放量、Delta 大幅为负，但价格没有跌破，随后向上位移。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'of-profile',
    title: '成交量分布：价值区、POC 与突破',
    module: 'm04',
    lesson: 'm04-05',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4105,
    startTime: Date.UTC(2025, 9, 24, 13, 30, 0),
    tick: 0.05,
    path: [[0, 101.0], [10, 102.0], [18, 101.2], [28, 102.3], [36, 101.5], [46, 102.4], [54, 103.2], [62, 102.6], [70, 102.2], [80, 103.6], [88, 104.2], [96, 103.8], [109, 104.8]],
    noise: 0.1,
    wick: 0.15,
    volumeBase: 900,
    volumeOnMove: 1.25,
    panels: { volume: true, profile: true },
    events: {
      'va-box': S.zone(4, 58, 101.2, 102.45, '前期盘整：价值区在这里堆积', 'info'),
      'poc-note': S.text(6, 102.9, '右侧面板：POC = 成交最密的价格', 'info'),
      'breakout': S.marker(54, 103.4, '收盘站上价值区上沿，价值开始上移', 'above', 'bull'),
      'retest': S.marker(70, 101.95, '回踩前期价值区上沿后收回', 'below', 'bull'),
      'new-value': S.zone(80, 109, 103.2, 104.3, '新的价值区正在形成', 'bull'),
      'panel-note': S.text(74, 100.95, 'POC / VA 随可视区间重算，缩放会变化', 'info')
    },
    description: '成交量分布演示：POC / VAH / VAL 描述价值区，价格站上 VAH 后回踩确认，价值区整体上移。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'of-confluence',
    title: '共振：SMC 结构 + 订单流证据',
    module: 'm04',
    lesson: 'm04-06',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 4106,
    startTime: Date.UTC(2025, 9, 25, 13, 30, 0),
    tick: 0.05,
    path: [[0, 103.6], [8, 102.6], [14, 103.2], [22, 101.6], [28, 101.0], [34, 100.6], [38, 102.3], [44, 103.2], [50, 102.9], [56, 101.85], [62, 103.2], [68, 104.2], [74, 103.8], [82, 104.6], [90, 105.0], [99, 105.6]],
    noise: 0.1,
    wick: 0.15,
    volumeBase: 950,
    volumeOnMove: 1.35,
    overrides: {
      34: { o: 101.0, h: 101.2, l: 100.1, c: 101.05, v: 3400 },
      36: { o: 101.05, h: 101.6, l: 100.98, c: 101.5, v: 3600 },
      37: { o: 101.5, h: 102.3, l: 101.45, c: 102.2, v: 4100 }
    },
    deltaOverrides: { 34: -2300, 36: 1900, 37: 1600, 44: 1300, 68: 1100 },
    panels: { volume: true, delta: true, cvd: true },
    events: {
      'demand': S.zone(24, 35, 100.5, 101.2, '需求区 / 订单块', 'bull'),
      'sweep': S.marker(34, 100.0, '扫前低止损（SMC 证据）', 'below', 'warn'),
      'delta-bull': S.marker(37, 102.45, 'Delta 由负转正（订单流证据）', 'above', 'bull'),
      'mss': S.marker(46, 103.3, 'MSS 结构转多', 'above', 'bull'),
      'fvg': S.zone(36, 38, 101.6, 102.05, 'FVG：位移留下的缺口', 'info'),
      'retest': S.marker(56, 101.5, '回踩 FVG / 需求区', 'below', 'bull'),
      'entry': S.marker(58, 102.55, '共振入场', 'above', 'info'),
      'stop': S.hline(50, 99, 100.05, '止损：扫荡低点之外', 'bear'),
      'tp': S.hline(58, 99, 105.2, '目标：前高流动性', 'bull')
    },
    description: '共振演示：SMC 的扫荡 + 结构转变，与订单流的 Delta 转正、吸收证据同时出现，才构成一次高质量入场。'
  }));

  /* ============================ 模块注册 ============================ */
  LQ.content.registerModule({
    id: 'm04',
    order: 4,
    stage: 4,
    stageName: '阶段四 · 订单流微观结构',
    title: '订单流',
    en: 'Order Flow',
    tagline: '从“价格画了什么”到“谁把价格推上去的”。',
    summary: '这一模块从订单簿讲起，依次拆解足迹图、Delta 与 CVD、吸收与冰山单、成交量分布 POC/VAH/VAL，最后把订单流证据与 ICT/SMC 的结构、流动性拼成一次共振入场。所有数据都是模拟数据，方法属于经验框架，不构成投资建议，请用模拟盘验证并控制风险。',
    minutes: 110,
    level: '进阶',
    accent: '#26a69a',
    icon: 'book',
    outcomes: [
      '能读懂订单簿的买卖档、点差与大额挂单，知道 MBO 与 MBP 的区别',
      '能读足迹图的 bid × ask 数字，找出放量吸收与不平衡',
      '能用 Delta / CVD 与价格的背离判断“力量有没有跟上”',
      '能用 POC / VAH / VAL 描述价值区，并把订单流证据和结构入场结合'
    ],
    lessons: [
      {
        id: 'm04-01',
        title: '订单簿与 MBO：谁在挂单',
        en: 'Order Book, MBO & MBP',
        minutes: 18,
        level: '进阶',
        summary: '把盘口当成菜市场的报价牌：看懂 bid / ask、点差、深度，以及“墙”为什么可能是假的。',
        outcomes: [
          '能说清订单簿、买价、卖价、点差与深度的含义',
          '能区分 MBO（逐笔委托）与 MBP（逐价聚合）两种数据格式',
          '看到“大额挂单墙”时，会先怀疑它可能是撤单或欺骗，而不是直接当成支撑阻力'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '菜市场里，买家喊“我出 10 块”，卖家喊“我卖 10 块 5”。谁都不肯先让，于是买卖之间永远留着一小段差价。订单簿就是这张写满报价的黑板：左边一列是愿意买的价和量，右边一列是愿意卖的价和量，最靠近中间的两个价就是你能立刻成交的价格。'
          },
          {
            type: 'p',
            text: '**订单簿**（Order Book）是交易所按价格排列的买卖挂单集合：**买价**（bid）是当前最高的买价，**卖价**（ask）是当前最低的卖价，两者之差叫**点差**（spread），点差越窄说明流动性越好。中间价之外的每一档都叫**深度**（depth）。市场数据有两种常见格式：**逐价聚合**（Market by Price, MBP）把同一价格的挂单合并成一个总量；**逐笔委托**（Market by Order, MBO）则保留每一笔挂单的编号、大小与队列位置，能看到“谁排在第几位”。'
          },
          {
            type: 'list', items: [
              '**bid / ask**：能立刻成交的买价与卖价，点差就是你的“过路费”。',
              '**深度**：bid/ask 向上向下各档的挂单量，越厚越难被一笔单子推动。',
              '**MBO**：逐笔订单编号，能看队列位置、单笔大小，常用于研究冰山单与撤单行为。',
              '**MBP**：按价格聚合成一档总量，数据量小、适合普通看盘，但看不到队列与单笔。'
            ]
          },
          {
            type: 'table',
            head: ['数据格式', '粒度', '能看到什么', '看不到什么'],
            rows: [
              ['MBP 逐价聚合', '每一档一个总量', '各价位的买卖总量、点差', '单笔大小、队列位置'],
              ['MBO 逐笔委托', '每一笔挂单', '单笔规模、排队位置、撤单', '成交对手方身份'],
              ['逐笔成交', '每一笔成交', '主动买 / 主动卖、成交价量', '挂单背后的意图']
            ],
            caption: '三种数据是互补关系；零售端多数只能看到 MBP 与逐笔成交，MBO 需要专门的数据源。'
          },
          {
            type: 'chart',
            scenario: 'of-orderbook',
            caption: '图 1 · 主图下面就是订单簿：左买右卖、中间价与点差（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先看下面的订单簿面板',
                text: '`ladder-note` 提示的位置就是订单簿：中间一列是价格，左边绿色是买盘、右边红色是卖盘，柱子的长度代表挂单量。注意每根 K 线悬停时，面板显示的挂单都会变化——它只是那一刻的快照。',
                annotations: ['ladder-note'],
                focus: { from: 0, to: 30 }
              },
              {
                title: '第 2 步：找中间价与点差',
                text: '`spread-note` 说的点差，就是面板中间价上下两条最优买卖价之间的差。点差很小时，一笔市价单的进场成本低；点差突然拉宽，往往意味着流动性变薄或者行情在加速，这时追单最先被吃的就是点差。',
                annotations: ['spread-note'],
                focus: { from: 40, to: 80 }
              },
              {
                title: '第 3 步：认识“墙”，但不要迷信',
                text: '`bid-wall` 与 `ask-wall` 是价格图上标出的挂单密集区。价格在 `bounce-1` 处靠近买墙后被弹回，看起来像“有支撑”，但你要记住：挂单可以随时撤走，看到的墙可能只是意图，不是承诺。',
                annotations: ['bid-wall', 'ask-wall', 'bounce-1'],
                focus: { from: 8, to: 46 }
              },
              {
                title: '第 4 步：墙被吃掉或被撤掉之后',
                text: '`wall-pull` 处价格越过了原来的卖墙，说明要么卖单被主动买单吃掉、要么挂单撤了。真正值得关注的不是“墙在不在”，而是墙被处理后价格有没有延续；没有延续的突破，往往又是一次诱多。',
                annotations: ['ask-wall', 'wall-pull'],
                focus: { from: 46, to: 89 }
              }
            ]
          },
          {
            type: 'h', text: '“墙”为什么经常是假的'
          },
          {
            type: 'p',
            text: '订单簿上的大额挂单有两类可能：真实意图与展示意图。**冰山单**（iceberg order）会把大单拆成小份，成交后再补，表面上看到的是小单在反复成交；**欺骗挂单**（spoofing）则挂出大单制造压力 / 支撑的假象，等价格快到就撤掉。监管机构对 spoofing 有明确处罚案例，但识别仍很难。所以订单簿更适合用来理解**短期成本**（点差与深度），不适合单独当成方向信号。'
          },
          {
            type: 'callout', tone: 'warn', title: '数据能力边界',
            text: '零售端通常看不到完整 MBO 队列，也看不到隐藏单；交易所数据还有延迟，挂单在你看到的那一刻可能已经撤了。本页的订单簿是**确定性模拟数据**，用来教学演示，不代表真实市场。把订单簿当成“观察谁着急”的辅助工具即可。'
          },
          {
            type: 'checklist', title: '看盘时，订单簿用这三问就够了',
            items: [
              '点差是不是异常变宽？如果是，先别用市价单。',
              '某一侧深度突然变薄，是行情要加速，还是挂单撤走了？',
              '我看到的大单，是持续存在还是只闪了一下？'
            ]
          },
          {
            type: 'p',
            text: '订单流的“微观结构”研究在学术界是严肃课题，但把它变成可盈利的散户策略是另一回事：高频机构在速度、数据、成本上都占优，个人交易者看到的永远是二手快照。比较务实的用法是借它理解**点差、滑点、流动性风险**，在做大单或数据行情前避开流动性最差的时刻，而不是试图用盘口预测下一根 K 线。'
          }
        ],
        quiz: {
          questions: [
            {
              q: 'MBO 与 MBP 的核心区别是什么？',
              options: [
                'MBO 是逐笔委托、能看到队列位置；MBP 是按价格聚合的总量',
                'MBO 只在股票市场使用，MBP 只在期货市场使用',
                'MBP 包含成交方向，MBO 不包含',
                '两者完全一样，只是叫法不同'
              ],
              answer: 0,
              why: 'MBO（Market by Order）保留每笔挂单的粒度与排队位置；MBP（Market by Price）只保留每一档的总量。'
            },
            {
              q: '点差（spread）变宽通常说明什么？',
              options: [
                '流动性变好，适合重仓市价追单',
                '流动性变差或波动加大，进出成本上升',
                '价格一定会上涨',
                '买卖双方意见完全一致'
              ],
              answer: 1,
              why: '点差是最优买卖价之差，变宽意味着撮合不充分、流动性变薄，市价单的冲击成本更高。'
            },
            {
              q: '看到订单簿上有一堵很大的“买墙”，最合理的态度是？',
              options: [
                '直接认为价格不会跌破，重仓做多',
                '把它当作可能的意图展示，观察价格反应再决定',
                '立即反手做空，因为墙都是假的',
                '等墙撤掉后立刻满仓'
              ],
              answer: 1,
              why: '挂单可撤销，墙可能是真实承接也可能是欺骗；要结合价格是否被承接、是否延续来判断。'
            }
          ]
        },
        sources: [
          { title: 'Market by Order (MBO) FAQ（CME Group）', url: 'https://www.cmegroup.com/articles/faqs/market-by-order-mbo.html' },
          { title: 'What Is a Limit Order Book? Key Concepts and Data（Investopedia）', url: 'https://www.investopedia.com/terms/l/limitorderbook.asp' },
          { title: 'Bookmap Glossary（MBO / MBP / 冰山 / 撤单术语）', url: 'https://bookmap.com/knowledgebase/es/docs/KB-Help-Glossary' }
        ]
      },
      {
        id: 'm04-02',
        title: 'Footprint 足迹图怎么读',
        en: 'Reading the Footprint Chart',
        minutes: 19,
        level: '进阶',
        summary: 'K 线只告诉你价格去了哪，足迹图告诉你每一档价格上谁在主动成交。',
        outcomes: [
          '能看懂足迹图里 bid × ask 数字与配色，找到每根 K 线成交最密的价格',
          '能用对角线不平衡找出买卖力量失衡的价位',
          '能区分“不平衡”与“吸收”，知道两者的阈值都是经验设置'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '体检时，普通身高体重只能告诉你“看起来正常”，X 光片才能看到骨头有没有问题。K 线就是那张“身高体重表”：它告诉你开盘、收盘、最高、最低，却不告诉你这些价格上是买方主动成交还是卖方主动成交。足迹图（Footprint）就是 K 线的 X 光片。'
          },
          {
            type: 'p',
            text: '**足迹图**（Footprint Chart，也叫 cluster chart；在 Sierra Chart 里叫 Numbers Bars）把每根 K 线按价格档纵向拆开：同一行里，左边数字是**主动卖出**（打在买价 bid 上）的成交量，右边数字是**主动买入**（打在卖价 ask 上）的成交量，两边的差就是该价位的 Delta。绿色通常表示主动买占优，红色表示主动卖占优。一眼扫过去，你能看到这根 K 线内部“哪里打得多、哪里打得少”。'
          },
          {
            type: 'list', items: [
              '**先找每根 K 线成交最密的一行**：那一行通常被高亮，是该 K 线的控制点（POC），代表多空换手最激烈的位置。',
              '**再看对角线不平衡**：把某档的主动买量与下一档的主动卖量比较，差距特别大时说明一方在“吃穿”另一方的挂单。',
              '**然后看放量吸收**：成交量明显放大、但价格区间很小、收盘又拉回，说明主动单被被动单吃掉了。',
              '**最后看整体倾斜**：整根 K 线的买量集中在顶部还是底部，往往比单行数字更能说明问题。'
            ]
          },
          {
            type: 'chart',
            scenario: 'of-footprint',
            caption: '图 1 · 足迹模式：每根 K 线按价格档拆开的主动买卖量（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先认识数字网格',
                text: '`poc-note` 指向的区域里，每根 K 线都被拆成一行行数字：左侧主动卖、右侧主动买，成交最大的那行会被高亮。先不用管方向，花 10 秒找到“哪一行数字最大”，你就找到了这根 K 线的重心。',
                annotations: ['poc-note'],
                focus: { from: 2, to: 22 }
              },
              {
                title: '第 2 步：找到放量吸收',
                text: '`absorb-zone` 里的 `absorb-bar` 是一根典型 K 线：成交量很大、价格区间很窄、Delta 大幅为负，但收盘又拉回。含义是主动卖单不断砸向买价，却被被动买单吃了回去——这就是足迹图最有价值的信号之一。',
                annotations: ['absorb-zone', 'absorb-bar'],
                focus: { from: 14, to: 32 }
              },
              {
                title: '第 3 步：看突破时的买方优势',
                text: '`break-bar` 这根 K 线放量向上，足迹里上半部分的主动买明显更密，价格收在区间上沿附近。它说明这次上行不是靠“没人卖”，而是有真实的主动买在追价，比缩量上涨可信得多。',
                annotations: ['break-bar', 'absorb-zone'],
                focus: { from: 46, to: 64 }
              },
              {
                title: '第 4 步：回踩时再确认一次',
                text: '`retest` 处价格回踩到前面的成交密集区，`fp-note` 提示你注意回踩 K 线的足迹：如果主动卖量放大、价格却跌不下去，说明支撑仍在。足迹图不是拿来预测顶底的，而是拿来确认“这个位置愿不愿意接”。',
                annotations: ['retest', 'fp-note', 'absorb-zone'],
                focus: { from: 54, to: 72 }
              }
            ]
          },
          {
            type: 'table',
            head: ['足迹上的现象', '通常的解读', '需要警惕什么'],
            rows: [
              ['同一价位主动买远大于主动卖', '买方在吃卖单，短线偏强', '可能是冰山单在一边卖一边挂'],
              ['放量、窄幅、Delta 反向', '吸收，可能衰竭', '趋势中也会出现“再充能”式吸收'],
              ['成交量逐根递减', '推动力量减弱（exhaustion）', '低量回调也可能只是休整'],
              ['对角买卖比极端', '不平衡，价格可能继续被推动', '阈值设置不同，信号数量差异大']
            ],
            caption: '足迹的判读高度依赖阈值与数据质量，同一张图不同软件可能给出不同结论。'
          },
          {
            type: 'p',
            text: '**不平衡**（imbalance）指的是相邻价位买卖力量显著不对称。常见做法是对角线比较：某一档的主动买量，与下一档的主动卖量相比，超过某个倍数就算不平衡。不同软件与交易者的阈值差异很大，有人用 150%，有人用 300% 甚至 400%。阈值越低信号越多、噪声也越多，**没有通用最优值**，只能在自己的品种与周期上回测。'
          },
          {
            type: 'callout', tone: 'warn', title: '数据分类的误差与局限',
            text: '主动买 / 主动卖的区分依赖逐笔成交与 tick rule，交易所不提供 aggressor 标记时只能近似推断；回填或聚合过的历史数据精度更差，吸收与不平衡的结果和实时看到的不一样。另外，足迹图只反映“成交结果”，看不到挂单背后的意图与撤单。'
          },
          {
            type: 'checklist', title: '第一次打开足迹图时，按这个顺序看',
            items: [
              '这根 K 线的成交重心在哪一行？',
              '上半部分和下半部分，哪边主动量更集中？',
              '有没有放量但价格不动的 K 线？',
              '回踩时主动卖是否明显放大，价格是否被接住？'
            ]
          },
          {
            type: 'p',
            text: '足迹图属于订单流分析里比较“贵”的工具：需要逐笔数据、需要更大的屏幕，也需要时间适应。它不会直接告诉你买卖点，但能让你看到“努力与结果是否匹配”。请记住本页所有数字都是模拟合成，真实使用时先在模拟盘里对照实盘回放，确认你用的软件、阈值与数据源是否一致。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '足迹图里同一行的左右两个数字分别代表什么？',
              options: [
                '左边主动卖、右边主动买',
                '左边挂单量、右边成交量',
                '左边买价、右边卖价',
                '左边昨日成交、右边今日成交'
              ],
              answer: 0,
              why: '足迹按价格档统计打在 bid（主动卖）与 ask（主动买）上的成交量，两者之差就是该档 Delta。'
            },
            {
              q: '“放量、窄幅、Delta 大幅为负、收盘拉回”最可能对应什么？',
              options: [
                '主动卖被被动买吸收，可能是衰竭信号',
                '多头趋势加速',
                '成交量数据出错',
                '价格即将瀑布式下跌'
              ],
              answer: 0,
              why: '大主动卖量却推不动价格，说明有被动买在承接；但吸收只代表可能衰竭，方向仍需其他证据。'
            },
            {
              q: '关于足迹不平衡（imbalance）的阈值，正确的说法是？',
              options: [
                '所有软件都统一用 400%',
                '阈值是经验设置，不同设置会导致信号数量与质量不同',
                '阈值越低越准确',
                '不平衡一旦出现就必然反转'
              ],
              answer: 1,
              why: '不平衡阈值没有行业统一标准，需要按品种、周期与数据质量自行校准并回测。'
            }
          ]
        },
        sources: [
          { title: 'Numbers Bars（Sierra Chart 文档：足迹图术语与算法）', url: 'https://www.sierrachart.com/index.php?page=doc/NumbersBars.php' },
          { title: 'Footprint Charts（ATAS 功能说明）', url: 'https://atas.net/volume-analysis/footprint-charts/' },
          { title: 'Footprint Charts Explained: Order Flow Trading（NinjaTrader）', url: 'https://ninjatrader.com/futures/blogs/ninjatrader-order-flow/' }
        ]
      },
      {
        id: 'm04-03',
        title: 'Delta 与 CVD：买卖压力',
        en: 'Delta & Cumulative Delta',
        minutes: 18,
        level: '进阶',
        summary: 'Delta 是这一根 K 线里的净推力，CVD 是整场比赛的累计比分；关键是看两者和价格是否同步。',
        outcomes: [
          '能解释 Delta 的计算方式与正负含义，知道单根 Delta 为什么不能单独用',
          '能画出 CVD，并用“价格新高 / 新低但 CVD 不同步”识别背离',
          '能用位置与结构过滤掉大部分无效背离'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '两个人推一辆车：Delta 是“这一秒谁更用力”，CVD 是“从开始到现在，谁累计占了上风”。只看这一秒，可能是对方换手的瞬间；只看累计，又可能错过转折。比赛解说的做法是两者一起看——这就是 Delta 与累计 Delta 的关系。'
          },
          {
            type: 'p',
            text: '**Delta** 是主动买量与主动卖量之差：成交在卖价（ask）上算主动买，成交在买价（bid）上算主动卖，`Delta = 主动买量 − 主动卖量`。正数表示主动买更积极，负数表示主动卖更积极。把每根 K 线的 Delta 一路累加，就得到**累计 Delta**（Cumulative Delta, CVD）。CVD 的绝对数值没有意义，有意义的是它的**方向、斜率，以及与价格是否同步**。'
          },
          {
            type: 'list', items: [
              '**方向确认**：价格与 Delta 同向，说明推动力量与价格一致，趋势更可信。',
              '**背离 / 吸收**：价格创新高但 Delta 没有同步走强，说明主动买在衰减，可能有人用挂单承接。',
              '**CVD 斜率**：连续多根 K 线的 CVD 走平或掉头，比单根正负更能说明力量变化。',
              '**位置过滤**：背离必须出现在关键位（前高前低、价值区边缘、OB/FVG）才有意义。'
            ]
          },
          {
            type: 'p',
            text: '为什么不能只看单根 Delta？因为一根 K 线里的主动买卖可能只是几笔大单制造的假象：一笔市价买单扫穿几档卖单，就能让 Delta 突然转正，但价格可能马上被更大的卖压打回。CVD 把时间维度加进来，能看出“这股力量是持续的还是孤立的”。实践中的顺序通常是：先看 CVD 的整体斜率与高低点是否与价格同步，再用单根 Delta 找具体的转折 K 线，最后用价格结构决定是否行动。如果 CVD 与价格长期同步，那么单根 Delta 的异常值值得警惕；如果 CVD 本身就在震荡，单根 Delta 的正负几乎没有信息量。'
          },
          {
            type: 'table',
            head: ['现象', 'Delta / CVD', '价格', '常见解读'],
            rows: [
              ['价涨量增、Delta 同向', '持续为正、CVD 走高', '创新高', '趋势健康，回踩偏多'],
              ['价涨但 Delta 转弱', 'Delta 下降、CVD 走平', '创新高', '买盘衰减 / 吸收，警惕反转'],
              ['价跌但 Delta 转强', 'Delta 收窄、CVD 不再新低', '创新低', '卖盘衰竭，可能见底'],
              ['价格横、CVD 大幅波动', '反复正负', '区间内', '多空换手激烈，等突破']
            ],
            caption: 'Delta 是“力量”指标，不是方向指标；它回答的是“谁更主动”，不回答“接下来去哪”。'
          },
          {
            type: 'chart',
            scenario: 'of-delta',
            caption: '图 1 · 价格连续创新高，Delta 与 CVD 却没有同步（模拟数据，仅用于教学）',
            height: 450,
            steps: [
              {
                title: '第 1 步：先看健康的上涨',
                text: '`high-1` 这一波里，价格向上突破，下方的 Delta 柱与 CVD 同步走高，`cvd-note` 提示的累计曲线在不断抬升。这种“价格与力量同步”的上涨，是订单流最愿意背书的形态，回踩时更容易延续。',
                annotations: ['high-1', 'cvd-note'],
                focus: { from: 24, to: 52 }
              },
              {
                title: '第 2 步：力量开始跟不上',
                text: '`high-mid` 处价格又创新高，但 Delta 的峰值已经比第一波低，CVD 的抬升速度也变慢。这不是卖出信号，但它告诉你：追多的性价比在下降，后面的新高需要更多买盘才能维持。',
                annotations: ['high-mid', 'high-1'],
                focus: { from: 48, to: 68 }
              },
              {
                title: '第 3 步：价格新高、Delta 转负',
                text: '`high-2` 处价格创出整段最高点，可下方的 Delta 柱已经是负值，`div-zone` 标出的就是这段背离。用 CVD 看更清楚：价格高点抬高，CVD 的高点却在往下走——说明这波新高是“虚”的。',
                annotations: ['high-2', 'div-zone', 'cvd-note'],
                focus: { from: 64, to: 88 }
              },
              {
                title: '第 4 步：等价格确认，而不是提前预判',
                text: '`drop` 处价格跌破了前一个回调低点，背离才真正兑现。注意这个差别：背离只是“警惕”，价格结构破位才是“行动”。如果你在 `high-2` 一出现就重仓做空，很可能被继续推高；等确认虽然少赚一点，但犯错代价小得多。',
                annotations: ['div-zone', 'drop'],
                focus: { from: 72, to: 99 }
              }
            ]
          },
          {
            type: 'p',
            text: '**背离**（divergence）是 Delta 与 CVD 最常见的用法，但也是最容易被滥用的。有效的背离通常需要三个条件：①出现在有结构意义的位置（前高前低、OB/FVG、价值区边缘）；②CVD 与前一个高点 / 低点出现明显的、持续的差距，而不是几根 K 线的噪声；③最好有价格结构或吸收形态配合。三者缺一，背离就只是一句“看起来像”。'
          },
          {
            type: 'callout', tone: 'warn', title: 'Delta / CVD 的边界',
            text: '主动买 / 主动卖的划分依赖逐笔数据，交易所不提供标记时只能近似推断；冰山单、隐藏单与大宗交易会让 Delta 失真；在强趋势里，CVD 可以在高位钝化很久，背离可以一拖再拖。把 Delta 当“证据之一”，不要当“预测器”。'
          },
          {
            type: 'checklist', title: '看到背离时，先问这四个问题',
            items: [
              '背离出现在哪个位置？有没有结构意义？',
              'CVD 的差距是持续多根，还是只有一根？',
              '价格结构被破坏了吗？破了哪里？',
              '如果我现在进场，止损放在哪？R 倍数够吗？'
            ]
          },
          {
            type: 'p',
            text: 'Delta 与 CVD 是订单流分析里门槛较低、最容易上手的一对工具，也正因如此最容易被过度解读。建议把它们当成“确认工具”：先用结构、位置决定方向，再用 Delta / CVD 检查“力量是否配合”。模拟盘里先固定一套看盘流程，例如只看前高前低与价值区边缘的背离，统计 30 次之后再扩展。'
          }
        ],
        quiz: {
          questions: [
            {
              q: 'Delta 的计算方式是？',
              options: [
                '主动买量减去主动卖量',
                '主动卖量减去主动买量',
                '成交量乘以价格',
                '最高价减去最低价'
              ],
              answer: 0,
              why: '成交在卖价（ask）上算主动买、在买价（bid）上算主动卖，Delta = 主动买 − 主动卖。'
            },
            {
              q: '价格创新高，但 CVD 的高点却在往下走，最合理的解读是？',
              options: [
                '上涨力量衰减，需要警惕，但还要等价格结构确认',
                '价格一定会立刻暴跌',
                'CVD 数据一定出错了',
                '说明主动买更强了'
              ],
              answer: 0,
              why: '这是典型的看跌背离：价格更高但主动买没有同步增强；它只是警告，不能替代结构破位的确认。'
            },
            {
              q: '下面哪一项不属于 Delta / CVD 的使用边界？',
              options: [
                '主动买卖的分类存在误差',
                '冰山单与隐藏单会让 Delta 失真',
                '强趋势中背离可能长期钝化',
                'CVD 可以精确预测反转点位'
              ],
              answer: 3,
              why: 'CVD 是力量累积的近似度量，不具备精确预测点位的功能，这正是它的边界。'
            }
          ]
        },
        sources: [
          { title: 'Delta and Cumulative Delta: What are they?（ATAS）', url: 'https://atas.net/blog/what-is-delta/' },
          { title: 'Volume Delta | Order Flow（LuxAlgo 文档）', url: 'https://docs.luxalgo.com/platform/charts/order-flow/volume-delta' },
          { title: 'Footprint Charts Explained: Order Flow Trading（NinjaTrader）', url: 'https://ninjatrader.com/futures/blogs/ninjatrader-order-flow/' }
        ]
      },
      {
        id: 'm04-04',
        title: '吸收与冰山单',
        en: 'Absorption & Iceberg Orders',
        minutes: 19,
        level: '进阶',
        summary: '放量却跌不动、同价反复成交却吃不透——这两个现象背后可能是同一件事：有人在用挂单接货。',
        outcomes: [
          '能说出吸收的定义、三种常见形态与确认条件',
          '知道冰山单为什么存在、如何从成交行为上“推测”它',
          '能列出假吸收的常见场景，避免把“有人在接”当成“马上会涨”'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '暴雨天，马路中间有一个排水口。水一直往下灌（主动卖单），可路面始终没有积水（价格不跌），说明排水口在悄悄把水吃掉。吸收就是这样：主动单不停地砸，价格却被挂单接住，直到砸的人力气用完。冰山单则像潜水艇，只露出一点点，剩下的都藏在水下。'
          },
          {
            type: 'p',
            text: '**吸收**（Absorption）指大额主动单被被动限价单吃掉，表现在成交上是**放量、价格没有相应移动**。Bookmap 等工具的描述是：大额挂出的卖限价单（有时是冰山单）吸收了主动买单，反之亦然。它经常出现在两个位置：趋势末端（衰竭）与趋势中途（再充能）。这两者的区别，是吸收之后价格是反转，还是继续原方向。'
          },
          {
            type: 'list', items: [
              '**成交量明显放大**：至少相比近期均量有肉眼可见的放大，低量停顿不是吸收。',
              '**价格位移很小**：放量却只走了几个 tick，或者收回到区间内。',
              '**Delta 与价格反向**：大量主动卖但价格不跌（看涨吸收），或大量主动买但价格不涨（看跌吸收）。',
              '**后续确认**：吸收之后价格朝反方向离开吸收区，才算兑现；继续原方向则是“再充能”。'
            ]
          },
          {
            type: 'chart',
            scenario: 'of-absorption',
            caption: '图 1 · 两次探向支撑都放量不破，随后位移向上（模拟数据，仅用于教学）',
            height: 450,
            steps: [
              {
                title: '第 1 步：第一次探底——放量却不破',
                text: '`sweep` 那根 K 线最低到 99.85，成交量明显放大，Delta 大幅为负；但收盘又回到 100.35，`absorb-zone` 标出的就是这段“主动卖被接住”的区域。先别急着抄底，这只是假设。',
                annotations: ['absorb-zone', 'sweep'],
                focus: { from: 14, to: 30 }
              },
              {
                title: '第 2 步：第二次测试——还是跌不动',
                text: '`retest-2` 是第二次探向同一支撑，量能依旧不小，价格却再次收回。`support` 这条线画的不是“神奇价位”，而是两次被承接的区域；到这一步，吸收的假设才从“可能”变成“值得等”。',
                annotations: ['retest-2', 'support', 'absorb-zone'],
                focus: { from: 34, to: 50 }
              },
              {
                title: '第 3 步：吸收之后要有位移',
                text: '`breakout` 处价格放量向上突破，`absorb-note` 提醒你回看足迹：低档的 bid 量明显大于 ask 量，说明主动卖在低位被大量吃掉。吸收本身不是入场信号，“吸收 + 位移”才是。',
                annotations: ['breakout', 'absorb-note'],
                focus: { from: 50, to: 66 }
              },
              {
                title: '第 4 步：如果它跌破了支撑',
                text: '把 `support` 这条线当假设的生死线：如果后续 K 线收盘跌破它并且不再收回，前面的吸收就只是“暂时承接”，应该立刻放弃看涨剧本。吸收失败往往意味着更大的卖压还在后面，不要在破位后继续加仓摊平。',
                annotations: ['support', 'breakout'],
                focus: { from: 54, to: 74 }
              }
            ]
          },
          {
            type: 'h', text: '冰山单：为什么你看不到它'
          },
          {
            type: 'p',
            text: '**冰山单**（Iceberg Order）是一种把大额委托拆成小份、成交后自动补单的订单类型，交易所可能只显示当前小份的量。它的目的是隐藏真实规模，减少对市场的冲击。你在足迹图上看到的现象是：同一个价位反复成交，量一直不小，但价格就是过不去；在 MBO 数据里，还能看到同一价位的挂单被吃掉后迅速补上。不过，高频机构管理的普通限价单行为也可能“像”冰山单，没有 MBO 时几乎无法 100% 确认。'
          },
          {
            type: 'table',
            head: ['维度', '吸收（Absorption）', '衰竭（Exhaustion）'],
            rows: [
              ['成交量', '放大，集中在某价位', '逐根递减'],
              ['价格', '放量但位移很小 / 收回', '每根 K 线推进幅度越来越小'],
              ['机制', '主动单被被动单吃掉', '主动单本身越来越少'],
              ['含义', '可能有对手盘在接', '推动力量自然耗尽'],
              ['确认', '吸收后反向位移', '跌破 / 突破关键位']
            ],
            caption: '吸收与衰竭都可能是反转前兆，也都可能只是趋势中继，必须结合位置与结构。'
          },
          {
            type: 'callout', tone: 'warn', title: '假吸收的六种常见场景',
            text: '薄市场里任何成交都像放量；挂单在成交前被撤走（看到的承接可能已经消失）；新闻驱动下的成交不反映正常结构；连续下移中每一档都出现“吸收”，价格却逐级下跌；回填 / 聚合数据的吸收检测与实时不一致；趋势中与主趋势同向的吸收，往往是再充能而不是反转。'
          },
          {
            type: 'checklist', title: '判断一次吸收是否值得跟，看这五点',
            items: [
              '这个位置在结构上重要吗（前低、价值区边缘、OB）？',
              '量能是真的放大，还是只是在薄市场里显得大？',
              'Delta 是否与价格反向？',
              '吸收之后有没有朝反方向位移？',
              '如果吸收失败，我的止损在哪？'
            ]
          },
          {
            type: 'p',
            text: '吸收与冰山单是订单流里最吸引人的概念，也是最容易“讲故事”的地方：任何一次放量不涨不跌，都能被解释成吸收。比较严谨的做法是固定定义（例如“量能 ≥ 2 倍均量、区间 ≤ 0.8 倍 ATR、Delta 反向”），记录后续结果，并要求结构确认。另外要坦白：纯 K 线数据看不到挂单补充，“吸收”在大多数散户工具里是**结果推断**，不是机制观测。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '“放量、价格几乎不动、Delta 大幅为负”最可能是什么现象？',
              options: [
                '看涨吸收：主动卖被被动买承接',
                '看跌吸收：主动买被被动卖承接',
                '趋势加速',
                '数据缺失'
              ],
              answer: 0,
              why: '主动卖很多但价格不跌，说明有被动买单在吃这些卖单，属于看涨吸收的典型表现。'
            },
            {
              q: '冰山单（Iceberg Order）的核心特征是？',
              options: [
                '一次性把所有量挂在盘口',
                '把大单拆成小份、成交后自动补单以隐藏真实规模',
                '只在收盘时成交',
                '一定会推动价格暴涨'
              ],
              answer: 1,
              why: '冰山单通过拆单与自动补单隐藏总量，所以足迹上常见同价反复成交却吃不透。'
            },
            {
              q: '吸收出现之后，下面哪种情况说明它是“再充能”而非反转？',
              options: [
                '价格很快朝原趋势方向继续走',
                '价格反向位移并跌破吸收区',
                '成交量突然归零',
                'Delta 变成零'
              ],
              answer: 0,
              why: '趋势中与主趋势同向的吸收常是“再充能”，吸收后价格延续原方向；反转需要反向位移确认。'
            }
          ]
        },
        sources: [
          { title: 'Iceberg Orders Tracker（Bookmap 知识库）', url: 'https://bookmap.com/knowledgebase/tr/docs/KB-Bookmap-Wiki-Iceberg-Orders-Tracker' },
          { title: 'Footprint Charts（ATAS：吸收与衰竭的说明）', url: 'https://atas.net/volume-analysis/footprint-charts/' },
          { title: 'Bookmap Glossary（吸收 / 冰山 / 撤单术语）', url: 'https://bookmap.com/knowledgebase/es/docs/KB-Help-Glossary' }
        ]
      },
      {
        id: 'm04-05',
        title: '成交量分布：POC / VAH / VAL',
        en: 'Volume Profile: POC, VAH & VAL',
        minutes: 19,
        level: '进阶',
        summary: '把成交量按价格重新排队，你会看到市场的“价值中心”和“价格真空”。',
        outcomes: [
          '能解释成交量分布、POC、价值区间与 VAH / VAL 的含义',
          '能读懂图表右侧的成交量分布面板，并注意它会随可视区间重算',
          '能用“价值上移 / 下移”描述行情阶段，而不是只用“涨 / 跌”'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '看一个小区一年的成交记录：有些楼层成交特别多，有些楼层几乎没人问津。成交最密集的楼层，就是大家心里“值这个价”的地方；上下偏离太远的楼层，要么没人买、要么很快被拉回来。成交量分布（Volume Profile）就是把这张成交表按价格画成横向柱状图。'
          },
          {
            type: 'p',
            text: '**成交量分布**（Volume Profile, VP）把统计区间内的成交量按价格分桶累加，画成横向直方图：柱子越长，说明该价格成交越多。柱子最长的那个价格叫**成交量控制点**（Point of Control, POC），是多空换手的重心；从 POC 向两侧扩展，直到累计成交量约占总量 70%，所覆盖的价格区间叫**价值区间**（Value Area, VA），它的上沿是 **VAH**，下沿是 **VAL**。'
          },
          {
            type: 'list', items: [
              '**POC 是磁铁**：价格离开 POC 后，常被拉回来测试一次，但它不是“墙”，不能当止损位。',
              '**VAH / VAL 是边界**：价格在价值区内偏平衡，站上 VAH 或跌破 VAL 后能否站稳，决定是“价值上移 / 下移”还是假突破。',
              '**价值迁移看阶段**：新的价值区在旧价值区上方形成 = 上升趋势的健康表现；反之则要警惕。',
              '**口径要固定**：分桶大小、统计时段、VA 比例都会改变 POC / VAH / VAL，比较时口径必须一致。'
            ]
          },
          {
            type: 'chart',
            scenario: 'of-profile',
            caption: '图 1 · 右侧分布面板：POC、VAH、VAL 与价值区上移（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先看右侧这一条条横柱',
                text: '`poc-note` 指向右侧的成交量分布面板：横柱越长代表那个价格成交越多，最长的柱子会被标成 POC，两端虚线标出 VAH 与 VAL。`va-box` 标出的是前期盘整堆积出来的价值区，多空在那里反复换手。',
                annotations: ['va-box', 'poc-note'],
                focus: { from: 0, to: 62 }
              },
              {
                title: '第 2 步：价值区上沿的突破',
                text: '`breakout` 处价格放量收在前期价值区上沿之上，说明市场愿意在更高的价格成交——这才是“价值上移”的证据，而不是某根大阳线本身。注意同时看成交量有没有跟上，缩量突破要打问号。',
                annotations: ['va-box', 'breakout'],
                focus: { from: 44, to: 64 }
              },
              {
                title: '第 3 步：回踩确认还是失败回落',
                text: '`retest` 处价格回落测试前期价值区上沿，收回后继续向上。如果这次回落直接跌回价值区内部并收在下方，那就该按“假突破”处理，而不是继续等新高。',
                annotations: ['breakout', 'retest'],
                focus: { from: 60, to: 82 }
              },
              {
                title: '第 4 步：新的价值区正在形成',
                text: '`new-value` 标出的区域里，成交逐渐在 103 到 104 之间堆积，`panel-note` 提醒你：面板是按当前可视区间统计的，缩放或平移之后 POC / VA 会重新计算，所以别把某一帧的数值当成永久事实。',
                annotations: ['new-value', 'panel-note'],
                focus: { from: 74, to: 109 }
              }
            ]
          },
          {
            type: 'table',
            head: ['价格位置', '常见解读', '可执行动作'],
            rows: [
              ['价值区内', '多空平衡，方向不明', '等突破，或做区间边缘'],
              ['站上 VAH 并站稳', '价值上移，买方接受更高价', '回踩 VAH 找多'],
              ['跌破 VAL 并收回', '卖方尝试失败', '关注看涨吸收 / 扫荡'],
              ['远离价值区', '价格真空，移动快', '不追，等回到价值区']
            ],
            caption: 'VAH / VAL 不是精确的支撑阻力，而是“市场愿不愿意在这个价格成交”的区域边界。'
          },
          {
            type: 'p',
            text: '成交量分布的计算看似客观，其实处处是选择：行高（每档多少 tick）、统计时段（当日 / 多日 / 指定区间）、VA 比例（70% 是约定俗成，不是定律）、以及用成交量还是 TPO 计算。经典 Market Profile 用 TPO，按“上下各取两行、比较两行之和”扩张价值区；成交量分布法则是逐行纳入成交量更大的一侧，两种算法给出的 VAH / VAL 可能不同。这也是为什么同一个 POC，不同软件可能画在不同位置。'
          },
          {
            type: 'callout', tone: 'warn', title: '成交量分布的四个坑',
            text: '第一，POC 会漂移：交易进行中 POC 不断变化，只有收盘后的会话 POC 才有结构意义；第二，裸 POC（未被回访的旧 POC）有幸存者偏差，被回访的会被反复提及，没被回访的没人说；第三，趋势日里 VAH / VAL 只是“减速带”，价格可以一路不回头；第四，分桶大小改变，POC 与 VA 都会明显变化，跨软件比较前先对齐口径。'
          },
          {
            type: 'checklist', title: '使用成交量分布前的四步检查',
            items: [
              '我用的是哪个时段、哪种算法的分布？',
              '价格现在在价值区内还是价值区外？',
              '最近的 POC 是上移还是下移？',
              '如果价格回到 POC，我是把它当目标还是当入场位？'
            ]
          },
          {
            type: 'p',
            text: '成交量分布适合回答“市场认可哪个价格”，不适合回答“下一根 K 线往哪走”。把它与结构、流动性、订单流证据结合，才能形成完整的判断。本页的分布面板是根据模拟成交量实时计算的，数值会随视口变化，请把重点放在“怎么读”而不是“记住某个数字”。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '成交量控制点（POC）指的是？',
              options: [
                '统计区间内成交量最大的价格',
                '区间内最高的价格',
                '区间内最低的价格',
                '成交量最小的价格'
              ],
              answer: 0,
              why: 'POC 是成交量分布中成交最密集的价格，代表多空换手的重心，常被当作磁铁与目标位。'
            },
            {
              q: '价值区间（VA）通常按什么标准划定？',
              options: [
                '最高价与最低价的中间一半',
                '包含约 70% 成交量的价格区间',
                '固定 20 个 tick 的区间',
                '开盘后 30 分钟的价格范围'
              ],
              answer: 1,
              why: '常用约定是从 POC 向两侧扩张，覆盖约 70% 成交量；70% 是经验惯例，不是自然定律。'
            },
            {
              q: '价格放量站上 VAH 之后回踩不破，通常说明？',
              options: [
                '价值区可能整体上移，回踩 VAH 可关注做多',
                '价格一定会暴跌',
                '成交量分布失效',
                '应立即做空'
              ],
              answer: 0,
              why: '站上 VAH 并回踩确认，意味着市场接受更高的价格区间，是价值上移的常见表现。'
            }
          ]
        },
        sources: [
          { title: 'Fixed Range Volume Profile: How it Works, Components & How to Use（Dhan）', url: 'https://dhan.co/blog/technical-analysis/fixed-range-volume-profile/' },
          { title: 'Metal Market Profile User Guide（CME Group）', url: 'https://beta.cmegroup.com/education/articles-and-reports/metal-market-profile-user-guide.html' },
          { title: 'Numbers Bars（Sierra Chart：POC 与成交量分布相关文档）', url: 'https://www.sierrachart.com/index.php?page=doc/NumbersBars.php' }
        ]
      },
      {
        id: 'm04-06',
        title: '订单流 + SMC 共振入场',
        en: 'Order Flow + SMC Confluence',
        minutes: 20,
        level: '进阶',
        summary: '两个互相独立的证人都指向同一处，才值得下注：把结构证据与订单流证据叠在一起用。',
        outcomes: [
          '能列出一次共振入场需要的三类证据：结构、订单流、时机',
          '知道哪些证据是“同源”的，不能重复计数',
          '能写出带止损、目标与失效条件的共振交易计划'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '法庭上，一个证人说他看见被告推人，另一个证人说他听见争吵后有人倒地。两个证人互不认识、角度不同，证词却拼得上，法官才会采信。如果两个证人其实是同一桌吃饭的朋友，证词再一致也要打折。交易里的“共振”（confluence）就是这个道理：证据要来自不同的角度，且互相独立。'
          },
          {
            type: 'p',
            text: '**共振**指多个独立维度的证据同时指向同一个方向与位置。在订单流 + ICT/SMC 的组合里，最常见的三层是：①**结构层**——扫荡前低 / 前高、MSS 转向、回踩 OB 或 FVG；②**订单流层**——Delta 由负转正、吸收、足迹买方占优、CVD 不再新低；③**时机层**——活跃时段（killzone）、数据窗口之外、流动性正常。三层同时满足，才叫共振；只有一层，只能叫“信号”。'
          },
          {
            type: 'list', items: [
              '**位置对**：价格回到有结构意义的位置（需求区、OB、FVG、价值区边缘）。',
              '**行为对**：该位置出现扫荡收回、位移、吸收或 Delta 转向。',
              '**时机对**：处在活跃时段、点差正常、没有马上公布的数据。',
              '**风险对**：止损放在假设失效的位置，R 倍数 ≥ 2，仓位可以承受连续亏损。'
            ]
          },
          {
            type: 'chart',
            scenario: 'of-confluence',
            caption: '图 1 · 扫荡 + 吸收 + Delta 转正，三层证据叠在同一处（模拟数据，仅用于教学）',
            height: 450,
            steps: [
              {
                title: '第 1 步：结构层——扫荡与需求区',
                text: '`demand` 是前期盘整形成的需求区，`sweep` 那根 K 线最低到 100.1，跌破前低后又被买回 101.05。这是 SMC 语言里的流动性扫荡：先取走止损，再回到区间之上，位置与行为都对上了。',
                annotations: ['demand', 'sweep'],
                focus: { from: 18, to: 38 }
              },
              {
                title: '第 2 步：订单流层——Delta 转正',
                text: '`delta-bull` 处 Delta 由负转正，说明主动买开始接手；`fvg` 是随后的位移留下的缺口。注意这不是“Delta 为正就买”，而是“在这个位置、扫荡之后、Delta 转正”，三者才有意义。',
                annotations: ['delta-bull', 'fvg', 'sweep'],
                focus: { from: 32, to: 48 }
              },
              {
                title: '第 3 步：结构确认——MSS 与回踩',
                text: '`mss` 处价格突破前一个更低高点，结构由空转多；随后 `retest` 回踩到缺口与需求区之间。到这里，结构与订单流两个独立维度的证据已经对齐，剩下的是等触发形态与算风险。',
                annotations: ['mss', 'retest', 'fvg'],
                focus: { from: 40, to: 66 }
              },
              {
                title: '第 4 步：入场、止损、目标写成一条计划',
                text: '`entry` 在回踩企稳后入场，`stop` 放在扫荡低点之外，`tp` 指向前高流动性。剩下的问题不是“会不会涨”，而是“如果错了亏多少、连错三次我还能不能执行”——这才是共振最后的落点。',
                annotations: ['entry', 'stop', 'tp'],
                focus: { from: 54, to: 99 }
              }
            ]
          },
          {
            type: 'p',
            text: '为什么强调“独立”？因为很多听起来不同的指标其实是同一份数据的不同画法。比如**吸收**与**CVD 背离**都由同一段成交推出来，高度相关；成交量放大又是吸收定义的一部分。如果你把“吸收 + CVD 背离 + 放量”当成三条独立证据，实际上是在给同一件事投三票，风控会被虚假的确定性带偏。真正独立的维度大致是：价格结构（几何位置）、订单流（主动 / 被动行为）、时间（时段与事件）、以及跨品种（SMT）。'
          },
          {
            type: 'table',
            head: ['证据', '具体看什么', '相对独立性'],
            rows: [
              ['结构 / 位置', '扫荡、MSS、OB、FVG、价值区边界', '与订单流相对独立'],
              ['订单流行为', 'Delta 转向、吸收、足迹不平衡', '内部各项常同源，别重复计'],
              ['时间 / 事件', 'killzone、数据窗口、点差', '独立维度'],
              ['跨品种', 'SMT 背离、相关品种是否同步', '部分独立，相关性会失效']
            ],
            caption: '共振不是“指标越多越好”，而是“独立证据越多越可信”。'
          },
          {
            type: 'callout', tone: 'warn', title: '共振也会失败',
            text: '新闻可以一秒钟推翻所有结构；流动性差的时段里，Delta 与足迹会被噪声污染；跨品种相关性在极端行情里会突然失效。共振提高的是“事前胜算”，不是“事后保证”。因此无论证据多充分，单笔亏损都必须被限制在你能承受的范围内。'
          },
          {
            type: 'p',
            text: '**把共振变成一张可执行的 SOP。** 一个可复盘的流程是：①盘前画出关键结构与流动性池，标出价值区；②盘中只在这些位置附近等信号；③看到扫荡后，检查位移与 MSS；④回踩时打开足迹 / Delta，确认订单流方向；⑤算止损与 R 倍数，R 不足就放弃；⑥入场后按计划管理，不因为一根 K 线改剧本；⑦收盘后截图复盘：哪些证据是真的独立，哪些只是同一个故事的重复叙述。'
          },
          {
            type: 'checklist', title: '共振入场前的最终检查',
            items: [
              '我的三个证据分别属于哪一层？它们真的独立吗？',
              '如果只保留最核心的一条证据，我还敢下单吗？',
              '止损位是结构失效点，还是我“愿意亏”的位置？',
              '这笔交易的 R 倍数是多少？连亏三次我能接受吗？'
            ]
          },
          {
            type: 'p',
            text: '最后说明立场：ICT/SMC 与订单流都属于**经验框架**，本模块把两者组合起来，是为了让你在模拟盘里有一套可检查、可复盘的流程，而不是承诺收益。真实市场里滑点、跳空、流动性枯竭都会让“完美共振”变成亏损单。请至少用模拟盘跑完 30 到 50 笔完整流程，统计胜率、盈亏比与最大回撤，再决定是否使用。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '以下哪一组最适合被称为“共振”？',
              options: [
                '扫荡前低 + Delta 由负转正 + 活跃时段',
                '成交量放大 + 吸收 + CVD 背离',
                'MACD 金叉 + RSI 超卖 + KDJ 金叉',
                '前高 + 前低 + 整数关口'
              ],
              answer: 0,
              why: '扫荡（结构）、Delta 转正（订单流）、时段（时间）属于不同维度；第二组三项高度同源，第三组都是同类动量指标。'
            },
            {
              q: '为什么“吸收 + CVD 背离 + 放量”不宜算作三条独立证据？',
              options: [
                '因为它们都由同一段成交数据推出，高度相关',
                '因为它们来自不同软件',
                '因为吸收一定不会出现在 CVD 背离时',
                '因为放量无法测量'
              ],
              answer: 0,
              why: '这些现象同源、彼此包含，重复计数会高估确定性；独立维度应来自结构、订单流、时间、跨品种等不同角度。'
            },
            {
              q: '共振入场后，最应该优先确定的是什么？',
              options: [
                '目标能赚多少',
                '止损位置与仓位（先确定最大亏损）',
                '要不要加仓',
                '下一根 K 线会不会涨'
              ],
              answer: 1,
              why: '先确定失效点与仓位，把单笔风险限制在可承受范围内，再谈目标与加仓；顺序反了就是赌博。'
            }
          ]
        },
        sources: [
          { title: 'Order Flow（ATAS 订单流功能说明）', url: 'https://atas.net/volume-analysis/order-flow/' },
          { title: 'Bookmap Glossary（吸收 / 冰山 / MBO 术语）', url: 'https://bookmap.com/knowledgebase/es/docs/KB-Help-Glossary' },
          { title: 'Volume Delta | Order Flow（LuxAlgo 文档）', url: 'https://docs.luxalgo.com/platform/charts/order-flow/volume-delta' }
        ]
      }
    ],
    sources: [
      { title: 'Delta and Cumulative Delta: What are they?（ATAS）', url: 'https://atas.net/blog/what-is-delta/' },
      { title: 'Footprint Charts（ATAS 功能说明）', url: 'https://atas.net/volume-analysis/footprint-charts/' },
      { title: 'Numbers Bars（Sierra Chart 文档，即足迹图）', url: 'https://www.sierrachart.com/index.php?page=doc/NumbersBars.php' },
      { title: 'Bookmap Glossary（MBO / MBP / 冰山 / 吸收术语）', url: 'https://bookmap.com/knowledgebase/es/docs/KB-Help-Glossary' },
      { title: 'Market by Order (MBO) FAQ（CME Group）', url: 'https://www.cmegroup.com/articles/faqs/market-by-order-mbo.html' },
      { title: 'Footprint Charts Explained: Order Flow Trading（NinjaTrader）', url: 'https://ninjatrader.com/futures/blogs/ninjatrader-order-flow/' }
    ]
  });

  /* ============================ 术语表 ============================ */
  LQ.content.registerGlossary([
    { term: '订单簿', en: 'Order Book', def: '按价格排列的买卖挂单集合（bid 买价 / ask 卖价），反映当前可成交的深度；挂单越厚，该价位越难被推动。', moduleId: 'm04', aliases: ['盘口', 'DOM'] },
    { term: '逐笔委托', en: 'Market by Order (MBO)', def: '每一笔挂单单独编号的数据格式，能看到队列位置与单笔大小，比逐价聚合更细，能识别隐藏大单。', moduleId: 'm04', aliases: ['MBO'] },
    { term: '逐价聚合', en: 'Market by Price (MBP)', def: '把同一价格的挂单合并成一个总量的数据格式，只有价格档位的汇总，没有单笔队列信息，但数据量更小。', moduleId: 'm04', aliases: ['MBP'] },
    { term: '点差', en: 'Bid-Ask Spread', def: '最优买价与最优卖价之差；点差越窄说明流动性越好、进出成本越低，点差突然变宽常是流动性变差的信号。', moduleId: 'm04', aliases: ['spread', '买卖价差'] },
    { term: '足迹图', en: 'Footprint Chart', def: '把每根 K 线按价格档拆开，显示该档主动买量 × 主动卖量的图表，用来观察 K 线内部的成交争夺。', moduleId: 'm04', aliases: ['足迹', 'cluster chart'] },
    { term: '买卖差额', en: 'Delta', def: '主动买量减主动卖量；正数表示主动买占优，负数表示主动卖占优。单根 Delta 噪声大，要结合序列与价格位置看。', moduleId: 'm04', aliases: ['Delta', '买卖差', 'Bar Delta'] },
    { term: '累计 Delta', en: 'Cumulative Delta (CVD)', def: '把每根 K 线的 Delta 累加起来的曲线，用来观察主动买卖力量的累积；价格与 CVD 不同步常被解读为吸收或衰竭。', moduleId: 'm04', aliases: ['CVD'] },
    { term: '吸收', en: 'Absorption', def: '大额主动单被被动限价单吃掉，表现为放量但价格不涨 / 不跌，是潜在衰竭信号，但方向仍需其他证据确认。', moduleId: 'm04', aliases: ['Absorption', '承接'] },
    { term: '冰山单', en: 'Iceberg Order', def: '把大单拆成小份反复挂出、成交后自动补单的隐藏大单，在足迹与订单簿上表现为同一价位反复成交却吃不透。', moduleId: 'm04', aliases: ['Iceberg', '隐藏单'] },
    { term: '成交量分布', en: 'Volume Profile', def: '按价格统计成交量形成的横向分布图，用来找成交密集区（价值区）与稀薄区（价格快速滑过的地带）。', moduleId: 'm04', aliases: ['Volume Profile', 'VP'] },
    { term: '成交量控制点', en: 'Point of Control (POC)', def: '统计区间内成交量最大的价格，是多空换手的重心，常被当作磁铁与目标位，但不是支撑阻力墙。', moduleId: 'm04', aliases: ['POC'] },
    { term: '价值区间', en: 'Value Area (VA)', def: '包含约 70% 成交量的价格区间，代表市场认可的价值范围；价格在其中震荡则偏平衡，离开则偏失衡。', moduleId: 'm04', aliases: ['VA', '价值区'] },
    { term: '价值区上沿', en: 'Value Area High (VAH)', def: '价值区的上边界；价格站上并站稳常被视为价值上移，若冲上去又跌回，则是一次失败的突破。', moduleId: 'm04', aliases: ['VAH'] },
    { term: '价值区下沿', en: 'Value Area Low (VAL)', def: '价值区的下边界；跌破后若被快速收回，常形成看涨吸收的舞台，是订单流与结构共振常看的位置。', moduleId: 'm04', aliases: ['VAL'] }
  ]);
})();
