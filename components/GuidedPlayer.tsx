"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { asset, cues, type Voice } from "@/lib/guided";
import type { GuidedSession } from "@/lib/session";
import { formatClock } from "@/lib/content";
import { addMood, addSession, updateSettings, type MoodRecord } from "@/lib/store";

const MOODS: { value: MoodRecord["mood"]; face: string; label: string }[] = [
  { value: 1, face: "😣", label: "קשה" },
  { value: 2, face: "😕", label: "לא משהו" },
  { value: 3, face: "😐", label: "בסדר" },
  { value: 4, face: "🙂", label: "טוב" },
  { value: 5, face: "😌", label: "רגוע" },
];

const R = 47;
const C = 2 * Math.PI * R;

function readCaptionsPref() {
  try {
    return window.localStorage.getItem("rega:captions") !== "off";
  } catch {
    return true;
  }
}

export default function GuidedPlayer({
  session,
  voice,
  musicVolume,
  onClose,
}: {
  session: GuidedSession;
  voice: Voice;
  musicVolume: number;
  onClose: () => void;
}) {
  const snap = useSyncExternalStore(session.subscribe, () => session.snapshot, () => session.snapshot);
  const [captions, setCaptions] = useState(true);
  const [vol, setVol] = useState(musicVolume);
  const [mood, setMood] = useState<number | null>(null);
  const { topic, minutes } = session;
  const timeline = useMemo(() => cues(topic.id, minutes, voice), [topic.id, minutes, voice]);

  useEffect(() => setCaptions(readCaptionsPref()), []);

  // Lock page scroll while the player covers the screen; close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === " " && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        session.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Log the session once it finishes.
  useEffect(() => {
    if (snap.ended) addSession("meditate", `${topic.title} · ${minutes} דק׳`, Math.max(session.listenedSeconds, snap.duration * 0.9));
  }, [snap.ended, topic.title, minutes, session, snap.duration]);

  function close() {
    if (!session.snapshot.ended) addSession("meditate", `${topic.title} · ${minutes} דק׳`, session.listenedSeconds);
    session.destroy();
    onClose();
  }

  function toggleCaptions() {
    const next = !captions;
    setCaptions(next);
    try {
      window.localStorage.setItem("rega:captions", next ? "on" : "off");
    } catch {
      // Ignore storage errors.
    }
  }

  function changeVol(v: number) {
    setVol(v);
    session.setMusicVolume(v);
    updateSettings({ musicVolume: v });
  }

  // Current caption: the latest phrase that started, shown for a reading-length window.
  let caption = "";
  for (const [start, idx] of timeline) {
    if (start > snap.time) break;
    const text = topic.phrases[idx] ?? "";
    const showFor = Math.max(7, text.length / 9 + 4);
    caption = snap.time - start < showFor ? text : "";
  }

  const remaining = Math.max(0, snap.duration - snap.time);
  const progress = snap.duration ? Math.min(1, snap.time / snap.duration) : 0;
  const style = { "--tint": topic.tint } as React.CSSProperties;

  return (
    <div className={`player ${snap.playing ? "" : "paused"}`} style={style} role="dialog" aria-modal="true" aria-label={`${topic.title}, ${minutes} דקות`}>
      <img className="bg" src={asset(topic.image)} alt="" />

      <div className="player-top">
        <button className="icon-btn" onClick={close} aria-label="סגירה">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="player-title">
          <b>{topic.title}</b>
          <div className="small" style={{ opacity: 0.8 }}>
            {minutes} דקות
          </div>
        </div>
        <button className="icon-btn" onClick={toggleCaptions} aria-pressed={captions} aria-label={captions ? "הסתרת כתוביות" : "הצגת כתוביות"} title="כתוביות">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden style={{ opacity: captions ? 1 : 0.45 }}>
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M10.5 10.2a2 2 0 1 0 0 3.6M16.5 10.2a2 2 0 1 0 0 3.6" />
          </svg>
        </button>
      </div>

      {snap.ended ? (
        <div className="player-stage">
          <div className="done-panel">
            <div className="orb" style={{ width: "min(40vw, 160px)" }}>
              <div className="core" />
            </div>
            <h2>כל הכבוד</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>הקדשתם {minutes} דקות לעצמכם. איך אתם מרגישים עכשיו?</p>
            <div className="mood-row" role="group" aria-label="מצב רוח אחרי התרגול">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  className="mood-btn"
                  aria-pressed={mood === m.value}
                  aria-label={m.label}
                  onClick={() => {
                    if (mood === null) addMood(m.value);
                    setMood(m.value);
                  }}
                >
                  {m.face}
                </button>
              ))}
            </div>
            {mood !== null && mood <= 2 && (
              <p className="small" style={{ margin: 0 }}>
                אם קשה במיוחד, <Link href="/help/" style={{ color: "#fff" }}>יש עם מי לדבר</Link>.
              </p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="btn" style={{ background: "#fff", color: "#1b1b38" }} onClick={close}>
                סיום
              </button>
              <button className="btn secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }} onClick={() => {
                  session.seek(0);
                  session.play();
                }}>
                שוב
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="player-stage">
            <div className="orb" role="timer" aria-label={`נותרו ${formatClock(remaining)}`}>
              <svg viewBox="0 0 100 100" aria-hidden>
                <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.6" />
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 0.4s linear" }}
                />
              </svg>
              <div className="core" />
              <div className="clock">
                <b>{formatClock(remaining)}</b>
                <span>{snap.error ? "שגיאה בטעינה" : snap.loading && !snap.playing ? "טוען..." : snap.playing ? "נותרו" : "בהשהיה"}</span>
              </div>
            </div>
            <p className={`caption ${captions && caption ? "" : "hidden"}`} aria-live="polite">
              {captions ? caption : ""}
            </p>
          </div>

          <div className="player-controls">
            <div className="scrub" dir="ltr">
              <input
                type="range"
                min={0}
                max={Math.round(snap.duration)}
                step={1}
                value={Math.round(snap.time)}
                onChange={(e) => session.seek(Number(e.target.value))}
                aria-label="מיקום בתרגול"
              />
              <div className="times">
                <span>{formatClock(snap.time)}</span>
                <span>{formatClock(snap.duration)}</span>
              </div>
            </div>

            {/* Media controls keep their usual left-to-right layout, as in other RTL apps. */}
            <div className="transport" dir="ltr">
              <button className="icon-btn skip" onClick={() => session.skip(-15)} aria-label="אחורה 15 שניות">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                </svg>
                <span>15</span>
              </button>
              <button className="main" onClick={() => session.toggle()} aria-label={snap.playing ? "השהיה" : "ניגון"}>
                {snap.playing ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="6" y="5" width="4" height="14" rx="1.2" />
                    <rect x="14" y="5" width="4" height="14" rx="1.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                  </svg>
                )}
              </button>
              <button className="icon-btn skip" onClick={() => session.skip(15)} aria-label="קדימה 15 שניות">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4h-4" />
                </svg>
                <span>15</span>
              </button>
            </div>

            {session.hasMusic && (
              <label className="mixer">
                <span>מוזיקה</span>
                <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => changeVol(Number(e.target.value))} aria-label="עוצמת מוזיקה" />
              </label>
            )}
          </div>
        </>
      )}
    </div>
  );
}
