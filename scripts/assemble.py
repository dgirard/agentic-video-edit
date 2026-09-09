#!/usr/bin/env python3
"""Assemble intro (Remotion) + montage avec overlays (Remotion) + carte de fin (Remotion).
Lit work/final-edit.json (project, fps, resolution) et graphics/src/timings.json (overlays).
Étapes : copie de la coupe dans graphics/public/source.mp4, extraction first/last-frame.png,
rendus Remotion (TeaserIntro, Overlay, TeaserEnd), concat ffmpeg (ré-encodage, audio silencieux
sur les cartes). Sortie : media/output/<project>-final.mp4
Usage : python3 scripts/assemble.py [--input media/output/x.mp4] [--intro TeaserIntro] [--end TeaserEnd]
"""
import argparse, json, os, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, "graphics")
PUB = os.path.join(G, "public")
OUT = os.path.join(G, "out")

ap = argparse.ArgumentParser()
ap.add_argument("--input", help="montage coupé (défaut : media/output/<project>-cut.mp4)")
ap.add_argument("--intro", default="TeaserIntro")
ap.add_argument("--end", default="TeaserEnd")
ap.add_argument("--overlay", default="Overlay")
a = ap.parse_args()

edl = json.load(open(os.path.join(ROOT, "work", "final-edit.json")))
project = edl.get("project", "project")
src = a.input or os.path.join(ROOT, "media", "output", f"{project}-cut.mp4")
os.makedirs(PUB, exist_ok=True); os.makedirs(OUT, exist_ok=True)

def sh(*cmd, **kw):
    print("$", " ".join(str(c) for c in cmd)); subprocess.run([str(c) for c in cmd], check=True, **kw)

# 1. source + frames figées
shutil.copyfile(src, os.path.join(PUB, "source.mp4"))
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                     "-of", "csv=p=0", src]).decode().strip())
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-frames:v", "1", "-update", "1", os.path.join(PUB, "first-frame.png"))
sh("ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, dur - 0.06):.3f}", "-i", src, "-frames:v", "1", "-update", "1",
   os.path.join(PUB, "last-frame.png"))

# 2. timings.json : la durée doit suivre la coupe (les overlays y sont calés par l'agent)
tp = os.path.join(G, "src", "timings.json")
t = json.load(open(tp)); t["video"] = "source.mp4"; t["duration_s"] = round(dur, 3)
json.dump(t, open(tp, "w"), ensure_ascii=False, indent=2)

# 3. rendus Remotion
parts = []
for comp in (a.intro, a.overlay, a.end):
    outf = os.path.join(OUT, f"{comp}.mp4")
    sh("npx", "remotion", "render", "src/index.ts", comp, outf, cwd=G)
    parts.append(outf)

# 4. concat (ré-encodage ; les cartes n'ont pas de piste audio -> anullsrc)
final = os.path.join(ROOT, "media", "output", f"{project}-final.mp4")
fc = ("[0:v][sil0][1:v][1:a][2:v][sil1]concat=n=3:v=1:a=1[v][a]")
sh("ffmpeg", "-v", "error", "-y",
   "-i", parts[0], "-i", parts[1], "-i", parts[2],
   "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
   "-filter_complex",
   "[3:a]atrim=0:{i}[sil0];[3:a]atrim=0:{e}[sil1];".format(
       i=json.load(open(os.path.join(G, "src", "teaser.json")))["intro_seconds"],
       e=json.load(open(os.path.join(G, "src", "teaser.json")))["end_seconds"]) + fc,
   "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
   "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", final)
print(f"\n✅ Final : {final}")
