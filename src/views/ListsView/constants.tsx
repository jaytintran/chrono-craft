import { FilterGroup } from "@/components/ui/MultiGroupFilterPopover";
import {
  AlignJustify,
  Bookmark,
  CheckCircle2,
  Inbox,
  Layers,
  LayoutGrid,
  LayoutList,
  MinusCircle,
  PlayCircle,
  Tag,
} from "lucide-react";

export type FilterStatusType =
  | "all"
  | "inbox"
  | "in-progress"
  | "completed"
  | "dropped"
  | "maybe-later";

export type GroupBy = "tag" | "status" | "none";
export type SubGroupBy = "none" | "tag" | "status";

export const CANONICAL_STATUS_ORDER = [
  "inbox",
  "in-progress",
  "completed",
  "dropped",
  "maybe-later",
] as const;

export const LISTS_FILTER_GROUPS: FilterGroup[] = [
  {
    key: "status",
    label: "Status",
    icon: <Inbox className="w-3.5 h-3.5 text-slate-400" />,
    options: [
      { value: "all", label: "All Statuses" },
      {
        value: "inbox",
        label: "Inbox",
        icon: <Inbox className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "in-progress",
        label: "In Progress",
        icon: <PlayCircle className="w-3.5 h-3.5 text-amber-400" />,
      },
      {
        value: "completed",
        label: "Completed",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      },
      {
        value: "dropped",
        label: "Dropped",
        icon: <MinusCircle className="w-3.5 h-3.5 text-rose-400" />,
      },
      {
        value: "maybe-later",
        label: "Maybe Later",
        icon: <Bookmark className="w-3.5 h-3.5 text-violet-400" />,
      },
    ],
  },
  {
    key: "view",
    label: "View",
    icon: <LayoutList className="w-3.5 h-3.5 text-slate-400" />,
    options: [
      {
        value: "stacked",
        label: "Stacked Cards",
        icon: <LayoutList className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "grid",
        label: "Grid",
        icon: <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "compact",
        label: "Compact Rows",
        icon: <AlignJustify className="w-3.5 h-3.5 text-slate-400" />,
      },
    ],
  },
  {
    key: "group",
    label: "Group by",
    icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
    options: [
      {
        value: "tag",
        label: "Tag",
        icon: <Tag className="w-3.5 h-3.5 text-amber-400" />,
      },
      {
        value: "status",
        label: "Status",
        icon: <Inbox className="w-3.5 h-3.5 text-slate-400" />,
      },
      {
        value: "none",
        label: "None",
        icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
      },
    ],
  },
  {
    key: "subgroup",
    label: "Then by",
    icon: <Layers className="w-3.5 h-3.5 text-slate-500" />,
    options: [
      { value: "none", label: "None" },
      { value: "tag", label: "Tag" },
      { value: "status", label: "Status" },
    ],
  },
];

export const STATUS_PILL_MAP: Record<string, string> = {
  inbox: "bg-hover text-secondary border-strong",
  "in-progress": "bg-warning/15 text-warning border-warning/30",
  completed: "bg-success/15 text-success border-success/30",
  dropped: "bg-danger/15 text-danger border-danger/30",
  "maybe-later": "bg-accent/15 text-accent border-accent/30",
  __none__: "bg-hover text-muted border-soft",
};

export const TAG_PILL_FALLBACK = "bg-accent/15 text-accent border-accent/30";
