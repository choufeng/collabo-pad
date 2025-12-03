import { useCallback, useRef, useEffect } from "react";

export interface UseLongPressOptions {
  onLongPress: (event: { clientX: number; clientY: number }) => void;
  delay?: number;
  hapticFeedback?: boolean;
  moveThreshold?: number;
}

export interface LongPressHandlers {
  onTouchStart: (event: TouchEvent) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchEnd: () => void;
  cancel: () => void;
}

export function useLongPress({
  onLongPress,
  delay = 500,
  hapticFeedback = true,
  moveThreshold = 10,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isActiveRef = useRef(false);

  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isActiveRef.current = false;
    startPositionRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      // Only support single touch
      if (event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      startPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
      isActiveRef.current = true;

      timerRef.current = setTimeout(() => {
        if (isActiveRef.current && startPositionRef.current) {
          triggerHapticFeedback();
          console.log("[useLongPress] Long press triggered");
          onLongPress({
            clientX: startPositionRef.current.x,
            clientY: startPositionRef.current.y,
          });
        }
        cancel();
      }, delay);
    },
    [onLongPress, delay, triggerHapticFeedback, cancel],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      if (
        !isActiveRef.current ||
        !startPositionRef.current ||
        event.touches.length !== 1
      ) {
        cancel();
        return;
      }

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - startPositionRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPositionRef.current.y);

      // If movement exceeds threshold, cancel long press
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancel();
      }
    },
    [cancel, moveThreshold],
  );

  const onTouchEnd = useCallback(() => {
    cancel();
  }, [cancel]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    cancel,
  };
}
