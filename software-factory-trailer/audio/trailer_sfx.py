"""Trailer sound-design toolkit: pure numpy/scipy, no samples.
All generators return float arrays shaped (2, n) (stereo) at SR, peak-normalised
to about -1 dBFS unless noted.  Mixing/levels are done by the caller.
"""
import numpy as np
from scipy import signal as S

SR = 48000
FPS = 30
RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- utilities
def tt(dur):
    return np.arange(int(round(dur * SR))) / SR


def db(x):
    return 10.0 ** (x / 20.0)


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def norm(x, peak_db=-1.0):
    p = np.max(np.abs(x)) + 1e-12
    return x * (db(peak_db) / p)


def st(x):
    """mono -> stereo"""
    return np.vstack([x, x]) if x.ndim == 1 else x


def pink(n, rng=RNG):
    """Voss-free pink noise: white noise shaped by 1/sqrt(f) in the FFT domain."""
    w = rng.standard_normal(n)
    F = np.fft.rfft(w)
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    F /= np.sqrt(f)
    y = np.fft.irfft(F, n)
    return y / (np.std(y) + 1e-12)


def polyblep_saw(freq, phase0=0.0):
    """Band-limited (polyBLEP) saw; freq is an array in Hz (pitch envelopes allowed)."""
    dt = np.asarray(freq) / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1.0
    m = ph > 1.0 - dt
    t = (ph[m] - 1.0) / dt[m]
    y[m] -= t * t + t + t + 1.0
    return y


def sine(freq, phase0=0.0):
    return np.sin(phase0 + 2 * np.pi * np.cumsum(np.asarray(freq)) / SR)


def biquad(kind, f, q):
    """RBJ cookbook coefficients."""
    f = np.clip(f, 10.0, SR * 0.45)
    w = 2 * np.pi * f / SR
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if kind == "low":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
    elif kind == "high":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
    elif kind == "band":  # constant 0 dB peak gain
        b = [al, 0.0, -al]
    else:
        raise ValueError(kind)
    a = [1 + al, -2 * cw, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def tv_filter(x, fc, kind="low", q=0.707, block=32):
    """Time-varying biquad: coefficients updated every `block` samples, state carried.
    fc and q may be scalars or per-sample arrays."""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, float), (n,))
    q = np.broadcast_to(np.asarray(q, float), (n,))
    y = np.empty(n)
    zi = np.zeros(2)
    for i in range(0, n, block):
        b, a = biquad(kind, fc[i], q[i])
        y[i:i + block], zi = S.lfilter(b, a, x[i:i + block], zi=zi)
    return y


def sos(kind, f, order=2):
    btype = {"low": "lowpass", "high": "highpass", "band": "bandpass"}[kind]
    return S.butter(order, f, btype, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return S.sosfilt(sos(kind, f, order), x, axis=-1)


def sat(x, drive=3.0, bias=0.0):
    """tanh waveshaper; bias>0 adds even harmonics (tube-ish)."""
    return (np.tanh(drive * (x + bias)) - np.tanh(drive * bias)) / np.tanh(drive)


def reverb_ir(rt60=4.0, predelay=0.02, bright=9000, dark=1800, hpf=150, seed=3):
    """Synthetic stereo IR: exponentially decaying noise that darkens over time."""
    rng = np.random.default_rng(seed)
    n = int(rt60 * 1.1 * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.91 * t / rt60)
    raw = rng.standard_normal((2, n)) * env
    b = filt(raw, "low", bright)
    d = filt(raw, "low", dark)
    w = np.clip(t / (0.6 * rt60), 0, 1)
    ir = b * (1 - w) + d * w
    ir[:, : int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))  # soften onset
    ir = filt(ir, "high", hpf)  # keep sub out of the tail
    ir = np.pad(ir, ((0, 0), (int(predelay * SR), 0)))
    return ir / np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))


