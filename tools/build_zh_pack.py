#!/usr/bin/env python3
"""Build the Chinese (zh) and Cantonese (yue) dictionary packs from CC-CEDICT.

Usage:
  python3 tools/build_zh_pack.py

CC-CEDICT (CC BY-SA 4.0, https://cc-cedict.org) is downloaded to data/raw/ once.
Frequency ranks come from FrequencyWords zh_cn (CC BY-SA 4.0). The pack format
is the one Dict.java reads (entries + forms). zh is keyed by simplified
characters with traditional forms pointing at them; yue the other way round,
and without Mandarin pinyin, which would mislead a Cantonese reader.
"""
import gzip, json, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
RAW = ROOT / "data/raw/cedict_1_0_ts_utf-8_mdbg.txt.gz"
LINE = re.compile(r"^(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$")
SKIP = re.compile(r"^(old variant of|variant of|see [^ ]+$|see also|CL:|Japanese variant of|erroneous variant of|archaic variant of)", re.I)
TONES = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}


def tone_mark(syl):
    m = re.match(r"^([a-zü:]+?)([1-5])$", syl.lower().replace("u:", "ü"))
    if not m:
        return syl.replace("u:", "ü")
    base, tone = m.group(1), int(m.group(2))
    if tone == 5:
        return base
    for v in ("a", "e"):
        if v in base:
            return base.replace(v, TONES[v][tone - 1], 1)
    if "ou" in base:
        return base.replace("o", TONES["o"][tone - 1], 1)
    for i in range(len(base) - 1, -1, -1):
        if base[i] in TONES:
            return base[:i] + TONES[base[i]][tone - 1] + base[i + 1:]
    return base


def pinyin(numbered):
    return " ".join(tone_mark(s) for s in numbered.split())


def main():
    if not RAW.exists():
        RAW.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, RAW)
    freq = {}
    for i, line in enumerate((ROOT / "data/freq/zh_cn_50k.txt").read_text(encoding="utf-8").splitlines(), 1):
        parts = line.split()
        if parts and parts[0] not in freq:
            freq[parts[0]] = i

    words = {}  # simplified -> entry
    trad_of = {}
    for line in gzip.open(RAW, "rt", encoding="utf-8"):
        if line.startswith("#"):
            continue
        m = LINE.match(line.strip())
        if not m:
            continue
        trad, simp, py, defs = m.groups()
        glosses = [g.strip() for g in defs.split("/") if g.strip() and not SKIP.match(g.strip())]
        if not glosses:
            continue
        name = py[:1].isupper()  # proper nouns have capitalised pinyin
        e = words.get(simp)
        if e is None:
            words[simp] = e = {"w": simp, "tr": pinyin(py), "pos": "name" if name else "", "g": [], "name": name, "senses": len(glosses)}
            trad_of[simp] = trad
        elif e["name"] and not name:
            # Prefer the common-word reading over a surname or place name.
            e.update(tr=pinyin(py), pos="", name=False, senses=len(glosses))
            e["g"] = []
        elif not name and len(glosses) > e["senses"]:
            # Several readings (行 háng/xíng): show the one with the most senses first.
            e.update(tr=pinyin(py), senses=len(glosses))
            e["g"] = glosses[:3] + [g for g in e["g"] if g not in glosses]
        if name and not e["name"]:
            continue
        for g in glosses:
            if g not in e["g"] and len(e["g"]) < 5:
                e["g"].append(g)
        if any("(idiom)" in g for g in glosses):
            e["pos"] = "idiom"

    def rank(w):
        return freq.get(w, 60000 + len(w))

    for code, key_of, other_of, keep_tr in (
        ("zh", lambda s: s, lambda s: trad_of[s], True),
        ("yue", lambda s: trad_of[s], lambda s: s, False),
    ):
        entries, forms = {}, {}
        for simp, e in words.items():
            if e["name"] and rank(simp) >= 60000:
                continue  # rare proper names only bloat the pack
            key, other = key_of(simp), other_of(simp)
            item = {"w": key, "tr": e["tr"] if keep_tr else "", "pos": e["pos"], "g": [re.sub(r"\s*\(idiom\)\s*", " ", g).strip()[:140] for g in e["g"]][:3],
                    "rank": min(rank(simp), rank(trad_of[simp]))}
            if key in entries:
                old = entries[key]
                if item["rank"] < old["rank"]:
                    entries[key] = item
                continue
            entries[key] = item
            if other != key:
                forms.setdefault(other, key)
        forms = {f: k for f, k in forms.items() if f not in entries}
        pack = {"meta": {"id": code, "name": "中文" if code == "zh" else "粵語", "nameEn": "Chinese" if code == "zh" else "Cantonese",
                         "version": "2.0.0", "direction": "ltr",
                         "sources": ["CC-CEDICT, CC BY-SA 4.0", "FrequencyWords by Hermit Dave, CC BY-SA 4.0"]},
                "entries": entries, "forms": forms}
        raw = json.dumps(pack, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        for out in (ROOT / "data/packs" / f"{code}.json.gz", ROOT / "app/assets/dict" / f"{code}.json.gz"):
            out.parent.mkdir(parents=True, exist_ok=True)
            with gzip.open(out, "wb", compresslevel=9) as f:
                f.write(raw)
        print(f"{code}: entries={len(entries)} forms={len(forms)} raw={len(raw) / 1048576:.1f}MiB "
              f"gz={(ROOT / 'app/assets/dict' / f'{code}.json.gz').stat().st_size / 1048576:.1f}MiB")


if __name__ == "__main__":
    main()
