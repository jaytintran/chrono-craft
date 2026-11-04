import { Extension, Editor, Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import React from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Minus,
} from "lucide-react";

export interface SlashItem {
  title: string;
  hint: string;
  keywords: string;
  icon: React.ElementType;
  run: (editor: Editor, range: Range) => void;
}

export interface SlashState {
  items: SlashItem[];
  command: (item: SlashItem) => void;
  rect: DOMRect | null;
}

const del = (e: Editor, r: Range) => e.chain().focus().deleteRange(r);

export const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    hint: "Big section title",
    keywords: "h1 title",
    icon: Heading1,
    run: (e, r) => del(e, r).toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    hint: "Medium section title",
    keywords: "h2",
    icon: Heading2,
    run: (e, r) => del(e, r).toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    hint: "Small section title",
    keywords: "h3",
    icon: Heading3,
    run: (e, r) => del(e, r).toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet list",
    hint: "Simple bulleted list",
    keywords: "ul unordered",
    icon: List,
    run: (e, r) => del(e, r).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    hint: "Ordered list",
    keywords: "ol ordered",
    icon: ListOrdered,
    run: (e, r) => del(e, r).toggleOrderedList().run(),
  },
  {
    title: "To-do list",
    hint: "Track tasks with checkboxes",
    keywords: "task todo checkbox",
    icon: ListChecks,
    run: (e, r) => del(e, r).toggleTaskList().run(),
  },
  {
    title: "Quote",
    hint: "Capture a quote",
    keywords: "blockquote",
    icon: Quote,
    run: (e, r) => del(e, r).toggleBlockquote().run(),
  },
  {
    title: "Code block",
    hint: "Monospaced snippet",
    keywords: "pre snippet",
    icon: Code,
    run: (e, r) => del(e, r).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    hint: "Visual separator",
    keywords: "hr line rule",
    icon: Minus,
    run: (e, r) => del(e, r).setHorizontalRule().run(),
  },
];

export const SlashCommand = Extension.create<{
  onState: (s: SlashState | null) => void;
  onKeyDown: (e: KeyboardEvent) => boolean;
}>({
  name: "slashCommand",

  addOptions() {
    return { onState: () => {}, onKeyDown: () => false };
  },

  addProseMirrorPlugins() {
    const { onState, onKeyDown } = this.options;
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        items: ({ query }) => {
          const q = query.toLowerCase();
          return SLASH_ITEMS.filter((i) =>
            (i.title + " " + i.keywords).toLowerCase().includes(q),
          );
        },
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => ({
          onStart: (p) =>
            onState({
              items: p.items,
              command: p.command,
              rect: p.clientRect?.() ?? null,
            }),
          onUpdate: (p) =>
            onState({
              items: p.items,
              command: p.command,
              rect: p.clientRect?.() ?? null,
            }),
          onKeyDown: ({ event }) => onKeyDown(event),
          onExit: () => onState(null),
        }),
      }),
    ];
  },
});
