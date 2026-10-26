/* Service Worker（site-engineer 维护 · V2）
 * 目标：PWA 离线可用
 *  - 版本化缓存壳资源（index.html / css / js / manifest / icons / 课程与图表脚本）
 *  - 只处理同源 GET 请求；外部链接（Yahoo Finance 等）不缓存
 *  - cache-first + 运行时补缓存；导航请求离线时回退到缓存的 index.html
 *  - install 时逐项 cache.add 容错（新增文件尚未生成也不会导致安装失败）
 *  - skipWaiting + clients.claim，新版本立即接管
 */
'use strict';

var CACHE_VERSION = 'lq-shell-v2.0.0';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/main.css',
  './assets/css/pages.css',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/js/core/namespace.js',
  './assets/js/core/inline.js',
  './assets/js/core/store.js',
  './assets/js/data/generator.js',
  './assets/js/data/registry.js',
  './assets/js/data/real/nq-gc.js',
  './assets/js/data/scenarios/demo.js',
  './assets/js/content/m01-dow.js',
  './assets/js/content/m02-pa.js',
  './assets/js/content/m03-ict-smc.js',
  './assets/js/content/m04-orderflow.js',
  './assets/js/content/m05-wyckoff.js',
  './assets/js/content/m06-atr-risk.js',
  './assets/js/content/m07-integration.js',
  './assets/js/content/m08-auction.js',
  './assets/js/content/m09-real-cases.js',
  './assets/js/content/exam-bank.js',
  './assets/js/chart/indicators.js',
  './assets/js/chart/overlays.js',
  './assets/js/chart/panels.js',
  './assets/js/chart/engine.js',
  './assets/js/chart/chart.js',
  './assets/js/app/errors.js',
  './assets/js/app/catalog.js',
  './assets/js/app/ui.js',
  './assets/js/app/router.js',
  './assets/js/app/search.js',
  './assets/js/app/pwa.js',
  './assets/js/app/app.js',
  './assets/js/app/pages/home.js',
  './assets/js/app/pages/roadmap.js',
  './assets/js/app/pages/plan.js',
  './assets/js/app/pages/module.js',
  './assets/js/app/pages/lesson.js',
  './assets/js/app/pages/exam.js',
  './assets/js/app/pages/real.js',
  './assets/js/app/pages/tools.js',
  './assets/js/app/pages/glossary.js',
  './assets/js/app/pages/references.js',
  './assets/js/app/pages/notfound.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // 逐项缓存：任一文件不存在（并行开发期）不阻断安装
      return Promise.all(SHELL.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION) return caches.delete(key);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event && event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isCacheable(request) {
  if (!request || request.method !== 'GET') return false;
  var url;
  try { url = new URL(request.url); } catch (err) { return false; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.origin !== self.location.origin) return false; // 外部链接不缓存
  if (request.headers && (request.headers.get('range') || request.headers.get('accept') === 'text/event-stream')) return false;
  return true;
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (!isCacheable(request)) return; // 交给浏览器默认处理（不缓存外部请求）

  var isNavigation = request.mode === 'navigate';

  event.respondWith(
    caches.match(request, { ignoreSearch: false }).then(function (cached) {
      if (cached) {
        // cache-first；后台顺带更新（不阻塞响应）
        if (!isNavigation) {
          fetch(request).then(function (response) {
            if (response && response.ok) caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, response.clone()); });
          }).catch(function () { /* 离线忽略 */ });
        }
        return cached;
      }
      return fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); }).catch(function () { /* ignore */ });
        }
        return response;
      }).catch(function (err) {
        if (isNavigation) {
          return caches.match('./index.html').then(function (fallback) {
            if (fallback) return fallback;
            return new Response('离线状态且尚未缓存页面，请联网后刷新。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
        }
        return new Response('离线', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      });
    })
  );
});
