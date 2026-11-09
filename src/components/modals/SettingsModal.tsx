/**
 * ChronoCraft - Settings & Workspace Data Management Modal
 */

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  SlidersHorizontal,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
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
  Cloud,
  ArrowUpFromLine,
  ArrowDownToLine,
  Trash2,
} from "lucide-react";
import { AppSettings, TimelineDisplayMode } from "../../types";
import { appDb } from "../../services/db";
import { countTombstones } from "../../services/gistSync";
import { ThemePicker } from "../ui/ThemePicker";

type SettingsTab = "preferences" | "backup" | "storage" | "gist";

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onGistSync?: () => Promise<void>;
  onGistPush?: () => Promise<void>;
  onGistPull?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncResult?: string | null;
  initialTab?: SettingsTab;
  onPurgeTombstones?: (
    olderThanDays?: number,
  ) => Promise<{ purged: number; remaining: number }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onGistSync,
  onGistPush,
  onGistPull,
  isSyncing,
  lastSyncResult,
  initialTab,
  onPurgeTombstones,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    initialTab ?? "preferences",
  );
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

  const [gistToken, setGistToken] = useState(settings.gistSync?.token ?? "");
  const [gistId, setGistId] = useState(settings.gistSync?.gistId ?? "");
  const [autoSync, setAutoSync] = useState(
    settings.gistSync?.autoSyncOnStart ?? false,
  );
  const [autoPullOnFocus, setAutoPullOnFocus] = useState(
    settings.gistSync?.autoPullOnFocus ?? false,
  );

  const [tombstoneStats, setTombstoneStats] = useState<{
    total: number;
    stale: number;
    fresh: number;
    oldestDays: number | null;
  } | null>(null);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeThreshold, setPurgeThreshold] = useState<number>(30);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab ?? "preferences");
    setActiveLimit(settings.xActiveLimit || 5);
    setShowEntryContent(settings.showEntryContent !== false);
    setDisplayMode(settings.timelineDisplayMode ?? "default");
    setNlpAutoExtract(settings.nlpAutoExtract !== false);
    setGistToken(settings.gistSync?.token ?? "");
    setGistId(settings.gistSync?.gistId ?? "");
    setAutoSync(settings.gistSync?.autoSyncOnStart ?? false);
    setAutoPullOnFocus(settings.gistSync?.autoPullOnFocus ?? false);
    setPurgeStatus(null);
    setIsPurging(false);

    countTombstones(purgeThreshold)
      .then((s) => setTombstoneStats(s))
      .catch(() => setTombstoneStats(null));

    const loadStats = async () => {
      try {
        const [entries, notes, events, habits, listItems] = await Promise.all([
          appDb.getAll("entries"),
          appDb.getAll("notes"),
          appDb.getAll("events"),
          appDb.getAll("habits"),
          appDb.getAll("list_items"),
        ]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    countTombstones(purgeThreshold)
      .then((s) => setTombstoneStats(s))
      .catch(() => setTombstoneStats(null));
  }, [isOpen, purgeThreshold]);

  if (!isOpen) return null;

  const deriveFlavor = (theme: AppSettings["theme"]): "dark" | "light" => {
    switch (theme) {
      case "light":
      case "paper":
        return "light";
      default:
        return "dark";
    }
  };

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

  const handlePurge = async () => {
    if (!onPurgeTombstones) return;
    if (
      !window.confirm(
        `Permanently remove tombstones older than ${purgeThreshold} days? ` +
          `Any device that hasn't synced in over ${purgeThreshold} days may ` +
          `resurrect these items on its next push.`,
      )
    ) {
      return;
    }

    setIsPurging(true);
    setPurgeStatus(null);

    try {
      const result = await onPurgeTombstones(purgeThreshold);
      setPurgeStatus(
        `Purged ${result.purged} tombstones. ${result.remaining} still pending.`,
      );
      const fresh = await countTombstones(purgeThreshold);
      setTombstoneStats(fresh);
      setTimeout(() => setPurgeStatus(null), 5000);
    } catch (err: any) {
      setPurgeStatus(`Purge failed: ${err?.message ?? String(err)}`);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="relative w-full md:max-w-xl h-[100dvh] md:h-auto bg-raised rounded-t-3xl md:rounded-2xl shadow-2xl z-10 border-t md:border border-soft overflow-hidden flex flex-col max-h-none md:max-h-[90vh] animate-slideInBottom md:animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 md:py-4 border-b border-soft bg-sunken/50">
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-accent" />
              <span>Workspace Preferences & Data</span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Configure personal display settings, local backups, and storage
              controls.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full overflow-x-auto scrollbar-none items-center gap-2 px-6 pt-3 pb-2 border-b border-soft bg-sunken/40">
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "preferences"
                ? "bg-raised text-primary shadow-xs border border-soft"
                : "text-secondary hover:text-primary"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gist")}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "gist"
                ? "bg-raised text-primary shadow-xs border border-soft"
                : "text-secondary hover:text-primary"
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-accent" />
            <span>Gist Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "backup"
                ? "bg-raised text-primary shadow-xs border border-soft"
                : "text-secondary hover:text-primary"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-info" />
            <span>Data & Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "storage"
                ? "bg-raised text-primary shadow-xs border border-soft"
                : "text-secondary hover:text-primary"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-success" />
            <span>Storage & System</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ================= PREFERENCES ================= */}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              {/* Theme Picker */}
              <div className="p-4 rounded-2xl bg-sunken border border-soft space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Visual Aesthetic Theme
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
                    Choose the visual palette for the entire workspace. Every
                    view, card, and control adapts instantly.
                  </p>
                </div>
                <ThemePicker
                  theme={settings.theme}
                  flavor={settings.themeFlavor ?? deriveFlavor(settings.theme)}
                  onChange={(theme, flavor) =>
                    onUpdateSettings({ theme, themeFlavor: flavor })
                  }
                />
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {showEntryContent ? (
                        <Eye className="w-4 h-4 text-accent" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted" />
                      )}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Show Content of Entries in Timeline
                      </h4>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed max-w-sm">
                      Display descriptions, rich notes, and attached details
                      directly inside Timeline entry cards.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !showEntryContent;
                      setShowEntryContent(next);
                      onUpdateSettings({ showEntryContent: next });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showEntryContent ? "bg-accent" : "bg-strong"
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

              <div className="p-4 rounded-2xl bg-sunken border border-soft space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                      Focus View X-Active Concurrency Limit
                    </h4>
                    <p className="text-xs text-secondary mt-0.5">
                      Strict limit of concurrent in-flight tasks in Today focus
                      mode.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs tabular-nums">
                    {activeLimit} Tasks
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-mono text-muted">1</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={activeLimit}
                    onChange={(e) =>
                      setActiveLimit(parseInt(e.target.value, 10))
                    }
                    className="flex-1 accent-accent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-muted">10</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Timeline Entry Style
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
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
                          ? "border-accent bg-accent/10 text-primary"
                          : "border-soft text-secondary hover:border-accent/40"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          displayMode === id ? "text-accent" : "text-muted"
                        }`}
                      />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-muted">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-warning" />
                    <span>Natural Language Parser</span>
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
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
                    nlpAutoExtract ? "bg-accent" : "bg-strong"
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

          {/* ================= GIST SYNC ================= */}
          {activeTab === "gist" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 text-primary text-xs">
                <ShieldCheck className="w-5 h-5 shrink-0 text-accent mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold block">
                    Sync via GitHub Gist
                  </strong>
                  <p className="leading-relaxed text-secondary">
                    Push your local workspace to a private Gist, then pull it on
                    another device. Requires a Personal Access Token with{" "}
                    <code className="font-mono">gist</code> scope. The token is
                    stored only in your local IndexedDB.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={gistToken}
                    onChange={(e) => setGistToken(e.target.value)}
                    onBlur={() =>
                      onUpdateSettings({
                        gistSync: {
                          ...(settings.gistSync ?? {
                            enabled: true,
                            gistId: "",
                            token: "",
                          }),
                          token: gistToken.trim(),
                          gistId: gistId.trim(),
                          autoSyncOnStart: autoSync,
                          autoPullOnFocus: autoPullOnFocus,
                        },
                      })
                    }
                    placeholder="ghp_..."
                    className="w-full px-3 py-2 rounded-xl bg-raised border border-soft text-xs font-mono text-primary focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Create at github.com/settings/tokens with <code>gist</code>{" "}
                    scope.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Gist ID (leave empty to auto-create)
                  </label>
                  <input
                    type="text"
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    onBlur={() =>
                      onUpdateSettings({
                        gistSync: {
                          ...(settings.gistSync ?? {
                            enabled: true,
                            token: "",
                            gistId: "",
                          }),
                          token: gistToken.trim(),
                          gistId: gistId.trim(),
                          autoSyncOnStart: autoSync,
                          autoPullOnFocus: autoPullOnFocus,
                        },
                      })
                    }
                    placeholder="e.g. 2decf6c462d9b4418f2"
                    className="w-full px-3 py-2 rounded-xl bg-raised border border-soft text-xs font-mono text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-secondary block">
                        Auto-pull on app start
                      </span>
                      <p className="text-[10px] text-muted">
                        Pull remote changes once when the app launches.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !autoSync;
                        setAutoSync(next);
                        onUpdateSettings({
                          gistSync: {
                            ...(settings.gistSync ?? {
                              enabled: true,
                              token: "",
                              gistId: "",
                            }),
                            token: gistToken.trim(),
                            gistId: gistId.trim(),
                            autoSyncOnStart: next,
                            autoPullOnFocus: autoPullOnFocus,
                          },
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        autoSync ? "bg-accent" : "bg-strong"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          autoSync ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs text-secondary block">
                        Auto-pull when returning to the app
                      </span>
                      <p className="text-[10px] text-muted">
                        Pull after the tab has been hidden for 5+ minutes.
                        Pulls, never pushes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !autoPullOnFocus;
                        setAutoPullOnFocus(next);
                        onUpdateSettings({
                          gistSync: {
                            ...(settings.gistSync ?? {
                              enabled: true,
                              token: "",
                              gistId: "",
                            }),
                            token: gistToken.trim(),
                            gistId: gistId.trim(),
                            autoSyncOnStart: autoSync,
                            autoPullOnFocus: next,
                          },
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        autoPullOnFocus ? "bg-accent" : "bg-strong"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                          autoPullOnFocus ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isSyncing || !gistToken.trim()}
                  onClick={() => onGistPush?.()}
                  title="Upload local state to the gist (creates it if missing)"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-soft bg-surface hover:bg-hover disabled:opacity-40 text-secondary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowUpFromLine className="w-4 h-4 text-accent" />
                  <span>Push</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncing || !gistToken.trim() || !gistId.trim()}
                  onClick={() => onGistPull?.()}
                  title="Download and merge remote records into local DB"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-soft bg-surface hover:bg-hover disabled:opacity-40 text-secondary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4 text-success" />
                  <span>Pull</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isSyncing || !gistToken.trim()}
                onClick={() => onGistSync?.()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-accent-fg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Cloud
                  className={`w-4 h-4 ${isSyncing ? "animate-pulse" : ""}`}
                />
                <span>
                  {isSyncing ? "Syncing…" : "Full Sync (Pull then Push)"}
                </span>
              </button>

              {lastSyncResult && (
                <div className="p-3 rounded-xl bg-sunken border border-soft text-[11px] font-mono text-secondary text-center">
                  {lastSyncResult}
                </div>
              )}

              {settings.gistSync?.lastSyncedAt && (
                <p className="text-[10px] text-muted text-center font-mono">
                  Last synced:{" "}
                  {new Date(settings.gistSync.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* ================= DATA & BACKUP ================= */}
          {activeTab === "backup" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-success/10 border border-success/20 text-primary text-xs">
                <ShieldCheck className="w-5 h-5 shrink-0 text-success mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold block">
                    100% Offline-First & Client-Side Privacy
                  </strong>
                  <p className="leading-relaxed text-secondary">
                    All your entries, notes, events, habits, and lists live
                    directly inside your local browser's IndexedDB. Export a
                    JSON backup to migrate between computers or keep offsite
                    archives.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Export Full Workspace
                  </h4>
                  <p className="text-xs text-secondary">
                    Download a comprehensive, human-readable JSON archive of all
                    your data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-app text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Restore from Backup
                  </h4>
                  <p className="text-xs text-secondary">
                    Upload an existing ChronoCraft JSON backup to restore your
                    data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-soft hover:bg-hover text-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4 text-info" />
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
                <div className="p-3 rounded-xl bg-accent/10 text-accent text-xs font-mono text-center animate-fadeIn">
                  {exportStatus}
                </div>
              )}
              {importStatus && (
                <div className="p-3 rounded-xl bg-success/10 text-success text-xs font-mono text-center animate-fadeIn">
                  {importStatus}
                </div>
              )}
            </div>
          )}

          {/* ================= STORAGE & SYSTEM ================= */}
          {activeTab === "storage" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  Database Record Counters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { label: "Timeline Entries", value: storageStats.entries },
                    { label: "Saved Notes", value: storageStats.notes },
                    { label: "Calendar Events", value: storageStats.events },
                    { label: "Active Habits", value: storageStats.habits },
                    { label: "Sub-List Items", value: storageStats.listItems },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-3 rounded-xl bg-sunken border border-soft"
                    >
                      <span className="text-[10px] font-mono uppercase text-muted">
                        {s.label}
                      </span>
                      <div className="text-lg font-bold font-mono text-primary tabular-nums">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-sunken border border-soft text-xs text-secondary">
                <HardDrive className="w-4 h-4 text-accent" />
                <span>
                  Engine: IndexedDB v1 · State Engine Healthy · Persistence
                  Active
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-sunken border border-soft space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-warning" />
                    <span>Tombstone Cleanup</span>
                  </h4>
                  <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                    Deleted items are kept as lightweight "tombstones" so the
                    deletion propagates to other devices on the next sync. Old
                    tombstones can be purged once every device has synced.
                  </p>
                </div>

                {tombstoneStats ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-raised border border-soft">
                      <div className="text-[10px] font-mono uppercase text-muted">
                        Total
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-primary">
                        {tombstoneStats.total}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-raised border border-soft">
                      <div className="text-[10px] font-mono uppercase text-muted">
                        Purgeable
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-warning">
                        {tombstoneStats.stale}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-raised border border-soft">
                      <div className="text-[10px] font-mono uppercase text-muted">
                        Oldest
                      </div>
                      <div className="text-lg font-bold font-mono tabular-nums text-primary">
                        {tombstoneStats.oldestDays !== null
                          ? `${tombstoneStats.oldestDays}d`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-raised border border-soft text-center text-[11px] text-muted">
                    Counting tombstones…
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-secondary">
                    Purge older than
                  </label>
                  <select
                    value={purgeThreshold}
                    onChange={(e) =>
                      setPurgeThreshold(parseInt(e.target.value, 10))
                    }
                    className="px-2.5 py-1 w-fit rounded-lg bg-raised border border-soft text-xs font-mono text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value={0}>All tombstones (right now)</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days (recommended)</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>

                {purgeThreshold === 0 && (
                  <p className="text-[10px] text-danger leading-relaxed">
                    ⚠ Purges all tombstones immediately. Any device that has not
                    yet synced this deletion will resurrect the item on its next
                    push.
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    isPurging || !tombstoneStats || tombstoneStats.stale === 0
                  }
                  onClick={handlePurge}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-warning/10 hover:bg-warning/20 disabled:opacity-40 disabled:cursor-not-allowed text-warning border border-warning/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isPurging
                      ? "Purging…"
                      : tombstoneStats?.stale === 0
                        ? `Nothing to purge (${tombstoneStats.total} kept for sync safety)`
                        : `Purge ${tombstoneStats?.stale} of ${tombstoneStats?.total} tombstones`}
                  </span>
                </button>

                {purgeStatus && (
                  <div className="p-2 rounded-lg bg-raised border border-soft text-[11px] font-mono text-secondary text-center animate-fadeIn">
                    {purgeStatus}
                  </div>
                )}

                {tombstoneStats && tombstoneStats.fresh > 0 && (
                  <p className="text-[10px] text-muted leading-relaxed">
                    {tombstoneStats.fresh} tombstone
                    {tombstoneStats.fresh === 1 ? "" : "s"} younger than the
                    threshold will be kept. Only tombstones older than{" "}
                    {purgeThreshold} days are removed.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-danger/20 bg-danger/5 space-y-2">
                <div className="flex items-center gap-2 text-danger font-semibold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Danger Zone</span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Resetting replaces current data with the default sample seed
                  template (sample projects, books, habits, and timeline items).
                </p>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All Workspace Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-soft bg-sunken/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyPreferences}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
