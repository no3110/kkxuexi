/* PWA 支持（site-engineer 维护 · V2）
 * - 只在 http(s) 下注册 Service Worker；file:// 双击打开时静默跳过（不报错、不写 __LQ_ERRORS__）
 * - beforeinstallprompt 时显示「安装到桌面」按钮（用户可关闭；安装成功后自动隐藏）
 * - 在线/离线状态监听 + toast 提示
 * - 暴露 LQ.pwa 供 QA 检查（supported / registered / installAvailable / isStandalone / promptInstall）
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var PROTOCOL = (global.location && global.location.protocol) || '';
  var HTTP = PROTOCOL === 'http:' || PROTOCOL === 'https:';
  var deferredPrompt = null;
  var installBtn = null;
  var registered = false;

  var pwa = {
    supported: !!global.navigator && 'serviceWorker' in global.navigator,
    http: HTTP,
    registered: false,
    registerError: null,
    installAvailable: false,
    prompted: false,
    isStandalone: function () {
      try {
        if (global.navigator && global.navigator.standalone) return true;
        return !!(global.matchMedia && global.matchMedia('(display-mode: standalone)').matches);
      } catch (err) { return false; }
    },
    promptInstall: function () {
      if (!deferredPrompt) return false;
      var prompt = deferredPrompt;
      deferredPrompt = null;
      pwa.installAvailable = false;
      try {
        prompt.prompt();
        if (prompt.userChoice && typeof prompt.userChoice.then === 'function') {
          prompt.userChoice.then(function (choice) {
            if (choice && choice.outcome === 'accepted') {
              LQ.ui.toast('正在安装到桌面…');
              hideInstallButton();
            } else {
              LQ.ui.toast('已取消安装，可稍后再试');
            }
          }).catch(function () { /* ignore */ });
        }
      } catch (err) { /* ignore */ }
      return true;
    },
    clear: function () {
      try { if (global.navigator && global.navigator.serviceWorker) { /* 只做只读查询，不注销 */ } } catch (err) { /* ignore */ }
    }
  };

  function hideInstallButton() {
    if (installBtn && installBtn.parentNode) installBtn.parentNode.removeChild(installBtn);
    installBtn = null;
    pwa.installAvailable = false;
  }

  function showInstallButton() {
    if (installBtn || !document.body) return;
    installBtn = document.createElement('button');
    installBtn.type = 'button';
    installBtn.id = 'pwa-install';
    installBtn.className = 'pwa-install-btn';
    installBtn.innerHTML = '<span class="pwa-install-icon">' + (LQ.ui ? LQ.ui.icon('spark') : '') + '</span>' +
      '<span class="pwa-install-text">安装到桌面</span>' +
      '<span class="pwa-install-close" role="button" aria-label="稍后安装" tabindex="0">×</span>';
    installBtn.addEventListener('click', function (event) {
      var isClose = event.target && event.target.closest && event.target.closest('.pwa-install-close');
      if (isClose) {
        hideInstallButton();
        return;
      }
      pwa.promptInstall();
    });
    document.body.appendChild(installBtn);
  }

  function registerServiceWorker() {
    if (!HTTP || !pwa.supported) return;
    try {
      global.navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (registration) {
        registered = true;
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

  function bindInstallPrompt() {
    global.addEventListener('beforeinstallprompt', function (event) {
      try { event.preventDefault(); } catch (err) { /* ignore */ }
      deferredPrompt = event;
      pwa.installAvailable = true;
      if (!pwa.isStandalone()) showInstallButton();
    });
    global.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      pwa.installAvailable = false;
      hideInstallButton();
      LQ.ui.toast('已安装到桌面，可离线使用');
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
    bindInstallPrompt();
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
