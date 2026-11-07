/**
 * ChronoCraft - StatusPickerPopover Component
 * Accessible, floating status selector for List Items.
 * Allows 1-click status assignment across the 5 lifecycle states:
 * - Inbox (unstarted / backlog)
 * - In Progress (active reading/studying/coding)
 * - Completed (shipped / finished)
 * - Dropped (archived / discontinued)
 * - Maybe Later (wishlist / somedays)
 */

import React, { useEffect, useRef } from 'react';
import {
  Inbox,
  PlayCircle,
  CheckCircle2,
  MinusCircle,
  Bookmark,
  Check,
} from 'lucide-react';
import { ListItemStatus } from '../types';

export interface StatusDefinition {
  id: 'inbox' | 'in-progress' | 'completed' | 'dropped' | 'maybe-later';
  label: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
}

export const LIST_STATUS_DEFINITIONS: StatusDefinition[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: Inbox,
    colorClass: 'text-slate-400',
    badgeBg: 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-300',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    icon: PlayCircle,
    colorClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300',
  },
  {
    id: 'dropped',
    label: 'Dropped',
    icon: MinusCircle,
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300',
  },
  {
    id: 'maybe-later',
    label: 'Maybe Later',
    icon: Bookmark,
    colorClass: 'text-violet-400',
    badgeBg: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300',
  },
];

interface StatusPickerPopoverProps {
  currentStatus: ListItemStatus;
  position: { x: number; y: number } | null;
  isOpen: boolean;
  onSelectStatus: (status: 'inbox' | 'in-progress' | 'completed' | 'dropped' | 'maybe-later') => void;
  onClose: () => void;
}

export const StatusPickerPopover: React.FC<StatusPickerPopoverProps> = ({
  currentStatus,
  position,
  isOpen,
  onSelectStatus,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Normalize currentStatus
  const normalizedStatus =
    currentStatus === 'todo'
      ? 'inbox'
      : currentStatus === 'done'
      ? 'completed'
      : currentStatus;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  // Viewport bounds detection
  const popoverWidth = 190;
  const popoverHeight = 220;
  const padding = 12;

  let left = position.x;
  let top = position.y;

  if (left + popoverWidth > window.innerWidth - padding) {
    left = window.innerWidth - popoverWidth - padding;
  }
  if (top + popoverHeight > window.innerHeight - padding) {
    top = window.innerHeight - popoverHeight - padding;
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: `${Math.max(padding, left)}px`,
        top: `${Math.max(padding, top)}px`,
      }}
      className="z-50 w-48 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 animate-scaleUp text-slate-900 dark:text-slate-100 backdrop-blur-md"
    >
      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/80">
        Update Status
      </div>

      <div className="space-y-0.5 pt-0.5">
        {LIST_STATUS_DEFINITIONS.map((def) => {
          const Icon = def.icon;
          const isSelected = normalizedStatus === def.id;

          return (
            <button
              key={def.id}
              type="button"
              onClick={() => {
                onSelectStatus(def.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${def.colorClass}`} />
                <span>{def.label}</span>
              </div>

              {isSelected && (
                <Check className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
