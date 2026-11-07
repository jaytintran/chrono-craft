/**
 * ChronoCraft - EventDatePickerModal
 * Centered modal wrapper around the calendar grid used by CustomCalendarDropdown.
 * Opens before Event creation so the user picks the target date first, then
 * DetailSheet is prefilled with it.
 */

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { toLocalDateKey } from "../../utils/date";

interface EventDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickDate: (date: Date) => void;
}

export const EventDatePickerModal: React.FC<EventDatePickerModalProps> = ({
  isOpen,
  onClose,
  onPickDate,
}) => {
  const [viewDate, setViewDate] = useState(() => new Date());

  // Reset to current month each time modal opens
  useEffect(() => {
    if (isOpen) setViewDate(new Date());
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const { daysArray, monthTitle } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Monday-first calendar grid
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNum: number;
      date: Date;
      isCurrentMonth: boolean;
    }> = [];

    // Trailing days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      days.push({
        dayNum: d,
        date: new Date(year, month - 1, d),
        isCurrentMonth: false,
      });
    }
    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        dayNum: d,
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
    // Leading days from next month to fill the last row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        dayNum: d,
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      });
    }

    const title = viewDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return { daysArray: days, monthTitle: title };
  }, [viewDate]);

  if (!isOpen) return null;

  const todayStr = toLocalDateKey(new Date());

  const handlePrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const handleJumpToToday = () => {
    const today = new Date();
    onPickDate(today);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 p-4 shadow-2xl z-10 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pick a Date
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Choose the day this event starts on
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-1 mt-3 mb-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {monthTitle}
          </h4>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => (
            <span
              key={w}
              className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-semibold py-1"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((item, idx) => {
            const dateStr = toLocalDateKey(item.date);
            const isToday = dateStr === todayStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onPickDate(item.date);
                  onClose();
                }}
                className={`h-8 w-8 mx-auto rounded-lg text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${
                  isToday
                    ? "border border-indigo-500 text-indigo-500 dark:text-indigo-400 font-semibold bg-indigo-500/10 hover:bg-indigo-500/20"
                    : item.isCurrentMonth
                      ? "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      : "text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {item.dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer: Jump to Today */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Jump to Today</span>
          </button>
        </div>
      </div>
    </div>
  );
};
