/**
 * ChronoCraft - Core Application Root Component
 * Coordinates offline IndexedDB reactive state across Focus, Timeline, Notes, Events, Habits, and Lists.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  ActiveView,
  AppSettings,
  CalendarEvent,
  CustomFocusTab,
  CustomList,
  Habit,
  HabitLog,
  ListItem,
  ListItemStatus,
  Note,
  ScratchpadCard,
  TimelineEntry,
} from "./types";
import { appDb } from "./services/db";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { DetailSheet, DetailSheetMode } from "@/components/detailSheet";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CreateListModal } from "./components/modals/CreateListModal";
import { ContextMenu, ContextMenuTarget } from "./components/menu/ContextMenu";

import { FocusView } from "./views/FocusView";
import { TimelineView } from "./views/TimelineView";
import { NotesView } from "./views/NotesView";
import { EventsView } from "./views/EventsView";
import { HabitsView } from "./views/HabitsView";
import { ListsView } from "./views/ListsView";
import { toLocalDateKey } from "./utils/date";
import { applyNativeTheme } from "./utils/nativeTheme";

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>("focus");
  const [selectedListId, setSelectedListId] = useState<string | undefined>(
    "list_projects",
  );

  // Database State Stores
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [customTabs, setCustomTabs] = useState<CustomFocusTab[]>([]);
  const [scratchpadCards, setScratchpadCards] = useState<ScratchpadCard[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    xActiveLimit: 5,
    theme: "dark",
    nlpAutoExtract: true,
  });

  // Modals & Sheets State
  const [sheetMode, setSheetMode] = useState<DetailSheetMode>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Universal Context Menu State
  const [contextTarget, setContextTarget] = useState<ContextMenuTarget | null>(
    null,
  );
  const [contextPosition, setContextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Load all data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const [
        loadedEntries,
        loadedNotes,
        loadedEvents,
        loadedHabits,
        loadedHabitLogs,
        loadedLists,
        loadedListItems,
        loadedCustomTabs,
        loadedScratchpad,
        loadedSettings,
      ] = await Promise.all([
        appDb.getAll<TimelineEntry>("entries"),
        appDb.getAll<Note>("notes"),
        appDb.getAll<CalendarEvent>("events"),
        appDb.getAll<Habit>("habits"),
        appDb.getAll<HabitLog>("habit_logs"),
        appDb.getAll<CustomList>("lists"),
        appDb.getAll<ListItem>("list_items"),
        appDb.getAll<CustomFocusTab>("custom_tabs"),
        appDb.getAll<ScratchpadCard>("scratchpad"),
        appDb.getSettings(),
      ]);

      setEntries(loadedEntries);
      setNotes(loadedNotes);
      setEvents(loadedEvents);
      setHabits(loadedHabits);
      setHabitLogs(loadedHabitLogs);
      setLists(loadedLists);
      setListItems(loadedListItems);
      setCustomTabs(loadedCustomTabs);
      setScratchpadCards(loadedScratchpad);
      setSettings(loadedSettings);
      setIsLoaded(true);

      if (!selectedListId && loadedLists.length > 0) {
        setSelectedListId(loadedLists[0].id);
      }
    } catch (err) {
      console.error("Failed to load data from IndexedDB", err);
    }
  }, [selectedListId]);

  // Subscribe to DB mutations
  useEffect(() => {
    refreshData();
    const unsubscribe = appDb.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  // Sync Theme with HTML element
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    applyNativeTheme(settings.theme);
  }, [settings.theme]);

  // Resolve "tl_<id>" or "<id>" to the Timeline entry that owns a note/event
  const findLinkedEntry = (id: string | undefined, type: "note" | "event") => {
    if (!id) return undefined;
    const entryId = id.startsWith("tl_") ? id.slice(3) : id;
    return entries.find((e) => e.id === entryId && e.type === type);
  };

  const buildNoteSheetData = (entry: TimelineEntry): Partial<Note> => ({
    id: entry.id,
    title: entry.title,
    content: entry.metadata?.notes || "",
    tags: entry.tags,
    listIds: entry.metadata?.listId ? [entry.metadata.listId] : [],
    isPinned: entry.metadata?.isPinned ?? false,
  });

  const buildEventSheetData = (
    entry: TimelineEntry,
  ): Partial<CalendarEvent> => ({
    id: entry.id,
    title: entry.title,
    description: entry.metadata?.notes || "",
    startAt: entry.scheduledAt || entry.createdAt,
    endAt: entry.metadata?.endAt,
    allDay: entry.metadata?.allDay ?? false,
    category: entry.metadata?.category,
    tags: entry.tags,
    listIds: entry.metadata?.listId ? [entry.metadata.listId] : [],
  });

  // ================= ACTION HANDLERS =================

  // Entries (Timeline / Focus)
  const handleAddEntry = async (entry: Partial<TimelineEntry>) => {
    const id =
      "entry_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const newEntry: TimelineEntry = {
      id,
      type: entry.type || "task",
      title: entry.title || "Untitled Entry",
      scheduledAt: entry.scheduledAt,
      createdAt: entry.createdAt || now,
      completedAt: entry.completedAt,
      status: entry.status || "pending",
      source: entry.source || "timeline",
      tags: entry.tags || [],
      tabId: entry.tabId,
      timeBlock: entry.timeBlock,
      metadata: entry.metadata,
    };
    await appDb.put("entries", newEntry);
  };

  const handleToggleEntryStatus = async (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const isNowCompleted = entry.status !== "completed";
    const updated: TimelineEntry = {
      ...entry,
      status: isNowCompleted ? "completed" : "pending",
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    };
    await appDb.put("entries", updated);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await appDb.delete("entries", entryId);
  };

  const handleUpdateEntryTime = async (entryId: string, newIso: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    await appDb.put("entries", { ...entry, scheduledAt: newIso });
  };

  const handleUpdateEntryTitle = async (entryId: string, newTitle: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    await appDb.put("entries", { ...entry, title: newTitle });
  };

  // Scratchpad
  const handleAddScratchpad = async (card: Partial<ScratchpadCard>) => {
    const id =
      "scratch_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    await appDb.put<ScratchpadCard>("scratchpad", {
      id,
      title: card.title || "Untitled Note",
      content: card.content || "",
      color: card.color || "#1E293B",
      isPinned: card.isPinned || false,
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleUpdateScratchpad = async (card: ScratchpadCard) => {
    await appDb.put("scratchpad", {
      ...card,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteScratchpad = async (cardId: string) => {
    await appDb.delete("scratchpad", cardId);
  };

  const handleSendScratchpadToTimeline = async (card: ScratchpadCard) => {
    const now = new Date().toISOString();
    await handleAddEntry({
      type: "note",
      title: card.title,
      createdAt: now,
      status: "pending",
      source: "timeline",
      tags: ["scratchpad"],
      metadata: { notes: card.content },
    });
    alert(`"${card.title}" added to Timeline!`);
  };

  // Custom Focus Tabs
  const handleCreateCustomTab = async (tab: Partial<CustomFocusTab>) => {
    const id = "tab_" + Date.now();
    await appDb.put<CustomFocusTab>("custom_tabs", {
      id,
      name: tab.name || "New Tab",
      bgColor: tab.bgColor || "#4F46E5",
      createdAt: new Date().toISOString(),
    });
  };

  const handleUpdateCustomTab = async (tab: CustomFocusTab) => {
    await appDb.put("custom_tabs", tab);
  };

  const handleDeleteCustomTab = async (tabId: string) => {
    await appDb.delete("custom_tabs", tabId);
    // Clean entries in tab
    const tabEntries = entries.filter((e) => e.tabId === tabId);
    for (const e of tabEntries) {
      await appDb.delete("entries", e.id);
    }
  };

  const handleCreateNote = async (prefill?: Partial<Note>) => {
    const now = new Date().toISOString();
    const draft: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      tags: [],
      listIds: [],
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      ...prefill,
    };
    await appDb.put("notes", draft);
    setSheetMode({ type: "note", data: draft, isNew: false });
  };

  const handleCreateLinkedNote = async (listId: string) => {
    await handleCreateNote({ listIds: [listId] });
  };

  const handleCreateEvent = async (prefillDate?: Date, listId?: string) => {
    const now = new Date().toISOString();
    const start = prefillDate ? new Date(prefillDate) : new Date();
    if (prefillDate) {
      const t = new Date();
      start.setHours(t.getHours(), t.getMinutes(), 0, 0);
    } else {
      start.setHours(9, 0, 0, 0);
    }
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const draft: CalendarEvent = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: false,
      category: "personal",
      tags: [],
      listIds: listId ? [listId] : [],
      createdAt: now,
    };
    await appDb.put("events", draft);
    setSheetMode({ type: "event", data: draft, isNew: false });
  };

  const handleCreateLinkedEvent = async (listId: string) => {
    await handleCreateEvent(undefined, listId);
  };

  // Notes
  const handleSaveNote = async (noteData: Partial<Note>) => {
    const now = new Date().toISOString();

    // 1. Timeline-born note → write back to the entries store
    const linked = findLinkedEntry(noteData.id, "note");
    if (linked) {
      await appDb.put("entries", {
        ...linked,
        title: noteData.title ?? linked.title,
        tags: noteData.tags ?? linked.tags,
        metadata: {
          ...linked.metadata,
          notes: noteData.content ?? linked.metadata?.notes,
          listId: noteData.listIds
            ? noteData.listIds[0]
            : linked.metadata?.listId,
          isPinned: noteData.isPinned ?? linked.metadata?.isPinned,
        },
      });
      return;
    }

    // 2. Plain note → update-in-place only (never create here)
    if (!noteData.id || noteData.id.startsWith("tl_")) return;

    const existing = notes.find((n) => n.id === noteData.id);
    if (!existing) return; // draft was deleted; drop stale write

    await appDb.put("notes", {
      ...existing,
      ...noteData,
      title: noteData.title ?? existing.title,
      updatedAt: now,
    });
  };

  const handleDeleteNote = async (id: string) => {
    const linked = findLinkedEntry(id, "note");
    if (linked) await appDb.delete("entries", linked.id);
    else await appDb.delete("notes", id);
  };

  // Events
  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const now = new Date().toISOString();

    // 1. Timeline-born event → write back to entries store
    const linked = findLinkedEntry(eventData.id, "event");
    if (linked) {
      await appDb.put("entries", {
        ...linked,
        title: eventData.title ?? linked.title,
        scheduledAt: eventData.startAt ?? linked.scheduledAt,
        tags: eventData.tags ?? linked.tags,
        metadata: {
          ...linked.metadata,
          notes: eventData.description ?? linked.metadata?.notes,
          listId: eventData.listIds
            ? eventData.listIds[0]
            : linked.metadata?.listId,
          endAt: eventData.endAt,
          allDay: eventData.allDay,
          category: eventData.category,
        },
      });
      return;
    }

    // 2. Plain event → update-in-place only
    if (!eventData.id || eventData.id.startsWith("tl_")) return;

    const existing = events.find((e) => e.id === eventData.id);
    if (!existing) return;

    await appDb.put("events", { ...existing, ...eventData });

    // `now` unused in this branch — kept for symmetry with note save; safe to remove
    void now;
  };

  const handleDeleteEvent = async (id: string) => {
    const linked = findLinkedEntry(id, "event");
    if (linked) await appDb.delete("entries", linked.id);
    else await appDb.delete("events", id);
  };

  const handleResolveEvent = async (
    id: string,
    outcome: "attended" | "missed" | "clear",
  ) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    await appDb.put("events", {
      ...ev,
      completedAt:
        outcome === "attended" ? new Date().toISOString() : undefined,
      missedAt: outcome === "missed" ? new Date().toISOString() : undefined,
    });
  };

  // Habits
  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    const now = new Date().toISOString();
    if (habitData.id) {
      const existing = habits.find((h) => h.id === habitData.id);
      if (existing) {
        await appDb.put("habits", {
          ...existing,
          ...habitData,
        });
        return;
      }
    }
    const id =
      "habit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    await appDb.put<Habit>("habits", {
      id,
      title: habitData.title || "Untitled Routine",
      description: habitData.description || "",
      scheduleType: habitData.scheduleType || "everyday",
      customDays: habitData.customDays,
      color: habitData.color || "#6366F1",
      createdAt: now,
    });
  };

  const handleDeleteHabit = async (id: string) => {
    await appDb.delete("habits", id);
  };

  const handleToggleHabitDay = async (habitId: string, dateStr: string) => {
    return await appDb.toggleHabitDay(habitId, dateStr);
  };

  // Universal Context Menu Actions
  const handleOpenContextMenu = (
    item: any,
    type: "timeline" | "note" | "event" | "focus" | "list",
    pos: { x: number; y: number },
  ) => {
    setContextTarget({ item, type });
    setContextPosition(pos);
    setIsContextMenuOpen(true);
  };

  const handleContextMenuEdit = (item: any) => {
    if (item.listId !== undefined) {
      setSheetMode({ type: "list_item", data: item, isNew: false });
    } else if (
      contextTarget?.type === "note" ||
      (item.content !== undefined && !item.type)
    ) {
      setSheetMode({ type: "note", data: item, isNew: false });
    } else if (contextTarget?.type === "event" || item.startAt !== undefined) {
      setSheetMode({ type: "event", data: item, isNew: false });
    } else {
      // Timeline entry or task
      if (item.type === "note") {
        setSheetMode({
          type: "note",
          data: buildNoteSheetData(item),
          isNew: false,
        });
      } else if (item.type === "event") {
        setSheetMode({
          type: "event",
          data: buildEventSheetData(item),
          isNew: false,
        });
      } else {
        // Open note editor for quick task detail
        setSheetMode({
          type: "note",
          data: {
            id: item.id,
            title: item.title,
            content: item.metadata?.notes || "",
            tags: item.tags,
          },
          isNew: false,
        });
      }
    }
  };

  const handleContextMenuDuplicate = async (item: any) => {
    const newId = (item.id || "item") + "_dup_" + Date.now().toString(36);
    const now = new Date().toISOString();

    if (item.listId !== undefined) {
      // List Item
      await appDb.put("list_items", {
        ...item,
        id: newId,
        title: `${item.title} (Copy)`,
        createdAt: now,
      });
    } else if (item.startAt !== undefined) {
      // Event
      await appDb.put("events", {
        ...item,
        id: newId,
        title: `${item.title} (Copy)`,
        createdAt: now,
      });
    } else if (item.content !== undefined && !item.type) {
      // Note
      await appDb.put("notes", {
        ...item,
        id: newId,
        title: `${item.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Timeline entry / Task
      await appDb.put("entries", {
        ...item,
        id: newId,
        title: `${item.title} (Copy)`,
        createdAt: now,
        completedAt: undefined,
        status: item.status === "completed" ? "pending" : item.status,
      });
    }
  };

  const handleContextMenuReschedule = async (item: any, date: Date) => {
    const isoDate = date.toISOString();

    // 1. CalendarEvent (events store)
    if (item.startAt !== undefined) {
      await appDb.put("events", { ...item, startAt: isoDate });
      return;
    }

    // 2. TimelineEntry (entries store) — must actually be an entry.
    //    Gate on `type` + `source` presence so notes / list items never
    //    leak into the entries store by accident.
    if (
      item.type !== undefined &&
      item.source !== undefined &&
      item.id !== undefined
    ) {
      // Time blocks: shift the whole block window, not just scheduledAt
      if (item.type === "timeblock" && item.timeBlock) {
        const oldStart = new Date(item.timeBlock.startIso).getTime();
        const oldEnd = new Date(item.timeBlock.endIso).getTime();
        const duration = Math.max(0, oldEnd - oldStart);
        const newStart = new Date(isoDate);
        const newEnd = new Date(newStart.getTime() + duration);

        await appDb.put("entries", {
          ...item,
          scheduledAt: isoDate,
          timeBlock: {
            ...item.timeBlock,
            startIso: newStart.toISOString(),
            endIso: newEnd.toISOString(),
          },
        });
        return;
      }

      await appDb.put("entries", { ...item, scheduledAt: isoDate });
      return;
    }

    // 3. Anything else: refuse loudly in dev, silently in prod.
    //    If you see this warning, a caller bypassed the ContextMenu gate.
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[handleContextMenuReschedule] Called on an unsupported item shape:",
        item,
      );
    }
  };

  const handleContextMenuAddTag = async (item: any, newTag: string) => {
    const existingTags = item.tags || [];
    if (!existingTags.includes(newTag)) {
      const updatedTags = [...existingTags, newTag];
      if (item.listId !== undefined) {
        await appDb.put("list_items", { ...item, tags: updatedTags });
      } else if (item.startAt !== undefined) {
        await appDb.put("events", { ...item, tags: updatedTags });
      } else if (item.content !== undefined && !item.type) {
        await appDb.put("notes", { ...item, tags: updatedTags });
      } else {
        await appDb.put("entries", { ...item, tags: updatedTags });
      }
    }
  };

  const handleContextMenuRemoveTag = async (item: any, tag: string) => {
    const updatedTags = (item.tags || []).filter((t: string) => t !== tag);
    if (item.listId !== undefined) {
      await appDb.put("list_items", { ...item, tags: updatedTags });
    } else if (item.startAt !== undefined) {
      await appDb.put("events", { ...item, tags: updatedTags });
    } else if (item.content !== undefined && !item.type) {
      await appDb.put("notes", { ...item, tags: updatedTags });
    } else {
      await appDb.put("entries", { ...item, tags: updatedTags });
    }
  };

  const handleContextMenuSetTags = async (item: any, nextTags: string[]) => {
    if (item.listId !== undefined) {
      await appDb.put("list_items", { ...item, tags: nextTags });
    } else if (item.startAt !== undefined) {
      await appDb.put("events", { ...item, tags: nextTags });
    } else if (item.content !== undefined && !item.type) {
      await appDb.put("notes", { ...item, tags: nextTags });
    } else {
      await appDb.put("entries", { ...item, tags: nextTags });
    }
  };

  const handleContextMenuDelete = async (item: any) => {
    const isListItem =
      typeof item.listId === "string" &&
      item.subtitle !== undefined &&
      item.startAt === undefined &&
      item.content === undefined;
    if (isListItem) {
      await handleDeleteListItem(item.id);
    } else if (item.startAt !== undefined) {
      await handleDeleteEvent(item.id);
    } else if (item.content !== undefined && item.type === undefined) {
      await handleDeleteNote(item.id);
    } else {
      await handleDeleteEntry(item.id);
    }
  };

  const handleMarkAchievement = (item: any) => {
    // Build the pre-filled CalendarEvent draft
    const draft: Partial<CalendarEvent> = {
      title: item.title,
      description:
        item.metadata?.notes || item.description || item.content || "",
      startAt:
        item.scheduledAt ||
        item.startAt ||
        item.createdAt ||
        new Date().toISOString(),
      endAt:
        item.completedAt ||
        item.endAt ||
        item.metadata?.endAt ||
        new Date().toISOString(),
      allDay: false,
      category: "personal",
      tags: item.tags || [],
      listIds: [],
      isAchievement: true,
    };

    // Open the DetailSheet in event mode, new=true
    setSheetMode({ type: "event", data: draft, isNew: true });
  };

  // Lists & List Items
  const handleCreateList = async (listData: Partial<CustomList>) => {
    const id = "list_" + Date.now();
    await appDb.put<CustomList>("lists", {
      id,
      name: listData.name || "New List",
      description: listData.description || "",
      type: "custom",
      icon: listData.icon || "Folder",
      color: listData.color || "#6366F1",
      createdAt: new Date().toISOString(),
    });
    setSelectedListId(id);
    setActiveView("lists");
  };

  const handleAddListItem = async (item: Partial<ListItem>) => {
    const id =
      "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    await appDb.put<ListItem>("list_items", {
      id,
      listId: item.listId!,
      title: item.title || "Untitled Item",
      subtitle: item.subtitle,
      status: item.status || "inbox",
      tags: item.tags || [],
      notes: item.notes,
      dueDate: item.dueDate,
      createdAt: new Date().toISOString(),
    });
  };

  const handleUpdateListItemStatus = async (
    itemId: string,
    status: ListItemStatus,
  ) => {
    const item = listItems.find((i) => i.id === itemId);
    if (!item) return;

    await appDb.put("list_items", {
      ...item,
      status,
    });
  };

  const handleToggleItemStatus = async (itemId: string) => {
    const item = listItems.find((i) => i.id === itemId);
    if (!item) return;

    const nextStatusMap: Record<string, ListItemStatus> = {
      inbox: "in-progress",
      "in-progress": "completed",
      completed: "maybe-later",
      "maybe-later": "dropped",
      dropped: "inbox",
      todo: "in-progress",
      done: "inbox",
    };

    await appDb.put("list_items", {
      ...item,
      status: nextStatusMap[item.status] || "inbox",
    });
  };

  const handleDeleteListItem = async (itemId: string) => {
    await appDb.delete("list_items", itemId);
  };

  const handleSaveListItem = async (data: Partial<ListItem>) => {
    if (!data.id) return;
    const existing = listItems.find((i) => i.id === data.id);
    if (!existing) return;
    await appDb.put("list_items", { ...existing, ...data });
  };

  const handleUpdateListItem = async (
    itemId: string,
    patch: Partial<ListItem>,
  ) => {
    const item = listItems.find((i) => i.id === itemId);
    if (item) await appDb.put("list_items", { ...item, ...patch });
  };

  const handleUpdateList = async (
    listId: string,
    patch: Partial<CustomList>,
  ) => {
    const list = lists.find((l) => l.id === listId);
    if (list) await appDb.put("lists", { ...list, ...patch });
  };

  const handleDeleteList = async (listId: string) => {
    for (const it of listItems.filter((i) => i.listId === listId)) {
      await appDb.delete("list_items", it.id);
    }
    for (const n of notes.filter((n) => n.listIds.includes(listId))) {
      await appDb.put("notes", {
        ...n,
        listIds: n.listIds.filter((id) => id !== listId),
      });
    }
    for (const ev of events.filter((e) => e.listIds.includes(listId))) {
      await appDb.put("events", {
        ...ev,
        listIds: ev.listIds.filter((id) => id !== listId),
      });
    }
    await appDb.delete("lists", listId);
    if (selectedListId === listId) {
      setSelectedListId(lists.find((l) => l.id !== listId)?.id);
    }
  };

  // Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await appDb.updateSettings(newSettings);
    setSettings(updated);
  };

  // Header quick statistics
  const activeFocusCount = entries.filter(
    (e) => e.source === "focus-active" && e.status !== "completed",
  ).length;

  const todayKey = toLocalDateKey(new Date());
  const completedTodayCount = entries.filter(
    (e) =>
      e.status === "completed" &&
      !!e.completedAt &&
      toLocalDateKey(new Date(e.completedAt)) === todayKey,
  ).length;

  // Notes created in Timeline view for cross-view aggregation
  const timelineNotes = entries.filter(
    (e) => e.type === "note" && e.source === "timeline",
  );
  const timelineEvents = entries.filter(
    (e) => e.type === "event" && e.source !== "focus-anchor",
  );
  // Compute available tags for Context Menu
  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    const visit = (arr: any[]) =>
      arr.forEach((x) => (x.tags || []).forEach((t: string) => set.add(t)));
    visit(notes);
    visit(events);
    visit(listItems);
    visit(entries);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes, events, listItems, entries]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 antialiased overflow-hidden transition-colors selection:bg-indigo-500/30 selection:text-indigo-400">
      {/* 1. Global Header Navigation */}
      <Header
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
        }}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTaskCount={activeFocusCount}
        completedTodayCount={completedTodayCount}
      />

      {/* 2. Workspace Body: Desktop Sidebar + Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar on Desktop */}
        <Sidebar
          activeView={activeView}
          selectedListId={selectedListId}
          onSelectView={(view, listId) => {
            setActiveView(view);
            if (listId) setSelectedListId(listId);
          }}
          lists={lists}
          activeTaskCount={activeFocusCount}
          totalNotesCount={notes.length + timelineNotes.length}
          totalEventsCount={events.length + timelineEvents.length}
          onOpenCreateList={() => setIsCreateListOpen(true)}
        />

        {/* Main Viewport Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0B0F17] overflow-hidden">
          {activeView === "focus" && (
            <FocusView
              entries={entries}
              customTabs={customTabs}
              scratchpadCards={scratchpadCards}
              settings={settings}
              onAddEntry={handleAddEntry}
              onToggleEntryStatus={handleToggleEntryStatus}
              onDeleteEntry={handleDeleteEntry}
              onAddScratchpad={handleAddScratchpad}
              onUpdateScratchpad={handleUpdateScratchpad}
              onDeleteScratchpad={handleDeleteScratchpad}
              onSendScratchpadToTimeline={handleSendScratchpadToTimeline}
              onCreateCustomTab={handleCreateCustomTab}
              onUpdateCustomTab={handleUpdateCustomTab}
              onDeleteCustomTab={handleDeleteCustomTab}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenContextMenu={(item, pos) =>
                handleOpenContextMenu(item, "focus", pos)
              }
            />
          )}

          {activeView === "timeline" && (
            <TimelineView
              entries={entries.filter(
                (e) =>
                  // focus-anchor entries never publish to Timeline (they live only in Focus View)
                  e.source !== "focus-anchor" &&
                  // pending focus-active entries only publish once completed
                  !(e.source === "focus-active" && e.status !== "completed"),
              )}
              onAddEntry={handleAddEntry}
              onToggleEntryStatus={handleToggleEntryStatus}
              onDeleteEntry={handleDeleteEntry}
              displayMode={settings.timelineDisplayMode ?? "default"}
              onUpdateEntryTitle={handleUpdateEntryTitle}
              onOpenNoteDetail={(entryId) => {
                const entry = entries.find((e) => e.id === entryId);
                if (entry)
                  setSheetMode({
                    type: "note",
                    data: buildNoteSheetData(entry),
                    isNew: false,
                  });
              }}
              onOpenEventDetail={(entryId) => {
                const entry = entries.find((e) => e.id === entryId);
                if (entry)
                  setSheetMode({
                    type: "event",
                    data: buildEventSheetData(entry),
                    isNew: false,
                  });
              }}
              onOpenContextMenu={(item, pos) =>
                handleOpenContextMenu(item, "timeline", pos)
              }
              onUpdateEntryTime={handleUpdateEntryTime}
              showEntryContent={settings.showEntryContent}
            />
          )}

          {activeView === "notes" && (
            <NotesView
              notes={notes}
              timelineNotes={timelineNotes}
              onOpenCreateNote={() => handleCreateNote()}
              onOpenEditNote={(note) =>
                setSheetMode({
                  type: "note",
                  data: note,
                  isNew: false,
                })
              }
              onDeleteNote={handleDeleteNote}
              onOpenContextMenu={(note, pos) =>
                handleOpenContextMenu(note, "note", pos)
              }
            />
          )}

          {activeView === "events" && (
            <EventsView
              events={events}
              timelineEvents={timelineEvents}
              onOpenCreateEvent={(prefillDate) =>
                handleCreateEvent(prefillDate)
              }
              onOpenEditEvent={(event) =>
                setSheetMode({
                  type: "event",
                  data: event,
                  isNew: false,
                })
              }
              onDeleteEvent={handleDeleteEvent}
              onOpenContextMenu={(event, pos) =>
                handleOpenContextMenu(event, "event", pos)
              }
              onResolveEvent={handleResolveEvent}
            />
          )}

          {activeView === "habits" && (
            <HabitsView
              habits={habits}
              habitLogs={habitLogs}
              onToggleHabitDay={handleToggleHabitDay}
              onOpenHabitDetail={(habit) =>
                setSheetMode({
                  type: "habit",
                  data: habit,
                  logs: habitLogs.filter((l) => l.habitId === habit.id),
                  isNew: false,
                })
              }
              onOpenCreateHabit={() =>
                setSheetMode({
                  type: "habit",
                  data: { scheduleType: "everyday", color: "#6366F1" },
                  logs: [],
                  isNew: true,
                })
              }
            />
          )}

          {activeView === "lists" && (
            <ListsView
              lists={lists}
              selectedListId={selectedListId}
              onSelectList={(id) => setSelectedListId(id)}
              listItems={listItems}
              notes={notes}
              events={events}
              onAddListItem={handleAddListItem}
              onToggleItemStatus={handleToggleItemStatus}
              onUpdateItemStatus={handleUpdateListItemStatus}
              onDeleteListItem={handleDeleteListItem}
              onOpenCreateList={() => setIsCreateListOpen(true)}
              onOpenEditNote={(note) =>
                setSheetMode({
                  type: "note",
                  data: note,
                  isNew: false,
                })
              }
              onOpenEditEvent={(event) =>
                setSheetMode({
                  type: "event",
                  data: event,
                  isNew: false,
                })
              }
              onOpenContextMenu={(item, pos) =>
                handleOpenContextMenu(item, "list", pos)
              }
              onOpenItemDetail={(item) =>
                setSheetMode({ type: "list_item", data: item, isNew: false })
              }
              onUpdateList={handleUpdateList}
              onDeleteList={handleDeleteList}
              onUpdateListItem={handleUpdateListItem}
              onCreateLinkedNote={handleCreateLinkedNote}
              onCreateLinkedEvent={handleCreateLinkedEvent}
            />
          )}
        </main>
      </div>

      {/* 3. Polymorphic DetailSheet Component */}
      <DetailSheet
        sheetMode={sheetMode}
        availableLists={lists}
        onClose={() => setSheetMode(null)}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
        onSaveEvent={handleSaveEvent}
        onDeleteEvent={handleDeleteEvent}
        onSaveHabit={handleSaveHabit}
        onDeleteHabit={handleDeleteHabit}
        onSaveListItem={handleSaveListItem}
        onDeleteListItem={handleDeleteListItem}
      />

      {/* 4. Settings & Workspace Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 5. Create Custom List Modal */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreateList={handleCreateList}
      />

      {/* 6. Universal Context Menu */}
      <ContextMenu
        target={contextTarget}
        position={contextPosition}
        isOpen={isContextMenuOpen}
        onClose={() => setIsContextMenuOpen(false)}
        onEdit={handleContextMenuEdit}
        onDuplicate={handleContextMenuDuplicate}
        onReschedule={handleContextMenuReschedule}
        onAddTag={handleContextMenuAddTag}
        onDelete={handleContextMenuDelete}
        onRemoveTag={handleContextMenuRemoveTag}
        onMarkAchievement={handleMarkAchievement}
        onResolveEvent={handleResolveEvent}
        onSetTags={handleContextMenuSetTags}
        availableTags={availableTags}
      />
    </div>
  );
}
