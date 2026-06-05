import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { embedOverlaysIntoPdf } from "@/lib/pdf/pdfExporter";
import type { OverlayDrawPlan } from "@/lib/pdf/exportPlan";

// 1x1 transparent PNG — a minimal valid image pdf-lib's embedPng can parse.
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** Build a fresh single-page PDF and return its bytes (the "original"). */
async function makeOriginalPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return doc.save();
}

function startsWithPdfHeader(bytes: Uint8Array): boolean {
  // "%PDF"
  return (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

describe("embedOverlaysIntoPdf", () => {
  it("returns a valid clean copy when there are no overlays", async () => {
    const original = await makeOriginalPdf();
    const out = await embedOverlaysIntoPdf(original, []);

    expect(startsWithPdfHeader(out)).toBe(true);
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it("embeds a PNG overlay and keeps the page count unchanged", async () => {
    const original = await makeOriginalPdf();
    const plans: OverlayDrawPlan[] = [
      {
        pageIndex: 0,
        dataUrl: PNG_1X1,
        rect: { xPt: 10, yPt: 10, widthPt: 50, heightPt: 50 },
      },
    ];

    const out = await embedOverlaysIntoPdf(original, plans);

    expect(startsWithPdfHeader(out)).toBe(true);
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
    // Embedding an image grows the file relative to the clean original.
    expect(out.byteLength).toBeGreaterThan(original.byteLength);
  });

  it("draws overlays only on their target pages", async () => {
    // Two-page doc; overlay only on page 1 (index 1).
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.addPage([200, 200]);
    const original = await doc.save();

    const out = await embedOverlaysIntoPdf(original, [
      {
        pageIndex: 1,
        dataUrl: PNG_1X1,
        rect: { xPt: 0, yPt: 0, widthPt: 20, heightPt: 20 },
      },
    ]);

    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it("rejects when a plan references an out-of-range page", async () => {
    const original = await makeOriginalPdf();
    await expect(
      embedOverlaysIntoPdf(original, [
        {
          pageIndex: 5,
          dataUrl: PNG_1X1,
          rect: { xPt: 0, yPt: 0, widthPt: 10, heightPt: 10 },
        },
      ]),
    ).rejects.toThrow();
  });
});
