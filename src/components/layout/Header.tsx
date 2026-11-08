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
  synced: "bg-success",
  stale: "bg-warning",
  error: "bg-danger",
  off: "bg-muted",
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
        className={`flex items-center gap-1.5 rounded-lg border border-dashed border-strong text-secondary hover:border-accent/60 hover:text-accent transition-colors cursor-pointer ${
          compact
            ? "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider"
            : "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider"
        }`}
        title="Set up Gist Sync"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-muted" />
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
            state === "error" ? "text-danger" : "text-secondary"
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
          className={`flex items-center gap-1 rounded-md md:border md:border-soft md:bg-surface text-secondary hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10px]"
          } font-semibold uppercase tracking-wider`}
        >
          <ArrowUpFromLine className="w-3 h-3 text-accent" />
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
          className={`flex items-center gap-1 rounded-md md:border md:border-soft md:bg-surface text-secondary hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10px]"
          } font-semibold uppercase tracking-wider`}
        >
          <ArrowDownToLine className="w-3 h-3 text-success" />
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
      icon: <CheckCircle2 className="w-4 h-4 text-accent" />,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: <Bookmark className="w-4 h-4 text-info" />,
    },
    {
      id: "notes",
      label: "Notes",
      icon: <FileText className="w-4 h-4 text-warning" />,
    },
    {
      id: "events",
      label: "Events",
      icon: <CalendarDays className="w-4 h-4 text-danger" />,
    },
    {
      id: "habits",
      label: "Habits",
      icon: <Flame className="w-4 h-4 text-entity-orange" />,
    },
    {
      id: "lists",
      label: "Lists",
      icon: <FolderKanban className="w-4 h-4 text-success" />,
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
    <header className="sticky top-0 z-30 bg-app/90 backdrop-blur-md border-b border-soft transition-colors pt-[env(safe-area-inset-top)]">
      {/* Mobile-only: sync strip above the nav tabs */}
      <div className="md:hidden w-full h-8 flex items-center justify-between gap-2 px-4 border-b border-soft bg-app/90">
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
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-accent-fg shadow-sm shadow-accent/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-primary">
              ChronoCraft
            </span>
          </div>

          {/* Separator on Desktop */}
          <div className="hidden md:flex items-center text-muted">/</div>

          {/* Desktop Breadcrumb indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
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
                      ? "bg-raised text-primary shadow-xs"
                      : "text-secondary active:bg-hover"
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
              className="flex-1 min-w-0 h-12 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] sm:text-[10px] font-semibold text-secondary active:bg-hover transition-all cursor-pointer"
            >
              <span className="opacity-60">
                <Sliders className="w-4 h-4 text-muted" />
              </span>
              <span className="truncate max-w-full px-0.5">Settings</span>
            </button>
          </div>
        </nav>

        {/* Zone 2: Date & Executive Progress Overview */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-secondary">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span className="tabular-nums font-sans font-medium text-primary">
              {todayFormatted}
            </span>
          </div>
          <span className="text-muted">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>
              Active:{" "}
              <strong className="tabular-nums text-primary">
                {activeTaskCount}
              </strong>
              /{settings.xActiveLimit}
            </span>
          </div>
          <span className="text-muted">·</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>
              Done Today:{" "}
              <strong className="tabular-nums text-primary">
                {completedTodayCount}
              </strong>
            </span>
          </div>
        </div>

        {/* Zone 3: Sync + Settings */}
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
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-accent" />
            <span>Settings</span>
          </button>

          {/* Mobile fallback: compact icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Workspace Settings & Database"
            className="md:hidden p-2 rounded-xl text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
