'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { detectLang, ownArticleLang, articleLanguage, dirOf } = require('../app/assets/www/js/langdetect.js');

const HE = 'לפעמים מילה אחת מספיקה כדי לשנות את כל המשמעות של משפט. אנחנו קוראים מהר, מדלגים על מה שנראה מוכר, וממשיכים הלאה. אבל לפעמים דווקא המילה הקטנה שנשארה בצד היא המפתח.';
const FR = 'Ce matin, il pleuvait des cordes et mon ami m’a posé un lapin. Je suis donc resté chez moi avec un livre. Un mot nouveau n’est pas un mur. C’est une porte. Touchez un mot inconnu et donnez-lui une note.';
const ZH = '小王学中文已经三年了。刚开始的时候，他每天背二十个生词，可是一个月以后就想放弃。老师对他说：“学习不能半途而废，熟能生巧。”后来他开始读小故事。';
const YUE = '小王學中文已經三年了。剛開始的時候，他每天背二十個生詞，可是一個月以後就想放棄。老師對他說：「學習不能半途而廢。」';
const JA = '日本語の勉強を始めて一年になります。最初は漢字が多くて大変でしたが、毎日少しずつ読んでいます。先生でも間違えることがあります。分からない言葉に出会ったら、押してみてください。';
const AR = 'الكلمة الجديدة ليست جدارًا. إنها باب. اقرأ مرة، واضغط كلمة لا تعرفها، وأعطها درجة. ثم غادر الصفحة. ستعود الكلمة لاحقًا.';
const EN = 'It was raining cats and dogs, so I stayed in and read a book. A new word is not a wall. It is a door. Tap a word you do not know and give it a grade.';
const RU = 'Вчера дождь лил как из ведра, и я остался дома с книгой. Новое слово — не стена. Это дверь. Нажмите незнакомое слово и поставьте оценку.';
const UK = 'Учора лило як з відра, тож я залишився вдома з книжкою. Нове слово — не стіна. Це двері. Натисніть незнайоме слово і поставте йому оцінку.';
const KO = '오늘은 비가 많이 와서 집에서 책을 읽었어요. 새로운 단어는 벽이 아니라 문이에요. 모르는 단어를 누르고 점수를 주세요.';

// The learning language is the "under". The text must keep its own language,
// direction, and the language vocab stats are counted in.
const CASES = [
  ['Hebrew under French', HE, ['fr'], 'fr', 'he', 'rtl'],
  ['French under Chinese', FR, ['zh'], 'zh', 'fr', 'ltr'],
  ['Chinese under Hebrew', ZH, ['he'], 'he', 'zh', 'ltr'],
  ['Cantonese under Chinese', YUE, ['zh'], 'zh', 'yue', 'ltr'],
  ['Japanese under Chinese', JA, ['zh'], 'zh', 'ja', 'ltr'],
  ['Arabic under English', AR, ['en'], 'en', 'ar', 'rtl'],
  ['English under Hebrew', EN, ['he'], 'he', 'en', 'ltr'],
  ['Russian under French', RU, ['fr'], 'fr', 'ru', 'ltr'],
  ['Ukrainian under Russian', UK, ['ru'], 'ru', 'uk', 'ltr'],
  ['Korean under French', KO, ['fr'], 'fr', 'ko', 'ltr']
];

test('a text keeps its language when the reader is learning another one', () => {
  for (const [name, text, learn, current, lang, dir] of CASES) {
    const owned = articleLanguage(text, learn, current);
    assert.equal(owned.lang, lang, name);
    assert.equal(owned.dir, dir, name + ' direction');
    assert.equal(owned.langSource, 'detected', name + ' source');
    assert.equal(owned.learned, false, name + ' is not a learned language');
    assert.notEqual(owned.lang, current, name + ' must not be stored as the learning language');
    // Stats and the reader both key off this id, not the language being studied.
    assert.equal(owned.lang, detectLang(text), name + ' stats language');
  }
});

test('filtering to learned languages does not invent a language', () => {
  assert.equal(detectLang(HE, ['fr']), null);
  assert.equal(detectLang(FR, ['zh']), null);
  assert.equal(detectLang(ZH, ['he']), null);
  const owned = ownArticleLang(detectLang(HE), ['fr'], 'fr');
  assert.equal(owned.lang, 'he');
  assert.equal(dirOf(owned.lang), 'rtl');
});

test('a learned language is still stored as itself', () => {
  const owned = articleLanguage(FR, ['fr', 'zh'], 'zh');
  assert.equal(owned.lang, 'fr');
  assert.equal(owned.learned, true);
  assert.equal(owned.dir, 'ltr');
});

test('a text with no detectable language falls back and says so', () => {
  const owned = articleLanguage('12345 ···', ['fr'], 'fr');
  assert.equal(owned.lang, 'fr');
  assert.equal(owned.langSource, 'fallback');
  assert.equal(owned.learned, true);
});

test('Hebrew script wins over French words mixed into the paragraph', () => {
  const mixed = HE + ' le la les et des un une.';
  assert.equal(articleLanguage(mixed, ['fr'], 'fr').lang, 'he');
  assert.equal(dirOf('he'), 'rtl');
  assert.equal(dirOf('ar'), 'rtl');
  assert.equal(dirOf('fr'), 'ltr');
  assert.equal(dirOf('zh'), 'ltr');
});
