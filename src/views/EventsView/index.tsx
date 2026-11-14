/**
 * ChronoCraft - Events View Component
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
import { CalendarEvent, TimelineEntry } from "../../types";
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

const EVENT_FILTER_GROUPS: FilterGroup[] = [
  {
    key: "category",
    label: "Category",
    icon: <CalendarDays className="w-3.5 h-3.5 text-muted" />,
    options: [
      {
        value: "all",
        label: "All Events",
        icon: <CalendarDays className="w-3.5 h-3.5 text-muted" />,
      },
      {
        value: "official",
        label: "Official",
        icon: <Building2 className="w-3.5 h-3.5 text-accent" />,
      },
      {
        value: "personal",
        label: "Personal",
        icon: <User className="w-3.5 h-3.5 text-danger" />,
      },
    ],
  },
  {
    key: "timeframe",
    label: "Timeframe",
    icon: <Clock className="w-3.5 h-3.5 text-info" />,
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
    icon: <ArrowUpDown className="w-3.5 h-3.5 text-muted" />,
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

  const [filterOptions, setFilterOptions] = useState<EventsFilterStorage>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
      return {
        sortBy: "date-asc",
        categoryFilter: "all",
        timeframeFilter: "all",
      };
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOptions));
    } catch (e) {
      console.error("Failed to save events filter options", e);
    }
  }, [filterOptions]);

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

      const evCategory = ev.category || "personal";
      if (
        filterOptions.categoryFilter !== "all" &&
        evCategory !== filterOptions.categoryFilter
      ) {
        return false;
      }

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
      {/* Header */}
      <div className="px-6 py-4 border-b border-soft bg-app/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-danger" />
            <h2 className="text-base font-bold text-primary">
              Events & Scheduled Milestones
            </h2>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Manage official and personal milestones with persistent control
            options.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-soft bg-surface text-xs text-primary focus:outline-none focus:border-accent w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="px-6 py-3 border-b border-soft bg-sunken/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
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
                  return {
                    ...p,
                    categoryFilter: value as EventCategoryFilter,
                  };
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

        <div className="text-xs font-mono text-muted tabular-nums">
          Events: {filteredEvents.length}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-soft text-xs text-muted">
              No events found matching your active options. Try adjusting the
              category or timeframe.
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
                    onOpenContextMenu?.(event, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 shadow-xs hover:shadow-md ${
                    isAchievement
                      ? "bg-warning/5 border-warning/40 hover:border-warning/70"
                      : isUnresolved
                      ? "bg-warning/[0.03] border-warning/30 hover:border-warning/60"
                      : isToday
                      ? "bg-danger/5 border-danger/30 hover:border-danger/60"
                      : "bg-raised border-soft hover:border-accent/40"
                  } ${isDone ? "opacity-50" : ""} ${
                    isMissed ? "opacity-40" : ""
                  }`}
                >
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
                        ? "bg-warning/10 border-warning/40 text-warning hover:border-warning/70"
                        : isDone
                        ? "bg-success/10 border-success/40 text-success hover:border-success/70"
                        : isMissed
                        ? "bg-danger/10 border-danger/40 text-danger hover:border-danger/70"
                        : isUnresolved
                        ? "bg-warning/10 border-warning/40 hover:border-warning/70"
                        : "bg-sunken border-soft hover:border-success/60"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono uppercase font-semibold ${
                        isAchievement
                          ? "text-warning/80"
                          : isDone
                          ? "text-success/80"
                          : isMissed
                          ? "text-danger/80"
                          : "text-muted"
                      }`}
                    >
                      {new Date(event.startAt).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </span>
                    <span
                      className={`text-base font-bold font-mono tabular-nums ${
                        isAchievement
                          ? "text-warning"
                          : isDone
                          ? "text-success"
                          : isMissed
                          ? "text-danger"
                          : "text-primary"
                      }`}
                    >
                      {new Date(event.startAt).getDate()}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold text-sm truncate transition-colors ${
                          isAchievement
                            ? "text-warning"
                            : isDone || isMissed
                            ? "line-through text-muted"
                            : "text-primary group-hover:text-danger"
                        }`}
                      >
                        {event.title ? (
                          event.title
                        ) : (
                          <span className="text-muted italic font-normal">
                            Untitled Event
                          </span>
                        )}
                      </h3>

                      {isAchievement && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-warning/15 text-warning border border-warning/30 inline-flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          Achievement
                        </span>
                      )}

                      {isUnresolved && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-warning/15 text-warning border border-warning/30 inline-flex items-center gap-1">
                          Unresolved
                        </span>
                      )}

                      {isMissed && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider bg-danger/15 text-danger border border-danger/30 inline-flex items-center gap-1">
                          Missed
                        </span>
                      )}

                      {isToday && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-danger/10 text-danger border border-danger/20">
                          Today
                        </span>
                      )}
                    </div>

                    {isAchievement && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-warning">
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
                        className="text-xs text-secondary leading-relaxed font-sans line-clamp-4"
                      />
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-secondary font-mono pt-1">
                      {!isAchievement && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase tracking-wider border ${
                            isOfficial
                              ? "bg-accent/10 text-accent border-accent/20"
                              : "bg-danger/10 text-danger border-danger/20"
                          }`}
                        >
                          {isOfficial ? "Official" : "Personal"}
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-info">
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
                          <span className="text-muted">·</span>
                          <span className="text-muted">
                            {event.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        onOpenContextMenu?.(event, {
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
                      }}
                      title="More options (or right click)"
                      className="p-1.5 text-muted hover:text-primary hover:bg-hover rounded-lg transition-colors cursor-pointer"
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
