/**
 * ChronoCraft - List Item Card
 */

import React from "react";
import {
  PlayCircle,
  CheckCircle2,
  MinusCircle,
  Bookmark,
  Inbox,
  MoreVertical,
} from "lucide-react";
import { ListItem, ListItemStatus } from "../../types";
import { formatCreatedDate } from "./helpers";

export type ItemViewMode = "stacked" | "grid" | "compact";

interface ItemCardProps {
  item: ListItem;
  viewMode: ItemViewMode;
  onOpenStatusPicker: (
    anchorRect: DOMRect,
    currentStatus: ListItemStatus,
  ) => void;
  onOpenItemDetail?: (item: ListItem) => void;
  onOpenContextMenu?: (item: ListItem, pos: { x: number; y: number }) => void;
}

const getStatusIcon = (status: ListItemStatus) => {
  switch (status) {
    case "in-progress":
      return <PlayCircle className="w-4 h-4 text-warning" />;
    case "completed":
    case "done":
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case "dropped":
      return <MinusCircle className="w-4 h-4 text-danger" />;
    case "maybe-later":
      return <Bookmark className="w-4 h-4 text-accent" />;
    case "inbox":
    case "todo":
    default:
      return <Inbox className="w-4 h-4 text-muted" />;
  }
};

const getStatusLabel = (status: ListItemStatus) => {
  switch (status) {
    case "in-progress":
      return "In Progress";
    case "completed":
    case "done":
      return "Completed";
    case "dropped":
      return "Dropped";
    case "maybe-later":
      return "Maybe Later";
    case "inbox":
    case "todo":
    default:
      return "Inbox";
  }
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  viewMode,
  onOpenStatusPicker,
  onOpenItemDetail,
  onOpenContextMenu,
}) => {
  const isCompleted = item.status === "completed" || item.status === "done";
  const isDropped = item.status === "dropped";

  const handleContextMenuTrigger = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenContextMenu?.(item, { x: e.clientX, y: e.clientY });
  };

  const handleThreeDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenContextMenu?.(item, { x: rect.left, y: rect.bottom + 4 });
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenStatusPicker(rect, item.status);
  };

  // ============ COMPACT ROW ============
  if (viewMode === "compact") {
    return (
      <div
        onClick={() => onOpenItemDetail?.(item)}
        onContextMenu={handleContextMenuTrigger}
        className="group flex items-center justify-between px-3 py-2 rounded-xl bg-raised border border-soft hover:border-accent/40 shadow-2xs transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleStatusClick}
            title={`Status: ${getStatusLabel(item.status)} (click to change)`}
            className="p-1 rounded-md hover:bg-hover transition-all hover:scale-110 cursor-pointer shrink-0"
          >
            {getStatusIcon(item.status)}
          </button>

          <span
            className={`text-xs font-semibold truncate ${
              isCompleted || isDropped ? "line-through" : ""
            } ${
              isCompleted
                ? "text-muted"
                : isDropped
                ? "text-danger/70"
                : "text-primary"
            }`}
          >
            {item.title ? (
              item.title
            ) : (
              <span className="text-muted italic font-normal">
                Untitled Item
              </span>
            )}
          </span>

          {item.subtitle && (
            <span className="text-[11px] text-muted truncate hidden sm:inline">
              · {item.subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.dueDate && (
            <span className="text-[10px] font-mono text-info hidden sm:inline">
              {item.dueDate}
            </span>
          )}
          {item.createdAt && (
            <span
              className="text-[10px] font-mono text-muted hidden md:inline"
              title={`Created ${new Date(item.createdAt).toLocaleString()}`}
            >
              {formatCreatedDate(item.createdAt)}
            </span>
          )}

          <button
            type="button"
            onClick={handleStatusClick}
            className="text-[10px] font-mono uppercase text-muted hover:text-accent transition-colors cursor-pointer"
          >
            {getStatusLabel(item.status)}
          </button>

          <button
            type="button"
            onClick={handleThreeDotClick}
            title="Item options"
            className="p-1 text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ============ STACKED & GRID ============
  return (
    <div
      onClick={() => onOpenItemDetail?.(item)}
      onContextMenu={handleContextMenuTrigger}
      className={`group flex items-start justify-between p-4 rounded-2xl bg-raised border border-soft hover:border-accent/40 shadow-xs transition-all cursor-pointer ${
        viewMode === "grid" ? "flex-col gap-3" : "gap-4"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 w-full">
        <button
          type="button"
          onClick={handleStatusClick}
          title={`Status: ${getStatusLabel(item.status)} (click to change)`}
          className="p-1 rounded-xl hover:bg-hover transition-all hover:scale-110 cursor-pointer shrink-0 mt-0.5"
        >
          {getStatusIcon(item.status)}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-semibold truncate ${
                isCompleted || isDropped ? "line-through" : ""
              } ${
                isCompleted
                  ? "text-muted"
                  : isDropped
                  ? "text-danger/70"
                  : "text-primary"
              }`}
            >
              {item.title ? (
                item.title
              ) : (
                <span className="text-muted italic font-normal">
                  Untitled Item
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={handleThreeDotClick}
              title="Item options"
              className="p-1 text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {item.subtitle && (
            <p className="text-xs text-secondary truncate">{item.subtitle}</p>
          )}

          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-muted">
            {item.dueDate && (
              <span className="text-info">Due {item.dueDate}</span>
            )}
            {item.createdAt && (
              <>
                {item.dueDate && <span className="text-muted">·</span>}
                <span
                  className="text-muted"
                  title={`Created ${new Date(item.createdAt).toLocaleString()}`}
                >
                  {formatCreatedDate(item.createdAt)}
                </span>
              </>
            )}
            {item.tags && item.tags.length > 0 && (
              <span className="text-secondary truncate">
                {item.tags.map((t) => `#${t}`).join(" ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
