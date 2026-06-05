/**
 * Imperative shell around pdf-lib for Story 6.1 — the ONLY module that mutates
 * a PDF. It takes the original PDF bytes plus a pre-computed draw plan (from the
 * pure `exportPlan.ts`) and returns the signed PDF bytes. No coordinate math, no
 * filename logic, no DOM, no network — those live elsewhere so this stays a thin
 * wrapper over the high-risk pdf-lib surface (per the CLAUDE.md rule: keep
 * pdf-lib calls in `src/lib/pdf/*`, isolated from components).
 */

import { PDFDocument } from "pdf-lib";
import { dataUrlToUint8Array, type OverlayDrawPlan } from "./exportPlan";

/**
 * Load `pdfBytes`, draw each planned overlay onto its page, and serialize.
 *
 * - An empty `plans` array produces a clean, valid copy of the original
 *   (AC: zero-overlay export → unmodified PDF).
 * - Pages without a plan entry are never touched, so they stay byte-identical
 *   to the original (FR-19).
 * - `getPage` throws for an out-of-range index; that propagates to the caller,
 *   which maps it to a user-visible EXPORT_ERROR (NFR-R2).
 */
export async function embedOverlaysIntoPdf(
  pdfBytes: Uint8Array | ArrayBuffer,
  plans: OverlayDrawPlan[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const plan of plans) {
    const page = pdfDoc.getPage(plan.pageIndex);
    const pngImage = await pdfDoc.embedPng(dataUrlToUint8Array(plan.dataUrl));
    page.drawImage(pngImage, {
      x: plan.rect.xPt,
      y: plan.rect.yPt,
      width: plan.rect.widthPt,
      height: plan.rect.heightPt,
    });
  }

  return pdfDoc.save();
}
