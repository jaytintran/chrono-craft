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
  EntryPriority,
  Habit,
  HabitLog,
  ListItem,
  ListItemStatus,
  Note,
  ScratchpadCard,
  TimelineEntry,
} from "./types";
import { appDb } from "./services/db";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DetailSheet, DetailSheetMode } from "./components/DetailSheet";
import { SettingsModal } from "./components/SettingsModal";
import { CreateListModal } from "./components/CreateListModal";
import { ContextMenu, ContextMenuTarget } from "./components/ContextMenu";

import { FocusView } from "./views/FocusView";
import { TimelineView } from "./views/TimelineView";
import { NotesView } from "./views/NotesView";
import { EventsView } from "./views/EventsView";
import { HabitsView } from "./views/HabitsView";
import { ListsView } from "./views/ListsView";

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
  }, [settings.theme]);

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
      priority: entry.priority || "normal",
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

  // Notes
  const handleSaveNote = async (noteData: Partial<Note>) => {
    const now = new Date().toISOString();
    if (noteData.id && !noteData.id.startsWith("tl_")) {
      const existing = notes.find((n) => n.id === noteData.id);
      if (existing) {
        await appDb.put("notes", {
          ...existing,
          ...noteData,
          updatedAt: now,
        });
        return;
      }
    }
    const id =
      "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    await appDb.put<Note>("notes", {
      id,
      title: noteData.title || "Untitled Note",
      content: noteData.content || "",
      tags: noteData.tags || [],
      listIds: noteData.listIds || [],
      createdAt: now,
      updatedAt: now,
      isPinned: noteData.isPinned || false,
    });
  };

  const handleDeleteNote = async (id: string) => {
    if (id.startsWith("tl_")) {
      const rawId = id.replace("tl_", "");
      await appDb.delete("entries", rawId);
    } else {
      await appDb.delete("notes", id);
    }
  };

  // Events
  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const now = new Date().toISOString();
    if (eventData.id && !eventData.id.startsWith("tl_")) {
      const existing = events.find((e) => e.id === eventData.id);
      if (existing) {
        await appDb.put("events", {
          ...existing,
          ...eventData,
        });
        return;
      }
    }
    const id =
      "event_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    await appDb.put<CalendarEvent>("events", {
      id,
      title: eventData.title || "Untitled Event",
      description: eventData.description || "",
      startAt: eventData.startAt || now,
      endAt: eventData.endAt,
      allDay: eventData.allDay || false,
      tags: eventData.tags || [],
      listIds: eventData.listIds || [],
      createdAt: now,
    });
  };

  const handleDeleteEvent = async (id: string) => {
    if (id.startsWith("tl_")) {
      const rawId = id.replace("tl_", "");
      await appDb.delete("entries", rawId);
    } else {
      await appDb.delete("events", id);
    }
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
          data: {
            id: item.id,
            title: item.title,
            content: item.metadata?.notes || "",
            tags: item.tags,
          },
          isNew: false,
        });
      } else if (item.type === "event") {
        setSheetMode({
          type: "event",
          data: {
            id: item.id,
            title: item.title,
            description: item.metadata?.notes || "",
            startAt: item.scheduledAt || item.createdAt,
            allDay: false,
            tags: item.tags,
          },
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
    if (item.startAt !== undefined) {
      await appDb.put("events", {
        ...item,
        startAt: isoDate,
      });
    } else {
      await appDb.put("entries", {
        ...item,
        scheduledAt: isoDate,
      });
    }
  };

  const handleContextMenuChangePriority = async (
    item: any,
    priority: EntryPriority,
  ) => {
    if (item.listId !== undefined) {
      await appDb.put("list_items", { ...item, priority });
    } else if (item.content !== undefined && !item.type) {
      // Note
      await appDb.put("notes", { ...item, priority });
    } else if (item.startAt !== undefined) {
      // Event
      await appDb.put("events", { ...item, priority });
    } else {
      // Timeline entry / task
      await appDb.put("entries", { ...item, priority });
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

  const handleContextMenuDelete = async (item: any) => {
    if (item.listId !== undefined) {
      await handleDeleteListItem(item.id);
    } else if (item.startAt !== undefined) {
      await handleDeleteEvent(item.id);
    } else if (item.content !== undefined && !item.type) {
      await handleDeleteNote(item.id);
    } else {
      await handleDeleteEntry(item.id);
    }
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
      priority: item.priority || "normal",
      tags: item.tags || [],
      notes: item.notes,
      dueDate: item.dueDate,
      folderId: item.folderId,
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
    const existing = data.id
      ? listItems.find((i) => i.id === data.id)
      : undefined;
    if (existing) {
      await appDb.put("list_items", { ...existing, ...data });
    } else {
      await handleAddListItem(data);
    }
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

  const handleToggleTheme = () => {
    handleUpdateSettings({
      theme: settings.theme === "dark" ? "light" : "dark",
    });
  };

  // Header quick statistics
  const activeFocusCount = entries.filter(
    (e) => e.source === "focus-active" && e.status !== "completed",
  ).length;

  const todayIsoPrefix = new Date().toISOString().split("T")[0];
  const completedTodayCount = entries.filter(
    (e) =>
      e.status === "completed" && e.completedAt?.startsWith(todayIsoPrefix),
  ).length;

  // Notes created in Timeline view for cross-view aggregation
  const timelineNotes = entries.filter(
    (e) => e.type === "note" && e.source === "timeline",
  );
  const timelineEvents = entries.filter((e) => e.type === "event");

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 antialiased overflow-hidden transition-colors selection:bg-indigo-500/30 selection:text-indigo-400">
      {/* 1. Global Header Navigation */}
      <Header
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
        }}
        settings={settings}
        onToggleTheme={handleToggleTheme}
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
              entries={entries}
              notes={notes}
              events={events}
              onAddEntry={handleAddEntry}
              onToggleEntryStatus={handleToggleEntryStatus}
              onDeleteEntry={handleDeleteEntry}
              onOpenNoteDetail={(entryId) => {
                const entry = entries.find((e) => e.id === entryId);
                const noteMatch = notes.find(
                  (n) => n.id === entryId || (entry && n.title === entry.title),
                );
                if (noteMatch) {
                  setSheetMode({ type: "note", data: noteMatch, isNew: false });
                } else if (entry) {
                  setSheetMode({
                    type: "note",
                    data: {
                      id: entry.id,
                      title: entry.title,
                      content: entry.metadata?.notes || "",
                      tags: entry.tags,
                      listIds: entry.metadata?.listId
                        ? [entry.metadata.listId]
                        : [],
                    },
                    isNew: false,
                  });
                }
              }}
              onOpenEventDetail={(entryId) => {
                const entry = entries.find((e) => e.id === entryId);
                const eventMatch = events.find(
                  (ev) =>
                    ev.id === entryId || (entry && ev.title === entry.title),
                );
                if (eventMatch) {
                  setSheetMode({
                    type: "event",
                    data: eventMatch,
                    isNew: false,
                  });
                } else if (entry) {
                  setSheetMode({
                    type: "event",
                    data: {
                      id: entry.id,
                      title: entry.title,
                      description: entry.metadata?.notes || "",
                      startAt: entry.scheduledAt || entry.createdAt,
                      allDay: false,
                      tags: entry.tags,
                      listIds: entry.metadata?.listId
                        ? [entry.metadata.listId]
                        : [],
                    },
                    isNew: false,
                  });
                }
              }}
              onOpenContextMenu={(item, pos) =>
                handleOpenContextMenu(item, "timeline", pos)
              }
            />
          )}

          {activeView === "notes" && (
            <NotesView
              notes={notes}
              timelineNotes={timelineNotes}
              lists={lists}
              onOpenCreateNote={() =>
                setSheetMode({
                  type: "note",
                  data: {},
                  isNew: true,
                })
              }
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
              lists={lists}
              onOpenCreateEvent={() =>
                setSheetMode({
                  type: "event",
                  data: {},
                  isNew: true,
                })
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
        onChangePriority={handleContextMenuChangePriority}
        onAddTag={handleContextMenuAddTag}
        onDelete={handleContextMenuDelete}
      />
    </div>
  );
}
