(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const LANGS = window.NER_LANGS || [];
  if (window.NER_PACKS) LANGS.forEach(l => { l.status = window.NER_PACKS.includes(l.id) ? 'installed' : 'online'; });
  const BY_LANG = Object.fromEntries(LANGS.map(l => [l.id, l]));
  const SYSTEM_LANG = String((navigator.language || 'en').split('-')[0] || 'en').toLowerCase();
  const DEFAULT_BASE = LANGS.some(l => l.id === SYSTEM_LANG) ? SYSTEM_LANG : 'en';
  const I18N = window.NER_I18N || { en: {}, hu: {} };
  const UI_LANGS = ['he', 'en', 'hu', 'es', 'fr', 'de', 'ru', 'ar'];
  const TESS = {he:'heb',en:'eng',ar:'ara',es:'spa',fr:'fra',de:'deu',it:'ita',pt:'por',nl:'nld',sv:'swe',da:'dan',no:'nor',fi:'fin',pl:'pol',ru:'rus',uk:'ukr',el:'ell',tr:'tur',zh:'chi_sim',yue:'chi_tra',ja:'jpn',ko:'kor',vi:'vie',id:'ind',th:'tha'};
  const SAMPLE = window.NER_SAMPLE;
  const N = window.Ner || {
    bootstrap: () => JSON.stringify({ state: {}, version: 'web', platform: 'web' }),
    state: () => '{}', saveState: () => true,
    lookup: () => JSON.stringify({ found: false }),
    speak: () => {}, stopSpeak: () => {}, openFile: () => {}, setTheme: () => {},
    openUrl: (u) => window.open(u, '_blank'), openExternal: (u) => window.open(u, '_blank'),
    openWatch: (u) => window.open(u, '_blank'), openBrave: (u) => window.open(u, '_blank'),
    share: () => {}, exportBackup: () => {}, importBackup: () => {},
    addRead: () => {}, addListening: () => {}, toast: () => {}, version: () => 'web',
    startSync: () => JSON.stringify({running:false}), stopSync: () => {}, syncGet: () => {}, syncPush: () => {}, ocrPdf: () => {}, ocrBook: () => {}, translate: () => {}, exportAnki: () => {}, segment: () => '[]', readBook: () => '{"ok":false}'
  };

  const GRADES = { '-1': 'דילגתי', '0': 'חדשה', '1': 'לא מכיר', '2': 'מזהה', '3': 'מבין', '4': 'כמעט', '5': 'ידוע' };
  const POS = {
    noun: 'שם עצם', verb: 'פועל', adj: 'שם תואר', adjective: 'שם תואר', adv: 'תואר הפועל', adverb: 'תואר הפועל',
    prep: 'מילת יחס', preposition: 'מילת יחס', pron: 'כינוי', pronoun: 'כינוי', conj: 'מילת חיבור',
    conjunction: 'מילת חיבור', num: 'מספר', numeral: 'מספר', interj: 'קריאת ביניים', particle: 'חלקיק',
    phrase: 'צירוף', name: 'שם', proper: 'שם פרטי', root: 'שורש', prefix: 'תחילית', suffix: 'סיומת',
    proverb: 'פתגם', idiom: 'ניב', prep_phrase: 'צירוף'
  };

  const DEFAULT_SETTINGS = {
    lang: 'en', baseLang: DEFAULT_BASE, ui: 'system', theme: 'auto', fontSize: 19, ttsRate: 1,
    dailyGoal: 20, highlightNew: true, showTranslit: true,
    readerPaged: false, readerPaper: 'auto', readerFont: 'sans', readerLine: 'normal', readerPinyin: false
  };
  // Reading backgrounds: [page, ink, dark?]. Low-glare palettes after the 发财中文 reader.
  const PAPERS = {
    paper: ['#fffdf8', '#1c1b18', false], cream: ['#ebdbbc', '#2a2318', false],
    sepia: ['#ecdfc4', '#332a18', false], xuan: ['#f3eee3', '#2b2722', false],
    quiet: ['#e4e3df', '#2a2a28', false], sage: ['#e3e8dc', '#262b22', false],
    blush: ['#f1e7e3', '#2e2527', false], dark: ['#1a1c1e', '#e6e2d8', true],
    dusk: ['#23201c', '#e6d9c3', true], inkgreen: ['#1b211e', '#dde3d8', true],
    black: ['#000000', '#d4d1ca', true]
  };
  const LINE_HEIGHTS = { tight: 1.6, normal: 1.95, airy: 2.3 };
  const STREAM_CHUNK = 300000;
  const utf8 = new TextEncoder();
  let state;
  let boot = { version: 'web', platform: 'web' };
  let currentView = 'library';
  let currentArticle = null;
  let currentWord = null;
  let currentLookup = null;
  let currentReader = null;
  let wordFilter = 'all';
  let readMode = 'books';
  let tocTab = 'contents';
  let syncHost = null;
  let pendingOcr = null;
  let langPickerMode = 'learn';
  let translationRid = 0;
  let i18nApplying = false;
  let i18nTimer = null;
  const pendingTranslations = new Map();
  let wordSearch = '';
  let langSearch = '';
  let saveTimer = null;
  let wordIndex = new Map();
  let readObserver = null;
  let tokenObserver = null;
  let scrollTick = false;
  let longPressed = false;
  let lastScrollTop = 0;
  let readPosTimer = null;
  let readTimers = new WeakMap();
  let pendingRead = 0;
  let readFlushTimer = null;
  let toastTimer = null;
  let aloud = null;
  let aloudToken = 0;
  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewAgain = new Set();
  let reviewRevealed = false;

  const todayKey = (date = new Date()) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  };
  const fmt = n => new Intl.NumberFormat(uiLocale()).format(n || 0);
  const escapeHtml = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

  function merge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (isObj(base) && isObj(over)) {
      const out = { ...base };
      for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
      return out;
    }
    return over === undefined ? base : over;
  }

  function defaultState() {
    return { version: 1, seeded: false, onboarded: false, settings: { ...DEFAULT_SETTINGS }, words: {}, stats: {}, articles: [], translations: {}, createdAt: Date.now() };
  }

  function uiLocale() {
    const l = activeUiLang();
    return ({ he: 'he-IL', hu: 'hu-HU', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ru: 'ru-RU', ar: 'ar-SA' })[l] || 'en-US';
  }
  function langName(l) {
    try {
      const n = new Intl.DisplayNames([uiLocale()], { type: 'language' }).of(l.id);
      if (n && n !== l.id) return n;
    } catch (e) { }
    const ui = activeUiLang();
    if (ui === 'en') return l.en || l.he || l.id;
    if (ui === 'hu') return (window.NER_LANG_HU && window.NER_LANG_HU[l.id]) || l.en || l.he || l.id;
    return l.he || l.en || l.id;
  }
  function lang() { return BY_LANG[state.settings.lang] || BY_LANG.he || LANGS[0]; }
  function baseLang() {
    const id = state.settings.baseLang || 'en';
    return BY_LANG[id] || { id, he: id, en: id, code: id.toUpperCase(), dir: 'ltr', status: 'custom' };
  }
  function dayStats(key = todayKey()) { return state.stats[key] || { read: 0, listened: 0, added: 0 }; }

  function load() {
    try { boot = JSON.parse(N.bootstrap()); } catch (e) { boot = {}; }
    const raw = boot && boot.state ? boot.state : {};
    state = merge(defaultState(), raw);
    if (!state.settings) state.settings = { ...DEFAULT_SETTINGS };
    if (!state.words) state.words = {};
    if (!state.stats) state.stats = {};
    if (!state.articles) state.articles = [];
    if (!BY_LANG[state.settings.lang]) state.settings.lang = 'he';
    if (raw && raw.settings && raw.onboarded === undefined) state.onboarded = true;
    if (!state.settings.readerFlow) {
      // 1.5: continuous scrolling became the default reading mode.
      state.settings.readerFlow = 1;
      state.settings.readerPaged = false;
    }
    const hadBaseLang = !!(raw && raw.settings && raw.settings.baseLang);
    if (!state.seeded) {
      state.seeded = true;
      save(true);
    } else if (!hadBaseLang) {
      save(true);
    }
    rebuildIndex();
    applyTtsRate();
  }

  function save(immediate = false) {
    clearTimeout(saveTimer);
    const doSave = () => {
      try { N.saveState(JSON.stringify(state)); } catch (e) { console.warn('save failed', e); }
    };
    if (immediate) doSave(); else saveTimer = setTimeout(doSave, 220);
  }

  function applyTheme() {
    const wanted = state.settings.theme || 'auto';
    const dark = wanted === 'dark' || (wanted === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#111614' : '#f6f2e9');
    try { if (N.setTheme) N.setTheme(dark); } catch (e) { }
    const use = $('#theme-btn use');
    if (use) use.setAttribute('href', dark ? '#i-sun' : '#i-moon');
    document.documentElement.style.setProperty('--reader-font', (state.settings.fontSize || 19) + 'px');
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
  }

  function levelFor(known) {
    if (known < 500) return 'A0';
    if (known < 1500) return 'A1';
    if (known < 3000) return 'A2';
    if (known < 6000) return 'B1';
    if (known < 10000) return 'B2';
    if (known < 16000) return 'C1';
    return 'C2';
  }

  function normalizeWord(raw) {
    let s = String(raw || '').normalize('NFC')
      .replace(/[\u0591-\u05AF\u05B0-\u05C7]/g, '')
      .replace(/\u05BE/g, '')
      .trim();
    try { s = s.toLocaleLowerCase(lang().id); } catch (e) { s = s.toLowerCase(); }
    return s;
  }

  function rebuildIndex() {
    wordIndex = new Map();
    const id = lang().id;
    for (const w of Object.values(state.words)) {
      if (!w || w.lang !== id) continue;
      if (w.key) wordIndex.set(w.key, w);
      if (w.form) wordIndex.set(w.form, w);
      if (w.display) wordIndex.set(w.display, w);
    }
  }

  function wordFor(raw) {
    const norm = normalizeWord(raw);
    return wordIndex.get(raw) || wordIndex.get(norm) || wordIndex.get(String(raw).trim()) || null;
  }

  function gradeClass(g) {
    if (g === 5) return 'g-known';
    if (g === -1) return 'g-ignored';
    if (g >= 1 && g <= 4) return 'g-learning';
    return 'g-new';
  }

  function gradeBadge(g) {
    if (g === 5) return 'K';
    if (g === -1) return 'X';
    if (g >= 1 && g <= 4) return String(g);
    return '•';
  }

  // Parts of speech by code; the Hebrew words are too ambiguous for the
  // catalog (שורש is both "root" and the app's name).
  const POS_ALIAS = { adjective: 'adj', adverb: 'adv', preposition: 'prep', pronoun: 'pron', conjunction: 'conj', numeral: 'num', intj: 'interj', prep_phrase: 'phrase', proper: 'name' };
  const POS_UI = {
    en: { noun: 'noun', verb: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', pron: 'pronoun', conj: 'conjunction', num: 'number', interj: 'interjection', particle: 'particle', phrase: 'expression', name: 'name', root: 'root', prefix: 'prefix', suffix: 'suffix', proverb: 'proverb', idiom: 'idiom', character: 'character', det: 'determiner', article: 'article' },
    hu: { noun: 'főnév', verb: 'ige', adj: 'melléknév', adv: 'határozószó', prep: 'elöljárószó', pron: 'névmás', conj: 'kötőszó', num: 'számnév', interj: 'indulatszó', particle: 'partikula', phrase: 'kifejezés', name: 'név', root: 'gyök', prefix: 'előtag', suffix: 'utótag', proverb: 'közmondás', idiom: 'szólás', character: 'írásjegy', det: 'determináns', article: 'névelő' },
    es: { noun: 'sustantivo', verb: 'verbo', adj: 'adjetivo', adv: 'adverbio', prep: 'preposición', pron: 'pronombre', conj: 'conjunción', num: 'numeral', interj: 'interjección', particle: 'partícula', phrase: 'expresión', name: 'nombre', root: 'raíz', prefix: 'prefijo', suffix: 'sufijo', proverb: 'refrán', idiom: 'modismo', character: 'carácter', det: 'determinante', article: 'artículo' },
    fr: { noun: 'nom', verb: 'verbe', adj: 'adjectif', adv: 'adverbe', prep: 'préposition', pron: 'pronom', conj: 'conjonction', num: 'numéral', interj: 'interjection', particle: 'particule', phrase: 'expression', name: 'nom propre', root: 'racine', prefix: 'préfixe', suffix: 'suffixe', proverb: 'proverbe', idiom: 'expression idiomatique', character: 'caractère', det: 'déterminant', article: 'article' },
    de: { noun: 'Substantiv', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', prep: 'Präposition', pron: 'Pronomen', conj: 'Konjunktion', num: 'Numerale', interj: 'Interjektion', particle: 'Partikel', phrase: 'Wendung', name: 'Name', root: 'Wurzel', prefix: 'Präfix', suffix: 'Suffix', proverb: 'Sprichwort', idiom: 'Redewendung', character: 'Schriftzeichen', det: 'Determinativ', article: 'Artikel' },
    ru: { noun: 'существительное', verb: 'глагол', adj: 'прилагательное', adv: 'наречие', prep: 'предлог', pron: 'местоимение', conj: 'союз', num: 'числительное', interj: 'междометие', particle: 'частица', phrase: 'выражение', name: 'имя', root: 'корень', prefix: 'приставка', suffix: 'суффикс', proverb: 'пословица', idiom: 'идиома', character: 'иероглиф', det: 'определитель', article: 'артикль' },
    ar: { noun: 'اسم', verb: 'فعل', adj: 'صفة', adv: 'ظرف', prep: 'حرف جر', pron: 'ضمير', conj: 'حرف عطف', num: 'عدد', interj: 'أداة تعجب', particle: 'أداة', phrase: 'عبارة', name: 'اسم علم', root: 'جذر', prefix: 'سابقة', suffix: 'لاحقة', proverb: 'مثل', idiom: 'تعبير اصطلاحي', character: 'حرف', det: 'محدد', article: 'أداة تعريف' }
  };
  function posLabel(pos) {
    if (!pos) return '';
    let code = String(pos).split(' ')[0];
    code = POS_ALIAS[code] || code;
    const ui = activeUiLang();
    if (ui === 'he') return POS[code] || POS[pos] || pos;
    return (POS_UI[ui] || POS_UI.en)[code] || pos;
  }

  function relativeDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const that = new Date(ts); that.setHours(0, 0, 0, 0);
    const days = Math.round((today - that) / 86400000);
    if (days <= 0) return tr('היום');
    if (days === 1) return tr('אתמול');
    if (days < 7) return tf('daysAgo', { n: days });
    return new Intl.DateTimeFormat(uiLocale(), { day: 'numeric', month: 'short' }).format(d);
  }

  // Chinese and Japanese characters count one each; other scripts by word.
  function countWords(text) {
    const t = String(text || '');
    const cjk = (t.match(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
    return cjk + (t.replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g, ' ').match(/[\p{L}\p{M}]+/gu) || []).length;
  }

  // A UI word in the current interface language, for labels built from pieces.
  const tr = he => translateString(he, activeUiLang()) || he;
  // A sentence with numbers: tf('words', { n: 3 }) → "3 words".
  function tf(id, vars) {
    const t = (window.NER_I18N_TPL || {})[id] || {};
    const text = t[activeUiLang()] || t.en || t.he || id;
    return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  }
  // A word inside a sentence ("116 words"): German keeps its capital.
  const trWord = he => { const t = tr(he); return activeUiLang() === 'de' ? t : t.toLocaleLowerCase(uiLocale()); };

  /* ---------------- rendering ---------------- */

  function activeUiLang() {
    const pref = state.settings.ui || 'system';
    if (pref !== 'system') return UI_LANGS.includes(pref) ? pref : 'en';
    return UI_LANGS.includes(SYSTEM_LANG) ? SYSTEM_LANG : 'en';
  }

  function translateString(value, lang) {
    const map = I18N[lang];
    if (!map || !value) return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    if (map[trimmed]) return value.replace(trimmed, map[trimmed]);
    return value;
  }

  function skipI18n(node) {
    const p = node.parentElement;
    if (!p) return true;
    if (p.closest('script,style,noscript,.reader-body,.sheet-word,.sheet-meaning,.sheet-glosses,.word-main,.preview-word,.preview-meaning,.book-card > strong,.book-cover-title,.recent-copy strong,.toc-copy,.notices,#reader-title')) return true;
    return false;
  }

  function restoreI18n(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.__i18nOrig !== undefined) n.nodeValue = n.__i18nOrig;
    }
    root.querySelectorAll('[data-i18n-placeholder],[data-i18n-aria],[data-i18n-title]').forEach(el => {
      if (el.dataset.i18nPlaceholder !== undefined) el.setAttribute('placeholder', el.dataset.i18nPlaceholder);
      if (el.dataset.i18nAria !== undefined) el.setAttribute('aria-label', el.dataset.i18nAria);
      if (el.dataset.i18nTitle !== undefined) el.setAttribute('title', el.dataset.i18nTitle);
    });
  }

  function applyUiLanguage() {
    const lang = activeUiLang();
    document.documentElement.lang = lang;
    const rtlUi = lang === 'he' || lang === 'ar';
    document.documentElement.dir = rtlUi ? 'rtl' : 'ltr';
    document.documentElement.style.setProperty('--ui-dir', rtlUi ? 'rtl' : 'ltr');
    document.documentElement.dataset.uiLang = lang;
    i18nApplying = true;
    try {
      if (lang === 'he') {
        restoreI18n(document.body);
      } else {
        translateTree(document.body, lang);
      }
      const title = document.querySelector('title');
      if (title && !title.__i18nOrig) title.__i18nOrig = title.textContent;
      if (title) title.textContent = lang === 'he' ? title.__i18nOrig : translateString(title.__i18nOrig, lang);
      const sel = $('#ui-select');
      if (sel) sel.value = state.settings.ui || 'system';
      const navLabels = ({
        he: ['בית', 'קריאה', 'צפייה', 'מילים', 'התקדמות'],
        en: ['Home', 'Read', 'Watch', 'Words', 'Progress'],
        hu: ['Kezdőlap', 'Olvasás', 'Nézés', 'Szavak', 'Haladás'],
        es: ['Inicio', 'Leer', 'Ver', 'Palabras', 'Progreso'],
        fr: ['Accueil', 'Lire', 'Regarder', 'Mots', 'Progrès'],
        de: ['Start', 'Lesen', 'Ansehen', 'Wörter', 'Fortschritt'],
        ru: ['Главная', 'Чтение', 'Смотреть', 'Слова', 'Прогресс'],
        ar: ['الرئيسية', 'قراءة', 'مشاهدة', 'الكلمات', 'التقدم']
      })[lang];
      if (navLabels) $$('#tabbar .tab span').forEach((el, i) => { if (navLabels[i]) el.textContent = navLabels[i]; });
    } finally {
      i18nApplying = false;
    }
  }

  function translateTree(root, lang) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const src = node.__i18nOrig !== undefined ? node.__i18nOrig : node.nodeValue;
        if (!src || !/[\u0590-\u05FF]/.test(src) || skipI18n(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.__i18nOrig === undefined) node.__i18nOrig = node.nodeValue;
      node.nodeValue = translateString(node.__i18nOrig, lang);
    }
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => {
      for (const attr of ['placeholder', 'aria-label', 'title']) {
        if (!el.hasAttribute(attr)) continue;
        const key = attr === 'placeholder' ? 'i18nPlaceholder' : attr === 'aria-label' ? 'i18nAria' : 'i18nTitle';
        if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(attr);
        const val = el.dataset[key];
        if (/[\u0590-\u05FF]/.test(val)) el.setAttribute(attr, translateString(val, lang));
      }
    });
  }

  function startI18nObserver() {
    try {
      new MutationObserver(() => {
        if (i18nApplying || activeUiLang() === 'he') return;
        clearTimeout(i18nTimer);
        i18nTimer = setTimeout(() => applyUiLanguage(), 40);
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) { }
  }

  function renderAll() {
    rebuildIndex();
    renderTopbar();
    renderHome();
    renderRead();
    renderWatch();
    renderWords();
    renderProgress();
    renderSettings();
  }

  function renderTopbar() {
    const l = lang();
    $('#lang-code').textContent = l.code;
    $('#lang-name').textContent = langName(l);
  }

  function articleRow(a, compact) {
    const kind = a.kind === 'watch' ? 'speaker' : a.kind === 'web' ? 'link' : 'book';
    const words = a.text ? countWords(a.text) : 0;
    return `<button class="recent-item" data-article-id="${escapeHtml(a.id)}">
      <span class="recent-icon"><svg><use href="#i-${kind}"></use></svg></span>
      <span class="recent-copy"><strong>${escapeHtml(a.title || 'ללא כותרת')}</strong>
      <small>${escapeHtml(langName(BY_LANG[a.lang] || lang()))} · ${relativeDate(a.lastOpened || a.added)}${words ? ' · ' + tf('words', { n: fmt(words) }) : ''}${a.kind === 'watch' ? ' · ' + tr('צפייה') : ''}</small></span>
      <span class="recent-arrow"><svg><use href="#i-chevron"></use></svg></span>
    </button>`;
  }

  function renderHome() {
    const l = lang();
    const t = dayStats();
    $('#today-read').textContent = fmt(t.read || 0);
    $('#today-known').textContent = fmt(t.added || 0);
    $('#streak-mini').textContent = fmt(streak());
    const dueN = dueWords().length;
    const dueEl = $('#review-due');
    const dueLabel = $('#review-due-label');
    if (dueEl) dueEl.textContent = fmt(dueN);
    if (dueLabel) {
      dueLabel.replaceChildren();
      if (dueN) dueLabel.textContent = 'ממתינות עכשיו';
      else {
        const next = nextDueAt();
        if (next) {
          const mins = Math.max(1, Math.round((next - Date.now()) / 60000));
          const lead = document.createElement('span');
          lead.textContent = 'הבאה בעוד';
          const unit = document.createElement('span');
          let n = mins;
          if (mins < 90) unit.textContent = 'דקות';
          else if (mins < 36 * 60) { n = Math.max(1, Math.round(mins / 60)); unit.textContent = 'שעות'; }
          else { n = Math.max(1, Math.round(mins / 1440)); unit.textContent = 'ימים'; }
          dueLabel.append(lead, ' ' + n + ' ', unit);
        } else dueLabel.textContent = 'דרגו מילה והיא תחזור';
      }
    }
    const earlyBtn = $('#practice-early');
    if (earlyBtn) earlyBtn.hidden = dueN > 0 || practiceWords().length === 0;
    const start = $('#start-card');
    if (start) start.hidden = state.articles.length > 0;
    const dateEl = $('#home-date');
    if (dateEl) dateEl.textContent = new Intl.DateTimeFormat(uiLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const recent = [...state.articles].sort((a, b) => (b.lastOpened || b.added || 0) - (a.lastOpened || a.added || 0));
    $('#home-continue').innerHTML = recent.length
      ? articleRow(recent[0])
      : `<button class="recent-empty" data-go="read">עוד אין טקסטים. פתחו ספר, כתבה או קישור — והתחילו לקרוא.</button>`;

    const preview = Object.values(state.words)
      .filter(w => w.lang === l.id && !w.seed)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      .slice(0, 3);
    const previewEl = $('#home-word-preview');
    if (!preview.length) {
      const seeds = l.id === 'he' ? (window.NER_SEED_HE || []).slice(0, 3) : [];
      previewEl.innerHTML = seeds.map(w => `<div class="preview-row">
        <span class="preview-word">${escapeHtml(w.display)}</span>
        <span class="preview-meaning">${escapeHtml(w.meaning || '')}</span>
        <span class="grade-dot n5"></span>
      </div>`).join('');
    } else {
      previewEl.innerHTML = preview.map(w => `<div class="preview-row">
        <span class="preview-word">${escapeHtml(w.display || w.form || w.key)}</span>
        <span class="preview-meaning">${escapeHtml(w.meaning || '')}</span>
        <span class="grade-dot n${w.grade}"></span>
      </div>`).join('');
    }
  }

  function renderRead() {
    const articles = [...state.articles].sort((a, b) => (b.lastOpened || b.added || 0) - (a.lastOpened || a.added || 0));
    const books = articles.filter(a => a.kind === 'book');
    const grid = $('#book-grid');
    if (grid) {
      grid.innerHTML = books.length ? books.map((a, i) => {
        const words = a.text ? countWords(a.text) : 0;
        const hue = ['#2f6f5e', '#73513a', '#3f5f86', '#7c5a2e', '#4d5b43'][i % 5];
        return `<button class="book-card" data-article-id="${escapeHtml(a.id)}">
          <span class="book-menu" data-item-menu="${escapeHtml(a.id)}" role="button" aria-label="${escapeHtml(tr('אפשרויות'))}">⋯</span>
          <span class="book-cover" style="--cover:${hue}"><span class="book-cover-title">${escapeHtml(a.title || 'ספר')}</span><span class="book-cover-format">${/epub/i.test(a.name || '') ? 'EPUB' : 'TXT'}</span></span>
          <strong>${escapeHtml(a.title || 'ספר')}</strong><small>${words ? tf('words', { n: fmt(words) }) : tr('ספר')} · ${relativeDate(a.lastOpened || a.added)}</small>
        </button>`;
      }).join('') : `<div class="book-empty"><div class="empty-mark"><svg><use href="#i-book"></use></svg></div><h3>המדף מחכה לספר הראשון</h3><p>ייבאו קובץ EPUB או TXT, או הדביקו טקסט ארוך.</p><button class="primary" data-action="file">הוסיפו ספר</button></div>`;
    }
    renderNews();
    const web = articles.filter(a => a.kind !== 'book' && a.kind !== 'watch');
    const shelf = $('#read-shelf');
    if (shelf) {
      shelf.innerHTML = web.length ? web.map(a => articleRow(a)).join('') : `<div class="recent-empty">עוד אין כתבות או טקסטים. הדביקו קישור או טקסט כדי להתחיל.</div>`;
    }
    applyReadMode();
  }

  function renderNews() {
    const host = $('#news-list');
    if (!host) return;
    const sites = (window.NER_NEWS || {})[lang().id] || [];
    $('#news-section').hidden = !sites.length;
    $('#news-title').textContent = langName(lang());
    host.innerHTML = sites.map(n => {
      let domain = '';
      try { domain = new URL(n.url).hostname.replace(/^www\./, ''); } catch (e) { }
      return `<button class="news-card" data-news-url="${escapeHtml(n.url)}" data-news-name="${escapeHtml(n.name)}">
        <strong>${escapeHtml(n.name)}</strong><small>${escapeHtml(n.note || '')}</small><span>${escapeHtml(domain)}</span>
      </button>`;
    }).join('');
  }

  function openWebUrl(url, title) {
    const article = {
      id: 'web-' + Date.now(), title: title || url, url, lang: lang().id, kind: 'web', added: Date.now(), lastOpened: Date.now()
    };
    const old = state.articles.find(a => a.kind === 'web' && a.url === url);
    if (old) old.lastOpened = Date.now(); else addArticle(article);
    save();
    renderRead();
    try { N.openUrl(url); } catch (e) { toast('לא ניתן לפתוח את הקישור'); }
  }

  function applyReadMode() {
    const books = $('#read-books-panel');
    const web = $('#read-web-panel');
    if (!books || !web) return;
    books.hidden = readMode !== 'books';
    web.hidden = readMode !== 'web';
    $$('#read-mode-seg button').forEach(b => b.classList.toggle('active', b.dataset.readMode === readMode));
  }

  function renderWatch() {
    const watched = [...state.articles].filter(a => a.kind === 'watch').sort((a, b) => (b.lastOpened || b.added || 0) - (a.lastOpened || a.added || 0));
    const host = $('#watch-recent');
    if (host) host.innerHTML = watched.length ? watched.slice(0, 6).map(a => articleRow(a)).join('') : `<div class="recent-empty">עוד לא צפיתם בכלום. הדביקו קישור יוטיוב או פתחו את יוטיוב.</div>`;
    const listened = Object.keys(state.stats).reduce((sum, d) => sum + (state.stats[d].listened || 0), 0);
    $('#watch-minutes').textContent = fmt(Math.round(listened / 60));
    $('#watch-words').textContent = fmt(Object.values(state.words).filter(w => w.lang === lang().id && w.source === 'watch').length);
    $('#watch-streak').textContent = fmt(streak());
  }

  function renderWords() {
    const l = lang();
    const all = Object.values(state.words).filter(w => w.lang === l.id);
    $('#words-total').textContent = fmt(all.filter(w => !w.seed).length);

    let list = all.slice();
    if (wordFilter === 'all' && !wordSearch.trim()) list = list.filter(w => !w.seed);
    if (wordFilter === 'new') list = list.filter(w => (w.grade || 0) === 0);
    if (wordFilter === 'learning') list = list.filter(w => w.grade >= 1 && w.grade <= 4);
    if (wordFilter === 'known') list = list.filter(w => w.grade === 5);
    if (wordFilter === 'ignored') list = list.filter(w => w.grade === -1);
    if (wordSearch.trim()) {
      const q = wordSearch.trim().toLocaleLowerCase(uiLocale());
      list = list.filter(w => [w.key, w.form, w.display, w.tr, w.meaning].some(v => String(v || '').toLocaleLowerCase(uiLocale()).includes(q)));
    }
    list.sort((a, b) => (b.lastSeen || b.added || 0) - (a.lastSeen || a.added || 0));

    const host = $('#word-list');
    if (!list.length) {
      const msg = wordSearch.trim() ? 'לא נמצאו מילים שמתאימות לחיפוש.' : (wordFilter === 'all' ? 'כשתפתחו מילה בטקסט, היא תופיע כאן.' : 'אין מילים בקטגוריה הזו עדיין.');
      host.innerHTML = `<div class="empty-state"><div class="empty-mark"><svg><use href="#i-words"></use></svg></div><h3>${wordSearch.trim() ? 'אין תוצאות' : 'המילים שלכם מחכות'}</h3><p>${escapeHtml(msg)}</p></div>`;
      return;
    }

    const shown = list.slice(0, 500);
    const groups = [];
    for (const w of shown) {
      const ts = w.lastSeen || w.added || Date.now();
      const key = todayKey(new Date(ts));
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) { g = { key, date: new Date(ts), words: [] }; groups.push(g); }
      g.words.push(w);
    }
    const dateLabel = d => {
      const key = todayKey(d);
      if (key === todayKey()) return 'היום';
      const y = new Date(); y.setDate(y.getDate() - 1);
      if (key === todayKey(y)) return 'אתמול';
      return new Intl.DateTimeFormat(uiLocale(), { day: 'numeric', month: 'long' }).format(d);
    };
    host.innerHTML = groups.map(g => `<div class="word-group"><div class="word-date">${escapeHtml(dateLabel(g.date))}</div>` +
      g.words.map(w => {
        const shownWord = w.form || w.display || w.key;
        return `<div class="word-row" data-word-id="${escapeHtml(w.lang + ':' + w.key)}" role="button" tabindex="0">
          <span class="word-main"><strong>${escapeHtml(shownWord)}</strong><span class="word-sub">
            ${(hanReading(shownWord) || (w.lang === 'zh' ? '' : w.tr)) ? `<span class="translit">${escapeHtml(hanReading(shownWord) || w.tr)}</span>` : ''}
            ${w.pos ? `<span class="word-pos">${escapeHtml(posLabel(w.pos))}</span>` : ''}
            <span class="meaning">${escapeHtml(w.meaning || '')}</span>
          </span></span>
          <span class="word-side">
            <span class="grade-badge n${w.grade}">${gradeBadge(w.grade)}</span>
            <button class="icon-btn" data-speak="${escapeHtml(shownWord)}" aria-label="השמעה"><svg><use href="#i-speaker"></use></svg></button>
            <button class="icon-btn word-dismiss" data-ignore-word="${escapeHtml(w.lang + ':' + w.key)}" aria-label="התעלם"><svg><use href="#i-close"></use></svg></button>
          </span>
        </div>`;
      }).join('') + '</div>').join('') +
      (list.length > shown.length ? `<div class="recent-empty" style="margin-top:10px">${escapeHtml(tf('showing', { a: fmt(shown.length), b: fmt(list.length) }))}</div>` : '');
  }

  function renderProgress() {
    const l = lang();
    const all = Object.values(state.words).filter(w => w.lang === l.id);
    const known = all.filter(w => w.grade === 5).length;
    const learning = all.filter(w => w.grade >= 1 && w.grade <= 4).length;
    const fresh = all.filter(w => (w.grade || 0) === 0).length;
    const total = known + learning + fresh;
    const pct = total ? Math.min(100, Math.round(known / total * 100)) : 0;
    $('#known-big').textContent = fmt(known);
    $('#learning-big').textContent = fmt(learning);
    $('#known-pct').textContent = pct + '%';
    $('#level-pill').textContent = levelFor(known);
    $('#progress-ring').style.setProperty('--p', pct);
    $('#progress-sentence').textContent = known
      ? tf('knownLearning', { a: fmt(known), b: fmt(learning) })
      : 'כל מילה שקראתם מקרבת אתכם לשפה.';

    const days = Object.keys(state.stats);
    const read = days.reduce((s, d) => s + (state.stats[d].read || 0), 0);
    const listened = days.reduce((s, d) => s + (state.stats[d].listened || 0), 0);
    $('#stat-read').textContent = fmt(read);
    $('#stat-streak').textContent = fmt(streak());
    $('#stat-listen').textContent = fmt(Math.round(listened / 60));

    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = todayKey(d);
      week.push({ key, value: (state.stats[key] && state.stats[key].read) || 0, label: new Intl.DateTimeFormat(uiLocale(), { weekday: 'narrow' }).format(d), today: i === 0 });
    }
    const max = Math.max(1, ...week.map(x => x.value));
    $('#week-total').textContent = tf('words', { n: fmt(week.reduce((s, x) => s + x.value, 0)) });
    $('#week-chart').innerHTML = week.map(x => `<div class="bar-col${x.today ? ' today' : ''}">
      <div class="bar-track"><div class="bar-fill" style="height:${Math.max(2, Math.round(x.value / max * 100))}%"></div></div>
      <small>${x.label}</small></div>`).join('');

    const cells = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const v = (state.stats[key] && state.stats[key].read) || 0;
      const level = v >= 1800 ? 4 : v >= 900 ? 3 : v >= 250 ? 2 : v > 0 ? 1 : 0;
      cells.push(`<div class="heat-cell${level ? ' l' + level : ''}" title="${key}: ${escapeHtml(tf('words', { n: fmt(v) }))}"></div>`);
    }
    $('#heatmap').innerHTML = cells.join('');

    const byLang = {};
    for (const w of Object.values(state.words)) byLang[w.lang] = (byLang[w.lang] || 0) + 1;
    const rows = Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxLang = Math.max(1, ...rows.map(r => r[1]));
    $('#lang-breakdown').innerHTML = rows.length ? rows.map(([id, count]) => {
      const meta = BY_LANG[id] || { code: '??', he: id };
      return `<div class="lang-bd-row"><span class="lang-bd-code">${meta.code}</span><span class="lang-bd-name">${escapeHtml(langName(meta))}</span>
        <span class="lang-bd-bar"><span style="width:${Math.round(count / maxLang * 100)}%"></span></span><span class="lang-bd-count">${fmt(count)}</span></div>`;
    }).join('') : `<p class="recent-empty">אין עדיין מילים בשפה כלשהי.</p>`;
  }

  function renderSyncUI() {
    const stateEl = $('#sync-state');
    if (!stateEl) return;
    const on = syncHost && syncHost.running;
    stateEl.textContent = on ? 'פעיל' : 'כבוי';
    $('#sync-host-box').hidden = !on;
    if (on) {
      $('#sync-host-ip').textContent = syncHost.ip + ':' + syncHost.port;
      $('#sync-host-token').textContent = syncHost.token;
    }
  }

  function startSyncHost() {
    try {
      syncHost = JSON.parse(N.startSync());
      if (!syncHost.running) { toast('לא ניתן לפתוח סנכרון'); syncHost = null; }
      else toast('הסנכרון פעיל באותה רשת Wi-Fi');
    } catch (e) { toast('לא ניתן לפתוח סנכרון'); syncHost = null; }
    renderSyncUI();
  }

  function stopSyncHost() {
    try { N.stopSync(); } catch (e) { }
    syncHost = null;
    renderSyncUI();
    toast('הסנכרון הופסק');
  }

  function joinSync() {
    const ip = ($('#sync-ip').value || '').trim();
    const port = Number(($('#sync-port').value || '8765').trim());
    const token = ($('#sync-code').value || '').trim();
    if (!ip || !port || !token) { toast('מלאו כתובת, פורט וקוד'); return; }
    toast('מתחבר למכשיר השני…');
    try { N.syncGet(ip, port, token, 'get'); } catch (e) { toast('החיבור נכשל'); }
  }

  function mergeRemoteState(remote) {
    if (!remote || !remote.words) throw new Error('bad state');
    const localWords = state.words || {};
    for (const [id, rw] of Object.entries(remote.words)) {
      const lw = localWords[id];
      if (!lw || (rw.lastSeen || rw.added || 0) > (lw.lastSeen || lw.added || 0)) localWords[id] = rw;
    }
    state.words = localWords;
    const localStats = state.stats || {};
    for (const [day, rs] of Object.entries(remote.stats || {})) {
      const ls = localStats[day] || {};
      localStats[day] = {
        read: Math.max(ls.read || 0, rs.read || 0),
        listened: Math.max(ls.listened || 0, rs.listened || 0),
        added: Math.max(ls.added || 0, rs.added || 0)
      };
    }
    state.stats = localStats;
    const byId = new Map((state.articles || []).map(a => [a.id, a]));
    for (const ra of remote.articles || []) {
      const la = byId.get(ra.id);
      if (!la) { byId.set(ra.id, ra); continue; }
      if ((ra.lastOpened || ra.added || 0) > (la.lastOpened || la.added || 0)) byId.set(ra.id, ra);
      const marks = new Set([...(la.bookmarks || []), ...(ra.bookmarks || [])]);
      byId.get(ra.id).bookmarks = Array.from(marks).sort((a, b) => (typeof a === 'object' ? Number(a.offset) || 0 : Number(a) || 0) - (typeof b === 'object' ? Number(b.offset) || 0 : Number(b) || 0));
    }
    state.articles = capArticles(Array.from(byId.values()).sort((a, b) => (b.lastOpened || b.added || 0) - (a.lastOpened || a.added || 0)));
    state.seeded = true;
    rebuildIndex();
    save(true);
    renderAll();
  }

  function onSyncPayload(rid, json) {
    let data;
    try { data = JSON.parse(json); } catch (e) { toast('תשובת סנכרון לא תקינה'); return; }
    if (!data || data.ok === false) { toast('הסנכרון נכשל: ' + ((data && data.error) || 'שגיאה')); return; }
    if (rid === 'get') {
      try { mergeRemoteState(data); } catch (e) { toast('מצב המכשיר השני לא תקין'); return; }
      const ip = ($('#sync-ip').value || '').trim();
      const port = Number(($('#sync-port').value || '8765').trim());
      const token = ($('#sync-code').value || '').trim();
      try { N.syncPush(ip, port, token, JSON.stringify(state), 'push'); } catch (e) { toast('שליחת המצב נכשלה'); }
      toast('המילים מוזגו. שולח בחזרה…');
    } else if (rid === 'push') {
      toast('הסנכרון הושלם');
    }
  }

  function renderSettings() {
    const l = lang();
    $('#setting-lang-label').textContent = langName(l);
    $('#setting-lang-code').textContent = l.code;
    const uiSel = $('#ui-select');
    if (uiSel) uiSel.value = state.settings.ui || 'system';
    const b = baseLang();
    $('#base-lang-label').textContent = langName(b);
    $('#base-lang-code').textContent = b.code;
    $('#dict-status').textContent = l.status === 'installed' ? 'חבילת שפה מקומית · עובדת בלי אינטרנט' : 'מילון מקוון עד שחבילת השפה תורד';
    $('#dict-badge').textContent = l.status === 'installed' ? 'מותקן' : 'מקוון';
    $$('#theme-seg button').forEach(b => b.classList.toggle('active', b.dataset.theme === state.settings.theme));
    $('#font-range').value = state.settings.fontSize;
    $('#font-range-val').textContent = state.settings.fontSize;
    $('#goal-range').value = state.settings.dailyGoal;
    $('#goal-range-val').textContent = state.settings.dailyGoal;
    $('#tts-range').value = Math.round((state.settings.ttsRate || 1) * 100);
    $('#tts-range-val').textContent = (state.settings.ttsRate || 1).toFixed(1) + '×';
    $('#app-version').textContent = boot.version || '1.6.1';
    renderSyncUI();
  }

  function renderLangList() {
    const q = langSearch.trim().toLocaleLowerCase(uiLocale());
    const activeId = langPickerMode === 'base' ? state.settings.baseLang : state.settings.lang;
    const list = LANGS.filter(l => !q || (l.he + ' ' + l.en + ' ' + l.code).toLocaleLowerCase(uiLocale()).includes(q));
    $('#lang-list').innerHTML = list.map(l => `<button class="lang-row${l.id === activeId ? ' active' : ''}" data-lang-id="${l.id}">
      <span class="lang-code">${l.code}</span>
      <span class="lang-row-copy"><strong>${langName(l)}</strong><small>${l.en} · ${l.status === 'installed' ? 'מילון מקומי' : 'מילון מקוון'}</small></span>
      ${l.id === activeId ? '<svg class="lang-check"><use href="#i-check"></use></svg>' : ''}
    </button>`).join('') || `<p class="recent-empty">לא נמצאה שפה.</p>`;
  }

  /* ---------------- navigation ---------------- */

  function navigate(view) {
    if (view !== 'reader' && currentView === 'reader') cleanupReader();
    currentView = view;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === view));
    document.body.classList.toggle('reader-mode', view === 'reader');
    if (view === 'settings') renderSettings();
    if (view === 'reader') {
      $('#reader-scroll').scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (view === 'home') renderHome();
      if (view === 'read') renderRead();
      if (view === 'watch') renderWatch();
      if (view === 'words') renderWords();
      if (view === 'progress') renderProgress();
    }
  }

  function back() {
    if ($('#reader-toc').classList.contains('open')) { closeReaderToc(); return true; }
    if ($('#reader-settings').classList.contains('open')) { closeReaderSettings(); return true; }
    if ($('#word-sheet').classList.contains('open')) { closeSheet(); return true; }
    if ($('#item-sheet').classList.contains('open')) { closeItemSheet(); return true; }
    if (!$('#edit-word-modal').hidden) { hideModal('edit-word'); return true; }
    if (!$('#paste-modal').hidden) { hideModal('paste'); return true; }
    if (!$('#lang-modal').hidden) { hideModal('lang'); return true; }
    if (!$('#notices-modal').hidden) { hideModal('notices'); return true; }
    if (currentView === 'reader') { cleanupReader(); navigate('read'); return true; }
    if (currentView !== 'home') { navigate('home'); return true; }
    return false;
  }

  function cleanupReader() {
    stopAloud(false);
    flushRead();
    closeReaderSettings();
    closeReaderToc();
    if (currentReader && currentArticle) {
      if (currentReader.paged) {
        currentArticle.page = currentReader.page;
        if (currentReader.stream) currentArticle.streamOffset = currentReader.stream.offset;
      } else {
        saveReadPosition();
      }
      save();
    }
    currentReader = null;
    if (readObserver) { readObserver.disconnect(); readObserver = null; }
    if (tokenObserver) { tokenObserver.disconnect(); tokenObserver = null; }
    clearInterval(readFlushTimer); readFlushTimer = null;
    clearTimeout(readPosTimer);
    readTimers = new WeakMap();
    currentArticle = null;
    document.body.classList.remove('reader-mode');
    $('#view-reader').classList.remove('scroll-mode', 'chrome-hidden');
    applyTheme();
  }

  /* ---------------- reader ---------------- */

  let streamLoading = false;
  let pendingStream = null;

  function openStreamArticle(article) {
    if (!article || !article.bookId) { toast('הספר לא נמצא'); return; }
    if (state.settings.readerPaged === false) { openStreamScroll(article); return; }
    streamLoading = true;
    pendingStream = { article, page: Math.max(0, Number(article.page) || 0), goLast: false };
    try {
      const raw = N.readBook(article.bookId, Math.max(0, Number(article.streamOffset) || 0), 300000);
      onBookChunk('book', raw);
    } catch (e) { streamLoading = false; toast('לא ניתן לפתוח את הספר'); }
  }

  function loadStreamChunk(offset, goLast) {
    if (streamLoading || !currentReader || !currentReader.stream) return;
    streamLoading = true;
    pendingStream = { article: currentArticle, page: 0, goLast: !!goLast };
    try {
      const raw = N.readBook(currentReader.stream.bookId, Math.max(0, offset), 300000);
      onBookChunk('book', raw);
    } catch (e) { streamLoading = false; toast('לא ניתן לטעון את ההמשך'); }
  }

  function onBookChunk(rid, json) {
    if (rid !== 'book' || !pendingStream) return;
    let data;
    try { data = JSON.parse(json); } catch (e) { data = null; }
    if (!data || !data.ok || !data.text) {
      toast('לא ניתן לקרוא את הספר');
      streamLoading = false; pendingStream = null; return;
    }
    const article = pendingStream.article;
    const goLast = pendingStream.goLast;
    const wanted = pendingStream.page;
    article.stream = true;
    article.streamOffset = Number(data.offset) || 0;
    openReaderText(article.title, data.text, article, {
      paged: true,
      page: goLast ? Infinity : wanted,
      stream: {
        bookId: article.bookId, offset: Number(data.offset) || 0,
        prev: Number(data.prev) || 0, next: Number(data.next) || 0,
        total: Number(data.total) || 0, done: !!data.done
      }
    });
    streamLoading = false;
    pendingStream = null;
  }

  function openReaderText(title, text, article, opts = {}) {
    const l = lang();
    currentArticle = article || { id: 'text-' + Date.now(), title, text, lang: l.id, kind: 'text' };
    if (!currentArticle.lang) currentArticle.lang = l.id;
    const blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    const paged = opts.paged != null ? opts.paged : state.settings.readerPaged !== false;
    currentReader = {
      title: title || 'קריאה', text: String(text || ''), blocks, pages: [],
      page: Math.max(0, Number(opts.page != null ? opts.page : currentArticle.page) || 0),
      chapters: Array.isArray(currentArticle.chapters) ? currentArticle.chapters : [],
      paged, stream: opts.stream || null, streamBlocks: opts.streamBlocks || null, paras: [],
      wantOffset: opts.wantOffset != null ? opts.wantOffset
        : (!paged && !opts.stream && currentArticle.readOffset != null ? Number(currentArticle.readOffset) : null)
    };
    currentReader.pages = paginateReader(blocks);
    currentReader.page = Math.min(currentReader.page, Math.max(0, currentReader.pages.length - 1));
    document.body.classList.add('reader-mode');
    $('#reader-title').textContent = title || 'קריאה';
    $('#reader-meta').textContent = `${langName(l)} · ${fmt(countWords(text))} ${trWord('מילים')}`;
    $('#reader-progress').dir = l.dir;
    $('#view-reader').classList.remove('chrome-hidden');
    navigate('reader');
    applyReaderSettings();
    renderReaderCurrent();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function readerPageTarget() {
    return Math.max(420, Math.round(1150 - (state.settings.fontSize || 19) * 20));
  }

  function paginateReader(blocks) {
    const target = readerPageTarget();
    const pages = [];
    let page = [], len = 0;
    const pushPage = () => {
      if (page.length) { pages.push(page); page = []; len = 0; }
    };
    const addBlock = block => {
      if (block.length > target * 2) {
        const parts = block.split(/(?<=[.!?׃])\s+/);
        let chunk = '';
        for (const part of parts) {
          if (chunk && (chunk + ' ' + part).length > target) {
            pushPage(); page.push(chunk); len = chunk.length; chunk = part;
          } else {
            chunk = chunk ? chunk + ' ' + part : part;
          }
          if (chunk.length > target * 2) {
            while (chunk.length > target) {
              let cut = chunk.lastIndexOf(' ', target);
              if (cut < target * .55) cut = target;
              pushPage(); page.push(chunk.slice(0, cut)); len = cut;
              chunk = chunk.slice(cut).trim();
            }
          }
        }
        if (chunk) {
          if (len + chunk.length > target) pushPage();
          page.push(chunk); len += chunk.length;
        }
        return;
      }
      if (len && len + block.length > target) pushPage();
      page.push(block); len += block.length + 2;
    };
    for (const b of blocks) addBlock(b);
    pushPage();
    return pages.length ? pages : [['']];
  }

  function renderReaderCurrent() {
    if (!currentReader) return;
    $('#view-reader').classList.toggle('scroll-mode', !currentReader.paged);
    if (currentReader.paged) renderReaderPage();
    else renderReaderScroll();
  }

  /* ---------------- continuous reading ---------------- */
  // Scroll mode renders paragraphs as plain text and turns them into tappable
  // words only as they come near the screen, so a long chunk opens at once.
  // Streamed books grow a chunk at a time in either direction. Positions are
  // paragraph starts: characters for inline text, UTF-8 bytes for book files.

  const byteLen = text => utf8.encode(text).length;

  function charsForBytes(text, bytes) {
    let b = 0, i = 0;
    while (i < text.length && b < bytes) {
      const c = text.codePointAt(i);
      b += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
      i += c > 0xffff ? 2 : 1;
    }
    return i;
  }

  function splitBlocks(text, base, bytes) {
    const out = [];
    const re = /\r?\n(?:[ \t]*\r?\n)+/g;
    let last = 0, pos = base, m;
    const add = (from, to) => {
      const t = text.slice(from, to).replace(/\r/g, '').trim();
      if (t) out.push({ text: t, off: pos });
    };
    while ((m = re.exec(text)) !== null) {
      add(last, m.index);
      const next = m.index + m[0].length;
      pos += bytes ? byteLen(text.slice(last, next)) : next - last;
      last = next;
    }
    add(last, text.length);
    return out;
  }

  // Read part of a book file. Without atParagraph the partial first paragraph
  // is dropped; with upTo the text stops where already-rendered text begins.
  function readStreamText(bookId, offset, atParagraph, upTo) {
    let data;
    try { data = JSON.parse(N.readBook(bookId, Math.max(0, offset), STREAM_CHUNK)); } catch (e) { return null; }
    if (!data || !data.ok) return null;
    let text = String(data.text || '');
    let start = Number(data.offset) || 0;
    const total = Number(data.total) || 0;
    if (upTo != null) text = text.slice(0, charsForBytes(text, upTo - start));
    if (!atParagraph && start > 0) {
      const nl = text.indexOf('\n');
      if (nl >= 0) { start += byteLen(text.slice(0, nl + 1)); text = text.slice(nl + 1); }
    }
    let end = upTo != null ? upTo : (Number(data.next) || start + byteLen(text));
    const done = upTo == null && !!data.done;
    if (upTo == null && !done) {
      const nl = text.lastIndexOf('\n');
      if (nl > 0) text = text.slice(0, nl + 1);
      end = start + byteLen(text);
    }
    return { text, start, end, total, done, blocks: splitBlocks(text, start, true) };
  }

  function openStreamScroll(article, at) {
    const pos = Math.max(0, Number(at != null ? at : (article.readOffset != null ? article.readOffset : article.streamOffset)) || 0);
    const from = pos < 8000 ? 0 : pos - 6000;
    const chunk = readStreamText(article.bookId, from, from === 0);
    if (!chunk) { toast('לא ניתן לפתוח את הספר'); return; }
    article.stream = true;
    openReaderText(article.title, chunk.text, article, {
      paged: false, wantOffset: pos, streamBlocks: chunk.blocks,
      stream: { bookId: article.bookId, offset: chunk.start, next: chunk.end, prev: 0, total: chunk.total, done: chunk.done }
    });
  }

  function paragraphs(blocks) {
    const frag = document.createDocumentFragment();
    for (const b of blocks) {
      const p = document.createElement('p');
      p.dataset.off = String(b.off);
      p.textContent = b.text;
      p.__text = b.text;
      frag.appendChild(p);
    }
    return frag;
  }

  function titleNode() {
    const h = document.createElement('h1');
    h.textContent = currentReader.title;
    return h;
  }

  function renderReaderScroll() {
    const r = currentReader;
    const body = $('#reader-body');
    if (!body || !r) return;
    body.dir = lang().dir;
    body.textContent = '';
    body.onclick = onReaderClick;
    const blocks = r.stream ? (r.streamBlocks || splitBlocks(r.text, r.stream.offset, true)) : splitBlocks(r.text, 0, false);
    // Books usually open with their own title line; show it once.
    if ((!r.stream || r.stream.offset === 0) && !(blocks[0] && blocks[0].text.trim() === String(r.title).trim())) body.appendChild(titleNode());
    body.appendChild(paragraphs(blocks));
    r.paras = $$('#reader-body p[data-off]');
    rebuildIndex();
    $('#reader-pagebar').hidden = true;
    updateReaderEnd();
    setupReaderObservers();
    watchParagraphs();
    const want = r.wantOffset;
    r.wantOffset = null;
    lastScrollTop = 0;
    requestAnimationFrame(() => {
      if (want != null) scrollToOffset(want); else $('#reader-scroll').scrollTop = 0;
      onReaderScroll();
    });
    updateBookmarkButton();
  }

  function updateReaderEnd() {
    const r = currentReader;
    $('#reader-end').hidden = !!(r && r.stream && !r.stream.done);
  }

  function watchParagraphs() {
    const r = currentReader;
    if (!r) return;
    for (const p of r.paras) {
      if (p.__watched) continue;
      p.__watched = true;
      if (tokenObserver) tokenObserver.observe(p); else tokenizeNode(p);
      if (readObserver) readObserver.observe(p);
    }
  }

  function setupReaderObservers() {
    if (tokenObserver) tokenObserver.disconnect();
    if (readObserver) readObserver.disconnect();
    tokenObserver = readObserver = null;
    clearInterval(readFlushTimer);
    readFlushTimer = setInterval(flushRead, 12000);
    if (!('IntersectionObserver' in window)) return;
    const root = $('#reader-scroll');
    tokenObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        tokenObserver.unobserve(e.target);
        tokenizeNode(e.target);
      }
    }, { root, rootMargin: '1200px 0px' });
    // A paragraph counts as read after it has filled half the screen (or half
    // of itself) for 1.5 seconds.
    readObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        const p = e.target;
        if (p.dataset.read) continue;
        const rootH = e.rootBounds ? e.rootBounds.height : window.innerHeight;
        const seen = e.isIntersecting && e.intersectionRect.height >= Math.min(e.boundingClientRect.height, rootH) * .5;
        const t = readTimers.get(p);
        if (seen && !t) {
          readTimers.set(p, setTimeout(() => {
            readTimers.delete(p);
            if (p.dataset.read || !p.isConnected) return;
            p.dataset.read = '1';
            pendingRead += p.querySelectorAll('.ner-w').length || countWords(p.__text || p.textContent);
            if (pendingRead >= 25) flushRead();
          }, 1500));
        } else if (!seen && t) {
          clearTimeout(t);
          readTimers.delete(p);
        }
      }
    }, { root, threshold: [0, .25, .5, .75, 1] });
  }

  function paraIndexAt(y) {
    const ps = currentReader ? currentReader.paras : [];
    let lo = 0, hi = ps.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const p = ps[mid];
      if (p.offsetTop + p.offsetHeight > y) hi = mid; else lo = mid + 1;
    }
    return lo;
  }

  function scrollPosition() {
    const r = currentReader;
    const ps = r ? r.paras : [];
    if (!ps.length) return null;
    const sc = $('#reader-scroll');
    const line = sc.scrollTop + 76;
    const i = paraIndexAt(line);
    const p = ps[i];
    const off = Number(p.dataset.off);
    const nextOff = ps[i + 1] ? Number(ps[i + 1].dataset.off) : (r.stream ? r.stream.next : r.text.length);
    const frac = Math.max(0, Math.min(1, (line - p.offsetTop) / Math.max(1, p.offsetHeight)));
    const total = r.stream ? r.stream.total : r.text.length;
    const lastP = ps[ps.length - 1];
    const allShown = lastP.offsetTop + lastP.offsetHeight <= sc.scrollTop + sc.clientHeight;
    const atEnd = (allShown || sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8) && (!r.stream || r.stream.done);
    const pct = atEnd ? 1 : Math.max(0, Math.min(1, (off + frac * (nextOff - off)) / Math.max(1, total)));
    return { off, pct, index: i };
  }

  function scrollToOffset(off) {
    const r = currentReader;
    if (!r || !r.paras.length) return;
    let pick = r.paras[0];
    for (const p of r.paras) {
      if (Number(p.dataset.off) <= off) pick = p; else break;
    }
    const sc = $('#reader-scroll');
    // Not the reader scrolling: keep the bars as they are.
    r.jumping = true;
    sc.scrollTop = pick === r.paras[0] && (!r.stream || r.stream.offset === 0) ? 0 : Math.max(0, pick.offsetTop - 70);
    lastScrollTop = sc.scrollTop;
  }

  function setProgress(pct) {
    const fill = $('#reader-progress span');
    if (fill) fill.style.width = (Math.max(0, Math.min(1, pct)) * 100).toFixed(2) + '%';
    const status = $('#reader-status');
    if (status) status.textContent = Math.round(pct * 100) + '%';
  }

  function saveReadPosition() {
    const r = currentReader;
    if (!r || r.paged || !currentArticle || r.offsetNow == null) return;
    currentArticle.readOffset = r.offsetNow;
    currentArticle.progress = Math.round((r.pctNow || 0) * 1000) / 10;
    save();
  }

  function onReaderScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const r = currentReader;
      if (!r || r.paged) return;
      const sc = $('#reader-scroll');
      const y = sc.scrollTop;
      const dy = y - lastScrollTop;
      lastScrollTop = y;
      const view = $('#view-reader');
      const atEnd = y + sc.clientHeight >= sc.scrollHeight - 8;
      if (r.jumping) r.jumping = false;
      else if (y < 60 || dy < -8 || atEnd) view.classList.remove('chrome-hidden');
      else if (dy > 6 && !document.body.classList.contains('sheet-open')) view.classList.add('chrome-hidden');
      const pos = scrollPosition();
      if (pos) {
        r.offsetNow = pos.off;
        r.pctNow = pos.pct;
        setProgress(pos.pct);
      }
      clearTimeout(readPosTimer);
      readPosTimer = setTimeout(() => { saveReadPosition(); updateBookmarkButton(); }, 400);
      if (r.stream && !r.growing) {
        if (!r.stream.done && y + sc.clientHeight > sc.scrollHeight - 2500) growStream(1);
        else if (r.stream.offset > 0 && y < 1500) growStream(-1);
      }
    });
  }

  function growStream(dir) {
    const r = currentReader;
    if (!r || !r.stream || r.growing) return;
    r.growing = true;
    setTimeout(() => {
      try {
        if (currentReader !== r) return;
        const s = r.stream;
        const body = $('#reader-body');
        if (dir > 0) {
          const chunk = readStreamText(s.bookId, s.next, true);
          if (!chunk) { s.done = true; return; }
          body.appendChild(paragraphs(chunk.blocks));
          s.next = chunk.end;
          s.done = chunk.done || chunk.end >= chunk.total;
        } else {
          const from = Math.max(0, s.offset - STREAM_CHUNK);
          const chunk = readStreamText(s.bookId, from, from === 0, s.offset);
          if (!chunk) { s.offset = 0; return; }
          const sc = $('#reader-scroll');
          const anchor = r.paras[0];
          const before = anchor ? anchor.getBoundingClientRect().top : 0;
          const frag = paragraphs(chunk.blocks);
          if (chunk.start === 0 && !(chunk.blocks[0] && chunk.blocks[0].text.trim() === String(r.title).trim())) frag.insertBefore(titleNode(), frag.firstChild);
          body.insertBefore(frag, body.firstChild);
          s.offset = chunk.start;
          if (anchor) sc.scrollTop += anchor.getBoundingClientRect().top - before;
          lastScrollTop = sc.scrollTop;
        }
        r.paras = $$('#reader-body p[data-off]');
        watchParagraphs();
        updateReaderEnd();
      } finally {
        r.growing = false;
      }
    }, 0);
  }

  // Redraw the open text (after a display setting changed) without losing the place.
  function rerenderKeepingPlace() {
    const r = currentReader;
    if (!r) return;
    if (r.paged) { renderReaderPage(); return; }
    r.wantOffset = r.offsetNow != null ? r.offsetNow : null;
    if (r.stream) r.streamBlocks = splitBlocksFromParas(r.paras);
    renderReaderScroll();
  }

  // Streamed books keep only what is on the page; rebuild their blocks from it.
  function splitBlocksFromParas(paras) {
    return paras.map(p => ({ text: p.__text || p.textContent, off: Number(p.dataset.off) }));
  }

  function switchReaderMode(paged) {
    const r = currentReader;
    if (!r || r.paged === paged) return;
    if (paged) {
      const at = r.offsetNow != null ? r.offsetNow : 0;
      if (r.stream) {
        currentArticle.streamOffset = at;
        currentArticle.page = 0;
        r.paged = true;
        openStreamArticle(currentArticle);
        return;
      }
      r.paged = true;
      r.page = pageForOffset(at);
    } else {
      if (r.stream) {
        const b = streamBookmark();
        openStreamScroll(currentArticle, b ? b.offset : r.stream.offset);
        return;
      }
      r.paged = false;
      r.wantOffset = Math.round((r.page / Math.max(1, r.pages.length)) * r.text.length);
    }
    renderReaderCurrent();
  }

  function renderReaderPage() {
    const body = $('#reader-body');
    if (!body) return;
    const pages = currentReader.pages;
    const idx = Math.max(0, Math.min(currentReader.page, pages.length - 1));
    currentReader.page = idx;
    const blocks = pages[idx] || [''];
    body.dir = lang().dir;
    let html = idx === 0 ? `<h1>${escapeHtml(currentReader.title)}</h1>` : '';
    html += blocks.map(b => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`).join('');
    body.innerHTML = html;
    $$('#reader-body p').forEach((p, i) => { p.__text = blocks[i]; });
    $('#reader-pagebar').hidden = false;
    $('#reader-end').hidden = true;
    const stream = currentReader.stream;
    const pct = stream && stream.total ? Math.min(100, Math.round(((stream.offset + (idx / Math.max(1, pages.length)) * (stream.next - stream.offset)) / stream.total) * 100)) : null;
    $('#reader-page-count').textContent = `${fmt(idx + 1)} / ${fmt(pages.length)}`;
    setProgress(pct != null ? pct / 100 : (idx + 1) / Math.max(1, pages.length));
    $('#reader-meta').textContent = `${langName(lang())} · ${fmt(countWords(currentReader.text))} ${trWord('מילים')} · ${trWord('עמוד')} ${fmt(idx + 1)}` + (pct != null ? ` · ${pct}%` : '');
    $('#reader-pagebar').querySelector('[data-action="page-prev"]').disabled = idx <= 0 && !(stream && stream.offset > 0);
    $('#reader-pagebar').querySelector('[data-action="page-next"]').disabled = idx >= pages.length - 1 && !(stream && stream.next < stream.total);
    $('#reader-scroll').scrollTop = 0;
    body.onclick = onReaderClick;
    requestAnimationFrame(() => tokenizeReader());
    if (currentArticle) { currentArticle.page = idx; save(); }
    updateBookmarkButton();
  }

  function turnPage(delta) {
    if (aloud) stopAloud(false);
    if (!currentReader || !currentReader.paged) return;
    const stream = currentReader.stream;
    const next = currentReader.page + delta;
    if (next < 0) {
      if (stream && stream.offset > 0) loadStreamChunk(stream.prev, true);
      return;
    }
    if (next >= currentReader.pages.length) {
      if (stream && stream.next < stream.total) loadStreamChunk(stream.next, false);
      return;
    }
    currentReader.page = next;
    applyReaderSettings();
    renderReaderPage();
  }

  function pageForOffset(offset) {
    if (!currentReader || !currentReader.pages.length) return 0;
    const total = Math.max(1, (currentReader.text || '').length);
    return Math.max(0, Math.min(currentReader.pages.length - 1, Math.floor((offset / total) * currentReader.pages.length)));
  }

  function pagePreview(index) {
    const p = currentReader && currentReader.pages[index];
    return p ? p.join(' ').slice(0, 90) : '';
  }

  function flowBookmark() {
    const r = currentReader;
    if (!r || r.offsetNow == null) return null;
    const p = r.paras.find(x => Number(x.dataset.off) === r.offsetNow);
    return { offset: r.offsetNow, preview: p ? String(p.__text || p.textContent).slice(0, 80) : '' };
  }

  function streamBookmark() {
    if (!currentReader || !currentReader.stream) return null;
    if (!currentReader.paged) return flowBookmark();
    const s = currentReader.stream;
    const span = Math.max(1, s.next - s.offset);
    const frac = currentReader.pages.length > 1 ? currentReader.page / currentReader.pages.length : 0;
    return {
      offset: s.offset + Math.round(frac * span),
      page: currentReader.page,
      preview: pagePreview(currentReader.page).slice(0, 80)
    };
  }

  function bookmarkCovered(mark) {
    if (!mark || typeof mark !== 'object' || !currentReader) return false;
    if (!currentReader.paged) return Number(mark.offset) === currentReader.offsetNow;
    if (!currentReader.stream) return false;
    const s = currentReader.stream;
    return Number(mark.offset) >= s.offset && Number(mark.offset) < s.next;
  }

  function updateBookmarkButton() {
    if (!currentArticle || !currentReader) return;
    const btn = document.querySelector('[data-action="reader-bookmark"]');
    if (!btn) return;
    const marks = currentArticle.bookmarks || [];
    const marked = currentReader.stream || !currentReader.paged
      ? marks.some(bookmarkCovered)
      : marks.includes(currentReader.page);
    btn.classList.toggle('bookmark-on', marked);
    btn.setAttribute('aria-label', marked ? 'הסרת סימנייה' : 'הוספת סימנייה');
  }

  function toggleBookmark() {
    if (!currentArticle || !currentReader) return;
    const marks = Array.isArray(currentArticle.bookmarks) ? currentArticle.bookmarks : [];
    let removed = false;
    if (currentReader.stream || !currentReader.paged) {
      const i = marks.findIndex(bookmarkCovered);
      if (i >= 0) { marks.splice(i, 1); removed = true; }
      else { const b = streamBookmark() || flowBookmark(); if (b) marks.push(b); }
    } else {
      const page = currentReader.page;
      const i = marks.indexOf(page);
      if (i >= 0) { marks.splice(i, 1); removed = true; } else marks.push(page);
    }
    currentArticle.bookmarks = marks;
    save();
    updateBookmarkButton();
    toast(removed ? 'הסימנייה הוסרה' : 'הסימנייה נוספה');
    if ($('#reader-toc').classList.contains('open')) renderToc();
  }

  function openReaderToc() {
    closeReaderSettings();
    if (!currentReader) return;
    tocTab = 'contents';
    renderToc();
    $('#reader-toc').classList.add('open');
    $('#reader-toc').setAttribute('aria-hidden', 'false');
    $('#toc-backdrop').hidden = false;
  }

  function closeReaderToc() {
    $('#reader-toc').classList.remove('open');
    $('#reader-toc').setAttribute('aria-hidden', 'true');
    $('#toc-backdrop').hidden = true;
  }

  function renderToc() {
    if (!currentReader) return;
    $$('#toc-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tocTab === tocTab));
    const list = $('#toc-list');
    const stream = currentReader.stream;
    let items = [];
    let currentChapter = -1;
    if (tocTab === 'contents') {
      if (currentReader.chapters && currentReader.chapters.length) {
        if (stream) {
          for (let i = 0; i < currentReader.chapters.length; i++) {
            if (Number(currentReader.chapters[i].offset || 0) <= stream.offset) currentChapter = i;
          }
          items = currentReader.chapters.map((c, i) => ({
            offset: Number(c.offset) || 0,
            title: c.title || ('פרק ' + (i + 1)),
            sub: 'פרק ' + (i + 1) + ' · ' + Math.max(1, Math.round((Number(c.offset) || 0) / Math.max(1, stream.total) * 100)) + '%',
            current: i === currentChapter
          }));
        } else {
          items = currentReader.chapters.map((c, i) => ({
            page: pageForOffset(c.offset || 0),
            title: c.title || ('פרק ' + (i + 1)),
            sub: pagePreview(pageForOffset(c.offset || 0))
          }));
        }
      } else {
        items = currentReader.pages.map((p, i) => ({ page: i, title: 'עמוד ' + (i + 1), sub: pagePreview(i) }));
      }
    } else {
      const marks = (currentArticle && currentArticle.bookmarks) || [];
      if (stream) {
        items = marks.filter(m => m && typeof m === 'object').sort((a, b) => Number(a.offset) - Number(b.offset)).map(m => ({
          offset: Number(m.offset) || 0,
          title: 'סימנייה · ' + Math.max(1, Math.round((Number(m.offset) || 0) / Math.max(1, stream.total) * 100)) + '%',
          sub: m.preview || '',
          bookmark: true,
          bookmarkKey: 's' + (Number(m.offset) || 0),
          current: bookmarkCovered(m)
        }));
      } else {
        const total = Math.max(1, currentReader.text.length);
        items = marks.filter(m => typeof m === 'number').sort((a, b) => a - b).map(page => ({ page, title: 'עמוד ' + (page + 1), sub: pagePreview(page), bookmark: true }))
          .concat(marks.filter(m => m && typeof m === 'object').sort((a, b) => Number(a.offset) - Number(b.offset)).map(m => ({
            offset: Number(m.offset) || 0,
            title: 'סימנייה · ' + Math.max(1, Math.round((Number(m.offset) || 0) / total * 100)) + '%',
            sub: m.preview || '', bookmark: true, bookmarkKey: 's' + (Number(m.offset) || 0), current: bookmarkCovered(m)
          })));
      }
    }
    $('#toc-subtitle').textContent = tocTab === 'contents'
      ? `${currentReader.chapters.length || currentReader.pages.length} ${currentReader.chapters.length ? 'פרקים' : 'עמודים'}`
      : `${items.length} סימניות`;
    if (!items.length) {
      list.innerHTML = `<div class="toc-empty">${tocTab === 'bookmarks' ? 'אין סימניות עדיין. לחצו על סימנייה בסרגל העליון.' : 'אין תוכן זמין.'}</div>`;
      return;
    }
    list.innerHTML = items.map((it, i) => {
      const isStream = it.offset != null;
      const attr = isStream ? `data-toc-offset="${it.offset}"` : `data-toc-page="${it.page}"`;
      const current = isStream ? (it.current != null ? it.current : false) : (currentReader.paged && it.page === currentReader.page);
      const num = isStream ? (it.bookmark ? '●' : (i + 1)) : (it.page + 1);
      return `<div class="toc-row${current ? ' current' : ''}">
        <button class="toc-page" ${attr}>${num}</button>
        <button class="toc-copy" ${attr}><strong>${escapeHtml(it.title)}</strong><small>${escapeHtml(it.sub || '')}</small></button>
        ${it.bookmark ? `<button class="toc-del" data-toc-del="${it.bookmarkKey || it.page}" aria-label="מחיקת סימנייה"><svg><use href="#i-close"></use></svg></button>` : ''}
      </div>`;
    }).join('');
  }

  function jumpToStreamOffset(offset) {
    const r = currentReader;
    if (!r) return;
    closeReaderToc();
    offset = Math.max(0, Number(offset) || 0);
    if (!r.paged) {
      if (!r.stream || (offset >= r.stream.offset && offset < r.stream.next)) scrollToOffset(offset);
      else openStreamScroll(currentArticle, offset);
      return;
    }
    if (r.stream) loadStreamChunk(offset, false);
    else { r.page = pageForOffset(offset); renderReaderPage(); }
  }

  function jumpToTocPage(page) {
    const r = currentReader;
    if (!r) return;
    page = Math.max(0, Math.min(page, r.pages.length - 1));
    closeReaderToc();
    if (!r.paged) {
      const start = r.pages[page] && r.pages[page][0];
      const at = start ? r.text.indexOf(start.slice(0, 40)) : -1;
      scrollToOffset(at >= 0 ? at : Math.round(page / Math.max(1, r.pages.length) * r.text.length));
      return;
    }
    r.page = page;
    applyReaderSettings();
    renderReaderPage();
  }

  function removeBookmark(key) {
    if (!currentArticle) return;
    const marks = currentArticle.bookmarks || [];
    if (typeof key === 'string' && key.charAt(0) === 's') {
      const off = Number(key.slice(1));
      currentArticle.bookmarks = marks.filter(m => !(m && typeof m === 'object' && Number(m.offset) === off));
    } else {
      currentArticle.bookmarks = marks.filter(m => m !== Number(key));
    }
    updateBookmarkButton();
    save();
    renderToc();
    updateBookmarkButton();
  }

  function applyReaderSettings() {
    if (!currentReader) return;
    const s = state.settings;
    const paper = PAPERS[s.readerPaper] ? s.readerPaper : 'auto';
    const darkAuto = document.documentElement.dataset.theme === 'dark';
    const [bg, ink, dark] = PAPERS[paper] || (darkAuto ? ['#111614', '#f2eee4', true] : PAPERS.paper);
    const view = $('#view-reader');
    if (view) {
      view.style.setProperty('--reader-paper-bg', bg);
      view.style.setProperty('--reader-paper-ink', ink);
      view.dataset.paperTone = dark ? 'dark' : 'light';
    }
    try { if (N.setTheme) N.setTheme(dark); } catch (e) { }
    const body = $('#reader-body');
    if (body) body.dataset.font = s.readerFont || 'sans';
    const line = LINE_HEIGHTS[s.readerLine] ? s.readerLine : 'normal';
    document.documentElement.style.setProperty('--reader-lh', String(LINE_HEIGHTS[line]));
    $$('#line-seg button').forEach(b => b.classList.toggle('active', b.dataset.line === line));
    $('#pinyin-row').hidden = lang().id !== 'zh';
    $('#pinyin-switch').classList.toggle('on', !!s.readerPinyin);
    $('#pinyin-switch').setAttribute('aria-checked', s.readerPinyin ? 'true' : 'false');
    document.documentElement.style.setProperty('--reader-font', (s.fontSize || 19) + 'px');
    $('#rs-font-size').textContent = s.fontSize || 19;
    $$('#font-seg button').forEach(b => b.classList.toggle('active', b.dataset.font === (s.readerFont || 'sans')));
    $$('#paper-swatches button').forEach(b => b.classList.toggle('active', b.dataset.paper === paper));
    $('#paged-switch').classList.toggle('on', s.readerPaged !== false);
    $('#paged-switch').setAttribute('aria-checked', s.readerPaged !== false ? 'true' : 'false');
    if (currentReader.paged !== (s.readerPaged !== false)) switchReaderMode(s.readerPaged !== false);
  }

  function openReaderSettings() {
    if (!currentReader) return;
    applyReaderSettings();
    $('#reader-settings').classList.add('open');
    $('#reader-settings').setAttribute('aria-hidden', 'false');
    $('#reader-settings-backdrop').hidden = false;
  }

  // Drag a bottom sheet down to close it (from its handle, or anywhere once
  // its content is scrolled to the top).
  function swipeToClose(sheet, close) {
    let startY = 0, dy = 0, dragging = false;
    sheet.addEventListener('touchstart', e => {
      if (e.touches.length !== 1 || (sheet.scrollTop > 0 && !e.target.closest('.sheet-grab'))) return;
      startY = e.touches[0].clientY;
      dy = 0;
      dragging = true;
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (!dragging) return;
      dy = e.touches[0].clientY - startY;
      if (dy <= 0) return;
      sheet.style.transition = 'none';
      sheet.style.transform = `translate(-50%, ${dy}px)`;
    }, { passive: true });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (dy > 80) close();
    };
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
  }

  function closeReaderSettings() {
    $('#reader-settings').classList.remove('open');
    $('#reader-settings').setAttribute('aria-hidden', 'true');
    $('#reader-settings-backdrop').hidden = true;
  }

  function applyTtsRate() {
    try { if (typeof N.setTtsRate === 'function') N.setTtsRate(state.settings.ttsRate || 1); } catch (e) { }
  }

  function clearAloudMark() {
    $$('#reader-body p.aloud').forEach(p => p.classList.remove('aloud'));
  }

  const paraText = p => p.__text || p.textContent || '';

  function stopAloud(announce) {
    const was = !!aloud;
    aloud = null;
    aloudToken++;
    clearAloudMark();
    try { N.stopSpeak(); } catch (e) { }
    if (announce && was) toast('ההקראה נעצרה');
  }

  // Paragraph elements to read aloud: the page, or from the top of the screen on.
  function pageBlocks() {
    const r = currentReader;
    if (!r) return [];
    if (r.paged) return $$('#reader-body p');
    const pos = scrollPosition();
    return r.paras.slice(pos ? pos.index : 0, (pos ? pos.index : 0) + 60);
  }

  function beginAloud() {
    const blocks = pageBlocks();
    const plan = [];
    blocks.forEach(el => {
      for (const text of window.NerReview.splitSentences(paraText(el))) plan.push({ text, el });
    });
    if (!plan.length) { toast('אין מה להקריא'); return; }
    aloud = { plan, i: 0 };
    speakAloudIndex();
  }

  function markAloud(p) {
    $$('#reader-body p.aloud').forEach(x => { if (x !== p) x.classList.remove('aloud'); });
    if (!p || !p.isConnected) return;
    p.classList.add('aloud');
    if (p.scrollIntoView) p.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function speakAloudIndex() {
    if (!aloud) return;
    const item = aloud.plan[aloud.i];
    if (!item) { stopAloud(false); return; }
    const token = ++aloudToken;
    aloud.token = token;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!aloud || aloud.token !== token) return;
      markAloud(item.el);
    }));
    try {
      if (typeof N.speakAs === 'function') N.speakAs(item.text, lang().id, 'read' + token);
      else N.speak(item.text, lang().id);
    } catch (e) { stopAloud(false); }
  }

  function onSpeakDone(id) {
    if (!aloud || id !== 'read' + aloud.token) return;
    aloud.i++;
    if (aloud.i < aloud.plan.length) speakAloudIndex();
    else stopAloud(false);
  }

  function onSpeakStop(id) {
    if (!aloud || id !== 'read' + aloud.token) return;
    aloud = null;
    clearAloudMark();
  }

  function onSpeakFail() {
    if (!aloud) return;
    stopAloud(false);
  }

  function readCurrentPageAloud() {
    if (!currentReader) return;
    if (aloud) { stopAloud(true); return; }
    if (typeof N.speakAs !== 'function' || !window.NerReview) {
      const text = pageBlocks().map(paraText).join(' ');
      if (text) N.speak(text, lang().id);
      return;
    }
    applyTtsRate();
    beginAloud();
  }

  // Thai uses the WebView's ICU word breaks, which carry a full Thai dictionary.
  const DICT_SEG_LANGS = new Set(['zh', 'yue', 'ja', 'ko']);
  function scriptRunRe(langId) {
    if (langId === 'th') return /[\u0e00-\u0e7f]+/g;
    if (langId === 'ko') return /[\uac00-\ud7af]+/g;
    if (langId === 'ja') return /[\u3040-\u30ff\u3400-\u9fff]+/g;
    if (langId === 'zh' || langId === 'yue') return /[\u3400-\u9fff]+/g;
    return null;
  }
  function nativeSegments(text, langId) {
    if (!DICT_SEG_LANGS.has(langId) || typeof N.segment !== 'function') return null;
    const re = scriptRunRe(langId);
    if (!re || !re.test(text)) return null;
    re.lastIndex = 0;
    const out = [];
    let last = 0;
    let m;
    const rx = scriptRunRe(langId);
    while ((m = rx.exec(text)) !== null) {
      if (m.index > last) out.push(text.slice(last, m.index));
      try {
        const arr = JSON.parse(N.segment(langId, m[0]));
        if (Array.isArray(arr) && arr.join('') === m[0]) out.push(...arr);
        else for (const ch of m[0]) out.push(ch);
      } catch (e) {
        for (const ch of m[0]) out.push(ch);
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out.length ? out : null;
  }

  function hanReading(text) {
    if (!text || lang().id !== 'zh' || !window.NerPinyin) return '';
    return window.NerPinyin.phrase(text) || '';
  }

  function makeWordSpan(raw) {
    const span = document.createElement('span');
    span.className = 'ner-w';
    span.textContent = raw;
    span.dataset.raw = raw;
    const py = state.settings.readerPinyin ? hanReading(raw) : '';
    if (py) {
      span.classList.add('has-py');
      const pyEl = document.createElement('span');
      pyEl.className = 'py';
      pyEl.textContent = py;
      span.insertBefore(pyEl, span.firstChild);
    }
    const w = wordFor(raw);
    if (w) {
      span.dataset.key = w.key || '';
      span.dataset.grade = String(w.grade);
      span.classList.add(gradeClass(w.grade));
    } else {
      span.dataset.key = '';
      span.dataset.grade = '0';
      span.classList.add('g-new');
    }
    return span;
  }

  // Paged mode: the whole page at once; paragraphs are counted as they are read.
  function tokenizeReader() {
    const body = $('#reader-body');
    if (!body || !currentReader) return;
    rebuildIndex();
    tokenizeNode(body);
    currentReader.paras = $$('#reader-body p');
    currentReader.paras.forEach(p => { p.__watched = true; });
    setupReaderObservers();
    if (readObserver) currentReader.paras.forEach(p => readObserver.observe(p));
  }

  let segmenterCache = null;
  function wordSegmenter(id) {
    if (segmenterCache && segmenterCache.id === id) return segmenterCache.seg;
    let seg = null;
    try { seg = new Intl.Segmenter(id, { granularity: 'word' }); } catch (e) { seg = null; }
    segmenterCache = { id, seg };
    return seg;
  }

  // French/Italian elision: l'homme → l' + homme, so each half can be looked up.
  const ELIDED = /^(jusqu|lorsqu|puisqu|quoiqu|qu|dell|all|dall|nell|sull|l|d|j|n|s|c|m|t|un)['’](?=[\p{L}])/iu;

  function tokenizeNode(root) {
    const body = $('#reader-body');
    if (!body || !root || !root.isConnected) return;
    const l = lang();
    body.dataset.cjk = ['zh', 'yue', 'ja', 'th'].includes(l.id) ? 'true' : 'false';
    body.dataset.py = l.id === 'zh' && state.settings.readerPinyin ? 'on' : 'off';
    body.dataset.lang = l.id;
    const segmenter = wordSegmenter(l.id);
    const elide = l.id === 'fr' || l.id === 'it';
    const addWord = (frag, token) => {
      const m = elide ? token.match(ELIDED) : null;
      if (m && m[0].length < token.length) {
        frag.appendChild(makeWordSpan(m[0]));
        frag.appendChild(makeWordSpan(token.slice(m[0].length)));
      } else {
        frag.appendChild(makeWordSpan(token));
      }
    };

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('script,style,noscript,textarea,input,select,code,pre,svg,math,.ner-w,[contenteditable]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let words = 0;
    for (const node of nodes) {
      if (words > 30000) break;
      const text = node.nodeValue;
      if (!text) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      const native = nativeSegments(text, l.id);
      if (native) {
        for (const token of native) {
          if (!token) continue;
          if (/[\p{L}\p{M}]/u.test(token)) {
            addWord(frag, token);
            words++;
          } else if (/^[\p{Pe}\p{Pf}\p{Po}]+$/u.test(token) && frag.lastChild && frag.lastChild.classList && frag.lastChild.classList.contains('ner-w')) {
            // ，。」 never start a line: keep them with the word before.
            const keep = document.createElement('span');
            keep.className = 'nb';
            keep.appendChild(frag.lastChild);
            keep.appendChild(document.createTextNode(token));
            frag.appendChild(keep);
          } else {
            frag.appendChild(document.createTextNode(token));
          }
        }
        node.parentNode.replaceChild(frag, node);
        continue;
      }
      if (segmenter) {
        for (const part of segmenter.segment(text)) {
          if (!part.isWordLike) continue;
          if (part.index > last) frag.appendChild(document.createTextNode(text.slice(last, part.index)));
          addWord(frag, part.segment);
          last = part.index + part.segment.length;
          words++;
        }
      } else {
        const re = /[\p{L}\p{M}]+(?:['’׳״-][\p{L}\p{M}]+)*/gu;
        let m;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          addWord(frag, m[0]);
          last = m.index + m[0].length;
          words++;
        }
      }
      if (last === 0) continue;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  function onReaderClick(e) {
    const span = e.target.closest('.ner-w');
    if (!span) return;
    e.preventDefault();
    e.stopPropagation();
    openWord(span.dataset.raw, span, true);
  }

  function flushRead() {
    if (!pendingRead) return;
    const n = pendingRead;
    pendingRead = 0;
    const key = todayKey();
    if (!state.stats[key]) state.stats[key] = { read: 0, listened: 0, added: 0 };
    state.stats[key].read = (state.stats[key].read || 0) + n;
    save();
    try { N.addRead(n); } catch (e) { }
    const el = $('#today-read');
    if (el) el.textContent = fmt(dayStats().read || 0);
  }

  /* ---------------- word sheet ---------------- */

  function applyTranslatedMeaning(lookup, w, text) {
    if (!text) return;
    text = text.split(/\s*,\s*/).filter((v, i, a) => v && a.indexOf(v) === i).join(', ');
    lookup.meaning = text;
    lookup.meaningLang = state.settings.baseLang;
    if (w) { w.meaning = text; w.meaningBase = state.settings.baseLang; save(); }
    if (currentWord && (currentWord.lookup === lookup || currentWord.phrase === lookup)) showWordSheet();
  }

  function localizeLookup(lookup, w) {
    if (!lookup || !lookup.found) return;
    const target = state.settings.baseLang || 'en';
    if (target === 'en') return;
    if (target === 'he' && Array.isArray(lookup.he) && lookup.he.length) {
      applyTranslatedMeaning(lookup, w, lookup.he[0]);
      return;
    }
    if (lookup.meaningLang === target && lookup.meaning) return;
    const source = (lookup.meaningLang === 'en' && lookup.meaning)
      ? lookup.meaning
      : (Array.isArray(lookup.glosses) && lookup.glosses[0]) || lookup.meaning || '';
    if (!source) return;
    const key = target + '|' + source;
    if (state.translations && state.translations[key]) {
      applyTranslatedMeaning(lookup, w, state.translations[key]);
      return;
    }
    const rid = 'tr' + (++translationRid);
    pendingTranslations.set(rid, { lookup, w });
    try { N.translate(source, target, rid); } catch (e) { }
  }

  // Neither dictionary knows the word: machine-translate the word itself.
  function translateWord(raw, lookup, w) {
    if (typeof N.translateFrom !== 'function') return;
    const target = state.settings.baseLang || 'en';
    const rid = 'tw' + (++translationRid);
    lookup.pending = true;
    lookup.glosses = [raw];
    lookup.meaningLang = lang().id;
    pendingTranslations.set(rid, { lookup, w, word: true });
    try { N.translateFrom(raw, lang().id, target, rid); } catch (e) { }
    showWordSheet();
  }

  function onTranslateResult(rid, json) {
    const pending = pendingTranslations.get(rid);
    if (!pending) return;
    pendingTranslations.delete(rid);
    let data;
    try { data = JSON.parse(json); } catch (e) { data = null; }
    if (pending.word) {
      delete pending.lookup.pending;
      if (data && data.ok && data.text && data.text.toLowerCase() !== String(pending.lookup.glosses[0]).toLowerCase()) {
        pending.lookup.found = true;
        pending.lookup.source = 'Google Translate';
        applyTranslatedMeaning(pending.lookup, pending.w, data.text);
      } else if (currentWord && currentWord.lookup === pending.lookup) {
        showWordSheet();
      }
      return;
    }
    if (!data || !data.ok || !data.text) return;
    if (!state.translations) state.translations = {};
    const source = (pending.lookup.meaningLang === 'en' && pending.lookup.meaning)
      ? pending.lookup.meaning
      : (Array.isArray(pending.lookup.glosses) && pending.lookup.glosses[0]) || pending.lookup.meaning || '';
    if (source) state.translations[state.settings.baseLang + '|' + source] = data.text;
    const keys = Object.keys(state.translations);
    if (keys.length > 1200) for (const k of keys.slice(0, 200)) delete state.translations[k];
    applyTranslatedMeaning(pending.lookup, pending.w, data.text);
    save();
  }

  async function onlineLookup(raw) {
    if (lang().id === 'he') return null;
    try {
      const url = 'https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(raw);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      const keys = Object.keys(data || {});
      if (!keys.length) return null;
      let block = data[lang().id];
      if (!block) block = data[keys[0]];
      if (!Array.isArray(block) || !block.length) return null;
      const defs = [];
      for (const b of block) {
        for (const d of (b.definitions || [])) {
          const text = String(d.definition || '').replace(/<[^>]+>/g, '').trim();
          if (text) defs.push(text);
        }
      }
      if (!defs.length) return null;
      return { found: true, key: raw, display: raw, tr: '', pos: block[0].partOfSpeech || '', glosses: defs.slice(0, 4), he: [], meaning: defs[0], meaningLang: 'en', rank: 0, source: 'Wiktionary (online)' };
    } catch (e) { return null; }
  }

  // The paragraph's text as written (without pinyin) and where the span starts in it.
  function spanContext(span) {
    const block = span && (span.closest('p,li,blockquote,h1,h2') || span.parentElement);
    if (!block) return null;
    let text = '', offset = -1;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.parentElement && n.parentElement.closest('.py')) continue;
      if (offset < 0 && span.contains(n)) offset = text.length;
      text += n.nodeValue;
    }
    return { text, offset: Math.max(0, offset) };
  }

  function phraseLookup(phrase) {
    if (!phrase || !phrase.found) return null;
    const g = Array.isArray(phrase.g) ? phrase.g : [];
    return {
      found: true, key: phrase.key, display: phrase.w, tr: phrase.tr || '', pos: phrase.kind || 'phrase',
      glosses: g, he: [], meaning: g[0] || '', meaningLang: 'en', rank: 0, kind: phrase.kind || 'phrase'
    };
  }

  async function openWord(raw, span, autoLearn) {
    let lookup;
    const ctx = span ? spanContext(span) : null;
    try {
      lookup = JSON.parse(ctx && typeof N.lookupAt === 'function'
        ? N.lookupAt(lang().id, raw, ctx.text, ctx.offset)
        : N.lookup(lang().id, raw));
    } catch (e) { lookup = { found: false, word: raw }; }
    // Not in the offline pack: open the card now and fill it in from the
    // online dictionary when (if) it answers.
    const online = !lookup.found && lang().id !== 'he';
    if (online) lookup.pending = true;
    const norm = normalizeWord(raw);
    let key = lookup && lookup.found ? lookup.key : norm;
    let w = lookup && lookup.found ? state.words[lang().id + ':' + key] : null;
    if (!w) w = wordFor(raw);
    if (lookup && lookup.found && w && w.key !== key) {
      // A word saved before its pack arrived can be keyed by the surface form.
      // The pack's lemma is authoritative; replace the stale entry.
      delete state.words[lang().id + ':' + w.key];
      w = null;
    }

    if (!w) {
      w = {
        lang: lang().id, key, form: raw, display: (lookup && lookup.display) || raw,
        tr: hanReading(raw) || (lang().id === 'zh' ? '' : ((lookup && lookup.tr) || '')), pos: (lookup && lookup.pos) || '',
        meaning: (lookup && lookup.meaning) || '', grade: 1,
        added: Date.now(), lastSeen: Date.now(), seen: 1
      };
      state.words[lang().id + ':' + key] = w;
      schedule(w, 1);
    } else if (autoLearn) {
      w.lastSeen = Date.now();
      w.seen = (w.seen || 0) + 1;
      if ((w.grade || 0) === 0) schedule(w, 1);
      if (!w.meaning && lookup && lookup.meaning) w.meaning = lookup.meaning;
      if (!w.tr) {
        const py = hanReading(raw);
        if (py) w.tr = py;
        else if (lang().id !== 'zh' && lookup && lookup.tr) w.tr = lookup.tr;
      }
    }
    rebuildIndex();
    save();
    let context = w.context || '';
    if (ctx && ctx.text) {
      const t = ctx.text.replace(/\s+/g, ' ').trim();
      if (t) context = t.slice(0, 500);
    }
    if (context && !w.context) { w.context = context; save(); }
    const phrase = lookup && lookup.phrase && lookup.phrase.key !== lookup.key ? phraseLookup(lookup.phrase) : null;
    $$('#reader-body .ner-w.active').forEach(x => x.classList.remove('active'));
    if (span) span.classList.add('active');
    currentWord = { w, raw, lookup, span, context, phrase };
    currentLookup = lookup;
    showWordSheet();
    localizeLookup(lookup, w);
    if (phrase) localizeLookup(phrase, null);
    if (online) {
      const remote = await Promise.race([onlineLookup(raw), new Promise(r => setTimeout(() => r(null), 7000))]);
      delete lookup.pending;
      if (remote) {
        Object.assign(lookup, remote, { phrase: lookup.phrase });
        if (!w.meaning) w.meaning = remote.meaning;
        if (!w.pos && remote.pos) w.pos = remote.pos;
        save();
      }
      if (currentWord && currentWord.lookup === lookup) {
        showWordSheet();
        if (remote) localizeLookup(lookup, w);
        else translateWord(raw, lookup, w);
      }
    }
    updateSpanForWord(w, raw);
  }

  function openPhrase() {
    if (!currentWord || !currentWord.phrase) return;
    const ph = currentWord.phrase;
    const id = lang().id + ':' + ph.key;
    let w = state.words[id];
    if (!w) {
      w = {
        lang: lang().id, key: ph.key, form: ph.display, display: ph.display, tr: ph.tr || '', pos: ph.kind,
        meaning: ph.meaningLang === state.settings.baseLang ? ph.meaning : (ph.meaning || ''),
        meaningBase: ph.meaningLang, grade: 1, added: Date.now(), lastSeen: Date.now(), seen: 1,
        context: currentWord.context || ''
      };
      state.words[id] = w;
      schedule(w, 1);
      rebuildIndex();
      save();
    }
    currentWord = { w, raw: ph.display, lookup: ph, span: null, context: currentWord.context, phrase: null };
    currentLookup = ph;
    showWordSheet();
    localizeLookup(ph, w);
  }

  function openSavedWord(id) {
    const w = state.words[id];
    if (!w) return;
    const lookup = {
      found: true, key: w.key, display: w.display || w.form || w.key, tr: w.tr || '',
      pos: w.pos || '', meaning: w.meaning || '', glosses: w.meaning ? [w.meaning] : [], rank: 0
    };
    currentWord = { w, raw: w.form || w.key, lookup, span: null, context: w.context || '' };
    currentLookup = lookup;
    showWordSheet();
    localizeLookup(lookup, w);
  }

  function showWordSheet() {
    if (!currentWord) return;
    const { w, raw, lookup } = currentWord;
    const display = (lookup && lookup.display) || w.display || raw;
    const bits = [];
    if (display && display !== raw) bits.push(display);
    const reading = hanReading(raw) || (lang().id === 'zh' ? '' : (w.tr || (lookup && lookup.tr) || ''));
    if (reading) bits.push(reading);
    const pos = posLabel(w.pos || (lookup && lookup.pos));
    if (pos) bits.push(pos);
    $('#sheet-word').textContent = raw;
    $('#sheet-word').classList.toggle('long', String(raw).length > 14);
    $('#sheet-meta').textContent = bits.join(' · ') || 'מילה';
    const ph = currentWord.phrase;
    $('#sheet-phrase').hidden = !ph;
    if (ph) {
      $('#sheet-phrase-kind').textContent = posLabel(ph.kind || 'phrase');
      $('#sheet-phrase-text').textContent = ph.display;
      $('#sheet-phrase-meaning').textContent = ph.meaning || '';
      // Idiom glosses translate poorly, so the English original stays in view.
      const g0 = (ph.glosses && ph.glosses[0]) || '';
      $('#sheet-phrase-gloss').textContent = ph.meaningLang !== 'en' && g0 && g0 !== ph.meaning ? g0 : '';
    }
    const meaning = w.meaning || (lookup && lookup.meaning) || '';
    $('#sheet-meaning').textContent = meaning || (lookup && lookup.pending ? tr('מחפש…') : tr('לא נמצאה משמעות. אפשר לפתוח תרגום אונליין.'));
    const he = lookup && Array.isArray(lookup.he) ? lookup.he.slice(1, 4).filter(g => g && g !== meaning) : [];
    const en = lookup && Array.isArray(lookup.glosses) ? lookup.glosses.slice(0, 3).filter(g => g && g !== meaning) : [];
    $('#sheet-glosses').innerHTML = he.map(g => `<span class="he-gloss">${escapeHtml(g)}</span>`).join('') +
      (en.length ? `<span class="en-label">${escapeHtml(langName(BY_LANG.en))}</span>` + en.map(g => `<span class="en-gloss">${escapeHtml(g)}</span>`).join('') : '');
    $('#sheet-rank').textContent = lookup && lookup.found
      ? (lookup.rank ? '#' + fmt(lookup.rank) + ' ' + tr('בשכיחות') : (/wiktionary|google/i.test(lookup.source || '') ? lookup.source.replace(/\s*\(online\)/i, '') : tr('מילון מקומי')))
      : 'לא נמצא במילון';
    const ctx = w.context || (currentWord && currentWord.context) || '';
    $('#sheet-context').hidden = !ctx;
    $('#sheet-context').textContent = ctx ? (activeUiLang() === 'he' ? '״' + ctx + '״' : '“' + ctx + '”') : '';
    $('#sheet-context').dir = lang().dir;
    $$('#grade-grid button').forEach(b => b.classList.toggle('active', Number(b.dataset.grade) === Number(w.grade)));
    const tl = lang().id === 'he' ? 'en' : 'he';
    $('#sheet-translate').dataset.url = `https://translate.google.com/?sl=${encodeURIComponent(lang().id)}&tl=${tl}&text=${encodeURIComponent(raw)}&op=translate`;
    $('#sheet-translate').style.display = '';
    $('#sheet-backdrop').hidden = false;
    $('#word-sheet').classList.add('open');
    $('#word-sheet').setAttribute('aria-hidden', 'false');
    document.body.classList.add('sheet-open');
  }

  function closeSheet() {
    $$('#reader-body .ner-w.active').forEach(x => x.classList.remove('active'));
    $('#word-sheet').classList.remove('open');
    $('#word-sheet').setAttribute('aria-hidden', 'true');
    $('#sheet-backdrop').hidden = true;
    document.body.classList.remove('sheet-open');
    currentWord = null;
    currentLookup = null;
    renderHome();
    renderRead();
    if (currentView === 'words') renderWords();
    if (currentView === 'progress') renderProgress();
  }

  function updateSpanForWord(w, raw) {
    const norm = normalizeWord(raw);
    for (const span of $$('#reader-body .ner-w')) {
      if (span.dataset.raw === raw || normalizeWord(span.dataset.raw) === norm || (w.key && span.dataset.key === w.key)) {
        span.dataset.key = w.key || '';
        span.dataset.grade = String(w.grade);
        span.className = 'ner-w ' + gradeClass(w.grade);
      }
    }
  }

  function openEditWord() {
    if (!currentWord) return;
    $('#edit-meaning').value = currentWord.w.meaning || '';
    $('#edit-context').value = currentWord.w.context || currentWord.context || '';
    showModal('edit-word');
    setTimeout(() => $('#edit-meaning').focus(), 150);
  }

  function saveEditWord() {
    if (!currentWord) return;
    const meaning = $('#edit-meaning').value.trim();
    const context = $('#edit-context').value.trim();
    currentWord.w.meaning = meaning;
    currentWord.w.context = context;
    if (currentWord.lookup) currentWord.lookup.meaning = meaning;
    currentWord.context = context;
    save();
    hideModal('edit-word');
    showWordSheet();
    renderWords();
    toast('המילה נשמרה');
  }

  function buildAnkiTsv() {
    const l = lang();
    const words = Object.values(state.words)
      .filter(w => w.lang === l.id && w.grade !== -1)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    if (!words.length) return '';
    const clean = s => String(s || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');
    const rows = ['#separator:tab', '#html:true', '#columns:Word\tReading\tMeaning\tContext\tLanguage'];
    for (const w of words) {
      rows.push([clean(w.form || w.display || w.key), clean(w.tr), clean(w.meaning), clean(w.context), clean(l.en)].join('\t'));
    }
    return rows.join('\n') + '\n';
  }

  function exportAnki() {
    const tsv = buildAnkiTsv();
    if (!tsv) { toast('אין מילים לייצוא'); return; }
    try { N.exportAnki(tsv); toast('בוחרים היכן לשמור את קובץ Anki'); }
    catch (e) { toast('הייצוא נכשל'); }
  }

  function gradeWord(grade) {
    if (!currentWord) return;
    const { w, raw } = currentWord;
    schedule(w, grade);
    save();
    updateSpanForWord(w, raw);
    showWordSheet();
    if (grade === 5 || grade === -1) {
      setTimeout(closeSheet, 260);
    } else {
      setTimeout(closeSheet, 320);
    }
  }

  function capArticles(list) {
    const books = [];
    const rest = [];
    for (const a of list) {
      if (a && a.kind === 'book') books.push(a);
      else rest.push(a);
    }
    return books.concat(rest.slice(0, 40));
  }

  function dueWords(now = Date.now()) {
    if (!window.NerReview) return [];
    const id = lang().id;
    return Object.values(state.words)
      .filter(w => window.NerReview.isDue(w, id, now))
      .sort((a, b) => (a.due || 0) - (b.due || 0));
  }

  function schedule(word, grade) {
    if (!word) return;
    if (window.NerReview) window.NerReview.scheduleGrade(word, grade, Date.now());
    else { word.grade = grade; word.lastSeen = Date.now(); }
  }

  function nextDueAt() {
    const id = lang().id;
    const now = Date.now();
    let best = 0;
    for (const w of Object.values(state.words)) {
      if (!w || w.seed || w.lang !== id) continue;
      const g = Number(w.grade);
      if (!(g >= 1 && g <= 4) || !w.due || w.due <= now) continue;
      if (!best || w.due < best) best = w.due;
    }
    return best;
  }

  function practiceWords() {
    const id = lang().id;
    const now = Date.now();
    return Object.values(state.words).filter(w => {
      if (!w || w.seed || w.lang !== id) return false;
      const g = Number(w.grade);
      return g >= 1 && g <= 4 && w.due && w.due > now;
    }).sort((a, b) => a.due - b.due);
  }

  function openReview(early) {
    const due = dueWords();
    const pool = due.length ? due : (early ? practiceWords().slice(0, 5) : []);
    reviewQueue = pool.slice(0, 20).map(w => w.lang + ':' + w.key);
    reviewIndex = 0;
    reviewAgain = new Set();
    reviewRevealed = false;
    navigate('review');
    renderReview();
  }

  function renderReview() {
    const host = $('#review-stage');
    const prog = $('#review-progress');
    if (!host) return;
    if (!reviewQueue.length) {
      if (prog) prog.textContent = '0';
      const early = practiceWords().length
        ? '<button class="primary" data-action="practice-early" type="button">תרגול מוקדם</button>'
        : '<button class="primary" data-go="read" type="button">חזרה לקריאה</button>';
      host.innerHTML = '<div class="review-empty"><h2>אין מילים שמחכות לחזרה</h2><p>1 חוזרת אחרי עשר דקות. 2 אחרי יום. 3 אחרי שלושה ימים. 4 אחרי שבוע. K ידועה, ו-X לא חוזרת.</p>' + early + '</div>';
      return;
    }
    if (reviewIndex >= reviewQueue.length) {
      if (prog) prog.textContent = fmt(reviewQueue.length);
      host.innerHTML = `<div class="review-empty"><h2>הסתיימה החזרה</h2><p>${escapeHtml(tf('reviewDone', { n: fmt(reviewQueue.length) }))}</p><button class="primary" data-action="open-review" type="button">עוד סבב</button><button class="ghost" data-go="home" type="button">לדף הבית</button></div>`;
      return;
    }
    const id = reviewQueue[reviewIndex];
    const w = state.words[id];
    if (!w) { reviewIndex++; reviewRevealed = false; renderReview(); return; }
    if (prog) prog.textContent = fmt(reviewIndex + 1) + ' מתוך ' + fmt(reviewQueue.length);
    const meaning = w.meaning || 'אין משמעות.';
    host.innerHTML = `<div class="review-word" dir="${lang().dir}">${escapeHtml(w.form || w.display || w.key)}</div>` +
      ((hanReading(w.form || w.display || w.key) || (w.lang === 'zh' ? '' : w.tr)) ? `<div class="review-tr">${escapeHtml(hanReading(w.form || w.display || w.key) || w.tr)}</div>` : '') +
      (w.context ? `<p class="review-context">״${escapeHtml(w.context)}״</p>` : '') +
      '<p class="review-hint">דרגו מהזיכרון, או הציגו את המשמעות.</p>' +
      `<p class="review-meaning"${reviewRevealed ? '' : ' hidden'}>${escapeHtml(meaning)}</p>` +
      `<button class="ghost review-reveal" data-action="review-reveal" type="button">${reviewRevealed ? 'הסתירו משמעות' : 'הציגו משמעות'}</button>` +
      '<div class="grade-grid" id="review-grades">' +
      '<button type="button" data-grade="1"><b>1</b><small>לא מכיר</small></button>' +
      '<button type="button" data-grade="2"><b>2</b><small>מזהה</small></button>' +
      '<button type="button" data-grade="3"><b>3</b><small>מבין</small></button>' +
      '<button type="button" data-grade="4"><b>4</b><small>כמעט</small></button>' +
      '<button type="button" data-grade="5" class="known-btn"><b>K</b><small>ידוע</small></button>' +
      '<button type="button" data-grade="-1" class="ignore-btn"><b>X</b><small>דלג</small></button>' +
      '</div>';
  }

  function reviewGrade(grade) {
    const id = reviewQueue[reviewIndex];
    const w = id && state.words[id];
    if (!w) { reviewIndex++; reviewRevealed = false; renderReview(); return; }
    schedule(w, grade);
    save();
    if (grade === 1 && !reviewAgain.has(id)) {
      reviewAgain.add(id);
      reviewQueue.push(id);
    }
    reviewIndex++;
    reviewRevealed = false;
    renderReview();
    renderHome();
  }

  /* ---------------- articles ---------------- */

  function addArticle(article) {
    const existing = state.articles.findIndex(a => a.id === article.id);
    if (existing >= 0) state.articles[existing] = merge(state.articles[existing], article);
    else state.articles.unshift(article);
    state.articles = capArticles(state.articles);
    save();
  }

  function createTextArticle(title, text, kind = 'text', chapters = []) {
    text = String(text || '').trim();
    if (text.length < 10) { toast('הטקסט קצר מדי'); return; }
    const cleanTitle = String(title || '').trim() || text.split('\n')[0].slice(0, 70) || 'טקסט';
    const article = {
      id: 'text-' + Date.now(), title: cleanTitle, text, lang: lang().id,
      kind, chapters, added: Date.now(), lastOpened: Date.now()
    };
    addArticle(article);
    hideModal('paste');
    openReaderText(cleanTitle, text, article);
    return article;
  }

  function openArticle(id) {
    const article = state.articles.find(a => a.id === id);
    if (!article) return;
    article.lastOpened = Date.now();
    save();
    if (article.stream && article.bookId) {
      openStreamArticle(article);
    } else if (article.text) {
      openReaderText(article.title, article.text, article);
    } else if (article.url) {
      if (article.kind === 'watch') N.openWatch(article.url);
      else N.openUrl(article.url);
    }
  }

  function openUrlFromInput() {
    let raw = $('#url-input').value.trim();
    if (!raw) { toast('הדביקו קישור קודם'); return; }
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    let u;
    try { u = new URL(raw); } catch (e) { toast('הקישור לא תקין'); return; }
    if (!/^https?:$/.test(u.protocol)) { toast('רק קישורי http או https'); return; }
    const article = {
      id: 'web-' + Date.now(), title: u.hostname.replace(/^www\./, ''), url: u.href,
      lang: lang().id, kind: 'web', added: Date.now(), lastOpened: Date.now()
    };
    addArticle(article);
    $('#url-input').value = '';
    try { N.openUrl(u.href); } catch (e) { toast('לא ניתן לפתוח את הקישור'); }
  }

  function sampleForLang(id) {
    const pages = {
      en: { title: "A rainy day", text: "It was raining cats and dogs, so I stayed in and read a book. A new word is not a wall. It is a door. Tap a word you do not know and give it a grade; the word comes back later.\n\nYou do not need to understand everything at once. Rome wasn't built in a day." },
      hu: { title: "Egy esős nap", text: "Tegnap úgy esett, mintha dézsából öntötték volna, ezért otthon maradtam olvasni. Egy új szó nem fal. Ajtó. Koppints egy ismeretlen szóra, és adj neki egy jegyet.\n\nNem kell mindent egyszerre értened. Gyakorlat teszi a mestert." },
      es: { title: "Un día de lluvia", text: "Ayer llovía a cántaros y me quedé en casa leyendo. Una palabra nueva no es un muro. Es una puerta. Toca una palabra que no conoces y ponle una nota.\n\nNo hace falta entenderlo todo de golpe. Poco a poco se va lejos." },
      fr: { title: "Un jour de pluie", text: "Ce matin, il pleuvait des cordes et mon ami m’a posé un lapin. Je suis donc resté chez moi avec un livre. Un mot nouveau n’est pas un mur. C’est une porte.\n\nTouchez un mot inconnu et donnez-lui une note. Vous n’avez pas besoin de tout comprendre tout de suite. Petit à petit, l’oiseau fait son nid." },
      de: { title: "Ein Regentag", text: "Gestern regnete es in Strömen, also blieb ich zu Hause und las. Ein neues Wort ist keine Mauer. Es ist eine Tür. Tippe ein Wort an, das du nicht kennst, und gib ihm eine Note.\n\nDu musst nicht alles sofort verstehen. Übung macht den Meister." },
      it: { title: "Un giorno di pioggia", text: "Ieri pioveva a catinelle e sono rimasto a casa a leggere. Una parola nuova non è un muro. È una porta. Tocca una parola che non conosci e dalle un voto.\n\nNon serve capire tutto subito. Piano piano si va lontano." },
      pt: { title: "Um dia de chuva", text: "Ontem chovia a cântaros e fiquei em casa a ler. Uma palavra nova não é um muro. É uma porta. Toque numa palavra que não conhece e dê-lhe uma nota.\n\nNão é preciso entender tudo de uma vez. Devagar se vai ao longe." },
      ru: { title: "Дождливый день", text: "Вчера дождь лил как из ведра, и я остался дома с книгой. Новое слово — не стена. Это дверь. Нажмите незнакомое слово и поставьте оценку.\n\nНе нужно понимать всё сразу. Повторение — мать учения." },
      ar: { title: "صفحة قصيرة", text: "الكلمة الجديدة ليست جدارًا. إنها باب. اقرأ مرة، واضغط كلمة لا تعرفها، وأعطها درجة. ثم غادر الصفحة. ستعود الكلمة لاحقًا.\n\nلا تحتاج أن تفهم كل شيء. فقط الكلمة التالية." },
      zh: { title: "小王学中文", text: "小王学中文已经三年了。刚开始的时候，他每天背二十个生词，可是一个月以后就想放弃。老师对他说：“学习不能半途而废，熟能生巧。”\n\n后来他开始读小故事。一边读，一边查不认识的词，既练习了阅读，又记住了生词，真是一举两得。有时候他写作文喜欢加很多形容词，老师笑着说：“别画蛇添足。”" },
      yue: { title: "小王學中文", text: "小王學中文已經三年了。剛開始的時候，他每天背二十個生詞，可是一個月以後就想放棄。老師對他說：「學習不能半途而廢，熟能生巧。」\n\n後來他開始讀小故事。一邊讀，一邊查不認識的詞，既練習了閱讀，又記住了生詞，真是一舉兩得。有時候他寫作文喜歡加很多形容詞，老師笑著說：「別畫蛇添足。」" },
      ko: { title: "비 오는 날", text: "오늘은 비가 많이 와서 집에서 책을 읽었어요. 새로운 단어는 벽이 아니라 문이에요. 모르는 단어를 누르고 점수를 주세요.\n\n한국어를 처음 배울 때는 모든 것을 이해할 필요가 없어요. 천 리 길도 한 걸음부터." },
      nl: { title: "Een regenachtige dag", text: "Gisteren regende het pijpenstelen, dus bleef ik thuis met een boek. Een nieuw woord is geen muur. Het is een deur. Tik op een woord dat je niet kent en geef het een cijfer.\n\nJe hoeft niet alles meteen te begrijpen. Oefening baart kunst." },
      sv: { title: "En regnig dag", text: "I går regnade det småspik, så jag stannade hemma med en bok. Ett nytt ord är ingen mur. Det är en dörr. Tryck på ett ord du inte kan och ge det ett betyg.\n\nDu behöver inte förstå allt på en gång. Övning ger färdighet." },
      da: { title: "En regnvejrsdag", text: "I går regnede det skomagerdrenge, så jeg blev hjemme med en bog. Et nyt ord er ikke en mur. Det er en dør. Tryk på et ord, du ikke kender, og giv det en karakter.\n\nDu behøver ikke forstå det hele på én gang. Øvelse gør mester." },
      no: { title: "En regnværsdag", text: "I går regnet det trollkjerringer, så jeg ble hjemme med en bok. Et nytt ord er ikke en mur. Det er en dør. Trykk på et ord du ikke kan, og gi det en karakter.\n\nDu trenger ikke forstå alt med en gang. Øvelse gjør mester." },
      pl: { title: "Deszczowy dzień", text: "Wczoraj lało jak z cebra, więc zostałem w domu z książką. Nowe słowo to nie mur. To drzwi. Dotknij słowa, którego nie znasz, i daj mu ocenę.\n\nNie musisz wszystkiego rozumieć od razu. Ćwiczenie czyni mistrza." },
      uk: { title: "Дощовий день", text: "Учора лило як з відра, тож я залишився вдома з книжкою. Нове слово — не стіна. Це двері. Натисніть незнайоме слово і поставте йому оцінку.\n\nНе треба розуміти все одразу. Повторення — мати навчання." },
      el: { title: "Μια βροχερή μέρα", text: "Χθες έβρεχε καρεκλοπόδαρα, οπότε έμεινα στο σπίτι με ένα βιβλίο. Μια καινούργια λέξη δεν είναι τοίχος. Είναι πόρτα. Πάτησε μια λέξη που δεν ξέρεις και βάλε της βαθμό.\n\nΔεν χρειάζεται να καταλάβεις τα πάντα αμέσως. Σιγά σιγά γίνεται η αγουρίδα μέλι." },
      tr: { title: "Yağmurlu bir gün", text: "Dün bardaktan boşanırcasına yağmur yağdı, bu yüzden evde kitap okudum. Yeni bir kelime duvar değildir. Bir kapıdır. Bilmediğin bir kelimeye dokun ve ona bir not ver.\n\nHer şeyi hemen anlaman gerekmez. Damlaya damlaya göl olur." },
      fi: { title: "Sateinen päivä", text: "Eilen satoi kaatamalla, joten jäin kotiin lukemaan kirjaa. Uusi sana ei ole seinä. Se on ovi. Napauta sanaa, jota et tunne, ja anna sille arvosana.\n\nKaikkea ei tarvitse ymmärtää heti. Hiljaa hyvä tulee." },
      vi: { title: "Một ngày mưa", text: "Hôm qua trời mưa như trút nước, nên tôi ở nhà đọc sách. Một từ mới không phải là bức tường. Nó là một cánh cửa. Hãy chạm vào một từ bạn chưa biết và cho nó một điểm.\n\nBạn không cần hiểu hết mọi thứ ngay. Có công mài sắt, có ngày nên kim." },
      id: { title: "Hari hujan", text: "Kemarin hujan turun dengan deras, jadi saya tinggal di rumah membaca buku. Kata baru bukan tembok. Kata baru adalah pintu. Ketuk kata yang belum kamu kenal dan beri nilai.\n\nKamu tidak perlu memahami semuanya sekaligus. Sedikit demi sedikit, lama-lama menjadi bukit." },
      th: { title: "วันฝนตก", text: "เมื่อวานฝนตกหนักมาก ฉันจึงอยู่บ้านอ่านหนังสือ คำใหม่ไม่ใช่กำแพง มันคือประตู แตะคำที่คุณไม่รู้จักแล้วให้คะแนน\n\nคุณไม่จำเป็นต้องเข้าใจทุกอย่างในครั้งเดียว ช้าๆ ได้พร้าเล่มงาม" },
      ja: { title: "日本語の一年", text: "日本語の勉強を始めて一年になります。最初は漢字が多くて大変でしたが、石の上にも三年と言いますから、毎日少しずつ読んでいます。\n\n先生でも間違えることがあります。猿も木から落ちるですね。分からない言葉に出会ったら、押してみてください。" }
    };
    if (id === 'he' && SAMPLE) return SAMPLE;
    return pages[id] || pages.en;
  }

  function seedArticle() {
    const page = sampleForLang(lang().id);
    createTextArticle(page.title, page.text);
  }

  function normalizeWatchUrl(raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try { return new URL(raw).href; } catch (e) { return ''; }
  }

  function openWatchUrl(url, title) {
    url = normalizeWatchUrl(url);
    if (!url) { toast('הקישור לא תקין'); return; }
    const article = {
      id: 'watch-' + Date.now(), title: title || 'יוטיוב · ' + (new URL(url).hostname.replace(/^www\./, '')),
      url, lang: lang().id, kind: 'watch', added: Date.now(), lastOpened: Date.now()
    };
    addArticle(article);
    try { N.openWatch(url); } catch (e) { toast('לא ניתן לפתוח את הנגן'); }
  }

  function openWatchFromInput() {
    const raw = $('#watch-url').value.trim();
    if (!raw) { toast('הדביקו קישור יוטיוב'); return; }
    openWatchUrl(raw);
    $('#watch-url').value = '';
  }

  function openBrave(url) {
    const target = url || (($('#url-input') && $('#url-input').value.trim()) || 'https://search.brave.com');
    try {
      if (N.openBrave) N.openBrave(target);
      else N.openExternal(target);
    } catch (e) { toast('Brave לא נמצא במכשיר'); }
  }

  /* ---------------- language ---------------- */

  function applyCustomBase() {
    const code = ($('#custom-base-code').value || '').trim().toLowerCase();
    if (!/^[a-z]{2,3}$/.test(code)) { toast('קוד שפה לא תקין'); return; }
    state.settings.baseLang = code;
    save(); hideModal('lang'); renderSettings();
    toast('שפת התרגום: ' + code.toUpperCase());
    if (currentWord) localizeLookup(currentWord.lookup, currentWord.w);
  }

  function selectLanguage(id) {
    if (!BY_LANG[id]) return;
    if (langPickerMode === 'base') {
      state.settings.baseLang = id;
      save();
      hideModal('lang');
      renderSettings();
      toast('שפת התרגום: ' + langName(BY_LANG[id]));
      if (currentWord) localizeLookup(currentWord.lookup, currentWord.w);
      return;
    }
    state.settings.lang = id;
    save();
    hideModal('lang');
    rebuildIndex();
    renderAll();
    if (currentView === 'reader') { cleanupReader(); navigate('read'); }
    toast('שפת הלימוד: ' + langName(BY_LANG[id]));
  }

  /* ---------------- modals ---------------- */

  function showModal(id) {
    const el = $('#' + id + '-modal');
    if (!el) return;
    el.hidden = false;
  }
  function hideModal(id) {
    const el = $('#' + id + '-modal');
    if (!el) return;
    el.hidden = true;
  }

  function openPaste() {
    $('#paste-title').value = '';
    $('#paste-text').value = '';
    showModal('paste');
    setTimeout(() => $('#paste-text').focus(), 180);
  }

  function openLang(mode = 'learn') {
    langPickerMode = mode;
    $('#lang-modal-title').textContent = mode === 'base' ? 'שפת אם / תרגום' : 'שפת לימוד';
    $('#lang-modal-sub').textContent = mode === 'base'
      ? 'לאיזו שפה יתורגמו המשמעויות. ברירת המחדל היא שפת המערכת.'
      : '25 שפות. עברית עם מילון מקומי מלא.';
    $('#custom-base-row').hidden = mode !== 'base';
    langSearch = '';
    $('#lang-search').value = '';
    renderLangList();
    showModal('lang');
    setTimeout(() => $('#lang-search').focus(), 180);
  }

  function openNotices(kind) {
    const body = $('#notices-body');
    if (kind === 'privacy') {
      body.innerHTML = `<p><strong>הנתונים שלכם נשארים אצלכם.</strong></p>
        <p>המילים, הטקסטים, ההגדרות והסטטיסטיקות נשמרים בקובץ מקומי במכשיר. אין חשבון, אין שרת של שורש, ואין מעקב.</p>
        <p>כשאתם פותחים קישור, הדפדפן הפנימי טוען אותו מהאתר כמו כל דפדפן. כשאתם לוחצים על „תרגום אונליין”, הטקסט נשלח ל-Google Translate. שום דבר אחר לא יוצא מהמכשיר אלא אם תבחרו לשתף או לייצא גיבוי.</p>
        <p>המילון העברי עצמו נמצא באפליקציה ועובד בלי אינטרנט.</p>`;
    } else {
      body.innerHTML = `<p><strong>שורש נבנה מאפס.</strong> אין כאן קוד, עיצוב, מילון או נכסים שנלקחו מ-Sluka. חלק מהרעיונות והזרימה דומים בכוונה, כי המטרה היא חוויית קריאה דומה — אבל המימוש מקורי.</p>
        <h3>מילון עברי</h3>
        <p>נבנה מערכי המילון של ויקימילון האנגלי דרך kaikki.org, ברישיון CC BY-SA 3.0, ומרשימת השכיחות של FrequencyWords (Hermit Dave), ברישיון CC BY-SA 4.0. החבילה מופצת תחת CC BY-SA 4.0.</p>
        <h3>מילון סיני</h3>
        <p>CC-CEDICT (cc-cedict.org), ברישיון CC BY-SA 4.0. משמש למילים, לפיניין ולחלוקת טקסט סיני למילים.</p>
        <h3>ניבים, פתגמים וצירופים</h3>
        <p>ערכים מוויקימילון האנגלי דרך kaikki.org, ברישיון CC BY-SA 3.0, ב-26 שפות.</p>
        <h3>קוד</h3>
        <p>אפליקציית Android, ממשק ה-WebView והמנוע נכתבו עבור הפרויקט הזה. ספריות צד שלישי: אין. כלי הבנייה: Android SDK ו-OpenJDK.</p>
        <h3>תיעוד המקורות</h3>
        <p><code>THIRD-PARTY-NOTICES.md</code> נמצא בשורש הפרויקט, יחד עם הודעות הרישיון המלאות.</p>`;
    }
    showModal('notices');
  }

  /* ---------------- backup ---------------- */

  function exportBackup() {
    try { N.exportBackup(JSON.stringify(state)); } catch (e) { toast('הייצוא נכשל'); }
  }

  function importBackup() {
    try { N.importBackup(); } catch (e) { toast('הייבוא נכשל'); }
  }

  function onBackup(json) {
    let obj;
    try { obj = JSON.parse(json); } catch (e) { toast('הגיבוי לא תקין'); return; }
    if (!obj || !obj.words) { toast('זה לא נראה כמו גיבוי של שורש'); return; }
    if (!confirm('לייבא את הגיבוי? הנתונים הנוכחיים יוחלפו.')) return;
    state = merge(defaultState(), obj);
    state.seeded = true;
    if (!BY_LANG[state.settings.lang]) state.settings.lang = 'he';
    if (!state.stats) state.stats = {};
    if (!state.articles) state.articles = [];
    save(true);
    applyTheme();
    rebuildIndex();
    renderAll();
    navigate('home');
    toast('הגיבוי יובא');
  }

  function resetProgress() {
    if (!confirm('לאפס את כל ההתקדמות? המילים, הטקסטים והסטטיסטיקות יימחקו. אי אפשר לבטל.')) return;
    state.words = {};
    state.stats = {};
    state.articles = [];
    state.seeded = true;
    save(true);
    rebuildIndex();
    renderAll();
    navigate('home');
    toast('ההתקדמות אופסה');
  }

  /* ---------------- files ---------------- */

  // Text from OCR or a PDF: rejoin what layout split. Spaces between CJK
  // characters (我 们) block word and idiom segmentation; visual line breaks
  // and end-of-line hyphens split sentences and words.
  const CJK = '\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef';
  function cleanExtractedText(text) {
    let t = String(text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\u00ad/g, '');
    t = t.replace(new RegExp('([' + CJK + '])[ \\t]+(?=[' + CJK + '])', 'g'), '$1');
    t = t.replace(/(\p{L})-\n(?=\p{Ll})/gu, '$1');
    const paras = t.split(/\n{2,}/);
    return paras.map(para => {
      const lines = para.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return lines.join('');
      const lens = lines.map(l => l.length).sort((a, b) => a - b);
      const median = lens[Math.floor(lens.length / 2)];
      let out = lines[0];
      for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1];
        const keep = prev.length < median * .6 || /^([-•*–—]|\d+[.)])\s/.test(lines[i]);
        const cjk = new RegExp('[' + CJK + ']$').test(prev) || new RegExp('^[' + CJK + ']').test(lines[i]);
        out += keep ? '\n' + lines[i] : (cjk ? '' : ' ') + lines[i];
      }
      return out;
    }).join('\n\n').trim();
  }

  function plainTextFromHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script,style,noscript,nav,footer,header').forEach(n => n.remove());
      return (doc.body ? doc.body.innerText : doc.documentElement.textContent || '').trim();
    } catch (e) { return String(html || '').replace(/<[^>]+>/g, ' '); }
  }

  function onFile(payloadJson) {
    let payload;
    try { payload = JSON.parse(payloadJson); } catch (e) { toast('לא ניתן לקרוא את הקובץ'); return; }
    const name = payload.name || 'מסמך';
    if (payload.bookId && payload.stream) {
      const title = payload.title || name.replace(/\.[a-z0-9]+$/i, '');
      const article = {
        id: 'book-' + Date.now(), title, bookId: payload.bookId, stream: true,
        bytes: Number(payload.bytes) || 0, lang: lang().id, kind: 'book',
        chapters: Array.isArray(payload.chapters) ? payload.chapters : [],
        added: Date.now(), lastOpened: Date.now()
      };
      addArticle(article);
      openStreamArticle(article);
      toast('הספר נטען לקריאה');
      return;
    }
    if (payload.mime === 'application/pdf' || /\.pdf$/i.test(name)) {
      extractPdf(payload);
      return;
    }
    let text = payload.text || '';
    if (/\.html?$/i.test(name)) text = plainTextFromHtml(text);
    if (!text.trim()) { toast('הקובץ ריק'); return; }
    const title = payload.title || name.replace(/\.[a-z0-9]+$/i, '');
    createTextArticle(title, text, 'book', Array.isArray(payload.chapters) ? payload.chapters : []);
  }

  async function extractPdf(payload) {
    if (!window.pdfjsLib) { toast('מנוע PDF לא נטען'); return; }
    toast('מחלץ טקסט מה-PDF…');
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
      let source;
      if (payload.pdfUrl) source = { url: payload.pdfUrl };
      else {
        const binary = atob(payload.data || '');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        source = { data: bytes };
      }
      const pdf = await pdfjsLib.getDocument(source).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let line = '';
        const lines = [];
        for (const item of content.items) {
          if (!item.str) continue;
          line += item.str;
          if (item.hasEOL) { lines.push(line.trim()); line = ''; }
          else if (!/\s$/.test(item.str)) line += ' ';
        }
        if (line.trim()) lines.push(line.trim());
        const text = lines.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        if (text) pages.push(text);
      }
      const title = payload.title || (payload.name || 'PDF').replace(/\.pdf$/i, '');
      const text = cleanExtractedText(pages.join('\n\n'));
      if (!text.trim()) {
        toast('PDF סרוק — מפעיל OCR מקומי…');
        pendingOcr = { name: payload.name || 'PDF', title, pdfId: payload.pdfId || null };
        try {
          if (payload.pdfId) N.ocrBook(payload.pdfId, (TESS[lang().id] || 'eng') + '+eng', 'ocr');
          else N.ocrPdf(payload.data || '', (TESS[lang().id] || 'eng') + '+eng', 'ocr');
        } catch (e) { toast('OCR לא זמין'); }
        return;
      }
      const art = createTextArticle(title, text, 'book');
      if (art && payload.pdfId) { art.pdfId = payload.pdfId; save(); }
      toast('נחלצו ' + pages.length + ' עמודי טקסט');
    } catch (e) {
      console.warn(e);
      toast('מפעיל OCR מקומי על ה-PDF…');
      pendingOcr = { name: payload.name || 'PDF', title: payload.title || (payload.name || 'PDF').replace(/\.pdf$/i, ''), pdfId: payload.pdfId || null };
      try {
        if (payload.pdfId) N.ocrBook(payload.pdfId, (TESS[lang().id] || 'eng') + '+eng', 'ocr');
        else N.ocrPdf(payload.data || '', (TESS[lang().id] || 'eng') + '+eng', 'ocr');
      } catch (err) { toast('לא ניתן להריץ OCR'); }
    }
  }

  /* ---------------- events ---------------- */

  // "Chinese · 中文": the language in the interface language, then in itself.
  function endonym(l) {
    try {
      const n = new Intl.DisplayNames([l.id], { type: 'language' }).of(l.id);
      if (n && n !== l.id) return n.charAt(0).toLocaleUpperCase(l.id) + n.slice(1);
    } catch (e) { }
    return l.en || l.id;
  }
  function onboardingOption(l) {
    const own = endonym(l), shown = langName(l);
    return `<option value="${l.id}">${escapeHtml(shown)}${own && own !== shown ? ' · ' + escapeHtml(own) : ''}</option>`;
  }


  function showOnboarding() {
    const target = $('#onboard-target');
    const base = $('#onboard-base');
    const ui = $('#onboard-ui');
    if (!target || !base || !ui) return;
    target.innerHTML = LANGS.map(onboardingOption).join('');
    base.innerHTML = LANGS.map(onboardingOption).join('');
    const systemLabel = translateString('לפי המערכת', activeUiLang()) || 'System';
    ui.innerHTML = `<option value="system">${escapeHtml(systemLabel)}</option>` +
      UI_LANGS.map(id => onboardingOption(BY_LANG[id] || { id, en: id })).join('');
    target.value = state.settings.lang || 'en';
    base.value = state.settings.baseLang || 'en';
    ui.value = state.settings.ui || 'system';
    showModal('onboarding');
  }

  function finishOnboarding() {
    state.settings.lang = $('#onboard-target').value || 'en';
    state.settings.baseLang = $('#onboard-base').value || 'en';
    state.settings.ui = $('#onboard-ui').value || 'system';
    state.onboarded = true;
    state.seeded = true;
    save(true);
    hideModal('onboarding');
    // Never land on an empty shelf: the starter page has sayings worth tapping.
    if (!state.articles.some(a => a.lang === state.settings.lang)) seedArticle();
    applyUiLanguage();
    renderAll();
    toast('הכול מוכן');
  }

  function fmtBytes(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function openLibrary() {
    let stats = { ok: false, count: 0, bytes: 0, files: {} };
    try { stats = JSON.parse(N.bookStats()); } catch (e) { }
    const host = $('#library-list');
    const files = stats.files || {};
    const books = (state.articles || []).filter(a => a.bookId || a.pdfId);
    $('#library-summary').textContent = `${fmt(Number(stats.count) || 0)} קבצים · ${fmtBytes(stats.bytes)} בשימוש`;
    if (!books.length) {
      host.innerHTML = '<div class="library-empty">אין ספרים גדולים שמורים כרגע.</div>';
    } else {
      host.innerHTML = books.map(a => {
        const id = a.bookId || a.pdfId;
        const size = files[id] || 0;
        return `<div class="library-row"><div class="library-copy"><strong>${escapeHtml(a.title || 'ספר')}</strong><small>${escapeHtml(fmtBytes(size))}</small></div><button class="library-del" data-library-del="${escapeHtml(id)}">מחיקה</button></div>`;
      }).join('');
    }
    showModal('library');
  }

  // Long-press (or ⋯) on a shelf item: open or delete it. Delete asks for a
  // second tap instead of a dialog.
  let itemSheetId = null;
  function openItemSheet(id) {
    const a = state.articles.find(x => x.id === id);
    if (!a) return;
    itemSheetId = id;
    $('#item-title').textContent = a.title || a.url || '';
    const del = $('#item-delete');
    del.classList.remove('confirm');
    del.textContent = tr('מחיקה');
    $('#item-backdrop').hidden = false;
    $('#item-sheet').classList.add('open');
    $('#item-sheet').setAttribute('aria-hidden', 'false');
  }

  function closeItemSheet() {
    itemSheetId = null;
    $('#item-sheet').classList.remove('open');
    $('#item-sheet').setAttribute('aria-hidden', 'true');
    $('#item-backdrop').hidden = true;
  }

  function deleteArticle(id) {
    const a = state.articles.find(x => x.id === id);
    if (!a) return;
    for (const file of [a.bookId, a.pdfId]) {
      if (file) { try { N.deleteBook(file); } catch (e) { } }
    }
    state.articles = state.articles.filter(x => x.id !== id);
    save(true);
    renderAll();
    toast(tr('נמחק'));
  }

  function deleteLibraryBook(id) {
    try { N.deleteBook(id); } catch (e) { }
    state.articles = (state.articles || []).filter(a => a.bookId !== id && a.pdfId !== id);
    save(true);
    openLibrary();
    renderAll();
    toast('הספר נמחק');
  }

  function cleanupLibrary() {
    const keep = (state.articles || []).flatMap(a => [a.bookId, a.pdfId]).filter(Boolean);
    let removed = 0;
    try { removed = Number(N.cleanupBooks(JSON.stringify(keep))) || 0; } catch (e) { }
    save(true);
    openLibrary();
    toast(removed ? 'נמחקו ' + removed + ' קבצים יתומים' : 'לא נמצאו קבצים יתומים');
  }

  function bind() {
    document.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) { navigate(go.dataset.go); return; }

      const close = e.target.closest('[data-close]');
      if (close) { hideModal(close.dataset.close); return; }

      if (e.target.closest('#theme-btn')) {
        state.settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        save(); applyTheme(); renderSettings();
        return;
      }
      if (e.target.closest('#lang-pill')) { openLang('learn'); return; }
      if (e.target.closest('#read-mode-seg button')) {
        readMode = e.target.closest('#read-mode-seg button').dataset.readMode;
        applyReadMode();
        return;
      }
      if (e.target.closest('#open-url-btn')) { openUrlFromInput(); return; }
      if (e.target.closest('#watch-open')) { openWatchFromInput(); return; }
      if (e.target.closest('#watch-brave')) { openBrave(($('#watch-url') && $('#watch-url').value.trim()) || 'https://m.youtube.com'); return; }
      if (e.target.closest('#watch-youtube')) { openWatchUrl('https://m.youtube.com', 'יוטיוב'); return; }
      if (e.target.closest('#theme-seg button')) {
        const b = e.target.closest('#theme-seg button');
        state.settings.theme = b.dataset.theme;
        save(); applyTheme(); renderSettings();
        return;
      }
      if (e.target.closest('#word-filters .chip')) {
        const b = e.target.closest('#word-filters .chip');
        wordFilter = b.dataset.filter;
        $$('#word-filters .chip').forEach(c => c.classList.toggle('active', c === b));
        renderWords();
        return;
      }
      if (e.target.closest('[data-lang-id]')) { selectLanguage(e.target.closest('[data-lang-id]').dataset.langId); return; }
      if (e.target.closest('[data-speak]')) {
        e.stopPropagation();
        const b = e.target.closest('[data-speak]');
        N.speak(b.dataset.speak, lang().id);
        return;
      }
      if (e.target.closest('[data-ignore-word]')) {
        e.stopPropagation();
        const id = e.target.closest('[data-ignore-word]').dataset.ignoreWord;
        if (state.words[id]) { schedule(state.words[id], -1); save(); renderWords(); renderProgress(); }
        return;
      }
      if (e.target.closest('[data-word-id]')) {
        openSavedWord(e.target.closest('[data-word-id]').dataset.wordId);
        return;
      }
      if (e.target.closest('[data-item-menu]')) {
        openItemSheet(e.target.closest('[data-item-menu]').dataset.itemMenu);
        return;
      }
      if (e.target.closest('[data-news-url]')) {
        const n = e.target.closest('[data-news-url]');
        openWebUrl(n.dataset.newsUrl, n.dataset.newsName);
        return;
      }
      if (e.target.closest('#item-open')) {
        const id = itemSheetId;
        closeItemSheet();
        if (id) openArticle(id);
        return;
      }
      if (e.target.closest('#item-delete')) {
        const del = $('#item-delete');
        if (!del.classList.contains('confirm')) {
          del.classList.add('confirm');
          del.textContent = tr('לחצו שוב למחיקה');
          return;
        }
        const id = itemSheetId;
        closeItemSheet();
        if (id) deleteArticle(id);
        return;
      }
      if (e.target.closest('#item-cancel')) { closeItemSheet(); return; }
      if (e.target.closest('[data-article-id]')) {
        if (longPressed) { longPressed = false; return; }
        openArticle(e.target.closest('[data-article-id]').dataset.articleId);
        return;
      }
      if (e.target.closest('#sheet-translate')) {
        const url = e.target.closest('#sheet-translate').dataset.url;
        if (url) N.openExternal ? N.openExternal(url) : N.openUrl(url);
        return;
      }
      if (e.target.closest('#onboard-start')) { finishOnboarding(); return; }
      if (e.target.closest('[data-library-del]')) { deleteLibraryBook(e.target.closest('[data-library-del]').dataset.libraryDel); return; }
      if (e.target.closest('#sheet-edit')) { openEditWord(); return; }
      if (e.target.closest('#sheet-phrase')) { openPhrase(); return; }
      if (e.target.closest('#edit-save')) { saveEditWord(); return; }
      if (e.target.closest('#sheet-speak')) {
        if (currentWord) N.speak(currentWord.raw, lang().id);
        return;
      }
      if (e.target.closest('#review-grades button')) {
        reviewGrade(Number(e.target.closest('#review-grades button').dataset.grade));
        return;
      }
      if (e.target.closest('#grade-grid button')) {
        gradeWord(Number(e.target.closest('#grade-grid button').dataset.grade));
        return;
      }
      if (e.target.closest('#recent-clear')) {
        if (!state.articles.length) return;
        if (!confirm('לנקות את הכתבות והקישורים? הספרים והמילים יישארו.')) return;
        state.articles = state.articles.filter(a => a.kind === 'book' || a.kind === 'watch');
        save(); renderHome(); renderRead(); toast('ההיסטוריה נוקתה');
        return;
      }
      if (e.target.closest('#test-voice')) {
        N.speak('שלום. זה הקול של שורש. קריאה טובה.', lang().id);
        return;
      }
      if (e.target.closest('#paste-create')) {
        createTextArticle($('#paste-title').value, $('#paste-text').value);
        return;
      }
      if (e.target.classList && e.target.classList.contains('modal')) {
        e.target.hidden = true;
        return;
      }

      const action = e.target.closest('[data-action]');
      if (!action) return;
      switch (action.dataset.action) {
        case 'paste': openPaste(); break;
        case 'file': try { N.openFile(); } catch (err) { toast('ייבוא קבצים זמין באפליקציה'); } break;
        case 'language': openLang('learn'); break;
        case 'base-language': openLang('base'); break;
        case 'base-custom': applyCustomBase(); break;
        case 'open-brave': openBrave(($('#url-input') && $('#url-input').value.trim()) || 'https://search.brave.com'); break;
        case 'watch-brave': openBrave(($('#watch-url') && $('#watch-url').value.trim()) || 'https://m.youtube.com'); break;
        case 'watch-youtube': openWatchUrl('https://m.youtube.com', 'יוטיוב'); break;
        case 'export': exportBackup(); break;
        case 'library': openLibrary(); break;
        case 'library-clean': cleanupLibrary(); break;
        case 'export-anki': exportAnki(); break;
        case 'import': importBackup(); break;
        case 'reset': resetProgress(); break;
        case 'sync-host': startSyncHost(); break;
        case 'sync-stop': stopSyncHost(); break;
        case 'sync-join': joinSync(); break;
        case 'sync-copy':
          if (syncHost) N.share(syncHost.ip + ':' + syncHost.port + '  code ' + syncHost.token);
          break;
        case 'notices': openNotices('notices'); break;
        case 'privacy': openNotices('privacy'); break;
        case 'reader-back': cleanupReader(); navigate('read'); break;
        case 'reader-aa': openReaderSettings(); break;
        case 'reader-settings-close': closeReaderSettings(); break;
        case 'page-next': turnPage(1); break;
        case 'page-prev': turnPage(-1); break;
        case 'font-minus': state.settings.fontSize = Math.max(15, (state.settings.fontSize || 19) - 1); save(); applyReaderSettings(); break;
        case 'font-plus': state.settings.fontSize = Math.min(32, (state.settings.fontSize || 19) + 1); save(); applyReaderSettings(); break;
        case 'read-aloud': readCurrentPageAloud(); break;
        case 'open-review': openReview(false); break;
        case 'practice-early': openReview(true); break;
        case 'sample': seedArticle(); break;
        case 'review-reveal': reviewRevealed = !reviewRevealed; renderReview(); break;
        case 'reader-toc': openReaderToc(); break;
        case 'reader-bookmark': toggleBookmark(); break;
        case 'toc-close': closeReaderToc(); break;
        case 'reader-share':
          if (currentArticle) N.share((currentArticle.title || '') + '\n\n' + (currentArticle.text || currentArticle.url || ''));
          break;
        case 'know-all': knowAll(); break;
      }
    });

    $('#url-input').addEventListener('keydown', e => { if (e.key === 'Enter') openUrlFromInput(); });
    $('#watch-url').addEventListener('keydown', e => { if (e.key === 'Enter') openWatchFromInput(); });
    $('#word-search').addEventListener('input', e => { wordSearch = e.target.value; renderWords(); });
    $('#lang-search').addEventListener('input', e => { langSearch = e.target.value; renderLangList(); });
    $('#font-range').addEventListener('input', e => {
      state.settings.fontSize = Number(e.target.value);
      $('#font-range-val').textContent = e.target.value;
      document.documentElement.style.setProperty('--reader-font', e.target.value + 'px');
      save();
    });
    $('#goal-range').addEventListener('input', e => {
      state.settings.dailyGoal = Number(e.target.value);
      $('#goal-range-val').textContent = e.target.value;
      save();
    });
    $('#tts-range').addEventListener('input', e => {
      state.settings.ttsRate = Number(e.target.value) / 100;
      $('#tts-range-val').textContent = state.settings.ttsRate.toFixed(1) + '×';
      save();
      applyTtsRate();
    });
    $('#sheet-backdrop').addEventListener('click', closeSheet);
    $('#ui-select').addEventListener('change', e => {
      state.settings.ui = e.target.value;
      save();
      renderAll();
      applyUiLanguage();
    });
    $('#reader-settings-backdrop').addEventListener('click', closeReaderSettings);
    swipeToClose($('#word-sheet'), closeSheet);
    // Long-press a book or article for its menu.
    let pressTimer = null;
    document.addEventListener('touchstart', e => {
      const item = e.target.closest && e.target.closest('[data-article-id]');
      if (!item || e.touches.length !== 1) return;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => { longPressed = true; openItemSheet(item.dataset.articleId); }, 520);
    }, { passive: true });
    ['touchend', 'touchmove', 'touchcancel'].forEach(ev => document.addEventListener(ev, () => clearTimeout(pressTimer), { passive: true }));
    document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('[data-article-id]')) e.preventDefault(); });
    swipeToClose($('#reader-settings'), closeReaderSettings);
    swipeToClose($('#reader-toc'), closeReaderToc);
    swipeToClose($('#item-sheet'), closeItemSheet);
    $('#item-backdrop').addEventListener('click', closeItemSheet);
    $('#toc-backdrop').addEventListener('click', closeReaderToc);
    $('#toc-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-toc-tab]'); if (!b) return;
      tocTab = b.dataset.tocTab; renderToc();
    });
    $('#toc-list').addEventListener('click', e => {
      const del = e.target.closest('[data-toc-del]');
      if (del) { removeBookmark(del.dataset.tocDel); return; }
      const jumpOffset = e.target.closest('[data-toc-offset]');
      if (jumpOffset) { jumpToStreamOffset(Number(jumpOffset.dataset.tocOffset)); return; }
      const jump = e.target.closest('[data-toc-page]');
      if (jump) jumpToTocPage(Number(jump.dataset.tocPage));
    });
    $('#paper-swatches').addEventListener('click', e => {
      const b = e.target.closest('[data-paper]'); if (!b) return;
      state.settings.readerPaper = b.dataset.paper; save(); applyReaderSettings();
    });
    $('#font-seg').addEventListener('click', e => {
      const b = e.target.closest('[data-font]'); if (!b) return;
      state.settings.readerFont = b.dataset.font; save(); applyReaderSettings();
    });
    $('#paged-switch').addEventListener('click', () => {
      state.settings.readerPaged = state.settings.readerPaged === false; save(); applyReaderSettings();
    });
    $('#pinyin-switch').addEventListener('click', () => {
      state.settings.readerPinyin = !state.settings.readerPinyin;
      save();
      applyReaderSettings();
      rerenderKeepingPlace();
    });
    $('#line-seg').addEventListener('click', e => {
      const b = e.target.closest('[data-line]'); if (!b) return;
      const r = currentReader;
      const keep = r && !r.paged ? r.offsetNow : null;
      state.settings.readerLine = b.dataset.line; save(); applyReaderSettings();
      if (keep != null) requestAnimationFrame(() => scrollToOffset(keep));
    });
    $('#reader-scroll').addEventListener('scroll', onReaderScroll, { passive: true });
    $('#reader-scroll').addEventListener('click', e => {
      // A tap on empty page space brings the bars back.
      if (!e.target.closest('.ner-w,button,a')) $('#view-reader').classList.remove('chrome-hidden');
    });
    document.addEventListener('keydown', e => {
      const grading = $('#word-sheet').classList.contains('open') ? gradeWord : (currentView === 'review' ? reviewGrade : null);
      if (grading && $('#word-sheet').classList.contains('open') || (grading && currentView === 'review' && !$('#word-sheet').classList.contains('open'))) {
        if (/^[1-4]$/.test(e.key)) { e.preventDefault(); grading(Number(e.key)); }
        else if (e.key === 'k' || e.key === 'K') { e.preventDefault(); grading(5); }
        else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); grading(-1); }
        else if (e.key === 'Escape') { e.preventDefault(); if ($('#word-sheet').classList.contains('open')) closeSheet(); else navigate('home'); }
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushRead(); });
    window.addEventListener('pagehide', () => { flushRead(); save(true); });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', () => { if (state.settings.theme === 'auto') applyTheme(); });
  }

  function cycleFont() {
    const sizes = [17, 19, 21, 23, 25, 28];
    const i = sizes.indexOf(state.settings.fontSize);
    state.settings.fontSize = sizes[(i + 1) % sizes.length];
    document.documentElement.style.setProperty('--reader-font', state.settings.fontSize + 'px');
    save();
    toast('גודל טקסט: ' + state.settings.fontSize);
  }

  function knowAll() {
    if (currentReader && !currentReader.paged) {
      for (const p of currentReader.paras) { if (tokenObserver) tokenObserver.unobserve(p); tokenizeNode(p); }
    }
    const spans = $$('#reader-body .ner-w');
    if (!spans.length) return;
    if (!confirm('לסמן את כל המילים בטקסט הזה כידועות?')) return;
    const seen = new Set();
    for (const span of spans) {
      const raw = span.dataset.raw;
      if (seen.has(raw)) continue;
      seen.add(raw);
      const w = wordFor(raw);
      if (w) {
        schedule(w, 5);
      } else {
        const norm = normalizeWord(raw);
        const created = {
          lang: lang().id, key: norm, form: raw, display: raw, tr: '', pos: '',
          meaning: '', grade: 5, added: Date.now(), lastSeen: Date.now(), seen: 0
        };
        schedule(created, 5);
        state.words[lang().id + ':' + norm] = created;
      }
    }
    save();
    rebuildIndex();
    for (const span of spans) {
      const w = wordFor(span.dataset.raw);
      span.dataset.grade = String(w ? w.grade : 0);
      span.dataset.key = w ? w.key : '';
      span.className = 'ner-w ' + gradeClass(w ? w.grade : 0);
    }
    renderHome();
    renderRead();
    toast('כל המילים בטקסט סומנו כידועות');
  }

  function streak() {
    let count = 0;
    const d = new Date();
    const today = dayStats(todayKey(d));
    if (!today.read && !today.listened && !today.added) d.setDate(d.getDate() - 1);
    for (;;) {
      const key = todayKey(d);
      const s = state.stats[key];
      if (s && (s.read || s.listened || s.added)) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }

  function onOcrResult(rid, json) {
    if (rid !== 'ocr') return;
    let data;
    try { data = JSON.parse(json); } catch (e) { toast('OCR נכשל'); return; }
    if (!data.ok || !data.text) { toast('לא זוהה טקסט בקובץ'); return; }
    const title = (pendingOcr && pendingOcr.title) || 'PDF';
    const art = createTextArticle(title, cleanExtractedText(data.text), 'book');
    if (art && pendingOcr && pendingOcr.pdfId) { art.pdfId = pendingOcr.pdfId; save(); }
    pendingOcr = null;
    toast('OCR הסתיים');
  }

  window.NerApp = {
    back,
    onSpeakDone,
    onSpeakStop,
    onSpeakFail,
    onOcrResult,
    onTranslateResult,
    onBookChunk,
    buildAnkiTsv,
    onFile,
    onBackup,
    openSample: seedArticle,
    navigate,
    onSyncPayload,
    onSyncPushed() { refreshFromStore(); toast('התקבל עדכון מהמכשיר השני'); },
    refreshFromStore() {
      try {
        const fresh = N.state();
        if (!fresh) return;
        state = merge(defaultState(), JSON.parse(fresh));
        state.seeded = true;
        if (!BY_LANG[state.settings.lang]) state.settings.lang = 'he';
        rebuildIndex();
        applyTheme();
        renderAll();
        if (currentView === 'words') renderWords();
        if (currentView === 'progress') renderProgress();
      } catch (e) { }
    },
    reload() { load(); applyTheme(); renderAll(); }
  };

  /* ---------------- boot ---------------- */
  load();
  applyTheme();
  renderAll();
  applyUiLanguage();
  if (!state.onboarded) showOnboarding();
  startI18nObserver();
  bind();
  if (boot.platform === 'web') {
    // Browser preview: make the sample available without native file access.
    setTimeout(() => { if (!state.articles.length) { /* keep the empty state */ } }, 0);
  }
})();
