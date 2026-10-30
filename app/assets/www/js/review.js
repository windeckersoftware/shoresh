(function (root) {
  'use strict';
  var MINUTE = 60 * 1000;
  var DAY = 24 * 60 * MINUTE;

  function scheduleGrade(word, grade, now) {
    if (!word) return word;
    var g = Number(grade);
    var prev = Number(word.interval) || 0;
    var interval = 0;
    if (g === 1) interval = 10 * MINUTE;
    else if (g === 2) interval = Math.max(DAY, Math.round(prev * 1.2) || DAY);
    else if (g === 3) interval = Math.max(3 * DAY, Math.round((prev || DAY) * 2.2));
    else if (g === 4) interval = Math.max(7 * DAY, Math.round((prev || 3 * DAY) * 2));
    word.grade = g;
    word.lastSeen = now;
    if (g === 5 || g === -1) {
      word.due = 0;
      word.interval = 0;
    } else if (g >= 1 && g <= 4) {
      word.interval = interval;
      word.due = now + interval;
      word.reps = g === 1 ? 0 : (Number(word.reps) || 0) + 1;
    }
    return word;
  }

  function isDue(word, langId, now) {
    if (!word || word.seed) return false;
    if (langId && word.lang !== langId) return false;
    var g = Number(word.grade);
    if (!(g >= 1 && g <= 4)) return false;
    if (!word.due) return true;
    return Number(word.due) <= now;
  }

  function splitSentences(text) {
    var clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    var rough = clean.split(/(?<=[.!?。！？؟؛׃])\s+/);
    var out = [];
    for (var i = 0; i < rough.length; i++) {
      var rest = rough[i].trim();
      while (rest.length > 350) {
        var cut = rest.lastIndexOf(' ', 350);
        if (cut < 80) cut = 350;
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) out.push(rest);
    }
    return out;
  }

  root.NerReview = {
    MINUTE: MINUTE,
    DAY: DAY,
    scheduleGrade: scheduleGrade,
    isDue: isDue,
    splitSentences: splitSentences
  };
})(typeof window !== 'undefined' ? window : globalThis);
