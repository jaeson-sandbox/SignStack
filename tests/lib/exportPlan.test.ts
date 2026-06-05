import { describe, expect, it } from "vitest";
import {
  dataUrlToUint8Array,
  planOverlayDraws,
  signedFilename,
  type OverlayDrawPlan,
} from "@/lib/pdf/exportPlan";
import type { Overlay } from "@/types";

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "ov-1",
    pageIndex: partial.pageIndex ?? 0,
    dataUrl: partial.dataUrl ?? "data:image/png;base64,SIG",
    x: partial.x ?? 0,
    y: partial.y ?? 0,
    width: partial.width ?? 100,
    height: partial.height ?? 40,
  };
}

type SizeMap = Map<number, { width: number; height: number }>;

describe("planOverlayDraws — coordinate conversion via the mapper", () => {
  it("maps a scale-1.0 overlay with the Y-flip", () => {
    // Rendered 612px wide for a 612pt-wide page => scale 1.0.
    const overlays = [makeOverlay({ x: 100, y: 100, width: 200, height: 50 })];
    const px: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    const pt: SizeMap = new Map([[0, { width: 612, height: 792 }]]);

    const [plan] = planOverlayDraws(overlays, px, pt);

    // yPt = 792 - 100 - 50 = 642
    expect(plan.rect).toEqual({
      xPt: 100,
      yPt: 642,
      widthPt: 200,
      heightPt: 50,
    });
    expect(plan.pageIndex).toBe(0);
    expect(plan.dataUrl).toBe("data:image/png;base64,SIG");
  });

  it("applies the scale factor for a 4/3 rendered page", () => {
    // Rendered 816px wide for a 612pt page => scale 816/612 = 4/3.
    const overlays = [makeOverlay({ x: 408, y: 528, width: 204, height: 68 })];
    const px: SizeMap = new Map([[0, { width: 816, height: 1056 }]]);
    const pt: SizeMap = new Map([[0, { width: 612, height: 792 }]]);

    const [plan] = planOverlayDraws(overlays, px, pt);

    // scale = 816/612 = 4/3; xPt = 408/scale = 306; w/h = 204|68 / scale = 153|51;
    // yPt = 792 - 528/scale - 51 = 792 - 396 - 51 = 345 (Y-flip).
    expect(plan.rect).toEqual({
      xPt: 306,
      yPt: 345,
      widthPt: 153,
      heightPt: 51,
    });
  });
});

describe("planOverlayDraws — page grouping and per-page sizes", () => {
  it("keeps each overlay on its own page using that page's dimensions", () => {
    const overlays = [
      makeOverlay({ id: "a", pageIndex: 0, x: 0, y: 0, width: 100, height: 50 }),
      makeOverlay({ id: "b", pageIndex: 2, x: 0, y: 0, width: 100, height: 50 }),
    ];
    // Page 0 is Letter (scale 1), page 2 is a different, larger-rendered size.
    const px: SizeMap = new Map([
      [0, { width: 612, height: 792 }],
      [2, { width: 1190, height: 1684 }],
    ]);
    const pt: SizeMap = new Map([
      [0, { width: 612, height: 792 }],
      [2, { width: 595, height: 842 }], // A4 points
    ]);

    const plans = planOverlayDraws(overlays, px, pt);

    expect(plans).toHaveLength(2);
    expect(plans[0].pageIndex).toBe(0);
    expect(plans[1].pageIndex).toBe(2);
    // Page 0 scale 1.0: top-left overlay -> yPt = 792 - 0 - 50 = 742.
    expect(plans[0].rect.yPt).toBe(742);
    // Page 2 scale = 1190/595 = 2.0: width 100px -> 50pt; yPt = 842 - 0 - 25.
    expect(plans[1].rect.widthPt).toBe(50);
    expect(plans[1].rect.heightPt).toBe(25);
    expect(plans[1].rect.yPt).toBe(842 - 0 - 25);
  });

  it("returns an empty plan for no overlays (clean-copy export)", () => {
    const px: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    const pt: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    expect(planOverlayDraws([], px, pt)).toEqual([]);
  });

  it("preserves overlay order in the plan", () => {
    const overlays = [
      makeOverlay({ id: "first", pageIndex: 0 }),
      makeOverlay({ id: "second", pageIndex: 0 }),
    ];
    const px: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    const pt: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    const plans = planOverlayDraws(overlays, px, pt);
    expect(plans.map((p: OverlayDrawPlan) => p.dataUrl)).toEqual([
      "data:image/png;base64,SIG",
      "data:image/png;base64,SIG",
    ]);
  });
});

describe("planOverlayDraws — missing dimensions", () => {
  it("throws when the page has no rendered px dimensions", () => {
    const overlays = [makeOverlay({ pageIndex: 0 })];
    const px: SizeMap = new Map(); // missing
    const pt: SizeMap = new Map([[0, { width: 612, height: 792 }]]);
    expect(() => planOverlayDraws(overlays, px, pt)).toThrowError(/page 1/);
  });

  it("throws when the page has no intrinsic pt dimensions", () => {
    const overlays = [makeOverlay({ pageIndex: 4 })];
    const px: SizeMap = new Map([[4, { width: 612, height: 792 }]]);
    const pt: SizeMap = new Map(); // missing
    expect(() => planOverlayDraws(overlays, px, pt)).toThrowError(/page 5/);
  });
});

describe("signedFilename", () => {
  it("replaces a .pdf extension with -signed.pdf", () => {
    expect(signedFilename("contract.pdf")).toBe("contract-signed.pdf");
  });

  it("strips only the final extension on multi-dot names", () => {
    expect(signedFilename("my.report.final.pdf")).toBe(
      "my.report.final-signed.pdf",
    );
  });

  it("appends to an extensionless name", () => {
    expect(signedFilename("noextension")).toBe("noextension-signed.pdf");
  });

  it("handles uppercase and other extensions", () => {
    expect(signedFilename("Scan.PDF")).toBe("Scan-signed.pdf");
    expect(signedFilename("agreement.docx")).toBe("agreement-signed.pdf");
  });

  it("falls back for empty or whitespace names", () => {
    expect(signedFilename("")).toBe("document-signed.pdf");
    expect(signedFilename("   ")).toBe("document-signed.pdf");
  });

  it("treats a leading-dot name as the whole basename", () => {
    expect(signedFilename(".pdf")).toBe(".pdf-signed.pdf");
  });
});

describe("dataUrlToUint8Array", () => {
  it("decodes base64 payload after the comma", () => {
    // "ABC" base64-encodes to "QUJD".
    const bytes = dataUrlToUint8Array("data:image/png;base64,QUJD");
    expect(Array.from(bytes)).toEqual([0x41, 0x42, 0x43]);
  });

  it("ignores the media-type prefix and only decodes the payload", () => {
    const bytes = dataUrlToUint8Array("data:application/octet-stream;base64,QUJD");
    expect(Array.from(bytes)).toEqual([0x41, 0x42, 0x43]);
  });

  it("throws on a data URL with no comma separator", () => {
    expect(() => dataUrlToUint8Array("not-a-data-url")).toThrowError(
      /comma separator/,
    );
  });
});