def reverb(x, rt60=4.0, wet_db=-8.0, **kw):
    x = st(x)
    ir = reverb_ir(rt60, **kw)
    wet = np.vstack([S.fftconvolve(x[c], ir[c]) for c in range(2)])
    out = np.zeros_like(wet)
    out[:, : x.shape[1]] += x
    return out + db(wet_db) * wet * 0.5


def pan(x, p):
    """equal-power pan; p in [-1, 1], scalar or per-sample array."""
    th = (np.asarray(p) + 1) * np.pi / 4
    return np.vstack([x * np.cos(th), x * np.sin(th)])


def place(bus, snd, t_sec, gain_db=0.0):
    """Add stereo `snd` into stereo `bus` starting at t_sec (frame-accurate if t = k/FPS)."""
    i = int(round(t_sec * SR))
    snd = st(snd)
    j = min(bus.shape[1], i + snd.shape[1])
    if j > i:
        bus[:, i:j] += db(gain_db) * snd[:, : j - i]


def place_end(bus, snd, t_end, gain_db=0.0):
    """Place so the sound ENDS exactly at t_end (risers, reverse swells, suckbacks)."""
    place(bus, snd, t_end - st(snd).shape[1] / SR, gain_db)


# ---------------------------------------------------------------- 1. BRAAM
def braam(f0=36.71, dur=4.0, fall_st=-2.0, growl_hz=31.0, seed=1):
    """Inception/2049-style low brass blast. f0 default D1."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    p = t / dur
    # pitch: 0.6 st scoop-up in the first ~120 ms, then a late quadratic droop
    pitch = -0.6 * np.exp(-t / 0.04) + fall_st * np.clip((p - 0.5) / 0.5, 0, 1) ** 2
    chans = []
    for c in range(2):  # decorrelated L/R voice stacks
        x = np.zeros(n)
        for mult, nv, spread, g in [(1, 7, 18, 1.0), (2, 5, 14, 0.55), (3, 3, 10, 0.25)]:
            for v in range(nv):
                cents = (v / (nv - 1) - 0.5) * 2 * spread + rng.normal(0, 2)
                drift = 1 + 0.0015 * np.sin(2 * np.pi * rng.uniform(0.1, 0.4) * t + rng.uniform(0, 6.3))
                f = f0 * mult * 2 ** ((pitch + cents / 100) / 12) * drift
                x += g * polyblep_saw(f, rng.random()) / nv
        x *= 1 + 0.22 * np.sin(2 * np.pi * growl_hz * t)  # flutter-tongue growl
        x = sat(x, 3.5, 0.1)  # pre-filter grit
        # filter env: 150 Hz -> 2600 Hz "blat" in ~80 ms, closing to ~450 Hz
        att = 150 * (2600 / 150) ** np.clip(t / 0.08, 0, 1)
        fc = np.where(t < 0.08, att, 750 + 1850 * np.exp(-(t - 0.08) / 0.9))
        x = tv_filter(x, fc, "low", q=1.1)
        x += 0.9 * sat(filt(x, "band", [420, 1400]), 2.5)  # brass formant / rasp (laptop-audible)
        chans.append(x)
    x = np.vstack(chans)
    sub = sine(f0 * 2 ** (pitch / 12)) * 0.35
    sub = sat(sub, 1.6)  # adds 3rd harmonic so laptops "hear" it
    breath = filt(pink(n, rng), "band", [500, 1800]) * np.exp(-t / 0.25) * 0.08
    amp = np.clip(t / 0.045, 0, 1) ** 1.5 * np.clip((dur - t) / (0.45 * dur), 0, 1) ** 1.3
    y = (x + sub + breath) * amp
    y = reverb(y, rt60=5.0, wet_db=-6, dark=1200)
    return norm(sat(norm(y, 0), 1.3), -1)


# ---------------------------------------------------------------- 2. HIT / IMPACT
def impact(dur=4.5, body_hz=(170, 48), sub_hz=(58, 28), metal_f=310.0, seed=2, tail_rt=4.5):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    click = filt(rng.standard_normal(n), "high", 2500) * np.exp(-t / 0.004) * 0.9
    fb = body_hz[1] + (body_hz[0] - body_hz[1]) * np.exp(-t / 0.035)
    body = sat(sine(fb) * np.exp(-t / 0.22), 3.0)
    fs_ = sub_hz[1] + (sub_hz[0] - sub_hz[1]) * np.exp(-t / 0.45)
    subb = sine(fs_) * np.clip(t / 0.003, 0, 1) * np.exp(-t / 0.9)
    crack = sat(filt(rng.standard_normal(n), "band", [900, 4500]) * np.exp(-t / 0.07), 4.0) * 0.5
    ratios = np.array([1, 2.32, 4.25, 6.63, 9.38])  # inharmonic plate-ish modes
    taus = np.array([1.3, 0.9, 0.6, 0.45, 0.3])
    metal = sum(np.sin(2 * np.pi * metal_f * r * t + rng.uniform(0, 6.3)) * np.exp(-t / tau) / (k + 1)
                for k, (r, tau) in enumerate(zip(ratios, taus))) * 0.25
    knock = filt(rng.standard_normal(n), "band", [100, 220]) * np.exp(-t / 0.05) * 0.8  # mid "knock" for phones
    dry_mid = click + body + crack + metal + knock
    mid = reverb(dry_mid, rt60=tail_rt, wet_db=-3, dark=1500)
    y = mid[:, :n] + st(subb)  # sub stays DRY and mono
    return norm(y, -1)


def sub_drop(dur=2.5, f=(80, 26)):
    t = tt(dur)
    fr = f[1] + (f[0] - f[1]) * np.exp(-t / (dur / 3.5))
    y = sine(fr) * np.clip(t / 0.004, 0, 1) * np.exp(-t / (dur / 2.2))
    y = sat(y, 1.8)  # harmonics for small-speaker translation
    return norm(st(y), -1)


# ---------------------------------------------------------------- 3. RISERS
def noise_riser(dur=8.0, f=(250, 9000), bpm=120, gated=True, seed=4):
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    p = t / dur
    fc = f[0] * (f[1] / f[0]) ** (p ** 1.6)
    q = 0.9 + 3.0 * p
    L = tv_filter(pink(n, rng), fc, "band", q)
    R = tv_filter(pink(n, rng), fc, "band", q)
    M = 0.5 * (L + R)
    width = p ** 1.5  # narrow -> wide
    x = np.vstack([M + width * (L - M), M + width * (R - M)])
    amp = db(-36 + 36 * p ** 2.2)
    if gated:  # rhythmic gate that doubles in rate: 1/4 -> 1/8 -> 1/16 -> 1/32
        beat = 60 / bpm
        div = np.select([p < 0.5, p < 0.75, p < 0.9], [1, 2, 4], 8)
        ph = np.cumsum(div / beat / SR) % 1.0
        gate = np.clip(1.0 - ph / 0.7, 0, 1) ** 0.6
        amp = amp * (0.35 + 0.65 * gate)
    return norm(x * amp, -1)


def shepard(dur=16.0, base=27.5, octaves=9, rate=0.125, harmonics=3, seed=5):
    """Shepard-Risset glissando. rate = octaves/second (0.06-0.15 bed, 0.25-0.5 final riser)."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    y = np.zeros(len(t))
    for k in range(octaves):
        pos = (k + rate * t) % octaves
        f = base * 2 ** pos
        a = 0.5 - 0.5 * np.cos(2 * np.pi * pos / octaves)  # 0 at both ends of the range
        ph0 = rng.uniform(0, 6.3)
        for h in range(1, harmonics + 1):
            y += a * (f * h < 0.45 * SR) * sine(f * h, ph0) / h ** 1.5  # mask partials above Nyquist margin
    y *= np.clip(t / 1.0, 0, 1)
    return norm(reverb(y, rt60=3.0, wet_db=-10), -1)


