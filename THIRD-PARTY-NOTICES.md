# Third-party notices

Ner's application code is original. The following data and tools are used under their own licences.

## English Wiktionary — Hebrew entries

- Source: https://kaikki.org/dictionary/Hebrew/ (extract of English Wiktionary)
- Licence: Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- Used for: Hebrew lemmas, vocalisation, transliteration, part of speech, English glosses, inflected forms.
- Changes: filtered to Hebrew headwords, stripped wiki markup, merged duplicate headwords, added frequency ranks, compressed as JSON.

## Hebrew Wiktionary — Hebrew definitions

- Source: https://huggingface.co/datasets/OzLabs/hebrew-wiktionary-articles (export of he.wiktionary.org, 2024-09-01)
- Licence: CC BY-SA 3.0
- Used for: Hebrew-language definitions.
- Changes: extracted definition lines, removed templates/links/refs, normalised niqqud, merged by unvocalised headword.

## CC-CEDICT — Chinese and Cantonese packs

- Source: https://cc-cedict.org (MDBG export `cedict_1_0_ts_utf-8_mdbg.txt.gz`)
- Licence: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)
- Used for: Chinese headwords (simplified and traditional), pinyin and English glosses in `app/assets/dict/zh.json.gz` and `yue.json.gz`; their word list drives Chinese segmentation.
- Changes: tone numbers converted to tone marks, variant-only and rare proper-name entries dropped, glosses trimmed to three, ranked with FrequencyWords zh_cn. Built by `tools/build_zh_pack.py`.

## complete-hsk-vocabulary — HSK levels

- Source: https://github.com/drkameleon/complete-hsk-vocabulary (`complete.min.json`)
- Licence: MIT, Copyright (c) 2026 Yanis Zafirópulos (Dr.Kameleon)
- Used for: the HSK 3.0 level (1–6, and 7 for the 7–9 band) stored as `hsk` on entries of `app/assets/dict/zh.json.gz` and `yue.json.gz`.
- Changes: reduced to the lowest level per simplified word, 2026 syllabus first and the 2021 one for words it dropped. Built by `tools/build_zh_pack.py`.

## English Wiktionary — idioms, proverbs and sayings

- Source: https://kaikki.org (per-language `phrase`, `proverb`, `prep_phrase` entries and multi-word `verb`, `adv`, `adj`, `intj` headwords)
- Licence: CC BY-SA 3.0
- Used for: the phrase packs in `app/assets/dict/phrases/` (chengyu, proverbs, idioms, fixed expressions in 26 languages).
- Changes: normalised to match tokens, inflected forms pointed at their base phrase, generic two-word pairs dropped. Built by `tools/build_phrases.py`.

## FrequencyWords

- Source: https://github.com/hermitdave/FrequencyWords (`content/2018/he/he_50k.txt`)
- Licence: CC BY-SA 4.0
- Used for: frequency ranks and the 700-word starter list.
- Changes: normalised niqqud, intersected with dictionary lemmas.

## Tatoeba — Hebrew and French sentence patterns

- Source: https://tatoeba.org (per-language sentence and link exports, https://downloads.tatoeba.org/exports/)
- Licence: Creative Commons Attribution 2.0 France (CC BY 2.0 FR). Sentences are by Tatoeba contributors.
- Used for: every example sentence and every translation shown on the Sentence patterns screen for Hebrew and French, in `app/assets/www/patterns/he.js` and `fr.js` (142 Hebrew and 154 French patterns, 655 and 798 examples) and the source data in `data/patterns/he.json`, `fr.json`, `he-topics.json`.
- Attribution: the Tatoeba id of each sentence is kept in `i`, and the ids of its translations in `ti` (by language code); a sentence is at `https://tatoeba.org/sentences/show/<id>`. The Patterns screen credits Tatoeba for these two languages.
- Changes: sentences are unmodified; they were selected by regular expression, ranked by frequency and trimmed to the six shortest, best-translated examples per pattern. Built by `tools/build_patterns.py` and `tools/pack_patterns.py`.

