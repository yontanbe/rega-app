import Link from "next/link";
import type { Metadata } from "next";
import "@fontsource/bellefair/400.css";
import "./landing.css";
import { asset, DURATIONS, TOPICS } from "@/lib/guided";
import BreathDemo from "@/components/landing/BreathDemo";
import { MusicShelf, SampleButton } from "@/components/landing/AudioPreview";

export const metadata: Metadata = {
  title: "רגע: מדיטציה מודרכת בעברית",
};

const FEATURES = [
  { title: "קול נשי או גברי", text: "כל מדיטציה הוקלטה בשני קולות רכים בעברית. בוחרים את מי שנעים לכם לשמוע." },
  { title: "כתוביות מסונכרנות", text: "המשפט שנאמר מופיע על המסך, כדי שגם בלי אוזניות אפשר לעקוב." },
  { title: "ממשיך במסך נעול", text: "מניחים את הטלפון ועוצמים עיניים. שליטה מלאה ממסך הנעילה." },
  { title: "עובד בלי אינטרנט", text: "שומרים מדיטציה למכשיר בלחיצה, ומקשיבים גם בטיסה או במקלט." },
  { title: "בלי הרשמה, בלי מעקב", text: "אין חשבון ואין פרסומות. ההתקדמות שלכם נשמרת רק אצלכם במכשיר." },
  { title: "מוזיקה מקורית", text: "שמונה יצירות שנוצרו במיוחד לרגע, בלופ רציף ונקי, בלי בעיות זכויות." },
];

export default function Landing() {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Link href="/" className="lp-brand" aria-label="רגע">
            <span className="lp-brand-dot" aria-hidden />
            רגע
          </Link>
          <nav aria-label="ניווט בעמוד" className="lp-links">
            <a href="#collections">מדיטציות</a>
            <a href="#music">מוזיקה</a>
            <a href="#inside">באפליקציה</a>
          </nav>
          <Link href="/app/" className="lp-btn small">
            כניסה
          </Link>
        </div>
      </header>

      <section className="lp-hero">
        <picture>
          <source media="(min-width: 760px)" srcSet={asset("img/landing-wide.webp")} />
          <img src={asset("img/landing-tall.webp")} alt="" className="lp-hero-img" fetchPriority="high" />
        </picture>
        <div className="lp-wrap lp-hero-in">
          <p className="lp-eyebrow">מדיטציה מודרכת · נשימה · שינה</p>
          <h1 className="lp-display">
            רגע אחד
            <br />
            של שקט.
          </h1>
          <p className="lp-lead">
            מדיטציות מודרכות בעברית של 5 עד 20 דקות, בקול רך ועם מוזיקה מקורית ברקע. לבוקר, לאמצע יום לחוץ ולפני השינה.
          </p>
          <div className="lp-ctas">
            <Link href="/app/" className="lp-btn">
              להתחיל עכשיו, בחינם
            </Link>
            <SampleButton />
          </div>
          <ul className="lp-facts" aria-label="מה יש ברגע">
            <li>
              <b>{TOPICS.length}</b> מסלולים מודרכים
            </li>
            <li>
              <b>{TOPICS.length * DURATIONS.length * 2}</b> הקלטות
            </li>
            <li>
              <b>8</b> יצירות מוזיקה
            </li>
          </ul>
        </div>
      </section>

      <section className="lp-section lp-breath-sec" aria-labelledby="breath-h">
        <div className="lp-wrap lp-breath-grid">
          <div>
            <p className="lp-eyebrow">לפני שממשיכים</p>
            <h2 id="breath-h" className="lp-h2">
              נשימה אחת איתנו.
            </h2>
            <p className="lp-text">
              ארבע שניות פנימה, שש שניות החוצה. נשיפה ארוכה מהשאיפה מאטה את הדופק ומאותתת לגוף שהוא בטוח. זה כל הסוד, ואפשר לעשות את זה בכל
              מקום.
            </p>
            <Link href="/breathe/" className="lp-link">
              לעוד ארבעה תרגילי נשימה ←
            </Link>
          </div>
          <BreathDemo />
        </div>
      </section>

      <section id="collections" className="lp-section" aria-labelledby="col-h">
        <div className="lp-wrap">
          <p className="lp-eyebrow">המסלולים</p>
          <h2 id="col-h" className="lp-h2">
            מה צריך עכשיו?
          </h2>
          <div className="lp-cols">
            {TOPICS.map((t) => (
              <Link key={t.id} href={`/meditate/${t.id}/`} className="lp-col">
                <img src={asset(t.image)} alt="" loading="lazy" />
                <span className="lp-col-body">
                  {t.isNew && <span className="lp-new">חדש</span>}
                  <b>{t.title}</b>
                  <span>{t.subtitle}</span>
                  <small>{DURATIONS.join(" · ")} דקות</small>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="music" className="lp-section" aria-labelledby="music-h">
        <div className="lp-wrap">
          <p className="lp-eyebrow">מוזיקה ברקע</p>
          <h2 id="music-h" className="lp-h2">
            גלים, קערות טיבטיות ומנטרה.
          </h2>
          <p className="lp-text">
            כל מדיטציה מגיעה עם מוזיקה שמתנגנת בלופ רציף מתחת לקול. אפשר להחליף, להנמיך או לוותר. לחצו על יצירה כדי לשמוע.
          </p>
          <MusicShelf />
        </div>
      </section>

      <section id="inside" className="lp-section" aria-labelledby="inside-h">
        <div className="lp-wrap lp-inside">
          <div className="lp-phones" aria-hidden>
            <div className="lp-phone back">
              <img src={asset("img/shot-home.webp")} alt="" />
            </div>
            <div className="lp-phone front">
              <img src={asset("img/shot-player.webp")} alt="" />
            </div>
          </div>
          <div>
            <p className="lp-eyebrow">באפליקציה</p>
            <h2 id="inside-h" className="lp-h2">
              נבנתה לרגעים האמיתיים.
            </h2>
            <ul className="lp-features">
              {FEATURES.map((f) => (
                <li key={f.title}>
                  <b>{f.title}</b>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="install-h">
        <div className="lp-wrap lp-install">
          <h2 id="install-h" className="lp-h2">
            על המסך הראשי, כמו אפליקציה.
          </h2>
          <div className="lp-install-grid">
            <div>
              <b>iPhone</b>
              <span>פותחים ב-Safari, לוחצים על כפתור השיתוף ובוחרים ״הוספה למסך הבית״.</span>
            </div>
            <div>
              <b>Android</b>
              <span>פותחים ב-Chrome, ובתפריט בוחרים ״התקנת אפליקציה״.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap lp-final-in">
          <h2 className="lp-display small">יש לכם רגע?</h2>
          <p className="lp-lead">חמש דקות זה מספיק כדי להתחיל.</p>
          <Link href="/meditate/calm/?min=5" className="lp-btn">
            חמש דקות של הרגעה
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-in">
          <span>רגע היא אפליקציה לרווחה אישית ואינה תחליף לטיפול רפואי או נפשי.</span>
          <Link href="/help/">קשה לכם עכשיו? יש עם מי לדבר</Link>
        </div>
      </footer>
    </div>
  );
}
