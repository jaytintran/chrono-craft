import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Calendar, Clock, Sun, X } from "lucide-react";
import { DatePickerPopover } from "../ui/DatePickerPopover";
import { CustomTimePickerPopover } from "../modals/CustomTimePickerPopover";
import { CalendarEvent, CustomList } from "../../types";
import { RichTextEditor } from "../editors/RichTextEditor";
import { MetaRow } from "./MetaRow";
import { formatDateTimeLocal } from "./types";
import { TitleInput } from "./TitleInput";
import { TimestampRow } from "./TimestampRow";

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

    const [createdAt, setCreatedAt] = useState<string | undefined>(
      data.createdAt,
    );
    const lastIdRef = useRef(data.id);

    const [picker, setPicker] = useState<
      | { kind: "start-date"; pos: { x: number; y: number } }
      | { kind: "end-date"; pos: { x: number; y: number } }
      | { kind: "start-time"; pos: { x: number; y: number } }
      | { kind: "end-time"; pos: { x: number; y: number } }
      | null
    >(null);

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
        setCreatedAt(data.createdAt);

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
      createdAt,
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

    const anchorPos = (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      return { x: rect.left, y: rect.bottom + 6 };
    };

    const fmtDate = (v: string) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "Set date";
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();
      const isSameYear = d.getFullYear() === today.getFullYear();
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      if (isToday) return `Today, ${dd}/${mm}`;
      return isSameYear
        ? `${weekday}, ${dd}/${mm}`
        : `${weekday}, ${dd}/${mm}/${d.getFullYear()}`;
    };

    const fmtTime = (v: string) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "--:--";
      return d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    };

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
          createdAt,
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
        createdAt,
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

        <TimestampRow
          createdAt={createdAt}
          completedAt={data.completedAt}
          onCreatedChange={(iso) => setCreatedAt(iso ?? undefined)}
          onDateChange={(iso) => setCreatedAt(iso)}
          showDate
          showScheduled={false}
          showCompleted
        />

        <div className="rounded-2xl border border-soft">
          {/* Header: eyebrow + category segmented control */}
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 border-b border-soft/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Type
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-raised border border-soft text-[11px] font-mono">
              {(
                [
                  { id: "official", label: "Official" },
                  { id: "personal", label: "Personal" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(opt.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    category === opt.id
                      ? "bg-accent text-accent-fg font-semibold shadow-xs"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start / End rows */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Start group */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                From
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPicker({ kind: "start-date", pos: anchorPos(e) });
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-raised border border-soft hover:border-strong hover:bg-hover text-xs font-mono text-primary transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-muted" />
                <span className="tabular-nums">{fmtDate(startAt)}</span>
              </button>

              {!allDay && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicker({ kind: "start-time", pos: anchorPos(e) });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-raised border border-soft hover:border-strong hover:bg-hover text-xs font-mono text-primary transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  <span className="tabular-nums">{fmtTime(startAt)}</span>
                </button>
              )}
            </div>

            {/* Arrow separator */}
            <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />

            {/* End group */}
            {!allDay ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicker({ kind: "end-date", pos: anchorPos(e) });
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-raised border text-xs font-mono text-primary transition-colors cursor-pointer ${
                    endInvalid
                      ? "border-danger/50 hover:border-danger"
                      : "border-soft hover:border-strong hover:bg-hover"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span className="tabular-nums">{fmtDate(endAt)}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicker({ kind: "end-time", pos: anchorPos(e) });
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-raised border text-xs font-mono text-primary transition-colors cursor-pointer ${
                    endInvalid
                      ? "border-danger/50 hover:border-danger"
                      : "border-soft hover:border-strong hover:bg-hover"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-muted" />
                  <span className="tabular-nums">{fmtTime(endAt)}</span>
                </button>
                {endInvalid && (
                  <span className="text-[10px] font-mono text-danger">
                    End is before start
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sunken border border-dashed border-strong text-xs font-mono text-muted">
                <Sun className="w-3.5 h-3.5" />
                All-day
              </span>
            )}
          </div>

          {/* Footer row: duration chips + all-day toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-soft/60">
            <div className="flex flex-wrap items-center gap-1.5">
              {!allDay ? (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted mr-1">
                    Duration
                  </span>
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
                </>
              ) : (
                <span className="text-[11px] font-mono text-muted">
                  All-day milestone
                </span>
              )}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={allDay}
              onClick={() => setAllDay((v) => !v)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors cursor-pointer ${
                allDay
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-transparent border-soft text-muted hover:text-primary hover:border-strong"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>All-day</span>
            </button>
          </div>
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

        {picker?.kind === "start-date" && (
          <DatePickerPopover
            isOpen
            initialIso={startAt}
            position={picker.pos}
            title="Start Date"
            onSave={(iso) => {
              handleStartChange(iso.slice(0, 10), splitDT(startAt).t);
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        )}

        {picker?.kind === "end-date" && (
          <DatePickerPopover
            isOpen
            initialIso={endAt}
            position={picker.pos}
            title="End Date"
            onSave={(iso) => {
              handleEndChange(iso.slice(0, 10), splitDT(endAt).t);
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        )}

        {picker?.kind === "start-time" && (
          <CustomTimePickerPopover
            isOpen
            initialIso={startAt}
            position={picker.pos}
            title="Start Time"
            onSave={(iso) => {
              handleStartChange(splitDT(startAt).d, iso.slice(11, 16));
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        )}

        {picker?.kind === "end-time" && (
          <CustomTimePickerPopover
            isOpen
            initialIso={endAt}
            position={picker.pos}
            title="End Time"
            onSave={(iso) => {
              handleEndChange(splitDT(endAt).d, iso.slice(11, 16));
              setPicker(null);
            }}
            onClose={() => setPicker(null)}
          />
        )}
      </div>
    );
  },
);
EventForm.displayName = "EventForm";
