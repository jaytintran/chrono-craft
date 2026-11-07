/**
 * ChronoCraft - Events View Component
 * Features an intuitive options choosing area with persistent filtering and sorting via localStorage,
 * Official vs Personal event categorization, and DetailSheet integration.
 */

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  Clock,
  Search,
  ArrowUpDown,
  Building2,
  User,
  MoreVertical,
  Trophy,
} from "lucide-react";
import { CalendarEvent, CustomList, TimelineEntry } from "../../types";
import { RichContent } from "../../components/editors/RichContent";
import {
  MultiGroupFilterPopover,
  FilterGroup,
} from "../../components/ui/MultiGroupFilterPopover";

import { stripHtml } from "../../components/editors/RichTextEditor";
import { toLocalDateKey } from "../../utils/date";
import { EventDatePickerModal } from "./EventDatePickerModal";

interface EventsViewProps {
  events: CalendarEvent[];
  timelineEvents: TimelineEntry[];
  onOpenCreateEvent: (prefillDate?: Date) => void;
  onOpenEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => Promise<void>;
  onResolveEvent: (
    id: string,
    outcome: "attended" | "missed" | "clear",
  ) => Promise<void>;
  onOpenContextMenu?: (
    event: CalendarEvent,
    pos: { x: number; y: number },
  ) => void;
}

type EventSortOption = "date-asc" | "date-desc" | "title-asc";
type EventCategoryFilter = "all" | "official" | "personal";
type EventTimeframeFilter = "upcoming" | "today" | "past" | "all";

interface EventsFilterStorage {
  sortBy: EventSortOption;
  categoryFilter: EventCategoryFilter;
  timeframeFilter: EventTimeframeFilter;
}

type CombinedCategoryTimeframe =
  `${EventCategoryFilter}:${EventTimeframeFilter}`;

const EVENT_FILTER_GROUPS: FilterGroup[] = [
  {
    key: "category",
    label: "Category",
    icon: <CalendarDays className="w-3.5 h-3.5 text-slate-400" />,
    options: [
      {
        value: "all",
        label: "All Events",
        icon: <CalendarDays className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "official",
        label: "Official",
        icon: <Building2 className="w-3.5 h-3.5 text-indigo-400" />,
      },
      {
        value: "personal",
        label: "Personal",
        icon: <User className="w-3.5 h-3.5 text-rose-400" />,
      },
    ],
  },
  {
    key: "timeframe",
    label: "Timeframe",
    icon: <Clock className="w-3.5 h-3.5 text-cyan-400" />,
    options: [
      { value: "all", label: "All Dates" },
      { value: "upcoming", label: "Upcoming" },
      { value: "today", label: "Today" },
      { value: "past", label: "Past" },
    ],
  },
  {
    key: "sort",
    label: "Sort",
    icon: <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />,
    options: [
      { value: "date-asc", label: "Date (Earliest First)" },
      { value: "date-desc", label: "Date (Latest First)" },
      { value: "title-asc", label: "Title (A – Z)" },
    ],
  },
];

