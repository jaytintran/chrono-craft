# ChronoCraft

A local-first, offline-first productivity workspace that unifies your
**Focus queue**, **chronological Timeline**, **Notes**, **Events**,
**Habits**, and **Lists** into a single coherent app. Everything lives
in your browser's IndexedDB; nothing is sent to a server. Optional
two-way sync through a private GitHub Gist keeps multiple devices in
step without compromising that guarantee.

Built with **React + TypeScript + Vite + Tailwind CSS v4 + TipTap**, and
packaged with **Capacitor** for native iOS/Android builds.

---

## Table of contents

- [Philosophy](#philosophy)
- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Theming system](#theming-system)
- [Sync (GitHub Gist)](#sync-github-gist)
- [Data model](#data-model)
- [Native builds](#native-builds)
- [Development conventions](#development-conventions)
- [Adding a new theme](#adding-a-new-theme)
- [Adding a new view](#adding-a-new-view)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Philosophy

ChronoCraft is built on three principles:

1. **Local-first.** IndexedDB is the single source of truth. Views read
   from it, mutations write to it, and a reactive subscription re-renders
   the UI on every change. There is no server, no API, no authentication.
   If the network disappears, the app is unchanged.

2. **Zero-friction capture.** Every entry is one line of text away. The
   NLP bar parses dates, times, tags, and priority flags inline, and
   polymorphic editors (Notes, Events, List Items) share one slide-over
   shell with autosave.

3. **Boring, durable primitives.** No framework magic, no state-machine
   libraries, no ORM. Plain `useState`, plain IndexedDB wrappers, plain
   React components. The code you read today is the code that runs
   tomorrow.

The non-goal is being an "everything app". ChronoCraft is a _personal
execution system_ — focused, opinionated, and unhurried.

---

## Feature overview

### Focus View

- **Anchors** — scheduled commitments for the day. Natural-language
  input (`"Standup in 30 mins"`, `"Yoga at 6pm"`).
- **X-Active Engine** — a strict concurrency limit (`1-10`) on in-flight
  tasks. Capacity errors surface in the UI, not silently.
- **Completed** — checked-off anchors and active tasks, with timestamps.
- **Scratchpad** — colored sticky notes, pin-to-top, send-to-Timeline.
- **Custom Tabs** — user-defined focus workspaces with their own color
  and queue.

### Timeline View

- Day-scoped timeline spine with three display modes (default, compact,
  flat).
- **Time blocks** — `"Deep Work from 1pm to 3pm"` renders as start/end
  markers; any entry scheduled within the block renders as indented.
- Carry-over tray for unfinished tasks from earlier days.
- Full-text search across all entries, grouped by day.
- Per-type icons (task / log / note / event / habit / time block).

### Notes

- Rich-text notes with TipTap, slash commands, task lists, and markdown
  paste.
- Tag indexing, list linkage, pin-to-top.
- Autosave with empty-record cleanup.

### Events

- Official vs Personal categorization.
- Calendar-style with date picker, attendance tracking
  (attended / missed), and achievement promotion.
- Filter by category, timeframe, sort.

### Habits

- Matrix view with per-habit day grids and streak counters.
- Card view for scrolling through individual habits.
- Custom cadence (everyday, bi-weekly, weekly, monthly, custom days).
- 30-day adherence analytics in the detail sheet.

### Lists

- Five-status lifecycle: Inbox → In Progress → Completed → Dropped →
  Maybe Later.
- Group by tag or status, with a secondary grouping.
- Three view modes: stacked, grid, compact.
- Linked notes and events.
- Tag autocomplete in the input bar.

### Global

- **Gist Sync** — push/pull to a private GitHub Gist, last-write-wins
  merge by timestamp, tombstones for delete propagation.
- **Theme system** — eight palettes × two flavors (dark/light), runtime
  swappable, token-based.
- **Keyboard-first** — `Cmd+K` / `/` to search, `Cmd+Enter` to save,
  `Esc` to close.
- **Offline-first** — installable, works from cache, data never leaves
  the device without an explicit push.

---

## Tech stack

| Layer        | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Build        | Vite                                                         |
| UI           | React 18 + TypeScript                                        |
| Styling      | Tailwind CSS v4 (CSS-first `@theme` tokens)                  |
| Rich text    | TipTap (StarterKit, TaskList, Markdown, custom SlashCommand) |
| Icons        | lucide-react                                                 |
| Persistence  | IndexedDB (custom wrapper in `services/db.ts`)               |
| Native       | Capacitor (iOS/Android) + `@capacitor/keyboard` + EdgeToEdge |
| Sanitization | DOMPurify (for `RichContent` display)                        |
| Sync         | GitHub Gist REST API                                         |

No state-management library. No routing library. No form library. The
app is intentionally small enough that plain React is sufficient.

---

## Getting started

### Requirements

- Node.js 18+
- npm 9+ (or pnpm/yarn)

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy anywhere static.

### Preview the build

```bash
npm run preview
```

### Lint + format

```bash
npm run lint
```

---

## Project structure

```
.
├── index.html
├── index.css                    # Tailwind v4 @theme tokens + global CSS
├── main.tsx                     # App entry
├── App.tsx                      # Root component: state, effects, handlers
│
├── components/
│   ├── NLPInputBar.tsx          # Master NLP capture bar
│   ├── TagAutocompleteInput.tsx # Tag-aware input for list view
│   │
│   ├── detailSheet/             # Polymorphic editor (Note/Event/Habit/ListItem)
│   │   ├── index.tsx            # Shell: header, body, autosave, ESC, delete
│   │   ├── NoteForm.tsx
│   │   ├── EventForm.tsx
│   │   ├── HabitForm.tsx
│   │   ├── ListItemForm.tsx
│   │   ├── MetaRow.tsx          # Tags + list linkage
│   │   ├── TitleInput.tsx       # Auto-growing title textarea
│   │   └── types.ts
│   │
│   ├── editors/
│   │   ├── RichTextEditor.tsx   # TipTap wrapper with toolbar + slash
│   │   ├── RichContent.tsx      # Read-only HTML renderer
│   │   └── SlashCommand.tsx     # "/" command extension
│   │
│   ├── layout/
│   │   ├── Header.tsx           # Top nav + sync control
│   │   └── Sidebar.tsx          # Desktop navigation
│   │
│   ├── menu/
│   │   ├── ContextMenu.tsx      # Universal right-click / long-press menu
│   │   └── TagEditorPanel.tsx
│   │
│   ├── modals/
│   │   ├── SettingsModal.tsx    # Preferences, Gist, backup, storage
│   │   ├── CreateListModal.tsx
│   │   ├── CustomCalendarDropdown.tsx
│   │   └── CustomTimePickerPopover.tsx
│   │
│   └── ui/
│       ├── ConfirmDialog.tsx
│       ├── FilterSelect.tsx
│       ├── InlineTitle.tsx
│       ├── MultiGroupFilterPopover.tsx
│       ├── SearchBar.tsx
│       ├── StatusPickerPopover.tsx
│       └── ThemePicker.tsx      # Grouped Dark/Light theme grid
│
├── hooks/
│   ├── useIsMobile.ts
│   ├── useLongPress.ts
│   └── useRowMenu.ts
│
├── services/
│   ├── db.ts                    # IndexedDB wrapper + seeding + subscriptions
│   ├── gistSync.ts              # Gist push/pull/merge + tombstone purge
│   └── nlpParser.ts             # Deterministic NL parser
│
├── types/
│   └── index.ts                 # All app types (Entry, Note, Event, Habit, ...)
│
├── utils/
│   ├── date.ts                  # Local-time YYYY-MM-DD key
│   └── nativeTheme.ts           # Capacitor status/nav bar theming
│
└── views/
    ├── FocusView/
    │   ├── index.tsx
    │   ├── TodayTab.tsx
    │   ├── ScratchpadTab.tsx
    │   ├── CustomTabView.tsx
    │   ├── CreateTabModal.tsx
    │   ├── EditTabModal.tsx
    │   └── MobileTabPicker.tsx
    │
    ├── TimelineView/
    │   ├── index.tsx
    │   ├── TimelineEntryRow.tsx
    │   └── TimelineSearchView.tsx
    │
    ├── NotesView/
    │   └── index.tsx
    │
    ├── EventsView/
    │   ├── index.tsx
    │   └── EventDatePickerModal.tsx
    │
    ├── HabitsView/
    │   ├── index.tsx
    │   ├── HabitsCard.tsx
    │   ├── HabitsToolbar.tsx
    │   ├── constants.ts
    │   └── helpers.ts
    │
    └── ListsView/
        ├── index.tsx
        ├── ItemCard.tsx
        ├── ItemsGrid.tsx
        ├── LinkedCreateCard.tsx
        ├── constants.tsx
        └── helpers.tsx
```

---

## Theming system

Every color in the UI resolves through a **semantic token layer** defined
in `index.css`. Components never use raw palette classes like
`bg-slate-800` or `text-indigo-500`; they use semantic classes like
`bg-surface`, `text-primary`, `border-soft`, `bg-accent`.

### Token categories

| Token                                                                               | Purpose                                              |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `app`                                                                               | App background (behind the header and body)          |
| `surface`                                                                           | Inline cards, inputs, pills on a `sunken` background |
| `raised`                                                                            | Elevated cards, modals, popovers                     |
| `sunken`                                                                            | Recessed panels: form containers, toolbars, sidebars |
| `overlay`                                                                           | Modal backdrops                                      |
| `hover`                                                                             | Hover fill for interactive rows                      |
| `primary` / `secondary` / `muted` / `disabled`                                      | Four text tiers                                      |
| `soft` / `strong`                                                                   | Two border weights                                   |
| `accent`, `accent-hover`, `accent-fg`                                               | Brand color + hover + foreground-on-accent           |
| `success` / `warning` / `danger` / `info`                                           | Semantic colors                                      |
| `entity-rose` / `-amber` / `-emerald` / `-cyan` / `-indigo` / `-violet` / `-orange` | Feature identity colors (Habits, Lists, Events)      |

### How a theme is defined

Each theme provides the same set of CSS variables under two selectors:

- `.dark` — base dark theme (also the default when no `.light` class is
  present)
- `.light` — base light theme
- `.dark.theme-X` — dark flavor of theme `X`
- `html:not(.dark).theme-X` — light flavor of theme `X`

The token → utility mapping is generated automatically by Tailwind v4's
`@theme` directive. Adding a token named `--color-surface` gives you
`bg-surface`, `text-surface`, `border-surface`, `fill-surface`, etc.,
all of which support opacity modifiers (`bg-surface/70`).

### Switching themes

`App.tsx` handles theme application:

```ts
root.classList.remove("dark", "light", "theme-forest", ...);
root.classList.add(isDark ? "dark" : "light");
if (themeClass) root.classList.add(themeClass);
```

The `theme` field selects the palette; the `themeFlavor` field selects
dark vs light. Both are stored in `AppSettings`.

---

## Sync (GitHub Gist)

ChronoCraft uses a **private GitHub Gist** as a shared JSON snapshot.
This gives you cross-device sync with no backend, no auth server, and
no third party that can read your data.

### Setup

1. Create a Personal Access Token at
   [github.com/settings/tokens](https://github.com/settings/tokens)
   with **only the `gist` scope**.
2. Open **Settings → Gist Sync** in the app.
3. Paste the token. Leave the Gist ID empty.
4. Click **Push**. The app creates a private Gist and stores its ID
   automatically.
5. On a second device, paste the same token and the Gist ID from step 4.
6. Click **Pull**.

### What happens on sync

- **Push** — build a snapshot of every store, `PATCH` it to the Gist.
  Creates a Gist if one doesn't exist yet.
- **Pull** — fetch the Gist, merge each record by `id`:
  - Remote newer than local → overwrite local.
  - Local newer than remote → keep local (it will publish on next push).
  - New on either side → insert.
  - Tombstones (`deletedAt` set) participate in the merge so deletes
    propagate.
- **Full Sync** — pull, then push. Safe default.

### Deletes: tombstones

Deletes don't physically remove the record. Instead they set
`deletedAt = <ISO timestamp>` and every view filters tombstones out at
load time. This is what lets "delete on device A" propagate to device B
on its next pull — the tombstone travels like any other record.

Old tombstones accumulate. Settings → Storage & System exposes a
**Tombstone Cleanup** panel:

- **Total** — current tombstone count
- **Purgeable** — how many are older than the selected threshold
- **Oldest** — age of the oldest tombstone

Purge with the threshold dropdown (30 days recommended). The confirm
dialog warns about the trade-off: devices that haven't synced in longer
than the threshold will re-add the items on their next push.

### Security notes

- The token is stored in your local IndexedDB in plain text. Never share
  your device without clearing the app's storage first.
- The token is scoped to `gist` only, so even if leaked, it can only
  read/write your Gists, not your repositories or account.
- The Gist is created as a **secret** Gist — only you and the people with
  the exact URL can see it. GitHub's search doesn't index secret Gists.

### Rate limits

5,000 requests/hour for authenticated users. One sync = 2 requests
(GET + PATCH). Not a concern for personal use.

---

## Data model

All records live in IndexedDB. The DB name is `chronocraft_db`, version 1.

| Store         | Record type      | Purpose                                       |
| ------------- | ---------------- | --------------------------------------------- |
| `entries`     | `TimelineEntry`  | Everything on the Timeline spine              |
| `notes`       | `Note`           | Standalone rich notes                         |
| `events`      | `CalendarEvent`  | Calendar events                               |
| `habits`      | `Habit`          | Habit definitions                             |
| `habit_logs`  | `HabitLog`       | Daily completion records                      |
| `lists`       | `CustomList`     | User-defined lists (projects, books, courses) |
| `list_items`  | `ListItem`       | Items inside lists                            |
| `custom_tabs` | `CustomFocusTab` | Custom Focus workspaces                       |
| `scratchpad`  | `ScratchpadCard` | Sticky notes on the Scratchpad tab            |
| `settings`    | `{ key, value }` | App settings as one JSON blob                 |

### The `entries` store

`TimelineEntry` is polymorphic. The `type` field discriminates:

- `"task"` — a task with a status (`pending` / `active` / `completed`)
- `"log"` — an immutable record of something that happened
- `"note"` — a note that lives on the Timeline
- `"event"` — an event that lives on the Timeline
- `"timeblock"` — a time block with a `timeBlock` object (start + end)

The `source` field tells you _where_ the entry came from. Filtering on
`source` is how focus-internal items (anchors, X-Active tasks) stay
inside the Focus view until they're completed:

```ts
// TimelineView receives entries pre-filtered by App.tsx
entries.filter(
  (e) =>
    e.source !== "focus-anchor" &&
    !(e.source === "focus-active" && e.status !== "completed"),
);
```

### The `notes` / `events` stores

Standalone `Note` and `CalendarEvent` records represent the "full"
versions of these items in the Notes and Events views. When a note or
event is created on the Timeline spine, it lives in `entries` instead —
and `App.tsx`'s `findLinkedEntry` helper bridges the two.

### Autosave

`DetailSheet` debounces saves by 500 ms. Each form implements `collect()`
returning a `Partial<...>` of its current state. The shell compares
snapshots and only fires `onSave*` if something changed. Closing the
sheet flushes any pending timer synchronously.

---

## Native builds

ChronoCraft packages to iOS and Android via Capacitor.

```bash
npm run build
npx cap sync
npx cap open ios      # or android
```

Native integrations:

- `@capacitor/keyboard` — adjusts layout when the soft keyboard opens
  (used in `TodayTab`, `TimelineView`, `CreateListModal`).
- `@capawesome/capacitor-android-edge-to-edge-support` + `@capacitor/core`
  `SystemBars` — sets status bar and nav bar colors based on the current
  theme (see `utils/nativeTheme.ts`).

Theme changes propagate to the native chrome automatically when
`applyNativeTheme("dark" | "light")` runs. Themes with a dark base
(Forest, Sepia, Nord, Tokyo, Cyberpunk) use dark chrome; Paper and Light
use light chrome.

---

## Development conventions

### Colors

**Always** use semantic tokens. If a color doesn't exist as a token,
either add one or ask yourself whether you need it. Raw palette classes
(`bg-slate-800`, `text-indigo-500`) are considered bugs.

Grep check before committing:

```bash
grep -rn "bg-slate-\|text-slate-\|border-slate-" src --include="*.tsx"
```

Should return nothing except inside `index.css` theme definitions.

### Component style

- Small components with a single responsibility.
- Props are interfaces, not `any`.
- No `forwardRef` unless the parent actually needs imperative handles.
- Memoize only what's measurably expensive. Default to simple.

### Mutations

Every write goes through `appDb.put` / `appDb.delete`, never directly to
`indexedDB`. `appDb` fires a `notify()` after every mutation, triggering
a `refreshData()` cycle in `App.tsx`. This is the only re-render
mechanism — no local state is "synced" from anywhere else.

### Timestamps

All dates are ISO strings (`new Date().toISOString()`).
Date keys for daily bucketing use `toLocalDateKey` from `utils/date.ts`
— never `toISOString().split("T")[0]`, which is UTC and will be off by a
day for users east of Greenwich near midnight.

### Naming

- `handle*` — event handlers
- `on*` — callback props
- `use*` — hooks
- `get*` — pure functions that compute values
- `is*` / `has*` — boolean helpers

---

## Adding a new theme

Three edits + one CSS block per theme.

**1. `types/index.ts`**

```ts
export type ThemeId =
  | "dark"
  | "light"
  | "forest"
  | "sepia"
  | "nord"
  | "tokyo"
  | "cyberpunk"
  | "paper"
  | "your-theme";
```

**2. `index.css`**

Add inside `@layer base`:

```css
.dark.theme-your-theme {
  --color-app: rgb(…);
  --color-surface: rgb(…);
  /* ...all ~20 tokens... */
  color-scheme: dark;
}
html:not(.dark).theme-your-theme {
  --color-app: rgb(…);
  /* ... */
  color-scheme: light;
}
```

**3. `App.tsx`**

Add to `THEME_DEFAULT_FLAVOR`, `THEME_CLASS`, and the
`classList.remove(...)` list.

**4. `components/ui/ThemePicker.tsx`**

Add one entry to `DARK_CARDS` and one to `LIGHT_CARDS` with:

- `id`, `flavor`
- `label` (short), `hint` (2-3 words)
- `Icon` from lucide-react
- `preview` — three hex colors for the mini swatch

That's it. Every component in the app instantly supports the new
theme; no component-level changes are needed.

### Theme design checklist

- [ ] All 20 tokens are defined.
- [ ] Text contrast: primary/secondary/muted on all three surfaces.
- [ ] `accent-fg` has correct contrast against `accent` (this is your
      button text color — measure it).
- [ ] All four semantic colors have visible but restrained tints at /10
      and /20 opacity.
- [ ] Both dark and light flavors defined.
- [ ] `color-scheme` set correctly (affects native form controls).
- [ ] Snapshot the app in the new theme on all six views and verify no
      invisible text.

---

## Adding a new view

Steps:

1. Add a new string to `ActiveView` in `types/index.ts`.
2. Create `views/YourView/index.tsx` that accepts a `props` interface
   matching the shape in `App.tsx`.
3. Wire it into `App.tsx`'s `<main>` conditional and into the Header's
   `viewOptions` array and Sidebar's nav list.
4. Add a `handleOpen...` handler in `App.tsx` if it needs context menu
   integration.
5. Add a card renderer for right-click + long-press (look at
   `EventsView` and `NotesView` for examples).

Skeleton:

```tsx
export interface YourViewProps {
  items: YourType[];
  onItemClick: (item: YourType) => void;
  onOpenContextMenu?: (item: YourType, pos: { x: number; y: number }) => void;
}

export const YourView: React.FC<YourViewProps> = ({
  items,
  onItemClick,
  onOpenContextMenu,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-soft bg-app/50 backdrop-blur-xs shrink-0">
        <h2 className="text-base font-bold text-primary">Your View</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {/* content */}
      </div>
    </div>
  );
};
```

The `flex-1 flex flex-col h-full overflow-hidden` wrapper on the outer
`div` + `flex-1 overflow-y-auto` on the inner content area is the
pattern every view in the app follows. Keep it consistent.

---

## Troubleshooting

### "Cannot read properties of undefined (reading 'toUpperCase')" in Timeline

A malformed record without a `type` field slipped into `entries`. This
usually happens after a partially failed migration or a manual
IndexedDB edit. The defensive guard in `TimelineEntryRow` prevents the
crash, but the record should be cleaned up:

1. DevTools → Application → IndexedDB → `chronocraft_db` → `entries`.
2. Find records without a valid `type`.
3. Delete them.

To prevent recurrence, every write path in `App.tsx` now guards against
`!entry.type` before spreading.

### "Cannot find name 'countTombstones'"

Missing import in `SettingsModal.tsx`:

```ts
import { countTombstones } from "../../services/gistSync";
```

### Theme classes don't apply

Tailwind v4 caches `@theme` tokens. After editing `index.css`, restart
the dev server (not just HMR). Also verify the classes are actually
generated: DevTools → Styles → search for `bg-surface`. If nothing
comes up, the token didn't parse — check for a stray semicolon or
missing brace in the `@theme` block.

### Sync fails with 404

The Gist was deleted manually on GitHub. Clear the "Gist ID" field in
Settings → Gist Sync, then click Push again to recreate. `pushToGist`
auto-recovers from this on the next attempt.

### Soft-keyboard covers the input on mobile

The `TodayTab` and `TimelineView` components both listen to
`Keyboard.addListener("keyboardWillShow", ...)` and apply bottom
padding. If you add a new input surface on mobile, replicate that
pattern or the input will hide behind the keyboard.

### Settings modal jumps back to Preferences

The modal's open-effect must depend only on `[isOpen, initialTab]`, not
on `settings`. Adding `settings` to the dep array causes the tab to
reset on every settings write. This was fixed by splitting the effect
in two — if it regresses, look for a stray `settings` in the deps.

### Deleted items reappear after sync

Two possibilities:

1. A device that hasn't synced in longer than the purge threshold is
   re-adding the record. Purge tombstones more conservatively.
2. A record was deleted directly in IndexedDB rather than through the
   UI. Bypassing `softDelete` skips the tombstone, so sync has no way
   to know the item is gone. Always delete through the app.

---

## License

Personal use. Attribution appreciated but not required.

---

## Credits

Design language inspired by Notion, Linear, Things, and Apple Notes.
Palettes from Nord (Arctic Ice Studio), Tokyo Night (enkia), Dracula
(Zeno Rocha), Rosé Pine (rosé pine collective), Catppuccin (catppuccin
org), Gruvbox (Pavel Pertsev), Monokai, Solarized (Ethan Schoonover),
and the Cyberpunk 2077 UI kit.

Built with care, on purpose, offline.
