# agentic-video-edit — guide pour l'agent

Ce projet monte une vidéo **entièrement en pilotant des outils CLI** (ffmpeg, Whisper,
Remotion) — pas de logiciel de montage. Le principe directeur : **le montage est du texte**
(JSON, `.cube`, `.tsx`), donc l'agent peut le lire, le diff, le re-rendre et le vérifier.
Inspiré de la démo Claude Code « How Fable edited its own video ».

## Règles de partage (IMPORTANT)
Ce dépôt est destiné à être **public sur GitHub**. Ne jamais committer :
- `design-system/` — charte propriétaire (SFEIR), **privée**.
- `media/` — rushes sources et rendus.
- `work/transcripts/*.json`, `work/final-edit.json` — dérivés de la vidéo privée (contenu parlé).

Tout cela est déjà couvert par `.gitignore`. Les **exemples** committés vivent dans `examples/`.
Avant tout `git add`, vérifie `git status` : aucun fichier de ces zones ne doit apparaître.

## Pipeline
1. **Transcrire** : `./scripts/transcribe.sh fr medium` → `work/transcripts/*.json` (mots horodatés).
2. **Sélectionner & écrire l'EDL** : analyser les transcripts, choisir les meilleures prises,
   écrire `work/final-edit.json` (in/out + **justification écrite** par coupe). Voir `examples/final-edit.example.json`.
3. **Couper** : `python3 scripts/cut.py` → `media/output/<project>-cut.mp4` (ffmpeg).
4. **Vérifier** : re-transcrire la coupe et confirmer (zéro hésitation, coupes dans le silence).
5. **Étalonner** (option B) : écrire des LUTs `.cube` à la main, appliquer via ffmpeg `lut3d`,
   générer plusieurs variantes et laisser l'humain choisir.
6. **Graphismes** (option C) : reconstruire les visuels en composants Remotion (`graphics/src/`),
   un fichier de timings global, overlays calés sur le mot prononcé (grep des timestamps).
7. **Deck** : présentation HTML autonome dans `deck/`.

## Design system
Le deck et les graphismes lisent des **tokens CSS** : `--accent`, `--bg-dark`, `--bg-light`,
`--t1/2/3`, `--sans`, `--serif`, `--mono`. La charte réelle est dans `design-system/`
(privée) ; un gabarit public est dans `examples/tokens.example.css`.

## Outils
ffmpeg ✅ · Node ✅ · Python ✅. Whisper à installer : `pip install faster-whisper`.
Remotion : `cd graphics && npm i` quand on attaque les graphismes.
