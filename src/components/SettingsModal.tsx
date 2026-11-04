/**
 * ChronoCraft - Settings & Workspace Data Management Modal
 * Redesigned with modern tabbed UI patterns (Preferences, Data & Backup, Storage & System),
 * toggle for "Show Entry Content in Timeline", X-Active limit control, and IndexedDB management.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  SlidersHorizontal,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Moon,
  Sun,
  Database,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  LayoutGrid,
  List,
  AlignJustify,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { AppSettings, TimelineDisplayMode } from "../types";
import { appDb } from "../services/db";

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

type SettingsTab = "preferences" | "backup" | "storage";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  const [activeLimit, setActiveLimit] = useState(settings.xActiveLimit || 5);
  const [showEntryContent, setShowEntryContent] = useState(
    settings.showEntryContent !== false,
  );
  const [displayMode, setDisplayMode] = useState<TimelineDisplayMode>(
    settings.timelineDisplayMode ?? "default",
  );
  const [nlpAutoExtract, setNlpAutoExtract] = useState(
    settings.nlpAutoExtract !== false,
  );
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{
    entries: number;
    notes: number;
    events: number;
    habits: number;
    listItems: number;
  }>({ entries: 0, notes: 0, events: 0, habits: 0, listItems: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveLimit(settings.xActiveLimit || 5);
      setShowEntryContent(settings.showEntryContent !== false);
      setDisplayMode(settings.timelineDisplayMode ?? "default");
      setNlpAutoExtract(settings.nlpAutoExtract !== false);

      // Load database stats
      const loadStats = async () => {
        try {
          const [entries, notes, events, habits, listItems] = await Promise.all(
            [
              appDb.getAll("entries"),
              appDb.getAll("notes"),
              appDb.getAll("events"),
              appDb.getAll("habits"),
              appDb.getAll("list_items"),
            ],
          );
          setStorageStats({
            entries: entries.length,
            notes: notes.length,
            events: events.length,
            habits: habits.length,
            listItems: listItems.length,
          });
        } catch {
          // Ignore
        }
      };
      loadStats();
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleApplyPreferences = () => {
    onUpdateSettings({
      xActiveLimit: activeLimit,
      showEntryContent,
      timelineDisplayMode: displayMode,
      nlpAutoExtract,
    });
    onClose();
  };

  const handleExport = async () => {
    try {
      setExportStatus("Generating JSON export...");
      const json = await appDb.exportDatabase();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chronocraft-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Export downloaded successfully!");
      setTimeout(() => setExportStatus(null), 3000);
    } catch {
      setExportStatus("Export failed");
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const ok = await appDb.importDatabase(content);
        if (ok) {
          setImportStatus("Backup restored successfully!");
          setTimeout(() => {
            setImportStatus(null);
            onClose();
            window.location.reload();
          }, 1200);
        } else {
          setImportStatus("Invalid JSON backup file");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all workspace data to default initial template? Your current custom entries will be replaced.",
      )
    ) {
      await appDb.resetWorkspace();
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111724] rounded-2xl shadow-2xl z-10 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E131E]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <span>Workspace Preferences & Data</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure personal display settings, local backups, and storage
              controls.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "backup"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Data & Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "storage"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Storage & System</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ================= TAB 1: PREFERENCES ================= */}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              {/* Feature: Show Entry Content in Timeline Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {showEntryContent ? (
                        <Eye className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Show Content of Entries in Timeline
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      Display descriptions, rich notes, and attached details
                      directly inside Timeline entry cards.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showEntryContent;
                      setShowEntryContent(next);
                      onUpdateSettings({ showEntryContent: next });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showEntryContent
                        ? "bg-indigo-600"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        showEntryContent ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Focus View X-Active Engine Limit */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Focus View X-Active Concurrency Limit
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Strict limit of concurrent in-flight tasks in Today focus
                      mode.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm tabular-nums">
                    {activeLimit} Tasks
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-mono text-slate-400">
                    1
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={activeLimit}
                    onChange={(e) =>
                      setActiveLimit(parseInt(e.target.value, 10))
                    }
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-400">
                    10
                  </span>
                </div>
              </div>

              {/* Timeline Entry Style */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Timeline Entry Style
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose how entries are displayed in the Timeline view.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: "default",
                        label: "Default",
                        hint: "Full cards",
                        Icon: LayoutGrid,
                      },
                      {
                        id: "compact",
                        label: "Compact",
                        hint: "Two-line cards",
                        Icon: List,
                      },
                      {
                        id: "flat",
                        label: "Flat",
                        hint: "No card, just rows",
                        Icon: AlignJustify,
                      },
                    ] as const
                  ).map(({ id, label, hint, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={displayMode === id}
                      onClick={() => {
                        setDisplayMode(id);
                        onUpdateSettings({ timelineDisplayMode: id });
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        displayMode === id
                          ? "border-indigo-500 bg-indigo-500/10 text-slate-900 dark:text-slate-100"
                          : "border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-500/40"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${displayMode === id ? "text-indigo-500" : "text-slate-400"}`}
                      />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-slate-400">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Preference */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Visual Aesthetic Theme
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Switch between Obsidian Dark and Clean Slate Light styling.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: "dark" })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      settings.theme === "dark"
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ theme: "light" })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      settings.theme === "light"
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-slate-500 hover:text-slate-200"
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* NLP Auto-Extraction */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Natural Language Parser</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automatically detect time ranges (e.g. "from 1pm to 3pm"),
                    tags, and !high priority from input.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !nlpAutoExtract;
                    setNlpAutoExtract(next);
                    onUpdateSettings({ nlpAutoExtract: next });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    nlpAutoExtract
                      ? "bg-indigo-600"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      nlpAutoExtract ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DATA & BACKUP ================= */}
          {activeTab === "backup" && (
            <div className="space-y-4">
              {/* Privacy Notice */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold block text-emerald-700 dark:text-emerald-200">
                    100% Offline-First & Client-Side Privacy
                  </strong>
                  <p className="leading-relaxed opacity-90">
                    All your entries, notes, events, habits, and lists live
                    directly inside your local browser's IndexedDB. Export a
                    JSON backup to migrate between computers or keep offsite
                    archives.
                  </p>
                </div>
              </div>

              {/* JSON Export Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Export Full Workspace
                  </h4>
                  <p className="text-xs text-slate-500">
                    Download a comprehensive, human-readable JSON archive of all
                    your data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* JSON Import Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Restore from Backup
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload an existing ChronoCraft JSON backup to restore your
                    data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Select File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>

              {exportStatus && (
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 text-xs font-mono text-center animate-fadeIn">
                  {exportStatus}
                </div>
              )}
              {importStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-mono text-center animate-fadeIn">
                  {importStatus}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: STORAGE & SYSTEM ================= */}
          {activeTab === "storage" && (
            <div className="space-y-4">
              {/* Storage Telemetry Cards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  Database Record Counters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Timeline Entries
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {storageStats.entries}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Saved Notes
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {storageStats.notes}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Calendar Events
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {storageStats.events}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Active Habits
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {storageStats.habits}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      Sub-List Items
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 tabular-nums">
                      {storageStats.listItems}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>
                  Engine: IndexedDB v1 · State Engine Healthy · Persistence
                  Active
                </span>
              </div>

              {/* Danger Zone: Reset Template */}
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Resetting replaces current data with the default sample seed
                  template (sample projects, books, habits, and timeline items).
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Workspace Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E131E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyPreferences}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
