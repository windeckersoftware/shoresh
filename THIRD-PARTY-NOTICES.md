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
