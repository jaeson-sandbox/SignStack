/**
 * Typed-signature PNG rasterizer (architecture AD-7).
 *
 * Renders a single line of text in a given font onto an offscreen
 * `<canvas>` and returns a PNG data URL suitable for `pdf-lib`'s
 * `embedPng`. The DOM-touching code is a thin shell; sizing /
 * font-spec math is split into pure helpers so the bulk of the logic
 * is unit-testable without a real canvas.
 */

import { DEFAULT_INK_HEX } from "./inkColor";

const PADDING_PX = 16;
const HEIGHT_LINE_HEIGHT_MULTIPLIER = 1.4;

/** Width (CSS px) the canvas should be to fit the rendered text with side padding. */
export function computeCanvasWidth(textWidthPx: number): number {
  return Math.max(1, Math.ceil(textWidthPx) + PADDING_PX * 2);
}

/** Height (CSS px) the canvas should be to fit a single line of `fontSizePx` text. */
export function computeCanvasHeight(fontSizePx: number): number {
  return Math.ceil(fontSizePx * HEIGHT_LINE_HEIGHT_MULTIPLIER) + PADDING_PX;
}

/** CSS canvas `ctx.font` value. */
export function buildFontSpec(fontFamily: string, fontSizePx: number): string {
  return `${fontSizePx}px ${fontFamily}`;
}

export interface RenderTypedSignatureOptions {
  /** The text to draw. Caller should trim and reject empty strings. */
  text: string;
  /** CSS font-family expression (e.g., `"'Dancing Script', cursive"`). */
  fontFamily: string;
  /** Font size in CSS pixels. Defaults to 64 for quality at embed time. */
  fontSizePx?: number;
  /** Ink color as a literal CSS color string. Defaults to --color-ink. */
  color?: string;
}

/**
 * Renders `text` in `fontFamily` and returns a `data:image/png;base64,...` URL.
 *
 * NOT pure — touches `document.createElement` and canvas 2D context. Lives
 * here as the single imperative-shell boundary for typed signatures so the
 * rest of the app stays canvas-free.
 */
export function renderTypedSignatureToPng({
  text,
  fontFamily,
  fontSizePx = 64,
  color = DEFAULT_INK_HEX,
}: RenderTypedSignatureOptions): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to obtain 2D canvas context for typed signature.");
  }

  const fontSpec = buildFontSpec(fontFamily, fontSizePx);
  // First pass: measure with the requested font.
  ctx.font = fontSpec;
  const textWidthPx = ctx.measureText(text).width;

  // Resizing the canvas resets all context state, so set dimensions first
  // and then reapply font + fillStyle before drawing.
  canvas.width = computeCanvasWidth(textWidthPx);
  canvas.height = computeCanvasHeight(fontSizePx);

  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, PADDING_PX, fontSizePx + PADDING_PX / 2);

  return canvas.toDataURL("image/png");
}
