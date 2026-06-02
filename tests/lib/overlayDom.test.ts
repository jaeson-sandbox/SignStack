import { afterEach, describe, expect, it } from "vitest";
import {
  OVERLAY_RND_CLASS,
  isOverlayEventTarget,
} from "@/lib/overlay/overlayDom";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isOverlayEventTarget", () => {
  it("returns false for null", () => {
    expect(isOverlayEventTarget(null)).toBe(false);
  });

  it("returns false for a non-Element target (e.g. window)", () => {
    expect(isOverlayEventTarget(window as unknown as EventTarget)).toBe(false);
  });

  it("returns true for the overlay root element itself", () => {
    const root = document.createElement("div");
    root.className = OVERLAY_RND_CLASS;
    document.body.appendChild(root);
    expect(isOverlayEventTarget(root)).toBe(true);
  });

  it("returns true for a descendant of the overlay root (e.g. the image or a handle)", () => {
    const root = document.createElement("div");
    root.className = OVERLAY_RND_CLASS;
    const child = document.createElement("img");
    root.appendChild(child);
    document.body.appendChild(root);
    expect(isOverlayEventTarget(child)).toBe(true);
  });

  it("returns false for an element outside any overlay (bare page / gutter / caption)", () => {
    const gutter = document.createElement("div");
    document.body.appendChild(gutter);
    expect(isOverlayEventTarget(gutter)).toBe(false);
  });

  it("returns false for a sibling that merely sits next to an overlay", () => {
    const root = document.createElement("div");
    root.className = OVERLAY_RND_CLASS;
    const caption = document.createElement("p");
    document.body.append(root, caption);
    expect(isOverlayEventTarget(caption)).toBe(false);
  });
});
