import { describe, expect, it } from "vitest";
import {
  pdfRectToScreen,
  screenToPdfRect,
  type IntrinsicPageSizePt,
  type PdfRectPt,
  type RectPx,
  type RenderedPageSizePx,
} from "@/lib/pdf/coordinateMapper";

// US Letter intrinsic dimensions in points.
const LETTER_PT: IntrinsicPageSizePt = { width: 612, height: 792 };
// A4 intrinsic dimensions in points.
const A4_PT: IntrinsicPageSizePt = { width: 595, height: 842 };

describe("screenToPdfRect — AC#1 (scale 1.0, Letter)", () => {
  it("maps {x:100, y:100, w:200, h:50} to {xPt:100, yPt:642, widthPt:200, heightPt:50}", () => {
    // Rendered at native 1pt-per-px so the scale factor is exactly 1.0
    // and the Y-flip is the only transformation we can verify cleanly.
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const rectPx: RectPx = { x: 100, y: 100, width: 200, height: 50 };
    expect(screenToPdfRect(rectPx, renderedPx, LETTER_PT)).toEqual({
      xPt: 100,
      yPt: 642, // 792 - 100 - 50
      widthPt: 200,
      heightPt: 50,
    });
  });
});

describe("screenToPdfRect — AC#2 (scale 4/3, synthetic 612×990 page)", () => {
  it("maps {x:408, y:528, w:204, h:68} to {xPt:306, yPt:543, widthPt:153, heightPt:51}", () => {
    // 816px wide rendering of a 612pt wide page → scale = 4/3.
    // Page height 990pt is the value implied by the spec's expected yPt:
    //   543 + 51 + 528/(4/3) = 990. Non-standard; synthetic test data.
    const renderedPx: RenderedPageSizePx = { width: 816, height: 1320 };
    const pagePt: IntrinsicPageSizePt = { width: 612, height: 990 };
    const rectPx: RectPx = { x: 408, y: 528, width: 204, height: 68 };
    expect(screenToPdfRect(rectPx, renderedPx, pagePt)).toEqual({
      xPt: 306,
      yPt: 543,
      widthPt: 153,
      heightPt: 51,
    });
  });
});

describe("screenToPdfRect — all four corners at scale 1.0", () => {
  const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
  const RECT = { width: 100, height: 50 };

  it("top-left {x:0, y:0} → PDF y near page top (high yPt)", () => {
    const result = screenToPdfRect(
      { x: 0, y: 0, ...RECT },
      renderedPx,
      LETTER_PT,
    );
    // Top of screen = top of PDF page. yPt = pageH - 0 - heightPt = 742.
    expect(result).toEqual({ xPt: 0, yPt: 742, widthPt: 100, heightPt: 50 });
  });

  it("top-right corner → max xPt, max yPt", () => {
    const result = screenToPdfRect(
      { x: 512, y: 0, ...RECT },
      renderedPx,
      LETTER_PT,
    );
    expect(result).toEqual({ xPt: 512, yPt: 742, widthPt: 100, heightPt: 50 });
  });

  it("bottom-left → yPt = 0 (rect bottom at PDF origin)", () => {
    // Rect bottom touches screen bottom (y + height = 792), so PDF y = 0.
    const result = screenToPdfRect(
      { x: 0, y: 742, ...RECT },
      renderedPx,
      LETTER_PT,
    );
    expect(result).toEqual({ xPt: 0, yPt: 0, widthPt: 100, heightPt: 50 });
  });

  it("bottom-right → max xPt, yPt = 0", () => {
    const result = screenToPdfRect(
      { x: 512, y: 742, ...RECT },
      renderedPx,
      LETTER_PT,
    );
    expect(result).toEqual({ xPt: 512, yPt: 0, widthPt: 100, heightPt: 50 });
  });
});

describe("screenToPdfRect — centered rectangle on Letter at scale 1.0", () => {
  it("center stays center after Y-flip (symmetry sanity check)", () => {
    // 100×50 rect centered on 612×792 page: top-left at (256, 371).
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const result = screenToPdfRect(
      { x: 256, y: 371, width: 100, height: 50 },
      renderedPx,
      LETTER_PT,
    );
    // yPt = 792 - 371 - 50 = 371. Vertically symmetric on a 792pt page.
    expect(result).toEqual({ xPt: 256, yPt: 371, widthPt: 100, heightPt: 50 });
  });
});

describe("screenToPdfRect — Y-axis flip is explicit", () => {
  it("overlay at screen-y=0 sits near the TOP of the PDF page (yPt high)", () => {
    // This is the test that fails loudly if someone removes the Y-flip
    // or replaces it with `yPt = rectPx.y / scale`.
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const result = screenToPdfRect(
      { x: 0, y: 0, width: 10, height: 10 },
      renderedPx,
      LETTER_PT,
    );
    expect(result.yPt).toBe(782); // 792 - 0 - 10
    expect(result.yPt).toBeGreaterThan(LETTER_PT.height / 2);
  });

  it("overlay just inside the bottom edge sits near the BOTTOM of the PDF page (yPt low)", () => {
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const result = screenToPdfRect(
      { x: 0, y: 782, width: 10, height: 10 },
      renderedPx,
      LETTER_PT,
    );
    expect(result.yPt).toBe(0);
    expect(result.yPt).toBeLessThan(LETTER_PT.height / 2);
  });
});

