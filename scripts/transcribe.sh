#!/usr/bin/env bash
# Transcrit chaque rush de media/raw/ en JSON horodaté mot-à-mot dans work/transcripts/
# Dépendance : faster-whisper  (pip install faster-whisper)  ou  openai-whisper.
set -euo pipefail
cd "$(dirname "$0")/.."

LANG="${1:-fr}"          # langue (fr par défaut) : ./scripts/transcribe.sh en
MODEL="${2:-medium}"     # tiny|base|small|medium|large-v3

mkdir -p work/transcripts
shopt -s nullglob nocaseglob

for f in media/raw/*.{mp4,mov,mkv,wav,mp3}; do
  base="$(basename "${f%.*}")"
  out="work/transcripts/${base}.json"
  echo "▶ Transcription : $f → $out  (lang=$LANG, model=$MODEL)"
  python3 - "$f" "$out" "$LANG" "$MODEL" <<'PY'
import sys, json
from faster_whisper import WhisperModel
src, out, lang, model = sys.argv[1:5]
m = WhisperModel(model, device="auto", compute_type="auto")
segments, info = m.transcribe(src, language=lang, word_timestamps=True)
words = []
for seg in segments:
    for w in (seg.words or []):
        words.append({"word": w.word, "start": round(w.start,3), "end": round(w.end,3)})
json.dump({"source": src, "language": info.language, "words": words}, open(out,"w"), ensure_ascii=False, indent=2)
print(f"  {len(words)} mots écrits")
PY
done
echo "✅ Terminé."
