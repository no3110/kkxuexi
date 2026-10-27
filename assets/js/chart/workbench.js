/* Precise drawing and streaming extensions shared by lessons and the simulator. */
(function () {
  'use strict';
  var E = LQ.chart.Engine.prototype, H = LQ.chart.helpers, O = LQ.chart.overlays;
  var original = { draft: E._makeDraft, down: E._onPointerDown, move: E._onPointerMove, up: E._onPointerUp,
    finalize: E._finalizeToolDraw, cancel: E._cancelDraft, key: E._onKeyDown, toolbar: E._buildToolbar,
    panes: E._drawPanes, setTool: E._setTool, draw: E._draw };
  function distance(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
    var t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  function point(engine, bar, price) { return { x: engine.xOfBar(bar), y: engine.yOfPrice(price) }; }
  function setSelection(engine, selection) {
    engine.selection = selection;
    var callback = engine.options.onSelectionChange;
    if (typeof callback === 'function') callback(selection ? JSON.parse(JSON.stringify(selection)) : null);
    engine._invalidate();
  }
  E._drawingHit = function (pos) {
    var threshold = 9;
    for (var i = this.drawings.length - 1; i >= 0; i--) {
      var d = this.drawings[i], p1, p2, dist, handle;
      if (!d) continue;
      if (d.kind === 'hline' || d.kind === 'vpline') {
        var y = this.yOfPrice(d.y);
        if (Math.abs(pos.y - y) <= threshold && pos.x >= this.plot.x && pos.x <= this.plot.right) return { type: 'drawing', index: i, handle: 'body' };
      } else if (d.kind === 'marker' || d.kind === 'text') {
        p1 = point(this, d.x, d.y);
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) <= threshold + 3) return { type: 'drawing', index: i, handle: 'body' };
      } else if (d.kind === 'zone') {
        var left = this.xOfBar(d.x1), right = this.xOfBar(d.x2), top = this.yOfPrice(Math.max(d.y1, d.y2)), bottom = this.yOfPrice(Math.min(d.y1, d.y2));
        if (pos.x >= Math.min(left, right) - threshold && pos.x <= Math.max(left, right) + threshold && pos.y >= top - threshold && pos.y <= bottom + threshold) {
          var cornerA = Math.hypot(pos.x - left, pos.y - this.yOfPrice(d.y1)), cornerB = Math.hypot(pos.x - right, pos.y - this.yOfPrice(d.y2));
          return { type: 'drawing', index: i, handle: cornerA < threshold + 4 ? 'a' : cornerB < threshold + 4 ? 'b' : 'body' };
        }
      } else if (['segment', 'fib', 'range'].indexOf(d.kind) >= 0 && typeof d.x1 === 'number' && typeof d.x2 === 'number') {
        p1 = point(this, d.x1, d.y1 === undefined ? d.y : d.y1); p2 = point(this, d.x2, d.y2 === undefined ? d.y : d.y2);
        if (Math.hypot(pos.x - p1.x, pos.y - p1.y) <= threshold + 4) handle = 'a';
        else if (Math.hypot(pos.x - p2.x, pos.y - p2.y) <= threshold + 4) handle = 'b';
        else if (distance(pos.x, pos.y, p1.x, p1.y, p2.x, p2.y) <= threshold) handle = 'body';
        if (handle) return { type: 'drawing', index: i, handle: handle };
      } else if (d.kind === 'vprofile' && pos.x >= this.xOfBar(d.x1) - threshold && pos.x <= this.xOfBar(d.x2) + threshold && pos.y >= this.plot.y && pos.y <= this.plot.bottom) {
        return { type: 'drawing', index: i, handle: 'body' };
      }
    }
    return null;
  };
  E._annotationHit = function (pos) {
    for (var i = this.anns.length - 1; i >= 0; i--) {
      var ann = this.anns[i], raw = ann && ann.raw;
      if (!raw || !raw.editable || ann.kind !== 'hline') continue;
      if (pos.x >= this.plot.x && pos.x <= this.plot.right && Math.abs(pos.y - this.yOfPrice(ann.y)) <= 9) {
        return { type: 'annotation', index: i, concept: raw.editable };
      }
    }
    return null;
  };
  E._editPointerDown = function (e, pos) {
    if (!this.options.drawingEdit || this.tool || pos.x < this.plot.x || pos.x > this.plot.right || pos.y < this.plot.y || pos.y > this.plot.bottom) return false;
    var hit = this._annotationHit(pos) || this._drawingHit(pos);
    if (!hit) { setSelection(this, null); return false; }
    this.selection = hit;
    this.editDrag = { id: e.pointerId, startX: pos.x, startY: pos.y, startBar: this._barAtX(pos.x), startPrice: this.priceAtY(pos.y),
      original: hit.type === 'drawing' ? JSON.parse(JSON.stringify(this.drawings[hit.index])) : JSON.parse(JSON.stringify(this.annRaw[hit.index])) };
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    setSelection(this, hit); return true;
  };
  E._editPointerMove = function (pos) {
    var drag = this.editDrag, hit = this.selection;
    if (!drag || !hit) return false;
    var bar = Math.round(this._barAtX(pos.x)), price = this.priceAtY(Math.max(this.plot.y, Math.min(this.plot.bottom, pos.y)));
    var tick = this.scenario && Number(this.scenario.tick) || 0;
    if (tick > 0) price = Number((Math.round(price / tick) * tick).toFixed(6));
    var dx = bar - drag.startBar, dy = price - drag.startPrice, raw = JSON.parse(JSON.stringify(drag.original));
    if (hit.type === 'annotation') {
      raw.y = price;
      if (raw.editable === 'stop') raw.label = '止损 ' + price.toFixed(2);
      if (raw.editable === 'target') raw.label = '止盈 ' + price.toFixed(2);
      this.annRaw[hit.index] = raw; this.anns = O.resolve(this.annRaw, this.scenario);
    } else if (raw.kind === 'hline' || raw.kind === 'vpline') raw.y += dy;
    else if (raw.kind === 'marker' || raw.kind === 'text') { raw.x += dx; raw.y += dy; }
    else if (raw.kind === 'zone') {
      if (hit.handle === 'a') { raw.x1 = bar; raw.y1 = price; }
      else if (hit.handle === 'b') { raw.x2 = bar; raw.y2 = price; }
      else { raw.x1 += dx; raw.x2 += dx; raw.y1 += dy; raw.y2 += dy; }
      if (raw.x1 > raw.x2) { var tx = raw.x1; raw.x1 = raw.x2; raw.x2 = tx; }
    } else if (['segment', 'fib', 'range'].indexOf(raw.kind) >= 0) {
      if (hit.handle === 'a') { raw.x1 = bar; raw.y1 = price; }
      else if (hit.handle === 'b') { raw.x2 = bar; raw.y2 = price; }
      else { raw.x1 += dx; raw.x2 += dx; raw.y1 += dy; raw.y2 += dy; }
    } else if (raw.kind === 'vprofile') { raw.x1 += dx; raw.x2 += dx; }
    if (hit.type === 'drawing') {
      this.drawings[hit.index] = raw;
      this._drawingsDirty = true;
    }
    this._invalidate(); return true;
  };
  E._draw = function () {
    if (this._drawingsDirty) {
      this.drawingAnns = O.resolve(this.drawings, this.scenario);
      this._drawingsDirty = false;
    }
    if (this.replayPreview && Number.isInteger(this.replayPreview.barIndex)) {
      this.trailingBars = this.replayPreview.barIndex >= this.bars.length && this.view && this.view.to >= this.bars.length - 2 ? 1 : 0;
    } else if (!this.replayPreview) this.trailingBars = 0;
    original.draw.call(this);
    if (this.replayPreview && this.ctx && this.view && this.view.to >= this.bars.length - 2) {
      var preview = this.replayPreview;
      var previewIndex = Number.isInteger(preview.barIndex) ? preview.barIndex : Math.round(this.view.to + 1);
      var px = this.xOfBar(previewIndex);
      var top = this.yOfPrice(preview.h), bottom = this.yOfPrice(preview.l), openY = this.yOfPrice(preview.o), closeY = this.yOfPrice(preview.c);
      var bodyWidth = H.clamp(this.barW * 0.68, 2, 18), color = preview.c >= preview.o ? '#2ea88f' : '#e0554f';
      var ctxPreview = this.ctx;
      ctxPreview.save(); ctxPreview.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
      ctxPreview.beginPath(); ctxPreview.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h); ctxPreview.clip();
      ctxPreview.strokeStyle = color; ctxPreview.fillStyle = color; ctxPreview.lineWidth = 1.25;
      ctxPreview.beginPath(); ctxPreview.moveTo(Math.round(px) + 0.5, top); ctxPreview.lineTo(Math.round(px) + 0.5, bottom); ctxPreview.stroke();
      ctxPreview.fillRect(px - bodyWidth / 2, Math.min(openY, closeY), bodyWidth, Math.max(1, Math.abs(closeY - openY)));
      ctxPreview.font = '9px ' + LQ.chart.fonts.mono; ctxPreview.textAlign = 'right'; ctxPreview.textBaseline = 'top'; ctxPreview.fillStyle = '#d6e1eb';
      ctxPreview.fillText('形成中 ' + (preview.progressPct || 0) + '%', this.plot.right - 6, this.plot.y + 5);
      ctxPreview.restore();
    }
    if (!this.selection || !this.ctx) return;
    var d = this.selection.type === 'drawing' ? this.drawings[this.selection.index] : null;
    var pts = [], ctx = this.ctx;
    if (this.selection.type === 'annotation') {
      var raw = this.annRaw && this.annRaw[this.selection.index];
      if (!raw) return;
      pts = [{ x: this.plot.x + 18, y: this.yOfPrice(raw.y) }, { x: this.plot.right - 18, y: this.yOfPrice(raw.y) }];
    }
    if (this.selection.type === 'drawing' && !d) return;
    if (d && d.kind === 'hline') pts = [{ x: this.plot.x + 18, y: this.yOfPrice(d.y) }, { x: this.plot.right - 18, y: this.yOfPrice(d.y) }];
    else if (d && (d.kind === 'marker' || d.kind === 'text')) pts = [point(this, d.x, d.y)];
    else if (d && typeof d.x1 === 'number' && typeof d.x2 === 'number') pts = [point(this, d.x1, d.y1 === undefined ? d.y : d.y1), point(this, d.x2, d.y2 === undefined ? d.y : d.y2)];
    if (!pts.length) return;
    ctx.save(); ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0); ctx.strokeStyle = '#f0b90b'; ctx.fillStyle = '#111827'; ctx.lineWidth = 1.5;
    if (pts.length === 2) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke(); }
    if (this.selection.type === 'drawing' && d.kind !== 'hline') pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    if (this.selection.type === 'annotation') {
      var stopTag = this.annRaw[this.selection.index].editable === 'stop';
      var tagX = this.plot.right - 56, tagY = pts[1].y - 9;
      ctx.fillStyle = stopTag ? '#8a3540' : '#166a5d'; ctx.fillRect(tagX, tagY, 48, 18);
      ctx.fillStyle = '#fff'; ctx.font = '600 9px ' + LQ.chart.fonts.family; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(stopTag ? '止损 · 拖动' : '止盈 · 拖动', tagX + 24, pts[1].y);
    }
    ctx.restore();
  };
  E.setReplayPreview = function (bar) {
    this.replayPreview = bar || null;
    this.trailingBars = !bar ? 0 : (Number.isInteger(bar.barIndex) ? (bar.barIndex >= this.bars.length ? 1 : 0) : 1);
    this._invalidate(); return this;
  };
  E._setTool = function (tool) {
    if (this._clickAnchor) { this._clickAnchor = null; this.draftRaw = null; this.draftAnn = null; }
    original.setTool.call(this, tool);
  };
  E._buildToolbar = function () {
    original.toolbar.call(this);
    var self = this;
    [['撤销', function () { self.setDrawings(self.getDrawings().slice(0, -1)); }], ['复位', function () { self.resetViewport(); }]].forEach(function (item) {
      var button = document.createElement('button'); button.type = 'button'; button.textContent = item[0];
      button.className = 'btn btn-sm btn-outline'; button.addEventListener('click', item[1]); self.toolbar.appendChild(button);
    });
  };
  E.setPreset = function (preset) {
    this._clickAnchor = null; this._preset = preset || null;
    if (this.selection) setSelection(this, null);
    this._setTool(preset ? preset.tool : null);
    if (this.canvas) this.canvas.style.cursor = preset ? 'crosshair' : 'grab';
  };
  E.updateSeries = function (scenario, follow) {
    var previous = this.view, n = this.bars.length, span = previous ? previous.to - previous.from : 80;
    var atEnd = !previous || previous.to >= n - 3;
    this.scenario = scenario; this.bars = scenario.bars;
    this.panels = LQ.chart.panels.normalizePanels(scenario.panels);
    this.series = LQ.chart.panels.buildSeries(scenario, this.panels);
    this.anns = LQ.chart.overlays.resolve(this.annRaw || [], scenario);
    this.drawingAnns = LQ.chart.overlays.resolve(this.drawings, scenario);
    this.swingsBars = null; this._ensureSwings(); this._buildInfoBar();
    if (follow || atEnd) this.view = this._clampView({ from: this.bars.length - 1 - span, to: this.bars.length - 1 });
    this.resize();
  };
  E._makeDraft = function (tool, x1, y1, x2, y2) {
    var tick = this.scenario && this.scenario.tick || 0;
    function snap(y) { return tick ? Number((Math.round(y / tick) * tick).toFixed(6)) : y; }
    x1 = Math.round(x1); x2 = Math.round(x2); y1 = snap(y1); y2 = snap(y2);
    var raw;
    if (tool === 'zone') raw = { kind: 'zone', x1: Math.min(x1, x2), x2: Math.max(x1, x2), y1: Math.min(y1, y2), y2: Math.max(y1, y2) };
    else if (tool === 'marker') raw = { kind: 'marker', x: x2, y: y2, pos: 'above' };
    else raw = original.draft.call(this, tool, x1, y1, x2, y2);
    if (raw && this._preset) Object.assign(raw, { label: this._preset.label, tone: this._preset.tone || 'info', concept: this._preset.id,
      lessonId: this._preset.lesson, rationale: this._preset.reason });
    return raw;
  };
  E._onPointerDown = function (event) {
    if (this.options.drawingEdit && !this.tool && !this._clickAnchor && this._editPointerDown(event, this._pointerPos(event))) return;
    if (this._clickAnchor && this.tool) {
      if (event.button && event.pointerType === 'mouse') return;
      this._toolDraw = Object.assign({}, this._clickAnchor, { id: event.pointerId }); this._clickAnchor = null;
      this.ptrs[event.pointerId] = this._pointerPos(event);
      try { this.canvas.setPointerCapture(event.pointerId); } catch (_) {}
      this._updateToolDraw(this._pointerPos(event)); return;
    }
    original.down.call(this, event);
  };
  E._onPointerMove = function (event) {
    if (this.editDrag && this.editDrag.id === event.pointerId) { this._editPointerMove(this._pointerPos(event)); return; }
    if (this._clickAnchor && !this._toolDraw) {
      this._toolDraw = this._clickAnchor; this._updateToolDraw(this._pointerPos(event)); this._toolDraw = null; return;
    }
    original.move.call(this, event);
  };
  E._onPointerUp = function (event) {
    if (this.editDrag && this.editDrag.id === event.pointerId) {
      var drag = this.editDrag, selected = this.selection;
      try { this.canvas.releasePointerCapture(event.pointerId); } catch (_) {}
      this.editDrag = null;
      if (event.type === 'pointercancel') {
        if (selected.type === 'drawing') { this.drawings[selected.index] = drag.original; this.drawingAnns = LQ.chart.overlays.resolve(this.drawings, this.scenario); }
        else { this.annRaw[selected.index] = drag.original; this.anns = LQ.chart.overlays.resolve(this.annRaw, this.scenario); }
      } else if (selected.type === 'drawing') {
        this._drawingsDirty = true;
        this._emitDrawings({ type: 'edit', index: selected.index, before: drag.original, after: this.drawings[selected.index] });
      } else if (typeof this.options.onAnnotationDrag === 'function') {
        this.options.onAnnotationDrag({ concept: drag.original.editable, before: drag.original.y, after: this.annRaw[selected.index].y });
      }
      this._invalidate(); return;
    }
    var drawing = this._toolDraw;
    if (drawing && ['trend', 'fib', 'zone', 'vprofile'].includes(drawing.tool) && !drawing.moved && event.type !== 'pointercancel') {
      this._clickAnchor = drawing; this._toolDraw = null; delete this.ptrs[event.pointerId];
      try { this.canvas.releasePointerCapture(event.pointerId); } catch (_) {} return;
    }
    if (drawing && event.type === 'pointercancel') { this._cancelDraft(); delete this.ptrs[event.pointerId]; return; }
    original.up.call(this, event);
  };
  E._finalizeToolDraw = function (pos) {
    var td = this._toolDraw;
    if (td && (td.tool === 'zone' || td.tool === 'marker')) {
      this._updateToolDraw(pos); var raw = this.draftRaw; this._cancelDraft();
      if (raw && LQ.chart.overlays.normalize(raw)) { this.drawings.push(raw); this.drawingAnns = LQ.chart.overlays.resolve(this.drawings, this.scenario); this._emitDrawings({ type: 'add', index: this.drawings.length - 1 }); this._refreshNow(); }
    } else {
      // The legacy hline finalizer creates a fresh object; apply the chosen concept to it too.
      var count = this.drawings.length, emit = this._onDrawingChange; this._onDrawingChange = null;
      original.finalize.call(this, pos);
      this._onDrawingChange = emit;
      if (this.drawings.length > count) {
        var last = this.drawings[this.drawings.length - 1], tick = this.scenario.tick || 0;
        if (last.y && tick) last.y = Number((Math.round(last.y / tick) * tick).toFixed(6));
        if (this._preset) Object.assign(last, { label: this._preset.label, tone: this._preset.tone || 'info', concept: this._preset.id, lessonId: this._preset.lesson, rationale: this._preset.reason });
        this.drawingAnns = LQ.chart.overlays.resolve(this.drawings, this.scenario); this._emitDrawings({ type: 'add', index: this.drawings.length - 1 }); this._refreshNow();
      }
    }
    this._clickAnchor = null;
    this._setTool(null); this._preset = null;
    if (this.canvas) this.canvas.style.cursor = 'grab';
  };
  E._cancelDraft = function () { this._clickAnchor = null; original.cancel.call(this); };
  E._onKeyDown = function (event) {
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'Escape') { this._clickAnchor = null; if (this.selection) setSelection(this, null); }
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selection && this.selection.type === 'drawing') { event.preventDefault(); this.removeSelectedDrawing(); return; }
    original.key.call(this, event);
  };
  E._drawPanes = function () {
    original.panes.call(this);
    if (!this.showVwap || !this.vwapValues) return;
    var ctx = this.ctx; ctx.save(); ctx.beginPath(); ctx.rect(this.plot.x, this.plot.y, this.plot.w, this.plot.h); ctx.clip();
    ctx.beginPath(); ctx.strokeStyle = '#f0b90b'; ctx.lineWidth = 1.5;
    for (var i = Math.max(0, Math.floor(this.view.from)); i <= Math.min(this.bars.length - 1, Math.ceil(this.view.to)); i++) {
      var x = this.xOfBar(i), y = this.yOfPrice(this.vwapValues[i]);
      if (i === Math.max(0, Math.floor(this.view.from)) || this.bars[i].day !== this.bars[i - 1].day) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  };
})();
