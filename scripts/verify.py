#!/usr/bin/env python3
"""Vérifie une coupe : re-transcrit media/output/<project>-cut.mp4 (ou le fichier passé)
et affiche le texte segment par segment, avec les hésitations détectées ("euh", mots répétés)
et les silences. L'agent compare le texte attendu (first_words de l'EDL) au texte entendu.
Usage : python3 scripts/verify.py [fichier.mp4] [lang] [model]
"""
import json, os, re, sys
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) > 1 and sys.argv[1].endswith((".mp4", ".mov", ".mkv", ".wav", ".mp3", ".m4a")):
    src = sys.argv[1]; rest = sys.argv[2:]
else:
    edl = json.load(open(os.path.join(ROOT, "work", "final-edit.json")))
    src = os.path.join(ROOT, "media", "output", f"{edl.get('project','project')}-cut.mp4"); rest = sys.argv[1:]
lang = rest[0] if rest else "fr"
model = rest[1] if len(rest) > 1 else "small"

m = WhisperModel(model, device="auto", compute_type="auto")
segments, info = m.transcribe(src, language=lang, word_timestamps=True)
words = [w for s in segments for w in (s.words or [])]
print(f"# {src}  ({len(words)} mots, modèle {model})\n")
text, issues, prev = [], [], None
for w in words:
    tok = w.word.strip()
    if prev is not None and w.start - prev.end > 1.0:
        issues.append(f"  silence {w.start - prev.end:.1f}s avant « {tok} » @ {w.start:.2f}s")
        text.append(f"\n[{w.start:6.2f}] ")
    if re.fullmatch(r"(euh|heu|hum|ben)[,.]?", tok.lower()):
        issues.append(f"  hésitation « {tok} » @ {w.start:.2f}s")
    if prev is not None and tok.lower().strip(",.") == prev.word.strip().lower().strip(",.") and len(tok) > 2:
        issues.append(f"  répétition « {tok} » @ {w.start:.2f}s")
    text.append(w.word)
    prev = w
print("".join(text).strip(), "\n")
print("Points d'attention :" if issues else "✅ Aucune hésitation ni silence > 1 s détecté.")
for i in issues:
    print(i)
