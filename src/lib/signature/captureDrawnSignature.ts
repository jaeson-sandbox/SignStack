/**
 * Pure adapter over a signature-canvas instance. The only place in the app
 * that knows how to extract a PNG data URL from a drawn signature.
 *
 * Lives in `src/lib/signature/` (not in `src/hooks/`) because it is a pure
 * function with no React state — CLAUDE.md routes pure utilities into
 * `src/lib/`. If we ever swap `react-signature-canvas` for another library,
 * only this file (and `DrawTab.tsx`) changes.
 *
 * Takes the structural minimum the function needs (`isEmpty`, `toDataURL`)
 * so tests can use a plain object mock and the helper never imports
 * `react-signature-canvas` itself.
 */

export interface SignatureCanvasLike {
  isEmpty(): boolean;
  toDataURL(type?: string, encoderOptions?: number): string;
}

/**
 * Returns the canvas's strokes as a `data:image/png;base64,...` URL, or
 * `null` if the canvas is empty. Never throws on an empty canvas — callers
 * check the return value.
 */
export function captureDrawnSignature(
  canvas: SignatureCanvasLike,
): string | null {
  if (canvas.isEmpty()) return null;
  return canvas.toDataURL("image/png");
}
