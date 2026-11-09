/**
 * ChronoCraft - Polymorphic DetailSheet Shell
 */

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Pin, Trash2, Trophy, ArrowLeft } from "lucide-react";
import {
  CalendarEvent,
  CustomList,
  Habit,
  ListItem,
  Note,
  TimelineEntry,
} from "../../types";
import { NoteForm, NoteFormHandle } from "./NoteForm";
import { EventForm, EventFormHandle } from "./EventForm";
import { HabitForm, HabitFormHandle } from "./HabitForm";
import { ListItemForm, ListItemFormHandle } from "./ListItemForm";
import { DetailSheetMode } from "./types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { LogForm, LogFormHandle } from "./LogForm";

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
  onSaveLog?: (entry: Partial<TimelineEntry>) => void;
  onDeleteLog?: (id: string) => void; // optional; logs use onDeleteEntry via context menu
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
  onSaveLog,
  onDeleteLog,
}) => {
  const noteRef = useRef<NoteFormHandle>(null);
  const eventRef = useRef<EventFormHandle>(null);
  const habitRef = useRef<HabitFormHandle>(null);
  const itemRef = useRef<ListItemFormHandle>(null);
  const logRef = useRef<LogFormHandle>(null);

  const [isNotePinned, setIsNotePinned] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedSnapshotRef = useRef<string>("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHabitTitleValid, setIsHabitTitleValid] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !(e.target as HTMLElement).closest?.(".tiptap")
      ) {
        if (sheetMode && !sheetMode.isNew) {
          if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
          }
          const ref =
            sheetMode.type === "note"
              ? noteRef
              : sheetMode.type === "event"
              ? eventRef
              : sheetMode.type === "habit"
              ? habitRef
              : sheetMode.type === "log"
              ? logRef
              : itemRef;
          const draft = ref.current?.collect();
          if (draft) {
            if (sheetMode.type === "note") onSaveNote?.(draft as Partial<Note>);
            if (sheetMode.type === "event")
              onSaveEvent?.(draft as Partial<CalendarEvent>);
            if (sheetMode.type === "habit")
              onSaveHabit?.(draft as Partial<Habit>);
            if (sheetMode.type === "log")
              onSaveLog?.(draft as Partial<TimelineEntry>);
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

  const handleClose = () => {
    if (sheetMode && !sheetMode.isNew) flushAutosave();
    onClose();
  };
  const performDelete = () => {
    if (!sheetMode) return;
    const id = sheetMode.data.id;
    if (!id) return;
    if ((sheetMode.type === "note" || sheetMode.type === "log") && onDeleteNote)
      onDeleteNote(id);
    if (sheetMode.type === "event" && onDeleteEvent) onDeleteEvent(id);
    if (sheetMode.type === "habit" && onDeleteHabit) onDeleteHabit(id);
    if (sheetMode.type === "log" && onDeleteLog) onDeleteLog(id);
    if (sheetMode.type === "list_item" && onDeleteListItem)
      onDeleteListItem(id);
    onClose();
  };

  const snapshotOf = (val: unknown): string => {
    try {
      return JSON.stringify(val ?? null);
    } catch {
      return "";
    }
  };

  const collectCurrentDraft = ():
    | { kind: "note"; payload: Partial<Note> }
    | { kind: "event"; payload: Partial<CalendarEvent> }
    | { kind: "habit"; payload: Partial<Habit> }
    | { kind: "list_item"; payload: Partial<ListItem> }
    | { kind: "log"; payload: Partial<TimelineEntry> }
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
      case "log":
        return logRef.current
          ? { kind: "log", payload: logRef.current.collect() }
          : null;
      default:
        return null;
    }
  };

  const commitOnce = () => {
    if (!sheetMode || sheetMode.isNew) return;
    const collected = collectCurrentDraft();
    if (!collected) return;

    const snap = snapshotOf(collected.payload);
    console.log("[commitOnce]", collected.kind, {
      snap,
      prevSnap: savedSnapshotRef.current,
      willSave: snap !== savedSnapshotRef.current,
    }); // ← add
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
      case "log":
        onSaveLog?.(collected.payload);
        break;
    }
  };

  const scheduleAutosave = () => {
    console.log("[scheduleAutosave]", {
      sheetMode: sheetMode?.type,
      isNew: sheetMode?.isNew,
    }); // ← add

    if (!sheetMode || sheetMode.isNew) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      commitOnce();
    }, 500);
  };

  const flushAutosave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // Always force a save on close, bypassing the snapshot dedupe.
    // If the form has any pending state, this is the last chance to persist it.
    if (sheetMode && !sheetMode.isNew) {
      const collected = collectCurrentDraft();
      if (collected) {
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
          case "log":
            onSaveLog?.(collected.payload);
            break;
        }
      }
    }
  };

  const handleCreateHabitSubmit = () => {
    if (!sheetMode || sheetMode.type !== "habit" || !sheetMode.isNew) return;
    const draft = habitRef.current?.collect();
    if (!draft || !draft.title?.trim()) return;
    onSaveHabit?.(draft);
    onClose();
  };

  const header = (
    <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-soft shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Back"
          className="md:hidden p-1.5 -ml-1 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-mono text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted">
            {sheetMode.isNew ? "Create New" : "Edit"}
          </span>
          <span className="text-muted">·</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent break-words">
            {sheetMode.type}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sheetMode.type === "habit" && sheetMode.isNew && (
          <button
            type="button"
            onClick={handleCreateHabitSubmit}
            disabled={!isHabitTitleValid}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-accent-fg text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        )}
        {!sheetMode.isNew && sheetMode.data.id && (
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            title="Delete"
            aria-label="Delete"
            className="p-1.5 rounded-lg border border-transparent text-muted hover:text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors"
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
                ? "bg-warning/10 text-warning border-warning/30"
                : "text-muted hover:text-primary border-transparent hover:border-strong"
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
        )}
        {sheetMode.type === "event" && sheetMode.data.completedAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/30 text-[10px] font-mono uppercase tracking-wider">
            <Check className="w-3 h-3" /> Attended
          </span>
        )}
        {sheetMode.type === "event" && sheetMode.data.missedAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-danger/10 text-danger border border-danger/30 text-[10px] font-mono uppercase tracking-wider">
            Missed
          </span>
        )}
        {sheetMode.type === "event" && sheetMode.data.isAchievement && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/30 text-[10px] font-mono uppercase tracking-wider">
            <Trophy className="w-3 h-3" /> Achievement
          </span>
        )}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors"
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
          onDirty={() => {
            if (sheetMode.isNew) {
              setIsHabitTitleValid(habitRef.current?.isTitleValid() ?? false);
            } else {
              scheduleAutosave();
            }
          }}
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
      {sheetMode.type === "log" && (
        <LogForm
          ref={logRef}
          data={sheetMode.data}
          onDirty={scheduleAutosave}
        />
      )}
    </div>
  );

  return (
    <>
      <div className="md:hidden fixed inset-0 z-50 bg-raised flex flex-col animate-slideInRight">
        {header}
        {body}
      </div>

      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-overlay/60 backdrop-blur-xs transition-opacity duration-300"
        />

        <div
          className={`relative w-full ${
            sheetMode.type === "habit" ? "max-w-lg" : "max-w-3xl"
          } bg-raised rounded-2xl shadow-2xl flex flex-col z-10 border border-soft animate-scaleUp overflow-hidden max-h-[85vh]`}
        >
          {header}
          {body}
        </div>
      </div>

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
