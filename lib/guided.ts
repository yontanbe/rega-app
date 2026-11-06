import script from "@/content/guided.json";
import timeline from "./guided-timeline.json";

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE}/${path.replace(/^\//, "")}`;

export type TopicId = "calm" | "body" | "sleep" | "focus" | "manifest";
export type Voice = "f" | "m";
export type Minutes = 5 | 10 | 15 | 20;

export const DURATIONS: Minutes[] = [5, 10, 15, 20];

export const VOICES: { id: Voice; label: string }[] = [
  { id: "f", label: "קול נשי" },
  { id: "m", label: "קול גברי" },
];

export interface Topic {
  id: TopicId;
  title: string;
  subtitle: string;
  image: string;
  tint: string;
  defaultMusic: MusicId;
  isNew: boolean;
  phrases: string[];
}

const META: Record<TopicId, { image: string; tint: string; music: MusicId; isNew?: boolean }> = {
  manifest: { image: "img/topic-manifest.webp", tint: "#f2c98f", music: "mantra", isNew: true },
  calm: { image: "img/topic-calm.webp", tint: "#e9b7a0", music: "ocean" },
  body: { image: "img/topic-body.webp", tint: "#c6b9f2", music: "tibetan" },
  sleep: { image: "img/topic-sleep.webp", tint: "#8f9ad8", music: "night" },
  focus: { image: "img/topic-focus.webp", tint: "#b4d4c8", music: "garden" },
};

// Display order: the newest collection first.
const ORDER: TopicId[] = ["manifest", "calm", "body", "sleep", "focus"];

export const TOPICS: Topic[] = script.topics.map((t) => {
  const id = t.id as TopicId;
  return {
    id,
    title: t.title,
    subtitle: t.subtitle,
    image: META[id].image,
    tint: META[id].tint,
    defaultMusic: META[id].music,
    isNew: Boolean(META[id].isNew),
    phrases: t.phrases.map((p) => p.text),
  };
}).sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

export function topic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function sessionUrl(t: TopicId, minutes: Minutes, voice: Voice) {
  return asset(`audio/guided/${t}-${minutes}-${voice}.mp3`);
}

/** Phrase start times (seconds) for captions: [[start, phraseIndex], ...]. */
export function cues(t: TopicId, minutes: Minutes, voice: Voice): [number, number][] {
  return ((timeline as unknown as Record<string, [number, number][]>)[`${t}-${minutes}-${voice}`] ?? []) as [number, number][];
}

// ---------- background music (original pieces generated with Lyria) ----------

export type MusicId = "ocean" | "tibetan" | "indian" | "mantra" | "flow" | "dawn" | "garden" | "night";

export const MUSIC: { id: MusicId; name: string; description: string; image: string }[] = [
  { id: "ocean", name: "גלי ים", description: "גלים רכים ופד חם", image: "img/music-ocean.webp" },
  { id: "tibetan", name: "קערות טיבטיות", description: "קערות מזמרות וגונג רחוק", image: "img/music-tibetan.webp" },
  { id: "indian", name: "ראגה הודית", description: "טנפורה, סיטאר וחליל", image: "img/music-indian.webp" },
  { id: "mantra", name: "מנטרה", description: "אום בקולות עמוקים", image: "img/music-mantra.webp" },
  { id: "flow", name: "פסנתר רך", description: "אקורדים איטיים ומרחב", image: "img/card-breathe.webp" },
  { id: "dawn", name: "שחר", description: "צלילים ארוכים ואווריריים", image: "img/hero-day.webp" },
  { id: "garden", name: "גן", description: "קלימבה עדינה ומרימבה", image: "img/topic-focus.webp" },
  { id: "night", name: "לילה", description: "דרון עמוק ושקט לשינה", image: "img/topic-sleep.webp" },
];

export const musicUrl = (id: MusicId) => asset(`audio/music/${id}.mp3`);
