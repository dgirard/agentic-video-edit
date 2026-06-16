# agentic-video-edit

Monter une vidéo de bout en bout en **pilotant des outils en ligne de commande**
(ffmpeg, Whisper, Remotion) plutôt qu'un logiciel de montage — l'« édit » est un
ensemble de **fichiers texte** versionnables, lisibles et re-rendables par un agent.

Inspiré de la démo Claude Code *« How Fable edited its own launch video »* —
la méthode d'origine est décrite ici :
[ThariqS/cc-video-editing-deck · index.html](https://github.com/ThariqS/cc-video-editing-deck/blob/main/index.html)
([rendu](https://raw.githack.com/ThariqS/cc-video-editing-deck/main/index.html)).

## Principe
> Le montage est du texte : `final-edit.json` (coupes + raisons), `.cube` (étalonnage),
> `.tsx` (graphismes). L'agent lit, diff, exécute et **vérifie son propre travail**.

## Démarrage
```bash
pip install faster-whisper          # transcription
# 1. déposer les rushes dans media/raw/
./scripts/transcribe.sh fr medium   # -> work/transcripts/*.json
# 2. écrire work/final-edit.json (cf. examples/final-edit.example.json)
python3 scripts/cut.py              # -> media/output/<project>-cut.mp4
```

## Structure
```
scripts/        pipeline (transcribe, cut, verify)
work/           EDL + transcripts générés         (contenu git-ignoré)
graphics/       projet Remotion (interludes animés)
deck/           présentation HTML autonome
examples/       gabarits committés (tokens, EDL)
design-system/  charte de marque                  (PRIVÉ — git-ignoré)
media/          rushes + rendus                    (PRIVÉ — git-ignoré)
```

## Confidentialité
`design-system/`, `media/` et les artefacts dérivés de la vidéo (`work/transcripts/*.json`,
`work/final-edit.json`) **ne sont pas versionnés** (voir `.gitignore`). Pour réutiliser
le projet avec ta propre charte, copie `examples/tokens.example.css` vers
`design-system/<marque>.tokens.css`.

## Prérequis
ffmpeg · Node ≥ 18 · Python ≥ 3.10 · `faster-whisper` (pip).
