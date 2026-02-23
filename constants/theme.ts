import type { CategoryId, TaskScheduleType } from "../types/todo";

export const LIGHT_COLORS = {
  bg: "#F8F8FA",
  surface: "#FFFFFF",
  surfaceHover: "#F0F0F4",
  border: "rgba(0,0,0,0.06)",
  text: "#1A1A1E",
  textMuted: "#6B6B73",
  accent: "#4ADE80",
  accentDim: "rgba(74, 222, 128, 0.18)",
  danger: "#F87171",
  dangerDim: "rgba(248, 113, 113, 0.15)",
} as const;

export const DARK_COLORS = {
  bg: "#0C0C0E",
  surface: "#161618",
  surfaceHover: "#1E1E22",
  border: "rgba(255,255,255,0.06)",
  text: "#F2F2F5",
  textMuted: "#8A8A92",
  accent: "#4ADE80",
  accentDim: "rgba(74, 222, 128, 0.22)",
  danger: "#F87171",
  dangerDim: "rgba(248, 113, 113, 0.2)",
} as const;

export type ThemeColors = typeof DARK_COLORS;

export const COLORS = DARK_COLORS;

export const PRIORITY_COLORS = {
  low: "#93C5FD",
  medium: "#FDBA74",
  high: "#FCA5A5",
} as const;

export const CATEGORY_CHIP_COLORS: Record<CategoryId, string> = {
  work: "rgba(96, 165, 250, 0.18)",
  personal: "rgba(167, 139, 250, 0.18)",
  shopping: "rgba(74, 222, 128, 0.18)",
  health: "rgba(34, 197, 94, 0.18)",
  other: "rgba(148, 163, 184, 0.18)",
};

export const SCHEDULE_TYPE_CHIP_COLORS: Record<TaskScheduleType, string> = {
  one_time: "rgba(96, 165, 250, 0.18)",
  multi_times_daily: "rgba(251, 146, 60, 0.18)",
  ongoing: "rgba(167, 139, 250, 0.18)",
  shopping_list: "rgba(34, 197, 94, 0.18)",
  recurring: "rgba(236, 72, 153, 0.18)",
  weekly_days: "rgba(20, 184, 166, 0.18)",
};
