#!/usr/bin/env python3
"""Genere des LUTs 3D .cube (taille 33) calculees, dans luts/.
Trois ambiances : warm (chaud), teal-orange (cinema), punch (contraste+satur).
Le montage est du texte : ces .cube sont lisibles, diffables, versionnables.
Applique ensuite via ffmpeg :  ffmpeg -i in.mp4 -vf lut3d=luts/teal-orange.cube out.mp4
Usage : python3 scripts/make_luts.py
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LUT_DIR = os.path.join(ROOT, "luts")
os.makedirs(LUT_DIR, exist_ok=True)
N = 33

def clamp(x): return max(0.0, min(1.0, x))

def lerp(a, b, t): return a + (b - a) * t

def scurve(x, amount):
    # S-curve de contraste autour de 0.5 (smoothstep mixe avec l'identite)
    s = x * x * (3 - 2 * x)
    return clamp(lerp(x, s, amount))

def warm(r, g, b):
    r = clamp(r * 1.06 + 0.02)
    g = clamp(g * 1.01)
    b = clamp(b * 0.92)
    return r, g, b

def teal_orange(r, g, b):
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    # ombres -> teal (bleu/vert), hautes lumieres -> orange
    shadow = 1.0 - lum
    r = clamp(r + 0.06 * lum - 0.03 * shadow)
    g = clamp(g + 0.015 * lum + 0.015 * shadow)
    b = clamp(b - 0.05 * lum + 0.06 * shadow)
    return r, g, b

def punch(r, g, b):
    r, g, b = (scurve(c, 0.35) for c in (r, g, b))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = 1.18
    r = clamp(lum + (r - lum) * sat)
    g = clamp(lum + (g - lum) * sat)
    b = clamp(lum + (b - lum) * sat)
    return r, g, b

def sfeir(r, g, b):
    # Aligne sur la charte chaude/ocre : balance doree (R+, G~, B-), leger S-curve.
    r, g, b = (scurve(c, 0.18) for c in (r, g, b))
    r = clamp(r * 1.05 + 0.015)
    g = clamp(g * 1.015 + 0.005)
    b = clamp(b * 0.90)
    return r, g, b

GRADES = {"warm": warm, "teal-orange": teal_orange, "punch": punch, "sfeir": sfeir}

for name, fn in GRADES.items():
    path = os.path.join(LUT_DIR, f"{name}.cube")
    with open(path, "w") as f:
        f.write(f'TITLE "{name}"\n')
        f.write(f"LUT_3D_SIZE {N}\n")
        for bi in range(N):
            for gi in range(N):
                for ri in range(N):  # red varie le plus vite (format .cube)
                    r, g, b = fn(ri / (N - 1), gi / (N - 1), bi / (N - 1))
                    f.write(f"{r:.5f} {g:.5f} {b:.5f}\n")
    print(f"✅ {path}  (LUT_3D_SIZE {N})")
