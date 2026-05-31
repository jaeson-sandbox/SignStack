/**
 * Pure selectors over the overlay list.
 *
 * No I/O, no DOM — trivially unit-testable. Keeping the per-page filter here
 * (rather than inline in the render loop) makes the "which overlays belong to
 * this page" decision testable and reusable by later overlay stories.
 */

import type { Overlay } from "@/types";

/**
 * Overlays belonging to a given 0-based page index, in their original order.
 * Returns a new array — never mutates the input.
 */
export function overlaysForPage(
  overlays: readonly Overlay[],
  pageIndex: number,
): Overlay[] {
  return overlays.filter((overlay) => overlay.pageIndex === pageIndex);
}
