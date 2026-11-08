/**
 * ChronoCraft - LinkedCreateCard
 */

import React from "react";
import { Plus } from "lucide-react";

interface LinkedCreateCardProps {
  label: string;
  sublabel: string;
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
      className="group flex flex-col items-center justify-center gap-1 min-h-[110px] p-4 rounded-xl border border-dashed border-strong bg-transparent hover:border-accent/60 hover:bg-accent/5 transition-all cursor-pointer text-center"
    >
      <div className="p-1.5 rounded-full bg-hover text-muted group-hover:bg-accent/15 group-hover:text-accent transition-colors">
        <Plus className="w-4 h-4" />
      </div>
      <span className="text-xs font-semibold text-primary group-hover:text-accent transition-colors">
        {label}
      </span>
      <span className="text-[10px] font-mono text-muted truncate max-w-full">
        {sublabel}
      </span>
    </button>
  );
};
