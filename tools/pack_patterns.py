#!/usr/bin/env python3
"""Slim data/patterns/<lang>.json (+ he-topics.json) into the APK's app/assets/www/patterns/.

  tools/pack_patterns.py

Per pattern: id, text, English gloss, function, CEFR, rank, Tatoeba count and
3 short example sentences with translations (en, hu, de, es, zh and the other
of fr/he). Sentence ids are kept for CC BY 2.0 FR attribution. Output is a JS
file assigning window.NER_PATTERNS[lang] so the page needs no fetch (file://).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/patterns'
OUT = ROOT / 'app/assets/www/patterns'
TR = {'eng': 'en', 'hun': 'hu', 'deu': 'de', 'spa': 'es', 'cmn': 'zh', 'fra': 'fr', 'heb': 'he'}
PER = 3


def pick(examples, field):
    ok = [e for e in examples if 20 <= len(e[field]) <= 80 and 'eng' in e['tr']]
    ok.sort(key=lambda e: (len(e['tr']) * -1, len(e[field])))  # best-translated, then short
    return (ok or examples)[:PER]


def pack(lang):
    d = json.load(open(SRC / f'{lang}.json', encoding='utf-8'))
    out = []
    for p in d['patterns']:
        field = lang
        ex = []
        for e in pick(p['examples'], 'heb' if lang == 'he' else 'fra'):
            s = e['heb'] if lang == 'he' else e['fra']
            sid = e['heb_id'] if lang == 'he' else e['fra_id']
            ex.append({'s': s, 'i': sid, 't': {TR[k]: v['text'] for k, v in e['tr'].items() if k in TR}})
        out.append({'id': p['id'], 'p': p[field], 'en': p['en'], 'f': p['function'], 'c': p['cefr'],
                    'r': p['rank'], 'n': p['count'], 'x': ex})
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for lang in ('he', 'fr'):
        data = pack(lang)
        (OUT / f'{lang}.js').write_text(
            'window.NER_PATTERNS=window.NER_PATTERNS||{};window.NER_PATTERNS.%s=%s;' % (
                lang, json.dumps(data, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
        print(lang, len(data), 'patterns', (OUT / f'{lang}.js').stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
