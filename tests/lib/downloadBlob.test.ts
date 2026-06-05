import { describe, expect, it, vi } from "vitest";
import { downloadBytes } from "@/lib/browser/downloadBlob";

describe("downloadBytes", () => {
  it("assembles a PDF Blob and hands it to the saver with the filename", () => {
    const save = vi.fn();
    const bytes = new Uint8Array([1, 2, 3, 4]);

    downloadBytes(bytes, "contract-signed.pdf", "application/pdf", save);

    expect(save).toHaveBeenCalledTimes(1);
    const [blob, filename] = save.mock.calls[0] as [Blob, string];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBe(bytes.byteLength);
    expect(filename).toBe("contract-signed.pdf");
  });

  it("defaults to the application/pdf mime type", () => {
    const save = vi.fn();
    downloadBytes(new Uint8Array([0]), "x-signed.pdf", undefined, save);
    const [blob] = save.mock.calls[0] as [Blob, string];
    expect(blob.type).toBe("application/pdf");
  });

  it("does not trigger a real download when a fake saver is injected", () => {
    const save = vi.fn();
    // Would throw if it touched document/anchor in a way jsdom rejected; the
    // point is the injected saver fully replaces the DOM side effect.
    downloadBytes(new Uint8Array([9]), "y-signed.pdf", "application/pdf", save);
    expect(save).toHaveBeenCalledOnce();
  });
});
