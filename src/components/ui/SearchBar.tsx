/**
 * ChronoCraft - Timeline Search Bar
 * Controlled header input. Emits value changes and clear events.
 */

import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search all entries…",
  inputRef,
}) => {
  return (
    <div className="relative flex items-center">
      <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 pr-8 py-1.75 w-44 sm:w-64 max-sm:w-60 rounded-xl border border-soft bg-surface text-xs text-primary focus:outline-none focus:border-accent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Clear search"
          className="absolute right-1.5 p-1 rounded-md text-muted hover:text-primary hover:bg-hover transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
