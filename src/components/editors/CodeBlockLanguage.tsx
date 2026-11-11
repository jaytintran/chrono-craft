import CodeBlock from "@tiptap/extension-code-block";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { lowlight, SUPPORTED_LANGUAGES } from "@/utils/highlight";

function getHighlightDecorations(
  doc: ProsemirrorNode,
  name: string,
): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== name) return;

    const language = (node.attrs.language as string | undefined) ?? "plaintext";
    const text = node.textContent;

    if (!language || language === "plaintext" || language === "text" || language === "plain") {
      return;
    }

    try {
      const tree = lowlight.highlight(language, text);
      let from = pos + 1;

      function parseNodes(nodes: any[], classes: string[] = []) {
        nodes.forEach((child) => {
          const nodeClasses = [
            ...classes,
            ...(child.properties?.className || []),
          ];
          if (child.children) {
            parseNodes(child.children, nodeClasses);
          } else if (child.value) {
            const to = from + child.value.length;
            if (nodeClasses.length > 0) {
              decorations.push(
                Decoration.inline(from, to, {
                  class: nodeClasses.join(" "),
                }),
              );
            }
            from = to;
          }
        });
      }

      parseNodes(tree.children);
    } catch {
      // If language parsing fails, leave as unhighlighted plain text
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const CodeBlockWithLanguage = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: (element) =>
          element.getAttribute("data-language") ??
          element.className.replace(/^language-/, "") ??
          "plaintext",
        renderHTML: (attributes) => ({
          "data-language": attributes.language,
          class: attributes.language
            ? `language-${attributes.language}`
            : undefined,
        }),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      new Plugin({
        key: new PluginKey("codeBlockLowlight"),
        state: {
          init: (_, { doc }) => getHighlightDecorations(doc, this.name),
          apply: (transaction, decorationSet, oldState, newState) => {
            const oldNodeName = oldState.selection.$head.parent.type.name;
            const newNodeName = newState.selection.$head.parent.type.name;
            const oldNodes = oldState.doc.descendants(
              (node) => node.type.name === this.name,
            );
            const newNodes = newState.doc.descendants(
              (node) => node.type.name === this.name,
            );

            if (
              transaction.docChanged ||
              oldNodeName === this.name ||
              newNodeName === this.name ||
              oldNodes !== newNodes
            ) {
              return getHighlightDecorations(newState.doc, this.name);
            }

            return decorationSet.map(transaction.mapping, transaction.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});

export { SUPPORTED_LANGUAGES };
