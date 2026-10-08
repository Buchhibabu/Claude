"""Trailer score arranger.

Reads the cue sheet exported by the engine (dist/cues.json: shots with a `music` field + timed sfx cues)
and renders a beat-locked score: music beds per section (drone / pad / pulse bass / string ostinato /
trailer drums with a subdivision ladder), one-shot trailer SFX, true-silence air pockets, music-bus
tricks (tape stop, stutter), sidechain ducking under impacts, and a mastered stereo mix at -14 LUFS / -1 dBTP.

    python3 audio/score.py dist/cues.json dist/score.wav [--stems]

Shot `music` field (every key optional):
    {section: 'cold'|'act1'|'act2'|'turn'|'act3'|'peak'|'end',
     bpm: 120, chord: 'Dm', energy: 0..1,
     layers: [...] (replace the section's layers) | add: [...] | drop: [...],
     div: 4|8|16|32 (drum subdivision for this shot; the ladder)}
Consecutive shots with the same section/bpm form one segment; layers are rendered per shot so they can
change on any cut (music cuts are hard, like the picture).
"""
import json
import sys
from functools import lru_cache

import numpy as np

sys.path.insert(0, __file__.rsplit('/', 1)[0])
import trailer_sfx as T  # noqa: E402

SR = T.SR

# ------------------------------------------------------------------ harmony (D minor world, D major at the end)
CHORDS = {  # bass root (midi) + upper voicing (midi)
    'Dm': (38, (50, 57, 62, 65, 69)),
    'Bb': (34, (46, 53, 58, 62, 65)),
    'Gm': (31, (43, 50, 55, 58, 62)),
    'F': (41, (53, 57, 60, 65, 69)),
    'C': (36, (48, 55, 60, 64, 67)),
    'A': (33, (45, 52, 57, 61, 64)),
    'Am': (33, (45, 52, 57, 60, 64)),
    'Dsus': (38, (50, 57, 62, 67, 69)),
    'D': (38, (50, 57, 62, 66, 69)),
    'Bbmaj': (34, (46, 53, 58, 62, 69)),
}
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi_of(name):  # 'D1', 'A#1', 'Bb0'
    n = NOTE[name[0].upper()]
    rest = name[1:]
    if rest[:1] in ('#', 'b'):
        n += 1 if rest[0] == '#' else -1
        rest = rest[1:]
    return n + 12 * (int(rest) + 1)


SECTIONS = {  # default layers + energy per section
    'cold': dict(layers=['drone'], energy=0.35),
    'act1': dict(layers=['drone', 'pulse', 'kick'], energy=0.55, div=4),
    'act2': dict(layers=['drone', 'pulse', 'ostinato', 'drums'], energy=0.72, div=8),
    'turn': dict(layers=['pad', 'piano'], energy=0.35),
    'act3': dict(layers=['pulse', 'ostinato', 'drums', 'strings'], energy=0.9, div=8),
    'peak': dict(layers=['pulse', 'ostinato', 'drums', 'strings', 'drone'], energy=1.0, div=16),
    'end': dict(layers=['pad'], energy=0.35),
}
SECTION_DB = {  # loudness arc: each act must beat the previous one (Act II < Act III < peak)
    'cold': 0, 'act1': -1, 'act2': -5, 'turn': 0, 'act3': 1, 'peak': 3, 'end': 0,
}
LAYER_DB = {  # static balance of the music layers before energy scaling
    'drone': -13, 'pad': -12, 'pulse': -10, 'ostinato': -13, 'kick': -7, 'drums': -6,
    'strings': -15, 'motif': -12, 'piano': -9, 'hats': -20, 'heart': -8, 'ticks': -22, 'choir': -14,
}


# ------------------------------------------------------------------ cached one-shots
def _env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.exp(-t / d)


