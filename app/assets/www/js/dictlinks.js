/* Online dictionaries per learning language, the language's own first, for the
   word card. {w} is the URL-encoded word; {lang} and {base} the learning and
   base language codes. Names are shown through tr(), so only the ChatGPT one
   needs a catalog row. Every pattern was opened with a real word (2026-10). */
window.NER_DICTS = {
  he: [
    { name: 'Pealim', url: 'https://www.pealim.com/search/?q={w}' },
    { name: 'Morfix', url: 'https://www.morfix.co.il/{w}' },
    { name: 'Milog', url: 'https://milog.co.il/{w}' }
  ],
  en: [
    { name: 'Cambridge', url: 'https://dictionary.cambridge.org/dictionary/english/{w}' },
    { name: 'Merriam-Webster', url: 'https://www.merriam-webster.com/dictionary/{w}' },
    { name: 'Oxford Learner’s', url: 'https://www.oxfordlearnersdictionaries.com/search/english/?q={w}' }
  ],
  zh: [
    { name: 'MDBG', url: 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdqb={w}' },
    { name: '汉典 Zdic', url: 'https://www.zdic.net/hans/{w}' },
    { name: 'YellowBridge', url: 'https://www.yellowbridge.com/chinese/dictionary.php?word={w}' }
  ],
  yue: [
    { name: '粵典 words.hk', url: 'https://words.hk/zidin/wan/?q={w}' },
    { name: 'CantoDict', url: 'https://www.cantonese.sheik.co.uk/scripts/wordsearch.php?TEXT={w}&searchtype=1' },
    { name: 'CC-Canto', url: 'https://cantonese.org/search.php?q={w}' }
  ],
  ja: [
    { name: 'Jisho', url: 'https://jisho.org/search/{w}' },
    { name: 'Weblio', url: 'https://www.weblio.jp/content/{w}' },
    { name: 'コトバンク', url: 'https://kotobank.jp/search?q={w}' }
  ],
  ko: [
    { name: 'Naver Dictionary', url: 'https://korean.dict.naver.com/koendict/#/search?query={w}' },
    { name: 'KRDict', url: 'https://krdict.korean.go.kr/eng/dicMarinerSearch/search?nation=eng&nationCode=6&ParaWordNo=&mainSearchWord={w}' },
    { name: 'Daum', url: 'https://dic.daum.net/search.do?q={w}&dic=eng' }
  ],
  fr: [
    { name: 'Larousse', url: 'https://www.larousse.fr/dictionnaires/francais/{w}' },
    { name: 'WordReference', url: 'https://www.wordreference.com/fren/{w}' },
    { name: 'CNRTL', url: 'https://www.cnrtl.fr/definition/{w}' }
  ],
  es: [
    { name: 'RAE', url: 'https://dle.rae.es/{w}' },
    { name: 'SpanishDict', url: 'https://www.spanishdict.com/translate/{w}' },
    { name: 'WordReference', url: 'https://www.wordreference.com/esen/{w}' }
  ],
  de: [
    { name: 'Duden', url: 'https://www.duden.de/suchen/dudenonline/{w}' },
    { name: 'DWDS', url: 'https://www.dwds.de/wb/{w}' },
    { name: 'LEO', url: 'https://dict.leo.org/german-english/{w}' }
  ],
  it: [
    { name: 'Treccani', url: 'https://www.treccani.it/vocabolario/ricerca/{w}/' },
    { name: 'WordReference', url: 'https://www.wordreference.com/iten/{w}' },
    { name: 'Garzanti', url: 'https://www.garzantilinguistica.it/ricerca/?q={w}' }
  ],
  pt: [
    { name: 'Priberam', url: 'https://dicionario.priberam.org/{w}' },
    { name: 'Dicio', url: 'https://www.dicio.com.br/pesquisa.php?q={w}' },
    { name: 'WordReference', url: 'https://www.wordreference.com/pten/{w}' }
  ],
  ru: [
    { name: 'OpenRussian', url: 'https://en.openrussian.org/ru/{w}' },
    { name: 'Грамота.ру', url: 'https://gramota.ru/poisk?query={w}' },
    { name: 'Multitran', url: 'https://www.multitran.com/m.exe?l1=2&l2=1&s={w}' }
  ],
  ar: [
    { name: 'Living Arabic', url: 'https://www.livingarabic.com/en/search?q={w}' },
    { name: 'ويكاموس', url: 'https://ar.wiktionary.org/wiki/{w}' }
  ],
  hu: [
    { name: 'SZTAKI Szótár', url: 'https://szotar.sztaki.hu/search?fromlang=hun&tolang=eng&searchWord={w}' },
    { name: 'Értelmező szótár', url: 'https://ertelmezo.oszk.hu/kereses.php?kereses={w}' },
    { name: 'DictZone', url: 'https://dictzone.com/magyar-angol-szotar/{w}' }
  ],
  pl: [
    { name: 'SJP PWN', url: 'https://sjp.pwn.pl/szukaj/{w}.html' },
    { name: 'Diki', url: 'https://www.diki.pl/slownik-angielskiego?q={w}' }
  ],
  tr: [
    { name: 'TDK Sözlük', url: 'https://sozluk.gov.tr/?ara={w}' },
    { name: 'Tureng', url: 'https://tureng.com/en/turkish-english/{w}' },
    { name: 'Seslisözlük', url: 'https://www.seslisozluk.net/{w}-nedir-ne-demek/' }
  ],
  nl: [
    { name: 'Woorden.org', url: 'https://www.woorden.org/woord/{w}' },
    { name: 'WikiWoordenboek', url: 'https://nl.wiktionary.org/wiki/{w}' },
    { name: 'Ensie', url: 'https://www.ensie.nl/betekenis/{w}' }
  ],
  sv: [
    { name: 'Svenska.se (SAOL/SO)', url: 'https://svenska.se/tre/?sok={w}' },
    { name: 'Folkets lexikon', url: 'https://folkets-lexikon.csc.kth.se/folkets/#lookup&{w}' }
  ],
  da: [
    { name: 'Den Danske Ordbog', url: 'https://ordnet.dk/ddo/ordbog?query={w}' }
  ],
  no: [
    { name: 'Ordbøkene', url: 'https://ordbokene.no/bm/search?q={w}' },
    { name: 'NAOB', url: 'https://naob.no/søk/{w}' }
  ],
  fi: [
    { name: 'Kielitoimiston sanakirja', url: 'https://www.kielitoimistonsanakirja.fi/#/{w}' },
    { name: 'Sanakirja.fi', url: 'https://www.sanakirja.fi/finnish-english/{w}' }
  ],
  el: [
    { name: 'Λεξικό Τριανταφυλλίδη', url: 'https://www.greek-language.gr/greekLang/modern_greek/tools/lexica/triantafyllides/search.html?lq={w}' },
    { name: 'WordReference', url: 'https://www.wordreference.com/gren/{w}' }
  ],
  uk: [
    { name: 'Словник.ua', url: 'https://slovnyk.ua/index.php?swrd={w}' },
    { name: 'Горох', url: 'https://goroh.pp.ua/Тлумачення/{w}' }
  ],
  vi: [
    { name: 'VDict', url: 'https://vdict.com/{w},2,0,0.html' },
    { name: 'Wiktionary tiếng Việt', url: 'https://vi.wiktionary.org/wiki/{w}' }
  ],
  id: [
    { name: 'KBBI', url: 'https://kbbi.web.id/{w}' },
    { name: 'Glosbe', url: 'https://glosbe.com/id/en/{w}' }
  ],
  th: [
    { name: 'Glosbe', url: 'https://glosbe.com/th/en/{w}' },
    { name: 'วิกิพจนานุกรม', url: 'https://th.wiktionary.org/wiki/{w}' }
  ]
};

/* For every language. {pair} is Reverso's language pair and {ask} the ChatGPT
   question; an entry whose placeholder has no value for a language is left out. */
window.NER_DICTS_ALL = [
  { name: 'Google Translate', url: 'https://translate.google.com/?sl={lang}&tl={base}&text={w}&op=translate', codes: { zh: 'zh-CN' } },
  { name: 'Wiktionary', url: 'https://en.wiktionary.org/wiki/{w}' },
  { name: 'Reverso Context', url: 'https://context.reverso.net/translation/{pair}/{w}' },
  { name: 'Forvo', url: 'https://forvo.com/word/{w}/#{lang}' },
  { name: 'שאלו את ChatGPT', url: 'https://chatgpt.com/?q={ask}' }
];

/* The ChatGPT question, in the base language. {name} is the learning language's
   name in the base language (Intl.DisplayNames), {word} the word as written. */
window.NER_ASK = {
  he: 'מה פירוש המילה „{word}” ב{name}? הסבירו בקצרה עם משפטי דוגמה.',
  en: 'What does the {name} word “{word}” mean? Explain briefly, with example sentences.',
  hu: 'Mit jelent a következő {name} szó: „{word}”? Magyarázd el röviden, példamondatokkal.',
  ar: 'ما معنى الكلمة {name} «{word}»؟ اشرحها باختصار مع جمل أمثلة.',
  es: '¿Qué significa la palabra «{word}» en {name}? Explícalo brevemente con frases de ejemplo.',
  fr: 'Que signifie le mot {name} « {word} » ? Explique brièvement, avec des phrases d’exemple.',
  de: 'Was bedeutet das Wort „{word}“ auf {name}? Erkläre es kurz mit Beispielsätzen.',
  it: 'Che cosa significa «{word}» in {name}? Spiegalo brevemente con frasi di esempio.',
  pt: 'O que significa a palavra «{word}» em {name}? Explique brevemente, com frases de exemplo.',
  nl: 'Wat betekent het woord “{word}” in het {name}? Leg het kort uit met voorbeeldzinnen.',
  sv: 'Vad betyder ordet ”{word}” på {name}? Förklara kort med exempelmeningar.',
  da: 'Hvad betyder ordet “{word}” på {name}? Forklar kort med eksempelsætninger.',
  no: 'Hva betyr ordet «{word}» på {name}? Forklar kort med eksempelsetninger.',
  fi: 'Mitä sana ”{word}” tarkoittaa (kieli: {name})? Selitä lyhyesti esimerkkilauseiden avulla.',
  pl: 'Co oznacza słowo „{word}” (język: {name})? Wyjaśnij krótko, podając przykładowe zdania.',
  ru: 'Что означает слово «{word}» (язык: {name})? Объясни кратко, с примерами предложений.',
  uk: 'Що означає слово «{word}» (мова: {name})? Поясни коротко, з прикладами речень.',
  el: 'Τι σημαίνει η λέξη «{word}» (γλώσσα: {name}); Εξήγησέ το σύντομα με παραδείγματα.',
  tr: '{name} “{word}” kelimesi ne anlama geliyor? Kısaca, örnek cümlelerle açıkla.',
  zh: '{name}单词“{word}”是什么意思？请用例句简要解释。',
  yue: '{name}嘅「{word}」係乜嘢意思？請用例句簡單解釋。',
  ja: '{name}の「{word}」という言葉はどういう意味ですか？例文を使って簡単に説明してください。',
  ko: '{name} 단어 “{word}”는 무슨 뜻인가요? 예문과 함께 간단히 설명해 주세요.',
  vi: 'Từ “{word}” trong {name} nghĩa là gì? Hãy giải thích ngắn gọn kèm câu ví dụ.',
  id: 'Apa arti kata “{word}” dalam bahasa {name}? Jelaskan singkat dengan contoh kalimat.',
  th: 'คำว่า “{word}” ในภาษา{name} หมายความว่าอะไร? อธิบายสั้น ๆ พร้อมประโยคตัวอย่าง'
};

/* The links for one word: the language's own dictionaries, then the general ones. */
window.nerDictLinks = (function () {
  // Reverso Context's own language names; it pairs each of them with English.
  const REVERSO = {
    ar: 'arabic', zh: 'chinese', nl: 'dutch', fr: 'french', de: 'german', he: 'hebrew', it: 'italian', ja: 'japanese',
    ko: 'korean', pl: 'polish', pt: 'portuguese', ru: 'russian', es: 'spanish', sv: 'swedish', tr: 'turkish', uk: 'ukrainian'
  };
  const RAW = { lang: true, base: true, pair: true };

  function languageName(lang, base) {
    try { return new Intl.DisplayNames([base], { type: 'language' }).of(lang) || lang; } catch (e) { return lang; }
  }

  return function (lang, base, word) {
    if (base === lang) base = lang === 'en' ? 'fr' : 'en';
    const ask = (window.NER_ASK[base] || window.NER_ASK.en)
      .replace('{name}', languageName(lang, base)).replace('{word}', word);
    const pair = lang === 'en' ? REVERSO[base] && 'english-' + REVERSO[base] : REVERSO[lang] && REVERSO[lang] + '-english';
    return (window.NER_DICTS[lang] || []).concat(window.NER_DICTS_ALL).map(d => {
      const codes = d.codes || {};
      const vars = { w: word, lang: codes[lang] || lang, base: codes[base] || base, pair, ask };
      let missing = false;
      const url = d.url.replace(/\{(\w+)\}/g, (_, k) => {
        if (!vars[k]) { missing = true; return ''; }
        return RAW[k] ? vars[k] : encodeURIComponent(vars[k]);
      });
      return missing ? null : { name: d.name, url };
    }).filter(Boolean);
  };
})();
