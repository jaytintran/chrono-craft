import React, { useState } from "react";
import { Folder, X, Check } from "lucide-react";
import { CustomList } from "../../types";

interface MetaRowProps {
  tags: string[];
  listIds: string[];
  availableLists: CustomList[];
  /** Per-list tag pools keyed by listId; used for suggestions. */
  listTagsById?: Map<string, string[]>;
  /** Workspace-wide tag fallback when the item has no listIds. */
  allTags?: string[];
  onToggleListId: (listId: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const MetaRow: React.FC<MetaRowProps> = ({
  tags,
  listIds,
  availableLists,
  listTagsById,
  allTags = [],
  onToggleListId,
  onAddTag,
  onRemoveTag,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [listMenuOpen, setListMenuOpen] = useState(false);

  const [tagFocused, setTagFocused] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(0);

  // Union of tag pools for every list this item is linked to.
  // Falls back to the workspace-wide pool when there are no listIds.
  const tagPool = React.useMemo(() => {
    const set = new Set<string>();
    if (listIds.length > 0 && listTagsById) {
      for (const id of listIds) {
        const bucket = listTagsById.get(id);
        if (bucket) for (const t of bucket) set.add(t);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
    return allTags;
  }, [listIds, listTagsById, allTags]);

  // Filtered + already-assigned-filtered suggestions, capped at 6.
  const tagSuggestions = React.useMemo(() => {
    const q = tagInput.trim().replace(/^#/, "").toLowerCase();
    return tagPool
      .filter((t) => !tags.includes(t))
      .filter((t) => (q ? t.toLowerCase().startsWith(q) : true))
      .slice(0, 6);
  }, [tagPool, tags, tagInput]);

  const acceptTagSuggestion = (t: string) => {
    if (!tags.includes(t)) onAddTag(t);
    setTagInput("");
    setTagHighlight(0);
  };

  const commitTag = () => {
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) onAddTag(clean);
    setTagInput("");
    setTagHighlight(0);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {listIds.map((id) => {
        const l = availableLists.find((x) => x.id === id);
        if (!l) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-accent/10 text-accent border border-accent/30"
          >
            <Folder className="w-3 h-3" />
            {l.name}
            <button
              type="button"
              onClick={() => onToggleListId(id)}
              className="hover:text-danger"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-hover text-secondary border border-soft"
        >
          #{t}
          <button
            type="button"
            onClick={() => onRemoveTag(t)}
            className="hover:text-danger"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setListMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted hover:text-primary border border-dashed border-strong hover:border-accent/50 transition-colors cursor-pointer"
        >
          <Folder className="w-3 h-3" /> List
        </button>
        {listMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setListMenuOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1.5 z-20 w-52 max-h-56 overflow-y-auto p-1 rounded-xl bg-raised border border-soft shadow-2xl">
              {availableLists.map((list) => {
                const on = listIds.includes(list.id);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => onToggleListId(list.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      on
                        ? "bg-accent/15 text-accent font-medium"
                        : "text-secondary hover:bg-hover"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{list.name}</span>
                    {on && <Check className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setTagHighlight(0);
          }}
          onFocus={() => setTagFocused(true)}
          onBlur={() => {
            setTimeout(() => setTagFocused(false), 120);
            commitTag();
          }}
          onKeyDown={(e) => {
            if (tagFocused && tagSuggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setTagHighlight((i) => (i + 1) % tagSuggestions.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setTagHighlight(
                  (i) =>
                    (i - 1 + tagSuggestions.length) % tagSuggestions.length,
                );
                return;
              }
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                const picked = tagSuggestions[tagHighlight];
                if (picked) acceptTagSuggestion(picked);
                else commitTag();
                return;
              }
              if (e.key === "Tab" && tagSuggestions[tagHighlight]) {
                e.preventDefault();
                acceptTagSuggestion(tagSuggestions[tagHighlight]);
                return;
              }
              if (e.key === "Escape") {
                setTagFocused(false);
                return;
              }
            }
            if (e.key === "Enter") {
              e.preventDefault();
              commitTag();
            }
          }}
          placeholder="+ Tag"
          className="w-16 focus:w-32 transition-all bg-transparent text-[11px] font-mono text-secondary placeholder-muted focus:outline-none px-1 py-1"
        />

        {tagFocused && tagSuggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1 z-30 min-w-[160px] max-w-[220px] rounded-lg bg-raised border border-soft shadow-2xl p-1 animate-scaleUp">
            <div className="px-2 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted">
              {listIds.length > 0 ? "Tags from this list" : "Tags in workspace"}
            </div>
            {tagSuggestions.map((t, i) => (
              <button
                key={t}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptTagSuggestion(t);
                }}
                onMouseEnter={() => setTagHighlight(i)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-colors ${
                  i === tagHighlight
                    ? "bg-accent/15 text-accent"
                    : "text-secondary hover:bg-hover"
                }`}
              >
                <span>#{t}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
