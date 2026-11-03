#!/usr/bin/env python3
"""Write tools/pattern_names.py into data/patterns/<lang>-candidates.json and <lang>.json (ids/regexes untouched).

  tools/apply_pattern_names.py

Keeps a fresh run of tools/build_patterns.py (which reads the candidates) consistent with the shipped packs.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pattern_names  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'data/patterns'


def apply(path, names, lang, wrapped):
    data = json.load(open(path, encoding='utf-8'))
    items = data['patterns'] if wrapped else data
    ids = [p['id'] for p in items]
    missing, extra = sorted(set(ids) - set(names)), sorted(set(names) - set(ids))
    if missing or extra:
        sys.exit(f'{path.name}: missing names {missing}, unknown ids {extra}')
    for p in items:
        before = (p['id'], p['regex'])
        p[lang], p['en'] = names[p['id']]
        assert before == (p['id'], p['regex'])
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return len(items)


if __name__ == '__main__':
    for lang, names in (('fr', pattern_names.FR), ('he', pattern_names.HE)):
        n1 = apply(D / f'{lang}-candidates.json', names, lang, False)
        n2 = apply(D / f'{lang}.json', names, lang, True)
        print(lang, n1, 'candidates,', n2, 'built patterns')
