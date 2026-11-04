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
  Folder,
  Trash2,
  Search,
  ArrowUpDown,
  Building2,
  User,
  RotateCcw,
  MoreVertical,
} from "lucide-react";
import { CalendarEvent, CustomList, TimelineEntry } from "../types";
import { RichContent } from "../components/RichContent";
import { FilterSelect } from "../components/FilterSelect";
import { stripHtml } from "../components/RichTextEditor";

interface EventsViewProps {
  events: CalendarEvent[];
  timelineEvents: TimelineEntry[];
  lists: CustomList[];
  onOpenCreateEvent: () => void;
  onOpenEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => Promise<void>;
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
  selectedListId: string | null;
}

const STORAGE_KEY = "chronocraft_events_filter_options";

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  timelineEvents,
  lists,
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenContextMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

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
        timeframeFilter: "upcoming",
        selectedListId: null,
      };
    },
  );

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
  const todayStr = now.toISOString().split("T")[0];

  const filteredEvents = allEvents
    .filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stripHtml(ev.description)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter (official vs personal)
      const evCategory = ev.category || "personal";
      if (
        filterOptions.categoryFilter !== "all" &&
        evCategory !== filterOptions.categoryFilter
      ) {
        return false;
      }

      // List filter
      if (
        filterOptions.selectedListId &&
        !ev.listIds.includes(filterOptions.selectedListId)
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

  const getListName = (id: string) => {
    return lists.find((l) => l.id === id)?.name || "List";
  };

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

  const handleResetFilters = () => {
    setFilterOptions({
      sortBy: "date-asc",
      categoryFilter: "all",
      timeframeFilter: "upcoming",
      selectedListId: null,
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filterOptions.categoryFilter !== "all" ||
    filterOptions.timeframeFilter !== "upcoming" ||
    filterOptions.selectedListId !== null ||
    searchQuery.trim().length > 0;

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
            onClick={onOpenCreateEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Controlling Options Area (Persistent via localStorage) */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E131E] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter Selector: Official vs Personal vs All */}
          <FilterSelect
            icon={
              filterOptions.categoryFilter === "official" ? (
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              ) : filterOptions.categoryFilter === "personal" ? (
                <User className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              )
            }
            value={filterOptions.categoryFilter}
            active={filterOptions.categoryFilter !== "all"}
            onChange={(v) =>
              setFilterOptions((p) => ({
                ...p,
                categoryFilter: v as EventCategoryFilter,
              }))
            }
            options={[
              { value: "all", label: "All Events" },
              { value: "official", label: "Official Events" },
              { value: "personal", label: "Personal Events" },
            ]}
          />

          {/* Timeframe Selector */}
          <FilterSelect
            icon={<Clock className="w-3.5 h-3.5 text-cyan-400" />}
            value={filterOptions.timeframeFilter}
            onChange={(v) =>
              setFilterOptions((p) => ({
                ...p,
                timeframeFilter: v as EventTimeframeFilter,
              }))
            }
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "today", label: "Today Only" },
              { value: "past", label: "Past Events" },
              { value: "all", label: "All Dates" },
            ]}
          />

          {/* Sort Selector */}
          <FilterSelect
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
            value={filterOptions.sortBy}
            onChange={(v) =>
              setFilterOptions((p) => ({ ...p, sortBy: v as EventSortOption }))
            }
            options={[
              { value: "date-asc", label: "Date (Earliest First)" },
              { value: "date-desc", label: "Date (Latest First)" },
              { value: "title-asc", label: "Title (A – Z)" },
            ]}
          />

          {/* List Selector Dropdown */}
          <FilterSelect
            icon={<Folder className="w-3.5 h-3.5 text-indigo-400" />}
            value={filterOptions.selectedListId || ""}
            active={!!filterOptions.selectedListId}
            onChange={(v) =>
              setFilterOptions((p) => ({ ...p, selectedListId: v || null }))
            }
            options={[
              { value: "", label: "All Lists" },
              ...lists.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-slate-400 tabular-nums">
          Showing {filteredEvents.length} of {allEvents.length} events
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No events found matching your active options. Try adjusting the
              category or timeframe.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isToday = event.startAt.split("T")[0] === todayStr;
              const isOfficial = event.category === "official";

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
                    isToday
                      ? "bg-rose-500/5 dark:bg-[#15121D] border-rose-500/30 hover:border-rose-500/60"
                      : "bg-white dark:bg-[#131926] border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40"
                  }`}
                >
                  {/* Left Date Badge Box */}
                  <div className="flex flex-col items-center justify-center w-14 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 text-center">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      {new Date(event.startAt).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                    <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {new Date(event.startAt).getDate()}
                    </span>
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-500 transition-colors truncate">
                        {event.title}
                      </h3>

                      {/* Official vs Personal badge */}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider ${
                          isOfficial
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isOfficial ? "Official" : "Personal"}
                      </span>

                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          TODAY
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <RichContent
                        content={event.description}
                        className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans"
                      />
                    )}

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
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

                      {event.listIds.length > 0 && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">
                            ·
                          </span>
                          <span className="flex items-center gap-1 text-indigo-400">
                            <Folder className="w-3 h-3" />
                            {getListName(event.listIds[0])}
                          </span>
                        </>
                      )}

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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
