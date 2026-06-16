#!/usr/bin/env python3
"""Exécute work/final-edit.json avec ffmpeg : coupe chaque clip puis concatène.
Sortie : media/output/<project>-cut.mp4
Usage : python3 scripts/cut.py [work/final-edit.json]
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
edl_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "work", "final-edit.json")

with open(edl_path) as f:
    edl = json.load(f)

out_dir = os.path.join(ROOT, "media", "output")
os.makedirs(out_dir, exist_ok=True)

segments = []
idx = 0
for scene in edl["scenes"]:
    for clip in scene["clips"]:
        src = os.path.join(ROOT, clip["source"])
        seg = os.path.join(out_dir, f"seg{idx:03d}.mp4")
        print(f"▶ {scene['name']}: {clip['clip']}  [{clip['start']}→{clip['end']}]")
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(clip["start"]), "-to", str(clip["end"]),
            "-i", src, "-c:v", "libx264", "-crf", "16", "-preset", "slow",
            "-c:a", "aac", "-b:a", "256k", seg
        ], check=True)
        segments.append(seg)
        idx += 1

# concat
with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, dir=out_dir) as cf:
    for s in segments:
        cf.write(f"file '{s}'\n")
    concat_list = cf.name

final = os.path.join(out_dir, f"{edl.get('project','project')}-cut.mp4")
subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list, "-c", "copy", final], check=True)
os.remove(concat_list)
print(f"\n✅ Montage : {final}")
