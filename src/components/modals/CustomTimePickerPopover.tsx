/**
 * ChronoCraft - CustomTimePickerPopover Component
 * Reusable custom timepicker popover for editing/changing timestamps across the app.
 */

import React, { useState, useEffect, useRef } from "react";
import { Clock, Check, X, ChevronUp, ChevronDown, Zap } from "lucide-react";

interface CustomTimePickerPopoverProps {
  isOpen: boolean;
  initialIso?: string;
  position: { x: number; y: number };
  title?: string;
  onSave: (newIso: string) => void;
  onClose: () => void;
}

export const CustomTimePickerPopover: React.FC<
  CustomTimePickerPopoverProps
> = ({
  isOpen,
  initialIso,
  position,
  title = "Change Time",
  onSave,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const parseInitialTime = () => {
    const d = initialIso ? new Date(initialIso) : new Date();
    const rawHours = d.getHours();
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const minutes = d.getMinutes();
    const isPm = rawHours >= 12;
    return { hours: hours12, minutes, isPm, baseDate: d };
  };

  const initial = parseInitialTime();
  const [hours, setHours] = useState<number>(initial.hours);
  const [minutes, setMinutes] = useState<number>(initial.minutes);
  const [isPm, setIsPm] = useState<boolean>(initial.isPm);
  const [baseDate, setBaseDate] = useState<Date>(initial.baseDate);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialTime();
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setIsPm(parsed.isPm);
      setBaseDate(parsed.baseDate);
    }
  }, [isOpen, initialIso]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        handleConfirm();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, hours, minutes, isPm, baseDate]);

  if (!isOpen) return null;

  const popoverWidth = 280;
  const popoverHeight = 360;
  const safeX = Math.max(
    12,
    Math.min(
      position.x,
      (typeof window !== "undefined" ? window.innerWidth : 1000) -
        popoverWidth -
        16,
    ),
  );
  const safeY = Math.max(
    12,
    Math.min(
      position.y,
      (typeof window !== "undefined" ? window.innerHeight : 800) -
        popoverHeight -
        16,
    ),
  );

  const adjustHour = (delta: number) => {
    setHours((prev) => {
      let next = prev + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    setMinutes((prev) => {
      let next = prev + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 55;
      return next;
    });
  };

  const applyPreset = (h: number, m: number, pm: boolean) => {
    setHours(h);
    setMinutes(m);
    setIsPm(pm);
  };

  const applyOffsetMinutes = (addMinutes: number) => {
    let totalMinutes =
      (hours % 12) * 60 + minutes + (isPm ? 720 : 0) + addMinutes;
    if (totalMinutes < 0) totalMinutes += 1440;
    totalMinutes = totalMinutes % 1440;

    const newHours24 = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    const newPm = newHours24 >= 12;
    const newHours12 = newHours24 % 12 === 0 ? 12 : newHours24 % 12;

    setHours(newHours12);
    setMinutes(newMinutes);
    setIsPm(newPm);
  };

  const applyNow = () => {
    const now = new Date();
    const rawHours = now.getHours();
    setHours(rawHours % 12 === 0 ? 12 : rawHours % 12);
    setMinutes(now.getMinutes());
    setIsPm(rawHours >= 12);
  };

  const handleConfirm = () => {
    const target = new Date(baseDate);
    let hours24 = hours % 12;
    if (isPm) hours24 += 12;
    target.setHours(hours24, minutes, 0, 0);
    onSave(target.toISOString());
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      style={{ top: `${safeY}px`, left: `${safeX}px` }}
      className="fixed z-50 w-72 rounded-2xl bg-raised border border-soft shadow-2xl p-4 text-primary animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-soft">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-semibold tracking-tight">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Digital Clock Controls */}
      <div className="py-4">
        <div className="flex items-center justify-center gap-3">
          {/* Hours Picker */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => adjustHour(1)}
              className="p-1 rounded text-muted hover:text-accent hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-sunken border border-soft font-mono text-2xl font-bold text-primary select-none">
              {hours.toString().padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={() => adjustHour(-1)}
              className="p-1 rounded text-muted hover:text-accent hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-muted mt-0.5">
              HOURS
            </span>
          </div>

          <div className="text-2xl font-bold font-mono text-muted pb-5 select-none">
            :
          </div>

          {/* Minutes Picker */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => adjustMinute(5)}
              className="p-1 rounded text-muted hover:text-accent hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-sunken border border-soft font-mono text-2xl font-bold text-primary select-none">
              {minutes.toString().padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={() => adjustMinute(-5)}
              className="p-1 rounded text-muted hover:text-accent hover:bg-hover transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-muted mt-0.5">
              MINS
            </span>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex flex-col gap-1 pb-4">
            <button
              type="button"
              onClick={() => setIsPm(false)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                !isPm
                  ? "bg-accent text-accent-fg shadow-xs"
                  : "bg-sunken text-secondary hover:text-primary border border-soft"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setIsPm(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isPm
                  ? "bg-accent text-accent-fg shadow-xs"
                  : "bg-sunken text-secondary hover:text-primary border border-soft"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Quick Presets Grid */}
        <div className="mt-2 pt-3 border-t border-soft">
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">
            <Zap className="w-3 h-3 text-warning" />
            <span>Quick Presets</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
            {[
              { label: "Now", onClick: applyNow },
              { label: "9:00 AM", onClick: () => applyPreset(9, 0, false) },
              { label: "12:00 PM", onClick: () => applyPreset(12, 0, true) },
              { label: "2:00 PM", onClick: () => applyPreset(2, 0, true) },
              { label: "5:00 PM", onClick: () => applyPreset(5, 0, true) },
              { label: "8:00 PM", onClick: () => applyPreset(8, 0, true) },
              { label: "+15m", onClick: () => applyOffsetMinutes(15) },
              { label: "+30m", onClick: () => applyOffsetMinutes(30) },
              { label: "+1h", onClick: () => applyOffsetMinutes(60) },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.onClick}
                className="px-2 py-1 rounded-md bg-sunken hover:bg-accent/10 hover:text-accent border border-soft text-secondary transition-colors text-[11px] cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-soft">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Time</span>
        </button>
      </div>
    </div>
  );
};
