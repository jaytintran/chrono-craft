/**
 * ChronoCraft - TagAutocompleteInput
 */

import React, { useEffect, useRef, useState } from "react";
import {
  getActiveTagToken,
  replaceActiveTagToken,
} from "../views/ListsView/helpers";

interface TagAutocompleteInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: () => void;
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

  const suggestions = React.useMemo(() => {
    if (!token) return [];
    const q = token.query;
    return availableTags
      .filter((t) => t !== q && t.toLowerCase().startsWith(q))
      .slice(0, 6);
  }, [token, availableTags]);

  useEffect(() => {
    setHighlight(0);
    setOpen(!!token && suggestions.length > 0);
  }, [token?.query, suggestions.length]);

  const accept = (tag: string) => {
    if (!token) return;
    const { value: next, caret } = replaceActiveTagToken(value, token, tag);
    onChange(next);
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
    void onSubmit;
  };

  const handleBlur = () => {
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
        <div className="absolute left-0 bottom-full mb-1.5 z-30 min-w-[180px] max-w-[260px] rounded-xl bg-raised border border-soft shadow-2xl p-1 animate-scaleUp">
          <div className="px-2 pt-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted">
            Tags
          </div>
          {suggestions.map((t, i) => (
            <button
              key={t}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                accept(t);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                i === highlight
                  ? "bg-accent/15 text-accent"
                  : "text-secondary hover:bg-hover"
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
