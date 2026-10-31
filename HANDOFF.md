# Shoresh (שורש) — Handoff for Future Agents

Updated 2026-10-31. Current version **1.6.1** (+ uncommitted work, see below) (`versionCode 118`). The visible name is Shoresh, written שורש. The Android package stays `app.ner.reader` so an update keeps the existing vocabulary.

## Share target (1.6.2, merged to main)

- `ACTION_SEND` for `text/plain`, PDF, EPUB and `text/*`.
- `ACTION_PROCESS_TEXT` for selected words.
- `ACTION_VIEW` for content URIs.
- URL shares open the web reader; short selections open the word card; longer text opens a text article; files reuse the existing import pipeline.
- File imports are queued until the app WebView is ready.
- Tested by adb: URL share opened `ReaderActivity`; selected `hello` opened the word card. A real Drive content-URI test and the Brave share sheet still need device QA.

## In progress (2026-10-31) — reader like the user's two screen recordings

The user recorded the Sluka reader (two videos on their Desktop, `Screenrecorder-2026-10-31-13-0*.mp4`) and wants every feature in Shoresh. Build them in Shoresh's own design (clean-room: no Sluka text, icons or branding). Uncommitted on `main` on top of 1.6.1 (`be301d9`); the tree builds.

**Done (uncommitted, tested on the emulator by the builders):**
- `js/dictlinks.js` — `NER_DICTS` (2–3 specialised dictionaries per language: Pealim/Morfix/Milog for Hebrew, MDBG/Zdic for Chinese, Jisho, Naver, Larousse, RAE, Duden…; every URL checked) and `NER_DICTS_ALL` (Google Translate, Wiktionary, Reverso, Forvo, Ask ChatGPT). Almaany and Longdo were dropped (Cloudflare walls).
- HSK levels in the zh/yue packs (`tools/build_zh_pack.py`, complete-hsk-vocabulary, MIT; 2026 syllabus with 2021 fallback). `Dict.lookup` returns `hsk`, `chars` (per-character reading + gloss for zh/yue/ja) and the other script form.
- `LinkSheet.java` — native in-app sheet (WebView dialog, 85% height, close/share/open in browser). `Ner.openSheet(url)`; web reader uses `ner://sheet?url=`. Web reader word panel has dictionary chips.
- Word card in the app reader: tap → the word gets an outline and a compact card opens next to it (above/below), with other script, reading, seen-count, speak, expand, link chips, phrase card and numbered meanings. Expand → full sheet with HSK badge, frequency rank, all link chips, Meaning | Characters tabs, "+ Your meaning", grades.
- Reader bars: top — back, ‹ editable "page / total" ›, contents, bookmark, ≡ menu (title, share, read aloud, mark all known, reading view), Aa. Bottom — ← 1 2 3 4 I K → grades the open or last tapped word (`readerSel`) and turns pages. In scroll mode a page is one screen between the bars (`screenStep`); streamed books estimate pages from bytes per screen (`streamPageBytes`, measured once per book and layout). "n new · n learning" chip over the unique words tokenized so far (`currentReader.vocab`), % badge. PDFs keep their pages: `article.pdfPages` holds each page's start in the reader's position units (characters; PDFs are always stored inline today, a streamed one would need bytes). Native OCR separates pages with `\f`; `ocrBook` now passes its request id (the result used to be dropped).
- Several learning languages: `settings.learnLangs` (migrated from `settings.lang`, which stays the language read now; `normalizeLangs()` keeps it in the list) and `settings.autoLang`. Settings → Languages (`#view-languages`) has Learning (tick grid), Options (switch to the text's language), Dictionary (base language, pack status) and Interface tabs; the top-bar picker lists only the learnt languages. `detectLang(text, candidates)` (script, then kana/simplified/traditional, Cyrillic letters, common words for 16 Latin-script languages) and `langFromUrl()` (language subdomain or country domain) give new pasted/imported/web articles their language when the user learns it; `followLang()` switches to an article's language before it opens. The Read shelf shows the current language's books and articles.
- Read screen: "Your next <language> book" heading, "Recently opened" with a count chip, a toolbar (paste, Web, add book). Each book card has a progress line and "Page x of y · z%" (`article.pageInfo`, saved when the reader closes; older books fall back to `pdfPages` + `readOffset`, then the percentage) and a word-stats card: % new, new, frequent (new among the 3000 most common), learning · known. `Ner.vocabStats(lang, articleId, knownJson)` reads the book file or the inline text from the saved state (first 2 MB, `capped` in the answer), counts unique keys as a tap would save them (`Dict.vocabStats`: dictionary segments for CJK runs, ICU word breaks elsewhere, `lemmaKey`) on its own executor and answers `NerApp.onVocabStats(id, json)`. Only the counts are cached, on `article.vocab` with a timestamp, refreshed when the book is opened and closed. ~2 s for 400k Chinese characters, <1 s for a 2 MB French book on the emulator.

**Left to build (specs are in the workflow script, `~/.claude/projects/-Users-windecker-Desktop-projects/963483fe-…/workflows/scripts/shoresh-reader-like-videos-wf_7b4a3299-6ec.js`):**
1. Review all changes (JS flows, i18n/RTL, Java lifecycle/threading), fix, test on the emulator, bump to 1.7.0, update README "New in", build, commit locally (the user pushes), and ask before publishing to the site.

**Known open issues from the builders:** the full word sheet follows the app theme, not the reader paper; number keys grade only from the full sheet; `otherScript()` scans the forms map per lookup; the sheet header follows the system locale's direction, not the UI language; the Japanese and Cantonese packs are weak (IPA instead of kana, missing readings). The APK in `out/` named 1.6.1 was rebuilt from this work in progress — rebuild from the commit before publishing 1.6.1 again.

**Testing:** `bash <scratchpad>/dbg/run.sh` built a debuggable copy, and `cdp.mjs` drove the WebView over DevTools. The method is under "Hard-won traps"; the scratchpad is temporary, so recreate the scripts from that description.

## Snapshot

- Package: `app.ner.reader`
- Android 8+ (`minSdk 26`, `targetSdk 35`)
- Size: ~65.6 MB, dev-signed
- Live APK: https://github.com/windeckersoftware/windeckersoftware.github.io/releases/download/shoresh-1.4.7/Shoresh-1.4.7.apk
- Site: https://windeckersoftware.github.io/ner/
- SHA-256: `1191704fb4e8e43d0e84970ad8a7220900e418ae1f73f88e25669c928a24b161`
- Clean-room: no Sluka code, assets, dictionaries, branding or licence logic.

## Build

No Gradle. The toolchain is in `.toolchain/`.

```bash
cd ~/Documents/ner-reader
./build.sh
# out/Shoresh-1.3.2.apk
```

Install:

```bash
export ANDROID_HOME="$PWD/.toolchain/sdk"
export HOME="$PWD/.home"
export ANDROID_USER_HOME="$PWD/.home/.android"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
adb install -r out/Shoresh-1.3.2.apk
```

Dev keystore: `keystore/ner-dev.keystore`, password `nerdev`. Never ship this key.

### Version bump checklist

Change all of these together:

1. `app/AndroidManifest.xml` — `versionCode`, `versionName`
2. `build.sh` — `--version-code`, `--version-name`, output filename
3. `MainActivity.java` — `version()` and the three version strings
4. `app/assets/www/js/app.js` — the `boot.version` fallback
5. `README.md`, `HANDOFF.md`, site page version/hash

Then build, install, verify signature, and run `tools/publish.sh "one-line release note"`. It uploads the APK as a GitHub Release asset, checks the hosted SHA, points `site/ner/index.html` at it, commits and pushes. GitHub Pages can take 1–4 minutes and briefly returns 404/503.

## Architecture

- `MainActivity.java` — WebView shell, JS bridge, file picker, TTS, OCR, PDF import, sync.
- `app/assets/www/index.html` + `js/app.js` — main app UI and reader.
  A tapped word opens the compact `#word-card` (inside `#view-reader`, coloured from the paper, placed above or below the word's line); expand opens the full `#word-sheet` (links, HSK/frequency, Meaning | Characters tabs, grade). Both are filled by `showWordSheet()`.
- `ReaderActivity.java` + `js/inject.js` — injected web-page reader.
- `WatchActivity.java` + `js/watch.js` — focused YouTube viewer.
- `LinkSheet.java` — dictionary links in a sheet over the app (`Ner.openSheet`) and the web reader (`ner://sheet?url=`).
- `Store.java` — atomic local `state.json`; SharedPreferences intentionally avoided.
- `Dict.java` — 25 gzipped offline packs, lookup, CJK segmenter.
- `Epub.java` — EPUB extraction and chapter offsets.
- `Ocr.java` — file-backed Tesseract OCR.
- `BookServer.java` — loopback HTTP server with Range/CORS for PDF.js.
- `SyncServer.java` — LAN HTTP sync with token pairing.
- `app/assets/dict/*.json.gz` — language packs.
- `app/assets/www/js/segment.js` — 24k Chinese word lexicon for web/video.
- `app/assets/tessdata/` — 25 Tesseract models (~67 MB unpacked).

### Large books

- TXT/EPUB > inline limit: copied to `files/books/<id>.txt`; state stores metadata only.
- Reader loads 300 KB chunks via synchronous `N.readBook`.
- Large EPUB chapters are byte offsets; TOC jumps call `loadStreamChunk`.
- Stream bookmarks are `{offset, page, preview}` objects. Legacy numeric bookmarks remain for small articles.
- PDFs are copied to `files/books/<id>.pdf`, served by `BookServer`, and loaded by PDF.js by URL with HTTP Range.
- `BookServer` URLs live only in memory; PDF articles are converted to text after extraction, so they are not re-opened as PDFs.

## Hard-won traps

- **The web reader overlay is a manual popover** (`host.showPopover()`), so it renders in the top layer above site banners. Keep `all:initial` in the host's inline style, which also cancels the UA popover box styles.
- **Never load a pack with `org.json`.** `Dict` stream-parses packs with `android.util.JsonReader` into small objects. The 12 MB CEDICT pack read into a `JSONObject` ran out of a 192 MB heap.
- **Phrase matching rules live in the phrase pack's `meta`** (`elision`, `poss`, `refl`, `unspaced`), written by `tools/build_phrases.py`. Change them there, not in Java.
- **Inflected forms are often entries of their own** in the Wiktionary packs ("pleuvait: …imperfect indicative of pleuvoir"). `Dict.lemmaOf` follows the "… of X" gloss; lookup shows the lemma's meaning and keeps the form note.
- **`Dict` is used from two threads.** Taps look words up on the JavaBridge thread while `vocabStats` runs on its own executor: `lemmaCache` is concurrent, and `vocabStats` gives up if another language's pack loads halfway through.
- **Segmentation cost is log(rank) + a per-word charge.** A linear rank cost splits 生词 into 生 + 词.
- **Testing on the emulator:** build a throwaway debuggable copy (manifest with `android:debuggable="true"`, built into a scratch dir), forward `localabstract:webview_devtools_remote_<pid>` and drive the WebView over the DevTools protocol (`Runtime.evaluate`). Never ship that build.

- **Java cannot use `R`.** `build.sh` compiles `R.java` after the sources; look drawables up by name (`getIdentifier`), as `LinkSheet` does.
- **WebView debugging must be off in release.** Manifest must not contain `android:debuggable="true"`. `setWebContentsDebuggingEnabled` is conditional on `FLAG_DEBUGGABLE` in all activities.
- **Do not concatenate `segment.js` and `inject.js`.** It is ~592 KB and the injected script gets dropped. Inject them in two separate `evaluateJavascript` calls, in order.
- **`dictSegment` must be inside the same IIFE** as its caller. It exists separately in `inject.js` and `watch.js`; moving one does not move the other.
- **Android WebView `Intl.Segmenter('zh')` splits every Han character.** Chinese/Cantonese/Thai use `segment.js`/native dictionary segmentation instead. Do not remove the script guard that falls back for non-CJK text.
- **`N.readBook` is synchronous.** `onBookChunk` must be called from the JS return value; do not wait for a native callback.
- **Anki TSV is export only.** There is no direct AnkiDroid API integration yet.
- **Translation is unofficial Google endpoint.** First use needs a connection; no guarantee of uptime.
- **PDF URLs are session-only.** The `BookServer` registry is not persisted across process restarts.
- **APKs go to GitHub Releases, never into `site/`.** A Pages site is capped at 1 GB and the APKs had reached ~700 MB there. Release assets can be up to 2 GB each and don't count toward the repo or site size.
- **LAN sync does not transfer book files or Tesseract data.** Only state JSON.
- **Non-Hebrew packs carry English glosses.** Base-language translation is a separate online step.
- **Read-aloud is sentence by sentence** on the current page, with the paragraph highlighted. It uses system TTS, not a neural voice. Turning the page stops it.
- **GitHub Pages has a separate repo.** The app repo is not the site; `site/` is a clone of `windeckersoftware/windeckersoftware.github.io` and may receive outside commits. Always `git fetch` + `git rebase origin/main` before pushing.

## Priorities to make it exceptional

### P0 — trust, core learning loop

1. **Direct AnkiDroid card creation**
   - Add deck/model selection, tags, context and media.
   - Keep TSV export as fallback.
   - Test with AnkiDroid installed and with it absent.

2. **Real morphology and dictionary depth**
   - Korean/Japanese/Chinese/Thai/Arabic lemmatisation.
   - Hebrew definitions for non-Hebrew packs, or reliable base-language glosses baked in.
   - Improve small packs: Cantonese, Thai, Vietnamese, Indonesian.
   - Add inflection/part-of-speech display in the word sheet.

3. **Cloud/neural TTS and read-along**
   - High-quality voices per language.
   - Sentence-by-sentence playback with highlighting.
   - Offline fallback to system TTS; never silently fail.

4. **Library and storage management**
   - Delete books and clean orphaned `files/books/*`.
   - Import progress/cancel for large EPUB/PDF.
   - Move extracted PDF text out of `state.json` into streamed text files.
   - Show storage usage; warn before large imports.

5. **Sync v2**
   - QR pairing.
   - Transfer book files and translations, not only vocabulary.
   - Real conflict resolution and tombstones.
   - Encryption at rest/in transit.
   - Desktop/web companion or relay.

6. **Security and release hardening**
   - Release signing key, Play Store/F-Droid packaging.
   - Threat-model the WebView JS bridge and custom `ner://` scheme.
   - Add CSP where possible; validate all bridge inputs.
   - Audit `BookServer` lifecycle/access and add per-session tokens.
   - Privacy review: no analytics, no account; document network calls.

7. **Automated tests and CI**
   - JS unit tests for pagination, segmentation, bookmarks and merge.
   - Emulator smoke tests for import, reader, watch and sync.
   - APK build + signature + checksum checks in CI.
   - Regression fixtures: Chinese text, 6 MB stream book, scanned PDF, RTL UI.

### P1 — product quality

8. **First-run onboarding** — choose target language, base language and UI language; remove the arbitrary English default.
9. **More UI languages** — Portuguese, Italian, Japanese, Korean, Chinese, Turkish, Polish; human-review machine translations; RTL audit for Arabic.
10. **Watch polish**
    - Auto-enable captions and remember the choice.
    - Search/playlist UX without YouTube chrome.
    - Picture-in-picture and background audio.
    - Local video/audio with SRT/VTT import; Netflix/Disney+ remain out of scope.
    - Be explicit that first-party/server-stitched YouTube ads cannot be guaranteed blocked.
11. **More book formats** — CBZ/comics, audiobooks, local video subtitles.
12. **Stats** — daily goal ring, monthly heatmap, per-book progress, export.
13. **Word workflow** — edit notes/tags from the video panel, per-word audio, “add to Anki” action from the panel, undo grade.
14. **OCR** — remove the 80-page cap, background jobs/progress, layout preservation, handwriting, more scripts.
15. **Accessibility** — screen-reader labels, large-font layout, contrast, keyboard navigation, reduced motion.
16. **Performance** — 18k-span web pages, huge PDFs, memory pressure, battery during video, cold-start time.

### P2 — polish

17. Update checker and in-app release notes.
18. Split APKs / App Bundle to shrink the 65 MB download.
19. Optional cloud backup with user-owned storage.
20. More themes and typography.
21. Share/export a book with progress.

## Definition of done for a release

- Clean install on Android 8 and Android 15 emulators.
- No debug flags; manifest not debuggable.
- Version code/name synced across all five places.
- APK signed; SHA-256 recorded.
- Smoke-tested: onboarding, import TXT/EPUB/PDF, pagination, word grade, word edit, Anki TSV, CJK segmentation, web reader, video captions/panel, sync host/join, backup export/import.
- Site updated with APK, size, version, checksum and screenshots.
- `README.md` and `HANDOFF.md` reflect reality.

## Verified in 1.2.0

- An English dictionary gloss translates into Hungarian: “A collection of sheets of paper bound together” → “Összekötött papírlapok gyűjteménye”.
- The watch popup no longer hardcodes Hebrew. Labels follow the interface language. Meanings follow the base language, and the saved meaning records that language.
- APK signature verifies (v2 and v3).

## Verified in 1.1.0

- Review scheduler: grade 1 is due in 10 minutes and resets a long interval; grades 2–4 grow the interval; known words leave the queue; legacy learning words with no due date are due immediately.
- Clean install on an Android 15 emulator. Onboarding opens in English. After Start, the home screen shows a review card at 0 / “nothing due”. Opening it shows “No words are waiting”.
- APK signature verifies (v2 and v3). SHA-256 matches the file in `out/`.
- Sentence read-aloud is wired to system TTS with a paragraph highlight. It was not spoken on the emulator because the image has no TTS engine check beyond the failure toast path.

## Verified in 1.0.0

- CJK web/video segmentation: 18,637 spans on Chinese Wikipedia; words like `立即`, `捐款`, `维基`, `百科`.
- 6.3 MB streamed book crossed the 300,000-byte chunk boundary.
- Large-book TOC jumped to chapter offset `1,000,000`.
- Stream bookmark saved `{offset, page, preview}`; TOC showed `סימנייה · 1%`.
- PDF Range response `206` with `Content-Range: bytes 0-1023/14094`; PDF.js opened the text.
- Inline video `the` → Hungarian `a`, saved as grade-1 vocabulary.
- 1.0.0 signature and hosted checksum match.
