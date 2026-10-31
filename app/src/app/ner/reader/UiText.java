package app.ner.reader;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Native toasts and error messages in the interface language. The web UI has its
 * own catalog; this covers the few strings Android code shows directly. Keys are
 * the Hebrew source strings, as in the web catalog.
 */
final class UiText {
    private static final String[] LANGS = {"en", "hu", "es", "fr", "de", "ru", "ar"};
    private static final Map<String, String[]> ROWS = new HashMap<>();

    static {
        row("לחצו שוב כדי לצאת", "Press back again to exit", "Nyomd meg újra a kilépéshez", "Pulsa otra vez para salir", "Appuyez à nouveau pour quitter", "Nochmal drücken zum Beenden", "Нажмите ещё раз для выхода", "اضغط مرة أخرى للخروج");
        row("לא ניתן לפתוח את הקובץ", "Can't open the file", "A fájl nem nyitható meg", "No se puede abrir el archivo", "Impossible d'ouvrir le fichier", "Datei kann nicht geöffnet werden", "Не удаётся открыть файл", "تعذر فتح الملف");
        row("הקובץ גדול מדי", "The file is too large", "A fájl túl nagy", "El archivo es demasiado grande", "Le fichier est trop volumineux", "Die Datei ist zu groß", "Файл слишком большой", "الملف كبير جدًا");
        row("הגיבוי נשמר", "Backup saved", "Biztonsági mentés kész", "Copia guardada", "Sauvegarde enregistrée", "Sicherung gespeichert", "Резервная копия сохранена", "تم حفظ النسخة الاحتياطية");
        row("שמירת הגיבוי נכשלה", "Couldn't save the backup", "A mentés nem sikerült", "No se pudo guardar la copia", "Échec de la sauvegarde", "Sicherung fehlgeschlagen", "Не удалось сохранить копию", "تعذر حفظ النسخة الاحتياطية");
        row("מסמך", "Document", "Dokumentum", "Documento", "Document", "Dokument", "Документ", "مستند");
        row("לא ניתן לקרוא את הקובץ", "Can't read the file", "A fájl nem olvasható", "No se puede leer el archivo", "Impossible de lire le fichier", "Datei kann nicht gelesen werden", "Не удаётся прочитать файл", "تعذر قراءة الملف");
        row("ההקראה עוד לא מוכנה", "Read-aloud isn't ready yet", "A felolvasás még nem kész", "La lectura en voz alta aún no está lista", "La lecture à voix haute n'est pas encore prête", "Vorlesen ist noch nicht bereit", "Озвучивание ещё не готово", "القراءة الصوتية غير جاهزة بعد");
        row("Brave לא מותקן במכשיר", "Brave isn't installed", "A Brave nincs telepítve", "Brave no está instalado", "Brave n'est pas installé", "Brave ist nicht installiert", "Brave не установлен", "Brave غير مثبت");
        row("לא ניתן לפתוח", "Can't open this", "Nem nyitható meg", "No se puede abrir", "Impossible d'ouvrir", "Kann nicht geöffnet werden", "Не удаётся открыть", "تعذر الفتح");
        row("שיתוף", "Share", "Megosztás", "Compartir", "Partager", "Teilen", "Поделиться", "مشاركة");
        row("סגירה", "Close", "Bezárás", "Cerrar", "Fermer", "Schließen", "Закрыть", "إغلاق");
        row("פתיחה בדפדפן", "Open in browser", "Megnyitás böngészőben", "Abrir en el navegador", "Ouvrir dans le navigateur", "Im Browser öffnen", "Открыть в браузере", "فتح في المتصفح");
        row("לא נמצא דפדפן", "No browser found", "Nincs böngésző", "No se encontró un navegador", "Aucun navigateur trouvé", "Kein Browser gefunden", "Браузер не найден", "لم يتم العثور على متصفح");
        row("EPUB לא נמצא", "EPUB not found", "Az EPUB nem található", "No se encontró el EPUB", "EPUB introuvable", "EPUB nicht gefunden", "EPUB не найден", "لم يتم العثور على EPUB");
        row("זה לא קובץ EPUB תקין", "This isn't a valid EPUB file", "Ez nem érvényes EPUB fájl", "No es un archivo EPUB válido", "Ce n'est pas un fichier EPUB valide", "Keine gültige EPUB-Datei", "Это не файл EPUB", "هذا ليس ملف EPUB صالحًا");
        row("לא נמצא קובץ OPF", "No OPF file in the EPUB", "Nincs OPF fájl az EPUB-ban", "No hay archivo OPF en el EPUB", "Aucun fichier OPF dans l'EPUB", "Keine OPF-Datei im EPUB", "В EPUB нет файла OPF", "لا يوجد ملف OPF في EPUB");
        row("קובץ OPF חסר", "The OPF file is missing", "Hiányzik az OPF fájl", "Falta el archivo OPF", "Le fichier OPF est manquant", "OPF-Datei fehlt", "Файл OPF отсутствует", "ملف OPF مفقود");
        row("לא נמצא טקסט בספר", "No text found in the book", "Nincs szöveg a könyvben", "No se encontró texto en el libro", "Aucun texte trouvé dans le livre", "Kein Text im Buch gefunden", "В книге нет текста", "لم يتم العثور على نص في الكتاب");
        row("ספר", "Book", "Könyv", "Libro", "Livre", "Buch", "Книга", "كتاب");
        row("פרק", "Chapter", "Fejezet", "Capítulo", "Chapitre", "Kapitel", "Глава", "فصل");
    }

    private static volatile String cached;

    private UiText() { }

    private static void row(String he, String... t) { ROWS.put(he, t); }

    /** Call when the stored settings may have changed. */
    static void reset() { cached = null; }

    static String t(Store store, String he) {
        String lang = lang(store);
        if ("he".equals(lang)) return he;
        String[] row = ROWS.get(he);
        if (row == null) return he;
        for (int i = 0; i < LANGS.length; i++) if (LANGS[i].equals(lang)) return row[i];
        return row[0];
    }

    private static String lang(Store store) {
        String c = cached;
        if (c != null) return c;
        String pref = "system";
        try {
            JSONObject settings = new JSONObject(store.load()).optJSONObject("settings");
            if (settings != null) pref = settings.optString("ui", "system");
        } catch (Exception ignored) { }
        if ("system".equals(pref)) pref = Locale.getDefault().getLanguage();
        if ("iw".equals(pref)) pref = "he";
        boolean known = "he".equals(pref);
        for (String l : LANGS) known |= l.equals(pref);
        c = known ? pref : "en";
        cached = c;
        return c;
    }
}
