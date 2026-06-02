"use client";

import { useEffect } from "react";
import type { AppAction, Overlay } from "@/types";
import {
  NUDGE_STEP_PX,
  NUDGE_STEP_SHIFT_PX,
  arrowKeyToDirection,
  computeNudgedPosition,
  isDeleteKey,
  isTypingTarget,
} from "@/lib/overlay/overlayKeyboard";

interface UseKeyboardOverlayArgs {
  /** The currently selected overlay, or null when none is selected. */
  selectedOverlay: Overlay | null;
  /** Rendered px dimensions of the selected overlay's page, or null if unknown. */
  pageDimPx: { width: number; height: number } | null;
  /** Whether the signature modal is open (handler is inert while open). */
  isModalOpen: boolean;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Document-level keyboard control for the selected overlay (AD-6 / NFR-A3).
 *
 * Imperative shell only: it attaches a `window` keydown listener and translates
 * keys into dispatches. All nudge / clamp / key-mapping decisions live in the
 * pure helpers in `lib/overlay/overlayKeyboard.ts`.
 *
 * The listener is attached only while an overlay is selected AND the modal is
 * closed; it also bails when focus is in a typing context so it never hijacks
 * text entry. Arrow keys nudge 1px (8px with Shift); Delete/Backspace removes
 * the overlay.
 */
export function useKeyboardOverlay({
  selectedOverlay,
  pageDimPx,
  isModalOpen,
  dispatch,
}: UseKeyboardOverlayArgs): void {
  useEffect(() => {
    if (!selectedOverlay || isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (isDeleteKey(event.key)) {
        event.preventDefault();
        dispatch({ type: "OVERLAY_DELETED", payload: { id: selectedOverlay.id } });
        return;
      }

      const direction = arrowKeyToDirection(event.key);
      if (!direction) return;

      // Without page dimensions we can't clamp safely — ignore the nudge.
      if (!pageDimPx) return;

      event.preventDefault();
      const step = event.shiftKey ? NUDGE_STEP_SHIFT_PX : NUDGE_STEP_PX;
      const next = computeNudgedPosition(
        selectedOverlay,
        direction,
        step,
        pageDimPx,
      );
      // Skip the dispatch when clamping pinned us in place (no real move).
      if (next.x === selectedOverlay.x && next.y === selectedOverlay.y) return;

      dispatch({
        type: "OVERLAY_MOVED",
        payload: { id: selectedOverlay.id, x: next.x, y: next.y },
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOverlay, pageDimPx, isModalOpen, dispatch]);
}
