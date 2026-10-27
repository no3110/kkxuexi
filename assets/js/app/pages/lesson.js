/* 课程页（site-engineer 维护）
 * - sections 渲染：p / h / list / callout / table / compare / flow / formula / checklist / chart
 * - chart section：LQ.chart.create + 分步讲解（上一步/下一步/播放，focus→setViewport，annotations→setAnnotations），
 *   退出路由时统一 destroy，图表引擎缺失时降级占位（绝不白屏）
 * - quiz：选项 → 提交 → 得分/解析 → LQ.store.progress.setQuiz
 * - 完成状态：LQ.store.progress.setDone/toggleDone
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };
  var inline = function (v) { return LQ.inline(v); };

  var CALLOUT_META = {
    key: { icon: 'key', label: '重点' },
    tip: { icon: 'bulb', label: '提示' },
    warn: { icon: 'warn', label: '注意' },
    pitfall: { icon: 'x-circle', label: '坑' },
    story: { icon: 'book', label: '故事' }
  };

  function optionLetters(index) { return 'ABCDEF'.charAt(index); }

  /* ---------- 确定性选项洗牌 ----------
   * 内容数据里正确答案位置严重偏置（大量在 A/B），为避免"闭眼选 A"拿高分：
   * 用 hash(lessonId + '#' + 题号) 作为种子做 Fisher–Yates 打乱「显示顺序」，
   * - 同一课同一题每次渲染顺序完全一致（刷新/重进不跳）；
   * - 不同课、不同题顺序不同；
   * - content.quiz.answer 仍是唯一真源，input.value 保留原始下标，评分逻辑不变。
   */
  function hashSeed(text) {
    var str = String(text || '');
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul ? Math.imul(h, 16777619) : (h * 16777619);
      h = h >>> 0;
    }
    return h >>> 0;
  }

  function seededRandom(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleOrder(count, seedText) {
    var order = [];
    for (var i = 0; i < count; i++) order.push(i);
    if (count < 2) return order;
    var rnd = seededRandom(hashSeed(seedText));
    for (var j = count - 1; j > 0; j--) {
      var k = Math.floor(rnd() * (j + 1));
      var tmp = order[j];
      order[j] = order[k];
      order[k] = tmp;
    }
    return order;
  }

  function displayLetterOfAnswer(lessonId, questionIndex, question) {
    var options = (question && Array.isArray(question.options)) ? question.options : [];
    if (!options.length) return '';
    var order = shuffleOrder(options.length, lessonId + '#' + questionIndex);
    var displayIndex = order.indexOf(question.answer);
    if (displayIndex < 0) displayIndex = 0;
    return optionLetters(displayIndex);
  }

  /* ============================ sections ============================ */

  function renderStaticSections(sections) {
    var html = '';
    (sections || []).forEach(function (section, index) {
      if (!section || !section.type) return;
      switch (section.type) {
        case 'p':
          html += '<p>' + inline(section.text) + '</p>';
          break;
        case 'h':
          html += '<h3 id="section-' + index + '">' + inline(section.text) + '</h3>';
          break;
        case 'list':
          html += '<' + (section.ordered ? 'ol' : 'ul') + '>' +
            (section.items || []).map(function (item) { return '<li>' + inline(item) + '</li>'; }).join('') +
            '</' + (section.ordered ? 'ol' : 'ul') + '>';
          break;
        case 'callout': {
          var meta = CALLOUT_META[section.tone] || CALLOUT_META.tip;
          html += '<div class="callout callout-' + esc(section.tone || 'tip') + '">' +
            '<div class="callout-head">' + LQ.ui.icon(meta.icon) + '<span>' + esc(section.title || meta.label) + '</span></div>' +
            '<div class="callout-body"><p>' + inline(section.text) + '</p></div>' +
            '</div>';
          break;
        }
        case 'table': {
          var head = (section.head || []).map(function (cell) { return '<th>' + inline(cell) + '</th>'; }).join('');
          var rows = (section.rows || []).map(function (row) {
            return '<tr>' + (row || []).map(function (cell) { return '<td>' + inline(cell) + '</td>'; }).join('') + '</tr>';
          }).join('');
          html += '<div class="table-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>' +
            (section.caption ? '<div class="table-caption">' + inline(section.caption) + '</div>' : '') + '</div>';
          break;
        }
        case 'compare': {
          var left = section.left || {};
          var right = section.right || {};
          html += '<div class="compare">' +
            '<div class="compare-col compare-left"><h4 class="compare-title">' + esc(left.title || 'A') + '</h4>' +
            '<ul>' + (left.items || []).map(function (item) { return '<li>' + inline(item) + '</li>'; }).join('') + '</ul></div>' +
            '<div class="compare-col compare-right"><h4 class="compare-title">' + esc(right.title || 'B') + '</h4>' +
            '<ul>' + (right.items || []).map(function (item) { return '<li>' + inline(item) + '</li>'; }).join('') + '</ul></div>' +
            '</div>';
          break;
        }
        case 'flow': {
          var flowItems = section.items || [];
          html += '<div class="flow">';
          flowItems.forEach(function (item, i) {
            if (i > 0) html += '<span class="flow-arrow">' + LQ.ui.icon('arrow-right') + '</span>';
            html += '<span class="flow-step"><span class="flow-num">' + (i + 1) + '</span>' +
              '<span class="flow-text">' + inline(item) + '</span></span>';
          });
          if (section.caption) html += '<span class="flow-caption">' + inline(section.caption) + '</span>';
          html += '</div>';
          break;
        }
        case 'formula':
          html += '<div class="formula"><code>' + esc(section.text) + '</code>' +
            (section.note ? '<p class="formula-note">' + inline(section.note) + '</p>' : '') + '</div>';
          break;
        case 'checklist': {
          var checkItems = (section.items || []).map(function (item, i) {
            return '<label class="checklist-item"><input type="checkbox" data-inline-check="' + i + '">' +
              '<span class="checklist-text">' + inline(item) + '</span></label>';
          }).join('');
          html += '<div class="checklist"><div class="checklist-title">' + LQ.ui.icon('check-circle') +
            '<span>' + esc(section.title || '自查清单') + '</span></div>' +
            '<div class="checklist-items">' + checkItems + '</div></div>';
          break;
        }
        case 'chart':
          html += '<div data-chart-placeholder="' + index + '"></div>';
          break;
        default:
          break;
      }
    });
    return html;
  }

  /* ============================ chart ============================ */

  function chartHeight(preferred) {
    var h = Number(preferred) || 420;
    var width = global.innerWidth || 1200;
    if (width <= 640) return Math.min(h, 320);
    if (width <= 900) return Math.min(h, 380);
    return h;
  }

  function normalizeSteps(section) {
    var steps = Array.isArray(section.steps) ? section.steps.filter(Boolean) : [];
    if (!steps.length) {
      steps = [{ title: '整图预览', text: '这张图先把整体结构看清楚，再结合正文理解标注含义。', annotations: section.annotations || [] }];
    }
    return steps;
  }

  function fallbackHTML(reason) {
    return '<div class="chart-fallback">' + LQ.ui.icon('chart') +
      '<div class="chart-fallback-title">' + esc('图表暂不可用') + '</div>' +
      '<div class="chart-fallback-text">' + esc(reason) + '</div>' +
      '<div class="chart-fallback-text">' + esc('下面的分步讲解仍可阅读；图表引擎就绪后刷新页面即可显示交互图表。') + '</div>' +
      '</div>';
  }

  function figureHTML(section, scenario) {
    var steps = normalizeSteps(section);
    var pills = steps.map(function (step, i) {
      return '<button type="button" class="step-pill" data-step-index="' + i + '" aria-label="第 ' + (i + 1) + ' 步"' + (i === 0 ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
    }).join('');
    var first = steps[0] || {};
    var scenarioTitle = scenario ? (scenario.title || section.scenario) : section.scenario;
    var caption = section.caption || '';
    return '<div class="chart-top">' +
        '<span class="chart-top-title">' + LQ.ui.icon('chart') + esc(scenarioTitle || '交互图表') + '</span>' +
        '<span class="chart-legend-hint">' + LQ.ui.dataBadge(scenario) + '</span>' +
      '</div>' +
      '<div class="chart-canvas-wrap"><div class="chart-canvas" data-chart-canvas></div></div>' +
      '<div class="chart-steps">' +
        '<div class="chart-step-nav">' +
          '<div class="chart-step-pills" role="tablist" aria-label="讲解步骤">' + pills + '</div>' +
          '<div class="chart-controls">' +
            '<button type="button" class="btn btn-sm btn-outline chart-step-prev" data-chart-prev aria-label="上一步">' + LQ.ui.icon('arrow-left') + '上一步</button>' +
            '<button type="button" class="btn btn-sm btn-outline chart-step-play" data-chart-play aria-label="自动播放" aria-pressed="false">' + LQ.ui.icon('play') + '播放</button>' +
            '<button type="button" class="btn btn-sm btn-outline chart-step-next" data-chart-next aria-label="下一步">下一步' + LQ.ui.icon('arrow-right') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="chart-step-body" aria-live="polite">' +
          '<div class="chart-step-counter" data-step-counter></div>' +
          '<h4 class="chart-step-title" data-step-title></h4>' +
          '<p class="chart-step-text" data-step-text></p>' +
        '</div>' +
      '</div>' +
      '<figcaption class="chart-caption">' + inline(caption) + '</figcaption>' +
      '<span class="sr-only" data-step-first="' + esc(first.title || '') + '"></span>';
  }

  function mountChart(section, placeholder, state) {
    var scenario = null;
    try {
      scenario = LQ.data && LQ.data.getScenario ? LQ.data.getScenario(section.scenario) : null;
    } catch (err) { scenario = null; }

    var figure = document.createElement('figure');
    figure.className = 'chart-figure';
    figure.setAttribute('data-chart-section', String(section.__index));
    if (scenario) figure.setAttribute('data-scenario', section.scenario);
    figure.innerHTML = figureHTML(section, scenario);
    if (placeholder.parentNode) placeholder.parentNode.replaceChild(figure, placeholder);
    else return;

    var canvas = figure.querySelector('[data-chart-canvas]');
    var steps = normalizeSteps(section);
    var chart = null;

    if (!LQ.site.chromeOK()) {
      if (canvas) canvas.innerHTML = fallbackHTML('图表引擎尚未加载（assets/js/chart/*.js）。');
    } else if (!scenario) {
      if (canvas) canvas.innerHTML = fallbackHTML('情景数据「' + section.scenario + '」尚未注册，可能需要刷新或等待内容脚本加载。');
    } else {
      try {
        var initial = steps[0] || {};
        chart = LQ.chart.create(canvas, {
          scenario: scenario,
          height: chartHeight(section.height),
          annotations: initial.annotations || [],
          tools: true,
          viewport: initial.focus || undefined
        });
      } catch (err) {
        chart = null;
        if (LQ.errors) LQ.errors.push('图表创建失败（' + section.scenario + '）: ' + (err && err.message ? err.message : err));
        if (canvas) canvas.innerHTML = fallbackHTML('图表渲染出错：' + (err && err.message ? err.message : err));
      }
      if (chart && !chart.el && canvas) {
        if (canvas) canvas.innerHTML = fallbackHTML('图表引擎返回了空实例。');
        chart = null;
      }
      if (chart) {
        state.charts.push(chart);
        figure.setAttribute('data-chart-ready', '1');
        // 被遮挡 iframe / 后台标签页里 rAF 会被节流，交互后补一次同步重绘
        var repaintCleanup = LQ.ui.attachChartRepaintGuard(chart, figure);
        if (repaintCleanup) state.cleanups.push(repaintCleanup);
      }
    }

    var counterEl = figure.querySelector('[data-step-counter]');
    var titleEl = figure.querySelector('[data-step-title]');
    var textEl = figure.querySelector('[data-step-text]');
    var prevBtn = figure.querySelector('[data-chart-prev]');
    var nextBtn = figure.querySelector('[data-chart-next]');
    var playBtn = figure.querySelector('[data-chart-play]');
    var pills = Array.prototype.slice.call(figure.querySelectorAll('.step-pill'));
    var index = 0;
    var playTimer = null;

    function applyStep(nextIndex, fromUser) {
      index = LQ.util.clamp(nextIndex, 0, steps.length - 1);
      var step = steps[index] || {};
      if (counterEl) counterEl.textContent = '第 ' + (index + 1) + ' / ' + steps.length + ' 步';
      if (titleEl) titleEl.textContent = step.title || '';
      if (textEl) textEl.innerHTML = step.text ? inline(step.text) : '';
      pills.forEach(function (pill, i) {
        var current = i === index;
        if (current) pill.setAttribute('aria-current', 'true');
        else pill.removeAttribute('aria-current');
        pill.classList.toggle('is-done', i < index);
      });
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === steps.length - 1;
      if (chart) {
        try {
          chart.setAnnotations(step.annotations || []);
          if (step.focus) chart.setViewport(step.focus);
          else chart.resetViewport();
          // 图表引擎内部用 requestAnimationFrame 合并重绘；在隐藏 iframe / 后台标签页里
          // rAF 可能被节流导致画面不刷新，这里补一次同步 resize 立即按新标注重绘。
          if (typeof chart.resize === 'function') chart.resize();
        } catch (err) {
          if (LQ.errors) LQ.errors.push('图表步骤切换失败: ' + (err && err.message ? err.message : err));
        }
      }
      if (fromUser && index === steps.length - 1) stopPlay();
    }

    function stopPlay() {
      if (playTimer) { clearInterval(playTimer); playTimer = null; }
      if (playBtn) {
        playBtn.setAttribute('aria-pressed', 'false');
        playBtn.innerHTML = LQ.ui.icon('play') + '播放';
      }
    }

    function startPlay() {
      if (steps.length < 2) return;
      if (index >= steps.length - 1) applyStep(0, true);
      if (playBtn) {
        playBtn.setAttribute('aria-pressed', 'true');
        playBtn.innerHTML = LQ.ui.icon('pause') + '暂停';
      }
      playTimer = setInterval(function () {
        if (index >= steps.length - 1) { stopPlay(); return; }
        applyStep(index + 1, false);
      }, 5200);
      state.cleanups.push(stopPlay);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { stopPlay(); applyStep(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stopPlay(); applyStep(index + 1, true); });
    if (playBtn) playBtn.addEventListener('click', function () {
      if (playTimer) stopPlay();
      else startPlay();
    });
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        stopPlay();
        applyStep(Number(pill.getAttribute('data-step-index')) || 0, true);
      });
    });

    applyStep(0, false);
  }

  function mountAllCharts(page, sections, state) {
    var placeholders = Array.prototype.slice.call(page.querySelectorAll('[data-chart-placeholder]'));
    placeholders.forEach(function (placeholder) {
      var index = Number(placeholder.getAttribute('data-chart-placeholder'));
      var section = sections[index];
      if (!section) { return; }
      section.__index = index;
      try {
        mountChart(section, placeholder, state);
      } catch (err) {
        if (LQ.errors) LQ.errors.push('图表挂载失败: ' + (err && err.stack ? err.stack : err));
        placeholder.innerHTML = fallbackHTML('图表加载异常：' + (err && err.message ? err.message : err));
      }
    });
  }

  /* ============================ quiz ============================ */

  function quizHTML(lesson) {
    var questions = (lesson.quiz && Array.isArray(lesson.quiz.questions)) ? lesson.quiz.questions : [];
    if (!questions.length) return '';
    var prev = null;
    try { prev = LQ.store.progress.getQuiz(lesson.id); } catch (err) { prev = null; }
    var prevText = prev ? '上次成绩 ' + prev.correct + ' / ' + prev.total : '尚未作答';
    var questionsHTML = questions.map(function (q, qi) {
      var options = Array.isArray(q.options) ? q.options : [];
      var order = shuffleOrder(options.length, lesson.id + '#' + qi);
      // 显示顺序按 order 打乱；input.value / data-option 仍是原始下标（评分与内容数据保持一致）
      var optionsHTML = order.map(function (originalIndex, displayIndex) {
        var option = options[originalIndex];
        var inputId = 'quiz-' + lesson.id + '-' + qi + '-d' + displayIndex;
        return '<label class="quiz-option" for="' + esc(inputId) + '" data-option="' + originalIndex + '" data-display="' + displayIndex + '">' +
          '<input id="' + esc(inputId) + '" type="radio" name="' + esc('quiz-' + lesson.id + '-' + qi) + '" value="' + originalIndex + '">' +
          '<span class="quiz-option-key">' + optionLetters(displayIndex) + '</span>' +
          '<span class="quiz-option-text">' + inline(option) + '</span>' +
          '</label>';
      }).join('');
      return '<div class="quiz-q" data-quiz-q="' + qi + '">' +
        '<p class="quiz-question"><span class="quiz-q-num">' + (qi + 1) + '.</span>' + inline(q.q) + '</p>' +
        '<div class="quiz-options">' + optionsHTML + '</div>' +
        '</div>';
    }).join('');

    return '<section class="quiz" data-quiz data-quiz-shuffled="1" data-lesson-id="' + esc(lesson.id) + '">' +
      '<div class="quiz-head">' +
      '<h2>' + LQ.ui.icon('target') + '本节自测</h2>' +
      '<span class="quiz-note">' + esc(questions.length + ' 题 · 选完提交后查看解析') + '</span>' +
      '<span class="quiz-prev-result" data-quiz-prev>' + esc(prevText) + '</span>' +
      '</div>' +
      questionsHTML +
      '<div class="quiz-actions">' +
      '<button type="button" class="btn btn-primary" data-quiz-submit>' + LQ.ui.icon('check-circle') + '提交答案</button>' +
      '<button type="button" class="btn btn-outline hidden" data-quiz-retry>' + LQ.ui.icon('reset') + '重做一遍</button>' +
      '</div>' +
      '<div class="quiz-result hidden" data-quiz-result></div>' +
      '</section>';
  }

  function bindQuiz(page, lesson, state) {
    var quiz = page.querySelector('[data-quiz]');
    if (!quiz) return;
    var questions = (lesson.quiz && Array.isArray(lesson.quiz.questions)) ? lesson.quiz.questions : [];
    var submitBtn = quiz.querySelector('[data-quiz-submit]');
    var retryBtn = quiz.querySelector('[data-quiz-retry]');
    var resultEl = quiz.querySelector('[data-quiz-result]');

    function clearMarks() {
      Array.prototype.forEach.call(quiz.querySelectorAll('.quiz-option'), function (option) {
        option.classList.remove('is-correct', 'is-wrong', 'is-selected');
      });
      Array.prototype.forEach.call(quiz.querySelectorAll('.quiz-why'), function (node) { node.remove(); });
      Array.prototype.forEach.call(quiz.querySelectorAll('input[type="radio"]'), function (input) {
        input.disabled = false;
        input.checked = false;
      });
      if (resultEl) { resultEl.classList.add('hidden'); resultEl.innerHTML = ''; if (resultEl.className.indexOf('is-pass') !== -1) resultEl.classList.remove('is-pass'); resultEl.classList.remove('is-fail'); }
      if (retryBtn) retryBtn.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var unanswered = 0;
        var correct = 0;
        var answers = [];
        questions.forEach(function (q, qi) {
          var picked = quiz.querySelector('input[name="' + ('quiz-' + lesson.id + '-' + qi).replace(/"/g, '') + '"]:checked');
          if (!picked) { unanswered++; answers.push(-1); return; }
          answers.push(Number(picked.value));
        });
        if (unanswered > 0) {
          LQ.ui.toast('还有 ' + unanswered + ' 题未作答', 'bad');
          return;
        }
        answers.forEach(function (answer, qi) {
          var q = questions[qi] || {};
          var options = q.options || [];
          var qNode = quiz.querySelector('[data-quiz-q="' + qi + '"]');
          if (qNode) {
            Array.prototype.forEach.call(qNode.querySelectorAll('.quiz-option'), function (option) {
              var oi = Number(option.getAttribute('data-option'));
              option.classList.remove('is-selected');
              if (oi === q.answer) option.classList.add('is-correct');
              if (oi === answer && answer !== q.answer) option.classList.add('is-wrong');
              var input = option.querySelector('input');
              if (input) input.disabled = true;
            });
            if (q.why) {
              var why = document.createElement('p');
              why.className = 'quiz-why';
              var isRight = answer === q.answer;
              // 解析里的"正确答案"用洗牌后的显示字母，避免与页面上的选项字母对不上
              why.innerHTML = '<b>' + (isRight ? '答对了。' : '正确答案：' + displayLetterOfAnswer(lesson.id, qi, q) + '。') + '</b>' + inline(q.why);
              qNode.appendChild(why);
            }
          }
          if (answer === q.answer) correct++;
        });
        var total = questions.length;
        var pct = total ? Math.round((correct / total) * 100) : 0;
        try {
          LQ.store.progress.setQuiz(lesson.id, { correct: correct, total: total, at: Date.now() });
        } catch (err) { /* store 内部已降级 */ }
        if (resultEl) {
          resultEl.classList.remove('hidden');
          resultEl.classList.add(pct >= 60 ? 'is-pass' : 'is-fail');
          resultEl.innerHTML = '<div class="quiz-result-title">' + esc(pct >= 60 ? '通过 · 得分 ' + correct + ' / ' + total + '（' + pct + '%）' : '再回看一下 · 得分 ' + correct + ' / ' + total + '（' + pct + '%）') + '</div>' +
            '<div class="text-sm muted">' + esc(pct >= 60 ? '可以进入下一课；错题也建议标记出来。' : '把错题对应的段落重新读一遍，然后再点「重做一遍」。') + '</div>';
        }
        var prevEl = quiz.querySelector('[data-quiz-prev]');
        if (prevEl) prevEl.textContent = '上次成绩 ' + correct + ' / ' + total;
        if (retryBtn) retryBtn.classList.remove('hidden');
        if (submitBtn) submitBtn.disabled = true;
        LQ.ui.toast('已记录自测成绩：' + correct + ' / ' + total);
        void state;
      });
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        clearMarks();
        LQ.ui.toast('已清空选择，可以重做');
      });
    }

    // 选中态高亮（选项顺序已洗牌，仅做视觉反馈，不参与评分）
    quiz.addEventListener('change', function (event) {
      var input = event.target;
      if (!input || input.type !== 'radio') return;
      Array.prototype.forEach.call(quiz.querySelectorAll('.quiz-option'), function (option) {
        var optionInput = option.querySelector('input');
        option.classList.toggle('is-selected', optionInput === input);
      });
    });
  }

  /* ============================ 完成状态 ============================ */

  function doneButtonHTML(done) {
    return '<button type="button" class="btn ' + (done ? 'btn-outline is-done' : 'btn-outline') + '" data-action="toggle-done" aria-pressed="' + (done ? 'true' : 'false') + '">' +
      LQ.ui.icon(done ? 'check-circle' : 'circle') +
      esc(done ? '已完成 · 点击取消' : '标记为已完成') + '</button>';
  }

  function bindDone(page, lesson) {
    function isDone() { return LQ.site.isLessonDone(lesson.id); }
    function sync() {
      Array.prototype.forEach.call(page.querySelectorAll('[data-action="toggle-done"]'), function (btn) {
        var done = isDone();
        btn.classList.toggle('btn-outline', !done);
        btn.classList.toggle('btn-primary', done);
        btn.classList.toggle('is-done', done);
        btn.setAttribute('aria-pressed', done ? 'true' : 'false');
        btn.innerHTML = LQ.ui.icon(done ? 'check-circle' : 'circle') + esc(done ? '已完成 · 点击取消' : '标记为已完成');
      });
      // 侧栏勾选
      Array.prototype.forEach.call(page.querySelectorAll('[data-sidebar-lesson]'), function (link) {
        var id = link.getAttribute('data-sidebar-lesson');
        link.parentNode.classList.toggle('is-done', LQ.site.isLessonDone(id));
      });
  }
    page.addEventListener('click', function (event) {
      var btn = event.target && event.target.closest ? event.target.closest('[data-action="toggle-done"]') : null;
      if (!btn) return;
      event.preventDefault();
      var next;
      try { next = LQ.store.progress.toggleDone(lesson.id); } catch (err) { next = null; }
      sync();
      if (next === true) LQ.ui.toast('已完成本节：' + lesson.title);
      else if (next === false) LQ.ui.toast('已取消完成标记');
      var sum = LQ.site.summary();
      if (next === true && sum.done === sum.total) LQ.ui.toast('🎉 ' + sum.total + ' 课全部完成！去复盘一下你的 SOP 吧。');
    });
    LQ.router.addRefresh(sync);
    sync();
  }

  /* ============================ 侧栏与分页 ============================ */

  function sidebarHTML(lesson, moduleLessons) {
    var mod = LQ.site.module(lesson.moduleId);
    var progress = LQ.site.moduleProgress(lesson.moduleId);
    var items = moduleLessons.map(function (item, index) {
      var isCurrent = item.id === lesson.id;
      var done = LQ.site.isLessonDone(item.id);
      var num = String(index + 1);
      if (num.length < 2) num = '0' + num;
      return '<li class="sidebar-lesson' + (isCurrent ? ' is-current' : '') + (done ? ' is-done' : '') + '" data-sidebar-lesson="' + esc(item.id) + '">' +
        '<a href="#/lesson/' + encodeURIComponent(item.id) + '"' + (isCurrent ? ' aria-current="page"' : '') + '>' +
        '<span class="lesson-index">' + num + '</span>' +
        '<span class="lesson-name">' + esc(item.title) + '</span></a></li>';
    }).join('');

    return '<a class="sidebar-back" href="#/module/' + encodeURIComponent(lesson.moduleId) + '">' + LQ.ui.icon('arrow-left') + '返回模块</a>' +
      '<div class="sidebar-head"><div>' +
      '<div class="sidebar-eyebrow">' + esc((mod && mod.stageName) || '模块目录') + '</div>' +
      '<h2 class="sidebar-title">' + esc((mod && mod.title) || lesson.moduleTitle || '') + '</h2>' +
      '</div></div>' +
      '<div class="sidebar-progress">' + LQ.ui.barHTML(progress.pct) +
      '<div class="progress-meta"><span>模块进度</span><b>' + progress.done + ' / ' + progress.total + '</b></div></div>' +
      '<ol class="sidebar-lessons">' + items + '</ol>' +
      '<p class="sidebar-note">' + esc('点击课程可随时切换；标记完成后进度会自动保存。') + '</p>';
  }

  function tocHTML(lesson, moduleLessons) {
    var items = moduleLessons.map(function (item, index) {
      var isCurrent = item.id === lesson.id;
      var num = String(index + 1);
      if (num.length < 2) num = '0' + num;
      return '<li><a href="#/lesson/' + encodeURIComponent(item.id) + '"' + (isCurrent ? ' aria-current="true"' : '') + '>' +
        '<span class="lesson-index">' + num + '</span><span class="lesson-name">' + esc(item.title) + '</span></a></li>';
    }).join('');
    return '<details class="lesson-mobile-toc"><summary>' + LQ.ui.icon('list') +
      esc('本模块目录（' + moduleLessons.length + ' 课）') + '</summary>' +
      '<ul class="mobile-toc-list">' + items + '</ul></details>';
  }

  function pagerHTML(lesson) {
    var prev = LQ.site.prevLesson(lesson.id);
    var next = LQ.site.nextLesson(lesson.id);
    var prevHTML = prev
      ? '<a class="pager-link" href="#/lesson/' + encodeURIComponent(prev.id) + '">' + LQ.ui.icon('arrow-left') +
        '<span class="pager-main"><span class="pager-label">上一课</span><span class="pager-title">' + esc(prev.title) + '</span></span></a>'
      : '<span class="pager-link pager-placeholder"><span class="pager-main"><span class="pager-label">上一课</span><span class="pager-title">' + esc('已经是第一课') + '</span></span></span>';
    var nextHTML = next
      ? '<a class="pager-link is-next" href="#/lesson/' + encodeURIComponent(next.id) + '"><span class="pager-main"><span class="pager-label">下一课</span><span class="pager-title">' + esc(next.title) + '</span></span>' + LQ.ui.icon('arrow-right') + '</a>'
      : '<span class="pager-link is-next pager-placeholder"><span class="pager-main"><span class="pager-label">下一课</span><span class="pager-title">' + esc('已经是最后一课 · 去复盘吧') + '</span></span></span>';
    return '<nav class="lesson-pager" aria-label="课程翻页">' + prevHTML + nextHTML + '</nav>';
  }

  function sourcesHTML(lesson) {
    var sources = Array.isArray(lesson.sources) ? lesson.sources : [];
    if (!sources.length) return '';
    return '<section class="lesson-sources">' +
      '<h2>' + LQ.ui.icon('link') + '资料来源' + '</h2>' +
      '<p class="sources-note">' + esc('外部链接，仅供延伸阅读；内容仅供参考，不代表本站观点。') + '</p>' +
      '<ul class="source-list">' + sources.map(function (src) {
        if (!src || !src.url) return '';
        return '<li>' + LQ.ui.icon('external') +
          '<span><a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.title || src.url) + '</a>' +
          (src.note ? '<span class="source-note">' + esc(src.note) + '</span>' : '') + '</span></li>';
      }).join('') + '</ul>' +
      '</section>';
  }

  /* ============================ 页面渲染 ============================ */

  function renderLesson(lesson, ctx) {
    var state = { charts: [], cleanups: [] };
    var page = document.createElement('div');
    page.className = 'page lesson-page';
    page.setAttribute('data-lesson-id', lesson.id);

    var mod = LQ.site.module(lesson.moduleId);
    var moduleLessons = LQ.site.moduleLessons(lesson.moduleId);
    var done = LQ.site.isLessonDone(lesson.id);
    var indexInAll = LQ.site.lessonIndex(lesson.id);
    var totalLessons = LQ.site.lessonCount();
    var sections = Array.isArray(lesson.sections) ? lesson.sections : [];
    var hasCharts = sections.some(function (s) { return s && s.type === 'chart'; });

    var outcomesHTML = '';
    if (Array.isArray(lesson.outcomes) && lesson.outcomes.length) {
      outcomesHTML = '<div class="mt-16"><div class="text-xs dim mb-8">' + esc('本节学完你能') + '</div>' +
        '<ul class="lesson-outcomes">' + lesson.outcomes.map(function (text) {
          return '<li>' + LQ.ui.icon('check') + '<span>' + esc(text) + '</span></li>';
        }).join('') + '</ul></div>';
    }

    page.innerHTML =
      '<nav class="breadcrumb" aria-label="面包屑"><a href="#/">首页</a><span class="sep">/</span>' +
      '<a href="#/roadmap">路线图</a><span class="sep">/</span>' +
      '<a href="#/module/' + encodeURIComponent(lesson.moduleId) + '">' + esc((mod && mod.title) || lesson.moduleTitle || '') + '</a>' +
      '<span class="sep">/</span><span aria-current="page">' + esc(lesson.id) + '</span></nav>' +
      '<header class="lesson-head ' + LQ.ui.moduleClass(lesson.moduleId) + '">' +
      '<div class="lesson-meta">' +
      '<a class="badge badge-brand" href="#/module/' + encodeURIComponent(lesson.moduleId) + '">' + LQ.ui.icon('layers') + esc((mod && mod.title) || '') + '</a>' +
      '<span class="badge badge-muted">分镜课件 · 阅读 · 理解自测</span>' +
      '<span class="badge badge-muted">' + esc(lesson.level || '') + '</span>' +
      '<span class="badge badge-muted">' + esc('全站第 ' + (indexInAll + 1) + ' / ' + totalLessons + ' 课') + '</span>' +
      (lesson.en ? '<span class="badge badge-muted">' + esc(lesson.en) + '</span>' : '') +
      '</div>' +
      '<h1 class="lesson-title">' + esc(lesson.title) + '</h1>' +
      (lesson.summary ? '<p class="lesson-summary">' + inline(lesson.summary) + '</p>' : '') +
      outcomesHTML +
      '<div class="lesson-toolbar">' +
      '<div class="lesson-toolbar-actions">' +
      doneButtonHTML(done) +
      '<a class="btn btn-ghost" href="#/module/' + encodeURIComponent(lesson.moduleId) + '">' + LQ.ui.icon('layers') + '模块详情</a>' +
      '</div>' +
      '</div>' +
      '</header>' +
      tocHTML(lesson, moduleLessons) +
      '<div data-course-player></div>' +
      '<div class="course-reading-toggle"><button type="button" class="btn btn-sm btn-outline" data-reading-toggle aria-expanded="false">展开完整讲义与图表练习</button><span>先看课件，再做文末自测；按掌握程度推进。</span></div>' +
      '<div class="lesson-body">' +
      '<article class="prose" data-full-reading hidden>' + renderStaticSections(sections) + '</article>' +
      quizHTML(lesson) +
      sourcesHTML(lesson) +
      pagerHTML(lesson) +
      '</div>';

    state.cleanups.push(LQ.coursePlayer.mount(page.querySelector('[data-course-player]'), lesson));
    page.querySelector('[data-reading-toggle]').addEventListener('click', function (e) {
      var article = page.querySelector('[data-full-reading]'); article.hidden = !article.hidden;
      e.currentTarget.setAttribute('aria-expanded', String(!article.hidden));
      e.currentTarget.textContent = article.hidden ? '展开完整讲义与图表练习' : '收起完整讲义';
      if (!article.hidden && !state.charts.length) mountCharts();
      state.charts.forEach(function (chart) { if (chart.resize) chart.resize(); });
    });

    // 图表必须在 DOM 插入后创建（依赖容器宽度）
    function mountCharts() {
      if (!page.isConnected) return; // 路由已切走，避免在游离节点上创建图表
      try { mountAllCharts(page, sections, state); } catch (err) {
        if (LQ.errors) LQ.errors.push('图表渲染失败: ' + (err && err.stack ? err.stack : err));
      }
    }

    // checklist 勾选只在当次有效
    page.addEventListener('change', function (event) {
      var input = event.target;
      if (!input || input.getAttribute('data-inline-check') === null) return;
      var label = input.closest ? input.closest('.checklist-item') : null;
      if (label) label.classList.toggle('is-checked', !!input.checked);
    });

    bindQuiz(page, lesson, state);
    bindDone(page, lesson);

    LQ.router.addRefresh(function () {
      var prevEl = page.querySelector('[data-quiz-prev]');
      if (prevEl) {
        var saved = null;
        try { saved = LQ.store.progress.getQuiz(lesson.id); } catch (err) { saved = null; }
        if (saved) prevEl.textContent = '上次成绩 ' + saved.correct + ' / ' + saved.total;
      }
    });

    // 侧栏 + 记忆最近学习
    LQ.ui.showSidebar(sidebarHTML(lesson, moduleLessons));
    try { LQ.store.progress.setLastLesson(lesson.id); } catch (err) { /* ignore */ }

    // 图表挂载需等页面插入文档后（宽度可测）：用 microtask + rAF 双保险
    // Full-reading charts mount only when opened; the slide chart owns its own lifecycle.
    if (global.requestAnimationFrame) global.requestAnimationFrame(function () { /* 已挂载 */ });

    page.__lqDestroy = function () {
      state.cleanups.forEach(function (fn) { try { fn(); } catch (err) { /* ignore */ } });
      state.charts.forEach(function (chart) {
        try { if (chart && typeof chart.destroy === 'function') chart.destroy(); } catch (err) {
          if (LQ.errors) LQ.errors.push('图表 destroy 失败: ' + (err && err.message ? err.message : err));
        }
      });
      state.charts = [];
      page.__lqHasCharts = hasCharts;
    };
    return page;
  }

  function renderPending(lessonMeta) {
    var page = document.createElement('div');
    page.className = 'page lesson-page';
    page.setAttribute('data-lesson-id', lessonMeta.id);
    var mod = LQ.site.module(lessonMeta.moduleId);
    var moduleLessons = LQ.site.moduleLessons(lessonMeta.moduleId);
    page.innerHTML =
      '<nav class="breadcrumb" aria-label="面包屑"><a href="#/">首页</a><span class="sep">/</span>' +
      '<a href="#/module/' + encodeURIComponent(lessonMeta.moduleId) + '">' + esc((mod && mod.title) || lessonMeta.moduleTitle || '') + '</a>' +
      '<span class="sep">/</span><span aria-current="page">' + esc(lessonMeta.id) + '</span></nav>' +
      '<header class="lesson-head ' + LQ.ui.moduleClass(lessonMeta.moduleId) + '">' +
      '<div class="lesson-meta">' +
      '<span class="badge badge-brand">' + esc((mod && mod.title) || '') + '</span>' +
      '<span class="badge badge-muted">阅读 · 理解自测</span>' +
      '<span class="badge badge-muted">' + esc(lessonMeta.level || '') + '</span>' +
      '</div>' +
      '<h1 class="lesson-title">' + esc(lessonMeta.title) + '</h1>' +
      (lessonMeta.summary ? '<p class="lesson-summary">' + esc(lessonMeta.summary) + '</p>' : '') +
      '</header>' +
      LQ.ui.noticeHTML('该课正文尚未加载完成（内容作者正在编写），这里先显示课程目录信息。正文就绪后刷新页面即可。', 'warn', 'warn') +
      '<div class="panel"><div class="panel-title">' + LQ.ui.icon('list') + '本模块其他课程</div>' +
      '<div class="lesson-cards">' + moduleLessons.map(function (item) {
        return '<a class="lesson-card" href="#/lesson/' + encodeURIComponent(item.id) + '">' +
          '<span class="lesson-card-num">' + esc(item.id.slice(-2)) + '</span>' +
          '<span class="lesson-card-main"><span class="lesson-card-title">' + esc(item.title) + '</span>' +
          '<span class="lesson-card-summary">' + esc(item.summary || '') + '</span></span>' +
          '<span class="lesson-card-side">' + LQ.ui.icon('chevron-right') + '</span></a>';
      }).join('') + '</div></div>' +
      pagerHTML(lessonMeta);
    LQ.ui.showSidebar(sidebarHTML(lessonMeta, moduleLessons));
    return page;
  }

  LQ.pages.lesson = {
    title: function (ctx) {
      var lesson = LQ.site.lesson(ctx.params.id);
      return lesson ? lesson.title : '课程未找到';
    },
    render: function (ctx) {
      var lessonId = ctx.params.id;
      var meta = LQ.site.lesson(lessonId);
      if (!meta) {
        if (LQ.pages.notfound && LQ.pages.notfound.render) {
          return LQ.pages.notfound.render({
            path: ctx.path,
            title: '课程不存在',
            message: '没有找到课程「' + lessonId + '」。课程 ID 形如 m01-01，可在路线图或模块页查找。'
          });
        }
        var node = document.createElement('div');
        node.className = 'page';
        node.textContent = '课程不存在：' + lessonId;
        return node;
      }
      var real = null;
      try { real = LQ.content && LQ.content.getLesson ? LQ.content.getLesson(lessonId) : null; } catch (err) { real = null; }
      var page = real ? renderLesson(real, ctx) : renderPending(meta);
      LQ.router.addRefresh(function () {
        if (LQ.ui.paintBars) LQ.ui.paintBars(page);
      });
      return page;
    },
    destroy: function () {
      var main = document.getElementById('main-content');
      var page = main ? main.querySelector('.lesson-page') : null;
      if (page && typeof page.__lqDestroy === 'function') {
        try { page.__lqDestroy(); } catch (err) {
          if (LQ.errors) LQ.errors.push('课程页清理失败: ' + (err && err.message ? err.message : err));
        }
      }
      if (LQ.ui.clearSidebar) LQ.ui.clearSidebar();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