def string_swell(chord_midi=(50, 57, 62, 65, 69), dur=6.0, voices=6, seed=6, tremolo_hz=13.0):
    """Synth string ensemble crescendo with bowed tremolo; ends hard (cut at the hit)."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    p = t / dur
    out = np.zeros((2, n))
    for m in chord_midi:
        for v in range(voices):
            cents = rng.uniform(-14, 14)
            vib = 0.15 * np.sin(2 * np.pi * rng.uniform(4.8, 6.2) * t + rng.uniform(0, 6.3))  # semitones
            f = note_hz(m) * 2 ** ((cents / 100 + vib * p) / 12)
            x = polyblep_saw(f, rng.random())
            out += pan(x, rng.uniform(-0.8, 0.8)) / voices
    fc = 350 * (7000 / 350) ** (p ** 1.3)
    out = np.vstack([tv_filter(out[c], fc, "low", 0.8) for c in range(2)])
    trem = 1 - 0.45 * p ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * tremolo_hz * t))
    amp = db(-40 + 40 * p ** 1.8) * trem
    return norm(out * amp, -1)


# ---------------------------------------------------------------- 4. WHOOSH
def whoosh(dur=0.8, peak=0.62, f=(250, 3800), pan_lr=(-0.9, 0.9), seed=8):
    """Align the PEAK (dur*peak) to the cut frame, not the start."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    n = len(t)
    p = t / dur
    up = f[0] * (f[1] / f[0]) ** ((p / peak) ** 1.5)
    dn = f[1] * ((f[0] * 1.5) / f[1]) ** (np.clip((p - peak) / (1 - peak), 0, 1) ** 0.7)
    fc = np.where(p < peak, up, dn)
    air = tv_filter(pink(n, rng), fc, "band", 2.2)
    whistle = tv_filter(rng.standard_normal(n), fc * 1.6, "band", 12.0) * 0.25
    low = filt(filt(pink(n, rng), "low", 350), "high", 60) * 0.25
    env = np.where(p < peak, (p / peak) ** 3, np.exp(-(t - peak * dur) / 0.11))
    x = (air + whistle + low) * env
    pp = pan_lr[0] + (pan_lr[1] - pan_lr[0]) * np.clip((p - 0.2) / 0.6, 0, 1)
    y = pan(x, pp)
    # ITD: delay the far ear up to 0.5 ms (fractional via linear interp)
    d = 0.0005 * SR * pp
    idx = np.arange(n)
    y[0] = np.interp(idx - np.clip(d, 0, None), idx, y[0])
    y[1] = np.interp(idx - np.clip(-d, 0, None), idx, y[1])
    return norm(y, -1)


