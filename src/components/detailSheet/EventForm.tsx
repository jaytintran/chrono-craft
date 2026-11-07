import React, { useState, useEffect } from "react";
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
  onDirty?: () => void;
}

export const EventForm = React.forwardRef<EventFormHandle, EventFormProps>(
  ({ data, availableLists, onDirty }, ref) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [category, setCategory] = useState<"official" | "personal">(
      "personal",
    );
    const [tags, setTags] = useState<string[]>([]);
    const [listIds, setListIds] = useState<string[]>([]);
    const [isAchievement, setIsAchievement] = useState(false);

    useEffect(() => {
      setTitle(data.title || "");
      setDescription(data.description || "");
      setTags(data.tags || []);
      setListIds(data.listIds || []);
      setAllDay(data.allDay || false);
      setCategory(data.category || "personal");
      setIsAchievement(data.isAchievement || false);

      const defaultStart = data.startAt ? new Date(data.startAt) : new Date();
      setStartAt(formatDateTimeLocal(defaultStart));

      if (data.endAt) {
        setEndAt(formatDateTimeLocal(new Date(data.endAt)));
      } else {
        const e = new Date(defaultStart);
        e.setHours(e.getHours() + 1);
        setEndAt(formatDateTimeLocal(e));
      }
    }, [data]);

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

    // ----- schedule helpers -----
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
      "px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]";

    React.useImperativeHandle(ref, () => ({
      collect: () => ({
        id: data.id,
        title: title.trim() || "Untitled Event",
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        allDay,
        category,
        tags,
        listIds: isAchievement ? [] : listIds,
        isAchievement,
      }),
    }));

    return (
      <div className="space-y-4">
        {/* Title */}
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
          placeholder="Untitled event"
          className="text-2xl font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 leading-tight"
        />

        {/* Classification */}
        <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(
            [
              {
                id: "official",
                label: "Official",
                on: "bg-indigo-600 text-white shadow-xs",
              },
              {
                id: "personal",
                label: "Personal",
                on: "bg-rose-600 text-white shadow-xs",
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
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Schedule card */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {/* All-day */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              All-day milestone
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => setAllDay((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                allDay ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  allDay ? "translate-x-4" : ""
                }`}
              />
            </button>
          </div>

          {/* Start */}
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 text-[11px] font-mono uppercase text-slate-400">
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

          {/* End */}
          {!allDay && (
            <div>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-10 text-[11px] font-mono uppercase text-slate-400">
                  End
                </span>
                <input
                  type="date"
                  value={splitDT(endAt).d}
                  onChange={(e) =>
                    handleEndChange(e.target.value, splitDT(endAt).t)
                  }
                  className={`${dtInput} flex-1 ${endInvalid ? "!border-rose-500" : ""}`}
                />
                <input
                  type="time"
                  value={splitDT(endAt).t}
                  onChange={(e) =>
                    handleEndChange(splitDT(endAt).d, e.target.value)
                  }
                  className={`${dtInput} w-28 ${endInvalid ? "!border-rose-500" : ""}`}
                />
              </div>
              <div className="pb-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono pl-[4.25rem]">
                  {endInvalid && (
                    <span className="text-rose-400">End is before start</span>
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
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
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

        {/* Lists + tags */}
        {!isAchievement && (
          <MetaRow
            tags={tags}
            listIds={listIds}
            availableLists={availableLists}
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

        {/* Description */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
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
