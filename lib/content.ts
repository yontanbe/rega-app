import type { SoundscapeId } from "./audio";

export interface Phase {
  label: string;
  seconds: number;
  /** Circle scale at the end of this phase (0.55 = empty lungs, 1 = full). */
  scale: number;
  cue: "in" | "out" | "hold";
}

export interface BreathPattern {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
}

const IN = (s: number): Phase => ({ label: "שאיפה", seconds: s, scale: 1, cue: "in" });
const OUT = (s: number): Phase => ({ label: "נשיפה", seconds: s, scale: 0.55, cue: "out" });
const HOLD_FULL = (s: number): Phase => ({ label: "החזקה", seconds: s, scale: 1, cue: "hold" });
const HOLD_EMPTY = (s: number): Phase => ({ label: "החזקה", seconds: s, scale: 0.55, cue: "hold" });

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: "calm",
    name: "הרגעה",
    description: "שאיפה של 4, נשיפה ארוכה של 6. נשיפה ארוכה מאטה את הדופק.",
    phases: [IN(4), OUT(6)],
  },
  {
    id: "box",
    name: "נשימת קופסה",
    description: "4 שאיפה, 4 החזקה, 4 נשיפה, 4 החזקה. לריכוז ולפני רגע לחוץ.",
    phases: [IN(4), HOLD_FULL(4), OUT(4), HOLD_EMPTY(4)],
  },
  {
    id: "478",
    name: "4-7-8",
    description: "4 שאיפה, 7 החזקה, 8 נשיפה. טובה לפני השינה.",
    phases: [IN(4), HOLD_FULL(7), OUT(8)],
  },
  {
    id: "coherent",
    name: "קוהרנטית",
    description: "חמש וחצי שניות פנימה, חמש וחצי החוצה. קצב אחיד ונעים.",
    phases: [IN(5.5), OUT(5.5)],
  },
];

export interface Soundscape {
  id: SoundscapeId;
  name: string;
  description: string;
  hue: number;
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: "rain", name: "גשם", description: "גשם רך על הגג", hue: 210 },
  { id: "ocean", name: "ים", description: "גלים שבאים והולכים", hue: 190 },
  { id: "wind", name: "רוח", description: "רוח בין העצים", hue: 150 },
  { id: "brown", name: "רעש חום", description: "רעש עמוק ואחיד שמסתיר רעשי רקע", hue: 30 },
];

export function greeting(hour: number) {
  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 22) return "ערב טוב";
  return "לילה טוב";
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
