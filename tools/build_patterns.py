#!/usr/bin/env python3
"""Sentence patterns ranked by how often they occur in real French.

  tools/build_patterns.py data/patterns/fr-candidates.json data/patterns/fr.json

Counts every candidate pattern's regex over Tatoeba's French sentences
(lowercased, ’ → ', spaces collapsed) and ranks them all; nothing is dropped.
Each pattern gets up to 6 real example sentences with their human
translations: English, plus Hungarian, German, Spanish, Chinese and Hebrew
where Tatoeba has them (directly or through the English translation; "via"
says which). Tatoeba text is CC BY 2.0 FR; the sentence ids are kept for
attribution. The downloads go to data/raw/tatoeba (not in git).
"""
import bz2
import collections
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/tatoeba'
BASE = 'https://downloads.tatoeba.org/exports/per_language/'
OTHER = ['hun', 'deu', 'spa', 'cmn', 'heb']


def fetch(name, url):
    path = RAW / name
    if not path.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        path.write_bytes(bz2.decompress(urllib.request.urlopen(url, timeout=300).read()))
    return path


def sentences(lang):
    out = {}
    for line in open(fetch(f'{lang}_sentences.tsv', f'{BASE}{lang}/{lang}_sentences.tsv.bz2'), encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3:
            out[int(p[0])] = p[2]
    return out


def links(a, b):
    out = collections.defaultdict(list)
    for line in open(fetch(f'{a}-{b}_links.tsv', f'{BASE}{a}/{a}-{b}_links.tsv.bz2')):
        x, y = line.split('\t')
        out[int(x)].append(int(y))
    return out


def norm(s):
    return re.sub(r'\s+', ' ', s.lower().replace('’', "'")).strip()


def main(src, dst):
    cands = json.load(open(src, encoding='utf-8'))
    fra, eng = sentences('fra'), sentences('eng')
    other = {l: sentences(l) for l in OTHER}
    fe = links('fra', 'eng')
    direct = {l: links('fra', l) for l in OTHER}
    via = {l: links('eng', l) for l in OTHER}

    def translations(fid):
        e = next((x for x in fe.get(fid, []) if x in eng), None)
        if e is None:
            return None
        tr = {'eng': {'id': e, 'text': eng[e]}}
        for l in OTHER:
            t = next((x for x in direct[l].get(fid, []) if x in other[l]), None)
            how = 'direct'
            if t is None:
                t = next((x for x in via[l].get(e, []) if x in other[l]), None)
                how = 'via-eng'
            if t is not None:
                tr[l] = {'id': t, 'text': other[l][t], 'via': how}
        return tr

    texts = [(i, t, norm(t)) for i, t in fra.items()]
    out = []
    for c in cands:
        rx = re.compile(c['regex'])
        hits = [(i, t) for i, t, n in texts if rx.search(n)]
        # Short sentences translated into the most languages make the best cards.
        pool = [(i, t) for i, t in hits if 12 <= len(t) <= 80 and fe.get(i)]
        random.Random(c['id']).shuffle(pool)
        scored = []
        for i, t in pool[:400]:
            tr = translations(i)
            if tr:
                scored.append((-len(tr), len(t), i, t, tr))
        scored.sort()
        examples = [{'fra_id': i, 'fra': t, 'tr': tr} for _, _, i, t, tr in scored[:6]]
        out.append({**c, 'count': len(hits), 'examples': examples})
    out.sort(key=lambda p: -p['count'])
    for n, p in enumerate(out, 1):
        p['rank'] = n
    meta = {'lang': 'fr', 'corpus': 'Tatoeba French', 'sentences': len(texts),
            'licence': 'Example sentences: Tatoeba (tatoeba.org), CC BY 2.0 FR; ids kept for attribution.',
            'normalisation': "lowercase, ’ → ', whitespace collapsed; re.search"}
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    json.dump({'meta': meta, 'patterns': out}, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(out)} patterns ranked over {len(texts)} sentences -> {dst}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