@lru_cache(None)
def kick(seed=1):
    t = T.tt(0.7)
    f = 42 + 110 * np.exp(-t / 0.03)
    body = T.sat(T.sine(f) * np.exp(-t / 0.28), 2.2)
    click = T.filt(np.random.default_rng(seed).standard_normal(len(t)), 'high', 3000) * np.exp(-t / 0.003) * 0.5
    return T.norm(T.st(body + click), -1)


@lru_cache(None)
def taiko(seed=2):
    """Big low drum: tom body + skin noise + hall. The 'epic trailer' downbeat."""
    rng = np.random.default_rng(seed)
    t = T.tt(2.2)
    f = 58 + 70 * np.exp(-t / 0.05)
    body = T.sat(T.sine(f) * np.exp(-t / 0.35), 2.5)
    skin = T.filt(rng.standard_normal(len(t)), 'band', [120, 900]) * np.exp(-t / 0.05) * 0.8
    knock = T.filt(rng.standard_normal(len(t)), 'band', [900, 3000]) * np.exp(-t / 0.01) * 0.35
    y = T.reverb(body + skin + knock, rt60=2.4, wet_db=-6, dark=1400)[:, :len(t)]
    return T.norm(y, -1)


@lru_cache(None)
def snare(seed=3):
    rng = np.random.default_rng(seed)
    t = T.tt(1.2)
    noise = T.filt(rng.standard_normal(len(t)), 'band', [400, 7000]) * np.exp(-t / 0.09)
    body = T.sine(185 + 60 * np.exp(-t / 0.01)) * np.exp(-t / 0.07) * 0.8
    y = T.reverb(T.sat(noise + body, 1.8), rt60=1.6, wet_db=-8, dark=3000)[:, :len(t)]
    return T.norm(y, -1)


@lru_cache(None)
def hat(seed=4):
    rng = np.random.default_rng(seed)
    t = T.tt(0.09)
    y = T.filt(rng.standard_normal(len(t)), 'high', 7000) * np.exp(-t / 0.015)
    return T.norm(T.st(y), -1)


@lru_cache(None)
def pulse_note(midi, accent=False, seed=9):
    """One 16th of the synth-bass ostinato (same voice as trailer_sfx.pulse_bass)."""
    rng = np.random.default_rng(seed + midi)
    d = T.tt(0.35)
    f = T.note_hz(midi)
    x = sum(T.polyblep_saw(np.full(len(d), f * 2 ** (c / 1200)), rng.random()) for c in (-7, 7)) / 2
    x += 0.6 * np.sign(T.sine(np.full(len(d), f / 2)))
    fc = 260 + (2600 if accent else 1500) * np.exp(-d / 0.05)
    x = T.tv_filter(x, fc, 'low', 1.4)
    x = T.sat(x * np.clip(d / 0.002, 0, 1) * np.exp(-d / 0.09), 2.0)
    return T.norm(T.st(x), -1)


@lru_cache(None)
def spiccato(midi, seed=21):
    """Short bowed-string note (ensemble of 4 detuned saws, fast filter envelope)."""
    rng = np.random.default_rng(seed + midi)
    d = T.tt(0.22)
    f = T.note_hz(midi)
    x = np.zeros((2, len(d)))
    for v in range(4):
        s = T.polyblep_saw(np.full(len(d), f * 2 ** (rng.uniform(-9, 9) / 1200)), rng.random())
        x += T.pan(s, rng.uniform(-0.7, 0.7)) / 4
    fc = 900 + 4200 * np.exp(-d / 0.035)
    x = np.vstack([T.tv_filter(x[c], fc, 'low', 0.9) for c in range(2)])
    x *= np.clip(d / 0.004, 0, 1) * np.exp(-d / 0.07)
    return T.norm(x, -1)


@lru_cache(None)
def braam_c(root='D1', dur=4.0):
    return T.braam(T.note_hz(midi_of(root)), dur=dur)


@lru_cache(None)
def impact_c(seed=2):
    return T.impact(seed=seed)


