#!/usr/bin/env bash
# Full pipeline: picture (motion-blurred capture) -> score (from the exported cue sheet) -> mux -> small preview.
#   render/make.sh                  # final: glscale 0.75, blur 2
#   DRAFT=1 render/make.sh          # fast draft: glscale 0.5, blur 1
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
if [[ "${DRAFT:-0}" == "1" ]]; then export SF_QUERY="glscale=0.5"; BLUR=1; NAME=draft; else BLUR=2; NAME=software-factory-trailer; fi
node render/capture.mjs --fps 30 --blur "$BLUR" --workers 1 --out "dist/${NAME}_silent.mp4"
python3 audio/score.py dist/cues.json dist/score.wav
ffmpeg -y -loglevel error -i "dist/${NAME}_silent.mp4" -i dist/score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart "dist/${NAME}.mp4"
# Shareable preview under 30 MiB (720p, two-pass-free CRF with a bitrate cap).
ffmpeg -y -loglevel error -i "dist/${NAME}.mp4" -vf scale=1280:-2 -c:v libx264 -preset slow -crf 23 -maxrate 1500k -bufsize 3000k -c:a aac -b:a 160k -movflags +faststart "dist/${NAME}_preview.mp4"
ls -la dist/*.mp4
ffmpeg -hide_banner -i "dist/${NAME}.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -A3 "Integrated loudness" || true
