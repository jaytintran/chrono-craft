import React from "react";
import { Plus, Pencil } from "lucide-react";
import { CustomFocusTab } from "../../types";

interface MobileTabPickerProps {
  isOpen: boolean;
  customTabs: CustomFocusTab[];
  activeTab: string;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
  onEditTab: (tab: CustomFocusTab) => void;
  onCreateNew: () => void;
}

export const MobileTabPicker: React.FC<MobileTabPickerProps> = ({
  isOpen,
  customTabs,
  activeTab,
  onClose,
  onSelectTab,
  onEditTab,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-xs"
      />
      <div className="fixed bottom-0 inset-x-0 bg-raised border-t border-soft rounded-t-3xl shadow-2xl p-5 pb-8 space-y-3 animate-slideInBottom">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-1.5 rounded-full bg-strong" />
          <div className="w-full flex items-center justify-between pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
              Focus Tabs
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-primary"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {customTabs.length === 0 ? (
            <p className="text-xs text-muted italic px-2 py-3">
              No custom tabs yet.
            </p>
          ) : (
            customTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-hover"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                    className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tab.bgColor }}
                    />
                    <span
                      className={`text-sm truncate ${
                        isActive ? "font-semibold text-accent" : "text-primary"
                      }`}
                    >
                      {tab.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditTab(tab);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-primary"
                    title="Edit tab"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onCreateNew();
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Custom Tab</span>
        </button>
      </div>
    </div>
  );
};
