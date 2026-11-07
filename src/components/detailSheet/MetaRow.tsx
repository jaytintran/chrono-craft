import React, { useState } from "react";
import { Folder, X, Check } from "lucide-react";
import { CustomList } from "../../types";

interface MetaRowProps {
  tags: string[];
  listIds: string[];
  availableLists: CustomList[];
  onToggleListId: (listId: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const MetaRow: React.FC<MetaRowProps> = ({
  tags,
  listIds,
  availableLists,
  onToggleListId,
  onAddTag,
  onRemoveTag,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [listMenuOpen, setListMenuOpen] = useState(false);

  const commitTag = () => {
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) onAddTag(clean);
    setTagInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {listIds.map((id) => {
        const l = availableLists.find((x) => x.id === id);
        if (!l) return null;
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
          >
            <Folder className="w-3 h-3" />
            {l.name}
            <button
              type="button"
              onClick={() => onToggleListId(id)}
              className="hover:text-rose-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
        >
          #{t}
          <button
            type="button"
            onClick={() => onRemoveTag(t)}
            className="hover:text-rose-400"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setListMenuOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500/50 transition-colors cursor-pointer"
        >
          <Folder className="w-3 h-3" /> List
        </button>
        {listMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setListMenuOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1.5 z-20 w-52 max-h-56 overflow-y-auto p-1 rounded-xl bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-2xl">
              {availableLists.map((list) => {
                const on = listIds.includes(list.id);
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => onToggleListId(list.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                      on
                        ? "bg-indigo-500/15 text-indigo-300 font-medium"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

      <input
        type="text"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitTag();
          }
        }}
        onBlur={commitTag}
        placeholder="+ Tag"
        className="w-16 focus:w-32 transition-all bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none px-1 py-1"
      />
    </div>
  );
};
