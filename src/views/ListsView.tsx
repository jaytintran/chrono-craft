/**
 * ChronoCraft - Lists View Component
 * 3 default views (Projects, Books, Courses) and custom lists with unified sub-view architecture.
 * Features:
 * - Hidden tab navigation on desktop (sidebar navigation only); visible horizontal scroll on mobile.
 * - Header card without progress bar, displaying collection-level 5-status metrics:
 *   (Inbox, In Progress, Completed, Dropped, Maybe Later).
 * - Leftmost icon button on every entry opens StatusPickerPopover for 1-click status assignment.
 * - Context menu trigger on right click, 3-dot icon, and mobile touch long-press.
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
} from "../types";

import { CreateListModal } from "../components/CreateListModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusPickerPopover } from "../components/StatusPickerPopover";
import { stripHtml } from "../components/RichTextEditor";
import { SearchBar } from "../components/SearchBar";

import {
  LISTS_FILTER_GROUPS,
  FilterStatusType,
  GroupBy,
  SubGroupBy,
  CANONICAL_STATUS_ORDER,
} from "./ListsView/constants";

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

import { MultiGroupFilterPopover } from "../components/MultiGroupFilterPopover";
import {
  formatCreatedDate,
  getGroupPillClasses,
  parseTagsFromTitle,
} from "./ListsView/helpers";
import { TagAutocompleteInput } from "../components/TagAutocompleteInput";
import { LinkedCreateCard } from "./ListsView/LinkedCreateCard";

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
  // Current active list
  const activeList =
    lists.find((l) => l.id === selectedListId) || lists[0] || null;

  const orderedLists = [
    ...lists.filter((l) => l.type !== "custom"),
    ...lists.filter((l) => l.type === "custom"),
  ];

  // View Mode: stacked (default), grid (2 cols), or compact (dense rows)
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

  // Goup By Options

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

  // Sub-Group Options
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

  // View Mode Options
  const handleSetViewMode = (mode: "stacked" | "grid" | "compact") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("chronocraft_lists_view_mode", mode);
    }
  };

  // New item draft
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

  // Status picker popover state
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
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
        No lists found. Create your first list using "+ Add Custom List".
      </div>
    );
  }

  // Items for this list
  const currentItems = listItems.filter((i) => i.listId === activeList.id);

  // All distinct tags present on this list's items, alphabetically sorted.
  // Computed from currentItems (not filteredItems) so the chip set stays
  // stable while a filter is active — you can always click the same chip off.
  const allTags = Array.from(
    new Set(currentItems.flatMap((i) => i.tags || [])),
  ).sort((a, b) => a.localeCompare(b));

  // Status breakdown metrics for the collection header card
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

  // Filtered items
  const filteredItems = currentItems.filter((i) => {
    // 1. Status Filter
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

    // 2. Search Query Filter
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

    // 3. Tag filter (single-select)
    if (selectedTagFilter && !(i.tags || []).includes(selectedTagFilter)) {
      return false;
    }

    return true;
  });

  // Notes and events linked to this list
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

  const getStatusIcon = (status: ListItemStatus) => {
    switch (status) {
      case "in-progress":
        return <PlayCircle className="w-4 h-4 text-amber-400" />;
      case "completed":
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "dropped":
        return <MinusCircle className="w-4 h-4 text-rose-400" />;
      case "maybe-later":
        return <Bookmark className="w-4 h-4 text-violet-400" />;
      case "inbox":
      case "todo":
      default:
        return <Inbox className="w-4 h-4 text-slate-400" />;
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

  // Collapsible group sections (keyed by group key)
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
    <div className="sticky bottom-0 z-20 shrink-0 px-4 md:px-12 py-3.5 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-xl">
      <form
        onSubmit={handleCreateItem}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <TagAutocompleteInput
          value={newItemTitle}
          onChange={setNewItemTitle}
          availableTags={allTags}
          placeholder={`Add new ${activeList.name.toLowerCase().replace(/s$/, "")}... use #tag to tag it`}
          className="flex-1 min-w-[180px] w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none px-2 py-1 font-sans"
        />

        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {parsedNewItem.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1 text-[10px] font-mono">
          <span className="text-slate-400 uppercase tracking-wider">Tags:</span>
          {parsedNewItem.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/30"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // ---- renderItem: extracted per-item card (compact / stacked / grid) ----
  const renderItem = (item: ListItem) => {
    const isCompleted = item.status === "completed" || item.status === "done";
    const isDropped = item.status === "dropped";

    const handleContextMenuTrigger = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onOpenContextMenu) {
        onOpenContextMenu(item, { x: e.clientX, y: e.clientY });
      }
    };

    const handleThreeDotClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onOpenContextMenu) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onOpenContextMenu(item, { x: rect.left, y: rect.bottom + 4 });
      }
    };

    // ============ VIEW MODE: COMPACT ROW ============
    if (viewMode === "compact") {
      return (
        <div
          key={item.id}
          onClick={() => onOpenItemDetail?.(item)}
          onContextMenu={handleContextMenuTrigger}
          className="group flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 shadow-2xs transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                setActiveStatusPicker({
                  itemId: item.id,
                  status: item.status,
                  position: { x: rect.left, y: rect.bottom + 6 },
                });
              }}
              title={`Status: ${getStatusLabel(item.status)} (click to change)`}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 cursor-pointer shrink-0"
            >
              {getStatusIcon(item.status)}
            </button>

            <span
              className={`text-xs font-semibold truncate ${
                isCompleted
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : isDropped
                    ? "line-through text-rose-400/70"
                    : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {item.title}
            </span>

            {item.subtitle && (
              <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                · {item.subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {item.dueDate && (
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hidden sm:inline">
                {item.dueDate}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                setActiveStatusPicker({
                  itemId: item.id,
                  status: item.status,
                  position: { x: rect.left - 40, y: rect.bottom + 6 },
                });
              }}
              className="text-[10px] font-mono uppercase text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {getStatusLabel(item.status)}
            </button>

            <button
              type="button"
              onClick={handleThreeDotClick}
              title="Item options"
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // ============ VIEW MODE: STACKED & GRID CARDS ============
    return (
      <div
        key={item.id}
        onClick={() => onOpenItemDetail?.(item)}
        onContextMenu={handleContextMenuTrigger}
        className={`group flex items-start justify-between p-4 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 shadow-xs transition-all cursor-pointer ${
          viewMode === "grid" ? "flex-col gap-3" : "gap-4"
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              setActiveStatusPicker({
                itemId: item.id,
                status: item.status,
                position: { x: rect.left, y: rect.bottom + 6 },
              });
            }}
            title={`Status: ${getStatusLabel(item.status)} (click to change)`}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-110 cursor-pointer shrink-0 mt-0.5"
          >
            {getStatusIcon(item.status)}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-semibold truncate ${
                  isCompleted
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : isDropped
                      ? "line-through text-rose-400/70"
                      : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {item.title}
              </span>

              <button
                type="button"
                onClick={handleThreeDotClick}
                title="Item options"
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {item.subtitle && (
              <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
            )}

            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
              {item.dueDate && (
                <span className="text-cyan-500">Due {item.dueDate}</span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span className="text-slate-400 truncate">
                  {item.tags.map((t) => `#${t}`).join(" ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---- renderItemsGrid: wrapper that lays out renderItem()s ----
  const renderItemsGrid = (items: ListItem[]) => (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5"
          : viewMode === "compact"
            ? "space-y-1.5"
            : "space-y-2.5"
      }
    >
      {items.map(renderItem)}
    </div>
  );

  // ---- renderItemsFlat: alias for the "none" group branch ----
  const renderItemsFlat = (items: ListItem[]) => renderItemsGrid(items);

  // ---- renderSubGroups ---
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
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>{label}</span>
            <span className="tabular-nums">· {list.length}</span>
          </div>
          {renderItemsGrid(list)}
        </div>
      );
    });
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* 1. Mobile-Only Horizontal List Switcher Tabs (Hidden on Desktop) */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] shrink-0 flex md:hidden">
        <div className="flex items-stretch w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-0.5 overflow-x-auto scrollbar-none">
          {orderedLists.map((list) => {
            const isCurrent = list.id === activeList.id;
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => onSelectList(list.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
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
            className="shrink-0 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-indigo-500 transition-colors"
            title="New list"
            aria-label="New list"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Canvas */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-6 pb-28">
        <div className="w-full space-y-4">
          {/* Header Card — Option B layout */}
          <div className="rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
            {/* Row 1: Identity + options menu */}
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
                  <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    {activeList.name}
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {currentItems.length}
                  </span>
                </div>
                {activeList.description && (
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeList.description}
                  </p>
                )}
              </div>

              {/* List options menu */}
              {activeList.type === "custom" && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={activeList.type !== "custom"}
                    onClick={() => setIsEditListOpen(true)}
                    title={
                      activeList.type !== "custom"
                        ? "Default lists can't be edited"
                        : "Edit list"
                    }
                    aria-label="Edit list"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={activeList.type !== "custom"}
                    title={
                      activeList.type !== "custom"
                        ? "Default lists can't be deleted"
                        : "Delete list"
                    }
                    aria-label="Delete list"
                    onClick={() => setIsDeleteListOpen(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Row 2: Status metrics strip */}
            <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto">
              {(
                [
                  {
                    id: "inbox",
                    label: "Inbox",
                    count: inboxCount,
                    icon: Inbox,
                    color: "text-slate-500 dark:text-slate-400",
                    on: "bg-slate-500/15 border-slate-400/50 text-slate-700 dark:text-slate-300",
                  },
                  {
                    id: "in-progress",
                    label: "Active",
                    count: inProgressCount,
                    icon: PlayCircle,
                    color: "text-amber-500 dark:text-amber-400",
                    on: "bg-amber-500/15 border-amber-400/50 text-amber-700 dark:text-amber-300",
                  },
                  {
                    id: "completed",
                    label: "Done",
                    count: completedCount,
                    icon: CheckCircle2,
                    color: "text-emerald-500 dark:text-emerald-400",
                    on: "bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
                  },
                  {
                    id: "dropped",
                    label: "Dropped",
                    count: droppedCount,
                    icon: MinusCircle,
                    color: "text-rose-500 dark:text-rose-400",
                    on: "bg-rose-500/15 border-rose-400/50 text-rose-700 dark:text-rose-300",
                  },
                  {
                    id: "maybe-later",
                    label: "Later",
                    count: maybeLaterCount,
                    icon: Bookmark,
                    color: "text-violet-500 dark:text-violet-400",
                    on: "bg-violet-500/15 border-violet-400/50 text-violet-700 dark:text-violet-300",
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
                        : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="font-mono font-semibold tabular-nums">
                      {m.count}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Tabs: Items | Linked Notes | Linked Events */}
          <div className="flex items-center justify-between gap-3 pb-1">
            {/* Desktop: Horizontal Sub-Tabs */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab("items")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                  activeSubTab === "items"
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-semibold shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
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
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 font-semibold shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
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
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 font-semibold shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Linked Events
                <span className="ml-0.5 text-[10px] font-mono opacity-70">
                  {linkedEvents.length}
                </span>
              </button>
            </div>

            {/* Mobile: Sub-Tab Dropdown */}
            {/* <div className="flex md:hidden min-w-0">
              <FilterSelect
                icon={
                  activeSubTab === "items" ? (
                    <LayoutList className="w-3.5 h-3.5 text-indigo-400" />
                  ) : activeSubTab === "linked-notes" ? (
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CalendarDays className="w-3.5 h-3.5 text-rose-400" />
                  )
                }
                value={activeSubTab}
                onChange={(v) => setActiveSubTab(v as any)}
                options={[
                  {
                    value: "items",
                    label: `Tracked Items (${currentItems.length})`,
                  },
                  {
                    value: "linked-notes",
                    label: `Linked Notes (${linkedNotes.length})`,
                  },
                  {
                    value: "linked-events",
                    label: `Linked Events (${linkedEvents.length})`,
                  },
                ]}
              />
            </div> */}

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

              {/* Search Bar */}
              <div className="md:max-w-sm">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search items..."
                />
              </div>
            </div>
          </div>

          {/* Filter Band — matches the visual language of NotesView / EventsView */}
          {activeSubTab === "items" && allTags.length > 1 && (
            <div className="-mx-4 md:-mx-12 px-4 md:px-12 py-3 border-y border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E131E] flex flex-wrap items-center justify-between gap-3">
              {/* Tag filter strip — visible only when Items sub-tab is active and >1 tag exists */}
              {allTags.length > 1 && (
                <div className="md:hidden -mx-4 px-4 py-2 border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E131E]">
                  {/* Mobile: full-bleed horizontal scroller, sits directly under filter band */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter(null)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                        selectedTagFilter === null
                          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-semibold"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"
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
                              ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-semibold"
                              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"
                          }`}
                        >
                          #{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tag filter strip — desktop: inline wrap, subtle, above sections */}
              {allTags.length > 1 && (
                <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter(null)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                      selectedTagFilter === null
                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-semibold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"
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
                            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 font-semibold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= SUB-TAB 1: ITEMS ================= */}
          {activeSubTab === "items" && (
            <div className="space-y-8">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 bg-white/40 dark:bg-[#131926]/40">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No items found for the selected status.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Add new entries using the bottom input bar, or adjust your
                    filter.
                  </p>
                </div>
              ) : (
                (() => {
                  if (groupBy === "none") {
                    return renderItemsFlat(filteredItems);
                  }

                  const effectiveSub =
                    subGroupBy === groupBy ? "none" : subGroupBy;

                  const groups: Record<string, ListItem[]> = {};
                  for (const it of filteredItems) {
                    let key: string;
                    if (groupBy === "tag") {
                      key = it.tags?.[0]?.toLowerCase() || "__none__";
                    } else {
                      // status — normalize legacy todo/done
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
                    // status — canonical order, not alphabetical
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
                        {/* Collapsible header */}
                        <button
                          type="button"
                          onClick={() => toggleCollapsedGroup(key)}
                          aria-expanded={!isCollapsed}
                          className="group flex items-center gap-2 w-full text-left cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                              isCollapsed ? "-rotate-90" : ""
                            }`}
                          />
                          <h3
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono uppercase tracking-wider font-bold border ${getGroupPillClasses(key, groupBy)}`}
                          >
                            {title}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            · {items.length}
                          </span>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/80" />
                        </button>

                        {/* Collapsible content */}
                        {!isCollapsed &&
                          (effectiveSub === "none" ? (
                            renderItemsGrid(items)
                          ) : (
                            <div className="space-y-4 pl-2 border-l border-slate-200/70 dark:border-slate-800/60">
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

          {/* ================= SUB-TAB 2: LINKED NOTES ================= */}
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
                    className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 shadow-xs cursor-pointer space-y-2 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {stripHtml(note.content)}
                      </p>
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                      <span>Created {formatCreatedDate(note.createdAt)}</span>
                      {note.tags.length > 0 && (
                        <span className="text-slate-400 truncate max-w-[50%] text-right">
                          {note.tags.map((t) => `#${t}`).join(" ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {linkedNotes.length === 0 && (
                <p className="text-center text-[11px] text-slate-400 italic">
                  No notes linked to this list yet — click the card above to add
                  one.
                </p>
              )}
            </div>
          )}

          {/* ================= SUB-TAB 3: LINKED EVENTS ================= */}
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
                    className="p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-rose-500/40 shadow-xs cursor-pointer flex flex-col gap-2 transition-all"
                  >
                    <div className="flex flex-col h-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {event.title}
                        </h4>
                      </div>

                      <div className="pt-2 mt-1 w-full border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
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
                                ? "text-white dark:text-white bg-indigo-500"
                                : "text-white dark:text-white bg-rose-500"
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
                <p className="text-center text-[11px] text-slate-400 italic">
                  No events linked to this list yet — click the card above to
                  schedule one.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Master Input Bar for Lists View */}
      {activeSubTab === "items" && inputBar}

      {/* 3. Floating Status Picker Popover */}
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
