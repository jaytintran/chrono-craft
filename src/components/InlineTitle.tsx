import React, { useEffect, useRef, useState } from "react";

interface InlineTitleProps {
  value: string;
  onSave: (next: string) => void;
  className?: string;
}

export const InlineTitle: React.FC<InlineTitleProps> = ({
  value,
  onSave,
  className = "",
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (cancelled.current) {
      cancelled.current = false;
      setDraft(value);
      return;
    }
    const next = draft.trim();
    if (next && next !== value) onSave(next);
    else setDraft(value);
  };

  if (!editing) {
    return (
      <span
        role="button"
        tabIndex={0}
        title="Click to edit title"
        onClick={(e) => {
          e.stopPropagation(); // don't trigger the card's Detail Sheet
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            setEditing(true);
          }
        }}
        className={`min-w-0 cursor-text rounded px-1 -mx-1 hover:bg-slate-200/60 dark:hover:bg-slate-700/40 transition-colors ${className}`}
      >
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      enterKeyHint="done"
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={commit} // save on leave
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") inputRef.current?.blur();
        if (e.key === "Escape") {
          cancelled.current = true;
          inputRef.current?.blur();
        }
      }}
      className={`min-w-[10rem] flex-1 bg-transparent outline-none border-b border-indigo-500/60 px-1 -mx-1 ${className}`}
    />
  );
};
