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
  ArrowUpFromLine,
  ArrowDownToLine,
} from "lucide-react";
import { ActiveView, AppSettings } from "@/types";

type SyncState = "synced" | "stale" | "error" | "off";

function getSyncState(
  settings: AppSettings,
  lastSyncResult: string | null,
): SyncState {
  const lastAt = settings.gistSync?.lastSyncedAt;
  if (!settings.gistSync?.token) return "off";
  if (lastSyncResult && /failed/i.test(lastSyncResult)) return "error";
  if (!lastAt) return "stale";
  const ageMs = Date.now() - new Date(lastAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) return "stale";
  return "synced";
}

function formatAgo(iso?: string): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SYNC_DOT_CLASS: Record<SyncState, string> = {
  synced: "bg-emerald-500",
  stale: "bg-amber-500",
  error: "bg-rose-500",
  off: "bg-slate-400",
};

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
}

interface SyncControlProps {
  settings: AppSettings;
  isSyncing: boolean;
  lastSyncResult: string | null;
  onPush: () => Promise<void> | void;
  onPull: () => Promise<void> | void;
  onOpenSettings: () => void;
  /** Compact mode = mobile strip (smaller paddings, shorter labels) */
  compact?: boolean;
}

const SyncControl: React.FC<SyncControlProps> = ({
  settings,
  isSyncing,
  lastSyncResult,
  onPush,
  onPull,
  onOpenSettings,
  compact = false,
}) => {
  const state = getSyncState(settings, lastSyncResult);

  // Not configured: show a one-tap setup chip
  if (state === "off") {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className={`flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-500/60 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer ${
          compact
            ? "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
            : "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider"
        }`}
        title="Set up Gist Sync"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Set up sync</span>
      </button>
    );
  }

  const statusText =
    state === "error"
      ? "Sync Failed"
      : isSyncing
        ? "Syncing…"
        : `Synced ${formatAgo(settings.gistSync?.lastSyncedAt)}`;

  const canPull = !!settings.gistSync?.gistId;

  return (
    <div
      className={`flex max-sm:justify-between max-sm:w-full items-center gap-2 ${
        compact ? "text-[10px]" : "text-[11px]"
      } font-mono`}
    >
      {/* Status indicator (dot + label) */}
      <div className="flex items-center gap-1.5 min-w-0 shrink">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${SYNC_DOT_CLASS[state]} ${
            isSyncing ? "animate-pulse" : ""
          }`}
        />
        <span
          className={`truncate ${
            state === "error"
              ? "text-rose-500 dark:text-rose-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {statusText}
        </span>
      </div>

      <div className="flex max-sm:gap-2 gap-1">
        {/* Push */}
        <button
          type="button"
          disabled={isSyncing}
          onClick={() => onPush()}
          title="Push local state to Gist"
          className={`flex items-center gap-1 rounded-md md:border md:border-slate-200 md:dark:border-slate-700 md:bg-white md:dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10px]"
          } font-semibold uppercase tracking-wider`}
        >
          <ArrowUpFromLine className="w-3 h-3 text-indigo-400" />
          <span>Push</span>
        </button>

        {/* Pull */}
        <button
          type="button"
          disabled={isSyncing || !canPull}
          onClick={() => onPull()}
          title={
            canPull
              ? "Pull remote changes into local DB"
              : "Push first to create a Gist, then Pull becomes available"
          }
          className={`flex items-center gap-1 rounded-md md:border md:border-slate-200 md:dark:border-slate-700 md:bg-white md:dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10px]"
          } font-semibold uppercase tracking-wider`}
        >
          <ArrowDownToLine className="w-3 h-3 text-emerald-400" />
          <span>Pull</span>
        </button>
      </div>
    </div>
  );
};

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
      {/* Mobile-only: sync strip above the nav tabs */}
      <div className="md:hidden w-full h-8 flex items-center justify-between gap-2 px-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F17]/90">
        <SyncControl
          settings={settings}
          isSyncing={isSyncing}
          lastSyncResult={lastSyncResult}
          onPush={onGistPush}
          onPull={onGistPull}
          onOpenSettings={onOpenGistSettings}
          compact
        />
      </div>

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
          {/* Desktop: inline sync control */}
          <SyncControl
            settings={settings}
            isSyncing={isSyncing}
            lastSyncResult={lastSyncResult}
            onPush={onGistPush}
            onPull={onGistPull}
            onOpenSettings={onOpenGistSettings}
          />

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
