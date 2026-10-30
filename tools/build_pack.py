#!/usr/bin/env python3
"""Build a compact offline dictionary pack from a Kaikki JSONL stream + FrequencyWords.

Usage:
  python3 tools/build_pack.py --code es --name Spanish --native Español --freq es --max-rank 18000
Reads JSONL from stdin. Writes data/packs/<code>.json.gz and app/assets/dict/<code>.json.gz.
Sources: English Wiktionary (CC BY-SA 3.0) via kaikki.org; FrequencyWords (CC BY-SA 4.0).
"""
import argparse, gzip, json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARABIC_DIACRITICS = re.compile(r"[\u064B-\u065F\u0670\u06D6-\u06ED]")
HEBREW_MARKS = re.compile(r"[\u0591-\u05AF\u05B0-\u05C7]")
EDGE = re.compile(r"^[^\w\u0590-\u05FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\u0E00-\u0E7F]+|[^\w\u0590-\u05FF\u0600-\u06FF\u3040-\u30FF\u4E00-\u9FFF\u0E00-\u0E7F]+$", re.UNICODE)
SPACE = re.compile(r"\s+")
PAREN = re.compile(r"\([^)]*\)")

def norm(s: str) -> str:
    s = unicodedata.normalize("NFC", s or "").strip().lower()
    s = HEBREW_MARKS.sub("", s)
    s = ARABIC_DIACRITICS.sub("", s)
    s = EDGE.sub("", s)
    return SPACE.sub(" ", s).strip()

def clean_gloss(g: str) -> str:
    g = re.sub(r"<[^>]+>", "", g)
    g = PAREN.sub("", g)
    g = SPACE.sub(" ", g).strip(" ,;:")
    return g

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--native", required=True)
    ap.add_argument("--freq", required=True)
    ap.add_argument("--direction", default="ltr")
    ap.add_argument("--max-rank", type=int, default=18000)
    ap.add_argument("--max-entries", type=int, default=0)
    args = ap.parse_args()

    freq = {}
    if args.freq != "none":
        freq_path = ROOT / "data/freq" / f"{args.freq}_50k.txt"
        for i, line in enumerate(freq_path.read_text(encoding="utf-8").splitlines(), 1):
            if i > args.max_rank: break
            parts = line.split()
            if parts:
                k = norm(parts[0])
                if k and " " not in k:
                    freq[k] = i

    entries, forms = {}, {}
    total = kept = 0
    for line in sys.stdin:
        total += 1
        try:
            d = json.loads(line)
        except Exception:
            continue
        word = d.get("word", "")
        key = norm(word)
        if not key or " " in key or len(key) > 60:
            continue
        form_keys = []
        for f in d.get("forms") or []:
            fk = norm(f.get("form", ""))
            if fk and " " not in fk and fk != key:
                form_keys.append(fk)
        if args.freq == "none":
            ranks = [0]
            if args.max_entries and len(entries) >= args.max_entries:
                break
        else:
            ranks = [freq[key]] if key in freq else []
            ranks += [freq[fk] for fk in form_keys if fk in freq]
            if not ranks:
                continue
        glosses = []
        for sense in d.get("senses") or []:
            for g in sense.get("glosses") or []:
                g = clean_gloss(g)
                if g and g not in glosses and not g.lower().startswith("alternative form of"):
                    glosses.append(g)
        if not glosses:
            continue
        head = (d.get("head_templates") or [{}])[0]
        hargs = head.get("args") or {}
        display = hargs.get("wv") or word
        tr = hargs.get("tr") or ""
        if not tr:
            for s in d.get("sounds") or []:
                if s.get("ipa"):
                    tr = s["ipa"].strip("/[]")
                    break
        item = {"w": display, "tr": tr, "pos": d.get("pos", ""), "g": glosses[:4], "rank": min(ranks)}
        if key in entries:
            old = entries[key]
            for g in item["g"]:
                if g not in old["g"] and len(old["g"]) < 6:
                    old["g"].append(g)
            old["rank"] = min(old.get("rank", 10**9), item["rank"])
        else:
            entries[key] = item
            kept += 1
        for fk in form_keys:
            if fk in entries:
                continue
            prev = forms.get(fk)
            if prev is None or entries.get(prev, {}).get("rank", 10**9) > item["rank"]:
                forms[fk] = key

    forms = {fk: k for fk, k in forms.items() if fk not in entries}
    pack = {
        "meta": {
            "id": args.code, "name": args.native, "nameEn": args.name,
            "version": "1.0.0", "direction": args.direction,
            "sources": [
                "English Wiktionary via kaikki.org, CC BY-SA 3.0",
                "FrequencyWords by Hermit Dave, CC BY-SA 4.0",
            ],
        },
        "entries": entries, "forms": forms,
    }
    raw = json.dumps(pack, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    for out in [ROOT / "data/packs" / f"{args.code}.json.gz", ROOT / "app/assets/dict" / f"{args.code}.json.gz"]:
        out.parent.mkdir(parents=True, exist_ok=True)
        with gzip.open(out, "wb", compresslevel=9) as f:
            f.write(raw)
    print(f"{args.code}: read={total} entries={len(entries)} forms={len(forms)} raw={len(raw)/1048576:.2f}MiB gz={(ROOT/'data/packs'/f'{args.code}.json.gz').stat().st_size/1048576:.2f}MiB", file=sys.stderr)

if __name__ == "__main__":
    main()
