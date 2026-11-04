/**
 * ChronoCraft - Universal Context Menu Component
 * Desktop: Floating cursor popover on right-click or three-dot icon click.
 * Mobile: Slide-up bottom action sheet on 500ms tap-and-hold.
 * Full action suite: Edit, Duplicate, Reschedule, Change Priority, Manage Tags, Delete.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Edit3,
  Copy,
  Calendar,
  AlertCircle,
  Tag,
  Trash2,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EntryPriority, TimelineEntry } from '../types';

export interface ContextMenuTarget {
  item: TimelineEntry | any;
  type: 'timeline' | 'note' | 'event' | 'focus' | 'list';
}

interface ContextMenuProps {
  target: ContextMenuTarget | null;
  position: { x: number; y: number } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: any) => void;
  onDuplicate: (item: any) => void;
  onReschedule: (item: any, date: Date) => void;
  onChangePriority: (item: any, priority: EntryPriority) => void;
  onAddTag: (item: any, tag: string) => void;
  onDelete: (item: any) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  target,
  position,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onReschedule,
  onChangePriority,
  onAddTag,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isTagPromptOpen, setIsTagPromptOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Check mobile on mount/resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Reset sub-menus when target changes
  useEffect(() => {
    if (!isOpen) {
      setIsRescheduleOpen(false);
      setIsPriorityOpen(false);
      setIsTagPromptOpen(false);
      setTagInput('');
    }
  }, [isOpen]);

  if (!isOpen || !target) return null;

  const item = target.item;
  const itemTitle = item.title || 'Untitled Item';

  // Desktop positioning calculation to keep menu within viewport
  const getDesktopStyle = (): React.CSSProperties => {
    if (!position) return { top: '50%', left: '50%' };

    const menuWidth = 240;
    const menuHeight = 320;
    const padding = 12;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }

    return {
      top: `${Math.max(padding, y)}px`,
      left: `${Math.max(padding, x)}px`,
    };
  };

  const handleRescheduleShortcut = (daysToAdd: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    onReschedule(item, targetDate);
    onClose();
  };

  const handleSaveTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    onAddTag(item, tagInput.trim().replace(/^#/, ''));
    setTagInput('');
    setIsTagPromptOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop for mobile or desktop dismissal */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity ${
          isMobile ? 'bg-slate-900/60 backdrop-blur-xs' : 'bg-transparent'
        }`}
      />

      {/* ================= MOBILE BOTTOM ACTION SHEET ================= */}
      {isMobile ? (
        <div
          ref={menuRef}
          className="fixed bottom-0 inset-x-0 bg-white dark:bg-[#111724] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl p-5 pb-8 space-y-4 animate-slideInBottom z-50 text-slate-900 dark:text-slate-100"
        >
          {/* Drag Handle & Header */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="w-full flex items-center justify-between pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono truncate max-w-[240px]">
                {itemTitle}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action List Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* 1. Edit */}
            <button
              type="button"
              onClick={() => {
                onEdit(item);
                onClose();
              }}
              className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>Edit Details</span>
            </button>

            {/* 2. Duplicate */}
            <button
              type="button"
              onClick={() => {
                onDuplicate(item);
                onClose();
              }}
              className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Duplicate Item</span>
            </button>

            {/* 3. Reschedule */}
            <div className="py-2 px-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Reschedule</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRescheduleShortcut(0)}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleRescheduleShortcut(1)}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleRescheduleShortcut(2)}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  +2 Days
                </button>
              </div>
            </div>

            {/* 4. Priority */}
            <div className="py-2 px-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Priority</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'high');
                    onClose();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    item.priority === 'high'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  !HIGH
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'normal');
                    onClose();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    item.priority === 'normal' || !item.priority
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'low');
                    onClose();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    item.priority === 'low'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  LOW
                </button>
              </div>
            </div>

            {/* 5. Delete */}
            <button
              type="button"
              onClick={() => {
                onDelete(item);
                onClose();
              }}
              className="w-full flex items-center gap-3 py-3 px-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Entry</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= DESKTOP FLOATING POPOVER ================= */
        <div
          ref={menuRef}
          style={getDesktopStyle()}
          className="fixed w-56 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-scaleUp text-slate-900 dark:text-slate-100 text-xs"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
              {itemTitle}
            </span>
          </div>

          {/* 1. Edit */}
          <button
            type="button"
            onClick={() => {
              onEdit(item);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Details</span>
          </button>

          {/* 2. Duplicate */}
          <button
            type="button"
            onClick={() => {
              onDuplicate(item);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Duplicate</span>
          </button>

          {/* 3. Reschedule Submenu Toggle */}
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
                  onClick={() => handleRescheduleShortcut(0)}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleRescheduleShortcut(1)}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleRescheduleShortcut(2)}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  In 2 Days
                </button>
              </div>
            )}
          </div>

          {/* 4. Change Priority */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPriorityOpen(!isPriorityOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Priority</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-slate-400">
                {item.priority || 'Normal'} ›
              </span>
            </button>

            {isPriorityOpen && (
              <div className="p-1.5 mt-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 animate-fadeIn font-mono">
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'high');
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-rose-400 hover:bg-rose-500 hover:text-white transition-colors font-bold"
                >
                  !HIGH Priority
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'normal');
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Normal Priority
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangePriority(item, 'low');
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-1 rounded-md text-[11px] text-cyan-400 hover:bg-cyan-600 hover:text-white transition-colors"
                >
                  Low Priority
                </button>
              </div>
            )}
          </div>

          {/* 5. Add Tag */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTagPromptOpen(!isTagPromptOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Add #Tag</span>
            </button>

            {isTagPromptOpen && (
              <form
                onSubmit={handleSaveTag}
                className="p-2 mt-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 animate-fadeIn"
              >
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="tag name"
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 text-[11px] text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!tagInput.trim()}
                  className="p-1 rounded-md bg-indigo-600 text-white disabled:opacity-40"
                >
                  <Check className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

          {/* 6. Delete */}
          <button
            type="button"
            onClick={() => {
              onDelete(item);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
