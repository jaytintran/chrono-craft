/**
 * ChronoCraft - Universal Context Menu
 * Desktop: floating popover. Mobile: bottom action sheet.
 * Compact actions panel (original style) + dedicated inline TagEditorPanel.
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
import { ConfirmDialog } from "../ui/ConfirmDialog";
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

// Centralized mobile icon colors — keeps groups visually consistent.
// Destructive stays rose; the rest use a single muted tone so group
// dividers carry the hierarchy, not the icons.
const ICON_COLOR = {
  neutral: "text-slate-400",
  achievement: "text-amber-400",
  attended: "text-emerald-400",
  missed: "text-rose-400",
  danger: "text-rose-400",
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
  const [isTagPromptOpen, setIsTagPromptOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (isDeleteConfirmOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, onClose, isDeleteConfirmOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsRescheduleOpen(false);
      setIsTagPromptOpen(false);
      setTagInput("");
      setCurrentTags([]);
      setIsDeleteConfirmOpen(false);
      setPanel("actions");
    } else if (target?.item) {
      setCurrentTags(target.item.tags || []);
      // Safety: if the previous open left the reschedule accordion expanded,
      // and this new item can't be rescheduled, close it. `canReschedule` is
      // computed below in the render body, so re-derive it here inline.
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

  // ESC: back out of panel first, then close
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

  // Reschedule only makes sense for items that actually occupy a point
  // (or span) in time on a schedule:
  //   - CalendarEvent (has startAt)
  //   - TimelineEntry (has type + source), excluding:
  //       · completed items   → completedAt would desync from scheduledAt
  //       · logs              → logs record "what happened", not "when it's due"
  //       · achievements      → point-in-time record, shouldn't be movable
  //   - Notes (Note store) and List items (ListItem store) are excluded.
  const canReschedule = (() => {
    if (item.startAt !== undefined) {
      return true; // CalendarEvent
    }
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

  const rescheduleShortcut = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    closeAndRun(() => onReschedule(item, d));
  };

  // ---- Tag commit helpers ----

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

  // Legacy inline add handler (kept in case tag panel is disabled later)
  const handleSaveInlineTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (!clean || currentTags.includes(clean)) return;
    commitTags([...currentTags, clean]);
    setTagInput("");
  };

  const handleRemoveInlineTag = (tag: string) => {
    commitTags(currentTags.filter((t) => t !== tag));
  };

  // ---- Desktop positioning ----

  const getDesktopStyle = (): React.CSSProperties => {
    if (!position) return { top: "50%", left: "50%" };
    const w = panel === "tags" ? 300 : 224; // 224 = old w-56
    const h = panel === "tags" ? 380 : 340;
    const pad = 12;
    let x = Math.min(position.x, window.innerWidth - w - pad);
    let y = Math.min(position.y, window.innerHeight - h - pad);
    return { top: `${Math.max(pad, y)}px`, left: `${Math.max(pad, x)}px` };
  };

  // ---- Actions panel (compact, original style) ----

  const renderActionsDesktop = () => (
    <>
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
          {itemTitle}
        </span>
      </div>

      <button
        type="button"
        onClick={() => closeAndRun(() => onEdit(item))}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
      >
        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
        <span>Edit Details</span>
      </button>

      {canBeAchievement && onMarkAchievement && (
        <button
          type="button"
          onClick={() => closeAndRun(() => onMarkAchievement(item))}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Mark as Achievement</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => closeAndRun(() => onDuplicate(item))}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
      >
        <Copy className="w-3.5 h-3.5 text-cyan-400" />
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{evDone ? "Mark as not attended" : "Mark as attended"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evMissed ? "clear" : "missed"),
              )
            }
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>{evMissed ? "Clear missed status" : "Mark as missed"}</span>
          </button>
        </>
      )}

      {/* Reschedule — original inline accordion */}
      {canReschedule && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRescheduleOpen(!isRescheduleOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reschedule</span>
            </div>
            <span className="text-[10px] text-slate-400">›</span>
          </button>

          {isRescheduleOpen && (
            <div className="p-1.5 mt-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={() => rescheduleShortcut(0)}
                className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => rescheduleShortcut(1)}
                className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => rescheduleShortcut(2)}
                className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
              >
                In 2 Days
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tags — opens the dedicated panel */}
      <button
        type="button"
        onClick={() => setPanel("tags")}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
      >
        <div className="flex items-center gap-2.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          <span>Tags</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {currentTags.length}
        </span>
      </button>

      <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

      <button
        type="button"
        onClick={() => setIsDeleteConfirmOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </>
  );

  // ---- Actions panel (mobile, grouped) ----

  const renderActionsMobile = () => (
    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
      {/* Group 1: Primary actions */}
      <div className="py-1">
        <button
          type="button"
          onClick={() => closeAndRun(() => onEdit(item))}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
        >
          <Edit3 className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
          <span>Edit Details</span>
        </button>

        <button
          type="button"
          onClick={() => closeAndRun(() => onDuplicate(item))}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
        >
          <Copy className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
          <span>Duplicate Item</span>
        </button>

        {canBeAchievement && onMarkAchievement && (
          <button
            type="button"
            onClick={() => closeAndRun(() => onMarkAchievement(item))}
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <Trophy className={`w-4 h-4 ${ICON_COLOR.achievement}`} />
            <span>Mark as Achievement</span>
          </button>
        )}
      </div>

      {/* Group 2: Attendance (events only) */}
      {isEventItem && onResolveEvent && (
        <div className="py-1">
          <button
            type="button"
            onClick={() =>
              closeAndRun(() =>
                onResolveEvent(item.id, evDone ? "clear" : "attended"),
              )
            }
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
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
            className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <MinusCircle className={`w-4 h-4 ${ICON_COLOR.missed}`} />
            <span>{evMissed ? "Clear missed status" : "Mark as missed"}</span>
          </button>
        </div>
      )}

      {/* Group 3: Organize (reschedule + tags) */}
      <div className="py-2">
        {canReschedule && (
          <>
            <div className="flex items-center gap-2 px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <Calendar className={`w-3.5 h-3.5 ${ICON_COLOR.neutral}`} />
              <span>Reschedule</span>
            </div>
            <div className="grid grid-cols-3 gap-2 px-2 mb-2">
              <button
                type="button"
                onClick={() => rescheduleShortcut(0)}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => rescheduleShortcut(1)}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => rescheduleShortcut(2)}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
              >
                +2 Days
              </button>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setPanel("tags")}
          className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag className={`w-4 h-4 ${ICON_COLOR.neutral}`} />
            <span>Tags</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {currentTags.length}
          </span>
        </button>
      </div>

      {/* Group 4: Danger */}
      <div className="pt-2 pb-1">
        <button
          type="button"
          onClick={() => setIsDeleteConfirmOpen(true)}
          className="w-full flex items-center gap-3 py-2.5 px-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
        >
          <Trash2 className={`w-4 h-4 ${ICON_COLOR.danger}`} />
          <span>Delete Entry</span>
        </button>
      </div>
    </div>
  );

  // ---- Tags panel (unchanged — your nice new design) ----

  const renderTags = () => (
    <TagEditorPanel
      selected={currentTags}
      available={availableTags}
      onToggle={toggleTag}
      onCreate={createTag}
      onDone={isMobile ? () => setPanel("actions") : undefined}
    />
  );

  // ---- Layouts ----

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          onClick={onClose}
          className={`fixed inset-0 transition-opacity ${
            isMobile ? "bg-slate-900/60 backdrop-blur-xs" : "bg-transparent"
          }`}
        />

        {isMobile ? (
          <div
            ref={menuRef}
            className="fixed bottom-0 inset-x-0 min-h-[35dvh] bg-white dark:bg-[#111724] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh] animate-slideInBottom z-50 text-slate-900 dark:text-slate-100"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
            }}
          >
            {/* Drag handle + header */}
            <div className="shrink-0 px-5 pt-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {panel === "tags" ? "Tags" : "Actions"}
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {itemTitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
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
            } rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-scaleUp text-slate-900 dark:text-slate-100 text-xs`}
          >
            {panel === "tags" ? renderTags() : renderActionsDesktop()}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={`Delete this ${
          item.type === "list_item" || item.listId !== undefined
            ? "list item"
            : item.type === "note"
              ? "note"
              : item.type === "event" || item.startAt !== undefined
                ? "event"
                : "entry"
        }?`}
        message="This permanently removes the item. This can't be undone."
        confirmLabel="Delete"
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          onClose();
        }}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete(item);
          onClose();
        }}
      />
    </>
  );
};
