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

const SCRATCH_COLORS_DARK = [
  "#1E293B",
  "#1E3A8A",
  "#064E3B",
  "#701A75",
  "#78350F",
];

const SCRATCH_COLORS_LIGHT = [
  "#E2E8F0",
  "#C7D2FE",
  "#A7F3D0",
  "#F5D0FE",
  "#FDE68A",
];

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
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded-2xl bg-raised border border-soft shadow-md space-y-3"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title..."
          className="w-full bg-transparent text-sm font-semibold text-primary placeholder-muted focus:outline-none"
        />
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Take a quick note or brain dump..."
          className="w-full bg-transparent text-xs text-secondary placeholder-muted focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-soft">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-muted">Color:</span>
            {(isDarkTheme ? SCRATCH_COLORS_DARK : SCRATCH_COLORS_LIGHT).map(
              (c, i) => {
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
                        ? "scale-125 ring-2 ring-accent"
                        : "opacity-80 hover:opacity-100"
                    } ${isDarkTheme ? "border-strong" : "border-soft"}`}
                  />
                );
              },
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() && !body.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-accent-fg text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin Note</span>
          </button>
        </div>
      </form>

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
                        ? "text-warning"
                        : isDarkTheme
                          ? "text-white/40 hover:text-white"
                          : "text-secondary hover:text-primary"
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p
                  className={`text-xs whitespace-pre-wrap leading-relaxed ${
                    isDarkTheme ? "text-white/80" : "text-secondary"
                  }`}
                >
                  {stripHtml(card.content)}
                </p>
              </div>

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
                      : "text-info hover:text-info/80"
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
                      : "text-secondary hover:text-danger"
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
