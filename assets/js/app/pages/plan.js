/* 学习计划页（site-engineer 维护）：V2 10 周计划 + 每日训练清单 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function lessonLinksHTML(ids, withExam) {
    if ((!ids || !ids.length) && !withExam) return '';
    var html = '<span class="plan-task-links">';
    (ids || []).forEach(function (id) {
      var lesson = LQ.site.lesson(id);
      if (!lesson) return;
      html += '<a class="plan-task-link" href="#/lesson/' + encodeURIComponent(id) + '">' + LQ.ui.icon('book') + esc(lesson.title) + '</a>';
    });
    if (withExam) {
      html += '<a class="plan-task-link plan-task-exam" href="#/exam">' + LQ.ui.icon('target') + '去实战考核</a>';
    }
    return html + '</span>';
  }

  function weekProgress(week) {
    var done = 0;
    week.tasks.forEach(function (task) {
      try { if (LQ.store.progress.isPlanTaskDone(task.key)) done++; } catch (err) { /* ignore */ }
    });
    return { done: done, total: week.tasks.length };
  }

  function taskRowHTML(week, task) {
    var done = false;
    try { done = LQ.store.progress.isPlanTaskDone(task.key); } catch (err) { done = false; }
    return '<label class="plan-task' + (done ? ' is-done' : '') + '" data-plan-row="' + esc(task.key) + '">' +
      '<input type="checkbox" data-plan-key="' + esc(task.key) + '" data-week="' + esc(week.id) + '"' + (done ? ' checked' : '') + '>' +
      '<span class="plan-task-main">' +
      '<span class="plan-task-text">' + esc(task.text) + '</span>' +
      lessonLinksHTML(task.lessons, !!task.exam) +
      '</span>' +
      '<span class="plan-task-mins">' + esc(String(task.minutes || 0)) + '′</span>' +
      '</label>';
  }

  function weekCardHTML(week) {
    var progress = weekProgress(week);
    var tasksHTML = week.tasks.map(function (task) { return taskRowHTML(week, task); }).join('');
    var lessonCount = 0;
    week.tasks.forEach(function (task) { lessonCount += (task.lessons || []).length; });
    return '<article class="week-card" data-week-card="' + esc(week.id) + '" data-week-total="' + week.tasks.length + '">' +
      '<div class="week-head">' +
      '<div class="week-badge"><b>W' + esc(String(week.week)) + '</b><span>周</span></div>' +
      '<div class="week-title-wrap">' +
      '<div class="week-stage">' + esc(week.stage) + '</div>' +
      '<h2 class="week-title">' + esc(week.theme) + '</h2>' +
      '<p class="week-goal">' + esc(week.goal) + '</p>' +
      '</div>' +
      '<div class="week-side">' +
      '<span class="badge badge-muted">' + esc(LQ.site.formatMinutes(week.minutes)) + '</span>' +
      '<span class="badge badge-info">' + progress.done + '/' + progress.total + ' 项</span>' +
      '</div>' +
      '</div>' +
      '<div class="week-body">' +
      '<div class="week-tasks">' + tasksHTML + '</div>' +
      '<div class="week-foot">' +
      '<span>' + LQ.ui.icon('compass') + esc('关卡：') + esc(week.checkpoint) + '</span>' +
      '<span class="text-xs dim" data-week-count>' + esc('本周：' + progress.done + ' / ' + progress.total + ' 项 · 关联 ' + lessonCount + ' 课') + '</span>' +
      '</div>' +
      '</div>' +
      '</article>';
  }

  function dailyCardHTML() {
    var date = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var dateLabel = date.getFullYear() + ' 年 ' + (date.getMonth() + 1) + ' 月 ' + date.getDate() + ' 日 · 周' + '日一二三四五六'.charAt(date.getDay());
    var summary = LQ.site.dailySummary(date);
    var itemsHTML = LQ.catalog.daily.map(function (item) {
      var key = LQ.site.dailyKey(item.id, date);
      var done = false;
      try { done = LQ.store.progress.isPlanTaskDone(key); } catch (err) { done = false; }
      var refs = '';
      (item.refs || []).forEach(function (lessonId) {
        var lesson = LQ.site.lesson(lessonId);
        if (!lesson) return;
        refs += '<a class="plan-task-link" href="#/lesson/' + encodeURIComponent(lessonId) + '">' + LQ.ui.icon('book') + esc(lesson.title) + '</a>';
      });
      return '<label class="daily-item' + (done ? ' is-done' : '') + '" data-daily-row="' + esc(item.id) + '">' +
        '<input type="checkbox" data-daily-key="' + esc(key) + '" data-daily-id="' + esc(item.id) + '"' + (done ? ' checked' : '') + '>' +
        '<span class="daily-main"><b>' + esc(item.title) + '</b>' + esc(item.text) +
        (refs ? '<span class="plan-task-links">' + refs + '</span>' : '') +
        '</span>' +
        '</label>';
    }).join('');

    return '<section class="daily-card" data-daily-card>' +
      '<div class="daily-head">' +
      '<h2 class="flex items-center gap-8">' + LQ.ui.icon('clock') + esc('每日训练清单') + '</h2>' +
      '<span class="daily-date" data-daily-date>' + esc(dateLabel) + '</span>' +
      '</div>' +
      '<p class="text-sm muted mb-16">' + esc('每天 20-40 分钟，不预测行情，只训练"看见结构 → 写下规则 → 记录结果"的习惯。勾选按日期保存，第二天自动重置。') + '</p>' +
      '<div class="daily-list">' + itemsHTML + '</div>' +
      '<div class="daily-actions">' +
      '<span class="daily-count" data-daily-count>' + esc('今日完成：' + summary.done + ' / ' + summary.total) + '</span>' +
      '</div>' +
      '</section>';
  }

  function summaryHTML() {
    var plan = LQ.site.planSummary();
    var stats = LQ.site.stats();
    var daily = LQ.site.dailySummary();
    return '<div class="plan-summary">' +
      '<div class="plan-summary-main">' +
      '<div class="flex items-baseline justify-between gap-12 flex-wrap">' +
      '<div><div class="text-xs dim">' + esc('计划总进度') + '</div>' +
      '<b class="mono" data-plan-summary-text>' + plan.done + ' / ' + plan.total + ' 项任务 · ' + plan.pct + '%</b></div>' +
      '<span class="badge badge-brand">' + esc(LQ.site.planWeeks() + ' 周 · 每周 4-6 项') + '</span>' +
      '</div>' +
      '<div class="mt-16" data-plan-bar>' + LQ.ui.barHTML(plan.pct) + '</div>' +
      '</div>' +
      '<div class="plan-stat"><b data-plan-lesson-count>' + stats.lessonCount + '</b><span>门课程</span></div>' +
      '<div class="plan-stat"><b>' + Math.round(plan.minutes / 60) + '</b><span>小时计划投入</span></div>' +
      '<div class="plan-stat"><b data-daily-summary-stat>' + daily.done + '/' + daily.total + '</b><span>今日训练</span></div>' +
      '</div>';
  }

  function syncPlan(page) {
    var plan = LQ.site.planSummary();
    var text = page.querySelector('[data-plan-summary-text]');
    if (text) text.textContent = plan.done + ' / ' + plan.total + ' 项任务 · ' + plan.pct + '%';
    var bar = page.querySelector('[data-plan-bar]');
    if (bar) bar.innerHTML = LQ.ui.barHTML(plan.pct);
    if (LQ.ui.paintBars) LQ.ui.paintBars(page);

    // 每周计数
    Array.prototype.forEach.call(page.querySelectorAll('[data-week-card]'), function (card) {
      var weekId = card.getAttribute('data-week-card');
      var week = null;
      LQ.catalog.plan.forEach(function (w) { if (w.id === weekId) week = w; });
      if (!week) return;
      var progress = weekProgress(week);
      var countEl = card.querySelector('[data-week-count]');
      if (countEl) {
        var lessonCount = 0;
        week.tasks.forEach(function (task) { lessonCount += (task.lessons || []).length; });
        countEl.textContent = '本周：' + progress.done + ' / ' + progress.total + ' 项 · 关联 ' + lessonCount + ' 课';
      }
      var badge = card.querySelector('.week-side .badge-info');
      if (badge) badge.textContent = progress.done + '/' + progress.total + ' 项';
      Array.prototype.forEach.call(card.querySelectorAll('[data-plan-row]'), function (row) {
        var key = row.getAttribute('data-plan-row');
        var input = row.querySelector('input');
        var done = false;
        try { done = LQ.store.progress.isPlanTaskDone(key); } catch (err) { done = false; }
        if (input) input.checked = done;
        row.classList.toggle('is-done', done);
      });
    });

    // 每日
    var daily = LQ.site.dailySummary(new Date());
    var count = page.querySelector('[data-daily-count]');
    if (count) count.textContent = '今日完成：' + daily.done + ' / ' + daily.total;
    var stat = page.querySelector('[data-daily-summary-stat]');
    if (stat) stat.textContent = daily.done + '/' + daily.total;
    Array.prototype.forEach.call(page.querySelectorAll('[data-daily-row]'), function (row) {
      var input = row.querySelector('input');
      var key = input ? input.getAttribute('data-daily-key') : null;
      if (!key) return;
      var done = false;
      try { done = LQ.store.progress.isPlanTaskDone(key); } catch (err) { done = false; }
      if (input) input.checked = done;
      row.classList.toggle('is-done', done);
    });
  }

  LQ.pages.plan = {
    title: '学习计划',
    render: function () {
      var page = document.createElement('div');
      page.className = 'page plan-page';
      var weeksHTML = LQ.catalog.plan.map(weekCardHTML).join('');
      var planWeeks = LQ.site.planWeeks();
      var themeSummary = LQ.catalog.plan.map(function (w) { return '第 ' + w.week + ' 周 ' + w.theme; }).join('，');
      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc(planWeeks + ' 周学习计划') + '</div>' +
        '<h1 class="page-title">' + esc('每周学什么、练什么、怎么自检') + '</h1>' +
        '<p class="page-lead">' + esc('计划按 ' + planWeeks + ' 周编排：' + themeSummary + '。任务可以勾选，进度保存在本地；结业要求完成全部课程并通过实战考核。') + '</p>' +
        '</div>' +
        summaryHTML() +
        '<div class="week-list plan-week-list">' + weeksHTML + '</div>' +
        dailyCardHTML() +
        '<div class="panel mt-24">' +
        '<div class="panel-title">' + LQ.ui.icon('info') + '使用说明</div>' +
        '<ul class="text-sm muted mb-0">' +
        '<li>' + esc('任务前面的方框点一下即可标记完成，刷新页面不会丢失；每周的"关卡"是自检标准，过不了就回看对应课程。') + '</li>' +
        '<li>' + esc('任务里关联的课程链接可以直接打开对应课程页，建议按顺序学，但不强制。') + '</li>' +
        '<li>' + esc('如果某周时间不够，优先保证"关卡"能通过，再补剩下的课程。') + '</li>' +
        '<li>' + esc('每日训练清单按自然日保存，第二天自动出现新的空清单。') + '</li>' +
        '</ul>' +
        '</div>';

      page.addEventListener('change', function (event) {
        var input = event.target;
        if (!input || !input.getAttribute) return;
        var planKey = input.getAttribute('data-plan-key');
        var dailyKey = input.getAttribute('data-daily-key');
        if (planKey || dailyKey) {
          try {
            LQ.store.progress.setPlanTask(planKey || dailyKey, !!input.checked);
          } catch (err) {
            LQ.ui.toast('保存失败：' + (err && err.message ? err.message : err), 'bad');
          }
          syncPlan(page);
        }
      });

      LQ.router.addRefresh(function () { syncPlan(page); });
      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
