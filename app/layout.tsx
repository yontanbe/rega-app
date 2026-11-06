import type { Metadata, Viewport } from "next";
import "@fontsource-variable/heebo";
import SwRegister from "@/components/SwRegister";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "רגע: מדיטציה מודרכת, נשימה ושינה בעברית",
  description: "מדיטציות מודרכות בעברית של 5 עד 20 דקות בקול נשי או גברי, עם מוזיקה מקורית. תרגילי נשימה, טיימר שקט וצלילים לשינה. עובד גם בלי אינטרנט.",
  openGraph: {
    title: "רגע: מדיטציה מודרכת בעברית",
    description: "רגע של שקט, בעברית. מדיטציות מודרכות, נשימה ושינה טובה יותר.",
    locale: "he_IL",
    type: "website",
    images: [{ url: `${base}/img/og.jpg`, width: 1200, height: 630 }],
  },
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
    { media: "(prefers-color-scheme: light)", color: "#fbf6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#15152a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
