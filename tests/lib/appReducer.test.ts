import { describe, expect, it } from "vitest";
import { appReducer, createOverlay, initialState } from "@/store/appReducer";
import type { AppState, Overlay } from "@/types";

function makeStateWithOverlays(overlays: Overlay[]): AppState {
  return { ...initialState, overlays };
}

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

describe("appReducer — initialState", () => {
  it("has all document fields cleared and empty Maps", () => {
    expect(initialState.document.file).toBeNull();
    expect(initialState.document.arrayBuffer).toBeNull();
    expect(initialState.document.pageCount).toBe(0);
    expect(initialState.document.pageDimensionsPx.size).toBe(0);
    expect(initialState.document.pageIntrinsicPt.size).toBe(0);
  });

  it("has empty signature and overlay state", () => {
    expect(initialState.signature.dataUrl).toBeNull();
    expect(initialState.signature.type).toBeNull();
    expect(initialState.overlays).toEqual([]);
    expect(initialState.selectedOverlayId).toBeNull();
    expect(initialState.currentVisiblePageIndex).toBeNull();
  });

  it("has all UI flags false and errors null", () => {
    expect(initialState.ui.isSignatureModalOpen).toBe(false);
    expect(initialState.ui.isExporting).toBe(false);
    expect(initialState.ui.uploadError).toBeNull();
    expect(initialState.ui.exportError).toBeNull();
  });
});

describe("appReducer — DOCUMENT_LOADED", () => {
  it("sets file, arrayBuffer, and pageCount", () => {
    const file = new File(["%PDF-1.7"], "doc.pdf", { type: "application/pdf" });
    const buf = new ArrayBuffer(8);
    const next = appReducer(initialState, {
      type: "DOCUMENT_LOADED",
      payload: { file, arrayBuffer: buf, pageCount: 5 },
    });
    expect(next.document.file).toBe(file);
    expect(next.document.arrayBuffer).toBe(buf);
    expect(next.document.pageCount).toBe(5);
  });

  it("clears prior overlays and selectedOverlayId", () => {
    const seeded: AppState = {
      ...initialState,
      overlays: [makeOverlay({ id: "a" }), makeOverlay({ id: "b" })],
      selectedOverlayId: "a",
    };
    const next = appReducer(seeded, {
      type: "DOCUMENT_LOADED",
      payload: {
        file: new File([], "x.pdf"),
        arrayBuffer: new ArrayBuffer(0),
        pageCount: 1,
      },
    });
    expect(next.overlays).toEqual([]);
    expect(next.selectedOverlayId).toBeNull();
  });

  it("resets page dimension Maps for the new document", () => {
    const seeded: AppState = {
      ...initialState,
      document: {
        ...initialState.document,
        pageDimensionsPx: new Map([[0, { width: 100, height: 200 }]]),
        pageIntrinsicPt: new Map([[0, { width: 50, height: 100 }]]),
      },
    };
    const next = appReducer(seeded, {
      type: "DOCUMENT_LOADED",
      payload: {
        file: new File([], "x.pdf"),
        arrayBuffer: new ArrayBuffer(0),
        pageCount: 1,
      },
    });
    expect(next.document.pageDimensionsPx.size).toBe(0);
    expect(next.document.pageIntrinsicPt.size).toBe(0);
  });

  it("clears uploadError", () => {
    const seeded: AppState = {
      ...initialState,
      ui: { ...initialState.ui, uploadError: "stale message" },
    };
    const next = appReducer(seeded, {
      type: "DOCUMENT_LOADED",
      payload: {
        file: new File([], "x.pdf"),
        arrayBuffer: new ArrayBuffer(0),
        pageCount: 1,
      },
    });
    expect(next.ui.uploadError).toBeNull();
  });
});

describe("appReducer — DOCUMENT_CLEARED", () => {
  it("resets everything (including signature) to initialState", () => {
    const seeded: AppState = {
      ...initialState,
      document: {
        ...initialState.document,
        file: new File([], "x.pdf"),
        pageCount: 3,
      },
      signature: { dataUrl: "data:image/png;base64,abc", type: "drawn" },
      overlays: [makeOverlay({ id: "a" })],
      selectedOverlayId: "a",
      ui: { ...initialState.ui, uploadError: "x", exportError: "y" },
    };
    const next = appReducer(seeded, { type: "DOCUMENT_CLEARED" });
    expect(next).toBe(initialState);
  });
});

