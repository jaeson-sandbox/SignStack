import { describe, expect, it } from "vitest";
import { PDF_DOCUMENT_OPTIONS } from "@/lib/pdf/pdfOptions";

describe("PDF_DOCUMENT_OPTIONS", () => {
  it("points standardFontDataUrl at the locally-served public/standard_fonts directory", () => {
    // Must be a same-origin absolute path — never a CDN — to honor the
    // local-first / no-network-egress invariant (FR-20, NFR-PV1).
    expect(PDF_DOCUMENT_OPTIONS.standardFontDataUrl).toBe("/standard_fonts/");
  });

  it("is frozen so its reference identity stays stable across renders", () => {
    // react-pdf's Document `options` prop is compared with === — if the
    // object identity ever changes, the PDF gets re-parsed unnecessarily.
    expect(Object.isFrozen(PDF_DOCUMENT_OPTIONS)).toBe(true);
  });
});
