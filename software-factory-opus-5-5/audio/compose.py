"""Original ambient score, synthesized from scratch and locked to the video's scene cues.

    python3 audio/compose.py            # reads dist/cues.json + audio/score.json -> dist/score.wav

Layers: warm additive pads, sub bass, felt-piano arpeggios, a soft "factory" pulse,
air swells into scene changes, gentle low booms on reveals, all through a synthetic hall reverb.
Chord changes snap to a global 72 BPM grid so the music breathes with the edits.
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
BPM = 72.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(1969)  # the year of the first software factory

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def m(name):
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in '#b' else (name[0], name[1:])
    return 12 * (int(o) + 1) + NOTE[p]


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# bass, pad voicing, arpeggio tones (D major / B minor world)
CHORDS = {
    'D':     ('D2',  ['A3', 'D4', 'F#4', 'A4'],        ['D4', 'F#4', 'A4', 'D5', 'E5']),
    'Dmaj9': ('D2',  ['A3', 'C#4', 'E4', 'F#4'],       ['F#4', 'A4', 'C#5', 'E5', 'D5']),
    'Dadd9': ('D2',  ['A3', 'D4', 'E4', 'F#4'],        ['D4', 'E4', 'F#4', 'A4', 'D5']),
    'D/F#':  ('F#1', ['A3', 'D4', 'F#4', 'A4'],        ['D4', 'F#4', 'A4', 'D5']),
    'A':     ('A1',  ['E3', 'A3', 'C#4', 'E4'],        ['A3', 'C#4', 'E4', 'A4', 'B4']),
    'Asus':  ('A1',  ['E3', 'A3', 'D4', 'E4'],         ['A3', 'D4', 'E4', 'A4', 'B4']),
    'A/C#':  ('C#2', ['E3', 'A3', 'C#4', 'E4'],        ['C#4', 'E4', 'A4', 'C#5']),
    'Bm':    ('B1',  ['F#3', 'B3', 'D4', 'F#4'],       ['B3', 'D4', 'F#4', 'B4', 'C#5']),
    'Bm9':   ('B1',  ['F#3', 'A3', 'C#4', 'D4'],       ['B3', 'D4', 'F#4', 'A4', 'C#5']),
    'Bm7':   ('B1',  ['F#3', 'A3', 'B3', 'D4'],        ['B3', 'D4', 'F#4', 'A4']),
    'G':     ('G1',  ['D3', 'G3', 'B3', 'D4'],         ['G3', 'B3', 'D4', 'G4', 'A4']),
    'Gmaj7': ('G1',  ['D3', 'F#3', 'B3', 'D4'],        ['B3', 'D4', 'F#4', 'G4', 'B4']),
    'Gmaj9': ('G1',  ['F#3', 'A3', 'B3', 'D4'],        ['B3', 'D4', 'F#4', 'A4', 'B4']),
    'Em9':   ('E2',  ['G3', 'B3', 'D4', 'F#4'],        ['E4', 'G4', 'B4', 'D5', 'F#5']),
    'Em7':   ('E2',  ['G3', 'B3', 'D4', 'E4'],         ['E4', 'G4', 'B4', 'D5']),
    'F#m':   ('F#1', ['F#3', 'A3', 'C#4', 'E4'],       ['F#4', 'A4', 'C#5', 'E5']),
    'F#m7':  ('F#1', ['E3', 'A3', 'C#4', 'F#4'],       ['F#4', 'A4', 'C#5', 'E5']),
}


def env_adsr(n, a, r, curve=2.0):
    """Sine-shaped attack/release envelope over n samples (a, r in seconds)."""
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na > 0:
        e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** curve
    if nr > 0:
        e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** curve
    return e


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def add(buf, start_s, sig):
    i = int(start_s * SR)
    if i >= len(buf):
        return
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def pad_note(f, dur, bright, a=2.6, r=3.2):
    n = int((dur + r) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    fc = 900 + 2600 * bright
    for v, (cents, pan) in enumerate([(-6, 0.15), (0, 0.5), (6.5, 0.85)]):
        fv = f * 2 ** (cents / 1200)
        lfo = 0.0028 * np.sin(2 * np.pi * (0.11 + 0.03 * v) * t + rng.uniform(0, 6.28))
        phase = 2 * np.pi * fv * t + 2 * np.pi * fv * np.cumsum(lfo) / SR
        s = np.zeros(n)
        for k in range(1, 11):
            fk = fv * k
            if fk > 9000:
                break
            amp = (1 / k ** (1.55 - 0.5 * bright)) / np.sqrt(1 + (fk / fc) ** 4)
            s += amp * np.sin(k * phase + rng.uniform(0, 6.28))
        out[:, 0] += s * np.cos(pan * np.pi / 2)
        out[:, 1] += s * np.sin(pan * np.pi / 2)
    breath = 1 + 0.08 * np.sin(2 * np.pi * 0.07 * t + rng.uniform(0, 6.28))
    return out * (env_adsr(n, a, r) * breath)[:, None]


def felt_key(f, vel, dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    B = 0.00012
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 7000:
            break
        a = vel * (0.9 ** (k - 1)) / k ** 0.9
        s += a * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * (1.1 + 0.55 * k))
    att = np.minimum(1, t / 0.006)
    hammer = lp(rng.normal(0, 1, n) * np.exp(-t * 90), 1800) * 0.05 * vel
    s = lp((s * att + hammer), 2600)
    return s


def thump(f, vel):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * np.minimum(1, t / 0.004)
    return s * vel


def tick(vel):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = bp(rng.normal(0, 1, n), 2500, 6500) * np.exp(-t * 60)
    return s * vel


def boom(vel=1.0):
    n = int(4.0 * SR)
    t = np.arange(n) / SR
    f = 46 + 40 * np.exp(-t * 3.5)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4) * np.minimum(1, t / 0.01)
    s += lp(rng.normal(0, 1, n), 220) * np.exp(-t * 3) * 0.35
    return s * vel


def swell(length=3.0):
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    noise = rng.normal(0, 1, (n, 2))
    lo = bp(noise, 300, 1400)
    hi = bp(noise, 1400, 5200)
    x = t ** 2.2
    s = lo * (1 - x)[:, None] * 0.5 + hi * x[:, None]
    e = (t ** 2.5) * np.cos(np.clip((t - 0.92) / 0.08, 0, 1) * np.pi / 2)
    return s * e[:, None]


def hall_ir(seconds=4.2, rt60=3.4):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.normal(0, 1, (n, 2))
    ir = lp(ir, 5200)
    dark = lp(ir, 1500)
    mix = np.clip(t / seconds, 0, 1)[:, None]
    ir = ir * (1 - mix) + dark * mix  # high frequencies die first
    ir *= np.exp(-6.91 * t / rt60)[:, None]
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir ** 2, axis=0))


def snap(t):
    return round(t / BEAT) * BEAT


def main():
    cues = json.loads((ROOT / 'dist/cues.json').read_text())
    score = json.loads((ROOT / 'audio/score.json').read_text())
    total = cues['duration'] + 6.0
    N = int(total * SR)
    pads, bass, keys, pulse, air, hits = (np.zeros((N, 2)) for _ in range(6))
    keys_m, pulse_m, bass_m, hits_m = np.zeros(N), np.zeros(N), np.zeros(N), np.zeros(N)

    default = {'chords': ['Bm9', 'Gmaj7'], 'energy': 0.3, 'bright': 0.4, 'keys': True, 'pulse': False, 'swell': False, 'chord_len': 6.7}
    scenes = cues['cues']
    events = []  # (start, end, chord, sc)
    for i, c in enumerate(scenes):
        sc = {**default, **score.get(c['id'], {})}
        a = 0.0 if i == 0 else snap(c['start'])
        b = cues['duration'] + 4.0 if i == len(scenes) - 1 else snap(scenes[i + 1]['start'])
        L = b - a
        k = max(1, round(L / sc['chord_len']))
        seq = [sc['chords'][j % len(sc['chords'])] for j in range(k)]
        for j, ch in enumerate(seq):
            events.append((a + j * L / k, a + (j + 1) * L / k, ch, sc, c))
        if sc.get('swell') and i > 0:
            add(air, c['start'] - 2.9, swell(3.0) * 0.05 * (0.6 + sc['energy']))
        for h in c.get('hits', []):
            add(hits_m, h - 0.02, boom(0.55))

    for (a, b, ch, sc, c) in events:
        bnote, voicing, arp = CHORDS[ch]
        dur = b - a
        for v in voicing:
            add(pads, a - 0.4, pad_note(hz(m(v)), dur + 0.4, sc['bright']) * (0.055 + 0.03 * sc['energy']))
        # Sub bass with soft second harmonic.
        n = int((dur + 2.5) * SR)
        t = np.arange(n) / SR
        fb = hz(m(bnote))
        sb = (np.sin(2 * np.pi * fb * t) + 0.25 * np.sin(4 * np.pi * fb * t)) * env_adsr(n, 1.8, 2.5)
        add(bass_m, a - 0.3, sb * (0.11 + 0.06 * sc['energy']) * sc.get('bass', 1.0))
        # Felt-piano arpeggio on the global beat grid.
        if sc['keys']:
            e = sc['energy']
            step = BEAT * (2 if e < 0.25 else 1 if e < 0.55 else 0.5)
            t0 = np.ceil(a / step) * step
            idx = rng.integers(len(arp))
            tt = t0
            while tt < b - 0.15:
                if rng.random() < (0.62 + 0.3 * e):
                    idx = int(np.clip(idx + rng.choice([-2, -1, 1, 1, 2]), 0, len(arp) - 1))
                    accent = 1.0 if abs((tt / BEAT) % 4) < 1e-6 else 0.78
                    vel = (0.055 + 0.05 * e) * accent * rng.uniform(0.75, 1.0) * sc.get('keys_gain', 1.0)
                    add(keys_m, tt + rng.normal(0, 0.006), felt_key(hz(m(arp[idx]) + (12 if sc.get('keys_up') else 0)), vel))
                tt += step
        if sc['pulse']:
            tt = np.ceil(a / BEAT) * BEAT
            while tt < b - 0.05:
                add(pulse_m, tt, thump(hz(m(bnote)) * 2, 0.10 * sc.get('pulse_gain', 1.0)))
                add(pulse_m, tt + BEAT / 2, tick(0.010 * sc.get('pulse_gain', 1.0)))
                add(pulse_m, tt, tick(0.006 * sc.get('pulse_gain', 1.0)))
                tt += BEAT

    def st(x, w=0.0):
        return np.stack([x * (1 - w), x * (1 + w)], axis=1) if x.ndim == 1 else x

    keys = st(keys_m)
    keys[:, 0] = np.roll(keys[:, 0], int(0.004 * SR))  # tiny Haas widening
    ir = hall_ir()
    print('reverb...', file=sys.stderr)
    wet_in = pads * 0.35 + keys * 1.9 + st(pulse_m) * 0.45 + air * 1.5
    wet = np.stack([fftconvolve(wet_in[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
    dry = pads * 0.47 + keys * 1.55 + st(pulse_m) * 1.6 + st(lp(bass_m, 180)) * 0.45 + air * 1.25 + st(lp(hits_m, 400)) * 0.55
    def db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    def pk(x):
        return 20 * np.log10(np.max(np.abs(x)) + 1e-12)
    for name, x in [('pads', pads * 0.47), ('keys', keys * 1.55), ('pulse', st(pulse_m) * 1.6), ('bass', st(lp(bass_m, 180)) * 0.45), ('air', air * 1.25), ('hits', st(lp(hits_m, 400)) * 0.55), ('wet', wet * 0.42)]:
        print(f'  {name:6s} rms {db(x):6.1f} dB  peak {pk(x):6.1f} dB', file=sys.stderr)
    mix = dry + wet * 0.42
    # Dynamic arc: per-scene master level (score.json "level"), ramped smoothly across scene changes.
    lvl = np.ones(N)
    pts = []
    for i, c in enumerate(scenes):
        sc = {**default, **score.get(c['id'], {})}
        pts.append((c['start'], sc.get('level', 0.85)))
    pts.append((cues['duration'] + 6.0, pts[-1][1]))
    tt = np.arange(N) / SR
    xs = []
    ys = []
    for (t0, v0), (t1, v1) in zip(pts[:-1], pts[1:]):
        xs += [t0 + 1.5, t1 - 0.5]
        ys += [v0, v0]
    lvl = np.interp(tt, xs, ys)
    mix *= lvl[:, None]
    mix = hp(mix, 28)
    # Fades + gentle saturation-limiter.
    fade = np.ones(N)
    fi, fo = int(2.5 * SR), int(5.0 * SR)
    end = int((cues['duration'] + 0.5) * SR)
    fade[:fi] = np.linspace(0, 1, fi) ** 2
    fade[end - fo:end] = np.linspace(1, 0, fo) ** 1.5
    fade[end:] = 0
    mix *= fade[:, None]
    mix /= np.max(np.abs(mix)) + 1e-9
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= 0.89
    out = ROOT / 'dist/score.wav'
    wavfile.write(out, SR, (mix[: int((cues['duration'] + 0.6) * SR)] * 32767).astype(np.int16))
    print(f'wrote {out} ({cues["duration"]:.1f}s)', file=sys.stderr)


if __name__ == '__main__':
    main()
