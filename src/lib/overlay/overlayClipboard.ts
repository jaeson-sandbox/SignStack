/**
 * Pure helpers for the in-memory overlay clipboard (Story 5.6).
 *
 * No I/O, no DOM, no system clipboard — these functions only transform plain
 * data, so all copy/paste placement math is unit-testable in isolation. The
 * hook in `hooks/useOverlayClipboard.ts` is the thin shell that wires the
 * keyboard listener and dispatches.
 */

import type { Overlay } from "@/types";
import { clampOverlayPosition } from "./overlayKeyboard";

/** Pixels a same-page paste is offset (down-right) so it doesn't perfectly stack. */
export const SAME_PAGE_PASTE_OFFSET_PX = 16;

/**
 * Snapshot of a copied overlay held in the app clipboard. A value copy — never
 * a reference to the live overlay — so a pasted overlay is fully independent.
 * Position is intentionally excluded; paste computes a fresh position.
 */
export interface OverlayClipboardPayload {
  dataUrl: string;
  width: number;
  height: number;
  /** Page the overlay was copied from — drives same-page offset behavior. */
  sourcePageIndex: number;
  /** Source position, used as the base for cross-page paste placement. */
  sourceX: number;
  sourceY: number;
}

/** Build a clipboard payload from an overlay (value snapshot). */
export function toClipboardPayload(overlay: Overlay): OverlayClipboardPayload {
  return {
    dataUrl: overlay.dataUrl,
    width: overlay.width,
    height: overlay.height,
    sourcePageIndex: overlay.pageIndex,
    sourceX: overlay.x,
    sourceY: overlay.y,
  };
}

/**
 * Compute the position for a pasted overlay on `destPageIndex`.
 *
 * - Same page as the source → offset down-right by SAME_PAGE_PASTE_OFFSET_PX so
 *   the copy is visible and not perfectly stacked.
 * - Different page → reuse the source position (so it lands where the user had
 *   it on the original page).
 *
 * The result is always clamped to the destination page bounds, so a copy made
 * near an edge still lands fully on-page.
 */
export function computePastePosition(
  payload: OverlayClipboardPayload,
  destPageIndex: number,
  pageDimPx: { width: number; height: number },
): { x: number; y: number } {
  const samePage = destPageIndex === payload.sourcePageIndex;
  const baseX = samePage
    ? payload.sourceX + SAME_PAGE_PASTE_OFFSET_PX
    : payload.sourceX;
  const baseY = samePage
    ? payload.sourceY + SAME_PAGE_PASTE_OFFSET_PX
    : payload.sourceY;
  return clampOverlayPosition(
    { x: baseX, y: baseY },
    { width: payload.width, height: payload.height },
    pageDimPx,
  );
}
