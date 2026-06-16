#!/usr/bin/env python3
"""Masque les jump-cuts d'une EDL avec un Ken Burns continu (zoom progressif) par clip.
Chaque clip part large (1.0) et pousse doucement jusqu'a <zoom> sur sa duree :
a chaque coupe l'image redevient large -> le mouvement permanent masque le saut.
Sortie : media/output/<project>-smooth.mp4
Usage : python3 scripts/smooth.py [work/final-edit.json] [zoom]
  zoom : facteur de zoom atteint en fin de chaque clip (defaut 1.10)
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
edl_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "work", "final-edit.json")
ZOOM = float(sys.argv[2]) if len(sys.argv) > 2 else 1.10

with open(edl_path) as f:
    edl = json.load(f)

W, H = (int(x) for x in edl.get("resolution", "1280x720").split("x"))
FPS = float(edl.get("fps", 30))
out_dir = os.path.join(ROOT, "media", "output")
os.makedirs(out_dir, exist_ok=True)

segments = []
idx = 0
for scene in edl["scenes"]:
    for clip in scene["clips"]:
        src = os.path.join(ROOT, clip["source"])
        seg = os.path.join(out_dir, f"sm{idx:03d}.mp4")
        dur = float(clip["end"]) - float(clip["start"])
        n = max(2, round(dur * FPS))   # nb de frames du clip
        # Ken Burns via zoompan : z(frame) = 1 -> ZOOM lineaire sur le clip, fenetre centree.
        # On sur-echantillonne x2 avant zoompan pour eviter le tremblement (pixel stepping).
        z = f"1+{ZOOM-1:.5f}*on/{n-1}"
        vf = (f"scale=2*iw:2*ih,"
              f"zoompan=z='{z}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
              f"s={W}x{H}:fps={FPS}")
        print(f"▶ clip {idx} [{clip['start']}→{clip['end']}]  Ken Burns 1.00→{ZOOM:.2f} sur {dur:.1f}s ({n}f)")
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(clip["start"]), "-to", str(clip["end"]),
            "-i", src, "-vf", vf, "-c:v", "libx264", "-crf", "16", "-preset", "slow",
            "-c:a", "aac", "-b:a", "256k", seg
        ], check=True)
        segments.append(seg)
        idx += 1

with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, dir=out_dir) as cf:
    for s in segments:
        cf.write(f"file '{s}'\n")
    concat_list = cf.name

final = os.path.join(out_dir, f"{edl.get('project','project')}-smooth.mp4")
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list, "-c", "copy", final], check=True)
os.remove(concat_list)
for s in segments:
    os.remove(s)
print(f"\n✅ Montage lissé : {final}")
