import { create } from "zustand";
import { FLAGS } from "../systems/runtime";

export type Phase = "title" | "playing" | "paused" | "celebrating" | "results";
export type Quality = "low" | "medium" | "high";

export interface Settings {
  sensitivity: number;
  invertY: boolean;
  quality: Quality;
  volume: number;
  reduceMotion: boolean;
}

const SETTINGS_KEY = "cat-garden-settings-v1";
const BEST_KEY = "cat-garden-best-v1";

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ }
}

const defaults: Settings = { sensitivity: 1, invertY: false, quality: "high", volume: 0.7, reduceMotion: false };
const initialSettings = load(SETTINGS_KEY, defaults);
if (FLAGS.quality) initialSettings.quality = FLAGS.quality;

interface GameState {
  phase: Phase;
  collected: number;
  elapsed: number;
  best: number | null;
  newRecord: boolean;
  toast: { text: string; sub: string; key: number } | null;
  compass: { rel: number; dist: number; dy: number } | null;
  settings: Settings;
  showHelp: boolean;
  set: (p: Partial<GameState>) => void;
  setSettings: (s: Partial<Settings>) => void;
  finish: (ms: number) => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "title",
  collected: 0,
  elapsed: 0,
  best: (() => { try { const v = localStorage.getItem(BEST_KEY); return v ? Number(v) : null; } catch { return null; } })(),
  newRecord: false,
  toast: null,
  compass: null,
  settings: initialSettings,
  showHelp: false,
  set: (p) => set(p),
  setSettings: (s) => {
    const settings = { ...get().settings, ...s };
    save(SETTINGS_KEY, settings);
    set({ settings });
  },
  finish: (ms) => {
    const best = get().best;
    const newRecord = best === null || ms < best;
    if (newRecord) { try { localStorage.setItem(BEST_KEY, String(Math.round(ms))); } catch { /* optional */ } }
    set({ elapsed: ms, newRecord, best: newRecord ? ms : best });
  },
}));
