import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  icon: React.ReactNode;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  active?: boolean;
}

export const FilterSelect: React.FC<Props> = ({
  icon,
  value,
  options,
  onChange,
  active,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs text-xs font-medium transition-colors cursor-pointer ${
          active
            ? "bg-accent/10 border-accent/40 text-accent"
            : "bg-surface border-soft text-secondary hover:border-strong"
        }`}
      >
        {icon}
        <span className="max-w-[140px] truncate">{current?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-40 min-w-[180px] max-h-64 overflow-y-auto p-1 rounded-xl bg-raised border border-soft shadow-2xl">
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                  selected
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-secondary hover:bg-hover"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
