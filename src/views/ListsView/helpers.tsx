import { useState } from "react";
import { GroupBy, STATUS_PILL_MAP, TAG_PILL_FALLBACK } from "./constants";

// Pill styling per group key (status + tag groups)
export const getGroupPillClasses = (key: string, groupBy: GroupBy): string => {
  if (groupBy === "status" || key in STATUS_PILL_MAP) {
    return STATUS_PILL_MAP[key] ?? TAG_PILL_FALLBACK;
  }
  return TAG_PILL_FALLBACK;
};

// Extract "#tag" tokens from raw input. Returns { cleanTitle, tags }.
// Extract "#tag" tokens from raw input. Returns { cleanTitle, tags }.
export const parseTagsFromTitle = (raw: string) => {
  const tags: string[] = [];
  const clean = raw.replace(/#([a-zA-Z0-9_\-]+)/g, (_, t: string) => {
    const tag = t.toLowerCase();
    if (!tags.includes(tag)) tags.push(tag);
    return "";
  });
  return {
    cleanTitle: clean.replace(/\s+/g, " ").trim(),
    tags,
  };
};

// Returns the tag token currently under the caret, if the caret sits inside
// or immediately after a "#word" sequence. Used to drive autocomplete.
export const getActiveTagToken = (
  value: string,
  caret: number,
): { query: string; start: number; end: number } | null => {
  if (caret < 0 || caret > value.length) return null;
  const before = value.slice(0, caret);
  const m = before.match(/(?:^|\s)#([a-zA-Z0-9_\-]*)$/);
  if (!m) return null;
  const query = m[1].toLowerCase();
  const start = before.length - m[1].length - 1; // position of '#'
  // extend end to cover any trailing word chars after caret (so replacing
  // the whole token on accept feels natural)
  const after = value.slice(caret);
  const tail = after.match(/^[a-zA-Z0-9_\-]*/);
  const end = caret + (tail ? tail[0].length : 0);
  return { query, start, end };
};

// Replace the active "#tag" token with a fully-chosen tag and normalize
// the caret position. Returns { value, caret }.
export const replaceActiveTagToken = (
  value: string,
  token: { start: number; end: number },
  tag: string,
): { value: string; caret: number } => {
  const before = value.slice(0, token.start);
  const after = value.slice(token.end);
  const inserted = `#${tag} `;
  const next = `${before}${inserted}${after}`;
  return { value: next, caret: before.length + inserted.length };
};

export const formatCreatedDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const isSameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
};
