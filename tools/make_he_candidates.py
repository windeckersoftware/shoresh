#!/usr/bin/env python3
"""Write data/patterns/he-candidates.json from Tatoeba Hebrew.

Closed-class patterns are listed below. The ש־ and כש־ patterns are the
words in this corpus whose letter after ש / כש is itself a real word
(שהוא, שאני, כשהייתי), minus a denylist of lookalikes (שלו, שמתי, שעבר).
"""
import collections
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SENTS = ROOT / 'data/raw/tatoeba/heb_sentences.tsv'
OUT = ROOT / 'data/patterns/he-candidates.json'

NIQ = re.compile(r'[\u0591-\u05c7]')
TOK = re.compile(r"[א-ת]+(?:'[א-ת]+)?")

# Rest of a ש־word that is a real clitic even when short.
SHORT_OK = {
    'לא', 'יש', 'זה', 'את', 'מי', 'מה', 'גם', 'רק', 'כך', 'עוד', 'כבר', 'אם',
    'אז', 'כל', 'אף', 'הוא', 'היא', 'הם', 'הן', 'אני', 'אתה', 'אנו', 'אין',
}
# ש־words that look like clitics but are ordinary words.
DENY = {
    'שלו', 'שלך', 'שלי', 'שלה', 'שלנו', 'שלכם', 'שלכן', 'שלהם', 'שלהן', 'של',
    'שאל', 'שאלה', 'שאלות', 'שואל', 'שואלת', 'שונא', 'שונאת',
    'שמתי', 'שמת', 'שמה', 'שמו', 'שמי', 'שמך', 'שמנו', 'שמם', 'שמות', 'שמיים', 'שמים',
    'שעבר', 'שעברה', 'שעברו',
    'שפה', 'שפות', 'שקר', 'שקרן', 'שמן', 'שיער', 'שער', 'שקל', 'שקלים',
    'שחור', 'שחורה', 'שחורים', 'שבת', 'שנאה', 'שאלה',
    'שלום', 'שום', 'שוב', 'שם', 'שנה', 'שנים', 'שעה', 'שעות', 'שבוע', 'שבועות',
    'שלוש', 'שלושה', 'שתיים', 'שמונה', 'שבע', 'שמח', 'שמחה', 'שני', 'שניה', 'שנייה',
    'שיר', 'שירים', 'שולחן', 'שמש', 'שקט', 'שורה', 'שיעור', 'שיעורים', 'שיעורי',
    'שתיה', 'שתייה', 'שעון', 'שירות', 'שירותים', 'שישי', 'שכן', 'שכנה', 'שכנים',
    'שמלה', 'שמלות', 'שוקולד', 'שוטר', 'שחקן', 'שיחה', 'שיחות', 'שינוי', 'שביל',
    'שלג', 'שלט', 'שכונה', 'שדה', 'שפם', 'שטויות', 'שטות', 'שמאל', 'כשרון', 'כשורה',
}
# Letters after ל that are not an infinitive (places, particles, present-tense לומד).
NOT_INF = (
    'תום|מרי|טום|בוב|ג\'ון|פני|מה|אן|כן|עולם|גמרי|חלוטין|בוסטון|פיכך|כאורה|אחרונה|'
    'עתים|עיתים|פעמים|פחות|משל|רוב|פתע|בסוף|מעשה|דעתי|גבי|זה|כך|כל|שם|כאן|פה|'
    'מטה|מעלה|ילדים|אנשים|אישה|איש|אבא|אמא|חבר|חברה|כסף|מים|אוכל|עבודה|לימודים|'
    'אנגלית|צרפתית|עברית|יפן|אמריקה|סין|רוסיה|גרמניה|צרפת|ישראל|כיתה|עיר|כפר|'
    'רחוב|ים|נהר|הר|יער|חנות|בנק|גן|סוף|רופא|מורה|כלב|חתול|אוטו|מכונית|רכבת|'
    'אוטובוס|מטוס|התחלה|אמצע|שמאל|ימין|צפון|דרום|מזרח|מערב|כולם|כולן|מישהו|משהו|'
    'אחד|אחת|כלום|הכל|הכול|סבתא|סבא|אחות|בעל|פריז|לונדון|רומא|ברלין|מדריד|'
    'ומד|ומדת|ומדים|ומדות|ובש|ובשת|וקח|וקחת|וחץ|וחצת|וחם|ומרת|'
    'בית|שולחן|דלת|חלון|מטבח|חדר|מיטה|עיר|מדינה|מדינות|אחר|יום|לילה|בוקר|ערב|'
    'שבוע|חודש|שנה|שעה|דקה|רגע|זמן|עבודה|ספר|סרט|חדשות|אוכל|שתיה|שתייה|'
    'מחר|אתמול|היום|מחרת|מכירה|מכירת|השכרה|השכרת|אט|איבוד|איטה'
)
INF = f"ל(?!(?:{NOT_INF})\\b)[א-ת]{{2,}}"


