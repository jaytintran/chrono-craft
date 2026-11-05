/**
 * ChronoCraft - Offline-First IndexedDB Storage Service
 * Native Promise-based client storage with reactive change subscriptions.
 */

import {
  AppSettings,
  CalendarEvent,
  CustomFocusTab,
  CustomList,
  Habit,
  HabitLog,
  ListItem,
  Note,
  ScratchpadCard,
  TimelineEntry,
} from "../types";

const DB_NAME = "chronocraft_db";
const DB_VERSION = 1;

type StoreName =
  | "entries"
  | "notes"
  | "events"
  | "habits"
  | "habit_logs"
  | "lists"
  | "list_items"
  | "custom_tabs"
  | "scratchpad"
  | "settings";

class ChronoDB {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        if (!db.objectStoreNames.contains("entries")) {
          const store = db.createObjectStore("entries", { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("source", "source", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("notes")) {
          const store = db.createObjectStore("notes", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("events")) {
          const store = db.createObjectStore("events", { keyPath: "id" });
          store.createIndex("startAt", "startAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("habits")) {
          db.createObjectStore("habits", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("habit_logs")) {
          const store = db.createObjectStore("habit_logs", { keyPath: "id" });
          store.createIndex("habitId", "habitId", { unique: false });
          store.createIndex("date", "date", { unique: false });
        }

        if (!db.objectStoreNames.contains("lists")) {
          db.createObjectStore("lists", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("list_items")) {
          const store = db.createObjectStore("list_items", { keyPath: "id" });
          store.createIndex("listId", "listId", { unique: false });
        }

        if (!db.objectStoreNames.contains("custom_tabs")) {
          db.createObjectStore("custom_tabs", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("scratchpad")) {
          const store = db.createObjectStore("scratchpad", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        // Check if initial seeding is needed
        await this.checkSeedData(db);
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async checkSeedData(db: IDBDatabase) {
    const tx = db.transaction(["lists", "settings"], "readonly");
    const listsStore = tx.objectStore("lists");
    const countReq = listsStore.count();

    countReq.onsuccess = async () => {
      if (countReq.result === 0) {
        await this.seedInitialWorkspace();
      }
    };
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error("Subscription error", err);
      }
    });
  }

  // Generic Get All
  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  }

  // Generic Get One
  public async get<T>(
    storeName: StoreName,
    key: IDBValidKey,
  ): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error);
    });
  }

  // Generic Put (Create or Update)
  public async put<T>(storeName: StoreName, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => {
        resolve();
        this.notify();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Generic Delete
  public async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => {
        resolve();
        this.notify();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Settings Helpers
  public async getSettings(): Promise<AppSettings> {
    const item = await this.get<{ key: string; value: AppSettings }>(
      "settings",
      "app_config",
    );
    if (item && item.value) {
      return item.value;
    }
    const defaultSettings: AppSettings = {
      xActiveLimit: 5,
      theme: "dark",
      nlpAutoExtract: true,
      showEntryContent: true,
    };
    await this.put("settings", { key: "app_config", value: defaultSettings });
    return defaultSettings;
  }

  public async updateSettings(
    settings: Partial<AppSettings>,
  ): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.put("settings", { key: "app_config", value: updated });
    return updated;
  }

  // Helper for Toggling Habit Completion
  public async toggleHabitDay(habitId: string, date: string): Promise<boolean> {
    const logs = await this.getAll<HabitLog>("habit_logs");
    const existing = logs.find((l) => l.habitId === habitId && l.date === date);

    if (existing) {
      // Remove log
      await this.delete("habit_logs", existing.id);
      // Also remove timeline entry if created
      const entries = await this.getAll<TimelineEntry>("entries");
      const habitEntry = entries.find(
        (e) => e.metadata?.habitId === habitId && e.createdAt.startsWith(date),
      );
      if (habitEntry) {
        await this.delete("entries", habitEntry.id);
      }
      return false; // uncompleted
    } else {
      // Add log
      const habit = await this.get<Habit>("habits", habitId);
      const logId =
        "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const nowIso = new Date().toISOString();
      await this.put<HabitLog>("habit_logs", {
        id: logId,
        habitId,
        date,
        completedAt: nowIso,
      });

      // Stream to Timeline entries as completed habit log (clean habit title)
      const entryId =
        "entry_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 7);
      await this.put<TimelineEntry>("entries", {
        id: entryId,
        type: "log",
        title: habit ? habit.title : "Routine",
        status: "completed",
        source: "habit",
        createdAt: nowIso,
        completedAt: nowIso,
        tags: ["habit", "routine"],
        metadata: { habitId },
      });

      return true; // completed
    }
  }

  // Full Database Export (JSON)
  public async exportDatabase(): Promise<string> {
    const stores: StoreName[] = [
      "entries",
      "notes",
      "events",
      "habits",
      "habit_logs",
      "lists",
      "list_items",
      "custom_tabs",
      "scratchpad",
    ];

    const backup: Record<string, any> = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
    };

    for (const store of stores) {
      backup[store] = await this.getAll(store);
    }
    backup.settings = await this.getSettings();

    return JSON.stringify(backup, null, 2);
  }

  // Full Database Import (JSON)
  public async importDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      const db = await this.init();

      const stores: StoreName[] = [
        "entries",
        "notes",
        "events",
        "habits",
        "habit_logs",
        "lists",
        "list_items",
        "custom_tabs",
        "scratchpad",
      ];

      for (const store of stores) {
        if (Array.isArray(data[store])) {
          const tx = db.transaction(store, "readwrite");
          const objStore = tx.objectStore(store);
          objStore.clear();
          for (const item of data[store]) {
            objStore.put(item);
          }
        }
      }

      if (data.settings) {
        await this.updateSettings(data.settings);
      }

      this.notify();
      return true;
    } catch (err) {
      console.error("Failed to import database JSON", err);
      return false;
    }
  }

