#!/usr/bin/env python3
"""Fill the reading (`tr`) of the Japanese and Cantonese packs.

  tools/add_readings.py ja      kana for every kanji word, on/kun readings for single kanji
  tools/add_readings.py yue     jyutping for every Cantonese headword written only in Han characters
  tools/add_readings.py all

Why: the ja pack (English Wiktionary via kaikki.org) carried IPA where a learner expects kana, and the yue pack
(CC-CEDICT) has pinyin-era data and no Cantonese reading at all. Run this after tools/build_pack.py / build_zh_pack.py;
it rewrites data/packs/<lang>.json.gz and app/assets/dict/<lang>.json.gz in place.

Sources (downloaded to data/raw/readings, not in git, checksums pinned below; no third-party code is executed, both are
read as plain data):
  ja   JMdict + KANJIDIC2 from the PyPI package jamdict-data 1.5 (a SQLite export, April 2021).
       EDRDG, Creative Commons Attribution-ShareAlike 3.0.
  yue  src/trie.txt of CanCLID/to-jyutping 3.1.1 (BSD 2-Clause), decoded here by a port of its Trie.ts decoder. A word
       found in the trie gets its attested reading; otherwise the reading is assembled from the longest attested pieces
       and single characters, exactly as that library does. Words with any character the trie does not know stay empty.
Nothing is guessed: an entry with no source reading keeps an empty `tr`.
"""
import collections
import gzip
import hashlib
import json
import lzma
import re
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/readings'
PACKS = [ROOT / 'data/packs', ROOT / 'app/assets/dict']

JAMDICT_URL = 'https://pypi.org/pypi/jamdict-data/1.5/json'
JAMDICT_SHA256 = None   # taken from PyPI's own JSON and verified against the download
TRIE_URL = 'https://raw.githubusercontent.com/CanCLID/to-jyutping/3.1.1/src/trie.txt'
TRIE_SHA256 = '4995ec440243d468a4c816697e7fd9a87b8efbb90e54db119deb78c829a87729'


def curl(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['curl', '-fsSL', '--max-time', '900', '-o', str(dest), url], check=True)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def read_pack(lang):
    with gzip.open(PACKS[1] / f'{lang}.json.gz', 'rt', encoding='utf-8') as f:
        return json.load(f)


