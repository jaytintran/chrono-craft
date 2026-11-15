import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock, CheckCircle2, Pencil } from "lucide-react";
import { DatePickerPopover } from "../ui/DatePickerPopover";
import { CustomTimePickerPopover } from "../modals/CustomTimePickerPopover";

type Field = "createdAt" | "scheduledAt" | "completedAt";

interface TimestampsPopoverProps {
  isOpen: boolean;
  createdAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  showScheduled?: boolean;
  showCompleted?: boolean;
  onFieldChange: (field: Field, iso: string | null) => void;
  onClose: () => void;
}

const fmtTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const fmtDate = (iso?: string) => {
  if (!iso) return "Set date";
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

type InnerPicker =
  | { kind: "date"; pos: { x: number; y: number } }
  | { kind: "created"; pos: { x: number; y: number } }
  | { kind: "scheduled"; pos: { x: number; y: number } }
  | { kind: "completed"; pos: { x: number; y: number } }
  | null;

export const TimestampsPopover: React.FC<TimestampsPopoverProps> = ({
  isOpen,
  createdAt,
  scheduledAt,
  completedAt,
  showScheduled = true,
  showCompleted = true,
  onFieldChange,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState<InnerPicker>(null);

  // Esc handling: close inner picker first, then the modal itself.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (inner) setInner(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, inner, onClose]);

  if (!isOpen) return null;

  // Inner pickers still expect { x, y } for anchoring. When the parent is
  // a centered modal, we hand them a centered position so they appear over
  // the modal instead of floating at stale coordinates.
  const centerPos = () => ({
    x: Math.max(0, window.innerWidth / 2 - 140),
    y: Math.max(0, window.innerHeight / 2 - 200),
  });

  const Row: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    onClick: () => void;
    onClear?: () => void;
    accent?: boolean;
  }> = ({ icon, label, value, onClick, onClear, accent }) => (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-md hover:bg-hover transition-colors">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0"
      >
        <span className={accent ? "text-accent" : "text-muted"}>{icon}</span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted shrink-0">
          {label}
        </span>
        <span className="ml-auto text-xs font-mono tabular-nums text-primary truncate">
          {value}
        </span>
      </button>
      {onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          title="Clear"
          className="p-0.5 rounded text-muted hover:text-danger transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-overlay/60 backdrop-blur-xs transition-opacity"
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={ref}
          className="pointer-events-auto w-full max-w-sm rounded-2xl bg-raised border border-soft shadow-2xl p-3 text-primary animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-soft mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
              Edit Timestamps
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rows */}
          <Row
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Date"
            value={fmtDate(createdAt || scheduledAt || completedAt)}
            onClick={() => setInner({ kind: "date", pos: centerPos() })}
            accent
          />

          <Row
            icon={<Pencil className="w-3.5 h-3.5" />}
            label="Created"
            value={fmtTime(createdAt)}
            onClick={() => setInner({ kind: "created", pos: centerPos() })}
          />

          {showScheduled && (
            <Row
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Scheduled"
              value={fmtTime(scheduledAt)}
              onClick={() => setInner({ kind: "scheduled", pos: centerPos() })}
              onClear={
                scheduledAt
                  ? () => onFieldChange("scheduledAt", null)
                  : undefined
              }
            />
          )}

          {showCompleted && (
            <Row
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label="Completed"
              value={fmtTime(completedAt)}
              onClick={() => setInner({ kind: "completed", pos: centerPos() })}
              onClear={
                completedAt
                  ? () => onFieldChange("completedAt", null)
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Inner pickers (rendered as siblings above the backdrop) */}
      {inner?.kind === "date" && (
        <DatePickerPopover
          isOpen
          initialIso={
            createdAt || scheduledAt || completedAt || new Date().toISOString()
          }
          position={inner.pos}
          title="Change Date"
          onSave={(iso) => {
            onFieldChange("createdAt", iso);
            setInner(null);
          }}
          onClose={() => setInner(null)}
        />
      )}

      {inner?.kind === "created" && (
        <CustomTimePickerPopover
          isOpen
          initialIso={createdAt || new Date().toISOString()}
          position={inner.pos}
          title="Created Time"
          onSave={(iso) => {
            onFieldChange("createdAt", iso);
            setInner(null);
          }}
          onClose={() => setInner(null)}
        />
      )}

      {inner?.kind === "scheduled" && (
        <CustomTimePickerPopover
          isOpen
          initialIso={scheduledAt || new Date().toISOString()}
          position={inner.pos}
          title="Scheduled Time"
          onSave={(iso) => {
            onFieldChange("scheduledAt", iso);
            setInner(null);
          }}
          onClose={() => setInner(null)}
        />
      )}

      {inner?.kind === "completed" && (
        <CustomTimePickerPopover
          isOpen
          initialIso={completedAt || new Date().toISOString()}
          position={inner.pos}
          title="Completed Time"
          onSave={(iso) => {
            onFieldChange("completedAt", iso);
            setInner(null);
          }}
          onClose={() => setInner(null)}
        />
      )}
    </>,
    document.body,
  );
};
