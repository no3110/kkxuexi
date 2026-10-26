/* 实战考核页 #/exam（site-engineer 维护 · V2）
 * 三个 TAB：
 *   quiz    综合测验：9 个模块各随机抽 2 题（共 18 题），15 分钟计时，交卷判分 + 逐题解析
 *   chart   图表判读：content/exam-bank.js 的 chart 题，先隐藏标注，作答后显示解析并 setAnnotations
 *   history 成绩与错题：本地 examHistory（最多 20 条）、模块正确率、错题重做、推荐复习课程
 *
 * 数据/持久化：
 *   LQ.store 'examSession'      综合测验进行中（刷新/切路由后可继续）
 *   LQ.store 'examChartSession' 图表判读进行中
 *   LQ.store 'examHistory'      历史成绩（最多 20 条，含错题明细）
 * 测试钩子（QA）：[data-exam-tab] [data-exam-start] [data-exam-q][data-qid] [data-exam-option]
 *   [data-exam-submit] [data-exam-result][data-score][data-total] [data-exam-timer]
 *   [data-exam-redo-wrong] [data-exam-history-row] [data-exam-recommend]
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  LQ.pages = LQ.pages || {};
  var esc = function (v) { return LQ.util.escapeHtml(v); };
  var inline = function (v) { return LQ.inline(v); };

  var SESSION_KEY = 'examSession';
  var CHART_KEY = 'examChartSession';
  var HISTORY_KEY = 'examHistory';
  var DURATION_SEC = 15 * 60;
  var PER_MODULE = 2;
  var MAX_HISTORY = 20;

  /* ============================ 通用工具 ============================ */

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

  /* 确定性洗牌：同一 seed 永远得到同一顺序（刷新不跳，不同题不同） */
  function shuffleOrder(count, seedText) {
    var order = [];
    for (var i = 0; i < count; i++) order.push(i);
    if (count < 2) return order;
    var rnd = seededRandom(hashSeed(seedText));
    for (var j = count - 1; j > 0; j--) {
      var k = Math.floor(rnd() * (j + 1));
      var tmp = order[j]; order[j] = order[k]; order[k] = tmp;
    }
    return order;
  }

  function randomPick(list, count) {
    var copy = list.slice();
    var rnd = Math.random;
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
    }
    return copy.slice(0, count);
  }

  function loadJSON(key, fallback) {
    try {
      var value = LQ.store.get(key, fallback);
      return value === undefined || value === null ? fallback : value;
    } catch (err) { return fallback; }
  }

  function saveJSON(key, value) {
    try { LQ.store.set(key, value); } catch (err) { /* store 内部已降级 */ }
  }

  function removeKey(key) {
    try { LQ.store.remove(key); } catch (err) { /* ignore */ }
  }

  function formatClock(totalSec) {
    var sec = Math.max(0, Math.round(Number(totalSec) || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
  }

  function formatDate(ts) {
    try {
      var d = new Date(ts);
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    } catch (err) { return '—'; }
  }

  function optionLetters(index) { return 'ABCDEF'.charAt(index); }

  function answerLetter(question, originalIndex) {
    var order = Array.isArray(question.order) ? question.order : [];
    var display = order.indexOf(originalIndex);
    return display >= 0 ? optionLetters(display) : '?';
  }

  function chartHeight() {
    var width = global.innerWidth || 1200;
    if (width <= 480) return 300;
    if (width <= 640) return 330;
    if (width <= 900) return 380;
    return 460;
  }

  function moduleTitle(moduleId) {
    var mod = LQ.site.module(moduleId);
    return mod ? mod.title : (moduleId || '');
  }

  function historyOf() {
    var list = LQ.site.examHistory();
    return Array.isArray(list) ? list.slice(0, MAX_HISTORY) : [];
  }

  function saveHistoryEntry(entry) {
    LQ.site.saveExamHistory(entry);
    return historyOf();
  }

  function newId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /* ============================ 题库构建 ============================ */

  function contentLesson(id) {
    try { return LQ.content && LQ.content.getLesson ? LQ.content.getLesson(id) : null; } catch (err) { return null; }
  }

  function makeQuestion(moduleId, lesson, q, qi, seedBase) {
    var key = moduleId + '|' + lesson.id + '|' + qi;
    return {
      key: key,
      type: 'knowledge',
      moduleId: moduleId,
      moduleTitle: moduleTitle(moduleId),
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      question: String(q.q || ''),
      options: (q.options || []).map(function (o) { return String(o); }),
      answer: Number(q.answer),
      explain: String(q.why || ''),
      order: shuffleOrder((q.options || []).length, seedBase + '#' + key)
    };
  }

  /* 综合测验：9 个模块各抽 2 题 */
  function buildComprehensiveQuestions() {
    var picked = [];
    var missing = [];
    LQ.site.modules().forEach(function (mod) {
      var candidates = [];
      LQ.site.moduleLessons(mod.id).forEach(function (lessonMeta) {
        var lesson = contentLesson(lessonMeta.id);
        if (!lesson || !lesson.quiz || !Array.isArray(lesson.quiz.questions)) return;
        lesson.quiz.questions.forEach(function (q, qi) {
          if (!q || !Array.isArray(q.options) || q.options.length < 2) return;
          if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) return;
          candidates.push({ lesson: lesson, q: q, qi: qi });
        });
      });
      if (!candidates.length) { missing.push(mod.id); return; }
      randomPick(candidates, PER_MODULE).forEach(function (entry) {
        picked.push({ moduleId: mod.id, lesson: entry.lesson, q: entry.q, qi: entry.qi });
      });
    });
    return { picked: picked, missing: missing };
  }

  function createQuizSession(kind, rawQuestions, options) {
    options = options || {};
    var sessionId = newId('ex');
    var questions = rawQuestions.map(function (raw, index) {
      var lesson = raw.lesson || null;
      var qObj = raw.q || null;
      var lessonId = raw.lessonId || (lesson && lesson.id) || '';
      var lessonTitle = raw.lessonTitle || (lesson && lesson.title) || '';
      var questionText = String(raw.question || (qObj && qObj.q) || '');
      var rawOptions = raw.options || (qObj && qObj.options) || [];
      var answer = raw.answer !== undefined ? raw.answer : (qObj ? qObj.answer : -1);
      var explain = String(raw.explain || (qObj && qObj.why) || '');
      var baseKey = raw.key || (raw.moduleId + '|' + lessonId + '|' + (raw.qi !== undefined ? raw.qi : index));
      return {
        key: baseKey + '@' + index,
        type: 'knowledge',
        moduleId: raw.moduleId || '',
        moduleTitle: raw.moduleTitle || moduleTitle(raw.moduleId),
        lessonId: lessonId,
        lessonTitle: lessonTitle,
        question: questionText,
        options: rawOptions.map(function (o) { return String(o); }),
        answer: Number(answer),
        explain: explain,
        order: shuffleOrder(rawOptions.length, sessionId + '#' + baseKey + '#' + index)
      };
    });
    // 按模块顺序排序，保证题目节奏稳定
    questions.sort(function (a, b) {
      var order = LQ.catalog.moduleOrder;
      var ai = order.indexOf(a.moduleId); if (ai < 0) ai = 99;
      var bi = order.indexOf(b.moduleId); if (bi < 0) bi = 99;
      return ai - bi;
    });
    var duration = options.duration || DURATION_SEC;
    var session = {
      id: sessionId,
      kind: kind || 'quiz',
      createdAt: Date.now(),
      durationSec: duration,
      deadline: Date.now() + duration * 1000,
      questions: questions,
      answers: {},
      submitted: false
    };
    saveJSON(SESSION_KEY, session);
    return session;
  }

  function loadQuizSession() {
    var session = loadJSON(SESSION_KEY, null);
    if (!session || !Array.isArray(session.questions) || !session.questions.length) return null;
    if (session.submitted) { removeKey(SESSION_KEY); return null; }
    return session;
  }

  function saveQuizSession(session) { saveJSON(SESSION_KEY, session); }

  function computeResult(session) {
    var score = 0, total = session.questions.length;
    var moduleStats = {};
    var wrong = [];
    session.questions.forEach(function (q) {
      var picked = session.answers[q.key];
      var correct = Number(picked) === Number(q.answer);
      if (!moduleStats[q.moduleId]) moduleStats[q.moduleId] = { correct: 0, total: 0 };
      moduleStats[q.moduleId].total++;
      if (correct) { score++; moduleStats[q.moduleId].correct++; }
      else {
        wrong.push({
          qid: q.key,
          type: 'knowledge',
          moduleId: q.moduleId,
          moduleTitle: q.moduleTitle || moduleTitle(q.moduleId),
          lessonId: q.lessonId,
          lessonTitle: q.lessonTitle,
          question: q.question,
          options: q.options,
          answer: q.answer,
          your: typeof picked === 'number' ? picked : -1,
          explain: q.explain
        });
      }
    });
    var pct = total ? Math.round((score / total) * 100) : 0;
    var timeSec = Math.max(0, Math.round((Math.min(Date.now(), session.deadline) - session.createdAt) / 1000));
    return { score: score, total: total, pct: pct, timeSec: timeSec, moduleStats: moduleStats, wrong: wrong };
  }

  function buildHistoryEntry(session, result, kind) {
    return {
      id: session.id,
      at: Date.now(),
      kind: kind || session.kind || 'quiz',
      score: result.score,
      total: result.total,
      pct: result.pct,
      timeSec: result.timeSec,
      modules: result.moduleStats,
      wrong: result.wrong.slice(0, 30)
    };
  }

  /* ============================ 通用小组件 ============================ */

  function tabBarHTML(active) {
    var tabs = [
      { key: 'quiz', label: '综合测验', icon: 'target' },
      { key: 'chart', label: '图表判读', icon: 'chart' },
      { key: 'history', label: '成绩与错题', icon: 'list' }
    ];
    return '<div class="exam-tabs" role="tablist" aria-label="考核方式">' + tabs.map(function (tab) {
      return '<button type="button" class="exam-tab' + (active === tab.key ? ' is-active' : '') + '" role="tab" data-exam-tab="' + tab.key + '" aria-selected="' + (active === tab.key ? 'true' : 'false') + '">' +
        LQ.ui.icon(tab.icon) + '<span>' + esc(tab.label) + '</span></button>';
    }).join('') + '</div>';
  }

  function scoreRing(pct) {
    return LQ.ui.ringHTML(pct, { className: pct >= 80 ? 'ring-bull' : '', label: '得分率 ' + pct + '%' });
  }

  function emptyState(title, text, extraHTML) {
    return LQ.ui.emptyHTML(title, text, extraHTML);
  }

  /* ============================ 综合测验面板 ============================ */

  function introHTML(state) {
    var pool = buildComprehensiveQuestions();
    var total = pool.picked.length;
    var modules = LQ.site.modules();
    var coverage = modules.map(function (mod) {
      var count = 0;
      pool.picked.forEach(function (p) { if (p.moduleId === mod.id) count++; });
      return { title: mod.title, count: count };
    });
    var coverageHTML = coverage.map(function (item) {
      return '<span class="exam-coverage-item' + (item.count ? '' : ' is-missing') + '">' +
        esc(item.title) + '<b>' + item.count + '</b></span>';
    }).join('');
    if (!total) {
      return '<div class="exam-panel-intro">' +
        LQ.ui.noticeHTML('综合测验需要课程 quiz 数据。当前课程内容尚未加载完成，题库为空；内容就绪后刷新页面即可开始。', 'warn', 'warn') +
        emptyState('题库尚未加载', '综合测验从 9 个模块的课程自测题中随机抽题。请确认 content 脚本已加载。') +
        '</div>';
    }
    return '<div class="exam-panel-intro">' +
      '<div class="exam-intro-grid">' +
      '<div class="exam-intro-card">' +
      '<div class="exam-intro-icon">' + LQ.ui.icon('target') + '</div>' +
      '<h2>综合测验</h2>' +
      '<p class="text-sm muted">从 ' + LQ.site.stats().moduleCount + ' 个模块的课程自测题中，<b>每个模块随机抽 ' + PER_MODULE + ' 题</b>，共 <b>' + total + ' 题</b>。每题 1 分，限时 <b>' + Math.round(DURATION_SEC / 60) + ' 分钟</b>。</p>' +
      '<ul class="exam-rules">' +
      '<li>' + esc('选项顺序每次随机打乱，按真实理解作答。') + '</li>' +
      '<li>' + esc('中途可以切换题目、刷新页面或切到其他页面，回来会继续计时。') + '</li>' +
      '<li>' + esc('交卷后立即显示得分、用时与逐题解析；成绩保存在本地。') + '</li>' +
      '<li>' + esc('全部模块题目凑齐的前提是课程内容已加载；缺失模块会显示为 0 题。') + '</li>' +
      '</ul>' +
      '<div class="exam-coverage">' + coverageHTML + '</div>' +
      '<div class="exam-actions">' +
      '<button type="button" class="btn btn-primary btn-lg" data-exam-start>' + LQ.ui.icon('play') + '开始测验</button>' +
      '<a class="btn btn-outline" href="#/plan">' + LQ.ui.icon('calendar') + '先看学习计划</a>' +
      '</div>' +
      '</div>' +
      '<div class="exam-intro-side">' +
      sideHistoryHTML() +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function sideHistoryHTML() {
    var history = historyOf();
    if (!history.length) {
      return '<div class="panel"><div class="panel-title">' + LQ.ui.icon('chart') + '还没有考核记录</div>' +
        '<p class="text-sm muted mb-0">' + esc('完成一次综合测验或图表判读后，这里会显示分数、各模块正确率与错题。') + '</p></div>';
    }
    var latest = history[0];
    return '<div class="panel"><div class="panel-title">' + LQ.ui.icon('chart') + '最近一次成绩</div>' +
      '<div class="exam-latest">' + scoreRing(latest.pct) +
      '<div><b>' + latest.score + ' / ' + latest.total + '</b><span>' + esc(formatDate(latest.at) + ' · ' + formatClock(latest.timeSec)) + '</span></div></div>' +
      '<a class="btn btn-ghost btn-sm mt-8" href="#/exam/history">' + LQ.ui.icon('arrow-right') + '查看全部成绩与错题</a>' +
      '</div>';
  }

  function questionMetaHTML(q, index, total, session) {
    return '<div class="exam-q-meta">' +
      '<span class="badge badge-brand">' + esc(q.moduleTitle || moduleTitle(q.moduleId)) + '</span>' +
      '<span class="badge badge-muted">' + esc('第 ' + (index + 1) + ' / ' + total + ' 题') + '</span>' +
      (q.lessonId ? '<a class="badge badge-muted" href="#/lesson/' + encodeURIComponent(q.lessonId) + '">' + LQ.ui.icon('book') + esc(q.lessonId) + '</a>' : '') +
      '</div>';
  }

  function optionsHTML(q, selectedIndex, disabled, revealAnswer) {
    var order = Array.isArray(q.order) ? q.order : q.options.map(function (_, i) { return i; });
    return '<div class="exam-options">' + order.map(function (origIndex, displayIndex) {
      var picked = Number(selectedIndex) === Number(origIndex);
      var cls = 'exam-option';
      if (picked) cls += ' is-selected';
      if (revealAnswer) {
        if (Number(origIndex) === Number(q.answer)) cls += ' is-correct';
        else if (picked) cls += ' is-wrong';
      }
      return '<label class="' + cls + '" data-exam-option data-option-index="' + origIndex + '" data-display-index="' + displayIndex + '">' +
        '<input type="radio" name="exam-opt-' + esc(q.key) + '" value="' + origIndex + '" data-option-index="' + origIndex + '"' + (picked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
        '<span class="exam-option-key">' + optionLetters(displayIndex) + '</span>' +
        '<span class="exam-option-text">' + inline(q.options[origIndex]) + '</span>' +
        '</label>';
    }).join('') + '</div>';
  }

  function activeQuizHTML(session, state) {
    var total = session.questions.length;
    var index = LQ.util.clamp(state.index || 0, 0, total - 1);
    var q = session.questions[index];
    var selected = session.answers[q.key];
    var answered = Object.keys(session.answers).length;
    var grid = session.questions.map(function (item, i) {
      var isAnswered = session.answers[item.key] !== undefined;
      var classes = 'exam-jump' + (i === index ? ' is-current' : '') + (isAnswered ? ' is-answered' : '');
      return '<button type="button" class="' + classes + '" data-exam-jump="' + i + '" aria-label="第 ' + (i + 1) + ' 题' + (isAnswered ? '（已答）' : '') + '">' + (i + 1) + '</button>';
    }).join('');

    return '<div class="exam-quiz" data-exam-active="1">' +
      '<div class="exam-bar">' +
      '<div class="exam-timer" data-exam-timer aria-live="off">' + formatClock(remainingSec(session)) + '</div>' +
      '<div class="exam-bar-main">' +
      '<div class="exam-bar-title">' + esc('综合测验') + '</div>' +
      '<div class="exam-bar-sub">' + esc('已答 ' + answered + ' / ' + total + ' 题') + '</div>' +
      '</div>' +
      '<button type="button" class="btn btn-primary" data-exam-submit>' + LQ.ui.icon('check-circle') + '交卷</button>' +
      '</div>' +
      '<div class="exam-progress">' + LQ.ui.barHTML(total ? Math.round(answered / total * 100) : 0) + '</div>' +
      '<div class="exam-q-card" data-exam-q data-qid="' + esc(q.key) + '">' +
      questionMetaHTML(q, index, total, session) +
      '<p class="exam-question">' + inline(q.question) + '</p>' +
      optionsHTML(q, selected, false, false) +
      '</div>' +
      '<div class="exam-nav">' +
      '<button type="button" class="btn btn-outline" data-exam-prev' + (index === 0 ? ' disabled' : '') + '>' + LQ.ui.icon('arrow-left') + '上一题</button>' +
      '<div class="exam-jump-grid" aria-label="答题卡">' + grid + '</div>' +
      '<button type="button" class="btn btn-outline" data-exam-next' + (index === total - 1 ? ' disabled' : '') + '>下一题' + LQ.ui.icon('arrow-right') + '</button>' +
      '</div>' +
      '</div>';
  }

  function remainingSec(session) {
    return Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000));
  }

  function resultHTML(result, session) {
    var wrong = result.wrong || [];
    var rows = session.questions.map(function (q, i) {
      var picked = session.answers[q.key];
      var correct = Number(picked) === Number(q.answer);
      return '<div class="exam-result-row' + (correct ? ' is-correct' : ' is-wrong') + '">' +
        '<div class="exam-result-head">' +
        '<span class="exam-result-num">' + (i + 1) + '</span>' +
        (correct ? LQ.ui.icon('check-circle') : LQ.ui.icon('x-circle')) +
        '<span class="exam-result-q">' + inline(q.question) + '</span>' +
        '</div>' +
        '<div class="exam-result-answers">' +
        '<span>' + esc('你的答案：' + (typeof picked === 'number' ? answerLetter(q, picked) : '未作答')) + '</span>' +
        '<span>' + esc('正确答案：' + answerLetter(q, q.answer)) + '</span>' +
        '<a class="badge badge-muted" href="#/lesson/' + encodeURIComponent(q.lessonId) + '">' + LQ.ui.icon('book') + esc(q.lessonTitle || q.lessonId) + '</a>' +
        '</div>' +
        (q.explain ? '<p class="exam-explain">' + inline(q.explain) + '</p>' : '') +
        '</div>';
    }).join('');

    return '<div class="exam-result" data-exam-result data-score="' + result.score + '" data-total="' + result.total + '">' +
      '<div class="exam-result-hero">' +
      scoreRing(result.pct) +
      '<div class="exam-result-main">' +
      '<h2>' + esc('得分 ' + result.score + ' / ' + result.total) + '</h2>' +
      '<p class="text-sm muted">' + esc('得分率 ' + result.pct + '% · 用时 ' + formatClock(result.timeSec) + ' · ' + (result.pct >= 80 ? '达标（≥80%）' : '未达标（<80%），建议复习后重考')) + '</p>' +
      '<div class="exam-actions">' +
      '<button type="button" class="btn btn-primary" data-exam-again>' + LQ.ui.icon('reset') + '再考一次</button>' +
      (wrong.length ? '<button type="button" class="btn btn-outline" data-exam-redo-wrong>' + LQ.ui.icon('target') + esc('错题重做（' + wrong.length + ' 题）') + '</button>' : '') +
      '<a class="btn btn-ghost" href="#/exam/history" data-exam-tab-link>' + LQ.ui.icon('list') + '成绩与错题</a>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="exam-result-list">' + rows + '</div>' +
      '</div>';
  }

  function renderQuizPanel(page, state) {
    var body = page.querySelector('[data-exam-body]');
    if (!body) return;
    stopQuizTimer(state);
    if (state.result) {
      body.innerHTML = resultHTML(state.result.result, state.result.session);
      bindResultActions(page, state);
      return;
    }
    var session = state.session;
    if (!session) {
      state.session = loadQuizSession();
      session = state.session;
    }
    if (!session) {
      body.innerHTML = introHTML(state);
      bindQuizIntro(page, state);
      return;
    }
    if (remainingSec(session) <= 0) {
      finalizeQuiz(page, state, session);
      return;
    }
    body.innerHTML = activeQuizHTML(session, state);
    bindQuizActive(page, state, session);
    startQuizTimer(page, state);
  }

  /* 交卷结果页按钮：再考一次 / 错题重做 */
  function bindResultActions(page, state) {
    var again = page.querySelector('[data-exam-again]');
    if (again) again.addEventListener('click', function () {
      var pool = buildComprehensiveQuestions();
      if (!pool.picked.length) { LQ.ui.toast('题库尚未加载', 'bad'); return; }
      state.result = null;
      state.session = createQuizSession('quiz', pool.picked);
      state.index = 0;
      renderQuizPanel(page, state);
      LQ.ui.toast('已重新抽题：' + pool.picked.length + ' 题');
    });
    var redo = page.querySelector('[data-exam-redo-wrong]');
    if (redo) redo.addEventListener('click', function () {
      startRedoFromResult(page, state);
    });
  }

  function startRedoFromResult(page, state) {
    if (!state.result) return;
    var raw = (state.result.result.wrong || []).filter(function (w) { return !w.chart; }).map(function (w) {
      return {
        key: w.qid,
        moduleId: w.moduleId,
        moduleTitle: w.moduleTitle,
        lessonId: w.lessonId,
        lessonTitle: w.lessonTitle,
        question: w.question,
        options: w.options,
        answer: w.answer,
        explain: w.explain
      };
    });
    if (!raw.length) { LQ.ui.toast('没有可重做的客观题', 'bad'); return; }
    state.result = null;
    state.session = createQuizSession('redo', raw, { duration: Math.max(300, raw.length * 60) });
    state.index = 0;
    renderQuizPanel(page, state);
    LQ.ui.toast('错题重做：' + raw.length + ' 题');
  }

  function bindQuizIntro(page, state) {
    var startBtn = page.querySelector('[data-exam-start]');
    if (!startBtn) return;
    startBtn.addEventListener('click', function () {
      var pool = buildComprehensiveQuestions();
      if (!pool.picked.length) {
        LQ.ui.toast('题库尚未加载，无法开始', 'bad');
        return;
      }
      state.session = createQuizSession('quiz', pool.picked);
      state.index = 0;
      state.result = null;
      renderQuizPanel(page, state);
      LQ.ui.toast('开始综合测验：' + pool.picked.length + ' 题 / ' + Math.round(DURATION_SEC / 60) + ' 分钟');
    });
  }

  function updateQuizProgressUI(page, state, session) {
    var total = session.questions.length;
    var answered = Object.keys(session.answers).length;
    var sub = page.querySelector('.exam-quiz .exam-bar-sub');
    if (sub) sub.textContent = '已答 ' + answered + ' / ' + total + ' 题';
    var progress = page.querySelector('.exam-quiz .exam-progress');
    if (progress) {
      progress.innerHTML = LQ.ui.barHTML(total ? Math.round(answered / total * 100) : 0);
      if (LQ.ui.paintBars) LQ.ui.paintBars(progress);
    }
    var submitBtn = page.querySelector('[data-exam-submit]');
    if (submitBtn && !submitBtn.classList.contains('is-confirming')) {
      submitBtn.innerHTML = LQ.ui.icon('check-circle') + '交卷';
    }
    var jumps = page.querySelectorAll('[data-exam-jump]');
    var idx = LQ.util.clamp(state.index || 0, 0, total - 1);
    if (jumps[idx]) jumps[idx].classList.add('is-answered');
    var qNode = page.querySelector('[data-exam-q]');
    if (qNode) {
      var qid = qNode.getAttribute('data-qid');
      var picked = session.answers[qid];
      Array.prototype.forEach.call(qNode.querySelectorAll('[data-exam-option]'), function (label) {
        label.classList.toggle('is-selected', Number(label.getAttribute('data-option-index')) === Number(picked));
      });
    }
  }

  function bindQuizActive(page, state, session) {
    // 填写答案：就地更新 UI（不重排 DOM，避免选项节点被替换）
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-option] input[type="radio"]'), function (input) {
      input.addEventListener('change', function () {
        var qNode = input.closest ? input.closest('[data-exam-q]') : null;
        if (!qNode) return;
        var qid = qNode.getAttribute('data-qid');
        var question = null;
        session.questions.forEach(function (item) { if (item.key === qid) question = item; });
        if (!question) return;
        session.answers[qid] = Number(input.value);
        session.confirmPending = false;
        saveQuizSession(session);
        updateQuizProgressUI(page, state, session);
      });
    });

    var prevBtn = page.querySelector('[data-exam-prev]');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      state.index = Math.max(0, (state.index || 0) - 1);
      renderQuizPanel(page, state);
    });
    var nextBtn = page.querySelector('[data-exam-next]');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      state.index = Math.min(session.questions.length - 1, (state.index || 0) + 1);
      renderQuizPanel(page, state);
    });
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-jump]'), function (btn) {
      btn.addEventListener('click', function () {
        state.index = Number(btn.getAttribute('data-exam-jump')) || 0;
        renderQuizPanel(page, state);
      });
    });
    var submitBtn = page.querySelector('[data-exam-submit]');
    if (submitBtn) submitBtn.addEventListener('click', function () { trySubmit(page, state, session); });
  }

  function trySubmit(page, state, session) {
    if (!session || session.submitted) return;
    var unanswered = session.questions.filter(function (q) { return session.answers[q.key] === undefined; }).length;
    if (unanswered > 0 && !session.confirmPending) {
      session.confirmPending = true;
      saveQuizSession(session);
      var btn = page.querySelector('[data-exam-submit]');
      if (btn) { btn.textContent = '还有 ' + unanswered + ' 题未答，再点交卷'; btn.classList.add('is-confirming'); }
      LQ.ui.toast('还有 ' + unanswered + ' 题未作答，再点一次交卷', 'bad');
      return;
    }
    finalizeQuiz(page, state, session);
  }

  function finalizeQuiz(page, state, session) {
    if (!session || session.submitted) return;
    var result = computeResult(session);
    session.submitted = true;
    session.submittedAt = Date.now();
    session.result = { score: result.score, total: result.total, pct: result.pct, timeSec: result.timeSec };
    var entry = buildHistoryEntry(session, result, session.kind);
    saveHistoryEntry(entry);
    removeKey(SESSION_KEY);
    stopQuizTimer(state);
    state.result = { session: session, result: result, entry: entry };
    state.session = null;
    state.index = 0;
    renderQuizPanel(page, state);
    LQ.ui.toast('已交卷：' + result.score + ' / ' + result.total + '（' + result.pct + '%）');
  }

  function startQuizTimer(page, state) {
    stopQuizTimer(state);
    var timerEl = page.querySelector('[data-exam-timer]');
    if (!timerEl || !state.session) return;
    state.timer = setInterval(function () {
      var session = state.session;
      if (!session) { stopQuizTimer(state); return; }
      var left = remainingSec(session);
      var el = page.querySelector('[data-exam-timer]');
      if (el) {
        el.textContent = formatClock(left);
        el.classList.toggle('is-low', left <= 60);
      }
      if (left <= 0) {
        stopQuizTimer(state);
        LQ.ui.toast('时间到，自动交卷', 'bad');
        finalizeQuiz(page, state, session);
      }
    }, 1000);
  }

  function stopQuizTimer(state) {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  /* ============================ 图表判读面板 ============================ */

  function chartPool() { return LQ.site.chartExamQuestions(); }

  function loadChartSession(pool) {
    var saved = loadJSON(CHART_KEY, null);
    var ids = pool.map(function (q) { return q.id; });
    if (saved && Array.isArray(saved.order) && saved.order.length === ids.length) {
      var same = saved.order.every(function (id) { return ids.indexOf(id) !== -1; });
      if (same) return saved;
    }
    var session = {
      id: newId('exch'),
      order: randomPick(ids, ids.length),
      index: 0,
      answers: {},
      revealed: {},
      savedHistory: false,
      chartResult: null
    };
    saveJSON(CHART_KEY, session);
    return session;
  }

  function chartQuestionById(id) {
    var pool = chartPool();
    for (var i = 0; i < pool.length; i++) { if (pool[i].id === id) return pool[i]; }
    return null;
  }

  function chartIntroHTML() {
    var pool = chartPool();
    if (!pool.length) {
      return '<div class="exam-panel-intro">' +
        LQ.ui.noticeHTML('图表判读题来自 content/exam-bank.js（实战考核题库）。当前尚未加载或为空，刷新页面或等待内容脚本就绪后再试。', 'warn', 'warn') +
        emptyState('图表题库尚未加载', '图表题会显示一张情景图并隐藏标注，让你先独立判断，作答后再显示解析与标注。') +
        '</div>';
    }
    return '<div class="exam-chart-panel">' +
      '<div class="exam-chart-head">' +
      '<div><div class="exam-bar-title">' + LQ.ui.icon('chart') + ' 图表判读（' + pool.length + ' 题）</div>' +
      '<div class="exam-bar-sub">' + esc('先看图判断，提交后显示解析与图上标注；可逐题切换。') + '</div></div>' +
      '<button type="button" class="btn btn-outline btn-sm" data-exam-chart-restart>' + LQ.ui.icon('reset') + '重做本组</button>' +
      '</div>' +
      '<div class="exam-chart-body" data-exam-chart-body></div>' +
      '</div>';
  }

  function chartProgressHTML(session, total) {
    var answered = Object.keys(session.revealed).length;
    return '<div class="exam-chart-progress">' +
      '<span class="exam-bar-sub">' + esc('已作答 ' + answered + ' / ' + total + ' 题') + '</span>' +
      '<div class="exam-jump-grid">' + session.order.map(function (id, i) {
        var revealed = session.revealed[id];
        var cls = 'exam-jump' + (i === session.index ? ' is-current' : '') + (revealed ? ' is-answered' : '');
        return '<button type="button" class="' + cls + '" data-exam-chart-jump="' + i + '">' + (i + 1) + '</button>';
      }).join('') + '</div>' +
      '</div>';
  }

  function renderChartPanel(page, state) {
    var body = page.querySelector('[data-exam-body]');
    if (!body) return;
    destroyChart(state);
    var pool = chartPool();
    body.innerHTML = chartIntroHTML();
    if (!pool.length) return;
    var chartBody = page.querySelector('[data-exam-chart-body]');
    if (!chartBody) return;
    var session = state.chartSession && state.chartSession.order && state.chartSession.order.length === pool.length
      ? state.chartSession : loadChartSession(pool);
    state.chartSession = session;
    var total = session.order.length;
    session.index = LQ.util.clamp(session.index || 0, 0, total - 1);
    var qid = session.order[session.index];
    var question = chartQuestionById(qid);
    if (!question) { body.innerHTML = emptyState('题目缺失', '图表题 ' + qid + ' 不在题库中。'); return; }
    var revealed = !!session.revealed[qid];
    var picked = session.answers[qid];
    var questionOptions = '<div class="exam-options">' +
      (function () {
        var order = shuffleOrder((question.options || []).length, session.id + '#' + question.id);
        return order.map(function (origIndex, displayIndex) {
          var isPicked = Number(picked) === Number(origIndex);
          var cls = 'exam-option';
          if (isPicked) cls += ' is-selected';
          if (revealed) {
            if (Number(origIndex) === Number(question.answer)) cls += ' is-correct';
            else if (isPicked) cls += ' is-wrong';
          }
          return '<label class="' + cls + '" data-exam-option data-option-index="' + origIndex + '" data-display-index="' + displayIndex + '">' +
            '<input type="radio" name="exam-chart-' + esc(question.id) + '" value="' + origIndex + '" data-option-index="' + origIndex + '"' + (isPicked ? ' checked' : '') + (revealed ? ' disabled' : '') + '>' +
            '<span class="exam-option-key">' + optionLetters(displayIndex) + '</span>' +
            '<span class="exam-option-text">' + inline(question.options[origIndex]) + '</span>' +
            '</label>';
        }).join('');
      })() + '</div>';

    var qBody = '<div class="exam-chart-q" data-exam-chart-q="' + esc(question.id) + '">' +
      '<div class="exam-q-meta">' +
      '<span class="badge badge-brand">' + esc(moduleTitle(question.moduleId)) + '</span>' +
      '<span class="badge badge-muted">' + esc('第 ' + (session.index + 1) + ' / ' + total + ' 题') + '</span>' +
      (question.level ? '<span class="badge badge-info">' + esc(question.level) + '</span>' : '') +
      '<span class="badge badge-muted mono">' + esc(question.id) + '</span>' +
      LQ.ui.dataBadge(LQ.site.scenario(question.scenario)) +
      '</div>' +
      '<p class="exam-question">' + inline(question.question) + '</p>' +
      '<div class="exam-chart-slot" data-exam-chart-slot data-chart-ready="0"></div>' +
      '<p class="exam-chart-note">' + esc('图上标注已隐藏。先独立判断，再提交答案。') + '</p>' +
      questionOptions +
      '<div class="exam-actions">' +
      (revealed
        ? '<button type="button" class="btn btn-primary" data-exam-chart-next>' + LQ.ui.icon('arrow-right') + '下一题</button>' +
          '<span class="exam-answer-state ' + (Number(picked) === Number(question.answer) ? 'is-correct' : 'is-wrong') + '">' +
          esc(Number(picked) === Number(question.answer) ? '回答正确' : '回答错误 · 正确答案：' + answerLetterByOrder(question, session)) + '</span>'
        : '<button type="button" class="btn btn-primary" data-exam-chart-submit>' + LQ.ui.icon('check-circle') + '提交答案</button>') +
      '</div>' +
      (revealed && question.explain ? '<div class="exam-explain">' + inline(question.explain) + '</div>' : '') +
      (revealed && question.lessonId ? '<div class="exam-chart-lesson"><a class="badge badge-muted" href="#/lesson/' + encodeURIComponent(question.lessonId) + '">' + LQ.ui.icon('book') + '去复习：' + esc(question.lessonId) + '</a></div>' : '') +
      '</div>';

    chartBody.innerHTML = chartProgressHTML(session, total) + qBody;

    bindChartPanel(page, state, session, question);

    // 等待 DOM 插入后再创建图表
    setTimeout(function () {
      if (!page.isConnected || state.tab !== 'chart') return;
      mountQuestionChart(page, state, session, question);
    }, 0);
  }

  function answerLetterByOrder(question, session) {
    var order = shuffleOrder((question.options || []).length, session.id + '#' + question.id);
    var display = order.indexOf(Number(question.answer));
    return display >= 0 ? optionLetters(display) : '?';
  }

  function destroyChart(state) {
    if (state.chart && typeof state.chart.destroy === 'function') {
      try { state.chart.destroy(); } catch (err) { /* ignore */ }
    }
    state.chart = null;
    if (state.chartCleanup) { try { state.chartCleanup(); } catch (err) { /* ignore */ } state.chartCleanup = null; }
  }

  function mountQuestionChart(page, state, session, question) {
    destroyChart(state);
    var slot = page.querySelector('[data-exam-chart-slot]');
    if (!slot) return;
    var scenario = LQ.site.scenario(question.scenario);
    if (!LQ.site.chromeOK()) {
      slot.setAttribute('data-chart-ready', '0');
      slot.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('chart') +
        '<div class="chart-fallback-title">图表引擎尚未加载</div>' +
        '<div class="chart-fallback-text">' + esc('assets/js/chart/*.js 就绪后，这里会显示交互图表；你仍然可以先读题作答。') + '</div></div>';
      return;
    }
    if (!scenario) {
      slot.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('warn') +
        '<div class="chart-fallback-title">情景数据尚未加载</div>' +
        '<div class="chart-fallback-text">' + esc('情景 ' + question.scenario + ' 未注册（可能需要刷新或等待真实数据脚本加载）。') + '</div></div>';
      return;
    }
    var revealed = !!session.revealed[question.id];
    var annotations = revealed ? (question.annotations || []) : [];
    try {
      state.chart = LQ.chart.create(slot, {
        scenario: scenario,
        height: chartHeight(),
        annotations: annotations,
        viewport: question.focus || undefined,
        interactive: true,
        tools: false
      });
      slot.setAttribute('data-chart-ready', '1');
      if (LQ.ui.attachChartRepaintGuard) state.chartCleanup = LQ.ui.attachChartRepaintGuard(state.chart, slot);
    } catch (err) {
      slot.innerHTML = '<div class="chart-fallback">' + LQ.ui.icon('warn') +
        '<div class="chart-fallback-title">图表渲染出错</div>' +
        '<div class="chart-fallback-text">' + esc(err && err.message ? err.message : String(err)) + '</div></div>';
      if (LQ.errors) LQ.errors.push('考核图表渲染失败: ' + (err && err.message ? err.message : err));
    }
  }

  function bindChartPanel(page, state, session, question) {
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-option] input[type="radio"]'), function (input) {
      input.addEventListener('change', function () {
        session.answers[question.id] = Number(input.value);
        saveJSON(CHART_KEY, session);
        renderChartPanel(page, state);
      });
    });
    var submitBtn = page.querySelector('[data-exam-chart-submit]');
    if (submitBtn) submitBtn.addEventListener('click', function () {
      if (session.answers[question.id] === undefined) {
        LQ.ui.toast('先选择一个答案再提交', 'bad');
        return;
      }
      session.revealed[question.id] = true;
      saveJSON(CHART_KEY, session);
      if (state.chart) {
        try {
          state.chart.setAnnotations(question.annotations || []);
          if (typeof state.chart.resize === 'function') state.chart.resize();
        } catch (err) { if (LQ.errors) LQ.errors.push('考核图表标注失败: ' + (err && err.message ? err.message : err)); }
      }
      renderChartPanel(page, state);
      maybeFinishChart(page, state, session);
    });
    var nextBtn = page.querySelector('[data-exam-chart-next]');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var total = session.order.length;
      if (session.index >= total - 1) {
        LQ.ui.toast('已经是最后一题');
        return;
      }
      session.index++;
      saveJSON(CHART_KEY, session);
      renderChartPanel(page, state);
    });
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-chart-jump]'), function (btn) {
      btn.addEventListener('click', function () {
        session.index = Number(btn.getAttribute('data-exam-chart-jump')) || 0;
        saveJSON(CHART_KEY, session);
        renderChartPanel(page, state);
      });
    });
    var restartBtn = page.querySelector('[data-exam-chart-restart]');
    if (restartBtn) restartBtn.addEventListener('click', function () {
      destroyChart(state);
      state.chartSession = null;
      removeKey(CHART_KEY);
      renderChartPanel(page, state);
      LQ.ui.toast('已重置图表判读');
    });
  }

  function maybeFinishChart(page, state, session) {
    var total = session.order.length;
    var revealedCount = Object.keys(session.revealed).length;
    if (revealedCount < total || session.savedHistory) return;
    var score = 0, moduleStats = {}, wrong = [];
    session.order.forEach(function (id) {
      var q = chartQuestionById(id);
      if (!q) return;
      var picked = session.answers[id];
      var correct = Number(picked) === Number(q.answer);
      if (!moduleStats[q.moduleId]) moduleStats[q.moduleId] = { correct: 0, total: 0 };
      moduleStats[q.moduleId].total++;
      if (correct) { score++; moduleStats[q.moduleId].correct++; }
      else {
        wrong.push({
          qid: q.id, type: 'chart', chart: true, scenario: q.scenario,
          moduleId: q.moduleId, moduleTitle: moduleTitle(q.moduleId),
          question: q.question, options: q.options, answer: q.answer,
          your: typeof picked === 'number' ? picked : -1, explain: q.explain || ''
        });
      }
    });
    var totalQ = session.order.length;
    var entry = {
      id: session.id,
      at: Date.now(),
      kind: 'chart',
      score: score,
      total: totalQ,
      pct: totalQ ? Math.round(score / totalQ * 100) : 0,
      timeSec: 0,
      modules: moduleStats,
      wrong: wrong
    };
    session.savedHistory = true;
    saveJSON(CHART_KEY, session);
    saveHistoryEntry(entry);
    var body = page.querySelector('[data-exam-chart-body]');
    if (body) {
      var summary = '<div class="exam-result" data-exam-chart-result data-score="' + score + '" data-total="' + totalQ + '">' +
        '<div class="exam-result-hero">' + scoreRing(totalQ ? Math.round(score / totalQ * 100) : 0) +
        '<div class="exam-result-main"><h2>' + esc('图表判读完成：' + score + ' / ' + totalQ) + '</h2>' +
        '<p class="text-sm muted">' + esc('成绩已保存到「成绩与错题」，可以重做本组，或去复习错题对应的课程。') + '</p>' +
        '<div class="exam-actions"><button type="button" class="btn btn-primary" data-exam-chart-restart2>' + LQ.ui.icon('reset') + '重做本组</button>' +
        '<a class="btn btn-ghost" href="#/exam/history">' + LQ.ui.icon('list') + '成绩与错题</a></div></div></div></div>';
      var wrap = document.createElement('div');
      wrap.innerHTML = summary;
      body.insertBefore(wrap.firstChild, body.firstChild);
      var r2 = page.querySelector('[data-exam-chart-restart2]');
      if (r2) r2.addEventListener('click', function () {
        destroyChart(state);
        state.chartSession = null;
        removeKey(CHART_KEY);
        renderChartPanel(page, state);
      });
    }
  }

  /* ============================ 成绩与错题面板 ============================ */

  function aggregateModuleStats(history) {
    var map = {};
    history.forEach(function (entry) {
      var modules = entry.modules || {};
      Object.keys(modules).forEach(function (modId) {
        if (!map[modId]) map[modId] = { correct: 0, total: 0 };
        map[modId].correct += Number(modules[modId].correct) || 0;
        map[modId].total += Number(modules[modId].total) || 0;
      });
    });
    return map;
  }

  function recommendedLessons(history) {
    var stats = aggregateModuleStats(history);
    var recs = [];
    LQ.catalog.moduleOrder.forEach(function (modId) {
      var stat = stats[modId];
      if (!stat || !stat.total) return;
      var pct = Math.round(stat.correct / stat.total * 100);
      if (pct >= 80) return;
      var lessons = LQ.site.moduleLessons(modId).slice(0, 2);
      if (!lessons.length) return;
      recs.push({ moduleId: modId, pct: pct, correct: stat.correct, total: stat.total, lessons: lessons });
    });
    return recs;
  }

  function historyHTML() {
    var history = historyOf();
    if (!history.length) {
      return '<div class="exam-panel-intro">' +
        emptyState('还没有考核记录', '完成一次综合测验或图表判读后，这里会显示历史成绩、各模块正确率、错题与推荐复习课程。',
          '<div class="exam-actions mt-16"><a class="btn btn-primary" href="#/exam/quiz" data-exam-start-link>' + LQ.ui.icon('target') + '去综合测验</a>' +
          '<a class="btn btn-outline" href="#/exam/chart">' + LQ.ui.icon('chart') + '去图表判读</a></div>') +
        '</div>';
    }
    var quizEntries = history.filter(function (e) { return e.kind !== 'chart'; });
    var bestPct = 0, sumPct = 0;
    quizEntries.forEach(function (e) { if (e.pct > bestPct) bestPct = e.pct; sumPct += e.pct; });
    var avgPct = quizEntries.length ? Math.round(sumPct / quizEntries.length) : 0;
    var stats = aggregateModuleStats(history);
    var recs = recommendedLessons(history);

    var moduleRows = LQ.catalog.moduleOrder.map(function (modId) {
      var stat = stats[modId];
      if (!stat || !stat.total) return '';
      var pct = Math.round(stat.correct / stat.total * 100);
      return '<div class="exam-module-row">' +
        '<div class="exam-module-head"><span>' + esc(moduleTitle(modId)) + '</span><b>' + stat.correct + ' / ' + stat.total + ' · ' + pct + '%</b></div>' +
        LQ.ui.barHTML(pct) +
        '</div>';
    }).join('');

    var recHTML = recs.length ? '<div class="exam-recommend"><div class="panel-title">' + LQ.ui.icon('bulb') + '推荐复习课程</div>' +
      recs.map(function (rec) {
        return '<div class="exam-recommend-row"><span class="text-xs muted">' + esc(moduleTitle(rec.moduleId) + ' 正确率 ' + rec.pct + '%') + '</span>' +
          rec.lessons.map(function (lesson) {
            return '<a class="plan-task-link" data-exam-recommend href="#/lesson/' + encodeURIComponent(lesson.id) + '">' + LQ.ui.icon('book') + esc(lesson.title) + '</a>';
          }).join('') + '</div>';
      }).join('') + '</div>' : '';

    var historyRows = history.map(function (entry) {
      var kindLabel = entry.kind === 'chart' ? '图表判读' : (entry.kind === 'redo' ? '错题重做' : '综合测验');
      return '<div class="exam-history-row" data-exam-history-row>' +
        '<div class="exam-history-main">' +
        '<div class="exam-history-title">' + esc(kindLabel) + (entry.score >= 0 ? ' · ' + entry.score + ' / ' + entry.total : '') + '</div>' +
        '<div class="exam-history-sub">' + esc(formatDate(entry.at) + ' · 用时 ' + formatClock(entry.timeSec || 0) + ' · 错题 ' + ((entry.wrong || []).length) + ' 道') + '</div>' +
        '</div>' +
        '<span class="exam-history-pct' + (entry.pct >= 80 ? ' is-pass' : '') + '">' + entry.pct + '%</span>' +
        '</div>';
    }).join('');

    // 最新一次有错题的记录 → 错题列表
    var latestWrong = null;
    for (var i = 0; i < history.length; i++) {
      if (history[i].wrong && history[i].wrong.length) { latestWrong = history[i]; break; }
    }
    var wrongHTML = '';
    if (latestWrong) {
      var chartWrong = latestWrong.wrong.some(function (w) { return w.chart; });
      wrongHTML = '<div class="panel exam-wrong-panel">' +
        '<div class="panel-title">' + LQ.ui.icon('x-circle') + '错题复盘（' + esc(formatDate(latestWrong.at)) + '）</div>' +
        latestWrong.wrong.map(function (w) {
          var answerText = (w.options && w.options[w.answer] !== undefined) ? w.options[w.answer] : '';
          var yourText = (w.options && w.your >= 0 && w.options[w.your] !== undefined) ? w.options[w.your] : '未作答';
          return '<div class="exam-wrong-item">' +
            '<div class="exam-wrong-q">' + inline(w.question) + '</div>' +
            '<div class="exam-wrong-meta">' +
            '<span class="badge badge-brand">' + esc(w.moduleTitle || moduleTitle(w.moduleId)) + '</span>' +
            (w.lessonId ? '<a class="badge badge-muted" href="#/lesson/' + encodeURIComponent(w.lessonId) + '">' + LQ.ui.icon('book') + esc(w.lessonId) + '</a>' : '') +
            (w.chart ? '<button type="button" class="badge badge-info" data-exam-chart-goto="' + esc(w.qid) + '">' + LQ.ui.icon('chart') + '去图表判读重练</button>' : '') +
            '</div>' +
            '<p class="text-sm muted mb-0">' + esc('你的答案：' + yourText + '　|　正确答案：' + answerText) + '</p>' +
            (w.explain ? '<p class="exam-explain">' + inline(w.explain) + '</p>' : '') +
            '</div>';
        }).join('') +
        '<div class="exam-actions">' +
        (latestWrong.wrong.some(function (w) { return !w.chart; }) ? '<button type="button" class="btn btn-primary" data-exam-redo-wrong>' + LQ.ui.icon('reset') + '错题重做</button>' : '') +
        '<button type="button" class="btn btn-ghost" data-exam-clear>' + LQ.ui.icon('close') + '清空成绩</button>' +
        '</div>' +
        (chartWrong ? '<p class="text-xs dim mt-8">' + esc('图表题错题请用上方「去图表判读重练」按钮回到原题重做。') + '</p>' : '') +
        '</div>';
    } else {
      wrongHTML = '<div class="panel"><div class="panel-title">' + LQ.ui.icon('check-circle') + '全部答对或暂无错题</div>' +
        '<p class="text-sm muted mb-0">' + esc('继续保持。可以点「再考一次」换一批随机题。') + '</p>' +
        '<div class="exam-actions"><button type="button" class="btn btn-ghost" data-exam-clear>' + LQ.ui.icon('close') + '清空成绩</button></div></div>';
    }

    return '<div class="exam-history-panel">' +
      '<div class="exam-stat-grid">' +
      '<div class="exam-stat"><b>' + history.length + '</b><span>考核次数</span></div>' +
      '<div class="exam-stat"><b>' + bestPct + '%</b><span>综合测验最高分率</span></div>' +
      '<div class="exam-stat"><b>' + avgPct + '%</b><span>综合测验平均分率</span></div>' +
      '<div class="exam-stat"><b>' + history.filter(function (e) { return e.kind === 'chart'; }).length + '</b><span>图表判读次数</span></div>' +
      '</div>' +
      '<div class="exam-history-grid">' +
      '<div class="panel"><div class="panel-title">' + LQ.ui.icon('chart') + '各模块正确率（累计）</div>' +
      (moduleRows || '<p class="text-sm muted mb-0">' + esc('完成一次综合测验后显示模块正确率。') + '</p>') +
      recHTML +
      '</div>' +
      '<div class="panel"><div class="panel-title">' + LQ.ui.icon('list') + '历史成绩（最多 ' + MAX_HISTORY + ' 条）</div>' +
      '<div class="exam-history-list">' + historyRows + '</div>' +
      '</div>' +
      '</div>' +
      wrongHTML +
      '</div>';
  }

  function bindHistoryPanel(page, state) {
    var clearBtn = page.querySelector('[data-exam-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      LQ.ui.confirmThen(clearBtn, function () {
        removeKey(HISTORY_KEY);
        renderPanel(page, state);
        LQ.ui.toast('已清空考核成绩');
      });
    });
    var redoBtn = page.querySelector('[data-exam-redo-wrong]');
    if (redoBtn) redoBtn.addEventListener('click', function () {
      var history = historyOf();
      var latestWrong = null;
      for (var i = 0; i < history.length; i++) {
        if (history[i].wrong && history[i].wrong.some(function (w) { return !w.chart; })) { latestWrong = history[i]; break; }
      }
      if (!latestWrong) { LQ.ui.toast('没有可重做的客观错题', 'bad'); return; }
      var raw = latestWrong.wrong.filter(function (w) { return !w.chart; }).map(function (w) {
        return {
          key: w.qid,
          moduleId: w.moduleId,
          moduleTitle: w.moduleTitle,
          lessonId: w.lessonId,
          lessonTitle: w.lessonTitle,
          question: w.question,
          options: w.options,
          answer: w.answer,
          explain: w.explain
        };
      });
      state.tab = 'quiz';
      updateTabs(page, state);
      state.result = null;
      state.session = createQuizSession('redo', raw, {
        duration: Math.max(300, raw.length * 60)
      });
      state.index = 0;
      renderPanel(page, state);
      LQ.ui.toast('错题重做：' + raw.length + ' 题');
    });
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-chart-goto]'), function (btn) {
      btn.addEventListener('click', function () {
        var qid = btn.getAttribute('data-exam-chart-goto');
        var pool = chartPool();
        var session = loadChartSession(pool || []);
        var index = session.order.indexOf(qid);
        if (index >= 0) session.index = index;
        saveJSON(CHART_KEY, session);
        state.chartSession = session;
        state.tab = 'chart';
        updateTabs(page, state);
        renderPanel(page, state);
      });
    });
  }

  /* ============================ 页面骨架 ============================ */

  function updateTabs(page, state) {
    Array.prototype.forEach.call(page.querySelectorAll('[data-exam-tab]'), function (tab) {
      var active = tab.getAttribute('data-exam-tab') === state.tab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderPanel(page, state) {
    var body = page.querySelector('[data-exam-body]');
    if (!body) return;
    stopQuizTimer(state);
    destroyChart(state);
    if (state.tab === 'chart') {
      renderChartPanel(page, state);
    } else if (state.tab === 'history') {
      body.innerHTML = historyHTML();
      bindHistoryPanel(page, state);
    } else {
      renderQuizPanel(page, state);
    }
  }

  LQ.pages.exam = {
    title: '实战考核',
    render: function (ctx) {
      var page = document.createElement('div');
      page.className = 'page exam-page';
      var initialTab = 'quiz';
      if (ctx && ctx.params && ctx.params.tab && ['quiz', 'chart', 'history'].indexOf(ctx.params.tab) !== -1) initialTab = ctx.params.tab;
      if (ctx && ctx.query && ctx.query.tab && ['quiz', 'chart', 'history'].indexOf(ctx.query.tab) !== -1) initialTab = ctx.query.tab;
      var state = {
        tab: initialTab,
        session: null,
        index: 0,
        result: null,
        chart: null,
        chartSession: null,
        chartCleanup: null,
        timer: null
      };

      page.innerHTML =
        '<div class="page-head">' +
        '<div class="eyebrow">' + esc('实战考核') + '</div>' +
        '<h1 class="page-title">' + esc('把「看过」变成「会做」') + '</h1>' +
        '<p class="page-lead">' + esc('综合测验从 ' + LQ.site.stats().moduleCount + ' 个模块的课程自测随机抽题（每模块 2 题、15 分钟）；图表判读用真实/模拟情景隐藏标注考判断；成绩与错题都会保存在本地。') + '</p>' +
        '</div>' +
        tabBarHTML(initialTab) +
        '<div class="exam-body" data-exam-body></div>';

      page.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) return;
        var tab = target.closest('[data-exam-tab]');
        if (tab) {
          var name = tab.getAttribute('data-exam-tab');
          if (name === state.tab) return;
          state.tab = name;
          updateTabs(page, state);
          renderPanel(page, state);
        }
      });

      page.__lqDestroy = function () {
        stopQuizTimer(state);
        destroyChart(state);
      };
      renderPanel(page, state);

      LQ.router.addRefresh(function () {
        // store 变化（例如别的标签页完成课程）时只刷新历史面板，不动进行中的答题
        if (state.tab === 'history') renderPanel(page, state);
      });
      return page;
    },
    destroy: function () {
      var main = document.getElementById('main-content');
      var page = main ? main.querySelector('.exam-page') : null;
      if (page && typeof page.__lqDestroy === 'function') {
        try { page.__lqDestroy(); } catch (err) { /* ignore */ }
      }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
