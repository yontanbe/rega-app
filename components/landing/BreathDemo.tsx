"use client";

import { useEffect, useState } from "react";

// One calm breath, the app's signature ratio: 4 seconds in, 6 seconds out. Mirrors the CSS animation timing.
const IN = 4000;
const OUT = 6000;

export default function BreathDemo() {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [count, setCount] = useState(4);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => {
      const t = (performance.now() - start) % (IN + OUT);
      if (t < IN) {
        setPhase("in");
        setCount(Math.ceil((IN - t) / 1000));
      } else {
        setPhase("out");
        setCount(Math.ceil((IN + OUT - t) / 1000));
      }
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="lp-breath" aria-live="off">
      <div className="lp-breath-orb" aria-hidden>
        <span className="ring r1" />
        <span className="ring r2" />
        <span className="core" />
      </div>
      <p className="lp-breath-label">
        <b>{phase === "in" ? "שאיפה" : "נשיפה"}</b>
        <span>{count}</span>
      </p>
    </div>
  );
}
