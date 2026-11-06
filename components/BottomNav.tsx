"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/app/",
    label: "בית",
    icon: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  },
  {
    href: "/breathe/",
    label: "נשימה",
    icon: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
  },
  {
    href: "/meditate/",
    label: "מדיטציה",
    icon: (
      <>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 9v4l2.5 2M9.5 3.5h5" />
      </>
    ),
  },
  {
    href: "/sleep/",
    label: "שינה",
    icon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
  },
  {
    href: "/progress/",
    label: "התקדמות",
    icon: <path d="M5 19V12M10 19V7M15 19v-5M20 19V4" />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      <ul>
        {ITEMS.map((item) => {
          const active = normalized.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
