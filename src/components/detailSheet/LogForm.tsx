import React, { useState, useEffect, useRef } from "react";
import { TimelineEntry } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { TitleInput } from "./TitleInput";

export interface LogFormHandle {
  collect: () => Partial<TimelineEntry>;
}

interface LogFormProps {
  data: Partial<TimelineEntry>;
  onDirty?: () => void;
}

export const LogForm = React.forwardRef<LogFormHandle, LogFormProps>(
  ({ data, onDirty }, ref) => {
    const [title, setTitle] = useState(data.title || "");
    const [content, setContent] = useState(data.metadata?.notes || "");
    const [tags, setTags] = useState<string[]>(data.tags || []);
    const lastIdRef = useRef(data.id);

    useEffect(() => {
      if (lastIdRef.current !== data.id) {
        lastIdRef.current = data.id;
        setTitle(data.title || "");
        setContent(data.metadata?.notes || "");
        setTags(data.tags || []);
      }
    }, [data.id]);

    useEffect(() => {
      onDirty?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, content, tags]);

    React.useImperativeHandle(
      ref,
      () => ({
        collect: () => ({
          id: data.id,
          // Deliberately preserve every field the entry already had.
          // The caller merges this into the existing entry.
          type: "log",
          title: title.trim(),
          tags,
          metadata: {
            ...(data.metadata ?? {}),
            notes: content,
          },
        }),
      }),
      [data.id, data.metadata, title, content, tags],
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
          placeholder="Untitled log"
          className="text-2xl font-semibold text-primary placeholder-muted leading-tight"
        />

        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="What happened? Context, notes, details…"
          variant="seamless"
          minHeight="55vh"
        />
      </div>
    );
  },
);
LogForm.displayName = "LogForm";
