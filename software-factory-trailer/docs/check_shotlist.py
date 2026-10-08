"""Validate docs/shotlist.json against the trailer rules (grid, contiguity, budgets, words, peak).

    python3 docs/check_shotlist.py [docs/shotlist.json]
"""
import json
import re
import sys
from collections import Counter

p = sys.argv[1] if len(sys.argv) > 1 else __file__.rsplit('/', 1)[0] + '/shotlist.json'
d = json.load(open(p))
d = d.get('final', d)
S = d['shots']
problems, notes = [], []
FPS = 30

t = 0.0
for s in S:
    if abs(s['start'] - t) > 1e-3:
        problems.append(f"#{s['n']} {s['id']}: start {s['start']} != expected {t:.3f} (gap/overlap)")
    beat = 60 / s.get('bpm', 120)
    # durations on the 8th-note grid of the shot's tempo (0.25 s at 120 BPM, 0.2 s at 150 BPM);
    # every cut then lands on a whole or half frame at 30 fps, never inside a motion-blur sample group
    q = s['dur'] / (beat / 2)
    if abs(q - round(q)) > 1e-3 or s['dur'] <= 0:
        problems.append(f"#{s['n']} {s['id']}: dur {s['dur']} not a positive multiple of an 8th note at {s.get('bpm')} BPM")
    if abs(s['start'] * 2 * FPS - round(s['start'] * 2 * FPS)) > 1e-3:
        problems.append(f"#{s['n']} {s['id']}: start {s['start']} not on a half-frame boundary")
    t = s['start'] + s['dur']
runtime = t
ids = Counter(s['id'] for s in S)
for k, v in ids.items():
    if v > 1:
        problems.append(f'duplicate id {k}')

words = 0
for s in S:
    txt = re.sub(r'<[^>]+>', ' ', s.get('text') or '')
    for card in re.split(r'\s*/\s*|\n', txt):
        n = len(card.split())
        if n > 7:
            problems.append(f"#{s['n']} {s['id']}: card has {n} words (>7): {card!r}")
    words += len(txt.split())

kinds = Counter()
fxk = Counter()
for s in S:
    for e in s.get('sfx', []):
        kinds[e['kind']] += 1
        if e['at'] > s['dur'] + 1e-6 or e['at'] < 0:
            problems.append(f"#{s['n']} {s['id']}: sfx {e['kind']} at {e['at']} outside shot")
    for e in s.get('fx', []):
        k = e['kind'] + (':' + e['tier'] if e.get('tier') else '')
        fxk[k] += 1
        if e['at'] > s['dur'] + 1e-6 or e['at'] < 0:
            problems.append(f"#{s['n']} {s['id']}: fx {k} at {e['at']} outside shot")
    m = s.get('music') or {}
    if not m.get('section') or not m.get('chord'):
        problems.append(f"#{s['n']} {s['id']}: music missing section/chord")

def budget(name, val, lo, hi):
    (problems if not (lo <= val <= hi) else notes).append(f'{name}: {val} (allowed {lo}-{hi})')

budget('runtime s', round(runtime, 2), 125, 145)
budget('shots', len(S), 100, 130)
budget('on-screen words', words, 0, 140)
budget('braams', kinds['braam'], 3, 5)
budget('silences', kinds['silence'], 0, 3)
budget('flashes', fxk['flash'], 0, 10)
budget('glitches (fx)', fxk['glitch'], 0, 6)
budget('S/A hits', fxk['hit:S'] + fxk['hit:A'], 0, 14)
for s in S:
    for e in s.get('sfx', []):
        if e['kind'] == 'silence' and not (0.4 - 1e-6 <= e.get('dur', 0) <= 1.0 + 1e-6):
            problems.append(f"#{s['n']} silence dur {e.get('dur')} outside 0.4-1.0 s")

# ASL per act
acts = {}
for s in S:
    acts.setdefault(s['act'], []).append(s['dur'])
notes.append('ASL by act: ' + ', '.join(f"{a} {sum(v)/len(v):.2f}s×{len(v)}" for a, v in acts.items()))
notes.append(f'sfx kinds: {dict(kinds)}')
notes.append(f'fx kinds: {dict(fxk)}')
print('\n'.join('  ' + n for n in notes))
print(f"{len(problems)} problems" + (':' if problems else ''))
print('\n'.join('  ! ' + x for x in problems))
sys.exit(1 if problems else 0)
