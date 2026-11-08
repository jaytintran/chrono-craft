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

  // Mobile: tap goes to the Detail Sheet instead of inline editing
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
    if (isMobile) {
      // No stopPropagation: the tap bubbles up to the card and opens the Detail Sheet
      return <span className={`min-w-0 ${className}`}>{value}</span>;
    }
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
        className={`min-w-0 cursor-text rounded px-1 -mx-1 hover:bg-hover transition-colors ${className}`}
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
      className={`min-w-[10rem] flex-1 bg-transparent outline-none border-b border-accent/60 px-1 -mx-1 ${className}`}
    />
  );
};