describe("screenToPdfRect — non-square page (A4) with scale ≈ 1.334", () => {
  it("scales x/y/width/height by the single-axis factor; flips Y correctly", () => {
    // 794px wide rendering of 595pt wide A4 → scale = 794/595 ≈ 1.334.
    const renderedPx: RenderedPageSizePx = { width: 794, height: 1124 };
    const rectPx: RectPx = { x: 100, y: 100, width: 200, height: 100 };
    const result = screenToPdfRect(rectPx, renderedPx, A4_PT);
    const scale = 794 / 595;
    expect(result.widthPt).toBeCloseTo(200 / scale, 6);
    expect(result.heightPt).toBeCloseTo(100 / scale, 6);
    expect(result.xPt).toBeCloseTo(100 / scale, 6);
    expect(result.yPt).toBeCloseTo(842 - 100 / scale - 100 / scale, 6);
  });
});

describe("screenToPdfRect — fractional values are preserved (no rounding)", () => {
  it("sub-pixel rect on a sub-pixel-scale render survives without truncation", () => {
    // Story spec's Implementation Notes explicitly call out: "Test with
    // fractional pixel values (ensure no integer truncation errors)."
    const renderedPx: RenderedPageSizePx = { width: 800.5, height: 1037.85 };
    const pagePt: IntrinsicPageSizePt = { width: 612.25, height: 793.5 };
    const rectPx: RectPx = {
      x: 12.75,
      y: 33.125,
      width: 100.5,
      height: 50.0625,
    };
    const result = screenToPdfRect(rectPx, renderedPx, pagePt);
    const scale = 800.5 / 612.25;
    expect(result.xPt).toBeCloseTo(12.75 / scale, 10);
    expect(result.widthPt).toBeCloseTo(100.5 / scale, 10);
    expect(result.heightPt).toBeCloseTo(50.0625 / scale, 10);
    expect(result.yPt).toBeCloseTo(
      793.5 - 33.125 / scale - 50.0625 / scale,
      10,
    );
  });
});

describe("screenToPdfRect — zero-size overlay edge case", () => {
  it("collapses to a point at the correct PDF coordinate", () => {
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const result = screenToPdfRect(
      { x: 100, y: 100, width: 0, height: 0 },
      renderedPx,
      LETTER_PT,
    );
    // widthPt/heightPt both 0; yPt is just pageH - y/scale (no height subtraction).
    expect(result).toEqual({ xPt: 100, yPt: 692, widthPt: 0, heightPt: 0 });
  });
});

describe("pdfRectToScreen — inverse at scale 1.0", () => {
  it("undoes the Y-flip and returns the original screen coordinates", () => {
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const rectPt: PdfRectPt = {
      xPt: 100,
      yPt: 642,
      widthPt: 200,
      heightPt: 50,
    };
    expect(pdfRectToScreen(rectPt, renderedPx, LETTER_PT)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 50,
    });
  });
});

describe("pdfRectToScreen — inverse at scale 4/3", () => {
  it("scales PDF points up to rendered pixels", () => {
    const renderedPx: RenderedPageSizePx = { width: 816, height: 1320 };
    const pagePt: IntrinsicPageSizePt = { width: 612, height: 990 };
    const rectPt: PdfRectPt = {
      xPt: 306,
      yPt: 543,
      widthPt: 153,
      heightPt: 51,
    };
    expect(pdfRectToScreen(rectPt, renderedPx, pagePt)).toEqual({
      x: 408,
      y: 528,
      width: 204,
      height: 68,
    });
  });
});

describe("round-trip stability", () => {
  function expectRoundTrip(
    rectPx: RectPx,
    renderedPx: RenderedPageSizePx,
    pagePt: IntrinsicPageSizePt,
  ): void {
    const pt = screenToPdfRect(rectPx, renderedPx, pagePt);
    const back = pdfRectToScreen(pt, renderedPx, pagePt);
    expect(back.x).toBeCloseTo(rectPx.x, 10);
    expect(back.y).toBeCloseTo(rectPx.y, 10);
    expect(back.width).toBeCloseTo(rectPx.width, 10);
    expect(back.height).toBeCloseTo(rectPx.height, 10);
  }

  it("screen → PDF → screen returns the original at scale 1.0 (Letter)", () => {
    expectRoundTrip(
      { x: 100, y: 200, width: 300, height: 150 },
      { width: 612, height: 792 },
      LETTER_PT,
    );
  });

  it("screen → PDF → screen returns the original at scale 4/3", () => {
    expectRoundTrip(
      { x: 408, y: 528, width: 204, height: 68 },
      { width: 816, height: 1320 },
      { width: 612, height: 990 },
    );
  });

  it("screen → PDF → screen returns the original at A4 non-square scale", () => {
    expectRoundTrip(
      { x: 50.5, y: 200.25, width: 175.75, height: 88.125 },
      { width: 794, height: 1124 },
      A4_PT,
    );
  });

  it("PDF → screen → PDF returns the original (reverse direction)", () => {
    const renderedPx: RenderedPageSizePx = { width: 612, height: 792 };
    const rectPt: PdfRectPt = {
      xPt: 50,
      yPt: 100,
      widthPt: 250,
      heightPt: 75,
    };
    const px = pdfRectToScreen(rectPt, renderedPx, LETTER_PT);
    const back = screenToPdfRect(px, renderedPx, LETTER_PT);
    expect(back.xPt).toBeCloseTo(rectPt.xPt, 10);
    expect(back.yPt).toBeCloseTo(rectPt.yPt, 10);
    expect(back.widthPt).toBeCloseTo(rectPt.widthPt, 10);
    expect(back.heightPt).toBeCloseTo(rectPt.heightPt, 10);
  });
});
