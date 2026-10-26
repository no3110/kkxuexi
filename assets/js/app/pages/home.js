/* 首页（site-engineer 维护） */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };
  var ui = function () { return LQ.ui; };

  function stageState(kind, data) {
    var progress;
    if (kind === 'foundation') {
      progress = LQ.site.foundationProgress();
    } else {
      progress = LQ.site.moduleProgress(data.id);
    }
    if (progress.total && progress.done >= progress.total) {
      return { state: 'is-done', label: '已完成', progress: progress };
    }
    if (progress.done > 0) {
      return { state: 'is-progress', label: '进行中 ' + progress.done + '/' + progress.total, progress: progress };
    }
    return { state: '', label: '未开始', progress: progress };
  }

  function stageRowsHTML() {
    var rows = '';
    var stages = LQ.site.stages();
    stages.forEach(function (stage) {
      var isFoundation = stage.kind === 'foundation';
      var mod = stage.data;
      var iconName = isFoundation ? 'layers' : LQ.ui.moduleIcon(mod.icon);
      var modId = isFoundation ? 'm00' : mod.id;
      var title = isFoundation ? mod.title : mod.title;
      var sub = isFoundation
        ? ('阶段 0 · ' + mod.items.length + ' 项自查 · 约 ' + LQ.site.formatMinutes(mod.minutes))
        : ('阶段 ' + stage.num + ' · ' + LQ.site.moduleLessons(mod.id).length + ' 课 · 约 ' + LQ.site.formatMinutes(mod.minutes));
      var state = stageState(stage.kind, mod);
      var href = isFoundation ? '#/roadmap' : '#/module/' + encodeURIComponent(mod.id);
      rows += '<a class="overview-item ' + LQ.ui.moduleClass(modId) + '" href="' + esc(href) + '">' +
        '<span class="overview-num">' + (isFoundation ? '0' : esc(String(stage.num))) + '</span>' +
        '<span class="overview-main">' +
        '<span class="overview-title">' + esc(title) + '</span>' +
        '<span class="overview-sub">' + esc(sub) + '</span>' +
        '</span>' +
        '<span class="overview-state ' + state.state + '">' + esc(state.label) + '</span>' +
        '</a>';
    });
    return rows;
  }

  function progressCardHTML() {
    var sum = LQ.site.summary();
    var plan = LQ.site.planSummary();
    var daily = LQ.site.dailySummary();
    var last = LQ.site.lastLesson();
    var lastLesson = last ? LQ.site.lesson(last) : null;
    var resetBlock = '<button type="button" class="btn btn-ghost btn-sm" data-action="reset-progress">' + LQ.ui.icon('reset') + '重置学习进度</button>';
    return '<section class="panel" data-home-progress>' +
      '<div class="panel-title">' + LQ.ui.icon('chart') + '学习进度</div>' +
      '<div class="progress-card-head">' +
      LQ.ui.ringHTML(sum.pct, { className: 'ring-bull', label: '已完成 ' + sum.done + ' / ' + sum.total + ' 课' }) +
      '<div class="progress-card-info"><b>' + sum.done + ' / ' + sum.total + ' 课</b>' +
      '<span>' + esc(sum.pct === 100 ? '全部课程已完成，去复盘吧。' : '按自己的节奏推进，不急。') + '</span></div>' +
      '</div>' +
      LQ.ui.barHTML(sum.pct) +
      '<div class="mini-stats">' +
      '<div class="mini-stat"><span>计划任务</span><b>' + plan.done + ' / ' + plan.total + '</b></div>' +
      '<div class="mini-stat"><span>今日训练</span><b>' + daily.done + ' / ' + daily.total + '</b></div>' +
      '<div class="mini-stat"><span>上次学习</span><b>' + esc(lastLesson ? lastLesson.id : '—') + '</b></div>' +
      '</div>' +
      '<div class="flex gap-8 mt-16 flex-wrap">' +
      '<a class="btn btn-outline btn-sm grow" href="#/plan">' + LQ.ui.icon('calendar') + '学习计划</a>' +
      resetBlock +
      '</div>' +
      '</section>';
  }

  function heroHTML() {
    var sum = LQ.site.summary();
    var stats = LQ.site.stats();
    var first = LQ.site.firstLesson();
    var lastId = LQ.site.lastLesson();
    var lastLesson = lastId ? LQ.site.lesson(lastId) : null;
    var target = lastLesson || LQ.site.firstUnfinishedLesson() || first;
    var targetModule = target ? LQ.site.module(target.moduleId) : null;
    var primaryLabel = lastLesson
      ? '继续学习' + (targetModule ? ' · ' + targetModule.title : '')
      : (sum.done > 0 ? '继续学习' : '从第一课开始');
    var primaryHref = target ? '#/lesson/' + encodeURIComponent(target.id) : '#/roadmap';

    var planWeeks = LQ.site.planWeeks();
    return '<section class="home-hero">' +
      '<div class="hero-badges">' +
      LQ.ui.badge('离线可用 · 零依赖', 'bull', 'lock') +
      LQ.ui.badge(stats.lessonCount + ' 课 · ' + stats.moduleCount + ' 大模块 + 地基', 'brand', 'book') +
      LQ.ui.badge(planWeeks + ' 周学习计划', 'info', 'calendar') +
      LQ.ui.badge('模拟图 + 真实 NQ/GC 案例', 'warn', 'chart') +
      '</div>' +
      '<h1 class="hero-title">从 0 到实战，把<span class="hl">订单流与价格行为</span>学成一个系统</h1>' +
      '<p class="hero-lead">' + esc('不是零散的名词堆砌：' + planWeeks + ' 周时间，从市场语言与道氏理论起步，经价格行为、ICT/SMC、订单流、拍卖理论、威科夫，收敛成一套带风控的交易 SOP，最后在真实 NQ/GC 行情上实战考核。每节课配可交互 K 线、分步标注讲解与自测题。') + '</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-primary btn-lg" href="' + esc(primaryHref) + '">' + LQ.ui.icon('play') + esc(primaryLabel) + '</a>' +
      '<a class="btn btn-outline btn-lg" href="#/roadmap">' + LQ.ui.icon('route') + '查看学习路线</a>' +
      '<a class="btn btn-ghost" href="#/exam">' + LQ.ui.icon('target') + '实战考核</a>' +
      '</div>' +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><b>' + stats.lessonCount + '<span class="unit">课</span></b><span>' + esc(stats.moduleCount + ' 大模块 + 地基自查') + '</span></div>' +
      '<div class="hero-stat"><b>' + stats.hours + '<span class="unit">小时</span></b><span>课程总时长（不含练习）</span></div>' +
      '<div class="hero-stat"><b>' + planWeeks + '<span class="unit">周</span></b><span>推荐学习节奏</span></div>' +
      '<div class="hero-stat"><b>' + sum.done + '<span class="unit">/' + sum.total + '</span></b><span>当前已完成课程</span></div>' +
      '</div>' +
      '</section>';
  }

  function continueHTML() {
    var lastId = LQ.site.lastLesson();
    var last = lastId ? LQ.site.lesson(lastId) : null;
    var target = last || LQ.site.firstUnfinishedLesson() || LQ.site.firstLesson();
    if (!target) return '';
    var mod = LQ.site.module(target.moduleId);
    var isResume = !!last;
    var progress = mod ? LQ.site.moduleProgress(mod.id) : { done: 0, total: 0 };
    return '<div class="continue-card ' + LQ.ui.moduleClass(target.moduleId) + '">' +
      '<div class="continue-icon">' + LQ.ui.icon(isResume ? 'play' : 'compass') + '</div>' +
      '<div class="continue-main">' +
      '<div class="continue-label">' + esc(isResume ? '继续上次学习' : (LQ.site.summary().done > 0 ? '继续学习' : '建议从这里开始')) + '</div>' +
      '<div class="continue-title">' + esc(target.title) + '</div>' +
      '<div class="continue-sub">' + esc((mod ? mod.title : '') + ' · ' + (target.id || '') + ' · 约 ' + LQ.site.formatMinutes(target.minutes || 15) + (progress.total ? ' · 本模块已完成 ' + progress.done + '/' + progress.total : '')) + '</div>' +
      '</div>' +
      '<a class="btn btn-primary" href="#/lesson/' + encodeURIComponent(target.id) + '">' + LQ.ui.icon('arrow-right') + esc(isResume ? '继续' : '开始') + '</a>' +
      '</div>';
  }

  function methodHTML() {
    var items = [
      ['trend', '先框架后细节', '先搞清楚趋势、结构、位置，再学具体的形态与信号。顺序反了，学得越多越乱。'],
      ['chart', '每张图都要动手', '课程里的图都能缩放、平移。跟着步骤点一遍，比看十遍文字有用。'],
      ['check-circle', '自测错了就回看', '每课最后的自测不是形式。错题对应的段落重新读一遍再往下走。'],
      ['shield', '风险规则先写死', '单笔风险、每日上限、止损失效条件，先写下来，再谈信号。']
    ];
    var html = '<section class="panel"><div class="panel-title">' + LQ.ui.icon('bulb') + '怎么学更有效</div><ul class="method-list">';
    items.forEach(function (item) {
      html += '<li>' + LQ.ui.icon(item[0]) + '<span><b>' + esc(item[1]) + '</b> ' + esc(item[2]) + '</span></li>';
    });
    html += '</ul></section>';
    return html;
  }

  function riskHTML() {
    return '<section class="panel risk-card">' +
      '<div class="panel-title">' + LQ.ui.icon('warn') + '先读这一条</div>' +
      '<p class="text-sm muted mb-8">' + esc('本站模拟图表（K 线、订单流面板、标注）均由固定随机种子生成，不是真实行情；真实案例页使用真实历史 OHLCV（来源见该页数据集卡片），但 Delta / 足迹 / 订单流内部数据是教学估算，不是真实逐笔数据。') + '</p>' +
      '<p class="text-sm muted mb-0">' + esc('道氏、PA、ICT/SMC、订单流、拍卖理论、威科夫都是解读市场的框架，各有适用条件与失效场景，也存在争议。请用模拟盘验证，并对每一笔交易设定最大可承受亏损。') + '</p>' +
      '</section>';
  }

  /* 实战考核 / 真实案例快捷入口 */
  function practiceHTML() {
    var stats = LQ.site.stats();
    var chartQuestions = LQ.site.chartExamQuestions().length;
    return '<section class="panel">' +
      '<div class="panel-title">' + LQ.ui.icon('target') + '检验一下学得怎么样</div>' +
      '<div class="home-practice">' +
      '<a class="home-practice-card" href="#/exam">' +
      '<span class="home-practice-icon">' + LQ.ui.icon('target') + '</span>' +
      '<span class="home-practice-main"><b>实战考核</b><span>' + esc('综合测验（18 题 / 15 分钟）+ 图表判读（' + (chartQuestions || '待加载') + ' 题）+ 成绩与错题') + '</span></span>' +
      LQ.ui.icon('chevron-right') +
      '</a>' +
      '<a class="home-practice-card" href="#/real">' +
      '<span class="home-practice-icon">' + LQ.ui.icon('chart') + '</span>' +
      '<span class="home-practice-main"><b>真实案例库</b><span>' + esc('NQ / GC 真实历史行情：' + (LQ.site.datasets().length || '待加载') + ' 个数据集，Delta/足迹为教学估算') + '</span></span>' +
      LQ.ui.icon('chevron-right') +
      '</a>' +
      '</div>' +
      '</section>';
  }

  function updateDynamic(page) {
    var progressSlot = page.querySelector('[data-home-progress]');
    if (progressSlot) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = progressCardHTML();
      progressSlot.parentNode.replaceChild(wrapper.firstChild, progressSlot);
    }
    var continueSlot = page.querySelector('[data-home-continue]');
    if (continueSlot) {
      var wrap2 = document.createElement('div');
      wrap2.innerHTML = continueHTML();
      if (wrap2.firstChild) continueSlot.parentNode.replaceChild(wrap2.firstChild, continueSlot);
    }
    var rowsSlot = page.querySelector('[data-home-stages]');
    if (rowsSlot) rowsSlot.innerHTML = stageRowsHTML();
    var heroSlot = page.querySelector('[data-home-hero]');
    if (heroSlot) {
      var wrap3 = document.createElement('div');
      wrap3.innerHTML = heroHTML();
      if (wrap3.firstChild) heroSlot.parentNode.replaceChild(wrap3.firstChild, heroSlot);
    }
    if (LQ.ui.paintBars) LQ.ui.paintBars(page);
    bindPage(page);
  }

  function bindPage(page) {
    var resetBtn = page.querySelector('[data-action="reset-progress"]');
    if (resetBtn && !resetBtn.__lqBound) {
      resetBtn.__lqBound = true;
      resetBtn.addEventListener('click', function () {
        LQ.ui.confirmThen(resetBtn, function () {
          try {
            LQ.store.progress.reset();
            LQ.ui.toast('已重置学习进度（课程完成、自测与计划勾选）');
          } catch (err) {
            LQ.ui.toast('重置失败：' + (err && err.message ? err.message : err), 'bad');
          }
        });
      });
    }
  }

  LQ.pages.home = {
    title: '首页',
    render: function (ctx) {
      var page = document.createElement('div');
      page.className = 'page home-page';
      var stats = LQ.site.stats();
      page.innerHTML = heroHTML() +
        continueHTML() +
        '<div class="home-grid">' +
        '<div class="home-col">' +
        '<section class="panel">' +
        '<div class="section-head"><h2>学习路线总览</h2><a href="#/roadmap">完整路线图' + LQ.ui.icon('arrow-right') + '</a></div>' +
        '<p class="section-sub">' + esc('阶段 0 是地基（6 项自查），之后 ' + stats.moduleCount + ' 个模块对应 ' + stats.moduleCount + ' 个阶段。每一阶段都有明确的关卡和产出。') + '</p>' +
        '<div class="overview-list" data-home-stages>' + stageRowsHTML() + '</div>' +
        '</section>' +
        practiceHTML() +
        '</div>' +
        '<div class="home-col">' +
        progressCardHTML() +
        methodHTML() +
        riskHTML() +
        '</div>' +
        '</div>';
      // 用 data 钩子承载动态区域，刷新时局部替换
      var heroNode = page.querySelector('.home-hero');
      if (heroNode) heroNode.setAttribute('data-home-hero', '');
      var continueNode = page.querySelector('.continue-card');
      if (continueNode) continueNode.setAttribute('data-home-continue', '');
      bindPage(page);
      LQ.router.addRefresh(function () { updateDynamic(page); });
      // 移动端底部快捷栏「进度」入口：#/?focus=progress
      if (ctx && ctx.query && ctx.query.focus === 'progress') {
        setTimeout(function () {
          var target = page.querySelector('[data-home-progress]');
          if (target && target.scrollIntoView) {
            try { target.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (err) { /* ignore */ }
          }
        }, 60);
      }
      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
