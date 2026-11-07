/**
 * ChronoCraft - Timeline View (with global search)
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  History,
} from "lucide-react";
import { EntryType, TimelineEntry, TimelineDisplayMode } from "../../types";
import { NLPInputBar } from "../../components/NLPInputBar";
import { toLocalDateKey } from "../../utils/date";

import { CustomCalendarDropdown } from "../../components/modals/CustomCalendarDropdown";
import { CustomTimePickerPopover } from "../../components/modals/CustomTimePickerPopover";
import { SearchBar } from "../../components/ui/SearchBar";
import { TimelineSearchView } from "./TimelineSearchView";
import { TimelineEntryRow, ProcessedTimelineItem } from "./TimelineEntryRow";

import { Keyboard } from "@capacitor/keyboard";

interface TimelineViewProps {
  entries: TimelineEntry[];
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
  displayMode?: TimelineDisplayMode;
  onUpdateEntryTitle?: (entryId: string, newTitle: string) => Promise<void>;
}

const getEntryAnchorIso = (e: TimelineEntry): string =>
  e.status === "completed" && e.completedAt
    ? e.completedAt
    : e.timeBlock?.startIso || e.scheduledAt || e.createdAt;

const getEntryDateKey = (e: TimelineEntry): string =>
  toLocalDateKey(new Date(getEntryAnchorIso(e)));

const formatDayMonth = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  showEntryContent = true,
  onAddEntry,
  onToggleEntryStatus,
  onDeleteEntry,
  onOpenNoteDetail,
  onOpenEventDetail,
  onOpenContextMenu,
  onUpdateEntryTime,
  displayMode = "default",
  onUpdateEntryTitle,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"all" | EntryType | "habit">(
    "all",
  );
  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [timePickerTarget, setTimePickerTarget] = useState<{
    entryId: string;
    iso: string;
    position: { x: number; y: number };
  } | null>(null);

  const isSearching = searchQuery.trim().length > 0;

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

  const selectedDateStr = toLocalDateKey(selectedDate);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const dateButtonText = useMemo(() => {
    const today = new Date();
    const isSameDay = selectedDate.toDateString() === today.toDateString();
    const isSameYear = selectedDate.getFullYear() === today.getFullYear();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dd = pad(selectedDate.getDate());
    const mm = pad(selectedDate.getMonth() + 1);
    if (isSameDay) return `Today, ${dd}/${mm}`;
    const weekday = selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
    });
    return isSameYear
      ? `${weekday}, ${dd}/${mm}`
      : `${weekday}, ${dd}/${mm}/${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => getEntryDateKey(e) === selectedDateStr)
      .filter((e) => {
        if (filterType === "all") return true;
        if (filterType === "habit") return e.source === "habit";
        return e.type === filterType;
      });
  }, [entries, selectedDateStr, filterType]);

  const todayKey = toLocalDateKey(new Date());
  const carryOver = useMemo(
    () =>
      entries
        .filter(
          (e) =>
            e.type === "task" &&
            e.status !== "completed" &&
            e.source === "timeline" &&
            getEntryDateKey(e) < todayKey,
        )
        .sort((a, b) =>
          getEntryAnchorIso(b).localeCompare(getEntryAnchorIso(a)),
        ),
    [entries, todayKey],
  );

  const activeTimeBlocks = useMemo(
    () => dayEntries.filter((e) => e.type === "timeblock" && e.timeBlock),
    [dayEntries],
  );

  const processedItems: ProcessedTimelineItem[] = useMemo(() => {
    const items: ProcessedTimelineItem[] = [];
    dayEntries.forEach((e) => {
      if (e.type === "timeblock" && e.timeBlock) {
        items.push({
          id: `${e.id}_start`,
          originalEntry: e,
          sortTime: new Date(e.timeBlock.startIso).getTime(),
          isTimeBlockMarker: "start",
        });
        items.push({
          id: `${e.id}_end`,
          originalEntry: e,
          sortTime: new Date(e.timeBlock.endIso).getTime(),
          isTimeBlockMarker: "end",
        });
      } else {
        const itemTime = new Date(getEntryAnchorIso(e)).getTime();
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

  // Keyboard: "/" or Cmd/Ctrl+K focuses search; Esc exits search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (
        !typing &&
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k"))
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && isSearching) {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSearching]);

  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardHeight(info.keyboardHeight);
    });
    Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
  }, []);

  const openTimePicker = (
    entryId: string,
    iso: string,
    position: { x: number; y: number },
  ) => setTimePickerTarget({ entryId, iso, position });

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B0F17]/70 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-4 z-30">
        {/* Date scrubber (disabled visually while searching) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-xs transition-all cursor-pointer"
            >
              <span>{dateButtonText}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
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
          <button
            type="button"
            onClick={handleNextDay}
            title="Next Day"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right side: Search + filter tabs */}
        <div className="flex items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            inputRef={searchInputRef}
          />

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
                disabled={isSearching}
                onClick={() => setFilterType(ft)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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

      {/* Body: search results OR normal timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pt-6 pb-36">
        {isSearching ? (
          <TimelineSearchView
            query={searchQuery}
            entries={entries}
            displayMode={displayMode}
            showEntryContent={showEntryContent}
            onExit={() => setSearchQuery("")}
            onToggleEntryStatus={onToggleEntryStatus}
            onDeleteEntry={onDeleteEntry}
            onUpdateEntryTitle={onUpdateEntryTitle}
            onOpenNoteDetail={onOpenNoteDetail}
            onOpenEventDetail={onOpenEventDetail}
            onOpenContextMenu={onOpenContextMenu}
            onOpenTimePicker={openTimePicker}
          />
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Carry-over tray */}
            {isToday &&
              (filterType === "all" || filterType === "task") &&
              carryOver.length > 0 && (
                <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <button
                    type="button"
                    onClick={() => setIsCarryOverOpen((v) => !v)}
                    aria-expanded={isCarryOverOpen}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                      <History className="w-4 h-4" />
                      Unfinished from earlier
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 font-mono text-[10px]">
                        {carryOver.length}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-amber-500 transition-transform ${isCarryOverOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isCarryOverOpen && (
                    <ul className="max-h-60 overflow-y-auto divide-y divide-amber-500/15 border-t border-amber-500/20">
                      {carryOver.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {t.title}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              From {formatDayMonth(getEntryAnchorIso(t))}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateEntryTime?.(
                                t.id,
                                new Date().toISOString(),
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                          >
                            Move to today
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleEntryStatus(t.id)}
                            title="Mark complete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            {/* Normal spine */}
            <div className="relative pt-2">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/60 via-slate-300 dark:via-slate-800 to-transparent" />
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
                <div
                  className={`${displayMode === "flat" ? "space-y-1" : "space-y-4"} relative`}
                >
                  {processedItems.map((item) => (
                    <TimelineEntryRow
                      key={item.id}
                      item={item}
                      displayMode={displayMode}
                      showEntryContent={showEntryContent}
                      selectedDateStr={selectedDateStr}
                      onToggleEntryStatus={onToggleEntryStatus}
                      onDeleteEntry={onDeleteEntry}
                      onUpdateEntryTitle={onUpdateEntryTitle}
                      onOpenNoteDetail={onOpenNoteDetail}
                      onOpenEventDetail={onOpenEventDetail}
                      onOpenContextMenu={onOpenContextMenu}
                      onOpenTimePicker={openTimePicker}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky input bar (only in normal mode) */}
      {!isSearching && (
        <div
          style={{ paddingBottom: `${keyboardHeight + 12}px` }}
          className="shrink-0 px-4 md:px-8 py-3.5 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-xl"
        >
          <div className="max-w-6xl mx-auto">
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
                  timeBlock: parsed.timeBlock,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Time picker popover — shared between normal and search views */}
      {timePickerTarget && (
        <CustomTimePickerPopover
          isOpen
          initialIso={timePickerTarget.iso}
          position={timePickerTarget.position}
          onClose={() => setTimePickerTarget(null)}
          onSave={(iso) => {
            onUpdateEntryTime?.(timePickerTarget.entryId, iso);
            setTimePickerTarget(null);
          }}
        />
      )}
    </div>
  );
};
