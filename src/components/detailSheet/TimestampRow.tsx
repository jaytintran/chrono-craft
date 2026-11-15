import React, { useState } from "react";
import { Calendar, Clock, CheckCircle2, Plus, X, Pencil } from "lucide-react";
import { CustomTimePickerPopover } from "../modals/CustomTimePickerPopover";
import { DatePickerPopover } from "../ui/DatePickerPopover";

interface TimestampRowProps {
  createdAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  onCreatedChange?: (iso: string | null) => void;
  onDateChange?: (iso: string) => void;
  onScheduledChange?: (iso: string | null) => void;
  onCompletedChange?: (iso: string | null) => void;
  showDate?: boolean;
  showScheduled?: boolean;
  showCompleted?: boolean;
  allowAddScheduled?: boolean;
  allowAddCompleted?: boolean;
}

const fmtTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
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

type OpenPicker =
  | { kind: "date"; pos: { x: number; y: number } }
  | { kind: "created"; pos: { x: number; y: number } }
  | { kind: "scheduled"; pos: { x: number; y: number } }
  | { kind: "completed"; pos: { x: number; y: number } }
  | null;

export const TimestampRow: React.FC<TimestampRowProps> = ({
  createdAt,
  scheduledAt,
  completedAt,
  onCreatedChange,
  onDateChange,
  onScheduledChange,
  onCompletedChange,
  showDate = true,
  showScheduled = true,
  showCompleted = true,
  allowAddScheduled = false,
  allowAddCompleted = false,
}) => {
  const [picker, setPicker] = useState<OpenPicker>(null);

  const anchorPos = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: rect.left, y: rect.bottom + 6 };
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-secondary">
        {/* Anchor date pill — always tied to createdAt */}
        {showDate && createdAt && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!onDateChange) return;
              setPicker({ kind: "date", pos: anchorPos(e) });
            }}
            disabled={!onDateChange}
            title={onDateChange ? "Change date" : undefined}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors ${
              onDateChange
                ? "hover:bg-hover hover:text-primary cursor-pointer"
                : "cursor-default"
            }`}
          >
            <Calendar className="w-3 h-3 text-muted" />
            <span className="tabular-nums text-primary font-semibold">
              {fmtDate(createdAt)}
            </span>
          </button>
        )}

        {/* Created — editable time-of-day */}
        {createdAt && (
          <>
            {showDate && createdAt && <span className="text-muted">·</span>}
            {onCreatedChange ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPicker({ kind: "created", pos: anchorPos(e) });
                }}
                title="Change created time"
                className="inline-flex items-center gap-1 hover:text-accent cursor-pointer transition-colors"
              >
                <Pencil className="w-3 h-3 text-muted" />
                <span className="text-muted">
                  Created{" "}
                  <span className="text-secondary tabular-nums">
                    {fmtTime(createdAt)}
                  </span>
                </span>
              </button>
            ) : (
              <span className="text-muted">
                Created{" "}
                <span className="text-secondary tabular-nums">
                  {fmtTime(createdAt)}
                </span>
              </span>
            )}
          </>
        )}

        {/* Scheduled */}
        {showScheduled && (
          <>
            {scheduledAt ? (
              <>
                <span className="text-muted">·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!onScheduledChange) return;
                    setPicker({ kind: "scheduled", pos: anchorPos(e) });
                  }}
                  disabled={!onScheduledChange}
                  title={
                    onScheduledChange
                      ? "Click to change scheduled time"
                      : "Scheduled time"
                  }
                  className={`inline-flex items-center gap-1 transition-colors ${
                    onScheduledChange
                      ? "hover:text-accent cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <Clock className="w-3 h-3 text-info" />
                  <span className="text-info tabular-nums">
                    {fmtTime(scheduledAt)}
                  </span>
                </button>
                {onScheduledChange && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduledChange(null);
                    }}
                    title="Clear scheduled time"
                    className="text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </>
            ) : (
              allowAddScheduled &&
              onScheduledChange && (
                <>
                  <span className="text-muted">·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPicker({ kind: "scheduled", pos: anchorPos(e) });
                    }}
                    className="inline-flex items-center gap-1 text-muted hover:text-info transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Set time</span>
                  </button>
                </>
              )
            )}
          </>
        )}

        {/* Completed */}
        {showCompleted && (
          <>
            {completedAt ? (
              <>
                <span className="text-muted">·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!onCompletedChange) return;
                    setPicker({ kind: "completed", pos: anchorPos(e) });
                  }}
                  disabled={!onCompletedChange}
                  title={
                    onCompletedChange
                      ? "Click to change completed time"
                      : "Completed time"
                  }
                  className={`inline-flex items-center gap-1 transition-colors ${
                    onCompletedChange
                      ? "hover:text-accent cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  <span className="text-success tabular-nums">
                    Done {fmtTime(completedAt)}
                  </span>
                </button>
                {onCompletedChange && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompletedChange(null);
                    }}
                    title="Clear completed time"
                    className="text-muted hover:text-danger transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </>
            ) : (
              allowAddCompleted &&
              onCompletedChange && (
                <>
                  <span className="text-muted">·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPicker({ kind: "completed", pos: anchorPos(e) });
                    }}
                    className="inline-flex items-center gap-1 text-muted hover:text-success transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Set completed</span>
                  </button>
                </>
              )
            )}
          </>
        )}
      </div>

      {/* Popovers */}
      {picker?.kind === "date" && onDateChange && createdAt && (
        <DatePickerPopover
          isOpen
          initialIso={createdAt}
          position={picker.pos}
          title="Change Date"
          onSave={onDateChange}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === "created" && onCreatedChange && createdAt && (
        <CustomTimePickerPopover
          isOpen
          initialIso={createdAt}
          position={picker.pos}
          title="Created Time"
          onSave={(iso) => {
            onCreatedChange(iso);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === "scheduled" && onScheduledChange && (
        <CustomTimePickerPopover
          isOpen
          initialIso={scheduledAt || new Date().toISOString()}
          position={picker.pos}
          title="Scheduled Time"
          onSave={(iso) => {
            onScheduledChange(iso);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker?.kind === "completed" && onCompletedChange && (
        <CustomTimePickerPopover
          isOpen
          initialIso={completedAt || new Date().toISOString()}
          position={picker.pos}
          title="Completed Time"
          onSave={(iso) => {
            onCompletedChange(iso);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
};
