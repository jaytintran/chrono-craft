/**
 * ChronoCraft - useLongPress Hook
 * Detects 500ms touch tap-and-hold on mobile devices with haptic feedback and movement cancellation.
 */

import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPressRef.current = false;
      const point = 'touches' in e ? e.touches[0] : e;
      startPosRef.current = { x: point.clientX, y: point.clientY };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch (err) {
            // ignore
          }
        }
        onLongPress(e);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPosRef.current || !timerRef.current) return;
    const point = 'touches' in e ? e.touches[0] : e;
    const dx = Math.abs(point.clientX - startPosRef.current.x);
    const dy = Math.abs(point.clientY - startPosRef.current.y);

    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLongPressRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    onMouseDown: (e: React.MouseEvent) => {
      // Allow right-click to pass through without initiating long press
      if (e.button === 0) start(e);
    },
    onMouseMove: move,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onClick: handleClick,
  };
}