describe("appReducer — PAGE_DIMENSIONS_SET", () => {
  it("adds an entry and returns a new Map reference", () => {
    const prevMap = initialState.document.pageDimensionsPx;
    const next = appReducer(initialState, {
      type: "PAGE_DIMENSIONS_SET",
      payload: { pageIndex: 0, widthPx: 794, heightPx: 1123 },
    });
    expect(next.document.pageDimensionsPx.get(0)).toEqual({ width: 794, height: 1123 });
    expect(next.document.pageDimensionsPx).not.toBe(prevMap);
  });

  it("does not overwrite entries for other pages", () => {
    const seeded: AppState = {
      ...initialState,
      document: {
        ...initialState.document,
        pageDimensionsPx: new Map([[0, { width: 100, height: 200 }]]),
      },
    };
    const next = appReducer(seeded, {
      type: "PAGE_DIMENSIONS_SET",
      payload: { pageIndex: 1, widthPx: 300, heightPx: 400 },
    });
    expect(next.document.pageDimensionsPx.get(0)).toEqual({ width: 100, height: 200 });
    expect(next.document.pageDimensionsPx.get(1)).toEqual({ width: 300, height: 400 });
  });
});

describe("appReducer — PAGE_INTRINSIC_SET", () => {
  it("adds an entry and returns a new Map reference", () => {
    const prevMap = initialState.document.pageIntrinsicPt;
    const next = appReducer(initialState, {
      type: "PAGE_INTRINSIC_SET",
      payload: { pageIndex: 0, widthPt: 595, heightPt: 842 },
    });
    expect(next.document.pageIntrinsicPt.get(0)).toEqual({ width: 595, height: 842 });
    expect(next.document.pageIntrinsicPt).not.toBe(prevMap);
  });

  it("does not overwrite entries for other pages", () => {
    const seeded: AppState = {
      ...initialState,
      document: {
        ...initialState.document,
        pageIntrinsicPt: new Map([[0, { width: 612, height: 792 }]]),
      },
    };
    const next = appReducer(seeded, {
      type: "PAGE_INTRINSIC_SET",
      payload: { pageIndex: 1, widthPt: 595, heightPt: 842 },
    });
    expect(next.document.pageIntrinsicPt.get(0)).toEqual({ width: 612, height: 792 });
    expect(next.document.pageIntrinsicPt.get(1)).toEqual({ width: 595, height: 842 });
  });
});

describe("appReducer — SIGNATURE_CREATED / modal", () => {
  it("SIGNATURE_CREATED sets dataUrl and type", () => {
    const next = appReducer(initialState, {
      type: "SIGNATURE_CREATED",
      payload: { dataUrl: "data:image/png;base64,xyz", type: "typed" },
    });
    expect(next.signature.dataUrl).toBe("data:image/png;base64,xyz");
    expect(next.signature.type).toBe("typed");
  });

  it("SIGNATURE_MODAL_OPEN flips ui.isSignatureModalOpen true", () => {
    const next = appReducer(initialState, { type: "SIGNATURE_MODAL_OPEN" });
    expect(next.ui.isSignatureModalOpen).toBe(true);
  });

  it("SIGNATURE_MODAL_CLOSE flips ui.isSignatureModalOpen false", () => {
    const open: AppState = {
      ...initialState,
      ui: { ...initialState.ui, isSignatureModalOpen: true },
    };
    const next = appReducer(open, { type: "SIGNATURE_MODAL_CLOSE" });
    expect(next.ui.isSignatureModalOpen).toBe(false);
  });
});

