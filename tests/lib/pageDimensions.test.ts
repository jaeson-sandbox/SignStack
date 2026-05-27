import { describe, expect, it } from "vitest";
import { extractPageDimensions } from "@/lib/pdf/pageDimensions";

describe("extractPageDimensions", () => {
  it("projects all four fields onto the typed Px/Pt suffixes", () => {
    // US Letter rendered at 794 px wide.
    // intrinsic 612 x 792 pt → rendered 794 x ~1027 px (794 * 792/612).
    const page = {
      width: 794,
      height: 1027.058823529,
      originalWidth: 612,
      originalHeight: 792,
    };
    expect(extractPageDimensions(page)).toEqual({
      widthPx: 794,
      heightPx: 1027.058823529,
      widthPt: 612,
      heightPt: 792,
    });
  });

  it("handles A4 (595 x 842 pt) at the same container width", () => {
    // A4 rendered at 794 px wide → height = 794 * (842/595) ≈ 1124.
    const page = {
      width: 794,
      height: 1123.83193277,
      originalWidth: 595,
      originalHeight: 842,
    };
    const dims = extractPageDimensions(page);
    expect(dims.widthPt).toBe(595);
    expect(dims.heightPt).toBe(842);
    expect(dims.widthPx).toBe(794);
    expect(dims.heightPx).toBeCloseTo(1123.83, 1);
  });

  it("preserves exact numeric values without coercion", () => {
    // No rounding, no Math.floor — coordinate mapping (Story 4.1) needs
    // the precise values to compute scale factors correctly.
    const page = {
      width: 100.5,
      height: 200.25,
      originalWidth: 300.125,
      originalHeight: 400.0625,
    };
    expect(extractPageDimensions(page)).toEqual({
      widthPx: 100.5,
      heightPx: 200.25,
      widthPt: 300.125,
      heightPt: 400.0625,
    });
  });
});
