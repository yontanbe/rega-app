"use client";

import { useSyncExternalStore } from "react";

// All user data lives in this browser only (localStorage). A synced backend comes later.

export type SessionKind = "breathe" | "meditate" | "sleep";

export interface SessionRecord {
  id: string;
  kind: SessionKind;
  title: string;
  seconds: number;
  endedAt: string; // ISO
}

export interface MoodRecord {
  id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  at: string; // ISO
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  voice: "f" | "m";
  music: "none" | "flow" | "dawn" | "garden" | "night";
  musicVolume: number;
}

export interface LastGuided {
  topic: string;
  minutes: number;
  at: string; // ISO
}

export interface State {
  sessions: SessionRecord[];
  moods: MoodRecord[];
  settings: Settings;
  lastGuided?: LastGuided;
}

const KEY = "rega:v1";
const CHANGE_EVENT = "rega:store";
const EMPTY: State = { sessions: [], moods: [], settings: { sound: true, haptics: true, voice: "f", music: "flow", musicVolume: 0.5 } };

let cache: State | null = null;

function read(): State {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<State>) : {};
    cache = {
      sessions: parsed.sessions ?? [],
      moods: parsed.moods ?? [],
      settings: { ...EMPTY.settings, ...parsed.settings },
      lastGuided: parsed.lastGuided,
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: State) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: keep the in-memory copy for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function addSession(kind: SessionKind, title: string, seconds: number) {
  if (seconds < 30) return; // Too short to count.
  const s = read();
  const record: SessionRecord = { id: newId(), kind, title, seconds: Math.round(seconds), endedAt: new Date().toISOString() };
  write({ ...s, sessions: [record, ...s.sessions].slice(0, 1000) });
}

export function addMood(mood: MoodRecord["mood"]) {
  const s = read();
  write({ ...s, moods: [{ id: newId(), mood, at: new Date().toISOString() }, ...s.moods].slice(0, 500) });
}

export function setLastGuided(topic: string, minutes: number) {
  const s = read();
  write({ ...s, lastGuided: { topic, minutes, at: new Date().toISOString() } });
}

export function updateSettings(patch: Partial<Settings>) {
  const s = read();
  write({ ...s, settings: { ...s.settings, ...patch } });
}

export function clearAll() {
  write({ ...EMPTY, settings: read().settings });
}

// ---------- derived stats ----------

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function minutesByDay(sessions: SessionRecord[]) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.endedAt));
    map.set(k, (map.get(k) ?? 0) + s.seconds / 60);
  }
  return map;
}

export function stats(state: State) {
  const byDay = minutesByDay(state.sessions);
  const today = new Date();
  const todayKey = dayKey(today);

  // Streak counts back from today, or from yesterday if today has no session yet.
  let streak = 0;
  const cursor = new Date(today);
  if (!byDay.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (byDay.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.seconds, 0) / 60;
  return {
    streak,
    totalMinutes: Math.round(totalMinutes),
    sessionsCount: state.sessions.length,
    todayMinutes: Math.round(byDay.get(todayKey) ?? 0),
  };
}

export function lastDays(state: State, days = 7) {
  const byDay = minutesByDay(state.sessions);
  const out: { key: string; label: string; minutes: number }[] = [];
  const names = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ key, label: names[d.getDay()], minutes: Math.round(byDay.get(key) ?? 0) });
  }
  return out;
}
