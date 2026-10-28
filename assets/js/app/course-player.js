/* 分镜课件播放器：一屏一个重点、图文配合、逐句语音讲解（暂停 / 继续 / 重播）、全屏横屏与屏幕常亮。 */
(function () {
  'use strict';
  var esc = LQ.util.escapeHtml;
  function text(value) { var div = document.createElement('div'); div.innerHTML = LQ.inline(value || ''); return div.textContent; }

  /* 按句切分：先按句号/问号/分号/换行，过长再按逗号切，保证每段语音都不太长（规避 Chrome 长句中断） */
  function sentences(str, max) {
    max = max || 90;
    var parts = (String(str || '').replace(/\r/g, '').match(/[^。！？；!?;\n]+[。！？；!?;”"）)]*/g) || []).map(function (s) { return s.trim(); }).filter(Boolean);
    var out = [];
    parts.forEach(function (p) {
      if (p.length <= max) { out.push(p); return; }
      var buf = '';
      (p.match(/[^，、,：:]+[，、,：:]*/g) || [p]).forEach(function (q) {
        if (buf && buf.length + q.length > max) { out.push(buf); buf = ''; }
        buf += q;
      });
      if (buf) out.push(buf);
    });
    return out;
  }

  function chunkParagraph(content, limit) {
    var list = sentences(content, 120), chunks = [], chunk = '';
    list.forEach(function (part) { if (chunk && chunk.length + part.length > limit) { chunks.push(chunk); chunk = ''; } chunk += part; });
    if (chunk) chunks.push(chunk);
    return chunks.length ? chunks : [''];
  }

  function slidesFor(lesson) {
    var chapter = '课程导入', title = '理解这个知识点', main = null;
    var slides = [{ kind: 'cover', chapter: chapter, title: lesson.title, text: text(lesson.summary || ''), tag: '这节课，先抓住一个重点', bullets: (lesson.outcomes || []).slice(0, 3) }];
    // 没有小标题的课：按“图 N”与复盘清单自动分章节，方便跳转
    var hasH = (lesson.sections || []).some(function (s) { return s && s.type === 'h'; }), started = false;
    (lesson.sections || []).forEach(function (s) {
      if (!s) return;
      if (s.type === 'h') { title = chapter = text(s.text); return; }
      if (!hasH) {
        if (s.type === 'chart' && s.caption) chapter = text(s.caption).replace(/[（(][^）)]*[）)]/g, '').trim().slice(0, 26);
        else if (s.type === 'checklist') chapter = '复盘清单';
        else if (!started && s.type !== 'chart') chapter = '概念入门';
        started = true;
      }
      if (s.type === 'chart') {
        var steps = s.steps || [{ title: '观察图表', text: s.caption, annotations: s.annotations || [] }];
        if (!main) main = { scenario: s.scenario, annotations: (steps[steps.length - 1] || {}).annotations || [] };
        steps.forEach(function (step, i) {
          slides.push({ kind: 'chart', chapter: chapter, title: step.title || title, text: text(step.text), scenario: s.scenario, annotations: step.annotations || [], focus: step.focus, tag: '看图理解 · 第 ' + (i + 1) + ' / ' + steps.length + ' 步', caption: text(s.caption || '') });
        });
        return;
      }
      if (s.type === 'table') {
        var rows = s.rows || [];
        for (var r = 0; r < Math.max(1, rows.length); r += 5) {
          slides.push({ kind: 'table', chapter: chapter, title: s.title ? text(s.title) : title, text: text(s.caption || ''), tag: '一张表看清区别', head: (s.head || []).map(text), rows: rows.slice(r, r + 5).map(function (row) { return row.map(text); }) });
        }
        return;
      }
      if (s.type === 'compare') {
        slides.push({ kind: 'compare', chapter: chapter, title: s.title ? text(s.title) : title, text: text(s.caption || ''), tag: '放在一起比一比', left: s.left, right: s.right });
        return;
      }
      if (s.type === 'flow') {
        slides.push({ kind: 'flow', chapter: chapter, title: s.title ? text(s.title) : title, text: text(s.caption || ''), tag: '按顺序做，不跳步', items: (s.items || []).map(text) });
        return;
      }
      if (s.type === 'formula') {
        slides.push({ kind: 'formula', chapter: chapter, title: s.title ? text(s.title) : (hasH ? title : '动手算一遍'), formula: String(s.text || '').split('\n').map(text).join('\n'), text: s.note ? text(s.note) : '', tag: '算一遍就懂' });
        return;
      }
      if (s.type === 'list' || s.type === 'checklist') {
        var items = (s.items || []).map(text), kind = s.type === 'checklist' ? 'checklist' : 'list';
        var heading = s.title ? text(s.title) : (kind === 'checklist' ? '用这张清单检查自己' : title);
        for (var j = 0; j < items.length; j += 4) slides.push({ kind: kind, chapter: chapter, title: heading, text: '', bullets: items.slice(j, j + 4), tag: kind === 'checklist' ? '逐条打勾' : '要点' });
        return;
      }
      var content = '', tag = '用自己的话，理解它', slideTitle = title, kindName = 'text', tone = '';
      if (s.type === 'p') content = text(s.text);
      else if (s.type === 'callout') { content = text(s.text); slideTitle = s.title ? text(s.title) : '抓住重点'; tone = s.tone || 'key'; kindName = 'callout'; tag = tone === 'pitfall' || tone === 'warn' ? '容易踩的坑' : (tone === 'story' ? '先听个故事' : '记住这一句'); }
      if (!content) return;
      chunkParagraph(content, 170).forEach(function (part) {
        slides.push({ kind: kindName, tone: tone, chapter: chapter, title: slideTitle, text: part, tag: tag });
      });
    });
    slides.push({ kind: 'summary', chapter: '学完检验', title: '轮到你来判断', text: '知识是否学会，看你能不能用自己的话解释理由。完成下面的理解自测，再到模拟市场里试一次。', tag: '把知识变成自己的判断', bullets: (lesson.outcomes && lesson.outcomes.length ? lesson.outcomes.slice(0, 4) : ['先找位置，再找证据', '先定风险，再做选择', '错题回到对应知识点复习']) });
    slides.forEach(function (s) { s.main = main; });
    return slides;
  }

  function speakable(str) {
    return String(str || '').replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/≈/g, '约等于').replace(/[−–]/g, '减').replace(/→/g, '，然后').replace(/=/g, '等于').replace(/%/g, '%').replace(/[`*_#]/g, '');
  }

  LQ.coursePlayer = {
    slidesFor: slidesFor,
    mount: function (host, lesson) {
      var slides = slidesFor(lesson), index = 0, chart = null, destroyed = false, narration = [];
      var storageKey = 'lq.slide.' + lesson.id, posKey = 'lq.voice.pos.' + lesson.id, rateKey = 'lq.voice.rate.v1', autoKey = 'lq.voice.autonext.v1';
      var supportedRates = ['0.8', '1', '1.25', '1.5', '2'];
      var voiceRate = '1.25', autoNext = true, resumeAt = 0;
      var speech = { state: 'idle', pos: 0, token: 0, timer: null, utter: null };
      var synth = window.speechSynthesis;
      var supportsVoice = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
      var zhVoice = null;
      function ls(fn) { try { return fn(); } catch (_) { return null; } }
      index = Math.min(slides.length - 1, Math.max(0, Number(ls(function () { return localStorage.getItem(storageKey); })) || 0));
      var storedRate = ls(function () { return localStorage.getItem(rateKey); });
      if (supportedRates.indexOf(storedRate) !== -1) voiceRate = storedRate;
      if (ls(function () { return localStorage.getItem(autoKey); }) === '0') autoNext = false;
      var savedPos = ls(function () { return JSON.parse(localStorage.getItem(posKey) || 'null'); });
      if (savedPos && savedPos.slide === index && savedPos.pos > 0) resumeAt = savedPos.pos;

      function pickVoice() {
        if (!supportsVoice) return;
        var list = ls(function () { return synth.getVoices(); }) || [];
        var zh = list.filter(function (v) { return /^zh(-|_)?(CN|Hans)?/i.test(v.lang) && !/HK|TW|Hant/i.test(v.lang); });
        var pref = /Xiaoxiao|Yunxi|Xiaoyi|Tingting|婷婷|Google\s*普通话|Microsoft.*(Xiao|Yun)|Natural/i;
        zhVoice = zh.filter(function (v) { return pref.test(v.name); })[0] || zh.filter(function (v) { return v.localService; })[0] || zh[0] || null;
      }
      if (supportsVoice) { pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); }

      // 配图计划：文字页配概念示意图；连续两页同一张图时，第二页换成本课例图，图文交替不单调
      var plan = [], lastDiag = null;
      slides.forEach(function (s, i) {
        var d = null;
        if (['text', 'callout', 'list', 'checklist', 'cover'].indexOf(s.kind) !== -1 && LQ.slideVisuals) {
          d = LQ.slideVisuals.pick(s, lesson);
          if (s.kind === 'cover' && lesson.id === 'm00-02') d = { id: 'candle', html: LQ.slideVisuals.render('candle'), caption: '一根 K 线 = 四个价格：开、高、低、收' };
          if (d && d.id === lastDiag && s.main && s.main.scenario) d = 'context';
        }
        plan[i] = d;
        lastDiag = d && d.id ? d.id : (s.kind === 'chart' ? null : lastDiag);
      });

      var chapters = [];
      slides.forEach(function (s, i) { if (!chapters.length || chapters[chapters.length - 1].name !== s.chapter) chapters.push({ name: s.chapter, start: i }); });

      host.className = 'course-player'; host.tabIndex = 0;
      host.innerHTML =
        '<div class="course-player-head"><span class="cp-head-title">◈ 分镜课件</span><span class="cp-head-chapter" data-slide-chapter></span><span class="cp-head-count" data-slide-count></span></div>' +
        '<div class="course-stage" data-slide-stage></div>' +
        '<div class="course-progress" data-slide-progress-bar title="点击跳到对应页"><span data-slide-progress></span>' +
          chapters.map(function (c) { return c.start ? '<i style="left:' + (c.start / slides.length * 100) + '%"></i>' : ''; }).join('') + '</div>' +
        '<div class="course-player-controls">' +
          '<div class="cp-main">' +
            '<button type="button" class="btn btn-sm btn-outline" data-slide-prev aria-label="上一页课件">←<span class="cp-lbl"> 上一页</span></button>' +
            '<button type="button" class="btn btn-sm btn-primary cp-play" data-slide-play></button>' +
            '<button type="button" class="btn btn-sm btn-outline" data-slide-replay title="从本页第一句重新讲">↺<span class="cp-lbl"> 重播本页</span></button>' +
            '<button type="button" class="btn btn-sm btn-outline" data-slide-next aria-label="下一页课件"><span class="cp-lbl">下一页 </span>→</button>' +
          '</div>' +
          '<div class="cp-options">' +
            '<label class="cp-toggle"><input type="checkbox" data-slide-auto' + (autoNext ? ' checked' : '') + '><span>讲完自动翻页</span></label>' +
            '<label class="course-voice-rate"><span>语速</span><select data-slide-rate aria-label="语音讲解速度"><option value="0.8">0.8×</option><option value="1">1.0×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2.0×</option></select></label>' +
            '<label class="course-voice-rate cp-chapter"><span>章节</span><select data-slide-jump aria-label="跳到章节">' + chapters.map(function (c, i) { return '<option value="' + c.start + '">' + (i + 1) + '. ' + esc(c.name) + '</option>'; }).join('') + '</select></label>' +
            '<button class="btn btn-sm btn-ghost" type="button" data-slide-full>⛶ 全屏</button>' +
            '<button class="btn btn-sm btn-ghost" type="button" data-slide-rotate hidden>⟳ 横屏</button>' +
          '</div>' +
        '</div>' +
        '<p class="course-player-note" data-slide-status aria-live="polite"></p>';

      var stage = host.querySelector('[data-slide-stage]');
      var playBtn = host.querySelector('[data-slide-play]'), replayBtn = host.querySelector('[data-slide-replay]');
      var rateSelect = host.querySelector('[data-slide-rate]'), jumpSelect = host.querySelector('[data-slide-jump]');
      var autoInput = host.querySelector('[data-slide-auto]'), statusEl = host.querySelector('[data-slide-status]');
      var fullBtn = host.querySelector('[data-slide-full]'), rotateBtn = host.querySelector('[data-slide-rotate]');
      rateSelect.value = voiceRate;
      if (!supportsVoice) { rateSelect.disabled = true; rateSelect.title = '当前浏览器不支持语音，改为逐句高亮阅读'; }

      /* ---------------- 语音：逐句播放，可暂停 / 继续 / 重播 ---------------- */
      function savePos() { ls(function () { localStorage.setItem(posKey, JSON.stringify({ slide: index, pos: speech.pos })); }); }
      function awake(on) { if (LQ.screen) LQ.screen.keepAwake('narration', on); }
      function clearSpeech() {
        speech.token++; clearTimeout(speech.timer); speech.timer = null; speech.utter = null;
        if (supportsVoice && (synth.speaking || synth.pending)) synth.cancel();
      }
      function highlight(pos) {
        Array.prototype.forEach.call(stage.querySelectorAll('.is-saying'), function (el) { el.classList.remove('is-saying'); });
        if (pos < 0) return;
        var el = stage.querySelector('[data-say="' + pos + '"]');
        if (el) {
          el.classList.add('is-saying');
          var box = el.closest('.course-slide-copy, .course-slide-visual');
          if (box && box.scrollHeight > box.clientHeight + 4) {
            var top = el.offsetTop - box.offsetTop - box.clientHeight / 3;
            box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          }
        }
      }
      function speakFrom(pos) {
        if (destroyed) return;
        clearSpeech();
        if (pos >= narration.length) { finishSlide(); return; }
        var tok = speech.token, chunk = narration[pos];
        speech.state = 'playing'; speech.pos = pos; resumeAt = 0;
        highlight(pos); savePos(); syncUI(); awake(true);
        var rate = Number(rateSelect.value) || 1;
        if (!supportsVoice) {
          speech.timer = setTimeout(function () { if (tok === speech.token) speakFrom(pos + 1); }, Math.max(1800, chunk.length * 230 / rate));
          return;
        }
        var u = new SpeechSynthesisUtterance(speakable(chunk));
        u.lang = 'zh-CN'; u.rate = rate; if (zhVoice) u.voice = zhVoice;
        u.onend = function () { if (tok === speech.token) speakFrom(pos + 1); };
        u.onerror = function (e) {
          if (tok !== speech.token) return;
          if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
          speech.state = 'paused'; syncUI(); awake(false);
          LQ.ui.toast('语音暂时不可用：点「继续播放」会从这一句重新读。');
        };
        speech.utter = u; // 保持引用，避免部分浏览器回收后不触发 onend
        synth.speak(u);
      }
      function finishSlide() {
        speech.state = 'done'; speech.pos = 0; highlight(-1); savePos();
        if (autoNext && index < slides.length - 1) {
          var tok = speech.token;
          speech.state = 'playing'; syncUI();
          speech.timer = setTimeout(function () { if (tok === speech.token && !destroyed) goTo(index + 1, true); }, 800);
          return;
        }
        awake(false); syncUI();
        if (index === slides.length - 1) LQ.ui.toast('本课课件讲完了，去做下面的理解自测吧。');
      }
      function pause() {
        if (speech.state !== 'playing') return;
        clearSpeech(); speech.state = 'paused'; savePos(); syncUI(); awake(false);
      }
      function stopAll() { clearSpeech(); speech.state = 'idle'; awake(false); }

      function syncUI() {
        var st = speech.state, total = narration.length, cur = Math.min(total, speech.pos + 1);
        var label, status;
        if (st === 'playing') { label = 'Ⅱ 暂停'; status = '正在讲解 · 第 ' + cur + ' / ' + total + ' 句' + (supportsVoice ? '' : '（当前浏览器不支持语音，改为逐句高亮）') + ' · 空格键可暂停'; }
        else if (st === 'paused') { label = '▶ 继续播放'; status = '已暂停在第 ' + cur + ' / ' + total + ' 句 · 点「继续播放」从这句接着讲，不用从头再来'; }
        else if (st === 'done') { label = index < slides.length - 1 ? '▶ 讲下一页' : '↺ 再听一遍'; status = '本页讲完了' + (index < slides.length - 1 ? ' · 可以「讲下一页」，或打开「讲完自动翻页」连续听' : ''); }
        else if (resumeAt > 0) { label = '▶ 继续播放'; status = '上次听到本页第 ' + (resumeAt + 1) + ' 句 · 点「继续播放」接着讲，或「重播本页」从头听'; }
        else { label = '▶ 开始讲解'; status = '点「开始讲解」，课件会一句句读给你听，并高亮正在讲的那句。← → 翻页，空格暂停 / 继续。'; }
        playBtn.textContent = label;
        playBtn.setAttribute('aria-pressed', st === 'playing' ? 'true' : 'false');
        statusEl.textContent = status;
        var full = LQ.screen && LQ.screen.isFullscreen(host);
        fullBtn.textContent = full ? '✕ 退出全屏' : '⛶ 全屏';
        rotateBtn.hidden = !(full && LQ.screen.isTouch());
        rotateBtn.textContent = host.classList.contains('is-rotated') ? '⟳ 竖屏' : '⟳ 横屏';
      }

      /* ---------------- 渲染 ---------------- */
      function say(str, list) { list.push(str); return list.length - 1; }
      function sentenceSpans(str, list) {
        return sentences(str).map(function (s) { return '<span data-say="' + say(s, list) + '">' + esc(s) + '</span>'; }).join('');
      }
      function chartHost(withHint) {
        return '<div class="course-chart-host" data-slide-chart></div>' + (withHint ? '<div class="course-chart-hint">拖动 K 线平移 · 滚轮 / 双指缩放 · 上下拖价格轴、左右拖时间轴可拉伸 · 双击或点右下角「复原」</div>' : '');
      }
      function visualFor(s, list) {
        var v, diag;
        switch (s.kind) {
          case 'chart':
            return { html: chartHost(true), chart: { scenario: s.scenario, annotations: s.annotations, focus: s.focus }, cls: 'is-chart' };
          case 'table':
            return { cls: 'is-table', html: '<div class="cp-table-wrap"><table class="cp-table">' + (s.head && s.head.length ? '<thead><tr>' + s.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>' : '') +
              '<tbody>' + s.rows.map(function (row) {
                var spoken = row.map(function (cell, i) { return (s.head && s.head[i] ? s.head[i] + '：' : '') + cell; }).join('，');
                return '<tr data-say="' + say(spoken, list) + '">' + row.map(function (c, i) { return i === 0 ? '<th scope="row">' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
              }).join('') + '</tbody></table></div>' };
          case 'compare':
            return { cls: 'is-compare', html: '<div class="cp-compare">' + [s.left, s.right].filter(Boolean).map(function (col, ci) {
              return '<div class="cp-compare-col ' + (ci ? 'is-right' : 'is-left') + '"><h3 data-say="' + say(text(col.title || ''), list) + '">' + esc(text(col.title || '')) + '</h3><ul>' +
                (col.items || []).map(function (it) { var tx = text(it); return '<li data-say="' + say(tx, list) + '">' + esc(tx) + '</li>'; }).join('') + '</ul></div>';
            }).join('<div class="cp-vs">VS</div>') + '</div>' };
          case 'flow':
            return { cls: 'is-flow', html: '<ol class="cp-flow">' + s.items.map(function (it, i) { return '<li data-say="' + say('第 ' + (i + 1) + ' 步，' + it, list) + '"><b>' + (i + 1) + '</b><span>' + esc(it) + '</span></li>'; }).join('') + '</ol>' };
          case 'formula':
            return { cls: 'is-formula', html: '<pre class="cp-formula">' + s.formula.split('\n').map(function (line) { return line.trim() ? '<span data-say="' + say(line.trim(), list) + '">' + esc(line) + '</span>' : ''; }).join('\n') + '</pre>' };
          case 'summary':
            var next = LQ.site && LQ.site.nextLesson ? LQ.site.nextLesson(lesson.id) : null;
            return { cls: 'is-summary', html: '<div class="cp-actions">' +
              '<button type="button" class="cp-action" data-slide-goto="quiz"><b>① 做理解自测</b><span>' + ((lesson.quiz && lesson.quiz.questions) ? lesson.quiz.questions.length + ' 道题，' : '') + '选完看解析</span></button>' +
              '<button type="button" class="cp-action" data-slide-goto="reading"><b>② 看图练习</b><span>展开完整讲义，逐步点图表</span></button>' +
              '<a class="cp-action" href="#/simulation"><b>③ 模拟市场练一次</b><span>用本课知识做一笔模拟交易</span></a>' +
              (next ? '<a class="cp-action" href="#/lesson/' + encodeURIComponent(next.id) + '"><b>④ 下一课 →</b><span>' + esc(next.title) + '</span></a>' : '') + '</div>' };
        }
        diag = plan[index];
        if (diag && diag !== 'context') return { cls: 'is-diagram', html: '<figure class="cp-diagram">' + diag.html + '<figcaption>' + esc(diag.caption) + '</figcaption></figure>' };
        if (s.main && s.main.scenario) {
          v = { scenario: s.main.scenario, annotations: s.main.annotations };
          return { cls: 'is-chart is-context', html: '<div class="course-visual-label">本课例图 · 可拖动缩放对照理解</div>' + chartHost(false), chart: v };
        }
        return { cls: 'is-number', html: '<div class="course-key-number">' + String(index + 1).padStart(2, '0') + '</div><span class="course-visual-label">' + esc(lesson.moduleTitle || '理解 · 观察 · 实践') + '</span>' };
      }

      function render() {
        if (destroyed) return;
        if (chart) { chart.destroy(); chart = null; }
        var s = slides[index], list = [];
        var copy = '<div class="course-slide-tag">' + esc(s.tag) + '</div><h2 data-say="' + say(s.title, list) + '">' + esc(s.title) + '</h2>';
        // 朗读顺序：标题 → 公式（公式页）→ 正文 → 要点 → 右侧表格 / 对比 / 流程
        var visual = s.kind === 'formula' ? visualFor(s, list) : null;
        if (s.text) copy += '<p class="' + (s.kind === 'callout' ? 'cp-callout tone-' + esc(s.tone || 'key') : '') + '">' + sentenceSpans(s.text, list) + '</p>';
        if (s.bullets && s.bullets.length) {
          copy += '<ul class="' + (s.kind === 'checklist' ? 'cp-checklist' : '') + '">' + s.bullets.map(function (b) {
            return '<li data-say="' + say(b, list) + '">' + (s.kind === 'checklist' ? '<label><input type="checkbox"><span>' + esc(b) + '</span></label>' : esc(b)) + '</li>';
          }).join('') + '</ul>';
        }
        if (!visual) visual = visualFor(s, list);
        narration = list;
        stage.className = 'course-stage kind-' + s.kind + ' ' + (visual.cls || '');
        stage.innerHTML = '<div class="course-slide-copy">' + copy + '</div><div class="course-slide-visual">' + visual.html + '</div>';
        if (visual.chart) {
          var sc = LQ.data.getScenario(visual.chart.scenario), slot = stage.querySelector('[data-slide-chart]');
          if (sc && slot) {
            chart = LQ.chart.create(slot, { scenario: sc, height: 400, fillHeight: true, annotations: visual.chart.annotations, tools: s.kind === 'chart' && (host.clientWidth || window.innerWidth) >= 560, viewport: visual.chart.focus });
          } else if (slot) slot.innerHTML = '<div class="chart-fallback">图表数据暂未加载</div>';
        }
        var ch = 0; chapters.forEach(function (c, i) { if (c.start <= index) ch = i; });
        host.querySelector('[data-slide-chapter]').textContent = s.chapter;
        jumpSelect.value = String(chapters[ch].start);
        host.querySelector('[data-slide-count]').textContent = (index + 1) + ' / ' + slides.length;
        host.querySelector('[data-slide-progress]').style.width = ((index + 1) / slides.length * 100) + '%';
        host.querySelector('[data-slide-prev]').disabled = index === 0;
        host.querySelector('[data-slide-next]').disabled = index === slides.length - 1;
        ls(function () { localStorage.setItem(storageKey, String(index)); });
        if (resumeAt >= narration.length) resumeAt = 0;
        syncUI();
      }

      function goTo(i, play) {
        i = Math.max(0, Math.min(slides.length - 1, i));
        var wasPlaying = speech.state === 'playing';
        clearSpeech(); speech.state = 'idle'; speech.pos = 0; resumeAt = 0;
        index = i; render();
        if (play || wasPlaying) speakFrom(0);
        else { awake(false); savePos(); syncUI(); }
      }

      /* ---------------- 交互 ---------------- */
      host.querySelector('[data-slide-prev]').onclick = function () { if (index > 0) goTo(index - 1); };
      host.querySelector('[data-slide-next]').onclick = function () { if (index < slides.length - 1) goTo(index + 1); };
      playBtn.onclick = function () {
        if (speech.state === 'playing') pause();
        else if (speech.state === 'paused') speakFrom(speech.pos);
        else if (speech.state === 'done') { if (index < slides.length - 1) goTo(index + 1, true); else speakFrom(0); }
        else speakFrom(resumeAt || 0);
      };
      replayBtn.onclick = function () { speakFrom(0); };
      autoInput.onchange = function () {
        autoNext = autoInput.checked;
        ls(function () { localStorage.setItem(autoKey, autoNext ? '1' : '0'); });
      };
      rateSelect.onchange = function () {
        if (supportedRates.indexOf(rateSelect.value) === -1) { rateSelect.value = voiceRate; return; }
        voiceRate = rateSelect.value;
        ls(function () { localStorage.setItem(rateKey, voiceRate); });
        if (speech.state === 'playing') speakFrom(speech.pos); // 新语速从当前句生效
      };
      jumpSelect.onchange = function () { goTo(Number(jumpSelect.value) || 0); };
      host.querySelector('[data-slide-progress-bar]').addEventListener('click', function (e) {
        var rect = e.currentTarget.getBoundingClientRect(), frac = (e.clientX - rect.left) / Math.max(1, rect.width);
        if (host.classList.contains('is-rotated')) frac = (e.clientY - rect.top) / Math.max(1, rect.height);
        goTo(Math.floor(frac * slides.length));
      });
      stage.addEventListener('click', function (e) {
        var go = e.target.closest && e.target.closest('[data-slide-goto]');
        if (!go) return;
        var target = go.getAttribute('data-slide-goto'), page = host.closest('.lesson-page') || document;
        if (LQ.screen && LQ.screen.isFullscreen(host)) LQ.screen.exitFullscreen(host);
        pause();
        setTimeout(function () {
          if (target === 'reading') { var btn = page.querySelector('[data-reading-toggle]'); if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click(); var art = page.querySelector('[data-full-reading]'); if (art) art.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          else { var quiz = page.querySelector('[data-quiz]'); if (quiz) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }, 120);
      });
      fullBtn.onclick = function () {
        if (!LQ.screen) return;
        LQ.screen.toggleFullscreen(host).then(syncUI, function () { LQ.ui.toast('当前浏览器无法进入全屏'); });
      };
      rotateBtn.onclick = function () { if (LQ.screen) LQ.screen.toggleLandscape(host).then(syncUI); };
      // 宽屏（或全屏横屏）时文字与图左右并排，窄屏上下排列
      function layoutClass() {
        var w = host.clientWidth, h = host.clientHeight, full = host.classList.contains('is-full');
        host.classList.toggle('is-wide', full ? (w >= 700 && w > h * 1.05) : w >= 980);
      }
      var ro = typeof ResizeObserver === 'function' ? new ResizeObserver(layoutClass) : null;
      if (ro) ro.observe(host); else window.addEventListener('resize', layoutClass);
      var offScreen = LQ.screen ? LQ.screen.onChange(function () {
        var full = LQ.screen.isFullscreen(host);
        host.classList.toggle('is-full', full);
        if (!full) host.classList.remove('is-rotated');
        layoutClass();
        syncUI();
        if (chart) setTimeout(function () { if (chart) chart.resize(); }, 60);
      }) : null;

      // 手机左右滑动文字区域翻页（图表区域的拖动留给图表平移）
      var swipe = null;
      stage.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1 || (e.target.closest && e.target.closest('.lq-chart, .cp-table-wrap'))) { swipe = null; return; }
        swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (!swipe || !e.changedTouches.length) return;
        var dx = e.changedTouches[0].clientX - swipe.x, dy = e.changedTouches[0].clientY - swipe.y;
        if (host.classList.contains('is-rotated')) { var tmp = dx; dx = dy; dy = -tmp; }
        swipe = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
      }, { passive: true });

      host.addEventListener('keydown', function (e) {
        if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
        else if (e.key === ' ' || e.key === 'k') { if (e.target.tagName === 'BUTTON' && e.key === ' ') return; e.preventDefault(); playBtn.click(); }
        else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); replayBtn.click(); }
        else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); fullBtn.click(); }
      });
      function hidden() { if (document.hidden) pause(); }
      document.addEventListener('visibilitychange', hidden);
      render();
      layoutClass();
      return function () {
        destroyed = true; stopAll();
        if (LQ.screen && LQ.screen.isFullscreen(host)) LQ.screen.exitFullscreen(host);
        if (offScreen) offScreen();
        if (ro) ro.disconnect(); else window.removeEventListener('resize', layoutClass);
        if (chart) chart.destroy();
        if (supportsVoice && synth.removeEventListener) synth.removeEventListener('voiceschanged', pickVoice);
        document.removeEventListener('visibilitychange', hidden);
      };
    }
  };
})();
