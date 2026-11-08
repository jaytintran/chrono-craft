/**
 * ChronoCraft - Custom Calendar Dropdown Component
 * Bespoke mini calendar dropdown with month navigation, day grid, and 'Jump to Today' shortcut.
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface CustomCalendarDropdownProps {
  selectedDate: Date;
  isOpen: boolean;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export const CustomCalendarDropdown: React.FC<CustomCalendarDropdownProps> = ({
  selectedDate,
  isOpen,
  onSelectDate,
  onClose,
}) => {
  const [viewDate, setViewDate] = useState<Date>(new Date(selectedDate));
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setViewDate(new Date(selectedDate));
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    onSelectDate(today);
    onClose();
  };

  const monthTitle = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  let firstDayIndex = firstDayOfMonth.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const totalDays = lastDayOfMonth.getDate();
  const daysArray: Array<{
    dayNum: number;
    date: Date;
    isCurrentMonth: boolean;
  }> = [];

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    daysArray.push({
      dayNum: d,
      date: new Date(currentYear, currentMonth - 1, d),
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    daysArray.push({
      dayNum: d,
      date: new Date(currentYear, currentMonth, d),
      isCurrentMonth: true,
    });
  }

  const remaining = (7 - (daysArray.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    daysArray.push({
      dayNum: d,
      date: new Date(currentYear, currentMonth + 1, d),
      isCurrentMonth: false,
    });
  }

  const todayStr = new Date().toDateString();
  const selectedStr = selectedDate.toDateString();

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 sm:left-auto top-full mt-2 w-72 rounded-2xl bg-raised border border-soft shadow-2xl p-4 z-50 animate-scaleUp text-primary"
    >
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold text-primary font-sans">
          {monthTitle}
        </h4>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-1 rounded-lg hover:bg-hover text-muted hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            title="Next Month"
            className="p-1 rounded-lg hover:bg-hover text-muted hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (Mon - Sun) */}
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

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map((item, idx) => {
          const isSelected = item.date.toDateString() === selectedStr;
          const isToday = item.date.toDateString() === todayStr;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectDate(item.date);
                onClose();
              }}
              className={`h-7 w-7 mx-auto rounded-lg text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-accent text-accent-fg font-bold shadow-xs scale-105"
                  : isToday
                    ? "border border-accent text-accent font-semibold bg-accent/10"
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

      {/* Footer: Jump to Today */}
      <div className="pt-3 mt-3 border-t border-soft">
        <button
          type="button"
          onClick={handleJumpToToday}
          className="w-full py-1.5 px-3 rounded-xl bg-hover hover:bg-accent/15 text-secondary hover:text-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Jump to Today</span>
        </button>
      </div>
    </div>
  );
};
