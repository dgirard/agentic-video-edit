#!/usr/bin/env python3
"""Affiche les mots horodatés d'un transcript (work/transcripts/*.json) dans une fenêtre,
ou cherche une expression. Sert à caler les in/out de l'EDL au mot près.
Usage : python3 scripts/words.py <transcript.json> <start_s> <end_s>
        python3 scripts/words.py <transcript.json> --find "business du token"
"""
import json, re, sys, unicodedata

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9 ]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))

tr = json.load(open(sys.argv[1]))
words = tr["words"]
if sys.argv[2] == "--find":
    q = norm(" ".join(sys.argv[3:])).split()
    toks = [norm(w["word"]) for w in words]
    for i in range(len(words) - len(q) + 1):
        if toks[i:i + len(q)] == q:
            print(f"{words[i]['start']:8.2f} → {words[i+len(q)-1]['end']:8.2f}  {' '.join(w['word'].strip() for w in words[i:i+len(q)])}")
    sys.exit()
a, b = float(sys.argv[2]), float(sys.argv[3])
prev = None
for w in words:
    if w["end"] < a or w["start"] > b:
        continue
    gap = f"  ⏸ {w['start']-prev:.2f}s" if prev is not None and w["start"] - prev > 0.4 else ""
    print(f"{w['start']:8.2f} {w['end']:8.2f}  {w['word'].strip()}{gap}")
    prev = w["end"]
