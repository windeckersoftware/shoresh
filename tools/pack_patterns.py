#!/usr/bin/env python3
"""Build app/assets/www/patterns/<lang>.js, the sentence-pattern packs the app loads on demand.

  tools/pack_patterns.py

Two sources:
  * Tatoeba (he, fr): data/patterns/<lang>.json from tools/build_patterns.py. Real sentences with
    human translations (CC BY 2.0 FR, sentence ids kept), ranked by frequency, 6 examples each.
  * Written for Shoresh (every other language): tools/authored_patterns/<lang>.py. Short example
    sentences with an English gloss (English itself: Hebrew and Hungarian translations), ordered by level. They were composed, not drawn from a corpus,
    so they are not frequency-ranked and not native-reviewed.

Every pattern carries `rx`, a regex (Python syntax, \\b/\\w are made Unicode-aware at runtime by
js/patternmatch.js) used to spot the pattern in the sentence being read.
Run `node tools/check_patterns.js` afterwards: every example must match its own pattern.
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/patterns'
AUTHORED = ROOT / 'tools/authored_patterns'
OUT = ROOT / 'app/assets/www/patterns'
TR = {'eng': 'en', 'hun': 'hu', 'deu': 'de', 'spa': 'es', 'cmn': 'zh', 'fra': 'fr', 'heb': 'he'}
PER = 6


def pick(examples, field):
    ok = [e for e in examples if 20 <= len(e[field]) <= 90 and 'eng' in e['tr']]
    ok.sort(key=lambda e: (-len(e['tr']), len(e[field])))  # best translated, then short
    return (ok or examples)[:PER]


def from_tatoeba(lang):
    d = json.load(open(SRC / f'{lang}.json', encoding='utf-8'))
    field = 'heb' if lang == 'he' else 'fra'
    out = []
    for p in d['patterns']:
        # i = Tatoeba id of the sentence, ti = ids of its translations by language code (CC BY 2.0 FR attribution).
        ex = [{'s': e[field], 'i': e[field + '_id'],
               't': {TR[k]: v['text'] for k, v in e['tr'].items() if k in TR},
               'ti': {TR[k]: v['id'] for k, v in e['tr'].items() if k in TR}} for e in pick(p['examples'], field)]
        out.append({'id': p['id'], 'p': p[lang], 'en': p['en'], 'f': p['function'], 'c': p['cefr'],
                    'r': p['rank'], 'n': p['count'], 'rx': p['regex'], 'x': ex})
    return out


def authored_example(e):
    """(sentence, English) or (sentence, None, {'he': ..., 'hu': ...}) when the sentence is English itself."""
    if len(e) == 3:
        return {'s': e[0], 't': dict(e[2])}
    return {'s': e[0], 't': {'en': e[1]}}


def from_authored(path):
    spec = importlib.util.spec_from_file_location('authored_' + path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    out = []
    for n, (pid, text, gloss, cefr, rx, examples) in enumerate(mod.PATTERNS, 1):
        out.append({'id': pid, 'p': text, 'en': gloss, 'c': cefr, 'r': n, 'rx': rx,
                    'x': [authored_example(e) for e in examples]})
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    packs = {lang: from_tatoeba(lang) for lang in ('he', 'fr')}
    for path in sorted(AUTHORED.glob('*.py')):
        packs[path.stem] = from_authored(path)
    for lang, data in packs.items():
        dest = OUT / f'{lang}.js'
        dest.write_text('window.NER_PATTERNS=window.NER_PATTERNS||{};window.NER_PATTERNS.%s=%s;' % (
            lang, json.dumps(data, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
        print(lang, len(data), 'patterns', sum(len(p['x']) for p in data), 'examples', dest.stat().st_size // 1024, 'KB')
    (OUT / 'index.json').write_text(json.dumps({
        'tatoeba': ['he', 'fr'], 'written': sorted(p.stem for p in AUTHORED.glob('*.py'))}), encoding='utf-8')


if __name__ == '__main__':
    main()