def reverse_swell(src, length=1.5, rt60=3.5):
    """Reverse reverb 'suckback': place with place_end() so it ends on the hit."""
    wet = reverb(src, rt60=rt60, wet_db=0)
    wet = wet - np.pad(st(src), ((0, 0), (0, wet.shape[1] - st(src).shape[1])))  # 100% wet
    r = wet[:, ::-1][:, -int(length * SR):]
    r *= np.linspace(0, 1, r.shape[1]) ** 2
    return norm(r, -1)


# ---------------------------------------------------------------- 5. PULSES / RHYTHM
def pulse_bass(bpm=120, bars=2, root=38, pattern="x..x..x.x..x..x.", notes=None, seed=9):
    """16th-note synth ostinato. root 38 = D2. notes: per-bar semitone offsets."""
    rng = np.random.default_rng(seed)
    six = 60 / bpm / 4
    n = int(bars * 16 * six * SR) + SR
    out = np.zeros((2, n))
    notes = notes or [0] * bars
    for b in range(bars):
        for s, ch in enumerate(pattern):
            if ch not in "xX":
                continue
            t0 = (b * 16 + s) * six
            d = tt(0.35)
            f = note_hz(root + notes[b])
            x = sum(polyblep_saw(np.full(len(d), f * 2 ** (c / 1200)), rng.random()) for c in (-7, 7)) / 2
            x += 0.6 * np.sign(sine(np.full(len(d), f / 2)))
            fc = 260 + (2600 if s % 4 == 0 else 1500) * np.exp(-d / 0.05)
            x = tv_filter(x, fc, "low", 1.4)
            x = sat(x * np.clip(d / 0.002, 0, 1) * np.exp(-d / 0.09), 2.0)
            place(out, st(x), t0, 3.0 if s == 0 else 0.0)
    return norm(out, -1)


