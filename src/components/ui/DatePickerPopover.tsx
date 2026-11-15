import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { buildMonthGrid } from "../modals/CustomCalendarDropdown";
import { toLocalDateKey } from "../../utils/date";

interface DatePickerPopoverProps {
  isOpen: boolean;
  initialIso?: string;
  position: { x: number; y: number };
  title?: string;
  onSave: (newIso: string) => void;
  onClose: () => void;
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  isOpen,
  initialIso,
  position,
  title = "Change Date",
  onSave,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const initial = initialIso ? new Date(initialIso) : new Date();
  const [viewDate, setViewDate] = useState(initial);
  const [selected, setSelected] = useState(initial);

  useEffect(() => {
    if (!isOpen) return;
    const d = initialIso ? new Date(initialIso) : new Date();
    setViewDate(d);
    setSelected(d);
  }, [isOpen, initialIso]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const { monthTitle, daysArray } = useMemo(
    () => buildMonthGrid(viewDate),
    [viewDate],
  );

  if (!isOpen) return null;

  const W = 280;
  const H = 340;
  const pad = 12;
  const safeX = Math.max(
    pad,
    Math.min(position.x, window.innerWidth - W - pad),
  );
  const safeY = Math.max(
    pad,
    Math.min(position.y, window.innerHeight - H - pad),
  );

  const todayStr = toLocalDateKey(new Date());
  const selectedStr = toLocalDateKey(selected);

  const commit = (d: Date) => {
    // preserve time-of-day from the initial selection
    const next = new Date(initial);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    onSave(next.toISOString());
    onClose();
  };

  return (
    <div
      ref={ref}
      style={{ top: `${safeY}px`, left: `${safeX}px` }}
      className="fixed z-50 w-[280px] rounded-2xl bg-raised border border-soft shadow-2xl p-3 text-primary"
    >
      <div className="flex items-center justify-between pb-2 border-b border-soft">
        <h4 className="text-xs font-semibold">{title}</h4>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 mb-1">
        <span className="text-xs font-bold text-primary">{monthTitle}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
            }
            title="Previous Month"
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
            }
            title="Next Month"
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
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
          const isSelected = dateStr === selectedStr;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => commit(item.date)}
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

      <div className="pt-3 mt-2 border-t border-soft">
        <button
          type="button"
          onClick={() => commit(new Date())}
          className="w-full py-1.5 px-3 rounded-xl bg-hover hover:bg-accent/15 text-secondary hover:text-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Jump to Today</span>
        </button>
      </div>
    </div>
  );
};