@lru_cache(None)
def whoosh_c(dur=0.8, seed=8):
    return T.whoosh(dur=dur, seed=seed)


@lru_cache(None)
def ping_c(midi=86):
    return T.piano_ping(midi)


@lru_cache(None)
def tick_c(tock=False):
    return T.tick(tock)


# ------------------------------------------------------------------ beds (rendered per shot span)
def drone(chord, dur, bright=600, seed=31):
    """Low saw stack + sub, gently moving filter (static sos, LFO via crossfaded two-band mix)."""
    rng = np.random.default_rng(seed)
    root, up = CHORDS[chord]
    t = T.tt(dur)
    x = np.zeros((2, len(t)))
    for m in (root, root + 12, up[1] - 12 if up[1] - 12 > root else up[1]):
        for v in range(3):
            s = T.polyblep_saw(np.full(len(t), T.note_hz(m) * 2 ** (rng.uniform(-12, 12) / 1200)), rng.random())
            x += T.pan(s, rng.uniform(-0.8, 0.8)) / 3
    lo = T.filt(x, 'low', bright * 0.6)
    hi = T.filt(x, 'low', bright * 1.6)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t + rng.uniform(0, 6))
    y = lo * (1 - lfo) + hi * lfo
    y += 0.5 * T.st(T.sat(T.sine(np.full(len(t), T.note_hz(root))), 1.4))
    return y


def pad(chord, dur, seed=41, bright=2400):
    rng = np.random.default_rng(seed)
    root, up = CHORDS[chord]
    t = T.tt(dur)
    x = np.zeros((2, len(t)))
    for m in up:
        for v in range(3):
            s = T.polyblep_saw(np.full(len(t), T.note_hz(m) * 2 ** (rng.uniform(-10, 10) / 1200)), rng.random())
            x += T.pan(s, rng.uniform(-0.9, 0.9)) / 3
    x = T.filt(x, 'low', bright)
    x += 0.4 * T.st(T.sine(np.full(len(t), T.note_hz(root + 12))))
    return T.reverb(x, rt60=4.0, wet_db=-6)[:, :len(t)]


def strings_sustain(chord, dur, seed=51, tremolo_hz=13.0):
    """Sustained high string ensemble (bowed tremolo, gentle 3 dB rise over the run; level comes from the run envelope)."""
    rng = np.random.default_rng(seed)
    _, up = CHORDS[chord]
    t = T.tt(dur)
    out = np.zeros((2, len(t)))
    for m in (x + 12 for x in up[1:]):
        for v in range(5):
            vib = 0.12 * np.sin(2 * np.pi * rng.uniform(4.8, 6.2) * t + rng.uniform(0, 6.3))
            f = T.note_hz(m) * 2 ** ((rng.uniform(-12, 12) / 100 + vib) / 12)
            out += T.pan(T.polyblep_saw(f, rng.random()), rng.uniform(-0.8, 0.8)) / 5
    out = T.filt(out, 'low', 5200)
    trem = 1 - 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * tremolo_hz * t))
    return out * trem * T.db(-3 + 3 * np.clip(t / max(dur, 1e-3), 0, 1))


@lru_cache(None)
def horn(midi, dur, seed=61):
    """Synth brass note for the hero motif: detuned saws + octave below, opening filter, delayed vibrato, hall."""
    rng = np.random.default_rng(seed + midi)
    t = T.tt(dur + 1.2)
    vib = 0.1 * np.clip((t - 0.25) / 0.3, 0, 1) * np.sin(2 * np.pi * 5.2 * t)
    x = np.zeros((2, len(t)))
    for c, g in ((-8, 1), (0, 1), (8, 1), (-1200, 0.6)):
        f = T.note_hz(midi) * 2 ** ((c / 100 + vib) / 12)
        x += T.pan(T.polyblep_saw(f, rng.random()), rng.uniform(-0.5, 0.5)) * g / 3.6
    fc = 450 + 2000 * np.clip(t / 0.14, 0, 1) * np.exp(-np.clip(t - 0.14, 0, None) / 1.2)
    x = np.vstack([T.tv_filter(x[c], fc, 'low', 0.9) for c in range(2)])
    amp = np.clip(t / 0.06, 0, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.15))
    y = T.reverb(T.sat(x * amp, 1.6), rt60=3.2, wet_db=-7, dark=2400)[:, :len(t)]
    return T.norm(y, -1)


