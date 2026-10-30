#!/usr/bin/env python3
import json, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'app/assets/www/index.html').read_text(encoding='utf-8')
JS = (ROOT / 'app/assets/www/js/app.js').read_text(encoding='utf-8')
WATCH = (ROOT / 'app/assets/www/js/watch.js').read_text(encoding='utf-8')

strings = set()
for m in re.finditer(r'>([^<>]*[\u0590-\u05FF][^<>]*)<', HTML):
    strings.add(m.group(1))
for m in re.finditer(r'(?:placeholder|aria-label|title)="([^"]*[\u0590-\u05FF][^"]*)"', HTML):
    strings.add(m.group(1))
for src in (JS, WATCH):
    for m in re.finditer(r"(['\"`])((?:(?!\1).)*[\u0590-\u05FF](?:(?!\1).)*)\1", src):
        strings.add(m.group(2))

clean = []
for s in strings:
    s = re.sub(r'\s+', ' ', s).strip()
    if not s or len(s) > 180: continue
    if '${' in s or '<' in s or '>' in s or 'http' in s or 'function' in s or '=>' in s: continue
    if not re.search(r'[\u0590-\u05FF]', s): continue
    if s not in clean: clean.append(s)
clean.sort(key=lambda x: (-len(x), x))

MANUAL = {
    'נר': {'en': 'Ner', 'hu': 'Ner'},
    'מילים נדלקות': {'en': 'words light up', 'hu': 'a szavak világítanak'},
    'נר — מילים נדלקות': {'en': 'Ner — words light up', 'hu': 'Ner — a szavak világítanak'},
    'עברית': {'en': 'Hebrew', 'hu': 'héber'},
    'אנגלית': {'en': 'English', 'hu': 'angol'},
    'הונגרית': {'en': 'Hungarian', 'hu': 'magyar'},
    'היום': {'en': 'Today', 'hu': 'Ma'},
    'אתמול': {'en': 'Yesterday', 'hu': 'Tegnap'},
    'מילים': {'en': 'Words', 'hu': 'Szavak'},
    'קריאה': {'en': 'Read', 'hu': 'Olvasás'},
    'בית': {'en': 'Home', 'hu': 'Kezdőlap'},
    'צפייה': {'en': 'Watch', 'hu': 'Nézés'},
    'התקדמות': {'en': 'Progress', 'hu': 'Haladás'},
    'הגדרות': {'en': 'Settings', 'hu': 'Beállítások'},
    'חדשות': {'en': 'new', 'hu': 'új'},
    'בלימוד': {'en': 'learning', 'hu': 'tanulás'},
    'ידועות': {'en': 'known', 'hu': 'ismert'},
    'דילגתי': {'en': 'ignored', 'hu': 'kihagyva'},
    'מילה': {'en': 'word', 'hu': 'szó'},
    'מילים נקראו': {'en': 'words read', 'hu': 'elolvasott szavak'},
    'ימים ברצף': {'en': 'day streak', 'hu': 'napos sorozat'},
    'פרקים': {'en': 'chapters', 'hu': 'fejezet'},
    'עמוד': {'en': 'page', 'hu': 'oldal'},
    'עמודים': {'en': 'pages', 'hu': 'oldal'},
    'סימניות': {'en': 'bookmarks', 'hu': 'könyvjelzők'},
    'תוכן': {'en': 'Contents', 'hu': 'Tartalom'},
    'ספרים': {'en': 'Books', 'hu': 'Könyvek'},
    'אינטרנט': {'en': 'Web', 'hu': 'Web'},
}

def translate_batch(lines, tl):
    q = '\n'.join(lines)
    url = ('https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=' + tl +
           '&dt=t&q=' + urllib.parse.quote(q))
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                data = json.loads(r.read().decode('utf-8'))
            if not data or not data[0]: return None
            parts = [p[0] for p in data[0] if p and p[0]]
            text = ''.join(parts)
            out = [x.strip() for x in text.split('\n')]
            if len(out) == len(lines):
                return out
        except Exception:
            time.sleep(1)
    return None

def translate_all(tl):
    result = {}
    for s in clean:
        if s in MANUAL and tl in MANUAL[s]:
            result[s] = MANUAL[s][tl]
    rest = [s for s in clean if s not in result]
    for i in range(0, len(rest), 25):
        chunk = rest[i:i+25]
        out = translate_batch(chunk, tl)
        if out:
            for a, b in zip(chunk, out):
                result[a] = b
        else:
            for a in chunk:
                one = translate_batch([a], tl)
                if one: result[a] = one[0]
        print(tl, i + len(chunk), '/', len(rest), flush=True)
        time.sleep(0.15)
    return result

en = translate_all('en')
hu = translate_all('hu')
# keep only useful, non-empty entries
en = {k: v for k, v in en.items() if v}
hu = {k: v for k, v in hu.items() if v}
data = {'en': en, 'hu': hu}
(ROOT / 'data/i18n.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'app/assets/www/js/i18n.js').write_text('window.NER_I18N = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print('strings', len(clean), 'en', len(en), 'hu', len(hu))
