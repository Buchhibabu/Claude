#!/usr/bin/env bash
# Full build: frames -> silent video -> score locked to cues -> loudness-normalized mux.
#   ./render/build.sh            (1080p30, 3 workers)
#   WORKERS=4 ./render/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."
WORKERS="${WORKERS:-3}"
node render/capture.mjs --fps 30 --workers "$WORKERS" --out dist/video_silent.mp4
python3 audio/compose.py
ffmpeg -y -loglevel error -i dist/video_silent.mp4 -i dist/score.wav \
  -filter_complex "[1:a]loudnorm=I=-18:TP=-1.5:LRA=9,aformat=sample_rates=48000[a]" \
  -map 0:v -map "[a]" -c:v libx264 -preset slow -crf "${CRF:-18}" -tune animation -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  dist/software-factory-moment.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 dist/software-factory-moment.mp4
echo "done -> dist/software-factory-moment.mp4"
