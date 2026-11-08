/**
 * ChronoCraft - Sync Status Strip (mobile)
 * Thin status bar above the mobile nav tabs. Tap → opens sync sheet.
 * Hidden entirely when sync isn't configured.
 */

import React, { useState } from "react";
import {
  Cloud,
  ChevronDown,
  X,
  ArrowUpFromLine,
  ArrowDownToLine,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";
import { AppSettings } from "../../types";

interface SyncStatusStripProps {
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
  if (!iso) return "Never synced";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DOT_CLASS: Record<DotState, string> = {
  synced: "bg-emerald-500",
  stale: "bg-amber-500",
  error: "bg-rose-500",
  off: "bg-slate-400",
};

export const SyncStatusStrip: React.FC<SyncStatusStripProps> = ({
  settings,
  isSyncing,
  lastSyncResult,
  onPush,
  onPull,
  onFullSync,
  onOpenGistSettings,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Hidden when not configured
  if (!settings.gistSync?.token) return null;

  const state = getDotState(settings, lastSyncResult);
  const label =
    state === "error"
      ? "Sync failed · Tap to retry"
      : isSyncing
        ? "Syncing…"
        : `Synced · ${formatAgo(settings.gistSync?.lastSyncedAt)}`;

  const handleStripClick = () => {
    if (state === "error") {
      // One-tap retry
      onFullSync();
      return;
    }
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);

  const runAndClose = async (fn: () => Promise<void> | void) => {
    closeSheet();
    await fn();
  };

  return (
    <>
      {/* Strip */}
      <button
        type="button"
        onClick={handleStripClick}
        className="md:hidden w-full h-6 flex items-center gap-2 px-4 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-[#0B0F17]/90 border-b border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer"
        aria-label="Sync status"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[state]} ${isSyncing ? "animate-pulse" : ""}`}
        />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            onClick={closeSheet}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div
            className="fixed bottom-0 inset-x-0 bg-white dark:bg-[#111724] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl p-5 space-y-3 animate-slideInBottom text-slate-900 dark:text-slate-100"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)",
            }}
          >
            {/* Drag handle + header */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="w-full flex items-center justify-between pt-1">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Gist Sync
                  </div>
                  <div className="text-sm font-semibold truncate">
                    {formatAgo(settings.gistSync?.lastSyncedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {lastSyncResult && (
              <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 text-center">
                {lastSyncResult}
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => runAndClose(onPush)}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-40"
              >
                <ArrowUpFromLine className="w-4 h-4 text-indigo-400" />
                <span>Push to Gist</span>
              </button>
              <button
                type="button"
                disabled={isSyncing || !settings.gistSync?.gistId}
                onClick={() => runAndClose(onPull)}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-40"
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <span>Pull from Gist</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => runAndClose(onFullSync)}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-40"
              >
                <RefreshCw
                  className={`w-4 h-4 text-cyan-400 ${isSyncing ? "animate-spin" : ""}`}
                />
                <span>Full Sync (Pull then Push)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeSheet();
                  onOpenGistSettings();
                }}
                className="w-full flex items-center gap-3 py-3 px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                <span>Gist Settings…</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
