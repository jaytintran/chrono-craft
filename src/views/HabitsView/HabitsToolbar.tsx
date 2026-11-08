import React from "react";
import { LayoutGrid, Columns3 } from "lucide-react";
import { HabitsRange, HabitsViewMode } from "./constants";

interface Props {
  mode: HabitsViewMode;
  range: HabitsRange;
  onChangeMode: (m: HabitsViewMode) => void;
  onChangeRange: (r: HabitsRange) => void;
}

const RANGE_LABELS: Record<HabitsRange, string> = {
  "7d": "7D",
  "14d": "14D",
  "1m": "1M",
};

export const HabitsToolbar: React.FC<Props> = ({
  mode,
  range,
  onChangeMode,
  onChangeRange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-soft text-xs">
        {(["7d", "14d", "1m"] as HabitsRange[]).map((r) => {
          const on = range === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChangeRange(r)}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors cursor-pointer ${
                on
                  ? "bg-accent/15 text-accent border border-accent/40"
                  : "text-secondary hover:text-primary border border-transparent"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-soft text-xs">
        <button
          type="button"
          onClick={() => onChangeMode("matrix")}
          title="Matrix Grid"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
            mode === "matrix"
              ? "bg-accent/15 text-accent border border-accent/40"
              : "text-secondary hover:text-primary border border-transparent"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Matrix</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMode("cards")}
          title="Cards Stack"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
            mode === "cards"
              ? "bg-accent/15 text-accent border border-accent/40"
              : "text-secondary hover:text-primary border border-transparent"
          }`}
        >
          <Columns3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cards</span>
        </button>
      </div>
    </div>
  );
};
