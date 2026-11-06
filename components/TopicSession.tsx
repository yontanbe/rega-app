"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { asset, DURATIONS, MUSIC, topic as findTopic, VOICES, type Minutes, type MusicId, type TopicId } from "@/lib/guided";
import { GuidedSession } from "@/lib/session";
import { setLastGuided, updateSettings, useStore } from "@/lib/store";
import GuidedPlayer from "./GuidedPlayer";
import OfflineButton from "./OfflineButton";
import { sessionUrl, musicUrl } from "@/lib/guided";

export default function TopicSession({ topicId }: { topicId: TopicId }) {
  const t = findTopic(topicId)!;
  const { settings } = useStore();
  const [minutes, setMinutes] = useState<Minutes>(10);
  const [music, setMusic] = useState<MusicId | "none">(t.defaultMusic);
  const [session, setSession] = useState<GuidedSession | null>(null);

  // Read ?min= from the link (the home page links straight to a length) and the saved music choice.
  useEffect(() => {
    const m = Number(new URLSearchParams(location.search).get("min"));
    if (DURATIONS.includes(m as Minutes)) setMinutes(m as Minutes);
  }, []);

  const voice = settings.voice;

  function start() {
    // Created inside the click so phones allow audio to start.
    const s = new GuidedSession(t, minutes, voice, music, settings.musicVolume);
    s.start();
    setLastGuided(t.id, minutes);
    setSession(s);
  }

  return (
    <>
      <section className="page-hero" style={{ minHeight: 280 }}>
        <img src={asset(t.image)} alt="" />
        <div className="ph-copy">
          <Link href="/meditate/" className="pill" style={{ textDecoration: "none", marginBottom: 10 }}>
            → כל המדיטציות
          </Link>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
      </section>

      <div className="setup">
        <div>
          <span className="lbl small muted" style={{ display: "block", marginBottom: 8 }}>
            כמה זמן?
          </span>
          <div className="seg" role="group" aria-label="משך">
            {DURATIONS.map((m) => (
              <button key={m} aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
                {m} דק׳
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="lbl small muted" style={{ display: "block", marginBottom: 8 }}>
            קול מדריך
          </span>
          <div className="seg" role="group" aria-label="קול">
            {VOICES.map((v) => (
              <button key={v.id} aria-pressed={v.id === voice} onClick={() => updateSettings({ voice: v.id })}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="lbl small muted" style={{ display: "block", marginBottom: 8 }}>
            מוזיקת רקע
          </span>
          <div className="music-grid" role="group" aria-label="מוזיקה">
            {MUSIC.map((m) => (
              <button key={m.id} className="music-opt" aria-pressed={music === m.id} onClick={() => setMusic(m.id)}>
                <b>{m.name}</b>
                <span>{m.description}</span>
              </button>
            ))}
            <button className="music-opt" aria-pressed={music === "none"} onClick={() => setMusic("none")}>
              <b>בלי מוזיקה</b>
              <span>רק הקול והשקט</span>
            </button>
          </div>
        </div>

        <button className="btn big block" onClick={start}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
          </svg>
          התחלה · {minutes} דקות
        </button>

        <OfflineButton
          urls={[sessionUrl(t.id, minutes, voice), ...(music === "none" ? [] : [musicUrl(music)])]}
          label={`שמירה לשימוש בלי אינטרנט (${minutes} דק׳)`}
        />

        <p className="small muted" style={{ margin: 0 }}>
          {t.id === "sleep"
            ? "המדיטציה מסתיימת בשקט, בלי פעמון, כדי שתוכלו להירדם. אפשר לכבות את המסך, הקול ימשיך."
            : "מומלץ אוזניות. אפשר לכבות את המסך, הקול ימשיך. כשהמחשבות נודדות, פשוט חוזרים לנשימה."}
        </p>
      </div>

      {session && (
        <GuidedPlayer
          session={session}
          voice={voice}
          musicVolume={settings.musicVolume}
          onClose={() => setSession(null)}
        />
      )}
    </>
  );
}
