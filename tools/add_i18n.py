#!/usr/bin/env python3
import json, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'app/assets/www/index.html').read_text(encoding='utf-8')
JS = (ROOT / 'app/assets/www/js/app.js').read_text(encoding='utf-8')
WATCH = (ROOT / 'app/assets/www/js/watch.js').read_text(encoding='utf-8')

strings = set()
for m in re.finditer(r'>([^<>]*[\u0590-\u05FF][^<>]*)<', HTML): strings.add(m.group(1))
for m in re.finditer(r'(?:placeholder|aria-label|title)="([^"]*[\u0590-\u05FF][^"]*)"', HTML): strings.add(m.group(1))
for src in (JS, WATCH):
    for m in re.finditer(r"(['\"`])((?:(?!\1).)*[\u0590-\u05FF](?:(?!\1).)*)\1", src): strings.add(m.group(2))

clean=[]
for s in strings:
    s=re.sub(r'\s+',' ',s).strip()
    if not s or len(s)>180: continue
    if '${' in s or '<' in s or '>' in s or 'http' in s or 'function' in s or '=>' in s: continue
    if not re.search(r'[\u0590-\u05FF]',s): continue
    if s not in clean: clean.append(s)

def translate_batch(lines, tl):
    url=('https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl='+tl+'&dt=t&q='+urllib.parse.quote('\n'.join(lines)))
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=15) as r: data=json.loads(r.read().decode('utf-8'))
            if not data or not data[0]: return None
            text=''.join(p[0] for p in data[0] if p and p[0])
            out=[x.strip() for x in text.split('\n')]
            if len(out)==len(lines): return out
        except Exception: time.sleep(1)
    return None

new={}
for tl in ['es','fr','de','ru','ar']:
    result={}
    for i in range(0,len(clean),25):
        chunk=clean[i:i+25]
        out=translate_batch(chunk,tl)
        if out:
            for a,b in zip(chunk,out): result[a]=b
        else:
            for a in chunk:
                one=translate_batch([a],tl)
                if one: result[a]=one[0]
        print(tl,i+len(chunk),'/',len(clean),flush=True)
        time.sleep(0.12)
    new[tl]=result

# manual fixes for key labels
manual = {
 'es': {'מה קוראים':'Qué estás leyendo','צבע דף':'Color de página','תצוגת קריאה':'Vista de lectura','שפת ממשק':'Idioma de la interfaz','שפת אם / תרגום':'Idioma nativo / traducción','המילים שלכם':'Tus palabras','היום':'Hoy','אתמול':'Ayer','מילים':'palabras','עמוד':'página','פרקים':'capítulos','סנכרון מקומי':'Sincronización local'},
 'fr': {'מה קוראים':'Que lisez-vous','צבע דף':'Couleur de page','תצוגת קריאה':'Affichage de lecture','שפת ממשק':'Langue de l’interface','שפת אם / תרגום':'Langue maternelle / traduction','המילים שלכם':'Vos mots','היום':'Aujourd’hui','אתמול':'Hier','מילים':'mots','עמוד':'page','פרקים':'chapitres','סנכרון מקומי':'Synchronisation locale'},
 'de': {'מה קוראים':'Was liest du','צבע דף':'Seitenfarbe','תצוגת קריאה':'Leseansicht','שפת ממשק':'Oberflächensprache','שפת אם / תרגום':'Muttersprache / Übersetzung','המילים שלכם':'Deine Wörter','היום':'Heute','אתמול':'Gestern','מילים':'Wörter','עמוד':'Seite','פרקים':'Kapitel','סנכרון מקומי':'Lokale Synchronisierung'},
 'ru': {'מה קוראים':'Что вы читаете','צבע דף':'Цвет страницы','תצוגת קריאה':'Режим чтения','שפת ממשק':'Язык интерфейса','שפת אם / תרגום':'Родной язык / перевод','המילים שלכם':'Ваши слова','היום':'Сегодня','אתמול':'Вчера','מילים':'слова','עמוד':'страница','פרקים':'главы','סנכרון מקומי':'Локальная синхронизация'},
 'ar': {'מה קוראים':'ماذا تقرأ','צבע דף':'لون الصفحة','תצוגת קריאה':'عرض القراءة','שפת ממשק':'لغة الواجهة','שפת אם / תרגום':'اللغة الأم / الترجمة','המילים שלכם':'كلماتك','היום':'اليوم','אתמול':'أمس','מילים':'كلمات','עמוד':'صفحة','פרקים':'فصول','סנכרון מקומי':'مزامنة محلية'},
}
for tl, m in manual.items():
    new[tl].update(m)

# append to existing i18n.js
p=ROOT/'app/assets/www/js/i18n.js'
s=p.read_text(encoding='utf-8')
s += '\nObject.assign(window.NER_I18N, ' + json.dumps(new, ensure_ascii=False, separators=(',', ':')) + ');\n'
p.write_text(s,encoding='utf-8')
(ROOT/'data/i18n-extra.json').write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
print('added', {k:len(v) for k,v in new.items()})
