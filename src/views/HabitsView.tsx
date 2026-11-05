/**
 * ChronoCraft - Habits View Component
 * High-density Habit Matrix Grid tracking daily adherence, streak telemetry,
 * "+ New Habit" action, and clickable habit rows opening the specialized DetailSheet.
 */

import React, { useState } from "react";
import {
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Habit, HabitLog } from "../types";
import { toLocalDateKey } from "../utils/date";

interface HabitsViewProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  onToggleHabitDay: (habitId: string, dateStr: string) => Promise<boolean>;
  onOpenHabitDetail: (habit: Habit) => void;
  onOpenCreateHabit: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  habitLogs,
  onToggleHabitDay,
  onOpenHabitDetail,
  onOpenCreateHabit,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Compute the 7 days of the selected week (Monday to Sunday)
  const getWeekDays = (offset: number) => {
    const now = new Date();
    // Find current Monday
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offset * 7);

    const days: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      dayNum: number;
      isToday: boolean;
      dayIndex: number; // 0 = Sun, 1 = Mon...
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = toLocalDateKey(d);
      const todayStr = toLocalDateKey(new Date());

      days.push({
        date: d,
        dateStr: dStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        isToday: dStr === todayStr,
        dayIndex: d.getDay(),
      });
    }

    return days;
  };

  const weekDays = getWeekDays(weekOffset);
  const logDatesSet = new Set(habitLogs.map((l) => `${l.habitId}_${l.date}`));

  // Streak calculator
  const calculateStreak = (habitId: string) => {
    const today = new Date();
    let streak = 0;
    let check = new Date(today);
    const todayKey = `${habitId}_${toLocalDateKey(today)}`;

    if (!logDatesSet.has(todayKey)) {
      check.setDate(check.getDate() - 1);
    }

    while (true) {
      const dStr = toLocalDateKey(check);
      if (logDatesSet.has(`${habitId}_${dStr}`)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const formatScheduleBadge = (habit: Habit) => {
    switch (habit.scheduleType) {
      case "everyday":
        return "Daily (7d)";
      case "bi-weekly":
        return "Bi-Weekly (2d)";
      case "weekly":
        return "Weekly (1d)";
      case "monthly":
        return "Monthly";
      case "custom":
        return "Custom Days";
      default:
        return "Active";
    }
  };

  // Week range heading string formatted as DD/MM - DD/MM
  const pad = (n: number) => n.toString().padStart(2, "0");
  const startD = weekDays[0].date;
  const endD = weekDays[6].date;
  const currentYear = new Date().getFullYear();
  const weekRangeText =
    startD.getFullYear() === endD.getFullYear() &&
    endD.getFullYear() === currentYear
      ? `${pad(startD.getDate())}/${pad(startD.getMonth() + 1)} - ${pad(endD.getDate())}/${pad(endD.getMonth() + 1)}`
      : `${pad(startD.getDate())}/${pad(startD.getMonth() + 1)}/${startD.getFullYear()} - ${pad(endD.getDate())}/${pad(endD.getMonth() + 1)}/${endD.getFullYear()}`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B0F17]/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Habit Consistency Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click cells to record completions. Click any habit row to view
            streak analytics and custom cadence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Navigation Matching Timeline View Scrubber */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWeekOffset(weekOffset - 1)}
              title="Previous Week"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              title={
                weekOffset !== 0
                  ? "Click to jump to Current Week"
                  : "Current Week"
              }
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold font-mono shadow-xs transition-all cursor-pointer ${
                weekOffset === 0
                  ? "text-slate-800 dark:text-slate-200 border-indigo-500/40 ring-1 ring-indigo-500/20"
                  : "text-indigo-500 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              }`}
            >
              <span>{weekRangeText}</span>
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(weekOffset + 1)}
              title="Next Week"
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* + New Habit Action */}
          <button
            type="button"
            onClick={onOpenCreateHabit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Main Matrix Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Habit Matrix Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#131926] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                {/* Header Row: Days of Week */}
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
                    <th className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[200px]">
                      Habit Routine
                    </th>
                    {weekDays.map((d) => (
                      <th
                        key={d.dateStr}
                        className={`py-3.5 px-2 text-center font-mono font-medium w-14 ${
                          d.isToday
                            ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        <div className="text-[11px] uppercase">{d.dayName}</div>
                        <div className="text-xs tabular-nums mt-0.5">
                          {d.dayNum}
                        </div>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-500 w-24">
                      Streak
                    </th>
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {habits.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-xs text-slate-400"
                      >
                        No habits defined yet. Click "+ New Habit" to establish
                        your daily routines.
                      </td>
                    </tr>
                  ) : (
                    habits.map((habit) => {
                      const streak = calculateStreak(habit.id);
                      return (
                        <tr
                          key={habit.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Habit Title & Cadence (Clickable to open DetailSheet) */}
                          <td
                            onClick={() => onOpenHabitDetail(habit)}
                            className="py-3.5 px-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: habit.color }}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors truncate">
                                  {habit.title}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{formatScheduleBadge(habit)}</span>
                                  {habit.description && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate max-w-[140px] text-slate-500">
                                        {habit.description}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 7 Day Matrix Check Cells */}
                          {weekDays.map((d) => {
                            const isCompleted = logDatesSet.has(
                              `${habit.id}_${d.dateStr}`,
                            );
                            return (
                              <td
                                key={d.dateStr}
                                className={`py-3.5 px-2 text-center ${
                                  d.isToday ? "bg-indigo-500/5" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await onToggleHabitDay(habit.id, d.dateStr);
                                  }}
                                  title={`${habit.title} on ${d.dateStr}: ${
                                    isCompleted
                                      ? "Completed (click to undo)"
                                      : "Click to complete"
                                  }`}
                                  className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                    isCompleted
                                      ? "shadow-xs text-white scale-105"
                                      : "border border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-white/40 dark:bg-slate-900/40 text-transparent hover:text-slate-300"
                                  }`}
                                  style={{
                                    backgroundColor: isCompleted
                                      ? habit.color
                                      : undefined,
                                  }}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                </button>
                              </td>
                            );
                          })}

                          {/* Streak Counter */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-500 tabular-nums">
                              <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                              {streak}d
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
