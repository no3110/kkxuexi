/* m09/实战考核题库 · content-c（二期）
 * 实战考核题库：图表判读题 + 知识题，供 #/exam 图表判读/知识检测使用。
 * 数据说明：模拟情景为教学用生成数据；real-* 为真实历史行情（来源见情景 dataNote）。
 * 题目要求：图表题必须能在图上核对（结构/标注/数据），解析引用事件 id；不出"猜涨跌"题。
 */
(function () {
  'use strict';
  var C = LQ.content;
  var S = LQ.data;

  var bank = [

    /* ============================================================
     * 一、图表判读题（模拟情景）
     * ============================================================ */

    {
      id: 'ex-chart-001',
      type: 'chart', level: '入门', moduleId: 'm01',
      scenario: 'dow-swings',
      focus: { from: 44, to: 108 },
      annotations: ['break-level', 'll-1', 'lh-1', 'downtrend'],
      tools: false,
      question: '图中价格跌破 105.55 的结构防线后反抽，形成更低的高点与更低的低点。按道氏理论，这段结构最准确的描述是？',
      options: [
        '上涨结构仍在延续，回踩是买点',
        'HH/HL 序列被破坏，LL 与 LH 确认转为下跌结构',
        '价格进入完全无趋势状态，应等待方向',
        '这是假突破，随后一定创新高'
      ],
      answer: 1,
      explain: 'break-level 标出上涨结构最后一条 HL（105.55）。价格跌破后，ll-1 创出更低低点，lh-1 的反抽高点低于前高，HH/HL 被 LH/LL 取代，downtrend 段确认结构转空。这是结构判断而非未来保证，入场仍需设失效条件。'
    },
    {
      id: 'ex-chart-002',
      type: 'chart', level: '进阶', moduleId: 'm01',
      scenario: 'dow-confirm',
      focus: { from: 56, to: 116 },
      annotations: ['hh-weak', 'volume-warn', 'prior-low', 'breakdown'],
      tools: false,
      question: '价格在 78 号附近再创新高，但对应成交量明显缩小；随后 90 号放量跌破前低 107.0。这组证据说明什么？',
      options: [
        '量价背离，上涨动能减弱；跌破前低进一步确认转弱风险',
        '缩量新高代表主力控盘，应继续看涨',
        '成交量与趋势方向无关',
        '放量跌破前低说明可以抄底'
      ],
      answer: 0,
      explain: 'hh-weak 处价格更高而量能更小，是典型量价背离；volume-warn 标出背离区。90 号放量跌破 prior-low 107.0，趋势防线失守，breakdown 说明抛压接管。道氏理论把成交量当作趋势的确认证据，背离加破位构成转弱证据链，但仍可能反复，需要止损保护。'
    },
    {
      id: 'ex-chart-003',
      type: 'chart', level: '进阶', moduleId: 'm02',
      scenario: 'pa-fakeout',
      focus: { from: 36, to: 108 },
      annotations: ['resistance', 'fakeout-zone', 'fakeout-mark', 'genuine-mark', 'retest-zone'],
      tools: false,
      question: '46 号 K 线冲过阻力 104.8 后收盘跌回区间，而 84 号 K 线收盘站上阻力并回踩不破。两者最关键的差别是？',
      options: [
        '前者是假突破（收回区间），后者是有效突破（收盘确认 + 回踩确认）',
        '前者突破幅度更大，所以更可信',
        '只要上影线够长就是真突破',
        '两者都是假突破，没有区别'
      ],
      answer: 0,
      explain: 'fakeout-mark 的上影扫过 resistance 但收盘回到区间内，属于假突破；genuine-mark 收盘站上阻力，retest-zone 显示回踩不破、阻力转支撑，才构成有效突破。关键区别在收盘位置与回踩确认，而不是影线长短。'
    },
    {
      id: 'ex-chart-004',
      type: 'chart', level: '进阶', moduleId: 'm02',
      scenario: 'pa-pinbar',
      focus: { from: 48, to: 102 },
      annotations: ['support', 'pin-zone', 'pin-low', 'pin-high', 'entry-line', 'stop-line', 'target-line'],
      tools: false,
      question: '按图中的针形线计划：触发线 102.0、止损 99.85、目标 105.2。这个计划的风险回报比约为？',
      options: [
        '约 1:0.8',
        '约 1:1.5',
        '约 1:2.4',
        '约 1:5'
      ],
      answer: 1,
      explain: '风险 = 102.0 − 99.85 = 2.15；回报 = 105.2 − 102.0 = 3.2；回报 ÷ 风险 = 3.2 ÷ 2.15 ≈ 1.49，约 1:1.5。针形线出现后要等价格突破高点才触发，止损放在低点下方，pin-low 与 pin-high 给出了明确边界。'
    },
    {
      id: 'ex-chart-005',
      type: 'chart', level: '进阶', moduleId: 'm03',
      scenario: 'ict-sweep',
      focus: { from: 55, to: 99 },
      annotations: ['prior-low', 'sweep', 'displacement', 'ob-zone', 'fvg-zone', 'retest', 'entry', 'stop'],
      tools: false,
      question: '66 号 K 线刺破前低 100.9 后收盘收回，随后连续放量阳线向上位移。按这套模型，接下来最合理的动作是？',
      options: [
        '立即在 100.9 下方追空',
        '等回踩 OB/FVG 区域并确认后做多，止损放扫荡低点下方',
        '在位移末端市价追多，不设止损',
        '等价格跌破前低 100.9 后再做多'
      ],
      answer: 1,
      explain: 'sweep 是扫掉前低止损的假跌破，displacement 显示需求接管；ob-zone 与 fvg-zone 是回踩区，retest 与 entry 标出模型入场，stop 在扫荡低点下方，风险可控。追空、追高或跌破了才做多，都违背"扫荡—位移—回踩确认"的模型逻辑。'
    },
    {
      id: 'ex-chart-006',
      type: 'chart', level: '进阶', moduleId: 'm03',
      scenario: 'ict-structure',
      focus: { from: 44, to: 99 },
      annotations: ['hl-line', 'mss', 'lh', 'll'],
      tools: false,
      question: '价格收盘跌破 104.0 的关键 HL 后，反抽只到更低的高点，随后创出更低的低点。这一系列动作在这套框架里称为？',
      options: [
        'BOS（顺势结构突破）',
        'MSS/CHoCH（性质转变，结构转空）',
        'FVG 回补',
        '流动性吸收'
      ],
      answer: 1,
      explain: 'mss 标出收盘跌破关键 HL 的瞬间，属于市场结构转变（MSS/CHoCH）；lh 与 ll 随后确认下跌结构。BOS 一般指顺势突破前高/前低，此处是反向破坏关键结构，两者不可混用。'
    },
    {
      id: 'ex-chart-007',
      type: 'chart', level: '进阶', moduleId: 'm04',
      scenario: 'of-delta',
      focus: { from: 36, to: 99 },
      annotations: ['high-1', 'high-mid', 'high-2', 'div-zone', 'drop', 'cvd-note'],
      tools: false,
      question: '价格在 76 号创出更高的高点，但同期 Delta 转负、CVD 高点没有同步抬高。这说明什么？',
      options: [
        '买方力量在减弱，新高缺乏主动买盘支持，形成 Delta 背离',
        'Delta 转负意味着价格一定立刻暴跌',
        '成交量越大越看涨',
        'CVD 与价格没有关系'
      ],
      answer: 0,
      explain: 'high-1 时 Delta 同步走强，high-2 价格更高但 Delta 转负，div-zone 标出背离区，drop 显示背离后的回落。Delta 背离是"努力与结果"在订单流上的体现，属于风险线索，但不会保证立刻下跌，还要结合结构与后续确认。'
    },
    {
      id: 'ex-chart-008',
      type: 'chart', level: '进阶', moduleId: 'm04',
      scenario: 'of-profile',
      focus: { from: 0, to: 109 },
      annotations: ['va-box', 'poc-note', 'breakout', 'retest', 'new-value'],
      tools: false,
      question: '价格收盘站上价值区上沿后回踩不破，随后在更高价位形成新的成交密集区。这最可能说明？',
      options: [
        '价值区下移，原上沿转为压力',
        '价值区上移，原价值区上沿转为支撑',
        'POC 从此不再有参考意义',
        '价格一定回到原价值区'
      ],
      answer: 1,
      explain: 'va-box 是前期价值区；breakout 收盘站上上沿，retest 回踩不破说明阻力转支撑，new-value 显示新价值区在更高位置形成，即价值向上迁移。POC/VA 是统计工具，参数与可视区间会影响结果，不能当作精确预言。'
    },
    {
      id: 'ex-chart-009',
      type: 'chart', level: '进阶', moduleId: 'm05',
      scenario: 'wy-spring',
      focus: { from: 48, to: 100 },
      annotations: ['range-low', 'spring-zone', 'spring', 'liquidity', 'test', 'sos', 'invalidation'],
      tools: false,
      question: '64 号 K 线盘中跌破区间下沿后收回，76 号缩量回踩且低点抬高，82 号放量收复上沿。按威科夫框架，这一组信号说明？',
      options: [
        'Spring 失败，应顺势做空',
        'Spring + 缩量 Test + SOS 依次成立：抛压枯竭、需求接管',
        '只是随机波动，没有有效信息',
        '只要出现长下影就应该满仓买入'
      ],
      answer: 1,
      explain: 'spring 是假跌破收回，liquidity 标注它扫掉了区间下沿的止损；test 缩量且低点高于 Spring 低点，说明卖压衰减；sos 放量收复区间上沿确认需求接管。invalidation 是失效线：跌破 Spring 低点则整个假设作废——再好的结构也要有作废条件。'
    },
    {
      id: 'ex-chart-010',
      type: 'chart', level: '进阶', moduleId: 'm05',
      scenario: 'wy-distribution',
      focus: { from: 16, to: 109 },
      annotations: ['bc', 'st', 'ut', 'utad', 'lpsy', 'top-line', 'bottom-line', 'markdown'],
      tools: false,
      question: '58 号冲高到 109.4 后收回区间，76 号再次上冲失败，88 号反弹只到更低的 107.5。按派发结构解读，这组动作的含义是？',
      options: [
        '上方供给强，UT/UTAD/LPSY 依次确认，后续跌破冰面的风险上升',
        '每次上冲失败都是加仓做多的机会',
        '派发区间之后一定会马上暴跌',
        'ST 缩量说明买盘更强'
      ],
      answer: 0,
      explain: 'bc 是买入高潮；st 缩量反弹说明需求不足；ut 冲高回落，utad 是派发末期最后上冲失败，lpsy 是更低的反抽高点，三者共同指向供给占优。bottom-line 下方的 markdown 是跌破冰面后的下跌延续。注意"风险上升"不等于"一定暴跌"，仍要用失效条件管理。'
    },
    {
      id: 'ex-chart-011',
      type: 'chart', level: '进阶', moduleId: 'm05',
      scenario: 'wy-laws',
      focus: { from: 50, to: 110 },
      annotations: ['cause-range', 'creek', 'sos', 'lps', 'effect', 'target'],
      tools: false,
      question: '70 号 K 线放量越过区间上沿（溪流 103.0），82 号回踩到 103.4 附近不破。按威科夫因果定律，接下来较合理的动作是？',
      options: [
        '在 82 号回踩确认后顺势入场，止损放在回踩低点或区间下沿下方',
        '在 70 号突破瞬间满仓追多，不设止损',
        '反向做空，因为突破往往会失败',
        '等价格跌回区间内部再考虑做多'
      ],
      answer: 0,
      explain: 'cause-range 是"因"（横盘换手），sos 是放量跳溪的强势信号，lps 是回踩不破区间上沿的最后支撑点，之后才有 effect 的趋势展开。合理做法是等回踩确认（LPS）再入场，并预设失效条件；量度目标 target 只是参考，不是保证。'
    },
    {
      id: 'ex-chart-012',
      type: 'chart', level: '进阶', moduleId: 'm06',
      scenario: 'risk-atr',
      focus: { from: 36, to: 95 },
      annotations: ['tr-bar', 'tr-high', 'tr-low', 'prev-close', 'spike', 'gap'],
      tools: false,
      question: '按 TR 公式：TR = max(最高−最低, |最高−昨收|, |最低−昨收|)。图中 44 号 K 线最高 100.9、最低 97.9、前收 99.2，这一根的 TR 是多少？',
      options: [
        '1.3',
        '1.7',
        '2.0',
        '3.0'
      ],
      answer: 3,
      explain: '三个候选值：100.9 − 97.9 = 3.0；|100.9 − 99.2| = 1.7；|97.9 − 99.2| = 1.3，取最大值为 3.0。tr-high、tr-low、prev-close 标出了三个参照价，spike 与 gap 指出这根 K 线的跳空与长影线。ATR 是 TR 的 Wilder 平滑，单根异常会抬高 ATR 但不会让它剧烈跳动。'
    },
    {
      id: 'ex-chart-013',
      type: 'chart', level: '进阶', moduleId: 'm06',
      scenario: 'risk-atr-stop',
      focus: { from: 30, to: 110 },
      annotations: ['entry', 'entry-line', 'stop-initial', 'risk-zone', 'trail-be', 'trail-1', 'trail-2', 'stop-hit', 'result'],
      tools: false,
      question: '图中计划在 100.0 入场、初始止损 98.0，最后移动止损在 104.9 被触发离场。按 1R = 入场价与初始止损的距离计算，这笔交易的最终结果约为多少 R（未计成本）？',
      options: [
        '约 +1.2R',
        '约 +2.4R',
        '约 +4.9R',
        '约 −1R'
      ],
      answer: 1,
      explain: '1R = 100.0 − 98.0 = 2.0；离场 104.9，盈利 = 104.9 − 100.0 = 4.9；4.9 ÷ 2.0 ≈ 2.45R。trail-be、trail-1、trail-2 逐步上移锁定利润，stop-hit 触发后离场，result 显示价格之后继续下跌，说明移动止损保护了已有利润。'
    },
    {
      id: 'ex-chart-014',
      type: 'chart', level: '实战', moduleId: 'm07',
      scenario: 'final-mtf',
      focus: { from: 60, to: 120 },
      annotations: ['base-zone', 'choch', 'hh', 'hl', 'entry-zone', 'stop-line', 'target-line'],
      tools: false,
      question: '按"大周期定方向、中周期找结构、小周期等触发"的 SOP，图中 94 号放量突破区间上沿、随后走出 HH 与回踩 HL 后，较合理的做法是？',
      options: [
        '突破瞬间市价追多，止损放在区间中部',
        '等回踩 HL 区域（entry-zone）确认后入场，止损放结构低点下方，目标看前高上方',
        '因为此前大周期是下跌，所以永远不做多',
        '等价格跌破区间下沿再考虑做多'
      ],
      answer: 1,
      explain: 'choch 突破区间上沿、hh 创出更高高点、hl 回踩不破，说明结构转多；entry-zone 是回踩买点，stop-line 在结构低点下方约 1×ATR，target-line 指向前高上方流动性。等回踩确认能让入场成本与失效条件都更清晰。'
    },
    {
      id: 'ex-chart-015',
      type: 'chart', level: '实战', moduleId: 'm07',
      scenario: 'final-plan',
      focus: { from: 40, to: 80 },
      annotations: ['demand-zone', 'entry-line', 'stop-line', 'tp1-line', 'tp2-line', 'hit-tp1', 'hit-tp2'],
      tools: false,
      question: '这份计划：入场 102.0、止损 100.5、TP1 103.5、TP2 105.0。下列说法正确的是？',
      options: [
        '1R = 1.5，TP1 为 1R、TP2 为 2R，盈亏比 2:1，分批止盈合理',
        '1R = 0.5，TP2 只有 1R',
        '止损距离 3.0，盈亏比 1:1',
        '目标明确，所以不需要设止损'
      ],
      answer: 0,
      explain: '1R = 102.0 − 100.5 = 1.5；TP1 距离入场 103.5 − 102.0 = 1.5 = 1R；TP2 为 3.0 = 2R，盈亏比 2:1。hit-tp1 与 hit-tp2 标出减半与清仓位置。计划里还有失效条件，止损不能因为"目标明确"被省略。'
    },

    /* ============================================================
     * 一之二、图表判读题（拍卖理论 m08 · 模拟情景）
     * ============================================================ */
    {
      id: 'ex-chart-019',
      type: 'chart', level: '入门', moduleId: 'm08',
      scenario: 'auction-basics',
      focus: { from: 0, to: 95 },
      annotations: ['ib-zone', 'ib-high', 'ib-low', 'failed-low', 'ext-up'],
      tools: false,
      question: '开盘后首小时形成初始平衡（IB 高 100.55 / 低 99.9）。30 号附近价格跌破 IB 低点后收回，66 号突破 IB 高点。按拍卖理论，正确的解读是？',
      options: [
        '跌破 IB 低点后收回是“失败拍卖”，突破 IB 高点并被接受才是区间扩展',
        '只要跌破 IB 低点就一定会继续下跌',
        'IB 的高低点没有任何参考意义',
        '突破 IB 高点后一定不会再回落'
      ],
      answer: 0,
      explain: 'ib-zone 是首小时的初始平衡区；failed-low 显示价格跌破 ib-low 后收回，属于失败拍卖（该价位未被接受）；ext-up 显示突破 ib-high 之后的区间扩展。试探是否成功，取决于之后“是否被接受”，而不是试探动作本身。'
    },
    {
      id: 'ex-chart-020',
      type: 'chart', level: '进阶', moduleId: 'm08',
      scenario: 'auction-value',
      focus: { from: 50, to: 119 },
      annotations: ['old-vah', 'old-val', 'breakout', 'accept', 'new-balance'],
      tools: false,
      question: '价格向上失衡突破旧价值区上沿 101.5，随后在 102 附近回踩收回，并在更高位置形成新的成交密集区。按拍卖理论，这组结构说明什么？',
      options: [
        '旧价值区被接受为新的支撑，价值区上移（旧 VAH 转支撑）',
        '价格一定马上跌回旧价值区',
        'POC 会永远停在 101 附近',
        'VAH 与 VAL 是同一条线'
      ],
      answer: 0,
      explain: 'breakout 表示向上失衡、离开 old-vah 101.5；accept 显示回踩 102 附近被市场接受；new-balance 与 new-vp 显示新价值区在更高位置形成、POC 上移。旧 VAH 由阻力转为支撑，这是价值迁移的典型路径。注意 VA 边界是统计结果，参数与窗口不同会变化。'
    },
    {
      id: 'ex-chart-021',
      type: 'chart', level: '进阶', moduleId: 'm08',
      scenario: 'auction-imbalance',
      focus: { from: 0, to: 99 },
      annotations: ['balance-zone', 'single-print', 'imbalance-leg', 'peak', 'failed-auction', 'value-zone'],
      tools: false,
      question: '价格用连续大实体离开平衡区（失衡），越过前高后没有获得跟随，随后跌回区间并在下方重新堆积成交。这一现象叫什么？',
      options: [
        '失败拍卖（failed auction）：新高未被接受，价格回到价值区',
        '成功的区间扩展，应继续追多',
        '流动性扫荡后必然上涨',
        '订单流数据错误'
      ],
      answer: 0,
      explain: 'single-print 与 imbalance-leg 显示价格快速通过、成交稀薄的失衡段；peak 越过前高，但 failed-auction 标出“新高无跟随、价格跌回区间”，value-zone 显示成交重新在下方堆积。失败拍卖是拍卖理论里重要的“拒绝”信号，说明该价位未被接受，但不保证后续方向。'
    },

    /* ============================================================
     * 一之三、图表判读题（真实情景 · module='real'，数据来自 Lead 的 real 情景）
     * ============================================================ */
    {
      id: 'ex-chart-016',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 135, to: 200 },
      annotations: ['swing-l3', 'swing-h5', 'swing-l4', 'swing-h6'],
      tools: false,
      question: 'NQ=F 真实日线 2025 年年中：L3（bar 144，低点约 20727）之后出现 H5（bar 156，约 22106）、回踩 L4（bar 162，约 21435.5）、再创 H6（bar 191，约 23845）。这段结构说明什么？',
      options: [
        'H6 高于 H5、L4 高于 L3，构成 HH + HL，上升结构延续',
        'H5 高于 H6，构成 LH + LL 下跌结构',
        '价格进入无趋势区间',
        '单根 K 线无法构成任何结构'
      ],
      answer: 0,
      explain: 'swing-h6 的高点 23845 高于 swing-h5 的 22106，构成更高的高点 HH；swing-l4 的低点 21435.5 高于 swing-l3 的 20727，构成更高的低点 HL，因此这段是 HH+HL 上升结构。注意这是对历史结构的标注，结构延续不代表未来一定上涨：之后若跌破最近的关键 HL，就要按标准重新评估。'
    },
    {
      id: 'ex-chart-017',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 0, to: 501 },
      annotations: ['range-high', 'range-low', 'range-mid', 'swing-h24'],
      tools: false,
      question: '图中 range-high 31616.5、range-low 16460、range-mid 24038.25 是自动标注的两年区间水平位。当前收盘 29117.75 位于 range-mid 上方，这最合理的解读是？',
      options: [
        '价格处于两年区间的上半部，属于相对强势区域，但这不构成买入信号',
        '价格一定会涨到 range-high',
        'range-mid 是多空分界线，跌破就必然进入熊市',
        '区间水平位没有任何参考价值'
      ],
      answer: 0,
      explain: 'range-mid = (31616.5 + 16460) ÷ 2 = 24038.25，是两年区间中轴；当前收盘 29117.75 在中轴上方，说明两年维度价格处于上半区。位置只描述相对强弱，不能替代结构与风控。range-low 对应 2025-04-07 的真实低点，range-high 与 swing-h24 的高点 31616.5 重合，说明区间边界对应真实的历史高低点。'
    },
    {
      id: 'ex-chart-018',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 478, to: 501 },
      annotations: ['swing-h24', 'range-high'],
      tools: false,
      question: 'H24（bar 488）的高点 31616.5 恰好是图上 range-high 标记的两年最高点，随后价格回落至 29117.75（bar 501 收盘）。这段走势最合理的解读是？',
      options: [
        '前高 / 区间上沿附近存在供给，创新高失败后回落；不能因为创了新高就忽略风险',
        '价格创新高就一定会继续上涨',
        'range-high 是支撑位，回落后应该做多',
        '这段回落直接说明两年趋势已经反转'
      ],
      answer: 0,
      explain: 'range-high 与 swing-h24 的高点重合于 31616.5，说明这里是真实的区间上沿；H24 之后价格回落到 29117.75，幅度约 7.9%，是前高附近典型的供给反应。是否反转需要结构证据——比如跌破最近的关键 HL、形成 LH+LL 序列；单次回落不能直接定性为趋势反转，也不构成做多或做空信号。'
    },

    {
      id: 'ex-chart-022',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 470, to: 486 },
      annotations: ['swing-l24', 'swing-h23'],
      tools: false,
      question: 'L24（bar 474，低点约 28763.75）之后价格连续上涨：bar 475 成交量仅约 7.5 万（阶段地量止跌），bar 476-478 放量到 51 万以上并创出 H23（bar 479，约 31094.75）。按道氏理论，成交量在这段走势里起什么作用？',
      options: [
        '上涨得到成交量确认：缩量止跌之后放量推进，说明需求主导',
        '量价背离：价格涨而成交量缩小',
        '成交量与趋势方向无关',
        '放量上涨说明马上要反转下跌'
      ],
      answer: 0,
      explain: 'bar 475 的成交量约 74,615，是阶段地量，价格却止跌收高，说明卖压枯竭；随后 476-478 号成交量回到 51 万-54 万，价格连续推进并创出 swing-h23。放量上涨是道氏理论中“趋势得到成交量确认”的典型形态。注意 bar 479（H23）放量收阴，属于短期供给信号，需要结合后续结构，不代表趋势立刻反转。'
    },
    {
      id: 'ex-chart-023',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 405, to: 460 },
      annotations: ['swing-h18', 'swing-l20', 'swing-l21', 'swing-h19'],
      tools: false,
      question: '看 2026 年年中这段：H18（bar 414，约 30968）之后回落到 L20（bar 425，约 28909.75），随后继续跌破到 L21（bar 440，约 27201.5），反弹只到 H19（bar 445，约 30074）。按结构语言，这段序列说明什么？',
      options: [
        'H19 低于 H18 形成 LH，L21 低于 L20 形成 LL，原上升结构被破坏',
        'HH + HL 延续，回踩是买点',
        '价格进入完全无趋势状态',
        '数据不足，无法判断'
      ],
      answer: 0,
      explain: 'swing-h19 的高点约 30074 低于 swing-h18 的约 30968，构成更低的高点 LH；swing-l21 的低点约 27201.5 低于 swing-l20 的约 28909.75，构成更低的低点 LL。LH+LL 说明原上升结构被破坏，结构转为下跌。后续价格在 2026 年下半年重新转强并创出 swing-h24（31616.5），说明结构判断要持续更新，不能一次定性就长期沿用。'
    },
    {
      id: 'ex-chart-024',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-daily',
      focus: { from: 100, to: 145 },
      annotations: ['range-low', 'swing-l1', 'swing-l2'],
      tools: false,
      question: '2025 年 4 月这段：bar 111 最低跌到 16460（range-low 与 swing-l1 标记的两年低点），bar 120 再度下探 17700（swing-l2），随后约一个月内价格回到 20000 附近（bar 130 收盘约 20055）。这段走势最能说明什么？',
      options: [
        '急跌被快速买回，该区域存在承接；但这是对历史走势的解读，不预示未来',
        '价格会再次跌到 16460',
        '急跌之后一定马上进入牛市',
        '成交量与这段走势无关'
      ],
      answer: 0,
      explain: '这段是真实历史数据：bar 110-111 出现巨大的放量急跌，最低 16460，随后价格在约一个月内回到 20000 上方，说明下方存在承接、急跌没有延续。用道氏/结构的语言，可以把它看作上升背景中的一次剧烈次级折返，但历史走势不能外推为未来方向——每一段行情都要重新用结构与风控去验证。'
    },

    /* ============================================================
     * 一之四、图表判读题（GC 日线 / 日内、NQ 日内 · 真实情景）
     * ============================================================ */
    {
      id: 'ex-chart-025',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-gc-daily',
      focus: { from: 220, to: 290 },
      annotations: ['swing-h1', 'swing-h4', 'swing-l1', 'swing-l4'],
      tools: false,
      question: 'MGC=F 真实日线（COMEX 微型黄金主连，15m 聚合）2025 年 2-5 月：高点从 H1（bar 231，约 2941）依次抬到 H4（bar 271，约 3509），低点从 L1（bar 227，约 2844）抬到 L4（bar 279，约 3209.5）。这段结构说明什么？',
      options: [
        '高点与低点同时抬高，构成 HH + HL，上升结构',
        '高点抬高但低点下移，结构背离',
        'LH + LL，下跌结构',
        '区间震荡，没有方向'
      ],
      answer: 0,
      explain: 'swing-h4 的高点 3509.4 高于 swing-h1 的 2941.2，swing-l4 的低点 3209.5 高于 swing-l1 的 2844.3，高点与低点同步抬高，构成 HH+HL 的上升结构。数据来源：GitHub domzack/mgc-ohlcv-data（CME COMEX MGC 连续合约 15m 聚合日线），不是 Yahoo GC=F；MGC 是 GC 的微型合约，方向与结构相同但价格略低。历史结构不代表未来。'
    },
    {
      id: 'ex-chart-026',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-gc-daily',
      focus: { from: 500, to: 540 },
      annotations: ['swing-h17', 'range-high'],
      tools: false,
      question: 'MGC=F 真实日线：H17（bar 512）最高 5587，等于图上 range-high（区间最高）；两天后 bar 514 出现全段最大成交量约 149 万，长阴从开盘 5437.2 跌到收盘 4914.9（当日跌幅约 9.5%，收盘接近最低）。这组量价说明什么？',
      options: [
        '高位天量长阴：供应压倒需求，警惕派发与追高风险',
        '放量上涨得到确认',
        '缩量回调，趋势健康',
        '成交量数据异常，不能解读'
      ],
      answer: 0,
      explain: 'swing-h17 的高点 5587 与 range-high 重合，是这段行情的真实最高点；随后 bar 514 成交量 1,491,698 为全段最大，价格长阴收低，属于典型的高位放量下跌（派发/恐慌迹象）。注意这是历史数据（GitHub domzack/mgc-ohlcv-data，MGC 15m 聚合日线），不能据此预测未来方向。'
    },
    {
      id: 'ex-chart-027',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-nq-intraday',
      focus: { from: 392, to: 430 },
      annotations: ['swing-l3', 'range-low', 'range-mid', 'swing-h1'],
      tools: false,
      question: 'NQ=F 真实日内（5m）：bar 406 最低下探 29002，正好是 range-low（区间最低），收盘回到 29041.75；随后价格反弹到 H1（bar 414，约 29129）。这段最合理的解读是？',
      options: [
        '下探区间下沿后收回，是扫荡/假跌破；但价格仍在 range-mid 下方，不能单凭此看多突破',
        '有效跌破区间下沿，趋势转空',
        '突破区间上沿，趋势转多',
        '没有任何信息量'
      ],
      answer: 0,
      explain: 'swing-l3（bar 406）的最低点 29002 与 range-low 重合，收盘 29041.75 收回，随后反弹到 swing-h1 的 29129.25——这是对区间下沿流动性的扫荡。但价格仍在 range-mid（约 29286.6）之下，说明只是回到区间内，还没有形成向上突破；把扫荡直接当反转，是初学者常见的误读。数据为真实 NQ=F 5m（GitHub 1m 聚合）。'
    },
    {
      id: 'ex-chart-028',
      type: 'chart', level: '实战', moduleId: 'm09',
      scenario: 'real-gc-intraday',
      focus: { from: 405, to: 445 },
      annotations: ['swing-l6', 'range-low', 'swing-h6'],
      tools: false,
      question: 'MGC=F 真实日内（15m）：bar 415 出现全段最大成交量约 3.2 万，价格快速下杀；bar 416 最低 4100（=range-low）后收盘拉回 4137.4，随后反弹到 H6（bar 431，约 4465.9）。这组价量说明什么？',
      options: [
        '放量急跌后收回，恐慌抛售被承接（失败拍卖/吸收），随后反弹；但仍是历史案例',
        '放量下跌确认趋势继续走弱',
        '缩量反弹，不能持续',
        '数据错误，无法解读'
      ],
      answer: 0,
      explain: 'bar 415 成交 32,262 为全段最大，bar 416 最低 4100 与 range-low 重合，收盘 4137.4 收回，随后反弹到 swing-h6 的 4465.9。放量急跌后收回，说明区间下沿出现承接（失败拍卖/吸收迹象），但这属于历史案例，不代表未来；数据来源 GitHub domzack/mgc-ohlcv-data（MGC 15m）。'
    },

    /* ============================================================
     * 二、知识题（覆盖 9 个模块）
     * ============================================================ */
    {
      id: 'ex-know-001',
      type: 'knowledge', level: '入门', moduleId: 'm01',
      question: '按道氏理论，三种趋势层级中，持续数月至数年、决定整体方向的是哪一层？',
      options: ['小级别波动', '次级折返', '主要趋势', '日内噪音'],
      answer: 2,
      explain: '主要趋势（Primary Trend）像潮汐，持续数月至数年；次级折返像波浪，持续数周到数月；小级别波动像涟漪，持续数天。三者方向可能相反，所以看趋势要先确认层级。'
    },
    {
      id: 'ex-know-002',
      type: 'knowledge', level: '入门', moduleId: 'm02',
      question: '同样是带长下影线的针形线，出现在哪个位置时更值得关注？',
      options: ['区间中部任意位置', '被测试多次的支撑位/前低附近', '连续上涨后的任何位置', '成交量最小的位置'],
      answer: 1,
      explain: 'K 线形态要结合位置读：支撑位或前低附近的长下影说明价格被拒绝、买盘承接；区间中部的针形线信息量低。位置比形态本身更重要，这也是价格行为的第一原则。'
    },
    {
      id: 'ex-know-003',
      type: 'knowledge', level: '进阶', moduleId: 'm03',
      question: 'BOS（Break of Structure）与 CHoCH/MSS 的主要区别是？',
      options: [
        'BOS 是顺势突破前高/前低，CHoCH 是趋势性质改变（反向破坏关键结构）',
        '两者完全一样，只是叫法不同',
        'BOS 只出现在日线图',
        'CHoCH 只适用于订单流'
      ],
      answer: 0,
      explain: 'BOS 表示趋势延续的结构突破；CHoCH（Change of Character）或 MSS 表示结构性质改变，比如上升结构中的关键 HL 被跌破。两者都需要收盘确认与后续跟随，否则容易把假突破当结构信号。'
    },
    {
      id: 'ex-know-004',
      type: 'knowledge', level: '进阶', moduleId: 'm03',
      question: '这套框架里的"订单块 OB"通常指什么？',
      options: [
        '成交量最大的那根 K 线',
        '位移行情之前最后一根反向 K 线，被视为机构成本区',
        '任意一根十字星',
        '交易所的挂单列表'
      ],
      answer: 1,
      explain: 'OB 常被定义为一段位移（displacement）出现前的最后一根反向 K 线，框架认为那里是机构建仓或派发的成本区。它属于经验框架，需要结合结构、流动性扫荡与回踩确认使用，并不是精确的机构数据。'
    },
    {
      id: 'ex-know-005',
      type: 'knowledge', level: '进阶', moduleId: 'm04',
      question: 'Delta 与 CVD 分别指什么？',
      options: [
        'Delta 是主动买减主动卖，CVD 是 Delta 的累计值',
        'Delta 是成交量，CVD 是持仓量',
        '两者都是价格指标',
        'Delta 是挂单量，CVD 是撤单量'
      ],
      answer: 0,
      explain: 'Delta 衡量单根或区间内主动买与主动卖的差额；CVD（Cumulative Volume Delta）把 Delta 逐根累加，用来看买卖压力趋势。它们是基于成交方向的推断，不同数据源算法不同，不能当作真实逐笔订单流。'
    },
    {
      id: 'ex-know-006',
      type: 'knowledge', level: '进阶', moduleId: 'm04',
      question: '"吸收（Absorption）"在订单流里通常描述什么现象？',
      options: [
        '成交量放大但价格不再朝原方向走，主动单被限价单吃掉',
        '成交量突然归零',
        '价格跳空高开',
        '所有挂单被撤走'
      ],
      answer: 0,
      explain: '吸收指一方持续用主动单攻击，但价格被另一方的限价单承接住、不再沿原方向走。比如放量下杀却跌不动，可能是有大额买盘吸收抛压。它是证据之一，需要结合位置与后续突破验证。'
    },
    {
      id: 'ex-know-007',
      type: 'knowledge', level: '进阶', moduleId: 'm08',
      question: '市场轮廓（Market Profile）中，POC 与价值区（Value Area）分别指什么？',
      options: [
        'POC 是成交量最集中的价格，价值区通常取约 70% 成交量所在的价格区间',
        'POC 是最低价，价值区是最高价',
        'POC 是开盘价，价值区是收盘价',
        '两者都是均线指标'
      ],
      answer: 0,
      explain: 'POC（Point of Control）是该区间内成交量/TPO 最集中的价格；价值区一般定义为包含约 70% 成交量的价格带（VAH 为上沿、VAL 为下沿）。它是统计工具，时间窗口与参数会改变结果，需要样本验证。'
    },
    {
      id: 'ex-know-008',
      type: 'knowledge', level: '进阶', moduleId: 'm08',
      question: '拍卖理论（Auction Market Theory）如何看待价格在区间内来回运动？',
      options: [
        '市场通过双向拍卖寻找双方都接受的价值区，价格离开后若被拒绝会回到区间',
        '价格运动完全随机，没有任何结构',
        '区间只是主力随意画出来的线',
        '只要出现区间就一定会突破'
      ],
      answer: 0,
      explain: 'AMT 认为市场在持续的双向拍卖中形成价值区；价格向上或向下试探若缺乏响应（失败拍卖），会回到价值区。这套框架解释"为什么震荡、价值如何迁移"，但不预测必然的突破方向。'
    },
    {
      id: 'ex-know-009',
      type: 'knowledge', level: '进阶', moduleId: 'm05',
      question: '威科夫三大定律中的"努力与结果"，主要对比什么？',
      options: [
        '成交量（努力）与价格实际进展（结果）',
        '时间与价格',
        '均线与价格',
        '高点与低点'
      ],
      answer: 0,
      explain: '努力指成交量代表的交易投入，结果指价格实际走了多远。天量滞涨或缩量突破都是两者不匹配的信号，需要结合位置（区间上沿/下沿）解读，不能脱离位置谈量价。'
    },
    {
      id: 'ex-know-010',
      type: 'knowledge', level: '进阶', moduleId: 'm06',
      question: '真实波幅 TR 的公式是？',
      options: [
        'TR = max(最高−最低, |最高−昨收|, |最低−昨收|)',
        'TR = 最高 − 最低',
        'TR = 收盘 − 开盘',
        'TR = 成交量 ÷ 价格'
      ],
      answer: 0,
      explain: 'TR 取三个候选值中的最大者，把跳空也纳入波动。ATR 是对 TR 做 Wilder 平滑：ATR = (前 ATR×(N−1) + 当根 TR) ÷ N，参数通常取 14，但参数不是神圣数字，需要与周期保持一致。'
    },
    {
      id: 'ex-know-011',
      type: 'knowledge', level: '进阶', moduleId: 'm06',
      question: '某方法胜率 50%、平均盈亏比 2:1（盈利 2R、亏损 1R），其期望值 E(R) 为？',
      options: ['+0.5R', '+1R', '−0.5R', '0R'],
      answer: 0,
      explain: 'E(R) = 胜率 × 盈亏比 − (1−胜率) × 1 = 0.5×2 − 0.5×1 = 1.0 − 0.5 = +0.5R。期望值为正只代表长期概率有利，不代表每笔都赚，还需要足够样本与成本控制来验证。'
    },
    {
      id: 'ex-know-012',
      type: 'knowledge', level: '实战', moduleId: 'm07',
      question: '多周期分析 SOP 的正确顺序是？',
      options: [
        '小周期找信号 → 中周期确认 → 大周期解释',
        '大周期定方向 → 中周期找结构 → 小周期等触发',
        '只用一个周期就够了',
        '先看消息面，再随意选周期'
      ],
      answer: 1,
      explain: '大周期决定方向与赔率，中周期提供结构（区间、突破、回踩），小周期负责触发与入场。顺序反过来容易被低周期噪音带偏，也容易在没有结构依据时凭感觉下单。'
    },
    {
      id: 'ex-know-013',
      type: 'knowledge', level: '实战', moduleId: 'm07',
      question: '交易计划中的"失效条件"与"止损"的关系是？',
      options: [
        '失效条件定义分析前提被证伪，可能比止损更早触发离场',
        '两者完全一样，可以互相替代',
        '有了止损就不需要失效条件',
        '失效条件只用于加仓'
      ],
      answer: 0,
      explain: '止损限制金额，失效条件限制继续自我欺骗：价格可能还没到止损，但结构已经破坏（例如收盘重新跌回区间），这时也应按计划离场。两者配合，才是完整的风险控制。'
    },
    {
      id: 'ex-know-014',
      type: 'knowledge', level: '实战', moduleId: 'm09',
      question: '真实案例库中的 NQ/GC 图表，关于 Delta、Footprint 等订单流数据，正确的理解是？',
      options: [
        '它们是真实逐笔成交数据，可直接用于实盘决策',
        '真实历史 OHLCV 来自公开数据源，但 Delta/Footprint 等内部数据为教学估算，不能当作真实逐笔订单流',
        '真实案例可以保证未来走势',
        '真实数据不需要注明来源'
      ],
      answer: 1,
      explain: '真实案例库的 OHLCV 来自公开历史数据（如 Yahoo Finance），用于结构与趋势判读；Delta、Footprint 等逐笔内部数据无法从日线还原，是教学估算，只用于演示读法。任何历史案例都不构成未来预测。'
    }
  ];

  /* 注册题库：优先使用 V2 注册中心 API；若注册中心尚未升级则提供只读兜底（避免题库静默丢失）。 */
  var registered = false;
  if (C && typeof C.registerExamQuestions === 'function') {
    C.registerExamQuestions(bank);
    registered = true;
  }
  if (!registered && C) {
    C.examQuestions = bank;
    if (typeof C.listExamQuestions !== 'function') {
      C.listExamQuestions = function () { return bank.slice(); };
    }
  }

  /* ============================================================
   * 术语表补充：考核 / 复盘相关（6 条，全站去重）
   * ============================================================ */
  if (C && typeof C.registerGlossary === 'function') {
    C.registerGlossary([
      {
        term: '错题复盘', en: 'Mistake Review',
        def: '把做错的题按错误类型归类（概念、读图、计算、粗心），针对高频错误回到对应课程复习，而不是只记答案。',
        moduleId: 'm07', aliases: ['错题本']
      },
      {
        term: '图表判读', en: 'Chart Interpretation',
        def: '依据图上的结构、标注与量价证据做出可验证的判断；考核中的图表题必须能在图上指认依据，不靠猜涨跌。',
        moduleId: 'm07'
      },
      {
        term: '判读依据', en: 'Chart Evidence',
        def: '图上可以指认的结构或事件，如扫荡、结构突破、POC 位置；没有依据的结论在考核中不能得分。',
        moduleId: 'm07'
      },
      {
        term: '过程评分', en: 'Process Scoring',
        def: '用“是否按流程执行”而非单次盈亏来评价交易或答题，减少运气对评价的干扰，便于持续改进。',
        moduleId: 'm07'
      },
      {
        term: '知识迁移', en: 'Knowledge Transfer',
        def: '把某一模块学到的读图方法用到新情景（新周期、新品种）上的能力，是结业考核的重点。',
        moduleId: 'm07'
      },
      {
        term: '结业考核', en: 'Final Assessment',
        def: '覆盖 9 个模块的综合测试：知识题检查概念，图表题检查能否在真实或模拟图上找到证据并做出判断。',
        moduleId: 'm07'
      }
    ]);
  }
})();
