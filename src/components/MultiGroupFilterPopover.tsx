import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterGroupOption<V extends string = string> {
  value: V;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterGroup<V extends string = string> {
  key: string;
  label: string; // group heading e.g. "Category"
  icon?: React.ReactNode; // icon shown in the trigger
  options: FilterGroupOption<V>[];
}

interface MultiGroupFilterPopoverProps {
  groups: FilterGroup[];
  /**
   * Current selections keyed by group.key.
   * e.g. { category: "official", timeframe: "past" }
   */
  selections: Record<string, string>;
  /**
   * Called when a value inside a group is picked.
   * Menu stays open until the user clicks outside / presses Esc.
   */
  onChange: (groupKey: string, value: string) => void;
  /** Default value per group — used to compute "active" and the trigger label. */
  defaults?: Record<string, string>;
  /** Optional label when every group is at its default. */
  allLabel?: string;
  /** Maximum width of the trigger's label. */
  triggerMaxWidthClass?: string;
}

export const MultiGroupFilterPopover: React.FC<
  MultiGroupFilterPopoverProps
> = ({
  groups,
  selections,
  onChange,
  defaults,
  allLabel = "All",
  triggerMaxWidthClass = "max-w-[200px]",
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

  const isDefault = (g: FilterGroup) =>
    !defaults || selections[g.key] === defaults[g.key];

  const active = !groups.every(isDefault);

  // Trigger label: join non-default selections by "·", or fall back to allLabel.
  const activeLabels = groups
    .map((g) => {
      if (isDefault(g)) return null;
      const opt = g.options.find((o) => o.value === selections[g.key]);
      return opt?.label ?? null;
    })
    .filter(Boolean) as string[];

  const triggerLabel =
    activeLabels.length > 0 ? activeLabels.join(" · ") : allLabel;

  // Trigger icon: first non-default group's icon, else first group's icon.
  const triggerIcon =
    groups.find((g) => !isDefault(g))?.icon ?? groups[0]?.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs text-xs font-medium transition-colors cursor-pointer ${
          active
            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700"
        }`}
      >
        {triggerIcon}
        <span className={`${triggerMaxWidthClass} truncate`}>
          {triggerLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-40 w-56 rounded-xl bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-2xl p-1">
          {groups.map((g, gi) => (
            <React.Fragment key={g.key}>
              {gi > 0 && (
                <div className="my-1 border-t border-slate-200 dark:border-slate-800" />
              )}
              <div className="px-2 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {g.label}
              </div>
              {g.options.map((o) => {
                const selected = selections[g.key] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(g.key, o.value)}
                    className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                      selected
                        ? "bg-indigo-500/15 text-indigo-300 font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {o.icon}
                      <span className="truncate">{o.label}</span>
                    </span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