describe("appReducer — OVERLAY_ADDED", () => {
  it("appends the supplied overlay verbatim (reducer does not mint ids)", () => {
    const overlay = makeOverlay({
      id: "fixed-id-1",
      pageIndex: 0,
      x: 10,
      y: 20,
      width: 200,
      height: 80,
    });
    const next = appReducer(initialState, {
      type: "OVERLAY_ADDED",
      payload: overlay,
    });
    expect(next.overlays).toEqual([overlay]);
    // Same input → same output (determinism check).
    const next2 = appReducer(initialState, {
      type: "OVERLAY_ADDED",
      payload: overlay,
    });
    expect(next2).toEqual(next);
  });

  it("appends to existing overlays without mutating the prior array", () => {
    const a = makeOverlay({ id: "a" });
    const seeded = makeStateWithOverlays([a]);
    const b = makeOverlay({ id: "b", x: 50 });
    const next = appReducer(seeded, { type: "OVERLAY_ADDED", payload: b });
    expect(next.overlays).toEqual([a, b]);
    expect(seeded.overlays).toEqual([a]);
    expect(next.overlays).not.toBe(seeded.overlays);
  });
});

describe("createOverlay factory", () => {
  it("returns an overlay with a v4-shaped UUID id and the supplied fields", () => {
    const overlay = createOverlay({
      pageIndex: 0,
      x: 10,
      y: 20,
      width: 200,
      height: 80,
    });
    expect(overlay.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(overlay).toMatchObject({
      pageIndex: 0,
      x: 10,
      y: 20,
      width: 200,
      height: 80,
    });
  });

  it("generates a unique id on each call", () => {
    const a = createOverlay({ pageIndex: 0, x: 0, y: 0, width: 1, height: 1 });
    const b = createOverlay({ pageIndex: 0, x: 0, y: 0, width: 1, height: 1 });
    expect(a.id).not.toBe(b.id);
  });
});

describe("appReducer — OVERLAY_MOVED", () => {
  it("updates only x/y of the targeted overlay", () => {
    const a = makeOverlay({ id: "a", x: 0, y: 0 });
    const b = makeOverlay({ id: "b", x: 100, y: 100 });
    const seeded = makeStateWithOverlays([a, b]);
    const next = appReducer(seeded, {
      type: "OVERLAY_MOVED",
      payload: { id: "a", x: 50, y: 60 },
    });
    expect(next.overlays[0]).toEqual({ ...a, x: 50, y: 60 });
    expect(next.overlays[1]).toBe(b);
  });
});

describe("appReducer — OVERLAY_RESIZED", () => {
  it("updates x/y/width/height of the targeted overlay", () => {
    const a = makeOverlay({ id: "a" });
    const b = makeOverlay({ id: "b" });
    const seeded = makeStateWithOverlays([a, b]);
    const next = appReducer(seeded, {
      type: "OVERLAY_RESIZED",
      payload: { id: "a", x: 5, y: 6, width: 300, height: 120 },
    });
    expect(next.overlays[0]).toEqual({
      ...a,
      x: 5,
      y: 6,
      width: 300,
      height: 120,
    });
    expect(next.overlays[1]).toBe(b);
  });
});

describe("appReducer — OVERLAY_DELETED", () => {
  it("removes only the targeted overlay", () => {
    const a = makeOverlay({ id: "a" });
    const b = makeOverlay({ id: "b" });
    const seeded = makeStateWithOverlays([a, b]);
    const next = appReducer(seeded, {
      type: "OVERLAY_DELETED",
      payload: { id: "a" },
    });
    expect(next.overlays).toEqual([b]);
  });

  it("clears selectedOverlayId if the deleted overlay was selected", () => {
    const a = makeOverlay({ id: "a" });
    const seeded: AppState = { ...makeStateWithOverlays([a]), selectedOverlayId: "a" };
    const next = appReducer(seeded, {
      type: "OVERLAY_DELETED",
      payload: { id: "a" },
    });
    expect(next.selectedOverlayId).toBeNull();
  });

  it("preserves selectedOverlayId if a different overlay was deleted", () => {
    const a = makeOverlay({ id: "a" });
    const b = makeOverlay({ id: "b" });
    const seeded: AppState = {
      ...makeStateWithOverlays([a, b]),
      selectedOverlayId: "a",
    };
    const next = appReducer(seeded, {
      type: "OVERLAY_DELETED",
      payload: { id: "b" },
    });
    expect(next.selectedOverlayId).toBe("a");
  });
});

describe("appReducer — OVERLAY_SELECTED", () => {
  it("sets selectedOverlayId to a string id", () => {
    const next = appReducer(initialState, {
      type: "OVERLAY_SELECTED",
      payload: { id: "abc" },
    });
    expect(next.selectedOverlayId).toBe("abc");
  });

  it("accepts null to deselect", () => {
    const seeded: AppState = { ...initialState, selectedOverlayId: "abc" };
    const next = appReducer(seeded, {
      type: "OVERLAY_SELECTED",
      payload: { id: null },
    });
    expect(next.selectedOverlayId).toBeNull();
  });
});

describe("appReducer — EXPORT_*", () => {
  it("EXPORT_START sets isExporting true and clears exportError", () => {
    const seeded: AppState = {
      ...initialState,
      ui: { ...initialState.ui, exportError: "stale" },
    };
    const next = appReducer(seeded, { type: "EXPORT_START" });
    expect(next.ui.isExporting).toBe(true);
    expect(next.ui.exportError).toBeNull();
  });

  it("EXPORT_SUCCESS clears isExporting and exportError", () => {
    const seeded: AppState = {
      ...initialState,
      ui: { ...initialState.ui, isExporting: true, exportError: "stale" },
    };
    const next = appReducer(seeded, { type: "EXPORT_SUCCESS" });
    expect(next.ui.isExporting).toBe(false);
    expect(next.ui.exportError).toBeNull();
  });

  it("EXPORT_ERROR clears isExporting and sets the message", () => {
    const seeded: AppState = {
      ...initialState,
      ui: { ...initialState.ui, isExporting: true },
    };
    const next = appReducer(seeded, {
      type: "EXPORT_ERROR",
      payload: { message: "Failed to write PDF" },
    });
    expect(next.ui.isExporting).toBe(false);
    expect(next.ui.exportError).toBe("Failed to write PDF");
  });
});

describe("appReducer — UPLOAD_ERROR / UPLOAD_ERROR_CLEAR", () => {
  it("UPLOAD_ERROR stores the message in ui.uploadError", () => {
    const next = appReducer(initialState, {
      type: "UPLOAD_ERROR",
      payload: { message: "Too large" },
    });
    expect(next.ui.uploadError).toBe("Too large");
  });

  it("UPLOAD_ERROR_CLEAR nulls ui.uploadError", () => {
    const seeded: AppState = {
      ...initialState,
      ui: { ...initialState.ui, uploadError: "Too large" },
    };
    const next = appReducer(seeded, { type: "UPLOAD_ERROR_CLEAR" });
    expect(next.ui.uploadError).toBeNull();
  });
});

describe("appReducer — CURRENT_PAGE_CHANGED", () => {
  it("sets currentVisiblePageIndex to the given page index", () => {
    const next = appReducer(initialState, {
      type: "CURRENT_PAGE_CHANGED",
      payload: { pageIndex: 7 },
    });
    expect(next.currentVisiblePageIndex).toBe(7);
  });

  it("accepts null to clear the current page", () => {
    const seeded: AppState = { ...initialState, currentVisiblePageIndex: 3 };
    const next = appReducer(seeded, {
      type: "CURRENT_PAGE_CHANGED",
      payload: { pageIndex: null },
    });
    expect(next.currentVisiblePageIndex).toBeNull();
  });

  it("does not touch other state slices", () => {
    const overlay = makeOverlay({ id: "keep-me" });
    const seeded: AppState = {
      ...initialState,
      overlays: [overlay],
      selectedOverlayId: "keep-me",
    };
    const next = appReducer(seeded, {
      type: "CURRENT_PAGE_CHANGED",
      payload: { pageIndex: 2 },
    });
    expect(next.overlays).toBe(seeded.overlays);
    expect(next.selectedOverlayId).toBe("keep-me");
    expect(next.document).toBe(seeded.document);
  });
});

describe("appReducer — DOCUMENT_LOADED resets currentVisiblePageIndex", () => {
  it("clears a previously-set currentVisiblePageIndex when a new document loads", () => {
    const seeded: AppState = { ...initialState, currentVisiblePageIndex: 5 };
    const file = new File(["%PDF-1.7"], "doc.pdf", { type: "application/pdf" });
    const next = appReducer(seeded, {
      type: "DOCUMENT_LOADED",
      payload: { file, arrayBuffer: new ArrayBuffer(8), pageCount: 3 },
    });
    expect(next.currentVisiblePageIndex).toBeNull();
  });
});
