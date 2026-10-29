import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], weight: ["300", "400", "500", "700"], display: "swap" });
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "רגע: נשימה, מדיטציה ושינה",
  description: "רגע של שקט: תרגילי נשימה, טיימר מדיטציה וצלילים לשינה. בעברית, ועובד גם בלי אינטרנט.",
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: [{ url: `${base}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "רגע", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1322" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.className}>
      <body>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="רגע, לדף הבית">
              <span className="brand-dot" aria-hidden />
              רגע
            </Link>
            <Link href="/help/" className="help-link">
              עזרה עכשיו
            </Link>
          </header>
          <main className="content">{children}</main>
          <BottomNav />
        </div>
        <SwRegister />
      </body>
    </html>
  );
}