## Hand-written sentence patterns (not from Tatoeba)

- Chinese (`zh`), Japanese (`ja`), Korean (`ko`), German (`de`), Spanish (`es`), Italian (`it`), Portuguese (`pt`), Russian (`ru`) and English (`en`) patterns in `app/assets/www/patterns/` come from `tools/authored_patterns/<lang>.py`.
- Written for Shoresh with the help of an AI assistant. The example sentences and their translations (English, and Hebrew and Hungarian for the English set) are not taken from a corpus and have **not been checked by native speakers**; the Patterns screen says so. They are part of the project and released with its code.
- Hebrew and French pattern names and English glosses are also written for Shoresh; only their example sentences are from Tatoeba.

## StevenBlack/hosts

- Source: https://github.com/StevenBlack/hosts
- Licence: MIT
- Used for: bundled ad/tracker host filter.
- Changes: extracted hostnames, added a small number of manual entries, gzip-compressed.

## Android SDK / OpenJDK

Build tooling only; not distributed as part of the APK. Android SDK terms apply to use of the SDK. OpenJDK is GPLv2 with Classpath Exception.

## Wiktionary share-alike

The dictionary pack (`app/assets/dict/he.json.gz`), the starter list (`app/assets/seed-he.json`, `app/assets/www/js/seed-he.js`) and any derived definition data are distributed under CC BY-SA 4.0 to the extent they incorporate the sources above. They are separable data, not part of the application source code.


## Tesseract4Android

- Source: https://github.com/adaptech-cz/Tesseract4Android (JitPack build 4.9.0)
- Licence: Apache License 2.0
- Used for: on-device OCR of scanned PDFs.
- Changes: none to the library; packaged as `app/libs/tesseract4android.jar` with its native `.so` files.

## Tesseract OCR / Leptonica / libjpeg / libpng

- Tesseract OCR 5.5.1, Leptonica 1.85.0, libjpeg v9f, libpng 1.6.48, via Tesseract4Android.
- Licences: Apache 2.0 (Tesseract), BSD-2-Clause (Leptonica), IJG (libjpeg), libpng licence.
- Used for: OCR engine and image processing.

## tessdata_fast

- Source: https://github.com/tesseract-ocr/tessdata_fast (`eng.traineddata`, `heb.traineddata`)
- Licence: Apache License 2.0
- Used for: OCR language models, copied into the app's private storage on first use.

## Hanzi Writer

- Source: https://github.com/chanind/hanzi-writer (npm `hanzi-writer` 3.7.3)
- Licence: MIT
- Used for: animated Chinese stroke order in the word sheet. Shipped unchanged as `app/assets/www/vendor/hanzi-writer.min.js`.

```
The MIT License (MIT)

Copyright (c) 2014 David Chanin

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Hanzi Writer data (Make Me a Hanzi)

- Source: https://github.com/chanind/hanzi-writer-data (npm `hanzi-writer-data` 2.0.1), derived from Make Me a Hanzi (https://github.com/skishore/makemeahanzi), whose stroke graphics come from Arphic's AR PL fonts.
- Licence: Arphic Public License. The licence text ships with the data as `app/assets/hanzi/ARPHICPL.TXT`.
- Used for: stroke shapes and order of 9,574 characters. `tools/fetch_hanzi.py` downloads the package at build time (pinned by checksum) and writes one file per character, renamed by code point and with whitespace removed; the stroke data itself is unchanged.

## pdf.js

- Source: https://github.com/mozilla/pdf.js (3.11.174)
- Licence: Apache License 2.0, Copyright 2023 Mozilla Foundation (notice kept at the top of `vendor/pdf.min.js` and `vendor/pdf.worker.min.js`)
- Used for: extracting text from PDFs.
