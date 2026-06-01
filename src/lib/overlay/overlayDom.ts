/**
 * Shared DOM contract for signature overlays.
 *
 * `OVERLAY_RND_CLASS` is stamped on each overlay's react-rnd root so click
 * handling elsewhere (e.g. the editor's click-to-deselect) can tell an
 * overlay-originated event from a click on bare editor space — without the
 * overlay needing to stopPropagation (which would break react-draggable).
 */

/** Class on the react-rnd root of every signature overlay. */
export const OVERLAY_RND_CLASS = "signature-overlay-rnd";

/**
 * True when an event originated inside any signature overlay (its body,
 * react-rnd's resize handles, or the delete button). Pure: only reads the
 * target's ancestor chain. Returns false for null / non-element targets.
 */
export function isOverlayEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(`.${OVERLAY_RND_CLASS}`) !== null;
}
