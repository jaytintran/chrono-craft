/**
 * ChronoCraft - useRowMenu Hook
 * Wraps useLongPress for row-level context menus.
 * Returns touch handlers only — desktop relies on right-click + 3-dot,
 * so mouse-hold is intentionally NOT wired (see useLongPress note).
 */

import { useLongPress } from "./useLongPress";

export function useRowMenu(
  item: unknown,
  onOpenContextMenu?: (item: any, pos: { x: number; y: number }) => void,
) {
  return useLongPress({
    threshold: 500,
    onLongPress: (e) => {
      if (!onOpenContextMenu) return;
      const point = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]) : e;
      onOpenContextMenu(item, {
        x: (point as any).clientX,
        y: (point as any).clientY,
      });
    },
  });
}
