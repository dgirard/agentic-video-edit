#!/usr/bin/env python3
"""Exécute work/final-edit.json avec ffmpeg : coupe chaque clip puis concatène.
Sortie : media/output/<project>-cut.mp4
Usage : python3 scripts/cut.py [work/final-edit.json]

Soin des raccords :
- chaque segment reçoit un micro-fondu audio (AFADE s) en entrée et en sortie -> pas de clic au raccord ;
- un clip peut porter "transition": {"type": "dissolve", "duration": 0.3} : il est alors fondu-enchaîné
  (xfade + acrossfade) avec le clip précédent — utile pour masquer un jump-cut chez le même orateur ;
- les segments sont encodés avec des paramètres identiques, la concat finale se fait sans ré-encodage.
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
edl_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "work", "final-edit.json")
AFADE = 0.03

with open(edl_path) as f:
    edl = json.load(f)

FPS = str(edl.get("fps", 25))
W, H = edl.get("resolution", "1280x720").split("x")
out_dir = os.path.join(ROOT, "media", "output")
os.makedirs(out_dir, exist_ok=True)
ENC = ["-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", FPS,
       "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2"]

def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE if False else None)

def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", path]).decode().strip())

# 1. segments
segs = []   # (path, transition_with_previous)
idx = 0
for scene in edl["scenes"]:
    for clip in scene["clips"]:
        src = os.path.join(ROOT, clip["source"])
        seg = os.path.join(out_dir, f"seg{idx:03d}.mp4")
        dur = float(clip["end"]) - float(clip["start"])
        print(f"▶ {scene['name']}: {clip['clip']}  [{clip['start']}→{clip['end']}]  {dur:.2f}s")
        af = f"afade=t=in:st=0:d={AFADE},afade=t=out:st={dur-AFADE:.3f}:d={AFADE}"
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(clip["start"]), "-to", str(clip["end"]),
             "-i", src, "-vf", f"scale={W}:{H}", "-af", af, *ENC, seg])
        segs.append((seg, clip.get("transition")))
        idx += 1

# 2. fondus-enchaînés : on regroupe les segments liés par un dissolve en "runs"
runs, cur = [], [segs[0]]
for s in segs[1:]:
    if s[1] and s[1].get("type") == "dissolve":
        cur.append(s)
    else:
        runs.append(cur); cur = [s]
runs.append(cur)

parts = []
for r_i, run_segs in enumerate(runs):
    if len(run_segs) == 1:
        parts.append(run_segs[0][0]); continue
    # chaîne xfade/acrossfade : offset cumulé = somme des durées - somme des fondus
    inputs, fc, total = [], [], 0.0
    for i, (p, tr) in enumerate(run_segs):
        inputs += ["-i", p]
    prev_v, prev_a = "[0:v]", "[0:a]"
    total = duration(run_segs[0][0])
    for i, (p, tr) in enumerate(run_segs[1:], start=1):
        d = float(tr.get("duration", 0.3))
        off = total - d
        fc.append(f"{prev_v}[{i}:v]xfade=transition=fade:duration={d}:offset={off:.3f}[v{i}]")
        fc.append(f"{prev_a}[{i}:a]acrossfade=d={d}[a{i}]")
        prev_v, prev_a = f"[v{i}]", f"[a{i}]"
        total = off + duration(p)
        print(f"   ↔ fondu {d}s avant {os.path.basename(p)}")
    out = os.path.join(out_dir, f"run{r_i:03d}.mp4")
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc),
         "-map", prev_v, "-map", prev_a, *ENC, out])
    parts.append(out)

# 3. concat sans ré-encodage
with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, dir=out_dir) as cf:
    for p in parts:
        cf.write(f"file '{p}'\n")
    concat_list = cf.name

final = os.path.join(out_dir, f"{edl.get('project','project')}-cut.mp4")
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
     "-c", "copy", "-movflags", "+faststart", final])
os.remove(concat_list)
for p in set(parts) | {s[0] for s in segs}:
    os.remove(p)
print(f"\n✅ Montage : {final}  ({duration(final):.2f}s)")
