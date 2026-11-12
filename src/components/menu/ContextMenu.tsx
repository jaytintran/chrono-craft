/**
 * ChronoCraft - Universal Context Menu
 * Desktop: floating popover. Mobile: bottom action sheet.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Edit3,
  Copy,
  Calendar,
  Tag,
  Trash2,
  X,
  Trophy,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import { TimelineEntry } from "@/types";
import { TagEditorPanel } from "./TagEditorPanel";

export interface ContextMenuTarget {
  item: TimelineEntry | any;
  type: "timeline" | "note" | "event" | "focus" | "list";
}

interface ContextMenuProps {
  target: ContextMenuTarget | null;
  position: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDuplicate: (item: any) => void;
  onReschedule: (item: any, date: Date) => void;
  onAddTag: (item: any, tag: string) => void;
  onDelete: (item: any) => void;
  onRemoveTag?: (item: any, tag: string) => void;
  onMarkAchievement?: (item: any) => void;
  onResolveEvent?: (
    id: string,
    outcome: "attended" | "missed" | "clear",
  ) => void;
  onSetTags?: (item: any, tags: string[]) => void;
  availableTags?: string[];
}

type Panel = "actions" | "tags";

const ICON_COLOR = {
  neutral: "text-muted",
  achievement: "text-warning",
  attended: "text-success",
  missed: "text-danger",
  danger: "text-danger",
} as const;

export const ContextMenu: React.FC<ContextMenuProps> = ({
  target,
  position,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onReschedule,
  onAddTag,
  onDelete,
  onRemoveTag,
  onMarkAchievement,
  onResolveEvent,
  onSetTags,
  availableTags = [],
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [panel, setPanel] = useState<Panel>("actions");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsRescheduleOpen(false);
      setTagInput("");
      setCurrentTags([]);
      setPanel("actions");
    } else if (target?.item) {
      setCurrentTags(target.item.tags || []);
      const next = target.item;
      const nextReschedulable =
        next.startAt !== undefined ||
        (next.type !== undefined &&
          next.source !== undefined &&
          next.status !== "completed" &&
          next.type !== "log" &&
          !next.isAchievement);
      if (!nextReschedulable) setIsRescheduleOpen(false);
    }
  }, [isOpen, target]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panel !== "actions") setPanel("actions");
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, panel, onClose]);

  if (!isOpen || !target) return null;

  const item = target.item;
  const itemTitle = item.title || "Untitled Item";
  const canBeAchievement =
    item.type === "log" ||
    item.type === "event" ||
    (item.type === "task" && item.status === "completed");
  const isEventItem = item.startAt !== undefined;
  const evDone = isEventItem && !!item.completedAt;
  const evMissed = isEventItem && !!item.missedAt;

  const canReschedule = (() => {
    if (item.startAt !== undefined) return true;
    if (item.type !== undefined && item.source !== undefined) {
      if (item.status === "completed") return false;
      if (item.type === "log") return false;
      if (item.isAchievement) return false;
      return true;
    }
    return false;
  })();

  const closeAndRun = (fn: () => void) => {
    fn();
    onClose();
  };

  const handleDelete = () => {
    closeAndRun(() => onDelete(item));
  };

  const rescheduleShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    closeAndRun(() => onReschedule(item, d));
  };

  const commitTags = (next: string[]) => {
    setCurrentTags(next);
    if (onSetTags) {
      onSetTags(item, next);
    } else {
      const added = next.filter((t) => !currentTags.includes(t));
      const removed = currentTags.filter((t) => !next.includes(t));
      added.forEach((t) => onAddTag(item, t));
      removed.forEach((t) => onRemoveTag?.(item, t));
    }
  };

  const toggleTag = (tag: string) => {
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    commitTags(next);
  };

  const createTag = (tag: string) => {
    if (currentTags.includes(tag)) return;
    commitTags([...currentTags, tag]);
  };

  // Kept for API completeness; unused when using the dedicated tag panel
  void tagInput;
  void setTagInput;

  const getDesktopStyle = (): React.CSSProperties => {
    if (!position) return { top: "50%", left: "50%" };
    const w = panel === "tags" ? 300 : 224;
    const h = panel === "tags" ? 380 : 340;
    const pad = 12;
    let x = Math.min(position.x, window.innerWidth - w - pad);
    let y = Math.min(position.y, window.innerHeight - h - pad);
    return { top: `${Math.max(pad, y)}px`, left: `${Math.max(pad, x)}px` };
  };

  const renderActionsDesktop = () => (
    <>
      <div className="px-3 py-1.5 border-b border-soft mb-1">
        <span className="font-semibold text-primary truncate block text-[11px]">
          {itemTitle}
        </span>
      </div>

      <button
        type="button"
        onClick={() => closeAndRun(() => onEdit(item))}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
      >
        <Edit3 className="w-3.5 h-3.5 text-accent" />
        <span>Edit Details</span>
      </button>

      {canBeAchievement && onMarkAchievement && (
        <button
          type="button"
          onClick={() => closeAndRun(() => onMarkAchievement(item))}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
        >
          <Trophy className="w-3.5 h-3.5 text-warning" />
          <span>Mark as Achievement</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => closeAndRun(() => onDuplicate(item))}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
      >
        <Copy className="w-3.5 h-3.5 text-info" />
        <span>Duplicate</span>
      </button>

      {isEventItem && onResolveEvent && (
        <>
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evDone ? "clear" : "attended"),
              )
            }
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{evDone ? "Mark as not attended" : "Mark as attended"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evMissed ? "clear" : "missed"),
              )
            }
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
          >
            <MinusCircle className="w-3.5 h-3.5 text-danger" />
            <span>{evMissed ? "Clear missed status" : "Mark as missed"}</span>
          </button>
        </>
      )}

      {canReschedule && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRescheduleOpen(!isRescheduleOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-success" />
              <span>Reschedule</span>
            </div>
            <span className="text-[10px] text-muted">›</span>
          </button>

          {isRescheduleOpen && (
            <div className="p-1.5 mt-1 bg-sunken rounded-xl border border-soft space-y-1 animate-fadeIn">
              {[
                { label: "Today", days: 0 },
                { label: "Tomorrow", days: 1 },
                { label: "In 2 Days", days: 2 },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => rescheduleShortcut(o.days)}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-secondary hover:bg-accent hover:text-accent-fg transition-colors"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPanel("tags")}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-hover transition-colors cursor-pointer text-secondary font-medium"
      >
        <div className="flex items-center gap-2.5">
          <Tag className="w-3.5 h-3.5 text-warning" />
          <span>Tags</span>
        </div>
        <span className="text-[10px] font-mono text-muted">
          {currentTags.length}
        </span>
      </button>

      <div className="my-1 border-t border-soft" />

      <button
        type="button"
        onClick={handleDelete}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors cursor-pointer font-semibold"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </>
  );

  const renderActionsMobile = () => (
    <div className="divide-y divide-soft">
      <div className="py-1">
        <button
          type="button"
          onClick={() => closeAndRun(() => onEdit(item))}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
        >
          <Edit3 className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
          <span>Edit Details</span>
        </button>

        <button
          type="button"
          onClick={() => closeAndRun(() => onDuplicate(item))}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
        >
          <Copy className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
          <span>Duplicate Item</span>
        </button>

        {canBeAchievement && onMarkAchievement && (
          <button
            type="button"
            onClick={() => closeAndRun(() => onMarkAchievement(item))}
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
          >
            <Trophy className={`w-4 h-4 ${ICON_COLOR.achievement}`} />
            <span>Mark as Achievement</span>
          </button>
        )}
      </div>

      {isEventItem && onResolveEvent && (
        <div className="py-1">
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evDone ? "clear" : "attended"),
              )
            }
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
          >
            <CheckCircle2 className={`w-4 h-4 ${ICON_COLOR.attended}`} />
            <span>{evDone ? "Mark as not attended" : "Mark as attended"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evMissed ? "clear" : "missed"),
              )
            }
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
          >
            <MinusCircle className={`w-4 h-4 ${ICON_COLOR.missed}`} />
            <span>{evMissed ? "Clear missed status" : "Mark as missed"}</span>
          </button>
        </div>
      )}

      <div className="py-2">
        {canReschedule && (
          <>
            <div className="flex items-center gap-2 px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-muted">
              <Calendar className={`w-3.5 h-3.5 ${ICON_COLOR.neutral}`} />
              <span>Reschedule</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-2 mb-2">
              {[
                { label: "Today", days: 0 },
                { label: "Tomorrow", days: 1 },
                { label: "+2 Days", days: 2 },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => rescheduleShortcut(o.days)}
                  className="py-1.5 px-2 rounded-lg bg-hover text-xs font-mono font-medium text-secondary hover:bg-accent hover:text-accent-fg transition-colors"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setPanel("tags")}
          className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-medium hover:bg-hover rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
            <span>Tags</span>
          </div>
          <span className="text-[10px] font-mono text-muted">
            {currentTags.length}
          </span>
        </button>
      </div>

      <div className="pt-2 pb-1">
        <button
          type="button"
          onClick={handleDelete}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-semibold text-danger hover:bg-danger/10 rounded-xl transition-colors"
        >
          <Trash2 className={`w-4 h-4 ${ICON_COLOR.danger}`} />
          <span>Delete Entry</span>
        </button>
      </div>
    </div>
  );

  const renderTags = () => (
    <TagEditorPanel
      selected={currentTags}
      available={availableTags}
      onToggle={toggleTag}
      onCreate={createTag}
      onDone={isMobile ? () => setPanel("actions") : undefined}
    />
  );

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          onClick={onClose}
          className={`fixed inset-0 transition-opacity ${
            isMobile ? "bg-overlay/60 backdrop-blur-xs" : "bg-transparent"
          }`}
        />

        {isMobile ? (
          <div
            ref={menuRef}
            className="fixed bottom-0 inset-x-0 min-h-[35dvh] bg-raised border-t border-soft rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh] animate-slideInBottom z-50 text-primary"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
            }}
          >
            <div className="shrink-0 px-5 pt-2.5 pb-3 border-b border-soft">
              <div className="w-12 h-1.5 rounded-full bg-strong mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted">
                    {panel === "tags" ? "Tags" : "Actions"}
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {itemTitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div key={panel} className="animate-fadeIn">
                {panel === "tags" ? renderTags() : renderActionsMobile()}
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={menuRef}
            style={getDesktopStyle()}
            className={`fixed ${
              panel === "tags" ? "w-[300px]" : "w-56"
            } rounded-2xl bg-raised border border-soft shadow-2xl p-1.5 z-50 animate-scaleUp text-primary text-xs`}
          >
            {panel === "tags" ? renderTags() : renderActionsDesktop()}
          </div>
        )}
      </div>
    </>
  );
};
