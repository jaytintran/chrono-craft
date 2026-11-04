/**
 * ChronoCraft - Desktop Sidebar Navigation Component
 * Features primary view links, collapsible Lists accordion with custom list items, and offline status.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Bookmark,
  FileText,
  CalendarDays,
  Flame,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Plus,
  BookOpen,
  GraduationCap,
  Folder,
  Database,
  Sparkles,
} from 'lucide-react';
import { ActiveView, CustomList } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  selectedListId?: string;
  onSelectView: (view: ActiveView, listId?: string) => void;
  lists: CustomList[];
  activeTaskCount: number;
  totalNotesCount: number;
  totalEventsCount: number;
  onOpenCreateList: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedListId,
  onSelectView,
  lists,
  activeTaskCount,
  totalNotesCount,
  totalEventsCount,
  onOpenCreateList,
}) => {
  const [listsCollapsed, setListsCollapsed] = useState(false);

  const getListIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'FolderKanban':
        return <FolderKanban className="w-3.5 h-3.5" />;
      default:
        return <Folder className="w-3.5 h-3.5" />;
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-50/80 dark:bg-[#0E131E] border-r border-slate-200 dark:border-slate-800/80 select-none">
      {/* Primary Views Section */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
          Execution & Planning
        </div>

        {/* 1. Focus View */}
        <button
          type="button"
          onClick={() => onSelectView('focus')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === 'focus'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className={`w-4 h-4 ${activeView === 'focus' ? 'text-white' : 'text-indigo-400'}`} />
            <span>Focus</span>
          </div>
          {activeTaskCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                activeView === 'focus'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              {activeTaskCount}
            </span>
          )}
        </button>

        {/* 2. Timeline View */}
        <button
          type="button"
          onClick={() => onSelectView('timeline')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === 'timeline'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className={`w-4 h-4 ${activeView === 'timeline' ? 'text-white' : 'text-cyan-400'}`} />
            <span>Timeline</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Live</span>
        </button>

        {/* 3. Notes View */}
        <button
          type="button"
          onClick={() => onSelectView('notes')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === 'notes'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText className={`w-4 h-4 ${activeView === 'notes' ? 'text-white' : 'text-amber-400'}`} />
            <span>Notes</span>
          </div>
          {totalNotesCount > 0 && (
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              {totalNotesCount}
            </span>
          )}
        </button>

        {/* 4. Events View */}
        <button
          type="button"
          onClick={() => onSelectView('events')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === 'events'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays className={`w-4 h-4 ${activeView === 'events' ? 'text-white' : 'text-rose-400'}`} />
            <span>Events</span>
          </div>
          {totalEventsCount > 0 && (
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              {totalEventsCount}
            </span>
          )}
        </button>

        {/* 5. Habits View */}
        <button
          type="button"
          onClick={() => onSelectView('habits')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === 'habits'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flame className={`w-4 h-4 ${activeView === 'habits' ? 'text-white' : 'text-orange-400'}`} />
            <span>Habits</span>
          </div>
          <span className="text-[10px] font-mono text-orange-400">Matrix</span>
        </button>
      </div>

      {/* Collapsible Lists Section */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold group">
          <button
            type="button"
            onClick={() => setListsCollapsed(!listsCollapsed)}
            className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            {listsCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>Lists ({lists.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateList}
            title="Create new custom list"
            className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List Sub-Items */}
        {!listsCollapsed && (
          <div className="space-y-0.5 mt-1 animate-fadeIn">
            {lists.map((list) => {
              const isSelected = activeView === 'lists' && selectedListId === list.id;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => onSelectView('lists', list.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      style={{ color: isSelected ? 'white' : list.color }}
                      className="shrink-0"
                    >
                      {getListIcon(list.icon)}
                    </span>
                    <span className="truncate">{list.name}</span>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenCreateList}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors mt-1"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[11px]">Add Custom List...</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Footer Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-900/40 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">IndexedDB · Offline First</span>
        </div>
      </div>
    </aside>
  );
};