def write_pack(lang, pack):
    raw = json.dumps(pack, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    for d in PACKS:
        d.mkdir(parents=True, exist_ok=True)
        with gzip.open(d / f'{lang}.json.gz', 'wb', compresslevel=9) as f:
            f.write(raw)


def add_source(pack, text):
    srcs = pack['meta'].setdefault('sources', [])
    if text not in srcs:
        srcs.append(text)


# ------------------------------------------------------------------ Japanese
KANA = re.compile(r'^[぀-ヿー・]+$')
HAN = re.compile(r'[一-鿿々〆]')
WORD = re.compile(r"[a-z]{3,}")


def jamdict_db():
    import json as _json
    db = RAW / 'jamdict.db'
    if db.exists():
        return db
    meta = RAW / 'jamdict-data.json'
    curl(JAMDICT_URL, meta)
    info = _json.load(open(meta, encoding='utf-8'))
    sdist = next(u for u in info['urls'] if u['packagetype'] == 'sdist')
    tgz = RAW / 'jamdict-data-1.5.tar.gz'
    curl(sdist['url'], tgz)
    if sha256(tgz) != sdist['digests']['sha256']:
        sys.exit('jamdict-data download does not match the checksum published by PyPI')
    with tarfile.open(tgz) as t:
        member = t.getmember('jamdict_data-1.5/jamdict_data/jamdict.db.xz')
        with t.extractfile(member) as src, lzma.open(src) as xz, open(db, 'wb') as out:
            while True:
                block = xz.read(1 << 20)
                if not block:
                    break
                out.write(block)
    return db


def priority(tags):
    score = 0.0
    for t in tags:
        if re.fullmatch(r'(ichi|news|spec|gai)1', t):
            score += 2
        elif re.fullmatch(r'(ichi|news|spec|gai)2', t):
            score += 1
        elif t.startswith('nf'):
            score += (49 - int(t[2:])) / 48
    return score


def tokens(glosses):
    out = set()
    for g in glosses:
        out.update(WORD.findall(g.lower()))
    return out


def japanese():
    import sqlite3
    con = sqlite3.connect(f'file:{jamdict_db()}?mode=ro', uri=True)
    kanji = collections.defaultdict(list)           # kanji text -> [(Kanji.ID, idseq)]
    for kid, idseq, text in con.execute('select ID, idseq, text from Kanji'):
        kanji[text].append((kid, idseq))
    kpri = collections.defaultdict(list)
    for kid, text in con.execute('select kid, text from KJP'):
        kpri[kid].append(text)
    kana = collections.defaultdict(list)            # idseq -> [(Kana.ID, text)] (JMdict order, usual reading first)
    for kid, idseq, text, nokanji in con.execute('select ID, idseq, text, nokanji from Kana order by ID'):
        if not nokanji:
            kana[idseq].append((kid, text))
    restr = collections.defaultdict(set)            # Kana.ID -> kanji spellings it is restricted to
    for kid, text in con.execute('select kid, text from KNR'):
        restr[kid].add(text)
    npri = collections.defaultdict(list)
    for kid, text in con.execute('select kid, text from KNP'):
        npri[kid].append(text)
    gloss = collections.defaultdict(set)
    first = collections.defaultdict(set)             # words of an entry's first sense
    first_sense = {}
    for idseq, sid, text in con.execute("select s.idseq, s.ID, g.text from Sense s join SenseGloss g on g.sid = s.ID "
                                        "where g.lang = 'eng' order by s.ID"):
        gloss[idseq].update(WORD.findall(text.lower()))
        if first_sense.setdefault(idseq, sid) == sid:
            first[idseq].update(WORD.findall(text.lower()))

    def word_reading(w, glosses):
        cands = kanji.get(w)
        if not cands:
            return ''
        want = tokens(glosses)
        want1 = tokens(glosses[:1])
        best = None
        for kid, idseq in cands:
            rows = [(k, t) for k, t in kana[idseq] if not restr[k] or w in restr[k]]
            if not rows:
                continue
            overlap = len(want & gloss[idseq])
            # JMdict lists an entry's usual reading first (今日 きょう before こんにち), so take the first allowed one.
            rt = rows[0][1]
            # Which entry: shared meaning words count (capped), and a common entry beats a rare one (ichi1, news1, nf).
            lead = len(want1 & first[idseq])           # the pack's first meaning is this entry's first meaning
            score = (3 * min(overlap, 2) + 4 * min(lead, 1) + priority(kpri[kid]), -idseq)
            if best is None or score > best[0]:
                best = (score, rt)
        return best[1] if best else ''

    chars = {}
    for lit, gid, rtype, value in con.execute(
            "select c.literal, g.ID, r.r_type, r.value from character c join rm_group g on g.cid = c.ID "
            "join reading r on r.gid = g.ID where r.r_type in ('ja_on', 'ja_kun') order by g.ID"):
        d = chars.setdefault(lit, {'ja_on': [], 'ja_kun': []})
        v = value.replace('.', '').replace('-', '')
        if v and v not in d[rtype]:
            d[rtype].append(v)

    def char_reading(c):
        d = chars.get(c)
        if not d:
            return ''
        parts = [' '.join(d['ja_on'][:2]), ' '.join(d['ja_kun'][:2])]
        return ' · '.join(p for p in parts if p)

    pack = read_pack('ja')
    stats = collections.Counter()
    for w, e in pack['entries'].items():
        if e.get('pos') == 'character':
            r, kind = char_reading(w), 'character'
        elif KANA.match(w):
            r, kind = '', 'kana'          # already kana: no separate reading
        elif HAN.search(w):
            r, kind = word_reading(w, e.get('g') or []), 'word'
        else:
            r, kind = '', 'other'
        e['tr'] = r
        stats[(kind, bool(r))] += 1
    pack['meta']['version'] = '1.1.0'
    add_source(pack, 'JMdict and KANJIDIC2 (EDRDG) via jamdict-data 1.5, CC BY-SA 3.0: kana readings')
    write_pack('ja', pack)
    print('ja:', dict(stats))
    return pack


# ------------------------------------------------------------------ Cantonese
_ONSET = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'ng', 'gw', 'kw', 'w', 'h', 'z', 'c', 's', 'j']
_NUCLEUS = ['aa', 'a', 'e', 'i', 'o', 'u']
_RHYME = ['oe', 'oen', 'oeng', 'oet', 'oek', 'eoi', 'eon', 'eot', 'yu', 'yun', 'yut', 'm', 'ng']
_CODA = ['', 'i', 'u', 'm', 'n', 'ng', 'p', 't', 'k']


