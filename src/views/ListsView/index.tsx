/**
 * ChronoCraft - Lists View Component
 */

import React, { useState, useEffect } from "react";
import {
  FolderKanban,
  BookOpen,
  GraduationCap,
  Folder,
  Plus,
  Inbox,
  PlayCircle,
  CheckCircle2,
  MinusCircle,
  Bookmark,
  Trash2,
  FileText,
  CalendarDays,
  MoreVertical,
  Pencil,
  ChevronDown,
} from "lucide-react";
import {
  CalendarEvent,
  CustomList,
  ListItem,
  ListItemStatus,
  Note,
} from "../../types";

import { CreateListModal } from "../../components/modals/CreateListModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { StatusPickerPopover } from "../../components/ui/StatusPickerPopover";
import { stripHtml } from "../../components/editors/RichTextEditor";
import { SearchBar } from "../../components/ui/SearchBar";

import {
  LISTS_FILTER_GROUPS,
  FilterStatusType,
  GroupBy,
  SubGroupBy,
  CANONICAL_STATUS_ORDER,
} from "./constants";

interface ListsViewProps {
  lists: CustomList[];
  selectedListId?: string;
  onSelectList: (listId: string) => void;
  listItems: ListItem[];
  notes: Note[];
  events: CalendarEvent[];
  onAddListItem: (item: Partial<ListItem>) => Promise<void>;
  onToggleItemStatus: (itemId: string) => Promise<void>;
  onUpdateItemStatus?: (
    itemId: string,
    status: ListItemStatus,
  ) => Promise<void>;
  onDeleteListItem: (itemId: string) => Promise<void>;
  onOpenCreateList: () => void;
  onOpenEditNote: (note: Note) => void;
  onOpenEditEvent: (event: CalendarEvent) => void;
  onOpenContextMenu?: (item: ListItem, pos: { x: number; y: number }) => void;
  onOpenItemDetail?: (item: ListItem) => void;
  onUpdateList: (listId: string, patch: Partial<CustomList>) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onUpdateListItem: (itemId: string, patch: Partial<ListItem>) => Promise<void>;
  onCreateLinkedNote: (listId: string) => void;
  onCreateLinkedEvent: (listId: string) => void;
}

