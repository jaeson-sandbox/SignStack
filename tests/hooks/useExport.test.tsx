import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useExport } from "@/hooks/useExport";
import type { AppAction, DocumentState, Overlay } from "@/types";

// Mock the two side-effecting boundaries so no real pdf-lib work or browser
// download happens — the hook test only verifies orchestration + dispatch.
vi.mock("@/lib/pdf/pdfExporter", () => ({
  embedOverlaysIntoPdf: vi.fn(),
}));
vi.mock("@/lib/browser/downloadBlob", () => ({
  downloadBytes: vi.fn(),
}));

import { embedOverlaysIntoPdf } from "@/lib/pdf/pdfExporter";
import { downloadBytes } from "@/lib/browser/downloadBlob";

const SIGNED_BYTES = new Uint8Array([1, 2, 3]);

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "ov-1",
    pageIndex: partial.pageIndex ?? 0,
    dataUrl: partial.dataUrl ?? "data:image/png;base64,QUJD",
    x: partial.x ?? 10,
    y: partial.y ?? 10,
    width: partial.width ?? 100,
    height: partial.height ?? 40,
  };
}

function makeDocument(file: File | null): DocumentState {
  return {
    file,
    arrayBuffer: file ? null : null,
    pageCount: file ? 1 : 0,
    pageDimensionsPx: new Map([[0, { width: 612, height: 792 }]]),
    pageIntrinsicPt: new Map([[0, { width: 612, height: 792 }]]),
  };
}

function makeFile(name = "contract.pdf"): File {
  return new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], name, {
    type: "application/pdf",
  });
}

interface HarnessProps {
  document: DocumentState;
  overlays: Overlay[];
  dispatch: React.Dispatch<AppAction>;
}

function Harness({ document, overlays, dispatch }: HarnessProps) {
  const { exportSignedPdf } = useExport({ document, overlays, dispatch });
  return (
    <button type="button" onClick={() => void exportSignedPdf()}>
      export
    </button>
  );
}

function dispatchedTypes(dispatch: ReturnType<typeof vi.fn>): string[] {
  return dispatch.mock.calls.map(([a]) => (a as AppAction).type);
}

beforeEach(() => {
  vi.mocked(embedOverlaysIntoPdf).mockReset();
  vi.mocked(downloadBytes).mockReset();
  vi.mocked(embedOverlaysIntoPdf).mockResolvedValue(SIGNED_BYTES);
});

afterEach(() => {
  cleanup();
});

describe("useExport — happy path", () => {
  it("dispatches START then SUCCESS and downloads the signed bytes", async () => {
    const dispatch = vi.fn();
    render(
      <Harness
        document={makeDocument(makeFile("contract.pdf"))}
        overlays={[makeOverlay()]}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(document.querySelector("button")!);

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: "EXPORT_SUCCESS" }),
    );

    expect(embedOverlaysIntoPdf).toHaveBeenCalledTimes(1);
    expect(downloadBytes).toHaveBeenCalledWith(
      SIGNED_BYTES,
      "contract-signed.pdf",
    );
    const types = dispatchedTypes(dispatch);
    expect(types.indexOf("EXPORT_START")).toBeLessThan(
      types.indexOf("EXPORT_SUCCESS"),
    );
    expect(types).not.toContain("EXPORT_ERROR");
  });

  it("exports a clean copy with no overlays (empty plan)", async () => {
    const dispatch = vi.fn();
    render(
      <Harness
        document={makeDocument(makeFile("empty.pdf"))}
        overlays={[]}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(document.querySelector("button")!);

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: "EXPORT_SUCCESS" }),
    );
    expect(embedOverlaysIntoPdf).toHaveBeenCalledWith(expect.anything(), []);
    expect(downloadBytes).toHaveBeenCalledWith(SIGNED_BYTES, "empty-signed.pdf");
  });
});

describe("useExport — error path", () => {
  it("dispatches EXPORT_ERROR (not a crash) when embedding fails", async () => {
    vi.mocked(embedOverlaysIntoPdf).mockRejectedValue(new Error("pdf-lib boom"));
    const dispatch = vi.fn();
    render(
      <Harness
        document={makeDocument(makeFile())}
        overlays={[makeOverlay()]}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(document.querySelector("button")!);

    await waitFor(() => {
      const errored = dispatch.mock.calls.some(
        ([a]) => (a as AppAction).type === "EXPORT_ERROR",
      );
      expect(errored).toBe(true);
    });

    const errorCall = dispatch.mock.calls.find(
      ([a]) => (a as AppAction).type === "EXPORT_ERROR",
    );
    expect((errorCall![0] as { payload: { message: string } }).payload.message)
      .toBeTruthy();
    expect(downloadBytes).not.toHaveBeenCalled();
  });
});

describe("useExport — guards", () => {
  it("does nothing when no document is loaded", async () => {
    const dispatch = vi.fn();
    render(
      <Harness document={makeDocument(null)} overlays={[]} dispatch={dispatch} />,
    );

    fireEvent.click(document.querySelector("button")!);

    // Give any (non-)async work a tick; nothing should be dispatched.
    await Promise.resolve();
    expect(dispatch).not.toHaveBeenCalled();
    expect(embedOverlaysIntoPdf).not.toHaveBeenCalled();
  });
});