  // Reset to default seed
  public async resetWorkspace(): Promise<void> {
    const db = await this.init();
    const stores: StoreName[] = [
      "entries",
      "notes",
      "events",
      "habits",
      "habit_logs",
      "lists",
      "list_items",
      "custom_tabs",
      "scratchpad",
    ];
    for (const store of stores) {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).clear();
    }
    await this.seedInitialWorkspace();
    this.notify();
  }

  // Initial Workspace Seeding
  private async seedInitialWorkspace() {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const nowIso = today.toISOString();

    // 1. Default Lists
    const defaultLists: CustomList[] = [
      {
        id: "list_projects",
        name: "Projects",
        type: "projects",
        description:
          "Active engineering initiatives, architecture, and feature roadmaps.",
        icon: "FolderKanban",
        color: "#6366F1",
        createdAt: nowIso,
      },
      {
        id: "list_books",
        name: "Books",
        type: "books",
        description:
          "Reading queue, critical takeaways, and literature summaries.",
        icon: "BookOpen",
        color: "#10B981",
        createdAt: nowIso,
      },
      {
        id: "list_courses",
        name: "Courses",
        type: "courses",
        description:
          "Interactive curriculum, certifications, and skill mastery modules.",
        icon: "GraduationCap",
        color: "#F59E0B",
        createdAt: nowIso,
      },
    ];

    for (const list of defaultLists) {
      await this.put("lists", list);
    }

    // List items showcasing 5-status lifecycle: inbox, in-progress, completed, dropped, maybe-later
    const sampleItems: ListItem[] = [
      {
        id: "item_1",
        listId: "list_projects",
        title: "ChronoCraft Core Engine v1.0",
        subtitle: "Offline IndexedDB and reactive UI architecture",
        status: "in-progress",
        tags: ["architecture", "frontend"],
        notes:
          "Enforce zero-pill metadata discipline and high typographic hierarchy.",
        createdAt: nowIso,
      },
      {
        id: "item_2",
        listId: "list_projects",
        title: "Natural Language Input Parser",
        subtitle: "Regex tokenizer for fast keystroke time & date extraction",
        status: "completed",
        tags: ["nlp", "parser"],
        createdAt: nowIso,
      },
      {
        id: "item_p_dropped",
        listId: "list_projects",
        title: "Legacy REST Polling Architecture",
        subtitle:
          "Deprecated in favor of offline-first IndexedDB reactive stream",
        status: "dropped",
        tags: ["deprecated"],
        createdAt: nowIso,
      },
      {
        id: "item_3",
        listId: "list_books",
        title: "Designing Data-Intensive Applications",
        subtitle: "Martin Kleppmann · Reading Chapter 5 (Replication)",
        status: "in-progress",
        tags: ["systems", "database"],
        createdAt: nowIso,
      },
      {
        id: "item_4",
        listId: "list_books",
        title: "Atomic Habits",
        subtitle: "James Clear · Re-reading Habit Loops & Cues",
        status: "completed",
        tags: ["productivity"],
        createdAt: nowIso,
      },
      {
        id: "item_b_inbox",
        listId: "list_books",
        title: "A Philosophy of Software Design",
        subtitle: "John Ousterhout · Core reading backlog",
        status: "inbox",
        tags: ["architecture"],
        createdAt: nowIso,
      },
      {
        id: "item_b_later",
        listId: "list_books",
        title: "Site Reliability Engineering",
        subtitle: "Betsy Beyer et al. · Someday queue",
        status: "maybe-later",
        tags: ["infra"],
        createdAt: nowIso,
      },
      {
        id: "item_5",
        listId: "list_courses",
        title: "Advanced TypeScript Patterns & Performance",
        subtitle: "Module 4: Discriminated Unions & Type-Level State Machines",
        status: "in-progress",
        tags: ["typescript", "skills"],
        createdAt: nowIso,
      },
      {
        id: "item_c_inbox",
        listId: "list_courses",
        title: "Distributed Systems & Consensus (MIT 6.824)",
        subtitle: "Raft consensus & distributed key-value stores",
        status: "inbox",
        tags: ["systems"],
        createdAt: nowIso,
      },
      {
        id: "item_c_dropped",
        listId: "list_courses",
        title: "Introductory Python 101",
        subtitle: "Skipped - already proficient in core syntax",
        status: "dropped",
        tags: ["python"],
        createdAt: nowIso,
      },
    ];

    for (const item of sampleItems) {
      await this.put("list_items", item);
    }

    // 2. Habits
    const sampleHabits: Habit[] = [
      {
        id: "habit_1",
        title: "Morning Sunlight & Hydration",
        description: "15 minutes outdoor natural light and 500ml cold water.",
        scheduleType: "everyday",
        color: "#10B981",
        createdAt: nowIso,
      },
      {
        id: "habit_2",
        title: "Deep Work 90min Block",
        description:
          "Zero notifications, phone in airplane mode, focused on single MIT.",
        scheduleType: "everyday",
        color: "#6366F1",
        createdAt: nowIso,
      },
      {
        id: "habit_3",
        title: "Strength & Mobility Training",
        description:
          "Compound resistance lifts followed by hip & thoracic mobility.",
        scheduleType: "custom",
        customDays: [1, 3, 5], // Mon, Wed, Fri
        color: "#06B6D4",
        createdAt: nowIso,
      },
      {
        id: "habit_4",
        title: "Read 20 Pages",
        description: "Technical non-fiction or philosophy before sleep.",
        scheduleType: "everyday",
        color: "#8B5CF6",
        createdAt: nowIso,
      },
      {
        id: "habit_5",
        title: "Weekly Retrospective & Planning",
        description:
          "Audit completed tasks, reconcile timeline logs, set next sprint goals.",
        scheduleType: "weekly",
        color: "#F59E0B",
        createdAt: nowIso,
      },
    ];

    for (const habit of sampleHabits) {
      await this.put("habits", habit);
    }

    // Habit Logs for past 7 days to seed matrix
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];

