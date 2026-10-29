"use client";

// Every sound in the app is synthesized in the browser, so there are no audio files to license or host yet.

let ctx: AudioContext | null = null;

export function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Singing-bowl style bell: a few inharmonic partials with long exponential decay. */
export function playBell(baseFreq = 196, volume = 0.35) {
  const ac = audioContext();
  const now = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = volume;
  out.connect(ac.destination);
  const partials: [ratio: number, gain: number, decay: number][] = [
    [1, 1, 7],
    [2.76, 0.45, 4.5],
    [5.4, 0.22, 2.8],
    [8.93, 0.1, 1.6],
  ];
  for (const [ratio, gain, decay] of partials) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = baseFreq * ratio;
    // Slight detune beating, like a real bowl.
    osc.detune.setValueAtTime(-3, now);
    osc.detune.linearRampToValueAtTime(3, now + decay);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(g).connect(out);
    osc.start(now);
    osc.stop(now + decay + 0.1);
  }
}

/** Soft gliding tone that marks a breathing phase. */
export function playBreathCue(direction: "in" | "out" | "hold", seconds: number) {
  const ac = audioContext();
  const now = ac.currentTime;
  const dur = Math.min(Math.max(seconds, 1), 8);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  const [from, to] = direction === "in" ? [220, 330] : direction === "out" ? [330, 196] : [262, 262];
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.linearRampToValueAtTime(to, now + dur);
  const peak = direction === "hold" ? 0.03 : 0.07;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.6, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

// ---------- soundscapes: rendered once to a looping WAV, played through <audio> ----------
// An <audio> element keeps playing with the screen locked on phones, and shows lock-screen controls via Media Session.

export type SoundscapeId = "rain" | "ocean" | "wind" | "brown";

const SAMPLE_RATE = 22050;
const LOOP_SECONDS = 32;
const FADE_SECONDS = 2;

function rng(seed: number) {
  // Deterministic so a soundscape sounds the same every time.
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function render(id: SoundscapeId): Float32Array {
  const n = (LOOP_SECONDS + FADE_SECONDS) * SAMPLE_RATE;
  const out = new Float32Array(n);
  const rand = rng(id.length * 7919 + id.charCodeAt(0));
  // Pink noise (Paul Kellet's filter) and brown noise state.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let brown = 0;
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const white = rand() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    brown = (brown + 0.02 * white) / 1.02;
    const t = i / SAMPLE_RATE;

    let v = 0;
    switch (id) {
      case "rain": {
        // Steady hiss plus sparse droplets.
        lp += 0.35 * (white - lp);
        const hiss = white - lp; // crude high-pass
        const drop = rand() < 0.0009 ? (rand() * 2 - 1) * 0.9 : 0;
        v = pink * 0.55 + hiss * 0.25 + drop;
        break;
      }
      case "ocean": {
        // Waves: brown noise swelling every 8 seconds (the loop length is a multiple, so it stays seamless).
        const swell = Math.pow(Math.sin((Math.PI * t) / 8), 2);
        lp += 0.08 * (pink - lp);
        v = brown * 3.2 * (0.25 + 0.75 * swell) + lp * 0.6 * swell;
        break;
      }
      case "wind": {
        // Pink noise through a low-pass whose cutoff drifts slowly.
        const cutoff = 0.02 + 0.05 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 16) * Math.sin((2 * Math.PI * t) / 5.3));
        lp += cutoff * (pink * 2 - lp);
        lp2 += cutoff * (lp - lp2);
        v = lp2 * 1.6;
        break;
      }
      case "brown":
        v = brown * 3.5;
        break;
    }
    out[i] = Math.max(-1, Math.min(1, v));
  }

  // Equal-power crossfade of the tail into the head, so the loop has no click.
  const loopLen = LOOP_SECONDS * SAMPLE_RATE;
  const fadeLen = FADE_SECONDS * SAMPLE_RATE;
  const looped = out.slice(0, loopLen);
  for (let i = 0; i < fadeLen; i++) {
    const x = i / fadeLen;
    looped[i] = out[i] * Math.sin((x * Math.PI) / 2) + out[loopLen + i] * Math.cos((x * Math.PI) / 2);
  }
  return looped;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, Math.round(samples[i] * 0x7fff), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

const urlCache = new Map<SoundscapeId, string>();

export function soundscapeUrl(id: SoundscapeId): string {
  let url = urlCache.get(id);
  if (!url) {
    url = URL.createObjectURL(encodeWav(render(id), SAMPLE_RATE));
    urlCache.set(id, url);
  }
  return url;
}

// ---------- device helpers ----------

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported (iOS): ignore.
  }
}

/** Keeps the screen on during a session where supported. Returns a release function. */
export async function keepScreenOn(): Promise<() => void> {
  try {
    const lock = await navigator.wakeLock?.request("screen");
    return () => void lock?.release().catch(() => {});
  } catch {
    return () => {};
  }
}

export function setMediaSession(title: string, onPlay: () => void, onPause: () => void) {
  if (!("mediaSession" in navigator)) return;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist: "רגע",
    artwork: [{ src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" }],
  });
  navigator.mediaSession.setActionHandler("play", onPlay);
  navigator.mediaSession.setActionHandler("pause", onPause);
}
