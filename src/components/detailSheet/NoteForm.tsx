import React, { useState, useEffect, useRef } from "react";
import { Note, CustomList } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { MetaRow } from "./MetaRow";
import { TitleInput } from "./TitleInput";

interface NoteFormProps {
  data: Partial<Note>;
  availableLists: CustomList[];
  listTagsById?: Map<string, string[]>;
  allTags?: string[];
  /** Fires every time the pin state changes so the shell can update its header button. */
  onPinChange?: (pinned: boolean) => void;
  /** Fires whenever any field changes; parent uses this to schedule a debounced save. */
  onDirty?: () => void;
}

export interface NoteFormHandle {
  collect: () => Partial<Note>;
  togglePinned: () => void;
  isPinned: () => boolean;
}

export const NoteForm = React.forwardRef<NoteFormHandle, NoteFormProps>(
  (
    { data, availableLists, listTagsById, allTags, onPinChange, onDirty },
    ref,
  ) => {
    const [title, setTitle] = useState(data.title || "");
    const [content, setContent] = useState(data.content || "");
    const [tags, setTags] = useState<string[]>(data.tags || []);
    const [listIds, setListIds] = useState<string[]>(data.listIds || []);
    const [isPinned, setIsPinned] = useState(data.isPinned || false);
    const lastIdRef = useRef(data.id);

    // Hydrate all fields whenever the sheet switches to a different note
    useEffect(() => {
      if (lastIdRef.current !== data.id) {
        lastIdRef.current = data.id;
        setTitle(data.title || "");
        setContent(data.content || "");
        setTags(data.tags || []);
        setListIds(data.listIds || []);
        setIsPinned(data.isPinned || false);
        onPinChange?.(data.isPinned || false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.id]);

    useEffect(() => {
      onDirty?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, content, tags, listIds, isPinned]);

    const togglePinned = () => {
      setIsPinned((prev) => {
        const next = !prev;
        onPinChange?.(next);
        return next;
      });
    };

    React.useImperativeHandle(
      ref,
      () => ({
        collect: () => ({
          id: data.id,
          title: title.trim(),
          content,
          tags,
          listIds,
          isPinned,
        }),
        togglePinned,
        isPinned: () => isPinned,
      }),
      [data.id, title, content, tags, listIds, isPinned],
    );

    return (
      <div className="space-y-4">
        <TitleInput
          value={title}
          onChange={setTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (
                document.querySelector(".tiptap") as HTMLElement | null
              )?.focus();
            }
            // Shift+Enter is left alone → produces a manual line break in the title
          }}
          placeholder="Untitled note"
          className="text-2xl font-semibold text-primary placeholder-muted leading-tight"
        />

        <MetaRow
          tags={tags}
          listIds={listIds}
          availableLists={availableLists}
          listTagsById={listTagsById}
          allTags={allTags}
          onToggleListId={(id) =>
            setListIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            )
          }
          onAddTag={(t) => setTags((prev) => [...prev, t])}
          onRemoveTag={(t) => setTags((prev) => prev.filter((x) => x !== t))}
        />

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write, or type '/' for commands…"
          variant="seamless"
          minHeight="55vh"
        />
      </div>
    );
  },
);
NoteForm.displayName = "NoteForm";
