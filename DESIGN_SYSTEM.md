# ChronoCraft Design System Specification

## 1. Aesthetic Vision & Brand Philosophy

ChronoCraft is engineered as a high-velocity, distraction-free executive productivity environment. The interface follows strict anti-AI-slop discipline:
- **Zero Static Pill Capsules**: Informational metadata (dates, times, counts, categories) is rendered as clean unboxed text with typographic separators (`·` or `/`), never trapped in candy badges or bordered pill chips.
- **Single-Elevation Depth**: Surfaces use flat planes separated by crisp hairline boundaries (`1px solid rgba(...)`) and deliberate whitespace margins rather than chaotic nested card shadows.
- **Tabular Precision**: Every numeric metric, timestamp, streak counter, and date badge utilizes monospace tabular figures (`font-mono tabular-nums`) to prevent layout jitter.

---

## 2. Color Palette & Dual-Theme Architecture

ChronoCraft implements a dual-theme architecture powered by Tailwind CSS v4 custom variant:
`@custom-variant dark (&:where(.dark, .dark *));`

### Obsidian Dark Mode (Default)
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| Canvas Background | `#0B0F17` | Neutral base, deep obsidian dark canvas |
| Surface Primary | `#131926` | Card background, active input containers |
| Surface Elevated | `#111724` | Slide-over drawer canvas, modal backgrounds |
| Hairline Border | `#1F293D` / `#1E293B` | Subtle container separation |
| Text Primary | `#F8FAFC` | Headings, titles, active labels |
| Text Secondary | `#94A3B8` | Body paragraphs, input hints |
| Text Muted | `#64748B` | Timestamps, counters, non-active affordances |
| Accent Primary | `#6366F1` | Interactive focus rings, active button fills |

### Slate Light Mode
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| Canvas Background | `#F8FAFC` | Clean soft-slate neutral canvas |
| Surface Primary | `#FFFFFF` | Card background, input fields |
| Surface Elevated | `#FFFFFF` | Modal dialogs, slide-over sheets |
| Hairline Border | `#E2E8F0` | Subtle hairline dividers |
| Text Primary | `#0F172A` | Headings, active values |
| Text Secondary | `#475569` | Body prose |
| Text Muted | `#94A3B8` | Microcopy, timestamps |
| Accent Primary | `#4F46E5` | Active states and primary actions |

---

## 3. Typography & Hierarchy

- **Display & Section Titles**: `Plus Jakarta Sans` (font-semibold / font-bold), tracking tight, `text-wrap: balance`.
- **Prose & Microcopy**: `Plus Jakarta Sans` (font-normal / font-medium, 13px–15px, line-height 1.5).
- **Data, Code & Telemetry**: `JetBrains Mono` (`tabular-nums font-mono`). Used for:
  - Timeline timestamps (`10:45 AM`)
  - Habit streak counters (`5d`)
  - Detected NLP chip labels
  - Date picker representations

---

## 4. Component Architecture Standards

### A. Master NLP Input Bar & Sticky Bottom Canvas
- Fixed/sticky at the bottom of the Timeline canvas (`z-20`, backdrop blur, hairline top border).
- Prefix type-cycler button: cycles through `/task`, `/log`, `/note`, `/event`, and `/timeblock` with color-coded Lucide icons.
- Real-time token badge strip: renders dynamic badges below input as recognizable syntax patterns are typed (`at 3pm`, `tomorrow`, `!high`, `#tag`).
- Strict Time Block Syntax Helper: when Time Block is active, enforces bracket pattern (`<from 1pm to 3pm>`, `<for 2h30m>`, or `<4:30pm>`) and displays live syntax guidance.

### B. Timeline Spine, Pierced Icons & Density Modes
- Continuous vertical stroke (`2px width`) traveling top-to-bottom.
- Centered Lucide icon containers on the spine with tactile icon-only check-off logic.
- Density Modes:
  - **Default Mode**: Full horizontal cards with pierced icon nodes (44px) and comprehensive turnaround telemetry.
  - **Minimal Mode**: High-density two-line rows with compact spine nodes (28px), title and timestamp on line 1, and ultra-quiet metadata chips on line 2.
- **Time Block Dual-Boundary Wrapping**:
  - Start Marker: `[Start Time] ─── Title (Block Start)`
  - Active Enclosing Span: Violet-tinted spine stroke enclosing intermediate tasks/logs/events.
  - End Marker: `[End Time] ─── Title (Block End · Duration: Xh Ym)`

### C. Habit Matrix Grid
- Dense data grid with sticky habit title column and 7 day-of-week check cells.
- Completed cells fill with the habit's custom color accent and a white checkmark.
- Interactive click target opens the specialized Habit DetailSheet with streak telemetry and custom schedule cadence.

### D. Polymorphic DetailSheet
- Slide-over drawer with backdrop blur (`z-50`).
- Dismissible via Escape key, close icon, or backdrop click.
- Dynamically switches form controls based on entity type (`Note`, `Event` with Official/Personal categorization, or `Habit`).

### E. Universal Context Menu (Desktop Floating Popover & Mobile Bottom Sheet)
- **Desktop**: Right-click anywhere on an entry card or left-click dedicated 3-dot icon triggers floating popover at cursor coordinates with collision boundaries.
- **Mobile**: 500ms tap-and-hold (`useLongPress`) with tactile pulse animation and haptic vibration (`navigator.vibrate`) triggers bottom slide-up action sheet.
- **Action Suite**: Edit Details, Duplicate Item, Reschedule (Today, Tomorrow, +2 Days), Priority Cycle (!HIGH, NORMAL, LOW), Add #Tag, and Delete.

### F. Timeline Header Scrubber & Custom Calendar Dropdown
- Central date scrubber button: `< [ Today, DD/MM ▾ ] >` (or `<Weekday>, DD/MM`, with year only if different year).
- Clicking reveals self-contained custom calendar dropdown: month navigation, 7-column day grid, active date outline, and a 1-click "Jump to Today" shortcut.

### G. Lists View: 5-Status Lifecycle & Header Collection Metrics
- **No Self-Progress Bar**: Lists serve as containers for tracking sub-items rather than themselves; artificial progress bars are replaced with collection-level metrics.
- **Collection Status Breakdown**: Header card displays real-time counts across the 5 lifecycle statuses (`Inbox`, `In Progress`, `Completed`, `Dropped`, `Maybe Later`) with zero-pill tabular numerals and interactive filtering.
- **1-Click Status Popover**: Leftmost entry icon opens `StatusPickerPopover` for direct assignment across all 5 statuses without multi-click cycling.
- **Desktop Navigation Cleanup**: Horizontal list tab bar is hidden on desktop (`hidden md:hidden`) where sidebar list selection already exists, and rendered exclusively on mobile (`flex md:hidden`).
