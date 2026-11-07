/**
 * ChronoCraft - Habits View Component
 * High-density Habit Matrix Grid tracking daily adherence, streak telemetry,
 * "+ New Habit" action, and clickable habit rows opening the specialized DetailSheet.
 */

import React, { useMemo, useState } from "react";
import { Flame, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Habit, HabitLog } from "../../types";
import { toLocalDateKey } from "../../utils/date";
import { HABITS_VIEW_STORAGE, HabitsRange, HabitsViewMode } from "./constants";
import { buildDayCells, formatRangeLabel } from "./helpers";
import { HabitsToolbar } from "./HabitsToolbar";
import { HabitsCards } from "./HabitsCard";

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
  // Persisted view mode
  const [viewMode, setViewMode] = useState<HabitsViewMode>(() => {
    if (typeof window === "undefined") return "matrix";
    const v = localStorage.getItem(HABITS_VIEW_STORAGE.mode);
    return v === "cards" || v === "matrix" ? v : "matrix";
  });
  const handleSetViewMode = (m: HabitsViewMode) => {
    setViewMode(m);
    localStorage.setItem(HABITS_VIEW_STORAGE.mode, m);
  };

  // Persisted range
  const [range, setRange] = useState<HabitsRange>(() => {
    if (typeof window === "undefined") return "7d";
    const v = localStorage.getItem(HABITS_VIEW_STORAGE.range);
    return v === "7d" || v === "14d" || v === "1m" ? v : "7d";
  });
  const handleSetRange = (r: HabitsRange) => {
    setRange(r);
    localStorage.setItem(HABITS_VIEW_STORAGE.range, r);
  };

  // Week offset only affects 7D
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Rebuild day cells when range or (for 7D) weekOffset changes
  const weekDays = useMemo(
    () => buildDayCells(range, range === "7d" ? weekOffset : 0),
    [range, weekOffset],
  );
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

        <div className="flex items-center gap-3 flex-wrap">
          <HabitsToolbar
            mode={viewMode}
            range={range}
            onChangeMode={handleSetViewMode}
            onChangeRange={handleSetRange}
          />

          {/* Week nav only for 7D matrix mode */}
          {range === "7d" && viewMode === "matrix" && (
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
                <span>{formatRangeLabel(weekDays, range)}</span>
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
          )}

          {/* + New Habit */}
          <button
            type="button"
            onClick={onOpenCreateHabit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {habits.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No habits defined yet. Click "+ New Habit" to establish your daily
              routines.
            </div>
          ) : viewMode === "cards" ? (
            <HabitsCards
              habits={habits}
              habitLogs={habitLogs}
              range={range}
              onToggleHabitDay={onToggleHabitDay}
              onOpenHabitDetail={onOpenHabitDetail}
              formatScheduleBadge={formatScheduleBadge}
              calculateStreak={calculateStreak}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#131926] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
                      <th className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[200px]">
                        Habit Routine
                      </th>
                      {weekDays.map((d) => (
                        <th
                          key={d.dateStr}
                          className={`py-3.5 px-1 text-center font-mono font-medium ${
                            weekDays.length > 14
                              ? "w-7"
                              : weekDays.length > 7
                                ? "w-10"
                                : "w-14"
                          } ${
                            d.isToday
                              ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold"
                              : "text-slate-500"
                          }`}
                        >
                          <div className="text-[10px] uppercase">
                            {weekDays.length > 7 ? d.dayNum : d.dayName}
                          </div>
                          {weekDays.length <= 7 && (
                            <div className="text-xs tabular-nums mt-0.5">
                              {d.dayNum}
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-500 w-20">
                        Streak
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {habits.map((habit) => {
                      const streak = calculateStreak(habit.id);
                      return (
                        <tr
                          key={habit.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                        >
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

                          {weekDays.map((d) => {
                            const isCompleted = logDatesSet.has(
                              `${habit.id}_${d.dateStr}`,
                            );
                            return (
                              <td
                                key={d.dateStr}
                                className={`py-3.5 px-1 text-center ${
                                  d.isToday ? "bg-indigo-500/5" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await onToggleHabitDay(habit.id, d.dateStr);
                                  }}
                                  title={`${habit.title} · ${d.dateStr}${
                                    isCompleted ? " (click to undo)" : ""
                                  }`}
                                  className={`mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                    weekDays.length > 14
                                      ? "w-5 h-5"
                                      : weekDays.length > 7
                                        ? "w-6 h-6"
                                        : "w-7 h-7"
                                  } ${
                                    isCompleted
                                      ? "shadow-xs text-white"
                                      : "border border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-white/40 dark:bg-slate-900/40 text-transparent hover:text-slate-300"
                                  }`}
                                  style={{
                                    backgroundColor: isCompleted
                                      ? habit.color
                                      : undefined,
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-500 tabular-nums">
                              <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                              {streak}d
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
