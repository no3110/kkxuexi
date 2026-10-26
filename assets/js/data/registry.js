/* 注册中心：情景 / 课程模块 / 术语表（Lead 维护 · 冻结）
 * 加载期错误不抛出，统一收集在 LQ.content.loadErrors / LQ.data.loadErrors，避免一个坏文件毁掉整站。
 */
(function (global) {
  'use strict';
  var LQ = global.LQ = global.LQ || {};
  var D = LQ.data = LQ.data || {};

  // ---------- 情景 ----------
  var scenarioList = [], scenarioMap = {};
  var datasetList = [], datasetMap = {};
  D.loadErrors = [];

  D.registerDataset = function (dataset) {
    try {
      if (!dataset || !dataset.id) { D.loadErrors.push('数据集缺少 id'); return null; }
      if (datasetMap[dataset.id]) { D.loadErrors.push('重复的数据集 id: ' + dataset.id); return null; }
      if (!Array.isArray(dataset.bars) || dataset.bars.length < 20) {
        D.loadErrors.push('数据集 ' + dataset.id + ' bar 数量不足'); return null;
      }
      datasetMap[dataset.id] = dataset;
      datasetList.push(dataset);
      return dataset;
    } catch (err) {
      D.loadErrors.push('注册数据集失败: ' + err.message);
      return null;
    }
  };
  D.getDataset = function (id) { return datasetMap[id] || null; };
  D.listDatasets = function () { return datasetList.slice(); };

  D.registerScenario = function (scenario) {
    try {
      if (!scenario || !scenario.id) { D.loadErrors.push('情景缺少 id'); return null; }
      if (scenarioMap[scenario.id]) { D.loadErrors.push('重复的情景 id: ' + scenario.id); return null; }
      if (!Array.isArray(scenario.bars) || scenario.bars.length < 20) {
        D.loadErrors.push('情景 ' + scenario.id + ' bar 数量不足'); return null;
      }
      scenarioMap[scenario.id] = scenario;
      scenarioList.push(scenario);
      return scenario;
    } catch (err) {
      D.loadErrors.push('注册情景 ' + (scenario && scenario.id) + ' 失败: ' + err.message);
      return null;
    }
  };
  D.getScenario = function (id) { return scenarioMap[id] || null; };
  D.listScenarios = function () { return scenarioList.slice(); };

  // ---------- 课程内容 ----------
  var modules = [], moduleMap = {}, lessonMap = {}, lessonList = [], glossary = [];
  var examQuestions = [];
  LQ.content = {
    loadErrors: [],

    registerExamQuestions: function (items) {
      if (!Array.isArray(items)) { LQ.content.loadErrors.push('registerExamQuestions 需要数组'); return; }
      var seen = {};
      examQuestions.forEach(function (q) { if (q && q.id) seen[q.id] = true; });
      items.forEach(function (q) {
        if (!q || !q.id || !q.question) { LQ.content.loadErrors.push('考核题缺少 id/question'); return; }
        if (seen[q.id]) { LQ.content.loadErrors.push('重复考核题 id: ' + q.id); return; }
        seen[q.id] = true;
        examQuestions.push(q);
      });
    },
    listExamQuestions: function () { return examQuestions.slice(); },

    registerModule: function (mod) {
      try {
        if (!mod || !mod.id) { this.loadErrors.push('模块缺少 id'); return null; }
        if (moduleMap[mod.id]) { this.loadErrors.push('重复的模块 id: ' + mod.id); return null; }
        if (!Array.isArray(mod.lessons) || !mod.lessons.length) { this.loadErrors.push('模块 ' + mod.id + ' 没有课程'); return null; }
        mod.order = Number(mod.order) || modules.length + 1;
        mod.lessons.forEach(function (lesson, index) {
          if (!lesson || !lesson.id) { LQ.content.loadErrors.push('模块 ' + mod.id + ' 存在缺少 id 的课程'); return; }
          if (lessonMap[lesson.id]) { LQ.content.loadErrors.push('重复的课程 id: ' + lesson.id); return; }
          lesson.moduleId = mod.id;
          lesson.moduleTitle = mod.title;
          lesson.moduleAccent = mod.accent;
          lesson.indexInModule = index;
          lessonMap[lesson.id] = lesson;
          lessonList.push(lesson);
        });
        moduleMap[mod.id] = mod;
        modules.push(mod);
        return mod;
      } catch (err) {
        this.loadErrors.push('注册模块失败: ' + err.message);
        return null;
      }
    },

    registerGlossary: function (items) {
      if (!Array.isArray(items)) return;
      var seen = {};
      glossary.forEach(function (g) { seen[g.term] = true; });
      items.forEach(function (item) {
        if (!item || !item.term || !item.def) { LQ.content.loadErrors.push('术语缺少 term/def'); return; }
        if (seen[item.term]) { LQ.content.loadErrors.push('重复术语: ' + item.term); return; }
        seen[item.term] = true;
        glossary.push(item);
      });
    },

    getModules: function () {
      return modules.slice().sort(function (a, b) { return a.order - b.order; });
    },
    getModule: function (id) { return moduleMap[id] || null; },
    getLesson: function (id) { return lessonMap[id] || null; },
    listLessons: function () {
      return modules.slice().sort(function (a, b) { return a.order - b.order; }).reduce(function (acc, mod) {
        return acc.concat(mod.lessons);
      }, []);
    },
    listGlossary: function () { return glossary.slice(); },
    lessonCount: function () { return lessonList.length; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
