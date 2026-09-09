---
title: "Caler une coupe au mot près : Whisper (±0,3 s) + niveau RMS + vignettes + test de sortie par transcription"
date: 2026-09-09
category: docs/solutions/workflow-patterns
module: video-pipeline
problem_type: workflow_pattern
component: tooling
severity: medium
applies_when:
  - "On monte un teaser / best-of à partir d'un plateau TV ou d'un enregistrement multi-orateurs"
  - "Un point de coupe tombe entre deux mots sans silence franc (orateurs qui s'enchaînent, musique de générique)"
  - "On dispose d'une diarisation (±5 s) et d'un transcript Whisper mot à mot"
tags: [whisper, faster-whisper, word-timestamps, rms, ffmpeg, silence, jump-cut, dissolve, lower-third, teaser, diarisation]
---

# Caler une coupe au mot près : Whisper + RMS + vignettes + test de sortie

## Context
Teaser de 107 s tiré d'une émission de 28 min (BFM 01 Business, 4 orateurs). La **diarisation**
(Gemini, ±5 s) sert à choisir *quoi* garder ; **Whisper medium** (`scripts/transcribe.sh`) donne
les mots horodatés pour placer *où* couper. Constat : les timestamps Whisper sont parfois
**décalés de 0,2 à 0,3 s** (le plus souvent en retard, parfois en avance), et il « oublie »
des interjections courtes (« Exactement ça » de l'animateur) — insuffisant seul pour une coupe propre.

## Guidance

**1. Choisir avec la diarisation, caler avec Whisper** — `scripts/words.py <transcript> <t0> <t1>`
affiche les mots d'une fenêtre avec les pauses (`⏸`), `--find "expression"` retrouve une phrase.

**2. Vérifier chaque in/out sur le niveau audio** (RMS par 100 ms, via PyAV/numpy ou ffmpeg s16le) :
la parole est à −22…−30 dB, un vrai creux est < −40 dB. Placer l'entrée ~0,1 s avant l'attaque
(dans le creux) et la sortie ~0,1 s après la chute. Un lit musical (générique) n'a pas de creux :
compter sur le micro-fondu audio de `cut.py` (30 ms).

```python
raw = subprocess.run(["ffmpeg","-v","error","-ss",t0,"-t",d,"-i",SRC,"-vn","-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32)/32768
rms_db = [20*np.log10(np.sqrt(np.mean(x[i:i+1600]**2))+1e-9) for i in range(0, len(x)-1600, 1600)]
```

**3. Regarder les vignettes aux points de coupe** (`ffmpeg -ss t -frames:v 1` + `tile=`) :
- la régie change souvent de plan *pendant* une pause → couper là donne un raccord naturel sans fondu ;
- deux gros plans identiques de part et d'autre d'une coupe (même orateur, même cadrage) → `"transition": {"type": "dissolve", "duration": 0.3}` sur le clip ;
- l'orateur n'est pas forcément à l'image (plans de réaction) → retarder le bandeau nom (`"lower_at"`) ou le poser sur le clip suivant, pour **ne jamais nommer quelqu'un sur le visage d'un autre** ;
- fin d'émission : l'habillage « Demain » réduit l'image bien avant le dernier mot → chercher une phrase de clôture plus tôt.

**4. Quand il n'y a aucun creux** (l'animateur enchaîne « …passé vite. J'aurais voulu… ») :
extraire 2–3 variantes de sortie à ±0,08 s depuis la source avec le fondu, transcrire chaque
variante (`small` suffit), garder la plus longue qui ne laisse pas entendre l'attaque du mot suivant.

**5. Vérifier le montage entier** : `python3 scripts/verify.py [fichier] fr small` re-transcrit et
signale hésitations, répétitions et silences > 1 s. Chaque clip doit commencer et finir sur les
mots attendus (`first_words` de l'EDL).

## Why it matters
Une coupe « à la Whisper » sans contrôle audio tronque une syllabe une fois sur cinq environ
sur un plateau où les orateurs se coupent la parole. Le trio RMS + vignettes + test par
transcription rend la coupe déterministe et **documentée dans l'EDL** (raison par coupe),
ce qui est le principe du projet : le montage est du texte, vérifiable.

## Related
- `scripts/cut.py` (micro-fondus audio, `transition.dissolve`), `scripts/overlays_from_edl.py` (`lower`, `lower_at`), `scripts/verify.py`, `scripts/words.py`.
- `docs/solutions/ui-bugs/source-rotation-metadata-forced-landscape.md` (sonder la source avant de fixer la résolution).
