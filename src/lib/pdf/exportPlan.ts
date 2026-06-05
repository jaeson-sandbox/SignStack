/**
 * Pure export *planning* for Story 6.1 — the functional core of the export
 * pipeline. Three deterministic, I/O-free helpers:
 *
 * - `planOverlayDraws` — turns overlays + per-page dimension maps into a list
 *   of "draw this image at these PDF-point coordinates on this page"
 *   instructions, delegating ALL coordinate math to `coordinateMapper`
 *   (AD-3 — the formula lives in exactly one place).
 * - `signedFilename` — derives the `{name}-signed.pdf` download name.
 * - `dataUrlToUint8Array` — decodes a PNG data URL to bytes for pdf-lib.
 *
 * None of these touch pdf-lib, the DOM, or the network, so the high-risk
 * decisions (which overlay maps to which page, at what scale, with the Y-flip)
 * are unit-tested in isolation. The actual pdf-lib mutation lives in the
 * imperative shell (`pdfExporter.ts`), which consumes these plans.
 */

import {
  screenToPdfRect,
  type PdfRectPt,
} from "@/lib/pdf/coordinateMapper";
import type { Overlay } from "@/types";

/** 0-based page index → page size (either rendered px or intrinsic pt). */
type PageSizeMap = Map<number, { width: number; height: number }>;

/**
 * One drawing instruction: embed `dataUrl` on page `pageIndex` at `rect`
 * (already converted to PDF points, Y-flip applied). The shell just calls
 * `embedPng` + `drawImage` with these values — no further math.
 */
export interface OverlayDrawPlan {
  pageIndex: number;
  dataUrl: string;
  rect: PdfRectPt;
}

/**
 * Build the ordered draw plan for every overlay. Each overlay is mapped using
 * ITS OWN page's rendered-px and intrinsic-pt dimensions (no assumption that
 * pages share a size), so mixed-size documents export correctly.
 *
 * Throws if a referenced page has no measured dimensions — an overlay can only
 * have been placed on a rendered (therefore measured) page, so this should not
 * happen in practice; throwing surfaces the bug instead of silently dropping a
 * signature. The export hook catches it and dispatches EXPORT_ERROR (NFR-R2).
 */
export function planOverlayDraws(
  overlays: Overlay[],
  pageDimensionsPx: PageSizeMap,
  pageIntrinsicPt: PageSizeMap,
): OverlayDrawPlan[] {
  return overlays.map((overlay) => {
    const renderedPx = pageDimensionsPx.get(overlay.pageIndex);
    const intrinsicPt = pageIntrinsicPt.get(overlay.pageIndex);
    if (!renderedPx || !intrinsicPt) {
      throw new Error(
        `Cannot export: missing measured dimensions for page ${
          overlay.pageIndex + 1
        }.`,
      );
    }
    const rect = screenToPdfRect(
      {
        x: overlay.x,
        y: overlay.y,
        width: overlay.width,
        height: overlay.height,
      },
      renderedPx,
      intrinsicPt,
    );
    return { pageIndex: overlay.pageIndex, dataUrl: overlay.dataUrl, rect };
  });
}

const SIGNED_SUFFIX = "-signed.pdf";
const FALLBACK_BASENAME = "document";

/**
 * Derive the signed download filename: strip a trailing extension and append
 * `-signed.pdf`. Names with multiple dots keep all but the final extension
 * (`my.report.pdf` → `my.report-signed.pdf`); extensionless and empty names
 * fall back gracefully.
 */
export function signedFilename(originalName: string): string {
  const trimmed = originalName.trim();
  if (!trimmed) return `${FALLBACK_BASENAME}${SIGNED_SUFFIX}`;
  const lastDot = trimmed.lastIndexOf(".");
  // lastDot > 0 avoids mangling dotfiles like ".pdf" (treat as the whole name).
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  return `${base}${SIGNED_SUFFIX}`;
}

/**
 * Decode a base64 data URL (e.g. `data:image/png;base64,iVBORw0…`) to the raw
 * bytes pdf-lib's `embedPng` expects. Pure: depends only on the global `atob`
 * (present in browsers and the jsdom/Node test env).
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Malformed data URL: missing comma separator.");
  }
  const base64 = dataUrl.slice(commaIndex + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
