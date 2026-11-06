import script from "@/content/guided.json";
import timeline from "./guided-timeline.json";

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE}/${path.replace(/^\//, "")}`;

export type TopicId = "calm" | "body" | "sleep" | "focus";
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
  phrases: string[];
}

const META: Record<TopicId, { image: string; tint: string; music: MusicId }> = {
  calm: { image: "img/topic-calm.webp", tint: "#e9b7a0", music: "flow" },
  body: { image: "img/topic-body.webp", tint: "#c6b9f2", music: "dawn" },
  sleep: { image: "img/topic-sleep.webp", tint: "#8f9ad8", music: "night" },
  focus: { image: "img/topic-focus.webp", tint: "#b4d4c8", music: "garden" },
};

export const TOPICS: Topic[] = script.topics.map((t) => {
  const id = t.id as TopicId;
  return {
    id,
    title: t.title,
    subtitle: t.subtitle,
    image: META[id].image,
    tint: META[id].tint,
    defaultMusic: META[id].music,
    phrases: t.phrases.map((p) => p.text),
  };
});

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

export type MusicId = "flow" | "dawn" | "garden" | "night";

export const MUSIC: { id: MusicId; name: string; description: string }[] = [
  { id: "flow", name: "פסנתר רך", description: "אקורדים איטיים ומרחב" },
  { id: "dawn", name: "שחר", description: "צלילים ארוכים ואווריריים" },
  { id: "garden", name: "גן", description: "קלימבה עדינה ומרימבה" },
  { id: "night", name: "לילה", description: "דרון עמוק ושקט לשינה" },
];

export const musicUrl = (id: MusicId) => asset(`audio/music/${id}.mp3`);
