/**
 * ChronoCraft - Desktop Sidebar Navigation Component
 * Features primary view links, collapsible Lists accordion with custom list items, and offline status.
 */

import React, { useState } from "react";
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
  Trophy,
} from "lucide-react";
import { ActiveView, CustomList } from "@/types";

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
      case "BookOpen":
        return <BookOpen className="w-3.5 h-3.5" />;
      case "GraduationCap":
        return <GraduationCap className="w-3.5 h-3.5" />;
      case "FolderKanban":
        return <FolderKanban className="w-3.5 h-3.5" />;
      default:
        return <Folder className="w-3.5 h-3.5" />;
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sunken border-r border-soft select-none">
      {/* Primary Views Section */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
          Execution & Planning
        </div>

        {/* 1. Focus View */}
        <button
          type="button"
          onClick={() => onSelectView("focus")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "focus"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`w-4 h-4 ${
                activeView === "focus" ? "text-accent-fg" : "text-accent"
              }`}
            />
            <span>Focus</span>
          </div>
          {activeTaskCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                activeView === "focus"
                  ? "bg-accent-hover text-accent-fg"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {activeTaskCount}
            </span>
          )}
        </button>

        {/* 2. Timeline View */}
        <button
          type="button"
          onClick={() => onSelectView("timeline")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "timeline"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark
              className={`w-4 h-4 ${
                activeView === "timeline" ? "text-accent-fg" : "text-info"
              }`}
            />
            <span>Timeline</span>
          </div>
          <span className="text-[10px] font-mono text-muted">Live</span>
        </button>

        {/* 3. Notes View */}
        <button
          type="button"
          onClick={() => onSelectView("notes")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "notes"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FileText
              className={`w-4 h-4 ${
                activeView === "notes" ? "text-accent-fg" : "text-warning"
              }`}
            />
            <span>Notes</span>
          </div>
          {totalNotesCount > 0 && (
            <span className="text-[10px] font-mono tabular-nums text-muted">
              {totalNotesCount}
            </span>
          )}
        </button>

        {/* 4. Events View */}
        <button
          type="button"
          onClick={() => onSelectView("events")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "events"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CalendarDays
              className={`w-4 h-4 ${
                activeView === "events" ? "text-accent-fg" : "text-danger"
              }`}
            />
            <span>Events</span>
          </div>
          {totalEventsCount > 0 && (
            <span className="text-[10px] font-mono tabular-nums text-muted">
              {totalEventsCount}
            </span>
          )}
        </button>

        {/* 5. Habits View */}
        <button
          type="button"
          onClick={() => onSelectView("habits")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "habits"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flame
              className={`w-4 h-4 ${
                activeView === "habits"
                  ? "text-accent-fg"
                  : "text-entity-orange"
              }`}
            />
            <span>Habits</span>
          </div>
          <span className="text-[10px] font-mono text-entity-orange">
            Matrix
          </span>
        </button>

        {/* 6. Achievements View */}
        <button
          type="button"
          onClick={() => onSelectView("achievements")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeView === "achievements"
              ? "bg-accent text-accent-fg font-semibold shadow-xs shadow-accent/30"
              : "text-secondary hover:bg-hover"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trophy
              className={`w-4 h-4 ${
                activeView === "achievements"
                  ? "text-accent-fg"
                  : "text-warning"
              }`}
            />
            <span>Achievements</span>
          </div>
          <span className="text-[10px] font-mono text-warning">Proud</span>
        </button>
      </div>

      {/* Collapsible Lists Section */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold group">
          <button
            type="button"
            onClick={() => setListsCollapsed(!listsCollapsed)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
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
            className="p-0.5 rounded-md hover:bg-hover text-muted hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List Sub-Items */}
        {!listsCollapsed && (
          <div className="space-y-0.5 mt-1 animate-fadeIn">
            {lists.map((list) => {
              const isSelected =
                activeView === "lists" && selectedListId === list.id;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => onSelectView("lists", list.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-fg font-medium shadow-xs"
                      : "text-secondary hover:bg-hover hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      style={{ color: isSelected ? undefined : list.color }}
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
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted hover:text-accent transition-colors mt-1"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[11px]">Add Custom List...</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage Footer Status */}
      <div className="p-3 border-t border-soft">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-hover text-[11px] font-mono text-muted">
          <Database className="w-3.5 h-3.5 text-success shrink-0" />
          <span className="truncate">IndexedDB · Offline First</span>
        </div>
      </div>
    </aside>
  );
};
