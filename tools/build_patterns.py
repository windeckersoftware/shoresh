#!/usr/bin/env python3
"""Sentence patterns ranked by how often they occur in Tatoeba.

  tools/build_patterns.py data/patterns/fr-candidates.json data/patterns/fr.json
  tools/build_patterns.py data/patterns/he-candidates.json data/patterns/he.json

Counts every candidate pattern's regex over the source language (French or
Hebrew: the language is the one with a "fr" or "he" field on each candidate).
Nothing is dropped. Each pattern gets up to 6 real example sentences with
their human translations: English, plus Hungarian, German, Spanish, Chinese
and the other of French/Hebrew, where Tatoeba has them (directly or through
the English translation; "via" says which). Tatoeba text is CC BY 2.0 FR;
the sentence ids are kept for attribution. Downloads go to data/raw/tatoeba
(not in git). For Hebrew, data/patterns/he-top100.md is written too.
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

LANGS = {
    'fr': {
        'id': 'fr',
        'tatoeba': 'fra',
        'field': 'fr',
        'corpus': 'Tatoeba French',
        'others': ['hun', 'deu', 'spa', 'cmn', 'heb'],
        'span': (12, 80),
    },
    'he': {
        'id': 'he',
        'tatoeba': 'heb',
        'field': 'he',
        'corpus': 'Tatoeba Hebrew',
        'others': ['hun', 'deu', 'spa', 'cmn', 'fra'],
        'span': (6, 90),
    },
}


def fetch(name, url):
    path = RAW / name
    if not path.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        path.write_bytes(bz2.decompress(urllib.request.urlopen(url, timeout=300).read()))
    return path


def sentences(lang):
    out = {}
    path = fetch(f'{lang}_sentences.tsv', f'{BASE}{lang}/{lang}_sentences.tsv.bz2')
    for line in open(path, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 3:
            out[int(p[0])] = p[2]
    return out


def _read_links(path, swap):
    out = collections.defaultdict(list)
    for line in open(path, encoding='utf-8'):
        parts = line.split('\t')
        if len(parts) < 2:
            continue
        x, y = int(parts[0]), int(parts[1])
        if swap:
            x, y = y, x
        out[x].append(y)
    return out


def links(a, b):
    path = RAW / f'{a}-{b}_links.tsv'
    rev = RAW / f'{b}-{a}_links.tsv'
    if path.exists():
        return _read_links(path, False)
    if rev.exists():
        return _read_links(rev, True)
    got = fetch(f'{a}-{b}_links.tsv', f'{BASE}{a}/{a}-{b}_links.tsv.bz2')
    return _read_links(got, False)


def norm(s):
    s = re.sub(r'[\u0591-\u05c7]', '', s)
    s = s.replace('־', ' ').replace('’', "'").replace('׳', "'").replace('״', '"')
    # ג'אז is one word; an apostrophe here must not create a word boundary.
    s = re.sub(r"(?<=[א-ת])'(?=[א-ת])", '', s)
    return re.sub(r'\s+', ' ', s.lower()).strip()


def write_top100(path, meta, patterns, field, code, json_name):
    name = 'Hebrew' if field == 'he' else 'French'
    lines = [
        f'# {name} sentence patterns, ranked by frequency',
        '',
        f"Counted over {meta['sentences']:,} {name} sentences from Tatoeba (CC BY 2.0 FR). "
        f"All {len(patterns)} patterns are kept in `{json_name}`; "
        f"this list shows the top 100. Examples are real Tatoeba sentences with their human English translation.",
        '',
        f'| # | {name} pattern | English | Level | Count | Example |',
        '|---|---|---|---|---|---|',
    ]
    for p in patterns[:100]:
        ex = ''
        if p['examples']:
            e = p['examples'][0]
            src = e[code].replace('|', '\\|').replace('\n', ' ')
            eng = e['tr']['eng']['text'].replace('|', '\\|').replace('\n', ' ')
            ex = f'{src} — *{eng}*'
        lines.append(
            f"| {p['rank']} | {p[field]} | {p['en']} | {p['cefr']} | {p['count']:,} | {ex} |"
        )
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main(src, dst):
    cands = json.load(open(src, encoding='utf-8'))
    key = 'he' if cands and 'he' in cands[0] else 'fr'
    lang = LANGS[key]
    code = lang['tatoeba']
    field = lang['field']
    lo, hi = lang['span']
    print(f'loading {code} sentences', flush=True)
    src_sents = sentences(code)
    eng = sentences('eng')
    other = {l: sentences(l) for l in lang['others']}
    fe = links(code, 'eng')
    direct = {l: links(code, l) for l in lang['others']}
    via = {l: links('eng', l) for l in lang['others']}

    def translations(sid):
        e = next((x for x in fe.get(sid, []) if x in eng), None)
        if e is None:
            return None
        tr = {'eng': {'id': e, 'text': eng[e]}}
        for l in lang['others']:
            t = next((x for x in direct[l].get(sid, []) if x in other[l]), None)
            how = 'direct'
            if t is None:
                t = next((x for x in via[l].get(e, []) if x in other[l]), None)
                how = 'via-eng'
            if t is not None:
                tr[l] = {'id': t, 'text': other[l][t], 'via': how}
        return tr

    texts = [(i, t, norm(t)) for i, t in src_sents.items()]
    out = []
    for n, c in enumerate(cands, 1):
        rx = re.compile(c['regex'])
        hits = [(i, t) for i, t, s in texts if rx.search(s)]
        pool = [(i, t) for i, t in hits if lo <= len(t) <= hi and fe.get(i)]
        random.Random(c['id']).shuffle(pool)
        scored = []
        for i, t in pool[:400]:
            tr = translations(i)
            if tr:
                scored.append((-len(tr), len(t), i, t, tr))
        scored.sort()
        examples = [{f'{code}_id': i, code: t, 'tr': tr} for _, _, i, t, tr in scored[:6]]
        out.append({**c, 'count': len(hits), 'examples': examples})
        print(f'{n}/{len(cands)} {c["id"]} {len(hits)}', flush=True)
    out.sort(key=lambda p: -p['count'])
    for n, p in enumerate(out, 1):
        p['rank'] = n
    meta = {
        'lang': lang['id'],
        'corpus': lang['corpus'],
        'sentences': len(texts),
        'licence': 'Example sentences: Tatoeba (tatoeba.org), CC BY 2.0 FR; ids kept for attribution.',
        'normalisation': "lowercase, ’ → ', Hebrew niqqud and maqaf folded, whitespace collapsed; re.search",
    }
    dest = Path(dst)
    dest.parent.mkdir(parents=True, exist_ok=True)
    json.dump({'meta': meta, 'patterns': out}, open(dest, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(out)} patterns ranked over {len(texts)} sentences -> {dest}')
    if lang['id'] == 'he':
        md = dest.with_name('he-top100.md')
        write_top100(md, meta, out, field, code, dest.name)
        print(f'top 100 -> {md}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
