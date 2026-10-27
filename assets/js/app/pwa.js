/* Offline support (V3)
 * - 只在 http(s) 下注册 Service Worker；file:// 双击打开时静默跳过（不报错、不写 __LQ_ERRORS__）
 * - 保留静态资源离线缓存，不显示站点内的安装入口或安装提示
 * - 在线/离线状态监听 + toast 提示
 * - 暴露 LQ.pwa 供 QA 检查（supported / registered）
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var PROTOCOL = (global.location && global.location.protocol) || '';
  var HTTP = PROTOCOL === 'http:' || PROTOCOL === 'https:';
  var pwa = {
    supported: !!global.navigator && 'serviceWorker' in global.navigator,
    http: HTTP,
    registered: false,
    registerError: null,
    clear: function () {
      try { if (global.navigator && global.navigator.serviceWorker) { /* 只做只读查询，不注销 */ } } catch (err) { /* ignore */ }
    }
  };

  function registerServiceWorker() {
    if (!HTTP || !pwa.supported) return;
    try {
      global.navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then(function (registration) {
        pwa.registered = true;
        pwa.scope = registration && registration.scope ? registration.scope : './';
        try { document.body.setAttribute('data-pwa', 'registered'); } catch (err) { /* ignore */ }
        if (registration && registration.waiting && registration.waiting.postMessage) {
          try { registration.waiting.postMessage('SKIP_WAITING'); } catch (err) { /* ignore */ }
        }
        // 新版本接管后提示刷新（不强制刷新，避免打断答题）
        if (registration && registration.addEventListener) {
          registration.addEventListener('updatefound', function () {
            var installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', function () {
              if (installing.state === 'installed' && global.navigator.serviceWorker.controller) {
                LQ.ui.toast('学习系统已更新，刷新页面即可使用新版本');
              }
            });
          });
        }
      }).catch(function (err) {
        pwa.registerError = String(err && err.message ? err.message : err);
        // 注册失败不打扰用户：http 下可能不是 https/localhost；不写入 __LQ_ERRORS__
        try { document.body.setAttribute('data-pwa', 'failed'); } catch (e2) { /* ignore */ }
      });
    } catch (err) {
      pwa.registerError = String(err && err.message ? err.message : err);
    }
  }

  function suppressInstallPrompt() {
    global.addEventListener('beforeinstallprompt', function (event) {
      try { event.preventDefault(); } catch (err) { /* ignore */ }
    });
  }

  function bindOnlineOffline() {
    global.addEventListener('offline', function () {
      LQ.ui.toast('已离线：已缓存的页面与课程仍可继续学习', 'bad');
      try { document.body.setAttribute('data-online', 'false'); } catch (err) { /* ignore */ }
    });
    global.addEventListener('online', function () {
      LQ.ui.toast('网络已恢复');
      try { document.body.setAttribute('data-online', 'true'); } catch (err) { /* ignore */ }
    });
  }

  function init() {
    if (LQ.ui && LQ.ui.icon) { /* 图标可用性检查，无副作用 */ }
    if (!HTTP) {
      // file:// 双击打开：静默跳过全部 PWA 逻辑
      try { if (document.body) document.body.setAttribute('data-pwa', 'file'); } catch (err) { /* ignore */ }
      return;
    }
    try { document.body.setAttribute('data-pwa', 'pending'); } catch (err) { /* ignore */ }
    suppressInstallPrompt();
    bindOnlineOffline();
    try { document.body.setAttribute('data-online', global.navigator && global.navigator.onLine === false ? 'false' : 'true'); } catch (err) { /* ignore */ }
    if (global.document && global.document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      global.addEventListener('load', registerServiceWorker);
    }
  }

  LQ.pwa = pwa;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
