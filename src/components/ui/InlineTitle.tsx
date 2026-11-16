import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

interface InlineTitleProps {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  /**
   * Opt-in to inline editing on mobile. Defaults to false so existing
   * usages (Timeline / Lists / etc.) keep the current behavior where a
   * mobile tap opens the DetailSheet instead.
   */
  allowMobileEdit?: boolean;
}

export const InlineTitle: React.FC<InlineTitleProps> = ({
  value,
  onSave,
  className = "",
  allowMobileEdit = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      // Place caret at the end instead of selecting everything.
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [editing]);

  // Auto-grow: reset height, then set to scrollHeight so the textarea
  // expands to fit the current draft on every keystroke.
  useLayoutEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing]);

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
    // When inline editing is allowed on mobile, we want the same tap-to-edit
    // behavior as desktop — so the branch only applies when the caller has
    // NOT opted in.
    if (isMobile && !allowMobileEdit) {
      // No stopPropagation: the tap bubbles up to the card and opens the Detail Sheet.
      // Wrap instead of truncate so long titles stay fully readable.
      // We strip the caller's truncate class and add wrap-friendly ones.
      return (
        <span className="min-w-0 !whitespace-normal !overflow-visible break-words text-sm">
          {value}
        </span>
      );
    }
    // Desktop / mobile-with-opt-in
    return (
      <span
        role="button"
        tabIndex={0}
        title="Click to edit title"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            setEditing(true);
          }
        }}
        className={`min-w-0 cursor-pointer border-none focus:outline-none! text-sm ${className}`}
      >
        {value}
      </span>
    );
  }

  return (
    <textarea
      ref={inputRef}
      rows={1}
      value={draft}
      enterKeyHint="done"
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          inputRef.current?.blur();
        } else if (e.key === "Enter" && e.shiftKey) {
          // Prevent inserting a literal newline; titles are single-line by design.
          e.preventDefault();
        }
        if (e.key === "Escape") {
          cancelled.current = true;
          inputRef.current?.blur();
        }
      }}
      className={`w-full outline-none px-1 -mx-1 resize-none leading-inherit ${className}`}
      style={{
        alignSelf: "flex-start",
        flexBasis: 0,
        flexGrow: 1,
        minWidth: 0,
      }}
    />
  );
};
