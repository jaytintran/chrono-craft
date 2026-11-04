import React, { useMemo } from "react";
import DOMPurify from "dompurify";

const isHtml = (s: string) =>
  /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|hr|div)\b/i.test(s);

export const RichContent: React.FC<{
  content?: string;
  className?: string;
}> = ({ content = "", className = "" }) => {
  const html = useMemo(
    () => (isHtml(content) ? DOMPurify.sanitize(content) : ""),
    [content],
  );
  if (!content.trim()) return null;

  // Legacy / NLP-bar plain text
  if (!html)
    return <div className={`whitespace-pre-line ${className}`}>{content}</div>;

  return (
    <div
      className={`tiptap rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
