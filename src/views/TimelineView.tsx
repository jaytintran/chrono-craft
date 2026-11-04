/**
 * ChronoCraft - Timeline View Component
 * Features:
 * - Redesigned Header Date Scrubber: "< [Today, DD/MM ▾] >" with custom dropdown calendar.
 * - Format: "Today, DD/MM", "<Weekday>, DD/MM" (or "<Weekday>, DD/MM/YYYY" if different year).
 * - Option switcher for Default vs Minimal views.
 * - Sticky master input bar at bottom of canvas with bracketless time blocks.
 * - Icon-only check-off logic directly on the spine node.
 * - Clickable event & note titles opening DetailSheet.
 * - Created vs Done comparative turnaround telemetry for unscheduled completed tasks.
 * - Context menu trigger on right click, 3-dot button, or 500ms long press.
 */

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  FileText,
  CalendarDays,
  Flame,
  Clock,
  Trash2,
  Hourglass,
  LayoutGrid,
  List,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { CalendarEvent, EntryType, Note, TimelineEntry } from "../types";
import { RichContent } from "../components/RichContent";
import { NLPInputBar } from "../components/NLPInputBar";
import { CustomCalendarDropdown } from "../components/CustomCalendarDropdown";
import { CustomTimePickerPopover } from "../components/CustomTimePickerPopover";
import { useLongPress } from "../hooks/useLongPress";

interface TimelineViewProps {
  entries: TimelineEntry[];
  notes?: Note[];
  events?: CalendarEvent[];
  showEntryContent?: boolean;
  onAddEntry: (entry: Partial<TimelineEntry>) => Promise<void>;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onOpenNoteDetail?: (noteId: string) => void;
  onOpenEventDetail?: (eventId: string) => void;
  onOpenContextMenu?: (
    entry: TimelineEntry,
    pos: { x: number; y: number },
  ) => void;
  onUpdateEntryTime?: (entryId: string, newIso: string) => Promise<void>;
}

