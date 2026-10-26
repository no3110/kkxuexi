/* 学习路线图（site-engineer 维护）：阶段 0 地基 + 9 个模块阶段（V2） */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function lessonChipHTML(lesson) {
    var done = LQ.site.isLessonDone(lesson.id);
    var real = LQ.site.lesson(lesson.id) || lesson;
    return '<a class="stage-lesson' + (done ? ' is-done' : '') + '" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' +
      LQ.ui.icon(done ? 'check-circle' : 'circle', 'lesson-check') +
      '<span class="stage-lesson-title">' + esc(real.title) + '</span>' +
      '<span class="lesson-mins">' + esc(String(real.minutes || 12)) + '′</span>' +
      '</a>';
  }

  function foundationCardHTML() {
    var data = LQ.catalog.foundation;
    var progress = LQ.site.foundationProgress();
    var itemsHTML = '';
    data.items.forEach(function (item) {
      var done = false;
      try { done = LQ.store.progress.isPlanTaskDone(item.id); } catch (err) { done = false; }
      itemsHTML += '<label class="foundation-task' + (done ? ' is-done' : '') + '" data-fx="' + esc(item.id) + '">' +
        '<input type="checkbox" data-foundation-id="' + esc(item.id) + '"' + (done ? ' checked' : '') + '>' +
        '<span class="foundation-text"><b>' + esc(item.title) + '</b>' + esc(item.text) + '</span>' +
        '</label>';
    });
    var refLinks = '';
    data.items.forEach(function (item) {
      (item.refs || []).forEach(function (lessonId) {
        var lesson = LQ.site.lesson(lessonId);
        if (!lesson) return;
        if (refLinks.indexOf(lessonId) !== -1) return;
        refLinks += '<a class="plan-task-link" href="#/lesson/' + encodeURIComponent(lessonId) + '">' + LQ.ui.icon('book') + esc(lesson.title) + '</a>';
      });
    });

    return '<article class="stage-card mod-m00" id="stage-0">' +
      '<div class="stage-head">' +
      '<div class="stage-num">0<small>地基</small></div>' +
      '<div class="stage-title-wrap">' +
      '<div class="stage-eyebrow">' + esc(data.eyebrow) + '</div>' +
      '<h2 class="stage-title">' + esc(data.title) + '</h2>' +
      '<p class="stage-tagline">' + esc(data.tagline) + '</p>' +
      '</div>' +
      '<div class="stage-side">' +
      '<span class="badge badge-muted">' + esc(LQ.site.formatMinutes(data.minutes)) + '</span>' +
      '<span class="badge badge-info" data-foundation-state>' + progress.done + '/' + progress.total + ' 项</span>' +
      '</div>' +
      '</div>' +
      '<div class="stage-body">' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('target') + '阶段目标</div>' +
      '<p class="stage-goal">' + esc(data.goal) + '</p></div>' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('check-circle') + '地基自查清单（勾选后会保存）</div>' +
      '<div class="stage-foundation-grid" data-foundation-list>' + itemsHTML + '</div>' +
      (refLinks ? '<div class="plan-task-links mt-16"><span class="text-xs dim">' + esc('相关课程：') + '</span>' + refLinks + '</div>' : '') +
      '</div>' +
      '<div data-foundation-progress>' + LQ.ui.barHTML(progress.pct) +
      '<div class="progress-meta"><span>地基完成度</span><b>' + progress.done + ' / ' + progress.total + '</b></div></div>' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('compass') + '关卡（过了再进模块 1）</div>' +
      '<p class="stage-goal">' + esc(data.checkpoint) + '</p>' +
      '<p class="stage-goal mt-8"><span class="badge badge-bull">产出</span> ' + esc(data.deliverable) + '</p></div>' +
      '<div class="stage-foot">' +
      '<div class="flex gap-8 flex-wrap"><a class="btn btn-outline btn-sm" href="#/plan">' + LQ.ui.icon('calendar') + '第 1 周计划</a>' +
      '<a class="btn btn-ghost btn-sm" href="#/module/m01">' + LQ.ui.icon('arrow-right') + '进入模块 1</a></div>' +
      '</div>' +
      '</div></article>';
  }

  function moduleCardHTML(mod) {
    var lessons = LQ.site.moduleLessons(mod.id);
    var progress = LQ.site.moduleProgress(mod.id);
    var cp = LQ.catalog.moduleCheckpoints[mod.id] || {};
    var courseMeta = LQ.site.module(mod.id) || mod;
    var lessonsHTML = lessons.map(lessonChipHTML).join('');
    var finished = progress.total > 0 && progress.done >= progress.total;
    var firstUnfinished = null;
    for (var i = 0; i < lessons.length; i++) {
      if (!LQ.site.isLessonDone(lessons[i].id)) { firstUnfinished = lessons[i]; break; }
    }
    var ctaLabel = finished ? '复习模块' : (progress.done > 0 ? '继续第 ' + (progress.done + 1) + ' 课' : '开始模块');
    var ctaHref = finished || !firstUnfinished
      ? '#/module/' + encodeURIComponent(mod.id)
      : (finished ? '#/module/' + encodeURIComponent(mod.id) : '#/lesson/' + encodeURIComponent(firstUnfinished.id));
    var stateBadge = finished
      ? '<span class="badge badge-bull">' + LQ.ui.icon('check') + '已完成</span>'
      : (progress.done > 0 ? '<span class="badge badge-brand">进行中</span>' : '<span class="badge badge-muted">未开始</span>');

    return '<article class="stage-card ' + LQ.ui.moduleClass(mod.id) + '" id="stage-' + esc(mod.id) + '">' +
      '<div class="stage-head">' +
      '<div class="stage-num">' + esc(String(LQ.site.stageNumber(mod))) + '<small>阶段</small></div>' +
      '<div class="stage-title-wrap">' +
      '<div class="stage-eyebrow">' + esc(mod.stageName || ('阶段 ' + LQ.site.stageNumber(mod))) + ' · ' + esc(mod.en || '') + '</div>' +
      '<h2 class="stage-title">' + esc(mod.title) + '</h2>' +
      '<p class="stage-tagline">' + esc(mod.tagline || mod.summary || '') + '</p>' +
      '</div>' +
      '<div class="stage-side">' +
      stateBadge +
      '<span class="badge badge-muted">' + esc(mod.level || '') + ' · ' + esc(LQ.site.formatMinutes(mod.minutes)) + '</span>' +
      '<div class="stage-progress">' + LQ.ui.barHTML(progress.pct) +
      '<div class="progress-meta"><span>进度</span><b>' + progress.done + '/' + progress.total + '</b></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="stage-body">' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('target') + '阶段目标</div>' +
      '<p class="stage-goal">' + esc(courseMeta.summary || '') + '</p></div>' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('list') + '课程清单（' + lessons.length + ' 课）</div>' +
      '<div class="stage-lessons">' + lessonsHTML + '</div></div>' +
      '<div><div class="stage-section-title">' + LQ.ui.icon('compass') + '关卡</div>' +
      '<p class="stage-goal">' + esc(cp.checkpoint || '') + '</p>' +
      (cp.deliverable ? '<p class="stage-goal mt-8"><span class="badge badge-info">产出</span> ' + esc(cp.deliverable) + '</p>' : '') +
      '</div>' +
      '<div class="stage-foot">' +
      '<div class="flex gap-8 flex-wrap">' +
      '<a class="btn btn-primary btn-sm" href="' + esc(ctaHref) + '">' + LQ.ui.icon('play') + esc(ctaLabel) + '</a>' +
      '<a class="btn btn-ghost btn-sm" href="#/module/' + encodeURIComponent(mod.id) + '">模块详情' + LQ.ui.icon('arrow-right') + '</a>' +
      '</div>' +
      '<span class="text-xs dim">' + esc('第 ' + (LQ.site.stageNumber(mod)) + ' / ' + LQ.site.stats().moduleCount + ' 阶段') + '</span>' +
      '</div>' +
      '</div></article>';
  }

  function listHTML() {
    var html = foundationCardHTML();
    LQ.site.modules().forEach(function (mod) { html += moduleCardHTML(mod); });
    return html;
  }

  function syncFoundation(page) {
    var data = LQ.catalog.foundation;
    var progress = LQ.site.foundationProgress();
    var list = page.querySelector('[data-foundation-list]');
    if (list) {
      Array.prototype.forEach.call(list.querySelectorAll('[data-fx]'), function (label) {
        var id = label.getAttribute('data-fx');
        var done = false;
        try { done = LQ.store.progress.isPlanTaskDone(id); } catch (err) { done = false; }
        var input = label.querySelector('input');
        if (input) input.checked = done;
        label.classList.toggle('is-done', done);
      });
    }
    var state = page.querySelector('[data-foundation-state]');
    if (state) state.textContent = progress.done + '/' + progress.total + ' 项';
    var progressSlot = page.querySelector('[data-foundation-progress]');
    if (progressSlot) {
      progressSlot.innerHTML = LQ.ui.barHTML(progress.pct) +
        '<div class="progress-meta"><span>地基完成度</span><b>' + progress.done + ' / ' + progress.total + '</b></div>';
    }
    if (LQ.ui.paintBars) LQ.ui.paintBars(page);
    void data;
  }

  function bind(page) {
    page.addEventListener('change', function (event) {
      var input = event.target;
      if (!input || !input.getAttribute) return;
      var id = input.getAttribute('data-foundation-id');
      if (!id) return;
      try {
        LQ.store.progress.setPlanTask(id, !!input.checked);
      } catch (err) {
        LQ.ui.toast('保存失败：' + (err && err.message ? err.message : err), 'bad');
      }
      syncFoundation(page);
    });
  }

  LQ.pages.roadmap = {
    title: '学习路线图',
    render: function () {
      var page = document.createElement('div');
      page.className = 'page roadmap-page';
      var sum = LQ.site.summary();
      var stats = LQ.site.stats();
      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('学习路线图') + '</div>' +
        '<h1 class="page-title">' + esc('从地基到实战：' + (stats.moduleCount + 1) + ' 个阶段') + '</h1>' +
        '<p class="page-lead">' + esc('先花一周把地基打下（阶段 0），再按 ' + stats.moduleCount + ' 个模块依次推进。每个阶段都给出目标、课程清单、关卡与产出——学完不是"看完"，而是能独立完成那张图、那份计划。') + '</p>' +
        '</div>' +
        '<div class="roadmap-intro">' +
        '<div class="panel">' +
        '<div class="panel-title">' + LQ.ui.icon('route') + '怎么用这张路线图</div>' +
        '<p class="text-sm muted mb-8">' + esc('顺序不是死的：如果你已经有价格行为基础，可以跳过部分课程，但阶段 0 的地基与风控阶段不要跳。每完成一课，回到这里看进度；每个阶段的"关卡"是自检清单，过不了就回看对应课程。') + '</p>' +
        '<p class="text-sm muted mb-0">' + esc('全站 ' + stats.lessonCount + ' 课，课程本身约 ' + stats.hours + ' 小时（' + stats.minutes + ' 分钟）；加上标注练习与复盘，推荐用 ' + LQ.site.planWeeks() + ' 周完成（见学习计划页）。') + '</p>' +
        '</div>' +
        '<div class="panel">' +
        '<div class="panel-title">' + LQ.ui.icon('chart') + '当前总进度</div>' +
        '<div class="flex items-center gap-16">' +
        LQ.ui.ringHTML(sum.pct, { className: 'ring-bull', label: '总进度 ' + sum.pct + '%' }) +
        '<div class="progress-card-info"><b>' + sum.done + ' / ' + sum.total + ' 课</b><span>' + esc('平均每课 12-15 分钟') + '</span></div>' +
        '</div>' +
        '<div class="roadmap-legend mt-16">' +
        '<div class="legend-row"><span class="legend-dot is-done"></span>已完成（课程或地基自查）</div>' +
        '<div class="legend-row"><span class="legend-dot is-progress"></span>进行中</div>' +
        '<div class="legend-row"><span class="legend-dot is-todo"></span>未开始</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="stage-list" data-roadmap-list>' + listHTML() + '</div>' +
        '<div class="mt-24 flex gap-8 flex-wrap">' +
        '<a class="btn btn-primary" href="#/plan">' + LQ.ui.icon('calendar') + esc('看 ' + LQ.site.planWeeks() + ' 周学习计划') + '</a>' +
        '<a class="btn btn-outline" href="#/lesson/m01-01">' + LQ.ui.icon('play') + '从第一课开始</a>' +
        '<a class="btn btn-ghost" href="#/exam">' + LQ.ui.icon('target') + '实战考核</a>' +
        '</div>';

      bind(page);
      LQ.router.addRefresh(function () { syncFoundation(page); });
      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
