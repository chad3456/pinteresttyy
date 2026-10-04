"""Synthesize the music bed for each recreation and mux it with the silent render.

Usage: python3 tools/audio.py <dir>   (needs numpy and ffmpeg)
Matches the blueprints: flat-space gets an ambient pad with soft whooshes on transitions;
storybook gets gentle plucks, a hush before the reveal and a soft hit on cuts; fixed-cam gets nothing.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100


def tone(f, dur, amp, attack=0.4, release=1.0):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur - t) / release))
    return amp * env * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t + 0.5))


def add(buf, sig, at):
    a = int(at * SR)
    if a >= len(buf):
        return
    sig = sig[: len(buf) - a]
    buf[a:a + len(sig)] += sig


def whoosh(dur=0.5, amp=0.08, seed=0):
    r = np.random.default_rng(seed)
    n = r.standard_normal(int(dur * SR))
    n = np.convolve(n, np.ones(8) / 8, mode="same")
    t = np.linspace(0, 1, len(n))
    return amp * n * np.sin(np.pi * t) ** 2


def pad(tl):
    dur = tl["duration"]
    buf = np.zeros(int(dur * SR) + SR)
    chords = [(220.0, 277.18, 329.63), (196.0, 246.94, 293.66), (174.61, 220.0, 261.63), (196.0, 246.94, 329.63)]
    step = 4.0
    for k, t0 in enumerate(np.arange(0, dur, step)):
        for f in chords[k % 4]:
            add(buf, tone(f / 2, step + 1.5, 0.05, attack=1.2, release=1.5), t0)
        for j in range(4):  # glassy plucks
            add(buf, tone(chords[k % 4][j % 3] * 2, 0.6, 0.025, attack=0.005, release=0.55), t0 + j * 1.0 + 0.5)
    for i, c in enumerate(tl["cuts"]):
        add(buf, whoosh(0.5, 0.06, i), max(0, c["t"] - 0.25))
    return buf


def pastoral(tl):
    dur = tl["duration"]
    buf = np.zeros(int(dur * SR) + SR)
    scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
    rng = np.random.default_rng(3)
    shots = tl["shots"]
    burrow = next((s for s in shots if s["scene"] == "burrow"), None)
    hush = (burrow["start"] + 0.62 * (burrow["end"] - burrow["start"]), burrow["start"] + 0.72 * (burrow["end"] - burrow["start"])) if burrow else (0, 0)
    t = 2.0
    while t < dur - 0.5:
        if not (hush[0] <= t <= hush[1]):
            busy = any(s["scene"] == "sidekick" and s["start"] <= t < s["end"] for s in shots)
            add(buf, tone(rng.choice(scale) * (2 if busy else 1), 0.7, 0.05, attack=0.01, release=0.6), t)
            t += 0.25 if busy else 0.6
        else:
            t += 0.2
    for f in (130.81, 196.0):
        add(buf, tone(f, dur - 2, 0.03, attack=3, release=3), 2.0)
    for i, c in enumerate(tl["cuts"]):
        if c["kind"] == "cut":
            add(buf, tone(98.0, 0.35, 0.12, attack=0.005, release=0.3), c["t"])
    fade = np.minimum(1, np.arange(len(buf)) / (2 * SR))
    return buf * fade


def popsfx(amp=0.12, f=880.0):
    t = np.arange(int(0.18 * SR)) / SR
    sweep = f * (1 + 1.5 * np.exp(-t * 40))
    return amp * np.sin(2 * np.pi * np.cumsum(sweep) / SR) * np.exp(-t * 28)


def riser(dur=1.6, amp=0.08, seed=1):
    n = np.random.default_rng(seed).standard_normal(int(dur * SR))
    n = np.convolve(n, np.ones(4) / 4, mode="same")
    return amp * n * np.linspace(0, 1, len(n)) ** 2.5


def boom(amp=0.5):
    t = np.arange(int(1.6 * SR)) / SR
    return amp * np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2)


def fermi(tl):
    """Ambient explainer bed: pad + plucks, whoosh on cuts, pops on entrances, riser and boom into the title."""
    buf = pad(tl) * 0.9
    rng = np.random.default_rng(5)
    for sh in tl["shots"]:
        for i, at in enumerate(sh.get("sfx", [])):
            add(buf, popsfx(0.1, float(rng.choice([660, 880, 990, 1175]))), at)
        if sh["scene"] == "title":
            add(buf, riser(1.6, 0.09), max(0, sh["start"] - 1.6))
            add(buf, boom(0.45), sh["start"])
    fade = np.ones(len(buf))
    n = int(3 * SR)
    end = int(tl["duration"] * SR)
    fade[max(0, end - n):end] = np.linspace(1, 0, min(n, end))
    fade[end:] = 0
    return buf * fade


def main():
    d = Path(sys.argv[1] if len(sys.argv) > 1 else "recreations")
    for tlf in sorted(d.glob("*.timeline.json")):
        pid = tlf.name.replace(".timeline.json", "")
        tl = json.loads(tlf.read_text())
        silent = d / f"{pid}.silent.mp4"
        out = d / f"{pid}.mp4"
        kind = {"flat-space": pad, "storybook": pastoral, "fermi": fermi}.get(pid)
        if kind is None:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-c", "copy", str(out)], check=True)
        else:
            buf = kind(tl)
            buf = buf / max(1e-6, np.abs(buf).max()) * 0.7
            wav = d / f"{pid}.wav"
            with wave.open(str(wav), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
                w.writeframes((buf * 32767).astype(np.int16).tobytes())
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-i", str(wav), "-c:v", "copy", "-c:a", "aac",
                            "-b:a", "128k", "-af", "loudnorm=I=-16:TP=-1.5", "-shortest", str(out)], check=True)
            wav.unlink()
        silent.unlink()
        print(pid, "->", out)


if __name__ == "__main__":
    main()
