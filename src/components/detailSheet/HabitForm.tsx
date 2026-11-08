import React, { useState, useEffect } from "react";
import { Check, Flame, BarChart2 } from "lucide-react";
import { Habit, HabitLog, HabitScheduleType } from "../../types";
import { DAYS_OF_WEEK, PRESET_COLORS } from "./types";

export interface HabitFormHandle {
  collect: () => Partial<Habit>;
}

interface HabitFormProps {
  data: Partial<Habit>;
  logs?: HabitLog[];
  isNew?: boolean;
  onDirty?: () => void;
}

export const HabitForm = React.forwardRef<HabitFormHandle, HabitFormProps>(
  ({ data, logs = [], isNew, onDirty }, ref) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#6366F1");
    const [scheduleType, setScheduleType] =
      useState<HabitScheduleType>("everyday");
    const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

    useEffect(() => {
      setTitle(data.title || "");
      setDescription(data.description || "");
      setColor(data.color || "#6366F1");
      setScheduleType(data.scheduleType || "everyday");
      setCustomDays(data.customDays || [1, 2, 3, 4, 5]);
    }, [data]);

    useEffect(() => {
      onDirty?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, color, scheduleType, customDays]);

    React.useImperativeHandle(ref, () => ({
      collect: () => ({
        id: data.id,
        title: title.trim() || "Untitled Habit",
        description,
        color,
        scheduleType,
        customDays: scheduleType === "custom" ? customDays : undefined,
      }),
    }));

    const logDatesSet = new Set(logs.map((l) => l.date));
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);
    const todayStr = today.toISOString().split("T")[0];
    if (!logDatesSet.has(todayStr)) checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (logDatesSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    const past30Days: Array<{
      dateStr: string;
      dayNum: number;
      completed: boolean;
    }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      past30Days.push({
        dateStr: dStr,
        dayNum: d.getDate(),
        completed: logDatesSet.has(dStr),
      });
    }
    const completionRate30 = Math.round(
      (past30Days.filter((d) => d.completed).length / 30) * 100,
    );

    const toggleCustomDay = (i: number) =>
      setCustomDays((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
      );

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-1.5">
              Habit Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Work 90min Block"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sunken border border-soft text-primary text-base font-semibold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-1.5">
              Purpose & Motivation
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Single-task focus without distractions or tabs"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sunken border border-soft text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-2">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                  color === c
                    ? "scale-120 ring-2 ring-white ring-offset-2 ring-offset-app"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {!isNew && (
          <div className="p-4 rounded-xl bg-sunken border border-soft space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                <BarChart2 className="w-3.5 h-3.5 text-accent" />
                Streak Analytics
              </span>
              <span className="flex items-center gap-1 text-xs font-mono font-medium text-warning">
                <Flame className="w-3.5 h-3.5 fill-warning/20" />
                {currentStreak} Day Streak
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Current Streak", value: `${currentStreak}d` },
                { label: "30d Adherence", value: `${completionRate30}%` },
                { label: "Total Recorded", value: logs.length },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-2.5 rounded-lg bg-raised border border-soft"
                >
                  <div className="text-[11px] text-muted">{s.label}</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-primary">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-[11px] text-muted mb-1.5 flex justify-between">
                <span>30-Day Matrix Punchstrip</span>
                <span className="font-mono text-[10px] text-muted">
                  Past 30 Days
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1.5 p-2 rounded-lg bg-raised border border-soft">
                {past30Days.map((d) => (
                  <div
                    key={d.dateStr}
                    title={`${d.dateStr}: ${d.completed ? "Completed" : "Missed"}`}
                    className={`h-5 rounded-xs flex items-center justify-center text-[9px] font-mono transition-colors ${
                      d.completed ? "text-white" : "bg-hover text-muted"
                    }`}
                    style={{
                      backgroundColor: d.completed ? color : undefined,
                    }}
                  >
                    {d.dayNum}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted">
            Frequency & Cadence
          </label>

          <select
            value={scheduleType}
            onChange={(e) =>
              setScheduleType(e.target.value as HabitScheduleType)
            }
            className="w-full px-3 py-2 rounded-xl bg-sunken border border-soft text-sm font-medium text-primary focus:outline-none focus:border-accent"
          >
            <option value="everyday">Everyday (7 days / week)</option>
            <option value="bi-weekly">Bi-weekly (2 days / week)</option>
            <option value="weekly">Weekly (1 day / week)</option>
            <option value="monthly">Monthly goal</option>
            <option value="custom">Custom Day of the Week</option>
          </select>

          {scheduleType === "custom" && (
            <div className="p-3.5 rounded-xl bg-sunken border border-soft space-y-2 animate-fadeIn">
              <span className="block text-[11px] font-medium text-secondary">
                Choose which days this habit applies:
              </span>
              <div className="flex items-center justify-between gap-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = customDays.includes(day.index);
                  return (
                    <button
                      key={day.index}
                      type="button"
                      onClick={() => toggleCustomDay(day.index)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                        isSelected
                          ? "bg-accent text-accent-fg shadow-xs"
                          : "bg-raised text-secondary hover:text-primary border border-soft"
                      }`}
                    >
                      {day.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);
HabitForm.displayName = "HabitForm";
