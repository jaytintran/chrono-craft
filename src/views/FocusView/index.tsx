/**
 * ChronoCraft - Focus View Component
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
  const [editingTab, setEditingTab] = useState<CustomFocusTab | null>(null);
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);

  const isMobile = useIsMobile();

  const anchorEntries = entries.filter(
    (e) => e.source === "focus-anchor" && e.status !== "completed",
  );
  const activeEntries = entries.filter(
    (e) => e.source === "focus-active" && e.status !== "completed",
  );
  const completedEntries = entries.filter(
    (e) =>
      e.status === "completed" &&
      (e.source === "focus-anchor" || e.source === "focus-active"),
  );

  const currentCustomTab = customTabs.find((t) => t.id === activeTab);
  const customTabEntries = entries.filter((e) => e.tabId === activeTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 pt-4 border-b border-soft bg-app shrink-0">
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "today"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Today</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-hover text-secondary">
              {activeEntries.length}/{settings.xActiveLimit}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scratchpad")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "scratchpad"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-hover text-secondary">
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
                      ? "border-accent text-accent font-bold"
                      : "border-transparent text-secondary hover:text-primary"
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
                  className="opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1 text-muted hover:text-primary transition-opacity -ml-2 mr-1"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCreatingTab(true)}
            className="flex items-center gap-2 px-4 pb-3 py-2.5 pl-0 text-xs font-semibold text-muted hover:text-accent transition-colors whitespace-nowrap shrink-0 border-soft rounded-lg hover:border-accent/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Tab</span>
          </button>
        </div>

        <div className="md:hidden flex items-stretch">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "today"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-secondary"
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
                ? "border-accent text-accent font-bold"
                : "border-transparent text-secondary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
            <span className="font-mono text-[10px] opacity-70">
              {scratchpadCards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTabsOpen((o) => !o)}
            aria-expanded={mobileTabsOpen}
            aria-label="More focus tabs"
            className={`w-12 flex items-center justify-center border-b-2 transition-all ${
              currentCustomTab
                ? "border-accent text-accent"
                : "border-transparent text-secondary"
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
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

        {activeTab === "scratchpad" && (
          <ScratchpadTab
            scratchpadCards={scratchpadCards}
            onAddScratchpad={onAddScratchpad}
            onUpdateScratchpad={onUpdateScratchpad}
            onDeleteScratchpad={onDeleteScratchpad}
            onSendScratchpadToTimeline={onSendScratchpadToTimeline}
          />
        )}

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

      <EditTabModal
        tab={editingTab}
        onClose={() => setEditingTab(null)}
        onSave={async (tab) => {
          await onUpdateCustomTab(tab);
          setEditingTab(null);
        }}
      />

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
