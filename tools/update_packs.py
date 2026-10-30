#!/usr/bin/env python3
from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
packs = sorted(p.name[:-len('.json.gz')] for p in (root/'app/assets/dict').glob('*.json.gz') if p.stat().st_size > 50000)
out = 'window.NER_PACKS = ' + json.dumps(packs, ensure_ascii=False) + ';\n'
(root/'app/assets/www/js/packs.js').write_text(out, encoding='utf-8')
print('packs:', ', '.join(packs))
