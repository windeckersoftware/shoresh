#!/usr/bin/env python3
"""Build a compact Hebrew dictionary pack from Kaikki/Wiktionary + FrequencyWords.

Sources:
  - Kaikki.org Hebrew extract of English Wiktionary (CC BY-SA 3.0)
  - hermitdave/FrequencyWords Hebrew list (CC BY-SA 4.0)
Output is CC BY-SA 4.0; see THIRD-PARTY-NOTICES.md.
"""
import gzip, json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw"
OUT = ROOT / "data/packs/he.json.gz"

HEBREW = re.compile(r"[\u0590-\u05FF\uFB1D-\uFB4F]")
HEBREW_WORD = re.compile(r"^[\u0590-\u05FF\uFB1D-\uFB4F][\u0590-\u05FF\uFB1D-\uFB4F\u05B0-\u05C7\u05F3\u05F4]*$")
NIQQUD = re.compile(r"[\u0591-\u05AF\u05B0-\u05C7]")
SPACE = re.compile(r"\s+")

def strip_niqqud(s: str) -> str:
    s = unicodedata.normalize("NFC", s)
    s = NIQQUD.sub("", s)
    return s.replace("־", " ").strip()

def clean_gloss(g: str) -> str:
    g = re.sub(r"\([^)]*\)", "", g)
    g = SPACE.sub(" ", g).strip(" ,;:")
    return g

def main() -> None:
    freq = {}
    for i, line in enumerate((RAW / "he_50k.txt").read_text(encoding="utf-8").splitlines(), 1):
        parts = line.split()
        if parts:
            freq[strip_niqqud(parts[0])] = i

    entries = {}
    form_candidates = {}
    skipped = 0
    for line in (RAW / "kaikki-he.jsonl").read_text(encoding="utf-8").splitlines():
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            skipped += 1
            continue
        word = d.get("word", "")
        if not word or not HEBREW_WORD.match(word):
            continue
        key = strip_niqqud(word)
        if not key or " " in key:
            continue
        head = (d.get("head_templates") or [{}])[0]
        args = head.get("args") or {}
        display = args.get("wv") or word
        tr = args.get("tr") or ""
        if not tr:
            for s in d.get("sounds") or []:
                if s.get("tags") and "Modern-Israeli" in s["tags"] and s.get("ipa"):
                    tr = s["ipa"].strip("/[]")
                    break
        glosses = []
        for sense in d.get("senses") or []:
            for g in sense.get("glosses") or []:
                g = clean_gloss(g)
                if g and g not in glosses and not g.startswith("Alternative form of"):
                    glosses.append(g)
        if not glosses:
            continue
        pos = d.get("pos", "")
        item = {
            "w": display,
            "tr": tr,
            "pos": pos,
            "g": glosses[:3],
        }
        if key in freq:
            item["rank"] = freq[key]
        if key in entries:
            old = entries[key]
            for g in item["g"]:
                if g not in old["g"] and len(old["g"]) < 5:
                    old["g"].append(g)
        else:
            entries[key] = item
        for f in d.get("forms") or []:
            form = f.get("form", "")
            if not form or not HEBREW_WORD.match(form):
                continue
            fk = strip_niqqud(form)
            if fk and " " not in fk and fk != key:
                form_candidates.setdefault(fk, []).append(key)

    # A word that has its own entry is never looked up as an inflection.
    # For competing inflections, prefer the most frequent lemma.
    forms = {}
    for fk, keys in form_candidates.items():
        if fk in entries:
            continue
        forms[fk] = min(keys, key=lambda k: (entries[k].get("rank", 10**9), len(k), k))

    pack = {
        "meta": {
            "id": "he",
            "name": "עברית",
            "nameEn": "Hebrew",
            "version": "1.0.0",
            "direction": "rtl",
            "sources": [
                "English Wiktionary via kaikki.org, CC BY-SA 3.0",
                "FrequencyWords by Hermit Dave, CC BY-SA 4.0",
            ],
        },
        "entries": entries,
        "forms": forms,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(pack, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    with gzip.open(OUT, "wb", compresslevel=9) as f:
        f.write(raw)
    print(f"entries={len(entries)} forms={len(forms)} skipped={skipped}")
    print(f"raw={len(raw)/1024/1024:.2f} MiB gzip={OUT.stat().st_size/1024/1024:.2f} MiB -> {OUT}")

if __name__ == "__main__":
    main()
