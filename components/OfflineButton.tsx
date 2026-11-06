"use client";

import { useEffect, useState } from "react";

// Must match MEDIA_CACHE in public/sw.js, which serves these files (with range requests) when offline.
const MEDIA_CACHE = "rega-media-v1";

type State = "unknown" | "idle" | "saving" | "saved" | "error";

export default function OfflineButton({ urls, label }: { urls: string[]; label: string }) {
  const [state, setState] = useState<State>("unknown");
  const key = urls.join("|");

  useEffect(() => {
    let alive = true;
    if (!("caches" in window)) return;
    (async () => {
      try {
        const c = await caches.open(MEDIA_CACHE);
        const hits = await Promise.all(urls.map((u) => c.match(u)));
        if (alive) setState(hits.every(Boolean) ? "saved" : "idle");
      } catch {
        if (alive) setState("idle");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (state === "unknown") return null;

  async function save() {
    setState("saving");
    try {
      const c = await caches.open(MEDIA_CACHE);
      for (const u of urls) {
        if (await c.match(u)) continue;
        const res = await fetch(u, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        await c.put(u, res);
      }
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <button className="btn secondary block" onClick={save} disabled={state === "saving" || state === "saved"} style={{ minHeight: 46, fontSize: "0.95rem" }}>
      {state === "saved" ? "✓ שמור במכשיר, זמין גם בלי אינטרנט" : state === "saving" ? "שומר..." : state === "error" ? "השמירה נכשלה. לנסות שוב?" : label}
    </button>
  );
}
