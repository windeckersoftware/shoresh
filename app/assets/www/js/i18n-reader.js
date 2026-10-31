/* Hand-written UI strings for reading backgrounds, line spacing and sayings (1.5).
   Loaded after i18n.js; entries here win over the machine-translated catalog. */
(function () {
  var m = window.NER_I18N = window.NER_I18N || {};
  var LANGS = ['en', 'hu', 'es', 'fr', 'de', 'ru', 'ar'];
  var rows = {
    'פתגם': ['Proverb', 'Közmondás', 'Refrán', 'Proverbe', 'Sprichwort', 'Пословица', 'مثل'],
    'ניב': ['Idiom', 'Szólás', 'Modismo', 'Expression idiomatique', 'Redewendung', 'Идиома', 'تعبير اصطلاحي'],
    'צירוף': ['Expression', 'Kifejezés', 'Expresión', 'Expression', 'Wendung', 'Выражение', 'عبارة'],
    'אוטומטי': ['Auto', 'Automatikus', 'Automático', 'Auto', 'Automatisch', 'Авто', 'تلقائي'],
    'לבן': ['White', 'Fehér', 'Blanco', 'Blanc', 'Weiß', 'Белый', 'أبيض'],
    'קרם': ['Cream', 'Krém', 'Crema', 'Crème', 'Creme', 'Кремовый', 'كريمي'],
    'ספיה': ['Sepia', 'Szépia', 'Sepia', 'Sépia', 'Sepia', 'Сепия', 'بني داكن'],
    'נייר אורז': ['Rice paper', 'Rizspapír', 'Papel de arroz', 'Papier de riz', 'Reispapier', 'Рисовая бумага', 'ورق الأرز'],
    'אפור שקט': ['Quiet grey', 'Csendes szürke', 'Gris suave', 'Gris calme', 'Ruhiges Grau', 'Тихий серый', 'رمادي هادئ'],
    'מרווה': ['Sage', 'Zsálya', 'Salvia', 'Sauge', 'Salbei', 'Шалфей', 'مريمية'],
    'ורוד עדין': ['Blush', 'Púder', 'Rubor', 'Rose pâle', 'Zartrosa', 'Пудровый', 'وردي فاتح'],
    'לילה': ['Night', 'Éjszaka', 'Noche', 'Nuit', 'Nacht', 'Ночь', 'ليل'],
    'דמדומים': ['Dusk', 'Alkony', 'Anochecer', 'Crépuscule', 'Dämmerung', 'Сумерки', 'غسق'],
    'ירוק דיו': ['Ink green', 'Tintazöld', 'Verde tinta', 'Vert encre', 'Tintengrün', 'Чернильно-зелёный', 'أخضر حبري'],
    'שחור': ['Black', 'Fekete', 'Negro', 'Noir', 'Schwarz', 'Чёрный', 'أسود'],
    'מרווח שורות': ['Line spacing', 'Sorköz', 'Interlineado', 'Interligne', 'Zeilenabstand', 'Межстрочный интервал', 'تباعد الأسطر'],
    'צפוף': ['Tight', 'Szoros', 'Junto', 'Serré', 'Eng', 'Плотно', 'ضيق'],
    'רגיל': ['Normal', 'Normál', 'Normal', 'Normal', 'Normal', 'Обычно', 'عادي'],
    'מרווח': ['Airy', 'Tágas', 'Amplio', 'Aéré', 'Luftig', 'Свободно', 'واسع'],
    'דפדוף בעמודים': ['Page turning', 'Lapozás', 'Pasar páginas', 'Tourner les pages', 'Seitenweise blättern', 'Постраничное листание', 'تقليب الصفحات'],
    'תצוגת קריאה': ['Reading view', 'Olvasási nézet', 'Vista de lectura', 'Affichage de lecture', 'Leseansicht', 'Вид для чтения', 'عرض القراءة'],
    'גופן': ['Font', 'Betűtípus', 'Fuente', 'Police', 'Schrift', 'Шрифт', 'الخط'],
    'תוכן': ['Contents', 'Tartalom', 'Contenido', 'Sommaire', 'Inhalt', 'Содержание', 'المحتويات'],
    'לא מכיר': ["don't know", 'nem ismerem', 'no la conozco', 'inconnu', 'unbekannt', 'не знаю', 'لا أعرفها'],
    'מזהה': ['recognise', 'ismerős', 'me suena', 'reconnu', 'erkannt', 'узнаю', 'مألوفة'],
    'מבין': ['understand', 'értem', 'la entiendo', 'compris', 'verstanden', 'понимаю', 'أفهمها'],
    'כמעט': ['almost', 'majdnem', 'casi', 'presque', 'fast', 'почти', 'تقريبًا'],
    'ידוע': ['known', 'tudom', 'conocida', 'connu', 'bekannt', 'знаю', 'معروفة'],
    'דלג': ['skip', 'kihagy', 'saltar', 'ignorer', 'überspringen', 'пропустить', 'تخطَّ'],
    'פיניין': ['Pinyin', 'Pinjin', 'Pinyin', 'Pinyin', 'Pinyin', 'Пиньинь', 'بينيين'],
    'חדשות': ['News', 'Hírek', 'Noticias', 'Actualités', 'Nachrichten', 'Новости', 'أخبار'],
    'אפשרויות': ['Options', 'Lehetőségek', 'Opciones', 'Options', 'Optionen', 'Действия', 'خيارات'],
    'פתיחה': ['Open', 'Megnyitás', 'Abrir', 'Ouvrir', 'Öffnen', 'Открыть', 'فتح'],
    'מחיקה': ['Delete', 'Törlés', 'Eliminar', 'Supprimer', 'Löschen', 'Удалить', 'حذف'],
    'לחצו שוב למחיקה': ['Tap again to delete', 'Koppints újra a törléshez', 'Toca otra vez para eliminar', 'Touchez encore pour supprimer', 'Zum Löschen nochmal tippen', 'Нажмите ещё раз, чтобы удалить', 'اضغط مرة أخرى للحذف'],
    'ניקוי': ['Clear', 'Törlés', 'Borrar', 'Effacer', 'Leeren', 'Очистить', 'مسح'],
    'מחפש…': ['Looking up…', 'Keresés…', 'Buscando…', 'Recherche…', 'Suche…', 'Поиск…', 'جارٍ البحث…'],
    'לא נמצאה משמעות. אפשר לפתוח תרגום אונליין.': ['No meaning found. Try the online translation.', 'Nem található jelentés. Próbáld az online fordítást.', 'No se encontró significado. Prueba la traducción en línea.', 'Aucun sens trouvé. Essayez la traduction en ligne.', 'Keine Bedeutung gefunden. Versuche die Online-Übersetzung.', 'Значение не найдено. Попробуйте онлайн-перевод.', 'لم يُعثر على معنى. جرّب الترجمة عبر الإنترنت.'],
    'ביטול': ['Cancel', 'Mégse', 'Cancelar', 'Annuler', 'Abbrechen', 'Отмена', 'إلغاء'],
    'נמחק': ['Deleted', 'Törölve', 'Eliminado', 'Supprimé', 'Gelöscht', 'Удалено', 'تم الحذف'],
    'בשכיחות': ['by frequency', 'gyakoriság szerint', 'por frecuencia', 'par fréquence', 'nach Häufigkeit', 'по частоте', 'حسب التكرار'],
    'מילון מקומי': ['Offline dictionary', 'Offline szótár', 'Diccionario sin conexión', 'Dictionnaire hors ligne', 'Offline-Wörterbuch', 'Офлайн-словарь', 'قاموس دون اتصال']
  };
  LANGS.forEach(function (code, i) {
    if (!m[code]) m[code] = {};
    Object.keys(rows).forEach(function (he) { m[code][he] = rows[he][i]; });
  });
})();

