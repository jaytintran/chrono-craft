/**
 * ChronoCraft - Master NLP Input Bar
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  Tag,
  Plus,
  CheckCircle2,
  Bookmark,
  FileText,
  CalendarDays,
  Sparkles,
  Hourglass,
  HelpCircle,
} from "lucide-react";
import { EntryType, ParsedNLPResult, TimeBlockInfo } from "../types";
import { parseNaturalLanguageInput } from "../services/nlpParser";

interface NLPInputBarProps {
  placeholder?: string;
  defaultType?: EntryType;
  showTypeSwitcher?: boolean;
  buttonLabel?: string;
  autoFocus?: boolean;
  compact?: boolean;
  allowTimeBlock?: boolean;
  baseDate?: Date;
  onSubmit: (parsed: {
    title: string;
    type: EntryType;
    scheduledAt?: string;
    scheduledDisplay?: string;
    tags: string[];
    timeBlock?: TimeBlockInfo;
  }) => void;
  typeSwitcherVariant?: "cycle" | "segmented";
}

export const NLPInputBar: React.FC<NLPInputBarProps> = ({
  placeholder = 'Add a task, log, event, or time block... (e.g. "Deep Work from 1pm to 3pm")',
  defaultType = "task",
  showTypeSwitcher = true,
  typeSwitcherVariant = "segmented",
  buttonLabel = "Add",
  autoFocus = false,
  compact = false,
  allowTimeBlock = true,
  baseDate = new Date(),
  onSubmit,
}) => {
  const [text, setText] = useState("");
  const [selectedType, setSelectedType] = useState<EntryType>(defaultType);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedType(defaultType);
  }, [defaultType]);

  const parsed: ParsedNLPResult = useMemo(() => {
    return parseNaturalLanguageInput(text, selectedType, baseDate);
  }, [text, selectedType, baseDate]);

  const availableTypes: EntryType[] = allowTimeBlock
    ? ["task", "log", "note", "event", "timeblock"]
    : ["task", "log", "note", "event"];

  const isTimeBlockActive =
    selectedType === "timeblock" || parsed.type === "timeblock";
  const isSubmitDisabled = !text.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    onSubmit({
      title: parsed.cleanTitle || text.trim(),
      type: parsed.type || selectedType,
      scheduledAt: parsed.scheduledAt,
      scheduledDisplay: parsed.scheduledDisplay,
      tags: parsed.tags,
      timeBlock: parsed.timeBlock,
    });

    setText("");
    if (inputRef.current) inputRef.current.focus();
  };

  const typeConfig: Record<
    EntryType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    task: {
      label: "Task",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: "text-accent bg-accent/10 border-accent/20",
    },
    log: {
      label: "Log",
      icon: <Bookmark className="w-3.5 h-3.5" />,
      color: "text-success bg-success/10 border-success/20",
    },
    note: {
      label: "Note",
      icon: <FileText className="w-3.5 h-3.5" />,
      color: "text-warning bg-warning/10 border-warning/20",
    },
    event: {
      label: "Event",
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      color: "text-info bg-info/10 border-info/20",
    },
    timeblock: {
      label: "Time Block",
      icon: <Hourglass className="w-3.5 h-3.5" />,
      color: "text-accent bg-accent/10 border-accent/20",
    },
  };

  const cycleType = () => {
    const types: EntryType[] = allowTimeBlock
      ? ["task", "log", "note", "event", "timeblock"]
      : ["task", "log", "note", "event"];
    const nextIdx = (types.indexOf(selectedType) + 1) % types.length;
    setSelectedType(types[nextIdx]);
  };

  return (
    <div className="w-full space-y-2">
      {showTypeSwitcher && typeSwitcherVariant === "segmented" && (
        <div
          role="tablist"
          aria-label="Entry type"
          className="flex w-fit max-sm:w-fit max-sm:justify-between max-sm:bg-app/95! max-sm:border-none items-center gap-1 p-1 rounded-xl bg-sunken border border-soft overflow-x-auto scrollbar-none"
        >
          {availableTypes.map((type) => {
            const cfg = typeConfig[type];
            const active = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={cfg.label}
                title={cfg.label}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 max-sm:px-6 max-sm:flex-1 max-sm:justify-center rounded-lg text-[11px] font-mono uppercase tracking-wide transition-colors shrink-0 cursor-pointer ${
                  active
                    ? `${cfg.color} border font-semibold`
                    : "text-secondary hover:text-primary hover:bg-hover border border-transparent"
                }`}
              >
                {cfg.icon}
                <span className="inline max-sm:hidden text-center">
                  {cfg.label !== "Time Block" ? cfg.label : "Block"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center gap-2 ${
          compact ? "p-1" : "p-1.5 md:p-2"
        } rounded-xl transition-all duration-200 border ${
          isFocused
            ? "bg-raised border-accent/60 ring-2 ring-accent/20 shadow-lg shadow-accent/5"
            : "bg-raised border-soft hover:border-strong"
        }`}
      >
        {showTypeSwitcher && typeSwitcherVariant === "cycle" && (
          <button
            type="button"
            onClick={cycleType}
            title="Click to cycle entry type"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
              typeConfig[selectedType].color
            }`}
          >
            {typeConfig[selectedType].icon}
            <span className="hidden sm:inline font-mono uppercase tracking-wide text-[11px]">
              {typeConfig[selectedType].label}
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            isTimeBlockActive
              ? 'e.g. "Deep Architecture Work from 1pm to 3pm" or "Planning from 1pm30 to 2pm"'
              : placeholder
          }
          autoFocus={autoFocus}
          className={`flex-1 bg-transparent px-2 ${
            compact ? "py-0.5" : "py-1"
          } text-sm text-primary placeholder-muted focus:outline-none min-w-0`}
        />

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-accent-fg text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className={compact ? "hidden" : "hidden sm:inline"}>
            {buttonLabel}
          </span>
        </button>
      </form>

      {!compact && isTimeBlockActive && !parsed.timeBlock && text.trim() && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-secondary text-xs animate-fadeIn">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-accent" />
          <span>
            <strong className="text-primary">Time Block tip:</strong> Type
            natural ranges like{" "}
            <code className="font-mono px-1 py-0.5 rounded bg-accent/20">
              from 1pm to 3pm
            </code>
            ,{" "}
            <code className="font-mono px-1 py-0.5 rounded bg-accent/20">
              from 1pm30 to 2pm
            </code>
            ,{" "}
            <code className="font-mono px-1 py-0.5 rounded bg-accent/20">
              from 8:30am to 10:45am
            </code>
            , or{" "}
            <code className="font-mono px-1 py-0.5 rounded bg-accent/20">
              for 2h30m
            </code>
            .
          </span>
        </div>
      )}

      {!compact && text.trim() && parsed.rawMatches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-secondary animate-fadeIn">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted">
            <Sparkles className="w-3 h-3 text-accent" />
            Detected:
          </span>

          {parsed.rawMatches.map((m, idx) => {
            let icon = <Tag className="w-3 h-3" />;
            let badgeClass = "text-secondary bg-sunken border-soft";

            if (m.type === "time") {
              icon = <Clock className="w-3 h-3 text-info" />;
              badgeClass = "text-info bg-info/10 border-info/20";
            } else if (m.type === "date") {
              icon = <Calendar className="w-3 h-3 text-success" />;
              badgeClass = "text-success bg-success/10 border-success/20";
            }

            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border ${badgeClass}`}
              >
                {icon}
                <span>{m.label}</span>
              </span>
            );
          })}

          {parsed.scheduledDisplay && (
            <span className="text-[11px] text-muted font-sans">
              · Scheduled for{" "}
              <strong className="text-primary">
                {parsed.scheduledDisplay}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
