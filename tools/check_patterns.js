#!/usr/bin/env node
// Every example sentence must match its own pattern's regex (as the app will run it), every regex must compile,
// and ids must be unique per language. Exit 1 on any failure.
const fs = require('fs'), path = require('path'), vm = require('vm');
const dir = path.join(__dirname, '../app/assets/www');
require(path.join(dir, 'js/patternmatch.js'));
const M = globalThis.NerPatternMatch;
let fail = 0;
// Credit accuracy: Tatoeba ids exist on every example of the packs the app credits to Tatoeba, and on none of the others.
const index = JSON.parse(fs.readFileSync(path.join(dir, 'patterns/index.json'), 'utf8'));
const appSrc = fs.readFileSync(path.join(dir, 'js/app.js'), 'utf8');
const listOf = name => (appSrc.match(new RegExp('const ' + name + ' = \\[([^\\]]*)\\]')) || [, ''])[1].match(/'(\w+)'/g).map(x => x.slice(1, -1)).sort().join(',');
if (listOf('PATTERN_CORPUS') !== index.tatoeba.slice().sort().join(',')) { console.log('app.js PATTERN_CORPUS differs from patterns/index.json tatoeba'); fail++; }
if (listOf('PATTERN_LANGS') !== index.tatoeba.concat(index.written).sort().join(',')) { console.log('app.js PATTERN_LANGS differs from patterns/index.json'); fail++; }
for (const f of fs.readdirSync(path.join(dir, 'patterns')).filter(f => f.endsWith('.js'))) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'patterns', f), 'utf8'), sandbox);
  const lang = f.slice(0, -3), list = sandbox.window.NER_PATTERNS[lang];
  const ids = new Set(); let ex = 0, bad = 0;
  for (const p of list) {
    if (ids.has(p.id)) { console.log(lang, 'duplicate id', p.id); fail++; }
    ids.add(p.id);
    const rx = M.compile(p.rx);
    if (!rx) { console.log(lang, p.id, 'regex does not compile:', p.rx); fail++; continue; }
    const tat = index.tatoeba.includes(lang);
    for (const e of p.x) {
      if (tat && !(e.i && e.ti && Object.keys(e.t).every(k => e.ti[k]))) { console.log(lang, p.id, 'Tatoeba example without sentence/translation ids:', e.s); fail++; }
      if (!tat && (e.i || e.ti)) { console.log(lang, p.id, 'hand-written example carries Tatoeba ids:', e.s); fail++; }
    }
    for (const e of p.x) { ex++; if (!rx.test(M.norm(e.s))) { bad++; fail++; console.log(lang, p.id, 'NO MATCH:', e.s, '|', p.rx); } }
  }
  console.log(`${lang}: ${list.length} patterns, ${ex} examples, ${bad} not matching`);
}
process.exit(fail ? 1 : 0);
