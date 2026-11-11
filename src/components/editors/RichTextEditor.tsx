import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import {
  CodeBlockWithLanguage,
  SUPPORTED_LANGUAGES,
} from "./CodeBlockLanguage";
import { autoDetectLanguage } from "@/utils/highlight";

import { Markdown } from "@tiptap/markdown";
import { SlashCommand, SlashState } from "./SlashCommand";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  ListChecks,
} from "lucide-react";

export const stripHtml = (html = "") => {
  if (!html.includes("<")) return html;
  const doc = new DOMParser().parseFromString(
    html.replace(/<\/(p|h[1-6]|li|blockquote)>/gi, "$& "),
    "text/html",
  );
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};

const toHtml = (v: string) =>
  !v || v.trim().startsWith("<")
    ? v
    : v
        .split("\n")
        .map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`)
        .join("");

const looksLikeMarkdown = (t: string) =>
  /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|- \[[ xX]\]\s)/m.test(t) ||
  /\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\)/.test(t);

const Btn = ({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`p-1.5 rounded-md transition-colors disabled:opacity-30 ${
      active
        ? "bg-accent/15 text-accent"
        : "text-muted hover:text-primary hover:bg-hover"
    }`}
  >
    {children}
  </button>
);

const CodeLanguagePicker: React.FC<{ editor: Editor }> = ({ editor }) => {
  // Re-render on every transaction (isActive changes) — the parent
  // already sets shouldRerenderOnTransaction: true.
  const isCodeBlock = editor.isActive("codeBlock");
  if (!isCodeBlock) return null;

  const current =
    (editor.getAttributes("codeBlock").language as string | undefined) ??
    "plaintext";

  return (
    <select
      value={current}
      onChange={(e) =>
        editor
          .chain()
          .focus()
          .updateAttributes("codeBlock", { language: e.target.value })
          .run()
      }
      className="px-2 py-0.5 rounded-md bg-raised border border-soft text-[11px] font-mono text-primary focus:outline-none focus:border-accent cursor-pointer"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  );
};

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  variant?: "boxed" | "seamless";
}

export const RichTextEditor: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = 280,
  variant = "boxed",
}) => {
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [sel, setSel] = useState(0);
  const slashRef = useRef<SlashState | null>(null);
  slashRef.current = slash;
  const editorRef = useRef<Editor | null>(null);

  const keyRef = useRef<(e: KeyboardEvent) => boolean>(() => false);
  keyRef.current = (e) => {
    const s = slashRef.current;
    if (!s || s.items.length === 0) return false;
    if (e.key === "ArrowDown") {
      setSel((i) => (i + 1) % s.items.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      setSel((i) => (i - 1 + s.items.length) % s.items.length);
      return true;
    }
    if (e.key === "Enter") {
      s.command(s.items[sel]);
      return true;
    }
    if (e.key === "Escape") {
      setSlash(null);
      return true;
    }
    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockWithLanguage,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
      SlashCommand.configure({
        onState: (s) => {
          setSlash(s);
          setSel(0);
        },
        onKeyDown: (e) => keyRef.current(e),
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toHtml(value),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        style: `min-height:${
          typeof minHeight === "number" ? `${minHeight}px` : minHeight
        }`,
      },
      handlePaste: (_view, event) => {
        const ed = editorRef.current;
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const html = event.clipboardData?.getData("text/html") ?? "";

        // If pasting inside an active codeBlock, check if we should auto-detect language once
        if (ed && ed.isActive("codeBlock")) {
          const currentLang = ed.getAttributes("codeBlock").language;
          // Only auto-detect if language is currently unset or plaintext
          if (!currentLang || currentLang === "plaintext") {
            const detected = autoDetectLanguage(text);
            if (detected) {
              ed.chain().updateAttributes("codeBlock", { language: detected }).run();
            }
          }
          return false; // let TipTap insert the text content normally
        }

        if (!ed || html || !looksLikeMarkdown(text))
          return false;
        ed.commands.insertContent(text, { contentType: "markdown" });
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    const next = toHtml(value);
    if (next !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;
  const c = () => editor.chain().focus();

  const seamless = variant === "seamless";

  return (
    <div
      className={
        seamless
          ? ""
          : "rounded-xl bg-sunken border border-soft focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-colors"
      }
    >
      <div
        className={`sticky top-0 z-10 flex items-center gap-0.5 ${
          seamless
            ? "py-1.5 bg-raised border-b border-soft/70"
            : "px-2 py-1.5 border-b border-soft bg-sunken rounded-t-xl"
        }`}
      >
        <Btn
          title="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => c().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="w-4 h-4" />
        </Btn>
        <Btn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => c().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Btn>
        <Btn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => c().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Btn>
        <Btn
          title="Strike"
          active={editor.isActive("strike")}
          onClick={() => c().toggleStrike().run()}
        >
          <Strikethrough className="w-4 h-4" />
        </Btn>
        <Btn
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => c().toggleCode().run()}
        >
          <Code className="w-4 h-4" />
        </Btn>
        <span className="w-px h-4 mx-1 bg-strong" />
        <Btn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => c().toggleBulletList().run()}
        >
          <List className="w-4 h-4" />
        </Btn>
        <Btn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => c().toggleOrderedList().run()}
        >
          <ListOrdered className="w-4 h-4" />
        </Btn>
        <Btn
          title="Task list"
          active={editor.isActive("taskList")}
          onClick={() => c().toggleTaskList().run()}
        >
          <ListChecks className="w-4 h-4" />
        </Btn>
        <Btn
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => c().toggleBlockquote().run()}
        >
          <Quote className="w-4 h-4" />
        </Btn>

        {/* NEW: language selector, only visible inside code blocks */}
        <CodeLanguagePicker editor={editor} />

        <span className="ml-auto flex items-center gap-0.5">
          <Btn
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => c().undo().run()}
          >
            <Undo2 className="w-4 h-4" />
          </Btn>
          <Btn
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => c().redo().run()}
          >
            <Redo2 className="w-4 h-4" />
          </Btn>
        </span>
      </div>
      <div
        className={
          seamless
            ? "pt-4 text-[15px] text-primary"
            : "px-3.5 py-3 text-sm text-primary"
        }
      >
        <EditorContent editor={editor} />
      </div>
      {slash &&
        slash.items.length > 0 &&
        slash.rect &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: Math.min(slash.rect.left, window.innerWidth - 270),
              ...(slash.rect.bottom + 300 > window.innerHeight
                ? { top: slash.rect.top - 6, transform: "translateY(-100%)" }
                : { top: slash.rect.bottom + 6 }),
            }}
            className="z-[60] w-64 max-h-72 overflow-y-auto p-1 rounded-xl bg-raised border border-soft shadow-2xl"
          >
            {slash.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => slash.command(item)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                    i === sel ? "bg-accent/15 text-accent" : "text-secondary"
                  }`}
                >
                  <span className="p-1.5 rounded-md bg-sunken border border-soft">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-muted truncate">
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};
