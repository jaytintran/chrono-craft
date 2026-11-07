import React, { useEffect, useRef } from "react";

interface TitleInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  autoFocus?: boolean;
}

/**
 * A single-line-looking <textarea> that grows vertically when text wraps.
 * Behaves like <input type="text"> but supports wrapping and multi-line titles.
 */
export const TitleInput: React.FC<TitleInputProps> = ({
  value,
  onChange,
  placeholder,
  onKeyDown,
  className = "",
  autoFocus,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow: reset height, then set to scrollHeight
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      spellCheck={false}
      className={`w-full bg-transparent resize-none overflow-hidden outline-none ${className}`}
    />
  );
};
