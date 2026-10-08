"""Music and sound effects, synthesized from scratch (royalty-free by construction)."""
import json
import os
import wave

import numpy as np

V = os.path.dirname(os.path.abspath(__file__))
SR = 48000
timeline = json.load(open(f'{V}/timeline.json'))
TOTAL = timeline['total']
rng = np.random.default_rng(7)

BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT


def note(name: str) -> float:
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + names[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


# I – vi – IV – V, voiced as maj7 chords: bright without being saccharine
CHORDS = [
    ('C', ['C3', 'E3', 'G3', 'B3', 'E4'], ['C4', 'E4', 'G4', 'B4', 'E5', 'G4']),
    ('A', ['A2', 'C3', 'E3', 'G3', 'C4'], ['A3', 'C4', 'E4', 'G4', 'C5', 'E4']),
    ('F', ['F2', 'A2', 'C3', 'E3', 'A3'], ['F3', 'A3', 'C4', 'E4', 'A4', 'C4']),
    ('G', ['G2', 'B2', 'D3', 'E3', 'B3'], ['G3', 'B3', 'D4', 'E4', 'B4', 'D4']),
]
BASS = {'C': 'C2', 'A': 'A1', 'F': 'F1', 'G': 'G1'}

n = int(TOTAL * SR) + SR
L = np.zeros(n)
R = np.zeros(n)


def add(sig: np.ndarray, start: float, gain: float, pan: float = 0.0) -> None:
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def env(length: float, attack: float, release: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    e = np.minimum(1, t / max(attack, 1e-4))
    tail = np.clip((length - t) / max(release, 1e-4), 0, 1)
    return e * tail


def pad(freqs: list[float], length: float) -> tuple[np.ndarray, np.ndarray]:
    t = np.arange(int(length * SR)) / SR
    left = np.zeros_like(t)
    right = np.zeros_like(t)
    for f in freqs:
        for detune, side in ((-0.0025, 0), (0.0025, 1)):
            ff = f * (1 + detune)
            s = np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(4 * np.pi * ff * t + 0.3)
            (left if side == 0 else right)[:] += s
    e = env(length, 0.6, 0.9) * (1 + 0.06 * np.sin(2 * np.pi * 0.35 * t))
    return left * e / len(freqs), right * e / len(freqs)


def pluck(f: float, length: float = 0.9) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3.01 * f * t)
    return s * np.exp(-t * 6.5) * np.minimum(1, t / 0.004)


def bass(f: float, length: float) -> np.ndarray:
    t = np.arange(int(length * SR)) / SR
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.exp(-t * 2.2) * np.minimum(1, t / 0.01) * env(length, 0.005, 0.08)


def kick() -> np.ndarray:
    t = np.arange(int(0.32 * SR)) / SR
    f = 45 + 85 * np.exp(-t * 30)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t * 11)


def noise_hit(length: float, decay: float, hp: float) -> np.ndarray:
    x = rng.standard_normal(int(length * SR))
    # crude high-pass: first-order difference, repeated
    for _ in range(int(hp)):
        x = np.diff(x, prepend=0)
    x /= np.max(np.abs(x)) + 1e-9
    t = np.arange(len(x)) / SR
    return x * np.exp(-t * decay)


hat = noise_hit(0.06, 70, 3)
snap = noise_hit(0.14, 32, 1)
k = kick()

bars = int(np.ceil(TOTAL / BAR)) + 1
for b in range(bars):
    start = b * BAR
    if start > TOTAL:
        break
    name, pad_notes, arp_notes = CHORDS[b % 4]
    pl, pr = pad([note(x) for x in pad_notes], BAR + 0.9)
    add(pl, start, 0.11, -0.6)
    add(pr, start, 0.11, 0.6)
    last_bars = start > TOTAL - 3 * BAR
    if b >= 2:
        # eighth-note arpeggio, with a breathing pan
        for i in range(8):
            f = note(arp_notes[i % len(arp_notes)])
            add(pluck(f), start + i * BEAT / 2, 0.075 if i % 2 == 0 else 0.055, 0.35 * np.sin(i * 0.9))
    if b >= 2 and not last_bars:
        root = note(BASS[name])
        add(bass(root, 1.5 * BEAT), start, 0.22)
        add(bass(root, 0.5 * BEAT), start + 2.5 * BEAT, 0.16)
        add(bass(root * 1.5, 0.5 * BEAT), start + 3.5 * BEAT, 0.12)
    if b >= 4 and not last_bars:
        add(k, start, 0.42)
        add(k, start + 2 * BEAT, 0.38)
        for i in range(4):
            add(hat, start + i * BEAT + BEAT / 2, 0.06, 0.3)
    if b >= 8 and not last_bars:
        add(snap, start + BEAT, 0.07, -0.1)
        add(snap, start + 3 * BEAT, 0.07, 0.1)

# Light reverb (series of comb filters) for depth
def reverb(x: np.ndarray) -> np.ndarray:
    y = x.copy()
    for delay, g in ((0.113, 0.32), (0.167, 0.26), (0.241, 0.2), (0.307, 0.14)):
        d = int(delay * SR)
        y[d:] += g * x[:-d]
    return y


L, R = reverb(L), reverb(R[::1])
# Short fade-in and a fade-out at the end
t = np.arange(n) / SR
fade = np.clip(t / 1.2, 0, 1) * np.clip((TOTAL - t) / 3.5, 0, 1)
L *= fade
R *= fade
peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
L, R = L / peak * 0.85, R / peak * 0.85


def write(path: str, left: np.ndarray, right: np.ndarray | None = None) -> None:
    right = left if right is None else right
    data = np.stack([left, right], axis=1)
    data = np.clip(data, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((data * 32767).astype('<i2').tobytes())


os.makedirs(f'{V}/audio', exist_ok=True)
write(f'{V}/audio/music.wav', L[: int(TOTAL * SR)], R[: int(TOTAL * SR)])

# ---------- Sound effects ----------
def whoosh(length: float = 0.7) -> np.ndarray:
    x = rng.standard_normal(int(length * SR))
    t = np.arange(len(x)) / SR
    # low-pass filter whose cutoff rises then falls
    cutoff = 300 + 4500 * np.sin(np.pi * t / length) ** 2
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    for i in range(1, len(x)):
        y[i] = (1 - a[i]) * x[i] + a[i] * y[i - 1]
    y *= np.sin(np.pi * t / length) ** 1.5
    return y / (np.max(np.abs(y)) + 1e-9)


def pop() -> np.ndarray:
    t = np.arange(int(0.12 * SR)) / SR
    f = 520 + 420 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)


def tick() -> np.ndarray:
    x = noise_hit(0.025, 260, 2)
    t = np.arange(len(x)) / SR
    return 0.6 * x + 0.4 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 300)


def click() -> np.ndarray:
    t = np.arange(int(0.05 * SR)) / SR
    return np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 120) + 0.3 * noise_hit(0.05, 160, 2)


for name, sig in (('whoosh', whoosh()), ('pop', pop()), ('tick', tick()), ('click', click())):
    write(f'{V}/audio/{name}.wav', sig / (np.max(np.abs(sig)) + 1e-9) * 0.9)

print(f'music.wav {TOTAL:.2f}s, {bars} bars at {BPM} BPM; effects: whoosh, pop, tick, click')
