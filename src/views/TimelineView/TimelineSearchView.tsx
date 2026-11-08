/**
 * ChronoCraft - Timeline Search Sub-View
 */

import React, { useMemo } from "react";
import { Search, SearchX, X } from "lucide-react";
import { TimelineEntry, TimelineDisplayMode } from "../../types";
import { TimelineEntryRow, ProcessedTimelineItem } from "./TimelineEntryRow";
import { toLocalDateKey } from "../../utils/date";
import { stripHtml } from "../../components/editors/RichTextEditor";

const getEntryAnchorIso = (e: TimelineEntry): string =>
  e.status === "completed" && e.completedAt
    ? e.completedAt
    : e.timeBlock?.startIso || e.scheduledAt || e.createdAt;

const getEntryDateKey = (e: TimelineEntry): string =>
  toLocalDateKey(new Date(getEntryAnchorIso(e)));

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

interface TimelineSearchViewProps {
  query: string;
  entries: TimelineEntry[];
  displayMode: TimelineDisplayMode;
  showEntryContent: boolean;
  onExit: () => void;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onUpdateEntryTitle?: (entryId: string, newTitle: string) => Promise<void>;
  onOpenNoteDetail?: (noteId: string) => void;
  onOpenEventDetail?: (eventId: string) => void;
  onOpenContextMenu?: (
    entry: TimelineEntry,
    pos: { x: number; y: number },
  ) => void;
  onOpenTimePicker?: (
    entryId: string,
    iso: string,
    position: { x: number; y: number },
  ) => void;
}

export const TimelineSearchView: React.FC<TimelineSearchViewProps> = ({
  query,
  entries,
  displayMode,
  showEntryContent,
  onExit,
  onToggleEntryStatus,
  onDeleteEntry,
  onUpdateEntryTitle,
  onOpenNoteDetail,
  onOpenEventDetail,
  onOpenContextMenu,
  onOpenTimePicker,
}) => {
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries.filter((e) => {
      const content =
        e.metadata?.notes ||
        (e.metadata as any)?.details ||
        (e as any).content ||
        "";
      const haystack = [
        e.title,
        content,
        stripHtml(content),
        e.tags.join(" "),
        e.type,
        e.source,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query]);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const e of matched) {
      const key = getEntryDateKey(e);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, list]) => {
        const items: ProcessedTimelineItem[] = [];
        const dayTimeBlocks = list.filter(
          (e) => e.type === "timeblock" && e.timeBlock,
        );
        for (const e of list) {
          if (e.type === "timeblock" && e.timeBlock) {
            items.push({
              id: `${e.id}_start`,
              originalEntry: e,
              sortTime: new Date(e.timeBlock.startIso).getTime(),
              isTimeBlockMarker: "start",
            });
            items.push({
              id: `${e.id}_end`,
              originalEntry: e,
              sortTime: new Date(e.timeBlock.endIso).getTime(),
              isTimeBlockMarker: "end",
            });
          } else {
            const t = new Date(getEntryAnchorIso(e)).getTime();
            items.push({
              id: e.id,
              originalEntry: e,
              sortTime: t,
              containedInBlock: dayTimeBlocks.find((tb) => {
                if (!tb.timeBlock) return false;
                const s = new Date(tb.timeBlock.startIso).getTime();
                const en = new Date(tb.timeBlock.endIso).getTime();
                return t >= s && t <= en && tb.id !== e.id;
              }),
            });
          }
        }
        return { dateKey, heading: formatDayHeading(dateKey), items };
      });
  }, [matched]);

  const total = matched.length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Search className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-mono text-accent">
            {total} {total === 1 ? "match" : "matches"} for{" "}
            <span className="font-bold">"{query.trim()}"</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          title="Exit search (Esc)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-accent hover:bg-accent/20 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span className="font-semibold">Close</span>
        </button>
      </div>

      {total === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-soft text-center text-xs text-muted">
          <SearchX className="w-8 h-8 mx-auto mb-2 text-muted" />
          <p className="font-semibold text-primary">
            No entries match "{query.trim()}"
          </p>
          <p className="mt-1 text-[11px]">
            Try a different keyword, or clear the search to return.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.dateKey} className="relative">
              <div className="sticky top-0 z-10 -mx-2 px-2 py-1.5 mb-3 bg-app/90 backdrop-blur-md border-b border-soft/70">
                <span className="text-[11px] font-mono uppercase tracking-wider text-secondary">
                  {g.heading}
                </span>
                <span className="ml-2 text-[10px] font-mono text-muted">
                  · {g.items.length}
                </span>
              </div>

              <div className="relative pl-1">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/40 via-soft to-transparent" />
                <div className="space-y-3">
                  {g.items.map((item) => (
                    <TimelineEntryRow
                      key={item.id}
                      item={item}
                      displayMode={displayMode}
                      showEntryContent={showEntryContent}
                      selectedDateStr={g.dateKey}
                      onToggleEntryStatus={onToggleEntryStatus}
                      onDeleteEntry={onDeleteEntry}
                      onUpdateEntryTitle={onUpdateEntryTitle}
                      onOpenNoteDetail={onOpenNoteDetail}
                      onOpenEventDetail={onOpenEventDetail}
                      onOpenContextMenu={onOpenContextMenu}
                      onOpenTimePicker={onOpenTimePicker}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