def _syllable(code):
    final = (code % 402) // 6
    mid = _RHYME[final - 54] if final >= 54 else _NUCLEUS[final // 9] + _CODA[final % 9]
    return _ONSET[code // 402] + mid + str((code % 6) + 1)


class _Node:
    __slots__ = ('ch', 'v')

    def __init__(self):
        self.ch = {}
        self.v = None


def load_trie():
    """Port of the decoder in to-jyutping's src/Trie.ts (reads the data only)."""
    path = RAW / 'trie.txt'
    if not path.exists():
        curl(TRIE_URL, path)
    if sha256(path) != TRIE_SHA256:
        sys.exit('trie.txt does not match the pinned checksum')
    s = open(path, encoding='utf-8').read()
    root = _Node()
    stack, depth = [root], [0]
    i = 1
    while stack:
        p, d = stack[-1], depth[-1]
        while ord(s[i]) >= 256:
            u = _Node()
            p.ch[s[i]] = u
            i += 1
            p = u
            d += 1
        v = []
        while ord(s[i]) < 123:
            w, c = [], 0
            while c < d:
                code = (ord(s[i]) - 33) * 90 + (ord(s[i + 1]) - 33)
                i += 2
                w.append(_syllable(code))
                if s[i] == '~':
                    i += 1
                else:
                    c += 1
            v.append(' '.join(w))
        if v:
            p.v = v
        if s[i] == '{':
            i += 1
            stack.append(p)
            depth.append(d)
        elif s[i] == '}':
            i += 1
            stack.pop()
            depth.pop()
    return root


def jyutping_list(root, text):
    """[(character, syllable or None)], longest attested entry first (Trie.get)."""
    a, r, i = list(text), [], 0
    while i < len(a):
        t, c, k = root, '', i
        for j in range(i, len(a)):
            u = t.ch.get(a[j])
            if not u:
                break
            t = u
            if u.v:
                c, k = u.v[0], j
        if k == i:
            r.append((a[i], c or None))
            i += 1
        else:
            d, n = c.split(' '), i
            while i <= k:
                r.append((a[i], d[i - n]))
                i += 1
    return r


HAN_ONLY = re.compile(r'^[㐀-䶿一-鿿々\U00020000-\U0002ffff]+$')


def cantonese():
    root = load_trie()
    pack = read_pack('yue')
    stats = collections.Counter()
    for w, e in pack['entries'].items():
        r = ''
        if HAN_ONLY.match(w):
            lst = jyutping_list(root, w)
            if all(v for _, v in lst):
                r = ' '.join(v for _, v in lst)
        e['tr'] = r
        stats['with jyutping' if r else 'no reading'] += 1
    pack['meta']['version'] = '1.1.0'
    add_source(pack, 'to-jyutping 3.1.1 by CanCLID (BSD 2-Clause): jyutping readings')
    write_pack('yue', pack)
    print('yue:', dict(stats))
    return pack


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what not in ('ja', 'yue', 'all'):
        sys.exit(__doc__)
    if what in ('ja', 'all'):
        japanese()
    if what in ('yue', 'all'):
        cantonese()
