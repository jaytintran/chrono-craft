import { toLocalDateKey } from "../../utils/date";
import { HabitsRange, RANGE_DAYS } from "./constants";

export interface DayCell {
  date: Date;
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
  dayIndex: number;
}

/** Build `count` day cells ending on `anchor` (inclusive, going backwards). */
const buildRolling = (count: number, anchor: Date): DayCell[] => {
  const todayStr = toLocalDateKey(new Date());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - (count - 1 - i));
    const dateStr = toLocalDateKey(d);
    return {
      date: d,
      dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      dayIndex: d.getDay(),
    };
  });
};

/** 7D: Mon → Sun of a target week (offset in weeks from current week). */
const buildWeek = (weekOffset: number): DayCell[] => {
  const today = new Date();
  const dow = today.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);

  const todayStr = toLocalDateKey(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toLocalDateKey(d);
    return {
      date: d,
      dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
      dayIndex: d.getDay(),
    };
  });
};

export const buildDayCells = (range: HabitsRange, weekOffset = 0): DayCell[] =>
  range === "7d"
    ? buildWeek(weekOffset)
    : buildRolling(RANGE_DAYS[range], new Date());

/**
 * Build the window for a card given its own `cardOffset`.
 * - 7d / 14d: shift the anchor backwards by `offset × rangeDays`
 * - 1m:       shift the anchor by `offset` calendar months, then take the
 *             month's actual length (28–31 days)
 */
export const buildDayCellsForCard = (
  range: HabitsRange,
  cardOffset: number,
): DayCell[] => {
  if (cardOffset === 0) return buildDayCells(range, 0);

  if (range === "1m") {
    const now = new Date();
    // Shift to the end of the target month
    const target = new Date(
      now.getFullYear(),
      now.getMonth() + cardOffset + 1,
      0,
    );
    const monthLen = target.getDate();
    // Last day of that month is our anchor
    return buildRolling(monthLen, target);
  }

  const anchor = new Date();
  anchor.setDate(anchor.getDate() + cardOffset * RANGE_DAYS[range]);
  return buildRolling(RANGE_DAYS[range], anchor);
};

export const formatRangeLabel = (days: DayCell[], range: HabitsRange) => {
  if (days.length === 0) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = days[0].date;
  const end = days[days.length - 1].date;
  if (range === "7d") {
    return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
  }
  if (range === "1m") {
    return start.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}`;
};