type TimelineDisplayMode = "default" | "minimal";

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  notes = [],
  events = [],
  showEntryContent = true,
  onAddEntry,
  onToggleEntryStatus,
  onDeleteEntry,
  onOpenNoteDetail,
  onOpenEventDetail,
  onOpenContextMenu,
  onUpdateEntryTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"all" | EntryType | "habit">(
    "all",
  );
  const [displayMode, setDisplayMode] =
    useState<TimelineDisplayMode>("default");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<{
    entryId: string;
    iso: string;
    position: { x: number; y: number };
  } | null>(null);

  // Clean habit title helper (strips "Completed habit: " prefix)
  const getCleanTitle = (entry: TimelineEntry) => {
    if (entry.source === "habit" || entry.type === "log") {
      return entry.title.replace(/^Completed habit:\s*/i, "");
    }
    return entry.title;
  };

  // Get content of notes and events entries
  const getEntryContent = (entry: TimelineEntry): string => {
    if (entry.type === "note") {
      const n = notes.find((x) => x.id === entry.id || x.title === entry.title);
      if (n?.content) return n.content;
    } else if (entry.type === "event") {
      const ev = events.find(
        (x) => x.id === entry.id || x.title === entry.title,
      );
      if (ev?.description) return ev.description;
    }
    return (
      entry.metadata?.notes ||
      (entry.metadata as any)?.details ||
      (entry as any).content ||
      ""
    );
  };

  // Date cycling helpers
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Format date button text:
  // "Today, DD/MM" | "<Weekday>, DD/MM" | "<Weekday>, DD/MM/YYYY" (if different year)
  const dateButtonText = useMemo(() => {
    const today = new Date();
    const isSameDay = selectedDate.toDateString() === today.toDateString();
    const isSameYear = selectedDate.getFullYear() === today.getFullYear();

    const pad = (n: number) => n.toString().padStart(2, "0");
    const dd = pad(selectedDate.getDate());
    const mm = pad(selectedDate.getMonth() + 1);

    if (isSameDay) {
      return `Today, ${dd}/${mm}`;
    }

    const weekday = selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (isSameYear) {
      return `${weekday}, ${dd}/${mm}`;
    }

    return `${weekday}, ${dd}/${mm}/${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  // Time formatter
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // Calculate elapsed turnaround time
  const getElapsedDuration = (startIso: string, endIso: string) => {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMin = Math.max(0, Math.round((end - start) / 60000));
    if (diffMin < 60) return `${diffMin}m`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Filter day entries
  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const scheduledMatch =
          e.scheduledAt && e.scheduledAt.startsWith(selectedDateStr);
        const createdMatch =
          e.createdAt && e.createdAt.startsWith(selectedDateStr);
        const completedMatch =
          e.completedAt && e.completedAt.startsWith(selectedDateStr);
        const blockStartMatch =
          e.timeBlock?.startIso &&
          e.timeBlock.startIso.startsWith(selectedDateStr);
        return (
          scheduledMatch || createdMatch || completedMatch || blockStartMatch
        );
      })
      .filter((e) => {
        if (filterType === "all") return true;
        if (filterType === "habit") return e.source === "habit";
        return e.type === filterType;
      });
  }, [entries, selectedDateStr, filterType]);

  const activeTimeBlocks = useMemo(() => {
    return dayEntries.filter((e) => e.type === "timeblock" && e.timeBlock);
  }, [dayEntries]);

  // Process timeline items into start/end markers and intermediate items
  interface ProcessedTimelineItem {
    id: string;
    originalEntry: TimelineEntry;
    sortTime: number;
    isTimeBlockMarker?: "start" | "end";
    containedInBlock?: TimelineEntry;
  }

  const processedItems: ProcessedTimelineItem[] = useMemo(() => {
    const items: ProcessedTimelineItem[] = [];

    dayEntries.forEach((e) => {
      if (e.type === "timeblock" && e.timeBlock) {
        const startTime = new Date(e.timeBlock.startIso).getTime();
        items.push({
          id: `${e.id}_start`,
          originalEntry: e,
          sortTime: startTime,
          isTimeBlockMarker: "start",
        });

        const endTime = new Date(e.timeBlock.endIso).getTime();
        items.push({
          id: `${e.id}_end`,
          originalEntry: e,
          sortTime: endTime,
          isTimeBlockMarker: "end",
        });
      } else {
        const itemTime = new Date(
          e.scheduledAt || e.completedAt || e.createdAt,
        ).getTime();

        const enclosingBlock = activeTimeBlocks.find((tb) => {
          if (!tb.timeBlock) return false;
          const s = new Date(tb.timeBlock.startIso).getTime();
          const en = new Date(tb.timeBlock.endIso).getTime();
          return itemTime >= s && itemTime <= en;
        });

        items.push({
          id: e.id,
          originalEntry: e,
          sortTime: itemTime,
          containedInBlock: enclosingBlock,
        });
      }
    });

    return items.sort((a, b) => a.sortTime - b.sortTime);
  }, [dayEntries, activeTimeBlocks]);

  const getEntryIcon = (entry: TimelineEntry, isMarker?: "start" | "end") => {
    if (isMarker === "start") {
      return <Hourglass className="w-4 h-4 text-violet-400" />;
    }
    if (isMarker === "end") {
      return <Clock className="w-4 h-4 text-violet-400" />;
    }
    if (entry.source === "habit") {
      return <Flame className="w-4 h-4 text-orange-400" />;
    }
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* 1. Redesigned Date Header Navigation Toolbar */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B0F17]/70 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-4 z-30">
        {/* Scrubber: < [ Today, DD/MM ▾ ] > with Custom Calendar Dropdown */}
        <div className="relative flex items-center gap-1.5">
          {/* Previous Day Arrow */}
          <button
            type="button"
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Interactive Date Scrubber Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition-all cursor-pointer"
            >
              <span>{dateButtonText}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Custom Dropdown Calendar */}
            <CustomCalendarDropdown
              selectedDate={selectedDate}
              isOpen={isCalendarOpen}
              onSelectDate={(newDate) => {
                setSelectedDate(newDate);
                setIsCalendarOpen(false);
              }}
              onClose={() => setIsCalendarOpen(false)}
            />
          </div>

          {/* Next Day Arrow */}
          <button
            type="button"
            onClick={handleNextDay}
            title="Next Day"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Controls: Density Switcher (Default vs Minimal) & Filter Tabs */}
        <div className="flex items-center gap-3">
          {/* Density Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setDisplayMode("default")}
              title="Standard Card View"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                displayMode === "default"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Default</span>
            </button>

            <button
              type="button"
              onClick={() => setDisplayMode("minimal")}
              title="Compact Two-Line View"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                displayMode === "minimal"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Minimal</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {(
              [
                "all",
                "task",
                "log",
                "note",
                "event",
                "timeblock",
                "habit",
              ] as const
            ).map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setFilterType(ft)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                  filterType === ft
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {ft === "timeblock" ? "Blocks" : ft}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Canvas Area (Padded at bottom so cards aren't obscured by sticky input) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-36">
        <div className="max-w-3xl mx-auto">
          {/* Vertical Spine Container */}
          <div className="relative pt-2">
            {/* Continuous Vertical Spine line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/60 via-slate-300 dark:via-slate-800 to-transparent" />

            {/* Zero State */}
            {processedItems.length === 0 ? (
              <div className="relative pl-14 py-8 text-center text-xs text-slate-400">
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#131926]/40">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No entries logged for {dateButtonText}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Use the sticky input bar at the bottom to schedule tasks,
                    time blocks, notes, or events.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {processedItems.map((item) => {
                  const entry = item.originalEntry;
                  const isCompleted = entry.status === "completed";
                  const isNoteOrEvent =
                    entry.type === "note" || entry.type === "event";
                  const isTimeBlockMarker = item.isTimeBlockMarker;
                  const isContainedInBlock = !!item.containedInBlock;

                  // DetailSheet launch
                  const handleTitleClick = () => {
                    if (entry.type === "note" && onOpenNoteDetail) {
                      onOpenNoteDetail(entry.id);
                    } else if (entry.type === "event" && onOpenEventDetail) {
                      onOpenEventDetail(entry.id);
                    }
                  };

                  // Context menu trigger
                  const handleContextMenu = (e: React.MouseEvent) => {
                    e.preventDefault();
                    if (onOpenContextMenu) {
                      onOpenContextMenu(entry, { x: e.clientX, y: e.clientY });
                    }
                  };

                  // 3-dot click trigger
                  const handleThreeDotClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (onOpenContextMenu) {
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      onOpenContextMenu(entry, {
                        x: rect.left,
                        y: rect.bottom + 4,
                      });
                    }
                  };

                  // =================== TIME BLOCK START MARKER ===================
                  if (isTimeBlockMarker === "start") {
                    return (
                      <div
                        key={item.id}
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
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {entry.title}
                            </span>
                            <span className="text-violet-400">·</span>
                            <span>
                              {formatTimestamp(entry.timeBlock?.startIso)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleThreeDotClick}
                              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEntry(entry.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // =================== TIME BLOCK END MARKER ===================
                  if (isTimeBlockMarker === "end") {
                    const durationMins = entry.timeBlock?.durationMinutes || 0;
                    const durationText = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;

                    return (
                      <div
                        key={item.id}
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
                            <span className="text-slate-700 dark:text-slate-300">
                              {entry.title}
                            </span>
                            <span>·</span>
                            <span>
                              {formatTimestamp(entry.timeBlock?.endIso)}
                            </span>
                            <span>·</span>
                            <span className="text-slate-400">
                              Duration: {durationText}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleThreeDotClick}
                              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // =================== MINIMAL VIEW ===================
                  if (displayMode === "minimal") {
                    return (
                      <div
                        key={item.id}
                        onContextMenu={handleContextMenu}
                        className={`group relative flex items-center gap-4 pl-2.5 ${
                          isContainedInBlock
                            ? "ml-2 pl-4 border-l-2 border-violet-500/30"
                            : ""
                        }`}
                      >
                        {/* Pierced Icon on Spine (Clickable to complete for task) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (entry.type === "task") {
                              onToggleEntryStatus(entry.id);
                            }
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
                          {getEntryIcon(entry)}
                        </button>

                        {/* Minimal Two-Line Strip */}
                        <div
                          onClick={isNoteOrEvent ? handleTitleClick : undefined}
                          className={`flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-2xs hover:border-indigo-500/40 transition-all ${isNoteOrEvent ? "cursor-pointer" : ""}`}
                        >
                          {/* Line 1: Title & Time */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isCompleted && entry.type === "task"
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-900 dark:text-slate-100"
                                }`}
                              >
                                {getCleanTitle(entry)}
                              </span>

                              {entry.priority === "high" && (
                                <span className="text-[9px] font-mono text-rose-500 font-bold uppercase shrink-0">
                                  !HIGH
                                </span>
                              )}
                            </div>

                            {/* Clickable Timestamp Badge */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (
                                  e.currentTarget as HTMLElement
                                ).getBoundingClientRect();
                                setTimePickerTarget({
                                  entryId: entry.id,
                                  iso:
                                    entry.scheduledAt ||
                                    entry.completedAt ||
                                    entry.createdAt,
                                  position: {
                                    x: rect.left - 60,
                                    y: rect.bottom + 6,
                                  },
                                });
                              }}
                              title="Click to change timestamp"
                              className="font-mono text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline cursor-pointer transition-colors shrink-0"
                            >
                              {formatTimestamp(
                                entry.scheduledAt ||
                                  entry.completedAt ||
                                  entry.createdAt,
                              )}
                            </button>
                          </div>

                          {/* Optional Entry Content preview if toggled ON in Preferences */}
                          {showEntryContent !== false &&
                            getEntryContent(entry) &&
                            (isNoteOrEvent ? (
                              <RichContent
                                content={getEntryContent(entry)}
                                className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed"
                              />
                            ) : (
                              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {getEntryContent(entry)}
                              </div>
                            ))}

                          {/* Line 2: Minimalist Metadata Badges & 3-Dot Context Trigger */}
                          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-slate-400">
                            <div className="flex items-center gap-2 truncate">
                              <span className="uppercase text-indigo-400 font-semibold font-sans">
                                {entry.source === "habit"
                                  ? "HABIT"
                                  : entry.type.toUpperCase()}
                              </span>

                              {isCompleted &&
                                !entry.scheduledAt &&
                                entry.completedAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">
                                      ·
                                    </span>
                                    <span className="text-emerald-500">
                                      Created {formatTimestamp(entry.createdAt)}{" "}
                                      → Done{" "}
                                      {formatTimestamp(entry.completedAt)} (
                                      {getElapsedDuration(
                                        entry.createdAt,
                                        entry.completedAt,
                                      )}
                                      )
                                    </span>
                                  </>
                                )}

                              {isCompleted &&
                                entry.scheduledAt &&
                                entry.completedAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">
                                      ·
                                    </span>
                                    <span className="text-emerald-500">
                                      Done at{" "}
                                      {formatTimestamp(entry.completedAt)}
                                    </span>
                                  </>
                                )}

                              {entry.tags.length > 0 && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">
                                    ·
                                  </span>
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEntry(entry.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // =================== DEFAULT VIEW ===================
                  return (
                    <div
                      key={item.id}
                      onContextMenu={handleContextMenu}
                      className={`group relative flex items-start gap-4 pl-1 ${
                        isContainedInBlock
                          ? "ml-3 pl-4 border-l-2 border-violet-500/30"
                          : ""
                      }`}
                    >
                      {/* Pierced Icon on Spine (Clickable to complete for tasks) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.type === "task") {
                            onToggleEntryStatus(entry.id);
                          }
                        }}
                        disabled={entry.type !== "task"}
                        title={
                          entry.type === "task"
                            ? isCompleted
                              ? "Click to reopen task"
                              : "Click to complete task"
                            : undefined
                        }
                        className={`relative z-10 w-11 h-11 rounded-xl bg-white dark:bg-[#111724] border flex items-center justify-center shadow-md shrink-0 transition-transform ${
                          entry.type === "task"
                            ? "cursor-pointer hover:scale-110 hover:border-emerald-500"
                            : "cursor-default"
                        } ${
                          isCompleted
                            ? "border-slate-200 dark:border-slate-800"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {getEntryIcon(entry)}
                      </button>

                      {/* Horizontal Card along the spine */}
                      <div
                        onClick={isNoteOrEvent ? handleTitleClick : undefined}
                        className={`flex-1 p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/40 hover:shadow-md transition-all ${isNoteOrEvent ? "cursor-pointer" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            {/* Title */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isCompleted && entry.type === "task"
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-900 dark:text-slate-100"
                                }`}
                              >
                                {entry.title}
                              </span>

                              {entry.priority === "high" && (
                                <span className="text-[10px] font-mono text-rose-500 font-bold uppercase">
                                  !HIGH
                                </span>
                              )}
                            </div>

                            {/* Clean Unboxed Metadata Line */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                              <span className="uppercase text-[11px] text-indigo-400 font-semibold font-sans">
                                {entry.source === "habit"
                                  ? "HABIT LOG"
                                  : entry.type.toUpperCase()}
                              </span>

                              {entry.scheduledAt && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">
                                    ·
                                  </span>
                                  <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      Scheduled{" "}
                                      {formatTimestamp(entry.scheduledAt)}
                                    </span>
                                  </span>
                                </>
                              )}

                              {isCompleted &&
                                !entry.scheduledAt &&
                                entry.completedAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">
                                      ·
                                    </span>
                                    <span className="text-emerald-500 font-medium">
                                      Created {formatTimestamp(entry.createdAt)}{" "}
                                      · Done{" "}
                                      {formatTimestamp(entry.completedAt)} (
                                      {getElapsedDuration(
                                        entry.createdAt,
                                        entry.completedAt,
                                      )}
                                      )
                                    </span>
                                  </>
                                )}

                              {isCompleted &&
                                entry.scheduledAt &&
                                entry.completedAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">
                                      ·
                                    </span>
                                    <span className="text-emerald-500 font-medium">
                                      Done at{" "}
                                      {formatTimestamp(entry.completedAt)}
                                    </span>
                                  </>
                                )}

                              {!isCompleted &&
                                !entry.scheduledAt &&
                                entry.createdAt && (
                                  <>
                                    <span className="text-slate-300 dark:text-slate-700">
                                      ·
                                    </span>
                                    <span>
                                      Created {formatTimestamp(entry.createdAt)}
                                    </span>
                                  </>
                                )}

                              {entry.tags.length > 0 && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">
                                    ·
                                  </span>
                                  <span className="text-slate-400">
                                    {entry.tags.map((t) => `#${t}`).join(" ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action icons: 3-Dot Menu + Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={handleThreeDotClick}
                              title="More options (or right click)"
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {showEntryContent !== false &&
                          isNoteOrEvent &&
                          getEntryContent(entry) && (
                            <RichContent
                              content={getEntryContent(entry)}
                              className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                            />
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Master Input Bar */}
      <div className="sticky bottom-0 z-20 px-4 md:px-8 py-3.5 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-xl">
        <div className="max-w-3xl mx-auto">
          <NLPInputBar
            placeholder='Add entry... e.g. "Architecture Review from 1pm to 3pm", or "/note Tech spec"'
            defaultType="task"
            showTypeSwitcher={true}
            allowTimeBlock={true}
            baseDate={selectedDate}
            buttonLabel="Add"
            onSubmit={(parsed) => {
              const now = new Date().toISOString();
              let scheduledAt = parsed.scheduledAt;
              if (!scheduledAt && !isToday && parsed.type !== "timeblock") {
                const d = new Date(selectedDate);
                scheduledAt = d.toISOString();
              }

              onAddEntry({
                type: parsed.type,
                title: parsed.title,
                scheduledAt,
                createdAt: now,
                status: parsed.type === "log" ? "completed" : "pending",
                source: "timeline",
                tags: parsed.tags,
                priority: parsed.priority || "normal",
                timeBlock: parsed.timeBlock,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
