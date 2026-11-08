/**
 * ChronoCraft - Sync Status Pill (desktop)
 * Small pill in the header. Opens a popover with push/pull/full sync.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  X,
  ArrowUpFromLine,
  ArrowDownToLine,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";
import { AppSettings } from "../../types";

interface SyncStatusPillProps {
  settings: AppSettings;
  isSyncing: boolean;
  lastSyncResult: string | null;
  onPush: () => Promise<void> | void;
  onPull: () => Promise<void> | void;
  onFullSync: () => Promise<void> | void;
  onOpenGistSettings: () => void;
}

type DotState = "synced" | "stale" | "error" | "off";

function getDotState(
  settings: AppSettings,
  lastSyncResult: string | null,
): DotState {
  const lastAt = settings.gistSync?.lastSyncedAt;
  if (!settings.gistSync?.token) return "off";
  if (lastSyncResult && /failed/i.test(lastSyncResult)) return "error";
  if (!lastAt) return "stale";
  const ageMs = Date.now() - new Date(lastAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) return "stale";
  return "synced";
}

function formatAgo(iso?: string): string {
  if (!iso) return "Not synced";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const DOT_CLASS: Record<DotState, string> = {
  synced: "bg-emerald-500",
  stale: "bg-amber-500",
  error: "bg-rose-500",
  off: "bg-slate-400",
};

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({
  settings,
  isSyncing,
  lastSyncResult,
  onPush,
  onPull,
  onFullSync,
  onOpenGistSettings,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Hidden when not configured
  if (!settings.gistSync?.token) return null;

  const state = getDotState(settings, lastSyncResult);
  const shortLabel =
    state === "error"
      ? "Failed"
      : isSyncing
        ? "Syncing"
        : `Synced ${formatAgo(settings.gistSync?.lastSyncedAt)}`;

  const handlePillClick = () => {
    if (state === "error") {
      onFullSync();
      return;
    }
    setOpen((o) => !o);
  };

  const runAndClose = (fn: () => Promise<void> | void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handlePillClick}
        aria-label="Sync status"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
          state === "error"
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[state]} ${isSyncing ? "animate-pulse" : ""}`}
        />
        <span className="truncate max-w-[100px]">{shortLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 animate-scaleUp text-xs">
          <div className="px-3 pt-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/70 mb-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Gist Sync
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Last synced {formatAgo(settings.gistSync?.lastSyncedAt)}
            </div>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={() => runAndClose(onPush)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-indigo-400" />
            <span>Push to Gist</span>
          </button>
          <button
            type="button"
            disabled={isSyncing || !settings.gistSync?.gistId}
            onClick={() => runAndClose(onPull)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pull from Gist</span>
          </button>
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => runAndClose(onFullSync)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>Full Sync</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800/70" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenGistSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Gist Settings…</span>
          </button>
        </div>
      )}
    </div>
  );
};
