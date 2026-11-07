// components/detailSheet/types.ts
import {
  Bookmark,
  CheckCircle2,
  Inbox,
  MinusCircle,
  PlayCircle,
} from "lucide-react";
import { CalendarEvent, Habit, HabitLog, ListItem, Note } from "../../types";

export type DetailSheetMode =
  | { type: "note"; data: Partial<Note>; isNew?: boolean }
  | { type: "event"; data: Partial<CalendarEvent>; isNew?: boolean }
  | { type: "habit"; data: Partial<Habit>; logs?: HabitLog[]; isNew?: boolean }
  | { type: "list_item"; data: Partial<ListItem>; isNew?: boolean }
  | null;

export const DAYS_OF_WEEK = [
  { label: "M", name: "Mon", index: 1 },
  { label: "T", name: "Tue", index: 2 },
  { label: "W", name: "Wed", index: 3 },
  { label: "T", name: "Thu", index: 4 },
  { label: "F", name: "Fri", index: 5 },
  { label: "S", name: "Sat", index: 6 },
  { label: "S", name: "Sun", index: 0 },
];

export const PRESET_COLORS = [
  "#6366F1",
  "#10B981",
  "#06B6D4",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#64748B",
];

export const ITEM_META: Record<
  string,
  { subtitle: string; due: string; notes: string }
> = {
  books: {
    subtitle: "Author",
    due: "Finish by",
    notes: "Reading notes, quotes, key takeaways…",
  },
  courses: {
    subtitle: "Instructor / platform",
    due: "Complete by",
    notes: "Syllabus, lecture notes, key learnings…",
  },
  projects: {
    subtitle: "Role / client",
    due: "Deadline",
    notes: "Scope, milestones, links, decisions…",
  },
  custom: {
    subtitle: "Subtitle",
    due: "Due date",
    notes: "Notes, links, context… type “/” for commands",
  },
};

export const ITEM_STATUSES = [
  {
    id: "inbox",
    label: "Inbox",
    icon: Inbox,
    on: "bg-slate-500/15 border-slate-400/60 text-slate-300",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: PlayCircle,
    on: "bg-amber-500/15 border-amber-400/60 text-amber-300",
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    on: "bg-emerald-500/15 border-emerald-400/60 text-emerald-300",
  },
  {
    id: "dropped",
    label: "Dropped",
    icon: MinusCircle,
    on: "bg-rose-500/15 border-rose-400/60 text-rose-300",
  },
  {
    id: "maybe-later",
    label: "Maybe Later",
    icon: Bookmark,
    on: "bg-violet-500/15 border-violet-400/60 text-violet-300",
  },
] as const;

// Date-local formatter used by the Event form
export function formatDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
