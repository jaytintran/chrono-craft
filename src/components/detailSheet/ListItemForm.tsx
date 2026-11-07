import React, { useState, useEffect } from "react";
import { X, Folder } from "lucide-react";
import { ListItem, ListItemStatus, CustomList } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { FilterSelect } from "../ui/FilterSelect";
import { ITEM_META, ITEM_STATUSES } from "./types";
import { TitleInput } from "./TitleInput";

export interface ListItemFormHandle {
  collect: () => Partial<ListItem>;
}

interface ListItemFormProps {
  data: Partial<ListItem>;
  availableLists: CustomList[];
  onDirty?: () => void;
}

export const ListItemForm = React.forwardRef<
  ListItemFormHandle,
  ListItemFormProps
>(({ data, availableLists, onDirty }, ref) => {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState<ListItemStatus>("inbox");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [listId, setListId] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTitle(data.title || "");
    setSubtitle(data.subtitle || "");
    setStatus(data.status || "inbox");
    setNotes(data.notes || "");
    setDueDate(data.dueDate || "");
    setTags(data.tags || []);
    setListId(data.listId || availableLists[0]?.id || "");
  }, [data, availableLists]);

  React.useImperativeHandle(ref, () => ({
    collect: () => ({
      id: data.id,
      listId: listId || data.listId || availableLists[0]?.id || "projects",
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
      tags,
    }),
  }));

  const itemList = availableLists.find((l) => l.id === listId);
  const itemMeta = ITEM_META[itemList?.type ?? "custom"] ?? ITEM_META.custom;
  const activeStatus =
    status === "todo" ? "inbox" : status === "done" ? "completed" : status;

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dueInDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setDueDate(toYMD(d));
  };

  const commitTag = () => {
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) setTags((p) => [...p, clean]);
    setTagInput("");
  };

  // Return JSX: paste the current "MODE: LIST_ITEM" branch verbatim,
  // renaming:
  //   itemTitle → title
  //   itemSubtitle → subtitle
  //   itemStatus → status
  //   itemNotes → notes
  //   itemDueDate → dueDate
  //   itemTags → tags (and handleRemoveTag("list_item", t) → setTags(p => p.filter(x => x !== t)))
  //   itemListId → listId
  //   handleAddTag("list_item") → commitTag()
  //   activeItemStatus stays (now local const `activeStatus`)
  return (
    <div className="space-y-4">
      {/* Title + Subtitle */}
      <div className="space-y-1">
        {/* Title */}
        <TitleInput
          value={title}
          onChange={setTitle}
          placeholder="Untitled item"
          className="text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 leading-tight"
        />
        {/* Subtitle */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={itemMeta.subtitle}
          className="w-full bg-transparent text-sm text-slate-500 dark:text-slate-400 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
        />
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5">
        {ITEM_STATUSES.map((st) => {
          const Icon = st.icon;
          const on = activeStatus === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatus(st.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                on
                  ? st.on
                  : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          );
        })}
      </div>

      {/* Properties card */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
        {/* Due date */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-slate-400">
            {itemMeta.due}
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]"
          />
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {[
              { l: "Tomorrow", d: 1 },
              { l: "Next week", d: 7 },
            ].map((q) => (
              <button
                key={q.l}
                type="button"
                onClick={() => dueInDays(q.d)}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 cursor-pointer"
              >
                {q.l}
              </button>
            ))}
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                className="px-2 py-0.5 text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-slate-400">
            List
          </span>
          <FilterSelect
            icon={<Folder className="w-3.5 h-3.5 text-indigo-400" />}
            value={listId}
            onChange={(v) => setListId(v)}
            options={availableLists.map((l) => ({
              value: l.id,
              label: l.name,
            }))}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            #{t}
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              className="hover:text-rose-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
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
          onBlur={() => commitTag()}
          placeholder="+ Tag"
          className="w-16 focus:w-32 transition-all bg-transparent text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none px-1 py-1"
        />
      </div>

      {/* Notes: seamless */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
          Notes & Key Learnings
        </div>
        <RichTextEditor
          value={notes}
          onChange={setNotes}
          placeholder={itemMeta.notes}
          variant="seamless"
          minHeight="35vh"
        />
      </div>
    </div>
  );
});
ListItemForm.displayName = "ListItemForm";