      // Habits 1 and 2 completed regularly
      if (i !== 3) {
        await this.put("habit_logs", {
          id: `log_h1_${dStr}`,
          habitId: "habit_1",
          date: dStr,
          completedAt: d.toISOString(),
        });
      }
      if (i < 4) {
        await this.put("habit_logs", {
          id: `log_h2_${dStr}`,
          habitId: "habit_2",
          date: dStr,
          completedAt: d.toISOString(),
        });
      }
      if (d.getDay() === 1 || d.getDay() === 3 || d.getDay() === 5) {
        await this.put("habit_logs", {
          id: `log_h3_${dStr}`,
          habitId: "habit_3",
          date: dStr,
          completedAt: d.toISOString(),
        });
      }
    }

    // 3. Anchors & Focus Active Tasks
    const morningTime = new Date(today);
    morningTime.setHours(9, 0, 0, 0);

    const afternoonTime = new Date(today);
    afternoonTime.setHours(14, 0, 0, 0);

    const blockStart = new Date(today);
    blockStart.setHours(13, 0, 0, 0);
    const blockEnd = new Date(today);
    blockEnd.setHours(15, 0, 0, 0);

    const completedMorning = new Date(today);
    completedMorning.setHours(8, 30, 0, 0);

    const sampleEntries: TimelineEntry[] = [
      {
        id: "entry_block_1",
        type: "timeblock",
        title: "Deep Architecture & Systems Sprint",
        scheduledAt: blockStart.toISOString(),
        createdAt: nowIso,
        status: "pending",
        source: "timeline",
        tags: ["deepwork", "systems"],
        timeBlock: {
          startIso: blockStart.toISOString(),
          endIso: blockEnd.toISOString(),
          durationMinutes: 120,
          rawBracket: "<from 1pm to 3pm>",
        },
      },
      {
        id: "entry_anchor_1",
        type: "event",
        title: "Morning Executive Review & Daily Anchors",
        scheduledAt: morningTime.toISOString(),
        createdAt: nowIso,
        status: "pending",
        source: "focus-anchor",
        tags: ["planning", "executive"],
      },
      {
        id: "entry_anchor_2",
        type: "event",
        title: "Architecture Review Sync",
        scheduledAt: afternoonTime.toISOString(),
        createdAt: nowIso,
        status: "pending",
        source: "focus-anchor",
        tags: ["engineering", "review"],
      },
      {
        id: "entry_active_1",
        type: "task",
        title: "Ship IndexedDB offline-first synchronization",
        createdAt: nowIso,
        status: "active",
        source: "focus-active",
        tags: ["core", "storage"],
      },
      {
        id: "entry_active_2",
        type: "task",
        title: "Polish Timeline vertical spine & icon alignment",
        createdAt: nowIso,
        status: "active",
        source: "focus-active",
        tags: ["ui", "timeline"],
      },
      {
        id: "entry_active_3",
        type: "task",
        title: "Configure Habit DetailSheet schedule cadence engine",
        createdAt: nowIso,
        status: "active",
        source: "focus-active",
        tags: ["habits"],
      },
      {
        id: "entry_completed_1",
        type: "task",
        title: "Draft ChronoCraft DESIGN_SYSTEM.md tokens",
        createdAt: completedMorning.toISOString(),
        completedAt: completedMorning.toISOString(),
        status: "completed",
        source: "focus-active",
        tags: ["design"],
      },
      {
        id: "entry_completed_2",
        type: "log",
        title: "Completed habit: Morning Sunlight & Hydration",
        createdAt: completedMorning.toISOString(),
        completedAt: completedMorning.toISOString(),
        status: "completed",
        source: "habit",
        tags: ["habit"],
        metadata: { habitId: "habit_1" },
      },
    ];

    for (const entry of sampleEntries) {
      await this.put("entries", entry);
    }

    // 4. Scratchpad Cards
    const sampleCards: ScratchpadCard[] = [
      {
        id: "scratch_1",
        title: "IndexedDB Performance Heuristic",
        content:
          "Keep transactions read-only for bulk queries. Use atomic batch puts when importing JSON dumps to avoid IPC roundtrip stutter.",
        color: "#1E293B",
        isPinned: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "scratch_2",
        title: "Design System Notes",
        content:
          'Zero pill metadata discipline: avoid colorful rounded badges on static labels. Use typographic separators like "·" and neutral tabular numerals.',
        color: "#1E293B",
        isPinned: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: "scratch_3",
        title: "Book Recommendation",
        content:
          'Check out "A Philosophy of Software Design" by John Ousterhout. Focus on deep module boundaries and cognitive load reduction.',
        color: "#1E293B",
        isPinned: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];

    for (const card of sampleCards) {
      await this.put("scratchpad", card);
    }

    // 5. Notes
    const sampleNotes: Note[] = [
      {
        id: "note_1",
        title: "ChronoCraft Architectural Constitution",
        content: `### Offline-First Principles\n1. Single source of local truth: IndexedDB client database\n2. Real-time reactive events across views without page reloads\n3. Zero network reliance: private, secure, immediate\n4. Clean polymorphic DetailSheet for editing Notes, Events, and Habits\n\n### User Workflow Synergy\nChecking off an active task in Focus instantly logs a completed event on the chronological Timeline spine with exact timestamps.`,
        tags: ["architecture", "constitution"],
        listIds: ["list_projects"],
        createdAt: nowIso,
        updatedAt: nowIso,
        isPinned: true,
      },
      {
        id: "note_2",
        title: "Quarterly Systems Mastery Plan",
        content: `Targeting 3 core engineering domains:\n- High-density UI layouts and CSS spatial math\n- Deterministic natural language tokenizers\n- Local-first durable client databases`,
        tags: ["learning", "career"],
        listIds: ["list_courses"],
        createdAt: nowIso,
        updatedAt: nowIso,
        isPinned: false,
      },
    ];

    for (const note of sampleNotes) {
      await this.put("notes", note);
    }

    // 6. Events
    const sampleEvents: CalendarEvent[] = [
      {
        id: "event_1",
        title: "Architecture Review Sync",
        description:
          "Cross-functional review of client data models and timeline performance.",
        startAt: afternoonTime.toISOString(),
        endAt: new Date(afternoonTime.getTime() + 3600000).toISOString(),
        allDay: false,
        tags: ["engineering", "review"],
        listIds: ["list_projects"],
        createdAt: nowIso,
      },
      {
        id: "event_2",
        title: "Weekly Systems Retrospective",
        description:
          "Audit velocity, review habit adherence, and refine sprint backlog.",
        startAt: new Date(today.getTime() + 86400000 * 2).toISOString(),
        allDay: true,
        tags: ["planning"],
        listIds: ["list_projects"],
        createdAt: nowIso,
      },
    ];

    for (const event of sampleEvents) {
      await this.put("events", event);
    }

    // 7. Custom Tabs
    const defaultCustomTab: CustomFocusTab = {
      id: "tab_deepwork",
      name: "Deep Work MITs",
      bgColor: "#4F46E5",
      createdAt: nowIso,
    };
    await this.put("custom_tabs", defaultCustomTab);
  }
}

export const appDb = new ChronoDB();
