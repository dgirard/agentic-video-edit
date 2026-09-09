#!/usr/bin/env python3
"""Génère les overlays (bandeaux nom + société) de graphics/src/timings.json à partir de l'EDL.
Chaque clip de work/final-edit.json peut porter "lower": {"title": "...", "sub": "..."} ;
le bandeau apparaît 0.4 s (ou "lower_at" s si le clip le précise) après le début du clip dans la TIMELINE DE SORTIE et dure au plus
`hold` s (défaut 4.5), sans dépasser la fin du clip. Les clips consécutifs portant le même
bandeau (même orateur) n'en affichent qu'un.
Usage : python3 scripts/overlays_from_edl.py [work/final-edit.json] [hold]
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
edl_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "work", "final-edit.json")
HOLD = float(sys.argv[2]) if len(sys.argv) > 2 else 4.5
LEAD = 0.4

edl = json.load(open(edl_path))
W, H = (int(x) for x in edl.get("resolution", "1280x720").split("x"))
t, overlays, last_key = 0.0, [], None
for scene in edl["scenes"]:
    for clip in scene["clips"]:
        dur = float(clip["end"]) - float(clip["start"])
        tr = clip.get("transition") or {}
        if tr.get("type") == "dissolve":
            t -= float(tr.get("duration", 0.3))
        low = clip.get("lower")
        key = json.dumps(low, sort_keys=True) if low else None
        if low and key != last_key:
            lead = float(clip.get("lower_at", LEAD))
            end = min(t + dur - 0.3, t + lead + HOLD)
            overlays.append({"type": "lower", "start": round(t + lead, 2), "end": round(end, 2),
                             "title": low["title"], "sub": low["sub"]})
        last_key = key
        t += dur

tp = os.path.join(ROOT, "graphics", "src", "timings.json")
timings = json.load(open(tp)) if os.path.exists(tp) else {}
timings.setdefault("lower_margin_bottom", 56)  # px ; remonter si la source a un habillage chaîne en bas
timings.update({"_comment": "Généré par scripts/overlays_from_edl.py — temps en SORTIE de coupe. Local, non committé.",
                "video": "source.mp4", "fps": edl.get("fps", 25), "width": W, "height": H,
                "duration_s": round(t, 3), "overlays": overlays})
json.dump(timings, open(tp, "w"), ensure_ascii=False, indent=2)
print(f"✅ {len(overlays)} bandeaux → {tp}  (timeline {t:.2f}s)")
for o in overlays:
    print(f"   {o['start']:6.2f}→{o['end']:6.2f}  {o['title']} — {o['sub']}")
