import Link from "next/link";
import type { Metadata } from "next";
import { asset, DURATIONS, TOPICS } from "@/lib/guided";

export const metadata: Metadata = { title: "מדיטציה | רגע" };

export default function MeditateHub() {
  return (
    <>
      <section className="page-hero">
        <img src={asset("img/hero-day.webp")} alt="" />
        <div className="ph-copy">
          <p className="eyebrow" style={{ color: "#fff", opacity: 0.85 }}>
            מדיטציה מודרכת
          </p>
          <h1>להאט, לנשום, לחזור לעצמך</h1>
          <p>ארבעה מסעות בקול רך בעברית, עם מוזיקה מקורית ברקע. בוחרים זמן ומתחילים.</p>
        </div>
      </section>

      <div className="topic-list">
        {TOPICS.map((t) => (
          <Link key={t.id} href={`/meditate/${t.id}/`} className="topic-row">
            <img src={asset(t.image)} alt="" loading="lazy" />
            <div>
              <b>{t.title}</b>
              <span>{t.subtitle}</span>
              <div className="durs">{DURATIONS.join(" · ")} דקות · קול נשי או גברי</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>בלי הדרכה</h2>
      </div>
      <Link href="/meditate/timer/" className="topic-row">
        <img src={asset("img/card-timer.webp")} alt="" loading="lazy" />
        <div>
          <b>טיימר שקט</b>
          <span>שקט, פעמון פתיחה וסיום, פעמוני ביניים ומוזיקה או צליל רקע לבחירה.</span>
        </div>
      </Link>
    </>
  );
}
