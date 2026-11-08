/**
 * ChronoCraft - Theme Picker
 * Groups themes into Dark and Light flavor sections. Each card sets both
 * the palette identity (`theme`) and the flavor (`themeFlavor`).
 */

import React from "react";
import {
  Moon,
  Sun,
  Leaf,
  Coffee,
  Snowflake,
  CloudMoon,
  Zap,
  Feather,
} from "lucide-react";
import { ThemeFlavor, ThemeId } from "../../types";

interface ThemeCardSpec {
  /** Palette identity */
  id: ThemeId;
  /** Which flavor this card renders */
  flavor: ThemeFlavor;
  label: string;
  hint: string;
  Icon: React.ElementType;
  /** Preview colors shown in the mini swatch */
  preview: { bg: string; fg: string; accent: string };
}

const DARK_CARDS: ThemeCardSpec[] = [
  {
    id: "dark",
    flavor: "dark",
    label: "Dark",
    hint: "Obsidian Slate",
    Icon: Moon,
    preview: { bg: "#0B0F17", fg: "#F1F5F9", accent: "#4F46E5" },
  },
  {
    id: "forest",
    flavor: "dark",
    label: "Forest",
    hint: "Deep Green",
    Icon: Leaf,
    preview: { bg: "#0A140E", fg: "#F0FDF4", accent: "#10B981" },
  },
  {
    id: "sepia",
    flavor: "dark",
    label: "Sepia",
    hint: "Warm Amber",
    Icon: Coffee,
    preview: { bg: "#1C1917", fg: "#FAFAF9", accent: "#D97706" },
  },
  {
    id: "nord",
    flavor: "dark",
    label: "Nord",
    hint: "Arctic Muted",
    Icon: Snowflake,
    preview: { bg: "#2E3440", fg: "#ECEFF4", accent: "#88C0D0" },
  },
  {
    id: "tokyo",
    flavor: "dark",
    label: "Tokyo",
    hint: "Neon Navy",
    Icon: CloudMoon,
    preview: { bg: "#1A1B26", fg: "#C0CAF5", accent: "#7AA2F7" },
  },
  {
    id: "cyberpunk",
    flavor: "dark",
    label: "Cyberpunk",
    hint: "Electric",
    Icon: Zap,
    preview: { bg: "#0D0221", fg: "#F8F8F2", accent: "#FCE803" },
  },
  {
    id: "paper",
    flavor: "dark",
    label: "Paper",
    hint: "Ink & Rust",
    Icon: Feather,
    preview: { bg: "#1F1F1F", fg: "#EDEDE9", accent: "#E07A5F" },
  },
];

const LIGHT_CARDS: ThemeCardSpec[] = [
  {
    id: "light",
    flavor: "light",
    label: "Light",
    hint: "Clean Slate",
    Icon: Sun,
    preview: { bg: "#F8FAFC", fg: "#0F172A", accent: "#4F46E5" },
  },
  {
    id: "forest",
    flavor: "light",
    label: "Forest",
    hint: "Soft Sage",
    Icon: Leaf,
    preview: { bg: "#F0FDF4", fg: "#142B19", accent: "#059669" },
  },
  {
    id: "sepia",
    flavor: "light",
    label: "Sepia",
    hint: "Warm Cream",
    Icon: Coffee,
    preview: { bg: "#FEFCE8", fg: "#292524", accent: "#B45309" },
  },
  {
    id: "nord",
    flavor: "light",
    label: "Nord",
    hint: "Pale Frost",
    Icon: Snowflake,
    preview: { bg: "#ECEFF4", fg: "#2E3440", accent: "#5E81AC" },
  },
  {
    id: "tokyo",
    flavor: "light",
    label: "Tokyo",
    hint: "Day Sky",
    Icon: CloudMoon,
    preview: { bg: "#E6E7ED", fg: "#1A1B26", accent: "#3B82F6" },
  },
  {
    id: "cyberpunk",
    flavor: "light",
    label: "Cyberpunk",
    hint: "Pale Neon",
    Icon: Zap,
    preview: { bg: "#F5E6FF", fg: "#1A0B33", accent: "#B8860B" },
  },
  {
    id: "paper",
    flavor: "light",
    label: "Paper",
    hint: "Writing Cream",
    Icon: Feather,
    preview: { bg: "#FAFAF7", fg: "#1F1F1F", accent: "#C8553D" },
  },
];

interface ThemePickerProps {
  theme: ThemeId;
  flavor: ThemeFlavor;
  onChange: (theme: ThemeId, flavor: ThemeFlavor) => void;
}

const ThemeCard: React.FC<{
  spec: ThemeCardSpec;
  active: boolean;
  onClick: () => void;
}> = ({ spec, active, onClick }) => {
  const { label, hint, Icon, preview } = spec;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={hint}
      className={`group relative flex flex-col items-stretch gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer overflow-hidden ${
        active
          ? "border-accent ring-2 ring-accent/30 bg-accent/5"
          : "border-soft bg-raised hover:border-strong"
      }`}
    >
      <div
        className="relative h-14 rounded-lg overflow-hidden flex flex-col justify-end p-2"
        style={{ backgroundColor: preview.bg }}
      >
        <div
          className="absolute top-2 left-2 h-1.5 w-8 rounded-full opacity-90"
          style={{ backgroundColor: preview.accent }}
        />
        <div
          className="h-1 w-10 rounded-full opacity-70 mb-1"
          style={{ backgroundColor: preview.fg }}
        />
        <div
          className="h-1 w-6 rounded-full opacity-40"
          style={{ backgroundColor: preview.fg }}
        />
      </div>

      <div className="flex items-center gap-1.5 px-1 pb-0.5">
        <Icon
          className={`w-3.5 h-3.5 shrink-0 ${
            active ? "text-accent" : "text-muted"
          }`}
        />
        <div className="min-w-0 flex-1 text-left">
          <div
            className={`truncate ${active ? "text-accent" : "text-primary"}`}
          >
            {label}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted truncate">
            {hint}
          </div>
        </div>
      </div>
    </button>
  );
};

export const ThemePicker: React.FC<ThemePickerProps> = ({
  theme,
  flavor,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Dark section */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
          <Moon className="w-3 h-3" />
          <span>Dark</span>
          <span className="flex-1 h-px bg-soft" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {DARK_CARDS.map((spec) => (
            <ThemeCard
              key={`${spec.id}-${spec.flavor}`}
              spec={spec}
              active={theme === spec.id && flavor === spec.flavor}
              onClick={() => onChange(spec.id, spec.flavor)}
            />
          ))}
        </div>
      </section>

      {/* Light section */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
          <Sun className="w-3 h-3" />
          <span>Light</span>
          <span className="flex-1 h-px bg-soft" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {LIGHT_CARDS.map((spec) => (
            <ThemeCard
              key={`${spec.id}-${spec.flavor}`}
              spec={spec}
              active={theme === spec.id && flavor === spec.flavor}
              onClick={() => onChange(spec.id, spec.flavor)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
