/**
 * Pure coordinate conversion between rendered screen pixels and PDF points.
 *
 * Two coordinate systems:
 * - Screen: CSS pixels, origin TOP-LEFT of the rendered page, Y increases DOWNWARD.
 * - PDF:    points (1 pt = 1/72 inch), origin BOTTOM-LEFT of the page, Y increases UPWARD.
 *
 * Only the Y axis is flipped between the two; X is identical in direction.
 *
 * The scale factor is single-axis:
 *   scaleFactor = renderedPagePx.width / intrinsicPagePt.width
 * It can be applied to both dimensions because the renderer (Story 3.2's
 * `<Page width={…}>`) preserves aspect ratio. If a future story sets width
 * AND height non-proportionally, this assumption needs revisiting.
 *
 * Per AD-3, this module is the ONLY place screen↔PDF coordinate math is
 * allowed to live. Components and exporters must call into here rather than
 * inlining the formula — that mistake is what caused the bug class this
 * module exists to prevent.
 *
 * No I/O, no DOM, no React/pdf-lib/react-pdf/pdfjs imports — fully
 * unit-testable in isolation against synthetic dimensions.
 */

/** Rectangle in rendered screen pixels (top-left origin, Y down). */
export interface RectPx {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rectangle in PDF points (bottom-left origin, Y up). Field suffixes
 * make the unit unmistakable at every read site — this is the most
 * error-prone slot in the whole conversion. */
export interface PdfRectPt {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
}

/** Rendered page size in CSS pixels (from react-pdf's PageCallback). */
export interface RenderedPageSizePx {
  width: number;
  height: number;
}

/** Intrinsic page size in PDF points (from PageCallback.originalWidth/Height). */
export interface IntrinsicPageSizePt {
  width: number;
  height: number;
}

/**
 * Convert a screen-pixel rectangle on a rendered PDF page to PDF-point
 * coordinates suitable for `pdf-lib`'s drawImage / drawText.
 *
 * Y-flip derivation:
 *   - rectPx.y is the TOP of the rect, measured DOWN from the page top.
 *   - PDF y is the BOTTOM of the rect, measured UP from the page bottom.
 *   - bottom-of-rect (pt) = pageHeight (pt) - top-of-rect (pt) - heightPt
 *                         = pageHeight (pt) - (rectPx.y / scale) - heightPt
 */
export function screenToPdfRect(
  rectPx: RectPx,
  renderedPagePx: RenderedPageSizePx,
  intrinsicPagePt: IntrinsicPageSizePt,
): PdfRectPt {
  const scaleFactor = renderedPagePx.width / intrinsicPagePt.width;
  const widthPt = rectPx.width / scaleFactor;
  const heightPt = rectPx.height / scaleFactor;
  const xPt = rectPx.x / scaleFactor;
  const yPt = intrinsicPagePt.height - rectPx.y / scaleFactor - heightPt;
  return { xPt, yPt, widthPt, heightPt };
}

/**
 * Inverse of `screenToPdfRect`. Provided for symmetry and as a foundation
 * for round-trip correctness tests; no production caller exists today.
 */
export function pdfRectToScreen(
  rectPt: PdfRectPt,
  renderedPagePx: RenderedPageSizePx,
  intrinsicPagePt: IntrinsicPageSizePt,
): RectPx {
  const scaleFactor = renderedPagePx.width / intrinsicPagePt.width;
  const width = rectPt.widthPt * scaleFactor;
  const height = rectPt.heightPt * scaleFactor;
  const x = rectPt.xPt * scaleFactor;
  // Invert the Y-flip:
  //   top-of-rect (px) = (pageHeight (pt) - bottom-of-rect (pt) - heightPt) * scale
  const y =
    (intrinsicPagePt.height - rectPt.yPt - rectPt.heightPt) * scaleFactor;
  return { x, y, width, height };
}
