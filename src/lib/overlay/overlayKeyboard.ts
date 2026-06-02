/**
 * Pure helpers for keyboard overlay nudging (Story 5.5 / NFR-A3).
 *
 * No I/O beyond a single DOM-type guard (`isTypingTarget`, which runs fine in
 * jsdom). The nudge / clamp math is fully deterministic and unit-testable, so
 * the hook that wires the `keydown` listener stays a thin shell.
 */

export type NudgeDirection = "left" | "right" | "up" | "down";

/** Plain arrow-key nudge distance in screen px. */
export const NUDGE_STEP_PX = 1;
/** Shift+arrow nudge distance in screen px. */
export const NUDGE_STEP_SHIFT_PX = 8;

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/** Map a KeyboardEvent.key to a nudge direction, or null for non-arrow keys. */
export function arrowKeyToDirection(key: string): NudgeDirection | null {
  switch (key) {
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    default:
      return null;
  }
}

/** Whether a key should delete the selected overlay (Delete / Backspace). */
export function isDeleteKey(key: string): boolean {
  return key === "Delete" || key === "Backspace";
}

/** Minimal shape of the keyboard event fields the command detectors read. */
export interface KeyCommandEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
}

/**
 * Copy command: Ctrl+C (Windows/Linux) or Cmd+C (macOS). Matches `key` case-
 * insensitively so it works regardless of Shift/CapsLock state.
 */
export function isCopyCommand(event: KeyCommandEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c";
}

/** Paste command: Ctrl+V (Windows/Linux) or Cmd+V (macOS). */
export function isPasteCommand(event: KeyCommandEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v";
}

/**
 * Clamp a position so an overlay of `size` stays fully inside a page of
 * `pageDimPx`. If the overlay is larger than the page on an axis, that axis
 * pins to 0 (Math.max(0, …) on the upper bound).
 */
export function clampOverlayPosition(
  pos: Point,
  size: Size,
  pageDimPx: Size,
): Point {
  const maxX = Math.max(0, pageDimPx.width - size.width);
  const maxY = Math.max(0, pageDimPx.height - size.height);
  return {
    x: Math.min(Math.max(0, pos.x), maxX),
    y: Math.min(Math.max(0, pos.y), maxY),
  };
}

/**
 * Apply a nudge of `step` px in `direction` to an overlay rect, then clamp the
 * result to the page bounds. Returns the new (possibly unchanged) position.
 */
export function computeNudgedPosition(
  overlay: Point & Size,
  direction: NudgeDirection,
  step: number,
  pageDimPx: Size,
): Point {
  let { x, y } = overlay;
  switch (direction) {
    case "left":
      x -= step;
      break;
    case "right":
      x += step;
      break;
    case "up":
      y -= step;
      break;
    case "down":
      y += step;
      break;
  }
  return clampOverlayPosition({ x, y }, overlay, pageDimPx);
}

/**
 * True when the event target is a typing context (text input, textarea, select,
 * or contenteditable) where overlay shortcuts must not fire. Keeps the modal's
 * Type-tab input and any future inputs from being hijacked.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
