#!/usr/bin/env python3
"""Stroke-order data for the Chinese character view (HanziWriter).

Downloads hanzi-writer-data (Make Me a Hanzi strokes, Arphic Public License)
once and writes one file per character, named by its code point in hex, to
app/assets/hanzi/. The folder is not in git; build.sh runs this when it is
missing. ARPHICPL.TXT goes with the data, as the licence requires.
"""
import base64
import hashlib
import io
import json
import sys
import tarfile
import urllib.request
from pathlib import Path

URL = 'https://registry.npmjs.org/hanzi-writer-data/-/hanzi-writer-data-2.0.1.tgz'
SHA512 = 'nbQwM+MaryGoq7pBMIZLCd3lFq03nXuJuwku1+6UbjL58uU+9OULVcMkoNvNuJSoIV7f1bbPRfD4D/LQa5S7qg=='

root = Path(__file__).resolve().parents[1]
out = root / 'app/assets/hanzi'
if (out / 'ARPHICPL.TXT').exists():
    sys.exit(0)

blob = urllib.request.urlopen(URL, timeout=120).read()
if base64.b64encode(hashlib.sha512(blob).digest()).decode() != SHA512:
    sys.exit('hanzi-writer-data: checksum mismatch')

out.mkdir(parents=True, exist_ok=True)
count = 0
with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tar:
    for m in tar.getmembers():
        name = Path(m.name).name
        if not m.isfile():
            continue
        data = tar.extractfile(m).read()
        if name == 'ARPHICPL.TXT':
            (out / name).write_bytes(data)
        elif name.endswith('.json') and len(name) == 6 and name != 'package.json':
            ch = name[0]
            compact = json.dumps(json.loads(data), separators=(',', ':'))
            (out / ('%x.json' % ord(ch))).write_text(compact, encoding='utf-8')
            count += 1
assert count > 9000, count
print('hanzi strokes:', count)
