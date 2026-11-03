#!/usr/bin/env node
/*
 * Review-card checks, no browser and no Android needed:  node tools/check_review.js
 *
 * Loads js/review.js and the card logic of js/app.js (the real source: functions and constants are sliced out of
 * the IIFE by name) into a vm sandbox with a stub state and a controllable clock, then asserts
 *   - "Save as review card" (patterns) and "Save sentence as a cloze card" end to end: creation, schedule on word.srs,
 *     saving twice, known/ignored cards coming back
 *   - a card's whole life: new -> learn -> review -> lapse -> relearn -> review, with 1-4 / K / X grading and the
 *     daily counters, and multi-step undo
 *   - cloze blanking in left-to-right, right-to-left and CJK sentences
 *   - two-phone sync: per-word merge (see the "sync" section)
 * Exit code 1 on any failed assertion.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WWW = path.join(__dirname, '../app/assets/www');
const src = fs.readFileSync(path.join(WWW, 'js/app.js'), 'utf8');
const lines = src.split('\n');

// ---- slice code out of the app's IIFE (2-space indentation: `  function name(` ... `  }`) ----
function fn(name) {
  const i = lines.findIndex(l => l.startsWith('  function ' + name + '('));
  if (i < 0) throw new Error('function not found in app.js: ' + name);
  const j = lines.findIndex((l, k) => k > i && l === '  }');
  return lines.slice(i, j + 1).join('\n');
}
function cst(name) {
  const i = lines.findIndex(l => l.startsWith('  const ' + name + ' ='));
  if (i < 0) throw new Error('const not found in app.js: ' + name);
  let j = i;
  while (!/;\s*$/.test(lines[j])) j++;
  return lines.slice(i, j + 1).join('\n');
}

let NOW = new Date(2026, 0, 10, 12, 0, 0).getTime();
class FakeDate extends Date {
  constructor(...a) { if (a.length) super(...a); else super(NOW); }
  static now() { return NOW; }
}
const sandbox = { Date: FakeDate, console, Intl, Math, JSON, Array, Object, Set, Map, String, Number, RegExp, Error, Promise };
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
const run = code => vm.runInContext(code, ctx, { filename: 'app-slice.js' });

run(fs.readFileSync(path.join(WWW, 'js/review.js'), 'utf8'));
for (const l of ['fr', 'he']) run(fs.readFileSync(path.join(WWW, 'patterns', l + '.js'), 'utf8'));

const NAMES_FN = ['migrateSchedule', 'rebuildIndex', 'schedule', 'deck', 'srsToday', 'learningToday', 'buildQueue',
  'rateReview', 'undoReview', 'clozeSpans', 'clozeTarget', 'clozeParts', 'clozeHtml', 'addStudyCard', 'saveCloze', 'savePattern',
  'mergeWord', 'mergeSrsLog', 'mergeRemoteState'];
const NAMES_CONST = ['isObj', 'escapeHtml', 'RV', 'idOf', 'typeOf', 'byDue', 'isLearningCard', 'dayEnd', 'RATE', 'CLOZE_CJK', 'CLOZE_WORD',
  'CLOZE_GAP', 'cardActive', 'patternKey'];

const optional = new Set(['mergeWord', 'mergeSrsLog', 'mergeRemoteState']);
const body = [
  `let state = { words: {}, srsLog: {}, stats: {}, articles: [], settings: { dailyGoal: 20, lang: 'fr' } };`,
  `let currentWord = null, reviewQueue = [], reviewIndex = 0, reviewSeen = new Set(), reviewCur = null, reviewFlipped = true,`,
  `    reviewForced = null, reviewUndo = [], reviewDone = 0, wordIndex = new Map(), currentView = 'home';`,
  `const toasts = []; const toast = m => { toasts.push(m); }; const tr = x => x; let saves = 0; const save = () => { saves++; };`,
  `const renderHome = () => {}, renderReview = () => {}, renderPatterns = () => {}, renderAll = () => {}, flipReview = () => { reviewFlipped = true; };`,
  `const capArticles = a => a;`,
  `let LANG = { id: 'fr', dir: 'ltr' }; const lang = () => LANG, readerLang = () => LANG, baseLang = () => ({ id: 'en' });`,
  ...NAMES_CONST.map(cst),
  ...NAMES_FN.filter(n => !optional.has(n) || lines.some(l => l.startsWith('  function ' + n + '('))).map(fn),
  `globalThis.T = {
     get state() { return state; }, set state(v) { state = v; },
     get currentWord() { return currentWord; }, set currentWord(v) { currentWord = v; },
     get reviewCur() { return reviewCur; }, set reviewCur(v) { reviewCur = v; },
     get reviewFlipped() { return reviewFlipped; }, set reviewFlipped(v) { reviewFlipped = v; },
     get reviewUndo() { return reviewUndo; }, get wordIndex() { return wordIndex; }, get toasts() { return toasts; },
     set LANG(v) { LANG = v; },
     fns: { migrateSchedule, rebuildIndex, schedule, deck, srsToday, buildQueue, rateReview, undoReview, clozeSpans, clozeTarget, clozeParts, clozeHtml,
            addStudyCard, saveCloze, savePattern, typeOf, cardActive, mergeWord: typeof mergeWord === 'function' ? mergeWord : null,
            mergeSrsLog: typeof mergeSrsLog === 'function' ? mergeSrsLog : null,
            mergeRemoteState: typeof mergeRemoteState === 'function' ? mergeRemoteState : null }
   };`
].join('\n');
run(body);
const T = sandbox.T, F = T.fns, RV = sandbox.NerReview;

// ---- tiny test harness ----
let failed = 0, passed = 0;
function ok(name, cond, detail) {
  if (cond) passed++; else { failed++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); }
}
// key order never matters
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const eq = (name, a, b) => ok(name, same(a, b), { got: a, want: b });
const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
const reset = () => { T.state = { words: {}, srsLog: {}, stats: {}, articles: [], settings: { dailyGoal: 20, lang: 'fr' } }; T.currentWord = null; T.reviewUndo.length = 0; T.toasts.length = 0; T.LANG = { id: 'fr', dir: 'ltr' }; };
const rate = (id, g) => { T.reviewCur = { id, main: true }; T.reviewFlipped = true; F.rateReview(g); };
const snapshot = id => JSON.stringify(T.state.words[id]);
// an absent day and a zeroed day are the same
const normLog = j => JSON.stringify(Object.entries(JSON.parse(j)).filter(([, v]) => v.n || v.r).sort());
const today = () => T.state.srsLog[RV.dayKey()] || { n: 0, r: 0 };

ok('fake clock drives the scheduler', RV.dayKey() === '2026-1-10', RV.dayKey());

module.exports = { T, F, RV, ok, eq, reset, rate, snapshot, today, MIN, DAY, setNow: v => { NOW = v; }, getNow: () => NOW, summary };

function summary() { console.log(`${passed} passed, ${failed} failed`); return failed; }

if (require.main === module) {
  // =========================================================================
  // 1. Save as review card (patterns)
  // =========================================================================
  reset();
  F.savePattern('ne-pas');
  const pid = 'fr:pattern:ne-pas', pc = T.state.words[pid];
  ok('pattern: card created', !!pc);
  ok('pattern: fields', pc && pc.lang === 'fr' && pc.key === 'pattern:ne-pas' && pc.pos === 'pattern' && pc.grade === 1 && /\S/.test(pc.display), pc);
  ok('pattern: example sentence kept as context', pc && pc.context.length > 5 && /\S/.test(pc.meaning));
  ok('pattern: no schedule yet, so it is a NEW card', pc && pc.srs === undefined && F.typeOf(pc) === 'new');
  ok('pattern: in the review deck and queue', F.deck().includes(pc) && F.buildQueue().includes(pid));
  ok('pattern: not an entry of the reader word index', !T.wordIndex.has('pattern:ne-pas') && !T.wordIndex.has(pc.display));
  ok('pattern: toast says added', T.toasts.pop() === 'נוסף לחזרה');

  // saving twice: one card, schedule untouched
  rate(pid, 3);
  const afterGrade = snapshot(pid);
  F.savePattern('ne-pas');
  eq('pattern twice: still one card', Object.keys(T.state.words).length, 1);
  ok('pattern twice: schedule untouched', snapshot(pid) === afterGrade);
  ok('pattern twice: says it is already there', T.toasts.pop() === 'הקלף כבר בחזרה');

  // =========================================================================
  // 2. A card's life: new -> learn -> review -> lapse -> relearn -> review
  // =========================================================================
  reset(); NOW = new Date(2026, 0, 10, 12, 0, 0).getTime();
  F.savePattern('pour-inf');
  const id = 'fr:pattern:pour-inf', w = () => T.state.words[id];
  const type = () => F.typeOf(w());
  const states = [['new', type()]];
  const trail = [];
  const snaps = [snapshot(id)], logs = [JSON.stringify(T.state.srsLog)];
  const step = (g) => { rate(id, g); states.push([g, type()]); snaps.push(snapshot(id)); logs.push(JSON.stringify(T.state.srsLog)); };

  step(3);   // Good on a new card: first learning step (1 -> 10 min)
  ok('life: new -> learn after Good', type() === 'learn' && w().srs.step === 1 && w().srs.ivl === 0 && w().grade === 3, w());
  ok('life: learn step is minutes away, not days', w().srs.due - NOW === 10 * MIN, w().srs.due - NOW);
  eq('life: counters after first grade (n new, r reviews)', today(), { n: 1, r: 1 });
  ok('life: learning card is not in the main queue, but learningToday lists it', !F.buildQueue().includes(id) && T.state.words[id] && F.deck().includes(w()));

  NOW += 10 * MIN; step(3);   // Good on the last learning step graduates to review (1 day)
  ok('life: learn -> review after second Good (ivl 1 day)', type() === 'review' && w().srs.ivl === 1 && w().srs.lapses === 0, w().srs);
  eq('life: new counter did not move again', today(), { n: 1, r: 2 });

  NOW = w().srs.due; step(3);   // review on its day: interval grows
  ok('life: review interval grows (ivl >= 2)', type() === 'review' && w().srs.ivl >= 2 && w().srs.ef === 2.5, w().srs);

  NOW = w().srs.due; step(1);   // Again on a review card: lapse into relearning
  ok('life: review -> relearn after Again (lapse counted, ease -0.2)', type() === 'relearn' && w().srs.lapses === 1 && w().srs.ivl === 0 && Math.abs(w().srs.ef - 2.3) < 1e-9, w().srs);
  ok('life: grade follows the button pressed', w().grade === 1);
  ok('life: relearning card is back in learningToday', F.deck().includes(w()));

  NOW += 10 * MIN; step(3);   // relearn step Good: back to review
  ok('life: relearn -> review after Good', type() === 'review' && w().srs.ivl >= 1, w().srs);
  eq('life: states walked', states.map(s => s[1]), ['new', 'learn', 'review', 'review', 'relearn', 'review']);

  // 1-4 buttons all schedule; labels preview what they do
  const prev = [1, 2, 3, 4].map(g => RV.preview(w().srs, RATE_NAME(g), NOW));
  ok('grades: four distinct previews on a review card', new Set(prev).size >= 3, prev);
  function RATE_NAME(g) { return { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' }[g]; }

  // undo: every step back, exactly
  let undone = 0;
  for (let i = snaps.length - 1; i >= 1; i--) {
    F.undoReview(); undone++;
    ok(`undo ${undone}: card restored exactly`, snapshot(id) === snaps[i - 1], { got: snapshot(id), want: snaps[i - 1] });
    ok(`undo ${undone}: day counters restored`, normLog(JSON.stringify(T.state.srsLog)) === normLog(logs[i - 1]), { got: T.state.srsLog, want: JSON.parse(logs[i - 1]) });
  }
  ok('undo: stack empty afterwards', T.reviewUndo.length === 0);
  ok('undo: back to a new card', type() === 'new' && w().srs === undefined);

  // K and X take a card out of review; saving it again brings it back as a new card
  for (const [g, label] of [[5, 'K (known)'], [-1, 'X (ignore)']]) {
    rate(id, 2);
    rate(id, g);
    ok(`${label}: grade set, card leaves the deck and the queue`, w().grade === g && !F.deck().includes(w()) && !F.buildQueue().includes(id), w().grade);
    ok(`${label}: Patterns list no longer shows it as saved`, !F.cardActive(w()));
    F.savePattern('pour-inf');
    ok(`${label}: saving again brings it back as a NEW card`, F.cardActive(w()) && w().grade === 1 && w().srs === undefined && F.typeOf(w()) === 'new', w());
    ok(`${label}: still exactly one card`, Object.keys(T.state.words).length === 1);
    ok(`${label}: says added, not "already"`, T.toasts.pop() === 'נוסף לחזרה');
  }

  // =========================================================================
  // 3. Cloze: blanking in LTR, RTL and CJK sentences
  // =========================================================================
  const front = (text, target) => F.clozeHtml({ text, target }, false);
  const back = (text, target) => F.clozeHtml({ text, target }, true);
  const visible = html => html.replace(/<span class="cloze-gap">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '');
  // every occurrence is blanked (the front must not give the answer away)
  let t = 'Je ne sais pas, mais je ne dis pas non.';
  ok('cloze: all occurrences blanked (LTR)', (front(t, 'ne').match(/cloze-gap/g) || []).length === 2 && !/\bne\b/.test(visible(front(t, 'ne'))), front(t, 'ne'));
  ok('cloze: back shows every hit', (back(t, 'ne').match(/cloze-hit/g) || []).length === 2);
  ok('cloze: not blanked inside other words', (front('Il est plein de vie, le bon.', 'le').match(/cloze-gap/g) || []).length === 1 && /plein/.test(visible(front('Il est plein de vie, le bon.', 'le'))));
  t = 'אני לא יודע מה לעשות, אבל לא אכפת לי.';
  ok('cloze: all occurrences blanked (Hebrew, RTL)', (front(t, 'לא').match(/cloze-gap/g) || []).length === 2 && !/לא/.test(visible(front(t, 'לא'))), front(t, 'לא'));
  ok('cloze: Hebrew word not blanked inside a longer word', (front('הספר לא מעניין אותי, ספר אחר כן.', 'ספר').match(/cloze-gap/g) || []).length === 1);
  t = '我昨天去了学校，他也去了学校。';
  ok('cloze: all occurrences blanked (Chinese)', (front(t, '学校').match(/cloze-gap/g) || []).length === 2 && !/学校/.test(visible(front(t, '学校'))));
  t = '日本語を勉強します。毎日、日本語を話します。';
  ok('cloze: all occurrences blanked (Japanese)', (front(t, '日本語').match(/cloze-gap/g) || []).length === 2);
  ok('cloze: text is HTML-escaped', visible(front('A <b>x</b> & y bold & more words here', 'bold')).includes('&lt;b&gt;') && !/<b>x/.test(front('A <b>x</b> & y bold & more words here', 'bold')));
  ok('cloze: target absent -> sentence unchanged, no gap', !/cloze-gap/.test(front('Un texte sans la cible présente.', 'zzz')));
  eq('cloze: parts rebuild the sentence', F.clozeParts('a b a', 'a').map(p => p.t).join(''), 'a b a');

  // =========================================================================
  // 4. Save sentence as a cloze card
  // =========================================================================
  reset();
  const sentence = "Ce matin, il pleuvait des cordes et mon ami m'a posé un lapin.";
  const real = { lang: 'fr', key: 'pleuvoir', form: 'pleuvait', display: 'pleuvoir', meaning: 'to rain', grade: 2, added: 1, lastSeen: 1, seen: 1, context: sentence };
  T.state.words['fr:pleuvoir'] = real;
  F.rebuildIndex();
  ok('cloze setup: the real word is in the reader index', T.wordIndex.get('pleuvait') === real);
  T.currentWord = { w: real, raw: 'pleuvait', context: sentence };
  F.saveCloze();
  const cz = Object.values(T.state.words).find(x => x.cloze);
  ok('cloze: card created', !!cz);
  ok('cloze: fields', cz && cz.pos === 'sentence' && cz.cloze.target === 'pleuvait' && cz.cloze.text === sentence && cz.display === sentence && cz.grade === 1 && /pleuvoir/.test(cz.meaning), cz);
  ok('cloze: NEW card on word.srs rules', cz && cz.srs === undefined && F.typeOf(cz) === 'new');
  ok('cloze: does NOT take over the reader index entry of its target word', T.wordIndex.get('pleuvait') === real, T.wordIndex.get('pleuvait') && T.wordIndex.get('pleuvait').key);
  ok('cloze: real word untouched', real.grade === 2 && real.srs === undefined);
  ok('cloze: toast added', T.toasts.pop() === 'נוסף לחזרה');
  const cid = 'fr:' + cz.key;
  F.saveCloze();
  eq('cloze twice: one cloze card', Object.values(T.state.words).filter(x => x.cloze).length, 1);
  ok('cloze twice: says already', T.toasts.pop() === 'הקלף כבר בחזרה');
  rate(cid, 4);
  ok('cloze: Easy on a new card -> review, 4 days', F.typeOf(T.state.words[cid]) === 'review' && T.state.words[cid].srs.ivl === 4, T.state.words[cid].srs);
  rate(cid, 5);
  ok('cloze: K takes it out of review', !F.cardActive(T.state.words[cid]) && !F.deck().includes(T.state.words[cid]));
  F.saveCloze();
  ok('cloze: saving after K brings it back as a new card', F.cardActive(T.state.words[cid]) && T.state.words[cid].srs === undefined && T.toasts.pop() === 'נוסף לחזרה');
  // a word that is not in its sentence cannot be made into a cloze
  T.currentWord = { w: { ...real, form: 'zzz', display: 'zzz', key: 'zzz' }, raw: 'zzz', context: sentence };
  eq('cloze: no target -> no button/card', F.clozeTarget(T.currentWord.w, sentence), '');
  // undo of a reader word keeps the reader index pointing at the live object
  reset();
  const pluie = { lang: 'fr', key: 'pluie', form: 'pluie', display: 'pluie', meaning: 'rain', grade: 1, added: 1, lastSeen: 1, seen: 1 };
  T.state.words['fr:pluie'] = pluie; F.rebuildIndex();
  rate('fr:pluie', 3);
  F.undoReview();
  ok('undo: reader index follows the restored word object', T.wordIndex.get('pluie') === T.state.words['fr:pluie'] && T.wordIndex.get('pluie').grade === 1);

  // =========================================================================
  // 5. Two-phone sync: per-word merge
  // =========================================================================
  const mw = F.mergeWord, ms = F.mergeSrsLog, mr = F.mergeRemoteState;
  ok('sync: mergeWord / mergeSrsLog / mergeRemoteState exist', !!(mw && ms && mr));
  const T0 = new Date(2026, 0, 1, 12).getTime();
  const srs = (reps, dueDays, ivl = reps) => ({ reps, ivl, step: 0, ef: 2.5, lapses: 0, due: T0 + dueDays * DAY });
  const word = (o) => ({ lang: 'fr', key: 'pluie', form: 'pluie', display: 'pluie', meaning: 'rain', grade: 2, added: T0, lastSeen: T0, seen: 1, ...o });
  // the old behaviour, to show the scenario below really lost data before: whole word, newer lastSeen wins
  const oldPick = (lw, rw) => (!lw || (rw.lastSeen || rw.added || 0) > (lw.lastSeen || lw.added || 0)) ? rw : lw;
  const both = (x, y) => [mw(x, y), mw(y, x)];   // the merge must not depend on which phone merges

  // --- a review on A, then the word is opened on B (later lastSeen, older schedule) ---
  {
    const A = word({ srs: srs(3, 5), grade: 3, lastSeen: T0 + 1 * DAY });                       // reviewed on A
    const B = word({ srs: srs(2, 2), grade: 2, lastSeen: T0 + 2 * DAY, seen: 4, context: 'Il pleut.' }); // only opened on B, afterwards
    ok('sync: (the old whole-word merge would have kept B and lost the review)', oldPick(A, B).srs.reps === 2);
    for (const [name, m] of [['B merges A', mw(B, A)], ['A merges B', mw(A, B)]]) {
      ok(`sync review-on-A-then-open-on-B (${name}): A's schedule survives`, m.srs.reps === 3 && m.srs.due === A.srs.due, m.srs);
      ok(`sync review-on-A-then-open-on-B (${name}): grade comes with that schedule`, m.grade === 3);
      ok(`sync review-on-A-then-open-on-B (${name}): B's later lastSeen and larger seen count kept`, m.lastSeen === B.lastSeen && m.seen === 4);
      ok(`sync review-on-A-then-open-on-B (${name}): context from the side that has one`, m.context === 'Il pleut.');
    }
  }
  // --- same word reviewed on both phones ---
  {
    const A = word({ srs: srs(5, 10), grade: 3, lastSeen: T0 + 3 * DAY });
    const B = word({ srs: srs(4, 6), grade: 4, lastSeen: T0 + 4 * DAY });
    for (const m of both(A, B)) ok('sync both reviewed: more reps wins, with its grade', m.srs.reps === 5 && m.grade === 3, [m.srs, m.grade]);
    const A2 = word({ srs: srs(4, 9), grade: 2, lastSeen: T0 + 3 * DAY });
    const B2 = word({ srs: srs(4, 6), grade: 4, lastSeen: T0 + 4 * DAY });
    for (const m of both(A2, B2)) ok('sync both reviewed, same reps: later due is the tiebreak (grade follows)', m.srs.due === A2.srs.due && m.grade === 2, [m.srs, m.grade]);
    const A3 = word({ srs: srs(4, 6), grade: 2, lastSeen: T0 + 3 * DAY });
    const B3 = word({ srs: srs(4, 6), grade: 5, lastSeen: T0 + 4 * DAY });
    for (const m of both(A3, B3)) ok('sync identical schedules: the later touch wins (known mark in the reader)', m.grade === 5 && m.srs.reps === 4);
    for (const m of both(A, B)) ok('sync: result is a plain word, no stray fields', Object.keys(m).every(k => k in A || k in B), Object.keys(m));
  }
  // --- added / context ---
  {
    const A = word({ added: T0 + 5 * DAY, context: '', srs: srs(1, 1) });
    const B = word({ added: T0 + 1 * DAY, context: 'Ce matin il pleuvait.', srs: srs(1, 1) });
    const m = mw(A, B);
    ok('sync: keeps the earlier `added`', m.added === T0 + 1 * DAY);
    ok('sync: first non-empty context (local first, then remote)', m.context === 'Ce matin il pleuvait.' && mw(B, { ...A, context: 'x' }).context === 'Ce matin il pleuvait.');
  }
  // --- a word on one side only is kept as it is (a deletion on one phone does not propagate) ---
  {
    const only = word({ key: 'seul', form: 'seul', srs: srs(2, 3) });
    ok('sync: word only on remote is added unchanged', mw(undefined, only) === only);
    ok('sync: word only on local is kept unchanged', mw(only, undefined) === only);
    reset();
    T.state.words = { 'fr:local': word({ key: 'local', form: 'local' }) };           // B deleted "fr:gone", still has "fr:local"
    const remote = { words: { 'fr:gone': word({ key: 'gone', form: 'gone', srs: srs(3, 4) }) } }; // A still has "gone"
    mr(remote);
    ok('sync: word deleted on one phone comes back from the other, nothing else is dropped', !!T.state.words['fr:gone'] && !!T.state.words['fr:local'] && Object.keys(T.state.words).length === 2, Object.keys(T.state.words));
  }
  // --- old 1.7 words (no srs, due/interval/reps instead) ---
  {
    const legacy = word({ grade: 3, reps: 3, interval: 3 * DAY, due: T0 + 3 * DAY, lastSeen: T0 + 2 * DAY });   // 1.7 phone, had reached days
    const fresh = word({ grade: 2, srs: srs(1, 1), lastSeen: T0 + 1 * DAY });                                  // 1.8 phone, one review
    for (const m of both(JSON.parse(JSON.stringify(legacy)), JSON.parse(JSON.stringify(fresh)))) {
      ok('sync 1.7 word: migrated, then its longer history wins', m.srs && m.srs.reps === 3 && m.srs.ivl === 3 && m.grade === 3, m);
      ok('sync 1.7 word: legacy due/interval/reps fields are gone', !('due' in m) && !('interval' in m) && !('reps' in m), Object.keys(m));
    }
    const legacyLow = word({ grade: 2, reps: 1, interval: 10 * MIN, due: T0 + 10 * MIN, lastSeen: T0 });         // 1.7 10-minute step: restarts as a new card
    const same = word({ grade: 4, lastSeen: T0 + 1 * DAY });                                                      // no srs either
    for (const m of both(JSON.parse(JSON.stringify(legacyLow)), JSON.parse(JSON.stringify(same)))) {
      ok('sync 1.7 words without srs on both sides: later touch wins, no srs invented', m.grade === 4 && m.srs === undefined && !('due' in m), m);
    }
    const m3 = mw(JSON.parse(JSON.stringify(fresh)), word({ grade: 1, lastSeen: T0 }));   // new on the other phone: scheduled side wins
    ok('sync: a scheduled word beats an unscheduled one', m3.srs && m3.srs.reps === 1 && m3.grade === 2);
  }
  // --- srsLog: max per day for n and r ---
  {
    const a = { '2026-1-10': { n: 5, r: 20 }, '2026-1-11': { n: 1, r: 2 } };
    const b = { '2026-1-10': { n: 8, r: 10 }, '2026-1-12': { n: 3, r: 4 } };
    const m = ms(a, b), m2 = ms(b, a);
    eq('sync srsLog: max per day, union of days', m, { '2026-1-10': { n: 8, r: 20 }, '2026-1-11': { n: 1, r: 2 }, '2026-1-12': { n: 3, r: 4 } });
    eq('sync srsLog: order does not matter', m, m2);
    eq('sync srsLog: missing sides', [ms(undefined, b), ms(a, undefined), ms(undefined, undefined)], [b, a, {}]);
    ok('sync srsLog: inputs not mutated', JSON.stringify(a) === JSON.stringify({ '2026-1-10': { n: 5, r: 20 }, '2026-1-11': { n: 1, r: 2 } }));
  }
  // --- the whole payload ---
  {
    reset();
    T.state.words = { 'fr:pluie': word({ srs: srs(2, 2), grade: 2, lastSeen: T0 + 2 * DAY, seen: 4 }) };
    T.state.srsLog = { '2026-1-10': { n: 2, r: 5 } };
    T.state.stats = { '2026-1-10': { read: 10, listened: 0, added: 1 } };
    const remote = {
      words: { 'fr:pluie': word({ srs: srs(3, 5), grade: 3, lastSeen: T0 + 1 * DAY }), 'fr:neige': word({ key: 'neige', form: 'neige', grade: 1 }) },
      srsLog: { '2026-1-10': { n: 1, r: 9 }, '2026-1-11': { n: 4, r: 4 } },
      stats: { '2026-1-10': { read: 30, listened: 5, added: 0 } }
    };
    const remoteCopy = JSON.stringify(remote);
    mr(remote);
    ok('sync payload: reviewed word keeps the review done on the other phone', T.state.words['fr:pluie'].srs.reps === 3 && T.state.words['fr:pluie'].grade === 3);
    ok('sync payload: new word added', !!T.state.words['fr:neige']);
    eq('sync payload: srsLog merged', T.state.srsLog, { '2026-1-10': { n: 2, r: 9 }, '2026-1-11': { n: 4, r: 4 } });
    eq('sync payload: stats still merged by max (unchanged behaviour)', T.state.stats['2026-1-10'], { read: 30, listened: 5, added: 1 });
    const once = JSON.parse(JSON.stringify(T.state.words));
    mr(JSON.parse(remoteCopy));
    ok('sync payload: merging the same state again changes nothing (idempotent)', same(T.state.words, once));
    let threw = false; try { mr({}); } catch (e) { threw = true; }
    ok('sync payload: a payload without words is rejected', threw);
    // two phones converge: B merges A and pushes back, A adopts it; a second round is a no-op
    const A = { words: { 'fr:x': word({ key: 'x', form: 'x', srs: srs(4, 8), grade: 3 }) }, srsLog: { d: { n: 1, r: 6 } } };
    reset(); T.state.words = { 'fr:x': word({ key: 'x', form: 'x', srs: srs(2, 2), grade: 2, lastSeen: T0 + 9 * DAY }) }; T.state.srsLog = { d: { n: 3, r: 2 } };
    mr(JSON.parse(JSON.stringify(A)));
    const bMerged = JSON.parse(JSON.stringify({ words: T.state.words, srsLog: T.state.srsLog }));
    reset(); T.state.words = JSON.parse(JSON.stringify(A.words)); T.state.srsLog = JSON.parse(JSON.stringify(A.srsLog));
    mr(JSON.parse(JSON.stringify(bMerged)));
    eq('sync: both phones end with the same srs and counters', { s: T.state.words['fr:x'].srs, log: T.state.srsLog }, { s: bMerged.words['fr:x'].srs, log: bMerged.srsLog });
  }

  process.exit(summary() ? 1 : 0);
}
