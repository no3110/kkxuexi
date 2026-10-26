/* 安全的行内标记渲染（Lead 维护 · 冻结）
 * 支持：**加粗**、`代码`、[文字](https?://...)或(#/...)；先转义再还原标记，禁止原始 HTML。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  function renderLink(match, label, href) {
    var safeLabel = label; // 已在 escapeHtml 之后
    var isInternal = href.indexOf('#/') === 0;
    if (isInternal) {
      return '<a class="inline-link" href="' + href + '">' + safeLabel + '</a>';
    }
    return '<a class="inline-link" href="' + href + '" target="_blank" rel="noopener noreferrer">' + safeLabel + '</a>';
  }

  LQ.inline = function (text) {
    if (text === null || text === undefined) return '';
    var html = LQ.util.escapeHtml(text);
    // 行内链接（URL 仅允许 http(s) 或站内 hash）
    html = html.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|#\/[^\s)]+)\)/g, renderLink);
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    return html;
  };
})(typeof window !== 'undefined' ? window : globalThis);
