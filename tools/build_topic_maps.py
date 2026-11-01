#!/usr/bin/env python3
"""Topic maps for Hebrew: a person in the middle, places around, and the
verbs and nouns that belong to each place, each branch with real sentences.

  tools/build_topic_maps.py            -> data/patterns/he-topics.json

The owner's way of learning (notebook mind maps: אני → בית ספר → ללמוד,
לקרוא → ספר). Sentences are human-written Tatoeba Hebrew with their English
translation (CC BY 2.0 FR, ids kept), chosen to contain the branch's words
and the most frequent spoken patterns from data/patterns/he.json.
"""
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_patterns import norm, sentences, links  # noqa: E402

# word: (english, chinese, surface forms). Forms are written out by hand;
# prefixes ו ה ב ל מ ש כ are stripped before matching.
W = lambda en, zh, forms: (en, zh, forms.split())
TOPICS = [
    {'id': 'study', 'he': 'לימודים', 'en': 'Studying', 'places': [
        {'he': 'בית ספר', 'en': 'school', 'zh': '学校', 'match': 'בית הספר בית ספר',
         'verbs': {'ללמוד': W('to learn, study', '学习', 'ללמוד לומד לומדת לומדים לומדות למדתי למדת למד למדה למדנו למדו אלמד ילמד תלמד נלמד'),
                   'ללמד': W('to teach', '教', 'ללמד מלמד מלמדת מלמדים לימד לימדה לימדתי')},
         'nouns': {'מורה': W('teacher', '老师', 'מורה המורה מורים מורות'),
                   'תלמיד': W('pupil', '学生', 'תלמיד תלמידה תלמידים תלמידות'),
                   'שיעור': W('lesson', '课', 'שיעור שיעורים שיעורי')}},
        {'he': 'אוניברסיטה', 'en': 'university', 'zh': '大学', 'match': 'אוניברסיטה האוניברסיטה',
         'verbs': {'להבין': W('to understand', '明白', 'להבין מבין מבינה מבינים הבנתי הבנת הבין הבינה'),
                   'לשאול': W('to ask', '问', 'לשאול שואל שואלת שאלתי שאל שאלה')},
         'nouns': {'סטודנט': W('student', '大学生', 'סטודנט סטודנטית סטודנטים'),
                   'מבחן': W('exam', '考试', 'מבחן מבחנים בחינה'),
                   'שאלה': W('question', '问题', 'שאלה שאלות')}},
        {'he': 'ספרייה', 'en': 'library', 'zh': '图书馆', 'match': 'ספרייה הספרייה ספריה הספריה',
         'verbs': {'לקרוא': W('to read', '读', 'לקרוא קורא קוראת קוראים קראתי קראת קרא קראה אקרא'),
                   'לכתוב': W('to write', '写', 'לכתוב כותב כותבת כותבים כתבתי כתב כתבה אכתוב')},
         'nouns': {'ספר': W('book', '书', 'ספר ספרים הספר'),
                   'מילה': W('word', '词', 'מילה מילים מלה')}},
    ]},
    {'id': 'work', 'he': 'עבודה', 'en': 'Work', 'places': [
        {'he': 'משרד', 'en': 'office', 'zh': '办公室', 'match': 'משרד המשרד',
         'verbs': {'לעבוד': W('to work', '工作', 'לעבוד עובד עובדת עובדים עבדתי עבד עבדה אעבוד'),
                   'לפתור': W('to solve', '解决', 'לפתור פותר פתרתי פתר פתרון')},
         'nouns': {'עבודה': W('work, job', '工作', 'עבודה העבודה'),
                   'בעיה': W('problem', '问题', 'בעיה בעיות'),
                   'מחשב': W('computer', '电脑', 'מחשב מחשבים')}},
        {'he': 'פגישה', 'en': 'meeting', 'zh': '会议', 'match': 'פגישה הפגישה',
         'verbs': {'לפגוש': W('to meet', '见面', 'לפגוש פוגש פגשתי פגש פגשה ניפגש'),
                   'לדבר': W('to talk', '说话', 'לדבר מדבר מדברת מדברים דיברתי דיבר דיברה')},
         'nouns': {'בוס': W('boss', '老板', 'בוס הבוס מנהל'),
                   'זמן': W('time', '时间', 'זמן')}},
        {'he': 'כסף', 'en': 'money', 'zh': '钱', 'match': 'כסף',
         'verbs': {'לשלם': W('to pay', '付', 'לשלם משלם שילמתי שילם'),
                   'להרוויח': W('to earn', '挣', 'להרוויח מרוויח הרווחתי')},
         'nouns': {'משכורת': W('salary', '工资', 'משכורת'),
                   'חשבון': W('bill, account', '账单', 'חשבון')}},
    ]},
    {'id': 'home', 'he': 'בית', 'en': 'Home', 'places': [
        {'he': 'בית', 'en': 'house, home', 'zh': '家', 'match': 'בית הבית הביתה',
         'verbs': {'לגור': W('to live (reside)', '住', 'לגור גר גרה גרים גרתי'),
                   'לחזור': W('to come back', '回来', 'לחזור חוזר חוזרת חזרתי חזר חזרה אחזור')},
         'nouns': {'דירה': W('apartment', '公寓', 'דירה'),
                   'חדר': W('room', '房间', 'חדר חדרים')}},
        {'he': 'מטבח', 'en': 'kitchen', 'zh': '厨房', 'match': 'מטבח המטבח',
         'verbs': {'לבשל': W('to cook', '做饭', 'לבשל מבשל מבשלת בישלתי בישל'),
                   'לאכול': W('to eat', '吃', 'לאכול אוכל אוכלת אוכלים אכלתי אכל אכלה')},
         'nouns': {'ארוחה': W('meal', '饭', 'ארוחה ארוחת'),
                   'מים': W('water', '水', 'מים'),
                   'קפה': W('coffee', '咖啡', 'קפה')}},
        {'he': 'חדר שינה', 'en': 'bedroom', 'zh': '卧室', 'match': 'מיטה המיטה',
         'verbs': {'לישון': W('to sleep', '睡觉', 'לישון ישן ישנה ישנים ישנתי'),
                   'לקום': W('to get up', '起床', 'לקום קם קמה קמתי')},
         'nouns': {'מיטה': W('bed', '床', 'מיטה'),
                   'בוקר': W('morning', '早上', 'בוקר בבוקר')}},
    ]},
    {'id': 'city', 'he': 'בעיר', 'en': 'In town', 'places': [
        {'he': 'רחוב', 'en': 'street', 'zh': '街', 'match': 'רחוב הרחוב',
         'verbs': {'ללכת': W('to go, walk', '走', 'ללכת הולך הולכת הולכים הלכתי הלך הלכה אלך נלך'),
                   'לחפש': W('to look for', '找', 'לחפש מחפש מחפשת חיפשתי')},
         'nouns': {'דרך': W('way', '路', 'דרך הדרך'),
                   'בית קפה': W('café', '咖啡馆', 'קפה')}},
        {'he': 'תחנה', 'en': 'station', 'zh': '车站', 'match': 'תחנה התחנה',
         'verbs': {'לנסוע': W('to travel, ride', '坐车', 'לנסוע נוסע נוסעת נסעתי נסע'),
                   'להגיע': W('to arrive', '到', 'להגיע מגיע מגיעה הגעתי הגיע הגיעה')},
         'nouns': {'אוטובוס': W('bus', '公共汽车', 'אוטובוס'),
                   'רכבת': W('train', '火车', 'רכבת'),
                   'מונית': W('taxi', '出租车', 'מונית')}},
        {'he': 'חנות', 'en': 'shop', 'zh': '商店', 'match': 'חנות החנות שוק',
         'verbs': {'לקנות': W('to buy', '买', 'לקנות קונה קונים קניתי קנה קנתה'),
                   'לעלות': W('to cost', '花', 'עולה עלה')},
         'nouns': {'מחיר': W('price', '价格', 'מחיר'),
                   'כסף': W('money', '钱', 'כסף')}},
    ]},
    {'id': 'people', 'he': 'אנשים', 'en': 'People', 'places': [
        {'he': 'משפחה', 'en': 'family', 'zh': '家人', 'match': 'משפחה המשפחה',
         'verbs': {'לאהוב': W('to love, like', '爱', 'לאהוב אוהב אוהבת אוהבים אהבתי'),
                   'לעזור': W('to help', '帮助', 'לעזור עוזר עוזרת עזרתי עזר')},
         'nouns': {'אמא': W('mother', '妈妈', 'אמא אמי'),
                   'אבא': W('father', '爸爸', 'אבא אבי'),
                   'ילד': W('child', '孩子', 'ילד ילדה ילדים')}},
        {'he': 'חברים', 'en': 'friends', 'zh': '朋友', 'match': 'חבר חברה חברים',
         'verbs': {'לבקר': W('to visit', '拜访', 'לבקר מבקר ביקרתי ביקר'),
                   'להתקשר': W('to call', '打电话', 'להתקשר מתקשר התקשרתי התקשר')},
         'nouns': {'טלפון': W('phone', '电话', 'טלפון'),
                   'מסיבה': W('party', '聚会', 'מסיבה')}},
    ]},
    {'id': 'travel', 'he': 'נסיעה', 'en': 'Travel', 'places': [
        {'he': 'שדה תעופה', 'en': 'airport', 'zh': '机场', 'match': 'תעופה',
         'verbs': {'לטוס': W('to fly', '坐飞机', 'לטוס טס טסה טסתי'),
                   'לחכות': W('to wait', '等', 'לחכות מחכה מחכים חיכיתי חיכה')},
         'nouns': {'כרטיס': W('ticket', '票', 'כרטיס כרטיסים'),
                   'מטוס': W('plane', '飞机', 'מטוס')}},
        {'he': 'מלון', 'en': 'hotel', 'zh': '酒店', 'match': 'מלון המלון',
         'verbs': {'להישאר': W('to stay', '留', 'להישאר נשאר נשארת נשארתי'),
                   'לטייל': W('to travel around', '旅行', 'לטייל מטייל טיילתי')},
         'nouns': {'חופשה': W('holiday', '假期', 'חופשה'),
                   'ים': W('sea', '海', 'ים הים')}},
    ]},
]
# Too common to be the frame a sentence teaches.
BASIC = {'lo', 'et-def', 'she', 'le-pron', 'ze', 'sheli', 'shel', 'oto'}
PREFIX = re.compile(r'^(?:[ובלהמשכ]){1,3}')


