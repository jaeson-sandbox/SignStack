import { describe, expect, it } from "vitest";
import { resolveSignaturePlacement } from "@/lib/signature/signaturePlacement";

describe("resolveSignaturePlacement", () => {
  it("uses freshly created input when present (new signature wins)", () => {
    expect(
      resolveSignaturePlacement("data:image/png;base64,NEW", null),
    ).toEqual({ dataUrl: "data:image/png;base64,NEW", isNewSignature: true });
  });

  it("new input wins even when an existing signature is also present (replace)", () => {
    expect(
      resolveSignaturePlacement(
        "data:image/png;base64,NEW",
        "data:image/png;base64,OLD",
      ),
    ).toEqual({ dataUrl: "data:image/png;base64,NEW", isNewSignature: true });
  });

  it("reuses the existing session signature when there is no new input", () => {
    expect(
      resolveSignaturePlacement(null, "data:image/png;base64,OLD"),
    ).toEqual({ dataUrl: "data:image/png;base64,OLD", isNewSignature: false });
  });

  it("returns null when there is nothing to place", () => {
    expect(resolveSignaturePlacement(null, null)).toBeNull();
  });
});
