import { describe, expect, it } from "vitest";
import {
  NUDGE_STEP_PX,
  NUDGE_STEP_SHIFT_PX,
  arrowKeyToDirection,
  clampOverlayPosition,
  computeNudgedPosition,
  isDeleteKey,
  isTypingTarget,
  type NudgeDirection,
} from "@/lib/overlay/overlayKeyboard";

describe("step constants", () => {
  it("uses 1px for a plain nudge and 8px for shift", () => {
    expect(NUDGE_STEP_PX).toBe(1);
    expect(NUDGE_STEP_SHIFT_PX).toBe(8);
  });
});

describe("arrowKeyToDirection", () => {
  it("maps the four arrow keys", () => {
    expect(arrowKeyToDirection("ArrowLeft")).toBe("left");
    expect(arrowKeyToDirection("ArrowRight")).toBe("right");
    expect(arrowKeyToDirection("ArrowUp")).toBe("up");
    expect(arrowKeyToDirection("ArrowDown")).toBe("down");
  });

  it("returns null for non-arrow keys", () => {
    expect(arrowKeyToDirection("a")).toBeNull();
    expect(arrowKeyToDirection("Enter")).toBeNull();
    expect(arrowKeyToDirection("Delete")).toBeNull();
  });
});

describe("isDeleteKey", () => {
  it("matches Delete and Backspace only", () => {
    expect(isDeleteKey("Delete")).toBe(true);
    expect(isDeleteKey("Backspace")).toBe(true);
    expect(isDeleteKey("ArrowLeft")).toBe(false);
    expect(isDeleteKey("x")).toBe(false);
  });
});

describe("clampOverlayPosition", () => {
  const size = { width: 200, height: 80 };
  const page = { width: 794, height: 1028 };

  it("leaves an in-bounds position unchanged", () => {
    expect(clampOverlayPosition({ x: 100, y: 100 }, size, page)).toEqual({
      x: 100,
      y: 100,
    });
  });

  it("clamps negative x/y to 0 (left/top edges)", () => {
    expect(clampOverlayPosition({ x: -5, y: -10 }, size, page)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("clamps x to pageWidth - overlayWidth (right edge)", () => {
    // maxX = 794 - 200 = 594
    expect(clampOverlayPosition({ x: 900, y: 100 }, size, page).x).toBe(594);
  });

  it("clamps y to pageHeight - overlayHeight (bottom edge)", () => {
    // maxY = 1028 - 80 = 948
    expect(clampOverlayPosition({ x: 100, y: 2000 }, size, page).y).toBe(948);
  });

  it("pins to 0 on an axis when the overlay is larger than the page", () => {
    const big = { width: 1000, height: 1200 };
    expect(clampOverlayPosition({ x: 50, y: 50 }, big, page)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("computeNudgedPosition", () => {
  const overlay = { x: 100, y: 100, width: 200, height: 80 };
  const page = { width: 794, height: 1028 };

  it("nudges right by the step", () => {
    expect(computeNudgedPosition(overlay, "right", 1, page)).toEqual({
      x: 101,
      y: 100,
    });
  });

  it("nudges left by the step", () => {
    expect(computeNudgedPosition(overlay, "left", 1, page)).toEqual({
      x: 99,
      y: 100,
    });
  });

  it("nudges up by the step", () => {
    expect(computeNudgedPosition(overlay, "up", 1, page)).toEqual({
      x: 100,
      y: 99,
    });
  });

  it("nudges down by the step", () => {
    expect(computeNudgedPosition(overlay, "down", 1, page)).toEqual({
      x: 100,
      y: 101,
    });
  });

  it("applies the 8px shift step", () => {
    expect(computeNudgedPosition(overlay, "right", 8, page)).toEqual({
      x: 108,
      y: 100,
    });
  });

  it("clamps at the left edge (cannot go below x=0)", () => {
    const atLeft = { x: 0, y: 100, width: 200, height: 80 };
    expect(computeNudgedPosition(atLeft, "left", 1, page)).toEqual({
      x: 0,
      y: 100,
    });
  });

  it("clamps at the top edge (cannot go below y=0)", () => {
    const atTop = { x: 100, y: 0, width: 200, height: 80 };
    expect(computeNudgedPosition(atTop, "up", 8, page)).toEqual({
      x: 100,
      y: 0,
    });
  });

  it("clamps at the right edge", () => {
    const atRight = { x: 594, y: 100, width: 200, height: 80 }; // maxX
    expect(computeNudgedPosition(atRight, "right", 8, page)).toEqual({
      x: 594,
      y: 100,
    });
  });

  it("clamps at the bottom edge", () => {
    const atBottom = { x: 100, y: 948, width: 200, height: 80 }; // maxY
    expect(computeNudgedPosition(atBottom, "down", 8, page)).toEqual({
      x: 100,
      y: 948,
    });
  });

  it("partially clamps an 8px nudge near an edge", () => {
    // 3px from the right edge (x=591, maxX=594): an 8px nudge lands exactly at 594.
    const near = { x: 591, y: 100, width: 200, height: 80 };
    expect(computeNudgedPosition(near, "right", 8, page).x).toBe(594);
  });
});

describe("isTypingTarget", () => {
  it("returns false for null", () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  it("returns true for input, textarea, and select elements", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(document.createElement("select"))).toBe(true);
  });

  it("returns true for a contenteditable element", () => {
    const el = document.createElement("div");
    el.contentEditable = "true";
    // jsdom doesn't compute isContentEditable from the attribute; force it.
    Object.defineProperty(el, "isContentEditable", { value: true });
    expect(isTypingTarget(el)).toBe(true);
  });

  it("returns false for a plain div / button", () => {
    expect(isTypingTarget(document.createElement("div"))).toBe(false);
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
  });
});

// Exhaustiveness sanity: every direction is handled by computeNudgedPosition.
describe("direction coverage", () => {
  it("handles all four directions without throwing", () => {
    const overlay = { x: 100, y: 100, width: 50, height: 50 };
    const page = { width: 500, height: 500 };
    const directions: NudgeDirection[] = ["left", "right", "up", "down"];
    for (const d of directions) {
      expect(() => computeNudgedPosition(overlay, d, 1, page)).not.toThrow();
    }
  });
});
