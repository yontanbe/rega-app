"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addMood, dayKey, stats, useStore, type MoodRecord } from "@/lib/store";
import { greeting } from "@/lib/content";

const MOODS: { value: MoodRecord["mood"]; face: string; label: string }[] = [
  { value: 1, face: "😣", label: "קשה" },
  { value: 2, face: "😕", label: "לא משהו" },
  { value: 3, face: "😐", label: "בסדר" },
  { value: 4, face: "🙂", label: "טוב" },
  { value: 5, face: "😌", label: "רגוע" },
];

export default function Home() {
  const state = useStore();
  const s = stats(state);
  // The hour is only known in the browser; render a neutral title until then.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);

  const todayMood = state.moods.find((m) => dayKey(new Date(m.at)) === dayKey(new Date()));
  const night = hour !== null && (hour >= 21 || hour < 5);

  const hero = night
    ? { href: "/sleep/", cls: "f-sleep", title: "מתכוננים לשינה", text: "צליל רקע רך עם טיימר שנכבה לבד" }
    : { href: "/breathe/", cls: "f-breathe", title: "דקה של נשימה", text: "נשימת הרגעה: 4 פנימה, 6 החוצה" };

  return (
    <>
      <h1>{hour === null ? "שלום" : greeting(hour)}</h1>
      <p className="lead">איך אפשר לעזור לך להאט רגע?</p>

      <Link href={hero.href} className={`feature hero ${hero.cls}`}>
        <h3>{hero.title}</h3>
        <p>{hero.text}</p>
      </Link>

      <div className="stat-row" aria-label="הסיכום שלך">
        <div className="stat">
          <b>{s.streak}</b>
          <span>ימים ברצף</span>
        </div>
        <div className="stat">
          <b>{s.todayMinutes}</b>
          <span>דקות היום</span>
        </div>
        <div className="stat">
          <b>{s.totalMinutes}</b>
          <span>דקות בסך הכל</span>
        </div>
      </div>

      <h2>איך את/ה מרגיש/ה עכשיו?</h2>
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
        <p className="small muted">
          יום לא פשוט. אולי <Link href="/breathe/">שלוש דקות של נשימה</Link> יעזרו. ואם קשה מאוד,{" "}
          <Link href="/help/">יש עם מי לדבר</Link>.
        </p>
      )}

      <h2>מה בא לך?</h2>
      <div className="grid-2">
        <Link href="/breathe/" className="feature f-breathe">
          <h3>נשימה</h3>
          <p>4 תרגילים מונחים</p>
        </Link>
        <Link href="/meditate/" className="feature f-meditate">
          <h3>מדיטציה</h3>
          <p>טיימר עם פעמונים</p>
        </Link>
        <Link href="/sleep/" className="feature f-sleep">
          <h3>שינה</h3>
          <p>גשם, ים, רוח</p>
        </Link>
        <Link href="/progress/" className="feature f-progress">
          <h3>התקדמות</h3>
          <p>{s.sessionsCount} תרגולים</p>
        </Link>
      </div>
    </>
  );
}
