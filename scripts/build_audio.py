"""Builds the app's audio from raw generated material.

Inputs (not committed, produced by the generation step):
  RAW/tts/<voice>/<topic>-<index>.mp3   one spoken phrase each (Gemini TTS)
  RAW/music/<mood>-<n>.mp3              ~30 s instrumental clips (Lyria)

Outputs:
  public/audio/guided/<topic>-<minutes>-<voice>.mp3   finished guided sessions
  public/audio/music/<mood>.mp3                       looping background music
  lib/guided-timeline.json                            phrase start times, for captions

Usage: python3 -I scripts/build_audio.py RAW_DIR
"""

import json
import pathlib
import subprocess
import sys

import numpy as np

SR = 24000
ROOT = pathlib.Path(__file__).resolve().parent.parent
DURATIONS = [5, 10, 15, 20]
VOICES = ["f", "m"]
LEAD_IN = 6.0  # bell, then the first words
CLOSE_TAIL = 9.0  # after the last words: closing bell and its ring-out
MIN_GAP = 2.0


def decode(path: pathlib.Path, sr: int = SR, channels: int = 1) -> np.ndarray:
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", str(channels), "-ar", str(sr), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    a = np.frombuffer(out, dtype=np.float32).copy()
    return a.reshape(-1, channels) if channels > 1 else a


def encode(samples: np.ndarray, path: pathlib.Path, sr: int, channels: int, quality: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", str(channels), "-i", "-",
         "-c:a", "libmp3lame", "-q:a", quality, str(path)],
        input=samples.astype(np.float32).tobytes(),
        check=True,
    )


def trim(a: np.ndarray, thresh=0.01, pad=0.08) -> np.ndarray:
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(a), idx[-1] + int(pad * SR * 3))
    return a[s:e]


def normalize_speech(a: np.ndarray, target_rms=0.085) -> np.ndarray:
    voiced = a[np.abs(a) > 0.02]
    rms = float(np.sqrt(np.mean(voiced**2))) if len(voiced) else 0.0
    if rms > 0:
        a = a * (target_rms / rms)
    peak = float(np.max(np.abs(a)))
    if peak > 0.95:
        a = a * (0.95 / peak)
    return a


def bell(freq=196.0, seconds=7.0, gain=0.22) -> np.ndarray:
    """A soft singing-bowl tone: a few inharmonic partials with slow decay and a gentle beat."""
    t = np.arange(int(seconds * SR)) / SR
    partials = [(1.0, 1.0, 1.6), (2.76, 0.45, 2.4), (5.4, 0.18, 3.5), (8.9, 0.07, 5.0)]
    out = np.zeros_like(t)
    for ratio, amp, decay in partials:
        f = freq * ratio
        out += amp * np.sin(2 * np.pi * f * t) * np.exp(-t * decay / 2.2) * (1 + 0.06 * np.sin(2 * np.pi * 1.3 * t))
    attack = np.minimum(1.0, t / 0.012)
    return (out * attack / np.max(np.abs(out)) * gain).astype(np.float32)


def build_guided(raw: pathlib.Path):
    data = json.loads((ROOT / "content" / "guided.json").read_text(encoding="utf-8"))
    timeline = {}
    report = []
    open_bell, close_bell = bell(220.0), bell(196.0, 9.0)
    for topic in data["topics"]:
        tid = topic["id"]
        sleep_end = bool(topic.get("endsInSleep"))
        for voice in VOICES:
            clips = {}
            for i, _ in enumerate(topic["phrases"]):
                p = raw / "tts" / voice / f"{tid}-{i:02d}.mp3"
                if not p.exists():
                    raise SystemExit(f"missing clip {p}")
                clips[i] = normalize_speech(trim(decode(p)))
            for minutes in DURATIONS:
                chosen = [i for i, ph in enumerate(topic["phrases"]) if ph["tier"] <= minutes]
                total = minutes * 60.0
                speech = sum(len(clips[i]) / SR for i in chosen)
                # Weights for the silences after each phrase. A sleep session ends in silence, not a bell.
                weights = [topic["phrases"][i]["pause"] for i in chosen[:-1]]
                tail_weight = 10.0 if sleep_end else 0.0
                fixed = LEAD_IN + (0 if sleep_end else CLOSE_TAIL)
                free = total - fixed - speech - MIN_GAP * len(weights)
                if free < 0:
                    raise SystemExit(f"{tid} {minutes} min: speech does not fit ({speech:.0f}s)")
                wsum = sum(weights) + tail_weight
                gaps = [MIN_GAP + free * w / wsum for w in weights]

                out = np.zeros(int(total * SR) + SR, dtype=np.float32)
                out[: len(open_bell)] += open_bell
                cues = []
                t = LEAD_IN
                for n, i in enumerate(chosen):
                    c = clips[i]
                    s = int(t * SR)
                    out[s : s + len(c)] += c
                    cues.append([round(t, 2), i])
                    t += len(c) / SR
                    if n < len(gaps):
                        t += gaps[n]
                if not sleep_end:
                    s = int((t + 1.5) * SR)
                    out[s : s + len(close_bell)] += close_bell[: len(out) - s]
                out = out[: int(total * SR)]
                # Gentle fade at the very end so it never clicks.
                fade = int(1.5 * SR)
                out[-fade:] *= np.linspace(1, 0, fade)
                path = ROOT / "public" / "audio" / "guided" / f"{tid}-{minutes}-{voice}.mp3"
                encode(out, path, SR, 1, "6")
                timeline[f"{tid}-{minutes}-{voice}"] = cues
                report.append(f"{path.name}: speech {speech:.0f}s, avg gap {np.mean(gaps):.0f}s, {path.stat().st_size // 1024} KB")
    (ROOT / "lib" / "guided-timeline.json").write_text(json.dumps(timeline, separators=(",", ":")), encoding="utf-8")
    print("\n".join(report))


def build_music(raw: pathlib.Path):
    sr = 44100
    xf = int(5.0 * sr)
    moods = sorted({p.stem.rsplit("-", 1)[0] for p in (raw / "music").glob("*.mp3")})
    for mood in moods:
        parts = [decode(p, sr, 2) for p in sorted((raw / "music").glob(f"{mood}-*.mp3"))]
        seq = parts[0]
        for nxt in parts[1:]:
            ramp = np.linspace(0, 1, xf)[:, None]
            # Equal-power crossfade between clips.
            mixed = seq[-xf:] * np.cos(ramp * np.pi / 2) + nxt[:xf] * np.sin(ramp * np.pi / 2)
            seq = np.concatenate([seq[:-xf], mixed, nxt[xf:]])
        # Make the loop point seamless: fold the tail into the head.
        ramp = np.linspace(0, 1, xf)[:, None]
        head = seq[:xf] * np.sin(ramp * np.pi / 2) + seq[-xf:] * np.cos(ramp * np.pi / 2)
        seq = np.concatenate([head, seq[xf:-xf]])
        peak = float(np.max(np.abs(seq)))
        seq = seq * (0.42 / peak)  # sits under the voice; iOS ignores element volume
        path = ROOT / "public" / "audio" / "music" / f"{mood}.mp3"
        encode(seq.reshape(-1), path, sr, 2, "5")
        print(f"{path.name}: {len(seq) / sr:.0f}s, {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    raw_dir = pathlib.Path(sys.argv[1])
    what = sys.argv[2] if len(sys.argv) > 2 else "all"
    if what in ("all", "music"):
        build_music(raw_dir)
    if what in ("all", "guided"):
        build_guided(raw_dir)
