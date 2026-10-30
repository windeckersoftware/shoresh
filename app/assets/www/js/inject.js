(function () {
  'use strict';
  if (window.__NerReader) return;
  var state = window.__NER_STATE__ || {};
  var lang = (state.settings && state.settings.lang) || 'he';
  var root = null, bar = null, panel = null, overlay = null, current = null, currentKey = null, reqId = 0;
  var font = 20;
  var words = state.words || {};
  var index = {};
  var observer = null;
  var pendingRead = 0;
  var readTimer = null;
  var dark = (state.settings && state.settings.theme === 'dark') || (state.settings && state.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var uiPref = (state.settings && state.settings.ui) || 'system';
  var uiCode = uiPref === 'system' ? String((navigator.language || 'en').split('-')[0] || 'en').toLowerCase() : String(uiPref).toLowerCase();
  var brandName = uiCode === 'he' ? 'שורש' : (uiCode === 'ar' ? 'شوريش' : 'Shoresh');
  var baseLang = (state.settings && state.settings.baseLang) || 'en';
  var ISO3 = { hun: 'hu', eng: 'en', heb: 'he', ara: 'ar', spa: 'es', fra: 'fr', fre: 'fr', deu: 'de', ger: 'de', rus: 'ru' };
  function normLang(code) {
    code = String(code || '').toLowerCase().split('-')[0];
    return ISO3[code] || code;
  }
  var UI = {
    he: { openLink: 'פתיחת הקישור', back: 'חזרה', home: 'דף הבית של האתר', read: 'מצב קריאה', close: 'סיום', loading: 'טוען…', how: 'כמה המילה מוכרת לכם?', g1: 'לא מכיר', g2: 'מזהה', g3: 'מבין', g4: 'כמעט', g5: 'ידוע', gx: 'דלג', online: 'תרגום אונליין ›', hint: 'לחצו על מילה כדי לפתוח · 1–4 / K / X', saved: 'שמור באוצר שלכם', missing: 'לא נמצאה משמעות במילון המקומי.', tryOnline: 'אפשר לפתוח תרגום אונליין.', notFound: 'לא נמצא', noMeaning: 'אין משמעות.', local: 'מילון מקומי', rank: 'בשכיחות', translating: 'מתרגם…' },
    en: { openLink: 'Open link', back: 'Back', home: 'Site home', read: 'Read mode', close: 'Close', loading: 'Loading…', how: 'How well do you know this word?', g1: 'new', g2: 'seen', g3: 'know', g4: 'almost', g5: 'known', gx: 'skip', online: 'Online translation ›', hint: 'Tap a word · 1–4 / K / X', saved: 'Saved', missing: 'Not in the local dictionary.', tryOnline: 'You can open an online translation.', notFound: 'Not found', noMeaning: 'No meaning.', local: 'Local dictionary', rank: 'frequency', translating: 'Translating…' },
    hu: { openLink: 'Link megnyitása', back: 'Vissza', home: 'Az oldal kezdőlapja', read: 'Olvasó', close: 'Bezár', loading: 'Betöltés…', how: 'Mennyire ismered ezt a szót?', g1: 'idegen', g2: 'ismerős', g3: 'értem', g4: 'majdnem', g5: 'tudom', gx: 'kihagy', online: 'Online fordítás ›', hint: 'Koppints egy szóra · 1–4 / K / X', saved: 'Elmentve', missing: 'Nincs a helyi szótárban.', tryOnline: 'Nyiss online fordítást.', notFound: 'Nincs találat', noMeaning: 'Nincs jelentés.', local: 'Helyi szótár', rank: 'gyakoriság', translating: 'Fordítás…' },
    es: { openLink: 'Abrir enlace', back: 'Atrás', home: 'Inicio del sitio', read: 'Lectura', close: 'Cerrar', loading: 'Cargando…', how: '¿Cuánto conoces esta palabra?', g1: 'nueva', g2: 'vista', g3: 'entiendo', g4: 'casi', g5: 'sé', gx: 'saltar', online: 'Traducción en línea ›', hint: 'Toca una palabra · 1–4 / K / X', saved: 'Guardada', missing: 'No está en el diccionario local.', tryOnline: 'Puedes abrir una traducción en línea.', notFound: 'No encontrada', noMeaning: 'Sin significado.', local: 'Diccionario local', rank: 'frecuencia', translating: 'Traduciendo…' },
    fr: { openLink: 'Ouvrir le lien', back: 'Retour', home: 'Accueil du site', read: 'Lecture', close: 'Fermer', loading: 'Chargement…', how: 'À quel point connaissez-vous ce mot ?', g1: 'nouveau', g2: 'vu', g3: 'compris', g4: 'presque', g5: 'su', gx: 'passer', online: 'Traduction en ligne ›', hint: 'Touchez un mot · 1–4 / K / X', saved: 'Enregistré', missing: 'Absent du dictionnaire local.', tryOnline: 'Vous pouvez ouvrir une traduction en ligne.', notFound: 'Introuvable', noMeaning: 'Pas de sens.', local: 'Dictionnaire local', rank: 'fréquence', translating: 'Traduction…' },
    de: { openLink: 'Link öffnen', back: 'Zurück', home: 'Startseite der Website', read: 'Lesen', close: 'Schließen', loading: 'Lädt…', how: 'Wie gut kennst du dieses Wort?', g1: 'neu', g2: 'gesehen', g3: 'verstanden', g4: 'fast', g5: 'bekannt', gx: 'weg', online: 'Online-Übersetzung ›', hint: 'Wort antippen · 1–4 / K / X', saved: 'Gespeichert', missing: 'Nicht im lokalen Wörterbuch.', tryOnline: 'Du kannst eine Online-Übersetzung öffnen.', notFound: 'Nicht gefunden', noMeaning: 'Keine Bedeutung.', local: 'Lokales Wörterbuch', rank: 'Häufigkeit', translating: 'Übersetze…' },
    ru: { openLink: 'Открыть ссылку', back: 'Назад', home: 'Главная сайта', read: 'Чтение', close: 'Закрыть', loading: 'Загрузка…', how: 'Насколько знакомо это слово?', g1: 'новое', g2: 'видел', g3: 'понял', g4: 'почти', g5: 'знаю', gx: 'мимо', online: 'Онлайн-перевод ›', hint: 'Нажмите слово · 1–4 / K / X', saved: 'Сохранено', missing: 'Нет в местном словаре.', tryOnline: 'Можно открыть онлайн-перевод.', notFound: 'Не найдено', noMeaning: 'Нет значения.', local: 'Местный словарь', rank: 'частота', translating: 'Перевод…' },
    ar: { openLink: 'فتح الرابط', back: 'رجوع', home: 'الصفحة الرئيسية', read: 'وضع القراءة', close: 'إغلاق', loading: 'جارٍ التحميل…', how: 'ما مدى معرفتك بهذه الكلمة؟', g1: 'جديدة', g2: 'مألوفة', g3: 'أفهم', g4: 'تقريبًا', g5: 'أعرف', gx: 'تجاوز', online: 'ترجمة عبر الإنترنت ›', hint: 'اضغط كلمة · 1–4 / K / X', saved: 'محفوظة', missing: 'ليست في القاموس المحلي.', tryOnline: 'يمكنك فتح ترجمة عبر الإنترنت.', notFound: 'غير موجود', noMeaning: 'لا معنى.', local: 'قاموس محلي', rank: 'التكرار', translating: 'جارٍ الترجمة…' }
  };
  if (!UI[uiCode]) uiCode = 'en';
  function t(key) { return (UI[uiCode] && UI[uiCode][key]) || UI.en[key] || key; }
  var uiDir = (uiCode === 'he' || uiCode === 'ar') ? 'rtl' : 'ltr';
  var learnDir = (lang === 'he' || lang === 'ar') ? 'rtl' : 'ltr';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
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
  function speak(text) { send('speak', { text: text, lang: lang }); }
  var ttPolicy = null;
  function safeHTML(el, html) {
    try {
      if (!ttPolicy && window.trustedTypes && window.trustedTypes.createPolicy) {
        ttPolicy = window.trustedTypes.createPolicy('ner-ui-policy', { createHTML: function (s) { return s; } });
      }
      if (ttPolicy) { el.innerHTML = ttPolicy.createHTML(html); return; }
    } catch (e) { }
    el.innerHTML = html;
  }

  function shadowStyles() {
    return `
    *{box-sizing:border-box}
    :host{all:initial;direction:${uiDir};font-family:"Noto Sans","Noto Sans Hebrew",system-ui,sans-serif}
    *{box-sizing:border-box}
    .bar{position:fixed;top:10px;left:10px;right:10px;z-index:2147483646;display:flex;align-items:center;gap:6px;direction:${uiDir};
      background:${dark ? 'rgba(26,33,29,.94)' : 'rgba(255,253,248,.95)'};color:${dark ? '#f2eee4' : '#1c1b18'};
      border:1px solid ${dark ? '#303b34' : '#e3dac9'};border-radius:16px;padding:6px 7px;
      box-shadow:0 10px 30px rgba(0,0,0,.18);backdrop-filter:blur(14px);font-size:13px}
    .brand{display:flex;align-items:center;gap:6px;padding:0 4px;font-weight:800;letter-spacing:-.02em}
    .flame{width:25px;height:25px;border-radius:8px;background:#2f6f5e;color:#f6e7c8;display:grid;place-items:center;font-size:13px}
    .grow{flex:1}
    .bar{transition:transform .25s ease,opacity .25s}
    .bar.away{transform:translateY(-140%);opacity:0;pointer-events:none}
    .b.nav{font-size:19px;line-height:1;padding:4px 9px;font-weight:700}
    .link-btn{display:flex;align-items:center;gap:6px;width:100%;margin:10px 0 2px;padding:10px 12px;border:0;border-radius:12px;cursor:pointer;
      background:#2f6f5e;color:#fff;font:inherit;font-size:13px;font-weight:750;text-align:start}
    .link-btn[hidden]{display:none}
    .link-btn small{font-weight:500;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;unicode-bidi:plaintext}
    .b{border:0;background:transparent;color:inherit;font:inherit;font-size:11px;font-weight:650;padding:7px 8px;border-radius:9px;cursor:pointer}
    .b:active{background:${dark ? '#2c3731' : '#f0e9db'}}
    .b.ok{background:#2f6f5e;color:#fff;padding:7px 10px}
    .panel{position:fixed;left:50%;bottom:0;transform:translate(-50%,110%);width:min(100%,640px);z-index:2147483647;
      background:${dark ? '#1a211d' : '#fffdf8'};color:${dark ? '#f2eee4' : '#1c1b18'};border-radius:24px 24px 0 0;
      border:1px solid ${dark ? '#303b34' : '#e3dac9'};border-bottom:0;box-shadow:0 24px 60px rgba(0,0,0,.35);
      padding:8px 18px 20px;transition:transform .26s cubic-bezier(.2,.8,.2,1);max-height:76vh;overflow:auto;direction:${uiDir}}
    .panel.open{transform:translate(-50%,0)}
    .grab{width:36px;height:4px;border-radius:4px;background:${dark ? '#303b34' : '#e3dac9'};margin:3px auto 13px}
    .head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .word{font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.03em;margin:0}
    .meta{font-size:11px;color:#2f6f5e;margin:4px 0 0;min-height:14px}
    .speak{width:38px;height:38px;border-radius:12px;border:0;background:${dark ? '#213b30' : '#dcebe4'};color:${dark ? '#84c9ad' : '#2f6f5e'};font-size:17px;cursor:pointer}
    .meaning{font-size:14px;line-height:1.55;margin:14px 0 4px;color:${dark ? '#d8d3c8' : '#3d3a33'}}
    .phrase{margin:13px 0 0;padding:10px 12px;border-radius:13px;background:${dark ? '#2a2618' : '#f6ecd6'};border:1px solid ${dark ? '#4a3f22' : '#e6d3a8'};display:flex;flex-direction:column;gap:2px}
    .phrase[hidden]{display:none}
    .phrase small{font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:#c9943f}
    .phrase b{font-size:15px;line-height:1.3;unicode-bidi:plaintext}
    .phrase span{font-size:12.5px;line-height:1.45;color:${dark ? '#d8d3c8' : '#3d3a33'};unicode-bidi:plaintext}
    .more{font-size:11px;line-height:1.5;color:${dark ? '#a7a69b' : '#726c60'};margin:0 0 2px}
    .label{font-size:10px;color:${dark ? '#a7a69b' : '#726c60'};margin:14px 0 6px}
    .grades{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
    .grades button{min-height:50px;border:1px solid transparent;border-radius:11px;background:${dark ? '#222b26' : '#f0e9db'};color:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer}
    .grades button b{font-size:14px}.grades button small{font-size:8px;color:${dark ? '#a7a69b' : '#726c60'}}
    .grades button.active{background:${dark ? '#253445' : '#dfe9f5'};border-color:#3f6fa8;color:#3f6fa8}
    .grades .k.active{background:${dark ? '#213b30' : '#dcebe4'};border-color:#2f6f5e;color:#2f6f5e}
    .grades .x.active{background:${dark ? '#2c3731' : '#e7ddca'};border-color:#726c60;color:#726c60}
    .foot{display:flex;justify-content:space-between;align-items:center;margin-top:11px;font-size:10px;color:${dark ? '#a7a69b' : '#726c60'}}
    .foot a{color:#2f6f5e;text-decoration:none;font-weight:700}
    .reader{position:fixed;inset:0;z-index:2147483645;background:${dark ? '#111614' : '#f6f2e9'};color:${dark ? '#f2eee4' : '#1c1b18'};overflow:auto;direction:${learnDir};padding:76px 0 50px}
    .reader-inner{max-width:720px;margin:0 auto;padding:0 22px;font-size:${font}px;line-height:1.9;font-family:"Noto Sans","Noto Serif","Noto Sans Hebrew","Noto Serif Hebrew",serif}
    .reader-inner h1{font-size:1.7em;line-height:1.15;letter-spacing:-.04em;margin:0 0 20px;font-family:"Noto Sans Hebrew",sans-serif}
    .reader-inner h2{font-size:1.25em;margin:1.5em 0 .6em}
    .reader-inner p{margin:0 0 1em}
    .reader-inner img,.reader-inner video,.reader-inner iframe{display:none!important}
    .reader-inner a{color:inherit}
    .hint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483646;font-size:10px;color:${dark ? '#a7a69b' : '#726c60'};background:${dark ? 'rgba(26,33,29,.92)' : 'rgba(255,253,248,.92)'};padding:6px 12px;border-radius:20px;border:1px solid ${dark ? '#303b34' : '#e3dac9'}}
    @media(max-width:390px){.b{font-size:10px;padding:6px}.brand span{display:none}.grades button small{font-size:7px}}
    `;
  }

  function installUI() {
    var host = document.createElement('div');
    host.id = 'ner-ui-host';
    host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646';
    root = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = shadowStyles();
    root.appendChild(style);
    var wrap = document.createElement('div');
    safeHTML(wrap, `
      <div class="bar">
        <button class="b nav" data-act="back" aria-label="${t('back')}">${uiDir === 'rtl' ? '›' : '‹'}</button>
        <button class="b nav" data-act="home" aria-label="${t('home')}">⌂</button>
        <div class="brand"><span class="flame">${uiCode === 'he' ? 'ש' : brandName.charAt(0)}</span></div>
        <span class="grow"></span>
        <button class="b" data-act="reader">${t('read')}</button>
        <button class="b" data-act="font">Aa</button>
        <button class="b ok" data-act="close">${t('close')}</button>
      </div>
      <div class="panel">
        <div class="grab"></div>
        <div class="head"><div><h2 class="word">…</h2><p class="meta"></p></div><button class="speak" data-act="speak">🔊</button></div>
        <div class="phrase" hidden><small class="ph-kind"></small><b class="ph-text"></b><span class="ph-meaning"></span></div>
        <p class="meaning">${t('loading')}</p>
        <button class="link-btn" data-act="link" hidden></button>
        <p class="more"></p>
        <div class="label">${t('how')}</div>
        <div class="grades">
          <button data-grade="1"><b>1</b><small>${t('g1')}</small></button>
          <button data-grade="2"><b>2</b><small>${t('g2')}</small></button>
          <button data-grade="3"><b>3</b><small>${t('g3')}</small></button>
          <button data-grade="4"><b>4</b><small>${t('g4')}</small></button>
          <button data-grade="5" class="k"><b>K</b><small>${t('g5')}</small></button>
          <button data-grade="-1" class="x"><b>X</b><small>${t('gx')}</small></button>
        </div>
        <div class="foot"><span class="rank"></span><a href="#" data-act="translate">${t('online')}</a></div>
      </div>
      <div class="reader" hidden><div class="reader-inner"></div></div>
      <div class="hint">${t('hint')}</div>`);
    while (wrap.firstChild) root.appendChild(wrap.firstChild);
    document.documentElement.appendChild(host);
    // Cookie banners and paywalls sit at the highest z-index too; the top
    // layer is above all of them.
    try { host.setAttribute('popover', 'manual'); host.showPopover(); } catch (e) { }
    bar = root.querySelector('.bar');
    panel = root.querySelector('.panel');
    overlay = root.querySelector('.reader');

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (b) {
        var act = b.getAttribute('data-act');
        if (act === 'close') send('close', {});
        if (act === 'back') { if (!overlay.hidden) toggleReader(); else history.back(); }
        if (act === 'home') { location.href = location.origin + '/'; }
        if (act === 'link') { var href = b.getAttribute('data-href'); if (href) { closePanel(); location.href = href; } }
        if (act === 'font') { font = font >= 26 ? 18 : font + 2; var inner = root.querySelector('.reader-inner'); if (inner) inner.style.fontSize = font + 'px'; }
        if (act === 'reader') toggleReader();
        if (act === 'speak') { if (current) speak(current); }
        if (act === 'translate') {
          if (current) {
            var tl = normLang(baseLang) || 'en';
            if (tl === lang) tl = lang === 'en' ? 'he' : 'en';
            send('external', { url: 'https://translate.google.com/?sl=' + encodeURIComponent(lang) + '&tl=' + tl + '&text=' + encodeURIComponent(current) + '&op=translate' });
          }
        }
        return;
      }
      var g = e.target.closest('[data-grade]');
      if (g) { grade(Number(g.getAttribute('data-grade'))); return; }
      if (e.target === overlay) { /* keep */ }
    }, true);

    document.addEventListener('click', function (e) {
      var span = e.target.closest && e.target.closest('.ner-w');
      if (!span) {
        // With the card open, a tap elsewhere only closes it.
        if (panel.classList.contains('open') && e.target !== host) { e.preventDefault(); e.stopPropagation(); closePanel(); }
        return;
      }
      e.preventDefault(); e.stopPropagation();
      openWord(span.getAttribute('data-raw'), span);
    }, true);

    // Drag the card down to close it.
    var dragY = 0, dragDy = 0, dragging = false;
    panel.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || (panel.scrollTop > 0 && !e.target.closest('.grab'))) return;
      dragY = e.touches[0].clientY; dragDy = 0; dragging = true;
    }, { passive: true });
    panel.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      dragDy = e.touches[0].clientY - dragY;
      if (dragDy <= 0) return;
      panel.style.transition = 'none';
      panel.style.transform = 'translate(-50%,' + dragDy + 'px)';
    }, { passive: true });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = '';
      panel.style.transform = '';
      if (dragDy > 80) closePanel();
    }
    panel.addEventListener('touchend', endDrag);
    panel.addEventListener('touchcancel', endDrag);

    // The bar steps aside while reading down a page and comes back on the way up.
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, dy = y - lastY;
      lastY = y;
      if (y < 80 || dy < -6) bar.classList.remove('away');
      else if (dy > 6 && !panel.classList.contains('open')) bar.classList.add('away');
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('open')) return;
      if (/^[1-4]$/.test(e.key)) { e.preventDefault(); grade(Number(e.key)); }
      if (e.key === 'k' || e.key === 'K') { e.preventDefault(); grade(5); }
      if (e.key === 'x' || e.key === 'X') { e.preventDefault(); grade(-1); }
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
    });
  }

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
  function charSplit(text, base) {
    var out = [];
    for (var i = 0; i < text.length; i++) out.push({ segment: text.charAt(i), index: base + i, isWordLike: true });
    return out;
  }
  function dictSegment(text, langId) {
    var marker = scriptRe(langId);
    if (marker && marker.test(text)) {
      var rx = scriptRe(langId), out = [], last = 0, m, saw = false;
      while ((m = rx.exec(text)) !== null) {
        saw = true;
        if (m.index > last) out.push({ segment: text.slice(last, m.index), index: last, isWordLike: false });
        var seg = bridgeSegments(m[0], langId, m.index) || charSplit(m[0], m.index);
        for (var i = 0; i < seg.length; i++) out.push(seg[i]);
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

  function makeSpan(raw) {
    var span = document.createElement('span');
    span.className = 'ner-w';
    span.textContent = raw;
    span.setAttribute('data-raw', raw);
    var w = wordFor(raw);
    span.setAttribute('data-grade', w ? w.grade : 0);
    span.classList.add(gradeClass(w ? w.grade : 0));
    return span;
  }

  // French/Italian elision: l'homme → l' + homme, so each half can be looked up.
  var ELIDED = /^(jusqu|lorsqu|puisqu|quoiqu|qu|dell|all|dall|nell|sull|l|d|j|n|s|c|m|t|un)['’](?=[\p{L}])/iu;
  function addWord(frag, token) {
    var m = (lang === 'fr' || lang === 'it') ? token.match(ELIDED) : null;
    if (m && m[0].length < token.length) {
      frag.appendChild(makeSpan(m[0]));
      frag.appendChild(makeSpan(token.slice(m[0].length)));
    } else {
      frag.appendChild(makeSpan(token));
    }
  }

  function tokenize(rootEl) {
    if (!rootEl) return;
    rebuild();
    var seg = null;
    try { seg = new Intl.Segmenter(lang, { granularity: 'word' }); } catch (e) { }
    var walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('#ner-ui-host,script,style,noscript,textarea,input,select,code,pre,svg,math,.ner-w,[contenteditable]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], count = 0;
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (count > 30000) return;
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0;
      var parts = dictSegment(text, lang) || (seg ? seg.segment(text) : null);
      if (parts) {
        for (var part of parts) {
          if (!part.isWordLike) continue;
          if (part.index > last) frag.appendChild(document.createTextNode(text.slice(last, part.index)));
          addWord(frag, part.segment);
          last = part.index + part.segment.length; count++;
        }
      } else {
        var re = /[\p{L}\p{M}]+(?:['’׳״-][\p{L}\p{M}]+)*/gu, m;
        while ((m = re.exec(text)) !== null) {
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
          addWord(frag, m[0]);
          last = m.index + m[0].length; count++;
        }
      }
      if (!last) return;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    setupRead(rootEl);
  }

  function setupRead(rootEl) {
    if (observer) observer.disconnect();
    if (!('IntersectionObserver' in window)) return;
    var spans = Array.prototype.slice.call(rootEl.querySelectorAll('.ner-w'), 0, 12000);
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = en.target;
        if (en.isIntersecting) {
          s.__vis = true;
          if (s.__read) return;
          s.__timer = setTimeout(function () {
            if (s.__vis && !s.__read) { s.__read = true; pendingRead++; if (pendingRead >= 25) flushRead(); }
          }, 1300);
        } else {
          s.__vis = false; clearTimeout(s.__timer);
        }
      });
    }, { threshold: [0, .55] });
    spans.forEach(function (s) { observer.observe(s); });
    clearInterval(readTimer);
    readTimer = setInterval(flushRead, 10000);
  }
  function flushRead() {
    if (!pendingRead) return;
    var n = pendingRead; pendingRead = 0;
    send('read', { count: n });
  }

  function openWord(raw, span) {
    current = raw; currentKey = null;
    document.querySelectorAll('.ner-w.active').forEach(function (s) { s.classList.remove('active'); });
    if (span) span.classList.add('active');
    var w = wordFor(raw);
    var panelWord = root.querySelector('.word');
    var panelMeta = root.querySelector('.meta');
    var meaning = root.querySelector('.meaning');
    var more = root.querySelector('.more');
    var rank = root.querySelector('.rank');
    panelWord.textContent = raw;
    panelMeta.textContent = w ? (w.tr || '') + (w.pos ? ' · ' + w.pos : '') : '';
    meaning.textContent = (w && w.meaningBase === baseLang && w.meaning) ? w.meaning : t('loading');
    more.textContent = '';
    rank.textContent = (w && w.meaningBase === baseLang && w.meaning) ? t('saved') : '';
    root.querySelectorAll('.grades button').forEach(function (b) { b.classList.toggle('active', !!w && Number(b.getAttribute('data-grade')) === Number(w.grade)); });
    root.querySelector('.phrase').hidden = true;
    var link = span && span.closest ? span.closest('a[href]') : null;
    var linkBtn = root.querySelector('.link-btn');
    var href = link ? link.href : '';
    if (href && /^https?:/i.test(href) && href.split('#')[0] !== location.href.split('#')[0]) {
      var label = (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      safeHTML(linkBtn, '<span>' + esc(t('openLink')) + ' ' + (uiDir === 'rtl' ? '‹' : '›') + '</span><small>' + esc(label) + '</small>');
      linkBtn.setAttribute('data-href', href);
      linkBtn.hidden = false;
    } else {
      linkBtn.hidden = true;
    }
    bar.classList.remove('away');
    panel.classList.add('open');
    var rid = 'r' + (++reqId);
    panel.__rid = rid;
    var ctx = spanContext(span);
    send('lookup', { lang: lang, word: raw, rid: rid, ctx: ctx.text, off: ctx.offset });
  }

  // Up to ~600 characters of the paragraph around the tapped word, so the
  // dictionary can find the saying or idiom the word belongs to.
  function spanContext(span) {
    var block = span && span.closest ? (span.closest('p,li,blockquote,h1,h2,h3,td,dd') || span.parentElement) : null;
    if (!block) return { text: '', offset: 0 };
    var text = '', offset = -1;
    var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var n = walker.currentNode;
      if (n.parentElement && n.parentElement.closest('.py')) continue;
      if (offset < 0 && span.contains(n)) offset = text.length;
      text += n.nodeValue;
    }
    offset = Math.max(0, offset);
    var from = Math.max(0, offset - 300);
    return { text: text.slice(from, offset + 300), offset: offset - from };
  }

  var KIND = {
    he: { proverb: 'פתגם', idiom: 'ניב', phrase: 'צירוף' }, en: { proverb: 'Proverb', idiom: 'Idiom', phrase: 'Expression' },
    hu: { proverb: 'Közmondás', idiom: 'Szólás', phrase: 'Kifejezés' }, es: { proverb: 'Refrán', idiom: 'Modismo', phrase: 'Expresión' },
    fr: { proverb: 'Proverbe', idiom: 'Expression idiomatique', phrase: 'Expression' }, de: { proverb: 'Sprichwort', idiom: 'Redewendung', phrase: 'Wendung' },
    ru: { proverb: 'Пословица', idiom: 'Идиома', phrase: 'Выражение' }, ar: { proverb: 'مثل', idiom: 'تعبير اصطلاحي', phrase: 'عبارة' }
  };

  function showPhrase(ph) {
    var box = root.querySelector('.phrase');
    if (!ph || !ph.found) { box.hidden = true; return; }
    var kinds = KIND[uiCode] || KIND.en;
    box.querySelector('.ph-kind').textContent = kinds[ph.kind] || kinds.phrase;
    box.querySelector('.ph-text').textContent = ph.w || ph.key;
    var gloss = (ph.g && ph.g[0]) || '';
    var mean = box.querySelector('.ph-meaning');
    mean.textContent = gloss;
    box.hidden = false;
    var target = normLang(baseLang);
    if (!gloss || !target || target === 'en') return;
    var rid = panel.__rid;
    fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(gloss))
      .then(function (r) { return r.json(); })
      .then(function (payload) {
        if (panel.__rid !== rid) return;
        var text = (payload && payload[0] ? payload[0] : []).map(function (p) { return p && p[0] ? p[0] : ''; }).join('').trim();
        if (text) mean.textContent = text;
      })
      .catch(function () { });
  }

  function closePanel() {
    panel.classList.remove('open');
    current = null;
    document.querySelectorAll('.ner-w.active').forEach(function (s) { s.classList.remove('active'); });
  }

  function grade(g) {
    if (!current) return;
    var w = wordFor(current);
    var key = currentKey || (w && w.key) || norm(current);
    var form = (w && w.form) || current;
    var display = (w && w.display) || current;
    var tr = (w && w.tr) || '';
    var pos = (w && w.pos) || '';
    var meaning = (w && w.meaningBase === baseLang && w.meaning) || '';
    send('grade', { lang: lang, key: key, form: form, display: display, tr: tr, pos: pos, meaning: meaning, meaningBase: meaning ? baseLang : '', grade: g });
    // Optimistic local update.
    if (!words[lang + ':' + key]) {
      words[lang + ':' + key] = { lang: lang, key: key, form: form, display: display, tr: tr, pos: pos, meaning: meaning, grade: g, added: Date.now() };
    } else {
      words[lang + ':' + key].grade = g;
    }
    rebuild();
    root.querySelectorAll('.ner-w').forEach(function (s) {
      var sw = wordFor(s.getAttribute('data-raw'));
      if (sw && sw.key === key) {
        s.setAttribute('data-grade', g);
        s.className = 'ner-w ' + gradeClass(g);
      }
    });
    root.querySelectorAll('.grades button').forEach(function (b) { b.classList.toggle('active', Number(b.getAttribute('data-grade')) === g); });
    if (g === 5 || g === -1) setTimeout(closePanel, 240);
  }

  function lookupResult(rid, data) {
    if (!panel.classList.contains('open') || panel.__rid !== rid) return;
    showPhrase(data && data.phrase && data.phrase.key !== data.key ? data.phrase : null);
    var meaning = root.querySelector('.meaning');
    var more = root.querySelector('.more');
    var meta = root.querySelector('.meta');
    var rank = root.querySelector('.rank');
    if (!data || !data.found) {
      meaning.textContent = t('missing');
      more.textContent = t('tryOnline');
      rank.textContent = t('notFound');
      return;
    }
    currentKey = data.key;
    var w = words[lang + ':' + data.key];
    var bits = [];
    if (data.display && data.display !== current) bits.push(data.display);
    var py = (lang === 'zh' && window.NerPinyin) ? window.NerPinyin.phrase(data.display || current || '') : '';
    if (py) bits.push(py);
    else if (lang !== 'zh' && data.tr) bits.push(data.tr);
    if (data.pos) bits.push(data.pos);
    meta.textContent = bits.join(' · ');
    var glosses = (data.glosses || []).slice(1, 4).filter(function (g) { return g && g !== data.meaning; });
    more.textContent = glosses.join(' · ');
    rank.textContent = data.rank ? '#' + data.rank + ' ' + t('rank') : t('local');
    root.querySelectorAll('.grades button').forEach(function (b) { b.classList.toggle('active', !!w && Number(b.getAttribute('data-grade')) === Number(w.grade)); });
    var saved = w && w.meaningBase === baseLang ? w.meaning : '';
    var source = data.meaningLang || 'en';
    var target = normLang(baseLang);
    var gloss = data.meaning || '';
    if (saved) { meaning.textContent = saved; return; }
    if (!gloss || !target || source === target) {
      meaning.textContent = gloss || t('noMeaning');
      if (!w) grade(1);
      return;
    }
    meaning.textContent = t('translating');
    var trid = 'wt' + (++reqId);
    panel.__tr = trid;
    fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + encodeURIComponent(source) + '&tl=' + encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(gloss))
      .then(function (r) { return r.json(); })
      .then(function (payload) {
        if (panel.__tr !== trid) return;
        var text = (payload && payload[0] ? payload[0] : []).map(function (p) { return p && p[0] ? p[0] : ''; }).join('').trim();
        if (!text) throw new Error('empty');
        meaning.textContent = text;
        var id = lang + ':' + data.key;
        var entry = words[id];
        if (!entry) {
          entry = { lang: lang, key: data.key, form: current, display: data.display || current, tr: data.tr || '', pos: data.pos || '', meaning: text, meaningBase: baseLang, grade: 1, added: Date.now() };
          words[id] = entry;
        } else {
          entry.meaning = text;
          entry.meaningBase = baseLang;
        }
        send('grade', { lang: lang, key: data.key, form: entry.form, display: entry.display, tr: entry.tr || '', pos: entry.pos || '', meaning: text, meaningBase: baseLang, grade: entry.grade || 1 });
        rebuild();
      })
      .catch(function () {
        if (panel.__tr !== trid) return;
        meaning.textContent = gloss || t('noMeaning');
      });
  }

  function toggleReader() {
    if (!overlay.hidden) { overlay.hidden = true; document.documentElement.classList.remove('ner-reading'); return; }
    var source = document.querySelector('article') || document.querySelector('main') || document.body;
    var clone = source.cloneNode(true);
    clone.querySelectorAll('script,style,noscript,iframe,video,audio,nav,aside,footer,header,form,button,input,select,textarea,.ner-w').forEach(function (n) { n.remove(); });
    var titleEl = document.querySelector('h1');
    var title = titleEl ? titleEl.textContent.trim() : document.title;
    var inner = root.querySelector('.reader-inner');
    safeHTML(inner, '<h1>' + esc(title) + '</h1>');
    var parts = [];
    clone.querySelectorAll('p,h1,h2,h3,h4,li,blockquote').forEach(function (n) {
      var t = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length > 1) parts.push(n.tagName.toLowerCase() === 'li' ? '• ' + t : t);
    });
    if (!parts.length) {
      var t = (clone.innerText || clone.textContent || '').trim();
      parts = t.split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 400);
    }
    parts.forEach(function (p) { var el = document.createElement('p'); el.textContent = p; inner.appendChild(el); });
    overlay.style.fontSize = font + 'px';
    overlay.hidden = false;
    document.documentElement.classList.add('ner-reading');
    tokenize(inner);
  }

  window.__NerReader = {
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
      rebuild();
    },
    back: function () {
      if (panel.classList.contains('open')) { closePanel(); return true; }
      if (!overlay.hidden) { toggleReader(); return true; }
      return false;
    }
  };

  installUI();
  rebuild();
  tokenize(document.body);
  var tokenizing = false;
  var tokTimer = null;
  var origTokenize = tokenize;
  tokenize = function (rootEl) {
    tokenizing = true;
    try { origTokenize(rootEl); } finally { tokenizing = false; }
  };
  try {
    new MutationObserver(function (recs) {
      if (tokenizing) return;
      var roots = [];
      recs.forEach(function (rec) {
        rec.addedNodes.forEach(function (n) {
          if (!n || n.nodeType !== 1) return;
          if (n.closest && n.closest('#ner-ui-host,.ner-w')) return;
          roots.push(n);
        });
      });
      if (!roots.length) return;
      clearTimeout(tokTimer);
      tokTimer = setTimeout(function () { roots.forEach(function (n) { tokenize(n); }); }, 250);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) { }
  window.addEventListener('pagehide', flushRead);
})();
