/**
 * ChronoCraft - Core TypeScript Definitions
 */

export type EntryType = "task" | "log" | "note" | "event" | "timeblock";
export type EntryStatus = "pending" | "active" | "completed";
export type EntrySource =
  | "focus-anchor"
  | "focus-active"
  | "timeline"
  | "habit"
  | "custom-tab";

export interface TimeBlockInfo {
  startIso: string;
  endIso: string;
  durationMinutes: number;
  rawBracket: string;
}

export interface TimelineEntry {
  id: string;
  type: EntryType;
  title: string;
  scheduledAt?: string; // ISO string
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  status: EntryStatus;
  source: EntrySource;
  tags: string[];
  tabId?: string; // Custom focus tab ID if created there
  timeBlock?: TimeBlockInfo;
  metadata?: {
    habitId?: string;
    listId?: string;
    notes?: string;
    // Timeline-born note/event extras (the entry is the source of truth)
    isPinned?: boolean;
    endAt?: string;
    allDay?: boolean;
    category?: "official" | "personal";
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  listIds: string[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  color?: string; // hex or tailwind class token
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startAt: string; // ISO string
  endAt?: string; // ISO string
  allDay: boolean;
  category?: "official" | "personal";
  tags: string[];
  listIds: string[];
  createdAt: string;
  isAchievement?: boolean;
  completedAt?: string; // attended
  missedAt?: string; // didn't attend
}

export type HabitScheduleType =
  | "everyday"
  | "bi-weekly"
  | "weekly"
  | "monthly"
  | "custom";

export interface Habit {
  id: string;
  title: string;
  description?: string;
  scheduleType: HabitScheduleType;
  customDays?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, ..., 6 = Sat
  color: string;
  createdAt: string;
  targetCount?: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO string
}

export type ListType = "projects" | "books" | "courses" | "custom";

export type ListItemStatus =
  | "inbox"
  | "in-progress"
  | "completed"
  | "dropped"
  | "maybe-later"
  | "todo"
  | "done";

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  subtitle?: string;
  status: ListItemStatus;
  tags: string[];
  notes?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CustomList {
  id: string;
  name: string;
  type: ListType;
  description?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface CustomFocusTab {
  id: string;
  name: string;
  bgColor: string; // e.g. '#6366F1'
  createdAt: string;
}

export interface ScratchpadCard {
  id: string;
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TimelineDisplayMode = "default" | "compact" | "flat";

export interface AppSettings {
  xActiveLimit: number; // Defaults to 5
  theme: "dark" | "light";
  nlpAutoExtract: boolean;
  showEntryContent?: boolean; // Defaults to true
  timelineDisplayMode?: TimelineDisplayMode; // undefined = "default"
}

export type ActiveView =
  | "focus"
  | "timeline"
  | "notes"
  | "events"
  | "habits"
  | "lists";
export type FocusTab = "today" | "scratchpad" | string; // string is custom tab ID

export interface ParsedNLPResult {
  cleanTitle: string;
  type: EntryType;
  scheduledAt?: string;
  scheduledDisplay?: string;
  tags: string[];
  timeBlock?: TimeBlockInfo;
  isTimeBlockValid?: boolean;
  timeBlockError?: string;
  rawMatches: Array<{
    label: string;
    type: "time" | "date" | "priority" | "tag" | "type";
    raw: string;
  }>;
}
