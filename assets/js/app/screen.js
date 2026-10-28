/* 屏幕工具（site-engineer 维护）
 *   LQ.screen.keepAwake(reason, on)   讲解 / 全屏期间保持屏幕常亮（Wake Lock API，页面切回前台自动重新申请）
 *   LQ.screen.toggleFullscreen(el)    原生全屏；iPhone 等不支持元素全屏时用“铺满窗口”兜底
 *   LQ.screen.isFullscreen(el)
 *   LQ.screen.toggleLandscape(el)     全屏后横屏查看：优先锁定屏幕方向，不支持时把内容旋转 90°
 *   LQ.screen.onChange(fn)            全屏 / 横屏状态变化回调，返回取消函数
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var doc = global.document;
  var nav = global.navigator || {};
  var listeners = [];
  var reasons = {};
  var sentinel = null;
  var requesting = false;
  var pseudoEl = null;
  var locked = false;

  function notify() {
    listeners.slice().forEach(function (fn) { try { fn(); } catch (_) { /* ignore */ } });
  }

  /* ---------------- 屏幕常亮 ---------------- */
  function wantAwake() { return Object.keys(reasons).length > 0; }

  function requestWake() {
    if (!('wakeLock' in nav) || sentinel || requesting || !wantAwake() || doc.visibilityState !== 'visible') return;
    requesting = true;
    nav.wakeLock.request('screen').then(function (s) {
      requesting = false;
      if (!wantAwake()) { s.release().catch(function () {}); return; }
      sentinel = s;
      s.addEventListener('release', function () { if (sentinel === s) sentinel = null; });
    }).catch(function () { requesting = false; });
  }

  function releaseWake() {
    if (sentinel) { var s = sentinel; sentinel = null; s.release().catch(function () {}); }
  }

  function keepAwake(reason, on) {
    if (on) reasons[reason] = true;
    else delete reasons[reason];
    if (wantAwake()) requestWake();
    else releaseWake();
  }

  doc.addEventListener('visibilitychange', function () {
    // 系统在页面隐藏时会自动释放常亮锁，回到前台需要重新申请
    if (doc.visibilityState === 'visible') requestWake();
  });

  /* ---------------- 全屏 ---------------- */
  function nativeElement() { return doc.fullscreenElement || doc.webkitFullscreenElement || null; }

  function isFullscreen(el) {
    if (!el) return !!(nativeElement() || pseudoEl);
    return nativeElement() === el || pseudoEl === el;
  }

  function isPortrait() { return (global.innerHeight || 0) > (global.innerWidth || 0); }
  function isTouch() { return !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches); }

  function enterPseudo(el) {
    pseudoEl = el;
    el.classList.add('is-pseudo-full');
    doc.documentElement.classList.add('lq-scroll-lock');
    keepAwake('fullscreen', true);
    notify();
  }

  function cleanup(el) {
    if (el) el.classList.remove('is-rotated', 'is-pseudo-full');
    if (pseudoEl === el) pseudoEl = null;
    if (!pseudoEl) doc.documentElement.classList.remove('lq-scroll-lock');
    if (locked && global.screen && global.screen.orientation && global.screen.orientation.unlock) {
      try { global.screen.orientation.unlock(); } catch (_) { /* ignore */ }
    }
    locked = false;
    keepAwake('fullscreen', false);
  }

  function enter(el) {
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { enterPseudo(el); return Promise.resolve(); }
    var result;
    try { result = req.call(el, { navigationUI: 'hide' }); } catch (_) { enterPseudo(el); return Promise.resolve(); }
    // 部分内嵌浏览器 / WebView 的全屏请求既不成功也不报错：超时后改用“铺满窗口”
    var settled = false;
    var timeout = new Promise(function (resolve) { setTimeout(function () { if (!settled) resolve('timeout'); }, 1200); });
    return Promise.race([Promise.resolve(result).then(function () { return 'ok'; }), timeout]).then(function (how) {
      settled = true;
      if (how === 'timeout' || nativeElement() !== el) { if (nativeElement() !== el) enterPseudo(el); return; }
      keepAwake('fullscreen', true);
      // 手机竖屏进入全屏时，默认尝试切到横屏（Android Chrome 支持；其余浏览器静默失败）
      if (isTouch() && isPortrait()) lockLandscape().catch(function () {});
      notify();
    }).catch(function () { settled = true; enterPseudo(el); });
  }

  function exit(el) {
    var active = nativeElement();
    if (active) {
      var fn = doc.exitFullscreen || doc.webkitExitFullscreen;
      cleanup(active);
      try { var r = fn && fn.call(doc); if (r && r.catch) r.catch(function () {}); } catch (_) { /* ignore */ }
    }
    if (pseudoEl) cleanup(pseudoEl);
    if (el) cleanup(el);
    notify();
    return Promise.resolve();
  }

  function toggleFullscreen(el) {
    if (!el) return Promise.resolve();
    return isFullscreen(el) ? exit(el) : enter(el);
  }

  function onNativeChange() {
    // 用户按 Esc / 系统返回键退出全屏时，同步清理横屏与常亮状态
    if (!nativeElement()) {
      Array.prototype.forEach.call(doc.querySelectorAll('.is-rotated'), function (node) {
        if (node !== pseudoEl) node.classList.remove('is-rotated');
      });
      if (!pseudoEl) { locked = false; keepAwake('fullscreen', false); }
    }
    notify();
  }
  doc.addEventListener('fullscreenchange', onNativeChange);
  doc.addEventListener('webkitfullscreenchange', onNativeChange);

  /* ---------------- 横屏 ---------------- */
  function lockLandscape() {
    var o = global.screen && global.screen.orientation;
    if (!o || typeof o.lock !== 'function') return Promise.reject(new Error('unsupported'));
    return o.lock('landscape').then(function () { locked = true; notify(); });
  }

  function isLandscape(el) {
    if (el && el.classList.contains('is-rotated')) return true;
    return !isPortrait();
  }

  function toggleLandscape(el) {
    if (!el) return Promise.resolve();
    if (!isFullscreen(el)) return enter(el).then(function () { if (isPortrait()) return toggleLandscape(el); });
    if (el.classList.contains('is-rotated')) { el.classList.remove('is-rotated'); notify(); return Promise.resolve(); }
    if (locked) {
      try { global.screen.orientation.unlock(); } catch (_) { /* ignore */ }
      locked = false; notify();
      return Promise.resolve();
    }
    if (!isPortrait()) return Promise.resolve();
    return lockLandscape().catch(function () {
      // iPhone / iPad Safari 等无法锁定方向：把内容旋转 90°，横着拿手机即可。
      // 原生全屏元素不允许 CSS 旋转，先换成“铺满窗口”模式再旋转。
      if (nativeElement() === el) {
        var fn = doc.exitFullscreen || doc.webkitExitFullscreen;
        try { var r = fn && fn.call(doc); if (r && r.catch) r.catch(function () {}); } catch (_) { /* ignore */ }
        enterPseudo(el);
      }
      el.classList.add('is-rotated');
      notify();
    });
  }

  global.addEventListener('resize', function () {
    // 用户真的把手机横过来了，就不需要再用 CSS 旋转
    if (!isPortrait()) {
      var rotated = doc.querySelectorAll('.is-rotated');
      if (rotated.length) { Array.prototype.forEach.call(rotated, function (n) { n.classList.remove('is-rotated'); }); notify(); }
    }
  });

  /* 给一个图表区块接上“全屏 / 横屏”按钮：全屏时图表高度铺满 fill 容器，退出后恢复原高度
   * opts: { root, fill, button, rotateButton, getChart, height, tools } -> cleanup() */
  function bindChartFullscreen(opts) {
    if (!opts || !opts.root || !opts.button) return function () {};
    var root = opts.root, raf = global.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    function apply() {
      var full = isFullscreen(root);
      root.classList.toggle('is-full', full);
      if (!full) root.classList.remove('is-rotated');
      opts.button.textContent = full ? '✕ 退出全屏' : '⛶ 全屏';
      if (opts.rotateButton) {
        opts.rotateButton.hidden = !(full && isTouch());
        opts.rotateButton.textContent = root.classList.contains('is-rotated') ? '⟳ 竖屏' : '⟳ 横屏';
      }
      raf(function () {
        var chart = opts.getChart && opts.getChart();
        if (!chart || typeof chart.setHeight !== 'function') return;
        if (full && opts.fill) chart.setHeight(Math.max(260, opts.fill.clientHeight - (opts.tools ? 48 : 0)));
        else chart.setHeight(opts.height);
      });
    }
    function onResize() { if (isFullscreen(root)) apply(); }
    opts.button.addEventListener('click', function () { toggleFullscreen(root).then(apply); });
    if (opts.rotateButton) opts.rotateButton.addEventListener('click', function () { toggleLandscape(root).then(apply); });
    var off = LQ.screen.onChange(apply);
    global.addEventListener('resize', onResize);
    return function () {
      off(); global.removeEventListener('resize', onResize);
      if (isFullscreen(root)) exit(root);
    };
  }

  LQ.screen = {
    bindChartFullscreen: bindChartFullscreen,
    keepAwake: keepAwake,
    wakeSupported: function () { return 'wakeLock' in nav; },
    isFullscreen: isFullscreen,
    toggleFullscreen: toggleFullscreen,
    exitFullscreen: exit,
    toggleLandscape: toggleLandscape,
    isLandscape: isLandscape,
    isTouch: isTouch,
    onChange: function (fn) {
      listeners.push(fn);
      return function () { var i = listeners.indexOf(fn); if (i !== -1) listeners.splice(i, 1); };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
