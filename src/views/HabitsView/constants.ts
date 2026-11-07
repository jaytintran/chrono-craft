export type HabitsViewMode = "matrix" | "cards";
export type HabitsRange = "7d" | "14d" | "1m";

export const HABITS_VIEW_STORAGE = {
  mode: "chronocraft_habits_view_mode",
  range: "chronocraft_habits_range",
} as const;

export const RANGE_DAYS: Record<HabitsRange, number> = {
  "7d": 7,
  "14d": 14,
  "1m": 30,
};
