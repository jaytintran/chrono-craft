import React from "react";
import {
  Anchor,
  Zap,
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  Sliders,
  MoreVertical,
} from "lucide-react";
import { AppSettings, TimelineEntry } from "../../types";
import { NLPInputBar } from "../../components/NLPInputBar";

interface TodayTabProps {
  anchorEntries: TimelineEntry[];
  activeEntries: TimelineEntry[];
  completedEntries: TimelineEntry[];
  settings: AppSettings;
  isMobile: boolean;
  onAddEntry: (entry: Partial<TimelineEntry>) => Promise<void>;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onOpenSettings: () => void;
  onOpenContextMenu?: (item: any, pos: { x: number; y: number }) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  anchorEntries,
  activeEntries,
  completedEntries,
  settings,
  isMobile,
  onAddEntry,
  onToggleEntryStatus,
  onDeleteEntry,
  onOpenSettings,
  onOpenContextMenu,
}) => {
  const isEngineAtCapacity = activeEntries.length >= settings.xActiveLimit;

  const formatCompletedTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatScheduledTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* ---- Section 1: Anchors ---- */}
      {/* Section 1: Anchors (Scheduled Entries) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Anchors | Daily Schedule
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {anchorEntries.length} Scheduled
          </span>
        </div>

        {/* Dedicated NLP Input Bar for Anchors */}
        <NLPInputBar
          placeholder="Join the board meeting at 2pm..."
          defaultType="event"
          showTypeSwitcher={false}
          buttonLabel="Schedule Anchor"
          compact={isMobile}
          onSubmit={(parsed) => {
            onAddEntry({
              type: parsed.type || "event",
              title: parsed.title,
              scheduledAt: parsed.scheduledAt || new Date().toISOString(),
              status: "pending",
              source: "focus-anchor",
              tags: parsed.tags,
            });
          }}
        />

        {/* Anchors List */}
        <div className="space-y-2 mt-2">
          {anchorEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
              No hard schedule anchors set for today. Add key meetings or fixed
              timeblocks above.
            </div>
          ) : (
            anchorEntries.map((anchor) => (
              <div
                key={anchor.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (onOpenContextMenu) {
                    onOpenContextMenu(anchor, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(anchor.id)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {anchor.title}
                    </div>
                    {anchor.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatScheduledTime(anchor.scheduledAt)}</span>
                        {anchor.tags.length > 0 && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">
                              {anchor.tags.map((t) => `#${t}`).join(" ")}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenContextMenu) {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        onOpenContextMenu(anchor, {
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(anchor.id)}
                    className="opacity-60 md:opacity-0 md:group-hover:opacity-100
 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* ---- Section 2: X-Active Engine ---- */}
      {/* Section 2: X-Active Engine (Immediate Tasks) */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {settings.xActiveLimit}-Active Max Tasks
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[0.5rem] md:text-[0.6rem] font-mono font-bold tabular-nums px-2 py-0.5 rounded-md ${
                isEngineAtCapacity
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              }`}
            >
              {activeEntries.length} / {settings.xActiveLimit} ACTIVE
            </span>
            <button
              type="button"
              onClick={onOpenSettings}
              title="Change X-Active limit in settings"
              className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dedicated NLP Input Bar for X-Active Tasks */}
        <NLPInputBar
          placeholder={
            isEngineAtCapacity
              ? `Capacity full (${settings.xActiveLimit}/${settings.xActiveLimit})! Complete a task or raise limit in settings.`
              : "Add immediate task to active queue..."
          }
          defaultType="task"
          showTypeSwitcher={false}
          compact={isMobile}
          buttonLabel="Engage Task"
          onSubmit={(parsed) => {
            if (isEngineAtCapacity) {
              alert(
                `X-Active Engine is at full capacity (${settings.xActiveLimit} tasks). Complete an active task or raise the limit in settings.`,
              );
              return;
            }
            onAddEntry({
              type: "task",
              title: parsed.title,
              scheduledAt: parsed.scheduledAt,
              status: "active",
              source: "focus-active",
              tags: parsed.tags,
            });
          }}
        />

        {/* Active Tasks List */}
        <div className="space-y-2 mt-2">
          {activeEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
              No active tasks currently engaged. Populate your immediate focus
              queue above.
            </div>
          ) : (
            activeEntries.map((task, idx) => (
              <div
                key={task.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (onOpenContextMenu) {
                    onOpenContextMenu(task, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(task.id)}
                    title="Click to complete task"
                    className="text-slate-400 hover:text-emerald-500 hover:scale-110 transition-all shrink-0 cursor-pointer p-0.5"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {task.title}
                      </span>
                    </div>
                    {task.tags.length > 0 && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {task.tags.map((t) => `#${t}`).join(" ")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenContextMenu) {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        onOpenContextMenu(task, {
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(task.id)}
                    className="opacity-60 md:opacity-0 md:group-hover:opacity-100
 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* ---- Section 3: Completed ---- */}
      {/* Section 3: Completed Entries */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Completed (Anchors & Active Work)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            {completedEntries.length} Done Today
          </span>
        </div>

        {/* Dedicated NLP Input Bar to directly log completed work */}
        <NLPInputBar
          placeholder="Log completed actions here for gratitude..."
          defaultType="log"
          showTypeSwitcher={false}
          compact={isMobile}
          buttonLabel="Log Done"
          onSubmit={(parsed) => {
            const now = new Date().toISOString();
            onAddEntry({
              type: "log",
              title: parsed.title,
              scheduledAt: parsed.scheduledAt,
              createdAt: now,
              completedAt: now,
              status: "completed",
              source: "focus-active",
              tags: parsed.tags,
            });
          }}
        />

        {/* Completed List */}
        <div className="space-y-2 mt-2">
          {completedEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
              Checked-off tasks and anchors will appear here with completed
              timestamps and stream to your Timeline spine.
            </div>
          ) : (
            completedEntries.map((done) => (
              <div
                key={done.id}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#101520] border border-slate-200 dark:border-slate-800/60 opacity-80 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(done.id)}
                    title="Click to restore to active queue"
                    className="text-emerald-500 hover:text-slate-400 transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm text-slate-500 line-through truncate block">
                      {done.title}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      Completed at {formatCompletedTime(done.completedAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(done.id)}
                  className="opacity-60 md:opacity-0 md:group-hover:opacity-100
 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>{" "}
    </div>
  );
};
