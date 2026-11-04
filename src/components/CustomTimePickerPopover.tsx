/**
 * ChronoCraft - CustomTimePickerPopover Component
 * Reusable custom timepicker popover for editing/changing timestamps across the app.
 * Features 12h/5m dials, AM/PM toggle, quick presets (Morning, Noon, Afternoon, Night, +15m, +30m, +1h),
 * and fine-grained minute adjustments with clean zero-pill styling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X, ChevronUp, ChevronDown, Zap } from 'lucide-react';

interface CustomTimePickerPopoverProps {
  isOpen: boolean;
  initialIso?: string;
  position: { x: number; y: number };
  title?: string;
  onSave: (newIso: string) => void;
  onClose: () => void;
}

export const CustomTimePickerPopover: React.FC<CustomTimePickerPopoverProps> = ({
  isOpen,
  initialIso,
  position,
  title = 'Change Time',
  onSave,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse initial ISO or default to current date/time
  const parseInitialTime = () => {
    const d = initialIso ? new Date(initialIso) : new Date();
    const rawHours = d.getHours();
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const minutes = d.getMinutes();
    const isPm = rawHours >= 12;
    return {
      hours: hours12,
      minutes,
      isPm,
      baseDate: d,
    };
  };

  const initial = parseInitialTime();
  const [hours, setHours] = useState<number>(initial.hours);
  const [minutes, setMinutes] = useState<number>(initial.minutes);
  const [isPm, setIsPm] = useState<boolean>(initial.isPm);
  const [baseDate, setBaseDate] = useState<Date>(initial.baseDate);

  // Re-sync when popover opens or initialIso changes
  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitialTime();
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
      setIsPm(parsed.isPm);
      setBaseDate(parsed.baseDate);
    }
  }, [isOpen, initialIso]);

  // Click outside and ESC key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, hours, minutes, isPm, baseDate]);

  if (!isOpen) return null;

  // Viewport clamping
  const popoverWidth = 280;
  const popoverHeight = 360;
  const safeX = Math.max(
    12,
    Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - popoverWidth - 16)
  );
  const safeY = Math.max(
    12,
    Math.min(position.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - popoverHeight - 16)
  );

  // Hour adjust
  const adjustHour = (delta: number) => {
    setHours((prev) => {
      let next = prev + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  };

  // Minute adjust
  const adjustMinute = (delta: number) => {
    setMinutes((prev) => {
      let next = prev + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 55;
      return next;
    });
  };

  // Quick Presets
  const applyPreset = (h: number, m: number, pm: boolean) => {
    setHours(h);
    setMinutes(m);
    setIsPm(pm);
  };

  const applyOffsetMinutes = (addMinutes: number) => {
    let totalMinutes = (hours % 12) * 60 + minutes + (isPm ? 720 : 0) + addMinutes;
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

  // Save confirm
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
      style={{
        top: `${safeY}px`,
        left: `${safeX}px`,
      }}
      className="fixed z-50 w-72 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h4 className="text-xs font-semibold tracking-tight">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 select-none">
              {hours.toString().padStart(2, '0')}
            </div>
            <button
              type="button"
              onClick={() => adjustHour(-1)}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">HOURS</span>
          </div>

          <div className="text-2xl font-bold font-mono text-slate-400 pb-5 select-none">:</div>

          {/* Minutes Picker */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => adjustMinute(5)}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="w-14 h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 select-none">
              {minutes.toString().padStart(2, '0')}
            </div>
            <button
              type="button"
              onClick={() => adjustMinute(-5)}
              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">MINS</span>
          </div>

          {/* AM / PM Toggle */}
          <div className="flex flex-col gap-1 pb-4">
            <button
              type="button"
              onClick={() => setIsPm(false)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                !isPm
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setIsPm(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isPm
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-800'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Quick Presets Grid */}
        <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Quick Presets</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={applyNow}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => applyPreset(9, 0, false)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              9:00 AM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(12, 0, true)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              12:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2, 0, true)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              2:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(5, 0, true)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              5:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyPreset(8, 0, true)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              8:00 PM
            </button>
            <button
              type="button"
              onClick={() => applyOffsetMinutes(15)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => applyOffsetMinutes(30)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => applyOffsetMinutes(60)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900/90 hover:bg-indigo-500/10 hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-[11px] cursor-pointer"
            >
              +1h
            </button>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Time</span>
        </button>
      </div>
    </div>
  );
};
