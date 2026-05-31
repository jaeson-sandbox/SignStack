import { describe, expect, it } from "vitest";
import {
  computeDefaultOverlayRect,
  DEFAULT_OVERLAY_WIDTH_PX,
  MIN_OVERLAY_HEIGHT_PX,
} from "@/lib/overlay/overlayPlacement";

describe("computeDefaultOverlayRect — width and positioning", () => {
  it("always returns DEFAULT_OVERLAY_WIDTH_PX (200) as the width", () => {
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4);
    expect(rect.width).toBe(DEFAULT_OVERLAY_WIDTH_PX);
  });

  it("places the overlay 5% inset from the right edge (standard Letter-ish page)", () => {
    // page 794px wide; 5% inset from right means left edge at 794 * 0.95 - 200
    // = round(754.3 - 200) = round(554.3) = 554
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4);
    expect(rect.x).toBe(554);
  });

  it("places the overlay 5% inset from the bottom edge", () => {
    // page 1028px tall; height = max(40, round(200 * 0.4)) = max(40, 80) = 80
    // y = round(1028 * 0.95 - 80) = round(976.6 - 80) = round(896.6) = 897
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4);
    expect(rect.y).toBe(897);
  });

  it("works correctly for a standard US-Letter page (794 × 1028 px) with 0.4 aspect ratio", () => {
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4);
    expect(rect).toEqual({ x: 554, y: 897, width: 200, height: 80 });
  });
});

describe("computeDefaultOverlayRect — height clamping", () => {
  it("returns MIN_OVERLAY_HEIGHT_PX (40) when the aspect ratio would produce a shorter height", () => {
    // 200 * 0.1 = 20 < 40, so clamp to 40
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.1);
    expect(rect.height).toBe(MIN_OVERLAY_HEIGHT_PX);
  });

  it("falls back to 0.4 aspect ratio for zero input (height = 80, not the 40 minimum)", () => {
    // safeRatio falls back to 0.4 when input <= 0; 200 * 0.4 = 80 > 40 so min-clamp does not fire.
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0);
    expect(rect.height).toBe(80);
  });

  it("falls back to 0.4 aspect ratio for negative input (height = 80, not the 40 minimum)", () => {
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, -1);
    expect(rect.height).toBe(80);
  });

  it("uses the aspect ratio when it produces a height above the minimum", () => {
    // 200 * 0.5 = 100 > 40
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.5);
    expect(rect.height).toBe(100);
  });

  it("rounds the computed height to the nearest integer", () => {
    // 200 * 0.333 = 66.6 → rounds to 67
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.333);
    expect(rect.height).toBe(67);
  });
});

describe("computeDefaultOverlayRect — aspect ratio variation", () => {
  it("produces a taller overlay for a tall (portrait) signature", () => {
    const narrowRect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4);
    const tallRect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 1.0);
    expect(tallRect.height).toBeGreaterThan(narrowRect.height);
  });

  it("produces a lower y for a taller overlay (overlay stays pinned to bottom)", () => {
    const shortRect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 0.4); // h=80
    const tallRect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 1.0);  // h=200
    // Both placed with 5% bottom inset; taller overlay must start higher on the page
    expect(tallRect.y).toBeLessThan(shortRect.y);
  });

  it("handles a square signature (aspect ratio 1.0) correctly", () => {
    // height = 200; y = round(1028 * 0.95 - 200) = round(776.6) = 777
    const rect = computeDefaultOverlayRect({ width: 794, height: 1028 }, 1.0);
    expect(rect).toEqual({ x: 554, y: 777, width: 200, height: 200 });
  });
});

describe("computeDefaultOverlayRect — page size variation", () => {
  it("adapts to a wider page (A4-portrait, ~794 px wide)", () => {
    const rect = computeDefaultOverlayRect({ width: 794, height: 1123 }, 0.4);
    // x = round(794 * 0.95 - 200) = round(554.3) = 554
    // y = round(1123 * 0.95 - 80) = round(1066.85 - 80) = round(986.85) = 987
    expect(rect.x).toBe(554);
    expect(rect.y).toBe(987);
  });

  it("adapts to a narrow page (half width)", () => {
    const rect = computeDefaultOverlayRect({ width: 400, height: 600 }, 0.4);
    // x = round(400 * 0.95 - 200) = round(380 - 200) = 180
    // height = 80; y = round(600 * 0.95 - 80) = round(570 - 80) = 490
    expect(rect.x).toBe(180);
    expect(rect.y).toBe(490);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(80);
  });
});
