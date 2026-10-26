/* 模块五（二期 m08）· 拍卖理论与市场轮廓（content-b 维护）
 * 内容：5 课 + 5 个教学情景 + 12 条术语。
 * 所有情景均为模拟数据，仅用于教学；不构成任何投资建议。
 */
(function () {
  'use strict';
  var S = LQ.data;

  /* ---------- 二期新标注 helper（CONTRACT-V2 3.1；生成器已提供 S.vprofile / S.vpline） ---------- */
  function vp(x1, x2, label, tone, opts) {
    var o = opts || {};
    o.label = label || '';
    o.tone = tone || 'info';
    return S.vprofile(x1, x2, o);
  }

  function hatchZone(x1, x2, y1, y2, label, tone) {
    var z = S.zone(x1, x2, y1, y2, label || '', tone || 'warn');
    z.hatch = true;
    return z;
  }

  /* ============================ 教学情景 ============================ */

  S.registerScenario(S.buildScenario({
    id: 'auction-basics',
    title: '一天怎么拍卖：初始平衡与区间扩展',
    module: 'm08',
    lesson: 'm08-01',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 8101,
    startTime: Date.UTC(2025, 10, 3, 14, 30, 0),
    tick: 0.05,
    path: [[0, 100.2], [6, 100.5], [12, 99.9], [18, 100.6], [24, 100.15], [30, 99.75], [36, 100.3], [42, 100.1], [48, 100.7], [54, 101.2], [60, 100.9], [66, 101.35], [72, 101.0], [78, 101.3], [86, 100.95], [95, 101.15]],
    noise: 0.08,
    wick: 0.13,
    volumeBase: 900,
    volumeOnMove: 1.3,
    panels: { volume: true, profile: true },
    events: {
      'open-marker': S.marker(0, 100.05, '开盘 100.2：等待双向拍卖', 'below', 'neutral'),
      'ib-zone': S.zone(0, 12, 99.9, 100.55, '初始平衡 IB：首小时的高低点', 'info'),
      'ib-high': S.hline(0, 95, 100.55, 'IB 高点：向上突破参考', 'neutral'),
      'ib-low': S.hline(0, 95, 99.9, 'IB 低点：向下突破参考', 'neutral'),
      'rotation': S.zone(12, 48, 99.9, 100.7, '价值区内来回旋转', 'info'),
      'failed-low': S.marker(30, 99.55, '跌破 IB 低点后收回：失败拍卖', 'below', 'warn'),
      'ext-up': S.marker(66, 101.5, '突破 IB 高点：区间扩展', 'above', 'bull'),
      'ib-vp': vp(0, 12, '初始平衡段成交分布', 'info', { side: 'float' }),
      'poc-note': S.text(76, 100.55, 'POC 是磁铁：价格反复回到成交最密处', 'info')
    },
    description: '演示一日拍卖流程：开盘 → 初始平衡 IB → 在价值区内旋转 → 向下测试失败 → 向上区间扩展，并用成交分布标出 POC 与价值区。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'auction-profile',
    title: 'TPO 与市场轮廓：一天的价值怎么形成',
    module: 'm08',
    lesson: 'm08-02',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 8102,
    startTime: Date.UTC(2025, 10, 4, 14, 30, 0),
    tick: 0.05,
    path: [[0, 101.0], [8, 101.2], [12, 100.95], [18, 101.1], [24, 101.8], [28, 102.2], [34, 102.05], [40, 101.85], [48, 102.15], [56, 101.9], [64, 102.1], [72, 102.0], [80, 102.2], [88, 101.85], [94, 102.05], [101, 101.9]],
    noise: 0.08,
    wick: 0.13,
    volumeBase: 880,
    volumeOnMove: 1.35,
    panels: { volume: true, profile: true },
    events: {
      'open-marker': S.marker(0, 100.8, '开盘 101.0：寻找价值', 'below', 'neutral'),
      'ib-zone': S.zone(0, 12, 100.95, 101.25, '初始平衡：首 1 小时', 'info'),
      'single-print': hatchZone(19, 27, 101.25, 102.1, '单次打印区：价格快速通过，几乎没停留', 'warn'),
      'leg-vp': vp(18, 28, '上冲段成交分布：中段稀薄', 'warn', { bins: 16 }),
      'ext-high': S.marker(28, 102.35, '上冲尾端：区间扩展高点', 'above', 'warn'),
      'value-zone': S.zone(34, 90, 101.85, 102.2, '价值区：成交在此堆积', 'info'),
      'poc-marker': S.text(46, 102.35, 'POC 在价值区中部：多空都接受的价格', 'info'),
      'reject': S.marker(80, 102.35, '再次上探未获接受，回到价值区', 'above', 'warn'),
      'close-marker': S.marker(101, 101.75, '收盘回到价值区中部', 'below', 'neutral')
    },
    description: '演示 TPO / 市场轮廓：初始平衡形成起点，快速上冲留下单次打印，成交在价值区堆积形成 POC，尾盘尝试扩展失败回到价值区。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'auction-value',
    title: '价值区迁移：旧平衡如何抬成新平衡',
    module: 'm08',
    lesson: 'm08-03',
    symbol: 'SIM-30m',
    timeframe: '30m',
    seed: 8103,
    startTime: Date.UTC(2025, 10, 10, 13, 30, 0),
    tick: 0.05,
    path: [[0, 100.8], [10, 101.4], [20, 100.6], [30, 101.45], [40, 100.9], [50, 101.6], [58, 102.6], [66, 102.1], [74, 102.8], [82, 102.3], [90, 103.2], [98, 102.7], [106, 103.4], [113, 102.9], [119, 103.3]],
    noise: 0.1,
    wick: 0.15,
    volumeBase: 950,
    volumeOnMove: 1.3,
    panels: { volume: true, profile: true },
    events: {
      'old-zone': S.zone(4, 52, 100.6, 101.5, '旧价值区：来回平衡', 'info'),
      'old-vah': S.hline(0, 119, 101.5, '旧 VAH 101.5', 'neutral'),
      'old-val': S.hline(0, 119, 100.6, '旧 VAL 100.6', 'neutral'),
      'breakout': S.marker(58, 102.75, '向上失衡：离开旧价值区', 'above', 'bull'),
      'accept': S.marker(66, 101.82, '回踩到 102 附近收回：接受更高价格', 'below', 'bull'),
      'new-balance': S.zone(66, 106, 102.1, 103.2, '新价值区形成：价值上移', 'bull'),
      'new-vp': vp(58, 119, '新价值区成交分布（POC 上移）', 'bull'),
      'fail-return': S.marker(106, 102.55, '尝试回到旧价值区失败', 'below', 'warn'),
      'migration-note': S.text(30, 102.0, '价值上移：POC 从 101 抬到 102.6 以上', 'info')
    },
    description: '演示价值迁移：旧价值区平衡 → 向上失衡 → 回踩旧 VAH 被接受 → 新价值区在更高位置形成，尝试跌回旧价值区失败。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'auction-imbalance',
    title: '失衡、单次打印与失败拍卖',
    module: 'm08',
    lesson: 'm08-04',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 8104,
    startTime: Date.UTC(2025, 10, 5, 14, 30, 0),
    tick: 0.05,
    path: [[0, 100.5], [10, 100.8], [18, 100.3], [26, 100.7], [32, 101.6], [36, 102.1], [40, 102.5], [46, 102.9], [52, 102.55], [58, 102.7], [66, 102.1], [74, 101.4], [82, 100.9], [90, 100.35], [99, 100.75]],
    noise: 0.09,
    wick: 0.15,
    volumeBase: 920,
    volumeOnMove: 1.35,
    overrides: {
      46: { o: 102.55, h: 103.05, l: 102.45, c: 102.6, v: 3300 }
    },
    deltaOverrides: {
      32: 1800, 34: 2200, 36: 2400, 38: 2000, 40: 1700,
      46: 1600, 48: -800, 50: -1200, 52: -1400, 54: -1100, 56: -900,
      66: -900, 68: -1200, 70: -1400, 72: -1100, 74: -1300, 80: -800, 90: -700
    },
    panels: { volume: true, profile: true, delta: true },
    events: {
      'balance-zone': S.zone(4, 26, 100.3, 100.8, '开盘平衡区', 'info'),
      'single-print': hatchZone(27, 37, 100.8, 102.0, '单次打印：中间价位几乎没停留', 'warn'),
      'leg-vp': vp(26, 38, '失衡段成交分布：中段稀薄', 'warn', { bins: 16 }),
      'imbalance-leg': S.marker(32, 101.8, '失衡：连续大实体推动', 'above', 'warn'),
      'peak': S.marker(46, 103.2, '越过前高：拍卖失败待确认', 'above', 'warn'),
      'failed-auction': S.text(52, 102.95, '失败拍卖：新高无跟随，价格跌回区间', 'warn'),
      'delta-note': S.text(70, 102.45, 'Delta：新高时主动买放大却推不动，随后转负', 'info'),
      'value-zone': S.zone(66, 99, 100.35, 101.4, '回落后重新堆积的价值区', 'info'),
      'return': S.marker(90, 100.2, '回到平衡区下沿', 'below', 'bear')
    },
    description: '演示失衡：平衡区 → 连续大实体向上失衡（留下单次打印）→ 越过前高后失败拍卖 → 价格跌回并重新堆积价值区。Delta 面板用于观察主动买卖的跟进与衰竭。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'auction-combo',
    title: '组合框架：Profile 背景 + 订单流证据 + SMC 位置',
    module: 'm08',
    lesson: 'm08-05',
    symbol: 'SIM-5m',
    timeframe: '5m',
    seed: 8105,
    startTime: Date.UTC(2025, 10, 6, 14, 30, 0),
    tick: 0.05,
    path: [[0, 101.2], [8, 101.6], [16, 100.9], [24, 101.4], [32, 100.7], [38, 100.25], [44, 100.5], [50, 101.0], [58, 101.6], [66, 101.2], [74, 101.8], [82, 102.2], [90, 101.9], [98, 102.3], [109, 102.1]],
    noise: 0.09,
    wick: 0.14,
    volumeBase: 950,
    volumeOnMove: 1.35,
    overrides: {
      38: { o: 100.7, h: 100.85, l: 99.95, c: 100.45, v: 3600 },
      40: { o: 100.45, h: 101.05, l: 100.4, c: 101.0, v: 3800 }
    },
    deltaOverrides: {
      38: -2400, 40: 1900, 42: 1600, 50: 1300, 58: 1100, 74: 900, 82: 700, 98: -400
    },
    panels: { volume: true, profile: true, delta: true },
    events: {
      'value-vp': vp(0, 66, '前段成交分布：POC 与 VAL', 'info', { side: 'float' }),
      'val-line': S.hline(0, 109, 100.6, 'VAL 100.6：价值区下沿', 'bull'),
      'poc-line': S.hline(0, 109, 101.3, 'POC 101.3：多空重心', 'neutral'),
      'vah-line': S.hline(0, 109, 101.85, 'VAH 101.85：价值区上沿', 'bear'),
      'sweep': S.marker(38, 99.85, '扫荡 VAL 下方：失败拍卖', 'below', 'warn'),
      'absorb': S.text(42, 100.3, 'Delta 大幅为负但价格收回：吸收', 'warn'),
      'mss': S.marker(50, 101.15, '回到价值区内，结构转多', 'above', 'bull'),
      'entry': S.marker(58, 101.75, '共振入场：位置 + 证据 + 结构', 'above', 'info'),
      'target': S.marker(82, 102.4, '目标 1：VAH / 价值区上沿', 'above', 'bull'),
      'reject': S.marker(98, 102.45, 'VAH 上方未被接受，警惕回落', 'above', 'warn')
    },
    description: '演示组合框架：用成交分布定背景（VAL/POC/VAH），用 Delta 吸收定证据，用扫荡与结构定位置，三者共振才考虑入场。'
  }));

  /* ============================ 模块注册 ============================ */
  LQ.content.registerModule({
    id: 'm08',
    order: 5,
    stage: 5,
    stageName: '阶段五 · 拍卖框架',
    title: '拍卖理论与市场轮廓',
    en: 'Auction Market Theory & Market Profile',
    tagline: '价格不是涨跌，而是一场持续的双向拍卖：谁愿意在哪儿成交。',
    summary: '这一模块把价格重新理解为“双向拍卖”：一天如何形成初始平衡、成交如何堆积成价值区、POC 为什么是磁铁、失衡与单次打印意味着什么，最后把市场轮廓、订单流与 ICT/SMC 拼成组合框架。市场轮廓是统计工具，参数可调、需要样本验证，本模块不构成投资建议，请用模拟盘验证并控制风险。',
    minutes: 95,
    level: '进阶',
    accent: '#f59e0b',
    icon: 'chart',
    outcomes: [
      '能解释双向拍卖、初始平衡、区间扩展，并用它们描述一天的走势结构',
      '能读懂 TPO / 市场轮廓图，说出 POC、价值区与 tails 的含义',
      '能判断价值区是上移、下移还是维持平衡，并知道三种走法的含义',
      '能识别失衡、单次打印与失败拍卖，并把它们与订单流、结构位置组合使用'
    ],
    lessons: [
      {
        id: 'm08-01',
        title: '拍卖理论入门：市场在拍卖什么',
        en: 'Auction Market Theory: What Is Being Auctioned',
        minutes: 16,
        level: '进阶',
        summary: '把“涨跌”换成“拍卖”：市场每天在做什么、初始平衡如何形成、什么时候开始区间扩展。',
        outcomes: [
          '能用“双向拍卖”解释价格为什么会来回摆动，而不是一味上涨或下跌',
          '能标出一天中的初始平衡 IB，并说出突破 IB 的含义',
          '能区分“在价值区内旋转”和“区间扩展”两种状态'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '想象一场拍卖会：拍卖师报出一个价格，有人举手，他就加价；没人再加价，槌子落下，成交。整个过程中，价格不是谁“推”上去的，而是买卖双方不断试探、直到有人愿意成交的结果。拍卖理论（Auction Market Theory, AMT）就是把市场看成这样一场持续进行的双向拍卖（two-way auction）。'
          },
          {
            type: 'p',
            text: '在 AMT 的视角里，价格只是拍卖的**结果**，真正要观察的是过程：市场在哪个价格区间来回成交（平衡）、什么时候离开这个区间去寻找新价格（失衡）、离开之后是被接受还是被拒绝。由此引出一天最基本的两个概念：**初始平衡**（Initial Balance, IB）是开盘后一段时间（常见首小时）形成的最高与最低区间；**区间扩展**（Range Extension）是价格突破 IB 之后继续成交的部分。IB 越窄、扩展越持续，越像趋势日；IB 越宽、价格越在区间内来回，越像区间日。'
          },
          {
            type: 'list', items: [
              '**开盘**：市场先给出一个参考价，等待买卖双方表态。',
              '**初始平衡**：头一段时间的成交形成一个临时区间，多空暂时接受这个范围。',
              '**旋转**：价格在 IB 与已成交区间内来回，寻找更精确的成交价（POC 会在这个过程中形成）。',
              '**扩展或失败**：价格突破 IB；突破后能停留成交就是区间扩展，迅速缩回则是失败拍卖。'
            ]
          },
          {
            type: 'table',
            head: ['概念', '定义', '在图上怎么找'],
            rows: [
              ['初始平衡 IB', '开盘后首时段的最高最低区间', '第一小时的高低点连线'],
              ['区间扩展', '突破 IB 后继续成交的部分', 'IB 之外的新高 / 新低'],
              ['POC', '成交最密集的价格（轮廓重心）', '右侧分布最长的柱子'],
              ['失败拍卖', '突破后无法停留、迅速收回', '长影线 + 回到区间内'],
              ['平衡 / 失衡', '来回成交 / 单边离开', '区间内的旋转 vs 连续大实体']
            ],
            caption: '这些词都描述“成交发生在哪里”，而不是预测下一根 K 线。'
          },
          {
            type: 'chart',
            scenario: 'auction-basics',
            caption: '图 1 · 一天拍卖流程：初始平衡 → 旋转 → 失败测试 → 区间扩展（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先画出初始平衡',
                text: '`ib-zone` 是开盘后首小时形成的区间，`ib-high` 与 `ib-low` 是它的两条边。先别判断方向，把这两条线画出来——它们是当天所有“突破还是失败”判断的基准。',
                annotations: ['open-marker', 'ib-zone', 'ib-high', 'ib-low'],
                focus: { from: 0, to: 18 }
              },
              {
                title: '第 2 步：价值区内的旋转',
                text: '`rotation` 标出的这一段，价格在 99.9 到 100.7 之间来回，既没有持续新高也没有持续新低。`failed-low` 处价格短暂跌破 `ib-low` 又收回，说明向下拍卖没有被接受——这是一次失败的试探。',
                annotations: ['rotation', 'failed-low', 'ib-low'],
                focus: { from: 14, to: 42 }
              },
              {
                title: '第 3 步：打破平衡的区间扩展',
                text: '`ext-up` 处价格站稳 `ib-high` 之上并继续向上成交，这就是区间扩展：市场认为更高的价格也能成交，价值开始上移。注意“站稳”要看收盘与后续 K 线，而不是一根影线。',
                annotations: ['ext-up', 'ib-high', 'rotation'],
                focus: { from: 46, to: 72 }
              },
              {
                title: '第 4 步：用成交分布收尾',
                text: '`ib-vp` 是初始平衡段的成交分布，浮在 IB 区间末端；右侧面板给的是全天分布，`poc-note` 说的磁铁效应在图上很明显：价格多次回到成交最密的位置。对比 IB 的 POC 与全天的 POC，就能看到成交如何从开盘那一段扩散出去。',
                annotations: ['ib-vp', 'poc-note', 'ext-up'],
                focus: { from: 60, to: 95 }
              }
            ]
          },
          {
            type: 'p',
            text: '为什么初始平衡值得重视？因为它代表开盘阶段多空双方都能接受的价格范围。价格离开 IB 之后，如果能在外面持续成交，说明有一方开始接受新价格，趋势日的概率上升；如果只是冲一下就被拉回，说明那只是**探索式拍卖**（exploratory auction）失败，市场仍然认可原来的价值区。把“IB 被突破”和“IB 被突破后有没有停留”分开看，是拍卖理论最实用的一条纪律。'
          },
          {
            type: 'callout', tone: 'warn', title: '别把拍卖理论神化',
            text: '拍卖理论是一套描述市场机制的**框架**，不是精确的预测模型：IB 的时长、价值区的比例、数据来源都可以调整，不同软件画出来的区间可能不同。它的价值在于让你关注“成交发生在哪里、是否被接受”，而不是给你一个买卖信号。任何用法都需要样本验证。'
          },
          {
            type: 'checklist', title: '看一天行情前，先回答这四个问题',
            items: [
              '今天的 IB 是多少？区间是宽还是窄？',
              '价格目前是在 IB 内、还是已经区间扩展？',
              '扩展之后有没有持续成交，还是只有一根影线？',
              '成交最密的价格（POC）在哪里？价格离它远不远？'
            ]
          },
          {
            type: 'p',
            text: '下一课我们会把这种“一日拍卖”画成市场轮廓（Market Profile）：用 TPO 记录每个时间片在哪些价位成交过，从而更直观地看到价值区、POC 与单次打印。先把今天的 IB、旋转、扩展三个词记住，后面的图会反复用到它们。还有一点要提前说清：IB 的时长、POC 的计算方式、价值区的比例都是可调参数，不同软件画出来可能不一样；我们关心的是“价格有没有被接受”这个逻辑，而不是某一套固定数值。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '拍卖理论（AMT）最核心的观点是？',
              options: [
                '价格由少数机构提前决定',
                '价格是买卖双方持续报价、由撮合决定的结果，市场在寻找双方都接受的价值',
                '价格只会沿趋势方向运动',
                '成交量比价格更重要'
              ],
              answer: 1,
              why: 'AMT 把市场看成持续的双向拍卖，价格是拍卖过程的结果；观察重点是成交在哪里发生、是否被接受。'
            },
            {
              q: '初始平衡（IB）通常指什么？',
              options: [
                '前一天的收盘价',
                '开盘后一段时间（常见首小时）形成的最高与最低区间',
                '全天成交量最大的价格',
                '当日涨跌幅的中位数'
              ],
              answer: 1,
              why: 'IB 是开盘后首时段形成的高低区间，常被用作“突破还是失败”的基准；时长是可配置参数。'
            },
            {
              q: '下面哪种情况更接近“区间扩展”？',
              options: [
                '价格突破 IB 后迅速收回区间内',
                '价格在 IB 内来回成交一整天',
                '价格突破 IB 后继续在新区域成交并停留',
                '价格在 IB 边缘反复画长影线'
              ],
              answer: 2,
              why: '区间扩展的关键是突破后继续成交（被接受）；突破后迅速收回属于失败拍卖。'
            }
          ]
        },
        sources: [
          { title: 'Auction Theory in Futures Trading（NexusFi Academy）', url: 'https://nexusfi.com/a/market-structure/auction-theory-futures-trading' },
          { title: 'Metal Market Profile User Guide（CME Group）', url: 'https://beta.cmegroup.com/education/articles-and-reports/metal-market-profile-user-guide.html' },
          { title: 'Market Profile Charts: How to Use Them（The Balance）', url: 'https://www.thebalancemoney.com/market-profile-charts-1031194' }
        ]
      },
      {
        id: 'm08-02',
        title: 'TPO 与市场轮廓：一天的价值怎么形成',
        en: 'TPO & Market Profile',
        minutes: 17,
        level: '进阶',
        summary: '用“时间 × 价格”的投票画出市场轮廓：POC、价值区与单次打印是怎么来的。',
        outcomes: [
          '能解释 TPO 的含义，并说清市场轮廓与成交量分布的区别',
          '能在轮廓图上找到 POC、价值区与单次打印',
          '能把它当成统计工具使用，知道参数会改变结论'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '班里选班长，每个同学在每个候选名字下面画一笔。最后票数最多的名字当选，票数集中在前几名的人组成“主流意见”。市场轮廓（Market Profile）就是那张选票纸：**时间价格机会**（Time Price Opportunity, TPO）就是“某个时间片在这个价位投了一票”，把票按价格叠起来，就得到一张价格分布图。'
          },
          {
            type: 'p',
            text: '具体做法是：把一天切成固定的时间片（例如 30 分钟），每个时间片内价格到过的每个价位都记一个字母或标记，这就是 TPO。把同一个价格上的 TPO 横向排开、逐价格纵向堆叠，就形成了市场轮廓：**中间最长的部分**是成交时间最久的价格区间，最长的那一行是**控制点**（POC），覆盖约 70% TPO 的区间是**价值区**（VA），上下边界就是 VAH / VAL。价格很少触及的极端价位只在轮廓两端留下一两格，叫 tails（尾部）；只被一个时间片触及的孤立价位叫**单次打印**（single print）。'
          },
          {
            type: 'list', items: [
              '**先看形状**：中间鼓、两端细的钟形是正常的一天；一端很长一端很短，说明那天有方向性。',
              '**再看 POC**：成交最久的价格是当天多空的共识点，也是价格反复回访的磁铁。',
              '**然后看价值区宽度**：宽价值区代表分歧大、平衡；窄价值区代表共识强、容易延续。',
              '**最后看 tails 与单次打印**：它们是市场“拒绝”某些价格的证据，常出现在反转附近。'
            ]
          },
          {
            type: 'table',
            head: ['轮廓特征', '常见含义', '使用注意'],
            rows: [
              ['POC 居中、轮廓对称', '典型的平衡日', '区间边缘做回归，中部不追'],
              ['一端长 tail', '该方向被拒绝（excess）', '需要后续确认，不是单根信号'],
              ['窄价值区 + 区间扩展', '趋势日特征', '回踩价值区上 / 下沿找机会'],
              ['大量单次打印', '快速失衡段', '中间价位缺乏成交，回踩容易快速通过']
            ],
            caption: '轮廓是描述工具；同一天换 TPO 周期或 VA 比例，形状与数值都会变化。'
          },
          {
            type: 'chart',
            scenario: 'auction-profile',
            caption: '图 1 · 从初始平衡到价值区：单次打印与 POC 的位置（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：一天的起点——初始平衡',
                text: '`open-marker` 是开盘，`ib-zone` 是第一小时形成的初始平衡。轮廓图上第一小时的 TPO 会在中间堆出一个小包，后续价格是围绕它展开，还是直接离开它，决定这一天的类型。',
                annotations: ['open-marker', 'ib-zone'],
                focus: { from: 0, to: 16 }
              },
              {
                title: '第 2 步：快速上冲留下单次打印',
                text: '`single-print` 标出的价格带被价格快速穿过，只留下很少的 TPO；`leg-vp` 是这一段的成交分布，柱子在中间明显偏短。`ext-high` 是上冲的尾端——注意这种长尾往往代表“拒绝”，而不是继续上涨的理由。',
                annotations: ['single-print', 'leg-vp', 'ext-high'],
                focus: { from: 16, to: 34 }
              },
              {
                title: '第 3 步：价值区与 POC 形成',
                text: '价格回到 101.85 到 102.2 之间反复成交，`value-zone` 是这段时间堆积出的价值区，`poc-marker` 指向价值区中部——POC 就是多空都待得最久的价格，也是后续行情的磁铁。',
                annotations: ['value-zone', 'poc-marker', 'ext-high'],
                focus: { from: 30, to: 62 }
              },
              {
                title: '第 4 步：尾盘再次测试与收盘',
                text: '`reject` 处价格再次上探价值区上沿却没得到接受，回到价值区内部，`close-marker` 显示收盘停在价值区中部。一天结束时，轮廓会告诉你：今天的价值中心在哪、哪些价格被拒绝、明天该从哪里开始看。',
                annotations: ['reject', 'close-marker', 'value-zone'],
                focus: { from: 72, to: 101 }
              }
            ]
          },
          {
            type: 'p',
            text: '**市场轮廓与成交量分布的区别**：市场轮廓统计的是“时间”（某价位被多少个时间片触及），成交量分布（Volume Profile）统计的是“成交量”（某价位成交了多少手）。两者经常很像，但极端行情下会分叉：放量却只停留一个时间片的价格，在轮廓上是单次打印，在成交量分布上却可能是高量柱。看盘时先确认自己看的是哪一种，再谈 POC 与价值区。'
          },
          {
            type: 'callout', tone: 'warn', title: '参数与口径：同一张图，不同结论',
            text: 'TPO 周期（30 分钟 / 5 分钟）、价值区比例（70% 是常见约定）、统计时段（单日 / 多日 / 指定区间）都是可调参数；不同软件、不同设置会让 POC 和 VAH / VAL 移动。市场轮廓是统计工具，不是“画出来就一定有效”的支撑阻力。用它之前，先固定一套口径，并在模拟盘里统计样本。'
          },
          {
            type: 'checklist', title: '读一张市场轮廓图时的四步检查',
            items: [
              '我用的是 TPO 还是成交量分布？周期与时段是什么？',
              'POC 在价值区中部还是偏上 / 偏下？',
              '两端有没有明显的 tail 或单次打印？',
              '今天更接近平衡日还是趋势日？'
            ]
          },
          {
            type: 'p',
            text: '把轮廓当成“当天拍卖的会议记录”：它告诉你市场在哪儿花的时间最多、在哪儿只是路过、在哪儿明确拒绝。下一课我们看更重要的问题——当价值区整体搬家时，怎么判断它是被接受了，还是只是一次失败的试探。'
          }
        ],
        quiz: {
          questions: [
            {
              q: 'TPO（时间价格机会）统计的是什么？',
              options: [
                '每个价位的成交手数',
                '某个时间片是否在某个价位成交过',
                '每个价位的挂单量',
                '每根 K 线的收盘价'
              ],
              answer: 1,
              why: 'TPO 记录的是“时间片在价位上投的一票”，它统计时间覆盖而不是成交量，这是与成交量分布的核心区别。'
            },
            {
              q: '轮廓上的“单次打印”（single print）通常说明？',
              options: [
                '价格在该价位停留了很久',
                '价格快速通过该价位、几乎没有停留',
                '该价位成交量最大',
                '该价位有大量挂单'
              ],
              answer: 1,
              why: '单次打印意味着该价位只被一个时间片触及，常见于快速失衡段，代表价格“路过”而非接受。'
            },
            {
              q: '关于市场轮廓的参数，正确的说法是？',
              options: [
                'TPO 周期与价值区比例固定不可变',
                '不同参数会改变 POC 与 VAH / VAL，使用前应固定口径',
                '任何软件画出来的轮廓都完全一致',
                '价值区比例一定是 50%'
              ],
              answer: 1,
              why: 'TPO 周期、VA 比例、统计时段都是可调参数，会让结论变化；需要固定口径并做样本验证。'
            }
          ]
        },
        sources: [
          { title: 'Market Profile: How to read market context and uncover fair value zones（FTMO）', url: 'https://ftmo.com/au/blog/market-profile-how-to-read-market-context-and-uncover-fair-value-zones/' },
          { title: 'Market Profile & TPO Charts Explained: Initial Balance, Single Prints & Day Types（SatoTrades）', url: 'https://satotrades.com/guides/market-profile-tpo' },
          { title: 'Market Profile & TPO Charts（GoCharting）', url: 'https://gocharting.com/features/market-profile' }
        ]
      },
      {
        id: 'm08-03',
        title: '价值区迁移：VAH/VAL 与 POC 的三种走法',
        en: 'Value Migration: VAH, VAL & POC Walks',
        minutes: 18,
        level: '进阶',
        summary: '价值区整体搬家时，怎么判断是新趋势还是假突破：看它能否在新位置停留成交。',
        outcomes: [
          '能说出价值区上移、下移、维持平衡三种走法各自的特征',
          '能用“接受 / 拒绝”判断突破是否成功，而不是只看是否越过 VAH',
          '能说出一条基于价值区的可执行观察规则，并知道它的失效条件'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '一座城市的“市中心”不是固定的：人口和商业一开始在老城区（旧价值区），当新城区修好地铁、商场和学校，越来越多的人愿意搬过去，市中心就慢慢迁移了。但也有些新区盖好很久仍然空着——那是“没被接受”的迁移。价值区迁移（value migration）讲的就是同一件事：成交愿不愿意跟着价格搬过去。'
          },
          {
            type: 'p',
            text: '价值区是市场认可的成交区间，POC 是它的重心。把不同时段的轮廓放在一起比较，会看到三种走法：**上移**——新价值区整体高于旧价值区，说明市场接受更高价格，常见于上升趋势；**下移**——对称，说明市场接受更低价格；**维持平衡**——新旧价值区高度重叠，说明多空仍在原来范围内换手。判断的关键不是价格有没有越过 VAH / VAL，而是越过去之后**有没有持续成交**：停留成交叫接受（acceptance），快速缩回叫拒绝（rejection）。'
          },
          {
            type: 'list', items: [
              '**先定旧价值区**：用前一时段（前一日或过去几小时）的轮廓画出 POC 与 VAH / VAL。',
              '**再看突破**：价格越过边界后，观察它是否在新区域停留出成交，而不是只看一根 K 线。',
              '**然后看回踩**：回踩旧 VAH（上移情形）不破并继续上行，是接受的有力证据。',
              '**最后看失败**：如果价格重新跌回旧价值区并停留，说明迁移失败，按原区间震荡处理。'
            ]
          },
          {
            type: 'table',
            head: ['走法', '图形表现', '交易含义', '失效信号'],
            rows: [
              ['价值上移', '新 VA 整体在旧 VA 之上，回踩旧 VAH 不破', '上升趋势健康，回踩偏多', '跌回旧 VA 并停留'],
              ['价值下移', '新 VA 整体在旧 VA 之下，回踩旧 VAL 不过', '下降趋势健康，反弹偏空', '站回旧 VA 并停留'],
              ['维持平衡', '新旧 VA 高度重叠，POC 位置接近', '区间交易，边缘做回归', '成交开始单向堆积']
            ],
            caption: '三种走法由“成交是否被接受”定义，而不是由价格涨跌定义。'
          },
          {
            type: 'chart',
            scenario: 'auction-value',
            caption: '图 1 · 旧价值区 → 向上失衡 → 回踩接受 → 新价值区形成（模拟数据，仅用于教学）',
            height: 440,
            steps: [
              {
                title: '第 1 步：先给旧价值区画框',
                text: '`old-zone` 是前一段时间的平衡区，`old-vah` 与 `old-val` 是它的上下沿。在迁移发生之前，这是一个标准的“区间交易”环境：价格来回穿越，POC 在中间。先把这个框画出来，后面才知道“搬走了没有”。',
                annotations: ['old-zone', 'old-vah', 'old-val'],
                focus: { from: 0, to: 54 }
              },
              {
                title: '第 2 步：向上失衡与新区间',
                text: '`breakout` 处价格离开旧价值区并连续向上成交，`new-balance` 标出的区域是成交开始堆积的新位置。关键问题从“涨不涨”变成“它愿不愿意在新区域停留”——成交堆积就是答案的一部分。',
                annotations: ['breakout', 'new-balance', 'old-vah'],
                focus: { from: 46, to: 80 }
              },
              {
                title: '第 3 步：回踩不破，迁移被接受',
                text: '`accept` 处价格回落到 102 附近又被买回，没有跌回旧价值区。这次回踩说明新价格被接受，旧 VAH 从“阻力”变成了“地板”，是价值上移过程中最值得关注的一步。',
                annotations: ['accept', 'new-balance', 'old-vah'],
                focus: { from: 58, to: 90 }
              },
              {
                title: '第 4 步：用新区间的分布确认',
                text: '`new-vp` 是迁移之后这段行情的成交分布，POC 明显高于旧区间；`fail-return` 显示价格尝试跌回旧价值区失败。`migration-note` 提醒你：价值上移不是一句感觉，而是 POC 与价值区整体抬高。',
                annotations: ['new-vp', 'fail-return', 'migration-note'],
                focus: { from: 84, to: 119 }
              }
            ]
          },
          {
            type: 'p',
            text: '价值区迁移的实战价值在于**判断环境**：当价值持续上移时，逆势做空的“低吸高抛”会不断被打脸；当价值维持平衡时，追突破又容易被扫。你可以把它写成一个简单的观察规则：每天开盘后先标出前一时段的价值区，然后只问两个问题——价格离开价值区后有没有停留成交？回踩旧边界时是被接受还是被拒绝？答案组合起来，就决定了今天偏区间还是偏趋势。'
          },
          {
            type: 'callout', tone: 'pitfall', title: '三种常见误用',
            text: '第一，只用价格是否越过 VAH 判断突破，忽略之后有没有成交；第二，用当天还没走完的轮廓下结论——发展中的价值区会漂移，只有已完成的时段才有结构意义；第三，忽略参数差异：不同软件、不同 TPO 周期画出的 VAH / VAL 不一样，跨平台比较前先对齐口径。'
          },
          {
            type: 'checklist', title: '判断价值迁移时的检查清单',
            items: [
              '旧价值区是用哪个时段、哪种口径算的？',
              '价格越界后有没有在新区域停留成交？',
              '回踩旧边界时是收盘站稳还是直接跌回？',
              '如果迁移失败，我的备选剧本是什么？'
            ]
          },
          {
            type: 'p',
            text: '最后要诚实：价值区迁移是**统计描述**，不是方向保证。它能帮你把“追不追”变成可检查的问题，但市场随时可能用一根新闻 K 线把整段结构推翻。请用模拟盘记录每次迁移判断的后续表现，统计它能给你带来多少优势，再决定是否使用。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '“价值区上移”最准确的定义是？',
              options: [
                '某根 K 线收在 VAH 之上',
                '新的价值区整体位于旧价值区上方，且新价格被持续接受',
                'POC 比昨天高一个 tick',
                '价格创出新高'
              ],
              answer: 1,
              why: '价值迁移看的是整个价值区的位置与成交接受程度，不是单根 K 线或单个价格点。'
            },
            {
              q: '价格向上越过旧 VAH 后回踩不破、继续上行，通常说明？',
              options: [
                '迁移被接受，旧 VAH 可能转为支撑',
                '突破失败，应立刻做空',
                '价值区会向下迁移',
                '市场进入平衡'
              ],
              answer: 0,
              why: '回踩旧边界不破是接受的有力证据，说明市场愿意在更高价格成交，旧边界角色可能转换。'
            },
            {
              q: '判断价值迁移时，下列哪项最需要警惕？',
              options: [
                '使用已完成的时段轮廓',
                '用发展中的轮廓下结论（价值区会漂移）',
                '固定同一套参数做对比',
                '观察成交是否在新区域堆积'
              ],
              answer: 1,
              why: '发展中的轮廓会随成交变化而移动，只有已完成时段的 POC / VA 才有稳定的结构意义。'
            }
          ]
        },
        sources: [
          { title: 'Market Profile: How to read market context and uncover fair value zones（FTMO）', url: 'https://ftmo.com/au/blog/market-profile-how-to-read-market-context-and-uncover-fair-value-zones/' },
          { title: 'Metal Market Profile User Guide（CME Group）', url: 'https://beta.cmegroup.com/education/articles-and-reports/metal-market-profile-user-guide.html' },
          { title: 'Market Profile Trading: Understanding Its Power and Impact（Bookmap）', url: 'https://bookmap.com/blog/market-profile-trading-understanding-its-power-and-impact' }
        ]
      },
      {
        id: 'm08-04',
        title: '失衡、单次打印与失败拍卖',
        en: 'Imbalance, Single Prints & Failed Auction',
        minutes: 18,
        level: '进阶',
        summary: '快速移动留下的“单印”和冲高失败的“拍卖失败”，是轮廓图上最值得盯的两个失衡信号。',
        outcomes: [
          '能解释失衡的含义，并在轮廓与成交分布上找到单次打印',
          '能识别失败拍卖的形态，说出它与普通假突破的区别',
          '能列出失败拍卖的确认条件与失效场景，不把它当必然反转'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '演唱会开票，票价从 800 一瞬间被抢到 2000，中间 900、1200 这些价位几乎没人成交——价格“跳”过去了，这些价位在成交记录上只留下一格。几分钟后热度退去，票价又跌回 1000 附近，那些在 2000 抢票的人被套住了。市场里的失衡与失败拍卖，就是这场抢票的放大版。'
          },
          {
            type: 'p',
            text: '**失衡**（imbalance）是买卖力量或时间分布严重不对称的状态：价格快速单边移动、成交稀薄、价差拉大。它在轮廓图上最典型的痕迹是**单次打印**（single print）——某个价位只被一个时间片触及，留下孤立的一格；在成交分布上则表现为中间一段柱子明显偏短。**失败拍卖**（failed auction）指价格试探区间外的新高或新低却无法停留、迅速回到区间内，是失衡之后最常见的“试探失败”结局。'
          },
          {
            type: 'list', items: [
              '**看速度**：失衡段通常由连续大实体 K 线构成，速度越快、越像“路过”。',
              '**看成交分布**：失衡段中段柱子稀薄，说明中间价位没有形成共识。',
              '**看极端价位**：冲高 / 杀低后有没有长影线和快速收回，是失败拍卖的核心形态。',
              '**看后续确认**：价格回到区间内并继续朝反方向成交，才算失败拍卖被确认。'
            ]
          },
          {
            type: 'table',
            head: ['形态', '轮廓 / 分布特征', '含义', '常见误用'],
            rows: [
              ['失衡', '连续大实体 + 中段成交稀薄', '一方暂时主导，价格快速离开', '把失衡当趋势保证'],
              ['单次打印', '孤立一格 / 分布中段短柱', '价格未在此接受，回踩易快速通过', '把单印当精确支撑'],
              ['失败拍卖', '探出区间后收回，留 tail', '该方向被拒绝，可能反转', '未收盘就判定失败'],
              ['Excess', '轮廓极端的长尾', '市场明确拒绝某价格', '忽略级别与时段']
            ],
            caption: '这些形态描述的是“成交是否接受”，不是直接的买卖信号。'
          },
          {
            type: 'chart',
            scenario: 'auction-imbalance',
            caption: '图 1 · 平衡 → 向上失衡（单次打印）→ 冲击前高失败 → 跌回价值区（模拟数据，仅用于教学）',
            height: 480,
            steps: [
              {
                title: '第 1 步：先看平衡区',
                text: '`balance-zone` 是开盘后形成的平衡区，价格在 100.3 到 100.8 之间来回。此时多空都没有明显优势；`single-print` 与 `leg-vp` 的位置在平衡区之外，提示后面可能有一段快速移动。',
                annotations: ['balance-zone', 'single-print', 'leg-vp'],
                focus: { from: 16, to: 40 }
              },
              {
                title: '第 2 步：失衡段与单次打印',
                text: '`imbalance-leg` 处连续大实体把价格从 100.7 推到 102 上方，中间的价位几乎没有停留，于是形成 `single-print` 这一段“空白”。在成交分布 `leg-vp` 上，柱子中段明显偏短——这就是失衡的可视化证据。',
                annotations: ['imbalance-leg', 'single-print', 'leg-vp'],
                focus: { from: 24, to: 42 }
              },
              {
                title: '第 3 步：冲高失败——失败拍卖',
                text: '`peak` 处价格越过前高、留下长上影后收回，`failed-auction` 标出的就是这次失败：新高没有获得后续成交，`delta-note` 提示看下方 Delta——主动买放大却推不动价格，随后转为负值，说明买方力量被吸收。',
                annotations: ['peak', 'failed-auction', 'delta-note'],
                focus: { from: 40, to: 62 }
              },
              {
                title: '第 4 步：跌回并重新堆积价值',
                text: '`return` 处价格回到平衡区下沿，`value-zone` 是下跌后重新形成的成交堆积区。失败拍卖之后的剧本通常有两种：跌回原区间继续震荡，或反向走出新趋势——需要后续结构确认，不能凭一根 K 线就下结论。',
                annotations: ['value-zone', 'return', 'failed-auction'],
                focus: { from: 60, to: 99 }
              }
            ]
          },
          {
            type: 'p',
            text: '单次打印还有一个实务意义：它往往代表**成交真空**。如果价格之后回到单印区域，通常会比较快地穿过——因为那里没有太多被套或获利的筹码。所以单印更适合当作“快速通道”，而不是精确的支撑阻力位。反过来，如果价格回到单印区后明显放慢、反复成交，说明真空正在被填补，原来的失衡正在变成新的平衡，这是判断趋势是否延续的重要线索。'
          },
          {
            type: 'callout', tone: 'pitfall', title: '失败拍卖的四个陷阱',
            text: '第一，没收盘就判定失败：盘中刺破再收回很常见，必须等这根 K 线收完；第二，忽略级别：5 分钟图上的失败拍卖可能只是 1 小时图的一次正常回踩；第三，把失败拍卖当必然反转——它可能只是趋势中的一次休整；第四，忽略数据：薄市场里任何插针都像失败拍卖，新闻窗口内的价格行为不能按常规形态解读。'
          },
          {
            type: 'checklist', title: '识别失败拍卖时，按顺序确认',
            items: [
              '价格试探的是哪个级别的区间边界？',
              '有长影线或快速收回吗？收盘在哪里？',
              '回到区间后有没有继续朝反方向成交？',
              '对应的 Delta / 成交分布是否支持“力量被吸收”？'
            ]
          },
          {
            type: 'p',
            text: '需要强调：单次打印、失衡、失败拍卖都是**描述性概念**，不同数据源与参数下识别结果会不同，成交量分布里的单印也不完全等于 TPO 轮廓里的单印。把它们当成“提高关注度”的线索，再结合结构、订单流与风控，才是稳妥的用法。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '“单次打印”（single print）通常代表什么？',
              options: [
                '该价位成交非常密集',
                '该价位只被一个时间片触及，价格快速通过',
                '该价位有大量限价挂单',
                '该价位是当天的最高价'
              ],
              answer: 1,
              why: '单次打印意味着该价位没有被持续成交，常出现在快速失衡段，回踩时容易较快穿过。'
            },
            {
              q: '失败拍卖最典型的形态是？',
              options: [
                '价格在区间中部横盘',
                '价格试探区间外的新高 / 新低后迅速收回区间内',
                '成交量在区间内均匀分布',
                '价格连续创出新高并停留成交'
              ],
              answer: 1,
              why: '失败拍卖的核心是“试探失败”：越过边界却没有被接受，快速回到原区间，常留下长影线或 tail。'
            },
            {
              q: '关于失败拍卖，下面哪种说法是错的？',
              options: [
                '需要结合收盘价确认',
                '要考虑它发生在哪个级别',
                '出现后价格一定反转',
                '新闻窗口内的形态可信度下降'
              ],
              answer: 2,
              why: '失败拍卖只是可能反转的线索之一，趋势中也可能只是休整；把它当必然反转是典型误用。'
            }
          ]
        },
        sources: [
          { title: 'Market Profile Glossary Index（WindoTrader）', url: 'https://www.windotrader.com/market-profile/market-profile-glossary-index/' },
          { title: 'Market Profile: Types of Opens and the Anatomy of a Trading Day（FTMO）', url: 'https://ftmo.com/au/blog/market-profile-types-of-opens-and-the-anatomy-of-a-trading-day/' },
          { title: 'Market Profile & TPO Charts Explained: Initial Balance, Single Prints & Day Types（SatoTrades）', url: 'https://satotrades.com/guides/market-profile-tpo' }
        ]
      },
      {
        id: 'm08-05',
        title: '组合框架：Profile 定背景 + 订单流定证据 + SMC 定位置',
        en: 'Confluence: Profile Context, Order Flow Evidence, SMC Location',
        minutes: 20,
        level: '进阶',
        summary: '把三个工具放进同一张检查表：用轮廓判断背景，用订单流验证证据，用结构决定在哪下单。',
        outcomes: [
          '能按“背景 → 证据 → 位置”三层组织一次完整分析',
          '能用真实 NQ 日线说明价值分布的位置，并声明数据来源与估算边界',
          '能说清为什么三个工具必须独立验证，以及它们各自的失效条件'
        ],
        sections: [
          {
            type: 'callout', tone: 'story', title: '先讲个生活场景',
            text: '三个专家会诊：影像科医生说“片子显示这里有个阴影”（背景），化验科医生说“指标确实异常”（证据），外科医生说“病灶位置适合手术”（位置）。三个人说的是不同维度的事，拼在一起才是一次可靠的决策。只看影像就开刀、或只看指标就下结论，都很危险。拍卖理论、订单流与 ICT/SMC 的组合，也是同样的道理。'
          },
          {
            type: 'p',
            text: '这一模块的**组合框架**分三层：①**背景层**——用市场轮廓 / 成交分布判断当前是平衡、失衡还是价值迁移，找到 POC、VAH、VAL；②**证据层**——在关键位置观察 Delta、吸收、CVD 等订单流数据，确认主动买卖是否配合；③**位置层**——用扫荡、位移、MSS、OB / FVG 等结构语言，决定具体从哪里入场、止损放在哪里。三层各自回答不同问题，顺序不能颠倒：先有背景，再找证据，最后定位置。'
          },
          {
            type: 'list', items: [
              '**背景**：今天价值区在哪？价格在价值区内还是外？POC 在上移还是下移？',
              '**证据**：到了关键位置，Delta 是否转向？有没有放量吸收？CVD 是否同步？',
              '**位置**：有没有扫荡与收回？结构是否转向（MSS）？止损点是否明确？',
              '**风险**：R 倍数是否 ≥ 2？如果三层只满足两层，我是否愿意放弃这笔交易？'
            ]
          },
          {
            type: 'chart',
            scenario: 'auction-combo',
            caption: '图 1 · 组合框架：VAL 下方扫荡 + Delta 吸收 + 结构转多，三层共振（模拟数据，仅用于教学）',
            height: 480,
            steps: [
              {
                title: '第 1 步：背景层——价值区在哪里',
                text: '`value-vp` 是前段的成交分布（浮在区间末端），`val-line`、`poc-line`、`vah-line` 分别标出价值区下沿、重心与上沿。价格大部分时间在价值区内运行，这是一段平衡背景；只有明确知道边界在哪，后面“扫荡”才有意义。',
                annotations: ['value-vp', 'val-line', 'poc-line', 'vah-line'],
                focus: { from: 0, to: 60 }
              },
              {
                title: '第 2 步：证据层——扫荡与吸收',
                text: '`sweep` 处价格跌破 VAL、刺向 99.95 后被买回，`absorb` 提示看 Delta：主动卖大幅放量（-2400）却没能把价格压下去，说明有被动买在吸收。背景是平衡、证据是吸收，这两层已经对上。',
                annotations: ['sweep', 'absorb', 'val-line'],
                focus: { from: 30, to: 48 }
              },
              {
                title: '第 3 步：位置层——结构转多再入场',
                text: '价格回到价值区内后，`mss` 处突破了下跌结构的最后高点，结构转多；`entry` 是回踩确认后的入场点。到这里三层证据齐全：价值区下沿的扫荡、Delta 的由负转正、结构的转向，缺任何一层都只是“看起来像”。',
                annotations: ['mss', 'entry', 'value-vp'],
                focus: { from: 44, to: 66 }
              },
              {
                title: '第 4 步：目标与失效',
                text: '`target` 指向前方的 VAH / 价值区上沿，`reject` 处价格接近 VAH 后没有继续接受更高价格，提示减速。组合框架的出场同样分层：先到背景层目标减仓，结构走坏再离场，而不是盯着盈亏数字硬扛。',
                annotations: ['target', 'reject', 'vah-line'],
                focus: { from: 70, to: 109 }
              }
            ]
          },
          {
            type: 'p',
            text: '为什么一定要“独立验证”？因为很多指标其实是同一份数据的变体：吸收与 CVD 背离同源、成交量放大又是吸收定义的一部分。如果你把“吸收 + CVD 背离 + 放量”当成三条独立证据，其实是在给同一件事投三票；再加上一个同样由价格算出来的指标，确定性会被严重高估。相对独立的维度是：成交分布（时间 / 成交结构）、订单流（主动 / 被动行为）、价格结构（几何位置）、以及时间（时段 / 事件）。组合框架要求你至少从两个不同维度拿到证据。'
          },
          {
            type: 'chart',
            scenario: 'real-nq-daily',
            caption: '图 2 · NQ 真实日线（Yahoo Finance，NQ=F，2024-10-25 ~ 2026-10-23）：两年区间与近半年成交分布；价格与成交量为真实历史数据，订单流内部数据为教学估算。',
            height: 430,
            steps: [
              {
                title: '第 1 步：先看两年的大区间',
                text: '`range-low` 与 `range-high` 标出两年的最低 16460 与最高 31616，`range-mid` 是中轴 24038。大级别拍卖跨越近一倍价格：先在下半区完成成交，再逐步向上迁移——这是背景层的“大图”，不是买卖信号。',
                annotations: ['range-low', 'range-high', 'range-mid'],
                focus: { from: 0, to: 501 }
              },
              {
                title: '第 2 步：用近半年成交分布定位价值',
                text: '图中叠加的固定区间成交分布取最近约 120 根日线：柱子密集区约在 28800 到 30700，POC 约 29650，明显高于两年中轴 24038。价值长期上移，这是背景层能给出的最有用的信息之一，但“上移”不等于“还会涨”。',
                annotations: [
                  { kind: 'vprofile', x1: 380, x2: 501, bins: 24, showPOC: true, showVA: true, side: 'right', label: '近半年成交分布', tone: 'info' },
                  'swing-l24', 'swing-h24'
                ],
                focus: { from: 360, to: 501 }
              },
              {
                title: '第 3 步：最近的高位拍卖',
                text: '`swing-h23`、`swing-h24` 是最近两个摆动高点，`range-high` 是两年最高位。价格在高位反复拍卖，却始终没能把新高站稳——这是“探索式拍卖”正在进行的证据，结果如何只能等后续成交确认，不能提前判胜负。',
                annotations: ['swing-h23', 'swing-h24', 'range-high'],
                focus: { from: 440, to: 501 }
              },
              {
                title: '第 4 步：把真实图当训练材料',
                text: '把 502 根日线的成交分布与 `range-mid` 并排看：整体 POC 约 24850，几乎就在中轴 24038 附近，而最新价在 29100 上方——这轮上涨主要由近期成交推动，长期价值重心还没完全跟上。',
                annotations: [
                  { kind: 'vprofile', x1: 0, x2: 501, bins: 28, showPOC: true, showVA: true, side: 'right', label: '两年整体成交分布', tone: 'neutral' },
                  'range-mid'
                ],
                focus: { from: 0, to: 501 }
              }
            ]
          },
          {
            type: 'p',
            text: '**真实数据透明声明**：图 2 的价格与成交量来自 Yahoo Finance 的 NQ=F 日线历史数据（2024-10-25 至 2026-10-23），由本项目数据集 `nq-daily` 提供；图中的成交分布、价值区与 POC 是按这些真实成交量统计出来的结果，但 Delta、足迹等订单流内部数据在本项目里是**教学估算**，不是真实逐笔成交。真实历史数据只能说明过去发生了什么，不能预测未来。'
          },
          {
            type: 'callout', tone: 'warn', title: '组合框架的三个风险',
            text: '第一，参数风险：轮廓周期、VA 比例、指标参数都会改变结论，组合时更容易“凑”出想要的答案；第二，后见之明风险：走完的行情里总能找到三层证据，请在收盘前写结论、收盘后再复盘；第三，过拟合风险：规则越多、样本越少，越容易把噪声当规律。任何组合都需要足够的模拟盘样本验证。'
          },
          {
            type: 'checklist', title: '下单前，用这张三层检查表',
            items: [
              '背景层：价值区位置、POC 方向、当前是平衡还是失衡？',
              '证据层：订单流是否支持？这是独立证据还是同源指标的重复？',
              '位置层：有没有结构触发？止损在哪、R 倍数够不够？',
              '如果只满足两层，我是否愿意放弃这笔交易？'
            ]
          },
          {
            type: 'p',
            text: '练习建议：每天选一段行情，先只看轮廓写下背景判断，再打开订单流找证据，最后用结构定位置，全过程截图保存。连续记录 30 个交易日后统计：三层同时满足的交易与只满足两层的交易，结果有没有差别？如果没有差别，说明这套组合对你没有额外价值，应该简化。交易方法没有“学完就会赢”这回事，只有“是否适合你、是否有统计优势”这两个问题。'
          }
        ],
        quiz: {
          questions: [
            {
              q: '组合框架的三层顺序，正确的是？',
              options: [
                '位置 → 背景 → 证据',
                '背景（轮廓）→ 证据（订单流）→ 位置（结构）',
                '证据 → 位置 → 背景',
                '三者随意，顺序不重要'
              ],
              answer: 1,
              why: '先判断环境与价值位置，再找订单流证据，最后用结构决定入场与止损；顺序颠倒容易用信号凑结论。'
            },
            {
              q: '为什么“吸收 + CVD 背离 + 放量”不宜算作三条独立证据？',
              options: [
                '因为它们来自不同软件',
                '因为它们都由同一段成交数据推出，高度同源',
                '因为吸收一定不会伴随放量',
                '因为 CVD 只能在日线使用'
              ],
              answer: 1,
              why: '这些现象同源、彼此包含，重复计数会高估确定性；应从成交分布、订单流、结构、时间等独立维度取证。'
            },
            {
              q: '关于图 2 的真实 NQ 日线数据，正确的说法是？',
              options: [
                '价格与成交量是真实历史数据，Delta 等订单流数据为教学估算',
                '整张图都是实时行情',
                '订单流数据来自交易所逐笔成交',
                '真实数据可以预测未来走势'
              ],
              answer: 0,
              why: '本项目真实数据集只包含真实 OHLCV；Delta / 足迹为教学估算，且历史数据不能预测未来。'
            }
          ]
        },
        sources: [
          { title: 'Key Learnings from Jim Dalton on the Markets（MarketCalls）', url: 'https://www.marketcalls.in/market-profile/key-learnings-from-jim-dalton-on-the-markets.html' },
          { title: 'Market Profile Trading: Understanding Its Power and Impact（Bookmap）', url: 'https://bookmap.com/blog/market-profile-trading-understanding-its-power-and-impact' },
          { title: 'Interview: Jim Dalton of DLC Profiles（Traders.com）', url: 'https://traders.com/Documentation/Feedbk_docs/2007/12/Interview/interview.html' }
        ]
      }
    ],
    sources: [
      { title: 'Metal Market Profile User Guide（CME Group）', url: 'https://beta.cmegroup.com/education/articles-and-reports/metal-market-profile-user-guide.html' },
      { title: 'Auction Theory in Futures Trading（NexusFi Academy）', url: 'https://nexusfi.com/a/market-structure/auction-theory-futures-trading' },
      { title: 'Interview: Jim Dalton of DLC Profiles（Traders.com）', url: 'https://traders.com/Documentation/Feedbk_docs/2007/12/Interview/interview.html' },
      { title: 'Market Profile: How to read market context and uncover fair value zones（FTMO）', url: 'https://ftmo.com/au/blog/market-profile-how-to-read-market-context-and-uncover-fair-value-zones/' },
      { title: 'Market Profile Glossary Index（WindoTrader）', url: 'https://www.windotrader.com/market-profile/market-profile-glossary-index/' },
      { title: 'Market Profile & TPO Charts（GoCharting）', url: 'https://gocharting.com/features/market-profile' }
    ]
  });

  /* ============================ 术语表 ============================ */
  LQ.content.registerGlossary([
    { term: '拍卖', en: 'Auction', def: '市场通过持续报价与成交寻找双方都愿意接受的价格；价格不是被“推”出来的，而是拍卖过程的结果。', moduleId: 'm08', aliases: ['Auction'] },
    { term: '双向拍卖', en: 'Two-Way Auction', def: '买方与卖方同时出价、由撮合决定成交的机制；价格在买卖双方之间来回摆动，直到一方失去耐心。', moduleId: 'm08', aliases: ['连续双向拍卖'] },
    { term: '时间价格机会', en: 'Time Price Opportunity (TPO)', def: '市场轮廓的基本单位：某个时间片内价格是否在该价位成交过，用字母表示；统计的是一段时间内被“触及”的价位。', moduleId: 'm08', aliases: ['TPO'] },
    { term: '市场轮廓', en: 'Market Profile', def: '把 TPO 按价格堆叠成的分布图，用来看价值区、POC 与 tails；它是统计工具，参数可调，不是价格预测器。', moduleId: 'm08', aliases: ['Market Profile', '轮廓图'] },
    { term: '首次平衡', en: 'Initial Balance (IB)', def: '一个交易时段最初一段时间（常见首小时）形成的高低区间；IB 被突破后的方向，常决定当天是区间日还是趋势日。', moduleId: 'm08', aliases: ['IB', '初始平衡'] },
    { term: '区间扩展', en: 'Range Extension', def: '价格突破初始平衡区间并继续成交，说明市场愿意在 IB 之外寻找新价格；扩展幅度与持续性决定趋势日强度。', moduleId: 'm08', aliases: ['RE', 'Range Extension'] },
    { term: '单次打印', en: 'Single Print', def: '某价位只在一个时间片被成交过一次，轮廓上留下孤立的一格；常出现在快速失衡段，代表价格“路过”而非接受。', moduleId: 'm08', aliases: ['Single Print', '单印'] },
    { term: '失衡', en: 'Imbalance', def: '买卖力量或时间分布严重不对称的状态，表现为快速单边移动、价差拉大、成交稀薄；失衡后常需要回到平衡。', moduleId: 'm08', aliases: ['Imbalance'] },
    { term: '失败拍卖', en: 'Failed Auction', def: '价格试探区间外的新高或新低却无法延续、迅速回到区间内；在轮廓上常留下单次打印或 excess，是反转线索之一。', moduleId: 'm08', aliases: ['Failed Auction', '拍卖失败'] },
    { term: '价值迁移', en: 'Value Migration', def: '价值区整体向更高或更低的位置移动的过程；向上迁移通常伴随接受更高价格，向下迁移反之。', moduleId: 'm08', aliases: ['Value Migration', '价值区移动'] },
    { term: '接受与拒绝', en: 'Acceptance & Rejection', def: '价格在新区域停留并持续成交称接受，快速离开且不回头称拒绝；接受程度决定突破是真突破还是失败拍卖。', moduleId: 'm08', aliases: ['Acceptance', 'Rejection'] },
    { term: '探索式拍卖', en: 'Exploratory Auction', def: '市场主动向区间外试探、寻找新成交机会的阶段；试探成功形成新区间，失败则回到原价值区，是区间与趋势之间的过渡。', moduleId: 'm08', aliases: ['Exploratory'] }
  ]);
})();