MOTIF = [(0.0, 62, 1.5), (1.5, 65, 0.5), (2.0, 69, 2.0), (4.0, 67, 1.0), (5.0, 65, 1.0)]  # D F A G F over 8 beats


def grid(dur, bpm, steps_per_beat):
    step = 60 / bpm / steps_per_beat
    return [i * step for i in range(int(round(dur / step)))]


def render_shot_layers(bus, t0, dur, bpm, chord, layers, div, energy, seg_t0, shot_i, sec='act1'):
    """Render each music layer for one shot span [t0, t0+dur) into the per-layer stems in `bus`."""
    beat = 60 / bpm
    root, up = CHORDS[chord]
    g = lambda name: LAYER_DB.get(name, -12) + 20 * np.log10(max(energy, 0.05)) + SECTION_DB.get(sec, 0)  # noqa: E731
    # Every rhythmic layer sits on an absolute grid counted from the segment start (segments start on a
    # downbeat), so patterns keep their bar phase across cuts. steps(spb) -> [(i, rel)] grid points inside the shot.
    def steps(spb):
        st_ = beat / spb
        i = int(np.ceil((t0 - seg_t0) / st_ - 1e-6))
        out = []
        while seg_t0 + i * st_ < t0 + dur - 1e-6:
            out.append((i, seg_t0 + i * st_ - t0))
            i += 1
        return out

    def put(name, snd, rel, gain=0.0):
        T.place(bus.setdefault(name, np.zeros_like(bus['_'])), snd, t0 + rel, g(name) + gain)

    # drone / pad / strings are sustained: rendered per run of shots in arrange() (no chop at cuts)
    if 'motif' in layers:  # hero motif on the segment's 2-bar phrase grid; notes ring past the cut
        third = 66 if chord in ('D', 'Dsus') else 65
        for i, rel in steps(2):  # 8th-note grid; phrase = 16 eighths
            for mo, mn, ln in MOTIF:
                if i % 16 == int(round(mo * 2)):
                    mn = third if mn == 65 else mn
                    for mm, gg in ((mn, 0), (mn - 12, -5)):
                        put('motif', horn(mm, round(ln * beat, 3)), rel, gg)
    if 'pulse' in layers:  # 16ths, accented downbeats, octave jumps
        pat = 'x.xxx.xxx.xxx.xx' if energy > 0.8 else 'x..x..x.x..x..x.'
        for i, rel in steps(4):
            if pat[i % 16] == 'x':
                put('pulse', pulse_note(root + (12 if (i % 8 == 6 and energy > 0.7) else 0), i % 4 == 0), rel)
    if 'ostinato' in layers:  # spiccato strings: chord tones in a rolling 16th figure
        fig = [up[1], up[2], up[3], up[2], up[1], up[2], up[4], up[2]]
        for i, rel in steps(4):
            put('ostinato', spiccato(fig[i % 8] + 12), rel, 1 if i % 4 == 0 else -2)
    if 'piano' in layers:  # one ping per bar, falling minor line
        line = [86, 84, 81, 77]
        for i, rel in steps(1):
            if i % 4 == 0:
                put('piano', ping_c(line[(i // 4) % 4]), rel)
    if 'kick' in layers:  # quarters, taiko on the bar downbeat
        for i, rel in steps(1):
            put('kick', taiko() if i % 4 == 0 else kick(), rel, 0 if i % 4 == 0 else -3)
    if 'drums' in layers:  # trailer kit with the subdivision ladder (div = notes per bar: 4/8/16/32)
        spb = max(1, div // 4)
        for i, rel in steps(spb):
            pos = i % (4 * spb)
            if pos == 0:
                put('drums', taiko(), rel, 2)
            elif pos == 2 * spb:
                put('drums', snare(), rel, 0)
            elif i % spb == 0:
                put('drums', kick(), rel, -2)
            else:  # fills louden as the ladder climbs, but stay under the backbeat
                put('drums', snare() if div >= 16 else kick(), rel, -10 + 1.5 * np.log2(spb) - (3 if spb >= 8 else 0))
    if 'hats' in layers:
        for i, rel in steps(4):
            put('hats', hat(), rel, 0 if i % 2 else -4)
    if 'heart' in layers:
        for i, rel in steps(0.5):  # one lub-dub per 2 beats
            put('heart', T.heartbeat(bpm=bpm / 2, beats=1), rel)
    if 'ticks' in layers:
        for i, rel in steps(1):
            put('ticks', tick_c(i % 2 == 1), rel)


# ------------------------------------------------------------------ SFX one-shots
def sfx_sound(e, bus_music):
    k = e['kind']
    if k == 'impact':
        return impact_c(e.get('seed', 2)), 0.0, -4
    if k == 'braam':
        return braam_c(e.get('root', 'D1'), e.get('dur', 4.0)), 0.0, -3
    if k == 'sub_drop':
        return T.sub_drop(e.get('dur', 2.5)), 0.0, -5
    if k == 'boom':
        return taiko(), 0.0, -2
    if k == 'whoosh':
        d = e.get('dur', 0.8)
        return whoosh_c(d, e.get('seed', 8)), -0.62 * d, -10  # peak lands on the cue time
    if k == 'tick':
        return tick_c(e.get('tock', False)), 0.0, -14
    if k == 'bell':
        return ping_c(e.get('midi', 86)), 0.0, -8
    if k == 'heartbeat':
        return T.heartbeat(e.get('bpm', 70), e.get('beats', 4)), 0.0, -6
    if k == 'chirps':
        return T.data_chirps(e.get('n', 12), seed=e.get('seed', 12)), 0.0, -16
    if k == 'shimmer':
        return T.logo_shimmer(dur=e.get('dur', 6.0)), 0.0, -8
    if k == 'glitch':
        src = T.data_chirps(16, step_s=0.03125, seed=e.get('seed', 5))
        y = T.bitcrush(T.glitch_roll(src, 0.0, bpm=150, steps=(16, 32, 64), per=1), bits=5, hold=8)
        d = int(e.get('dur', 0.35) * SR)
        y = y[:, :d] * np.linspace(1, 0.3, min(d, y.shape[1]))
        return T.norm(y, -1), 0.0, -14
    if k == 'riser':  # noise riser + shepard + string swell, all ENDING at at+dur (hard cut)
        d = e['dur']
        r = T.noise_riser(d, bpm=e.get('bpm', 120)) * T.db(-2)
        sh = T.shepard(d + 1.0, rate=0.35)[:, -int(d * SR):] * T.db(-8)
        sw = T.string_swell(dur=d) * T.db(-6)
        y = r + sh + sw
        return T.norm(y, -1), 0.0, -6 + e.get('gain', 0)
    if k == 'reverse_swell':
        d = e['dur']
        return T.reverse_swell(impact_c(), length=d), 0.0, -8
    if k == 'roll':  # drum roll crescendo ending at at+dur, accelerating 8ths -> 32nds
        d = e['dur']
        bpm = e.get('bpm', 120)
        y = np.zeros((2, int((d + 1.5) * SR)))
        t, step = 0.0, 60 / bpm / 2
        while t < d - 1e-6:
            p = t / d
            T.place(y, snare() if p > 0.3 else taiko(), t, -18 + 18 * p ** 1.3)
            step = 60 / bpm / (2 if p < 0.4 else 4 if p < 0.7 else 8)
            t += step
        return T.norm(y, -1), 0.0, -6
    if k == 'sting':  # final logo sting: impact + braam + major shimmer
        y = impact_c(7).copy()
        b = braam_c(e.get('root', 'D1'), 3.0)
        y = np.pad(y, ((0, 0), (0, max(0, b.shape[1] - y.shape[1]))))
        y[:, :b.shape[1]] += 0.8 * b
        s = T.logo_shimmer(dur=6.0)
        y = np.pad(y, ((0, 0), (0, max(0, s.shape[1] - y.shape[1]))))
        y[:, :s.shape[1]] += 0.7 * s
        return T.norm(y, -1), 0.0, -2
    return None, 0.0, 0


# ------------------------------------------------------------------ loudness (ITU-R BS.1770-4)
def lufs(x):
    from scipy.signal import lfilter
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=1), axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    n = (y.shape[1] - blk) // hop + 1
    if n <= 0:
        return -70.0
    cs = np.cumsum(np.pad(y ** 2, ((0, 0), (1, 0))), axis=1)
    z = (cs[:, blk::hop][:, :n] - cs[:, 0:-blk:hop][:, :n]) / blk
    zs = z.sum(axis=0)
    lb = -0.691 + 10 * np.log10(zs + 1e-15)
    g = zs[lb > -70]
    if not len(g):
        return -70.0
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g2 = zs[(lb > -70) & (lb > rel)]
    return -0.691 + 10 * np.log10(g2.mean())


def short_term(x, win=3.0):
    """Short-term loudness every second (for the energy-curve report)."""
    out = []
    for s in np.arange(0, x.shape[1] / SR, 1.0):
        seg = x[:, int(s * SR):int((s + win) * SR)]
        out.append(lufs(seg) if seg.shape[1] > 0.5 * SR else -70)
    return out


def true_peak_db(x):
    from scipy.signal import resample_poly
    return 20 * np.log10(np.max(np.abs(resample_poly(x, 4, 1, axis=1))) + 1e-12)


def master(mix, target=-14.0, ceiling=-1.0):
    y = T.filt(mix, 'high', 28, 4)
    lo, hi = -12.0, 24.0
    for _ in range(14):  # bisection on pre-gain: soft clip + true-peak limiter, measure integrated loudness
        g = (lo + hi) / 2
        z = np.tanh(y * T.db(g) * 1.2) / 1.2
        z = T.limiter(z, ceiling - 0.2, look_ms=5, rel_ms=150)
        L = lufs(z)
        if L < target:
            lo = g
        else:
            hi = g
        if abs(L - target) < 0.1:
            break
    return z, L, g


# ------------------------------------------------------------------ arrange
def arrange(cues, stems_dir=None):
    dur = cues['duration'] + 0.5
    n = int(dur * SR)
    bus = {'_': np.zeros((2, n))}
    shots = cues['shots']
    default_bpm = cues.get('bpm', 120)

    # segments: runs of shots with identical section+bpm (beat phase resets at each segment start)
    seg_t0, prev = 0.0, None
    plan = []
    for i, s in enumerate(shots):
        m = s.get('music') or {}
        sec = m.get('section', prev[0] if prev else 'cold')
        sdef = SECTIONS.get(sec, SECTIONS['act1'])
        bpm = m.get('bpm', prev[1] if prev and prev[0] == sec else default_bpm)
        if prev is None or (sec, bpm) != prev[:2]:
            seg_t0 = s['start']
        layers = list(m['layers']) if 'layers' in m else list(sdef['layers'])
        layers = [l for l in dict.fromkeys(layers + m.get('add', [])) if l not in m.get('drop', [])]
        if (sec in ('act3', 'peak') and m.get('energy', sdef['energy']) >= 0.9 and 'drums' in layers) and 'motif' not in m.get('drop', []):
            layers.append('motif')
        chord = m.get('chord', prev[2] if prev else 'Dm')
        energy = m.get('energy', sdef['energy'])
        div = m.get('div', sdef.get('div', 8))
        plan.append((s, sec, bpm, chord, layers, div, energy, seg_t0))
        prev = (sec, bpm, chord)
    for i, (s, sec, bpm, chord, layers, div, energy, st0) in enumerate(plan):
        if layers:
            render_shot_layers(bus, s['start'], s['dur'], bpm, chord, layers, div, energy, st0, i, sec)
        print(f"  {s['start']:7.2f}s {s['id']:<22} {sec:<5} {bpm:>3} {chord:<5} div{div:<2} e{energy:.2f} {'+'.join(layers)}")

    # sustained layers: one continuous render per run of consecutive shots sharing the layer + chord;
    # level follows each shot's energy (40 ms ramps); chord changes crossfade over 30 ms (legato)
    SUS = {'drone': lambda ch, d, e, i: drone(ch, d, bright=500 + 700 * e, seed=31 + i),
           'pad': lambda ch, d, e, i: pad(ch, d, seed=41 + i),
           'strings': lambda ch, d, e, i: strings_sustain(ch, d, seed=51 + i)}
    xf = int(0.03 * SR)
    for name, gen in SUS.items():
        runs = []
        for (s, sec, bpm, chord, layers, div, energy, st0) in plan:
            if name not in layers:
                continue
            gdb = LAYER_DB[name] + 20 * np.log10(max(energy, 0.05)) + SECTION_DB.get(sec, 0)
            r = runs[-1] if runs else None
            if r and r['chord'] == chord and abs(r['t1'] - s['start']) < 1e-4:
                r['t1'] = s['start'] + s['dur']; r['pts'].append((s['start'], gdb))
            else:
                runs.append({'t0': s['start'], 't1': s['start'] + s['dur'], 'chord': chord, 'pts': [(s['start'], gdb)], 'e': energy})
        for ri, r in enumerate(runs):
            d = r['t1'] - r['t0'] + 0.03
            x = gen(r['chord'], d, r['e'], ri)[:, :int(d * SR)]
            n_ = x.shape[1]
            env = np.zeros(n_)
            tt_ = np.arange(n_) / SR + r['t0']
            for k, (ts, gdb) in enumerate(r['pts']):
                env[tt_ >= ts] = T.db(gdb)
            ramp = int(0.04 * SR)
            env = np.convolve(np.pad(env, (ramp, 0), mode='edge'), np.ones(ramp) / ramp, mode='valid')[:n_]
            fi = int((0.15 if name == 'pad' else 0.03) * SR) if (ri == 0 or runs[ri - 1]['t1'] < r['t0'] - 1e-4) else xf
            env[:fi] *= np.linspace(0, 1, fi)
            env[-xf:] *= np.linspace(1, 0, xf)
            T.place(bus.setdefault(name, np.zeros_like(bus['_'])), x * env, r['t0'])
        print(f'  {name}: {len(runs)} runs')

    music = sum(v for k, v in bus.items() if k != '_')
    sfx = np.zeros((2, n))
    events = sorted(cues['sfx'], key=lambda e: e['t'])
    silences = [(e['t'], e['t'] + e['dur']) for e in events if e['kind'] == 'silence']
    duck = np.ones(n)

    def gate_after(x, start):
        """Zero samples of a sound (placed at `start`) inside any silence window that begins after it."""
        for a, b in silences:
            if a >= start - 1e-6:
                i, j = int((a - start) * SR), int((b - start) * SR)
                if i < x.shape[1]:
                    f = min(int(0.004 * SR), x.shape[1] - i)
                    x[:, i:i + f] *= np.linspace(1, 0, f)
                    x[:, i + f:j] = 0
        return x

    for e in events:
        k = e['kind']
        if k == 'silence':
            continue
        if k == 'tape_stop':  # music bus winds down over dur, then nothing until the next music
            a, d = int(e['t'] * SR), int(e.get('dur', 0.6) * SR)
            seg = music[:, a:a + 2 * d].copy()
            music[:, a:a + d] = T.tape_stop(seg, e.get('dur', 0.6))[:, :min(d, n - a)]
            continue
        if k == 'stutter':  # music bus buffer-repeat roll (1/8 -> 1/64) over dur
            a, d = int(e['t'] * SR), int(e.get('dur', 1.0) * SR)
            r = T.glitch_roll(music[:, a:a + SR], 0.0, bpm=e.get('bpm', 120))[:, :d]
            music[:, a:a + r.shape[1]] = r
            continue
        snd, shift, base_db = sfx_sound(e, music)
        if snd is None:
            print('  ! unknown sfx kind', k)
            continue
        snd = snd.copy()
        if k in ('riser', 'reverse_swell', 'roll'):
            start = e['t'] + e['dur'] - snd.shape[1] / SR if k != 'roll' else e['t']
            if k == 'roll':
                snd = snd[:, :int(e['dur'] * SR)]
        else:
            start = e['t'] + shift
        if k in ('riser', 'reverse_swell', 'roll'):  # hard end, 3 ms declick
            f = int(0.003 * SR)
            snd[:, -f:] *= np.linspace(1, 0, f)
        snd = gate_after(snd, start)
        T.place(sfx, snd, start, base_db + e.get('gain', 0))
        big = e.get('gain', 0) >= -3
        if k in ('impact', 'braam', 'sting') and big and e.get('predip', True):  # pre-hit dip: music -8 dB over the last 1/8 note
            i = int(e['t'] * SR)
            L = int(0.25 * SR)
            a = max(0, i - L)
            duck[a:i] = np.minimum(duck[a:i], np.linspace(1, T.db(-8), i - a))
        if k in ('impact', 'braam', 'sting', 'boom', 'sub_drop'):  # sidechain duck of the music bed
            i = int(e['t'] * SR)
            L = int(0.6 * SR)
            depth_db = {'braam': -7, 'impact': -5, 'sting': -9, 'boom': -2.5, 'sub_drop': -2}[k] * T.db(min(0, e.get('gain', 0)))
            env = 1 - (1 - T.db(depth_db)) * np.exp(-np.arange(L) / (0.18 * SR))
            j = min(n, i + L)
            duck[i:j] = np.minimum(duck[i:j], env[:j - i])

    music *= duck
    for a, b in silences:  # true silence: the music bus is hard-muted (4 ms fades)
        i, j = int(a * SR), int(b * SR)
        f = int(0.004 * SR)
        music[:, i:i + f] *= np.linspace(1, 0, f)
        music[:, i + f:j] = 0
        if j + f < n:
            music[:, j:j + f] *= np.linspace(0, 1, f)
    mix = music * T.db(-3) + sfx
    if stems_dir:
        T.write_wav(f'{stems_dir}/stem_music.wav', T.norm(music, -3))
        T.write_wav(f'{stems_dir}/stem_sfx.wav', T.norm(sfx, -3))
    return mix


def main():
    cues_path, out = sys.argv[1], sys.argv[2]
    cues = json.load(open(cues_path))
    print(f"arranging {len(cues['shots'])} shots, {len(cues['sfx'])} cues, {cues['duration']:.2f}s")
    import os
    mix = arrange(cues, os.path.dirname(os.path.abspath(out)) if '--stems' in sys.argv else None)
    y, L, g = master(mix)
    y = y[:, :int(cues['duration'] * SR)]
    T.write_wav(out, y)
    st = short_term(y)
    print(f"master: {L:.2f} LUFS integrated, true peak {true_peak_db(y):.2f} dBTP, pre-gain {g:+.1f} dB")
    print('short-term LUFS per second:', ' '.join(f'{v:.0f}' for v in st))


if __name__ == '__main__':
    main()
