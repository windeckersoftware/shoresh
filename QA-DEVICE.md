# Device QA for 1.8.x (P0-2/3/4)

Run on a physical mid-range phone, release-signed APK, fresh install and upgrade-over-1.8.1.

## P0-2 Settings layout
- Open Settings in light and dark. Scroll top, middle, bottom. No row overlaps, "Local sync" fully visible, "Daily goal" appears once (under Reading).
- Go Languages -> back -> Settings repeatedly; leave scrolled halfway and re-enter: view starts at top.

## P0-3 Cold start
- `adb logcat -s NerBoot` after `adb shell am force-stop app.ner.reader && adb shell am start -W app.ner.reader/.MainActivity`.
- Marks: onCreate, webview-created, html-parsed, libs-loaded, app-start, rendered, first-usable-frame. Target first-usable-frame < 2-3 s.
- pdf.min.js, hanzi-writer.min.js and pinyin.js now load lazily: check a PDF import, stroke order on a Chinese word, and pinyin in a Chinese word card/reader still work (pinyin prefetches at idle for zh/yue learners).

## P0-4 Share / Drive / Brave
For each, cold (app force-stopped) and warm:
- Brave share sheet -> link; Brave share text selection; Brave Process Text on a word.
- Drive PDF and Drive EPUB -> Share to Shoresh (content URI; EXTRA_STREAM only).
- Two shares in a row within ~1 s: only the newest text opens, no crash, one MainActivity in `dumpsys activity activities`.
- App still appears in Recents after a share.

## Patterns and cloze (new)
- Home -> Sentence patterns in Hebrew and French: lists load, level chips filter, speaker plays the sentence in the right TTS voice, RTL Hebrew looks right, "Save as review card" then appears in Review.
- Switch to another language: friendly "available for Hebrew and French" message.
- Tap a word in a book, expand the sheet, "Save sentence as a cloze card": Review shows the blank, flips to the full sentence.
- Review header (`n new · n learning · n review`) does not wrap awkwardly on a narrow phone with the undo button showing.
- Patterns for zh/ja/ko/de/es/it/pt/ru: have a native speaker skim `tools/authored_patterns/<lang>.py` (sentences were composed by Claude, never reviewed). Open a sentence in a book, tap a word, expand: "Patterns in this sentence" chips appear; tap one -> all examples; Back returns to the text.
