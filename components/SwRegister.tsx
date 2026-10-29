"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production builds only (dev reloads would fight the cache). */
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
  }, []);
  return null;
}
