/**
 * Pure helpers for computing the default placement rect of a new signature
 * overlay (architecture AD-10 and AD-11).
 *
 * No I/O. No DOM. All inputs and outputs are plain numbers/objects so the
 * logic is trivially unit-testable without a browser.
 */

export const DEFAULT_OVERLAY_WIDTH_PX = 200;
export const MIN_OVERLAY_HEIGHT_PX = 40;

/** Fraction from each edge used to compute the bottom-right inset origin. */
const INSET_FRACTION = 0.05;

export interface OverlayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compute the default bottom-right inset position for a new overlay.
 *
 * - Width is always DEFAULT_OVERLAY_WIDTH_PX (200 px).
 * - Height = round(width × signatureAspectRatio), clamped to MIN_OVERLAY_HEIGHT_PX.
 * - x = round(page.width × (1 − INSET_FRACTION) − width)  ← 5% from right
 * - y = round(page.height × (1 − INSET_FRACTION) − height) ← 5% from bottom
 *
 * @param pageDimPx  Rendered page dimensions in screen pixels.
 * @param signatureAspectRatio  naturalHeight / naturalWidth of the signature PNG.
 *                              Use a positive value; 0 or negative falls back to 0.4.
 */
export function computeDefaultOverlayRect(
  pageDimPx: { width: number; height: number },
  signatureAspectRatio: number,
): OverlayRect {
  const safeRatio = signatureAspectRatio > 0 ? signatureAspectRatio : 0.4;
  const width = DEFAULT_OVERLAY_WIDTH_PX;
  const height = Math.max(MIN_OVERLAY_HEIGHT_PX, Math.round(width * safeRatio));
  const x = Math.round(pageDimPx.width * (1 - INSET_FRACTION) - width);
  const y = Math.round(pageDimPx.height * (1 - INSET_FRACTION) - height);
  return { x, y, width, height };
}
