import { describe, expect, it, vi } from "vitest";
import { captureDrawnSignature } from "@/lib/signature/captureDrawnSignature";

describe("captureDrawnSignature", () => {
  it("returns null when the canvas is empty", () => {
    const canvas = {
      isEmpty: vi.fn(() => true),
      toDataURL: vi.fn(() => "data:image/png;base64,SHOULD_NOT_BE_RETURNED"),
    };

    const result = captureDrawnSignature(canvas);

    expect(result).toBeNull();
    expect(canvas.isEmpty).toHaveBeenCalledOnce();
    expect(canvas.toDataURL).not.toHaveBeenCalled();
  });

  it("returns the PNG data URL when the canvas has strokes", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
    const canvas = {
      isEmpty: vi.fn(() => false),
      toDataURL: vi.fn(() => dataUrl),
    };

    const result = captureDrawnSignature(canvas);

    expect(result).toBe(dataUrl);
  });

  it("requests PNG explicitly (so a future signature_pad default change can't silently flip the format)", () => {
    const canvas = {
      isEmpty: vi.fn(() => false),
      toDataURL: vi.fn(() => "data:image/png;base64,..."),
    };

    captureDrawnSignature(canvas);

    expect(canvas.toDataURL).toHaveBeenCalledExactlyOnceWith("image/png");
  });
});
