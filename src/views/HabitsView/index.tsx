/**
 * ChronoCraft - Habits View Component
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
  const [viewMode, setViewMode] = useState<HabitsViewMode>(() => {
    if (typeof window === "undefined") return "matrix";
    const v = localStorage.getItem(HABITS_VIEW_STORAGE.mode);
    return v === "cards" || v === "matrix" ? v : "matrix";
  });
  const handleSetViewMode = (m: HabitsViewMode) => {
    setViewMode(m);
    localStorage.setItem(HABITS_VIEW_STORAGE.mode, m);
  };

  const [range, setRange] = useState<HabitsRange>(() => {
    if (typeof window === "undefined") return "7d";
    const v = localStorage.getItem(HABITS_VIEW_STORAGE.range);
    return v === "7d" || v === "14d" || v === "1m" ? v : "7d";
  });
  const handleSetRange = (r: HabitsRange) => {
    setRange(r);
    localStorage.setItem(HABITS_VIEW_STORAGE.range, r);
  };

  const [weekOffset, setWeekOffset] = useState<number>(0);

  const weekDays = useMemo(
    () => buildDayCells(range, range === "7d" ? weekOffset : 0),
    [range, weekOffset],
  );
  const logDatesSet = new Set(habitLogs.map((l) => `${l.habitId}_${l.date}`));

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-soft bg-app/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-entity-orange" />
            <h2 className="text-base font-bold text-primary">
              Habit Consistency Matrix
            </h2>
          </div>
          <p className="text-xs text-secondary mt-0.5">
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

          {range === "7d" && viewMode === "matrix" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset - 1)}
                title="Previous Week"
                className="p-1.5 rounded-xl border border-soft hover:bg-hover text-secondary hover:text-primary transition-colors cursor-pointer"
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border bg-surface text-xs font-bold font-mono shadow-xs transition-all cursor-pointer ${
                  weekOffset === 0
                    ? "text-primary border-accent/40 ring-1 ring-accent/20"
                    : "text-accent border-soft hover:bg-hover"
                }`}
              >
                <span>{formatRangeLabel(weekDays, range)}</span>
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset + 1)}
                title="Next Week"
                className="p-1.5 rounded-xl border border-soft hover:bg-hover text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCreateHabit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {habits.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-soft text-xs text-muted">
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
            <div className="rounded-2xl border border-soft bg-raised shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-soft bg-sunken/40 text-xs">
                      <th className="py-3.5 px-4 font-semibold text-primary min-w-[200px]">
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
                              ? "bg-accent/10 text-accent font-bold"
                              : "text-secondary"
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
                      <th className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-secondary w-20">
                        Streak
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-soft">
                    {habits.map((habit) => {
                      const streak = calculateStreak(habit.id);
                      return (
                        <tr
                          key={habit.id}
                          className="hover:bg-hover/50 transition-colors group"
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
                                <div className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                                  {habit.title}
                                </div>
                                <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                                  <span>{formatScheduleBadge(habit)}</span>
                                  {habit.description && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate max-w-[140px] text-secondary">
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
                                  d.isToday ? "bg-accent/5" : ""
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
                                      : "border border-soft hover:border-strong bg-raised text-transparent hover:text-muted"
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
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-warning tabular-nums">
                              <Flame className="w-3.5 h-3.5 fill-warning/20" />
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
