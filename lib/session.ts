"use client";

import { asset, musicUrl, sessionUrl, type Minutes, type MusicId, type Topic, type Voice } from "./guided";

export interface SessionSnapshot {
  time: number;
  duration: number;
  playing: boolean;
  ended: boolean;
  loading: boolean;
  error: boolean;
}

/**
 * Plays a guided session: one <audio> element with the spoken track, one looping <audio> element with music.
 * Plain <audio> elements keep playing with the screen locked and get lock-screen controls via Media Session.
 * It must be created and started from a click handler, so mobile browsers allow the sound.
 */
export class GuidedSession {
  readonly voice: HTMLAudioElement;
  readonly music: HTMLAudioElement | null;
  private listeners = new Set<() => void>();
  private snap: SessionSnapshot;
  private musicLevel: number;
  private fadeTimer: number | null = null;
  private listened = 0;
  private lastTick = 0;

  constructor(
    readonly topic: Topic,
    readonly minutes: Minutes,
    voiceId: Voice,
    musicId: MusicId | "none",
    musicVolume: number,
  ) {
    this.voice = new Audio(sessionUrl(topic.id, minutes, voiceId));
    this.voice.preload = "auto";
    this.music = musicId === "none" ? null : new Audio(musicUrl(musicId));
    this.musicLevel = musicVolume;
    if (this.music) {
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.volume = musicVolume;
    }
    this.snap = { time: 0, duration: minutes * 60, playing: false, ended: false, loading: true, error: false };

    const v = this.voice;
    v.addEventListener("timeupdate", this.onTime);
    v.addEventListener("playing", () => this.set({ playing: true, loading: false }));
    v.addEventListener("pause", () => this.set({ playing: false }));
    v.addEventListener("waiting", () => this.set({ loading: true }));
    v.addEventListener("canplay", () => this.set({ loading: false }));
    v.addEventListener("loadedmetadata", () => Number.isFinite(v.duration) && this.set({ duration: v.duration }));
    v.addEventListener("ended", this.onEnded);
    v.addEventListener("error", () => this.set({ error: true, loading: false, playing: false }));
  }

  get snapshot() {
    return this.snap;
  }

  /** Seconds actually listened, for the progress log. */
  get listenedSeconds() {
    return this.listened;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<SessionSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  private onTime = () => {
    const t = this.voice.currentTime;
    const dt = t - this.lastTick;
    if (dt > 0 && dt < 2) this.listened += dt;
    this.lastTick = t;
    this.set({ time: t });
    this.updatePosition();
  };

  private onEnded = () => {
    this.set({ ended: true, playing: false, time: this.snap.duration });
    this.fadeMusicOut(6);
  };

  start() {
    this.lastTick = 0;
    void this.voice.play().catch(() => this.set({ playing: false, loading: false }));
    void this.music?.play().catch(() => {});
    this.setupMediaSession();
  }

  play() {
    if (this.snap.ended) return;
    this.lastTick = this.voice.currentTime;
    void this.voice.play().catch(() => {});
    if (this.music) {
      this.stopFade();
      this.music.volume = this.musicLevel;
      void this.music.play().catch(() => {});
    }
  }

  pause() {
    this.voice.pause();
    this.music?.pause();
  }

  toggle() {
    if (this.voice.paused) this.play();
    else this.pause();
  }

  seek(seconds: number) {
    const d = this.snap.duration;
    const t = Math.max(0, Math.min(d - 0.5, seconds));
    this.voice.currentTime = t;
    this.lastTick = t;
    if (this.snap.ended && t < d - 1) this.set({ ended: false });
    this.set({ time: t });
  }

  skip(delta: number) {
    this.seek(this.voice.currentTime + delta);
  }

  setMusicVolume(v: number) {
    this.musicLevel = v;
    if (this.music) {
      this.music.volume = v;
      this.music.muted = v === 0;
    }
  }

  get hasMusic() {
    return this.music !== null;
  }

  private stopFade() {
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = null;
  }

  private fadeMusicOut(seconds: number) {
    const m = this.music;
    if (!m) return;
    this.stopFade();
    const start = m.volume;
    const steps = seconds * 10;
    let i = 0;
    this.fadeTimer = window.setInterval(() => {
      i++;
      m.volume = Math.max(0, start * (1 - i / steps));
      if (i >= steps) {
        this.stopFade();
        m.pause();
        m.volume = this.musicLevel;
      }
    }, 100);
  }

  destroy() {
    this.stopFade();
    this.voice.pause();
    this.music?.pause();
    this.voice.removeAttribute("src");
    this.voice.load();
    if (this.music) {
      this.music.removeAttribute("src");
      this.music.load();
    }
    this.listeners.clear();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      for (const a of ["play", "pause", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[]) {
        try {
          navigator.mediaSession.setActionHandler(a, null);
        } catch {
          // Unsupported action.
        }
      }
    }
  }

  private setupMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `${this.topic.title} · ${this.minutes} דקות`,
      artist: "רגע",
      album: "מדיטציה מודרכת",
      artwork: [
        { src: new URL(asset(this.topic.image), location.href).href, sizes: "960x717", type: "image/webp" },
        { src: new URL(asset("icons/icon-512.png"), location.href).href, sizes: "512x512", type: "image/png" },
      ],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => this.play()],
      ["pause", () => this.pause()],
      ["seekbackward", () => this.skip(-15)],
      ["seekforward", () => this.skip(15)],
      ["seekto", (d) => d.seekTime !== undefined && this.seek(d.seekTime)],
    ];
    for (const [a, h] of handlers) {
      try {
        ms.setActionHandler(a, h);
      } catch {
        // Unsupported action.
      }
    }
  }

  private updatePosition() {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    const d = this.snap.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    try {
      navigator.mediaSession.setPositionState({ duration: d, position: Math.min(this.voice.currentTime, d), playbackRate: 1 });
    } catch {
      // Ignore invalid states while seeking.
    }
  }
}
