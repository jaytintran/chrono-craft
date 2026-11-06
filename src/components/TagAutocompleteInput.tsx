/**
 * ChronoCraft - TagAutocompleteInput
 * Single-line text input that suggests existing tags when the user types
 * "#". Fully self-contained: parses its own token, emits a lightweight
 * onChange to the parent. All autocomplete logic lives here.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  getActiveTagToken,
  replaceActiveTagToken,
} from "../views/ListsView/helpers";

interface TagAutocompleteInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void; // fired on Enter when no suggestion is highlighted
  availableTags: string[];
  placeholder?: string;
  className?: string;
}

export const TagAutocompleteInput: React.FC<TagAutocompleteInputProps> = ({
  value,
  onChange,
  onSubmit,
  availableTags,
  placeholder,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState<{
    query: string;
    start: number;
    end: number;
  } | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);

  // Recompute the active token whenever value/caret changes
  const syncToken = () => {
    const el = inputRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? 0;
    setToken(getActiveTagToken(value, caret));
  };

  useEffect(() => {
    syncToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Filter suggestions by current token query
  const suggestions = React.useMemo(() => {
    if (!token) return [];
    const q = token.query;
    return availableTags
      .filter((t) => t !== q && t.toLowerCase().startsWith(q))
      .slice(0, 6);
  }, [token, availableTags]);

  // Reset highlight whenever the suggestion list changes
  useEffect(() => {
    setHighlight(0);
    setOpen(!!token && suggestions.length > 0);
  }, [token?.query, suggestions.length]);

  const accept = (tag: string) => {
    if (!token) return;
    const { value: next, caret } = replaceActiveTagToken(value, token, tag);
    onChange(next);
    // restore caret after React re-renders
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
      syncToken();
    });
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (
        e.key === "Tab" ||
        (e.key === "Enter" && (token?.query.length ?? 0) > 0)
      ) {
        e.preventDefault();
        accept(suggestions[highlight]);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    }
    // Let the parent's form handle Enter when no suggestion is active
    if (e.key === "Enter" && !open) {
      // The parent form's onSubmit handles this — do nothing here.
    }
  };

  const handleBlur = () => {
    // Small delay so a click on a suggestion still registers
    setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative flex-1 min-w-0 w-fit">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Defer token sync so the DOM caret updates first
          requestAnimationFrame(syncToken);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={syncToken}
        onClick={syncToken}
        onBlur={handleBlur}
        onFocus={syncToken}
        placeholder={placeholder}
        className={className}
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 bottom-full mb-1.5 z-30 min-w-[180px] max-w-[260px] rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-1 animate-scaleUp">
          <div className="px-2 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Tags
          </div>
          {suggestions.map((t, i) => (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // keep input focused
                accept(t);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                i === highlight
                  ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>#{t}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
