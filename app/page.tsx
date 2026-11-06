"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addMood, dayKey, stats, useStore, type MoodRecord } from "@/lib/store";
import { greeting } from "@/lib/content";
import { asset, topic as findTopic, TOPICS, type TopicId } from "@/lib/guided";

const MOODS: { value: MoodRecord["mood"]; face: string; label: string }[] = [
  { value: 1, face: "😣", label: "קשה" },
  { value: 2, face: "😕", label: "לא משהו" },
  { value: 3, face: "😐", label: "בסדר" },
  { value: 4, face: "🙂", label: "טוב" },
  { value: 5, face: "😌", label: "רגוע" },
];

/** What to suggest right now: morning focus, daytime calm, evening body scan, night sleep. */
function suggestion(hour: number, mood?: number): { topic: TopicId; minutes: number; why: string } {
  if (hour >= 21 || hour < 5) return { topic: "sleep", minutes: 15, why: "לקראת השינה" };
  if (mood !== undefined && mood <= 2) return { topic: "calm", minutes: 10, why: "בשביל רגע של הקלה" };
  if (hour < 11) return { topic: "focus", minutes: 10, why: "פתיחת בוקר" };
  if (hour >= 17) return { topic: "body", minutes: 15, why: "לשחרר את היום" };
  return { topic: "calm", minutes: 5, why: "הפסקה קצרה באמצע היום" };
}

const PICKS: { topic: TopicId; minutes: number; label: string }[] = [
  { topic: "calm", minutes: 5, label: "הפסקת נשימה" },
  { topic: "focus", minutes: 5, label: "בוקר צלול" },
  { topic: "body", minutes: 10, label: "סריקה קצרה" },
  { topic: "sleep", minutes: 20, label: "לילה ארוך ורגוע" },
  { topic: "calm", minutes: 15, label: "שחרור לחץ עמוק" },
  { topic: "focus", minutes: 15, label: "כוונה ליום" },
];

export default function Home() {
  const state = useStore();
  const s = stats(state);
  // The hour is only known in the browser; render the day version until then.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);

  const todayMood = state.moods.find((m) => dayKey(new Date(m.at)) === dayKey(new Date()));
  const night = hour !== null && (hour >= 19 || hour < 5);
  const sug = suggestion(hour ?? 12, todayMood?.mood);
  const last = state.lastGuided && findTopic(state.lastGuided.topic) ? state.lastGuided : null;
  const sugTopic = findTopic(sug.topic)!;

  return (
    <div className="home">
      <section className="hero-full">
        <img className="bg" src={asset(night ? "img/hero-night.webp" : "img/hero-day.webp")} alt="" fetchPriority="high" />
        <div className="hero-copy">
          <h1 className="greet">{hour === null ? "שלום" : greeting(hour)}</h1>
          <p className="tagline">רגע של שקט, בעברית. נשימה, מדיטציה מודרכת ושינה טובה יותר, בכמה דקות ביום.</p>

          <Link href={`/meditate/${sug.topic}/?min=${sug.minutes}`} className="today-card">
            <img src={asset(sugTopic.image)} alt="" />
            <div className="t-body">
              <small>מומלץ עכשיו · {sug.why}</small>
              <b>{sugTopic.title}</b>
              <small>{sug.minutes} דקות · מדיטציה מודרכת</small>
            </div>
            <span className="play-dot" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            </span>
          </Link>
        </div>
      </section>

      <div className="home-inner">
        {last && (last.topic !== sug.topic || last.minutes !== sug.minutes) && (
          <p className="small muted" style={{ margin: "14px 0 0" }}>
            בפעם הקודמת:{" "}
            <Link href={`/meditate/${last.topic}/?min=${last.minutes}`}>
              {findTopic(last.topic)!.title}, {last.minutes} דקות
            </Link>
          </p>
        )}

        <div className="section-head">
          <h2>רגע מהיר</h2>
        </div>
        <div className="quick-row">
          <Link href="/breathe/" className="quick">
            <img src={asset("img/card-breathe.webp")} alt="" loading="lazy" />
            <b>נשימה</b>
            <span>דקה אחת שמרגיעה</span>
          </Link>
          <Link href="/meditate/timer/" className="quick">
            <img src={asset("img/card-timer.webp")} alt="" loading="lazy" />
            <b>טיימר שקט</b>
            <span>עם פעמונים</span>
          </Link>
          <Link href="/sleep/" className="quick">
            <img src={asset("img/card-sleep.webp")} alt="" loading="lazy" />
            <b>שינה</b>
            <span>צלילים ומוזיקה</span>
          </Link>
        </div>

        <div className="section-head">
          <h2>מדיטציות מודרכות</h2>
          <Link href="/meditate/">הכל ←</Link>
        </div>
        <div className="tiles">
          {TOPICS.map((t) => (
            <Link key={t.id} href={`/meditate/${t.id}/`} className="tile">
              <img src={asset(t.image)} alt="" loading="lazy" />
              <span className="pill">5 עד 20 דק׳</span>
              <h3>{t.title}</h3>
              <p>{t.subtitle}</p>
            </Link>
          ))}
        </div>

        <div className="section-head">
          <h2>בחירות מהירות</h2>
        </div>
        <div className="rail">
          {PICKS.map((p) => {
            const t = findTopic(p.topic)!;
            return (
              <Link key={`${p.topic}-${p.minutes}`} href={`/meditate/${p.topic}/?min=${p.minutes}`} className="mini">
                <div className="img">
                  <img src={asset(t.image)} alt="" loading="lazy" />
                  <span className="pill">{p.minutes} דק׳</span>
                </div>
                <b>{p.label}</b>
                <span>{t.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="section-head">
          <h2>היום שלך</h2>
          <Link href="/progress/">התקדמות ←</Link>
        </div>
        <div className="home-grid">
          <div className="glass-card checkin">
            <div className="checkin-top">
              <b>איך אתם מרגישים עכשיו?</b>
              <span className="streak" title="ימים ברצף">
                <i aria-hidden /> {s.streak} ימים ברצף
              </span>
            </div>
            <div className="mood-row" role="group" aria-label="מצב רוח">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  className="mood-btn"
                  aria-pressed={todayMood?.mood === m.value}
                  aria-label={m.label}
                  title={m.label}
                  onClick={() => addMood(m.value)}
                >
                  {m.face}
                </button>
              ))}
            </div>
            {todayMood && todayMood.mood <= 2 && (
              <p className="small muted" style={{ margin: 0 }}>
                יום לא פשוט. אולי <Link href="/meditate/calm/?min=5">חמש דקות של הרגעה</Link> יעזרו. ואם קשה מאוד,{" "}
                <Link href="/help/">יש עם מי לדבר</Link>.
              </p>
            )}
          </div>
          <div className="stat-row" style={{ margin: 0 }} aria-label="הסיכום שלך">
            <div className="stat">
              <b>{s.todayMinutes}</b>
              <span>דקות היום</span>
            </div>
            <div className="stat">
              <b>{s.totalMinutes}</b>
              <span>דקות בסך הכל</span>
            </div>
            <div className="stat">
              <b>{s.sessionsCount}</b>
              <span>תרגולים</span>
            </div>
          </div>
        </div>

        <footer className="footer-note">
          <span>רגע היא אפליקציה לרווחה אישית ואינה תחליף לטיפול. הנתונים נשמרים רק במכשיר שלך.</span>
          <Link href="/help/">צריכים עזרה עכשיו?</Link>
        </footer>
      </div>
    </div>
  );
}
