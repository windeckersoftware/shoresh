# Shoresh (שורש) — language-learning reading app

Shoresh is an original Android reading app built from scratch. The name is the Hebrew word for “root”, שורש. 
**Current build:** `out/Shoresh-1.6.1.apk` (dev-signed, Android 8+). The Android package is still `app.ner.reader`, so this installs over the earlier Ner build and keeps its data.

## New in 1.6.1

Tested by tapping words in the starter page of 18 languages and on French and Korean news sites.

- **The word card always opens at once.** A word missing from the offline pack used to open nothing until the online dictionary answered; now the card shows "Looking up…" and fills in. If Wiktionary has nothing either, the word itself is machine-translated from the learning language (`translateFrom` bridge; the web reader does the same).
- **Korean** — words split into stem + particle (학교 | 에서, 책 | 을, 단어 | 는); a one-syllable particle comes off only after a known word (고양이 stays whole), except 을/를. Lookup strips a particle when the whole form is unknown. Particles and Japanese particles (は, を, に…) explain their grammar instead of a homograph (은 is not "silver"). Lines break at spaces only.
- **Thai** uses the WebView's ICU word breaks (with its Thai dictionary) instead of the small pack, so จึง, หนังสือ, ไม่ใช่ stay whole; combining vowel marks never become tokens of their own.
- **Better senses** — alphabet-letter, ISO-code, abbreviation and affix senses move behind the everyday sense, "…of be." form notes resolve to their lemma, a short table covers words whose packs lost the common sense (French *a* = has, Italian *e* = and, English *a*, *I*), and Arabic strips و/ف/ب/ل/ك/ال before lookup (الجديدة → new, not the city El Jadida).
- **Starter pages** for Korean, Dutch, Swedish, Danish, Norwegian, Polish, Ukrainian, Greek, Turkish, Finnish, Vietnamese, Indonesian and Thai.

## New in 1.6.0

- **Pinyin is a switch** (Aa sheet, Chinese only), off by default. The word sheet still shows the reading.
- **News** — Read → Web lists news sites for the learning language: Chinese (BBC 中文, 联合早报, DW, RFI, 纽约时报中文网, 澎湃, 新华网, 端传媒), Cantonese/traditional, French, Korean, Brazilian/European Portuguese and Spanish (`js/news.js`).
- **Web reader navigation** — the bar has Back and site-home buttons, and hides while reading down a page. Tapping a word inside a link still looks the word up, and the card offers *Open link* with the link's text, so headlines lead to articles. A tap outside the card closes it.
- **Above cookie banners** — the web reader's overlay sits in the browser top layer (popover API), so consent dialogs and paywalls at max z-index no longer cover the word card.
- **Swipe down to close** — the word card, reading settings, contents and the shelf menu close with a downward drag; in the web reader too.
- **Delete books** — long-press any book or article (or ⋯ on a book cover): Open / Delete, where Delete asks for a second tap. Book files are removed with it.
- **Chinese glosses** — CC-CEDICT cross-references read "中国共产党 (zhōng guó gòng chǎn dǎng)" instead of the raw `繁|简[pin1 yin1]` form.

## New in 1.5.0

