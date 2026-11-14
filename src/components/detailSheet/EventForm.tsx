import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";
import { CalendarEvent, CustomList } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { MetaRow } from "./MetaRow";
import { formatDateTimeLocal } from "./types";
import { TitleInput } from "./TitleInput";

export interface EventFormHandle {
  collect: () => Partial<CalendarEvent>;
}

interface EventFormProps {
  data: Partial<CalendarEvent>;
  availableLists: CustomList[];
  listTagsById?: Map<string, string[]>;
  allTags?: string[];
  onDirty?: () => void;
}

export const EventForm = React.forwardRef<EventFormHandle, EventFormProps>(
  ({ data, availableLists, listTagsById, allTags, onDirty }, ref) => {
    const defaultStart = data.startAt ? new Date(data.startAt) : new Date();
    const defaultEnd = data.endAt
      ? new Date(data.endAt)
      : (() => {
          const e = new Date(defaultStart);
          e.setHours(e.getHours() + 1);
          return e;
        })();

    const [title, setTitle] = useState(data.title || "");
    const [description, setDescription] = useState(data.description || "");
    const [startAt, setStartAt] = useState(formatDateTimeLocal(defaultStart));
    const [endAt, setEndAt] = useState(formatDateTimeLocal(defaultEnd));
    const [allDay, setAllDay] = useState(data.allDay || false);
    const [category, setCategory] = useState<"official" | "personal">(
      data.category || "personal",
    );
    const [tags, setTags] = useState<string[]>(data.tags || []);
    const [listIds, setListIds] = useState<string[]>(data.listIds || []);
    const [isAchievement, setIsAchievement] = useState(
      data.isAchievement || false,
    );
    const lastIdRef = useRef(data.id);

    useEffect(() => {
      if (lastIdRef.current !== data.id) {
        lastIdRef.current = data.id;
        setTitle(data.title || "");
        setDescription(data.description || "");
        setTags(data.tags || []);
        setListIds(data.listIds || []);
        setAllDay(data.allDay || false);
        setCategory(data.category || "personal");
        setIsAchievement(data.isAchievement || false);

        const curStart = data.startAt ? new Date(data.startAt) : new Date();
        setStartAt(formatDateTimeLocal(curStart));

        if (data.endAt) {
          setEndAt(formatDateTimeLocal(new Date(data.endAt)));
        } else {
          const e = new Date(curStart);
          e.setHours(e.getHours() + 1);
          setEndAt(formatDateTimeLocal(e));
        }
      }
    }, [data.id]);

    useEffect(() => {
      onDirty?.();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      title,
      description,
      startAt,
      endAt,
      allDay,
      category,
      tags,
      listIds,
      isAchievement,
    ]);

    const splitDT = (v: string) => {
      const [d = "", t = ""] = v.split("T");
      return { d, t: t || "09:00" };
    };
    const joinDT = (d: string, t: string) => `${d}T${t || "00:00"}`;

    const handleStartChange = (d: string, t: string) => {
      if (!d) return;
      const next = joinDT(d, t);
      const dur = new Date(endAt).getTime() - new Date(startAt).getTime();
      setStartAt(next);
      if (!isNaN(dur) && dur >= 0) {
        setEndAt(formatDateTimeLocal(new Date(new Date(next).getTime() + dur)));
      }
    };

    const handleEndChange = (d: string, t: string) => {
      if (!d) return;
      setEndAt(joinDT(d, t));
    };

    const setDuration = (mins: number) => {
      setEndAt(
        formatDateTimeLocal(
          new Date(new Date(startAt).getTime() + mins * 60000),
        ),
      );
    };

    const durMins = Math.round(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000,
    );
    const endInvalid = durMins < 0;

    const dtInput =
      "px-2.5 py-1.5 rounded-lg bg-raised border border-soft text-xs font-mono text-primary focus:outline-none focus:border-accent";

    React.useImperativeHandle(
      ref,
      () => ({
        collect: () => ({
          id: data.id,
          title: title.trim(),
          description,
          startAt: new Date(startAt).toISOString(),
          endAt: endAt ? new Date(endAt).toISOString() : undefined,
          allDay,
          category,
          tags,
          listIds: isAchievement ? [] : listIds,
        }),
      }),
      [
        data.id,
        title,
        description,
        startAt,
        endAt,
        allDay,
        category,
        tags,
        listIds,
        isAchievement,
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
          placeholder="Untitled Event"
          className="text-2xl font-semibold text-primary placeholder-muted leading-tight"
        />

        <div className="inline-flex p-0.5 rounded-xl bg-sunken border border-soft">
          {(
            [
              {
                id: "official",
                label: "Official",
                on: "bg-accent text-accent-fg shadow-xs",
              },
              {
                id: "personal",
                label: "Personal",
                on: "bg-danger text-white shadow-xs",
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCategory(opt.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-colors cursor-pointer ${
                category === opt.id
                  ? opt.on
                  : "text-secondary hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-sunken border border-soft divide-y divide-soft">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-secondary">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              All-day milestone
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => setAllDay((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                allDay ? "bg-accent" : "bg-strong"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  allDay ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 text-[11px] font-mono uppercase text-muted">
              Start
            </span>
            <input
              type="date"
              value={splitDT(startAt).d}
              onChange={(e) =>
                handleStartChange(e.target.value, splitDT(startAt).t)
              }
              className={`${dtInput} flex-1`}
            />
            {!allDay && (
              <input
                type="time"
                value={splitDT(startAt).t}
                onChange={(e) =>
                  handleStartChange(splitDT(startAt).d, e.target.value)
                }
                className={`${dtInput} w-28`}
              />
            )}
          </div>

          {!allDay && (
            <div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-10 text-[11px] font-mono uppercase text-muted">
                  End
                </span>
                <input
                  type="date"
                  value={splitDT(endAt).d}
                  onChange={(e) =>
                    handleEndChange(e.target.value, splitDT(endAt).t)
                  }
                  className={`${dtInput} flex-1 ${
                    endInvalid ? "!border-danger" : ""
                  }`}
                />
                <input
                  type="time"
                  value={splitDT(endAt).t}
                  onChange={(e) =>
                    handleEndChange(splitDT(endAt).d, e.target.value)
                  }
                  className={`${dtInput} w-28 ${
                    endInvalid ? "!border-danger" : ""
                  }`}
                />
              </div>
              <div className="pb-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono pl-[4.25rem]">
                  {endInvalid && (
                    <span className="text-danger">End is before start</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1 pl-[4.25rem]">
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120, 180].map((m) => {
                    const label =
                      m < 60
                        ? `${m}m`
                        : m % 60 === 0
                        ? `${m / 60}h`
                        : `${Math.floor(m / 60)}h ${m % 60}m`;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDuration(m)}
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-mono transition-colors cursor-pointer ${
                          durMins === m
                            ? "bg-accent/15 border-accent/40 text-accent"
                            : "border-soft text-muted hover:text-primary hover:border-strong"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isAchievement && (
          <MetaRow
            tags={tags}
            listIds={listIds}
            availableLists={availableLists}
            listTagsById={listTagsById}
            allTags={allTags}
            onToggleListId={(id) =>
              setListIds((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
            onAddTag={(t) => setTags((prev) => [...prev, t])}
            onRemoveTag={(t) => setTags((prev) => prev.filter((x) => x !== t))}
          />
        )}

        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
            Description & Context
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Agenda, location, links, prep notes… type '/' for commands"
            variant="seamless"
            minHeight="40vh"
          />
        </div>
      </div>
    );
  },
);
EventForm.displayName = "EventForm";
