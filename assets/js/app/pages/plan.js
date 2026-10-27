/* Mastery-based reading plan: progress follows understanding, not preset hours. */
(function () {
  'use strict';
  var esc = LQ.util.escapeHtml;
  LQ.pages.plan = {
    title: '自主学习计划',
    render: function () {
      var page = document.createElement('div'); page.className = 'page mastery-plan';
      function render() {
        var sum = LQ.site.summary(), lessons = LQ.site.lessons(), quizzes = 0;
        lessons.forEach(function (l) { var q = LQ.store.progress.getQuiz(l.id); if (q && q.total && q.correct === q.total) quizzes++; });
        var next = lessons.find(function (l) { return !LQ.site.isLessonDone(l.id); }) || lessons[0];
        page.innerHTML = '<div class="page-head"><div class="eyebrow">LEARN AT YOUR PACE</div><h1 class="page-title">按理解程度推进，<br>把每一步学扎实。</h1><p class="page-lead">这里是阅读与理解训练。没有虚构的课程时长，也不要求按周打卡。看一段课件、答几道题，读懂了再进入下一课。</p></div>' +
          '<div class="mastery-summary"><div><b>' + sum.done + ' / ' + sum.total + '</b><span>已标记读懂的课程</span></div><div><b>' + quizzes + ' / ' + lessons.length + '</b><span>自测全部答对的课程</span></div><div><b>30 个交易日</b><span>学完后的模拟执行考核</span></div></div>' +
          '<section class="mastery-next"><div><span class="eyebrow">建议下一步</span><h2>' + esc(next.title) + '</h2><p>先看分镜课件，遇到不懂的地方展开完整讲义；完成自测后，再确认是否读懂。</p></div><a class="btn btn-primary" href="#/lesson/' + next.id + '">继续学习 →</a></section>' +
          '<div class="mastery-steps"><span>01 看课件 / 听讲解</span><span>02 理解自测 / 看解析</span><span>03 图表标注 / 模拟执行</span></div>' +
          LQ.site.modules().map(function (m) {
            var progress = LQ.site.moduleProgress(m.id);
            return '<section class="panel mastery-module"><div class="section-head"><h2>' + esc(m.stageName || m.title) + ' · ' + esc(m.title) + '</h2><span class="badge badge-muted">' + progress.done + '/' + progress.total + ' 课</span></div>' +
              LQ.site.moduleLessons(m.id).map(function (l) { var q = LQ.store.progress.getQuiz(l.id), done = LQ.site.isLessonDone(l.id);
                return '<a class="mastery-lesson" href="#/lesson/' + l.id + '"><span class="mastery-check' + (done ? ' is-done' : '') + '">' + (done ? '✓' : '○') + '</span><span><b>' + esc(l.title) + '</b><small>' + esc(l.summary || '') + '</small></span><span class="mastery-quiz">' + (q ? '自测 ' + q.correct + '/' + q.total : '尚未自测') + '</span><span>→</span></a>';
              }).join('') + '</section>';
          }).join('') +
          '<section class="mastery-next"><div><span class="eyebrow">把知识用起来</span><h2>开始一场30日模拟实战</h2><p>MNQ / MGC · $50,000账户 · 亏损$2,000失败 · 盈利$3,000通关。交易与标注自动记录，复盘后回到薄弱知识点。</p></div><a class="btn btn-primary" href="#/simulation">进入模拟实战 →</a></section>';
      }
      render(); LQ.router.addRefresh(render); return page;
    }
  };
})();
