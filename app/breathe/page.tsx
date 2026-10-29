"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BREATH_PATTERNS, formatClock, type BreathPattern } from "@/lib/content";
import { keepScreenOn, playBell, playBreathCue, vibrate } from "@/lib/audio";
import { addSession, updateSettings, useStore } from "@/lib/store";

const DURATIONS = [1, 3, 5, 10];

function phaseAt(pattern: BreathPattern, elapsed: number) {
  const cycle = pattern.phases.reduce((sum, p) => sum + p.seconds, 0);
  let pos = elapsed % cycle;
  for (let i = 0; i < pattern.phases.length; i++) {
    const p = pattern.phases[i];
    if (pos < p.seconds) return { index: i, phase: p, remaining: p.seconds - pos, cycleNo: Math.floor(elapsed / cycle) };
    pos -= p.seconds;
  }
  return { index: 0, phase: pattern.phases[0], remaining: pattern.phases[0].seconds, cycleNo: 0 };
}

export default function BreathePage() {
  const { settings } = useStore();
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0].id);
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState<number | null>(null);
  const startRef = useRef(0);
  const lastPhaseKey = useRef("");
  const releaseWake = useRef<() => void>(() => {});

  const pattern = useMemo(() => BREATH_PATTERNS.find((p) => p.id === patternId)!, [patternId]);
  const total = minutes * 60;
  const current = phaseAt(pattern, elapsed);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const t = (performance.now() - startRef.current) / 1000;
      if (t >= total) {
        finish(total);
        return;
      }
      setElapsed(t);
    }, 100);
    return () => window.clearInterval(id);
  }, [running, total]);

  // Sound and haptics on every phase change.
  useEffect(() => {
    if (!running) return;
    const key = `${current.cycleNo}-${current.index}`;
    if (key === lastPhaseKey.current) return;
    lastPhaseKey.current = key;
    if (settings.sound) playBreathCue(current.phase.cue, current.phase.seconds);
    if (settings.haptics) vibrate(current.phase.cue === "hold" ? 15 : 35);
  }, [running, current.cycleNo, current.index, current.phase, settings.sound, settings.haptics]);

  useEffect(() => () => releaseWake.current(), []);

  async function start() {
    setDone(null);
    setElapsed(0);
    lastPhaseKey.current = "";
    startRef.current = performance.now();
    setRunning(true);
    releaseWake.current = await keepScreenOn();
  }

  function finish(seconds: number) {
    setRunning(false);
    releaseWake.current();
    if (settings.sound && seconds >= total) playBell(262, 0.25);
    addSession("breathe", `נשימה: ${pattern.name}`, seconds);
    setDone(seconds);
    setElapsed(0);
  }

  // When idle the orb rests half-full; while running it moves to the current phase's target over the phase length.
  const scale = running ? current.phase.scale : 0.75;
  const transitionSeconds = running ? Math.max(current.remaining, 0.3) : 0.8;

  return (
    <>
      <h1>נשימה</h1>
      <p className="lead">{running ? pattern.description : "בחר/י תרגיל ומשך, ותני/תן לעיגול להוביל."}</p>

      <div className="breath-stage">
        <div className="breath-orb-wrap">
          <div className="breath-ring" aria-hidden />
          <div
            className="breath-orb"
            style={{ transform: `scale(${scale})`, transitionDuration: `${transitionSeconds}s` }}
            aria-hidden
          />
          <div className="breath-label" aria-live="polite">
            {running ? (
              <>
                <b>{current.phase.label}</b>
                <span>{Math.ceil(current.remaining)}</span>
              </>
            ) : done !== null ? (
              <>
                <b>כל הכבוד</b>
                <span>{Math.round(done / 60)} דק׳ נשמרו</span>
              </>
            ) : (
              <b>{pattern.name}</b>
            )}
          </div>
        </div>
        <div className="session-meta">{running ? `נותרו ${formatClock(total - elapsed)}` : `${minutes} דקות`}</div>
        {running ? (
          <button className="btn secondary" onClick={() => finish((performance.now() - startRef.current) / 1000)}>
            סיום
          </button>
        ) : (
          <button className="btn" onClick={start}>
            התחלה
          </button>
        )}
      </div>

      {!running && (
        <>
          <h2>תרגיל</h2>
          <div className="pattern-list">
            {BREATH_PATTERNS.map((p) => (
              <button key={p.id} className="pattern" aria-pressed={p.id === patternId} onClick={() => setPatternId(p.id)}>
                <b>{p.name}</b>
                <span>{p.description}</span>
              </button>
            ))}
          </div>

          <h2>משך</h2>
          <div className="chips">
            {DURATIONS.map((m) => (
              <button key={m} className="chip" aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
                {m} דק׳
              </button>
            ))}
          </div>

          <h2>הגדרות</h2>
          <div className="card">
            <div className="toggle-row">
              <span>צליל מנחה</span>
              <button
                className="switch"
                role="switch"
                aria-checked={settings.sound}
                aria-label="צליל מנחה"
                onClick={() => updateSettings({ sound: !settings.sound })}
              />
            </div>
            <div className="toggle-row">
              <span>
                רטט
                <br />
                <span className="small muted">באנדרואיד בלבד</span>
              </span>
              <button
                className="switch"
                role="switch"
                aria-checked={settings.haptics}
                aria-label="רטט"
                onClick={() => updateSettings({ haptics: !settings.haptics })}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
