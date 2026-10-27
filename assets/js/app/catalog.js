/* 课程目录兜底数据 + 数据访问辅助（site-engineer 维护）
 * 目的：
 *  1) 内容脚本（content-a/b/c）并行开发、尚未落盘时，首页/路线图/学习计划/模块页仍可完整渲染；
 *  2) 内容就绪后（LQ.content.getModules() 非空），一律以内容脚本的真实数据为准；
 *  3) 学习计划 10 周任务引用的 lesson id 全部来自 CONTRACT 第 7 节 + CONTRACT-V2 第 6 节目录；
 *  4) 二期 V2 路线：阶段 0 地基 + 9 个内容模块（m01→m04→m08 拍卖→m05→m06→m07→m09 真实案例），共 43 课。
 * 这里的数据只做「兜底/索引」，不替代课程正文。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var MODULE_ORDER = ['m00', 'm01', 'm02', 'm03', 'm04', 'm08', 'm05', 'm06', 'm07', 'm09'];

  var MODULES = {
    m01: {
      id: 'm01', order: 1, stage: 1, stageName: '阶段 1 · 趋势框架',
      title: '道氏理论', en: 'Dow Theory',
      tagline: '先看懂趋势，再谈交易。',
      summary: '道氏理论是现代技术分析的起点。这一模块用三大假设和六条原则，把「趋势」从感觉变成可描述的峰谷结构，并给出成交量确认与理论边界。',
      minutes: 80, level: '入门', icon: 'trend',
      lessons: [
        { id: 'm01-01', title: '道氏理论到底在说什么（三大假设+六原则）', minutes: 12, level: '入门', summary: '三大假设与六条原则：趋势如何被定义，为什么收盘价最重要。' },
        { id: 'm01-02', title: '三种趋势层级：主要、次级、小级别', minutes: 12, level: '入门', summary: '主要趋势、次级折返与小级别噪声的关系，决定你该看哪个周期。' },
        { id: 'm01-03', title: '趋势三阶段：积累、参与、派发', minutes: 13, level: '入门', summary: '积累、参与、派发三阶段：什么时候趋势最健康，什么时候风险最大。' },
        { id: 'm01-04', title: '峰谷结构 HH/HL 与 LH/LL', minutes: 14, level: '入门', summary: '用更高的高点/低点与更低的峰谷把趋势写成可标注的结构。' },
        { id: 'm01-05', title: '成交量的确认作用与道氏理论的缺陷', minutes: 14, level: '入门', summary: '成交量如何确认趋势，以及道氏理论滞后的两个致命缺陷。' }
      ]
    },
    m02: {
      id: 'm02', order: 2, stage: 2, stageName: '阶段 2 · 价格行为',
      title: '价格行为 PA', en: 'Price Action',
      tagline: 'K 线不预测，只记录多空博弈。',
      summary: '价格行为用最原始的 K 线读供需。你会学到 Pin Bar、吞没、内包线、支撑阻力与假突破，并把这些拼成可执行的交易计划。',
      minutes: 85, level: '入门', icon: 'structure',
      lessons: [
        { id: 'm02-01', title: 'K 线解剖：位置比形态更重要', minutes: 12, level: '入门', summary: '实体与影线记录多空博弈；同一种 K 线在不同位置含义完全相反。' },
        { id: 'm02-02', title: 'Pin bar：一根影线讲完多空博弈', minutes: 13, level: '入门', summary: 'Pin Bar 的拒绝过程、有效条件与失效场景。' },
        { id: 'm02-03', title: '吞没形态与内包线', minutes: 13, level: '入门', summary: '吞没的方向性与内包线的收缩含义，注意组合使用。' },
        { id: 'm02-04', title: '支撑阻力、突破与假突破', minutes: 14, level: '入门', summary: '如何画关键位，识别真突破与假突破，以及回踩确认。' },
        { id: 'm02-05', title: '多周期共振与 PA 交易计划', minutes: 15, level: '入门', summary: '多周期共振筛选信号，把 PA 信号写成可执行的交易计划。' }
      ]
    },
    m03: {
      id: 'm03', order: 3, stage: 3, stageName: '阶段 3 · 机构结构思维',
      title: 'ICT / SMC', en: 'Smart Money Concepts',
      tagline: '用机构的视角看流动性和结构。',
      summary: 'ICT/SMC 关注流动性、市场结构与订单块。本模块从 BOS/CHoCH 讲到扫荡、FVG、溢价折价与完整入场模型，并明确这套框架的争议。',
      minutes: 110, level: '进阶', icon: 'flow',
      lessons: [
        { id: 'm03-01', title: '市场结构：BOS、CHoCH 与 MSS', minutes: 13, level: '进阶', summary: '结构突破与结构转变的区别，判定趋势延续与反转。' },
        { id: 'm03-02', title: '流动性：前高前低与止损池', minutes: 13, level: '进阶', summary: '为什么前高前低是流动性池，止损被扫意味着什么。' },
        { id: 'm03-03', title: '流动性扫荡：假突破的另一种说法', minutes: 13, level: '进阶', summary: '扫荡—收回的结构，以及如何避免追在扫荡高点。' },
        { id: 'm03-04', title: '订单块 OB 与公允价值缺口 FVG', minutes: 15, level: '进阶', summary: '订单块与 FVG 的形成逻辑、确认与使用条件。' },
        { id: 'm03-05', title: '溢价/折价、均衡与 OTE', minutes: 13, level: '进阶', summary: '用溢价折价区与 OTE 回撤位判断入场性价比。' },
        { id: 'm03-06', title: '完整入场模型：扫荡→位移→回踩', minutes: 15, level: '进阶', summary: '把扫荡、位移、回踩、目标拼成完整入场模型。' }
      ]
    },
    m04: {
      id: 'm04', order: 4, stage: 4, stageName: '阶段 4 · 订单流微观结构',
      title: '订单流', en: 'Order Flow',
      tagline: '从成交的颗粒度看谁在主动。',
      summary: '订单流用 Delta、CVD、Footprint 与成交量分布揭示主动买卖力量。你会看到吸收、冰山单与 POC 如何参与决策。',
      minutes: 115, level: '进阶', icon: 'chart',
      lessons: [
        { id: 'm04-01', title: '订单簿与 MBO：谁在挂单', minutes: 13, level: '进阶', summary: '订单簿、MBO、点差与挂单墙：流动性如何被提供与撤走。' },
        { id: 'm04-02', title: 'Footprint 足迹图怎么读', minutes: 15, level: '进阶', summary: '足迹图的买卖量、POC 与不平衡怎么读。' },
        { id: 'm04-03', title: 'Delta 与 CVD：买卖压力', minutes: 14, level: '进阶', summary: 'Delta 与 CVD 的含义、背离，以及只用它会误判的地方。' },
        { id: 'm04-04', title: '吸收与冰山单', minutes: 14, level: '进阶', summary: '放量不走进与冰山单：谁在承接、谁在伪装。' },
        { id: 'm04-05', title: '成交量分布：POC / VAH / VAL', minutes: 14, level: '进阶', summary: '成交量分布的价值区间与 POC，如何定义日内背景。' },
        { id: 'm04-06', title: '订单流 + SMC 共振入场', minutes: 15, level: '进阶', summary: '订单流信号与结构、订单块共振时的入场流程。' }
      ]
    },
    m05: {
      id: 'm05', order: 6, stage: 6, stageName: '阶段 6 · 量价供需',
      title: '威科夫', en: 'Wyckoff Method',
      tagline: '量价背后是筹码的转移。',
      summary: '威科夫用三大定律和吸筹/派发阶段描述大资金的痕迹。本模块覆盖 Spring、Upthrust、量价关系与因果测算。',
      minutes: 95, level: '进阶', icon: 'book',
      lessons: [
        { id: 'm05-01', title: '威科夫三大定律', minutes: 12, level: '进阶', summary: '供需、因果、努力与结果：威科夫解读量价的三条底层定律。' },
        { id: 'm05-02', title: '吸筹五阶段', minutes: 14, level: '进阶', summary: '吸筹五阶段的量价特征与识别方法。' },
        { id: 'm05-03', title: 'Spring 与测试', minutes: 14, level: '进阶', summary: 'Spring 与测试的区别，如何判断吸筹完成。' },
        { id: 'm05-04', title: '派发与 Upthrust', minutes: 14, level: '进阶', summary: '派发阶段的特征与 Upthrust 的诱多逻辑。' },
        { id: 'm05-05', title: '量价关系与因果测算', minutes: 14, level: '进阶', summary: '量价配合/背离与因果测算（目标位）的用法。' }
      ]
    },
    m06: {
      id: 'm06', order: 7, stage: 7, stageName: '阶段 7 · 风险与仓位',
      title: 'ATR 与风控', en: 'ATR & Risk Management',
      tagline: '先活下来，再谈盈利。',
      summary: 'ATR 用波动率给市场量体温；止损、仓位、R 倍数与期望值决定长期结果。本模块把风控做成可计算、可执行的规则。',
      minutes: 80, level: '进阶', icon: 'shield',
      lessons: [
        { id: 'm06-01', title: 'ATR：用波动率给市场量体温', minutes: 12, level: '进阶', summary: 'ATR 的计算、含义与常见误用。' },
        { id: 'm06-02', title: 'ATR 止损与移动止损', minutes: 13, level: '进阶', summary: '用 ATR 倍数设止损与移动止损，兼顾波动与结构。' },
        { id: 'm06-03', title: '仓位管理与 R 倍数', minutes: 14, level: '进阶', summary: '风险百分比、仓位公式与 R 倍数的统计算法。' },
        { id: 'm06-04', title: '期望值、回撤与交易心理', minutes: 15, level: '进阶', summary: '期望值、回撤分布与执行一致性：长期活下来的条件。' }
      ]
    },
    m07: {
      id: 'm07', order: 8, stage: 8, stageName: '阶段 8 · 综合实战',
      title: '综合实战', en: 'Integration & Practice',
      tagline: '把方法拼成一套能执行的 SOP。',
      summary: '综合实战把多周期分析、交易计划、复盘与常见错误串成 SOP，用 10 个模拟交易日把前面学的变成习惯。',
      minutes: 60, level: '实战', icon: 'target',
      lessons: [
        { id: 'm07-01', title: '多周期分析 SOP：从大往小', minutes: 13, level: '实战', summary: '从大周期定方向、到小周期找入场的固定流程。' },
        { id: 'm07-02', title: '从分析到下单：完整交易计划', minutes: 15, level: '实战', summary: '把分析写成含入场、止损、目标、失效条件的交易计划。' },
        { id: 'm07-03', title: '复盘、训练与常见错误', minutes: 14, level: '实战', summary: '复盘模板、刻意训练方法与新手最常见的十个错误。' }
      ]
    },
    m08: {
      id: 'm08', order: 5, stage: 5, stageName: '阶段 5 · 拍卖框架',
      title: '拍卖理论与市场轮廓', en: 'Auction Market Theory & Market Profile',
      tagline: '价格是一场持续拍卖，价值区是它的临时共识。',
      summary: '拍卖理论（AMT）与市场轮廓（Market Profile）是订单流与威科夫的上位框架：解释价格为什么在区间里来回、价值如何迁移、哪里出现失衡。本模块用 TPO、价值区与失败拍卖把「背景」讲清楚。',
      minutes: 70, level: '进阶', icon: 'layers',
      lessons: [
        { id: 'm08-01', title: '拍卖理论入门：市场在拍卖什么', minutes: 13, level: '进阶', summary: '双向拍卖、时间与价格：市场如何用上下试探寻找价值。' },
        { id: 'm08-02', title: 'TPO 与市场轮廓：一天的价值怎么形成', minutes: 14, level: '进阶', summary: 'TPO 计数、初始平衡与轮廓形态，读出一天的价值出生过程。' },
        { id: 'm08-03', title: '价值区迁移：VAH/VAL 与 POC 的三种走法', minutes: 14, level: '进阶', summary: '价值区上移、下移与扩张，判断趋势延续与区间回归。' },
        { id: 'm08-04', title: '失衡、单次打印与失败拍卖', minutes: 14, level: '进阶', summary: '失衡与单次打印标记方向，失败拍卖给出反转证据。' },
        { id: 'm08-05', title: '组合框架：Profile 定背景 + 订单流定证据 + SMC 定位置', minutes: 15, level: '进阶', summary: '把拍卖背景、订单流证据与结构位置组合成一套判断流程。' }
      ]
    },
    m09: {
      id: 'm09', order: 9, stage: 9, stageName: '阶段 9 · 真实案例',
      title: '真实市场案例', en: 'Real Market Cases',
      tagline: '在真实 NQ / GC 行情上，把学过的框架跑一遍。',
      summary: '全部使用真实历史 OHLCV（Yahoo Finance 与 GitHub 开源数据），覆盖纳斯达克 100 期货与黄金期货的日线与日内。你会练习在真实噪声里找结构、价值区与失败拍卖；注意 Delta/足迹为教学估算，不是真实逐笔数据。',
      minutes: 60, level: '实战', icon: 'chart',
      lessons: [
        { id: 'm09-01', title: 'NQ 两年真实日线：用道氏与结构读大趋势', minutes: 15, level: '实战', summary: '在两年真实日线上识别主要趋势、次级折返与结构转变。' },
        { id: 'm09-02', title: 'NQ 真实日内：扫荡、位移与回踩', minutes: 15, level: '实战', summary: '真实日内波动里找流动性扫荡与位移后的回踩机会。' },
        { id: 'm09-03', title: 'GC 真实日线：黄金的拍卖与威科夫式吸筹', minutes: 15, level: '实战', summary: '用拍卖与威科夫两套视角解读黄金真实日线的吸筹过程。' },
        { id: 'm09-04', title: 'GC 真实日内：价值区边缘的失败拍卖', minutes: 15, level: '实战', summary: '价值区边缘的失败拍卖如何给出反转与目标位。' }
      ]
    }
  };

  /* 阶段 0：地基（没有课程正文，但必须可勾选、可度量） */
  var FOUNDATION = {
    key: 's0', num: 0, mod: 'm00',
    title: '地基 · 市场语言', en: 'Foundations',
    eyebrow: '阶段 0 · 必过地基',
    tagline: '先把「市场是什么、K 线在说什么、支撑阻力怎么画、日志怎么记」弄明白。',
    goal: '这一阶段有6节独立的通俗讲解、分镜课件与理解自测。先学成交机制和K线语言，再逐项自查；不设固定时长，读懂后进入趋势模块。',
    minutes: 180, icon: 'layers',
    items: [
      { id: 'fx-1', title: '市场机制', text: '搞懂市价/限价/止损单、点差、手续费、滑点与流动性时段；能解释「为什么成交价可能比看到的价格差」。', refs: ['m04-01'] },
      { id: 'fx-2', title: 'K 线解剖', text: '说清实体、上下影线、收盘价分别代表什么；在图上找出 20 根「位置比形态更重要」的例子。', refs: ['m02-01'] },
      { id: 'fx-3', title: '周期关系', text: '写下你的三个周期（分析 / 执行 / 入场），并解释为什么不能只看一个周期。', refs: ['m01-02', 'm07-01'] },
      { id: 'fx-4', title: '支撑阻力', text: '在最近 100 根 K 线上只保留 3 条最重要的水平位，说明保留与删除的理由。', refs: ['m02-04'] },
      { id: 'fx-5', title: '工具与日志', text: '固定看盘模板，并建立交易日志模板：日期/品种/周期/理由/入场/止损/目标/结果/复盘。', refs: ['m07-03'] },
      { id: 'fx-6', title: '风险认知', text: '写下单笔最大风险（≤1%）、每日最大亏损（≤3%），以及「今天停止交易」的触发规则。', refs: ['m06-03', 'm06-04'] }
    ],
    checkpoint: '能解释K线的四个价格、挂单与成交的区别，指出3个关键位，并完成六节课程的理解自测。',
    deliverable: '《交易基础设施清单》：主周期、看盘模板、日志模板、单笔与单日风险上限。'
  };

  /* 模块检查点（关卡）与阶段产出 */
  var MODULE_CHECKPOINTS = {
    m01: { checkpoint: '不看笔记讲清「趋势三阶段」；在图上独立标出 5 个 HH/HL 与 2 个 LH/LL。', deliverable: '《趋势结构标注图》1 张 + 200 字结论。' },
    m02: { checkpoint: '能解释「位置比形态重要」；能写出含触发、止损、目标、失效条件的 PA 计划。', deliverable: '《PA 交易计划》1 份 + 20 个信号样本统计。' },
    m03: { checkpoint: '能区分 BOS 与 CHoCH；能指出流动性池位置；能复述「扫荡→位移→回踩」模型。', deliverable: '《结构标注图》3 张 + 入场模型卡片。' },
    m04: { checkpoint: '能读懂一张 footprint；能指出吸收位置；能用 POC/VAH/VAL 描述日内背景。', deliverable: '《订单流复盘》2 篇（含 delta/CVD 截图与结论）。' },
    m05: { checkpoint: '能把一段行情划分成威科夫阶段，并说出 Spring/Upthrust 的依据。', deliverable: '《威科夫阶段划分图》1 张 + 量价背离案例 2 个。' },
    m06: { checkpoint: '能按 ATR 算止损、按风险 % 算仓位；能算期望值与最大回撤。', deliverable: '《风控参数表》+ 20 笔模拟盘风控记录。' },
    m07: { checkpoint: '有一份写死的交易 SOP，并连续 10 个交易日按 SOP 执行与复盘。', deliverable: '《个人交易 SOP》+ 10 日复盘记录。' },
    m08: { checkpoint: '能画出一天的轮廓并标出 POC/VAH/VAL；能说出价值区三种走法的区别。', deliverable: '《市场轮廓图》3 张 + 价值区迁移案例 2 个。' },
    m09: { checkpoint: '能在真实 NQ/GC 图上完成 3 次结构 + 价值区判断，并写明数据来源与不确定处。', deliverable: '《真实案例复盘》3 篇（含图表截图与数据来源）。' }
  };

  /* 学习计划：10 周（V2：新增拍卖周 + 真实案例/结业考核周） */
  var PLAN = [
    {
      id: 'w1', week: 1, stage: '阶段 0-1', theme: '地基 + 道氏理论',
      goal: '建立市场基础语言，能用 HH/HL 与 LH/LL 描述趋势，理解道氏的假设与缺陷。',
      minutes: 250,
      tasks: [
        { key: 'w1-t1', text: '完成地基自查 6 项（市场机制 / K 线 / 周期 / 支撑阻力 / 工具日志 / 风险认知），在路线图阶段 0 逐项打勾。', lessons: ['m01-01', 'm02-01'], minutes: 40 },
        { key: 'w1-t2', text: '学习道氏三大假设与六条原则，用自己的话各写 3 条批注。', lessons: ['m01-01'], minutes: 25 },
        { key: 'w1-t3', text: '学习三种趋势层级与趋势三阶段，在示例图上分别标出主要、次级、小级别。', lessons: ['m01-02', 'm01-03'], minutes: 45 },
        { key: 'w1-t4', text: '用 HH/HL 与 LH/LL 标注 10 组峰谷，写一句话趋势结论。', lessons: ['m01-04'], minutes: 40 },
        { key: 'w1-t5', text: '学习成交量的确认作用与道氏理论的缺陷，写出 2 个理论失效场景。', lessons: ['m01-05'], minutes: 30 },
        { key: 'w1-t6', text: '完成 m01 五课自测（正确率 ≥ 80%），产出《趋势结构标注图》。', lessons: ['m01-01', 'm01-02', 'm01-03', 'm01-04', 'm01-05'], minutes: 45 }
      ],
      checkpoint: '能不看笔记讲清「趋势三阶段」，并在图上独立标出 5 个 HH/HL。'
    },
    {
      id: 'w2', week: 2, stage: '阶段 2', theme: '价格行为 PA',
      goal: '用 K 线读供需，把 Pin Bar / 吞没 / 支撑阻力 / 假突破拼成一份可执行的交易计划。',
      minutes: 260,
      tasks: [
        { key: 'w2-t1', text: 'K 线解剖：在 20 根 K 线上标注「位置比形态重要」的例子。', lessons: ['m02-01'], minutes: 30 },
        { key: 'w2-t2', text: 'Pin Bar：找出 5 个有效样本与 2 个失败样本，写明差异。', lessons: ['m02-02'], minutes: 35 },
        { key: 'w2-t3', text: '吞没形态与内包线：各找 5 个样本，比较出现位置的差异。', lessons: ['m02-03'], minutes: 35 },
        { key: 'w2-t4', text: '支撑阻力：只画 3 条关键位，标注真突破与假突破各 2 次。', lessons: ['m02-04'], minutes: 40 },
        { key: 'w2-t5', text: '多周期共振：写一份 PA 交易计划（入场触发 / 止损 / 目标 / 失效条件）。', lessons: ['m02-05'], minutes: 45 },
        { key: 'w2-t6', text: '完成 m02 五课自测；模拟盘按计划练习 5 次并记录结果。', lessons: ['m02-02', 'm02-04', 'm02-05'], minutes: 45 }
      ],
      checkpoint: '能写出含触发、止损、目标、失效条件的 PA 计划，并解释为什么「位置」优先于「形态」。'
    },
    {
      id: 'w3', week: 3, stage: '阶段 3', theme: 'ICT/SMC · 结构与流动性',
      goal: '学会用结构（BOS/CHoCH）与流动性（前高前低、扫荡）重新描述同一张图。',
      minutes: 230,
      tasks: [
        { key: 'w3-t1', text: '在同一张图上分别标出 2 次 BOS、2 次 CHoCH 与 1 次 MSS。', lessons: ['m03-01'], minutes: 40 },
        { key: 'w3-t2', text: '找出 3 个流动性池（前高前低），解释止损为什么会堆在那里。', lessons: ['m03-02'], minutes: 35 },
        { key: 'w3-t3', text: '找 5 个「扫荡—收回」样本，标出扫荡后的真实方向。', lessons: ['m03-03'], minutes: 40 },
        { key: 'w3-t4', text: '复盘：为什么不能追扫荡高点？写下你的禁止清单（至少 5 条）。', lessons: ['m03-01', 'm03-03'], minutes: 35 },
        { key: 'w3-t5', text: '完成 m03 前三课自测。', lessons: ['m03-01', 'm03-02', 'm03-03'], minutes: 30 }
      ],
      checkpoint: '能在图上指出流动性在哪，并清楚区分 BOS 与 CHoCH 的判定条件。'
    },
    {
      id: 'w4', week: 4, stage: '阶段 3', theme: 'ICT/SMC · 订单块与入场模型',
      goal: '把 OB、FVG、溢价折价与 OTE 组合成一个完整入场模型，并知道它何时失效。',
      minutes: 240,
      tasks: [
        { key: 'w4-t1', text: 'OB 与 FVG：各标注 5 个，写出你的确认条件（至少 3 条）。', lessons: ['m03-04'], minutes: 40 },
        { key: 'w4-t2', text: '溢价 / 折价与 OTE：判断一段行情的性价比区间，说明为什么只等折价做多。', lessons: ['m03-05'], minutes: 35 },
        { key: 'w4-t3', text: '完整模型：拆解 3 个「扫荡→位移→回踩」案例。', lessons: ['m03-06'], minutes: 45 },
        { key: 'w4-t4', text: '按模型模拟盘练习 10 次，记录每笔 R 与失效原因。', lessons: ['m03-06', 'm06-03'], minutes: 50 },
        { key: 'w4-t5', text: '完成 m03 后三课自测，并记录这套框架的争议点与适用条件。', lessons: ['m03-04', 'm03-05', 'm03-06'], minutes: 30 }
      ],
      checkpoint: '能复述完整入场模型，并说出至少 2 种容易失效的市场环境。'
    },
    {
      id: 'w5', week: 5, stage: '阶段 4', theme: '订单流 · 基础读图',
      goal: '用 Delta / CVD / Footprint 看主动买卖力量，并与前面的结构、位置互相对照。',
      minutes: 240,
      tasks: [
        { key: 'w5-t1', text: '订单簿与 MBO：理解挂单、点差、撤单与流动性时段的关系。', lessons: ['m04-01'], minutes: 35 },
        { key: 'w5-t2', text: 'Footprint：读 POC、不平衡与吸收，找出 5 个样本。', lessons: ['m04-02'], minutes: 45 },
        { key: 'w5-t3', text: 'Delta 与 CVD：标出 3 次背离，并解释为什么背离不总是反转。', lessons: ['m04-03'], minutes: 40 },
        { key: 'w5-t4', text: '同一位置用 PA / 结构 / 订单流三种视角对照，写出各自结论。', lessons: ['m04-02', 'm04-03', 'm02-04'], minutes: 40 },
        { key: 'w5-t5', text: '完成 m04 前三课自测。', lessons: ['m04-01', 'm04-02', 'm04-03'], minutes: 30 }
      ],
      checkpoint: '能读懂一张 footprint，并指出当天的吸收位置与 POC。'
    },
    {
      id: 'w6', week: 6, stage: '阶段 4', theme: '订单流 · 进阶与共振',
      goal: '识别吸收、冰山单与成交量分布，把订单流信号和结构入场做成共振清单。',
      minutes: 235,
      tasks: [
        { key: 'w6-t1', text: '吸收与冰山单：找 3 个「放量不走进」的案例并截图。', lessons: ['m04-04'], minutes: 40 },
        { key: 'w6-t2', text: '成交量分布：用 POC / VAH / VAL 写 3 天的日内背景。', lessons: ['m04-05'], minutes: 40 },
        { key: 'w6-t3', text: '订单流 + SMC 共振：设计你的共振入场清单（必要条件 + 剔除条件）。', lessons: ['m04-06'], minutes: 40 },
        { key: 'w6-t4', text: '模拟盘练习 10 次共振入场，记录 R 与执行偏差。', lessons: ['m04-06', 'm06-03'], minutes: 50 },
        { key: 'w6-t5', text: '完成 m04 全部自测。', lessons: ['m04-04', 'm04-05', 'm04-06'], minutes: 30 }
      ],
      checkpoint: '能列出订单流 + 结构共振的 3 个必要条件，并说明失效场景。'
    },
    {
      id: 'w7', week: 7, stage: '阶段 5', theme: '拍卖理论 · 市场轮廓',
      goal: '用拍卖框架读「价值区、POC、失衡、失败拍卖」：先定背景，再找证据。',
      minutes: 240,
      tasks: [
        { key: 'w7-t1', text: '拍卖理论入门：在真实/模拟日内图上标出价值区、POC、VAH/VAL。', lessons: ['m08-01', 'm08-02'], minutes: 40 },
        { key: 'w7-t2', text: 'TPO 与市场轮廓：画出 3 个交易日的轮廓，标注初始平衡与区间扩展。', lessons: ['m08-02', 'm08-03'], minutes: 45 },
        { key: 'w7-t3', text: '价值区迁移：找出价值区上移、下移、扩张各 2 个例子。', lessons: ['m08-03'], minutes: 40 },
        { key: 'w7-t4', text: '失衡与失败拍卖：找 3 个单次打印与 2 个失败拍卖样本。', lessons: ['m08-04'], minutes: 40 },
        { key: 'w7-t5', text: '组合框架：写一份「Profile 定背景 + 订单流定证据 + SMC 定位置」检查清单。', lessons: ['m08-05', 'm04-05'], minutes: 40 },
        { key: 'w7-t6', text: '完成 m08 五课自测（正确率 ≥ 80%），产出《市场轮廓图》3 张。', lessons: ['m08-01', 'm08-02', 'm08-03', 'm08-04', 'm08-05'], minutes: 35 }
      ],
      checkpoint: '能画出一天的轮廓并标出 POC/VAH/VAL，说明价值区三种走法的区别。'
    },
    {
      id: 'w8', week: 8, stage: '阶段 6', theme: '威科夫 · 阶段与量价',
      goal: '用威科夫的阶段划分与三大定律解读筹码转移，理解 Spring / Upthrust。',
      minutes: 230,
      tasks: [
        { key: 'w8-t1', text: '三大定律：用一段行情解释「努力与结果」的背离。', lessons: ['m05-01'], minutes: 35 },
        { key: 'w8-t2', text: '吸筹五阶段：标注一段吸筹，指出 Spring 与测试。', lessons: ['m05-02', 'm05-03'], minutes: 45 },
        { key: 'w8-t3', text: '派发与 Upthrust：标注一段派发，说明诱多逻辑。', lessons: ['m05-04'], minutes: 40 },
        { key: 'w8-t4', text: '量价关系与因果测算：给一个目标位并说明测算依据。', lessons: ['m05-05'], minutes: 40 },
        { key: 'w8-t5', text: '完成 m05 全部自测，写 200 字「威科夫适用条件与缺点」。', lessons: ['m05-02', 'm05-05'], minutes: 35 }
      ],
      checkpoint: '能把一段行情划分成威科夫阶段，并逐条给出量价依据。'
    },
    {
      id: 'w9', week: 9, stage: '阶段 7-8', theme: 'ATR 风控 + 综合实战',
      goal: '把风险参数写死，把分析流程固化成 SOP，用 10 个模拟交易日验证执行一致性。',
      minutes: 270,
      tasks: [
        { key: 'w9-t1', text: 'ATR 止损：用 ATR 倍数为 5 个入场设置止损并说明倍数选择。', lessons: ['m06-01', 'm06-02'], minutes: 40 },
        { key: 'w9-t2', text: '仓位与 R 倍数：用仓位计算器把每笔风险控制在账户 1% 以内。', lessons: ['m06-03'], minutes: 35 },
        { key: 'w9-t3', text: '期望值与回撤：用 20 笔模拟记录计算期望值、胜率与最大回撤。', lessons: ['m06-04'], minutes: 45 },
        { key: 'w9-t4', text: '多周期分析 SOP：从大往小写出固定流程（分析→执行→入场）。', lessons: ['m07-01'], minutes: 40 },
        { key: 'w9-t5', text: '完成交易计划模板，并连续 10 个模拟交易日按模板复盘。', lessons: ['m07-02', 'm07-03'], minutes: 60 },
        { key: 'w9-t6', text: '全站课程自测正确率 ≥ 80%，输出《个人交易 SOP》初稿。', lessons: ['m07-01', 'm07-02', 'm07-03'], minutes: 45 }
      ],
      checkpoint: '有一份写死风险参数的交易 SOP，以及 10 个交易日的执行复盘记录。'
    },
    {
      id: 'w10', week: 10, stage: '阶段 9', theme: '真实案例 + 结业考核',
      goal: '在真实 NQ/GC 数据上完成判读，参加综合考核，把方法论沉淀成自己的 SOP。',
      minutes: 255,
      tasks: [
        { key: 'w10-t1', text: 'NQ 两年真实日线：标出主要趋势、次级折返与结构转变，写明数据来源。', lessons: ['m09-01'], minutes: 40 },
        { key: 'w10-t2', text: 'NQ 真实日内：找 3 次「扫荡→位移→回踩」并逐笔复盘。', lessons: ['m09-02', 'm03-06'], minutes: 40 },
        { key: 'w10-t3', text: 'GC 真实日线：用拍卖 + 威科夫两种视角各写一段判断，并对比差异。', lessons: ['m09-03', 'm08-03', 'm05-02'], minutes: 45 },
        { key: 'w10-t4', text: 'GC 真实日内：标出价值区边缘的失败拍卖与目标位。', lessons: ['m09-04', 'm08-04'], minutes: 40 },
        { key: 'w10-t5', text: '参加实战考核：综合测验 ≥ 80 分，图表判读正确率 ≥ 80%。', lessons: ['m07-01', 'm07-02'], minutes: 50, exam: true },
        { key: 'w10-t6', text: '结业：全部课程完成 + 综合考核 ≥ 80 分，输出《个人交易 SOP》终稿。', lessons: ['m07-02', 'm07-03', 'm09-04'], minutes: 40, exam: true }
      ],
      checkpoint: '完成全部课程 + 综合考核 ≥ 80 分；能在真实数据上独立完成一次完整分析并写明来源与不确定处。'
    }
  ];

  /* 每日训练清单（按日期分别记录进度） */
  var DAILY = [
    { id: 'd1', title: '盘前 10 分钟：标出关键位', text: '标出昨日前高/前低与今日开盘价位置，写下「价格在哪一侧」。', refs: ['m02-04'], minutes: 10 },
    { id: 'd2', title: '一句话判断趋势结构', text: '用 HH/HL 或 LH/LL 描述当前结构，写一句话结论，不预测。', refs: ['m01-04'], minutes: 5 },
    { id: 'd3', title: '找 1 个假突破样本', text: '找 1 个「扫荡 + 收回」的样本截图存档，标注扫荡后的方向。', refs: ['m03-03'], minutes: 10 },
    { id: 'd4', title: '读一遍交易计划', text: '复习入场触发、止损、目标与失效条件；不交易也要读。', refs: ['m07-02'], minutes: 5 },
    { id: 'd5', title: '记录 1 笔（模拟）交易', text: '记录理由、R 倍数、结果与当时情绪；纸上模拟同样有效。', refs: ['m07-03'], minutes: 10 },
    { id: 'd6', title: '收盘后 5 分钟复盘', text: '更新日志：今天做对的 1 件事、明天要改的 1 件事。', refs: ['m07-03'], minutes: 5 }
  ];

  // 构建扁平课程索引（兜底）
  var lessonMap = {};
  MODULE_ORDER.forEach(function (modId) {
    var mod = MODULES[modId];
    if (!mod) return;
    mod.lessons.forEach(function (lesson, index) {
      lessonMap[lesson.id] = {
        id: lesson.id,
        title: lesson.title,
        minutes: lesson.minutes,
        level: lesson.level,
        summary: lesson.summary,
        moduleId: modId,
        moduleTitle: mod.title,
        moduleAccent: null,
        indexInModule: index,
        fallback: true
      };
    });
  });

  LQ.catalog = {
    moduleOrder: MODULE_ORDER,
    modules: MODULES,
    lessonMap: lessonMap,
    lessonTotal: Object.keys(lessonMap).length,
    foundation: FOUNDATION,
    moduleCheckpoints: MODULE_CHECKPOINTS,
    plan: PLAN,
    daily: DAILY
  };

  /* ==========================================================================
     数据访问辅助：优先真实内容，缺失时回退兜底目录
     ========================================================================== */
  function content() { return LQ.content || null; }

  function contentModules() {
    try {
      var c = content();
      return c && typeof c.getModules === 'function' ? c.getModules() : [];
    } catch (err) {
      return [];
    }
  }

  function contentModule(id) {
    try {
      var c = content();
      return c && typeof c.getModule === 'function' ? c.getModule(id) : null;
    } catch (err) {
      return null;
    }
  }

  function contentLesson(id) {
    try {
      var c = content();
      return c && typeof c.getLesson === 'function' ? c.getLesson(id) : null;
    } catch (err) {
      return null;
    }
  }

  var site = {
    /* 全站真实统计：以「合并后的模块/课程」为准（内容缺失时用兜底目录补齐，保证 UI 一致） */
    stats: function () {
      var modules = site.modules();
      var lessons = site.lessons();
      var minutes = 0;
      lessons.forEach(function (lesson) { minutes += Number(lesson.minutes) || 0; });
      return {
        lessonCount: lessons.length,
        moduleCount: modules.length,
        minutes: minutes,
        hours: Math.round((minutes / 60) * 10) / 10
      };
    },

    /* 有序模块列表：有真实内容用真实内容，缺失的用兜底目录补齐 */
    modules: function () {
      var loaded = {};
      contentModules().forEach(function (m) { if (m && m.id) loaded[m.id] = m; });
      var out = [];
      MODULE_ORDER.forEach(function (id) {
        var real = loaded[id];
        if (real) { out.push(real); return; }
        var fallback = MODULES[id];
        if (fallback) out.push(fallback);
      });
      // 兜底目录之外、内容脚本新增的模块（理论上不会有）也保留
      contentModules().forEach(function (m) {
        if (m && m.id && MODULE_ORDER.indexOf(m.id) === -1) out.push(m);
      });
      return out;
    },

    module: function (id) {
      var real = contentModule(id);
      if (real) return real;
      return MODULES[id] || null;
    },

    moduleLessons: function (id) {
      var real = contentModule(id);
      if (real && Array.isArray(real.lessons) && real.lessons.length) return real.lessons;
      var fallback = MODULES[id];
      if (fallback && Array.isArray(fallback.lessons)) return fallback.lessons;
      return [];
    },

    lessons: function () {
      var out = [];
      site.modules().forEach(function (mod) {
        site.moduleLessons(mod.id).forEach(function (lesson) { out.push(lesson); });
      });
      return out;
    },

    lesson: function (id) {
      if (!id) return null;
      var real = contentLesson(id);
      if (real) return real;
      return LQ.catalog.lessonMap[id] || null;
    },

    lessonCount: function () {
      return site.lessons().length;
    },

    lessonIndex: function (id) {
      var list = site.lessons();
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id === id) return i;
      }
      return -1;
    },

    prevLesson: function (id) {
      var index = site.lessonIndex(id);
      if (index <= 0) return null;
      return site.lessons()[index - 1];
    },

    nextLesson: function (id) {
      var index = site.lessonIndex(id);
      var list = site.lessons();
      if (index < 0 || index >= list.length - 1) return null;
      return list[index + 1];
    },

    firstLesson: function () {
      var list = site.lessons();
      return list.length ? list[0] : null;
    },

    firstUnfinishedLesson: function () {
      var list = site.lessons();
      for (var i = 0; i < list.length; i++) {
        if (!LQ.store.progress.isDone(list[i].id)) return list[i];
      }
      return null;
    },

    lastLesson: function () {
      try { return LQ.store.progress.getLastLesson(); } catch (err) { return null; }
    },

    summary: function () {
      var total = Math.max(site.lessonCount(), LQ.catalog.lessonTotal);
      try { return LQ.store.progress.summary(total); } catch (err) { return { done: 0, total: total, pct: 0 }; }
    },

    moduleProgress: function (id) {
      var lessons = site.moduleLessons(id);
      var done = 0;
      lessons.forEach(function (lesson) {
        try { if (LQ.store.progress.isDone(lesson.id)) done++; } catch (err) { /* ignore */ }
      });
      var total = lessons.length;
      return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
    },

    foundationProgress: function () {
      var items = LQ.catalog.foundation.items;
      var done = 0;
      items.forEach(function (item) {
        try { if (LQ.store.progress.isPlanTaskDone(item.id) || LQ.store.progress.isDone('m00-0' + item.id.slice(-1))) done++; } catch (err) { /* ignore */ }
      });
      return { done: done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
    },

    isLessonDone: function (id) {
      try { return LQ.store.progress.isDone(id); } catch (err) { return false; }
    },

    stageNumber: function (mod) {
      if (!mod) return 0;
      if (mod.id === 'm00') return 0;
      // V2：阶段编号以 order 为准（content 的 stage 数字字段可能滞后，stageName 仍是展示文案）
      return Number(mod.order) || Number(mod.stage) || 0;
    },

    /* 阶段列表：阶段 0 + 9 个模块阶段（顺序由 MODULE_ORDER / content.order 决定） */
    stages: function () {
      var out = [{ kind: 'foundation', num: 0, data: LQ.catalog.foundation }];
      site.modules().forEach(function (mod) {
        if (mod.id === 'm00') return;
        out.push({ kind: 'module', num: site.stageNumber(mod), data: mod });
      });
      return out;
    },

    planWeeks: function () { return LQ.catalog.plan.length; },

    /* 考核题库（content-c 的 exam-bank.js 注册；加载前返回空数组） */
    examQuestions: function () {
      try {
        return (LQ.content && typeof LQ.content.listExamQuestions === 'function')
          ? (LQ.content.listExamQuestions() || []) : [];
      } catch (err) { return []; }
    },

    chartExamQuestions: function () {
      return site.examQuestions().filter(function (q) {
        return q && q.type === 'chart' && q.scenario && Array.isArray(q.options) && q.options.length >= 2;
      });
    },

    knowledgeExamQuestions: function () {
      return site.examQuestions().filter(function (q) {
        return q && q.type !== 'chart' && Array.isArray(q.options) && q.options.length >= 2;
      });
    },

    /* 真实数据集（Lead 的 data/real/*.js 注册；加载前返回空数组） */
    datasets: function () {
      try {
        return (LQ.data && typeof LQ.data.listDatasets === 'function') ? (LQ.data.listDatasets() || []) : [];
      } catch (err) { return []; }
    },

    dataset: function (id) {
      try { return (LQ.data && typeof LQ.data.getDataset === 'function') ? LQ.data.getDataset(id) : null; } catch (err) { return null; }
    },

    realScenarios: function () {
      try {
        var list = (LQ.data && typeof LQ.data.listScenarios === 'function') ? (LQ.data.listScenarios() || []) : [];
        return list.filter(function (s) { return s && s.module === 'real'; });
      } catch (err) { return []; }
    },

    scenario: function (id) {
      try { return (LQ.data && typeof LQ.data.getScenario === 'function') ? LQ.data.getScenario(id) : null; } catch (err) { return null; }
    },

    /* 考核历史（LQ.store 'examHistory'，最多 20 条） */
    examHistory: function () {
      try {
        var list = LQ.store.get('examHistory', []);
        return Array.isArray(list) ? list : [];
      } catch (err) { return []; }
    },

    saveExamHistory: function (entry) {
      var list = site.examHistory();
      list.unshift(entry);
      list = list.slice(0, 20);
      try { LQ.store.set('examHistory', list); } catch (err) { /* store 内部已降级 */ }
      return list;
    },

    formatMinutes: function (minutes) {
      var m = Math.max(0, Math.round(Number(minutes) || 0));
      if (m < 60) return m + ' 分钟';
      var h = Math.floor(m / 60), rest = m % 60;
      return rest ? h + ' 小时 ' + rest + ' 分' : h + ' 小时';
    },

    planTasks: function () {
      var out = [];
      LQ.catalog.plan.forEach(function (week) {
        week.tasks.forEach(function (task) {
          out.push({ week: week.week, task: task });
        });
      });
      return out;
    },

    planSummary: function () {
      var all = site.planTasks();
      var done = 0;
      var minutes = 0;
      LQ.catalog.plan.forEach(function (week) { minutes += Number(week.minutes) || 0; });
      all.forEach(function (entry) {
        try { if (LQ.store.progress.isPlanTaskDone(entry.task.key)) done++; } catch (err) { /* ignore */ }
      });
      var total = all.length;
      return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0, minutes: minutes };
    },

    dailyKey: function (itemId, date) {
      var d = date || new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      var stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      return 'daily-' + stamp + '-' + itemId;
    },

    dailySummary: function (date) {
      var done = 0;
      LQ.catalog.daily.forEach(function (item) {
        try { if (LQ.store.progress.isPlanTaskDone(site.dailyKey(item.id, date))) done++; } catch (err) { /* ignore */ }
      });
      return { done: done, total: LQ.catalog.daily.length };
    },

    /* 聚合所有真实来源（模块 + 课程），按 URL 去重 */
    allSources: function () {
      var groups = [];
      site.modules().forEach(function (mod) {
        var realModule = contentModule(mod.id);
        if (!realModule) return; // 兜底目录没有真实来源
        var group = { module: realModule, sources: [], lessons: [] };
        (realModule.sources || []).forEach(function (src) {
          if (src && src.url) group.sources.push({ title: src.title || src.url, url: src.url, note: src.note || '', lessonId: null });
        });
        (realModule.lessons || []).forEach(function (lesson) {
          var list = [];
          (lesson.sources || []).forEach(function (src) {
            if (!src || !src.url) return;
            var entry = { title: src.title || src.url, url: src.url, note: src.note || '', lessonId: lesson.id, lessonTitle: lesson.title };
            group.sources.push(entry);
            list.push(entry);
          });
          if (list.length) group.lessons.push({ lesson: lesson, sources: list });
        });
        // 按 URL 去重（保留第一次出现的课程归属）
        var seen = {};
        group.sources = group.sources.filter(function (src) {
          if (seen[src.url]) return false;
          seen[src.url] = true;
          return true;
        });
        if (group.sources.length) groups.push(group);
      });
      return groups;
    },

    glossary: function () {
      try {
        return LQ.content && typeof LQ.content.listGlossary === 'function' ? LQ.content.listGlossary() : [];
      } catch (err) { return []; }
    },

    chromeOK: function () {
      return !!(LQ.chart && typeof LQ.chart.create === 'function');
    }
  };

  LQ.site = site;
})(typeof window !== 'undefined' ? window : globalThis);
