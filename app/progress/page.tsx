"use client";

import { clearAll, lastDays, stats, useStore } from "@/lib/store";

const MOOD_FACE = ["", "😣", "😕", "😐", "🙂", "😌"];
const KIND_LABEL = { breathe: "נשימה", meditate: "מדיטציה", sleep: "שינה" } as const;

function when(iso: string) {
  return new Date(iso).toLocaleString("he-IL", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ProgressPage() {
  const state = useStore();
  const s = stats(state);
  const days = lastDays(state);
  const max = Math.max(10, ...days.map((d) => d.minutes));

  return (
    <>
      <h1>התקדמות</h1>
      <p className="lead">הנתונים נשמרים רק במכשיר הזה.</p>

      <div className="stat-row">
        <div className="stat">
          <b>{s.streak}</b>
          <span>ימים ברצף</span>
        </div>
        <div className="stat">
          <b>{s.sessionsCount}</b>
          <span>תרגולים</span>
        </div>
        <div className="stat">
          <b>{s.totalMinutes}</b>
          <span>דקות</span>
        </div>
      </div>

      <h2>השבוע</h2>
      <div className="card">
        <div className="bars" role="img" aria-label="דקות תרגול ב-7 הימים האחרונים">
          {days.map((d) => (
            <div className="bar" key={d.key} title={`${d.minutes} דק׳`}>
              <span>{d.minutes || ""}</span>
              <i className={d.minutes ? "" : "empty"} style={{ height: `${(d.minutes / max) * 100}%` }} />
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {state.moods.length > 0 && (
        <>
          <h2>מצב רוח אחרון</h2>
          <div className="card" style={{ fontSize: "1.6rem", letterSpacing: "0.2em" }}>
            {state.moods
              .slice(0, 10)
              .reverse()
              .map((m) => (
                <span key={m.id} title={when(m.at)}>
                  {MOOD_FACE[m.mood]}
                </span>
              ))}
          </div>
        </>
      )}

      <h2>היסטוריה</h2>
      {state.sessions.length === 0 ? (
        <p className="muted">עוד אין תרגולים. אפשר להתחיל בדקה אחת של נשימה.</p>
      ) : (
        <ul className="history">
          {state.sessions.slice(0, 30).map((r) => (
            <li key={r.id}>
              <span>
                {r.title}
                <br />
                <span className="small muted">
                  {KIND_LABEL[r.kind]} · {when(r.endedAt)}
                </span>
              </span>
              <b>{Math.max(1, Math.round(r.seconds / 60))} דק׳</b>
            </li>
          ))}
        </ul>
      )}

      {state.sessions.length + state.moods.length > 0 && (
        <p style={{ marginTop: 28 }}>
          <button
            className="btn secondary block"
            onClick={() => {
              if (window.confirm("למחוק את כל ההיסטוריה מהמכשיר?")) clearAll();
            }}
          >
            מחיקת כל הנתונים
          </button>
        </p>
      )}
    </>
  );
}
