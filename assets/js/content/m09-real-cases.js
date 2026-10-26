/* 模块 m09 真实市场案例：NQ 与 GC（content-a 维护）
 * 真实情景由 assets/js/data/real/nq-gc.js 注册（module='real'，Lead 维护）；本文件只注册课程与术语。
 * 数据来源：Yahoo Finance（NQ=F / GC=F 主连期货）。K 线/成交量为真实历史数据；
 * Delta / Footprint 等订单流内部数据为教学估算，不是真实逐笔订单流；历史数据不构成未来预测。
 * 本文件不构成任何投资建议。
 */
(function () {
  'use strict';
  var C = LQ.content;

  /* ============================================================
   * 模块 m09：真实市场案例（4 课，引用 Lead 的 real 共享情景）
   * ============================================================ */
  C.registerModule({
    id: 'm09',
    order: 9,
    stage: 9,
    stageName: '阶段九 · 真实案例',
    title: '真实市场案例：NQ 与 GC',
    en: 'Real-Market Case Studies',
    tagline: '把课堂方法放进真实行情里检验',
    summary: '用真实 NQ=F（Yahoo Finance 日线）、MGC=F（GitHub 公开的 COMEX 微型黄金连续合约 15m/聚合日线）与 NQ 日内（GitHub 1m 聚合 5m）K 线，把道氏结构、价格行为、流动性扫荡、拍卖理论与威科夫方法放进真实盘面复盘。真实行情不会像模拟图那样工整：有跳空、有长影线、有假突破。本模块训练“在噪音中按流程判断”，不是预测未来；Delta 与足迹为教学估算，不构成投资建议，交易有风险。',
    minutes: 80,
    level: '实战',
    accent: '#f472b6',
    icon: 'target',
    outcomes: [
      '看懂真实主连合约的边界：换月缺口、数据来源与成交量口径',
      '用道氏/结构/价格行为在真实 NQ 图上写出可验证的趋势结论',
      '用价值区与威科夫阶段语言复盘真实黄金行情',
      '建立“真实数据 → 回放 → 复盘 → 样本外验证”的训练闭环'
    ],
    lessons: [
      /* ============================================================
       * m09-01 NQ 两年真实日线
       * ============================================================ */
      {
        id: 'm09-01',
        title: 'NQ 两年真实日线：用道氏与结构读大趋势',
        en: 'NQ Daily: Two Years of Structure',
        minutes: 18,
        level: '实战',
        summary: '真实 NQ 日线从 16460 到 31616.5 的两年，用结构语言而不是事后视角去读它。',
        outcomes: [
          '说清 NQ=F 主连合约与 Yahoo Finance 数据的边界',
          '在真实图上标出主要趋势、次级折返与结构破坏',
          '为当前结构写出一条可验证的失效条件'
        ],
        sections: [
          { type: 'callout', tone: 'story', text: '把两年的行情压缩成一张地图：起点 20498.75，区间最低 16460，最高 31616.5，最后收在 29117.75。真实行情不像教材里的“标准趋势图”，它会在最剧烈的位置留下跳空、长影线和看起来毫无道理的反弹。但结构语言依然适用：先问方向，再找防线，最后才谈买卖。' },
          { type: 'h', text: '一、先把“真实数据”的边界说清楚' },
          { type: 'p', text: '本课图表使用 Yahoo Finance 的 NQ=F（纳斯达克 100 期货主连）日线，时间范围 2024-10-25 至 2026-10-23，共 502 根真实 K 线，成交量为 Yahoo Finance 口径。必须知道三件事：第一，NQ=F 是“主连”拼接合约（continuous contract），由最活跃月份合约拼接而成，换月处可能有缺口，它适合观察大结构，不能当作某个真实可交割合约的连续价格去精确回测；第二，K 线、成交量与高低点为真实历史数据，但本站没有逐笔订单流，任何 Delta/Footprint/单次打印都属于教学估算，不是真实成交明细；第三，真实历史数据只能用于学习复盘，不构成未来预测，也不构成投资建议。' },
          { type: 'h', text: '二、道氏框架在真实图上的顺序' },
          { type: 'p', text: '道氏的顺序是：主要趋势 → 次级折返 → 小级别确认。换成看图动作就是：先用月级别波段判断大方向，再看回撤是“次级折返”还是“结构破坏”，最后才用日线内部的 HH/HL 确认。真实图上最贵的错误是“用一段暴跌否定两年结构”——2025 年 4 月价格从 22000 上方一路跌到 16460，任何均线都来不及反应，但结构给出的问题是：前低被收盘跌破了吗？反弹有没有创出新高？把这两个问题写下来，比猜底有用得多。另外，真实日线会有跳空与长影线，这会制造“假突破”的错觉；所以结构判断尽量用收盘价，并把“信号发生后下一根 K 线的收盘”也当作确认的一部分。' },
          {
            type: 'chart',
            scenario: 'real-nq-daily',
            caption: '图 1 · 真实历史数据 · Yahoo Finance · NQ=F · 1D · 2024-10-25 ~ 2026-10-23；K 线与成交量为真实数据，Delta/Footprint 为教学估算、非真实逐笔订单流；历史数据不构成未来预测（“模拟数据，仅用于教学”仅指教学估算部分），不构成投资建议',
            height: 460,
            steps: [
              {
                title: '第 1 步：先把两年的地图铺开',
                text: '真实 NQ=F 日线从 2024 年 10 月的 20498 附近出发，2025 年 4 月最低到 16460，2026 年 10 月最高摸到 31616.5。先别猜方向，先记住三条水平位：区间最高、区间最低、区间中轴。',
                annotations: ['range-high', 'range-low', 'range-mid'],
                focus: { from: 0, to: 501 }
              },
              {
                title: '第 2 步：2024 到 2025 初的“抬高但不同步”',
                text: '2024-12 到 2025-02 的三个摆动高点是 22111.25 → 22093.5 → 22319.75：中间那个反而略低；回调低点 20694（2025-01）也比 2024-12 的 20745 略低。真实行情的上涨经常“抬高但不同步”，说明买盘还在，但节奏并不稳。',
                annotations: ['swing-h1', 'swing-h2', 'swing-h3',
                  { kind: 'marker', x: 53, y: 20694, text: '2025-01 低点 20694', position: 'below', tone: 'bull' }
                ],
                focus: { from: 0, to: 90 }
              },
              {
                title: '第 3 步：结构破坏不是猜出来的',
                text: '2025-02-18 高点 22319.75 之后，价格先收盘跌破 1 月低点 20694（收盘 20605.75），随后反抽到 20536.75——低于前高，形成 LH；接着跌破 19139.25，最终在 2025-04-07 探到区间最低 16460。LL 加 LH 的顺序，就是结构破坏的证据链。',
                annotations: ['swing-h4', 'swing-l1', 'range-low',
                  { kind: 'marker', x: 84, y: 20583.25, text: '收盘 20605.75 跌破 1 月低点 20694', position: 'below', tone: 'bear' }
                ],
                focus: { from: 78, to: 135 }
              },
              {
                title: '第 4 步：修复与次级折返',
                text: '价格从 16460 一路修复：H7 24068.5、H10 26399 依次抬高；2026-01 的 H14 26349 却略低于 H10，出现高位滞涨；2026-03 的 L16 22961.5 回撤但没有破坏 16460 以来的大结构。这段更像主趋势恢复后的次级折返，而不是新的下跌趋势。',
                annotations: ['swing-h7', 'swing-h10', 'swing-h14', 'swing-l16'],
                focus: { from: 140, to: 400 }
              },
              {
                title: '第 5 步：最近结构 + 失效条件',
                text: '2026-05 之后，H16 29782 → H18 30968 → H24 31616.5 继续抬高；7 月的 L21 27201.5 是一次深度回撤，最近的有效低点 L24 28763.75 是短线防线。当前收盘 29117.75 距离 L24 只有约 354 点。写死规则：收盘跌破 L24 先降级，跌破 L21 才谈主要结构破坏。',
                annotations: ['swing-h16', 'swing-h18', 'swing-h24', 'swing-l21', 'swing-l24', 'range-high'],
                focus: { from: 380, to: 501 }
              }
            ]
          },
          { type: 'h', text: '三、三次“结构考试”' },
          { type: 'list', items: [
            '2025-02-18 高点 22319.75 → 2025-04-07 低点 16460：先收盘跌破 2025-01-13 的低点 20694，接着反抽到 20536.75 形成更低的高点（LH），再跌破 19139.25 加速下跌；在 16460 之前，“抄底”没有结构证据。',
            '2025-10-30 高点 26399 → 2026-01-28 高点 26349 → 2026-03-31 低点 22961.5：冲高后进入数月高位区间，回撤没有跌破关键低点，形态更像次级折返与换手，而不是趋势反转。',
            '2026-06-22 高点 30968 → 2026-07-29 低点 27201.5 → 2026-10-06 高点 31616.5：一次深度回撤后重新创出更高的高点，说明真实行情里“短期结构破坏”和“长期结构修复”可以并存，级别比方向更重要。',
            '结论：每次判断都写下失效条件（例如“收盘跌破最近一个有效 HL，且反抽形成 LH”），否则事后视角会让你误以为当时的信号很明显。'
          ] },
          { type: 'callout', tone: 'warn', title: '真实数据复盘的四个坑', text: '一是前视偏差（look-ahead bias）：你已经知道后面涨了，就会觉得当时信号“很明显”，请用 bar replay 遮住未来逐根回放；二是主连换月缺口：把换月跳空当成突破会得出错误结论；三是只挑成功案例：真实训练必须统计所有满足条件的机会，包括亏损的；四是把 Yahoo Finance 成交量当成完整市场成交量，它只是该数据源的口径。本站所有真实情景都标注了“Delta/Footprint 为教学估算，非真实逐笔订单流”。' },
          { type: 'callout', tone: 'tip', title: '一句话总结', text: '真实行情永远比教材脏，但判断顺序不变：先定级别与方向，再找最近的有效防线，最后用收盘价与结构确认；错的时候按失效条件离场，而不是事后找理由。' }
        ],
        quiz: { questions: [
          { q: 'NQ=F 作为“主连合约”的主要限制是什么？', options: ['它没有成交量数据', '它由不同月份合约拼接而成，换月处可能有缺口，不能当作单一可交割合约做精确回测', '它只反映隔夜行情', '它的价格一定高于现货指数'], answer: 1, why: '主连是为了连续观察而拼接的序列，本身不是可交易合约；换月缺口与成交量口径都会影响回测，需要提前说明。' },
          { q: '按道氏框架，2025 年 4 月那段下跌最需要先确认什么？', options: ['当天有没有出现大阳线', '前低是否被收盘跌破、反弹是否形成更低的高点', '新闻标题怎么写', '成交量是否小于昨天'], answer: 1, why: '结构破坏要用收盘价与高点低点关系确认：跌破前低并出现更低的高点，才构成 LL+LH 的结构破坏证据。' },
          { q: '复盘真实数据时，避免前视偏差最直接的做法是？', options: ['只看周线图', '用 bar replay 逐根回放并隐藏未来 K 线', '把历史价格全部背下来', '只复盘盈利的交易'], answer: 1, why: '前视偏差来自“提前看到结果”；逐根回放、遮住未来 K 线，才能模拟当时真实的信息环境。' }
        ] },
        sources: [
          { title: 'Yahoo Finance · NQ=F 历史数据', url: 'https://finance.yahoo.com/quote/NQ%3DF/history' },
          { title: 'CME Group · E-mini Nasdaq-100 期货合约规格（中文）', url: 'https://www.cmegroup.com/cn-t/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.options.html' },
          { title: 'ATAS · What you should know about a continuous futures contract', url: 'https://atas.net/blog/continuous-futures-contract/' }
        ]
      },

      /* ============================================================
       * m09-02 NQ 真实日内
       * ============================================================ */
      {
        id: 'm09-02',
        title: 'NQ 真实日内：扫荡、位移与回踩',
        en: 'NQ Intraday: Sweep, Displacement, Retest',
        minutes: 18,
        level: '实战',
        summary: '真实日内先骗后走：扫荡引出追单，位移证明方向，回踩给出风险可控的入场。',
        outcomes: [
          '在真实 NQ 日内图上标出扫荡、位移与回踩',
          '把日内信号写成含触发、止损、目标与失效条件的计划',
          '说清真实日内回测容易忽略的成本与样本问题'
        ],
        sections: [
          { type: 'callout', tone: 'story', text: '日内行情像一条热闹的集市街：大多数时间人在讨价还价（震荡），偶尔有人突然大声喊价（位移），把犹豫的人挤到一边。扫荡（sweep）就是先假装往一个方向走、把挂单和止损引出来，再真正往另一个方向走。真实日内图里，这种“先骗再走”每天都在发生，但只有少数几次值得下手。' },
          { type: 'h', text: '一、日内真实数据先看三件事' },
          { type: 'p', text: '数据声明：本课使用 NQ=F 的 5 分钟真实 K 线，时间范围 2026-08-31 07:55 至 2026-09-02 01:50（UTC），共 480 根；数据来源为 GitHub · getdata-finance/nq-1m-ohlcv-stocks-historical-data（NQ_1m.csv 聚合为 5m）。K 线与成交量为真实历史数据；Delta/CVD 与足迹为教学估算，不是真实逐笔订单流；历史数据不构成未来预测，也不构成投资建议。日内看图先做三件事：第一，找当日与近几日的高点、低点，标出流动性池（前高、前低、亚洲盘区间）；第二，打开成交量与 MA20，看趋势和参与度；第三，标出开盘区间（initial balance）。NQ 是科技权重指数期货，日内波动大、隔夜消息多，跳空和快速拉升很常见，止损要按结构放，而不是按“感觉亏多少”。开盘前先看隔夜高低点与当天的数据日历，重要数据公布前后半小时，日内结构经常失效，宁可空仓等待。' },
          { type: 'h', text: '二、扫荡 → 位移 → 回踩：一个可执行的顺序' },
          { type: 'p', text: '这套框架认为，健康的日内反转通常有三个动作：扫荡（价格短暂越过前高或前低，随后收回）、位移（一根或几根 K 线快速离开扫荡区，并突破最近的结构点）、回踩（价格回到位移的起点或订单块附近，缩量止跌）。顺序不能反：没有扫荡的位移可能只是追单，没有回踩的位移容易追高。真实盘面里这三个动作经常“不完整”，所以要用收盘价和结构确认：扫荡看“收盘是否收回区间”，位移看“是否收盘突破最近摆动点”，回踩看“是否收盘守住关键位”。还有一个细节：扫荡的极值如果是当日最高或最低，说明对手盘被清得更彻底，后续位移的持续性通常更好；如果只是次级高低点，信号权重应该降低。' },
          {
            type: 'chart',
            scenario: 'real-nq-intraday',
            caption: '图 2 · 真实历史数据 · GitHub getdata-finance/nq-1m-ohlcv-stocks-historical-data（NQ 1m 聚合 5m）· NQ=F · 5m · 2026-08-31 ~ 2026-09-02；K 线与成交量为真实数据，Delta/CVD/足迹为教学估算、非真实逐笔订单流；历史数据不构成未来预测（“模拟数据，仅用于教学”仅指教学估算部分），不构成投资建议',
            height: 460,
            steps: [
              { title: '第 1 步：先把两天的区间铺开', text: '这是 2026-08-31 到 09-02 的 NQ 5 分钟图：区间最高 29571.25，最低 29002，中轴约 29287。先记住这三条水平位；日内方向没定之前，不要被单根 K 线带着跑。', annotations: ['range-high', 'range-low', 'range-mid'], focus: { from: 0, to: 479 } },
              { title: '第 2 步：上沿被扫荡，却没有延续', text: '前一日高点 29535 附近先被一根放量 K 线越过（8-31 19:55，高点 29538.25），随后 9-01 05:55 又冲到区间最高 29571.25。两次越过前高都没能继续推进，价格重新落回区间，这是扫荡（sweep）的典型样子：追多的人被套在高位。', annotations: [
                { kind: 'marker', x: 144, y: 29538.25, text: '越过前高 29535，放量却收弱', position: 'above', tone: 'warn' },
                { kind: 'marker', x: 252, y: 29571.25, text: '扫荡区间上沿 29571.25', position: 'above', tone: 'warn' },
                'range-high'
              ], focus: { from: 100, to: 300 } },
              { title: '第 3 步：位移证明方向', text: '扫荡之后出现位移：bar 278 的 5 分钟 K 线实体约 92 点（29429.25 → 29337），把价格迅速带离区间上沿，并跌破前一段结构。没有这种位移，扫荡可能只是一次普通假动作。', annotations: [
                { kind: 'marker', x: 278, y: 29327, text: '5 分钟大阴线：位移（实体≈92 点）', position: 'below', tone: 'bear' },
                { kind: 'marker', x: 288, y: 29279.75, text: '反抽 29279.75：更低的高点', position: 'above', tone: 'bear' },
                'range-mid'
              ], focus: { from: 250, to: 320 } },
              { title: '第 4 步：跌向区间下沿', text: '位移之后价格继续走低，9-01 18:45 探到区间最低 29002（L3），成交量在下跌段明显放大。这一段说明：扫荡后的位移如果能持续放量，目标往往就是区间的另一侧边界。', annotations: ['swing-l3', 'range-low'], focus: { from: 330, to: 430 } },
              { title: '第 5 步：反弹与失效条件', text: '29002 之后价格反弹到 29170（H9），但没有回到 29200 上方；最近的有效低点 L10 在 29086.75，最后收盘 29048.5 已经在其下方。写死规则：收盘重新站上 29170 并回踩不破，才谈修复；否则弱势延续。', annotations: ['swing-h1', 'swing-h2', 'swing-h9', 'swing-l10', 'range-low'], focus: { from: 400, to: 479 } }
            ]
          },
          { type: 'h', text: '三、把日内信号写成计划' },
          { type: 'list', items: [
            '先定高周期方向（1H/4H 的 HH/HL 与 MA20），逆大周期的信号只做短线或直接放弃。',
            '画出前高、前低、开盘区间，标出最可能被扫荡的位置，而不是追着价格跑。',
            '扫荡后不追，等位移：收盘突破最近摆动点，且成交量配合。',
            '回踩到位移起点或订单块，收盘不破再进场；止损放在扫荡极值之外。',
            '目标先看前高/前低与区间边界，盈亏比低于 1.5 就放弃。',
            '失效：价格重新站回扫荡区内部并收盘穿越，说明判断错了，离场不摊平。'
          ] },
          { type: 'callout', tone: 'warn', title: '真实日内的三个陷阱', text: '一是把每次假突破都当扫荡，结果在趋势里逆势；二是忽略滑点与手续费，回测里 1 个点的优势在真实成交里可能变成亏损；三是用少量样本下结论——同一套信号只看了三五天就宣布有效，是典型的过拟合。日内噪音大，务必用 bar replay 做 50 次以上回放，并记录执行成本与实际成交价差。' },
          { type: 'callout', tone: 'tip', title: '一句话总结', text: '日内不是“看谁跑得快”，而是“等谁骗完再跟上”。先定位置，再等扫荡，最后用位移与回踩确认；不符合顺序就不做。' }
        ],
        quiz: { questions: [
          { q: '扫荡（sweep）最准确的特征是？', options: ['价格突破前高后一路不回头', '价格短暂越过前高或前低又收回，引出追单与止损', '成交量突然缩小', '连续出现三根阳线'], answer: 1, why: '扫荡是“假突破+收回”：先越过关键位触发追单与止损，再迅速回到区间内，而不是一路走远。' },
          { q: '位移（displacement）之后更合理的动作是？', options: ['立刻追单', '等回踩到位移起点或关键位，收盘不破再考虑进场', '马上做反向', '忽略结构直接加仓'], answer: 1, why: '位移证明方向，但追在中段止损太远；等回踩、收盘守住关键位，才有较好的风险回报结构。' },
          { q: '日内真实数据回测最容易低估哪一项？', options: ['手续费、滑点与执行成本', 'K 线的数量', '屏幕的尺寸', '收盘时间'], answer: 0, why: '日内交易频率高，成本会被放大；回测如果忽略手续费与滑点，很容易把负期望的系统误判为正期望。' }
        ] },
        sources: [
          { title: 'NinjaTrader · Market Replay: Practice Futures Trading with Playback', url: 'https://ninjatrader.com/eu/en-de/futures/blogs/market-replay-practice-practice-practice-with-playback-connection/' },
          { title: 'CME Group · E-mini Nasdaq-100 期货合约规格（中文）', url: 'https://www.cmegroup.com/cn-t/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.options.html' },
          { title: 'Nasdaq Glossary · Slippage', url: 'https://www.nasdaq.com/glossary/s/slippage' }
        ]
      },

      /* ============================================================
       * m09-03 GC 真实日线
       * ============================================================ */
      {
        id: 'm09-03',
        title: 'GC 真实日线：黄金的拍卖与威科夫式吸筹',
        en: 'GC Daily: Auction and Wyckoff-Style Accumulation',
        minutes: 22,
        level: '实战',
        summary: '用 MGC 真实黄金日线的价值区与威科夫证据，而不是事后标签，去读横盘、突破与失败。',
        outcomes: [
          '用 POC/VAH/VAL 描述真实黄金图的价值区与迁移',
          '把吸筹阶段的“证据链”与“标签”区分开',
          '写出黄金复盘中必须提醒的宏观与数据边界'
        ],
        sections: [
          { type: 'callout', tone: 'story', text: '把黄金想象成一场持续两年的拍卖会：价格停在某个区间，说明买卖双方暂时认可这个“价值区”；价格离开价值区又被拉回来，说明这次拍卖失败了。威科夫用“吸筹”描述低位换手，拍卖理论用“价值区”描述大多数成交发生的位置——两套语言说的其实是同一件事：谁在悄悄接货，谁在悄悄出货。' },
          { type: 'h', text: '一、黄金真实数据与合约边界' },
          { type: 'p', text: '数据声明：本课使用 MGC=F（COMEX 微型黄金期货主连）日线（由 15 分钟数据聚合），时间范围 2024-06-09 至 2026-03-24，共 560 根真实 K 线；数据来源为 GitHub · domzack/mgc-ohlcv-data（CME COMEX MGC 连续合约 15m）。MGC 是 GC 的微型合约，方向与结构与黄金主连一致，但价格与 GC=F 略有差异，引用价格时不要与 GC 主连混用。K 线与成交量为真实历史数据；Delta/Footprint 为教学估算，不是真实逐笔订单流；历史数据不构成未来预测，也不构成投资建议。黄金的驱动因素包括实际利率、美元、央行购金与 ETF 资金流，但本课不做宏观预测，只读价格与成交量。' },
          { type: 'h', text: '二、用价值区（POC / VAH / VAL）读拍卖' },
          { type: 'p', text: '固定区间成交量分布（vprofile）把一段行情的成交量按价格档聚合：成交量最大的一档叫控制点（Point of Control, POC），包含约七成成交量的价格带叫价值区（Value Area），上沿是 VAH、下沿是 VAL。拍卖理论认为：价格在价值区内来回是“平衡”，离开价值区是“失衡”；第一次离开常常失败、被拉回价值区；多次离开并站稳，才可能发生价值迁移。真实图上不必追求精确参数：把区间起点换一换，POC 会略微移动，这正说明它是统计工具而非精确点位。用 vprofile 时，建议至少看两个区间：一个是横盘整理段，一个是突破之后的段；两段的 POC 是否上移，比单一 POC 的价格更有信息量。' },
          {
            type: 'chart',
            scenario: 'real-gc-daily',
            caption: '图 3 · 真实历史数据 · GitHub domzack/mgc-ohlcv-data · MGC=F · 1D（15m 聚合）· 2024-06-09 ~ 2026-03-24；K 线与成交量为真实数据，Delta/Footprint 与价值区参数为教学估算、非真实逐笔订单流；历史数据不构成未来预测（“模拟数据，仅用于教学”仅指教学估算部分），不构成投资建议',
            height: 460,
            steps: [
              { title: '第 1 步：先看两年的价值迁移', text: '560 根 MGC 日线从 2304.6 一路走到 5587，涨幅约 142%，最后收在 4443.1。先别急着找买卖点，先看三条水平位：区间最高 5587、区间最低 2304.6、区间中轴；再问：这两年是在一个价值区里来回，还是价值区持续上移？', annotations: ['range-high', 'range-low', 'range-mid'], focus: { from: 0, to: 559 } },
              { title: '第 2 步：再吸筹区间的多次测试', text: '2025-03 到 2025-08，价格在 3120～3540 的区间反复：上沿被 H4 3509.4、H12 3533.6 两次测试，下沿被 L5 3123.4、L12 3353.3 反复回踩不破。打开 vprofile：这段的 POC 约 3330，价值区上沿约 3450、下沿约 3220，是典型的“再吸筹”结构。', annotations: [
                { kind: 'vprofile', x1: 232, x2: 390, bins: 24, showPOC: true, showVA: true, side: 'right', label: '吸筹区间成交量分布', tone: 'info' },
                'swing-h4', 'swing-l5', 'swing-h12', 'swing-l12'
              ], focus: { from: 200, to: 400 } },
              { title: '第 3 步：SOS 突破与价值区上移', text: '2025-09 价格放量离开区间，摆动高 H13 4398 站稳；回踩 L13 3660.4 不破，形成最后支撑点。换到 2025-09～2025-11 的区间看 vprofile：POC 从 3330 抬到约 4026，价值区上沿约 4269——价值确实在迁移，而不是原地打转。', annotations: [
                { kind: 'vprofile', x1: 390, x2: 470, bins: 24, showPOC: true, showVA: true, side: 'right', label: '突破后价值区', tone: 'bull' },
                'swing-h13', 'swing-l13', 'swing-l14', 'swing-h16'
              ], focus: { from: 360, to: 500 } },
              { title: '第 4 步：高潮与失败拍卖', text: '2026-01 H17 冲到 5587 后急转直下，跌到 L18 4424，回撤约 20.8%；3 月反抽 H19 5434.4，没有越过前高（LH），随后跌破 L20 5005。这不是“洗盘”的证据，而是高位拍卖失败、价值区开始下移的证据。', annotations: ['swing-h17', 'swing-l18', 'swing-h19', 'swing-l20'], focus: { from: 460, to: 540 } },
              { title: '第 5 步：当前结构与失效条件', text: '2026-03 最低到 4100（bar 558），当前 4443.1 在低位反弹。把规则写死：反抽不过 H20 5248.7、并且再跌破 4100，下跌结构延续；只有收盘站回 5005 上方，才谈得上修复。注意 MGC 是微型代理合约，价格不能直接当 GC 主连用。', annotations: [
                'swing-h20', 'swing-l20',
                { kind: 'marker', x: 558, y: 4100, text: '区间最低 4100（2026-03-23）', position: 'below', tone: 'bear' }
              ], focus: { from: 495, to: 559 } }
            ]
          },
          { type: 'p', text: '用威科夫语言复盘这段真实黄金图，要找的是“证据”而不是“标签”：这段数据从上涨中段开始，没有教科书式的恐慌抛售（SC）；我们能看到的是上涨后的再吸筹（2025-03～2025-08 的区间反复测试）、随后的强势信号（2025-09 放量突破，SOS）、回踩不破的最后支撑点（L13 3660.4、L14 3901.4），以及 2026-01 高潮（5587）后的快速回撤与失败反抽。真实数据里这些结构往往不标准：可能没有 Spring，可能 SOS 之后还会震荡，也可能整段只是更大级别行情的中继。另外，威科夫是“供需语言”而不是精确点位系统，同一张图不同分析师可能标出不同阶段；把它当作检查清单，而不是标准答案。' },
          { type: 'table', head: ['威科夫阶段', '这段真实数据里的证据', '证据缺失时'], rows: [
            ['SC / AR（恐慌抛售 / 自动反弹）', '数据起点已在上涨途中，没有典型 SC；不要为了凑形态硬标', '缺证据就划掉，不要硬套'],
            ['ST / Test（二次测试）', '2025-03～2025-08 多次回踩 3120～3350 后收回，下沿反复测试不破', '仍创新低，说明供给未消化'],
            ['Spring（弹簧效应）', '本图没有明显的向下假破，不能强行标注', '不是每个吸筹都有 Spring'],
            ['SOS（强势信号）', '2025-09 放量突破 3540 一带的区间上沿，H13 4398 站稳', '突破无量，按假突破处理'],
            ['LPS（最后支撑点）', '回踩 L13 3660.4、L14 3901.4 不破，价值区上移', '回踩跌回区间，结构失败'],
            ['高潮 / 派发迹象', '2026-01 H17 5587 后急跌 20.8%，反抽 H19 5434.4 不过前高', '只有一次急跌，不能直接定性']
          ], caption: '把“阶段名”换成“证据清单”，复盘才不会被事后叙事带跑（真实数据示例，仅为教学框架）' },
          { type: 'callout', tone: 'warn', title: '不要把阶段名当方向保证', text: '同一段横盘，事后可以标成“吸筹”，也可能最终向下破位变成“派发”。Market Profile 也一样：TPO 与价值区是统计工具，参数可调，需要样本验证；黄金受宏观事件影响，跳空与隔夜剧烈波动很常见。历史数据只能用于教学复盘，不构成未来预测，也不构成投资建议。' },
          { type: 'list', items: [
            '先写数据来源、周期、时间范围、是否主连，再开始画图；MGC 要注明是微型代理合约。',
            '用 vprofile 找 POC 与价值区，至少比较「吸筹段」与「突破后」两段，看 POC 有没有上移。',
            '把吸筹阶段拆成“证据清单”：SC/AR、ST、Spring、SOS、LPS 逐项打勾或划掉。',
            '突破必须用收盘确认，并观察回踩能否守住原区间上沿（阻力变支撑）。',
            '把“收盘跌回价值区、POC 未上移”写成失效条件，提前想好离场。',
            '复盘时记录证据缺失项，而不是只记录成功的那次。',
            '把每次复盘的证据清单截图保存，三个月后回看，检验自己是否在“事后补理由”。'
          ] }
        ],
        quiz: { questions: [
          { q: '价值区（Value Area）通常指什么？', options: ['最高价与最低价的中点', '包含约七成成交量的价格带，上沿为 VAH、下沿为 VAL', '当日的均价线', '固定 20 根 K 线的范围'], answer: 1, why: '价值区是成交量分布中包住约 70% 成交量的价格带，用来描述市场大多数成交认可的价格区间。' },
          { q: '威科夫吸筹里“弹簧效应（Spring）”的典型含义是？', options: ['放量突破区间上沿', '向下假破支撑后迅速收回，测试供给', '高位放量滞涨', '连续跳空高开'], answer: 1, why: 'Spring 是向下假破关键支撑、触发止损后又迅速收回，用来测试下方供给是否已经枯竭。' },
          { q: '关于 Market Profile 与价值区，哪种说法更稳妥？', options: ['POC 永远精确等于支撑位', '它是统计工具，参数可调，需要样本验证', '只要出现价值区就一定上涨', '它可以精确预测顶部'], answer: 1, why: '价值区依赖区间与分档参数，是统计描述而不是精确点位；用多组参数与样本验证，才能避免把工具神化。' }
        ] },
        sources: [
          { title: 'StockCharts · Campaigning Gold（威科夫黄金案例）', url: 'https://articles.stockcharts.com/article/articles-wyckoff-2017-07-campaigning-gold/' },
          { title: 'CQG · Market Profile', url: 'https://www.cqg.com/solutions/analytics/market-profile' },
          { title: 'GitHub · domzack/mgc-ohlcv-data（CME COMEX MGC 连续合约 15m 数据）', url: 'https://github.com/domzack/mgc-ohlcv-data' },
          { title: 'CME Group · Gold Product Overview', url: 'https://www.cmegroup.com/education/courses/event-contracts-underlying-markets/product-gold' }
        ]
      },

      /* ============================================================
       * m09-04 GC 真实日内
       * ============================================================ */
      {
        id: 'm09-04',
        title: 'GC 真实日内：价值区边缘的失败拍卖',
        en: 'GC Intraday: Failed Auction at Value Edges',
        minutes: 22,
        level: '实战',
        summary: '失败拍卖给出的是“谁没跟上”的证据；把数据更新与复盘流程也一起练成习惯。',
        outcomes: [
          '在真实 MGC 日内图上识别价值区边缘的失败拍卖',
          '把失败拍卖转成含触发、止损与失效条件的计划',
          '独立完成“更新真实数据 → 回放 → 复盘 → 样本外验证”的流程'
        ],
        sections: [
          { type: 'callout', tone: 'story', text: '拍卖会上，拍卖师把价格往上抬，如果没人应价，他只能把价格降回来——这就是“失败拍卖”。黄金日内经常在价值区边缘试探：冲上 VAH 却没人跟进，或者跌破 VAL 又迅速收回。真实日内图的价值，是让你看到这些失败发生时的成交量与速度。' },
          { type: 'h', text: '一、日内价值区是怎么形成的' },
          { type: 'p', text: '数据声明：本课使用 MGC=F（COMEX 微型黄金期货主连）15 分钟 K 线，时间范围 2026-03-16 19:45 至 2026-03-24 00:00（UTC），共 480 根真实 K 线；数据来源为 GitHub · domzack/mgc-ohlcv-data（CME COMEX MGC 连续合约 15m）。MGC 是 GC 的微型代理合约，结构与黄金主连一致，但价格与 GC=F 有差异，引用价格时不要混用。K 线与成交量为真实历史数据；Delta/CVD 与足迹为教学估算，不是真实逐笔订单流；历史数据不构成未来预测，也不构成投资建议。日内开盘后一段时间，价格反复成交，形成一个“当日价值区”：POC 是成交最密集的价格档，VAH/VAL 是价值区上下沿。参数（区间起点、bins）会改变 POC 的位置，所以要用“区域 + 反应”而不是单一价格点做决策。' },
          { type: 'h', text: '二、失败拍卖的三种表现' },
          { type: 'p', text: '失败拍卖通常有三种表现：第一，向上突破 VAH 后无法站稳，收盘回到价值区内，说明高位没有真实买盘；第二，向下假破 VAL 后迅速收回，说明低位有承接；第三，价格在价值区外停留很久却成交量萎缩，最后被拉回。交易上，前两种可以等“回到价值区”后的方向，第三种更适合观望。真实日内还要考虑时段：黄金在美盘与亚盘交界处流动性变化大，同一形态在不同时段的含义不同。判断失败拍卖时，成交量与速度同样重要：快速冲高、快速收回的“电梯行情”，比慢慢磨上去再掉头更值得警惕。' },
          {
            type: 'chart',
            scenario: 'real-gc-intraday',
            caption: '图 4 · 真实历史数据 · GitHub domzack/mgc-ohlcv-data · MGC=F · 15m · 2026-03-16 ~ 2026-03-24；K 线与成交量为真实数据，Delta/CVD/足迹与价值区参数为教学估算、非真实逐笔订单流；历史数据不构成未来预测（“模拟数据，仅用于教学”仅指教学估算部分），不构成投资建议',
            height: 460,
            steps: [
              { title: '第 1 步：先画出高位的价值区', text: '2026-03-16 夜盘到 03-17，MGC 的价值区集中在 5000 附近：POC 约 5006、价值区上沿约 5025、下沿约 5001。价格向上试探 5049.4 后又收回区内，这是一次小型失败拍卖——高位没人愿意继续追价。', annotations: [
                { kind: 'vprofile', x1: 0, x2: 120, bins: 24, showPOC: true, showVA: true, side: 'right', label: '高位价值区', tone: 'info' },
                'range-high'
              ], focus: { from: 0, to: 160 } },
              { title: '第 2 步：跌破 VAL，价值开始下移', text: '价格跌破价值区下沿后没有收回，随后加速：bar 161 附近跌破 4860，一路瀑布到 bar 253 的 4504.4。原来 5000 附近的价值区被留在上方，说明卖压真实，不是“假跌破”。', annotations: [
                { kind: 'marker', x: 161, y: 4836.5, text: '跌破 4860：价值区失守', position: 'below', tone: 'bear' },
                { kind: 'marker', x: 253, y: 4504.4, text: '瀑布低点 4504.4', position: 'below', tone: 'bear' },
                'range-mid'
              ], focus: { from: 100, to: 260 } },
              { title: '第 3 步：4500 附近的新价值区与 VAH 失败', text: '4504 之后价格横盘，新的价值区形成：POC 约 4665、上沿约 4699、下沿约 4563。价格两次冲到 4738 附近（bar 307、327），都高于 VAH 却被卖回——这是典型的“价值区上沿失败拍卖”，说明上方供给仍在。', annotations: [
                { kind: 'vprofile', x1: 240, x2: 360, bins: 24, showPOC: true, showVA: true, side: 'right', label: '反弹中的价值区', tone: 'warn' },
                { kind: 'marker', x: 307, y: 4738.2, text: '4738.2：VAH 上方被卖回', position: 'above', tone: 'bear' },
                { kind: 'marker', x: 327, y: 4736.6, text: '第二次测试 4736.6', position: 'above', tone: 'bear' },
                'swing-h1'
              ], focus: { from: 240, to: 370 } },
              { title: '第 4 步：跌破新 VAL，瀑布到 4100', text: '4504 之后价格在 L4 4321.5 附近止跌，中途 L5 4337.2 只是短暂停顿；反抽到 H4 4385，低于前一个摆动高 H3 4455.2，形成更低的高点。随后价格直接跌破 L4，瀑布到 L6 4100，反抽 H5 4310.1 也创不出更高高点。失败拍卖向下延续，价值区整体下移。', annotations: ['swing-l4', 'swing-h4', 'swing-l5', 'swing-l6', 'swing-h3'], focus: { from: 350, to: 440 } },
              { title: '第 5 步：修复还是继续下移？写成计划', text: '4100 之后价格强反弹到 H8 4516，但没有回到上一个价值区（4563～4699），说明价值仍在下移。当前价值区 POC 约 4408、上沿约 4491、下沿约 4364。计划：反抽不过 4516 且收盘跌破 4364，空头结构延续；站回 4491 上方才谈修复。', annotations: [
                { kind: 'vprofile', x1: 420, x2: 479, bins: 24, showPOC: true, showVA: true, side: 'right', label: '当前价值区', tone: 'neutral' },
                'swing-h8', 'swing-l8', 'swing-h10', 'swing-l10'
              ], focus: { from: 400, to: 479 } }
            ]
          },
          { type: 'h', text: '三、如何自己更新数据、复盘真实图' },
          { type: 'p', text: '这套训练可以自己复现：第一，按本站 tools/fetch-real-data.ps1 的方式准备数据（NQ 日线来自 Yahoo Finance，黄金数据来自 GitHub domzack/mgc-ohlcv-data 的 MGC 15m 与聚合日线）；第二，用 tools/build-real-data.mjs 把原始数据生成数据集与共享真实情景事件，manifest 会列出可引用的摆动点；第三，在图表里用 bar replay 逐根回放，遮住未来 K 线，记录当时的判断；第四，复盘模板固定四问：我看到了什么结构或证据？我的失效条件是什么？执行有没有偏差？这笔交易的成本是多少？第五，把最近 30 次记录分成样本内与样本外两组，只有样本外也稳定，才说明方法可能有效。如果你用 Excel 或交易日志记录，建议固定列名：日期、品种、周期、方向、入场、止损、目标、实际成交、滑点、失效条件是否触发、复盘结论。' },
          { type: 'list', items: [
            '数据：来源、时间范围、周期、是否主连、成交量口径，先写进图注再开始分析。',
            '回放：每次只露出当前 K 线，先写下判断与失效条件，再看下一根。',
            '执行：记录滑点、手续费、实际成交价与计划价的差异，不要只记盈亏。',
            '统计：至少 30 次样本，区分样本内与样本外，记录最大连亏与最大回撤。',
            '失效：任何策略出现“需要放宽止损才能成立”的信号，立刻停止使用。',
            '边界：Delta/Footprint 是教学估算，不能当作真实订单流证据；历史数据不构成未来预测。'
          ] },
          { type: 'callout', tone: 'warn', title: '真实数据复盘也有陷阱', text: '只挑成功案例、事后重新标注结构、忽略执行成本、用未来新闻解释过去价格，都是常见的自欺。还有一个误区：把“历史回测有效”直接当成“未来可盈利”。真实市场会变化，样本外验证与风险控制永远优先于形态本身；本课所有图形与结论仅用于教学，不构成投资建议。' }
        ],
        quiz: { questions: [
          { q: '“价值区边缘的失败拍卖”最典型的表现是？', options: ['价格突破 VAH 后放量一路不回头', '价格冲上 VAH 后无法站稳，收盘回到价值区内', '成交量完全消失', '开盘直接封住涨停'], answer: 1, why: '失败拍卖是价格尝试离开价值区却无法被接受，收盘重新回到价值区，说明该方向缺少真实跟随。' },
          { q: '复盘真实图时，正确的顺序是？', options: ['先看结果，再倒推原因', '用 bar replay 逐根回放，先写判断并记录失效条件', '只看盈利的单子', '用后来的新闻解释当时的走势'], answer: 1, why: '逐根回放能还原当时的信息环境，先写判断再对答案，才能训练决策而不是训练记忆。' },
          { q: '要把一套方法用于真实交易，最低限度应做到？', options: ['看三天数据就上实盘', '完成足够样本的回放，区分样本内/样本外，并把执行成本算进去', '只统计胜率', '忽略最大回撤'], answer: 1, why: '样本外验证、成本核算与回撤统计决定方法能否在真实环境存活；只看短期结果或单看胜率都不够。' }
        ] },
        sources: [
          { title: 'CQG · Market Profile', url: 'https://www.cqg.com/solutions/analytics/market-profile' },
          { title: 'NinjaTrader · Market Replay: Practice Futures Trading with Playback', url: 'https://ninjatrader.com/eu/en-de/futures/blogs/market-replay-practice-practice-practice-with-playback-connection/' },
          { title: 'Investopedia · Implementation Shortfall', url: 'https://www.investopedia.com/terms/i/implementation-shortfall.asp' }
        ]
      }
    ],
    sources: [
      { title: 'Yahoo Finance · NQ=F 历史数据', url: 'https://finance.yahoo.com/quote/NQ%3DF/history' },
      { title: 'GitHub · domzack/mgc-ohlcv-data（CME COMEX MGC 连续合约 15m 数据）', url: 'https://github.com/domzack/mgc-ohlcv-data' },
      { title: 'GitHub · getdata-finance/nq-1m-ohlcv-stocks-historical-data（NQ 1m 数据）', url: 'https://github.com/getdata-finance/nq-1m-ohlcv-stocks-historical-data' },
      { title: 'CME Group · E-mini Nasdaq-100 期货合约规格（中文）', url: 'https://www.cmegroup.com/cn-t/markets/equities/nasdaq/e-mini-nasdaq-100.contractSpecs.options.html' },
      { title: 'ATAS · What you should know about a continuous futures contract', url: 'https://atas.net/blog/continuous-futures-contract/' }
    ]
  });

  /* ============================================================
   * 术语表（m09，11 条；避开一期已有术语）
   * ============================================================ */
  C.registerGlossary([
    { term: '主连合约', en: 'Continuous Contract', def: '把不同月份期货合约按成交量拼接成的连续价格序列，用于观察大结构；它不是可交易合约，换月处可能有缺口。', moduleId: 'm09', aliases: ['连续合约', '主连'] },
    { term: '换月缺口', en: 'Roll Gap', def: '主连合约在切换到新月份合约时，由于两个合约价格不同而出现的跳空；不要把它当成真实突破。', moduleId: 'm09', aliases: ['移仓缺口'] },
    { term: '真实历史数据', en: 'Historical Market Data', def: '来自行情供应商的真实 OHLCV 记录；用于复盘与统计，但历史表现不代表未来结果。', moduleId: 'm09', aliases: ['历史行情'] },
    { term: '前视偏差', en: 'Look-Ahead Bias', def: '复盘或回测时无意中使用了当时还不可能知道的信息（例如未来 K 线），会让策略看起来比实际更好。', moduleId: 'm09', aliases: ['未来函数', '事后视角'] },
    { term: '样本外验证', en: 'Out-of-Sample Validation', def: '把数据分成训练段与未参与规则的验证段，用后者检验方法是否稳定；只在样本内有效的方法不能直接用于实战。', moduleId: 'm09', aliases: ['样本外检验'] },
    { term: '行情回放', en: 'Bar Replay', def: '逐根重放历史 K 线、隐藏未来数据的练习方式，用来模拟真实的信息环境与决策压力。', moduleId: 'm09', aliases: ['逐根回放', 'K 线回放'] },
    { term: '滑点', en: 'Slippage', def: '实际成交价与预期价格之间的差异，常见于快速行情与流动性不足时；日内与突破策略尤其要计入回测。', moduleId: 'm09', aliases: ['成交滑点'] },
    { term: '执行成本', en: 'Execution Cost', def: '手续费、滑点与点差等交易摩擦的总和；忽略它会把负期望的策略误判成盈利策略。', moduleId: 'm09', aliases: ['交易摩擦'] },
    { term: '数据来源透明', en: 'Data Provenance', def: '在图表与课程中写清数据来自哪里、什么周期、什么时间范围、是否主连，让读者能判断结论的适用边界。', moduleId: 'm09', aliases: ['数据溯源'] },
    { term: '复盘模板', en: 'Review Template', def: '固定记录结构判断、失效条件、执行偏差与成本四类信息的表格；比“今天赚了多少”更能提升交易能力。', moduleId: 'm09', aliases: ['交易复盘模板'] },
    { term: '教学估算', en: 'Educational Estimate', def: '真实情景中并非来自真实逐笔成交的派生数据（如 Delta/Footprint），仅用于教学演示，不能当作真实订单流证据。', moduleId: 'm09', aliases: ['估算订单流'] }
  ]);
})();
