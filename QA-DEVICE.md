# Device QA for 1.8.2 — what still needs a phone

Nothing in 1.8.2 has been run on Android: the cloud sessions that built it had no SDK or emulator. The JavaScript logic is covered by `node tools/check_patterns.js` and `node tools/check_review.js` and was exercised in headless Chromium with a stubbed bridge; everything below needs a real mid-range phone with the **release-signed** APK, as a fresh install and as an upgrade over 1.8.1 (vocabulary and review schedule must survive).

## Build and release
- `./build.sh` builds 1.8.2 (versionCode 123); About shows 1.8.2; the app label is "Shoresh"/"שורש".
- Release-signed with the real key (never commit the keystore); APK size (~98 MB before this release's data) and install over 1.8.1.

## Start-up (lazy loading)
- `adb logcat -s NerBoot` after `adb shell am force-stop app.ner.reader && adb shell am start -W app.ner.reader/.MainActivity`: marks onCreate, webview-created, html-parsed, libs-loaded, app-start, rendered, first-usable-frame. Target first-usable-frame under 2–3 s on a mid-range phone (not measured anywhere yet).
- A PDF import, stroke order on a Chinese word, and pinyin in a Chinese word card all still work (their libraries now load on first use).

## Settings layout
- Settings in light and dark, scrolled top/middle/bottom: no overlapping or ghosted rows, "Local sync" fully visible, "Daily goal" once. Re-entering Settings starts at the top.

## Share / Drive / Brave (cold and warm)
- Brave share sheet: link; share selected text; Process Text on a word.
- Drive PDF and Drive EPUB shared to Shoresh (content URI with the link only in `EXTRA_STREAM`); two shares within about a second (only the newest opens, one MainActivity in `dumpsys activity activities`); Shoresh still in Recents.

## Patterns and cloze
- Home → Sentence patterns in all 11 languages: lists load, level filter, "More examples", the speaker plays the sentence in the right TTS voice, Hebrew looks right in RTL, French/Hebrew names read naturally, the credit line says Tatoeba only for Hebrew and French. Settings → Licences shows the Tatoeba and hand-written-pattern notes.
- A **native speaker** should skim `tools/authored_patterns/<lang>.py` for zh, ja, ko, de, es, it, pt, ru and en: those sentences and translations were written by an AI assistant and never reviewed.
- Read a book, tap a word, expand: "Patterns in this sentence" chips; tap one, see all examples, Back returns to the same place in the text.
- "Save as review card" and "Save sentence as a cloze card": the card appears in Review, flips, grades 1–4/K/X, undo works; mark one K, save it again, it returns. Check the blank on a real RTL (Hebrew) and a Chinese sentence.

## Accessibility
- TalkBack: icon buttons are announced with translated names (try Hebrew, Arabic, English); the review announces the counts and then the answer; the word sheet is announced as a dialog; focus order is sensible.
- Touch targets feel right (44 px) on the Words list, Settings, reader bars and word sheet of a small phone; the reader bottom bar (← 1 2 3 4 I K →) fits a 360 px phone; **Aa stays on screen** in the top bar at 360 and 393 px.
- Contrast on a real screen in light, dark and every reader paper; word sheet direction in the Hebrew and Arabic UIs with a French/Chinese word.
- Review header (`n new · n learning · n review`) does not wrap awkwardly with the undo button showing.

## Watch (YouTube) — unchanged in 1.8.2, still unverified
- Settings, subtitle, quality and speed menus open above the caption panel; fullscreen; no Trusted Types errors.

## Known gaps
- `LinkSheet.java` (the in-app dictionary sheet) still takes its header direction from the system locale.
- Japanese readings are still IPA and Cantonese has none (see the data-pack notes in the release report).
