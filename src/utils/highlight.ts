import { createLowlight, common } from "lowlight";

// Reuse one instance for the whole app — lowlight is cheap to instantiate
// once and expensive to instantiate per render.
export const lowlight = createLowlight(common);

// Languages we expose in the editor dropdown. Names match lowlight's
// registrations (`common` bundles ~37 languages).
export const SUPPORTED_LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "json",
  "html",
  "css",
  "bash",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "sql",
  "yaml",
  "markdown",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Highlight a code string, returning sanitised HTML ready for
 * dangerouslySetInnerHTML. `plaintext` bypasses tokenization entirely.
 * Unsupported languages fall back to `plaintext` — never throws.
 */
export function highlightCode(code: string, language?: string): string {
  const lang = (language ?? "plaintext").toLowerCase();

  if (lang === "plaintext" || lang === "text" || lang === "plain") {
    return escapeHtml(code);
  }

  try {
    const tree = lowlight.highlight(lang, code);
    return hastToHtml(tree);
  } catch {
    return escapeHtml(code);
  }
}

/**
 * Auto-detect code language using lowlight.
 * Returns null if detection is ambiguous or below confidence threshold.
 */
export function autoDetectLanguage(code: string): SupportedLanguage | null {
  const trimmed = code.trim();
  if (trimmed.length < 20) return null;

  try {
    const result = lowlight.highlightAuto(trimmed);
    const detected = result.data?.language;
    const relevance = result.data?.relevance ?? 0;

    // Minimum relevance threshold to avoid noisy false guesses
    if (detected && relevance >= 3) {
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(detected)) {
        return detected as SupportedLanguage;
      }
      // Common aliases to supported languages
      if (detected === "js") return "javascript";
      if (detected === "ts") return "typescript";
      if (detected === "sh" || detected === "zsh") return "bash";
      if (detected === "py") return "python";
      if (detected === "xml") return "html";
    }
  } catch {
    // Fail silently on any detection error
  }

  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type HastNode =
  | { type: "text"; value: string }
  | {
      type: "element";
      tagName: string;
      properties?: Record<string, unknown>;
      children?: HastNode[];
    };

/**
 * Minimal hast → HTML serializer. Only emits `span` + `class`, so the
 * output is inherently safe for our purposes and DOMPurify in RichContent
 * will still pass it through.
 */
function hastToHtml(node: HastNode | HastNode[]): string {
  if (Array.isArray(node)) return node.map(hastToHtml).join("");

  if (node.type === "text") return escapeHtml(node.value);

  const { tagName, children = [], properties = {} } = node;
  const className = properties.className;
  const classes = Array.isArray(className)
    ? className.join(" ")
    : typeof className === "string"
    ? className
    : "";

  const attrs = classes ? ` class="${escapeHtml(classes)}"` : "";
  const inner = children.map(hastToHtml).join("");
  return `<${tagName}${attrs}>${inner}</${tagName}>`;
}
