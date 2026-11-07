import React, { useState } from "react";

const TAB_COLORS = [
  "#4F46E5",
  "#059669",
  "#0284C7",
  "#D97706",
  "#DB2777",
  "#7C3AED",
];

interface CreateTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; bgColor: string }) => Promise<void>;
}

export const CreateTabModal: React.FC<CreateTabModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [bgColor, setBgColor] = useState("#4F46E5");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), bgColor });
    setName("");
    setName("");
    setBgColor("#4F46E5");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 space-y-4 animate-scaleUp"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Create New Custom Tab
        </h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Tab Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            {TAB_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBgColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  bgColor === c
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
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            Create Tab
          </button>
        </div>
      </form>
    </div>
  );
};