import { MultiGroupFilterPopover } from "../../components/ui/MultiGroupFilterPopover";
import {
  formatCreatedDate,
  getGroupPillClasses,
  parseTagsFromTitle,
} from "./helpers";
import { TagAutocompleteInput } from "../../components/TagAutocompleteInput";
import { LinkedCreateCard } from "./LinkedCreateCard";
import { ItemsGrid } from "./ItemsGrid";

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  selectedListId,
  onSelectList,
  listItems,
  notes,
  events,
  onAddListItem,
  onToggleItemStatus,
  onUpdateItemStatus,
  onDeleteListItem,
  onOpenCreateList,
  onOpenEditNote,
  onOpenEditEvent,
  onOpenContextMenu,
  onOpenItemDetail,
  onUpdateList,
  onDeleteList,
  onUpdateListItem,
  onCreateLinkedNote,
  onCreateLinkedEvent,
}) => {
  const activeList =
    lists.find((l) => l.id === selectedListId) || lists[0] || null;

  const orderedLists = [
    ...lists.filter((l) => l.type !== "custom"),
    ...lists.filter((l) => l.type === "custom"),
  ];

  const [viewMode, setViewMode] = useState<"stacked" | "grid" | "compact">(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("chronocraft_lists_view_mode");
        if (saved === "grid" || saved === "compact" || saved === "stacked")
          return saved;
      }
      return "stacked";
    },
  );

  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chronocraft_lists_group_by");
      if (saved === "tag" || saved === "status" || saved === "none")
        return saved;
    }
    return "tag";
  });

  const handleSetGroupBy = (g: GroupBy) => {
    setGroupBy(g);
    if (typeof window !== "undefined")
      localStorage.setItem("chronocraft_lists_group_by", g);
  };

  const [subGroupBy, setSubGroupBy] = useState<SubGroupBy>(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("chronocraft_lists_subgroup_by");
      if (v === "none" || v === "tag" || v === "status") return v;
    }
    return "none";
  });

  const handleSetSubGroupBy = (g: SubGroupBy) => {
    setSubGroupBy(g);
    localStorage.setItem("chronocraft_lists_subgroup_by", g);
  };

  const handleSetViewMode = (mode: "stacked" | "grid" | "compact") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("chronocraft_lists_view_mode", mode);
    }
  };

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemInitialStatus, setNewItemInitialStatus] = useState<
    "inbox" | "in-progress" | "maybe-later"
  >("inbox");
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>("all");
  const [activeSubTab, setActiveSubTab] = useState<
    "items" | "linked-notes" | "linked-events"
  >("items");

  const parsedNewItem = React.useMemo(
    () => parseTagsFromTitle(newItemTitle),
    [newItemTitle],
  );

  const [activeStatusPicker, setActiveStatusPicker] = useState<{
    itemId: string;
    status: ListItemStatus;
    position: { x: number; y: number };
  } | null>(null);

  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );

  if (!activeList) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted">
        No lists found. Create your first list using "+ Add Custom List".
      </div>
    );
  }

  const currentItems = listItems.filter((i) => i.listId === activeList.id);

  const allTags = Array.from(
    new Set(currentItems.flatMap((i) => i.tags || [])),
  ).sort((a, b) => a.localeCompare(b));

  const inboxCount = currentItems.filter(
    (i) => i.status === "inbox" || i.status === "todo",
  ).length;
  const inProgressCount = currentItems.filter(
    (i) => i.status === "in-progress",
  ).length;
  const completedCount = currentItems.filter(
    (i) => i.status === "completed" || i.status === "done",
  ).length;
  const droppedCount = currentItems.filter(
    (i) => i.status === "dropped",
  ).length;
  const maybeLaterCount = currentItems.filter(
    (i) => i.status === "maybe-later",
  ).length;

  const filteredItems = currentItems.filter((i) => {
    if (filterStatus !== "all") {
      if (
        filterStatus === "inbox" &&
        i.status !== "inbox" &&
        i.status !== "todo"
      )
        return false;
      if (
        filterStatus === "completed" &&
        i.status !== "completed" &&
        i.status !== "done"
      )
        return false;
      if (
        filterStatus !== "inbox" &&
        filterStatus !== "completed" &&
        i.status !== filterStatus
      )
        return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = [
        i.title,
        i.subtitle || "",
        i.notes || "",
        stripHtml(i.notes || ""),
        (i.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    if (selectedTagFilter && !(i.tags || []).includes(selectedTagFilter)) {
      return false;
    }

    return true;
  });

  const linkedNotes = notes.filter((n) => n.listIds.includes(activeList.id));
  const linkedEvents = events.filter((e) => e.listIds.includes(activeList.id));

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const { cleanTitle, tags } = parsedNewItem;
    if (!cleanTitle) return;

    await onAddListItem({
      listId: activeList.id,
      title: cleanTitle,
      status: newItemInitialStatus,
      tags,
    });

    setNewItemTitle("");
  };

  const getListIcon = (iconName: string) => {
    switch (iconName) {
      case "BookOpen":
        return <BookOpen className="w-5 h-5" />;
      case "GraduationCap":
        return <GraduationCap className="w-5 h-5" />;
      case "FolderKanban":
        return <FolderKanban className="w-5 h-5" />;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: ListItemStatus) => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      case "completed":
      case "done":
        return "Completed";
      case "dropped":
        return "Dropped";
      case "maybe-later":
        return "Maybe Later";
      case "inbox":
      case "todo":
      default:
        return "Inbox";
    }
  };

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("chronocraft_lists_collapsed_groups");
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {}
    return new Set();
  });

  const toggleCollapsedGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      try {
        localStorage.setItem(
          "chronocraft_lists_collapsed_groups",
          JSON.stringify(Array.from(next)),
        );
      } catch {}
      return next;
    });
  };

  const inputBar = (
    <div className="sticky bottom-0 z-20 shrink-0 px-4 md:px-12 py-3.5 bg-app/95 backdrop-blur-md border-t border-soft shadow-xl">
      <form
        onSubmit={handleCreateItem}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-raised border border-soft shadow-sm"
      >
        <TagAutocompleteInput
          value={newItemTitle}
          onChange={setNewItemTitle}
          availableTags={allTags}
          placeholder={`Add new ${activeList.name.toLowerCase().replace(/s$/, "")}... use #tag to tag it`}
          className="flex-1 min-w-[180px] w-full bg-transparent text-sm text-primary placeholder-muted focus:outline-none px-2 py-1 font-sans"
        />

        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-40 text-accent-fg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {parsedNewItem.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1 text-[10px] font-mono">
          <span className="text-muted uppercase tracking-wider">Tags:</span>
          {parsedNewItem.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/30"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubGroups = (items: ListItem[], keyBy: "tag" | "status") => {
    const sub: Record<string, ListItem[]> = {};
    for (const it of items) {
      const k =
        keyBy === "tag"
          ? it.tags?.[0]?.toLowerCase() || "__none__"
          : it.status === "todo"
            ? "inbox"
            : it.status === "done"
              ? "completed"
              : it.status;
      (sub[k] ??= []).push(it);
    }

    let keys: string[];
    if (keyBy === "tag") {
      keys = Object.keys(sub)
        .filter((k) => k !== "__none__")
        .sort((a, b) => a.localeCompare(b));
    } else {
      keys = [
        "inbox",
        "in-progress",
        "completed",
        "dropped",
        "maybe-later",
      ].filter((k) => sub[k]);
    }
    if (sub.__none__) keys.push("__none__");

    return keys.map((k) => {
      const list = sub[k];
      const isNone = k === "__none__";
      const label = isNone
        ? keyBy === "tag"
          ? "UNTAGGED"
          : "NO STATUS"
        : keyBy === "tag"
          ? `#${k}`
          : getStatusLabel(k as ListItemStatus);

      return (
        <div key={k} className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
            <span>{label}</span>
            <span className="tabular-nums">· {list.length}</span>
          </div>
          <ItemsGrid
            items={list}
            viewMode={viewMode}
            onOpenStatusPicker={(it, rect, status) =>
              setActiveStatusPicker({
                itemId: it.id,
                status,
                position: { x: rect.left, y: rect.bottom + 6 },
              })
            }
            onOpenItemDetail={onOpenItemDetail}
            onOpenContextMenu={onOpenContextMenu}
          />
        </div>
      );
    });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* Mobile list picker */}
      <div className="px-3 pt-3 pb-2 border-b border-soft bg-app shrink-0 flex md:hidden">
        <div className="flex items-stretch w-full rounded-xl border border-soft bg-sunken p-0.5 overflow-x-auto scrollbar-none">
          {orderedLists.map((list) => {
            const isCurrent = list.id === activeList.id;
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => onSelectList(list.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-raised text-primary shadow-xs"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isCurrent
                      ? (list.color ?? "#6366F1")
                      : "currentColor",
                    opacity: isCurrent ? 1 : 0.5,
                  }}
                />
                <span>{list.name}</span>
                <span className="text-[9px] font-mono opacity-60">
                  {listItems.filter((i) => i.listId === list.id).length}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenCreateList}
            className="shrink-0 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-muted hover:text-accent transition-colors"
            title="New list"
            aria-label="New list"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-6 pb-28">
        <div className="w-full space-y-4">
          {/* Header card */}
          <div className="rounded-2xl bg-raised border border-soft shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{
                  backgroundColor: `${activeList.color || "#6366F1"}26`,
                  color: activeList.color || "#6366F1",
                }}
              >
                {getListIcon(activeList.icon)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-bold tracking-tight text-primary truncate">
                    {activeList.name}
                  </h2>
                  <span className="text-[11px] font-mono text-muted shrink-0">
                    {currentItems.length}
                  </span>
                </div>
                {activeList.description && (
                  <p className="text-[11px] text-secondary truncate">
                    {activeList.description}
                  </p>
                )}
              </div>

              {activeList.type === "custom" && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditListOpen(true)}
                    title="Edit list"
                    aria-label="Edit list"
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete list"
                    aria-label="Delete list"
                    onClick={() => setIsDeleteListOpen(true)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 px-3 py-2 border-t border-soft overflow-x-auto">
              {(
                [
                  {
                    id: "inbox",
                    label: "Inbox",
                    count: inboxCount,
                    icon: Inbox,
                    color: "text-secondary",
                    on: "bg-hover border-strong text-primary",
                  },
                  {
                    id: "in-progress",
                    label: "Active",
                    count: inProgressCount,
                    icon: PlayCircle,
                    color: "text-warning",
                    on: "bg-warning/15 border-warning/40 text-warning",
                  },
                  {
                    id: "completed",
                    label: "Done",
                    count: completedCount,
                    icon: CheckCircle2,
                    color: "text-success",
                    on: "bg-success/15 border-success/40 text-success",
                  },
                  {
                    id: "dropped",
                    label: "Dropped",
                    count: droppedCount,
                    icon: MinusCircle,
                    color: "text-danger",
                    on: "bg-danger/15 border-danger/40 text-danger",
                  },
                  {
                    id: "maybe-later",
                    label: "Later",
                    count: maybeLaterCount,
                    icon: Bookmark,
                    color: "text-accent",
                    on: "bg-accent/15 border-accent/40 text-accent",
                  },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                const on = filterStatus === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    title={m.label}
                    onClick={() => setFilterStatus(on ? "all" : m.id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs transition-colors cursor-pointer shrink-0 ${
                      on
                        ? m.on
                        : "border-transparent text-secondary hover:bg-hover hover:text-primary"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="font-mono font-semibold tabular-nums">
                      {m.count}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab("items")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                  activeSubTab === "items"
                    ? "bg-accent/15 text-accent border-accent/40 font-semibold shadow-xs"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                Tracked Items
                <span className="ml-1.5 text-[10px] font-mono opacity-70">
                  {currentItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("linked-notes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                  activeSubTab === "linked-notes"
                    ? "bg-warning/15 text-warning border-warning/40 font-semibold shadow-xs"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Linked Notes
                <span className="ml-0.5 text-[10px] font-mono opacity-70">
                  {linkedNotes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("linked-events")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                  activeSubTab === "linked-events"
                    ? "bg-danger/15 text-danger border-danger/40 font-semibold shadow-xs"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Linked Events
                <span className="ml-0.5 text-[10px] font-mono opacity-70">
                  {linkedEvents.length}
                </span>
              </button>
            </div>

            <div className="flex max-sm:w-full max-md:justify-between gap-2">
              <MultiGroupFilterPopover
                groups={LISTS_FILTER_GROUPS}
                selections={{
                  status: filterStatus,
                  view: viewMode,
                  group: groupBy,
                  subgroup: subGroupBy,
                }}
                defaults={{
                  status: "all",
                  view: "stacked",
                  group: "tag",
                  subgroup: "none",
                }}
                allLabel="Control Panel"
                onChange={(k, v) => {
                  if (k === "status") setFilterStatus(v as FilterStatusType);
                  else if (k === "view") handleSetViewMode(v as any);
                  else if (k === "group") handleSetGroupBy(v as GroupBy);
                  else if (k === "subgroup")
                    handleSetSubGroupBy(v as SubGroupBy);
                }}
              />

              <div className="md:max-w-sm">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search items..."
                />
              </div>
            </div>
          </div>

          {/* Tag filter band */}
          {activeSubTab === "items" && allTags.length > 1 && (
            <div className="-mx-4 md:-mx-12 px-4 md:px-12 py-3 border-y border-soft bg-sunken/70 flex flex-wrap items-center justify-between gap-3">
              <div className="md:hidden -mx-4 px-4 py-2 border-soft bg-sunken/70">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter(null)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                      selectedTagFilter === null
                        ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                        : "text-secondary hover:text-primary border-transparent"
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((t) => {
                    const on = selectedTagFilter === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTagFilter(on ? null : t)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                          on
                            ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                            : "text-secondary hover:text-primary border-transparent"
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter(null)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                    selectedTagFilter === null
                      ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                      : "text-secondary hover:text-primary border-transparent"
                  }`}
                >
                  All
                </button>
                {allTags.map((t) => {
                  const on = selectedTagFilter === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTagFilter(on ? null : t)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                        on
                          ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                          : "text-secondary hover:text-primary border-transparent"
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items sub-tab */}
          {activeSubTab === "items" && (
            <div className="space-y-8">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-soft text-xs text-muted bg-raised/40">
                  <p className="font-semibold text-primary">
                    No items found for the selected status.
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    Add new entries using the bottom input bar, or adjust your
                    filter.
                  </p>
                </div>
              ) : (
                (() => {
                  if (groupBy === "none") {
                    return (
                      <ItemsGrid
                        items={filteredItems}
                        viewMode={viewMode}
                        onOpenStatusPicker={(item, rect, status) =>
                          setActiveStatusPicker({
                            itemId: item.id,
                            status,
                            position: { x: rect.left, y: rect.bottom + 6 },
                          })
                        }
                        onOpenItemDetail={onOpenItemDetail}
                        onOpenContextMenu={onOpenContextMenu}
                      />
                    );
                  }

                  const effectiveSub =
                    subGroupBy === groupBy ? "none" : subGroupBy;

                  const groups: Record<string, ListItem[]> = {};
                  for (const it of filteredItems) {
                    let key: string;
                    if (groupBy === "tag") {
                      key = it.tags?.[0]?.toLowerCase() || "__none__";
                    } else {
                      key =
                        it.status === "todo"
                          ? "inbox"
                          : it.status === "done"
                            ? "completed"
                            : it.status;
                    }
                    (groups[key] ??= []).push(it);
                  }

                  let keys: string[];
                  if (groupBy === "tag") {
                    keys = Object.keys(groups)
                      .filter((k) => k !== "__none__")
                      .sort((a, b) => a.localeCompare(b));
                  } else {
                    keys = CANONICAL_STATUS_ORDER.filter((k) => groups[k]);
                  }
                  if (groups.__none__) keys.push("__none__");

                  return keys.map((key) => {
                    const items = groups[key];
                    const isNone = key === "__none__";
                    const title = isNone
                      ? groupBy === "tag"
                        ? "UNTAGGED"
                        : "NO STATUS"
                      : groupBy === "tag"
                        ? key.toUpperCase()
                        : getStatusLabel(key as ListItemStatus).toUpperCase();
                    const isCollapsed = collapsedGroups.has(key);

                    return (
                      <section key={key} className="space-y-3">
                        <button
                          type="button"
                          onClick={() => toggleCollapsedGroup(key)}
                          aria-expanded={!isCollapsed}
                          className="group flex items-center gap-2 w-full text-left cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted transition-transform shrink-0 ${
                              isCollapsed ? "-rotate-90" : ""
                            }`}
                          />
                          <h3
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider font-bold border ${getGroupPillClasses(key, groupBy)}`}
                          >
                            {title}
                          </h3>
                          <span className="text-[10px] font-mono text-muted tabular-nums">
                            · {items.length}
                          </span>
                          <div className="flex-1 h-px bg-soft" />
                        </button>

                        {!isCollapsed &&
                          (effectiveSub === "none" ? (
                            <ItemsGrid
                              items={items}
                              viewMode={viewMode}
                              onOpenStatusPicker={(it, rect, status) =>
                                setActiveStatusPicker({
                                  itemId: it.id,
                                  status,
                                  position: {
                                    x: rect.left,
                                    y: rect.bottom + 6,
                                  },
                                })
                              }
                              onOpenItemDetail={onOpenItemDetail}
                              onOpenContextMenu={onOpenContextMenu}
                            />
                          ) : (
                            <div className="space-y-4 pl-2 border-l border-soft">
                              {renderSubGroups(items, effectiveSub)}
                            </div>
                          ))}
                      </section>
                    );
                  });
                })()
              )}
            </div>
          )}

          {/* Linked notes */}
          {activeSubTab === "linked-notes" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <LinkedCreateCard
                  label="New Note"
                  sublabel={`Add to "${activeList.name}"`}
                  onClick={() => onCreateLinkedNote(activeList.id)}
                />

                {linkedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onOpenEditNote(note)}
                    className="p-4 rounded-xl bg-raised border border-soft hover:border-accent/40 shadow-xs cursor-pointer space-y-2 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-primary line-clamp-1">
                        {note.title ? (
                          note.title
                        ) : (
                          <span className="text-muted italic font-normal">
                            Untitled Note
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-secondary line-clamp-3 leading-relaxed">
                        {stripHtml(note.content)}
                      </p>
                    </div>

                    <div className="pt-2 mt-1 border-t border-soft flex items-center justify-between gap-2 text-[10px] font-mono text-muted">
                      <span>Created {formatCreatedDate(note.createdAt)}</span>
                      {note.tags.length > 0 && (
                        <span className="text-secondary truncate max-w-[50%] text-right">
                          {note.tags.map((t) => `#${t}`).join(" ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {linkedNotes.length === 0 && (
                <p className="text-center text-[11px] text-muted italic">
                  No notes linked to this list yet — click the card above to add
                  one.
                </p>
              )}
            </div>
          )}

          {/* Linked events */}
          {activeSubTab === "linked-events" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <LinkedCreateCard
                  label="New Event"
                  sublabel={`Schedule for "${activeList.name}"`}
                  onClick={() => onCreateLinkedEvent(activeList.id)}
                />

                {linkedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onOpenEditEvent(event)}
                    className="p-3.5 rounded-xl bg-raised border border-soft hover:border-danger/40 shadow-xs cursor-pointer flex flex-col gap-2 transition-all"
                  >
                    <div className="flex flex-col h-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-primary truncate">
                          {event.title ? (
                            event.title
                          ) : (
                            <span className="text-muted italic font-normal">
                              Untitled Event
                            </span>
                          )}
                        </h4>
                      </div>

                      <div className="pt-2 mt-1 w-full border-t border-soft flex items-center justify-between gap-2 text-[10px] font-mono text-muted">
                        <span className="text-xs font-mono text-info mt-0.5">
                          {new Date(event.startAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {event.category && (
                          <span
                            className={`${
                              event.category === "official"
                                ? "text-white bg-accent"
                                : "text-white bg-danger"
                            } p-0.5 rounded px-1`}
                          >
                            {event.category === "official"
                              ? "Official"
                              : "Personal"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {linkedEvents.length === 0 && (
                <p className="text-center text-[11px] text-muted italic">
                  No events linked to this list yet — click the card above to
                  schedule one.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {activeSubTab === "items" && inputBar}

      {activeStatusPicker && (
        <StatusPickerPopover
          currentStatus={activeStatusPicker.status}
          position={activeStatusPicker.position}
          isOpen={true}
          onSelectStatus={(newStatus) => {
            if (onUpdateItemStatus) {
              onUpdateItemStatus(activeStatusPicker.itemId, newStatus);
            } else {
              onToggleItemStatus(activeStatusPicker.itemId);
            }
            setActiveStatusPicker(null);
          }}
          onClose={() => setActiveStatusPicker(null)}
        />
      )}

      <CreateListModal
        isOpen={isEditListOpen}
        initialList={activeList}
        onUpdateList={onUpdateList}
        onClose={() => setIsEditListOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteListOpen}
        title={`Delete "${activeList.name}"?`}
        message={
          <>
            This permanently deletes the list and its{" "}
            <b>{currentItems.length}</b> item
            {currentItems.length === 1 ? "" : "s"}. Linked notes and events are
            kept, but unlinked from this list. This can’t be undone.
          </>
        }
        confirmLabel="Delete list"
        onCancel={() => setIsDeleteListOpen(false)}
        onConfirm={async () => {
          setIsDeleteListOpen(false);
          await onDeleteList(activeList.id);
        }}
      />
    </div>
  );
};
