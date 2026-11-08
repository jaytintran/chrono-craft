import React, { useState } from "react";
import { Plus, Pin, ArrowRight, Trash2 } from "lucide-react";
import { ScratchpadCard } from "../../types";
import { stripHtml } from "../../components/editors/RichTextEditor";

interface ScratchpadTabProps {
  scratchpadCards: ScratchpadCard[];
  onAddScratchpad: (card: Partial<ScratchpadCard>) => Promise<void>;
  onUpdateScratchpad: (card: ScratchpadCard) => Promise<void>;
  onDeleteScratchpad: (cardId: string) => Promise<void>;
  onSendScratchpadToTimeline: (card: ScratchpadCard) => Promise<void>;
}

// Dark theme palette — deep, saturated hues (current design).
const SCRATCH_COLORS_DARK = [
  "#1E293B", // slate
  "#1E3A8A", // indigo
  "#064E3B", // emerald
  "#701A75", // fuchsia
  "#78350F", // amber
];

// Light theme palette — pastel equivalents of the dark set.
// Same hue families, much higher lightness so they read as colored paper
// rather than solid blocks against a white page.
const SCRATCH_COLORS_LIGHT = [
  "#E2E8F0", // slate-200
  "#C7D2FE", // indigo-200
  "#A7F3D0", // emerald-200
  "#F5D0FE", // fuchsia-200
  "#FDE68A", // amber-200
];

// Maps a dark-theme color → its light-theme counterpart.
// Used so an existing card whose `color` is one of the dark values still
// renders correctly in light mode.
const DARK_TO_LIGHT: Record<string, string> = {
  "#1E293B": "#E2E8F0",
  "#1E3A8A": "#C7D2FE",
  "#064E3B": "#A7F3D0",
  "#701A75": "#F5D0FE",
  "#78350F": "#FDE68A",
};
export const ScratchpadTab: React.FC<ScratchpadTabProps> = ({
  scratchpadCards,
  onAddScratchpad,
  onUpdateScratchpad,
  onDeleteScratchpad,
  onSendScratchpadToTimeline,
}) => {
  const [isDarkTheme, setIsDarkTheme] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  React.useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDarkTheme(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState("#1E293B");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;

    await onAddScratchpad({
      title: title.trim() || "Untitled Note",
      content: body.trim(),
      color,
      isPinned: false,
    });

    setTitle("");
    setBody("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* ---- Quick Note Input Bar ---- */}
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-md space-y-3"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title..."
          className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Take a quick note or brain dump..."
          className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Color:</span>
            {(isDarkTheme ? SCRATCH_COLORS_DARK : SCRATCH_COLORS_LIGHT).map(
              (c, i) => {
                // Canonical (dark) color stays the stored value regardless of theme —
                // so the same card looks right on both themes without migrating data.
                const canonical = SCRATCH_COLORS_DARK[i];
                const on = color === canonical;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(canonical)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      on
                        ? "scale-125 ring-2 ring-indigo-500"
                        : "opacity-80 hover:opacity-100"
                    } ${isDarkTheme ? "border-slate-700" : "border-slate-300"}`}
                  />
                );
              },
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() && !body.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin Note</span>
          </button>
        </div>
      </form>

      {/* ---- Note Cards Grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scratchpadCards.map((card) => {
          const storedColor = card.color || "#1E293B";
          const displayColor = isDarkTheme
            ? storedColor
            : (DARK_TO_LIGHT[storedColor] ?? storedColor);

          return (
            <div
              key={card.id}
              style={{ backgroundColor: displayColor }}
              className={`group relative p-4 rounded-2xl border shadow-lg flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                isDarkTheme
                  ? "text-white border-white/10"
                  : "text-slate-800 border-black/5"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-snug wrap-break-word">
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
                        : isDarkTheme
                          ? "text-white/40 hover:text-white"
                          : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p
                  className={`text-xs whitespace-pre-wrap leading-relaxed ${
                    isDarkTheme ? "text-white/80" : "text-slate-700"
                  }`}
                >
                  {stripHtml(card.content)}
                </p>
              </div>

              {/* Card Actions */}
              <div
                className={`flex items-center justify-between pt-4 mt-2 border-t text-xs ${
                  isDarkTheme ? "border-white/10" : "border-black/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSendScratchpadToTimeline(card)}
                  className={`flex items-center gap-1 text-[11px] font-mono transition-colors ${
                    isDarkTheme
                      ? "text-cyan-300 hover:text-cyan-200"
                      : "text-cyan-600 hover:text-cyan-700"
                  }`}
                >
                  <ArrowRight className="w-3 h-3" />
                  <span>Send to Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteScratchpad(card.id)}
                  className={`opacity-60 md:opacity-0 md:group-hover:opacity-100 p-1 transition-opacity ${
                    isDarkTheme
                      ? "text-white/50 hover:text-rose-400"
                      : "text-slate-500 hover:text-rose-500"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
