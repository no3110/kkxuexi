/* Slide player with real course content, chart steps, optional browser narration and cleanup. */
(function () {
  'use strict';
  var esc = LQ.util.escapeHtml;
  function text(value) { var div = document.createElement('div'); div.innerHTML = LQ.inline(value || ''); return div.textContent; }
  function slidesFor(lesson) {
    var slides = [{ title: lesson.title, text: lesson.summary || '', tag: '这节课，先抓住一个重点', bullets: (lesson.outcomes || []).slice(0, 3) }], title = '理解这个知识点';
    (lesson.sections || []).forEach(function (s) {
      if (s.type === 'h') { title = text(s.text); return; }
      if (s.type === 'chart') {
        (s.steps || [{ title: '观察图表', text: s.caption, annotations: s.annotations || [] }]).forEach(function (step) {
          slides.push({ title: step.title || title, text: text(step.text), scenario: s.scenario, annotations: step.annotations || [], focus: step.focus, tag: '看图理解' });
        }); return;
      }
      var content = '', bullets = [], tag = '用自己的话，理解它';
      if (s.type === 'p') content = text(s.text);
      else if (s.type === 'callout') { content = text(s.text); title = s.title || '抓住重点'; tag = s.tone === 'pitfall' || s.tone === 'warn' ? '容易踩的坑' : '记住这一句'; }
      else if (s.type === 'list' || s.type === 'checklist' || s.type === 'flow') bullets = (s.items || []).map(text);
      else if (s.type === 'formula') { content = text(s.text); bullets = s.note ? [text(s.note)] : []; }
      else if (s.type === 'table') bullets = (s.rows || []).map(function (row) { return row.map(text).join(' · '); });
      else if (s.type === 'compare') bullets = [s.left, s.right].filter(Boolean).map(function (col) { return (col.title || '') + '：' + (col.items || []).map(text).join('；'); });
      if (!content && !bullets.length) return;
      var sentences = content.match(/[^。！？]+[。！？]?/g) || [content], chunks = [], chunk = '';
      sentences.forEach(function (part) { if (chunk.length + part.length > 170 && chunk) { chunks.push(chunk); chunk = ''; } chunk += part; });
      if (chunk) chunks.push(chunk);
      if (!chunks.length) chunks.push('');
      chunks.forEach(function (part, i) {
        var lists = i === 0 ? bullets : [];
        if (lists.length > 3) { for (var j = 0; j < lists.length; j += 3) slides.push({ title: title, text: part, bullets: lists.slice(j, j + 3), tag: tag }); }
        else slides.push({ title: title, text: part, bullets: lists, tag: tag });
      });
    });
    slides.push({ title: '轮到你来判断', text: '知识是否学会，看你能不能解释理由。完成下面的理解自测，再到模拟市场里试一次。', tag: '把知识变成自己的判断', bullets: ['先找位置，再找证据', '先定风险，再做选择', '错题回到对应知识点复习'] });
    return slides;
  }
  function candleSVG() {
    return '<svg viewBox="0 0 420 220" class="course-candle" role="img" aria-label="K线示意：最高、最低、开盘、收盘与实体"><g stroke="#243247" stroke-dasharray="4 5"><path d="M20 40H405M20 100H405M20 160H405M20 205H405"/></g><path d="M180 27V197" stroke="#2bb3a3" stroke-width="3"/><rect x="154" y="72" width="52" height="85" fill="#26a69a" rx="3"/><g fill="#c2cede" font-size="13" font-family="sans-serif"><text x="225" y="32">最高 · H</text><text x="225" y="78">收盘 · C</text><text x="225" y="157">开盘 · O</text><text x="225" y="200">最低 · L</text><text x="55" y="120" fill="#7dd3fc">实体</text></g><g stroke="#506078"><path d="M185 28H215M210 73H217M210 155H217M185 197H215M98 115H144"/></g></svg>';
  }
  LQ.coursePlayer = {
    slidesFor: slidesFor,
    mount: function (host, lesson) {
      var slides = slidesFor(lesson), index = 0, playing = false, voicePlaying = false, chart = null, timer = null, destroyed = false, generation = 0;
      var storageKey = 'lq.slide.' + lesson.id, rateKey = 'lq.voice.rate.v1';
      var supportedRates = ['0.8', '1', '1.25', '1.5', '2'];
      var voiceRate = '1.25';
      try { index = Math.min(slides.length - 1, Math.max(0, Number(localStorage.getItem(storageKey)) || 0)); } catch (_) {}
      try {
        var storedRate = localStorage.getItem(rateKey);
        if (supportedRates.indexOf(storedRate) !== -1) voiceRate = storedRate;
      } catch (_) {}
      host.className = 'course-player'; host.tabIndex = 0;
      host.innerHTML = '<div class="course-player-head"><span>◈ 分镜课件</span><span>一屏一个重点 · 可听可看</span></div><div class="course-stage" data-slide-stage></div>' +
        '<div class="course-progress"><span data-slide-progress></span></div><div class="course-player-controls"><button type="button" class="btn btn-sm btn-outline" data-slide-prev aria-label="上一页课件">← 上一页</button>' +
        '<button type="button" class="btn btn-sm btn-primary" data-slide-play>▶ 自动播放 · 连续讲解</button><button type="button" class="btn btn-sm btn-outline" data-slide-next aria-label="下一页课件">下一页 →</button>' +
        '<span data-slide-count></span><button class="btn btn-sm btn-outline" type="button" data-slide-voice>▶ 播放讲解</button>' +
        '<label class="course-voice-rate"><span>语速</span><select data-slide-rate aria-label="语音讲解速度"><option value="0.8">0.8×</option><option value="1">1.0×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2.0×</option></select></label>' +
        '<button class="btn btn-sm btn-ghost" type="button" data-slide-full>全屏</button></div><p class="course-player-note">课件播放可用 ← → 翻页。语速影响语音讲解；音色和可用速度由浏览器决定。</p>';
      var stage = host.querySelector('[data-slide-stage]'), voice = host.querySelector('[data-slide-voice]'), rateSelect = host.querySelector('[data-slide-rate]');
      rateSelect.value = voiceRate;
      var supportsVoice = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
      if (!supportsVoice) { voice.disabled = true; rateSelect.disabled = true; voice.title = '当前浏览器不支持语音讲解'; }
      function syncVoiceButton() {
        voice.textContent = voicePlaying ? 'Ⅱ 暂停讲解' : '▶ 播放讲解';
        voice.setAttribute('aria-pressed', voicePlaying ? 'true' : 'false');
      }
      function stopNarration() {
        generation++; clearTimeout(timer); timer = null; voicePlaying = false;
        if (supportsVoice) window.speechSynthesis.cancel();
        syncVoiceButton();
      }
      function pauseAutoplay() {
        playing = false; clearTimeout(timer); timer = null; stopNarration();
        host.querySelector('[data-slide-play]').textContent = '▶ 自动播放 · 连续讲解';
      }
      function playSlideSpeech(autoContinue) {
        if (!supportsVoice || destroyed) {
          if (autoContinue && playing && !destroyed) {
            var current = slides[index], plain = [current.title, text(current.text)].concat(current.bullets || []).join('。');
            timer = setTimeout(function () { advanceAutoplay(); }, Math.max(6000, Math.min(24000, plain.length * 120)));
          }
          return;
        }
        generation++; clearTimeout(timer); window.speechSynthesis.cancel();
        var token = generation, slide = slides[index];
        var narration = [slide.title, text(slide.text)].concat((slide.bullets || []).map(text)).join('。');
        voicePlaying = true; syncVoiceButton();
        var utterance = new SpeechSynthesisUtterance(narration);
        utterance.lang = 'zh-CN'; utterance.rate = Number(rateSelect.value);
        utterance.onend = function () {
          if (token !== generation || destroyed) return;
          voicePlaying = false; syncVoiceButton();
          if (autoContinue && playing) advanceAutoplay();
        };
        utterance.onerror = function () {
          if (token !== generation) return;
          voicePlaying = false; syncVoiceButton();
          if (autoContinue && playing) pauseAutoplay();
          LQ.ui.toast('语音暂不可用，请重新播放或继续翻页。');
        };
        window.speechSynthesis.speak(utterance);
      }
      function advanceAutoplay() {
        if (!playing || destroyed) return;
        if (index >= slides.length - 1) { pauseAutoplay(); return; }
        index++; render();
      }
      function scheduleAutoplay() { if (playing) playSlideSpeech(true); }
      function render() {
        if (destroyed) return;
        if (chart) { chart.destroy(); chart = null; }
        var s = slides[index];
        stage.innerHTML = '<div class="course-slide-copy"><div class="course-slide-tag">' + esc(s.tag) + '</div><h2>' + esc(s.title) + '</h2>' +
          (s.text ? '<p>' + esc(s.text) + '</p>' : '') + (s.bullets && s.bullets.length ? '<ul>' + s.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') + '</div>' +
          '<div class="course-slide-visual">' + (s.scenario ? '<div data-slide-chart></div>' : (lesson.id === 'm00-02' ? candleSVG() : '<div class="course-key-number">' + String(index + 1).padStart(2, '0') + '</div><span class="course-visual-label">' + esc(lesson.moduleTitle || '理解 · 观察 · 实践') + '</span>')) + '</div>';
        stage.classList.toggle('has-chart', !!s.scenario);
        if (s.scenario) {
          var sc = LQ.data.getScenario(s.scenario);
          chart = LQ.chart.create(stage.querySelector('[data-slide-chart]'), { scenario: sc, height: 350, annotations: s.annotations, tools: true, viewport: s.focus });
        }
        host.querySelector('[data-slide-count]').textContent = (index + 1) + ' / ' + slides.length;
        host.querySelector('[data-slide-progress]').style.width = ((index + 1) / slides.length * 100) + '%';
        host.querySelector('[data-slide-prev]').disabled = index === 0;
        host.querySelector('[data-slide-next]').disabled = index === slides.length - 1;
        try { localStorage.setItem(storageKey, String(index)); } catch (_) {}
        syncVoiceButton();
        scheduleAutoplay();
      }
      host.querySelector('[data-slide-prev]').onclick = function () { if (index > 0) { stopNarration(); index--; render(); } };
      host.querySelector('[data-slide-next]').onclick = function () { if (index < slides.length - 1) { stopNarration(); index++; render(); } };
      host.querySelector('[data-slide-play]').onclick = function () {
        if (playing) pauseAutoplay();
        else { playing = true; host.querySelector('[data-slide-play]').textContent = 'Ⅱ 暂停'; scheduleAutoplay(); }
      };
      voice.onclick = function () {
        if (voicePlaying) { if (playing) pauseAutoplay(); else stopNarration(); }
        else { if (playing) pauseAutoplay(); playSlideSpeech(false); }
      };
      rateSelect.onchange = function () {
        if (supportedRates.indexOf(rateSelect.value) === -1) { rateSelect.value = voiceRate; return; }
        voiceRate = rateSelect.value;
        try { localStorage.setItem(rateKey, voiceRate); } catch (_) {}
        if (voicePlaying) playSlideSpeech(playing);
      };
      host.querySelector('[data-slide-full]').onclick = async function () { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (host.requestFullscreen) await host.requestFullscreen(); } catch (_) { LQ.ui.toast('当前浏览器无法进入全屏'); } };
      host.addEventListener('keydown', function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight') { e.preventDefault(); host.querySelector('[data-slide-next]').click(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); host.querySelector('[data-slide-prev]').click(); } });
      function hidden() { if (document.hidden) pauseAutoplay(); }
      document.addEventListener('visibilitychange', hidden); render();
      return function () { destroyed = true; pauseAutoplay(); if (chart) chart.destroy(); document.removeEventListener('visibilitychange', hidden); };
    }
  };
})();
