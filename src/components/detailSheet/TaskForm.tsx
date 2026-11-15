import React, { useEffect, useRef, useState } from "react";
import { TimelineEntry, CustomList } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { MetaRow } from "./MetaRow";
import { TitleInput } from "./TitleInput";
import { TimestampRow } from "./TimestampRow";

export interface TaskFormHandle {
  collect: () => Partial<TimelineEntry>;
}

interface TaskFormProps {
  data: Partial<TimelineEntry>;
  availableLists: CustomList[];
  listTagsById?: Map<string, string[]>;
  allTags?: string[];
  onDirty?: () => void;
}

export const TaskForm = React.forwardRef<TaskFormHandle, TaskFormProps>(
  ({ data, availableLists, listTagsById, allTags, onDirty }, ref) => {
    const [title, setTitle] = useState(data.title || "");
    const [notes, setNotes] = useState(data.metadata?.notes || "");
    const [tags, setTags] = useState<string[]>(data.tags || []);
    const [listIds, setListIds] = useState<string[]>(
      data.metadata?.listId ? [data.metadata.listId] : [],
    );
    const [createdAt, setCreatedAt] = useState<string | undefined>(
      data.createdAt,
    );
    const [scheduledAt, setScheduledAt] = useState<string | undefined>(
      data.scheduledAt,
    );
    const [completedAt, setCompletedAt] = useState<string | undefined>(
      data.completedAt,
    );
    const lastIdRef = useRef(data.id);

    useEffect(() => {
      if (lastIdRef.current !== data.id) {
        lastIdRef.current = data.id;
        setTitle(data.title || "");
        setNotes(data.metadata?.notes || "");
        setTags(data.tags || []);
        setListIds(data.metadata?.listId ? [data.metadata.listId] : []);
        setCreatedAt(data.createdAt);
        setScheduledAt(data.scheduledAt);
        setCompletedAt(data.completedAt);
      }
    }, [data.id]);

    useEffect(() => {
      onDirty?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, notes, tags, listIds, createdAt, scheduledAt, completedAt]);

    React.useImperativeHandle(
      ref,
      () => ({
        collect: () => {
          // Status is derived from completedAt — mirrors the rules the rest
          // of the app enforces for tasks.
          const status: TimelineEntry["status"] = completedAt
            ? "completed"
            : data.source === "focus-active"
            ? "active"
            : "pending";
          return {
            id: data.id,
            type: "task",
            title: title.trim(),
            tags,
            createdAt,
            scheduledAt,
            completedAt,
            status,
            metadata: {
              ...(data.metadata ?? {}),
              notes,
              listId: listIds[0],
            },
          };
        },
      }),
      [
        data.id,
        data.source,
        data.metadata,
        title,
        notes,
        tags,
        listIds,
        createdAt,
        scheduledAt,
        completedAt,
      ],
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
          }}
          placeholder="Untitled task"
          className="text-2xl font-semibold text-primary placeholder-muted leading-tight"
        />

        <TimestampRow
          createdAt={createdAt}
          scheduledAt={scheduledAt}
          completedAt={completedAt}
          onCreatedChange={(iso) => setCreatedAt(iso ?? undefined)}
          onDateChange={(iso) => setCreatedAt(iso)}
          onScheduledChange={(iso) => setScheduledAt(iso ?? undefined)}
          onCompletedChange={(iso) => setCompletedAt(iso ?? undefined)}
          showDate
          showScheduled
          showCompleted
          allowAddScheduled
          allowAddCompleted
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

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
            Notes
          </div>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Task notes, context, links…"
            variant="seamless"
            minHeight="40vh"
          />
        </div>
      </div>
    );
  },
);
TaskForm.displayName = "TaskForm";
