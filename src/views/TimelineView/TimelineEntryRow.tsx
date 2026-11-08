/**
 * ChronoCraft - Shared Timeline Entry Row
 * Renders a single timeline entry (time-block marker, card, compact, or flat)
 * Used by both the normal date-scoped TimelineView and the TimelineSearchView.
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
  selectedDateStr: string; // for log "created today" check in default view

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
  // if (!entry || !entry.type) {
  //   return null;
  // }
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
      return <Hourglass className="w-4 h-4 text-violet-400" />;
    if (isMarker === "end")
      return <Clock className="w-4 h-4 text-violet-400" />;
    if (entry.source === "habit")
      return <Flame className="w-4 h-4 text-orange-400" />;
    switch (entry.type) {
      case "task":
        return entry.status === "completed" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/10" />
        ) : (
          <Circle className="w-4 h-4 text-indigo-400 group-hover:text-emerald-400" />
        );
      case "log":
        return <Circle className="w-4 h-4 text-indigo-400 fill-indigo-400" />;
      case "note":
        return <FileText className="w-4 h-4 text-amber-400" />;
      case "event":
        return <CalendarDays className="w-4 h-4 text-cyan-400" />;
      default:
        return <Circle className="w-4 h-4 text-indigo-400" />;
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
        <div className="relative z-10 w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
          <Hourglass className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-between text-xs text-violet-700 dark:text-violet-300">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold uppercase tracking-wider text-[11px] px-1.5 py-0.5 rounded bg-violet-500/20">
              BLOCK START
            </span>
            <InlineTitle
              value={entry.title}
              onSave={(t) => saveEntryTitle(t)}
              className="font-bold text-slate-900 dark:text-slate-100 text-sm"
            />
            <span className="text-violet-400">·</span>
            <span>{formatTimestamp(entry.timeBlock?.startIso)}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleThreeDotClick}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
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
        <div className="relative z-10 w-11 h-11 rounded-xl bg-violet-950 border border-violet-500/40 text-violet-300 flex items-center justify-center shadow-md shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1 p-3 rounded-xl bg-violet-500/5 border border-dashed border-violet-500/30 flex items-center justify-between text-xs text-violet-600 dark:text-violet-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10">
              BLOCK END
            </span>
            <InlineTitle
              value={entry.title}
              onSave={(t) => saveEntryTitle(t)}
              className="text-slate-700 dark:text-slate-300"
            />
            <span>·</span>
            <span>{formatTimestamp(entry.timeBlock?.endIso)}</span>
            <span>·</span>
            <span className="text-slate-400">Duration: {durationText}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleThreeDotClick}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
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
          isContainedInBlock ? "ml-2 pl-4 border-l-2 border-violet-500/30" : ""
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
          className={`relative z-10 w-7 h-7 rounded-lg bg-white dark:bg-[#111724] border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
            entry.type === "task"
              ? "cursor-pointer hover:scale-115 hover:border-emerald-500"
              : "cursor-default"
          } ${
            isCompleted
              ? "border-slate-200 dark:border-slate-800 text-emerald-400"
              : "border-slate-200 dark:border-slate-800 text-slate-400"
          }`}
        >
          {getEntryIcon()}
        </button>
        <div
          onClick={isNoteOrEvent ? handleTitleClick : undefined}
          className={`flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-2xs hover:border-indigo-500/40 transition-all ${isNoteOrEvent ? "cursor-pointer" : ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <InlineTitle
                value={getCleanTitle()}
                onSave={(t) => saveEntryTitle(t, true)}
                className={`text-xs font-semibold truncate ${
                  isCompleted && entry.type === "task"
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-900 dark:text-slate-100"
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
              className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline cursor-pointer transition-colors shrink-0"
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
                className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed"
              />
            ) : (
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {getEntryContent()}
              </div>
            ))}
          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <span className="uppercase text-indigo-400 font-semibold font-sans">
                {entry.source === "habit" ? "HABIT" : entry.type.toUpperCase()}
              </span>
              {entry.tags.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-500">
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
                className="p-0.5 text-slate-400 hover:text-slate-200 transition-colors"
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
        isContainedInBlock ? "ml-3 pl-4 border-l-2 border-violet-500/30" : ""
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
            ? "bg-white dark:bg-[#0B0F17] border border-transparent"
            : "bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-md"
        } ${
          entry.type === "task"
            ? `cursor-pointer ${isFlat ? "" : "hover:scale-110 hover:border-emerald-500"}`
            : "cursor-default"
        }`}
      >
        {getEntryIcon()}
      </button>
      <div
        onClick={isNoteOrEvent ? handleTitleClick : undefined}
        className={`flex-1 transition-all ${
          displayMode === "flat"
            ? "py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
            : "p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/40 hover:shadow-md"
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
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="uppercase text-[11px] text-indigo-400 font-semibold font-sans">
                {entry.source === "habit"
                  ? "HABIT LOG"
                  : entry.type.toUpperCase()}
              </span>
              {entry.scheduledAt && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
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
                    <span className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                    <span className="text-emerald-500 font-medium">
                      Created {formatTimestamp(entry.createdAt)} · Done{" "}
                      {formatTimestamp(entry.completedAt)} (
                      {getElapsedDuration(entry.createdAt, entry.completedAt)})
                    </span>
                  </>
                )}
              {isCompleted && entry.scheduledAt && entry.completedAt && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-emerald-500 font-medium">
                    Done at {formatTimestamp(entry.completedAt)}
                  </span>
                </>
              )}
              {!isCompleted && !entry.scheduledAt && entry.createdAt && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span>Created {formatTimestamp(entry.createdAt)}</span>
                </>
              )}
              {isLog && entry.createdAt && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
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
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-400">
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
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showEntryContent && isNoteOrEvent && getEntryContent() && (
          <RichContent
            content={getEntryContent()}
            className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
          />
        )}
      </div>
    </div>
  );
};
