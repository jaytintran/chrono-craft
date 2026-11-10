/**
 * ChronoCraft - Notes View Component
 */

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  ArrowUpDown,
  Tag,
  MoreVertical,
} from "lucide-react";
import { Note, TimelineEntry } from "../../types";
import { stripHtml } from "../../components/editors/RichTextEditor";
import { RichContent } from "../../components/editors/RichContent";
import { FilterSelect } from "../../components/ui/FilterSelect";

interface NotesViewProps {
  notes: Note[];
  timelineNotes: TimelineEntry[];
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
}

const STORAGE_KEY = "chronocraft_notes_filter_options";
const countWords = (html: string) =>
  stripHtml(html).trim().split(/\s+/).filter(Boolean).length;

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  timelineNotes,
  onOpenCreateNote,
  onOpenEditNote,
  onDeleteNote,
  onOpenContextMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const [filterOptions, setFilterOptions] = useState<NotesFilterStorage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { sortBy: "pinned-first", selectedTag: null };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterOptions));
    } catch (e) {
      console.error("Failed to save notes filter options", e);
    }
  }, [filterOptions]);

  const syntheticTimelineNotes: Note[] = timelineNotes.map((tn) => ({
    id: `tl_${tn.id}`,
    title: tn.title,
    content: tn.metadata?.notes || "(Created via Timeline spine capture)",
    tags: tn.tags,
    listIds: tn.metadata?.listId ? [tn.metadata.listId] : [],
    createdAt: tn.createdAt,
    updatedAt: tn.createdAt,
    isPinned: tn.metadata?.isPinned ?? false,
  }));

  const allNotes = [...notes, ...syntheticTimelineNotes];

  const allTags = Array.from(new Set(allNotes.flatMap((n) => n.tags)));

  const filteredNotes = allNotes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        !filterOptions.selectedTag ||
        note.tags.includes(filterOptions.selectedTag);
      return matchesSearch && matchesTag;
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

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-soft bg-app/50 backdrop-blur-xs shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-warning" />
            <h2 className="text-base font-bold text-primary">
              Notes & Knowledge Cards
            </h2>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Synchronized notes with tag indexing, list linkage, and Timeline
            capture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-soft bg-surface text-xs text-primary focus:outline-none focus:border-accent w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={onOpenCreateNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="px-6 py-3 border-b border-soft bg-sunken/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <FilterSelect
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-muted" />}
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

          {allTags.length > 0 && (
            <FilterSelect
              icon={<Tag className="w-3.5 h-3.5 text-warning" />}
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
        </div>

        <div className="text-xs font-mono text-muted tabular-nums">
          Showing {filteredNotes.length} of {allNotes.length} notes
        </div>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-soft text-xs text-muted">
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
                    onOpenContextMenu?.(note, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className="group relative p-4 rounded-2xl bg-raised border border-soft hover:border-warning/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm transition-colors line-clamp-1 group-hover:text-warning">
                        {note.title ? (
                          <span className="text-primary">{note.title}</span>
                        ) : (
                          <span className="text-muted italic font-normal">
                            Untitled Note
                          </span>
                        )}
                      </h3>
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-warning shrink-0" />
                      )}
                    </div>

                    <div className="relative">
                      <RichContent
                        content={note.content}
                        className="text-xs text-secondary leading-relaxed font-sans line-clamp-6"
                      />
                      {/* Soft fade at the bottom edge to signal truncation */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-raised"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-soft flex items-center justify-between text-xs text-muted font-mono">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span>{formatDate(note.updatedAt)}</span>
                      {note.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-secondary truncate max-w-[100px]">
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
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          onOpenContextMenu?.(note, {
                            x: rect.left,
                            y: rect.bottom + 4,
                          });
                        }}
                        title="More options (or right click)"
                        className="p-1 text-muted hover:text-primary hover:bg-hover rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
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
