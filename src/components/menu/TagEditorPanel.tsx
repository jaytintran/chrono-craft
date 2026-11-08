/**
 * ChronoCraft - Tag Editor Panel
 * Toggle-chip tag picker with inline "add new" row and optional autocomplete.
 * Used inside ContextMenu (desktop) and as a sub-sheet body (mobile).
 */

import React, { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";

interface TagEditorPanelProps {
  /** Currently-selected tags for the item. */
  selected: string[];
  /** All tags known in the workspace (used for suggestions). */
  available?: string[];
  /** Toggle an existing tag on/off. */
  onToggle: (tag: string) => void;
  /** Commit a brand-new tag (auto-toggled on after). */
  onCreate: (tag: string) => void;
  /** Optional done handler for mobile sub-sheet. */
  onDone?: () => void;
}

export const TagEditorPanel: React.FC<TagEditorPanelProps> = ({
  selected,
  available = [],
  onToggle,
  onCreate,
  onDone,
}) => {
  const [query, setQuery] = useState("");

  const clean = (s: string) => s.trim().replace(/^#/, "").toLowerCase();

  // Merge selected + available into one sorted list; dedupe.
  const allTags = useMemo(() => {
    const set = new Set<string>([...available, ...selected]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [available, selected]);

  // Live suggestions from the input query (filters the merged list).
  const suggestions = useMemo(() => {
    const q = clean(query);
    if (!q) return [];
    return allTags
      .filter((t) => t !== q && t.startsWith(q) && !selected.includes(t))
      .slice(0, 4);
  }, [query, allTags, selected]);

  const handleAdd = (raw: string) => {
    const tag = clean(raw);
    if (!tag) return;
    if (selected.includes(tag)) {
      setQuery("");
      return;
    }
    if (!allTags.includes(tag)) onCreate(tag);
    else onToggle(tag);
    setQuery("");
  };

  return (
    <div className="p-3 space-y-3">
      {/* Selected + available chips */}
      <div>
        <div className="px-1 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-muted">
          Tags ({selected.length} selected)
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {allTags.length === 0 ? (
            <p className="text-[11px] text-muted italic px-1 py-1.5">
              No tags yet — add one below.
            </p>
          ) : (
            allTags.map((t) => {
              const on = selected.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggle(t)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer ${
                    on
                      ? "bg-accent/15 border-accent/40 text-accent"
                      : "border-soft text-secondary hover:border-strong hover:text-primary"
                  }`}
                >
                  {on && <Check className="w-2.5 h-2.5" />}#{t}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Add-new row */}
      <div>
        <div className="relative">
          <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd(query);
              } else if (
                e.key === "Backspace" &&
                query === "" &&
                selected.length > 0
              ) {
                e.preventDefault();
                onToggle(selected[selected.length - 1]);
              }
            }}
            placeholder="Add new tag…"
            className="w-full pl-7 pr-2 py-1.5 rounded-md bg-sunken border border-soft text-[11px] font-mono text-primary focus:outline-none focus:border-accent"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAdd(s)}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-hover text-secondary hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer"
              >
                #{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {onDone && (
        <button
          type="button"
          onClick={onDone}
          className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      )}
    </div>
  );
};
