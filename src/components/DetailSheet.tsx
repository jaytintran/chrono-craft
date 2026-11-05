/**
 * ChronoCraft - Polymorphic DetailSheet Component
 * Reusable slide-over drawer for viewing & editing Notes, Events, and Habits.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Tag,
  Folder,
  Flame,
  Trash2,
  Check,
  Pin,
  Sparkles,
  BarChart2,
  TrendingUp,
  Inbox,
  PlayCircle,
  CheckCircle2,
  MinusCircle,
  Bookmark,
} from "lucide-react";
import {
  CalendarEvent,
  CustomList,
  Habit,
  HabitLog,
  HabitScheduleType,
  ListItem,
  ListItemStatus,
  Note,
} from "../types";

import { FilterSelect } from "./FilterSelect";
import { RichTextEditor } from "./RichTextEditor";

export type DetailSheetMode =
  | { type: "note"; data: Partial<Note>; isNew?: boolean }
  | { type: "event"; data: Partial<CalendarEvent>; isNew?: boolean }
  | { type: "habit"; data: Partial<Habit>; logs?: HabitLog[]; isNew?: boolean }
  | { type: "list_item"; data: Partial<ListItem>; isNew?: boolean }
  | null;

interface DetailSheetProps {
  sheetMode: DetailSheetMode;
  availableLists: CustomList[];
  onClose: () => void;
  onSaveNote?: (note: Partial<Note>) => void;
  onDeleteNote?: (id: string) => void;
  onSaveEvent?: (event: Partial<CalendarEvent>) => void;
  onDeleteEvent?: (id: string) => void;
  onSaveHabit?: (habit: Partial<Habit>) => void;
  onDeleteHabit?: (id: string) => void;
  onSaveListItem?: (item: Partial<ListItem>) => void;
  onDeleteListItem?: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { label: "M", name: "Mon", index: 1 },
  { label: "T", name: "Tue", index: 2 },
  { label: "W", name: "Wed", index: 3 },
  { label: "T", name: "Thu", index: 4 },
  { label: "F", name: "Fri", index: 5 },
  { label: "S", name: "Sat", index: 6 },
  { label: "S", name: "Sun", index: 0 },
];

const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#64748B", // Slate
];

const ITEM_META: Record<
  string,
  { subtitle: string; due: string; notes: string }
> = {
  books: {
    subtitle: "Author",
    due: "Finish by",
    notes: "Reading notes, quotes, key takeaways…",
  },
  courses: {
    subtitle: "Instructor / platform",
    due: "Complete by",
    notes: "Syllabus, lecture notes, key learnings…",
  },
  projects: {
    subtitle: "Role / client",
    due: "Deadline",
    notes: "Scope, milestones, links, decisions…",
  },
  custom: {
    subtitle: "Subtitle",
    due: "Due date",
    notes: "Notes, links, context… type “/” for commands",
  },
};

const ITEM_STATUSES = [
  {
    id: "inbox",
    label: "Inbox",
    icon: Inbox,
    on: "bg-slate-500/15 border-slate-400/60 text-slate-300",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: PlayCircle,
    on: "bg-amber-500/15 border-amber-400/60 text-amber-300",
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    on: "bg-emerald-500/15 border-emerald-400/60 text-emerald-300",
  },
  {
    id: "dropped",
    label: "Dropped",
    icon: MinusCircle,
    on: "bg-rose-500/15 border-rose-400/60 text-rose-300",
  },
  {
    id: "maybe-later",
    label: "Maybe Later",
    icon: Bookmark,
    on: "bg-violet-500/15 border-violet-400/60 text-violet-300",
  },
] as const;

export const DetailSheet: React.FC<DetailSheetProps> = ({
  sheetMode,
  availableLists,
  onClose,
  onSaveNote,
  onDeleteNote,
  onSaveEvent,
  onDeleteEvent,
  onSaveHabit,
  onDeleteHabit,
  onSaveListItem,
  onDeleteListItem,
}) => {
  // Local state for Note
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [noteListIds, setNoteListIds] = useState<string[]>([]);
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [listMenuOpen, setListMenuOpen] = useState(false);

  // Local state for Event
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventCategory, setEventCategory] = useState<"official" | "personal">(
    "personal",
  );
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [eventListIds, setEventListIds] = useState<string[]>([]);

  // Local state for Habit
  const [habitTitle, setHabitTitle] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitColor, setHabitColor] = useState("#6366F1");
  const [habitScheduleType, setHabitScheduleType] =
    useState<HabitScheduleType>("everyday");
  const [habitCustomDays, setHabitCustomDays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);

  // Local state for ListItem
  const [itemTitle, setItemTitle] = useState("");
  const [itemSubtitle, setItemSubtitle] = useState("");
  const [itemStatus, setItemStatus] = useState<ListItemStatus>("inbox");

  const [itemNotes, setItemNotes] = useState("");
  const [itemDueDate, setItemDueDate] = useState("");
  const [itemTags, setItemTags] = useState<string[]>([]);
  const [itemListId, setItemListId] = useState("");

  // Synchronize when sheetMode changes
  useEffect(() => {
    if (!sheetMode) return;

    if (sheetMode.type === "note") {
      setNoteTitle(sheetMode.data.title || "");
      setNoteContent(sheetMode.data.content || "");
      setNoteTags(sheetMode.data.tags || []);
      setNoteListIds(sheetMode.data.listIds || []);
      setNoteIsPinned(sheetMode.data.isPinned || false);
    } else if (sheetMode.type === "event") {
      setEventTitle(sheetMode.data.title || "");
      setEventDescription(sheetMode.data.description || "");
      setEventTags(sheetMode.data.tags || []);
      setEventListIds(sheetMode.data.listIds || []);
      setEventAllDay(sheetMode.data.allDay || false);
      setEventCategory(sheetMode.data.category || "personal");

      const defaultStart = sheetMode.data.startAt
        ? new Date(sheetMode.data.startAt)
        : new Date();
      setEventStartAt(formatDateTimeLocal(defaultStart));

      if (sheetMode.data.endAt) {
        setEventEndAt(formatDateTimeLocal(new Date(sheetMode.data.endAt)));
      } else {
        const endD = new Date(defaultStart);
        endD.setHours(endD.getHours() + 1);
        setEventEndAt(formatDateTimeLocal(endD));
      }
    } else if (sheetMode.type === "habit") {
      setHabitTitle(sheetMode.data.title || "");
      setHabitDescription(sheetMode.data.description || "");
      setHabitColor(sheetMode.data.color || "#6366F1");
      setHabitScheduleType(sheetMode.data.scheduleType || "everyday");
      setHabitCustomDays(sheetMode.data.customDays || [1, 2, 3, 4, 5]);
    } else if (sheetMode.type === "list_item") {
      setItemTitle(sheetMode.data.title || "");
      setItemSubtitle(sheetMode.data.subtitle || "");
      setItemStatus(sheetMode.data.status || "inbox");
      setItemNotes(sheetMode.data.notes || "");
      setItemDueDate(sheetMode.data.dueDate || "");
      setItemTags(sheetMode.data.tags || []);
      setItemListId(sheetMode.data.listId || availableLists[0]?.id || "");
    }
  }, [sheetMode, availableLists]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as HTMLElement).closest?.(".tiptap"))
        onClose();
    };
    if (sheetMode) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sheetMode, onClose]);

  if (!sheetMode) return null;

  function formatDateTimeLocal(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const handleAddTag = (type: "note" | "event" | "list_item") => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (type === "note" && !noteTags.includes(clean)) {
      setNoteTags([...noteTags, clean]);
    } else if (type === "event" && !eventTags.includes(clean)) {
      setEventTags([...eventTags, clean]);
    } else if (type === "list_item" && !itemTags.includes(clean)) {
      setItemTags([...itemTags, clean]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (
    type: "note" | "event" | "list_item",
    tagToRemove: string,
  ) => {
    if (type === "note") {
      setNoteTags(noteTags.filter((t) => t !== tagToRemove));
    } else if (type === "event") {
      setEventTags(eventTags.filter((t) => t !== tagToRemove));
    } else {
      setItemTags(itemTags.filter((t) => t !== tagToRemove));
    }
  };

  const toggleListId = (type: "note" | "event", listId: string) => {
    if (type === "note") {
      setNoteListIds((prev) =>
        prev.includes(listId)
          ? prev.filter((id) => id !== listId)
          : [...prev, listId],
      );
    } else {
      setEventListIds((prev) =>
        prev.includes(listId)
          ? prev.filter((id) => id !== listId)
          : [...prev, listId],
      );
    }
  };

  // ---------- Event schedule helpers ----------
  const splitDT = (v: string) => {
    const [d = "", t = ""] = v.split("T");
    return { d, t: t || "09:00" };
  };
  const joinDT = (d: string, t: string) => `${d}T${t || "00:00"}`;

  const handleStartChange = (d: string, t: string) => {
    if (!d) return;
    const next = joinDT(d, t);
    const dur =
      new Date(eventEndAt).getTime() - new Date(eventStartAt).getTime();
    setEventStartAt(next);
    // keep the same duration when start moves
    if (!isNaN(dur) && dur >= 0) {
      setEventEndAt(
        formatDateTimeLocal(new Date(new Date(next).getTime() + dur)),
      );
    }
  };
  const handleEndChange = (d: string, t: string) => {
    if (!d) return;
    setEventEndAt(joinDT(d, t));
  };
  const setDuration = (mins: number) =>
    setEventEndAt(
      formatDateTimeLocal(
        new Date(new Date(eventStartAt).getTime() + mins * 60000),
      ),
    );

  const durMins = Math.round(
    (new Date(eventEndAt).getTime() - new Date(eventStartAt).getTime()) / 60000,
  );
  const endInvalid = durMins < 0;
  const durLabel =
    durMins > 0
      ? `${Math.floor(durMins / 60) ? Math.floor(durMins / 60) + "h " : ""}${durMins % 60 ? (durMins % 60) + "m" : ""}`.trim()
      : "";

  const dtInput =
    "px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]";

  // ---------- Shared lists + tags row (plain function, not a component) ----------
  const renderMetaRow = (
    type: "note" | "event",
    tags: string[],
    listIds: string[],
  ) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {listIds.map((id) => {
        const l = availableLists.find((x) => x.id === id);
        if (!l) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
          >
            <Folder className="w-3 h-3" />
            {l.name}
            <button
              type="button"
              onClick={() => toggleListId(type, id)}
              className="hover:text-rose-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          #{t}
          <button
            type="button"
            onClick={() => handleRemoveTag(type, t)}
            className="hover:text-rose-400"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setListMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 transition-colors cursor-pointer"
        >
          <Folder className="w-3 h-3" /> List
        </button>
        {listMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setListMenuOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1.5 z-20 w-52 max-h-56 overflow-y-auto p-1 rounded-xl bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-2xl">
              {availableLists.map((list) => {
                const on = listIds.includes(list.id);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => toggleListId(type, list.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      on
                        ? "bg-indigo-500/15 text-indigo-300 font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{list.name}</span>
                    {on && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <input
        type="text"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag(type);
          }
        }}
        onBlur={() => handleAddTag(type)}
        placeholder="+ Tag"
        className="w-16 focus:w-32 transition-all bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none px-1 py-1"
      />
    </div>
  );

  const toggleCustomDay = (dayIndex: number) => {
    setHabitCustomDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex],
    );
  };

  // Habit Streak Calculations
  const habitLogs = (sheetMode.type === "habit" && sheetMode.logs) || [];
  const logDatesSet = new Set(habitLogs.map((l) => l.date));

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  let checkDate = new Date(today);

  // If today isn't logged yet, check if yesterday was logged to preserve streak
  const todayStr = today.toISOString().split("T")[0];
  if (!logDatesSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const dStr = checkDate.toISOString().split("T")[0];
    if (logDatesSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate 30-day mini matrix
  const past30Days: Array<{
    dateStr: string;
    dayNum: number;
    completed: boolean;
  }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    past30Days.push({
      dateStr: dStr,
      dayNum: d.getDate(),
      completed: logDatesSet.has(dStr),
    });
  }
  const completedPast30 = past30Days.filter((d) => d.completed).length;
  const completionRate30 = Math.round((completedPast30 / 30) * 100);

  // Submit Handlers
  const handleSave = () => {
    if (sheetMode.type === "note" && onSaveNote) {
      onSaveNote({
        id: sheetMode.data.id,
        title: noteTitle.trim() || "Untitled Note",
        content: noteContent,
        tags: noteTags,
        listIds: noteListIds,
        isPinned: noteIsPinned,
      });
    } else if (sheetMode.type === "event" && onSaveEvent) {
      onSaveEvent({
        id: sheetMode.data.id,
        title: eventTitle.trim() || "Untitled Event",
        description: eventDescription,
        startAt: new Date(eventStartAt).toISOString(),
        endAt: eventEndAt ? new Date(eventEndAt).toISOString() : undefined,
        allDay: eventAllDay,
        category: eventCategory,
        tags: eventTags,
        listIds: eventListIds,
      });
    } else if (sheetMode.type === "habit" && onSaveHabit) {
      onSaveHabit({
        id: sheetMode.data.id,
        title: habitTitle.trim() || "Untitled Habit",
        description: habitDescription,
        color: habitColor,
        scheduleType: habitScheduleType,
        customDays:
          habitScheduleType === "custom" ? habitCustomDays : undefined,
      });
    } else if (sheetMode.type === "list_item" && onSaveListItem) {
      onSaveListItem({
        id: sheetMode.data.id,
        listId:
          itemListId ||
          sheetMode.data.listId ||
          availableLists[0]?.id ||
          "projects",
        title: itemTitle.trim() || "Untitled Item",
        subtitle: itemSubtitle.trim() || undefined,
        status: itemStatus,
        notes: itemNotes.trim() || undefined,
        dueDate: itemDueDate || undefined,
        tags: itemTags,
      });
    }
    onClose();
  };

  const itemList = availableLists.find((l) => l.id === itemListId);
  const itemMeta = ITEM_META[itemList?.type ?? "custom"] ?? ITEM_META.custom;
  const activeItemStatus =
    itemStatus === "todo"
      ? "inbox"
      : itemStatus === "done"
        ? "completed"
        : itemStatus;

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dueInDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setItemDueDate(toYMD(d));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Canvas */}
      <div
        className={`relative w-full ${sheetMode.type === "habit" ? "max-w-lg" : "max-w-2xl"} bg-white dark:bg-[#111724] h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-slideInRight`}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {sheetMode.isNew ? "Create New" : "Edit"}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              {sheetMode.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {sheetMode.type === "note" && (
              <button
                type="button"
                onClick={() => setNoteIsPinned(!noteIsPinned)}
                title={noteIsPinned ? "Pinned to top" : "Pin note"}
                className={`p-1.5 rounded-lg border transition-colors ${
                  noteIsPinned
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700"
                }`}
              >
                <Pin className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* ================= MODE: NOTE ================= */}
          {sheetMode.type === "note" && (
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (
                      document.querySelector(".tiptap") as HTMLElement | null
                    )?.focus();
                  }
                }}
                placeholder="Untitled note"
                className="w-full bg-transparent text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
              />

              {/* Unified compact meta row: lists + tags */}
              {renderMetaRow("note", noteTags, noteListIds)}

              {/* Seamless content: grows as long as you write */}
              <RichTextEditor
                value={noteContent}
                onChange={setNoteContent}
                placeholder="Write, or type '/' for commands…"
                variant="seamless"
                minHeight="55vh"
              />
            </div>
          )}

          {/* ================= MODE: EVENT ================= */}
          {sheetMode.type === "event" && (
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (
                      document.querySelector(".tiptap") as HTMLElement | null
                    )?.focus();
                  }
                }}
                placeholder="Untitled event"
                className="w-full bg-transparent text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
              />

              {/* Classification: segmented control */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {(
                  [
                    {
                      id: "official",
                      label: "🏢 Official",
                      on: "bg-indigo-600 text-white shadow-xs",
                    },
                    {
                      id: "personal",
                      label: "👤 Personal",
                      on: "bg-rose-600 text-white shadow-xs",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEventCategory(opt.id)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                      eventCategory === opt.id
                        ? opt.on
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Schedule card */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                {/* All-day switch */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    All-day milestone
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={eventAllDay}
                    onClick={() => setEventAllDay((v) => !v)}
                    className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                      eventAllDay
                        ? "bg-indigo-600"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        eventAllDay ? "translate-x-4" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Start */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-10 text-[11px] font-mono uppercase text-slate-400">
                    Start
                  </span>
                  <input
                    type="date"
                    value={splitDT(eventStartAt).d}
                    onChange={(e) =>
                      handleStartChange(e.target.value, splitDT(eventStartAt).t)
                    }
                    className={`${dtInput} flex-1`}
                  />
                  {!eventAllDay && (
                    <input
                      type="time"
                      value={splitDT(eventStartAt).t}
                      onChange={(e) =>
                        handleStartChange(
                          splitDT(eventStartAt).d,
                          e.target.value,
                        )
                      }
                      className={`${dtInput} w-28`}
                    />
                  )}
                </div>

                {/* End + duration */}
                {!eventAllDay && (
                  <div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="w-10 text-[11px] font-mono uppercase text-slate-400">
                        End
                      </span>
                      <input
                        type="date"
                        value={splitDT(eventEndAt).d}
                        onChange={(e) =>
                          handleEndChange(e.target.value, splitDT(eventEndAt).t)
                        }
                        className={`${dtInput} flex-1 ${endInvalid ? "!border-rose-500" : ""}`}
                      />
                      <input
                        type="time"
                        value={splitDT(eventEndAt).t}
                        onChange={(e) =>
                          handleEndChange(splitDT(eventEndAt).d, e.target.value)
                        }
                        className={`${dtInput} w-28 ${endInvalid ? "!border-rose-500" : ""}`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 px-4 pb-3 pl-[4.25rem] text-[11px] font-mono">
                      {endInvalid ? (
                        <span className="text-rose-400">
                          End is before start
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {durLabel || "—"}
                        </span>
                      )}
                      <span className="flex-1" />
                      {[30, 60, 120].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDuration(m)}
                          className={`px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            durMins === m
                              ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                              : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                          }`}
                        >
                          {m < 60 ? `${m}m` : `${m / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lists + tags */}
              {renderMetaRow("event", eventTags, eventListIds)}

              {/* Description & Context: seamless */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Description & Context
                </div>
                <RichTextEditor
                  value={eventDescription}
                  onChange={setEventDescription}
                  placeholder="Agenda, location, links, prep notes… type '/' for commands"
                  variant="seamless"
                  minHeight="40vh"
                />
              </div>
            </div>
          )}

          {/* ================= MODE: HABIT (SPECIALIZED FORMAT) ================= */}
          {sheetMode.type === "habit" && (
            <div className="space-y-6">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    placeholder="e.g., Deep Work 90min Block"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-base font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Purpose & Motivation
                  </label>
                  <input
                    type="text"
                    value={habitDescription}
                    onChange={(e) => setHabitDescription(e.target.value)}
                    placeholder="e.g., Single-task focus without distractions or tabs"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Accent Color Picker */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setHabitColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        habitColor === c
                          ? "scale-120 ring-2 ring-white ring-offset-2 dark:ring-offset-slate-900"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {habitColor === c && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habit Streak Metrics Telemetry (if existing habit) */}
              {!sheetMode.isNew && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      Streak Analytics
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono font-medium text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                      {currentStreak} Day Streak
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-400">
                        Current Streak
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {currentStreak}d
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-400">
                        30d Adherence
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {completionRate30}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] text-slate-400">
                        Total Recorded
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {habitLogs.length}
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Punch Card Visualizer */}
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
                      <span>30-Day Matrix Punchstrip</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Past 30 Days
                      </span>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                      {past30Days.map((d) => (
                        <div
                          key={d.dateStr}
                          title={`${d.dateStr}: ${d.completed ? "Completed" : "Missed"}`}
                          className={`h-5 rounded-xs flex items-center justify-center text-[9px] font-mono transition-colors ${
                            d.completed
                              ? "text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                          }`}
                          style={{
                            backgroundColor: d.completed
                              ? habitColor
                              : undefined,
                          }}
                        >
                          {d.dayNum}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Type & Cadence Settings */}
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Frequency & Cadence
                </label>

                {/* Dropdown / Radio selection */}
                <select
                  value={habitScheduleType}
                  onChange={(e) =>
                    setHabitScheduleType(e.target.value as HabitScheduleType)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="everyday">Everyday (7 days / week)</option>
                  <option value="bi-weekly">Bi-weekly (2 days / week)</option>
                  <option value="weekly">Weekly (1 day / week)</option>
                  <option value="monthly">Monthly goal</option>
                  <option value="custom">Custom Day of the Week</option>
                </select>

                {/* Custom Days Multi-selector (Shown when custom is selected) */}
                {habitScheduleType === "custom" && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
                    <span className="block text-[11px] font-medium text-slate-500">
                      Choose which days this habit applies:
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = habitCustomDays.includes(day.index);
                        return (
                          <button
                            key={day.index}
                            type="button"
                            onClick={() => toggleCustomDay(day.index)}
                            className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {day.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= MODE: LIST_ITEM ================= */}
          {sheetMode.type === "list_item" && (
            <div className="space-y-4">
              {/* Title + type-aware subtitle */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Untitled item"
                  className="w-full bg-transparent text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={itemSubtitle}
                  onChange={(e) => setItemSubtitle(e.target.value)}
                  placeholder={itemMeta.subtitle}
                  className="w-full bg-transparent text-sm text-slate-500 dark:text-slate-400 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap gap-1.5">
                {ITEM_STATUSES.map((st) => {
                  const Icon = st.icon;
                  const on = activeItemStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setItemStatus(st.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        on
                          ? st.on
                          : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* Properties card */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                {/* Due date */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-slate-400">
                    {itemMeta.due}
                  </span>
                  <input
                    type="date"
                    value={itemDueDate}
                    onChange={(e) => setItemDueDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    {[
                      { l: "Tomorrow", d: 1 },
                      { l: "Next week", d: 7 },
                    ].map((q) => (
                      <button
                        key={q.l}
                        type="button"
                        onClick={() => dueInDays(q.d)}
                        className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 cursor-pointer"
                      >
                        {q.l}
                      </button>
                    ))}
                    {itemDueDate && (
                      <button
                        type="button"
                        onClick={() => setItemDueDate("")}
                        className="px-2 py-0.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-slate-400">
                    List
                  </span>
                  <FilterSelect
                    icon={<Folder className="w-3.5 h-3.5 text-indigo-400" />}
                    value={itemListId}
                    onChange={(v) => {
                      setItemListId(v);
                    }}
                    options={availableLists.map((l) => ({
                      value: l.id,
                      label: l.name,
                    }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {itemTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag("list_item", t)}
                      className="hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag("list_item");
                    }
                  }}
                  onBlur={() => handleAddTag("list_item")}
                  placeholder="+ Tag"
                  className="w-16 focus:w-32 transition-all bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none px-1 py-1"
                />
              </div>

              {/* Notes: seamless */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Notes & Key Learnings
                </div>
                <RichTextEditor
                  value={itemNotes}
                  onChange={setItemNotes}
                  placeholder={itemMeta.notes}
                  variant="seamless"
                  minHeight="35vh"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E131E]">
          {!sheetMode.isNew && sheetMode.data.id ? (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this item?")
                ) {
                  if (sheetMode.type === "note" && onDeleteNote)
                    onDeleteNote(sheetMode.data.id!);
                  if (sheetMode.type === "event" && onDeleteEvent)
                    onDeleteEvent(sheetMode.data.id!);
                  if (sheetMode.type === "habit" && onDeleteHabit)
                    onDeleteHabit(sheetMode.data.id!);
                  if (sheetMode.type === "list_item" && onDeleteListItem)
                    onDeleteListItem(sheetMode.data.id!);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                Save{" "}
                {sheetMode.type === "habit"
                  ? "Habit"
                  : sheetMode.type === "event"
                    ? "Event"
                    : sheetMode.type === "list_item"
                      ? "Item"
                      : "Note"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
