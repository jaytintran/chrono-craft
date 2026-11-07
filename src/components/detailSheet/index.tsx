/**
 * ChronoCraft - Polymorphic DetailSheet Shell
 * Renders the slide-over chrome and dispatches to the correct form.
 * Field state lives inside each form component and is collected via refs.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Pin, Trash2, Trophy, ArrowLeft } from "lucide-react";
import { CalendarEvent, CustomList, Habit, ListItem, Note } from "../../types";
import { NoteForm, NoteFormHandle } from "./NoteForm";
import { EventForm, EventFormHandle } from "./EventForm";
import { HabitForm, HabitFormHandle } from "./HabitForm";
import { ListItemForm, ListItemFormHandle } from "./ListItemForm";
import { DetailSheetMode } from "./types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export type { DetailSheetMode } from "./types";

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
  // Global Detail Sheet States & Refs
  const noteRef = useRef<NoteFormHandle>(null);
  const eventRef = useRef<EventFormHandle>(null);
  const habitRef = useRef<HabitFormHandle>(null);
  const itemRef = useRef<ListItemFormHandle>(null);

  const [isNotePinned, setIsNotePinned] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef<string>("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Reset snapshot when a different item opens (or when sheet closes)
  useEffect(() => {
    savedSnapshotRef.current = "";
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, [
    sheetMode?.type,
    (sheetMode as any)?.data?.id,
    (sheetMode as any)?.isNew,
  ]);

  // ESC to close (with autosave flush in edit mode)
  // ESC to close (with autosave flush in edit mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(e.target as HTMLElement).closest?.(".tiptap")
      ) {
        if (sheetMode && !sheetMode.isNew) {
          // Inline flush: cancel pending timer, then persist current draft.
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
          }
          // Fire the appropriate saver if the form is mounted
          const ref =
            sheetMode.type === "note"
              ? noteRef
              : sheetMode.type === "event"
                ? eventRef
                : sheetMode.type === "habit"
                  ? habitRef
                  : itemRef;
          const draft = ref.current?.collect();
          if (draft) {
            if (sheetMode.type === "note") onSaveNote?.(draft as Partial<Note>);
            if (sheetMode.type === "event")
              onSaveEvent?.(draft as Partial<CalendarEvent>);
            if (sheetMode.type === "habit")
              onSaveHabit?.(draft as Partial<Habit>);
            if (sheetMode.type === "list_item")
              onSaveListItem?.(draft as Partial<ListItem>);
          }
        }
        onClose();
      }
    };
    if (sheetMode) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetMode, onClose]);

  if (!sheetMode) return null;

  // Unified close: flush edits in edit mode, discard in create mode
  const handleClose = () => {
    if (sheetMode && !sheetMode.isNew) flushAutosave();
    onClose();
  };
  // Rename old handleDelete -> performDelete; keep its body, drop the window.confirm
  const performDelete = () => {
    if (!sheetMode) return;
    const id = sheetMode.data.id;
    if (!id) return;
    if (sheetMode.type === "note" && onDeleteNote) onDeleteNote(id);
    if (sheetMode.type === "event" && onDeleteEvent) onDeleteEvent(id);
    if (sheetMode.type === "habit" && onDeleteHabit) onDeleteHabit(id);
    if (sheetMode.type === "list_item" && onDeleteListItem)
      onDeleteListItem(id);
    onClose();
  };

  const saveLabel =
    sheetMode.type === "habit"
      ? "Save Habit"
      : sheetMode.type === "event"
        ? "Save Event"
        : sheetMode.type === "list_item"
          ? "Save Item"
          : "Save Note";

  // Snapshot for "did anything actually change?" comparison
  const snapshotOf = (val: unknown): string => {
    try {
      return JSON.stringify(val ?? null);
    } catch {
      return "";
    }
  };

  // Build the current draft from the active form's ref
  const collectCurrentDraft = ():
    | { kind: "note"; payload: Partial<Note> }
    | { kind: "event"; payload: Partial<CalendarEvent> }
    | { kind: "habit"; payload: Partial<Habit> }
    | { kind: "list_item"; payload: Partial<ListItem> }
    | null => {
    if (!sheetMode) return null;
    switch (sheetMode.type) {
      case "note":
        return noteRef.current
          ? { kind: "note", payload: noteRef.current.collect() }
          : null;
      case "event":
        return eventRef.current
          ? { kind: "event", payload: eventRef.current.collect() }
          : null;
      case "habit":
        return habitRef.current
          ? { kind: "habit", payload: habitRef.current.collect() }
          : null;
      case "list_item":
        return itemRef.current
          ? { kind: "list_item", payload: itemRef.current.collect() }
          : null;
      default:
        return null;
    }
  };

  // Fire the appropriate onSave* once if the draft differs from the last saved snapshot.
  const commitOnce = () => {
    if (!sheetMode || sheetMode.isNew) return;
    const collected = collectCurrentDraft();
    if (!collected) return;

    const snap = snapshotOf(collected.payload);
    if (snap === savedSnapshotRef.current) return;
    savedSnapshotRef.current = snap;

    switch (collected.kind) {
      case "note":
        onSaveNote?.(collected.payload);
        break;
      case "event":
        onSaveEvent?.(collected.payload);
        break;
      case "habit":
        onSaveHabit?.(collected.payload);
        break;
      case "list_item":
        onSaveListItem?.(collected.payload);
        break;
    }
  };

  // Debounced autosave — called by each form on every field change
  const scheduleAutosave = () => {
    if (!sheetMode || sheetMode.isNew) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      commitOnce();
    }, 500);
  };

  // Synchronous flush used when the user closes mid-edit
  const flushAutosave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    commitOnce();
  };

  const header = (
    <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Back"
          className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-mono text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {sheetMode.isNew ? "Create New" : "Edit"}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 break-words">
            {sheetMode.type}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!sheetMode.isNew && sheetMode.data.id && (
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            title="Delete"
            aria-label="Delete"
            className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {sheetMode.type === "note" && (
          <button
            type="button"
            onClick={() => noteRef.current?.togglePinned()}
            title={isNotePinned ? "Pinned to top" : "Pin note"}
            className={`p-1.5 rounded-lg border transition-colors ${
              isNotePinned
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700"
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
        )}
        {sheetMode.type === "event" && sheetMode.data.completedAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider">
            <Check className="w-3 h-3" /> Attended
          </span>
        )}
        {sheetMode.type === "event" && sheetMode.data.missedAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30 text-[10px] font-mono uppercase tracking-wider">
            Missed
          </span>
        )}
        {sheetMode.type === "event" && sheetMode.data.isAchievement && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider">
            <Trophy className="w-3 h-3" /> Achievement
          </span>
        )}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const body = (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-6">
      {sheetMode.type === "note" && (
        <NoteForm
          ref={noteRef}
          data={sheetMode.data}
          availableLists={availableLists}
          onPinChange={setIsNotePinned}
          onDirty={scheduleAutosave}
        />
      )}
      {sheetMode.type === "event" && (
        <EventForm
          ref={eventRef}
          data={sheetMode.data}
          availableLists={availableLists}
          onDirty={scheduleAutosave}
        />
      )}
      {sheetMode.type === "habit" && (
        <HabitForm
          ref={habitRef}
          data={sheetMode.data}
          logs={sheetMode.logs}
          isNew={sheetMode.isNew}
          onDirty={scheduleAutosave}
        />
      )}
      {sheetMode.type === "list_item" && (
        <ListItemForm
          ref={itemRef}
          data={sheetMode.data}
          availableLists={availableLists}
          onDirty={scheduleAutosave}
        />
      )}
    </div>
  );

  return (
    <>
      {/* ================= MOBILE: FULL-SCREEN PANEL ================= */}
      <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-[#111724] flex flex-col animate-slideInRight">
        {header}
        {body}
      </div>

      {/* ================= DESKTOP: CENTERED MODAL ================= */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`relative w-full ${sheetMode.type === "habit" ? "max-w-lg" : "max-w-3xl"} bg-white dark:bg-[#111724] rounded-2xl shadow-2xl flex flex-col z-10 border border-slate-200 dark:border-slate-800 animate-scaleUp overflow-hidden max-h-[85vh]`}
        >
          {header}
          {body}
        </div>
      </div>

      {/* Delete Confirmation Box */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={`Delete this ${sheetMode.type.replace("_", " ")}?`}
        message="This permanently removes the item. This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          setIsDeleteOpen(false);
          performDelete();
        }}
      />
    </>
  );
};
