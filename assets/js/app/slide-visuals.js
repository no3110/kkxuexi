/* 课件配图（site-engineer 维护）
 * 给“没有图表”的文字分镜配一张概念示意图：按关键词匹配，一屏一个重点、图文配合。
 *   LQ.slideVisuals.pick(slide, lesson) -> { id, html, caption } | null
 *   LQ.slideVisuals.render(id) -> svg 字符串
 * 全部为示意图（非真实行情），配色与图表引擎一致。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var BULL = '#26a69a', BEAR = '#ef5350', ACC = '#7dd3fc', WARN = '#f0b90b', GRID = '#243247', TXT = '#c2cede', DIM = '#6f859d', VIO = '#a78bfa';

  function svg(body, label) {
    return '<svg viewBox="0 0 440 270" class="slide-diagram" role="img" aria-label="' + label + '" font-family="system-ui,-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif">' +
      '<g stroke="' + GRID + '" stroke-dasharray="3 6" stroke-width="1"><path d="M20 50H420M20 110H420M20 170H420M20 230H420"/></g>' + body + '</svg>';
  }
  function t(x, y, s, color, size, anchor, weight) {
    return '<text x="' + x + '" y="' + y + '" fill="' + (color || TXT) + '" font-size="' + (size || 12) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + (weight ? ' font-weight="' + weight + '"' : '') + '>' + s + '</text>';
  }
  /* 按 [o,h,l,c] 画一组蜡烛；price→y 线性映射 */
  function candles(list, opt) {
    var x0 = opt.x0 || 30, step = opt.step || 22, w = opt.w || 12, lo = opt.lo, hi = opt.hi, top = opt.top || 30, bottom = opt.bottom || 240;
    function y(p) { return top + (hi - p) / (hi - lo) * (bottom - top); }
    return list.map(function (k, i) {
      var x = x0 + i * step, up = k[3] >= k[0], c = k[4] || (up ? BULL : BEAR);
      var yt = y(Math.max(k[0], k[3])), yb = y(Math.min(k[0], k[3]));
      return '<path d="M' + (x + w / 2) + ' ' + y(k[1]).toFixed(1) + 'V' + y(k[2]).toFixed(1) + '" stroke="' + c + '" stroke-width="1.6"/>' +
        '<rect x="' + x + '" y="' + yt.toFixed(1) + '" width="' + w + '" height="' + Math.max(1.5, yb - yt).toFixed(1) + '" fill="' + c + '" rx="1.5"/>';
    }).join('');
  }
  function arrow(x1, y1, x2, y2, color) {
    var a = Math.atan2(y2 - y1, x2 - x1), l = 8;
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + color + '" stroke-width="2" fill="none"/>' +
      '<path d="M' + x2 + ' ' + y2 + 'L' + (x2 - l * Math.cos(a - 0.45)).toFixed(1) + ' ' + (y2 - l * Math.sin(a - 0.45)).toFixed(1) + 'L' + (x2 - l * Math.cos(a + 0.45)).toFixed(1) + ' ' + (y2 - l * Math.sin(a + 0.45)).toFixed(1) + 'Z" fill="' + color + '"/>';
  }
  function poly(points, color, width, dash) {
    return '<polyline points="' + points.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + (width || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>';
  }
  function band(y1, y2, color, label, lx) {
    return '<rect x="20" y="' + y1 + '" width="400" height="' + (y2 - y1) + '" fill="' + color + '" opacity=".13"/>' +
      '<path d="M20 ' + y1 + 'H420M20 ' + y2 + 'H420" stroke="' + color + '" stroke-opacity=".55" stroke-dasharray="5 4"/>' +
      (label ? t(lx || 26, y1 - 6, label, color, 12, null, 600) : '');
  }

  var D = {};

  D.orderbook = { caption: '订单簿：挂单排队等成交，主动吃单才推动价格', keys: ['挂单', '吃单', '订单簿', 'MBO', '买一', '卖一', '限价', '市价', '成交', '撮合', '盘口', 'DOM'], draw: function () {
    var rows = [[106.0, 0, 34], [105.75, 0, 58], [105.5, 0, 96], [105.25, 0, 72], [105.0, 81, 0], [104.75, 120, 0], [104.5, 64, 0], [104.25, 40, 0]];
    var body = rows.map(function (r, i) {
      var y = 34 + i * 26, bid = r[1], ask = r[2];
      return t(220, y + 13, r[0].toFixed(2), i === 3 || i === 4 ? WARN : TXT, 12, 'middle', 600) +
        (ask ? '<rect x="262" y="' + y + '" width="' + ask * 1.4 + '" height="18" fill="' + BEAR + '" opacity=".75" rx="2"/>' + t(268 + ask * 1.4, y + 13, ask, DIM, 11) : '') +
        (bid ? '<rect x="' + (178 - bid * 1.2) + '" y="' + y + '" width="' + bid * 1.2 + '" height="18" fill="' + BULL + '" opacity=".75" rx="2"/>' + t(172 - bid * 1.2, y + 13, bid, DIM, 11, 'end') : '');
    }).join('');
    return body + t(110, 22, '买方挂单（Bid）', BULL, 12, 'middle', 600) + t(330, 22, '卖方挂单（Ask）', BEAR, 12, 'middle', 600) +
      arrow(400, 250, 300, 128, WARN) + t(300, 262, '市价买单“吃掉”卖一 → 价格上移', WARN, 12, 'middle');
  } };

  D.candle = { caption: '一根 K 线 = 四个价格：开、高、低、收', keys: ['K 线', 'K线', '蜡烛', '实体', '影线', '开盘', '收盘', '最高', '最低', '四价'], draw: function () {
    return '<path d="M120 30V240" stroke="' + BULL + '" stroke-width="3"/><rect x="96" y="80" width="48" height="100" fill="' + BULL + '" rx="3"/>' +
      '<path d="M320 40V236" stroke="' + BEAR + '" stroke-width="3"/><rect x="296" y="70" width="48" height="110" fill="' + BEAR + '" rx="3"/>' +
      t(156, 34, '最高 H', TXT) + t(156, 84, '收盘 C', BULL) + t(156, 184, '开盘 O', BULL) + t(156, 244, '最低 L', TXT) +
      t(356, 44, '最高 H', TXT) + t(356, 74, '开盘 O', BEAR) + t(356, 184, '收盘 C', BEAR) + t(356, 240, '最低 L', TXT) +
      t(120, 262, '阳线：收 > 开', BULL, 12, 'middle', 600) + t(320, 262, '阴线：收 < 开', BEAR, 12, 'middle', 600) +
      t(40, 134, '实体', ACC, 12) + '<path d="M70 130H92" stroke="' + DIM + '"/>' + t(40, 58, '上影线', ACC, 12) + '<path d="M80 54H116" stroke="' + DIM + '"/>';
  } };

  D.pinbar = { caption: '长影线 = 价格被拒绝；放在关键位置才有意义', keys: ['Pin', 'pin', '针形', '长下影', '长上影', '拒绝'], draw: function () {
    var c = candles([[104, 104.4, 102.6, 102.8], [102.8, 103.1, 101.6, 101.8], [101.8, 102.1, 100.9, 101.2], [101.2, 101.6, 98.6, 101.4], [101.4, 102.6, 101.2, 102.4], [102.4, 103.6, 102.2, 103.4]], { x0: 70, step: 52, w: 22, lo: 98, hi: 105, top: 30, bottom: 240 });
    return band(196, 214, ACC, '支撑区', 26) + c + arrow(270, 230, 236, 226, WARN) + t(276, 236, '长下影：跌下去被买回来', WARN, 12) + t(220, 30, '位置 > 形态', TXT, 13, 'middle', 600);
  } };

  D.engulf = { caption: '吞没：后一根实体完全包住前一根，力量换手', keys: ['吞没', '内包', '孕线', 'Inside', 'inside', 'Engulf'], draw: function () {
    return '<rect x="90" y="100" width="40" height="60" fill="' + BEAR + '" rx="2"/><path d="M110 88V172" stroke="' + BEAR + '" stroke-width="2"/>' +
      '<rect x="150" y="70" width="48" height="110" fill="' + BULL + '" rx="2"/><path d="M174 56V196" stroke="' + BULL + '" stroke-width="2"/>' +
      t(150, 230, '看涨吞没', BULL, 13, 'middle', 600) +
      '<rect x="270" y="60" width="50" height="120" fill="' + BEAR + '" rx="2"/><path d="M295 44V200" stroke="' + BEAR + '" stroke-width="2"/>' +
      '<rect x="340" y="96" width="34" height="46" fill="' + BULL + '" rx="2"/><path d="M357 86V156" stroke="' + BULL + '" stroke-width="2"/>' +
      '<rect x="262" y="40" width="122" height="166" fill="none" stroke="' + ACC + '" stroke-dasharray="4 4"/>' +
      t(322, 230, '内包线：在母线范围内整理', ACC, 13, 'middle', 600);
  } };

  D.sr = { caption: '支撑阻力是“反复被争夺”的价格区，而不是一条细线', keys: ['支撑', '阻力', '关键位', '区间', '前高', '前低', '水平'], draw: function () {
    return band(56, 74, BEAR, '阻力区：多次冲不过', 26) + band(190, 208, BULL, '支撑区：多次跌不破', 26) +
      poly([[30, 196], [70, 120], [100, 66], [140, 150], [180, 200], [220, 110], [262, 62], [300, 140], [340, 198], [380, 120], [410, 90]], ACC) +
      [[100, 66], [262, 62]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + BEAR + '"/>'; }).join('') +
      [[180, 200], [340, 198]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + BULL + '"/>'; }).join('') +
      t(220, 262, '碰得越多、反应越强 → 这个位置越重要', TXT, 12, 'middle');
  } };

  D.sweep = { caption: '扫荡 / 假突破：先扫掉止损，再反向走', keys: ['扫荡', '假突破', '流动性', '止损池', 'Sweep', 'sweep', '诱多', '诱空', '猎杀', '突破'], draw: function () {
    var dots = ''; for (var i = 0; i < 9; i++) dots += '<circle cx="' + (180 + i * 14) + '" cy="' + (52 + (i % 3) * 6) + '" r="3.5" fill="' + WARN + '" opacity=".8"/>';
    return '<path d="M20 78H420" stroke="' + BEAR + '" stroke-width="1.6" stroke-dasharray="6 4"/>' + t(26, 96, '前高（很多人把止损放在上方）', BEAR, 12) + dots + t(180, 36, '止损单 / 突破买单 = 流动性', WARN, 12) +
      poly([[30, 210], [80, 150], [120, 180], [170, 100], [210, 130], [262, 40], [290, 120], [330, 170], [380, 230], [415, 240]], ACC) +
      arrow(262, 40, 262, 40, ACC) + t(272, 44, '刺破 → 收回', ACC, 12, null, 600) + arrow(300, 130, 370, 222, BEAR) + t(250, 262, '收回区间内 = 突破失败，反向机会', TXT, 12, 'middle');
  } };

  D.structure = { caption: '结构：高点、低点一路抬高 = 上涨；被打破 = 结构转变', keys: ['HH', 'HL', 'LH', 'LL', '峰谷', '结构', 'BOS', 'CHoCH', 'MSS', '趋势', '道氏', '更高的高点', '摆动'], draw: function () {
    var pts = [[30, 220], [80, 160], [110, 190], [160, 120], [190, 150], [240, 80], [270, 120], [300, 96], [330, 168], [370, 140], [410, 220]];
    var lab = [['HL', 110, 190, 1, BULL], ['HH', 160, 120, 0, BULL], ['HL', 190, 150, 1, BULL], ['HH', 240, 80, 0, BULL], ['LH', 300, 96, 0, BEAR], ['LL', 330, 168, 1, BEAR]];
    return poly(pts, ACC) + lab.map(function (l) { return '<circle cx="' + l[1] + '" cy="' + l[2] + '" r="4" fill="' + l[4] + '"/>' + t(l[1], l[3] ? l[2] + 20 : l[2] - 10, l[0], l[4], 12, 'middle', 700); }).join('') +
      '<path d="M190 150H350" stroke="' + WARN + '" stroke-dasharray="5 4"/>' + t(352, 146, '跌破前低', WARN, 11) + t(330, 196, 'CHoCH', WARN, 12, 'middle', 700) +
      t(120, 258, '上涨：HH + HL', BULL, 12, 'middle', 600) + t(340, 258, '转弱：LH + LL', BEAR, 12, 'middle', 600);
  } };

  D.phases = { caption: '趋势三阶段：聪明钱先买、大众跟进、高位派发', keys: ['三阶段', '吸筹', '公众参与', '派发', '主要趋势'], draw: function () {
    return '<rect x="20" y="160" width="120" height="80" fill="' + BULL + '" opacity=".1"/><rect x="290" y="30" width="130" height="80" fill="' + BEAR + '" opacity=".1"/>' +
      poly([[24, 210], [50, 196], [76, 214], [104, 192], [132, 204], [180, 150], [230, 96], [270, 70], [300, 60], [330, 80], [356, 56], [384, 84], [414, 70]], ACC) +
      t(80, 256, '① 吸筹', BULL, 13, 'middle', 700) + t(215, 140, '② 公众参与', ACC, 13, 'middle', 700) + t(355, 128, '③ 派发', BEAR, 13, 'middle', 700) +
      t(80, 150, '少数人在低位买', DIM, 11, 'middle') + t(355, 24, '大众追高时卖', DIM, 11, 'middle');
  } };

  D.mtf = { caption: '多周期：大周期看方向，中周期找区域，小周期找入场', keys: ['多周期', '周期', '大周期', '小周期', '共振', '地图', '级别', '时间框架'], draw: function () {
    function box(x, title, sub, color, path) {
      return '<rect x="' + x + '" y="34" width="124" height="176" rx="10" fill="#0a111b" stroke="' + color + '" stroke-opacity=".6"/>' + t(x + 62, 58, title, color, 13, 'middle', 700) + t(x + 62, 200, sub, DIM, 11, 'middle') + poly(path, color, 2);
    }
    return box(20, '日线 · 地图', '定方向', ACC, [[34, 170], [70, 140], [96, 150], [130, 96]]) +
      box(158, '1 小时 · 路线', '找关键区域', VIO, [[172, 110], [200, 150], [228, 130], [262, 170]]) +
      box(296, '5 分钟 · 台阶', '等触发信号', BULL, [[310, 160], [330, 176], [350, 150], [368, 166], [404, 110]]) +
      arrow(146, 120, 156, 120, DIM) + arrow(284, 120, 294, 120, DIM) + t(220, 250, '从大往小看，顺序不能反', TXT, 13, 'middle', 600);
  } };

  D.obfvg = { caption: '订单块 OB = 位移前最后一根反向 K 线；FVG = 三根 K 线留下的真空', keys: ['订单块', 'OB', 'FVG', '缺口', '公允价值', '位移', '真空', 'CE'], draw: function () {
    var c = candles([[103, 103.4, 102.2, 102.4], [102.4, 102.7, 101.6, 101.8], [101.8, 102.0, 101.0, 101.2], [101.2, 102.6, 101.0, 102.5], [102.5, 105.0, 102.4, 104.8], [104.8, 105.6, 103.9, 105.4], [105.4, 105.8, 104.6, 104.9], [104.9, 105.1, 103.2, 103.6], [103.6, 105.6, 103.4, 105.5]], { x0: 40, step: 42, w: 20, lo: 100.6, hi: 106.2 });
    function y(p) { return 30 + (106.2 - p) / 5.6 * 210; }
    return '<rect x="30" y="' + y(101.8) + '" width="390" height="' + (y(101.2) - y(101.8)) + '" fill="' + BULL + '" opacity=".18"/>' + t(30, y(101.2) + 16, 'OB 订单块（成本区）', BULL, 12, null, 600) +
      '<rect x="160" y="' + y(103.9) + '" width="260" height="' + (y(102.6) - y(103.9)) + '" fill="' + WARN + '" opacity=".16"/>' + t(300, y(103.9) + 16, 'FVG 缺口', WARN, 12, null, 600) +
      '<path d="M160 ' + y(103.25) + 'H420" stroke="' + WARN + '" stroke-dasharray="3 4"/>' + t(380, y(103.25) - 4, 'CE 50%', WARN, 10) + c +
      t(220, 22, '快速位移 → 留下 OB 与 FVG → 回踩再观察', TXT, 12, 'middle');
  } };

  D.premium = { caption: '溢价 / 折价：区间上半贵、下半便宜；OTE 在 62%–79% 回撤', keys: ['溢价', '折价', '均衡', 'OTE', '斐波', '回撤', 'Fib', '50%'], draw: function () {
    return '<rect x="20" y="40" width="400" height="95" fill="' + BEAR + '" opacity=".1"/><rect x="20" y="135" width="400" height="95" fill="' + BULL + '" opacity=".1"/>' +
      '<path d="M20 135H420" stroke="' + WARN + '" stroke-width="1.5"/>' + t(414, 130, '50% 均衡', WARN, 12, 'end', 600) +
      '<rect x="20" y="175" width="400" height="34" fill="' + ACC + '" opacity=".16"/>' + t(414, 200, 'OTE 62%–79%', ACC, 12, 'end', 600) +
      t(30, 64, '溢价区：做多偏贵', BEAR, 12, null, 600) + t(30, 222, '折价区：做多更划算', BULL, 12, null, 600) +
      poly([[40, 228], [130, 44], [200, 120], [250, 192], [300, 120], [390, 30]], TXT, 2) + '<circle cx="250" cy="192" r="5" fill="' + ACC + '"/>';
  } };

  D.footprint = { caption: '足迹图：每个价位上，主动卖 × 主动买 各成交了多少', keys: ['足迹', 'Footprint', 'footprint', '主动买', '主动卖', 'Bid', 'Ask', '失衡'], draw: function () {
    var cols = [[[12, 30], [40, 22], [58, 64], [31, 18], [9, 6]], [[8, 44], [20, 96], [26, 140], [12, 60], [5, 20]], [[60, 20], [88, 30], [40, 12], [14, 8], [6, 2]]];
    var out = '';
    cols.forEach(function (col, ci) {
      var x = 60 + ci * 120;
      col.forEach(function (cell, ri) {
        var y = 40 + ri * 36, imbB = cell[1] >= cell[0] * 3, imbS = cell[0] >= cell[1] * 3;
        out += '<rect x="' + x + '" y="' + y + '" width="100" height="32" rx="3" fill="#0a111b" stroke="' + GRID + '"/>' +
          t(x + 26, y + 21, cell[0], imbS ? BEAR : DIM, 13, 'middle', imbS ? 700 : 400) + t(x + 50, y + 21, '×', DIM, 11, 'middle') + t(x + 74, y + 21, cell[1], imbB ? BULL : DIM, 13, 'middle', imbB ? 700 : 400);
      });
    });
    return out + t(60, 26, '卖 × 买', DIM, 11) + t(220, 250, '绿色粗体 = 买方失衡（≥3 倍）  红色粗体 = 卖方失衡', TXT, 12, 'middle');
  } };

  D.delta = { caption: 'Delta = 主动买 − 主动卖；CVD 是 Delta 的累计曲线', keys: ['Delta', 'delta', 'CVD', '买卖压力', '累计', '净主动'], draw: function () {
    var d = [12, 18, -6, 22, 30, -10, -24, -30, 8, -18, -34, -12];
    var bars = d.map(function (v, i) { var x = 30 + i * 32, y0 = 200; return '<rect x="' + x + '" y="' + (v > 0 ? y0 - v * 1.6 : y0) + '" width="20" height="' + Math.abs(v) * 1.6 + '" fill="' + (v > 0 ? BULL : BEAR) + '" opacity=".85"/>'; }).join('');
    var cum = 0, pts = d.map(function (v, i) { cum += v; return [40 + i * 32, 120 - cum * 1.3]; });
    return '<path d="M20 200H420" stroke="' + DIM + '"/>' + bars + poly(pts, WARN, 2.4) + t(30, 34, 'CVD 累计曲线', WARN, 12, null, 600) + t(30, 256, '柱：每根 K 线的 Delta', TXT, 12) + t(410, 256, '价格新高而 CVD 走低 = 背离', ACC, 12, 'end');
  } };

  D.absorb = { caption: '吸收 / 冰山单：大量主动卖砸不下去，说明有人在接', keys: ['吸收', '冰山', '大单', '被动', '承接'], draw: function () {
    var arrows = ''; for (var i = 0; i < 5; i++) arrows += arrow(60 + i * 60, 60, 80 + i * 60, 160, BEAR);
    return arrows + t(40, 40, '一波波主动卖单（市价卖）', BEAR, 12, null, 600) + '<rect x="30" y="168" width="380" height="34" rx="6" fill="' + BULL + '" opacity=".35"/>' +
      '<rect x="30" y="168" width="380" height="34" rx="6" fill="none" stroke="' + BULL + '"/>' + t(220, 190, '同一价位不断补单的买墙（冰山单）', '#e6fff8', 13, 'middle', 700) +
      t(220, 236, '价格不再下跌 + 成交量很大 = 吸收', TXT, 13, 'middle', 600) + t(220, 256, '吸收完成后，常出现反向推动', DIM, 11, 'middle');
  } };

  D.profile = { caption: '成交量分布：POC 成交最多，VAH–VAL 是 70% 成交的价值区', keys: ['POC', 'VAH', 'VAL', '价值区', '成交量分布', 'Profile', 'profile', 'TPO', '轮廓', '拍卖', '单次打印', '失衡'], draw: function () {
    var v = [8, 14, 22, 34, 52, 70, 92, 120, 104, 84, 60, 40, 26, 16, 10];
    var bars = v.map(function (n, i) { var y = 30 + i * 14, inVa = i >= 4 && i <= 11; return '<rect x="40" y="' + y + '" width="' + n * 2 + '" height="11" fill="' + (i === 7 ? WARN : (inVa ? ACC : DIM)) + '" opacity="' + (inVa ? '.8' : '.45') + '" rx="1.5"/>'; }).join('');
    return '<rect x="30" y="' + (30 + 4 * 14 - 2) + '" width="300" height="' + (8 * 14) + '" fill="' + ACC + '" opacity=".06"/>' + bars +
      t(300, 30 + 4 * 14 + 8, 'VAH 价值区上沿', ACC, 12, null, 600) + t(300, 30 + 7 * 14 + 10, 'POC 成交最多', WARN, 12, null, 700) + t(300, 30 + 11 * 14 + 10, 'VAL 价值区下沿', ACC, 12, null, 600) +
      t(220, 258, '价格在价值区外被拒绝 → 常回到 POC', TXT, 12, 'middle');
  } };

  D.wyckoff = { caption: '威科夫吸筹：停止下跌 → 区间震荡 → Spring 测试 → 走出区间', keys: ['威科夫', 'Wyckoff', 'Spring', 'spring', 'Upthrust', 'UT', 'SC', 'AR', 'ST', 'SOS', 'LPS', '因果', '努力与结果'], draw: function () {
    return '<rect x="90" y="96" width="250" height="100" fill="' + ACC + '" opacity=".07"/><path d="M90 96H340M90 196H340" stroke="' + ACC + '" stroke-dasharray="5 4"/>' +
      poly([[24, 40], [60, 120], [96, 196], [124, 104], [156, 186], [190, 120], [222, 176], [258, 110], [290, 222], [314, 150], [340, 92], [362, 120], [414, 44]], TXT, 2.2) +
      [['SC', 96, 214, BEAR], ['AR', 124, 92, ACC], ['ST', 156, 206, ACC], ['Spring', 290, 242, WARN], ['SOS', 340, 82, BULL], ['LPS', 362, 140, BULL]].map(function (l) { return t(l[1], l[2], l[0], l[3], 12, 'middle', 700); }).join('') +
      t(214, 260, '区间越久 → 后面的“果”越大', DIM, 11, 'middle');
  } };

  D.volume = { caption: '量价配合：上涨放量、回调缩量 = 趋势健康', keys: ['成交量', '量价', '放量', '缩量', '确认'], draw: function () {
    var c = candles([[100, 101.2, 99.8, 101], [101, 102.4, 100.8, 102.2], [102.2, 102.4, 101.5, 101.7], [101.7, 101.9, 101.2, 101.5], [101.5, 103.4, 101.4, 103.2], [103.2, 104.6, 103, 104.4], [104.4, 104.5, 103.6, 103.8], [103.8, 105.6, 103.7, 105.4]], { x0: 50, step: 44, w: 22, lo: 99.4, hi: 106, top: 30, bottom: 160 });
    var vol = [60, 74, 30, 24, 80, 92, 34, 96];
    return c + vol.map(function (v, i) { return '<rect x="' + (50 + i * 44) + '" y="' + (240 - v * 0.7) + '" width="22" height="' + v * 0.7 + '" fill="' + ([2, 3, 6].indexOf(i) !== -1 ? BEAR : BULL) + '" opacity=".55"/>'; }).join('') +
      t(30, 186, '成交量', DIM, 11) + t(410, 186, '回调缩量 = 卖压小', ACC, 12, 'end', 600);
  } };

  D.atr = { caption: 'ATR：最近 N 根 K 线的平均波动幅度，用来定止损距离', keys: ['ATR', '波动', '真实波幅', '量体温', '移动止损', '吊灯'], draw: function () {
    var c = candles([[101, 102, 100.4, 101.6], [101.6, 102.6, 101.2, 102.3], [102.3, 103.4, 101.9, 103.1], [103.1, 103.6, 102.2, 102.6], [102.6, 104, 102.4, 103.8], [103.8, 105, 103.4, 104.7], [104.7, 105.4, 104.1, 105.1]], { x0: 60, step: 48, w: 24, lo: 98.6, hi: 106, top: 30, bottom: 240 });
    function y(p) { return 30 + (106 - p) / 7.4 * 210; }
    return c + poly([[72, y(99.4)], [120, y(99.8)], [168, y(100.6)], [216, y(100.6)], [264, y(101.4)], [312, y(102.4)], [360, y(102.9)]], WARN, 2, '6 4') +
      t(372, y(102.9) + 4, '止损 = 价格 − 2×ATR', WARN, 12) + '<path d="M384 ' + y(105.4) + 'V' + y(104.1) + '" stroke="' + ACC + '" stroke-width="2"/>' + t(392, y(104.6), '1 根的波幅', ACC, 11) +
      t(220, 262, '波动大 → 止损放宽、仓位减小', TXT, 12, 'middle');
  } };

  D.risk = { caption: '先定止损，再算仓位：每笔只亏账户的 1%（= 1R）', keys: ['仓位', 'R 倍数', 'R倍数', '1R', '风险', '止损', '盈亏比', '合约', 'MNQ', 'MGC', '保证金', '能亏多少', '交易计划'], draw: function () {
    return '<rect x="150" y="50" width="200" height="90" fill="' + BULL + '" opacity=".18"/><rect x="150" y="140" width="200" height="45" fill="' + BEAR + '" opacity=".22"/>' +
      '<path d="M150 140H350" stroke="' + TXT + '" stroke-width="2"/><path d="M150 50H350" stroke="' + BULL + '" stroke-dasharray="5 4"/><path d="M150 185H350" stroke="' + BEAR + '" stroke-dasharray="5 4"/>' +
      t(360, 54, '目标  +2R', BULL, 13, null, 700) + t(360, 144, '入场', TXT, 13, null, 700) + t(360, 189, '止损  −1R', BEAR, 13, null, 700) +
      t(30, 96, '赚 2 份', BULL, 13, null, 600) + t(30, 168, '亏 1 份', BEAR, 13, null, 600) +
      t(220, 222, '仓位 = 账户 × 1% ÷ 止损距离', WARN, 14, 'middle', 700) + t(220, 250, '胜率 40% 也能赚钱：0.4×2 − 0.6×1 = +0.2R', DIM, 12, 'middle');
  } };

  D.equity = { caption: '期望值为正 + 控制回撤 = 长期能活下来', keys: ['期望值', '回撤', '心理', '连续亏损', '复利', '资金曲线', '生存'], draw: function () {
    return poly([[30, 200], [70, 186], [100, 196], [130, 168], [160, 176], [190, 146], [220, 160], [250, 182], [280, 170], [310, 130], [340, 120], [370, 96], [410, 72]], BULL, 2.6) +
      '<rect x="190" y="146" width="60" height="36" fill="' + BEAR + '" opacity=".16"/>' + t(220, 204, '回撤', BEAR, 12, 'middle', 700) +
      poly([[30, 200], [80, 150], [120, 110], [160, 210], [200, 236]], BEAR, 2, '5 4') + t(150, 98, '重仓：先暴涨，再爆仓', BEAR, 12, null, 600) +
      t(410, 60, '小风险 · 稳定曲线', BULL, 12, 'end', 600);
  } };

  D.journal = { caption: '每一笔都写下来：理由、位置、风险、结果、改进', keys: ['日志', '复盘', '记录', '清单', 'SOP', '训练', '常见错误', '计划'], draw: function () {
    var rows = ['入场理由：位置 + 证据', '止损放在哪、为什么', '风险金额 = 1R', '结果：+1.8R / −1R', '下次改进一件事'];
    return '<rect x="110" y="24" width="220" height="226" rx="12" fill="#0a111b" stroke="' + ACC + '" stroke-opacity=".5"/><rect x="180" y="16" width="80" height="18" rx="6" fill="' + ACC + '" opacity=".5"/>' +
      rows.map(function (r, i) { var y = 70 + i * 36; return '<rect x="130" y="' + (y - 13) + '" width="16" height="16" rx="3" fill="none" stroke="' + BULL + '"/>' + '<path d="M133 ' + (y - 5) + 'l4 4l7 -8" stroke="' + BULL + '" stroke-width="2" fill="none"/>' + t(156, y, r, TXT, 12); }).join('');
  } };

  var ORDER = ['orderbook', 'footprint', 'delta', 'absorb', 'profile', 'wyckoff', 'obfvg', 'premium', 'sweep', 'structure', 'phases', 'mtf', 'pinbar', 'engulf', 'candle', 'sr', 'volume', 'atr', 'risk', 'equity', 'journal'];

  function score(def, hay, weight) {
    var s = 0;
    def.keys.forEach(function (k) { if (hay.indexOf(k) !== -1) s += weight * (k.length >= 3 ? 1.2 : 1); });
    return s;
  }

  function pick(slide, lesson) {
    var title = String(slide.title || ''), body = String(slide.text || '') + ' ' + (slide.bullets || []).join(' '), lt = String((lesson && lesson.title) || '');
    var best = null, bestScore = 0;
    ORDER.forEach(function (id) {
      var def = D[id], s = score(def, title, 3) + score(def, body, 1) + score(def, lt, 1.5);
      if (s > bestScore) { bestScore = s; best = id; }
    });
    if (!best || bestScore < 1.5) return null;
    return { id: best, html: render(best), caption: D[best].caption };
  }

  function render(id) {
    var def = D[id];
    if (!def) return '';
    try { return svg(def.draw(), def.caption); } catch (err) { return ''; }
  }

  LQ.slideVisuals = { pick: pick, render: render, ids: ORDER.slice() };
})(typeof window !== 'undefined' ? window : globalThis);