/* Sentences with numbers in them, by id; {n}, {a}, {b} are filled in by app.js. */
window.NER_I18N_TPL = {
  daysAgo: { he: 'לפני {n} ימים', en: '{n} days ago', hu: '{n} napja', es: 'hace {n} días', fr: 'il y a {n} jours', de: 'vor {n} Tagen', ru: '{n} дн. назад', ar: 'قبل {n} أيام' },
  words: { he: '{n} מילים', en: '{n} words', hu: '{n} szó', es: '{n} palabras', fr: '{n} mots', de: '{n} Wörter', ru: '{n} слов', ar: '{n} كلمة' },
  showing: { he: 'מוצגות {a} מתוך {b} מילים. חפשו כדי לצמצם.', en: 'Showing {a} of {b} words. Search to narrow it down.', hu: '{a} / {b} szó látható. Keress a szűkítéshez.', es: 'Se muestran {a} de {b} palabras. Busca para filtrar.', fr: '{a} mots affichés sur {b}. Cherchez pour affiner.', de: '{a} von {b} Wörtern angezeigt. Suche, um einzugrenzen.', ru: 'Показано {a} из {b} слов. Уточните поиском.', ar: 'يتم عرض {a} من {b} كلمة. ابحث للتضييق.' },
  knownLearning: { he: '{a} מילים ידועות, ועוד {b} בלימוד. כל אחת מהן התחילה בטקסט אמיתי.', en: '{a} known words and {b} still learning. Each one started in a real text.', hu: '{a} ismert szó, és még {b} tanulás alatt. Mindegyik valódi szövegből jött.', es: '{a} palabras conocidas y {b} en aprendizaje. Cada una empezó en un texto real.', fr: '{a} mots connus et {b} en cours d’apprentissage. Chacun vient d’un vrai texte.', de: '{a} bekannte Wörter und {b} im Lernen. Jedes stammt aus einem echten Text.', ru: '{a} знакомых слов и ещё {b} в изучении. Каждое пришло из настоящего текста.', ar: '{a} كلمة معروفة و{b} قيد التعلم. كل واحدة بدأت في نص حقيقي.' },
  reviewDone: { he: 'עברתם על {n} מילים.', en: 'You went through {n} words.', hu: '{n} szót néztél át.', es: 'Repasaste {n} palabras.', fr: 'Vous avez révisé {n} mots.', de: 'Du hast {n} Wörter wiederholt.', ru: 'Вы повторили {n} слов.', ar: 'راجعت {n} كلمة.' }
};
