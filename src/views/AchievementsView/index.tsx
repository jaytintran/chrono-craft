import React, { useMemo, useRef, useState, useEffect } from "react";
import { Trophy, CalendarRange, Layers, SearchX } from "lucide-react";
import { NLPInputBar } from "@/components/NLPInputBar";
import {
  AchievementItem,
  SourceFilter,
  TimeFilter,
  applyFilters,
  buildAchievements,
  groupByDay,
} from "./helpers";
import { AchievementRow } from "./AchievementRow";
import { FilterSelect } from "@/components/ui/FilterSelect";

import { CalendarEvent, ListItem, TimelineEntry } from "../../types";

interface AchievementsViewProps {
  listItems: ListItem[];
  events: CalendarEvent[];
  entries: TimelineEntry[];
  onAddAchievement: (entry: Partial<TimelineEntry>) => Promise<void>;
  onOpenDetail: (item: AchievementItem) => void;
  onOpenContextMenu?: (
    item: AchievementItem,
    pos: { x: number; y: number },
  ) => void;
}

const TIME_CHIPS: { id: TimeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const SOURCE_CHIPS: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "All Sources" },
  { id: "list", label: "Lists" },
  { id: "event", label: "Events" },
  { id: "log", label: "Logs" },
  { id: "focus", label: "Focus" },
];

const formatDayHeading = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isSameYear = date.getFullYear() === today.getFullYear();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  if (isToday) return `Today, ${dd}/${mm}`;
  return isSameYear
    ? `${weekday}, ${dd}/${mm}`
    : `${weekday}, ${dd}/${mm}/${y}`;
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  listItems,
  events,
  entries,
  onAddAchievement,
  onOpenDetail,
  onOpenContextMenu,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const allAchievements = useMemo(
    () => buildAchievements({ listItems, events, entries }),
    [listItems, events, entries],
  );

  const filtered = useMemo(
    () => applyFilters(allAchievements, timeFilter, sourceFilter),
    [allAchievements, timeFilter, sourceFilter],
  );

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-soft bg-app/70 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between gap-4 z-30">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            <h2 className="text-base font-bold text-primary">Achievements</h2>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Moments worth remembering — curated milestones across your
            workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted tabular-nums">
            {filtered.length} total
          </span>
        </div>
      </div>

      {/* Filter row */}
      <div className="px-6 py-2.5 border-b border-soft bg-sunken/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <FilterSelect
            icon={<CalendarRange className="w-3.5 h-3.5 text-muted" />}
            value={timeFilter}
            active={timeFilter !== "all"}
            onChange={(v) => setTimeFilter(v as TimeFilter)}
            options={TIME_CHIPS.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
          />

          <FilterSelect
            icon={<Layers className="w-3.5 h-3.5 text-muted" />}
            value={sourceFilter}
            active={sourceFilter !== "all"}
            onChange={(v) => setSourceFilter(v as SourceFilter)}
            options={SOURCE_CHIPS.map((c) => ({
              value: c.id,
              label: c.label,
            }))}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pt-6 pb-36">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-soft bg-raised/40">
              <SearchX className="w-8 h-8 mx-auto mb-2 text-muted" />
              <p className="font-semibold text-primary text-sm">
                No achievements yet.
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Complete a List item, mark an Event as achievement, or open any
                entry's ⋮ menu and choose Mark as Achievement.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <section key={group.dateKey} className="relative">
                  <div className="z-10 -mx-2 px-2 py-1.5 mb-3 bg-app/90 backdrop-blur-md border-b border-soft/70">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
                      {formatDayHeading(group.dateKey)}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-muted">
                      · {group.items.length}
                    </span>
                  </div>

                  <div className="relative pl-1">
                    {/* <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-warning/40 via-soft to-transparent" /> */}
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <AchievementRow
                          key={item.id}
                          item={item}
                          onOpen={onOpenDetail}
                          onOpenContextMenu={onOpenContextMenu}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky input bar */}
      <div className="shrink-0 px-4 md:px-8 py-3.5 bg-app/95 backdrop-blur-md border-t border-soft shadow-xl">
        <div className="max-w-6xl mx-auto">
          <NLPInputBar
            placeholder='Record an achievement... e.g. "Shipped the new index at 3pm #core"'
            defaultType="log"
            showTypeSwitcher={true}
            allowTimeBlock={false}
            buttonLabel="Add Achievement"
            onSubmit={(parsed) => {
              const now = new Date().toISOString();
              // Achievements are, by definition, done things. Any task
              // created here is immediately completed so it satisfies the
              // same rule the ContextMenu uses ("only completed tasks can
              // be achievements").
              onAddAchievement({
                type: parsed.type,
                title: parsed.title,
                scheduledAt: parsed.scheduledAt,
                createdAt: now,
                completedAt: now,
                status: "completed",
                source: "timeline",
                tags: parsed.tags,
                isAchievement: true,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};
