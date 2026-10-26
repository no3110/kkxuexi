/* 模块页（site-engineer 维护）*/
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  function lessonNum(lesson, index) {
    if (lesson && lesson.id) {
      var parts = String(lesson.id).split('-');
      if (parts.length > 1 && parts[1]) return parts[1];
    }
    return index + 1 < 10 ? '0' + (index + 1) : String(index + 1);
  }

  function lessonCardHTML(lesson, index) {
    var done = LQ.site.isLessonDone(lesson.id);
    var real = LQ.site.lesson(lesson.id) || lesson;
    return '<a class="lesson-card' + (done ? ' is-done' : '') + '" data-lesson-card="' + esc(lesson.id) + '" href="#/lesson/' + encodeURIComponent(lesson.id) + '">' +
      '<span class="lesson-card-num">' + esc(lessonNum(lesson, index)) + '</span>' +
      '<span class="lesson-card-main">' +
      '<span class="lesson-card-title">' + esc(real.title) + '</span>' +
      '<span class="lesson-card-summary">' + esc(real.summary || '') + '</span>' +
      '<span class="lesson-card-meta">' +
      '<span class="badge badge-muted">' + esc(String(real.minutes || 12)) + ' 分钟</span>' +
      '<span class="badge badge-muted">' + esc(real.level || '') + '</span>' +
      (real.id ? '<span class="badge badge-muted mono">' + esc(real.id) + '</span>' : '') +
      '</span>' +
      '</span>' +
      '<span class="lesson-card-side">' +
      (done ? '<span class="badge badge-bull">' + LQ.ui.icon('check') + '已完成</span>'
        : '<span class="badge badge-brand">' + LQ.ui.icon('play') + '开始</span>') +
      '</span>' +
      '</a>';
  }

  function heroHTML(mod) {
    var lessons = LQ.site.moduleLessons(mod.id);
    var progress = LQ.site.moduleProgress(mod.id);
    var realMod = LQ.site.module(mod.id) || mod;
    var firstUnfinished = null;
    for (var i = 0; i < lessons.length; i++) {
      if (!LQ.site.isLessonDone(lessons[i].id)) { firstUnfinished = lessons[i]; break; }
    }
    var finished = progress.total > 0 && progress.done >= progress.total;
    var ctaLabel = finished ? '复习模块' : (progress.done > 0 ? '继续学习' : '开始模块');
    var ctaHref = finished ? '#/lesson/' + encodeURIComponent(lessons[0].id)
      : (firstUnfinished ? '#/lesson/' + encodeURIComponent(firstUnfinished.id) : '#/roadmap');

    var outcomesHTML = '';
    if (Array.isArray(realMod.outcomes) && realMod.outcomes.length) {
      outcomesHTML = realMod.outcomes.map(function (text) {
        return '<li>' + LQ.ui.icon('check') + '<span>' + esc(text) + '</span></li>';
      }).join('');
    }

    return '<section class="module-hero ' + LQ.ui.moduleClass(mod.id) + '" data-module-hero>' +
      '<div class="module-hero-top">' +
      '<div class="module-icon">' + LQ.ui.icon(LQ.ui.moduleIcon(realMod.icon)) + '</div>' +
      '<div class="module-title-wrap">' +
      '<div class="module-en">' + esc((realMod.stageName || '') + ' · ' + (realMod.en || '')) + '</div>' +
      '<h1 class="module-title">' + esc(realMod.title) + '</h1>' +
      '<p class="module-tagline">' + esc(realMod.tagline || '') + '</p>' +
      '<div class="module-meta">' +
      '<span class="badge badge-brand">' + esc('阶段 ' + LQ.site.stageNumber(realMod) + ' / ' + LQ.site.stats().moduleCount) + '</span>' +
      '<span class="badge badge-muted">' + esc(realMod.level || '') + '</span>' +
      '<span class="badge badge-muted">' + esc(lessons.length + ' 课 · ' + LQ.site.formatMinutes(realMod.minutes)) + '</span>' +
      '<span class="badge badge-info">' + esc('已完成 ' + progress.done + '/' + progress.total) + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<p class="module-summary">' + esc(realMod.summary || '') + '</p>' +
      (outcomesHTML ? '<div class="mt-24"><div class="text-xs dim mb-8">' + esc('学完你能') + '</div><ul class="outcome-list">' + outcomesHTML + '</ul></div>' : '') +
      '<div class="module-hero-foot">' +
      '<div class="module-progress-wrap">' + LQ.ui.barHTML(progress.pct) +
      '<div class="progress-meta"><span>模块进度</span><b>' + progress.done + ' / ' + progress.total + ' 课</b></div>' +
      '</div>' +
      '<a class="btn btn-primary" href="' + esc(ctaHref) + '">' + LQ.ui.icon('play') + esc(ctaLabel) + '</a>' +
      '</div>' +
      '</section>';
  }

  function sideHTML(mod) {
    var cp = LQ.catalog.moduleCheckpoints[mod.id] || {};
    var realMod = LQ.site.module(mod.id) || mod;
    var sourcesHTML = '';
    if (Array.isArray(realMod.sources) && realMod.sources.length) {
      sourcesHTML = '<ul class="source-list">' + realMod.sources.map(function (src) {
        if (!src || !src.url) return '';
        return '<li>' + LQ.ui.icon('external') +
          '<span><a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.title || src.url) + '</a>' +
          (src.note ? '<span class="source-note">' + esc(src.note) + '</span>' : '') + '</span></li>';
      }).join('') + '</ul>';
    }

    return '<div class="module-side">' +
      '<section class="panel">' +
      '<div class="panel-title">' + LQ.ui.icon('compass') + '关卡与产出</div>' +
      '<p class="text-sm muted mb-8">' + esc(cp.checkpoint || '') + '</p>' +
      (cp.deliverable ? '<p class="text-sm muted mb-0"><span class="badge badge-info">产出</span> ' + esc(cp.deliverable) + '</p>' : '') +
      '</section>' +
      (sourcesHTML ? '<section class="panel"><div class="panel-title">' + LQ.ui.icon('link') + '延伸阅读</div>' +
        sourcesHTML +
        '<p class="text-xs dim mt-16 mb-0">' + esc('外部链接，仅供延伸阅读。') + '</p></section>' : '') +
      '<section class="panel"><div class="panel-title">' + LQ.ui.icon('route') + '阶段导航</div>' +
      '<div class="flex flex-col gap-6">' + stageNavHTML(mod) + '</div>' +
      '</section>' +
      '</div>';
  }

  function stageNavHTML(mod) {
    var order = LQ.catalog.moduleOrder;
    var index = order.indexOf(mod.id);
    var out = '';
    if (index > 0) {
      var prev = LQ.site.module(order[index - 1]);
      if (prev) out += '<a class="overview-item ' + LQ.ui.moduleClass(prev.id) + '" href="#/module/' + encodeURIComponent(prev.id) + '">' +
        '<span class="overview-num">' + esc(String(LQ.site.stageNumber(prev))) + '</span>' +
        '<span class="overview-main"><span class="overview-title">' + LQ.ui.icon('arrow-left') + ' 上一模块</span>' +
        '<span class="overview-sub">' + esc(prev.title) + '</span></span></a>';
    }
    if (index < order.length - 1) {
      var next = LQ.site.module(order[index + 1]);
      if (next) out += '<a class="overview-item ' + LQ.ui.moduleClass(next.id) + '" href="#/module/' + encodeURIComponent(next.id) + '">' +
        '<span class="overview-num">' + esc(String(LQ.site.stageNumber(next))) + '</span>' +
        '<span class="overview-main"><span class="overview-title">下一模块 ' + LQ.ui.icon('arrow-right') + '</span>' +
        '<span class="overview-sub">' + esc(next.title) + '</span></span></a>';
    }
    if (!out) out = '<p class="text-sm muted mb-0">' + esc('这是最后一个模块，去综合复盘吧。') + '</p>';
    return out;
  }

  LQ.pages.module = {
    title: function (ctx) {
      var mod = LQ.site.module(ctx.params.id);
      return mod ? mod.title : '模块未找到';
    },
    render: function (ctx) {
      var modId = ctx.params.id;
      var mod = LQ.site.module(modId);
      if (!mod) {
        if (LQ.pages.notfound && LQ.pages.notfound.render) {
          return LQ.pages.notfound.render({
            path: ctx.path,
            title: '模块不存在',
            message: '没有找到模块「' + modId + '」。模块编号应为 m01-m07。'
          });
        }
        var fallbackNode = document.createElement('div');
        fallbackNode.className = 'page';
        fallbackNode.textContent = '模块不存在：' + modId;
        return fallbackNode;
      }

      var lessons = LQ.site.moduleLessons(mod.id);
      var realModule = LQ.site.module(mod.id);
      var isFallback = !!(LQ.content && LQ.content.getModule && !LQ.content.getModule(mod.id));
      var page = document.createElement('div');
      page.className = 'page module-page';

      var lessonCards = lessons.map(lessonCardHTML).join('');
      var noticeHTML = isFallback
        ? LQ.ui.noticeHTML('该模块的课程正文尚未加载完成（内容作者正在编写）。下方已显示课程目录与学习路径，正文就绪后会自动出现。', 'warn', 'warn')
        : '';

      page.innerHTML =
        '<nav class="breadcrumb" aria-label="面包屑"><a href="#/">首页</a><span class="sep">/</span>' +
        '<a href="#/roadmap">路线图</a><span class="sep">/</span>' +
        '<span aria-current="page">' + esc(realModule.title) + '</span></nav>' +
        noticeHTML +
        heroHTML(mod) +
        '<div class="module-grid">' +
        '<section class="panel">' +
        '<div class="section-head"><h2>' + LQ.ui.icon('list') + ' 课程列表（' + lessons.length + ' 课）</h2>' +
        '<span class="text-xs dim">' + esc('按顺序学习效果最好') + '</span></div>' +
        '<div class="lesson-cards">' + lessonCards + '</div>' +
        '</section>' +
        sideHTML(mod) +
        '</div>';

      LQ.router.addRefresh(function () {
        // 进度可能在别的标签页/课程页变化：局部同步课程完成状态与进度条
        var cards = page.querySelectorAll('[data-lesson-card]');
        Array.prototype.forEach.call(cards, function (card) {
          var id = card.getAttribute('data-lesson-card');
          var done = LQ.site.isLessonDone(id);
          card.classList.toggle('is-done', done);
          var side = card.querySelector('.lesson-card-side');
          if (side) {
            side.innerHTML = done ? '<span class="badge badge-bull">' + LQ.ui.icon('check') + '已完成</span>'
              : '<span class="badge badge-brand">' + LQ.ui.icon('play') + '开始</span>';
          }
        });
        var progress = LQ.site.moduleProgress(mod.id);
        var bar = page.querySelector('.module-progress-wrap');
        if (bar) {
          bar.innerHTML = LQ.ui.barHTML(progress.pct) +
            '<div class="progress-meta"><span>模块进度</span><b>' + progress.done + ' / ' + progress.total + ' 课</b></div>';
        }
        if (LQ.ui.paintBars) LQ.ui.paintBars(page);
      });
      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
