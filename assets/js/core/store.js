/* 本地存储封装：学习进度 / 计划任务；localStorage 不可用时自动降级为内存（Lead 维护 · 冻结） */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};

  var PREFIX = 'lq:';
  var PROGRESS_KEY = 'lq:progress:v1';
  var memory = {};
  var available = true;

  function storage() {
    if (!available) return null;
    try {
      var s = global.localStorage;
      if (!s) { available = false; return null; }
      var probe = '__lq_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch (err) {
      available = false;
      return null;
    }
  }

  function readRaw(key) {
    var s = storage();
    if (s) {
      try {
        var v = s.getItem(PREFIX + key);
        return v === null ? undefined : v;
      } catch (err) { /* fall through */ }
    }
    return memory[key];
  }

  function writeRaw(key, raw) {
    memory[key] = raw;
    var s = storage();
    if (s) {
      try { s.setItem(PREFIX + key, raw); } catch (err) { available = false; }
    }
  }

  function parse(raw, fallback) {
    if (raw === undefined || raw === null) return fallback;
    try {
      var v = JSON.parse(raw);
      return v === null || v === undefined ? fallback : v;
    } catch (err) {
      return fallback;
    }
  }

  function notify() {
    try {
      if (typeof document !== 'undefined' && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent('lq:store'));
      }
    } catch (err) { /* ignore */ }
  }

  LQ.store = {
    get available() { return available; },

    get: function (key, fallback) {
      return parse(readRaw('app:' + key), fallback);
    },
    set: function (key, value) {
      try { writeRaw('app:' + key, JSON.stringify(value)); notify(); } catch (err) { /* ignore */ }
      return value;
    },
    remove: function (key) {
      memory['app:' + key] = undefined;
      var s = storage();
      if (s) { try { s.removeItem(PREFIX + 'app:' + key); } catch (err) { /* ignore */ } }
      notify();
    }
  };

  var EMPTY = function () {
    return { lessons: {}, quizzes: {}, plan: {}, lastLesson: null, updatedAt: 0 };
  };

  function readProgress() {
    var data = parse(readRaw('progress:v1'), null);
    if (!data || typeof data !== 'object') data = { progress: EMPTY() };
    if (data.progress) return data.progress; // 兼容旧包装
    if (!data.lessons) data.lessons = {};
    if (!data.quizzes) data.quizzes = {};
    if (!data.plan) data.plan = {};
    return data;
  }

  function mutate(fn) {
    var data = readProgress();
    var result = fn(data);
    data.updatedAt = Date.now();
    try { writeRaw('progress:v1', JSON.stringify(data)); } catch (err) { /* ignore */ }
    notify();
    return result;
  }

  LQ.store.progress = {
    data: function () { return readProgress(); },

    isDone: function (lessonId) {
      var p = readProgress().lessons;
      return !!(p && p[lessonId] && p[lessonId].done);
    },

    setDone: function (lessonId, done) {
      if (!lessonId) return;
      mutate(function (p) {
        if (done) {
          p.lessons[lessonId] = { done: true, at: Date.now() };
          p.lastLesson = lessonId;
        } else {
          delete p.lessons[lessonId];
        }
      });
    },

    toggleDone: function (lessonId) {
      var next = !LQ.store.progress.isDone(lessonId);
      LQ.store.progress.setDone(lessonId, next);
      return next;
    },

    getQuiz: function (lessonId) {
      var q = readProgress().quizzes;
      return (q && q[lessonId]) || null;
    },

    setQuiz: function (lessonId, result) {
      if (!lessonId || !result) return;
      mutate(function (p) {
        p.quizzes[lessonId] = {
          correct: Number(result.correct) || 0,
          total: Number(result.total) || 0,
          at: Date.now()
        };
      });
    },

    isPlanTaskDone: function (key) {
      var plan = readProgress().plan;
      return !!(plan && plan[key]);
    },

    setPlanTask: function (key, done) {
      if (!key) return;
      mutate(function (p) {
        if (done) p.plan[key] = { done: true, at: Date.now() };
        else delete p.plan[key];
      });
    },

    setLastLesson: function (lessonId) {
      if (!lessonId) return;
      mutate(function (p) { p.lastLesson = lessonId; });
    },

    getLastLesson: function () {
      return readProgress().lastLesson || null;
    },

    reset: function () {
      mutate(function (p) {
        p.lessons = {}; p.quizzes = {}; p.plan = {}; p.lastLesson = null;
      });
    },

    summary: function (totalLessons) {
      var p = readProgress();
      var total = Math.max(0, Number(totalLessons) || 0);
      var done = 0;
      Object.keys(p.lessons || {}).forEach(function (id) {
        if (p.lessons[id] && p.lessons[id].done) done++;
      });
      if (done > total) done = total;
      var pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { done: done, total: total, pct: pct };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
