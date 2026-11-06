import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/app/" className="brand" aria-label="רגע, למסך הבית">
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
  );
}
