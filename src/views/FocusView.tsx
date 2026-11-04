/**
 * ChronoCraft - Focus View Component
 * Horizontal tab strip: Today | Scratchpad | [+ Custom Tab]
 * Today tab: Anchors, X-Active Engine (X max immediate tasks), Completed section.
 * Scratchpad: Google Keep style brain dump stacked cards.
 * Custom Tabs: Dynamic workspaces with background hues and dedicated input bars.
 */

import React, { useState } from "react";
import {
  Anchor,
  Zap,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Pin,
  FileText,
  Sliders,
  Sparkles,
  Edit2,
  Palette,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import {
  AppSettings,
  CustomFocusTab,
  EntryPriority,
  EntryType,
  ScratchpadCard,
  TimelineEntry,
} from "../types";
import { NLPInputBar } from "../components/NLPInputBar";
import { stripHtml } from "../components/RichTextEditor";

interface FocusViewProps {
  entries: TimelineEntry[];
  customTabs: CustomFocusTab[];
  scratchpadCards: ScratchpadCard[];
  settings: AppSettings;
  onAddEntry: (entry: Partial<TimelineEntry>) => Promise<void>;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onAddScratchpad: (card: Partial<ScratchpadCard>) => Promise<void>;
  onUpdateScratchpad: (card: ScratchpadCard) => Promise<void>;
  onDeleteScratchpad: (cardId: string) => Promise<void>;
  onSendScratchpadToTimeline: (card: ScratchpadCard) => Promise<void>;
  onCreateCustomTab: (tab: Partial<CustomFocusTab>) => Promise<void>;
  onUpdateCustomTab: (tab: CustomFocusTab) => Promise<void>;
  onDeleteCustomTab: (tabId: string) => Promise<void>;
  onOpenSettings: () => void;
  onOpenContextMenu?: (item: any, pos: { x: number; y: number }) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  entries,
  customTabs,
  scratchpadCards,
  settings,
  onAddEntry,
  onToggleEntryStatus,
  onDeleteEntry,
  onAddScratchpad,
  onUpdateScratchpad,
  onDeleteScratchpad,
  onSendScratchpadToTimeline,
  onCreateCustomTab,
  onUpdateCustomTab,
  onDeleteCustomTab,
  onOpenSettings,
  onOpenContextMenu,
}) => {
  const [activeTab, setActiveTab] = useState<"today" | "scratchpad" | string>(
    "today",
  );
  const [isCreatingTab, setIsCreatingTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [newTabBgColor, setNewTabBgColor] = useState("#4F46E5");

  // Edit custom tab state
  const [editingTab, setEditingTab] = useState<CustomFocusTab | null>(null);

  // Scratchpad quick draft
  const [scratchTitle, setScratchTitle] = useState("");
  const [scratchBody, setScratchBody] = useState("");
  const [scratchColor, setScratchColor] = useState("#1E293B");

  // Filter entries for Today
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Anchors: scheduled entries
  const anchorEntries = entries.filter(
    (e) => e.source === "focus-anchor" && e.status !== "completed",
  );

  // X-Active: immediate tasks
  const activeEntries = entries.filter(
    (e) => e.source === "focus-active" && e.status !== "completed",
  );

  // Completed: checked off items from Anchors and X-Active
  const completedEntries = entries.filter(
    (e) =>
      e.status === "completed" &&
      (e.source === "focus-anchor" || e.source === "focus-active"),
  );

  // Active limit logic
  const isEngineAtCapacity = activeEntries.length >= settings.xActiveLimit;

  // Custom tab entries if activeTab is a custom tab ID
  const currentCustomTab = customTabs.find((t) => t.id === activeTab);
  const customTabEntries = entries.filter((e) => e.tabId === activeTab);

  const handleCreateTabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;

    await onCreateCustomTab({
      name: newTabName.trim(),
      bgColor: newTabBgColor,
    });
    setNewTabName("");
    setIsCreatingTab(false);
  };

  const handleEditTabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTab || !editingTab.name.trim()) return;

    await onUpdateCustomTab(editingTab);
    setEditingTab(null);
  };

  const handleAddScratchpadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchTitle.trim() && !scratchBody.trim()) return;

    await onAddScratchpad({
      title: scratchTitle.trim() || "Untitled Note",
      content: scratchBody.trim(),
      color: scratchColor,
      isPinned: false,
    });

    setScratchTitle("");
    setScratchBody("");
  };

  const formatCompletedTime = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const formatScheduledTime = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 1. Horizontal Tab Strip */}
      <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {/* Default Tab: Today */}
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "today"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Today</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {activeEntries.length}/{settings.xActiveLimit}
            </span>
          </button>

          {/* Default Tab: Scratchpad */}
          <button
            type="button"
            onClick={() => setActiveTab("scratchpad")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "scratchpad"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {scratchpadCards.length}
            </span>
          </button>

          {/* Dynamic Custom Tabs */}
          {customTabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative flex items-center group">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isTabActive
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.bgColor }}
                  />
                  <span>{tab.name}</span>
                </button>

                {/* Edit / Delete Tab Affordance */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTab(tab);
                  }}
                  title="Configure Custom Tab"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-100 transition-opacity ml-[-8px] mr-1"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Action: [+ Custom Tab] */}
          <button
            type="button"
            onClick={() => setIsCreatingTab(true)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-500/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Tab</span>
          </button>
        </div>
      </div>

      {/* 2. Main Tab Body Viewport */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* ================= TAB 1: TODAY ================= */}
        {activeTab === "today" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            {/* Section 1: Anchors (Scheduled Entries) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Anchors (Scheduled Commitments)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {anchorEntries.length} Scheduled
                </span>
              </div>

              {/* Dedicated NLP Input Bar for Anchors */}
              <NLPInputBar
                placeholder='Add an anchor (e.g., "Executive Architecture Review at 2pm !high #review")'
                defaultType="event"
                showTypeSwitcher={false}
                buttonLabel="Schedule Anchor"
                onSubmit={(parsed) => {
                  onAddEntry({
                    type: parsed.type || "event",
                    title: parsed.title,
                    scheduledAt: parsed.scheduledAt || new Date().toISOString(),
                    status: "pending",
                    source: "focus-anchor",
                    tags: parsed.tags,
                    priority: parsed.priority || "high",
                  });
                }}
              />

              {/* Anchors List */}
              <div className="space-y-2 mt-2">
                {anchorEntries.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
                    No hard schedule anchors set for today. Add key meetings or
                    fixed timeblocks above.
                  </div>
                ) : (
                  anchorEntries.map((anchor) => (
                    <div
                      key={anchor.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (onOpenContextMenu) {
                          onOpenContextMenu(anchor, {
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }
                      }}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleEntryStatus(anchor.id)}
                          className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {anchor.title}
                          </div>
                          {anchor.scheduledAt && (
                            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatScheduledTime(anchor.scheduledAt)}
                              </span>
                              {anchor.tags.length > 0 && (
                                <>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500">
                                    {anchor.tags.map((t) => `#${t}`).join(" ")}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenContextMenu) {
                              const rect = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              onOpenContextMenu(anchor, {
                                x: rect.left,
                                y: rect.bottom + 4,
                              });
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(anchor.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section 2: X-Active Engine (Immediate Tasks) */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {settings.xActiveLimit}-Active Max Concurrent Tasks
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[0.5rem] md:text-[0.6rem] font-mono font-bold tabular-nums px-2 py-0.5 rounded-md ${
                      isEngineAtCapacity
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    {activeEntries.length} / {settings.xActiveLimit} ACTIVE
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    title="Change X-Active limit in settings"
                    className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dedicated NLP Input Bar for X-Active Tasks */}
              <NLPInputBar
                placeholder={
                  isEngineAtCapacity
                    ? `Capacity full (${settings.xActiveLimit}/${settings.xActiveLimit})! Complete a task or raise limit in settings.`
                    : 'Add immediate task to active queue (e.g., "Draft architecture doc !high #core")'
                }
                defaultType="task"
                showTypeSwitcher={false}
                buttonLabel="Engage Task"
                onSubmit={(parsed) => {
                  if (isEngineAtCapacity) {
                    alert(
                      `X-Active Engine is at full capacity (${settings.xActiveLimit} tasks). Complete an active task or raise the limit in settings.`,
                    );
                    return;
                  }
                  onAddEntry({
                    type: "task",
                    title: parsed.title,
                    scheduledAt: parsed.scheduledAt,
                    status: "active",
                    source: "focus-active",
                    tags: parsed.tags,
                    priority: parsed.priority || "normal",
                  });
                }}
              />

              {/* Active Tasks List */}
              <div className="space-y-2 mt-2">
                {activeEntries.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
                    No active tasks currently engaged. Populate your immediate
                    focus queue above.
                  </div>
                ) : (
                  activeEntries.map((task, idx) => (
                    <div
                      key={task.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (onOpenContextMenu) {
                          onOpenContextMenu(task, {
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }
                      }}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleEntryStatus(task.id)}
                          title="Click to complete task"
                          className="text-slate-400 hover:text-emerald-500 hover:scale-110 transition-all shrink-0 cursor-pointer p-0.5"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              0{idx + 1}.
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {task.title}
                            </span>
                            {task.priority === "high" && (
                              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">
                                !HIGH
                              </span>
                            )}
                          </div>
                          {task.tags.length > 0 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {task.tags.map((t) => `#${t}`).join(" ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenContextMenu) {
                              const rect = (
                                e.currentTarget as HTMLElement
                              ).getBoundingClientRect();
                              onOpenContextMenu(task, {
                                x: rect.left,
                                y: rect.bottom + 4,
                              });
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section 3: Completed Entries */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Completed (Anchors & Active Work)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  {completedEntries.length} Done Today
                </span>
              </div>

              {/* Dedicated NLP Input Bar to directly log completed work */}
              <NLPInputBar
                placeholder='Quick-log completed item (e.g., "Shipped PR for NLP tokenizer at 11am")'
                defaultType="log"
                showTypeSwitcher={false}
                buttonLabel="Log Done"
                onSubmit={(parsed) => {
                  const now = new Date().toISOString();
                  onAddEntry({
                    type: "log",
                    title: parsed.title,
                    scheduledAt: parsed.scheduledAt,
                    createdAt: now,
                    completedAt: now,
                    status: "completed",
                    source: "focus-active",
                    tags: parsed.tags,
                  });
                }}
              />

              {/* Completed List */}
              <div className="space-y-2 mt-2">
                {completedEntries.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-400">
                    Checked-off tasks and anchors will appear here with
                    completed timestamps and stream to your Timeline spine.
                  </div>
                ) : (
                  completedEntries.map((done) => (
                    <div
                      key={done.id}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#101520] border border-slate-200 dark:border-slate-800/60 opacity-80 hover:opacity-100 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleEntryStatus(done.id)}
                          title="Click to restore to active queue"
                          className="text-emerald-500 hover:text-slate-400 transition-colors shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <span className="text-sm text-slate-500 line-through truncate block">
                            {done.title}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                            Completed at {formatCompletedTime(done.completedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(done.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SCRATCHPAD (KEEP-STYLE CARDS) ================= */}
        {activeTab === "scratchpad" && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
            {/* Quick Note Input Bar */}
            <form
              onSubmit={handleAddScratchpadSubmit}
              className="p-4 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-md space-y-3"
            >
              <input
                type="text"
                value={scratchTitle}
                onChange={(e) => setScratchTitle(e.target.value)}
                placeholder="Title..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <textarea
                rows={3}
                value={scratchBody}
                onChange={(e) => setScratchBody(e.target.value)}
                placeholder="Take a quick note or brain dump..."
                className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    Color:
                  </span>
                  {["#1E293B", "#1E3A8A", "#064E3B", "#701A75", "#78350F"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setScratchColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border border-slate-700 transition-transform ${
                          scratchColor === c
                            ? "scale-125 ring-2 ring-indigo-500"
                            : "opacity-80"
                        }`}
                      />
                    ),
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!scratchTitle.trim() && !scratchBody.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pin Note</span>
                </button>
              </div>
            </form>

            {/* Note Cards Stack / Grid (Google Keep Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scratchpadCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: card.color || "#1E293B",
                  }}
                  className="group relative p-4 rounded-2xl text-white border border-white/10 shadow-lg flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-snug break-words">
                        {card.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateScratchpad({
                            ...card,
                            isPinned: !card.isPinned,
                          })
                        }
                        className={`p-1 rounded-md transition-colors ${
                          card.isPinned
                            ? "text-amber-400"
                            : "text-white/40 hover:text-white"
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
                      {stripHtml(card.content)}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => onSendScratchpadToTimeline(card)}
                      className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Send to Timeline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteScratchpad(card.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CUSTOM TAB ================= */}
        {activeTab !== "today" &&
          activeTab !== "scratchpad" &&
          currentCustomTab && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
              {/* Custom Tab Banner Header */}
              <div
                className="p-6 rounded-2xl text-white shadow-lg flex items-center justify-between"
                style={{ backgroundColor: currentCustomTab.bgColor }}
              >
                <div>
                  <h2 className="text-lg font-bold">{currentCustomTab.name}</h2>
                  <p className="text-xs text-white/80 mt-1">
                    Custom focus workspace. Add dedicated queue tasks and
                    project items below.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTab(currentCustomTab)}
                    className="px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-xs font-medium text-white transition-colors"
                  >
                    Rename & Color
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(`Delete tab "${currentCustomTab.name}"?`)
                      ) {
                        onDeleteCustomTab(currentCustomTab.id);
                        setActiveTab("today");
                      }
                    }}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-500 text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dedicated Input Bar for Custom Tab */}
              <NLPInputBar
                placeholder={`Add task to ${currentCustomTab.name}... (e.g., "Refine mockups at 4pm !high")`}
                defaultType="task"
                showTypeSwitcher={false}
                buttonLabel="Add to Queue"
                onSubmit={(parsed) => {
                  onAddEntry({
                    type: "task",
                    title: parsed.title,
                    scheduledAt: parsed.scheduledAt,
                    status: "active",
                    source: "custom-tab",
                    tabId: currentCustomTab.id,
                    tags: parsed.tags,
                    priority: parsed.priority || "normal",
                  });
                }}
              />

              {/* Custom Tab Entries List */}
              <div className="space-y-2">
                {customTabEntries.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No tasks in this custom queue yet. Add entries using the
                    input bar above.
                  </div>
                ) : (
                  customTabEntries.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleEntryStatus(item.id)}
                          className="text-slate-400 hover:text-emerald-500 transition-colors"
                        >
                          {item.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`text-sm font-semibold truncate ${
                            item.status === "completed"
                              ? "line-through text-slate-400"
                              : "text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteEntry(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
      </div>

      {/* Modal: Create Custom Tab */}
      {isCreatingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCreatingTab(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <form
            onSubmit={handleCreateTabSubmit}
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 space-y-4 animate-scaleUp"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Create New Custom Tab
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tab Name
              </label>
              <input
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="e.g., Sprint Launch, Deep Work"
                autoFocus
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  "#4F46E5",
                  "#059669",
                  "#0284C7",
                  "#D97706",
                  "#DB2777",
                  "#7C3AED",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTabBgColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newTabBgColor === c
                        ? "scale-125 ring-2 ring-indigo-500"
                        : "opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingTab(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTabName.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
              >
                Create Tab
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Custom Tab */}
      {editingTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setEditingTab(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <form
            onSubmit={handleEditTabSubmit}
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 space-y-4 animate-scaleUp"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Edit Custom Tab
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tab Name
              </label>
              <input
                type="text"
                value={editingTab.name}
                onChange={(e) =>
                  setEditingTab({ ...editingTab, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  "#4F46E5",
                  "#059669",
                  "#0284C7",
                  "#D97706",
                  "#DB2777",
                  "#7C3AED",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditingTab({ ...editingTab, bgColor: c })}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      editingTab.bgColor === c
                        ? "scale-125 ring-2 ring-indigo-500"
                        : "opacity-80"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTab(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editingTab.name.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
