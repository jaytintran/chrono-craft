import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import { highlightCode } from "@/utils/highlight";

const isHtml = (s: string) =>
  /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|hr|div)\b/i.test(s);

export const RichContent: React.FC<{
  content?: string;
  className?: string;
}> = ({ content = "", className = "" }) => {
  const html = useMemo(() => {
    if (!isHtml(content)) return "";
    const clean = DOMPurify.sanitize(content, {
      ADD_ATTR: ["data-language"], // preserve the fence language marker
    });

    // Highlight every code block that carries a language marker.
    if (!clean.includes("<pre")) return clean;

    const doc = new DOMParser().parseFromString(clean, "text/html");
    doc.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;
      const lang = pre.getAttribute("data-language") ?? "plaintext";
      const raw = code.textContent ?? "";
      code.innerHTML = highlightCode(raw, lang);
      // Persist the language on the code element too, for styling hooks
      code.setAttribute("data-language", lang);
    });

    return doc.body.innerHTML;
  }, [content]);
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
