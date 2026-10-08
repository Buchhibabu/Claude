#!/usr/bin/env bash
# Final render in two halves (each is an independent capture), then concat, score, mux and a shareable preview.
#   nohup setsid render/final.sh > dist/final.log 2>&1 &
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
export SF_QUERY="glscale=0.75"
SPLIT=68
[[ -f dist/partA.mp4 ]] || node render/capture.mjs --fps 30 --blur 2 --workers 1 --to $SPLIT --out dist/partA.mp4
cp dist/cues.json dist/cues.final.json
[[ -f dist/partB.mp4 ]] || node render/capture.mjs --fps 30 --blur 2 --workers 1 --from $SPLIT --out dist/partB.mp4
printf "file '%s'\nfile '%s'\n" "$PWD/dist/partA.mp4" "$PWD/dist/partB.mp4" > dist/parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i dist/parts.txt -c copy dist/trailer_silent.mp4
python3 audio/score.py dist/cues.final.json dist/score.wav
ffmpeg -y -loglevel error -i dist/trailer_silent.mp4 -i dist/score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest -movflags +faststart dist/software-factory-trailer.mp4
ffmpeg -y -loglevel error -i dist/software-factory-trailer.mp4 -vf scale=1280:-2 -c:v libx264 -preset slow -crf 22 -maxrate 1600k -bufsize 3200k -c:a aac -b:a 160k -movflags +faststart dist/software-factory-trailer_preview.mp4
ls -la dist/*.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 dist/software-factory-trailer.mp4
ffmpeg -hide_banner -i dist/software-factory-trailer.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -A8 "Integrated loudness" || true
echo FINAL_DONE
