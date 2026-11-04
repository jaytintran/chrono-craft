/**
 * ChronoCraft - Master NLP Input Bar
 * Reusable input bar with real-time token preview, type switcher (Task, Log, Note, Event, Time Block),
 * and natural parsing for Time Blocks without requiring brackets.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Tag,
  AlertCircle,
  Plus,
  CheckCircle2,
  Bookmark,
  FileText,
  CalendarDays,
  Sparkles,
  Hourglass,
  HelpCircle,
} from 'lucide-react';
import { EntryPriority, EntryType, ParsedNLPResult, TimeBlockInfo } from '../types';
import { parseNaturalLanguageInput } from '../services/nlpParser';

interface NLPInputBarProps {
  placeholder?: string;
  defaultType?: EntryType;
  showTypeSwitcher?: boolean;
  buttonLabel?: string;
  autoFocus?: boolean;
  allowTimeBlock?: boolean;
  baseDate?: Date;
  onSubmit: (parsed: {
    title: string;
    type: EntryType;
    scheduledAt?: string;
    scheduledDisplay?: string;
    tags: string[];
    priority?: EntryPriority;
    timeBlock?: TimeBlockInfo;
  }) => void;
}

export const NLPInputBar: React.FC<NLPInputBarProps> = ({
  placeholder = 'Add a task, log, event, or time block... (e.g. "Deep Work from 1pm to 3pm")',
  defaultType = 'task',
  showTypeSwitcher = true,
  buttonLabel = 'Add',
  autoFocus = false,
  allowTimeBlock = true,
  baseDate = new Date(),
  onSubmit,
}) => {
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<EntryType>(defaultType);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedType(defaultType);
  }, [defaultType]);

  // Real-time NLP parsing
  const parsed: ParsedNLPResult = useMemo(() => {
    return parseNaturalLanguageInput(text, selectedType, baseDate);
  }, [text, selectedType, baseDate]);

  const isTimeBlockActive = selectedType === 'timeblock' || parsed.type === 'timeblock';
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
      priority: parsed.priority,
      timeBlock: parsed.timeBlock,
    });

    setText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const typeConfig: Record<
    EntryType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    task: {
      label: 'Task',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    log: {
      label: 'Log',
      icon: <Bookmark className="w-3.5 h-3.5" />,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    note: {
      label: 'Note',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    event: {
      label: 'Event',
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    timeblock: {
      label: 'Time Block',
      icon: <Hourglass className="w-3.5 h-3.5" />,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
  };

  const cycleType = () => {
    const types: EntryType[] = allowTimeBlock
      ? ['task', 'log', 'note', 'event', 'timeblock']
      : ['task', 'log', 'note', 'event'];
    const nextIdx = (types.indexOf(selectedType) + 1) % types.length;
    setSelectedType(types[nextIdx]);
  };

  return (
    <div className="w-full space-y-2">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center gap-2 p-1.5 md:p-2 rounded-xl transition-all duration-200 border ${
          isFocused
            ? 'bg-white dark:bg-[#131926] border-indigo-500/60 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5'
            : 'bg-white dark:bg-[#131926] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        {/* Type Switcher Button */}
        {showTypeSwitcher && (
          <button
            type="button"
            onClick={cycleType}
            title="Click to cycle entry type (Task · Log · Note · Event · Time Block)"
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

        {/* Input Text Field */}
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
          className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-w-0"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold tracking-wide transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{buttonLabel}</span>
        </button>
      </form>

      {/* Time Block Natural Syntax Helper Notice */}
      {isTimeBlockActive && !parsed.timeBlock && text.trim() && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs animate-fadeIn">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-violet-400" />
          <span>
            <strong>Time Block tip:</strong> Type natural ranges like{' '}
            <code className="font-mono px-1 py-0.5 rounded bg-violet-500/20">from 1pm to 3pm</code>,{' '}
            <code className="font-mono px-1 py-0.5 rounded bg-violet-500/20">from 1pm30 to 2pm</code>,{' '}
            <code className="font-mono px-1 py-0.5 rounded bg-violet-500/20">from 8:30am to 10:45am</code>, or{' '}
            <code className="font-mono px-1 py-0.5 rounded bg-violet-500/20">for 2h30m</code>.
          </span>
        </div>
      )}

      {/* Real-time NLP Match Tokens Preview */}
      {text.trim() && parsed.rawMatches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-slate-500 dark:text-slate-400 animate-fadeIn">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Detected:
          </span>

          {parsed.rawMatches.map((m, idx) => {
            let icon = <Tag className="w-3 h-3" />;
            let badgeClass =
              'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700';

            if (m.type === 'time') {
              icon = <Clock className="w-3 h-3 text-cyan-400" />;
              badgeClass = 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            } else if (m.type === 'date') {
              icon = <Calendar className="w-3 h-3 text-emerald-400" />;
              badgeClass =
                'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            } else if (m.type === 'priority') {
              icon = <AlertCircle className="w-3 h-3 text-rose-400" />;
              badgeClass = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
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
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
              · Scheduled for <strong className="text-slate-700 dark:text-slate-200">{parsed.scheduledDisplay}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
