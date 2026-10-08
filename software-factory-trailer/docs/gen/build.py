import json, re, sys
from collections import Counter, OrderedDict
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from head import TITLE, LOGLINE, WORLD, MOTIFS, MUSIC_PLAN, ACTS
from shared import SHARED
from shots_a import SHOTS_A
from shots_b import SHOTS_B
from shots_c import SHOTS_C

OUT = sys.argv[1] if len(sys.argv) > 1 else '/home/user/claude/software-factory-trailer/docs/shotlist.json'
shots = SHOTS_A + SHOTS_B + SHOTS_C

t = 0.0
for i, s in enumerate(shots, 1):
    s['n'] = i
    s['start'] = round(t, 3)
    t = round(t + s['dur'], 3)
runtime = round(t, 3)

# ---------------- audit ----------------
A = OrderedDict()
def note(k, v):
    A[k] = v

# words: checker-style tokens and honest words (no '/' separators)
tok = 0; honest = 0
for s in shots:
    txt = re.sub(r'<[^>]+>', ' ', s['text'] or '')
    tok += len(txt.split())
    honest += len([w for w in txt.split() if w != '/'])
note('words_checker_tokens', tok)
note('words_on_screen', honest)

# text time
tv = sum(s['_tv'] for s in shots)
note('text_seconds', round(tv, 2))
note('text_pct', round(100 * tv / runtime, 1))

# hold check (carry shots add to the previous read card)
holds = []
cur = None
for s in shots:
    if s['type'].startswith('CARRY') and cur is not None:
        cur[2] += s['_tv']
        continue
    if s['_read']:
        cur = [s['id'], s['_read'], s['_tv']]
        holds.append(cur)
    else:
        cur = None if not s['type'].startswith('CARRY') else cur
hold_fail = []
for sid, txt, vis in holds:
    need = len(txt) / 15 + 0.5
    if vis + 1e-6 < need:
        hold_fail.append(f'{sid}: {txt!r} visible {vis:.2f}s < {need:.2f}s')
note('hold_checks', f'{len(holds)} must-read cards checked, {len(hold_fail)} short' + (': ' + '; '.join(hold_fail) if hold_fail else ''))

# ASL
acts = OrderedDict()
for s in shots:
    acts.setdefault(s['act'], []).append(s['dur'])
asl = {a: sum(v) / len(v) for a, v in acts.items()}
note('asl', ', '.join(f"{a} {asl[a]:.3f}s x{len(v)} ({sum(v):.2f}s)" for a, v in acts.items()))
note('asl_III_vs_I', f"{asl['III']:.3f} < 0.6 x {asl['I']:.3f} = {0.6*asl['I']:.3f}: {asl['III'] < 0.6*asl['I']}")

# peak
pk0 = next(s for s in shots if s['id'] == 'p-line-flow')['start']
pk1e = next(s for s in shots if s['id'] == 'p-core-stutter')
pk1 = pk1e['start'] + pk1e['dur']
title = next(s for s in shots if s['id'] == 't-title')['start']
note('peak', f'{pk0:.1f}-{pk1:.1f} s = {100*pk0/runtime:.1f}%-{100*pk1/runtime:.1f}% of {runtime} s; title at {100*title/runtime:.1f}%')

# risers end on a hit or a silence
hits_at = set(); sil_at = set()
for s in shots:
    for e in s['fx']:
        if e['kind'] == 'hit':
            hits_at.add(round(s['start'] + e['at'], 3))
    for e in s['sfx']:
        a = round(s['start'] + e['at'], 3)
        if e['kind'] in ('impact', 'braam', 'boom', 'sub_drop', 'sting'):
            hits_at.add(a)
        if e['kind'] == 'silence':
            sil_at.add(a)
rcheck = []
for s in shots:
    for e in s['sfx']:
        if e['kind'] in ('riser', 'reverse_swell'):
            end = round(s['start'] + e['at'] + e['dur'], 3)
            ok = end in hits_at or end in sil_at
            rcheck.append(f"{s['id']} {e['kind']} {s['start']+e['at']:.2f}->{end:.2f} {'hit' if end in hits_at else ('silence' if end in sil_at else 'MISSING')}")
note('risers', rcheck)

# budgets
k = Counter(); f = Counter()
for s in shots:
    for e in s['sfx']:
        k[e['kind']] += 1
    for e in s['fx']:
        f[e['kind'] + (':' + e['tier'] if e.get('tier') else '')] += 1
note('braams', [f"{s['start']+e['at']:.1f}" for s in shots for e in s['sfx'] if e['kind'] == 'braam'])
note('silences', [f"{s['start']+e['at']:.1f}+{e['dur']}" for s in shots for e in s['sfx'] if e['kind'] == 'silence'])
note('flashes', f['flash']); note('glitch_fx', f['glitch']); note('SA_hits', f['hit:S'] + f['hit:A'])
note('shots', len(shots)); note('runtime', runtime)

# shared usage (mirrors)
use = {}
for s in shots:
    for n in s['shared']:
        use.setdefault(n, []).append(s['id'])
note('shared_usage', {n: v for n, v in use.items()})
unknown = [n for n in use if n not in {x['name'] for x in SHARED}]
note('unknown_shared', unknown)

# acts with computed bounds
acts_out = []
for code, name, purpose, grade, lb in ACTS:
    ss = [s for s in shots if s['act'] == code]
    acts_out.append(OrderedDict(name=name, code=code, start=ss[0]['start'], end=round(ss[-1]['start'] + ss[-1]['dur'], 3),
                                purpose=purpose, grade=grade, letterbox=lb))

KEYS = ['n', 'id', 'act', 'start', 'dur', 'bpm', 'camera', 'visual', 'text', 'type', 'fx', 'sfx', 'music', 'grade', 'motif', 'shared', 'transition']
shots_out = [OrderedDict((key, s[key]) for key in KEYS) for s in shots]

AUDIT = A
if __name__ == '__main__':
    import checks_text
    T = {s['id']: s['start'] for s in shots}
    fmt = lambda x: f'{x:.1f}'
    mp = MUSIC_PLAN.format(bank1=fmt(T['iii-bank-1']), bank8=fmt(T['iii-bank-8']), turn=fmt(T['iii-line-runs']),
        dip=fmt(T['iii-still']), lbs=fmt(T['iii-sweep']), five=fmt(T['iii-five-five']), hero=fmt(T['iii-foreman-hero']),
        teams=fmt(T['iii-teams-a']), stripe=fmt(T['iii-stripe']), peak0=fmt(T['p-line-flow']), tri1=fmt(T['p-tri-1']),
        tri2=fmt(T['p-tri-2']), tri3=fmt(T['p-tri-3']), sil3=fmt(T['t-false-stop']), title=fmt(T['t-title']),
        button=fmt(T['b-month-one']), month=fmt(T['b-month-one'] + 1.0), budget=fmt(T['b-projection'] + 0.5),
        stays=fmt(T['b-cursor-on'] + 1.5), end=fmt(runtime))
    doc = OrderedDict(title=TITLE, logline=LOGLINE, world=WORLD, motifs=MOTIFS, music_plan=mp, acts=acts_out,
                      shared=SHARED, shots=shots_out, runtime=runtime, checks=checks_text.render(A))
    json.dump(doc, open(OUT, 'w'), ensure_ascii=False, indent=1)
    for kk, vv in A.items():
        if kk != 'shared_usage':
            print(kk, ':', vv)
    print('wrote', OUT)
