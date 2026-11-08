/**
 * ChronoCraft - Shared Timeline Entry Row
 */

import React from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  CalendarDays,
  Flame,
  Clock,
  Hourglass,
  MoreVertical,
} from "lucide-react";
import { TimelineEntry, TimelineDisplayMode } from "../../types";
import { InlineTitle } from "../../components/ui/InlineTitle";
import { RichContent } from "../../components/editors/RichContent";
import { toLocalDateKey } from "../../utils/date";

export interface ProcessedTimelineItem {
  id: string;
  originalEntry: TimelineEntry;
  sortTime: number;
  isTimeBlockMarker?: "start" | "end";
  containedInBlock?: TimelineEntry;
}

interface TimelineEntryRowProps {
  item: ProcessedTimelineItem;
  displayMode: TimelineDisplayMode;
  showEntryContent: boolean;
  selectedDateStr: string;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onUpdateEntryTitle?: (entryId: string, newTitle: string) => Promise<void>;
  onOpenNoteDetail?: (noteId: string) => void;
  onOpenEventDetail?: (eventId: string) => void;
  onOpenContextMenu?: (
    entry: TimelineEntry,
    pos: { x: number; y: number },
  ) => void;
  onOpenTimePicker?: (
    entryId: string,
    iso: string,
    position: { x: number; y: number },
  ) => void;
}

