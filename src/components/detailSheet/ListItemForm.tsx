import React, { useState, useEffect, useRef } from "react";
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
  existingTags?: string[];
}

export const ListItemForm = React.forwardRef<
  ListItemFormHandle,
  ListItemFormProps
>(({ data, availableLists, existingTags = [], onDirty }, ref) => {
  const [title, setTitle] = useState(data.title || "");
  const [subtitle, setSubtitle] = useState(data.subtitle || "");
  const [status, setStatus] = useState<ListItemStatus>(data.status || "inbox");
  const [notes, setNotes] = useState(data.notes || "");
  const [dueDate, setDueDate] = useState(data.dueDate || "");
  const [tags, setTags] = useState<string[]>(data.tags || []);
  const [listId, setListId] = useState(
    data.listId || availableLists[0]?.id || "",
  );
  const lastIdRef = useRef(data.id);

  const [tagInput, setTagInput] = useState("");
  const [tagFocused, setTagFocused] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(0);

  useEffect(() => {
    if (lastIdRef.current !== data.id) {
      lastIdRef.current = data.id;
      setTitle(data.title || "");
      setSubtitle(data.subtitle || "");
      setStatus(data.status || "inbox");
      setNotes(data.notes || "");
      setDueDate(data.dueDate || "");
      setTags(data.tags || []);
      setListId(data.listId || availableLists[0]?.id || "");
    }
  }, [data.id, availableLists]);

  useEffect(() => {
    onDirty?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, status, notes, dueDate, tags, listId]);

  React.useImperativeHandle(
    ref,
    () => ({
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
    }),
    [
      data.id,
      data.listId,
      availableLists,
      listId,
      title,
      subtitle,
      status,
      notes,
      dueDate,
      tags,
    ],
  );

  const itemList = availableLists.find((l) => l.id === listId);
  const itemMeta = ITEM_META[itemList?.type ?? "custom"] ?? ITEM_META.custom;
  const activeStatus =
    status === "todo" ? "inbox" : status === "done" ? "completed" : status;

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  const dueInDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    setDueDate(toYMD(d));
  };

  const commitTag = () => {
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) setTags((p) => [...p, clean]);
    setTagInput("");
    setTagHighlight(0);
  };

  // Tag Suggestions Logic
  const tagSuggestions = React.useMemo(() => {
    const q = tagInput.trim().replace(/^#/, "").toLowerCase();
    return existingTags
      .filter((t) => !tags.includes(t))
      .filter((t) => (q ? t.toLowerCase().startsWith(q) : true))
      .slice(0, 6);
  }, [existingTags, tags, tagInput]);

  const acceptTagSuggestion = (t: string) => {
    if (!tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
    setTagHighlight(0);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <TitleInput
          value={title}
          onChange={setTitle}
          placeholder="Untitled item"
          className="text-2xl font-semibold text-primary placeholder-muted leading-tight"
        />
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder={itemMeta.subtitle}
          className="w-full bg-transparent text-sm text-secondary placeholder-muted focus:outline-none"
        />
      </div>

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
                on ? st.on : "border-soft text-secondary hover:text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {st.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-sunken border border-soft divide-y divide-soft">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-muted">
            {itemMeta.due}
          </span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-raised border border-soft text-xs font-mono text-primary focus:outline-none focus:border-accent"
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
                className="px-2 py-0.5 rounded-md border border-soft text-muted hover:text-primary hover:border-strong cursor-pointer"
              >
                {q.l}
              </button>
            ))}
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate("")}
                className="px-2 py-0.5 text-muted hover:text-danger cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-20 shrink-0 text-[11px] font-mono uppercase text-muted">
            List
          </span>
          <FilterSelect
            icon={<Folder className="w-3.5 h-3.5 text-accent" />}
            value={listId}
            onChange={(v) => setListId(v)}
            options={availableLists.map((l) => ({
              value: l.id,
              label: l.name,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono bg-hover text-secondary border border-soft"
          >
            #{t}
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              className="hover:text-danger"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
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
              // Small delay so a click on a suggestion lands before blur fires
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
                Tags from this list
              </div>
              {tagSuggestions.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus, avoid blur-before-click
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

      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
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
