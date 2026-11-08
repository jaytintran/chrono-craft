/**
 * ChronoCraft - Header Navigation Component
 * Responsive header with desktop breadcrumbs and mobile view switcher dropdown.
 */

import React from "react";
import {
  Sparkles,
  Sliders,
  Calendar,
  CheckCircle2,
  Bookmark,
  FileText,
  CalendarDays,
  Flame,
  FolderKanban,
} from "lucide-react";
import { ActiveView, AppSettings } from "@/types";

import { SyncStatusStrip } from "./SyncStatusStrip";
import { SyncStatusPill } from "./SyncStatusPill";

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenGistSettings: () => void;
  activeTaskCount: number;
  completedTodayCount: number;
  isSyncing: boolean;
  lastSyncResult: string | null;
  onGistPush: () => Promise<void> | void;
  onGistPull: () => Promise<void> | void;
  onGistSync: () => Promise<void> | void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  settings,
  onOpenSettings,
  onOpenGistSettings,
  activeTaskCount,
  completedTodayCount,
  isSyncing,
  lastSyncResult,
  onGistPush,
  onGistPull,
  onGistSync,
}) => {
  const viewOptions: Array<{
    id: ActiveView;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "focus",
      label: "Focus",
      icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" />,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Bookmark className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: "notes",
      label: "Notes",
      icon: <FileText className="w-4 h-4 text-amber-400" />,
    },
    {
      id: "events",
      label: "Events",
      icon: <CalendarDays className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "habits",
      label: "Habits",
      icon: <Flame className="w-4 h-4 text-orange-400" />,
    },
    {
      id: "lists",
      label: "Lists",
      icon: <FolderKanban className="w-4 h-4 text-emerald-400" />,
    },
  ];

  const currentOption =
    viewOptions.find((v) => v.id === activeView) || viewOptions[0];

  // Today formatted string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors pt-[env(safe-area-inset-top)]">
      {/* Mobile-only sync status strip — sits above the nav tabs */}
      <SyncStatusStrip
        settings={settings}
        isSyncing={isSyncing}
        lastSyncResult={lastSyncResult}
        onPush={onGistPush}
        onPull={onGistPull}
        onFullSync={onGistSync}
        onOpenGistSettings={onOpenGistSettings}
      />

      {/* Zones */}
      <div className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Zone 1: Brand & Desktop Breadcrumbs / Mobile View Switcher */}
        <div className="flex items-center gap-4 max-md:hidden">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
              ChronoCraft
            </span>
          </div>

          {/* Separator on Desktop */}
          <div className="hidden md:flex items-center text-slate-300 dark:text-slate-700">
            /
          </div>

          {/* Desktop Breadcrumb indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {currentOption.icon}
            <span>{currentOption.label} View</span>
          </div>
        </div>

        {/* Mobile view switcher: full-width, 7 tabs distributed evenly */}
        <nav
          aria-label="Workspace views"
          className="md:hidden py-2 flex-1 min-w-0"
        >
          <div role="tablist" className="flex w-full items-stretch">
            {viewOptions.map((opt) => {
              const isActive = activeView === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelectView(opt.id)}
                  className={`flex-1 min-w-0 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] sm:text-[10px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 active:bg-slate-200/60 dark:active:bg-slate-800/60"
                  }`}
                >
                  <span className={isActive ? "" : "opacity-60"}>
                    {opt.icon}
                  </span>
                  <span className="truncate max-w-full px-0.5">
                    {opt.label}
                  </span>
                </button>
              );
            })}

            {/* Settings tab — opens modal, never marked active */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="flex-1 min-w-0 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 active:bg-slate-200/60 dark:active:bg-slate-800/60 transition-all cursor-pointer"
            >
              <span className="opacity-60">
                <Sliders className="w-4 h-4 text-slate-400" />
              </span>
              <span className="truncate max-w-full px-0.5">Settings</span>
            </button>
          </div>
        </nav>

        {/* Zone 2: Date & Executive Progress Overview */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="tabular-nums font-sans font-medium text-slate-700 dark:text-slate-300">
              {todayFormatted}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>
              Active:{" "}
              <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                {activeTaskCount}
              </strong>
              /{settings.xActiveLimit}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Done Today:{" "}
              <strong className="tabular-nums text-slate-900 dark:text-slate-100">
                {completedTodayCount}
              </strong>
            </span>
          </div>
        </div>

        {/* Zone 3: Settings) */}
        <div className="flex items-center gap-2 shrink-0 max-md:hidden">
          {/* Sync pill (desktop only) */}
          <div className="hidden md:block">
            <SyncStatusPill
              settings={settings}
              isSyncing={isSyncing}
              lastSyncResult={lastSyncResult}
              onPush={onGistPush}
              onPull={onGistPull}
              onFullSync={onGistSync}
              onOpenGistSettings={onOpenGistSettings}
            />
          </div>

          {/* Desktop: full view-button; Mobile: icon-only (Settings lives in mobile tab strip) */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Workspace Settings & Database"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Settings</span>
          </button>

          {/* Mobile fallback: keep a compact icon just in case the tab strip is scrolled off */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Workspace Settings & Database"
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
