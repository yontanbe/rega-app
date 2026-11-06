"use client";

import { useEffect, useRef, useState } from "react";
import { formatClock, SOUNDSCAPES } from "@/lib/content";
import { keepScreenOn, playBell, setMediaSession, soundscapeUrl, type SoundscapeId } from "@/lib/audio";
import { addSession } from "@/lib/store";
import { asset, MUSIC, musicUrl } from "@/lib/guided";

const DURATIONS = [3, 5, 10, 15, 20, 30];
const INTERVALS = [
  { value: 0, label: "בלי" },
  { value: 2, label: "כל 2 דק׳" },
  { value: 5, label: "כל 5 דק׳" },
];

type Status = "idle" | "running" | "paused" | "done";

export default function MeditatePage() {
  const [minutes, setMinutes] = useState(10);
  const [interval, setIntervalMin] = useState(0);
  const [ambient, setAmbient] = useState<SoundscapeId | `music:${string}` | "none">("music:flow");
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);

  // Elapsed time is accumulated across pauses: banked seconds plus the current running stretch.
  const bankedRef = useRef(0);
  const resumedAtRef = useRef(0);
  const lastBellRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const releaseWake = useRef<() => void>(() => {});

  const total = minutes * 60;

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      const t = bankedRef.current + (performance.now() - resumedAtRef.current) / 1000;
      if (t >= total) {
        complete();
        return;
      }
      if (interval > 0) {
        const bellNo = Math.floor(t / (interval * 60));
        if (bellNo > lastBellRef.current) {
          lastBellRef.current = bellNo;
          playBell(330, 0.18);
        }
      }
      setElapsed(t);
    }, 250);
    return () => window.clearInterval(id);
  }, [status, total, interval]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      releaseWake.current();
    },
    [],
  );

  function ambientAudio(): HTMLAudioElement | null {
    if (ambient === "none") return null;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    const url = ambient.startsWith("music:") ? musicUrl(ambient.slice(6) as (typeof MUSIC)[number]["id"]) : soundscapeUrl(ambient as SoundscapeId);
    if (a.src !== url) a.src = url;
    a.loop = true;
    a.volume = ambient.startsWith("music:") ? 0.7 : 0.35;
    return a;
  }

  async function start() {
    bankedRef.current = 0;
    lastBellRef.current = 0;
    resumedAtRef.current = performance.now();
    setElapsed(0);
    setStatus("running");
    playBell();
    const a = ambientAudio();
    if (a) {
      void a.play().catch(() => {});
      setMediaSession("טיימר מדיטציה", resume, pause);
    }
    releaseWake.current = await keepScreenOn();
  }

  function pause() {
    bankedRef.current += (performance.now() - resumedAtRef.current) / 1000;
    audioRef.current?.pause();
    setStatus("paused");
  }

  function resume() {
    resumedAtRef.current = performance.now();
    void audioRef.current?.play().catch(() => {});
    setStatus("running");
  }

  function stopEarly() {
    const t = status === "running" ? bankedRef.current + (performance.now() - resumedAtRef.current) / 1000 : bankedRef.current;
    end(t);
  }

  function complete() {
    playBell();
    window.setTimeout(() => playBell(196, 0.25), 2500);
    end(total);
  }

  function end(seconds: number) {
    audioRef.current?.pause();
    releaseWake.current();
    addSession("meditate", `טיימר ${minutes} דק׳`, seconds);
    setElapsed(seconds);
    setStatus("done");
  }

  const active = status === "running" || status === "paused";
  const progress = active ? elapsed / total : status === "done" ? 1 : 0;
  const R = 46;
  const C = 2 * Math.PI * R;

  return (
    <>
      <section className="page-hero" style={{ minHeight: 180 }}>
        <img src={asset("img/card-timer.webp")} alt="" />
        <div className="ph-copy">
          <h1>טיימר שקט</h1>
          <p>שבו בנוחות, עיניים עצומות או מבט רך. כשהמחשבות נודדות, פשוט חוזרים לנשימה.</p>
        </div>
      </section>

      <div className="timer-face" role="timer" aria-live="off">
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
        <div style={{ textAlign: "center" }}>
          <div className="time">{status === "done" ? "✓" : formatClock(active ? total - elapsed : total)}</div>
          <div className="small muted">
            {status === "paused" ? "בהשהיה" : status === "done" ? `${Math.round(elapsed / 60)} דק׳ נשמרו` : `${minutes} דקות`}
          </div>
        </div>
      </div>

      <div className="controls">
        {status === "idle" || status === "done" ? (
          <button className="btn" onClick={start}>
            {status === "done" ? "שוב" : "התחלה"}
          </button>
        ) : (
          <>
            {status === "running" ? (
              <button className="btn" onClick={pause}>
                השהיה
              </button>
            ) : (
              <button className="btn" onClick={resume}>
                המשך
              </button>
            )}
            <button className="btn secondary" onClick={stopEarly}>
              סיום
            </button>
          </>
        )}
      </div>

      {!active && (
        <>
          <h2>משך</h2>
          <div className="chips">
            {DURATIONS.map((m) => (
              <button key={m} className="chip" aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
                {m} דק׳
              </button>
            ))}
          </div>

          <h2>פעמון ביניים</h2>
          <div className="chips">
            {INTERVALS.map((i) => (
              <button key={i.value} className="chip" aria-pressed={i.value === interval} onClick={() => setIntervalMin(i.value)}>
                {i.label}
              </button>
            ))}
          </div>

          <h2>מוזיקה או צליל רקע</h2>
          <div className="chips">
            <button className="chip" aria-pressed={ambient === "none"} onClick={() => setAmbient("none")}>
              שקט
            </button>
            {MUSIC.map((m) => (
              <button key={m.id} className="chip" aria-pressed={ambient === `music:${m.id}`} onClick={() => setAmbient(`music:${m.id}`)}>
                ♪ {m.name}
              </button>
            ))}
            {SOUNDSCAPES.map((s) => (
              <button key={s.id} className="chip" aria-pressed={ambient === s.id} onClick={() => setAmbient(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