- **Sayings, idioms and chengyu** — tapping a word inside a known expression shows the expression above the word: *pleuvait des cordes* → *pleuvoir des cordes*, *a posé un lapin* → *poser un lapin*, *Übung macht den Meister*, *Rome wasn't built in a day*. Matching follows inflection (via the packs' form tables), elision (*d'une*), any possessive or reflexive pronoun, and someone/something slots, and never crosses the end of a sentence. Data: 26 phrase packs from Wiktionary (`app/assets/dict/phrases/`, ~6 MB; 20k Chinese chengyu/sayings, 72k English, 7k French…). The meaning is translated into the base language and the English original stays visible, because idiom glosses translate poorly.
- **Chinese segmentation** — the Chinese and Cantonese packs are now CC-CEDICT (100k words, pinyin, simplified/traditional). The segmenter scores words by log frequency, so 生词, 时候, 阅读 stay whole, and chengyu come out as one word (半途而废, 一举两得, 画蛇添足). Japanese kotowaza likewise (石の上にも三年).
- **OCR and PDF text** — spaces Tesseract/PDF.js put between CJK characters are removed, end-of-line hyphens are rejoined, and visual line breaks inside paragraphs are joined, so segmentation and phrase matching see real sentences.
- **French/Italian elision** — *l'homme* is two tappable words, and *l'oiseau* looks up *oiseau*.
- **Continuous reading** (default; page turning is still a setting) — paragraphs render as plain text and become tappable as they near the screen, so a 1 MB book opens in well under a second. Book files stream in 300 KB chunks in both directions while scrolling. A thin progress line runs along the top, the bars hide while reading down and return on scrolling up or tapping empty space, and the position is restored to the paragraph.
- **Reading backgrounds** — auto, white, cream, sepia, rice paper, quiet grey, sage, blush, night, dusk, ink green, black; line spacing tight/normal/airy.
- **No word highlighting** — words are never coloured by learning state, in books, the web reader or video captions. Only the word being looked up is marked while its sheet is open.
- **Interface language** — parts of speech, counts, dates, review summary, onboarding language names and native toasts follow the interface language. A scan of every view in English and Hungarian finds no Hebrew. The licence text stays Hebrew.
- **First run** — onboarding ends on a starter page in the learning language with sayings in it (new: Chinese, Cantonese, Japanese, Italian, Portuguese).
- **Dictionary loading** — packs are stream-parsed into plain objects (the CEDICT pack as a JSONObject tree ran a phone out of memory). Only the learning language is preloaded.

## What works in 1.4.4

- **Pinyin** — while learning Chinese, words in the reader, the word list, review, and video captions show tone-marked pinyin above the characters. 的 is de, 中国 is zhōng guó.

- **Name** — the app is Shoresh, written שורש. Other interface languages show Shoresh. The package id is unchanged, so the update keeps existing words.

- **Watch dictionary** — a tapped caption word is explained in the base language. English dictionary glosses are translated (Hungarian base, English video → Hungarian meaning). The popup labels follow the interface language, not Hebrew, and the panel direction follows that language too. A meaning is saved with the language it was written in, so an old English gloss is translated again instead of being shown forever.

- **Review** — words graded 1–4 come back. 1 is due in 10 minutes, 2 in at least a day, 3 in at least 3 days, 4 in at least 7 days. A home card opens a 20-word session; a miss returns once in the same session. Known and ignored words stay out.
- **Read-aloud** — the page is spoken sentence by sentence, with the current paragraph highlighted. Tap again to stop. If system speech is not ready, the app says so instead of failing silently.
- **Shelf** — books are no longer dropped when the recent-article list fills up. Clearing web history leaves books and watched videos in place.
- **Library management** — per-book storage sizes, delete a book and its file, and remove orphaned book files.
- **First-run setup** — choose learning language, base/translation language and interface language before the first page. Existing state is not interrupted.
- **Home** — daily reading count, new words, streak, continue-reading card, recent words, module shortcuts.
- **Read**
  - Books / Web split, matching the two reading modes.
  - Contents and bookmarks: EPUB chapter list, page bookmarks, delete/jump.
  - Paged reading with page counter and page-turn controls.
  - Aa sheet: page colour (auto/paper/sepia/dark), text size, sans/serif/mono, page mode, highlight toggle, read aloud.
  - Paste text or open a URL in the built-in reader.
  - Import TXT and EPUB books (EPUB: container.xml → OPF spine → chapter text).
  - Reader typography, RTL/LTR by language, font-size control, sharing, word sheet.
  - Word highlighting by state: new (blue), learning (amber), known/ignored (plain).
  - Tap a word for vocalised form, transliteration, part of speech, Hebrew definition, English glosses, Google Translate fallback.
  - Grade with 1–4, K (known), X (ignore); keyboard shortcuts too.
  - “Mark all known” for the current text.
  - Reading-time/word counting via visibility timing.
- **Watch**
  - Focused in-app YouTube: the control chrome collapses to a single edge handle on video pages.
  - YouTube recommendations, comments, and header are removed; the player keeps the full width.
  - Large subtitle workspace: caption history, base-language translation, and the clicked-word meaning in the same box directly below the translation. If the local dictionary misses the word, the meaning is fetched inline into the same panel and saved as a grade-1 vocabulary entry.
  - YouTube ad cleanup: request blocking, cosmetic hiding, skip-button clicks, and ad-node removal with a live shield count.
  - Caption mirror: visible YouTube captions are re-rendered as clickable words with the same grade colours, Hebrew lookup and grading.
  - Request-level ad/tracker blocking from a bundled 76k-host filter list.
  - Listening-time tracking while the video element is actually playing.
- **Large books** — TXT and EPUB files over the inline limit are copied into app-private storage and read from disk in 300 KB chunks; the text does not live in `state.json` and does not need to fit in one WebView string. Large EPUBs keep their chapter TOC with byte-offset jumps.
- **CJK segmentation** — Chinese, Cantonese, Japanese and Thai word boundaries use dictionary/ICU segmentation; Chinese and Cantonese use the app's pack for word grouping instead of single characters, in books, imported text, web pages and YouTube captions.
- **Words** — date-grouped cards, search, filter by new/learning/known/ignored, meanings, TTS, grade badges, dismiss.
- **Word editing** — edit a meaning and context sentence per word.
- **Anki export** — tab-separated file with word, reading, meaning, context and language, ready to import into Anki.
- **Progress** — known/learning counts, CEFR-style estimate, words read, streak, listening minutes, 7-day chart, 28-day heatmap, per-language breakdown.
- **Settings** — interface language (System / Hebrew / English / Hungarian / Spanish / French / German / Russian / Arabic), learning-language picker, separate base/translation language, UI theme, reader font size, daily goal, TTS speed, backup export/import, LAN sync, reset, licences.
- **Localized chrome** — Hebrew and Arabic RTL; English, Hungarian, Spanish, French, German and Russian LTR. Machine translations are bundled and switch live. Reader direction still follows the learning language.
- **Base language** — defaults to the device locale, can be any of the 25 packs or any ISO 639-1 code. Meanings translate into it and cache locally.
- **Local Wi-Fi sync** — host on one phone, join with IP + six-digit code; words, bookmarks, and stats merge with timestamp/max rules. No cloud.
- **PDF** — text PDFs are streamed from app-private storage to PDF.js with HTTP Range; no whole-file base64. Scanned PDFs fall back to bundled Tesseract OCR reading the file page by page. Models are included for all 25 learning languages and copied into app storage on demand.
- **Offline packs** — all 25 languages now have a bundled pack: Hebrew, English, Arabic, Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Danish, Norwegian, Finnish, Polish, Russian, Ukrainian, Greek, Turkish, Chinese, Cantonese, Japanese, Korean, Vietnamese, Indonesian, Thai.
- **Dark mode** — native status/navigation bars follow the app theme, not just the page.
- **Storage** — local only. No account, no Shoresh server, no analytics.
- **Dictionary** — 25 bundled packs. Hebrew: 12,269 lemmas, 103,343 inflected forms, 5,549 Hebrew definitions. Other languages carry English glosses from Wiktionary and have smaller coverage. Online Wiktionary remains the fallback for missing words.

## Known limitations after 1.0

1.0 is feature-complete for reading, books, video, vocabulary, stats and LAN sync. It is not full Sluka parity yet. The app is language-neutral: any supported learning language can be paired with any base language. Large books are file-backed. PDFs are served to PDF.js over a loopback HTTP server with Range support, so the whole PDF is no longer base64-encoded into the WebView. Missing or partial:

- Non-Hebrew packs have English glosses; Hebrew definitions exist only for the Hebrew pack. Some small packs (Cantonese, Thai, Vietnamese, Indonesian) have limited coverage.
- CBZ and OCR for more scripts/languages.
- Sync is LAN-only and requires both phones on the same Wi-Fi; there is no relay/cloud fallback.
- Netflix/Disney+/local video subtitle support. YouTube captions currently use a mirrored overlay, not direct modification of the player’s caption layer.
- Sync between phone and desktop, direct AnkiDroid card creation, audio books, cloud voices, AI check. Anki TSV export exists.
- Full morphological handling for Korean/Japanese/Chinese/Thai/Arabic.
- Release signing, Play Store packaging, and a privacy review for the WebView bridge.

## Brave and “no ads”

Brave is a complete Chromium-based browser, not a library that can simply be embedded in another app. This build does **not** contain Brave. It provides:

1. An in-app request blocker using a bundled hosts list.
2. No external browser handoff is required for the Watch experience.

That is the only honest way to hand a page to Brave without shipping a browser engine. “No ads ever” cannot be guaranteed by a hosts blocker; YouTube in particular can serve ads from first-party paths. Brave itself is the reliable no-ads path.

## Build

The project builds without Gradle, using the Android SDK command-line tools and a local JDK.

```bash
./build.sh
```

The script writes `out/Shoresh-1.6.1.apk`. The toolchain lives in `.toolchain/` and is not part of the app. The dev keystore is `keystore/ner-dev.keystore` (password `nerdev`); do not ship with it.

## Data pipeline

- `tools/build_zh_pack.py` builds `zh` and `yue` from CC-CEDICT (CC BY-SA 4.0) with FrequencyWords zh_cn ranks and HSK 3.0 levels from complete-hsk-vocabulary (MIT).
- `tools/build_phrases.py [codes…]` builds the phrase packs from kaikki.org; downloads are cached in `data/raw/phrases/` (multi-word lines only for the large verb/adj files).

- `tools/build_he_pack.py` builds the Hebrew dictionary from:
  - English Wiktionary Hebrew extracts via [kaikki.org](https://kaikki.org/dictionary/Hebrew/) — CC BY-SA 3.0.
  - [FrequencyWords](https://github.com/hermitdave/FrequencyWords) Hebrew list — CC BY-SA 4.0.
- Hebrew definitions are merged from the [Hebrew Wiktionary articles dataset](https://huggingface.co/datasets/OzLabs/hebrew-wiktionary-articles) — CC BY-SA 3.0.
- Ad/tracker hosts come from [StevenBlack/hosts](https://github.com/StevenBlack/hosts) — MIT.
- The starter vocabulary is the 700 most frequent Hebrew words with a Hebrew definition where available.

## Layout

```
app/                 Android manifest, resources, Java, WebView assets
  src/app/ner/reader/
    MainActivity.java  app shell + JS bridge
    ReaderActivity.java web reader with injected UI
    WatchActivity.java  YouTube + listening tracker
    Dict.java          on-device pack lookup
    Epub.java          EPUB text extraction
    AdBlock.java       request filter
    Store.java         atomic local JSON store
  assets/www/         HTML/CSS/JS app
data/                raw sources and built packs
tools/               data builders
out/                 APKs and screenshots
```

## Licence

App code: original, Apache License 2.0 (see `LICENSE`). Dictionary, phrase and filter data keep their own licences (mostly CC BY-SA) — see `THIRD-PARTY-NOTICES.md`.
