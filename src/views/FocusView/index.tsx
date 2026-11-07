/**
 * ChronoCraft - Focus View Component
 * Horizontal tab strip: Today | Scratchpad | [+ Custom Tab]
 * Today tab: Anchors, X-Active Engine (X max immediate tasks), Completed section.
 * Scratchpad: Google Keep style brain dump stacked cards.
 * Custom Tabs: Dynamic workspaces with background hues and dedicated input bars.
 */

import React, { useState } from "react";
import { Zap, Plus, FileText, Edit2, MoreVertical } from "lucide-react";
import {
  AppSettings,
  CustomFocusTab,
  ScratchpadCard,
  TimelineEntry,
} from "../../types";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MobileTabPicker } from "./MobileTabPicker";
import { EditTabModal } from "./EditTabModal";
import { CreateTabModal } from "./CreateTabModal";
import { TodayTab } from "./TodayTab";
import { ScratchpadTab } from "./ScratchpadTab";
import { CustomTabView } from "./CustomTabView";

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

  // Edit custom tab state
  const [editingTab, setEditingTab] = useState<CustomFocusTab | null>(null);

  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  // Filter entries for Today
  const todayDateStr = new Date().toISOString().split("T")[0];

  // Determine if on mobile
  const isMobile = useIsMobile();

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

  // Custom tab entries if activeTab is a custom tab ID
  const currentCustomTab = customTabs.find((t) => t.id === activeTab);
  const customTabEntries = entries.filter((e) => e.tabId === activeTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* 1. Horizontal Tab Strip */}
      <div className="px-4 md:px-6 pt-4 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] shrink-0">
        {/* Desktop: original scrolling strip */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-px">
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

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTab(tab);
                  }}
                  title="Configure Custom Tab"
                  className="opacity-60 md:opacity-0 md:group-hover:opacity-100
 p-1 text-slate-400 hover:text-slate-100 transition-opacity -ml-2 mr-1"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCreatingTab(true)}
            className="flex items-center gap-2 px-4 pb-3 py-2.5 pl-0 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-500/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Tab</span>
          </button>
        </div>

        {/* Mobile: fixed 2 tabs + overflow menu for custom tabs */}
        <div className="md:hidden flex items-stretch">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "today"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Today</span>
            <span className="font-mono text-[10px] opacity-70">
              {activeEntries.length}/{settings.xActiveLimit}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scratchpad")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "scratchpad"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
            <span className="font-mono text-[10px] opacity-70">
              {scratchpadCards.length}
            </span>
          </button>

          {/* More button — opens the mobile tab picker */}
          <button
            type="button"
            onClick={() => setMobileTabsOpen((o) => !o)}
            aria-expanded={mobileTabsOpen}
            aria-label="More focus tabs"
            className={`w-12 flex items-center justify-center border-b-2 transition-all ${
              currentCustomTab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500"
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Tab Body Viewport */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {/* ================= TAB 1: TODAY ================= */}
        {activeTab === "today" && (
          <TodayTab
            anchorEntries={anchorEntries}
            activeEntries={activeEntries}
            completedEntries={completedEntries}
            settings={settings}
            isMobile={isMobile}
            onAddEntry={onAddEntry}
            onToggleEntryStatus={onToggleEntryStatus}
            onDeleteEntry={onDeleteEntry}
            onOpenSettings={onOpenSettings}
            onOpenContextMenu={onOpenContextMenu}
          />
        )}

        {/* ================= TAB 2: SCRATCHPAD (KEEP-STYLE CARDS) ================= */}

        {activeTab === "scratchpad" && (
          <ScratchpadTab
            scratchpadCards={scratchpadCards}
            onAddScratchpad={onAddScratchpad}
            onUpdateScratchpad={onUpdateScratchpad}
            onDeleteScratchpad={onDeleteScratchpad}
            onSendScratchpadToTimeline={onSendScratchpadToTimeline}
          />
        )}

        {/* ================= TAB 3: CUSTOM TAB ================= */}
        {activeTab !== "today" &&
          activeTab !== "scratchpad" &&
          currentCustomTab && (
            <CustomTabView
              currentCustomTab={currentCustomTab}
              customTabEntries={customTabEntries}
              isMobile={isMobile}
              onAddEntry={onAddEntry}
              onToggleEntryStatus={onToggleEntryStatus}
              onDeleteEntry={onDeleteEntry}
              onEditTab={(tab) => setEditingTab(tab)}
              onDeleteTab={onDeleteCustomTab}
              onSwitchAway={() => setActiveTab("today")}
            />
          )}
      </div>

      {/* Modal: Create Custom Tab */}
      <CreateTabModal
        isOpen={isCreatingTab}
        onClose={() => setIsCreatingTab(false)}
        onCreate={async (data) => {
          await onCreateCustomTab({
            name: data.name,
            bgColor: data.bgColor,
          });
          setIsCreatingTab(false);
        }}
      />

      {/* Modal: Edit Custom Tab */}
      <EditTabModal
        tab={editingTab}
        onClose={() => setEditingTab(null)}
        onSave={async (tab) => {
          await onUpdateCustomTab(tab);
          setEditingTab(null);
        }}
      />

      {/* Mobile: Focus Tab Picker (bottom sheet) */}
      <MobileTabPicker
        isOpen={mobileTabsOpen}
        customTabs={customTabs}
        activeTab={activeTab}
        onClose={() => setMobileTabsOpen(false)}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onEditTab={(tab) => setEditingTab(tab)}
        onCreateNew={() => setIsCreatingTab(true)}
      />
    </div>
  );
};
