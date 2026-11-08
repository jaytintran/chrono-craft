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
import { Keyboard } from "@capacitor/keyboard";

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
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    let showHandle: { remove: () => void } | undefined;
    let hideHandle: { remove: () => void } | undefined;

    Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardHeight(info.keyboardHeight);
    }).then((h) => (showHandle = h));

    Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    }).then((h) => (hideHandle = h));

    return () => {
      showHandle?.remove();
      hideHandle?.remove();
    };
  }, []);

  const isEngineAtCapacity = activeEntries.length >= settings.xActiveLimit;

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 animate-fadeIn"
      style={
        keyboardHeight > 0
          ? { paddingBottom: `${keyboardHeight + 24}px` }
          : undefined
      }
    >
      {/* Anchors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-info" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Anchors | Daily Schedule
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted">
            {anchorEntries.length} Scheduled
          </span>
        </div>

        <NLPInputBar
          placeholder='e.g. "Standup in 30 mins", "Board meeting at 2pm", "Yoga at 6pm"'
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

        <div className="space-y-2 mt-2">
          {anchorEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-soft text-center text-xs text-muted">
              No hard schedule anchors set for today. Add key meetings or fixed
              timeblocks above.
            </div>
          ) : (
            anchorEntries.map((anchor) => (
              <div
                key={anchor.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenContextMenu?.(anchor, {
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-raised border border-soft hover:border-info/40 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(anchor.id)}
                    className="text-muted hover:text-success transition-colors shrink-0 cursor-pointer"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">
                      {anchor.title}
                    </div>
                    {anchor.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-info mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(anchor.scheduledAt)}</span>
                        {anchor.tags.length > 0 && (
                          <>
                            <span className="text-muted">·</span>
                            <span className="text-secondary">
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
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      onOpenContextMenu?.(anchor, {
                        x: rect.left,
                        y: rect.bottom + 4,
                      });
                    }}
                    className="p-1 text-muted hover:text-primary transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(anchor.id)}
                    className="opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-muted hover:text-danger transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* X-Active */}
      <div className="space-y-3 pt-4 border-t border-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              {settings.xActiveLimit}-Active Max Tasks
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[0.5rem] md:text-[0.6rem] font-mono font-bold tabular-nums px-2 py-0.5 rounded-md border ${
                isEngineAtCapacity
                  ? "bg-danger/10 text-danger border-danger/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              {activeEntries.length} / {settings.xActiveLimit} ACTIVE
            </span>
            <button
              type="button"
              onClick={onOpenSettings}
              title="Change X-Active limit in settings"
              className="p-1 text-muted hover:text-accent transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

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

        <div className="space-y-2 mt-2">
          {activeEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-soft text-center text-xs text-muted">
              No active tasks currently engaged. Populate your immediate focus
              queue above.
            </div>
          ) : (
            activeEntries.map((task) => (
              <div
                key={task.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenContextMenu?.(task, {
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-raised border border-soft hover:border-accent/40 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(task.id)}
                    title="Click to complete task"
                    className="text-muted hover:text-success hover:scale-110 transition-all shrink-0 cursor-pointer p-0.5"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-primary truncate block">
                      {task.title}
                    </span>
                    {task.tags.length > 0 && (
                      <div className="text-xs text-secondary mt-0.5">
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
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      onOpenContextMenu?.(task, {
                        x: rect.left,
                        y: rect.bottom + 4,
                      });
                    }}
                    className="p-1 text-muted hover:text-primary transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteEntry(task.id)}
                    className="opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-muted hover:text-danger transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed */}
      <div className="space-y-3 pt-4 border-t border-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Completed (Anchors & Active Work)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-success">
            {completedEntries.length} Done Today
          </span>
        </div>

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

        <div className="space-y-2 mt-2">
          {completedEntries.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-soft text-center text-xs text-muted">
              Checked-off tasks and anchors will appear here with completed
              timestamps and stream to your Timeline spine.
            </div>
          ) : (
            completedEntries.map((done) => (
              <div
                key={done.id}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-sunken border border-soft opacity-80 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleEntryStatus(done.id)}
                    title="Click to restore to active queue"
                    className="text-success hover:text-muted transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm text-muted line-through truncate block">
                      {done.title}
                    </span>
                    <span className="text-[11px] font-mono text-success mt-0.5 block">
                      Completed at {formatTime(done.completedAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(done.id)}
                  className="opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-muted hover:text-danger transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
