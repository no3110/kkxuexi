/* 标注种类示例情景（Lead 提供，供 chart-engineer 调试与内容作者参考；不挂在课程里） */
(function () {
  'use strict';
  var S = LQ.data;

  S.registerScenario(S.buildScenario({
    id: 'demo-annotations',
    title: '标注全类型示例',
    module: 'demo',
    lesson: null,
    symbol: 'DEMO-1H',
    timeframe: '1H',
    seed: 20250301,
    startPrice: 100,
    tick: 0.05,
    path: [[0, 100], [10, 101.8], [16, 100.9], [26, 103.4], [34, 102.3], [44, 105.2], [52, 104.1], [62, 106.8], [72, 105.7], [82, 108.2], [94, 107.1], [108, 109.4], [118, 108.6]],
    noise: 0.18,
    wick: 0.2,
    volumeBase: 1200,
    volumeOnMove: 1.3,
    panels: { volume: true, delta: true, cvd: true, profile: true, ma: [20], atr: true, atrPeriod: 14 },
    events: {
      'hh-1': S.marker(10, 102.15, '更高的高点 HH', 'above', 'bull'),
      'hl-1': S.marker(16, 100.7, '更高的低点 HL', 'below', 'bull'),
      'prior-high': S.hline(26, 80, 103.4, '前高（流动性）', 'neutral'),
      'sweep': S.marker(34, 102.12, '回踩前高确认', 'below', 'warn'),
      'bos': S.segment(26, 103.4, 42, 104.85, 'BOS 突破前高', 'bull', { arrow: true }),
      'ob-zone': S.zone(30, 36, 102.2, 103.4, '看涨订单块 OB', 'bull'),
      'fvg-zone': S.zone(36, 40, 102.93, 103.18, 'FVG 缺口', 'info'),
      'premium': S.range(52, 60, '溢价区', 'bear', { y1: 105.6, y2: 106.8 }),
      'fib-1': S.fib(44, 105.2, 52, 104.1, [0.382, 0.5, 0.618, 0.705, 0.79], '回撤位', 'info'),
      'eq': S.hline(44, 70, 104.65, '均衡点 50%', 'neutral'),
      'note': S.text(70, 107.6, '注意：这里只是示例文字', 'neutral')
    },
    description: '用于验证 zone / hline / marker / segment / text / fib / range 七种标注与各面板渲染。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'demo-footprint',
    title: '足迹图面板示例',
    module: 'demo',
    lesson: null,
    symbol: 'DEMO-5m',
    timeframe: '5m',
    seed: 7788,
    startPrice: 100,
    tick: 0.05,
    path: [[0, 100], [8, 100.6], [14, 99.8], [24, 101.2], [32, 100.9], [42, 102.0], [50, 101.5], [60, 102.6]],
    noise: 0.1,
    wick: 0.12,
    volumeBase: 900,
    volumeOnMove: 1.4,
    overrides: {
      24: { o: 100.0, h: 101.4, l: 99.9, c: 101.2, v: 3200 },
      42: { o: 101.0, h: 102.1, l: 100.9, c: 102.0, v: 3600 }
    },
    deltaOverrides: { 24: 900, 42: 1200 },
    panels: { volume: true, delta: true, cvd: true, footprint: true, profile: false, ladder: false },
    events: {
      'absorb': S.zone(22, 26, 99.9, 100.5, '放量但价格不涨 = 吸收', 'warn'),
      'delta-1': S.marker(24, 99.75, 'Delta 放大', 'below', 'bull')
    },
    description: '用于验证 footprint 面板（足迹数字 + 买卖量配色）。'
  }));

  S.registerScenario(S.buildScenario({
    id: 'demo-ladder',
    title: '订单簿 MBO 面板示例',
    module: 'demo',
    lesson: null,
    symbol: 'DEMO-5m',
    timeframe: '5m',
    seed: 9901,
    startPrice: 100,
    tick: 0.05,
    path: [[0, 100], [10, 100.4], [18, 99.9], [28, 100.8], [36, 100.3], [48, 101.2], [56, 100.9], [66, 101.6]],
    noise: 0.08,
    wick: 0.1,
    volumeBase: 800,
    panels: { volume: true, delta: true, cvd: true, ladder: true, ma: [] },
    events: {
      'bid-wall': S.hline(0, 65, 100.2, '买墙（大额挂单）', 'bull'),
      'ask-wall': S.hline(0, 65, 101.3, '卖墙（大额挂单）', 'bear')
    },
    description: '用于验证 ladder 面板（买卖档位、量柱、点差）。'
  }));
})();
