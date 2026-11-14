import { CalendarEvent, ListItem, TimelineEntry } from "../../types";
import { toLocalDateKey } from "../../utils/date";

export type AchievementSource = "list" | "event" | "log" | "focus";
export type TimeFilter = "all" | "week" | "month" | "year";
export type SourceFilter = "all" | "list" | "event" | "log" | "focus";

export interface AchievementItem {
  /** Synthetic id: `<source>_<originalId>` so list/event/entry never collide */
  id: string;
  source: AchievementSource;
  /** The original record (unwrapped) — used when opening DetailSheet */
  original: ListItem | CalendarEvent | TimelineEntry;
  title: string;
  /** ISO of the achieved moment — used for grouping + sorting */
  achievedAt: string;
  tags: string[];
  subtitle: string;
}

export interface AchievementsInput {
  listItems: ListItem[];
  events: CalendarEvent[];
  entries: TimelineEntry[];
}

/** Build the flat achievements list from the three sources. */
export function buildAchievements({
  listItems,
  events,
  entries,
}: AchievementsInput): AchievementItem[] {
  const out: AchievementItem[] = [];

  // 1. ListItems — auto when completed
  for (const li of listItems) {
    if (li.status !== "completed") continue;
    if (li.deletedAt) continue;
    out.push({
      id: `list_${li.id}`,
      source: "list",
      original: li,
      title: li.title || "Untitled item",
      achievedAt: li.updatedAt ?? li.createdAt,
      tags: li.tags ?? [],
      subtitle: "List item completed",
    });
  }

  // 2. Events — explicit
  for (const ev of events) {
    if (!ev.isAchievement) continue;
    if (ev.deletedAt) continue;
    out.push({
      id: `event_${ev.id}`,
      source: "event",
      original: ev,
      title: ev.title || "Untitled event",
      achievedAt: ev.completedAt ?? ev.updatedAt ?? ev.createdAt,
      tags: ev.tags ?? [],
      subtitle: "Event achievement",
    });
  }

  // 3. Timeline entries — explicit (events, logs, focus tasks)
  for (const te of entries) {
    if (!te.isAchievement) continue;
    if (te.deletedAt) continue;

    // Route by entry type so a Timeline-born event shows as EVENT (not FOCUS).
    const source: AchievementSource =
      te.type === "log" ? "log" : te.type === "event" ? "event" : "focus";

    out.push({
      id: `entry_${te.id}`,
      source,
      original: te,
      title: te.title || "Untitled entry",
      achievedAt: te.completedAt ?? te.updatedAt ?? te.createdAt,
      tags: te.tags ?? [],
      subtitle:
        te.type === "log"
          ? "Log entry"
          : te.type === "event"
          ? "Event achievement"
          : "Focus task completed",
    });
  }

  return out;
}

/** Period cutoffs — calendar windows, ISO week starts Monday. */
export function timeCutoff(filter: TimeFilter): number | null {
  if (filter === "all") return null;
  const now = new Date();

  if (filter === "week") {
    const dow = now.getDay(); // 0=Sun
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }

  if (filter === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  // year
  return new Date(now.getFullYear(), 0, 1).getTime();
}

export function applyFilters(
  items: AchievementItem[],
  time: TimeFilter,
  source: SourceFilter,
): AchievementItem[] {
  const cutoff = timeCutoff(time);
  return items
    .filter((it) => {
      if (source !== "all" && it.source !== source) return false;
      if (cutoff !== null) {
        const t = new Date(it.achievedAt).getTime();
        if (Number.isNaN(t) || t < cutoff) return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
    );
}

/** Group by local day key, preserving sort order within groups. */
export function groupByDay(
  items: AchievementItem[],
): Array<{ dateKey: string; items: AchievementItem[] }> {
  const map = new Map<string, AchievementItem[]>();
  for (const it of items) {
    const key = toLocalDateKey(new Date(it.achievedAt));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, list]) => ({ dateKey, items: list }));
}
