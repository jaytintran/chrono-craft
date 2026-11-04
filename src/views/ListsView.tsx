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
  LayoutGrid,
  LayoutList,
  AlignJustify,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import {
  CalendarEvent,
  CustomList,
  ListFolder,
  ListItem,
  ListItemStatus,
  Note,
} from "../types";

import { CreateListModal } from "../components/CreateListModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusPickerPopover } from "../components/StatusPickerPopover";
import { stripHtml } from "../components/RichTextEditor";

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
}

type FilterStatusType =
  | "all"
  | "inbox"
  | "in-progress"
  | "completed"
  | "dropped"
  | "maybe-later";

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
}) => {
  // Current active list
  const activeList =
    lists.find((l) => l.id === selectedListId) || lists[0] || null;

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

  const handleSetViewMode = (mode: "stacked" | "grid" | "compact") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("chronocraft_lists_view_mode", mode);
    }
  };

  // New item draft
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<
    "normal" | "high" | "low"
  >("normal");
  const [newItemInitialStatus, setNewItemInitialStatus] = useState<
    "inbox" | "in-progress" | "maybe-later"
  >("inbox");
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>("all");
  const [activeSubTab, setActiveSubTab] = useState<
    "items" | "linked-notes" | "linked-events"
  >("items");

  // Status picker popover state
  const [activeStatusPicker, setActiveStatusPicker] = useState<{
    itemId: string;
    status: ListItemStatus;
    position: { x: number; y: number };
  } | null>(null);

  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedFolderId) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setExpandedFolderId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedFolderId]);

  if (!activeList) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
        No lists found. Create your first list using "+ Add Custom List".
      </div>
    );
  }

  // Items for this list
  const currentItems = listItems.filter((i) => i.listId === activeList.id);

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
    if (filterStatus === "all") return true;
    if (filterStatus === "inbox")
      return i.status === "inbox" || i.status === "todo";
    if (filterStatus === "completed")
      return i.status === "completed" || i.status === "done";
    return i.status === filterStatus;
  });

  // Notes and events linked to this list
  const linkedNotes = notes.filter((n) => n.listIds.includes(activeList.id));
  const linkedEvents = events.filter((e) => e.listIds.includes(activeList.id));

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    await onAddListItem({
      listId: activeList.id,
      title: newItemTitle.trim(),
      status: newItemInitialStatus,
      priority: newItemPriority,
      tags: [],
      folderId: expandedFolderId ?? undefined,
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

  // ---------- Folders ----------
  const folders: ListFolder[] = activeList.folders ?? [];
  const folderIds = new Set(folders.map((f) => f.id));
  const rootItems = filteredItems.filter(
    (i) => !i.folderId || !folderIds.has(i.folderId),
  );
  const itemsInFolder = (fid: string) =>
    filteredItems.filter((i) => i.folderId === fid);
  const expandedFolder = folders.find((f) => f.id === expandedFolderId) || null;

  const saveFolders = (next: ListFolder[]) =>
    onUpdateList(activeList.id, { folders: next });

  const handleCreateFolder = async () => {
    const f: ListFolder = { id: "folder_" + Date.now(), name: "New Folder" };
    await saveFolders([...folders, f]);
    setRenamingFolderId(f.id);
  };
  const handleRenameFolder = (id: string, name: string) => {
    saveFolders(
      folders.map((f) =>
        f.id === id ? { ...f, name: name.trim() || f.name } : f,
      ),
    );
    setRenamingFolderId(null);
  };
  const handleToggleFolder = (id: string) =>
    saveFolders(
      folders.map((f) => (f.id === id ? { ...f, collapsed: !f.collapsed } : f)),
    );

  // Items go back to root, then the folder is removed
  const handleDeleteFolder = async (id: string) => {
    setFolderMenuId(null);
    for (const it of listItems.filter((i) => i.folderId === id)) {
      await onUpdateListItem(it.id, { folderId: undefined });
    }
    await saveFolders(folders.filter((f) => f.id !== id));
    if (expandedFolderId === id) setExpandedFolderId(null);
  };

  const handleDropOnFolder = (folderId?: string) => {
    if (draggingId) onUpdateListItem(draggingId, { folderId });
    setDraggingId(null);
  };

  const dragProps = (item: ListItem) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", item.id);
      setDraggingId(item.id);
    },
    onDragEnd: () => setDraggingId(null),
  });

  const openStatusPicker = (e: React.MouseEvent, item: ListItem) => {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveStatusPicker({
      itemId: item.id,
      status: item.status,
      position: { x: r.left, y: r.bottom + 6 },
    });
  };

  const renderFolderNameInput = (folder: ListFolder) => (
    <input
      autoFocus
      defaultValue={folder.name}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          e.currentTarget.value = folder.name;
          e.currentTarget.blur();
        }
      }}
      className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-500 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
    />
  );

  // Uniform card for carousels (fixed width) and expanded view (fluid)
  const renderCarouselCard = (item: ListItem, fluid = false) => {
    const done = item.status === "completed" || item.status === "done";
    const dropped = item.status === "dropped";
    return (
      <div
        key={item.id}
        {...dragProps(item)}
        onClick={() => onOpenItemDetail?.(item)}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpenContextMenu?.(item, { x: e.clientX, y: e.clientY });
        }}
        className={`group snap-start ${fluid ? "" : "w-72 sm:w-80 xl:w-96 shrink-0"} p-4 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 shadow-xs transition-all cursor-pointer flex flex-col gap-2`}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={(e) => openStatusPicker(e, item)}
            title={`Status: ${getStatusLabel(item.status)}`}
            className="p-1 -m-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform hover:scale-110 cursor-pointer shrink-0"
          >
            {getStatusIcon(item.status)}
          </button>
          <div className="min-w-0 flex-1">
            <div
              className={`text-sm font-semibold truncate ${done ? "line-through text-slate-400 dark:text-slate-500" : dropped ? "line-through text-rose-400/70" : "text-slate-900 dark:text-slate-100"}`}
            >
              {item.title}
            </div>
            {item.subtitle && (
              <div className="text-xs text-slate-500 truncate">
                {item.subtitle}
              </div>
            )}
            {item.notes && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {stripHtml(item.notes)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const r = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              onOpenContextMenu?.(item, { x: r.left, y: r.bottom + 4 });
            }}
            className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-auto">
          <span className="uppercase">{getStatusLabel(item.status)}</span>
          {item.priority === "high" && (
            <span className="text-rose-500 font-bold">!HIGH</span>
          )}
          {item.dueDate && (
            <span className="text-cyan-500">Due {item.dueDate}</span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {item.tags.map((t) => `#${t}`).join(" ")}
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folder: ListFolder) => {
    const items = itemsInFolder(folder.id);
    const total = listItems.filter((i) => i.folderId === folder.id).length;
    return (
      <section
        key={folder.id}
        onDragOver={(e) => draggingId && e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleDropOnFolder(folder.id);
        }}
        className={`rounded-2xl border bg-slate-50/60 dark:bg-[#0E131E] transition-colors ${
          draggingId
            ? "border-dashed border-indigo-500/50"
            : "border-slate-200 dark:border-slate-800/80"
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={() => handleToggleFolder(folder.id)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            {folder.collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <Folder className="w-4 h-4 text-indigo-400 shrink-0" />

          {renamingFolderId === folder.id ? (
            renderFolderNameInput(folder)
          ) : (
            <button
              type="button"
              onClick={() => handleToggleFolder(folder.id)}
              onDoubleClick={() => setRenamingFolderId(folder.id)}
              className="flex-1 min-w-0 text-left text-sm font-semibold truncate text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {folder.name}
            </button>
          )}

          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {filterStatus === "all" ? total : `${items.length}/${total}`}
          </span>
          <button
            type="button"
            title="Expand to full canvas"
            onClick={() => setExpandedFolderId(folder.id)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setFolderMenuId(folderMenuId === folder.id ? null : folder.id)
              }
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {folderMenuId === folder.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFolderMenuId(null)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 p-1 rounded-xl bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-2xl text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFolderMenuId(null);
                      setRenamingFolderId(folder.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete folder
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {!folder.collapsed && (
          <div className="px-3 pb-3">
            {items.length === 0 ? (
              <div className="py-5 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                {total === 0
                  ? "Empty folder. Drag items here, or use the Folder field in an item’s detail sheet."
                  : "No items match the current filter."}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto snap-x pb-2">
                {items.map((it) => renderCarouselCard(it))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const inputBar = (
    <div className="sticky bottom-0 z-20 shrink-0 px-4 md:px-8 py-3.5 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-xl">
      <form
        onSubmit={handleCreateItem}
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <select
          value={newItemInitialStatus}
          onChange={(e) => setNewItemInitialStatus(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="inbox">Inbox</option>
          <option value="in-progress">In Progress</option>
          <option value="maybe-later">Maybe Later</option>
        </select>

        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder={
            expandedFolder
              ? `Add to “${expandedFolder.name}”…`
              : `Add new ${activeList.name.toLowerCase().replace(/s$/, "")}... (click card to add author/notes)`
          }
          className="flex-1 min-w-[180px] bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none px-2 py-1 font-sans"
        />

        <button
          type="button"
          onClick={() =>
            setNewItemPriority(newItemPriority === "high" ? "normal" : "high")
          }
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
            newItemPriority === "high"
              ? "bg-rose-500 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-200 border border-slate-200 dark:border-slate-800"
          }`}
        >
          {newItemPriority === "high" ? "!HIGH" : "Normal"}
        </button>

        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* 1. Mobile-Only Horizontal List Switcher Tabs (Hidden on Desktop) */}
      <div className="px-4 pt-3 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F17] shrink-0 flex md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {lists.map((list) => {
            const isCurrent = list.id === activeList.id;
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => onSelectList(list.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                }`}
              >
                <span style={{ color: isCurrent ? undefined : list.color }}>
                  {getListIcon(list.icon)}
                </span>
                <span>{list.name}</span>
                <span className="text-[10px] font-mono opacity-70">
                  ({listItems.filter((i) => i.listId === list.id).length})
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenCreateList}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New List</span>
          </button>
        </div>
      </div>

      {/* 2. Main Canvas */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-28">
        <div className="w-full space-y-4">
          {/* Header Card (No self-progress bar; surfaces 5-status collection metrics) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 shadow-xs">
            {/* Identity */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{
                  backgroundColor: `${activeList.color || "#6366F1"}26`,
                  color: activeList.color || "#6366F1",
                }}
              >
                {getListIcon(activeList.icon)}
              </div>
              <div className="min-w-0">
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
            </div>

            {/* Status metrics as filter chips */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  {
                    id: "inbox",
                    label: "Inbox",
                    count: inboxCount,
                    icon: Inbox,
                    color: "text-slate-400",
                    on: "bg-slate-500/15 border-slate-400/50",
                  },
                  {
                    id: "in-progress",
                    label: "Active",
                    count: inProgressCount,
                    icon: PlayCircle,
                    color: "text-amber-400",
                    on: "bg-amber-500/15 border-amber-400/50",
                  },
                  {
                    id: "completed",
                    label: "Done",
                    count: completedCount,
                    icon: CheckCircle2,
                    color: "text-emerald-400",
                    on: "bg-emerald-500/15 border-emerald-400/50",
                  },
                  {
                    id: "dropped",
                    label: "Dropped",
                    count: droppedCount,
                    icon: MinusCircle,
                    color: "text-rose-400",
                    on: "bg-rose-500/15 border-rose-400/50",
                  },
                  {
                    id: "maybe-later",
                    label: "Later",
                    count: maybeLaterCount,
                    icon: Bookmark,
                    color: "text-violet-400",
                    on: "bg-violet-500/15 border-violet-400/50",
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
                        : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {m.count}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-slate-500">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List options menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setListMenuOpen((o) => !o)}
                title="List options"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {listMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setListMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-48 p-1 rounded-xl bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800 shadow-2xl text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setListMenuOpen(false);
                        setIsEditListOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Rename / edit list
                    </button>
                    <button
                      type="button"
                      disabled={activeList.type !== "custom"}
                      title={
                        activeList.type !== "custom"
                          ? "Default lists can’t be deleted"
                          : undefined
                      }
                      onClick={() => {
                        setListMenuOpen(false);
                        setIsDeleteListOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete list
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sub-Tabs: Items | Linked Notes | Linked Events */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 gap-3">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab("items")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeSubTab === "items"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Tracked Items ({currentItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("linked-notes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeSubTab === "linked-notes"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Linked Notes ({linkedNotes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("linked-events")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeSubTab === "linked-events"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Linked Events ({linkedEvents.length})</span>
              </button>
            </div>

            {/* Right: Status Filters & View Mode Switcher */}
            {activeSubTab === "items" && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full">
                {/* 5-Status Filter Selector */}
                <div className="flex items-center gap-1 text-xs">
                  {(
                    [
                      "all",
                      "inbox",
                      "in-progress",
                      "completed",
                      "dropped",
                      "maybe-later",
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] capitalize transition-colors cursor-pointer whitespace-nowrap ${
                        filterStatus === st
                          ? "bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {st === "in-progress"
                        ? "In Progress"
                        : st === "maybe-later"
                          ? "Later"
                          : st}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCreateFolder}
                  title="Create a folder"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors cursor-pointer shrink-0"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Folder</span>
                </button>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("stacked")}
                    title="Stacked 1-Column Cards"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === "stacked"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("grid")}
                    title="2-Column Grid Cards"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode("compact")}
                    title="Compact Row View"
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === "compact"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= SUB-TAB 1: ITEMS ================= */}
          {activeSubTab === "items" && (
            <div className="space-y-4">
              {folders.length > 0 && (
                <div className="space-y-3">{folders.map(renderFolder)}</div>
              )}

              {draggingId && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropOnFolder(undefined);
                  }}
                  className="py-3 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  Drop here to move to root
                </div>
              )}

              {folders.length > 0 && rootItems.length > 0 && (
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Unsorted
                </div>
              )}

              {/* Items Rendered according to View Mode */}
              {rootItems.length === 0 ? (
                folders.length > 0 ? null : (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 bg-white/40 dark:bg-[#131926]/40">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No items found for the selected status.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Add new entries using the bottom input bar, or adjust your
                      filter.
                    </p>
                  </div>
                )
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5"
                      : viewMode === "compact"
                        ? "space-y-1.5"
                        : "space-y-2.5"
                  }
                >
                  {rootItems.map((item) => {
                    const isCompleted =
                      item.status === "completed" || item.status === "done";
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
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        onOpenContextMenu(item, {
                          x: rect.left,
                          y: rect.bottom + 4,
                        });
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
                            {/* Leftmost Status Icon Button (1-Click Status Popover) */}
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
                                  position: {
                                    x: rect.left,
                                    y: rect.bottom + 6,
                                  },
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

                            {item.priority === "high" && (
                              <span className="text-[9px] font-mono text-rose-500 font-bold uppercase shrink-0">
                                !HIGH
                              </span>
                            )}

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

                            {/* Status Clickable Text Badge */}
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
                                  position: {
                                    x: rect.left - 40,
                                    y: rect.bottom + 6,
                                  },
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

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteListItem(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                          {/* Leftmost Status Icon Button (1-Click Status Popover) */}
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
                                position: {
                                  x: rect.left,
                                  y: rect.bottom + 6,
                                },
                              });
                            }}
                            title={`Status: ${getStatusLabel(item.status)} (click to change)`}
                            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-110 cursor-pointer shrink-0 mt-0.5"
                          >
                            {getStatusIcon(item.status)}
                          </button>

                          {/* Content */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
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

                              {item.priority === "high" && (
                                <span className="text-[10px] font-mono text-rose-500 font-bold uppercase shrink-0">
                                  !HIGH
                                </span>
                              )}
                            </div>

                            {item.subtitle && (
                              <p className="text-xs text-slate-500 truncate">
                                {item.subtitle}
                              </p>
                            )}

                            {/* Tags or notes indicator */}
                            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-slate-400">
                              {item.notes && (
                                <span className="text-indigo-400 font-sans">
                                  Has notes
                                </span>
                              )}
                              {item.dueDate && (
                                <>
                                  {item.notes && <span>·</span>}
                                  <span className="text-cyan-500">
                                    Due {item.dueDate}
                                  </span>
                                </>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <>
                                  {(item.notes || item.dueDate) && (
                                    <span>·</span>
                                  )}
                                  <span className="text-slate-400 truncate">
                                    {item.tags.map((t) => `#${t}`).join(" ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right/Bottom Actions: Status Badge, 3-Dot Trigger, Delete */}
                        <div
                          className={`flex items-center gap-2 shrink-0 ${viewMode === "grid" ? "w-full justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60" : ""}`}
                        >
                          {/* Status Clickable Text Badge */}
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
                                position: {
                                  x: rect.left - 40,
                                  y: rect.bottom + 6,
                                },
                              });
                            }}
                            className="text-[11px] font-mono uppercase text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            {getStatusLabel(item.status)}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleThreeDotClick}
                              title="Item options"
                              className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteListItem(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= SUB-TAB 2: LINKED NOTES ================= */}
          {activeSubTab === "linked-notes" && (
            <div className="space-y-3">
              {linkedNotes.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No notes assigned to "{activeList.name}" yet. Open any note in
                  Notes View to link it.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {linkedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onOpenEditNote(note)}
                      className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 shadow-xs cursor-pointer space-y-2 transition-all"
                    >
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                        {note.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {stripHtml(note.content)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= SUB-TAB 3: LINKED EVENTS ================= */}
          {activeSubTab === "linked-events" && (
            <div className="space-y-3">
              {linkedEvents.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No events assigned to "{activeList.name}" yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onOpenEditEvent(event)}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-rose-500/40 shadow-xs cursor-pointer flex items-center justify-between gap-4 transition-all"
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {event.title}
                        </h4>
                        <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                          {new Date(event.startAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

      {expandedFolder && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-[#0B0F17]">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedFolderId(null)}
              title="Back to list (Esc)"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-100 cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
            {renamingFolderId === expandedFolder.id ? (
              renderFolderNameInput(expandedFolder)
            ) : (
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {expandedFolder.name}
                </h2>
                <div className="text-[11px] font-mono text-slate-400">
                  {activeList.name} · {itemsInFolder(expandedFolder.id).length}{" "}
                  items
                </div>
              </div>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setRenamingFolderId(expandedFolder.id)}
              title="Rename folder"
              className="p-1.5 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteFolder(expandedFolder.id)}
              title="Delete folder (items return to root)"
              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            {itemsInFolder(expandedFolder.id).length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Nothing here yet. Add the first item below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                {itemsInFolder(expandedFolder.id).map((it) =>
                  renderCarouselCard(it, true),
                )}
              </div>
            )}
          </div>
          {inputBar}
        </div>
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