def words_of(s):
    return re.findall(r'[א-ת]+', s)


def has(forms, toks):
    for t in toks:
        if t in forms:
            return True
        stripped = PREFIX.sub('', t)
        if stripped != t and (stripped in forms or t[1:] in forms or t[2:] in forms):
            return True
    return False


def main():
    pats = json.load(open(ROOT / 'data/patterns/he.json', encoding='utf-8'))['patterns'][:100]
    rx = [(p, re.compile(p['regex'])) for p in pats]
    heb, eng = sentences('heb'), sentences('eng')
    he_en = links('heb', 'eng')
    pool = []
    for i, t in heb.items():
        e = next((eng[x] for x in he_en.get(i, []) if x in eng), None)
        if e and 6 <= len(t) <= 48:
            n = norm(t)
            hit = [p for p, r in rx if r.search(n)]
            pool.append((i, t, e, words_of(n), hit))
    print(len(pool), 'short Hebrew sentences with English', flush=True)

    used = set()
    frame_of = lambda hit: next((p for p in hit if p['id'] not in BASIC), hit[0])

    def pick(forms_list, k, topic_frames):
        cands = []
        for i, t, e, toks, hit in pool:
            key = ' '.join(toks)
            if key in used or not hit:
                continue
            # The branch's own word must be there; the place word only adds weight.
            n = sum(1 for f in forms_list if has(f, toks)) if has(forms_list[0], toks) else 0
            if n:
                fr = frame_of(hit)
                score = (n * 3 + 1 / fr['rank'] ** .3 - len(t) / 40
                         + (1.5 if fr['id'] not in BASIC else 0) - topic_frames[fr['id']] * 1.2)
                cands.append((score, i, t, e, hit, fr))
        cands.sort(key=lambda c: -c[0])
        out = []
        for score, i, t, e, hit, fr in cands[:k]:
            used.add(' '.join(words_of(norm(t))))
            topic_frames[fr['id']] += 1
            out.append({'heb_id': i, 'he': t, 'en': e,
                        'frame': {'id': fr['id'], 'he': fr['he'], 'en': fr['en'], 'rank': fr['rank']},
                        'patterns': [{'id': p['id'], 'he': p['he'], 'en': p['en'], 'rank': p['rank']} for p in hit[:4]]})
        return out

    maps = []
    for tp in TOPICS:
        frames = collections.Counter()
        places = []
        for pl in tp['places']:
            place_forms = set(pl['match'].split())
            branches = []
            for kind in ('verbs', 'nouns'):
                for word, (en, zh, forms) in pl[kind].items():
                    s = pick([set(forms), place_forms], 2, frames) or pick([set(forms)], 2, frames)
                    branches.append({'kind': kind[:-1], 'he': word, 'en': en, 'zh': zh, 'sentences': s})
            places.append({'he': pl['he'], 'en': pl['en'], 'zh': pl['zh'], 'words': branches,
                           'sentences': pick([place_forms], 3, frames)})
        by_id = {p['id']: p for p in pats}
        top = [by_id[k] for k, _ in frames.most_common(10) if k not in BASIC][:8]
        maps.append({'id': tp['id'], 'he': tp['he'], 'en': tp['en'], 'center': 'אני', 'places': places,
                     'frames': [{'id': p['id'], 'he': p['he'], 'en': p['en'], 'rank': p['rank']} for p in top]})
    meta = {'source': 'Tatoeba Hebrew with English translations (CC BY 2.0 FR); ids kept for attribution',
            'patterns': 'data/patterns/he.json top 100, by frequency in Tatoeba Hebrew'}
    dst = ROOT / 'data/patterns/he-topics.json'
    json.dump({'meta': meta, 'maps': maps}, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    n = sum(len(w['sentences']) for m in maps for p in m['places'] for w in p['words'])
    print(f'{len(maps)} maps, {n} branch sentences -> {dst}')


if __name__ == '__main__':
    main()
