# Shoresh — Finish Spec

**For:** Grok 4.7 (engineering), Claude (product/design polish), and any future agent  
**Current version:** 1.6.1 (`versionCode 118`)  
**Status:** strong beta / near-finished. Core features work. Remaining work is localization, activation, polish, release hygiene and size reduction.  
**This file supersedes `HANDOFF.md`.**

---

## 0. Definition of “finished and minimized”

A release is finished when all of these are true:

- Clean install works on Android 8 and Android 15.
- First run never dead-ends on an empty app.
- UI language is consistent: **no Hebrew UI strings remain when UI is English/Spanish/etc.** except actual learning content.
- Watch always shows the Shoresh layer on YouTube video pages, with no vanilla YouTube chrome blocking the player.
- Review is discoverable, explains itself, and works when nothing is due.
- Settings has no overlapping/ghosted sections on a physical device.
- The app has one name and one version everywhere.
- Base APK is **≤ 35 MB**; large optional OCR/voice data downloads on demand.
- Release-signed; checksum and site are current.
- The test matrix in §8 passes.

---

## Status in 1.5.0

- P0.1 localization: catalog is exact-match; numbered sentences, parts of speech, dates and native toasts are localized. A scan of every view in English and Hungarian found no Hebrew. Other UI languages still rely on the machine-translated catalog for older strings.
- P0.2 Watch: unchanged layout; caption colouring removed (no highlighting anywhere), logo letter follows the UI language.
- P0.3 First run: onboarding opens a starter page in the learning language.
- P0.6: dropped — the APK may be as large as it needs (owner's call, 2026-10-30). APKs are published as GitHub Release assets, not in the Pages repo (`tools/publish.sh`).
- Still open: P0.4 Settings ghosting on a physical device, P0.5 review explanations, release key.

## 1. Current state

- Package: `app.ner.reader`
- Label: `שורש` / Shoresh
- Version: 1.4.3, versionCode 111
- APK: `out/Shoresh-1.4.3.apk`
- Live: https://github.com/windeckersoftware/windeckersoftware.github.io/releases/download/shoresh-1.4.7/Shoresh-1.4.7.apk
- SHA-256: `17b5c2c5f4e9322bd7ea1d4e87cebfea72bc62f0461b7ecea828b0a9f33d92fc`
- Size: 65.7 MB, dev-signed
- Android 8+, `minSdk 26`, `targetSdk 35`
- No Sluka code/assets/dictionaries/branding.

Current APK asset breakdown:

| Group | Uncompressed |
|---|---:|
| `assets/tessdata` (25 OCR models) | 67.3 MB |
| `assets/dict` (25 language packs) | 24.0 MB |
| `lib` (Tesseract native libs) | 12.4 MB |
| `assets/www` (app JS/CSS/vendor) | 2.5 MB |
| other assets | 0.6 MB |
| APK on disk | **65.7 MB** |

The APK is already compressed; the big minimization win is moving OCR models out of the base APK.

---

## 2. P0 — must fix before release

### P0.1 Localization is mixed and visibly broken

**Symptoms in English UI:**

- Read empty state: `הוסיפי a book`
- Read empty state: `או Paste text או TXT או EPUB`
- Settings: `אנגלית · English`
- Progress: `reading sequence` instead of **Reading streak**
- Words: lowercase `words` under uppercase `THE VOCABULARY`
- Watch tab: Hebrew explanatory note in English UI
- Onboarding options: `English · English`, `Hebrew · Hebrew`

**Root cause:**

`app.js` → `translateString()` does partial/substring replacement. If a full phrase is missing from the map, it translates individual words inside it and leaves Hebrew fragments.

Examples:

- `הוסיפו ספר` has no exact entry
- `ספר` maps to `a book`
- result: `הוסיפי a book`

**Fix direction:**

- Move UI copy to an **exact-string catalog**, not substring replacement.
- Add all dynamic empty-state/button strings to every UI language.
- Use `langName(l)` for settings; do not hard-code `l.he + ' · ' + l.en`.
- Add plural handling for counts.
- Add a regression test: for every UI language except Hebrew, assert no `[\u0590-\u05FF]` remains in UI chrome after rendering Home, Read, Watch, Words, Progress, Settings, Review, onboarding and dialogs.
- Keep Hebrew only in learning content, examples and user data.

**Acceptance:** English/Spanish/Hungarian/French/German/Russian/Arabic UI has no mixed-language UI strings.

### P0.2 Watch layer regression — YouTube Trusted Types

**This was the vanilla-YouTube bug.**

`watch.js` created the YouTube home icon with:

```js
homeBtn.innerHTML = '<svg ...>'
```

YouTube enforces Trusted Types. This threw:

```text
This document requires 'TrustedHTML' assignment.
Uncaught TypeError: Failed to set the 'innerHTML' property
```

The script aborted before appending the Shoresh host, so the plain YouTube page remained.

**Already fixed in 1.4.3:**

- DOM-built SVG instead of `innerHTML`
- `WatchActivity` watchdog re-injects if the host disappears
- `segment.js` and `watch.js` are injected separately
- `setCollapsed()` hides **both** the top Shoresh bar and the search bar
- SPA interval collapses bars when `/watch` or a video is playing
- manual mini-handle expands, `userExpanded` prevents auto-collapse fighting the user

**Do not regress:**

- No `innerHTML`, `outerHTML`, `insertAdjacentHTML` or `document.write` in code injected into YouTube.
- Do not concatenate `segment.js` with `watch.js`; inject separately.
- Do not remove `watchDog` or the `userExpanded` logic.
- Do not assume `yt-navigate-finish` fires; keep the interval fallback.
- Test direct `youtu.be` links, search → video, SPA navigation, fullscreen, no-caption videos, caption translation and word taps.

**Note:** the source tree was overwritten once during development. Always verify the packaged `assets/www/js/watch.js` inside the APK, not just the source file.

### P0.3 First run still dead-ends

After onboarding, a new user sees:

- 0 words read
- 0 review
- 0 words
- empty shelf
- empty Words and Progress

The onboarding asks the right questions but does not lead into a first success.

**Fix:**

- After onboarding, offer three explicit starters:
  - **Try a sample page** (short, prewritten, language-aware)
  - **Add a book**
  - **Watch a captioned video**
- Add a first-session checklist: read → tap a word → grade it → see it in Review.
- Bundle one short starter text per language, or generate a curated 3–5 sentence sample from existing data.
- Do not dump the user on Home with three zeros.

**Acceptance:** A clean install can reach “one word tapped, one word graded, one review item created” without importing anything.

### P0.4 Settings rendering/scroll polish

In captures, Settings showed repeated/ghosted `LOCAL SYNC` and `0 words` bands. Scrolling partly cleared it. This may be WebView compositing rather than DOM layout, but it looks broken.

**Fix:**

- Reproduce on a physical device.
- Reset scroll position on tab/view changes (`scrollTo(0,0)`).
- Check sticky header height and z-index against settings rows.
- Avoid oversized sticky headers covering content.
- Add `overscroll-behavior` if needed.
- Verify dark mode too.

**Acceptance:** Settings is clean at top, mid-scroll and bottom, in light/dark, on a physical device.

### P0.5 Review is under-explained

Home shows `REVIEW 0 nothing due`, but the user cannot tell:

- when the next review is due
- what the 1–4/K/X grades mean
- how to practice if nothing is due
- what happened after a review session

**Fix:**

- Show “Next review in 10 min / tomorrow”.
- Add **Practice anyway** / **Review 5 words** when the due queue is empty.
- Explain intervals on first review.
- Add a session summary.
- Display next-due time in the word sheet.
- Tie review progress to the daily goal.

### P0.6 Minimize the APK

**Target:** base APK **≤ 35 MB**, full offline packs optional.

Highest-value change:

1. **Move most Tesseract models out of the base APK.**
   - Current `assets/tessdata`: 67.3 MB, 25 models.
   - Keep `eng` + `heb` if desired (~5 MB) for core offline OCR.
   - Download the other 23 models on first OCR in that language.
   - Show a clear size/progress prompt and verify SHA-256.
   - Cache in app storage; allow deletion in Library settings.
   - If offline and model missing: explain, offer OCR in English or cancel.

2. **ABI splits**
   - Current `lib`: 12.4 MB for multiple ABIs.
   - Ship per-ABI APKs or an App Bundle; keep a universal APK as a fallback.

3. **Remove unused assets**
   - Audit `app/assets/seed-he.json` / `seed-he.js` (about 100 KB) and any unreferenced CSS/JS.
   - Do not remove `segment.js`; it is required for CJK segmentation.

4. **Do not chase Sluka’s 256 MB.**
   - Only add offline content that removes a network dependency.
   - Recommended optional packs: base-language dictionaries, pronunciation audio, neural TTS, morphology.
   - Do not add decorative media just to increase size.

**Acceptance:**

- Base APK ≤ 35 MB.
- Scanned PDF in a downloaded language works.
- Missing OCR pack produces an actionable prompt, not a crash.
- Universal fallback APK still installs on Android 8.

### P0.7 Release hygiene and identity

- README says `Shoresh-1.4.0.apk` while the build is 1.4.3.
- Site, README, version strings and APK must agree.
- Package remains `app.ner.reader` for update continuity; document this or migrate data with a one-time import.
- Remove stale “Ner” UI/references where Shoresh is the product.
- Dev-signed only. Decide:
  - keep dev key for direct distribution; or
  - create a release key and accept that users must uninstall/reinstall.
- Add a changelog and a “What’s new” entry per release.
- Update `HANDOFF.md`/`FINISH.md` checksums after every publish.

---

## 3. P1 — product and design polish (Claude)

Give Claude these constraints, not a blank canvas.

### Visual system

- Keep the paper/ink palette, serif display voice and green/gold accents.
- Reduce oversized sticky headers; content should own the screen.
- Unify casing:
  - section overlines: uppercase
  - page titles: sentence case
  - buttons: sentence case
  - “words” → “Words” unless deliberately editorial
- Increase minimum overline size from ~8–10 px where contrast is weak.
- Check every screen at 320 dp width.

### Empty states

Design one system for:

- no books
- no saved words
- no review due
- no listening history
- no internet / no OCR pack

Every empty state needs one primary action and one sentence of explanation.

### Review

Design a calm review card with:

- word
- pronunciation
- context
- reveal
- 1–4/K/X
- next interval
- progress
- finish summary

### Accessibility

- screen-reader labels for icon-only controls
- 48 dp tap targets
- contrast check on `--muted`
- large-font layout
- reduced-motion handling
- keyboard/focus states

**Do not** redesign the brand or add new feature areas until P0 is green.

---

## 4. P2 — optional, only after P0

- Direct AnkiDroid API (deck/model/tags/media), not just TSV.
- Cloud/neural TTS with offline fallback.
- Full morphology for Korean/Japanese/Chinese/Thai/Arabic.
- CBZ/comics, audiobooks, local video with SRT/VTT.
- Sync v2: QR pairing, encrypted transport, book files, conflict tombstones, desktop companion.
- Offline base-language dictionaries for each target/base pair.
- Pronunciation audio packs.
- `Offline OCR pack` manager UI.
- Split APK/App Bundle release pipeline.
- Play Store/F-Droid packaging.
- Automated tests and CI.

---

## 5. Architecture map

```
MainActivity.java          WebView shell, bridge, file picker, TTS, PDF/OCR, sync
ReaderActivity.java        injected web reader
WatchActivity.java         YouTube shell, ad blocking, watchdog injection
Store.java                 atomic state.json
Dict.java                  25 dictionaries, lookup, CJK segmenter
Epub.java                  EPUB extraction + chapter offsets
Ocr.java                   Tesseract OCR, file-backed
BookServer.java            loopback HTTP Range server for PDF.js
SyncServer.java            LAN sync
app/assets/www/index.html  all views
app/assets/www/js/app.js   UI, reader, review, library, i18n, sync
app/assets/www/js/watch.js YouTube overlay, captions, word panel
app/assets/www/js/inject.js web reader overlay
app/assets/www/js/segment.js CJK lexicon (~592 KB)
app/assets/www/js/review.js SRS scheduling
app/assets/dict/*.json.gz  25 language packs
app/assets/tessdata/*.traineddata 25 OCR models
```

### Important implementation details

- `N.readBook` is synchronous; `onBookChunk` is called from the return value.
- Large TXT/EPUB live in `files/books/<id>.txt`, not `state.json`.
- PDFs live in `files/books/<id>.pdf`; `BookServer` serves them with Range.
- `BookServer` registry is memory-only; PDF URLs die with the process.
- Large EPUB chapters are byte offsets; bookmarks are `{offset, page, preview}`.
- Small articles still use numeric page bookmarks.
- `segment.js` is injected separately because of its size.
- YouTube enforces Trusted Types: no HTML-string APIs in overlay code.

---

## 6. Build and release

```bash
cd ~/Documents/ner-reader
./build.sh
# out/Shoresh-<version>.apk
```

Toolchain: `.toolchain/` (local JDK + Android SDK). No Gradle.

Version bumps must be synchronized in:

1. `app/AndroidManifest.xml`
2. `build.sh`
3. `MainActivity.java` version strings
4. `app/assets/www/js/app.js` `boot.version` fallback
5. `README.md`
6. `FINISH.md` / `HANDOFF.md`
7. `site/ner/index.html` version, size, SHA

Release steps:

1. Build.
2. Install clean; run §8 smoke tests.
3. Verify `aapt dump badging` and `apksigner verify`.
4. `tools/publish.sh "one-line release note"` — uploads the APK as release `shoresh-<version>` on `windeckersoftware/windeckersoftware.github.io`, checks the hosted SHA, rewrites the page's download link/version/size, commits and pushes `site/`.
5. Update screenshots by hand if the UI changed.
6. Wait for the Pages build; open https://windeckersoftware.github.io/ner/ and click Download.

APKs live only as GitHub Release assets. Never copy an APK into `site/` (`site/.gitignore` blocks it): each one is ~66 MB, and a Pages site is capped at 1 GB.

Do not ship with `android:debuggable="true"` or `setWebContentsDebuggingEnabled(true)`.

---

## 7. Current known-good evidence

- Trusted Types failure reproduced in logcat, then fixed with DOM SVG creation.
- 1.4.3 video page shows Shoresh caption panel and no YouTube chrome.
- CJK web reader: 18,637 word spans on Chinese Wikipedia.
- 6.3 MB streamed book crossed the 300 KB chunk boundary.
- Large EPUB TOC jumped to byte `1,000,000`.
- Stream bookmark saved `{offset, page, preview}` and appeared in TOC.
- PDF Range: `206`, `Content-Range: bytes 0-1023/14094`; PDF.js opened.
- Library: `1 file · 6.1 MB`; delete removed the article and 6.3 MB file.
- Onboarding persisted target/base/UI independently.

---

## 8. Acceptance test matrix

### Install

- [ ] Clean install on Android 8.
- [ ] Clean install on Android 15.
- [ ] Upgrade from 1.3.3 preserves words/articles.
- [ ] No debug flags.
- [ ] Signature verifies; hosted SHA matches.

### Localization

- [ ] Each UI language: Home, Read, Watch, Words, Progress, Settings, Review, modals.
- [ ] No Hebrew UI text when UI ≠ Hebrew.
- [ ] Language names are localized consistently.
- [ ] RTL Hebrew/Arabic layout; no clipped controls.
- [ ] Onboarding target/base/UI independent.

### First run

- [ ] Fresh install shows onboarding.
- [ ] Sample page can be opened without importing.
- [ ] Add book path works.
- [ ] First word tap/grade creates a review item.

### Reading

- [ ] TXT, EPUB, PDF import.
- [ ] Large TXT/EPUB chunk navigation.
- [ ] Large EPUB TOC.
- [ ] Stream bookmark survives restart.
- [ ] Scanned PDF OCR with installed/missing model.
- [ ] Delete book from Library removes file.

### Video

- [ ] Direct `youtu.be` link.
- [ ] Search → video.
- [ ] SPA navigation video → video.
- [ ] No Shoresh bars covering video.
- [ ] Captions → word → meaning inside subtitle box.
- [ ] Missing dictionary word → inline translation saved.
- [ ] Fullscreen hides overlay.
- [ ] No Trusted Types exceptions in logcat.

### Review / words

- [ ] Grade 1 schedules ~10 min.
- [ ] Grade 2–4 schedules days.
- [ ] Empty review has a practice action.
- [ ] Word edit/context persists.
- [ ] Anki TSV export opens.

### Sync / storage

- [ ] Host/join with token.
- [ ] Bookmark merge preserves numeric and object bookmarks.
- [ ] Delete/orphan cleanup.
- [ ] Backup export/import.

---

## 9. Do-not list

- Do not copy Sluka code, assets, dictionaries or branding.
- Do not put `innerHTML` into YouTube-injected code.
- Do not concatenate `segment.js` and `watch.js`.
- Do not remove the Watch watchdog or Trusted Types-safe DOM creation.
- Do not ship debug builds.
- Do not bump one version file and forget the others.
- Do not change the package id without a data migration.
- Do not add 190 MB of decorative assets to match Sluka.
- Do not remove the offline dictionary packs without a replacement.
- Do not rely on `Intl.Segmenter('zh')`; Android WebView splits Han characters.

---

## 10. Suggested ownership split

### Grok 4.7 — engineering

- localization catalog + regression test
- first-run sample path
- review messaging/empty state
- settings scroll/render fix
- OCR model download manager + APK slimming
- ABI splits / App Bundle
- release key and CI
- test matrix automation

### Claude — product/design

- typography and casing system
- empty-state system
- review card and session summary
- onboarding → first-success flow
- accessibility and contrast
- physical-device visual QA
- final screenshot set for the site

### Shared

- sign-off on §0 and §8
- final version, checksum, site publish

---

## 11. Bottom line

The hard parts are already built. Shoresh’s remaining work is **finish**, not invention:

1. stop mixing languages
2. give the first session a destination
3. make review legible
4. make Settings visually trustworthy
5. shrink the APK without removing capability
6. release it like a real product

Do those and it is a credible finished 2.0.
