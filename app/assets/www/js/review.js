(function (root) {
  'use strict';
  var MINUTE = 60 * 1000;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;

  // Anki's defaults (SM-2, v3 scheduler), as in the owner's Chinese study app.
  var OPT = {
    learnSteps: [1, 10], relearnSteps: [10], gradIvl: 1, easyIvl: 4,
    startingEase: 2.5, easyBonus: 1.3, hardFactor: 1.2, maxIvl: 36500,
    minIvl: 1, learnAhead: 20, rollover: 4
  };

  // Reading status from the reader (1-4 learning, 5 known, -1 ignored).
  // The review schedule lives apart, on word.srs.
  function scheduleGrade(word, grade, now) {
    if (!word) return word;
    word.grade = Number(grade);
    word.lastSeen = now;
    return word;
  }

  // Start of the study day that holds ts; a day starts at 4:00, as in Anki.
  function dayStart(ts) {
    var d = new Date((ts || Date.now()) - OPT.rollover * HOUR);
    d.setHours(0, 0, 0, 0);
    return d.getTime() + OPT.rollover * HOUR;
  }

  function dayKey(ts) {
    var d = new Date(dayStart(ts));
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function cardType(c) {
    if (!c || !c.reps) return 'new';
    if ((c.ivl || 0) >= 1) return 'review';
    return c.lapses ? 'relearn' : 'learn';
  }

  function fuzzDays(ivl) {
    if (ivl < 2.5) return ivl;
    var delta = 1;
    [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]].forEach(function (r) {
      delta += r[2] * Math.max(Math.min(ivl, r[1]) - r[0], 0);
    });
    var lo = Math.max(2, Math.round(ivl - delta)), hi = Math.round(ivl + delta);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  // Pure: the card after rating it 'again' | 'hard' | 'good' | 'easy'.
  // fuzz=false for the interval shown on the buttons.
  function next(card, g, now, fuzz) {
    var c = card || {};
    now = now || Date.now();
    var t = cardType(c);
    var ef = c.ef || OPT.startingEase;
    var ivl = Math.max(0, c.ivl || 0);
    var step = c.step || 0;
    var r = { ef: ef, ivl: ivl, step: step, due: now, reps: (c.reps || 0) + 1, lapses: c.lapses || 0 };
    function stepDue(mins) { return mins >= 1440 ? dayStart(now) + Math.round(mins / 1440) * DAY : now + mins * MINUTE; }
    function toReview(days) {
      r.step = 0;
      r.ivl = Math.max(1, Math.min(OPT.maxIvl, Math.round(days)));
      r.due = dayStart(now) + r.ivl * DAY;
      return r;
    }
    function learning(steps, graduate, easy) {
      var cur = Math.min(step, steps.length - 1);
      if (g === 'again') { r.step = 0; r.ivl = 0; r.due = stepDue(steps[0]); return r; }
      if (g === 'hard') {
        var mins = cur === 0 ? (steps.length > 1 ? (steps[0] + steps[1]) / 2 : Math.min(steps[0] * 1.5, steps[0] + 1440)) : steps[cur];
        r.step = cur; r.ivl = 0; r.due = stepDue(mins); return r;
      }
      if (g === 'good') {
        if (cur + 1 < steps.length) { r.step = cur + 1; r.ivl = 0; r.due = stepDue(steps[cur + 1]); return r; }
        return graduate();
      }
      return easy();
    }
    if (t === 'new' || t === 'learn') {
      return learning(OPT.learnSteps, function () { return toReview(OPT.gradIvl); }, function () { return toReview(OPT.easyIvl); });
    }
    if (t === 'relearn') {
      var back = Math.max(OPT.minIvl, c.back || 1);
      return learning(OPT.relearnSteps, function () { return toReview(back); }, function () { return toReview(back + 1); });
    }
    var cur = Math.max(1, Math.round(ivl));
    if (g === 'again') {
      r.ef = Math.max(1.3, ef - 0.2);
      r.lapses = r.lapses + 1;
      r.back = OPT.minIvl;
      r.step = 0; r.ivl = 0; r.due = stepDue(OPT.relearnSteps[0]);
      return r;
    }
    var daysLate = Math.max(0, Math.round((dayStart(now) - dayStart(c.due || now)) / DAY));
    function constrain(x, minimum) {
      if (fuzz) x = fuzzDays(x);
      return Math.min(OPT.maxIvl, Math.max(Math.round(x), Math.round(minimum), 1));
    }
    var hardIvl = constrain(cur * OPT.hardFactor, cur + 1);
    if (g === 'hard') { r.ef = Math.max(1.3, ef - 0.15); return toReview(hardIvl); }
    var goodIvl = constrain((cur + daysLate / 2) * ef, hardIvl + 1);
    if (g === 'good') return toReview(goodIvl);
    r.ef = ef + 0.15;
    return toReview(constrain((cur + daysLate) * ef * OPT.easyBonus, goodIvl + 1));
  }

  // What a button shows: days for a card that lands in review, else the wait.
  function preview(card, g, now) {
    now = now || Date.now();
    var r = next(card, g, now, false);
    var ms = r.ivl >= 1 ? r.ivl * DAY : Math.max(MINUTE, r.due - now);
    if (ms < HOUR) return Math.max(1, Math.round(ms / MINUTE)) + 'm';
    if (ms < DAY) return Math.round(ms / HOUR) + 'h';
    var days = Math.round(ms / DAY);
    if (days < 31) return days + 'd';
    if (days < 365) return (Math.round(days / 3.04) / 10) + 'mo';
    return (Math.round(days / 36.5) / 10) + 'y';
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

  // Self-check of the schedule, run once at load (cheap, pure).
  (function () {
    var t0 = new Date(2026, 0, 10, 12).getTime();
    var a = next(null, 'good', t0, false);
    var b = next(a, 'good', a.due, false);
    var c = next(b, 'good', b.due, false);
    var d = next(c, 'again', c.due, false);
    if (a.ivl !== 0 || a.step !== 1 || b.ivl !== 1 || c.ivl < 2 || d.ivl !== 0 || d.lapses !== 1 || cardType(d) !== 'relearn' ||
        next(d, 'good', d.due, false).ivl !== 1 || next(null, 'easy', t0, false).ivl !== 4) {
      throw new Error('NerReview schedule self-check failed');
    }
  })();

  root.NerReview = {
    MINUTE: MINUTE,
    DAY: DAY,
    LEARN_AHEAD: OPT.learnAhead * MINUTE,
    scheduleGrade: scheduleGrade,
    cardType: cardType,
    next: next,
    preview: preview,
    dayStart: dayStart,
    dayKey: dayKey,
    splitSentences: splitSentences
  };
})(typeof window !== 'undefined' ? window : globalThis);
