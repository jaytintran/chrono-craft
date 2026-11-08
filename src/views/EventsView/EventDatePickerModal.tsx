/**
 * ChronoCraft - EventDatePickerModal
 * Centered modal wrapper around the calendar grid used by CustomCalendarDropdown.
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

  useEffect(() => {
    if (isOpen) setViewDate(new Date());
  }, [isOpen]);

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

    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      dayNum: number;
      date: Date;
      isCurrentMonth: boolean;
    }> = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      days.push({
        dayNum: d,
        date: new Date(year, month - 1, d),
        isCurrentMonth: false,
      });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        dayNum: d,
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-xs"
      />

      <div className="relative w-full max-w-sm rounded-2xl bg-raised border border-soft p-4 shadow-2xl z-10 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-soft">
          <div>
            <h3 className="text-sm font-bold text-primary">Pick a Date</h3>
            <p className="text-[11px] text-secondary mt-0.5">
              Choose the day this event starts on
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 mt-3 mb-2">
          <h4 className="text-xs font-bold text-primary">{monthTitle}</h4>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                )
              }
              title="Previous Month"
              className="p-1 rounded-lg hover:bg-hover text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                )
              }
              title="Next Month"
              className="p-1 rounded-lg hover:bg-hover text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => (
            <span
              key={w}
              className="text-[10px] font-mono uppercase text-muted font-semibold py-1"
            >
              {w}
            </span>
          ))}
        </div>

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
                    ? "border border-accent text-accent font-semibold bg-accent/10 hover:bg-accent/20"
                    : item.isCurrentMonth
                      ? "text-primary hover:bg-hover"
                      : "text-muted hover:bg-hover/60"
                }`}
              >
                {item.dayNum}
              </button>
            );
          })}
        </div>

        <div className="pt-3 mt-3 border-t border-soft">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              onPickDate(today);
              onClose();
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-hover hover:bg-accent/15 text-secondary hover:text-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Jump to Today</span>
          </button>
        </div>
      </div>
    </div>
  );
};
