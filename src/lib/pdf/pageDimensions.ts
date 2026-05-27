/**
 * Pure projection from react-pdf's PageCallback (the object passed to
 * <Page>'s onLoadSuccess / onRenderSuccess) to typed dimension numbers.
 *
 * react-pdf exposes both the rendered CSS-pixel size (`width` / `height`,
 * derived from the <Page width={...}> prop and the page aspect ratio)
 * and the PDF intrinsic point size (`originalWidth` / `originalHeight`,
 * equivalent to pdfjs's `getViewport({ scale: 1 })` result) on the same
 * object — so we don't need a second `getPage()` round-trip.
 *
 * No I/O, no DOM, no side effects — fully unit-testable in isolation.
 */

/**
 * Structural subset of react-pdf's `PageCallback` we actually use.
 *
 * Avoids importing `PageCallback` (or `PDFPageProxy`) from react-pdf or
 * pdfjs-dist directly: the top-level pdfjs-dist (5.7.x) shape diverges
 * from react-pdf's nested pdfjs-dist (5.4.x) and would re-trigger the
 * R-1 type mismatch documented in docs/baseline-verification.md. The
 * four fields below are stable across both nested versions.
 */
export interface PageMeasurementInput {
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export interface PageDimensions {
  widthPx: number;
  heightPx: number;
  widthPt: number;
  heightPt: number;
}

export function extractPageDimensions(
  page: PageMeasurementInput,
): PageDimensions {
  return {
    widthPx: page.width,
    heightPx: page.height,
    widthPt: page.originalWidth,
    heightPt: page.originalHeight,
  };
}
