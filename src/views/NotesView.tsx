/**
 * ChronoCraft - Notes View Component
 * Features an intuitive options choosing area with persistent filtering and sorting via localStorage,
 * aggregates notes created in Timeline, and integrates with the slide-over DetailSheet.
 */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Folder,
  Pin,
  Trash2,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  Check,
  MoreVertical,
} from "lucide-react";
import { CustomList, Note, TimelineEntry } from "../types";
import { stripHtml } from "../components/RichTextEditor";
import { RichContent } from "../components/RichContent";
import { FilterSelect } from "../components/FilterSelect";

interface NotesViewProps {
  notes: Note[];
  timelineNotes: TimelineEntry[];
  lists: CustomList[];
  onOpenCreateNote: () => void;
  onOpenEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => Promise<void>;
  onOpenContextMenu?: (note: Note, pos: { x: number; y: number }) => void;
}

type NoteSortOption =
  | "updated-desc"
  | "created-desc"
  | "title-asc"
  | "pinned-first";

interface NotesFilterStorage {
  sortBy: NoteSortOption;
  selectedTag: string | null;
  selectedListId: string | null;
}

const STORAGE_KEY = "chronocraft_notes_filter_options";

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  timelineNotes,
  lists,
  onOpenCreateNote,
  onOpenEditNote,
  onDeleteNote,
  onOpenContextMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Persistent Filter & Sort State from localStorage
  const [filterOptions, setFilterOptions] = useState<NotesFilterStorage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // fallback
    }
    return {
      sortBy: "pinned-first",
      selectedTag: null,
      selectedListId: null,
    };
  });

  // Save to localStorage whenever filterOptions changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOptions));
    } catch (e) {
      console.error("Failed to save notes filter options to localStorage", e);
    }
  }, [filterOptions]);

  // Combine dedicated Notes and Timeline Note entries
  const syntheticTimelineNotes: Note[] = timelineNotes.map((tn) => ({
    id: `tl_${tn.id}`,
    title: tn.title,
    content: tn.metadata?.notes || "(Created via Timeline spine capture)",
    tags: tn.tags,
    listIds: tn.metadata?.listId ? [tn.metadata.listId] : [],
    createdAt: tn.createdAt,
    updatedAt: tn.createdAt,
    isPinned: false,
  }));

  const allNotes = [...notes, ...syntheticTimelineNotes];

  // Extract all unique tags
  const allTags = Array.from(new Set(allNotes.flatMap((n) => n.tags)));

  // Filter & Sort notes
  const filteredNotes = allNotes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        !filterOptions.selectedTag ||
        note.tags.includes(filterOptions.selectedTag);
      const matchesList =
        !filterOptions.selectedListId ||
        note.listIds.includes(filterOptions.selectedListId);
      return matchesSearch && matchesTag && matchesList;
    })
    .sort((a, b) => {
      if (filterOptions.sortBy === "pinned-first") {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      if (filterOptions.sortBy === "updated-desc") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      if (filterOptions.sortBy === "created-desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (filterOptions.sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const getListName = (id: string) => {
    return lists.find((l) => l.id === id)?.name || "List";
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleResetFilters = () => {
    setFilterOptions({
      sortBy: "pinned-first",
      selectedTag: null,
      selectedListId: null,
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filterOptions.selectedTag !== null ||
    filterOptions.selectedListId !== null ||
    searchQuery.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0B0F17]/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Notes & Knowledge Cards
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized notes with tag indexing, list linkage, and Timeline
            capture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* + New Note Button */}
          <button
            type="button"
            onClick={onOpenCreateNote}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Redesigned Options Choosing Area (Persistent via localStorage) */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#0E131E] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Sort Selector Dropdown */}
          <FilterSelect
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />}
            value={filterOptions.sortBy}
            onChange={(v) =>
              setFilterOptions((p) => ({ ...p, sortBy: v as NoteSortOption }))
            }
            options={[
              { value: "pinned-first", label: "Pinned First" },
              { value: "updated-desc", label: "Recently Updated" },
              { value: "created-desc", label: "Recently Created" },
              { value: "title-asc", label: "Title (A – Z)" },
            ]}
          />

          {/* List Selector Dropdown */}
          <FilterSelect
            icon={<Folder className="w-3.5 h-3.5 text-indigo-400" />}
            value={filterOptions.selectedListId || ""}
            active={!!filterOptions.selectedListId}
            onChange={(v) =>
              setFilterOptions((p) => ({ ...p, selectedListId: v || null }))
            }
            options={[
              { value: "", label: "All Lists" },
              ...lists.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />

          {/* Tag Selector Dropdown */}
          {allTags.length > 0 && (
            <FilterSelect
              icon={<Tag className="w-3.5 h-3.5 text-amber-400" />}
              value={filterOptions.selectedTag || ""}
              active={!!filterOptions.selectedTag}
              onChange={(v) =>
                setFilterOptions((p) => ({ ...p, selectedTag: v || null }))
              }
              options={[
                { value: "", label: "All Tags" },
                ...allTags.map((t) => ({ value: t, label: `#${t}` })),
              ]}
            />
          )}

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="text-xs font-mono text-slate-400 tabular-nums">
          Showing {filteredNotes.length} of {allNotes.length} notes
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No notes match your active options. Try clearing the search or
              filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onOpenEditNote(note)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (onOpenContextMenu) {
                      onOpenContextMenu(note, { x: e.clientX, y: e.clientY });
                    }
                  }}
                  className="group relative p-4 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-1">
                        {note.title}
                      </h3>
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <RichContent
                      content={note.content}
                      className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Footer Metadata */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span>{formatDate(note.updatedAt)}</span>
                      {note.listIds.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-indigo-400">
                            <Folder className="w-3 h-3" />
                            {getListName(note.listIds[0])}
                          </span>
                        </>
                      )}
                      {note.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500 truncate max-w-[100px]">
                            {note.tags.map((t) => `#${t}`).join(" ")}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenContextMenu) {
                            const rect = (
                              e.currentTarget as HTMLElement
                            ).getBoundingClientRect();
                            onOpenContextMenu(note, {
                              x: rect.left,
                              y: rect.bottom + 4,
                            });
                          }
                        }}
                        title="More options (or right click)"
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
