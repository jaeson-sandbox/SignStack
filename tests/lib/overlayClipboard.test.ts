import { describe, expect, it } from "vitest";
import {
  SAME_PAGE_PASTE_OFFSET_PX,
  computePastePosition,
  toClipboardPayload,
  type OverlayClipboardPayload,
} from "@/lib/overlay/overlayClipboard";
import type { Overlay } from "@/types";

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "ov-1",
    pageIndex: partial.pageIndex ?? 0,
    dataUrl: partial.dataUrl ?? "data:image/png;base64,FAKE",
    x: partial.x ?? 100,
    y: partial.y ?? 120,
    width: partial.width ?? 200,
    height: partial.height ?? 80,
  };
}

function makePayload(
  partial: Partial<OverlayClipboardPayload> = {},
): OverlayClipboardPayload {
  return {
    dataUrl: partial.dataUrl ?? "data:image/png;base64,FAKE",
    width: partial.width ?? 200,
    height: partial.height ?? 80,
    sourcePageIndex: partial.sourcePageIndex ?? 0,
    sourceX: partial.sourceX ?? 100,
    sourceY: partial.sourceY ?? 120,
  };
}

describe("toClipboardPayload", () => {
  it("snapshots dataUrl, size, source page, and source position", () => {
    const overlay = makeOverlay({
      pageIndex: 2,
      dataUrl: "data:image/png;base64,SIG",
      x: 50,
      y: 60,
      width: 220,
      height: 90,
    });
    expect(toClipboardPayload(overlay)).toEqual({
      dataUrl: "data:image/png;base64,SIG",
      width: 220,
      height: 90,
      sourcePageIndex: 2,
      sourceX: 50,
      sourceY: 60,
    });
  });

  it("does not include the overlay id (paste mints a new one)", () => {
    const payload = toClipboardPayload(makeOverlay({ id: "original" }));
    expect("id" in payload).toBe(false);
  });

  it("is a value snapshot — later overlay mutation does not change it", () => {
    const overlay = makeOverlay({ x: 100 });
    const payload = toClipboardPayload(overlay);
    overlay.x = 999;
    expect(payload.sourceX).toBe(100);
  });
});

describe("computePastePosition — same page", () => {
  const page = { width: 794, height: 1028 };

  it("offsets down-right by SAME_PAGE_PASTE_OFFSET_PX", () => {
    const payload = makePayload({ sourcePageIndex: 0, sourceX: 100, sourceY: 120 });
    expect(computePastePosition(payload, 0, page)).toEqual({
      x: 100 + SAME_PAGE_PASTE_OFFSET_PX,
      y: 120 + SAME_PAGE_PASTE_OFFSET_PX,
    });
  });

  it("clamps the offset so a near-bottom-right copy stays on-page", () => {
    // maxX = 794-200 = 594, maxY = 1028-80 = 948. Source already at the max.
    const payload = makePayload({ sourceX: 594, sourceY: 948 });
    // +16 would exceed the max on both axes → clamps back to the max.
    expect(computePastePosition(payload, 0, page)).toEqual({ x: 594, y: 948 });
  });
});

describe("computePastePosition — cross page", () => {
  const page = { width: 794, height: 1028 };

  it("preserves the source position when pasting on a different page", () => {
    const payload = makePayload({ sourcePageIndex: 0, sourceX: 100, sourceY: 120 });
    expect(computePastePosition(payload, 1, page)).toEqual({ x: 100, y: 120 });
  });

  it("clamps the source position to the destination page bounds", () => {
    // A narrow destination page: source x=700 would overflow.
    const narrow = { width: 400, height: 600 };
    const payload = makePayload({ sourcePageIndex: 0, sourceX: 700, sourceY: 700 });
    // maxX = 400-200 = 200, maxY = 600-80 = 520.
    expect(computePastePosition(payload, 1, narrow)).toEqual({ x: 200, y: 520 });
  });

  it("does not apply the same-page offset across pages", () => {
    const payload = makePayload({ sourcePageIndex: 0, sourceX: 100, sourceY: 120 });
    const pos = computePastePosition(payload, 3, page);
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(120);
  });
});
