"""Build a cue sheet (same format the engine exports) straight from docs/shotlist.json, so the score can be
written and mixed before the picture exists.   python3 audio/cues_from_shotlist.py docs/shotlist.json dist/cues.shotlist.json"""
import json
import sys

d = json.load(open(sys.argv[1]))
shots, sfx = [], []
for s in d['shots']:
    m = dict(s.get('music') or {})
    m.setdefault('bpm', s.get('bpm', 120))
    shots.append({'id': s['id'], 'start': s['start'], 'dur': s['dur'], 'act': s['act'], 'music': m})
    for e in s.get('sfx', []):
        e = dict(e)
        e['t'] = round(s['start'] + e.pop('at'), 4)
        e['shot'] = s['id']
        sfx.append(e)
dur = shots[-1]['start'] + shots[-1]['dur']
json.dump({'duration': dur, 'bpm': 120, 'shots': shots, 'sfx': sfx}, open(sys.argv[2], 'w'), indent=1)
print(f'{len(shots)} shots, {len(sfx)} cues, {dur:.2f}s')
