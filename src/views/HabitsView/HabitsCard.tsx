import React, { useState } from "react";
import { Flame, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Habit, HabitLog } from "../../types";
import { HabitsRange } from "./constants";
import { DayCell, buildDayCellsForCard, formatRangeLabel } from "./helpers";

interface Props {
  habits: Habit[];
  habitLogs: HabitLog[];
  range: HabitsRange;
  onToggleHabitDay: (habitId: string, dateStr: string) => Promise<boolean>;
  onOpenHabitDetail: (habit: Habit) => void;
  formatScheduleBadge: (h: Habit) => string;
  calculateStreak: (habitId: string) => number;
}

export const HabitsCards: React.FC<Props> = ({
  habits,
  habitLogs,
  range,
  onToggleHabitDay,
  onOpenHabitDetail,
  formatScheduleBadge,
  calculateStreak,
}) => {
  const logSet = new Set(habitLogs.map((l) => `${l.habitId}_${l.date}`));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          range={range}
          logSet={logSet}
          onToggleHabitDay={onToggleHabitDay}
          onOpenHabitDetail={onOpenHabitDetail}
          formatScheduleBadge={formatScheduleBadge}
          streak={calculateStreak(habit.id)}
        />
      ))}
    </div>
  );
};

interface HabitCardProps {
  habit: Habit;
  range: HabitsRange;
  logSet: Set<string>;
  onToggleHabitDay: (habitId: string, dateStr: string) => Promise<boolean>;
  onOpenHabitDetail: (habit: Habit) => void;
  formatScheduleBadge: (h: Habit) => string;
  streak: number;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  range,
  logSet,
  onToggleHabitDay,
  onOpenHabitDetail,
  formatScheduleBadge,
  streak,
}) => {
  const [offset, setOffset] = useState(0);

  React.useEffect(() => {
    setOffset(0);
  }, [range]);

  const dayCells: DayCell[] = React.useMemo(
    () => buildDayCellsForCard(range, offset),
    [range, offset],
  );

  const isCurrentWindow = offset === 0;
  const todayCell = dayCells.find((d) => d.isToday);
  const isDoneToday = todayCell
    ? logSet.has(`${habit.id}_${todayCell.dateStr}`)
    : false;
  const canCheckToday = !!todayCell;

  return (
    <div className="p-4 items-center rounded-2xl bg-raised border border-soft shadow-xs hover:border-strong transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => onOpenHabitDetail(habit)}
          className="flex items-start gap-2.5 min-w-0 text-left cursor-pointer group"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
              {habit.title}
            </h3>
            <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
              <span>{formatScheduleBadge(habit)}</span>
              {habit.description && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[180px] text-secondary">
                    {habit.description}
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        <div className="flex gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOffset((o) => o - 1)}
                title="Previous window"
                className="max-sm:p-2 p-1 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span
                className={`px-2 py-1 rounded-md max-sm:text-[11px] text-xs font-mono font-semibold tabular-nums border transition-colors ${
                  isCurrentWindow
                    ? "bg-sunken border-soft text-primary"
                    : "bg-accent/10 border-accent/30 text-accent cursor-pointer"
                }`}
                onClick={() => setOffset(0)}
              >
                {formatRangeLabel(dayCells, range)}
              </span>

              <button
                type="button"
                onClick={() => setOffset((o) => o + 1)}
                disabled={isCurrentWindow}
                title="Next window"
                className="max-sm:p-2 p-1 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-warning tabular-nums shrink-0">
            <Flame className="w-3.5 h-3.5 fill-warning/20" />
            {streak}d
          </span>
        </div>
      </div>

      <div
        className={`grid gap-1 ${
          dayCells.length <= 7
            ? "grid-cols-7"
            : dayCells.length <= 14
              ? "grid-cols-7"
              : "grid-cols-10"
        }`}
      >
        {dayCells.map((d) => {
          const done = logSet.has(`${habit.id}_${d.dateStr}`);
          return (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onToggleHabitDay(habit.id, d.dateStr)}
              title={`${habit.title} · ${d.dateStr}${
                done ? " (click to undo)" : ""
              }`}
              className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-mono transition-all cursor-pointer ${
                done
                  ? "text-white shadow-xs"
                  : d.isToday
                    ? "border border-accent/50 text-accent bg-accent/5 hover:bg-accent/15"
                    : "border border-soft text-muted hover:border-strong bg-raised"
              }`}
              style={{ backgroundColor: done ? habit.color : undefined }}
            >
              {done ? <Check className="w-3 h-3 stroke-[2.5]" /> : d.dayNum}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-soft">
        <span className="text-[10px] font-mono text-muted">
          {dayCells.length}D window
        </span>

        {canCheckToday && todayCell && (
          <button
            type="button"
            onClick={() => onToggleHabitDay(habit.id, todayCell.dateStr)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              isDoneToday
                ? "bg-success/15 text-success border border-success/40 hover:bg-success/20"
                : "bg-primary text-app hover:bg-primary/90"
            }`}
          >
            <Check className="w-3 h-3 stroke-[2.5]" />
            <span>{isDoneToday ? "Done Today" : "Check Today"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
