import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function xpToLevel(xp: number): { level: number; progress: number; nextLevelXp: number } {
  // XP curve: level n requires n*100 XP
  let level = 1;
  let accumulated = 0;
  while (accumulated + level * 100 <= xp) {
    accumulated += level * 100;
    level++;
  }
  const progress = xp - accumulated;
  const nextLevelXp = level * 100;
  return { level, progress, nextLevelXp };
}

export const TOPIC_COLORS: Record<string, string> = {
  "Analogies": "#6366f1",
  "Classification": "#8b5cf6",
  "Series": "#a78bfa",
  "Statement and Conclusion": "#06b6d4",
  "Statement and Assumption": "#0ea5e9",
  "Cause and Effect": "#3b82f6",
  "Assertion and Reason": "#60a5fa",
  "Syllogisms": "#34d399",
  "Logical Deduction": "#10b981",
  "Blood Relations": "#f59e0b",
  "Direction Sense": "#fbbf24",
  "Coding-Decoding": "#f97316",
  "Ranking": "#fb923c",
  "Order and Sequence": "#ef4444",
  "Seating Arrangement": "#f43f5e",
  "Circular Arrangement": "#ec4899",
  "Linear Arrangement": "#d946ef",
  "Data Sufficiency": "#a21caf",
  "Puzzles": "#7c3aed",
  "Figure Series": "#2dd4bf",
  "Figure Analogy": "#14b8a6",
  "Figure Classification": "#0d9488",
  "Mirror Images": "#0891b2",
  "Water Images": "#0284c7",
  "Paper Folding": "#1d4ed8",
  "Paper Cutting": "#4f46e5",
  "Embedded Figures": "#7c3aed",
};
