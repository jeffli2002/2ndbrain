"""Synthesize a calm, royalty-free background bed (warm keys + pads) into public/bgm.mp3."""
import pathlib
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 44100
BPM = 84
BEAT = 60 / BPM
BAR = BEAT * 4
LENGTH = 131.0
rng = np.random.default_rng(7)

NOTE = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def hz(name: str, octave: int) -> float:
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


# Each chord lasts two bars: Fmaj9 - Am7 - Dm9 - Bbmaj7
CHORDS = [
    ("F", ["F", "A", "C", "E", "G"]),
    ("A", ["A", "C", "E", "G", "B"]),
    ("D", ["D", "F", "A", "C", "E"]),
    ("Bb", ["Bb", "D", "F", "A", "C"]),
]

n = int(LENGTH * SR)
L = np.zeros(n)
R = np.zeros(n)


def add(sig: np.ndarray, start: float, pan: float = 0.0, gain: float = 1.0) -> None:
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def env(length: float, attack: float, release: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    e = np.minimum(1, t / max(attack, 1e-3))
    tail = np.clip((length - t) / release, 0, 1)
    return e * tail


def pad(freq: float, length: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    s = sum(np.sin(2 * np.pi * freq * (1 + d) * t + p) for d, p in [(-0.003, 0), (0.0, 1.3), (0.0035, 2.1)])
    s += 0.18 * np.sin(2 * np.pi * freq * 2 * t)
    return s / 3.2 * env(length, 1.8, 2.2)


def keys(freq: float, length: float = 3.2) -> np.ndarray:
    """FM electric-piano tone with a soft, decaying bell."""
    t = np.arange(int(length * SR)) / SR
    index = 1.6 * np.exp(-t * 3.0)
    s = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * t))
    s += 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 2.5)
    return s * np.exp(-t * 1.1) * np.minimum(1, t / 0.006)


def pluck(freq: float, length: float = 1.2) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 18)
    return s * np.exp(-t * 4.5) * np.minimum(1, t / 0.004)


def bass(freq: float, length: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.15 * np.sin(2 * np.pi * freq * 2 * t)
    return s * env(length, 0.25, 0.8)


def kick() -> np.ndarray:
    t = np.arange(int(0.45 * SR)) / SR
    f = 48 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def shaker() -> np.ndarray:
    t = np.arange(int(0.12 * SR)) / SR
    noise = sosfilt(butter(2, [5000, 9000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return noise * np.exp(-t * 45) * np.minimum(1, t / 0.01)


def section_gain(t: float, start: float, end: float, fade: float = 3.0) -> float:
    return float(np.clip(min(t - start, end - t) / fade, 0, 1))


bars = int(LENGTH / BAR) + 1
for b in range(bars):
    t0 = b * BAR
    root, tones = CHORDS[(b // 2) % 4]
    first_of_chord = b % 2 == 0

    if first_of_chord:
        for j, name in enumerate(tones[:4]):
            add(pad(hz(name, 3 if j < 2 else 4), BAR * 2 + 2.0), t0, pan=(j - 1.5) * 0.35, gain=0.11)
        add(bass(hz(root, 2), BAR * 2), t0, gain=0.22 * section_gain(t0, 9, 122, 4))

    voicing = [hz(tones[0], 3), hz(tones[1], 4), hz(tones[2], 4), hz(tones[3], 4)]
    for k, f in enumerate(voicing):
        add(keys(f), t0 + k * 0.018, pan=-0.2 + k * 0.13, gain=0.075)
    if b % 2 == 1:
        for k, f in enumerate(voicing[1:]):
            add(keys(f), t0 + BEAT * 2.5 + k * 0.02, pan=0.15, gain=0.045)

    arp_gain = section_gain(t0, 14, 110, 6)
    if arp_gain > 0:
        pattern = [0, 2, 4, 1, 3, 2, 4, 1]
        for s, idx in enumerate(pattern):
            f = hz(tones[idx], 5)
            add(pluck(f), t0 + s * BEAT / 2, pan=0.45 if s % 2 else -0.45,
                gain=0.05 * arp_gain * (0.8 + 0.2 * rng.random()))

    perc_gain = section_gain(t0, 25, 104, 5)
    if perc_gain > 0:
        for beat in (0, 2):
            add(kick(), t0 + beat * BEAT, gain=0.16 * perc_gain)
        for s in range(8):
            add(shaker(), t0 + s * BEAT / 2 + 0.01, pan=0.3, gain=(0.05 if s % 2 else 0.025) * perc_gain)


def reverb(x: np.ndarray, seed: int) -> np.ndarray:
    r = np.random.default_rng(seed)
    t = np.arange(int(2.8 * SR)) / SR
    ir = r.standard_normal(len(t)) * np.exp(-t / 0.9)
    ir = sosfilt(butter(2, 4500, "lowpass", fs=SR, output="sos"), ir)
    ir /= np.sqrt(np.sum(ir**2))
    return fftconvolve(x, ir)[: len(x)]


lp = butter(4, 9000, "lowpass", fs=SR, output="sos")
hp = butter(2, 35, "highpass", fs=SR, output="sos")
outL = sosfilt(hp, sosfilt(lp, L * 0.78 + reverb(L, 1) * 0.32))
outR = sosfilt(hp, sosfilt(lp, R * 0.78 + reverb(R, 2) * 0.32))

t = np.arange(n) / SR
fade = np.clip(t / 2.5, 0, 1) * np.clip((LENGTH - t) / 6.0, 0, 1)
stereo = np.stack([outL * fade, outR * fade], axis=1)
stereo /= np.max(np.abs(stereo)) / 0.89

wav = ROOT / "out" / "bgm.wav"
wav.parent.mkdir(exist_ok=True)
wavfile.write(str(wav), SR, (stereo * 32767).astype(np.int16))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-b:a", "192k", str(ROOT / "public" / "bgm.mp3")], check=True)
wav.unlink()
print("wrote public/bgm.mp3")
