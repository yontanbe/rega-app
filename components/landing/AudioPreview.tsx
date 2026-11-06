"use client";

import { useEffect, useState } from "react";
import { asset, MUSIC } from "@/lib/guided";

// One shared player for the landing page, so only one preview sounds at a time.
let current: { stop: () => void } | null = null;

function usePreview() {
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => current?.stop(), []);

  function toggle(key: string, sources: { src: string; volume: number; from?: number }[], maxSeconds: number) {
    if (playing === key) {
      current?.stop();
      return;
    }
    current?.stop();
    const els = sources.map((s) => {
      const a = new Audio(s.src);
      a.volume = s.volume;
      if (s.from) a.currentTime = s.from;
      void a.play().catch(() => {});
      return a;
    });
    const timer = window.setTimeout(() => stop(), maxSeconds * 1000);
    function stop() {
      window.clearTimeout(timer);
      els.forEach((a) => a.pause());
      setPlaying((p) => (p === key ? null : p));
      if (current?.stop === stop) current = null;
    }
    current = { stop };
    setPlaying(key);
  }
  return { playing, toggle };
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

/** "Listen to a sample": the first words of a guided session over ocean music. */
export function SampleButton() {
  const { playing, toggle } = usePreview();
  const on = playing === "sample";
  return (
    <button
      className="lp-btn ghost"
      onClick={() =>
        toggle(
          "sample",
          [
            { src: asset("audio/guided/calm-5-f.mp3"), volume: 1 },
            { src: asset("audio/music/ocean.mp3"), volume: 0.8 },
          ],
          45,
        )
      }
    >
      <span className="lp-btn-icon">{on ? <PauseIcon /> : <PlayIcon />}</span>
      {on ? "עצירה" : "להאזין לדוגמה"}
    </button>
  );
}

export function MusicShelf() {
  const { playing, toggle } = usePreview();
  return (
    <ul className="lp-music">
      {MUSIC.slice(0, 8).map((m) => {
        const on = playing === m.id;
        return (
          <li key={m.id}>
            <button
              className="lp-track"
              aria-pressed={on}
              aria-label={on ? `עצירת ${m.name}` : `האזנה ל${m.name}`}
              onClick={() => toggle(m.id, [{ src: asset(`audio/music/${m.id}.mp3`), volume: 1 }], 40)}
            >
              <span className="lp-track-art">
                <img src={asset(m.image)} alt="" loading="lazy" />
                <span className="lp-track-play">{on ? <PauseIcon /> : <PlayIcon />}</span>
              </span>
              <b>{m.name}</b>
              <span>{on ? "מתנגן עכשיו" : m.description}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
