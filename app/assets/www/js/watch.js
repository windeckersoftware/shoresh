(function () {
  'use strict';
  if (document.getElementById('ner-watch-host')) return;
  var state = window.__NER_STATE__ || {};
  var lang = (state.settings && state.settings.lang) || 'he';
  var dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  var baseLang = (state.settings && state.settings.baseLang) || 'en';
  var ISO3 = { hun: 'hu', eng: 'en', heb: 'he', ara: 'ar', spa: 'es', fra: 'fr', fre: 'fr', deu: 'de', ger: 'de', rus: 'ru', por: 'pt', ita: 'it', nld: 'nl', dut: 'nl', swe: 'sv', dan: 'da', nor: 'no', fin: 'fi', pol: 'pl', ukr: 'uk', ell: 'el', gre: 'el', tur: 'tr', jpn: 'ja', kor: 'ko', zho: 'zh', chi: 'zh', vie: 'vi', ind: 'id', tha: 'th', ces: 'cs', cze: 'cs', ron: 'ro', rum: 'ro' };
  function normLang(code) {
    code = String(code || '').toLowerCase().split('-')[0];
    return ISO3[code] || code;
  }
  var UI = {
    he: { captions: 'כתוביות · לחצו על מילה', loading: 'טוען…', howWell: 'כמה המילה מוכרת לכם?', g1: 'לא מכיר', g2: 'מזהה', g3: 'מבין', g4: 'כמעט', g5: 'ידוע', gx: 'דלג', speak: '🔊 השמעה', close: 'סיום', saved: 'שמור באוצר שלכם', missing: 'לא נמצאה משמעות במילון המקומי.', sameLang: 'שפת התרגום זהה לשפת הכתוביות.', translating: 'מתרגם…', online: 'תרגום אונליין', savedOnline: 'תרגום אונליין · נשמר', noMeaning: 'אין משמעות.', rank: 'בשכיחות', local: 'מילון מקומי', notFound: 'לא נמצא במילון', failed: 'התרגום לא הצליח.', brand: 'שורש', mark: 'ש' },
    en: { captions: 'Captions · tap a word', loading: 'Loading…', howWell: 'How well do you know this word?', g1: 'new', g2: 'seen', g3: 'know', g4: 'almost', g5: 'known', gx: 'skip', speak: '🔊 Speak', close: 'Close', saved: 'Saved', missing: 'Not in the local dictionary.', sameLang: 'Translation language matches the captions.', translating: 'Translating…', online: 'Online translation', savedOnline: 'Online translation · saved', noMeaning: 'No meaning.', rank: 'frequency', local: 'Local dictionary', notFound: 'Not in the dictionary', failed: 'Translation failed.', brand: 'Shoresh', mark: 'S' },
    hu: { captions: 'Felirat · koppints egy szóra', loading: 'Betöltés…', howWell: 'Mennyire ismered ezt a szót?', g1: 'idegen', g2: 'ismerős', g3: 'értem', g4: 'majdnem', g5: 'tudom', gx: 'kihagy', speak: '🔊 Felolvas', close: 'Bezár', saved: 'Elmentve', missing: 'Nincs a helyi szótárban.', sameLang: 'A fordítás nyelve megegyezik a felirattal.', translating: 'Fordítás…', online: 'Online fordítás', savedOnline: 'Online fordítás · elmentve', noMeaning: 'Nincs jelentés.', rank: 'gyakoriság', local: 'Helyi szótár', notFound: 'Nincs a szótárban', failed: 'A fordítás nem sikerült.', brand: 'Shoresh', mark: 'S' },
    es: { captions: 'Subtítulos · toca una palabra', loading: 'Cargando…', howWell: '¿Cuánto conoces esta palabra?', g1: 'nueva', g2: 'vista', g3: 'entiendo', g4: 'casi', g5: 'sé', gx: 'saltar', speak: '🔊 Oír', close: 'Cerrar', saved: 'Guardada', missing: 'No está en el diccionario local.', sameLang: 'El idioma de traducción es el de los subtítulos.', translating: 'Traduciendo…', online: 'Traducción en línea', savedOnline: 'Traducción en línea · guardada', noMeaning: 'Sin significado.', rank: 'frecuencia', local: 'Diccionario local', notFound: 'No está en el diccionario', failed: 'La traducción falló.', brand: 'Shoresh', mark: 'S' },
    fr: { captions: 'Sous-titres · touchez un mot', loading: 'Chargement…', howWell: 'À quel point connaissez-vous ce mot ?', g1: 'nouveau', g2: 'vu', g3: 'compris', g4: 'presque', g5: 'su', gx: 'passer', speak: '🔊 Écouter', close: 'Fermer', saved: 'Enregistré', missing: 'Absent du dictionnaire local.', sameLang: 'La langue de traduction est celle des sous-titres.', translating: 'Traduction…', online: 'Traduction en ligne', savedOnline: 'Traduction en ligne · enregistrée', noMeaning: 'Pas de sens.', rank: 'fréquence', local: 'Dictionnaire local', notFound: 'Absent du dictionnaire', failed: 'La traduction a échoué.', brand: 'Shoresh', mark: 'S' },
    de: { captions: 'Untertitel · Wort antippen', loading: 'Lädt…', howWell: 'Wie gut kennst du dieses Wort?', g1: 'neu', g2: 'gesehen', g3: 'verstanden', g4: 'fast', g5: 'bekannt', gx: 'weg', speak: '🔊 Vorlesen', close: 'Schließen', saved: 'Gespeichert', missing: 'Nicht im lokalen Wörterbuch.', sameLang: 'Übersetzungsprache ist die Untertitelsprache.', translating: 'Übersetze…', online: 'Online-Übersetzung', savedOnline: 'Online-Übersetzung · gespeichert', noMeaning: 'Keine Bedeutung.', rank: 'Häufigkeit', local: 'Lokales Wörterbuch', notFound: 'Nicht im Wörterbuch', failed: 'Übersetzung fehlgeschlagen.', brand: 'Shoresh', mark: 'S' },
    ru: { captions: 'Субтитры · нажмите слово', loading: 'Загрузка…', howWell: 'Насколько знакомо это слово?', g1: 'новое', g2: 'видел', g3: 'понял', g4: 'почти', g5: 'знаю', gx: 'мимо', speak: '🔊 Слушать', close: 'Закрыть', saved: 'Сохранено', missing: 'Нет в местном словаре.', sameLang: 'Язык перевода совпадает с субтитрами.', translating: 'Перевод…', online: 'Онлайн-перевод', savedOnline: 'Онлайн-перевод · сохранено', noMeaning: 'Нет значения.', rank: 'частота', local: 'Местный словарь', notFound: 'Нет в словаре', failed: 'Перевод не удался.', brand: 'Shoresh', mark: 'S' },
    ar: { captions: 'ترجمة · اضغط كلمة', loading: 'جارٍ التحميل…', howWell: 'ما مدى معرفتك بهذه الكلمة؟', g1: 'جديدة', g2: 'مألوفة', g3: 'أفهم', g4: 'تقريبًا', g5: 'أعرف', gx: 'تجاوز', speak: '🔊 استمع', close: 'إغلاق', saved: 'محفوظة', missing: 'ليست في القاموس المحلي.', sameLang: 'لغة الترجمة هي لغة الترجمة المصاحبة.', translating: 'جارٍ الترجمة…', online: 'ترجمة عبر الإنترنت', savedOnline: 'ترجمة عبر الإنترنت · حُفظت', noMeaning: 'لا معنى.', rank: 'التكرار', local: 'قاموس محلي', notFound: 'ليست في القاموس', failed: 'فشلت الترجمة.', brand: 'شوريش', mark: 'ش' }
  };
  var POS = {
    en: { noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', article: 'article', pron: 'pronoun', prep: 'preposition', conj: 'conjunction', num: 'number', interj: 'interjection', particle: 'particle', phrase: 'phrase', name: 'name' },
    hu: { noun: 'főnév', verb: 'ige', adj: 'melléknév', adv: 'határozószó', article: 'névelő', pron: 'névmás', prep: 'elöljáró', conj: 'kötőszó', num: 'számnév', interj: 'indulatszó', particle: 'partikula', phrase: 'kifejezés', name: 'név' },
    he: { noun: 'שם עצם', verb: 'פועל', adj: 'שם תואר', adv: 'תואר הפועל', article: 'תווית', pron: 'כינוי', prep: 'מילת יחס', conj: 'מילת חיבור', num: 'מספר', interj: 'קריאת ביניים', particle: 'חלקיק', phrase: 'צירוף', name: 'שם' },
    es: { noun: 'sustantivo', verb: 'verbo', adj: 'adjetivo', adv: 'adverbio', article: 'artículo', pron: 'pronombre', prep: 'preposición', conj: 'conjunción', num: 'número', interj: 'interjección' },
    fr: { noun: 'nom', verb: 'verbe', adj: 'adjectif', adv: 'adverbe', article: 'article', pron: 'pronom', prep: 'préposition', conj: 'conjonction', num: 'nombre' },
    de: { noun: 'Nomen', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', article: 'Artikel', pron: 'Pronomen', prep: 'Präposition', conj: 'Konjunktion', num: 'Zahlwort' },
    ru: { noun: 'сущ.', verb: 'глагол', adj: 'прил.', adv: 'наречие', article: 'артикль', pron: 'местоим.', prep: 'предлог', conj: 'союз', num: 'числит.' },
    ar: { noun: 'اسم', verb: 'فعل', adj: 'صفة', adv: 'ظرف', article: 'أداة', pron: 'ضمير', prep: 'حرف جر', conj: 'حرف عطف', num: 'عدد' }
  };
  var uiPref = (state.settings && state.settings.ui) || 'system';
  var uiCode = uiPref === 'system' ? normLang((navigator.language || 'en').split('-')[0]) : normLang(uiPref);
  if (!UI[uiCode]) uiCode = 'en';
  var uiDir = (uiCode === 'he' || uiCode === 'ar') ? 'rtl' : 'ltr';
  function t(key) { return (UI[uiCode] && UI[uiCode][key]) || UI.en[key] || key; }
  function posLabel(pos) {
    var key = String(pos || '').toLowerCase();
    var aliases = { adjective: 'adj', adverb: 'adv', pronoun: 'pron', preposition: 'prep', conjunction: 'conj', numeral: 'num', interjection: 'interj' };
    key = aliases[key] || key;
    var table = POS[uiCode] || POS.en;
    return table[key] || POS.en[key] || pos;
  }
  var panelMeaning = '';
  var words = state.words || {};
  var index = {};
  var current = null, currentKey = null, reqId = 0;
  var seconds = 0, last = Date.now(), unreported = 0;
  var lastCaption = '';

  function norm(s) {
    return String(s || '').normalize('NFC').replace(/[\u0591-\u05AF\u05B0-\u05C7]/g, '').replace(/\u05BE/g, '').trim();
  }
  function rebuild() {
    index = {};
    Object.keys(words).forEach(function (id) {
      var w = words[id];
      if (!w || w.lang !== lang) return;
      if (w.key) index[w.key] = w;
      if (w.form) index[w.form] = w;
      if (w.display) index[w.display] = w;
    });
  }
  function wordFor(raw) { var n = norm(raw); return index[raw] || index[n] || null; }
  function gradeClass(g) { return g === 5 ? 'g-known' : g === -1 ? 'g-ignored' : (g >= 1 && g <= 4) ? 'g-learning' : 'g-new'; }
  function send(action, params) {
    var q = Object.keys(params || {}).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    try { location.href = 'ner://' + action + (q ? '?' + q : ''); } catch (e) { }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var host = document.createElement('div');
  host.id = 'ner-watch-host';
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646';
  var root = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}
    :host{all:initial;direction:${uiDir};font-family:"Noto Sans Hebrew","Noto Sans",system-ui,sans-serif}
    .bar{position:fixed;top:10px;left:8px;right:8px;display:flex;align-items:center;gap:6px;pointer-events:auto;
      background:rgba(15,20,18,.86);color:#f6f0e0;border:1px solid rgba(255,255,255,.16);border-radius:15px;
      padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.35);backdrop-filter:blur(14px);font-size:12px}
    .brand{display:flex;align-items:center;gap:6px;font-weight:800;padding:0 4px}
    .flame{width:25px;height:25px;border-radius:8px;background:#2f6f5e;color:#f6e7c8;display:grid;place-items:center;font-size:13px}
    .grow{flex:1}
    .b{border:0;background:rgba(255,255,255,.08);color:inherit;font:inherit;font-size:10.5px;font-weight:650;padding:7px 9px;border-radius:9px;cursor:pointer}
    .b:active{background:rgba(255,255,255,.18)}
    .pill{font-size:9.5px;color:#cfc7b4;padding:0 8px;display:flex;align-items:center;gap:5px}
    .dot{width:6px;height:6px;border-radius:50%;background:#7fd0ae;box-shadow:0 0 0 3px rgba(127,208,174,.15)}
    .dot.off{background:#8c8c84;box-shadow:none}
    .cc{position:fixed;left:0;right:0;bottom:0;top:42vh;pointer-events:auto;direction:${dir};
      background:#0c100e;border:0;border-radius:0;
      padding:12px 16px 28px;color:#f6f0e0;
      font-size:16px;line-height:1.7;overflow:auto}
    .cc[hidden]{display:none}
    .cc-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .cc-channel{flex:1;min-width:0;border:0;background:transparent;color:#f6f0e0;font:inherit;font-size:15px;font-weight:750;text-align:start;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
    .cc-label{font-size:8px;letter-spacing:.13em;color:#b9b1a0;font-weight:800;direction:ltr}
    .hl-toggle{border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#f6f0e0;font:inherit;font-size:12px;font-weight:800;padding:6px 8px;cursor:pointer}
    .hl-toggle.off{opacity:.4}
    .cc.no-hl .ccw{background:transparent!important;box-shadow:none!important}
    .cc-translation{margin:10px 0 0;padding-top:10px;border-top:1px solid rgba(255,255,255,.12);color:#d8c48c;font-size:15px;line-height:1.6;direction:auto}
    .cc-history-line{opacity:.55;font-size:15px;line-height:1.5;margin:0 0 4px;padding:0 1px}
    .cc-history-line:last-child{opacity:1;font-size:22px;line-height:1.75;margin-top:5px}
    .ccw{cursor:pointer;border-radius:3px;padding:0 1px;transition:background .12s}
    .ccw.has-py{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;line-height:1.05}
    .py{font-size:11px;line-height:1;font-weight:650;color:#e7d7a4;letter-spacing:0}
    .ccw.active{background:rgba(230,180,90,.6)!important}
    .wp{display:none;position:relative;width:auto;margin:12px 0 2px;pointer-events:auto;
      background:#fffdf8;color:#1c1b18;border-radius:14px;border:1px solid #e3dac9;
      box-shadow:0 10px 28px rgba(0,0,0,.28);padding:12px 16px;overflow:visible;direction:${uiDir}}
    .wp.open{display:block}
    .grab{display:none}
    .whead{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .word{font-size:29px;line-height:1.1;font-weight:800;letter-spacing:-.03em;margin:0}
    .meta{font-size:11px;color:#2f6f5e;margin:4px 0 0;min-height:14px}
    .close{border:0;background:#f0e9db;color:#726c60;width:34px;height:34px;border-radius:10px;font-size:18px;cursor:pointer}
    .meaning{font-size:14px;line-height:1.55;margin:14px 0 4px;color:#3d3a33;unicode-bidi:plaintext}
    .phrase{margin:12px 0 0;padding:9px 12px;border-radius:12px;background:#f6ecd6;border:1px solid #e6d3a8;display:flex;flex-direction:column;gap:2px}
    .phrase[hidden]{display:none}
    .phrase small{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#b07f2c}
    .phrase b{font-size:15px;line-height:1.3;unicode-bidi:plaintext}
    .phrase span{font-size:12.5px;line-height:1.45;color:#3d3a33;unicode-bidi:plaintext}
    .more{font-size:10.5px;line-height:1.5;color:#726c60;margin:0;unicode-bidi:plaintext}
    .label{font-size:10px;color:#726c60;margin:14px 0 6px}
    .grades{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
    .grades button{min-height:50px;border:1px solid transparent;border-radius:11px;background:#f0e9db;color:#1c1b18;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer}
    .grades button b{font-size:14px}.grades button small{font-size:8px;color:#726c60}
    .grades button.active{background:#dfe9f5;border-color:#3f6fa8;color:#3f6fa8}
    .grades .k.active{background:#dcebe4;border-color:#2f6f5e;color:#2f6f5e}
    .grades .x.active{background:#e7ddca;border-color:#726c60;color:#726c60}
    .foot{display:flex;justify-content:space-between;align-items:center;margin-top:11px;font-size:10px;color:#726c60}
    .foot button{border:0;background:#dcebe4;color:#2f6f5e;border-radius:9px;padding:7px 10px;font:inherit;font-size:10px;font-weight:700;cursor:pointer}
    .browserbar{position:fixed;top:54px;left:8px;right:8px;display:flex;align-items:center;gap:4px;pointer-events:auto;
      background:rgba(15,20,18,.9);border:1px solid rgba(255,255,255,.13);border-radius:12px;padding:4px;
      box-shadow:0 6px 18px rgba(0,0,0,.3);backdrop-filter:blur(12px)}
    .navbtn{width:29px;height:29px;border:0;border-radius:8px;background:rgba(255,255,255,.07);color:#f6f0e0;font:inherit;font-size:15px;cursor:pointer;display:grid;place-items:center}
    .navbtn:active{background:rgba(255,255,255,.16)}
    .yt-home{width:36px;height:29px;border:0;border-radius:8px;background:transparent;padding:0;display:grid;place-items:center;cursor:pointer;flex:0 0 auto}
    .yt-home svg{display:block}
    .yt-search{flex:1;min-width:0;height:29px;border:0;border-radius:8px;background:rgba(255,255,255,.1);color:#f6f0e0;padding:0 10px;font:inherit;font-size:12px;direction:ltr;text-align:start;outline:none}
    .yt-search::placeholder{color:#b9b1a0}
    .yt-channel{max-width:38%;height:29px;border:0;border-radius:8px;background:rgba(255,255,255,.12);color:#f6f0e0;padding:0 8px;font:inherit;font-size:11px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;flex:0 1 auto}
    [hidden]{display:none!important}
    .mini{position:fixed;z-index:2147483647;top:42%;left:0;width:28px;height:46px;border:0;border-radius:0 12px 12px 0;
      background:rgba(15,20,18,.9);color:#f6f0e0;font:inherit;font-size:14px;font-weight:800;pointer-events:auto;
      box-shadow:0 6px 20px rgba(0,0,0,.35);backdrop-filter:blur(10px);z-index:2147483646}
    .cc{z-index:2147483647;font-size:22px;line-height:1.85}
    .browserbar{top:8px}
    @media(max-width:390px){.b{font-size:9.5px;padding:6px}.brand span{display:none}.grades button small{font-size:7px}}
  `;
  root.appendChild(style);

  var bar = el('div', 'bar');
  var brand = el('div', 'brand');
  brand.appendChild(el('span', 'flame', t('mark')));
  brand.appendChild(el('span', null, t('brand')));
  var pill = el('span', 'pill');
  var dot = el('i', 'dot off'); dot.id = 'dot';
  var time = el('span', null, '0:00'); time.id = 'time';
  pill.appendChild(dot); pill.appendChild(time);
  var grow = el('span', 'grow');
  var collapseBtn = el('button', 'b', '–');
  var close = el('button', 'b', t('close'));
  bar.appendChild(brand); bar.appendChild(pill); bar.appendChild(grow); bar.appendChild(collapseBtn); bar.appendChild(close);
  root.appendChild(bar);

  var bbar = el('div', 'browserbar');
  var homeBtn = el('button', 'yt-home');
  homeBtn.setAttribute('aria-label', 'YouTube');
  var homeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  homeSvg.setAttribute('viewBox', '0 0 28 20');
  homeSvg.setAttribute('width', '28');
  homeSvg.setAttribute('height', '20');
  homeSvg.setAttribute('aria-hidden', 'true');
  var homeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  homeRect.setAttribute('width', '28');
  homeRect.setAttribute('height', '20');
  homeRect.setAttribute('rx', '5');
  homeRect.setAttribute('fill', '#ff0033');
  var homePlay = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  homePlay.setAttribute('d', 'M11 5.2v9.6l8.2-4.8z');
  homePlay.setAttribute('fill', '#fff');
  homeSvg.appendChild(homeRect);
  homeSvg.appendChild(homePlay);
  homeBtn.appendChild(homeSvg);
  var search = el('input', 'yt-search');
  search.setAttribute('type', 'search');
  search.setAttribute('enterkeyhint', 'search');
  search.setAttribute('autocomplete', 'off');
  search.setAttribute('spellcheck', 'false');
  var searchLabels = { he: 'חיפוש', en: 'Search', hu: 'Keresés', es: 'Buscar', fr: 'Rechercher', de: 'Suchen', ru: 'Поиск', ar: 'بحث' };
  search.placeholder = searchLabels[uiCode] || 'Search';
  var channel = null;
  bbar.appendChild(homeBtn); bbar.appendChild(search);
  root.appendChild(bbar);
  var mini = el('button', 'mini', t('mark'));
  mini.hidden = true;
  root.appendChild(mini);
  var collapsed = false;
  var userExpanded = false;
  function setCollapsed(v) {
    collapsed = !!v;
    bar.hidden = collapsed;
    bbar.hidden = collapsed;
    bbar.style.top = '54px';
    mini.hidden = !collapsed;
  }
  collapseBtn.addEventListener('click', function () { userExpanded = false; setCollapsed(true); });
  mini.addEventListener('click', function () { userExpanded = true; setCollapsed(false); });
  setCollapsed(location.pathname.indexOf('/watch') >= 0);
  function syncCollapsed() {
    var v = document.querySelector('video');
    if (!userExpanded && (location.pathname.indexOf('/watch') >= 0 || (v && v.readyState >= 2))) setCollapsed(true);
  }
  document.addEventListener('yt-navigate-finish', syncCollapsed);
  window.addEventListener('popstate', syncCollapsed);
  setInterval(syncCollapsed, 800);

  var cc = el('div', 'cc'); cc.hidden = true;
  // Caption words are never coloured by learning state.
  var hlOn = false;
  var ccHead = el('div', 'cc-head');
  var channelBtn = el('button', 'cc-channel');
  channelBtn.hidden = true;
  var ccLabel = el('div', 'cc-label', t('captions'));
  var hlBtn = el('button', 'hl-toggle', 'Aa');
  hlBtn.setAttribute('aria-pressed', 'false');
  hlBtn.hidden = true;
  ccHead.appendChild(channelBtn); ccHead.appendChild(ccLabel); ccHead.appendChild(hlBtn);
  var ccLine = el('div', 'cc-line');
  var ccTranslation = el('div', 'cc-translation');
  cc.appendChild(ccHead); cc.appendChild(ccLine); cc.appendChild(ccTranslation);
  root.appendChild(cc);
  function applyHighlight() {
    cc.classList.toggle('no-hl', !hlOn);
    hlBtn.classList.toggle('off', !hlOn);
    hlBtn.setAttribute('aria-pressed', hlOn ? 'true' : 'false');
  }
  hlBtn.addEventListener('click', function () { hlOn = !hlOn; applyHighlight(); });
  applyHighlight();
  function fitCaption() {
    if (cc.hidden) return;
    var node = document.querySelector('video') || document.querySelector('#player');
    var top = Math.round(window.innerHeight * 0.42);
    if (node) {
      var r = node.getBoundingClientRect();
      if (r.height > 40 && r.bottom > 48 && r.bottom < window.innerHeight - 120) top = Math.round(r.bottom);
    }
    cc.style.top = top + 'px';
  }

  var wp = el('div', 'wp');
  wp.appendChild(el('div', 'grab'));
  var whead = el('div', 'whead');
  var wleft = el('div', null);
  var wordEl = el('h2', 'word', '…');
  var metaEl = el('p', 'meta');
  wleft.appendChild(wordEl); wleft.appendChild(metaEl);
  var closeW = el('button', 'close', '×');
  whead.appendChild(wleft); whead.appendChild(closeW);
  wp.appendChild(whead);
  var phraseEl = el('div', 'phrase');
  phraseEl.hidden = true;
  var phraseKind = el('small'), phraseText = el('b'), phraseMeaning = el('span');
  phraseEl.appendChild(phraseKind); phraseEl.appendChild(phraseText); phraseEl.appendChild(phraseMeaning);
  wp.appendChild(phraseEl);
  var meaningEl = el('p', 'meaning', t('loading'));
  var moreEl = el('p', 'more');
  wp.appendChild(meaningEl); wp.appendChild(moreEl);
  wp.appendChild(el('div', 'label', t('howWell')));
  var grades = el('div', 'grades');
  [[1,'1', t('g1')],[2,'2', t('g2')],[3,'3', t('g3')],[4,'4', t('g4')],[5,'K', t('g5')],[-1,'X', t('gx')]].forEach(function (g) {
    var b = el('button', g[0] === 5 ? 'k' : g[0] === -1 ? 'x' : '');
    b.setAttribute('data-grade', String(g[0]));
    b.appendChild(el('b', null, g[1]));
    b.appendChild(el('small', null, g[2]));
    grades.appendChild(b);
  });
  wp.appendChild(grades);
  var foot = el('div', 'foot');
  var rank = el('span');
  var speak = el('button', null, t('speak'));
  foot.appendChild(rank); foot.appendChild(speak);
  wp.appendChild(foot);
  cc.appendChild(wp);
  document.body.appendChild(host);

  var blocked = 0;
  var adStyle = document.createElement('style');
  adStyle.textContent = `
    .ytp-ad-overlay-slot,.ytp-ad-overlay-container,.ytp-ad-text-overlay,.ytp-ad-image-overlay,
    .ytp-ad-progress,.ytp-ad-progress-list,.ytp-ad-badge,.ytp-ad-skip-button-container,
    .ytp-ad-player-overlay,.ytp-ad-survey,.ytp-ad-message-container,#player-ads,
    ytd-display-ad-renderer,ytd-ad-slot-renderer,ytd-promoted-sparkles-web-renderer,
    ytd-promoted-video-renderer,ytd-in-feed-ad-layout-renderer,.ytp-featured-product,
    .ytp-suggested-action,.ytp-ce-element,.ytp-ad-module { display:none!important; visibility:hidden!important; }
  `;
  document.documentElement.appendChild(adStyle);

  function bumpShield(n) {
    if (!n) return;
    blocked += n;
  }

  var pageStyle = document.createElement('style');
  pageStyle.textContent = `
    ytm-pivot-bar-renderer, ytm-masthead, ytm-masthead-renderer, ytm-mobile-topbar-renderer,
    #masthead-container, .mobile-topbar-header, ytd-masthead, #guide-button, ytd-topbar-menu-button-renderer,
    ytd-notification-topbar-button-renderer, #buttons.ytd-masthead,
    a[href^="intent:"], a[href^="vnd.youtube:"], a[href^="youtube:"], a[href*="youtube://"],
    ytm-app-promo, ytm-app-upsell, .ytm-app-banner, [class*="app-promo"], [class*="open-app"],
    ytm-statement-banner-renderer { display:none!important; }
    html.ner-watch ytm-single-column-watch-next-results-renderer,
    html.ner-watch ytm-item-section-renderer,
    html.ner-watch ytm-comments-entry-point-header-renderer,
    html.ner-watch ytm-comment-section-renderer,
    html.ner-watch ytm-engagement-panel,
    html.ner-watch comments-entry-point-teaser-view-model,
    html.ner-watch ytm-slim-video-information-renderer,
    html.ner-watch ytm-video-metadata-carousel-view-model,
    html.ner-watch .related-items-container,
    html.ner-watch ytd-watch-next-secondary-results-renderer,
    html.ner-watch ytd-comments, html.ner-watch #related, html.ner-watch #comments,
    html.ner-watch .ytp-endscreen-content, html.ner-watch .ytp-ce-element { display:none!important; }
  `;
  document.documentElement.appendChild(pageStyle);

  function readChannel() {
    if (location.pathname.indexOf('/watch') < 0) return;
    var href = '', name = '';
    try {
      var details = window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.videoDetails;
      if (details && details.channelId) {
        href = 'https://m.youtube.com/channel/' + details.channelId;
        name = details.author || '';
      }
    } catch (e) { }
    if (!href) {
      var link = document.querySelector('ytm-slim-owner-renderer a[href*="/@"], ytm-slim-owner-renderer a[href*="/channel/"], ytm-video-owner-renderer a[href*="/@"], ytm-video-owner-renderer a[href*="/channel/"], ytd-video-owner-renderer a[href*="/@"], ytd-video-owner-renderer a[href*="/channel/"], #owner a[href*="/@"], #owner a[href*="/channel/"]');
      if (link) {
        var raw = link.getAttribute('href') || '';
        if (raw && raw.indexOf('/watch') < 0) {
          href = raw.indexOf('http') === 0 ? raw : ('https://m.youtube.com' + (raw.charAt(0) === '/' ? raw : '/' + raw));
          name = (link.innerText || link.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        }
      }
    }
    if (!href) return;
    if (!name && channel && channel.href === href) name = channel.name;
    if (channel && channel.href === href && channel.name === name) return;
    channel = { href: href, name: name };
    channelBtn.hidden = false;
    channelBtn.textContent = name || 'Channel';
  }

  function isOpenApp(node) {
    if (!node || node.id === 'ner-watch-host' || (node.closest && node.closest('#ner-watch-host'))) return false;
    var label = ((node.getAttribute && (node.getAttribute('aria-label') || '')) + ' ' + (node.innerText || '')).replace(/\s+/g, ' ').trim();
    var href = (node.getAttribute && node.getAttribute('href')) || '';
    if (/^(intent:|vnd\.youtube:|youtube:)/i.test(href) || href.indexOf('youtube://') >= 0) return true;
    return /open app|open in app|open in the youtube app|get the app|פתח באפליקציה|alkalmazás megnyitása|abrir app|ouvrir l.app|app öffnen|открыть приложение|فتح التطبيق/i.test(label);
  }

  function stripOpenApp() {
    document.querySelectorAll('a,button,ytm-app-promo,ytm-app-upsell,ytm-statement-banner-renderer').forEach(function (n) {
      if (!isOpenApp(n) || !n.parentNode) return;
      var promo = n.closest('ytm-app-promo, ytm-app-upsell, ytm-statement-banner-renderer');
      var target = promo || n;
      if (target.parentNode && target !== document.body) target.parentNode.removeChild(target);
    });
  }

  function cleanAds() {
    var removed = 0;
    stripOpenApp();
    if (document.body && !document.getElementById('ner-watch-host')) document.body.appendChild(host);
    document.querySelectorAll('.ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button,.ytp-ad-survey-answers .ytp-ad-survey-answer-button').forEach(function (b) {
      try { b.click(); removed++; } catch (e) { }
    });
    document.documentElement.classList.toggle('ner-watch', location.pathname.indexOf('/watch') >= 0);
    readChannel();
    document.querySelectorAll('.ytp-ad-overlay-slot,.ytp-ad-overlay-container,.ytp-ad-text-overlay,.ytp-ad-image-overlay,.ytp-ad-overlay-close-button,.ytp-ad-progress,.ytp-ad-progress-list,.ytp-ad-badge,.ytp-ad-skip-button-container,.ytp-ad-player-overlay,#player-ads,ytd-display-ad-renderer,ytd-ad-slot-renderer,ytd-promoted-sparkles-web-renderer,ytd-promoted-video-renderer,ytd-in-feed-ad-layout-renderer,.ytp-ad-module').forEach(function (n) {
      if (n && n.parentNode) { n.parentNode.removeChild(n); removed++; }
    });
    var adShowing = document.querySelector('.ad-showing');
    var video = document.querySelector('video');
    if (adShowing && video && isFinite(video.duration) && video.duration > 0) {
      try { video.currentTime = Math.max(0, video.duration - 0.05); removed++; } catch (e) { }
    }
    bumpShield(removed);
  }
  setInterval(cleanAds, 600);

  // React immediately to injected SPA ad nodes, too.
  try {
    new MutationObserver(function () { cleanAds(); }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) { }
  window.__NerWatchCleanAds = cleanAds;

  function findCaption() {
    var selectors = ['.ytp-caption-segment', '.caption-window', '.ytp-caption-window-container', '[class*="caption-window"]'];
    var best = '';
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (n) {
        var text = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim();
        if (text.length > best.length) best = text;
      });
    });
    return best;
  }

  var captionHistory = [];
  var wordTranslations = {};
  var translationSeq = 0;
  var currentTranslationRid = '';

  function scriptRe(langId) {
    if (langId === 'th') return /[\u0e00-\u0e7f]+/g;
    if (langId === 'ko') return /[\uac00-\ud7af]+/g;
    if (langId === 'ja') return /[\u3040-\u30ff\u3400-\u9fff]+/g;
    if (langId === 'zh' || langId === 'yue') return /[\u3400-\u9fff]+/g;
    return null;
  }
  function bridgeSegments(text, langId, base) {
    if (!text || !window.NerSeg || typeof NerSeg.segment !== 'function') return null;
    if (text.length > 4000) {
      var left = bridgeSegments(text.slice(0, 4000), langId, base);
      var right = bridgeSegments(text.slice(4000), langId, base + 4000);
      if (!left || !right) return null;
      return left.concat(right);
    }
    try {
      var arr = JSON.parse(NerSeg.segment(langId, text));
      if (!arr || !arr.length) return null;
      var out = [], at = 0;
      for (var i = 0; i < arr.length; i++) {
        var token = String(arr[i]);
        out.push({ segment: token, index: base + at, isWordLike: /[\p{L}\p{M}]/u.test(token) });
        at += token.length;
      }
      if (at !== text.length) return null;
      return out;
    } catch (e) { return null; }
  }
  function dictSegment(text, langId) {
    var marker = scriptRe(langId);
    if (marker && marker.test(text)) {
      var rx = scriptRe(langId), out = [], last = 0, m, saw = false;
      while ((m = rx.exec(text)) !== null) {
        saw = true;
        if (m.index > last) out.push({ segment: text.slice(last, m.index), index: last, isWordLike: false });
        var seg = bridgeSegments(m[0], langId, m.index);
        if (!seg) {
          for (var c = 0; c < m[0].length; c++) out.push({ segment: m[0].charAt(c), index: m.index + c, isWordLike: true });
        } else {
          for (var i = 0; i < seg.length; i++) out.push(seg[i]);
        }
        last = m.index + m[0].length;
      }
      if (saw) {
        if (last < text.length) out.push({ segment: text.slice(last), index: last, isWordLike: false });
        return out;
      }
    }
    var lex = window.NER_SEG && window.NER_SEG[langId];
    if (!lex || !text) return null;
    if ((langId === 'zh' || langId === 'yue') && !/[\u3400-\u9fff]/.test(text)) return null;
    if (langId === 'th' && !/[\u0e00-\u0e7f]/.test(text)) return null;
    var n = text.length, INF = 1e15;
    var cost = new Array(n + 1); cost[0] = 0;
    for (var z = 1; z <= n; z++) cost[z] = INF;
    var prev = new Array(n + 1), words = new Array(n + 1);
    for (var i = 0; i < n; i++) {
      if (cost[i] >= INF) continue;
      var c = text.charAt(i);
      var fallback = /[\p{L}\p{M}]/u.test(c) ? 1000000 : 1;
      if (cost[i] + fallback < cost[i + 1]) { cost[i + 1] = cost[i] + fallback; prev[i + 1] = i; words[i + 1] = c; }
      var max = Math.min(lex.max, n - i);
      for (var len = 2; len <= max; len++) {
        var w = text.slice(i, i + len), r = lex.w[w];
        if (r === undefined) continue;
        var cc = cost[i] + Math.max(1, r) + 2;
        if (cc < cost[i + len]) { cost[i + len] = cc; prev[i + len] = i; words[i + len] = w; }
      }
    }
    var out = [], at = n;
    while (at > 0) {
      var p = prev[at] === undefined ? at - 1 : prev[at];
      var token = words[at] || text.substring(p, at);
      out.unshift({ segment: token, index: p, isWordLike: /[\p{L}\p{M}]/u.test(token) });
      at = p;
    }
    return out;
  }

  function appendCaptionLine(text, current) {
    var line = el('div', 'cc-history-line' + (current ? ' current' : ''));
    var parts = dictSegment(text, lang);
    if (!parts) {
      var seg = null;
      try { seg = new Intl.Segmenter(lang, { granularity: 'word' }); } catch (e) { }
      if (seg) {
        parts = [];
        for (var part of seg.segment(text)) parts.push(part);
      }
    }
    if (parts) {
      var last = 0;
      for (var part of parts) {
        if (!part.isWordLike) continue;
        if (part.index > last) line.appendChild(document.createTextNode(text.slice(last, part.index)));
        var w = wordFor(part.segment);
        var sp = el('span', 'ccw ' + gradeClass(w ? w.grade : 0));
        sp.setAttribute('data-raw', part.segment);
        var py = (lang === 'zh' && window.NerPinyin) ? window.NerPinyin.phrase(part.segment) : '';
        if (py) {
          sp.classList.add('has-py');
          sp.appendChild(el('span', 'py', py));
        }
        sp.appendChild(document.createTextNode(part.segment));
        line.appendChild(sp);
        last = part.index + part.segment.length;
      }
      if (last < text.length) line.appendChild(document.createTextNode(text.slice(last)));
    } else {
      line.textContent = text;
    }
    ccLine.appendChild(line);
  }

  function renderCaption(text) {
    var watching = location.pathname.indexOf('/watch') >= 0;
    if (!text) {
      if (watching) cc.hidden = false;
      else { cc.hidden = true; lastCaption = ''; captionHistory = []; }
      return;
    }
    cc.hidden = false;
    if (text === lastCaption) return;
    lastCaption = text;
    if (captionHistory[captionHistory.length - 1] !== text) captionHistory.push(text);
    if (captionHistory.length > 5) captionHistory.shift();
    while (ccLine.firstChild) ccLine.removeChild(ccLine.firstChild);
    rebuild();
    captionHistory.forEach(function (line, i) {
      appendCaptionLine(line, i === captionHistory.length - 1);
    });
    if (baseLang && baseLang !== lang) {
      var rid = 'ct' + (++translationSeq);
      currentTranslationRid = rid;
      ccTranslation.textContent = t('translating');
      fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + encodeURIComponent(normLang(baseLang)) + '&dt=t&q=' + encodeURIComponent(text))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (rid !== currentTranslationRid) return;
          var out = (data && data[0] ? data[0] : []).map(function (p) { return p && p[0] ? p[0] : ''; }).join('').trim();
          ccTranslation.textContent = out;
        })
        .catch(function () { if (rid === currentTranslationRid) ccTranslation.textContent = ''; });
    } else {
      currentTranslationRid = '';
      ccTranslation.textContent = '';
    }
  }

  function meaningInBase(w) {
    if (!w || !w.meaning) return '';
    if (w.meaningBase === baseLang) return w.meaning;
    return '';
  }

  function showMeaning(text, extra, note) {
    panelMeaning = text || '';
    meaningEl.textContent = text || t('noMeaning');
    moreEl.textContent = extra || '';
    if (note) rank.textContent = note;
  }

  function rememberMeaning(text, raw) {
    panelMeaning = text || '';
    var key = currentKey || norm(raw || current || '');
    if (!key || !text) return;
    var id = lang + ':' + key;
    var entry = words[id];
    var gradeNow = entry ? (entry.grade || 1) : 1;
    if (!entry) {
      entry = { lang: lang, key: key, form: raw || current, display: raw || current, tr: '', pos: '',
        meaning: text, meaningBase: baseLang, grade: gradeNow, added: Date.now(), lastSeen: Date.now() };
      words[id] = entry;
    } else {
      entry.meaning = text;
      entry.meaningBase = baseLang;
    }
    currentKey = key;
    send('grade', { lang: lang, key: key, form: entry.form || raw || current, display: entry.display || raw || current,
      tr: entry.tr || '', pos: entry.pos || '', meaning: text, meaningBase: baseLang, grade: gradeNow, context: '' });
    rebuild();
  }

  function translatePieces(parts, sl, tl) {
    return Promise.all(parts.map(function (part) {
      var cacheKey = tl + '|' + sl + '|' + part;
      if (wordTranslations[cacheKey]) return Promise.resolve(wordTranslations[cacheKey]);
      return fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + encodeURIComponent(sl) +
        '&tl=' + encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(part))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var text = (data && data[0] ? data[0] : []).map(function (p) { return p && p[0] ? p[0] : ''; }).join('').trim();
          if (text) wordTranslations[cacheKey] = text;
          return text;
        });
    }));
  }

  function openWord(raw, span) {
    current = raw; currentKey = null; panelMeaning = '';
    root.querySelectorAll('.ccw.active').forEach(function (s) { s.classList.remove('active'); });
    if (span) span.classList.add('active');
    var w = wordFor(raw);
    wordEl.textContent = raw;
    wordEl.setAttribute('dir', dir);
    metaEl.textContent = w ? ((w.tr || '') + (w.pos ? ' · ' + posLabel(w.pos) : '')) : '';
    var saved = meaningInBase(w);
    panelMeaning = saved;
    meaningEl.textContent = saved || t('loading');
    moreEl.textContent = '';
    rank.textContent = saved ? t('saved') : '';
    root.querySelectorAll('.grades button').forEach(function (b) {
      b.classList.toggle('active', !!w && Number(b.getAttribute('data-grade')) === Number(w.grade));
    });
    wp.classList.add('open');
    requestAnimationFrame(function () {
      var r = wp.getBoundingClientRect(), cr = cc.getBoundingClientRect();
      if (r.bottom > cr.bottom) cc.scrollTop += Math.max(0, r.top - cr.top - 8);
    });
    phraseEl.hidden = true;
    var rid = 'w' + (++reqId);
    wp.__rid = rid;
    var ctx = lineContext(span);
    send('lookup', { lang: lang, word: raw, rid: rid, ctx: ctx.text, off: ctx.offset });
  }

  // The caption line around the tapped word, so a saying or idiom it belongs to is found.
  function lineContext(span) {
    var line = span && span.closest ? span.closest('.cc-history-line') : null;
    if (!line) return { text: '', offset: 0 };
    var text = '', offset = -1;
    var walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (n.parentElement && n.parentElement.closest('.py')) continue;
      if (offset < 0 && span.contains(n)) offset = text.length;
      text += n.nodeValue;
    }
    return { text: text.slice(0, 600), offset: Math.max(0, offset) };
  }

  var KIND = {
    he: { proverb: 'פתגם', idiom: 'ניב', phrase: 'צירוף' }, en: { proverb: 'Proverb', idiom: 'Idiom', phrase: 'Expression' },
    hu: { proverb: 'Közmondás', idiom: 'Szólás', phrase: 'Kifejezés' }, es: { proverb: 'Refrán', idiom: 'Modismo', phrase: 'Expresión' },
    fr: { proverb: 'Proverbe', idiom: 'Expression idiomatique', phrase: 'Expression' }, de: { proverb: 'Sprichwort', idiom: 'Redewendung', phrase: 'Wendung' },
    ru: { proverb: 'Пословица', idiom: 'Идиома', phrase: 'Выражение' }, ar: { proverb: 'مثل', idiom: 'تعبير اصطلاحي', phrase: 'عبارة' }
  };

  function showPhrase(ph) {
    if (!ph || !ph.found) { phraseEl.hidden = true; return; }
    var kinds = KIND[uiCode] || KIND.en;
    phraseKind.textContent = kinds[ph.kind] || kinds.phrase;
    phraseText.textContent = ph.w || ph.key;
    phraseText.setAttribute('dir', dir);
    var gloss = (ph.g && ph.g[0]) || '';
    phraseMeaning.textContent = gloss;
    phraseEl.hidden = false;
    var target = normLang(baseLang);
    if (!gloss || !target || target === 'en') return;
    var rid = wp.__rid;
    translatePieces([gloss], 'en', target).then(function (parts) {
      if (wp.__rid === rid && parts && parts[0]) phraseMeaning.textContent = parts[0];
    }).catch(function () { });
  }

  function closePanel() {
    wp.classList.remove('open');
    current = null;
    root.querySelectorAll('.ccw.active').forEach(function (s) { s.classList.remove('active'); });
  }

  function grade(g) {
    if (!current) return;
    var w = wordFor(current);
    var key = currentKey || (w && w.key) || norm(current);
    var form = (w && w.form) || current;
    var display = (w && w.display) || current;
    var tr = (w && w.tr) || '';
    var pos = (w && w.pos) || '';
    var meaning = panelMeaning || (w && w.meaningBase === baseLang ? w.meaning : '') || '';
    send('grade', { lang: lang, key: key, form: form, display: display, tr: tr, pos: pos, meaning: meaning, meaningBase: meaning ? baseLang : '', grade: g });
    if (!words[lang + ':' + key]) {
      words[lang + ':' + key] = { lang: lang, key: key, form: form, display: display, tr: tr, pos: pos, meaning: meaning, meaningBase: meaning ? baseLang : '', grade: g, added: Date.now() };
    } else {
      words[lang + ':' + key].grade = g;
      if (meaning) {
        words[lang + ':' + key].meaning = meaning;
        words[lang + ':' + key].meaningBase = baseLang;
      }
    }
    rebuild();
    root.querySelectorAll('.ccw').forEach(function (s) {
      var sw = wordFor(s.getAttribute('data-raw'));
      if (sw && sw.key === key) {
        s.className = 'ccw ' + gradeClass(g);
      }
    });
    root.querySelectorAll('.grades button').forEach(function (b) { b.classList.toggle('active', Number(b.getAttribute('data-grade')) === g); });
    if (g === 5 || g === -1) setTimeout(closePanel, 240);
  }

  function onlineMeaning(raw) {
    var target = normLang(baseLang || '');
    if (!target || target === lang) {
      showMeaning(t('missing'), t('sameLang'), t('notFound'));
      return;
    }
    var cacheKey = target + '|word|' + raw;
    if (wordTranslations[cacheKey]) {
      showMeaning(wordTranslations[cacheKey], '', t('online'));
      rememberMeaning(wordTranslations[cacheKey], raw);
      return;
    }
    meaningEl.textContent = t('translating');
    moreEl.textContent = '';
    panelMeaning = '';
    var rid = 'wt' + (++reqId);
    wp.__translationRid = rid;
    fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + encodeURIComponent(lang) +
      '&tl=' + encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(raw))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (wp.__translationRid !== rid) return;
        var text = (data && data[0] ? data[0] : []).map(function (p) { return p && p[0] ? p[0] : ''; }).join('').trim();
        if (!text) throw new Error('empty');
        wordTranslations[cacheKey] = text;
        showMeaning(text, '', t('savedOnline'));
        rememberMeaning(text, raw);
      })
      .catch(function () {
        if (wp.__translationRid !== rid) return;
        showMeaning(t('missing'), t('failed'), t('notFound'));
      });
  }

  function glossesFor(data) {
    var target = normLang(baseLang);
    if (target === 'he' && data.he && data.he.length) {
      return { lang: 'he', parts: data.he.slice(0, 3) };
    }
    var parts = [];
    if (data.meaning) parts.push(data.meaning);
    (data.glosses || []).forEach(function (g) {
      if (g && parts.indexOf(g) < 0 && parts.length < 3) parts.push(g);
    });
    return { lang: data.meaningLang || 'en', parts: parts.slice(0, 3) };
  }

  function lookupResult(rid, data) {
    if (!wp.classList.contains('open') || wp.__rid !== rid) return;
    showPhrase(data && data.phrase && data.phrase.key !== data.key ? data.phrase : null);
    if (!data || !data.found) {
      rank.textContent = t('notFound');
      onlineMeaning(current || '');
      return;
    }
    currentKey = data.key;
    var w = words[lang + ':' + data.key];
    var bits = [];
    if (data.display && data.display !== current) bits.push(data.display);
    var py = (lang === 'zh' && window.NerPinyin) ? window.NerPinyin.phrase(data.display || current || '') : '';
    if (py) bits.push(py);
    else if (lang !== 'zh' && data.tr) bits.push(data.tr);
    if (data.pos) bits.push(posLabel(data.pos));
    metaEl.textContent = bits.join(' · ');
    root.querySelectorAll('.grades button').forEach(function (b) { b.classList.toggle('active', !!w && Number(b.getAttribute('data-grade')) === Number(w.grade)); });
    var saved = meaningInBase(w);
    var rankNote = data.rank ? '#' + data.rank + ' ' + t('rank') : t('local');
    if (saved) {
      showMeaning(saved, '', rankNote);
      return;
    }
    var gloss = glossesFor(data);
    var target = normLang(baseLang);
    if (!gloss.parts.length) {
      onlineMeaning(current || '');
      return;
    }
    if (!target || target === gloss.lang) {
      showMeaning(gloss.parts[0], gloss.parts.slice(1).join(' · '), rankNote);
      if (!w) grade(1);
      else rememberMeaning(gloss.parts[0], current);
      return;
    }
    meaningEl.textContent = t('translating');
    moreEl.textContent = '';
    panelMeaning = '';
    var trid = 'wg' + (++reqId);
    wp.__translationRid = trid;
    translatePieces(gloss.parts, gloss.lang, target).then(function (parts) {
      if (wp.__translationRid !== trid) return;
      parts = parts.filter(Boolean);
      if (!parts.length) throw new Error('empty');
      showMeaning(parts[0], parts.slice(1).join(' · '), rankNote);
      rememberMeaning(parts[0], current);
    }).catch(function () {
      if (wp.__translationRid !== trid) return;
      showMeaning(gloss.parts[0], t('failed'), rankNote);
    });
  }

  root.addEventListener('click', function (e) {
    var g = e.target.closest('[data-grade]');
    if (g) { grade(Number(g.getAttribute('data-grade'))); return; }
    if (e.target === closeW) { closePanel(); return; }
    if (e.target === speak) { if (current) send('speak', { text: current, lang: lang }); return; }
    var s = e.target.closest('.ccw');
    if (s) { openWord(s.getAttribute('data-raw'), s); return; }
  });
  close.addEventListener('click', function () { send('close', {}); });
  homeBtn.addEventListener('click', function () { send('navigate', { url: 'https://m.youtube.com/' }); });
  channelBtn.addEventListener('click', function () { if (channel && channel.href) send('navigate', { url: channel.href }); });
  search.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var q = search.value.trim();
    if (!q) return;
    send('navigate', { url: 'https://m.youtube.com/results?search_query=' + encodeURIComponent(q) });
    search.blur();
  });
  document.addEventListener('fullscreenchange', function () {
    var fs = !!document.fullscreenElement || document.body.classList.contains('ytp-fullscreen');
    host.style.display = fs ? 'none' : 'block';
  });

  setInterval(function () {
    var v = document.querySelector('video');
    var playing = v && !v.paused && !v.ended && v.readyState >= 2 && document.visibilityState === 'visible';
    dot.className = 'dot' + (playing ? '' : ' off');
    if (playing) {
      var now = Date.now();
      var elapsed = Math.round((now - last) / 1000);
      last = now;
      if (elapsed > 0 && elapsed <= 12) {
        seconds += elapsed;
        unreported += elapsed;
        if (unreported >= 5) {
          send('listen', { seconds: Math.min(15, unreported) });
          unreported = 0;
        }
      }
    } else {
      last = Date.now();
    }
    time.textContent = (Math.floor(seconds / 60)) + ':' + (seconds % 60 < 10 ? '0' : '') + (seconds % 60);
    renderCaption(findCaption());
    readChannel();
    fitCaption();
  }, 800);

  window.__NerWatch = {
    cleanAds: cleanAds,
    translationResult: function (rid, text) {
      if (rid !== currentTranslationRid) return;
      ccTranslation.textContent = text || '';
    },
    lookupResult: lookupResult,
    gradeResult: function (w) {
      if (!w || !w.key) return;
      words[lang + ':' + w.key] = w;
      rebuild();
    },
    refresh: function (s) {
      state = s || state;
      words = state.words || {};
      lang = (state.settings && state.settings.lang) || lang;
      baseLang = (state.settings && state.settings.baseLang) || baseLang;
      dir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';
      rebuild();
    }
  };
  rebuild();
  window.__NerWatch = window.__NerWatch || {};
})();
