import { describe, expect, it } from "vitest";
import { overlaysForPage } from "@/lib/overlay/overlaySelectors";
import type { Overlay } from "@/types";

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "overlay-1",
    pageIndex: partial.pageIndex ?? 0,
    x: partial.x ?? 10,
    y: partial.y ?? 20,
    width: partial.width ?? 200,
    height: partial.height ?? 80,
  };
}

describe("overlaysForPage", () => {
  it("returns only overlays matching the given page index", () => {
    const a = makeOverlay({ id: "a", pageIndex: 0 });
    const b = makeOverlay({ id: "b", pageIndex: 1 });
    const c = makeOverlay({ id: "c", pageIndex: 0 });

    expect(overlaysForPage([a, b, c], 0)).toEqual([a, c]);
    expect(overlaysForPage([a, b, c], 1)).toEqual([b]);
  });

  it("returns an empty array when no overlays match", () => {
    const a = makeOverlay({ id: "a", pageIndex: 0 });
    expect(overlaysForPage([a], 5)).toEqual([]);
  });

  it("returns an empty array for an empty overlay list", () => {
    expect(overlaysForPage([], 0)).toEqual([]);
  });

  it("preserves the original order of matching overlays", () => {
    const first = makeOverlay({ id: "first", pageIndex: 2, x: 0 });
    const second = makeOverlay({ id: "second", pageIndex: 2, x: 100 });
    const third = makeOverlay({ id: "third", pageIndex: 2, x: 200 });

    const result = overlaysForPage([first, second, third], 2);
    expect(result.map((o) => o.id)).toEqual(["first", "second", "third"]);
  });

  it("does not mutate the input array", () => {
    const a = makeOverlay({ id: "a", pageIndex: 0 });
    const b = makeOverlay({ id: "b", pageIndex: 1 });
    const input = [a, b];

    overlaysForPage(input, 0);

    expect(input).toEqual([a, b]);
    expect(input).toHaveLength(2);
  });

  it("returns a new array reference (not the input)", () => {
    const a = makeOverlay({ id: "a", pageIndex: 0 });
    const input = [a];
    const result = overlaysForPage(input, 0);
    expect(result).not.toBe(input);
  });
});