const STORAGE_KEY = "chronocraft_events_filter_options";

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  timelineEvents,
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenContextMenu,
  onResolveEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Persistent Filter & Sort State from localStorage
  const [filterOptions, setFilterOptions] = useState<EventsFilterStorage>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        // fallback
      }
      return {
        sortBy: "date-asc",
        categoryFilter: "all",
        timeframeFilter: "all",
      };
    },
  );
  const [showAchievementsOnly, setShowAchievementsOnly] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOptions));
    } catch (e) {
      console.error("Failed to save events filter options to localStorage", e);
    }
  }, [filterOptions]);

  // Convert timeline event entries to CalendarEvent shape
  const syntheticTimelineEvents: CalendarEvent[] = timelineEvents.map((te) => ({
    id: `tl_${te.id}`,
    title: te.title,
    description: te.metadata?.notes || "(Captured via Timeline View spine)",
    startAt: te.scheduledAt || te.createdAt,
    endAt: te.metadata?.endAt,
    allDay: te.metadata?.allDay ?? false,
    category:
      te.metadata?.category ??
      (te.tags.includes("official") || te.tags.includes("work")
        ? "official"
        : "personal"),
    tags: te.tags,
    listIds: te.metadata?.listId ? [te.metadata.listId] : [],
    createdAt: te.createdAt,
  }));

  const allEvents = [...events, ...syntheticTimelineEvents];

  const now = new Date();
  const todayStr = toLocalDateKey(now);

  const filteredEvents = allEvents
    .filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(ev.description)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Achievements only show when the toggle is on; normal events hide while it's on
      if (showAchievementsOnly) {
        if (!ev.isAchievement) return false;
      } else {
        if (ev.isAchievement) return false;
      }

      // Category filter (official vs personal)
      const evCategory = ev.category || "personal";
      if (
        filterOptions.categoryFilter !== "all" &&
        evCategory !== filterOptions.categoryFilter
      ) {
        return false;
      }

      // Timeframe filter
      const eventDateStr = ev.startAt.split("T")[0];
      const isEventToday = eventDateStr === todayStr;
      const eventTime = new Date(ev.startAt).getTime();
      const isUpcoming = eventTime >= now.getTime() - 86400000;
      const isPast = eventTime < now.getTime() - 86400000 && !isEventToday;

      if (filterOptions.timeframeFilter === "today") return isEventToday;
      if (filterOptions.timeframeFilter === "upcoming") return isUpcoming;
      if (filterOptions.timeframeFilter === "past") return isPast;
      return true;
    })
    .sort((a, b) => {
      if (filterOptions.sortBy === "date-asc") {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      }
      if (filterOptions.sortBy === "date-desc") {
        return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
      }
      if (filterOptions.sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const formatEventTime = (
    startIso: string,
    endIso?: string,
    allDay?: boolean,
  ) => {
    if (allDay) return "All Day";
    const s = new Date(startIso);
    const startStr = s.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    if (!endIso) return startStr;
    const e = new Date(endIso);
    const endStr = e.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${startStr} – ${endStr}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B0F17]/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Events & Scheduled Milestones
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage official and personal milestones with persistent control
            options.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* + New Event Button */}
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>

          {/* Show Events Button */}
          <button
            type="button"
            onClick={() => setShowAchievementsOnly((v) => !v)}
            title={
              showAchievementsOnly
                ? "Show all events"
                : "Show achievements only"
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showAchievementsOnly
                ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/40"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
          </button>
        </div>
      </div>

      {/* Controlling Options Area (Persistent via localStorage) */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E131E] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category, Timeframe, Sorting Multi Selector */}
          <MultiGroupFilterPopover
            groups={EVENT_FILTER_GROUPS}
            selections={{
              category: filterOptions.categoryFilter,
              timeframe: filterOptions.timeframeFilter,
              sort: filterOptions.sortBy,
            }}
            defaults={{ category: "all", timeframe: "all" }}
            allLabel="Filters"
            onChange={(groupKey, value) => {
              setFilterOptions((p) => {
                if (groupKey === "category")
                  return { ...p, categoryFilter: value as EventCategoryFilter };
                if (groupKey === "timeframe")
                  return {
                    ...p,
                    timeframeFilter: value as EventTimeframeFilter,
                  };
                if (groupKey === "sort")
                  return { ...p, sortBy: value as EventSortOption };
                return p;
              });
            }}
          />
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-slate-400 tabular-nums">
          {showAchievementsOnly ? "Achievements" : "Events"}:{" "}
          {filteredEvents.length}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              {showAchievementsOnly
                ? "No achievements yet. Promote a log, event, or completed task via its context menu."
                : "No events found matching your active options. Try adjusting the category or timeframe."}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isToday = event.startAt.split("T")[0] === todayStr;
              const isOfficial = event.category === "official";
              const isAchievement = !!event.isAchievement;
              const achievedAt = event.startAt;
              const isDone = !!event.completedAt;
              const isMissed = !!event.missedAt;
              const isPast =
                new Date(event.startAt).getTime() < Date.now() && !isToday;
              const isUnresolved =
                isPast && !isDone && !isMissed && !isAchievement;

              return (
                <div
                  key={event.id}
                  onClick={() => onOpenEditEvent(event)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (onOpenContextMenu) {
                      onOpenContextMenu(event, { x: e.clientX, y: e.clientY });
                    }
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 shadow-xs hover:shadow-md ${
                    isAchievement
                      ? "bg-amber-500/5 dark:bg-[#1A1508] border-amber-500/40 hover:border-amber-500/70"
                      : isUnresolved
                        ? "bg-amber-500/[0.03] border-amber-500/30 hover:border-amber-500/60"
                        : isToday
                          ? "bg-rose-500/5 dark:bg-[#15121D] border-rose-500/30 hover:border-rose-500/60"
                          : "bg-white dark:bg-[#131926] border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40"
                  } ${isDone ? "opacity-50" : ""} ${isMissed ? "opacity-40" : ""}`}
                >
                  {/* Left Date Badge Box — doubles as the resolve button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDone || isMissed) onResolveEvent(event.id, "clear");
                      else onResolveEvent(event.id, "attended");
                    }}
                    title={
                      isDone
                        ? "Attended — click to clear"
                        : isMissed
                          ? "Missed — click to clear"
                          : "Click to mark as attended"
                    }
                    className={`flex flex-col items-center justify-center w-14 py-2 rounded-xl shrink-0 text-center border transition-colors cursor-pointer ${
                      isAchievement
                        ? "bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/40 text-amber-500 hover:border-amber-500/70"
                        : isDone
                          ? "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/40 text-emerald-400 hover:border-emerald-500/70"
                          : isMissed
                            ? "bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/40 text-rose-400 hover:border-rose-500/70"
                            : isUnresolved
                              ? "bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/40 hover:border-amber-500/70"
                              : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold ${
                        isAchievement
                          ? "text-amber-500/80"
                          : isDone
                            ? "text-emerald-500/80"
                            : isMissed
                              ? "text-rose-500/80"
                              : "text-slate-400"
                      }`}
                    >
                      {new Date(event.startAt).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                    <span
                      className={`text-base font-bold font-mono tabular-nums ${
                        isAchievement
                          ? "text-amber-500"
                          : isDone
                            ? "text-emerald-400"
                            : isMissed
                              ? "text-rose-400"
                              : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {new Date(event.startAt).getDate()}
                    </span>
                  </button>

                  {/* Center Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold text-sm truncate transition-colors ${
                          isAchievement
                            ? "text-amber-600 dark:text-amber-400"
                            : isDone || isMissed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : event.title
                                ? "text-slate-900 dark:text-slate-100 group-hover:text-rose-500"
                                : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {event.title || "Untitled Event"}
                      </h3>

                      {isAchievement && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          Achievement
                        </span>
                      )}

                      {isUnresolved && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1">
                          Unresolved
                        </span>
                      )}

                      {isMissed && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                          Missed
                        </span>
                      )}

                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Today
                        </span>
                      )}
                    </div>

                    {isAchievement && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                        <Trophy className="w-3 h-3" />
                        <span>
                          Achieved{" "}
                          {new Date(achievedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {event.description && (
                      <RichContent
                        content={event.description}
                        className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans"
                      />
                    )}

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                      {!isAchievement && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider ${
                            isOfficial
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isOfficial ? "Official" : "Personal"}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatEventTime(
                            event.startAt,
                            event.endAt,
                            event.allDay,
                          )}
                        </span>
                      </span>

                      {event.tags.length > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span className="text-slate-400">
                            {event.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions: 3-Dot Trigger + Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenContextMenu) {
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          onOpenContextMenu(event, {
                            x: rect.left,
                            y: rect.bottom + 4,
                          });
                        }
                      }}
                      title="More options (or right click)"
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pre-creation date picker */}
      <EventDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onPickDate={(date) => {
          setIsDatePickerOpen(false);
          onOpenCreateEvent(date);
        }}
      />
    </div>
  );
};
