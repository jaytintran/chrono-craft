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

const SCRATCH_COLORS = ["#1E293B", "#1E3A8A", "#064E3B", "#701A75", "#78350F"];

export const ScratchpadTab: React.FC<ScratchpadTabProps> = ({
  scratchpadCards,
  onAddScratchpad,
  onUpdateScratchpad,
  onDeleteScratchpad,
  onSendScratchpadToTimeline,
}) => {
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
            {["#1E293B", "#1E3A8A", "#064E3B", "#701A75", "#78350F"].map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border border-slate-700 transition-transform ${
                    color === c
                      ? "scale-125 ring-2 ring-indigo-500"
                      : "opacity-80"
                  }`}
                />
              ),
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
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100
 p-1 text-white/50 hover:text-rose-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
