#!/usr/bin/env python3
"""Merge hand-curated sayings into the phrase packs.

data/phrases-extra/<lang>.tsv lines: kind<TAB>phrase<TAB>English meaning
(kind is proverb, idiom or phrase; '#' starts a comment). Entries already in
the Wiktionary-built pack win; curated ones only fill gaps. Run after
tools/build_phrases.py, which rewrites the packs from kaikki.org.
"""
import gzip, json, sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
SOURCE = 'Shoresh curated sayings'

def main(langs):
    extra = root / 'data/phrases-extra'
    files = sorted(extra.glob('*.tsv')) if not langs else [extra / (l + '.tsv') for l in langs]
    for f in files:
        lang = f.stem
        pack = root / 'app/assets/dict/phrases' / (lang + '.json.gz')
        data = json.load(gzip.open(pack)) if pack.exists() else {'meta': {'id': lang, 'unspaced': False, 'elision': [], 'slots': [], 'poss': [], 'refl': [], 'sources': []}, 'phrases': {}}
        phrases = data['phrases']
        added = 0
        for line in f.read_text(encoding='utf-8').splitlines():
            if not line.strip() or line.startswith('#'):
                continue
            kind, w, gloss = line.split('\t')
            key = ' '.join(w.lower().split())
            if key in phrases:
                continue
            phrases[key] = {'w': w, 'k': kind, 'g': [g.strip() for g in gloss.split(';') if g.strip()], 'tr': '', 't': key.split(' ')}
            added += 1
        meta = data['meta']
        meta['count'] = len(phrases)
        if added and SOURCE not in meta.get('sources', []):
            meta.setdefault('sources', []).append(SOURCE)
        with gzip.open(pack, 'wt', encoding='utf-8', compresslevel=9) as out:
            json.dump(data, out, ensure_ascii=False, separators=(',', ':'))
        print(f'{lang}: +{added}, {len(phrases)} phrases')

if __name__ == '__main__':
    main(sys.argv[1:])
