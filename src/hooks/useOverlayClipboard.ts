"use client";

import { useEffect, useRef } from "react";
import type { AppAction, Overlay } from "@/types";
import { createOverlay } from "@/store/appReducer";
import { isCopyCommand, isPasteCommand, isTypingTarget } from "@/lib/overlay/overlayKeyboard";
import {
  computePastePosition,
  toClipboardPayload,
  type OverlayClipboardPayload,
} from "@/lib/overlay/overlayClipboard";

interface UseOverlayClipboardArgs {
  /** The currently selected overlay (the copy source), or null. */
  selectedOverlay: Overlay | null;
  /** Most-visible page index — the paste destination when known. */
  currentVisiblePageIndex: number | null;
  /** Rendered px dimensions per 0-based page index (for destination clamp). */
  pageDimensionsPx: Map<number, { width: number; height: number }>;
  /** Whether the signature modal is open (handler is inert while open). */
  isModalOpen: boolean;
  dispatch: React.Dispatch<AppAction>;
}

/**
 * Document-level copy/paste for signature overlays (Story 5.6).
 *
 * Imperative shell only: it attaches a `window` keydown listener and translates
 * Ctrl/Cmd+C and Ctrl/Cmd+V into an internal in-memory clipboard + dispatches.
 * All command-detection and paste-placement decisions live in the pure helpers
 * (`lib/overlay/overlayKeyboard.ts`, `lib/overlay/overlayClipboard.ts`).
 *
 * The clipboard is a `useRef` snapshot — session-only, never the OS clipboard,
 * never persisted (honors the local-first / in-memory contract). The listener
 * is inert while the modal is open and bails when focus is in a typing context,
 * so it never hijacks native text copy/paste.
 */
export function useOverlayClipboard({
  selectedOverlay,
  currentVisiblePageIndex,
  pageDimensionsPx,
  isModalOpen,
  dispatch,
}: UseOverlayClipboardArgs): void {
  // In-memory overlay clipboard. A ref (not state) because it's ephemeral and
  // must not trigger re-renders; it survives re-subscribes of the effect below.
  const clipboardRef = useRef<OverlayClipboardPayload | null>(null);

  useEffect(() => {
    if (isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      // Copy: snapshot the selected overlay into the in-memory clipboard.
      if (isCopyCommand(event)) {
        if (!selectedOverlay) return;
        event.preventDefault();
        clipboardRef.current = toClipboardPayload(selectedOverlay);
        return;
      }

      // Paste: place an independent copy on the current visible page.
      if (isPasteCommand(event)) {
        const payload = clipboardRef.current;
        if (!payload) return;

        // Destination = current visible page, falling back to the source page
        // so copy+paste works even before the user scrolls.
        const destPageIndex = currentVisiblePageIndex ?? payload.sourcePageIndex;
        const pageDimPx = pageDimensionsPx.get(destPageIndex);
        // Without destination dimensions we can't clamp safely — ignore.
        if (!pageDimPx) return;

        event.preventDefault();
        const { x, y } = computePastePosition(payload, destPageIndex, pageDimPx);
        // New UUID via createOverlay → fully independent of the original.
        const overlay = createOverlay({
          pageIndex: destPageIndex,
          dataUrl: payload.dataUrl,
          width: payload.width,
          height: payload.height,
          x,
          y,
        });
        dispatch({ type: "OVERLAY_ADDED", payload: overlay });
        dispatch({ type: "OVERLAY_SELECTED", payload: { id: overlay.id } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedOverlay,
    currentVisiblePageIndex,
    pageDimensionsPx,
    isModalOpen,
    dispatch,
  ]);
}
