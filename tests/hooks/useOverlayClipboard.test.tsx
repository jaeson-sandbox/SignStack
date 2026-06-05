import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useOverlayClipboard } from "@/hooks/useOverlayClipboard";
import { SAME_PAGE_PASTE_OFFSET_PX } from "@/lib/overlay/overlayClipboard";
import type { AppAction, Overlay } from "@/types";

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

const DEFAULT_DIMS = new Map<number, { width: number; height: number }>([
  [0, { width: 794, height: 1028 }],
  [1, { width: 794, height: 1028 }],
]);

interface HarnessProps {
  selectedOverlay: Overlay | null;
  currentVisiblePageIndex?: number | null;
  pageDimensionsPx?: Map<number, { width: number; height: number }>;
  isModalOpen?: boolean;
  dispatch: React.Dispatch<AppAction>;
}

function Harness({
  selectedOverlay,
  currentVisiblePageIndex = 0,
  pageDimensionsPx = DEFAULT_DIMS,
  isModalOpen = false,
  dispatch,
}: HarnessProps) {
  useOverlayClipboard({
    selectedOverlay,
    currentVisiblePageIndex,
    pageDimensionsPx,
    isModalOpen,
    dispatch,
  });
  return null;
}

function copy(opts: { meta?: boolean } = {}) {
  fireEvent.keyDown(window, {
    key: "c",
    ctrlKey: !opts.meta,
    metaKey: !!opts.meta,
  });
}

function paste(opts: { meta?: boolean } = {}) {
  fireEvent.keyDown(window, {
    key: "v",
    ctrlKey: !opts.meta,
    metaKey: !!opts.meta,
  });
}

/** Find the OVERLAY_ADDED action among dispatch calls, if any. */
function addedOverlay(dispatch: ReturnType<typeof vi.fn>): Overlay | null {
  const call = dispatch.mock.calls.find(
    ([action]) => (action as AppAction).type === "OVERLAY_ADDED",
  );
  return call ? ((call[0] as { payload: Overlay }).payload) : null;
}

afterEach(() => {
  cleanup();
});

describe("useOverlayClipboard — copy then paste (same page)", () => {
  it("paste adds an independent overlay with a new id and the copied payload", () => {
    const dispatch = vi.fn();
    const original = makeOverlay({
      id: "orig",
      pageIndex: 0,
      x: 100,
      y: 120,
      width: 200,
      height: 80,
      dataUrl: "data:image/png;base64,SIG",
    });
    render(
      <Harness selectedOverlay={original} currentVisiblePageIndex={0} dispatch={dispatch} />,
    );

    copy();
    paste();

    const added = addedOverlay(dispatch);
    expect(added).not.toBeNull();
    expect(added!.id).not.toBe("orig");
    expect(added!.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(added!.dataUrl).toBe("data:image/png;base64,SIG");
    expect(added!.width).toBe(200);
    expect(added!.height).toBe(80);
    expect(added!.pageIndex).toBe(0);
    // Same-page paste is offset down-right.
    expect(added!.x).toBe(100 + SAME_PAGE_PASTE_OFFSET_PX);
    expect(added!.y).toBe(120 + SAME_PAGE_PASTE_OFFSET_PX);
  });

  it("selects the pasted overlay after paste", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);

    copy();
    paste();

    const added = addedOverlay(dispatch);
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_SELECTED",
      payload: { id: added!.id },
    });
    // OVERLAY_ADDED must come before OVERLAY_SELECTED.
    const types = dispatch.mock.calls.map(([a]) => (a as AppAction).type);
    expect(types.indexOf("OVERLAY_ADDED")).toBeLessThan(
      types.indexOf("OVERLAY_SELECTED"),
    );
  });

  it("supports Cmd+C / Cmd+V (macOS)", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);

    copy({ meta: true });
    paste({ meta: true });

    expect(addedOverlay(dispatch)).not.toBeNull();
  });
});

describe("useOverlayClipboard — cross-page paste", () => {
  it("pastes onto the current visible page, preserving the source position", () => {
    const dispatch = vi.fn();
    const original = makeOverlay({ pageIndex: 0, x: 100, y: 120 });
    const { rerender } = render(
      <Harness selectedOverlay={original} currentVisiblePageIndex={0} dispatch={dispatch} />,
    );

    copy();
    // User scrolls to page 1, deselects (selectedOverlay can be null now).
    rerender(
      <Harness selectedOverlay={null} currentVisiblePageIndex={1} dispatch={dispatch} />,
    );
    paste();

    const added = addedOverlay(dispatch);
    expect(added).not.toBeNull();
    expect(added!.pageIndex).toBe(1);
    expect(added!.x).toBe(100); // no same-page offset across pages
    expect(added!.y).toBe(120);
  });

  it("clamps the pasted overlay to a narrower destination page", () => {
    const dispatch = vi.fn();
    const dims = new Map([
      [0, { width: 794, height: 1028 }],
      [1, { width: 400, height: 600 }],
    ]);
    const original = makeOverlay({ pageIndex: 0, x: 700, y: 700, width: 200, height: 80 });
    const { rerender } = render(
      <Harness
        selectedOverlay={original}
        currentVisiblePageIndex={0}
        pageDimensionsPx={dims}
        dispatch={dispatch}
      />,
    );

    copy();
    rerender(
      <Harness
        selectedOverlay={null}
        currentVisiblePageIndex={1}
        pageDimensionsPx={dims}
        dispatch={dispatch}
      />,
    );
    paste();

    const added = addedOverlay(dispatch);
    // maxX = 400-200 = 200, maxY = 600-80 = 520.
    expect(added!.x).toBe(200);
    expect(added!.y).toBe(520);
  });
});

describe("useOverlayClipboard — guards", () => {
  it("copy does nothing when no overlay is selected", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={null} dispatch={dispatch} />);
    copy();
    paste();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("paste does nothing when the clipboard is empty", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);
    paste(); // no prior copy
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing while the signature modal is open", () => {
    const dispatch = vi.fn();
    render(
      <Harness selectedOverlay={makeOverlay()} isModalOpen dispatch={dispatch} />,
    );
    copy();
    paste();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ignores copy/paste while focus is in a text input", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "c", ctrlKey: true });
    fireEvent.keyDown(input, { key: "v", ctrlKey: true });
    document.body.removeChild(input);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not paste when the destination page has no measured dimensions", () => {
    const dispatch = vi.fn();
    render(
      <Harness
        selectedOverlay={makeOverlay({ pageIndex: 0 })}
        currentVisiblePageIndex={5} // not in DEFAULT_DIMS
        dispatch={dispatch}
      />,
    );
    copy();
    paste();
    // copy populated the clipboard but paste can't clamp → no dispatch at all.
    expect(addedOverlay(dispatch)).toBeNull();
  });

  it("ignores plain c / v without a modifier", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);
    fireEvent.keyDown(window, { key: "c" });
    fireEvent.keyDown(window, { key: "v" });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
