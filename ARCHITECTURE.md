# ChronoCraft Architecture & Data Flow Specification

## 1. High-Level Architecture Overview

ChronoCraft is built as an offline-first, client-authoritative Single Page Application (SPA). All application state, user entries, habits, notes, events, and customized workspaces persist directly inside the user's browser via native **IndexedDB** (`chronocraft_db`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Header Navigation Bar                             │
│   Brand Wordmark  ·  Breadcrumbs  ·  Active Focus Stats  ·  Dual-Theme      │
│   [Mobile: Dropdown View Switcher]                                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  Desktop Sidebar (260px)     │              │    Main Workspace Canvas     │
│  - Focus                     │              │                              │
│  - Timeline                  │              ├─ Focus View (Today, Scratch) │
│  - Notes                     │─────────────▶├─ Timeline View (Spine + NLP) │
│  - Events                    │              ├─ Notes View (DetailSheet)    │
│  - Habits                    │              ├─ Events View (DetailSheet)   │
│  - Lists (Collapsible)       │              ├─ Habits View (Matrix Grid)   │
│    · Projects, Books, Courses│              └─ Lists View (Identical Sub)  │
└──────────────────────────────┘                                             │
                                       ┌─────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Slide-over DetailSheet Engine                         │
│       Polymorphic Modes: Note Editor · Event Scheduler · Habit Telemetry    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Offline IndexedDB Storage (AppDB)                        │
│   Stores: entries · notes · events · habits · habit_logs · lists · tabs     │
│   Reactive publish/subscribe event listener for zero-latency state sync     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. IndexedDB Schema Design

The database `chronocraft_db` (Version 1) contains 10 structured object stores:

| Store Name | Key Path | Primary Indices | Purpose |
| :--- | :--- | :--- | :--- |
| `entries` | `id` | `type`, `status`, `source`, `createdAt` | Timeline entries, Anchors, and X-Active tasks |
| `notes` | `id` | `updatedAt` | Freeform markdown notes and knowledge cards |
| `events` | `id` | `startAt` | Scheduled meetings and milestones |
| `habits` | `id` | (primary key) | Routine definitions, schedule cadence, colors |
| `habit_logs` | `id` | `habitId`, `date` | Daily completion records for matrix calculation |
| `lists` | `id` | (primary key) | Taxonomy lists (Projects, Books, Courses, Custom) |
| `list_items` | `id` | `listId` | Tracked items, priorities, and statuses per list |
| `custom_tabs` | `id` | (primary key) | User-created custom Focus tabs and queue settings |
| `scratchpad` | `id` | `updatedAt` | Quick brain-dump note cards (Keep style) |
| `settings` | `key` | (primary key) | Application preferences (Active limit, theme) |

---

## 3. Natural Language Parser (NLP) Grammar

The NLP engine (`src/services/nlpParser.ts`) is a deterministic, regex-based tokenizer executing synchronously as the user types:

### Syntax Rules:
1. **Time Expressions**:
   - `at 3pm`, `at 3:30pm`, `9:00am`, `at 14:00`, `at noon`, `at midnight`
   - Maps to exact hour and minute, defaulting to the target date.
2. **Relative & Absolute Dates**:
   - `today`, `tonight`, `tomorrow`, `tmrw`
   - `in 2 days`, `in 3 weeks`
   - `next monday`, `this friday`
   - `15/11`, `11-15`, `Nov 15`
3. **Priority Tokens**:
   - `!high`, `!p1`, `!urgent` $\rightarrow$ `'high'`
   - `!normal`, `!p2`, `!medium` $\rightarrow$ `'normal'`
   - `!low`, `!p3` $\rightarrow$ `'low'`
4. **Hashtags**:
   - `#tagname` extracted into structured `tags: string[]`.
5. **Type Commands**:
   - `/task`, `/log`, `/note`, `/event` switches entry classification.

---

## 4. Cross-View Synergy & Event Propagation

- **Focus $\rightarrow$ Timeline**:
  When a task in Anchors or X-Active is checked off, its status flips to `'completed'` and `completedAt` is recorded. The item immediately renders on the **Timeline View** with its exact completion timestamp.
- **Habits $\rightarrow$ Timeline**:
  Clicking a day cell in the **Habit Matrix** creates a `HabitLog` record and automatically creates a corresponding `'log'` entry in the Timeline spine.
- **Timeline $\rightarrow$ Notes / Events**:
  Notes and Events created via the Timeline master input bar are automatically queried and surfaced inside the dedicated **Notes View** and **Events View**.
- **Lists $\rightarrow$ Notes & Events**:
  Notes and Events can be assigned to multiple Lists. Each List view sub-tab displays all assigned notes and scheduled events linked to that list.

---

## 5. Data Portability & Privacy

- **Zero Cloud Dependence**: The application functions without internet connectivity after the initial bundle load.
- **Full JSON Export**: Users can export the entire database (`chronocraft-backup-YYYY-MM-DD.json`) anytime from the Settings modal.
- **Full JSON Import**: Restores the database with transactional safety.
