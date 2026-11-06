"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatClock, SOUNDSCAPES } from "@/lib/content";
import { setMediaSession, soundscapeUrl, type SoundscapeId } from "@/lib/audio";
import { asset, MUSIC, musicUrl, type MusicId } from "@/lib/guided";

type TrackId = SoundscapeId | `music:${MusicId}`;

function trackInfo(id: TrackId) {
  if (id.startsWith("music:")) {
    const m = MUSIC.find((x) => `music:${x.id}` === id)!;
    return { name: m.name, url: musicUrl(m.id) };
  }
  const sc = SOUNDSCAPES.find((x) => x.id === id)!;
  return { name: sc.name, url: soundscapeUrl(sc.id) };
}
import { addSession } from "@/lib/store";

const TIMERS = [
  { value: 15, label: "15 דק׳" },
  { value: 30, label: "30 דק׳" },
  { value: 60, label: "שעה" },
  { value: 0, label: "בלי הגבלה" },
];
const FADE_SECONDS = 30;

export default function SleepPage() {
  const [playing, setPlaying] = useState<TrackId | null>(null);
  const [timer, setTimer] = useState(30);
  const [volume, setVolume] = useState(0.6);
  const [remaining, setRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const titleRef = useRef("");

  // Sleep timer: lower the volume over the last 30 seconds, then stop.
  // (iOS Safari ignores audio.volume, so there the sound simply stops at the end.)
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const a = audioRef.current;
      if (!a || endsAtRef.current === null) return;
      const left = (endsAtRef.current - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 0) stop();
      else if (left < FADE_SECONDS) a.volume = volume * (left / FADE_SECONDS);
    }, 500);
    return () => window.clearInterval(id);
  }, [playing, volume]);

  useEffect(() => () => audioRef.current?.pause(), []);

  function play(id: TrackId) {
    if (playing === id) {
      stop();
      return;
    }
    if (playing) logListening();
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    const info = trackInfo(id);
    a.src = info.url;
    a.loop = true;
    a.volume = volume;
    void a.play().catch(() => {});
    titleRef.current = info.name;
    setMediaSession(info.name, () => void a.play(), () => a.pause());
    startedAtRef.current = Date.now();
    endsAtRef.current = timer > 0 ? Date.now() + timer * 60_000 : null;
    setRemaining(timer > 0 ? timer * 60 : null);
    setPlaying(id);
  }

  function logListening() {
    addSession("sleep", `שינה: ${titleRef.current}`, (Date.now() - startedAtRef.current) / 1000);
  }

  function stop() {
    audioRef.current?.pause();
    logListening();
    endsAtRef.current = null;
    setRemaining(null);
    setPlaying(null);
  }

  function changeVolume(v: number) {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function changeTimer(minutes: number) {
    setTimer(minutes);
    if (playing) {
      endsAtRef.current = minutes > 0 ? Date.now() + minutes * 60_000 : null;
      setRemaining(minutes > 0 ? minutes * 60 : null);
      if (audioRef.current) audioRef.current.volume = volume;
    }
  }

  return (
    <>
      <section className="page-hero">
        <img src={asset("img/hero-night.webp")} alt="" />
        <div className="ph-copy">
          <h1>שינה</h1>
          <p>בוחרים צליל או מוזיקה, מניחים את הטלפון, והוא ייכבה לבד. ממשיך לנגן גם כשהמסך כבוי.</p>
        </div>
      </section>

      <Link href="/meditate/sleep/?min=15" className="topic-row" style={{ marginBottom: 8 }}>
        <img src={asset("img/topic-sleep.webp")} alt="" />
        <div>
          <b>מדיטציית הירדמות מודרכת</b>
          <span>קול רך שמלווה אתכם לשינה, 5 עד 20 דקות, ומסתיים בשקט.</span>
        </div>
      </Link>

      <div className="section-head">
        <h2>צלילי טבע</h2>
      </div>
      <div className="scape-grid">
        {SOUNDSCAPES.map((s) => (
          <button key={s.id} className="scape" aria-pressed={playing === s.id} onClick={() => play(s.id)}>
            <img src={asset(`img/sound-${s.id}.webp`)} alt="" loading="lazy" />
            <b>{s.name}</b>
            <span>{s.description}</span>
            {playing === s.id && (
              <span className="eq" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>מוזיקה מרגיעה בלופ</h2>
      </div>
      <div className="music-grid">
        {MUSIC.map((m) => {
          const id = `music:${m.id}` as TrackId;
          return (
            <button key={m.id} className="music-opt" aria-pressed={playing === id} onClick={() => play(id)} aria-label={`${playing === id ? "עצירת" : "ניגון"} ${m.name}`}>
              <img src={asset(m.image)} alt="" loading="lazy" />
              <span className="mo-text">
                <b>{m.name}</b>
                <span>{playing === id ? "מתנגן עכשיו" : m.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="card now-playing">
        <div className="toggle-row" style={{ borderTop: "none" }}>
          <span>{playing ? `מנגן: ${titleRef.current}` : "שום דבר לא מנגן"}</span>
          {playing && (
            <button className="btn secondary" style={{ minHeight: 40 }} onClick={stop}>
              עצירה
            </button>
          )}
        </div>
        {remaining !== null && <p className="small muted" style={{ margin: "0 0 10px" }}>ייכבה בעוד {formatClock(remaining)}</p>}
        <label className="small muted" htmlFor="vol">
          עוצמה
        </label>
        <input id="vol" type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(Number(e.target.value))} />
      </div>

      <h2>טיימר שינה</h2>
      <div className="chips">
        {TIMERS.map((t) => (
          <button key={t.value} className="chip" aria-pressed={timer === t.value} onClick={() => changeTimer(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      <h2>טיפ לפני השינה</h2>
      <div className="card small">
        נסו את <Link href="/breathe/">נשימת 4-7-8</Link> לשלוש דקות, ואז הפעילו כאן צליל עם טיימר של 30 דקות. כדאי להנמיך את בהירות המסך.
      </div>
    </>
  );
}
