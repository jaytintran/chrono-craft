/**
 * ChronoCraft - LinkedCreateCard
 * Dashed "create" tile used at the top of the Linked Notes / Linked Events
 * grids inside Lists View. Opens the polymorphic DetailSheet pre-filled
 * with the active list.
 */

import React from "react";
import { Plus } from "lucide-react";

interface LinkedCreateCardProps {
  label: string; // e.g. "New Note"
  sublabel: string; // e.g. 'Add to "Projects"'
  onClick: () => void;
}

export const LinkedCreateCard: React.FC<LinkedCreateCardProps> = ({
  label,
  sublabel,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1 min-h-[110px] p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all cursor-pointer text-center"
    >
      <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-500/15 group-hover:text-indigo-500 transition-colors">
        <Plus className="w-4 h-4" />
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {label}
      </span>
      <span className="text-[10px] font-mono text-slate-400 truncate max-w-full">
        {sublabel}
      </span>
    </button>
  );
};
