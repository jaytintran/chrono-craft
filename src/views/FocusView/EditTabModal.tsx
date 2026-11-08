import React, { useEffect, useState } from "react";
import { CustomFocusTab } from "../../types";

const TAB_COLORS = [
  "#4F46E5",
  "#059669",
  "#0284C7",
  "#D97706",
  "#DB2777",
  "#7C3AED",
];

interface EditTabModalProps {
  tab: CustomFocusTab | null;
  onClose: () => void;
  onSave: (tab: CustomFocusTab) => Promise<void>;
}

export const EditTabModal: React.FC<EditTabModalProps> = ({
  tab,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<CustomFocusTab | null>(tab);

  useEffect(() => {
    setDraft(tab);
  }, [tab]);

  if (!tab || !draft) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    await onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-xs"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl bg-raised border border-soft p-6 shadow-2xl z-10 space-y-4 animate-scaleUp"
      >
        <h3 className="text-sm font-bold text-primary">Edit Custom Tab</h3>

        <div>
          <label className="block text-xs text-muted mb-1">Tab Name</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-sunken border border-soft text-xs font-semibold focus:outline-none focus:border-accent text-primary"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-2">Accent Color</label>
          <div className="flex items-center gap-2">
            {TAB_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDraft({ ...draft, bgColor: c })}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  draft.bgColor === c
                    ? "scale-125 ring-2 ring-accent"
                    : "opacity-80"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!draft.name.trim()}
            className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