def norm(s):
    s = NIQ.sub('', s)
    s = s.replace('־', ' ').replace('’', "'").replace('׳', "'").replace('״', '"')
    s = re.sub(r"(?<=[א-ת])'(?=[א-ת])", '', s)
    return re.sub(r'\s+', ' ', s.lower()).strip()


def is_rest(rest, vocab):
    if rest in SHORT_OK:
        return True
    return len(rest) >= 3 and rest in vocab and rest != 'אל'


def alt(forms):
    parts = [re.escape(w) for w in sorted(forms, key=lambda w: (-len(w), w))]
    return '(?:' + '|'.join(parts) + ')'


def main():
    vocab_c = collections.Counter()
    norms = []
    for line in open(SENTS, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) < 3:
            continue
        n = norm(p[2])
        norms.append(n)
        vocab_c.update(TOK.findall(n))
    vocab = {w for w, c in vocab_c.items() if c >= 25 and len(w) >= 2}
    she, kesh = set(), set()
    for w, c in vocab_c.items():
        if c < 8 or w in DENY:
            continue
        if w.startswith('ש') and len(w) >= 3 and is_rest(w[1:], vocab):
            she.add(w)
        if w.startswith('כש') and len(w) >= 4 and w not in {'כשרון', 'כשורה'} and is_rest(w[2:], vocab):
            kesh.add(w)
    print(f'sentences {len(norms)}  she-forms {len(she)}  kesh-forms {len(kesh)}', flush=True)
    print('top she:', ' '.join(w for w, _ in sorted(((w, vocab_c[w]) for w in she), key=lambda x: -x[1])[:40]))
    for bad in ('שלום', 'שלי', 'שמתי', 'שעבר', 'שמה', 'שמי', 'שפה', 'שקר'):
        if bad in she:
            sys.exit(f'denylist missed {bad}')
    if 'שהוא' not in she or 'כשהייתי' not in kesh:
        sys.exit('missing core she/kesh form')

    she_rx = r'\b' + alt(she) + r'\b'
    kesh_rx = r'\b' + alt(kesh) + r'\b'
    V = INF  # infinitive, optional לא sits in the pattern

    P = []

    def add(pid, he, en, fn, cefr, rx):
        P.append({'id': pid, 'he': he, 'en': en, 'function': fn, 'cefr': cefr, 'regex': rx})

    add('lo', 'לא', 'not', 'negation', 'A1', r'\bלא\b')
    add('ein', 'אין', "there isn't / there aren't", 'existence', 'A1', r'\bאין\b')
    add('ein-le', 'אין ל־', "don't have", 'possession', 'A1', r'\bאין ל')
    add('yesh', 'יש', 'there is / there are', 'existence', 'A1', r'\bיש\b')
    add('yesh-le', 'יש ל־', 'have', 'possession', 'A1', r'\bיש ל')
    add('al-t', 'אל + ת־', "don't (imperative)", 'command', 'A1', r'\bאל ת')
    add('einenni', 'אינו / אינני', 'am not / is not', 'negation', 'B1',
        r'\b(?:אינני|איני|אינך|איננו|אינכם|אינכן|אינו|אינה|אינם|אינן|איננה)\b')
    add('af-paam', 'אף פעם', 'never', 'negation', 'A2', r'\bאף פעם\b')
    add('meolam', 'מעולם לא', 'never (not ever)', 'negation', 'B1', r'\bמעולם לא\b')
    add('adayin-lo', 'עדיין לא', 'not yet', 'negation', 'A2', r'\bעדיין לא\b')
    add('kvar-lo', 'כבר לא', 'no longer', 'negation', 'A2', r'\bכבר לא\b')
    add('lo-rak', 'לא רק', 'not only', 'focus', 'B1', r'\bלא רק\b')
    add('shum', 'שום + שם', 'no / any + noun', 'negation', 'A2', r'\bשום\b')
    add('af-exad', 'אף אחד / אף אחת', 'nobody', 'negation', 'A2', r'\bאף (?:אחד|אחת)\b')
    add('klum', 'כלום / שום דבר', 'nothing', 'negation', 'A2', r'\b(?:כלום|שום דבר)\b')
    add('ze', 'זה / זאת', 'this is / it is', 'presentation', 'A1', r'\b(?:זה|זאת)\b')
    add('haze', 'הזה / הזאת / האלה', 'this / that + noun', 'determiner', 'A1',
        r'\b(?:הזה|הזאת|האלה|האלו|הזו|הללו)\b')
    add('haya', 'היה / הייתה / היו', 'was / were', 'copula', 'A1',
        r'\b(?:היה|היתה|הייתה|היו|הייתי|היית|היינו|הייתם|הייתן)\b')
    add('yihye', 'יהיה / תהיה', 'will be', 'copula', 'A2',
        r'\b(?:יהיה|תהיה|תהיי|אהיה|נהיה|יהיו|תהיו)\b')
    add('shel', 'של', 'of', 'possession', 'A1', r'\bשל\b')
    add('sheli', 'שלי / שלך / שלו …', 'my / your / his …', 'possession', 'A1',
        r'\b(?:שלי|שלך|שלו|שלה|שלנו|שלכם|שלכן|שלהם|שלהן)\b')
    add('le-pron', 'לי / לך / לו …', 'to me / you / him …', 'pronoun', 'A1',
        r'\b(?:לי|לך|לו|לה|לנו|לכם|לכן|להם|להן)\b')
    add('et-def', 'את ה־ / את זה', 'the + definite object', 'syntax', 'A1',
        r'\bאת (?:ה[א-ת]+|זה|זאת|אלה|אלו|כל)\b')
    add('oto', 'אותי / אותך / אותו …', 'me / you / him (object)', 'pronoun', 'A1',
        r'\b(?:אותי|אותך|אותו|אותה|אותנו|אתכם|אתכן|אותם|אותן)\b')
    add('iti', 'איתי / איתך / איתו …', 'with me / you / him', 'pronoun', 'A2',
        r'\b(?:איתי|איתך|איתו|איתה|איתנו|איתכם|איתכן|איתם|איתן)\b')
    add('mimeni', 'ממני / ממך / ממנו …', 'from me / than me', 'pronoun', 'A2',
        r'\b(?:ממני|ממך|ממנו|ממנה|מאיתנו|מכם|מכן|מהם|מהן)\b')
    add('alay', 'עלי / עליך / עליו …', 'on me / I have to', 'pronoun', 'A2',
        r'\b(?:עליי|עלי|עליך|עלייך|עליו|עליה|עלינו|עליכם|עליכן|עליהם|עליהן)\b')
    add('ma', 'מה', 'what', 'question', 'A1', r'\bמה\b')
    add('ma-ze', 'מה זה / מי זה', 'what is this / who is this', 'question', 'A1',
        r'\b(?:מה|מי) (?:זה|זאת|אלה)\b')
    add('ma-she', 'מה ש־', 'what (the thing that)', 'relative', 'B1',
        r'\bמה ש(?!לומ|לום|מך\b|מו\b|ם\b|מי\b|מה\b|עה\b|נים\b|בוע|לוש|תיים|מונה|קט\b)')
    add('mi', 'מי', 'who', 'question', 'A1', r'\bמי\b')
    add('mi-she', 'מי ש־', 'whoever / the one who', 'relative', 'B1',
        r'\bמי ש(?!ם\b|נה\b|בר\b|לח\b|ילם|תיה|תייה|לום|עה\b|נים\b|קט\b)')
    add('eifo', 'איפה / היכן', 'where', 'question', 'A1', r'\b(?:איפה|היכן)\b')
    add('lean', 'לאן', 'where to', 'question', 'A2', r'\bלאן\b')
    add('meeifo', 'מאיפה / מאין', 'where from', 'question', 'A2', r'\b(?:מאיפה|מאין)\b')
    add('lama', 'למה / מדוע', 'why', 'question', 'A1', r'\b(?:למה|מדוע)\b')
    add('matai', 'מתי', 'when', 'question', 'A1', r'\bמתי\b')
    add('eich', 'איך / כיצד', 'how', 'question', 'A1', r'\b(?:איך|כיצד)\b')
    add('kama', 'כמה', 'how much / how many', 'question', 'A1', r'\bכמה\b(?!\s+ש)')
    add('kama-she', 'כמה ש־', 'as much as / however much', 'degree', 'B1', r'\bכמה ש')
    add('eize', 'איזה / איזו', 'which / what kind of', 'question', 'A1', r'\b(?:איזה|איזו)\b')
    add('ha-im', 'האם', 'yes/no question', 'question', 'A1', r'\bהאם\b')
    add('she', 'ש־', 'that / which (clause)', 'complement', 'A2', she_rx)
    add('ki', 'כי', 'because / that', 'cause', 'A2', r'\bכי\b')
    add('biglal', 'בגלל', 'because of', 'cause', 'A2', r'\bבגלל\b')
    add('biglal-she', 'בגלל ש־', 'because (clause)', 'cause', 'B1', r'\bבגלל ש')
    add('lamrot', 'למרות', 'despite', 'concession', 'B1', r'\bלמרות\b')
    add('lamrot-she', 'למרות ש־', 'although', 'concession', 'B1', r'\bלמרות ש')
    add('af-al-pi', 'אף על פי (ש־)', 'although', 'concession', 'B2', r'\bאף על פי')
    add('im', 'אם', 'if / whether', 'condition', 'A2', r'\bאם\b')
    add('im-lo', 'אם לא', 'if not / unless', 'condition', 'A2', r'\bאם לא\b')
    add('gam-im', 'גם אם', 'even if', 'concession', 'B1', r'\bגם אם\b')
    add('ilu', 'אילו + עבר', 'if (counterfactual)', 'hypothesis', 'B2',
        r'\bאילו (?:הייתי|היית|היה|הייתה|היתה|היו|היינו|הייתם|יכול|יכולתי)\b')
    add('kaasher', 'כאשר', 'when', 'time', 'B1', r'\bכאשר\b')
    add('kshe', 'כש־', 'when', 'time', 'A2', kesh_rx)
    add('kedei', 'כדי + שם פועל', 'in order to', 'purpose', 'A2', rf'\bכדי (?:לא )?{V}')
    add('kedei-she', 'כדי ש־', 'so that', 'purpose', 'B1', r'\bכדי ש')
    add('bishvil', 'בשביל', 'for', 'purpose', 'A2', r'\bבשביל')
    add('lifnei', 'לפני', 'before / ago', 'time', 'A2', r'\bלפני\b')
    add('lifnei-ago', 'לפני + זמן', '… ago', 'time', 'A2',
        r'\bלפני (?:שבוע|שבועיים|חודש|חודשיים|שנה|שנתיים|יומיים|יום|ימים|שעה|שעתיים|שעות|רגע|דקה|דקות|שנים|חודשים|כמה|הרבה|זמן|\d+|שני|שתי|שלושה|שלוש|ארבעה|ארבע|חמישה|חמש)\b')
    add('lifnei-she', 'לפני ש־', 'before (clause)', 'time', 'B1',
        r'\bלפני ש(?!בוע|בועיים|נה\b|נתיים|עה\b|עות|עתיים|נים\b|לוש|לושים|תיים|מונה|בע\b|קט\b|לומ|ש\b)')
    add('acharei', 'אחרי / לאחר', 'after', 'time', 'A2', r'\b(?:אחרי|לאחר)\b')
    add('acharei-she', 'אחרי ש־ / לאחר ש־', 'after (clause)', 'time', 'B1',
        r'\b(?:אחרי|לאחר) ש(?!בוע|בועיים|נה\b|נתיים|עה\b|עות|עתיים|נים\b|לוש|לושים|תיים|מונה|בע\b|קט\b|לומ|ש\b)')
    add('ad-she', 'עד ש־', 'until', 'time', 'B1',
        r'\bעד ש(?!לוש|לושים|ש\b|בע\b|מונה|תיים|ניים|עה\b|בוע|נה\b|עות|עתיים|נים\b|קט\b|לומ)')
    add('zman-she', 'בזמן ש־ / ברגע ש־', 'while / the moment that', 'time', 'B1',
        r'\b(?:בזמן ש(?!עבר)|ברגע ש)')
    add('tox-kedei', 'תוך כדי', 'while / in the middle of', 'time', 'B1', r'\bתוך כדי\b')
    add('last', 'שבוע / שנה שעבר', 'last week / last year', 'time', 'A2',
        r'\b(?:ב|ה)?(?:שבוע|חודש|שנה|פעם|לילה|בוקר|ערב) שעבר(?:ה|ו)?\b')
    add('bli', 'בלי', 'without', 'manner', 'A2', r'\bבלי\b')
    add('bli-inf', 'בלי + שם פועל', 'without + -ing', 'manner', 'B1', rf'\bבלי (?:לא )?{V}')
    add('bimkom', 'במקום + שם פועל', 'instead of + -ing', 'substitution', 'B1',
        rf'\bבמקום (?:לא )?{V}')
    add('rotse', 'רוצה / רוצים', 'want', 'desire', 'A1', r'\b(?:רוצה|רוצים|רוצות)\b')
    add('yaxol', 'יכול / יכולה / יכולים', 'can', 'ability', 'A1', r'\b(?:יכול|יכולה|יכולים|יכולות)\b')
    add('tsarix', 'צריך / צריכה / צריכים', 'need / have to', 'obligation', 'A1',
        r'\b(?:צריך|צריכה|צריכים|צריכות)\b')
    add('tsarix-she', 'צריך ש־', 'someone has to (clause)', 'obligation', 'B1',
        r'\b(?:צריך|צריכה|צריכים|צריכות) ש(?!יפוץ|ניים|לוש|בוע|עה\b|נה\b|מות|קלים)')
    add('hayav', 'חייב / חייבת / חייבים', 'must', 'obligation', 'A2',
        r'\b(?:חייב|חייבת|חייבים|חייבות)\b')
    add('ohev-inf', 'אוהב + שם פועל', 'like / love + -ing', 'liking', 'A1',
        rf'\b(?:אוהב|אוהבת|אוהבים|אוהבות|אהב|אהבה|אהבו|אהבתי|אהבת) (?:לא )?{V}')
    add('efshar', 'אפשר', "can / it's possible", 'ability', 'A2', r'\bאפשר\b')
    add('asur', 'אסור', 'must not / forbidden', 'prohibition', 'A2', r'\bאסור\b')
    add('mutar', 'מותר', 'may / allowed to', 'permission', 'A2', r'\bמותר\b')
    add('kedai', 'כדאי', "it's worth / should", 'advice', 'B1', r'\bכדאי\b')
    add('mutav', 'מוטב', "it's better to", 'advice', 'B1', r'\bמוטב\b')
    add('hayiti-rotse', 'הייתי רוצה', 'I would like', 'polite-request', 'A2', r'\bהייתי רוצה\b')
    add('hayiti-yaxol', 'הייתי יכול', 'I could', 'ability', 'B1',
        r'\b(?:הייתי|היית) יכול(?:ה|ים|ות)?\b')
    add('holech-inf', 'הולך + שם פועל', 'be going to + verb', 'near-future', 'A2',
        rf'\b(?:הולך|הולכת|הולכים|הולכות) (?:לא )?{V}')
    add('omed-inf', 'עומד + שם פועל', 'be about to + verb', 'imminent', 'B1',
        rf'\b(?:עומד|עומדת|עומדים|עומדות) (?:לא )?{V}')
    add('menase', 'מנסה + שם פועל', 'try to + verb', 'attempt', 'A2',
        rf'\b(?:מנסה|מנסים|מנסות|ניסיתי|ניסה|ניסתה|ניסו) (?:לא )?{V}')
    add('matchil', 'מתחיל + שם פועל', 'start to + verb', 'inception', 'A2',
        rf'\b(?:מתחיל|מתחילה|מתחילים|מתחילות|התחלתי|התחיל|התחילה) (?:לא )?{V}')
    add('mafsik', 'מפסיק + שם פועל', 'stop + -ing', 'cessation', 'A2',
        rf'\b(?:מפסיק|מפסיקה|מפסיקים|הפסקתי|הפסיק|הפסיקה) (?:לא )?{V}')
    add('mamshich', 'ממשיך + שם פועל', 'keep + -ing', 'continuation', 'B1',
        rf'\b(?:ממשיך|ממשיכה|ממשיכים|המשכתי|המשיך|המשיכה) (?:לא )?{V}')
    add('yodea-she', 'יודע ש־ / אם / איפה / מי', "know that / if / where / who", 'cognition', 'A2',
        r'\b(?:יודע|יודעת|יודעים|יודעות) (?:ש[א-ת]|אם\b|איפה\b|היכן\b|לאן\b|מתי\b|איך\b|למה\b|מה\b|מי\b|כמה\b|האם\b)')
    add('yodea-inf', 'יודע + שם פועל', 'know how to + verb', 'skill', 'A2',
        rf'\b(?:יודע|יודעת|יודעים|יודעות|ידעתי) (?:לא )?{V}')
    said = r'(?!ום\b|לום|לומ|בוע|נה\b|עה\b|לוש|לושים|ש\b|בע\b|מונה)'
    add('xoshev-she', 'חושב ש־', 'think that', 'opinion', 'A2',
        rf'\b(?:חושב|חושבת|חושבים|חושבות|חשבתי|חשב|חשבה) ש{said}')
    add('amar-she', 'אמר / סיפר ש־', 'said that', 'reported-speech', 'A2',
        rf'\b(?:אמר|אמרה|אמרו|אמרתי|אמרת|אומר|אומרת|אומרים|אומרות|סיפר|סיפרה|סיפרו|סיפרתי|מספר|מספרת|מספרים) ש{said}')
    add('nire-she', 'נראה ש־', 'it seems that', 'appearance', 'B1', r'\bנראה(?:ה|ים)? ש')
    add('nire-li', 'נראה לי', 'it seems to me', 'opinion', 'A2', r'\bנראה לי\b')
    add('haya-ptc', 'היה + בינוני', 'was + -ing / would', 'tense', 'B1',
        r'\b(?:היה|היתה|הייתה|היו|הייתי|היית) (?:יושב|יושבת|יושבים|הולך|הולכת|הולכים|עומד|עומדת|עושה|עושים|אוכל|אוכלת|שותה|ישן|ישנה|עובד|עובדת|גר|גרה|לומד|לומדת|מדבר|מדברת|כותב|קורא|רואה|שומע|מחכה|מנסה|רוצה|יכול|צריך|חייב|אוהב|חושב|יודע)\b')
    than_imm = (
        'ממני|ממך|ממנו|ממנה|מאיתנו|מכם|מכן|מהם|מהן|מכל|מזה|מכולם|מכולן|'
        'מתום|ממרי|מטום|משלי|משלך|משלו|משלה|משלנו|משלהם|'
        r'מ-?\d+|משהוא|משהיא|משאני|משאתה|משחשב|משהיה'
    )
    than_after = than_imm + r'|מש[א-ת]{3,}'
    add('yoter', 'יותר + שם תואר', 'more / -er', 'comparison', 'A2', r'\bיותר\b')
    add('yoter-mi', 'יותר … מ־', 'more than', 'comparison', 'A2',
        rf'\bיותר (?:{than_imm})\b|\bיותר [א-ת]{{2,14}} (?:{than_after})\b')
    add('paxot', 'פחות', 'less / fewer', 'comparison', 'A2', r'\bפחות\b')
    add('paxot-mi', 'פחות … מ־', 'less than', 'comparison', 'A2',
        rf'\bפחות (?:{than_imm})\b|\bפחות [א-ת]{{2,14}} (?:{than_after})\b')
    add('hachi', 'הכי + שם תואר', 'the most / the -est', 'superlative', 'A2', r'\bהכי (?!את\b|אות)')
    add('kmo', 'כמו', 'like / as', 'comparison', 'A2', r'\bכמו\b')
    add('kol-kach', 'כל כך', 'so', 'degree', 'A2', r'\bכל כך\b')
    add('yoter-midai', 'יותר מדי', 'too / too much', 'degree', 'A2', r'\bיותר מדי\b')
    add('meod', 'מאוד / מאד', 'very', 'degree', 'A1', r'\b(?:מאוד|מאד)\b')
    add('harbe', 'הרבה', 'a lot / many / much', 'quantity', 'A1', r'\bהרבה\b')
    add('ktsat', 'קצת / מעט', 'a little', 'quantity', 'A1', r'\b(?:קצת|מעט)\b')
    add('kol', 'כל', 'all / every', 'quantity', 'A1', r'\bכל\b(?!\s+כך)')
    add('kol-exad', 'כל אחד / כל אחת', 'everyone', 'indefinite', 'A2', r'\bכל (?:אחד|אחת)\b')
    add('mishehu', 'מישהו / משהו', 'someone / something', 'indefinite', 'A2',
        r'\b(?:מישהו|מישהי|משהו|איפשהו|איכשהו|איזשהו|איזושהי)\b')
    add('rak', 'רק', 'only', 'focus', 'A2', r'\bרק\b')
    add('gam', 'גם', 'also / too', 'addition', 'A1', r'\bגם\b')
    add('od', 'עוד', 'still / else / more', 'aspect', 'A2', r'\bעוד\b')
    add('kvar', 'כבר', 'already', 'aspect', 'A2', r'\bכבר\b')
    add('adayin', 'עדיין', 'still', 'aspect', 'A2', r'\bעדיין\b')
    add('tamid', 'תמיד', 'always', 'frequency', 'A1', r'\bתמיד\b')
    add('kimat', 'כמעט', 'almost', 'degree', 'A2', r'\bכמעט\b')
    add('ela', 'אלא', 'but rather / except', 'contrast', 'B1', r'\bאלא\b')
    add('aval', 'אבל', 'but', 'contrast', 'A2', r'\bאבל\b')
    add('az', 'אז', 'so / then', 'consequence', 'A2', r'\bאז\b')
    add('laxen', 'לכן', 'therefore', 'consequence', 'B1',
        r'(?<!קודם )\bלכן (?=אני\b|אתה\b|את\b|הוא\b|היא\b|הם\b|הן\b|אנחנו\b|אנו\b|צריך\b|אפשר\b|לא\b|כדאי\b)')
    add('bevakasha', 'בבקשה', 'please', 'politeness', 'A1', r'\bבבקשה\b')
    add('toda', 'תודה', 'thank you', 'politeness', 'A1', r'\bתודה\b')
    add('slixa', 'סליחה', 'sorry / excuse me', 'politeness', 'A1', r'\bסליחה\b')
    add('bo-n', 'בוא נ־', "let's", 'suggestion', 'A2', r'\b(?:בוא|בואי|בואו) נ')
    add('ben', 'בן / בת + מספר', '… years old', 'age', 'A1',
        r'\b(?:בן|בת) (?:\d+|אחת|שתים|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|עשרה|עשרים|שלושים|ארבעים|חמישים|שישים|שבעים|שמונים|תשעים|מאה|שנה|שנתיים)\b')
    add('ben-kama', 'בן כמה / בת כמה', 'how old', 'question', 'A1', r'\b(?:בן|בת) כמה\b')
    add('koev', 'כואב ל־', 'hurts', 'pain', 'A2', r'\bכואב(?:ה|ים|ות)? ל')
    add('xam-li', 'חם לי / קר לי', "I'm hot / cold", 'sensation', 'A2',
        r'\b(?:חם|קר) ל(?:י|ך|ו|ה|נו|כם|כן|הם|הן)\b')
    add('xaser', 'חסר ל־', 'miss / lack', 'experiencer', 'B1', r'\bחסר(?:ה|ים|ות)? ל')
    add('ixpat', 'אכפת ל־', 'care about', 'experiencer', 'B1', r'\bאכפת ל')
    add('nimas', 'נמאס ל־', 'fed up with', 'experiencer', 'B1', r'\bנמאס ל')
    add('raev', 'רעב / עייף', 'hungry / tired', 'state', 'A1',
        r'\b(?:רעב|רעבה|רעבים|רעבות|עייף|עייפה|עייפים|עייפות)\b')
    add('pohed', 'פוחד מ־', 'afraid of', 'state', 'A2',
        r'\b(?:פוחד|פוחדת|פוחדים|פוחדות|מפחד|מפחדת|מפחדים) מ')
    add('korim-li', 'קוראים לי', 'my name is', 'presentation', 'A1', r'\bקוראים לי\b')
    add('gar', 'גר ב־', 'live in', 'location', 'A1', r'\b(?:גר|גרה|גרים|גרות|גרתי|גרנו) ב')
    add('hinei', 'הנה', 'here / here is', 'presentation', 'A2', r'\bהנה\b')
    add('xaval', 'חבל', "it's a shame", 'evaluation', 'B1', r'\bחבל\b')
    add('xashuv', 'חשוב ש־ / חשוב ל־', "it's important to / that", 'evaluation', 'B1', r'\bחשוב (?:ש|ל)')
    add('kal', 'קל / קשה + ל־', 'easy / hard to (for me)', 'evaluation', 'A2', r'\b(?:קל|קשה) ל')
    add('muxan', 'מוכן + שם פועל', 'ready to + verb', 'evaluation', 'A2',
        rf'\b(?:מוכן|מוכנה|מוכנים|מוכנות) (?:לא )?{V}')
    add('asher', 'אשר', 'which / that (formal)', 'relative', 'B2', r'\bאשר\b')

    compiled = [(p, re.compile(p['regex'])) for p in P]
    counts = [0] * len(P)
    samples = [[] for _ in P]
    for n in norms:
        for i, (_, rx) in enumerate(compiled):
            if rx.search(n):
                counts[i] += 1
                if len(samples[i]) < 3 and 8 <= len(n) <= 80:
                    samples[i].append(n)
    ranked = sorted(range(len(P)), key=lambda i: -counts[i])
    print(f'{len(P)} patterns', flush=True)
    preview = Path('/tmp/he-pattern-preview.txt')
    lines = []
    for rank, i in enumerate(ranked, 1):
        p = P[i]
        ex = ' || '.join(samples[i][:2])
        lines.append(f'{rank:3d}  {counts[i]:6d}  {p["cefr"]:2s}  {p["he"]}  —  {p["en"]}\n      {ex}')
    preview.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('\n'.join(lines[:30]), flush=True)
    print(f'preview -> {preview}', flush=True)

    # Spot-check a handful of sentences against the regexes.
    by_id = {p['id']: re.compile(p['regex']) for p in P}
    tests = [
        ('אני לא רוצה ללכת.', {'lo', 'rotse'}),
        ('יש לי כלב.', {'yesh', 'yesh-le', 'le-pron'}),
        ('אין לי זמן.', {'ein', 'ein-le', 'le-pron'}),
        ('אל תגיד את זה.', {'al-t', 'et-def', 'ze'}),
        ('אני יכול לדבר.', {'yaxol'}),
        ('הייתי רוצה קפה.', {'hayiti-rotse', 'rotse'}),
        ('הספר שלי כאן.', {'sheli'}),
        ('תום יותר גבוה ממני.', {'yoter', 'yoter-mi', 'mimeni'}),
        ('אף פעם לא היה לי יותר מ-500 דולר.', {'yoter', 'yoter-mi', 'af-paam', 'lo'}),
        ('אף פעם לא אכלתי את זה.', {'af-paam', 'lo', 'et-def'}),
        ('כדי לדעת צריך ללמוד.', {'kedei', 'tsarix'}),
        ('האם אתה עייף?', {'ha-im', 'raev'}),
        ('קוראים לי דוד.', {'korim-li'}),
        ('אני בן 19.', {'ben'}),
        ('חם לי.', {'xam-li', 'le-pron'}),
        ('מה שאתה אומר לא נכון.', {'ma', 'ma-she', 'she', 'lo'}),
        ('כשהייתי ילד גרתי פה.', {'kshe'}),
        ('שבוע שעבר הלכתי הביתה.', {'last'}),
        ('אני הולך לאכול.', {'holech-inf'}),
        ('בבקשה תן לי את זה.', {'bevakasha', 'le-pron', 'et-def'}),
        ('למה אתה כאן?', {'lama'}),
        ('כמה זה עולה?', {'kama', 'ze'}),
    ]
    failed = False
    for text, expect in tests:
        got = {i for i, rx in by_id.items() if rx.search(norm(text))}
        missing = expect - got
        if missing:
            failed = True
            print(f'FAIL {text!r} missing {missing}', flush=True)
    neg = {
        'למה אתה כאן?': {'ma'},
        'כמה זה עולה?': {'ma'},
        'כמה שיותר מהר.': {'kama'},
        'אני הולך לבית.': {'holech-inf'},
        "אני אוהב מוזיקת ג'אז.": {'az'},
        'שלום, מה שלומך?': {'she', 'ma-she'},
        'הם הגיעו לפני שבוע.': {'lifnei-she'},
        'אחרי שנתיים הוא חזר.': {'acharei-she'},
        'הבית צריך שיפוץ.': {'tsarix-she'},
        'העבודה מוכנה למחר.': {'muxan'},
        'הבית עומד למכירה.': {'omed-inf'},
        'אמרתי את זה קודם לכן.': {'laxen'},
        'הוא שאל מה שמי.': {'ma-she'},
        'מה שמו?': {'ma-she'},
        'טום הולך לאט.': {'holech-inf'},
        'תבוא לפני שש.': {'lifnei-she'},
        'תספור עד שלושים.': {'ad-she'},
        'הכי את תום.': {'hachi'},
        'זה לא אומר שום דבר.': {'amar-she'},
        'הוא אמר שלום.': {'amar-she'},
        'אני כל כך שמן.': {'kol'},
    }
    for text, banned in neg.items():
        got = {i for i, rx in by_id.items() if rx.search(norm(text))}
        hit = banned & got
        if hit:
            failed = True
            print(f'FAIL {text!r} unexpected {hit}', flush=True)
    if failed:
        sys.exit(1)
    OUT.write_text(json.dumps(P, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'wrote {len(P)} candidates -> {OUT}', flush=True)


if __name__ == '__main__':
    main()
