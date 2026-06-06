/**
 * Pure decision for Story 6.2 — when the user presses "Use Signature", which
 * signature gets placed as an overlay?
 *
 * - If they drew/typed something new this time, that new signature wins (and the
 *   caller replaces the session signature with it).
 * - Otherwise, if a session signature already exists, reuse it ("Add Another"
 *   across pages — no redraw/retype).
 * - If there is neither, there is nothing to place.
 *
 * No I/O, no DOM — the whole reuse-vs-create rule is unit-testable in isolation,
 * keeping the modal (the imperative shell) free of branching business logic.
 */

export interface SignaturePlacementDecision {
  /** The PNG data URL to place as the new overlay. */
  dataUrl: string;
  /** True when this is a freshly created signature (caller dispatches
   *  SIGNATURE_CREATED); false when reusing the existing session signature. */
  isNewSignature: boolean;
}

/**
 * @param newDataUrl       Freshly captured signature this confirm, or null when
 *                         the user made no new drawing/typing.
 * @param existingDataUrl  The current session signature's data URL, or null.
 * @returns the signature to place, or null when there is nothing to place.
 */
export function resolveSignaturePlacement(
  newDataUrl: string | null,
  existingDataUrl: string | null,
): SignaturePlacementDecision | null {
  if (newDataUrl) return { dataUrl: newDataUrl, isNewSignature: true };
  if (existingDataUrl) return { dataUrl: existingDataUrl, isNewSignature: false };
  return null;
}
