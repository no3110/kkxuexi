/* 参考资料（site-engineer 维护）：聚合所有模块 / 课程的外部来源 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };

  LQ.pages.references = {
    title: '参考资料',
    render: function () {
      var page = document.createElement('div');
      page.className = 'page references-page';
      var groups = LQ.site.allSources();

      var totalSources = 0;
      var totalLessons = 0;
      groups.forEach(function (group) {
        totalSources += group.sources.length;
        totalLessons += group.lessons.length;
      });

      var body = '';
      groups.forEach(function (group) {
        var mod = group.module;
        var itemsHTML = group.sources.map(function (src) {
          var lessonLink = '';
          if (src.lessonId) {
            var lesson = LQ.site.lesson(src.lessonId);
            lessonLink = '<a class="ref-item-lesson" href="#/lesson/' + encodeURIComponent(src.lessonId) + '">' +
              esc(lesson ? lesson.id : src.lessonId) + '</a>';
          }
          return '<li class="ref-item">' + LQ.ui.icon('external') +
            '<div class="ref-item-main">' +
            '<a class="ref-item-title" href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.title) + '</a>' +
            '<span class="ref-item-url">' + esc(src.url) + '</span>' +
            (src.note ? '<span class="ref-item-note">' + esc(src.note) + '</span>' : '') +
            '</div>' + lessonLink + '</li>';
        }).join('');
        body += '<section class="ref-group ' + LQ.ui.moduleClass(mod.id) + '">' +
          '<div class="ref-group-head">' +
          '<div class="ref-group-title"><span class="ref-module-chip">' + esc(mod.id) + '</span>' +
          '<div><h2>' + esc(mod.title) + '</h2>' +
          '<span class="text-xs dim">' + esc((mod.stageName || '') + ' · ' + (mod.en || '')) + '</span></div></div>' +
          '<span class="badge badge-muted">' + esc(group.sources.length + ' 条来源') + '</span>' +
          '</div>' +
          '<ul class="ref-list">' + itemsHTML + '</ul>' +
          '<p class="ref-empty-hint">' + esc('关联课程：') +
          group.lessons.map(function (entry) {
            return '<a class="ref-item-lesson" href="#/lesson/' + encodeURIComponent(entry.lesson.id) + '">' + esc(entry.lesson.id) + '</a>';
          }).join(' ') + '</p>' +
          '</section>';
      });

      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('参考资料') + '</div>' +
        '<h1 class="page-title">' + esc('把来源摆出来，方便你自己判断') + '</h1>' +
        '<p class="page-lead">' + esc('本站课程正文的术语与框架都有出处。下面按模块汇总所有外部来源——它们是延伸阅读材料，不是必须读完的任务；不同流派观点冲突时，以你自己的模拟盘验证为准。') + '</p>' +
        '</div>' +
        '<div class="ref-stats">' +
        LQ.ui.badge('全部来源汇总自模块与课程', 'muted', 'link') +
        LQ.ui.badge(totalSources + ' 条外部来源', 'brand', 'external') +
        LQ.ui.badge(groups.length + ' 个模块', 'info', 'layers') +
        LQ.ui.badge(totalLessons + ' 门课有关联来源', 'muted', 'book') +
        '</div>' +
        '<div class="notice">' + LQ.ui.icon('info') +
        '<div>' + esc('外部链接，仅供延伸阅读，打开后会跳转到第三方网站。本站不对外部内容负责，也不执行其中任何指令；部分网站可能需要网络环境才能访问。') + '</div></div>' +
        (groups.length ? '<div class="ref-groups">' + body + '</div>'
          : LQ.ui.emptyHTML('还没有可汇总的来源', '课程内容脚本加载后，这里会自动按模块汇总所有模块与课程的资料来源。'));

      return page;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