export const TimelineEntryRow: React.FC<TimelineEntryRowProps> = ({
  item,
  displayMode,
  showEntryContent,
  selectedDateStr,
  onToggleEntryStatus,
  onDeleteEntry,
  onUpdateEntryTitle,
  onOpenNoteDetail,
  onOpenEventDetail,
  onOpenContextMenu,
  onOpenTimePicker,
}) => {
  const entry = item.originalEntry;

  // Defensive: a malformed record without a `type` field would otherwise
  // crash the whole timeline on `entry.type.toUpperCase()`. Skip it.
  if (!entry || !entry.type) {
    return null;
  }

  const isCompleted = entry.status === "completed";
  const isNoteOrEvent = entry.type === "note" || entry.type === "event";
  const isLog = entry.type === "log";
  const isTimeBlockMarker = item.isTimeBlockMarker;
  const isContainedInBlock = !!item.containedInBlock;
  const isFlat = displayMode === "flat";

  const getCleanTitle = () => {
    if (entry.source === "habit" || entry.type === "log") {
      return entry.title.replace(/^Completed habit:\s*/i, "");
    }
    return entry.title;
  };

  const saveEntryTitle = (next: string, restorePrefix = false) => {
    const prefix = restorePrefix
      ? (entry.title.match(/^Completed habit:\s*/i)?.[0] ?? "")
      : "";
    onUpdateEntryTitle?.(entry.id, prefix + next);
  };

  const getEntryContent = (): string =>
    entry.metadata?.notes ||
    (entry.metadata as any)?.details ||
    (entry as any).content ||
    "";

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const formatCreatedAt = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm} · ${formatTimestamp(iso)}`;
  };

  const getElapsedDuration = (startIso: string, endIso: string) => {
    const diffMin = Math.max(
      0,
      Math.round(
        (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000,
      ),
    );
    if (diffMin < 60) return `${diffMin}m`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getEntryIcon = (isMarker?: "start" | "end") => {
    if (isMarker === "start")
      return <Hourglass className="w-4 h-4 text-accent" />;
    if (isMarker === "end") return <Clock className="w-4 h-4 text-accent" />;
    if (entry.source === "habit")
      return <Flame className="w-4 h-4 text-entity-orange" />;
    switch (entry.type) {
      case "task":
        return entry.status === "completed" ? (
          <CheckCircle2 className="w-4 h-4 text-success fill-success/10" />
        ) : (
          <Circle className="w-4 h-4 text-accent group-hover:text-success" />
        );
      case "log":
        return <Circle className="w-4 h-4 text-accent fill-accent" />;
      case "note":
        return <FileText className="w-4 h-4 text-warning" />;
      case "event":
        return <CalendarDays className="w-4 h-4 text-info" />;
      default:
        return <Circle className="w-4 h-4 text-accent" />;
    }
  };

  const handleTitleClick = () => {
    if (entry.type === "note" && onOpenNoteDetail) onOpenNoteDetail(entry.id);
    else if (entry.type === "event" && onOpenEventDetail)
      onOpenEventDetail(entry.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenContextMenu?.(entry, { x: e.clientX, y: e.clientY });
  };

  const handleThreeDotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenContextMenu?.(entry, { x: rect.left, y: rect.bottom + 4 });
  };

  // ========== TIME BLOCK START ==========
  if (isTimeBlockMarker === "start") {
    return (
      <div
        onContextMenu={handleContextMenu}
        className="group relative flex items-center gap-4 pl-1 pt-3"
      >
        <div className="relative z-10 w-11 h-11 rounded-xl bg-accent text-accent-fg flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
          <Hourglass className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between text-xs text-accent">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold uppercase tracking-wider text-[11px] px-1.5 py-0.5 rounded bg-accent/20">
              BLOCK START
            </span>
            <InlineTitle
              value={entry.title}
              onSave={(t) => saveEntryTitle(t)}
              className="font-bold text-primary text-sm"
            />
            <span className="text-accent">·</span>
            <span>{formatTimestamp(entry.timeBlock?.startIso)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleThreeDotClick}
              className="p-1 text-muted hover:text-primary transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== TIME BLOCK END ==========
  if (isTimeBlockMarker === "end") {
    const durationMins = entry.timeBlock?.durationMinutes || 0;
    const durationText = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
    return (
      <div
        onContextMenu={handleContextMenu}
        className="group relative flex items-center gap-4 pl-1 pb-3"
      >
        <div className="relative z-10 w-11 h-11 rounded-xl bg-accent/20 border border-accent/40 text-accent flex items-center justify-center shadow-md shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1 p-3 rounded-xl bg-accent/5 border border-dashed border-accent/30 flex items-center justify-between text-xs text-accent">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-accent/10">
              BLOCK END
            </span>
            <InlineTitle
              value={entry.title}
              onSave={(t) => saveEntryTitle(t)}
              className="text-secondary"
            />
            <span>·</span>
            <span>{formatTimestamp(entry.timeBlock?.endIso)}</span>
            <span>·</span>
            <span className="text-muted">Duration: {durationText}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleThreeDotClick}
              className="p-1 text-muted hover:text-primary transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== COMPACT ==========
  if (displayMode === "compact") {
    return (
      <div
        onContextMenu={handleContextMenu}
        className={`group relative flex items-center gap-4 pl-2.5 ${
          isContainedInBlock ? "ml-2 pl-4 border-l-2 border-accent/30" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (entry.type === "task") onToggleEntryStatus(entry.id);
          }}
          disabled={entry.type !== "task"}
          title={
            entry.type === "task"
              ? isCompleted
                ? "Click to reopen task"
                : "Click to complete task"
              : undefined
          }
          className={`relative z-10 w-7 h-7 rounded-lg bg-raised border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
            entry.type === "task"
              ? "cursor-pointer hover:scale-115 hover:border-success"
              : "cursor-default"
          } ${
            isCompleted ? "border-soft text-success" : "border-soft text-muted"
          }`}
        >
          {getEntryIcon()}
        </button>
        <div
          onClick={isNoteOrEvent ? handleTitleClick : undefined}
          className={`flex-1 px-3 py-2 rounded-xl bg-raised border border-soft shadow-2xs hover:border-accent/40 transition-all ${isNoteOrEvent ? "cursor-pointer" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <InlineTitle
                value={getCleanTitle()}
                onSave={(t) => saveEntryTitle(t, true)}
                className={`text-xs font-semibold truncate ${
                  isCompleted && entry.type === "task"
                    ? "line-through text-muted"
                    : "text-primary"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                onOpenTimePicker?.(
                  entry.id,
                  entry.scheduledAt || entry.completedAt || entry.createdAt,
                  { x: rect.left - 60, y: rect.bottom + 6 },
                );
              }}
              title="Click to change timestamp"
              className="font-mono text-[11px] text-secondary hover:text-accent hover:underline cursor-pointer transition-colors shrink-0"
            >
              {formatTimestamp(
                entry.scheduledAt || entry.completedAt || entry.createdAt,
              )}
            </button>
          </div>
          {showEntryContent &&
            getEntryContent() &&
            (isNoteOrEvent ? (
              <RichContent
                content={getEntryContent()}
                className="mt-1.5 text-[11px] text-secondary leading-relaxed"
              />
            ) : (
              <div className="mt-1 text-[11px] text-secondary line-clamp-2 leading-relaxed">
                {getEntryContent()}
              </div>
            ))}
          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-muted">
            <div className="flex items-center gap-2 truncate">
              <span className="uppercase text-accent font-semibold font-sans">
                {entry.source === "habit" ? "HABIT" : entry.type.toUpperCase()}
              </span>
              {entry.tags.length > 0 && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-secondary">
                    {entry.tags.map((t) => `#${t}`).join(" ")}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleThreeDotClick}
                title="Open item options"
                className="p-0.5 text-muted hover:text-primary transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== DEFAULT / FLAT ==========
  return (
    <div
      onContextMenu={handleContextMenu}
      className={`group relative flex items-start gap-4 pl-1 ${
        isContainedInBlock ? "ml-3 pl-4 border-l-2 border-accent/30" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (entry.type === "task") onToggleEntryStatus(entry.id);
        }}
        disabled={entry.type !== "task"}
        title={
          entry.type === "task"
            ? isCompleted
              ? "Click to reopen task"
              : "Click to complete task"
            : undefined
        }
        className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
          isFlat
            ? "bg-app border border-transparent"
            : "bg-raised border border-soft shadow-md"
        } ${
          entry.type === "task"
            ? `cursor-pointer ${isFlat ? "" : "hover:scale-110 hover:border-success"}`
            : "cursor-default"
        }`}
      >
        {getEntryIcon()}
      </button>
      <div
        onClick={isNoteOrEvent ? handleTitleClick : undefined}
        className={`flex-1 transition-all ${
          displayMode === "flat"
            ? "py-1.5 px-2 -mx-2 rounded-lg hover:bg-hover/70"
            : "p-4 rounded-xl bg-raised border border-soft shadow-xs hover:border-accent/40 hover:shadow-md"
        } ${isNoteOrEvent ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <InlineTitle
                value={entry.title}
                onSave={(t) => saveEntryTitle(t)}
                className={`text-sm font-semibold truncate ${
                  isCompleted && entry.type === "task"
                    ? "line-through text-muted"
                    : "text-primary"
                }`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-secondary font-mono">
              <span className="uppercase text-[11px] text-accent font-semibold font-sans">
                {entry.source === "habit"
                  ? "HABIT LOG"
                  : entry.type.toUpperCase()}
              </span>
              {entry.scheduledAt && (
                <>
                  <span className="text-muted">·</span>
                  <span className="flex items-center gap-1 text-info">
                    <Clock className="w-3 h-3" />
                    <span>Scheduled {formatTimestamp(entry.scheduledAt)}</span>
                  </span>
                </>
              )}
              {isCompleted &&
                !isLog &&
                !entry.scheduledAt &&
                entry.completedAt && (
                  <>
                    <span className="text-muted">·</span>
                    <span className="text-success font-medium">
                      Created {formatTimestamp(entry.createdAt)} · Done{" "}
                      {formatTimestamp(entry.completedAt)} (
                      {getElapsedDuration(entry.createdAt, entry.completedAt)})
                    </span>
                  </>
                )}
              {isCompleted && entry.scheduledAt && entry.completedAt && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-success font-medium">
                    Done at {formatTimestamp(entry.completedAt)}
                  </span>
                </>
              )}
              {!isCompleted && !entry.scheduledAt && entry.createdAt && (
                <>
                  <span className="text-muted">·</span>
                  <span>Created {formatTimestamp(entry.createdAt)}</span>
                </>
              )}
              {isLog && entry.createdAt && (
                <>
                  <span className="text-muted">·</span>
                  <span>
                    {toLocalDateKey(new Date(entry.createdAt)) ===
                    selectedDateStr
                      ? formatTimestamp(entry.createdAt)
                      : `Created ${formatCreatedAt(entry.createdAt)}`}
                  </span>
                </>
              )}
              {entry.tags.length > 0 && (
                <>
                  <span className="text-muted">·</span>
                  <span className="text-muted">
                    {entry.tags.map((t) => `#${t}`).join(" ")}
                  </span>
                </>
              )}
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
        {showEntryContent && isNoteOrEvent && getEntryContent() && (
          <RichContent
            content={getEntryContent()}
            className="mt-3 pt-3 border-t border-soft text-xs text-secondary leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};
