import type { Metadata } from "next";

export const metadata: Metadata = { title: "עזרה עכשיו | רגע" };

const LINES = [
  { name: "ער״ן: עזרה ראשונה נפשית", detail: "24/7, אנונימי", tel: "1201", label: "1201" },
  { name: "סה״ר: סיוע ברשת", detail: "צ׳אט, וואטסאפ", href: "https://sahar.org.il/", label: "לאתר" },
  { name: "נט״ל: טראומה על רקע לאומי", detail: "קו סיוע", tel: "1800363363", label: "1-800-363-363" },
  { name: "מד״א", detail: "מצב חירום רפואי", tel: "101", label: "101" },
  { name: "משטרה", detail: "סכנה מיידית", tel: "100", label: "100" },
];

export default function HelpPage() {
  return (
    <>
      <h1>עזרה עכשיו</h1>
      <p className="lead">אם קשה לך מאוד, את/ה לא לבד. אפשר לדבר עם מישהו עכשיו, בחינם.</p>

      <div className="notice" style={{ marginBottom: 18 }}>
        אם יש סכנה מיידית לחיים, התקשרו ל-<a href="tel:101">101</a> או ל-<a href="tel:100">100</a>.
      </div>

      <div className="card">
        {LINES.map((l) => (
          <div className="hotline" key={l.name}>
            <span>
              <b>{l.name}</b>
              <br />
              <span className="small muted">{l.detail}</span>
            </span>
            <a className="btn" href={l.tel ? `tel:${l.tel}` : l.href} target={l.href ? "_blank" : undefined} rel="noreferrer">
              {l.label}
            </a>
          </div>
        ))}
      </div>

      <h2>מחוץ לישראל</h2>
      <p className="muted small">
        בארה״ב ובקנדה: 988. במדינות אחרות אפשר למצוא קו סיוע באתר{" "}
        <a href="https://findahelpline.com/" target="_blank" rel="noreferrer">
          findahelpline.com
        </a>
        .
      </p>

      <h2>על רגע</h2>
      <p className="muted small">
        רגע היא אפליקציה לרווחה אישית: נשימה, מדיטציה ושינה. היא לא שירות רפואי, לא מאבחנת ולא מחליפה טיפול. כל הנתונים נשמרים רק
        במכשיר שלך ולא נשלחים לשום מקום.
      </p>
    </>
  );
}
