/* Language of a text, independent of the language the reader is learning.
   The script decides, then kana / simplified / traditional, Cyrillic letters,
   and common words for Latin. A candidate list only filters; it never invents
   a language. Ownership (learned or not, and which way the text runs) is
   separate, so a Hebrew text opened while learning French stays Hebrew. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NER_DETECT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCRIPTS = [
    ['han', /[぀-ヿ㐀-鿿豈-﫿]/g], ['ko', /[가-힯ᄀ-ᇿ]/g],
    ['he', /[֐-׿]/g], ['ar', /[؀-ۿ]/g], ['cyr', /[Ѐ-ӿ]/g],
    ['el', /[Ͱ-Ͽ]/g], ['th', /[฀-๿]/g], ['lat', /[a-zÀ-ɏḀ-ỿ]/gi]
  ];
  const SIMPLIFIED = /[这们说时对会来国为过发还现开问么见长门车马东书个学后样经没点让话应从头关]/g;
  const TRADITIONAL = /[這們說時對會來國為過發還現開問麼見長門車馬東書個學後樣經沒點讓話應從頭關嘅咗喺唔佢啲嘢冇]/g;
  const STOP_WORDS = Object.fromEntries(Object.entries({
    en: 'the and of to in is that it was for on with as his he you are this be at by not have from',
    fr: 'le la les et des est une dans que qui pour pas sur au du il elle ne avec se ce sont mais',
    es: 'el la los las y que de en un una por con no es se del para al lo como su pero más',
    de: 'der die das und ist nicht ein eine zu mit sich auf den dem des ich er sie es auch für von',
    it: 'il lo la gli le di che e è un una per non con del della sono ma si al nel anche',
    pt: 'o a os as e de que em um uma do da não para com por se no na mais é ao dos',
    nl: 'de het een en van is dat niet op te zijn met voor ik je die er maar ook hij',
    sv: 'och att det är som en på av för med inte jag till den har var om men ett',
    da: 'og at det er som en på af for med ikke jeg til den har var om men et hvad efter meget',
    no: 'og at det er som en på av for med ikke jeg til den har var om men et ble hva etter mye',
    pl: 'i w nie na się że jest to z do co jak ale o tak po od za jego przez',
    tr: 've bir bu da de için ile ne çok değil mi ama gibi daha o ben sen var olarak',
    fi: 'ja on ei se että oli hän mutta kun ovat myös tai jos niin minä sinä mitä tämä',
    hu: 'a az és hogy nem is egy van meg de már csak volt mint ez el ki fel azt',
    id: 'dan yang di itu ini dengan untuk tidak dari ada saya akan ke juga dalam adalah',
    vi: 'và của là có không những được một các người cho với này trong đã khi'
  }).map(([id, words]) => [id, new Set(words.split(' '))]));

  function hits(sample, re) {
    re.lastIndex = 0;
    const n = (sample.match(re) || []).length;
    re.lastIndex = 0;
    return n;
  }

  function rankLatin(sample) {
    const tokens = sample.toLowerCase().match(/\p{L}+/gu) || [];
    const scores = Object.entries(STOP_WORDS)
      .map(([id, set]) => [id, tokens.filter(t => set.has(t)).length / (tokens.length || 1)])
      .sort((a, b) => b[1] - a[1]);
    const floor = Math.max(0.05, scores[0][1] * 0.7);
    return scores.filter(([, score]) => score >= floor).map(([id]) => id);
  }

  // The language of a text. candidates, when given, filters the ranking; a text
  // in none of them returns null rather than the first candidate.
  function detectLang(text, candidates) {
    const sample = String(text || '').slice(0, 5000);
    let script = null, most = 0;
    for (const [id, re] of SCRIPTS) {
      const n = hits(sample, re);
      if (n > most) { script = id; most = n; }
    }
    let ranked = script ? [script] : [];
    if (script === 'han') {
      ranked = hits(sample, /[぀-ヿ]/g) * 10 > most ? ['ja', 'zh', 'yue']
        : hits(sample, TRADITIONAL) > hits(sample, SIMPLIFIED) ? ['yue', 'zh', 'ja'] : ['zh', 'yue', 'ja'];
    } else if (script === 'cyr') {
      ranked = hits(sample, /[іїєґ]/gi) > hits(sample, /[ыэъё]/gi) ? ['uk', 'ru'] : ['ru', 'uk'];
    } else if (script === 'lat') {
      ranked = rankLatin(sample);
    }
    const list = Array.isArray(candidates) ? candidates : null;
    return (list ? ranked.find(id => list.includes(id)) : ranked[0]) || null;
  }

  function scriptOf(text) {
    const sample = String(text || '');
    let script = null, most = 0;
    for (const [id, re] of SCRIPTS) {
      const n = hits(sample, re);
      if (n > most) { script = id; most = n; }
    }
    return script;
  }

  // Hebrew and Arabic run right to left. Every other catalogue language runs left to right.
  function dirOf(id) {
    return id === 'he' || id === 'ar' ? 'rtl' : 'ltr';
  }

  // What to store on an article. Detection wins even when the user does not learn
  // that language. Only a text with no detectable language falls back to the
  // language they are reading now, and that fallback is marked so it is not
  // treated as a detection.
  function ownArticleLang(detected, learnIds, currentId) {
    const learn = Array.isArray(learnIds) ? learnIds : [];
    if (detected) {
      return { lang: detected, learned: learn.includes(detected), source: 'detected' };
    }
    return { lang: currentId || null, learned: true, source: 'fallback' };
  }

  function articleLanguage(text, learnIds, currentId) {
    const owned = ownArticleLang(detectLang(text), learnIds, currentId);
    return {
      lang: owned.lang,
      langSource: owned.source,
      dir: dirOf(owned.lang),
      learned: owned.learned
    };
  }

  return { detectLang, scriptOf, dirOf, ownArticleLang, articleLanguage, rankLatin };
});
