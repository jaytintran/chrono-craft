import React from "react";
import { CheckCircle2, Circle, Trash2, Pencil } from "lucide-react";
import { CustomFocusTab, TimelineEntry } from "../../types";
import { NLPInputBar } from "@/components/NLPInputBar";

interface CustomTabViewProps {
  currentCustomTab: CustomFocusTab;
  customTabEntries: TimelineEntry[];
  isMobile: boolean;
  onAddEntry: (entry: Partial<TimelineEntry>) => Promise<void>;
  onToggleEntryStatus: (entryId: string) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onEditTab: (tab: CustomFocusTab) => void;
  onDeleteTab: (tabId: string) => Promise<void>;
  onSwitchAway: () => void;
}

export const CustomTabView: React.FC<CustomTabViewProps> = ({
  currentCustomTab,
  customTabEntries,
  isMobile,
  onAddEntry,
  onToggleEntryStatus,
  onDeleteEntry,
  onEditTab,
  onDeleteTab,
  onSwitchAway,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div
        className="p-6 rounded-2xl text-white shadow-lg flex items-center justify-between"
        style={{ backgroundColor: currentCustomTab.bgColor }}
      >
        <div>
          <h2 className="text-lg font-bold">{currentCustomTab.name}</h2>
          <p className="text-xs text-white/80 mt-1">
            Custom focus workspace. Add dedicated queue tasks and project items
            below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditTab(currentCustomTab)}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 font-medium text-white transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete tab "${currentCustomTab.name}"?`)) {
                onDeleteTab(currentCustomTab.id);
                onSwitchAway();
              }
            }}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-danger text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <NLPInputBar
        placeholder={`Add task to ${currentCustomTab.name}... (e.g., "Refine mockups at 4pm !high")`}
        defaultType="task"
        showTypeSwitcher={false}
        buttonLabel="Add to Queue"
        compact={isMobile}
        onSubmit={(parsed) => {
          onAddEntry({
            type: "task",
            title: parsed.title,
            scheduledAt: parsed.scheduledAt,
            status: "active",
            source: "custom-tab",
            tabId: currentCustomTab.id,
            tags: parsed.tags,
          });
        }}
      />

      <div className="space-y-2">
        {customTabEntries.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-soft text-center text-xs text-muted">
            No tasks in this custom queue yet. Add entries using the input bar
            above.
          </div>
        ) : (
          customTabEntries.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-3.5 rounded-xl bg-raised border border-soft hover:border-accent/40 transition-all shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleEntryStatus(item.id)}
                  className="text-muted hover:text-success transition-colors"
                >
                  {item.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`text-sm font-semibold truncate ${
                    item.status === "completed"
                      ? "line-through text-muted"
                      : "text-primary"
                  }`}
                >
                  {item.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onDeleteEntry(item.id)}
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1.5 text-muted hover:text-danger transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
