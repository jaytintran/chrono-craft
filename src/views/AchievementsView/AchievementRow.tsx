import React from "react";
import {
  CheckCircle2,
  CalendarDays,
  Flame,
  Zap,
  MoreVertical,
} from "lucide-react";
import { AchievementItem } from "./helpers";

interface AchievementRowProps {
  item: AchievementItem;
  onOpen: (item: AchievementItem) => void;
  onOpenContextMenu?: (
    item: AchievementItem,
    pos: { x: number; y: number },
  ) => void;
}

const SOURCE_ICON = {
  list: <CheckCircle2 className="w-5 h-5 text-success" />,
  event: <CalendarDays className="w-5 h-5 text-info" />,
  log: <Flame className="w-5 h-5 text-entity-orange" />,
  focus: <CheckCircle2 className="w-5 h-5 text-accent" />,
} as const;

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const AchievementRow: React.FC<AchievementRowProps> = ({
  item,
  onOpen,
  onOpenContextMenu,
}) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenContextMenu?.(item, { x: e.clientX, y: e.clientY });
  };

  const handleThreeDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenContextMenu?.(item, { x: rect.left, y: rect.bottom + 4 });
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="group relative flex items-center gap-4 pl-1"
    >
      <div className="relative z-10 rounded-xl flex items-center justify-center shrink-0">
        {SOURCE_ICON[item.source]}
      </div>

      <div
        onClick={() => onOpen(item)}
        className="flex-1 min-w-0 p-4 rounded-xl bg-raised border border-soft shadow-xs hover:border-warning/40 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-primary truncate">
                {item.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-sm:text-[10px] max-sm:gap-0.5 text-xs text-secondary font-mono">
              <span className="uppercase text-warning font-semibold font-sans">
                {item.source === "list"
                  ? "LIST"
                  : item.source === "event"
                  ? "EVENT"
                  : item.source === "log"
                  ? "LOG"
                  : "FOCUS"}
              </span>
              {item.tags.length > 0 && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-muted">
                    {item.tags.map((t) => `#${t}`).join(" ")}
                  </span>
                </>
              )}
              <span className="text-muted">·</span>
              <span className="text-warning">
                Achieved {formatTimestamp(item.achievedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleThreeDotClick}
              title="More options (or right click)"
              className="p-1.5 text-muted hover:text-primary hover:bg-hover rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