def tick(tock=False, seed=10):
    rng = np.random.default_rng(seed)
    t = tt(0.08)
    f0 = 2600 if tock else 3400
    click = filt(rng.standard_normal(len(t)), "band", [f0 * 0.8, f0 * 1.25]) * np.exp(-t / 0.0015)
    ring = (np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 2.7 * t)) * np.exp(-t / 0.012) * 0.3
    return norm(st(click + ring), -1)


def heartbeat(bpm=70, beats=8):
    period = 60 / bpm
    n = int(beats * period * SR) + SR
    out = np.zeros((2, n))
    t = tt(0.4)
    lub = sat(sine(40 + 20 * np.exp(-t / 0.03)) * np.exp(-t / 0.08), 2.0)
    dub = sat(sine(45 + 28 * np.exp(-t / 0.025)) * np.exp(-t / 0.06), 2.0)
    for b in range(beats):
        place(out, lub, b * period)
        place(out, dub, b * period + 0.22 * min(1.0, 70 / bpm) ** 0.5, -4)
    return norm(filt(out, "low", 220), -1)


def piano_ping(midi=86, dur=7.0, seed=11):
    """Inharmonic 'trailer ping' (single reverberant piano note)."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    f0 = note_hz(midi)
    B = 0.0004
    y = np.zeros(len(t))
    for k in range(1, 14):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        y += np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.3)) * np.exp(-t / (2.2 / k ** 0.8)) / k ** 1.1
    y += filt(rng.standard_normal(len(t)), "band", [1500, 6000]) * np.exp(-t / 0.006) * 0.3
    y *= np.clip(t / 0.002, 0, 1)
    return norm(reverb(y, rt60=6.5, wet_db=-2, predelay=0.03, dark=2500)[:, : len(t)], -1)


# ---------------------------------------------------------------- 6. GLITCH
def stutter(x, start_s, slice_s, repeats, fade_ms=2.0):
    """Buffer-repeat: loop x[start:start+slice] `repeats` times (with tiny fades)."""
    x = st(x)
    i = int(start_s * SR)
    k = int(slice_s * SR)
    sl = x[:, i:i + k].copy()
    f = int(fade_ms * SR / 1000)
    w = np.ones(k)
    w[:f] = np.linspace(0, 1, f)
    w[-f:] = np.linspace(1, 0, f)
    return np.tile(sl * w, (1, repeats))


def glitch_roll(x, start_s, bpm=120, steps=(8, 16, 32, 64), per=2):
    """Accelerating buffer repeat: 1/8 -> 1/16 -> 1/32 -> 1/64 note slices."""
    beat = 60 / bpm
    return np.hstack([stutter(x, start_s, beat * 4 / s, per * (s // steps[0])) for s in steps])


def bitcrush(x, bits=6, hold=10):
    q = 2 ** (bits - 1)
    y = np.round(st(x) * q) / q
    idx = (np.arange(y.shape[1]) // hold) * hold
    return y[:, idx]


def tape_stop(x, dur=0.5):
    x = st(x)
    n = int(dur * SR)
    rate = np.linspace(1, 0, n) ** 1.6
    pos = np.cumsum(rate)
    return np.vstack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)])


# ---------------------------------------------------------------- 7. MASTER
def limiter(x, ceiling_db=-1.0, look_ms=5.0, rel_ms=120.0):
    """Look-ahead brickwall with a 4x-oversampled true-peak detector."""
    x = st(x)
    c = db(ceiling_db)
    # true-peak detector: 4x oversampled |x|, folded back to one value per sample
    up = S.resample_poly(x, 4, 1, axis=1)
    pk = np.max(np.abs(up), axis=0)[: 4 * x.shape[1]].reshape(-1, 4).max(axis=1)
    la = int(look_ms * SR / 1000)
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(pk, size=2 * la + 1)
    g = np.minimum(1.0, c / (pk + 1e-12))
    # release smoothing (gain may drop instantly, recovers with rel_ms)
    a = np.exp(-1.0 / (rel_ms * SR / 1000))
    gs = S.lfilter([1 - a], [1, -a], g)
    gs = np.minimum(gs, g)
    gs = S.lfilter([1 - a], [1, -a], gs[::-1])[::-1]  # symmetric smoothing, still look-ahead safe
    gs = np.minimum(gs, g)
    return x * gs


def write_wav(path, x):
    from scipy.io import wavfile
    x = st(x)
    wavfile.write(path, SR, (np.clip(x.T, -1, 1) * 32767).astype(np.int16))


# ---------------------------------------------------------------- 8. EXTRAS (AI / machine flavour)
def risset_ticks(dur=12.0, bpm0=60.0, layers=3, rate=1 / 6.0, tick_fn=None):
    """Risset rhythm: a pulse that seems to accelerate forever.
    Layer k runs at bpm0 * 2**((k + rate*t) % layers); loudness is a raised cosine of that position."""
    tick_fn = tick_fn or tick
    tk = tick_fn()
    t = tt(dur)
    out = np.zeros((2, len(t) + tk.shape[1]))
    for k in range(layers):
        pos = (k + rate * t) % layers
        bpm = bpm0 * 2 ** pos
        beats = np.cumsum(bpm / 60.0 / SR)  # beat phase (integral of tempo)
        idx = np.nonzero(np.diff(np.floor(beats)) > 0)[0]
        amp = 0.5 - 0.5 * np.cos(2 * np.pi * pos[idx] / layers)
        for i, a in zip(idx, amp):
            out[:, i:i + tk.shape[1]] += a * tk
    return norm(out, -1)


def data_chirps(n=12, step_s=0.0625, seed=12, scale=(0, 3, 5, 7, 10)):
    """FM 'agent telemetry' blips on a pentatonic-minor grid (D)."""
    rng = np.random.default_rng(seed)
    out = np.zeros((2, int((n * step_s + 0.2) * SR)))
    for i in range(n):
        t = tt(rng.uniform(0.02, 0.06))
        fc = note_hz(74 + rng.choice(scale) + 12 * rng.integers(0, 2))  # D5..D7 region
        ratio, index = rng.choice([1.5, 2.0, 3.5]), rng.uniform(2, 6)
        mod = index * np.exp(-t / 0.015) * np.sin(2 * np.pi * fc * ratio * t)
        x = np.sin(2 * np.pi * fc * t + mod) * np.clip(t / 0.001, 0, 1) * np.exp(-t / 0.02)
        place(out, pan(x, rng.uniform(-0.6, 0.6)), i * step_s)
    return norm(out, -1)


def tape_start(x, dur=0.6):
    """Inverse tape stop ('power-up'): playback rate ramps 0 -> 1."""
    x = st(x)
    n = int(dur * SR)
    rate = np.linspace(0, 1, n) ** 1.6
    pos = np.cumsum(rate)
    head = np.vstack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)])
    return np.hstack([head, x[:, int(pos[-1]):]])


def logo_shimmer(chord_midi=(62, 69, 74, 78, 81), dur=6.0, seed=13):
    """Warm bell chord + octave-up 'shimmer' bloom for the logo / final card (D major add9-ish)."""
    rng = np.random.default_rng(seed)
    t = tt(dur)
    y = np.zeros(len(t))
    for m in chord_midi:
        f = note_hz(m)
        for r, a, tau in [(1, 1, 2.5), (2.0, 0.4, 1.2), (3.01, 0.15, 0.6)]:
            y += a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6.3)) * np.exp(-t / tau)
        y += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.clip(t / 1.5, 0, 1) * np.exp(-t / 3.0)  # shimmer bloom
    y *= np.clip(t / 0.004, 0, 1)
    return norm(reverb(y, rt60=7.0, wet_db=-1, dark=4000)[:, : len(t)], -1)
