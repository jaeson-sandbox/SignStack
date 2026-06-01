import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// react-rnd pulls in react-draggable + re-resizable, which do real DOM/measure
// work that is noisy and non-deterministic in jsdom. We stub it with a thin
// component that records the props it received, so the test can assert the
// drag/resize configuration and invoke the captured onDragStop / onResizeStop
// callbacks directly — without exercising drag internals.
const { rndProps } = vi.hoisted(() => ({
  rndProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("react-rnd", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    Rnd: (props: Record<string, unknown>) => {
      rndProps.push(props);
      return React.createElement(
        "div",
        { "data-testid": "rnd-stub" },
        props.children as React.ReactNode,
      );
    },
  };
});

import {
  SignatureOverlay,
  OVERLAY_DELETE_Z_INDEX,
} from "@/components/overlay/SignatureOverlay";
import type { Overlay } from "@/types";

// re-resizable renders its resize handles with this zIndex (its `edgeBase`
// style). The delete × overlaps the topRight handle exactly, so it must stack
// strictly above this value or clicks start a resize instead of deleting.
const RE_RESIZABLE_HANDLE_Z_INDEX = 1;

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "overlay-1",
    pageIndex: partial.pageIndex ?? 0,
    dataUrl: partial.dataUrl ?? "data:image/png;base64,FAKE_SIG",
    x: partial.x ?? 554,
    y: partial.y ?? 897,
    width: partial.width ?? 200,
    height: partial.height ?? 80,
  };
}

interface RenderOpts {
  overlay?: Overlay;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onResize?: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
}

function renderOverlay(opts: RenderOpts = {}) {
  const onSelect = opts.onSelect ?? vi.fn();
  const onDelete = opts.onDelete ?? vi.fn();
  const onMove = opts.onMove ?? vi.fn();
  const onResize = opts.onResize ?? vi.fn();
  render(
    <SignatureOverlay
      overlay={opts.overlay ?? makeOverlay()}
      selected={opts.selected ?? false}
      onSelect={onSelect}
      onDelete={onDelete}
      onMove={onMove}
      onResize={onResize}
    />,
  );
  return { onSelect, onDelete, onMove, onResize };
}

function lastRndProps(): Record<string, unknown> {
  const last = rndProps[rndProps.length - 1];
  if (!last) throw new Error("Rnd was not rendered");
  return last;
}

/** The inner wrapper div is the image's parent. */
function getOverlayBody(): HTMLElement {
  const parent = screen.getByRole("img", { name: /signature/i }).parentElement;
  if (!parent) throw new Error("overlay body not found");
  return parent;
}

function queryDeleteButton(): HTMLElement | null {
  return screen.queryByRole("button", { name: /delete signature/i });
}

// Minimal callback shapes for invoking the captured react-rnd handlers.
type DragCb = (e: unknown, data: { x: number; y: number }) => void;
type ResizeCb = (
  e: unknown,
  dir: unknown,
  ref: { offsetWidth: number; offsetHeight: number },
  delta: unknown,
  position: { x: number; y: number },
) => void;
type StartCb = (e: unknown, data: unknown) => void;

describe("<SignatureOverlay /> — image rendering", () => {
  it("renders an img sourced from the overlay's own snapshotted data URL", () => {
    renderOverlay({
      overlay: makeOverlay({ dataUrl: "data:image/png;base64,OWN_SIG" }),
    });
    expect(screen.getByRole("img", { name: /signature/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,OWN_SIG",
    );
  });

  it("renders each overlay with its own image (not a shared session signature)", () => {
    const { unmount } = render(
      <SignatureOverlay
        overlay={makeOverlay({ id: "a", dataUrl: "data:image/png;base64,DRAWN" })}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: /signature/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,DRAWN",
    );
    unmount();

    render(
      <SignatureOverlay
        overlay={makeOverlay({ id: "b", dataUrl: "data:image/png;base64,TYPED" })}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onMove={vi.fn()}
        onResize={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: /signature/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,TYPED",
    );
  });

  it("keeps the image itself non-interactive so gestures reach react-rnd", () => {
    renderOverlay();
    const img = screen.getByRole("img", { name: /signature/i });
    expect(img).toHaveAttribute("draggable", "false");
    expect(img.style.pointerEvents).toBe("none");
  });
});

describe("<SignatureOverlay /> — position and size from overlay state", () => {
  it("passes overlay x/y as the Rnd position", () => {
    renderOverlay({ overlay: makeOverlay({ x: 123, y: 456 }) });
    expect(lastRndProps().position).toEqual({ x: 123, y: 456 });
  });

  it("passes overlay width/height as the Rnd size", () => {
    renderOverlay({ overlay: makeOverlay({ width: 220, height: 95 }) });
    expect(lastRndProps().size).toEqual({ width: 220, height: 95 });
  });
});

describe("<SignatureOverlay /> — drag/resize configuration", () => {
  it("enables dragging", () => {
    renderOverlay();
    expect(lastRndProps().disableDragging).toBe(false);
  });

  it("enables all 8 resize handles when selected", () => {
    renderOverlay({ selected: true });
    expect(lastRndProps().enableResizing).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
      topRight: true,
      bottomRight: true,
      bottomLeft: true,
      topLeft: true,
    });
  });

  it("disables resizing when not selected", () => {
    renderOverlay({ selected: false });
    expect(lastRndProps().enableResizing).toBe(false);
  });

  it("clamps interaction to the page container via bounds='parent'", () => {
    renderOverlay();
    expect(lastRndProps().bounds).toBe("parent");
  });

  it("sets the minimum size (40 × 20)", () => {
    renderOverlay();
    expect(lastRndProps().minWidth).toBe(40);
    expect(lastRndProps().minHeight).toBe(20);
  });

  it("does not lock the aspect ratio", () => {
    renderOverlay();
    expect(lastRndProps().lockAspectRatio).toBe(false);
  });

  it("excludes the delete control from drag via the cancel selector", () => {
    renderOverlay();
    expect(lastRndProps().cancel).toBe(".signature-overlay-delete");
  });
});

describe("<SignatureOverlay /> — drag behavior", () => {
  it("selects the overlay when a drag starts", () => {
    const { onSelect } = renderOverlay({ overlay: makeOverlay({ id: "d-1" }) });
    (lastRndProps().onDragStart as StartCb)({}, {});
    expect(onSelect).toHaveBeenCalledWith("d-1");
  });

  it("dispatches move with rounded x/y on drag stop", () => {
    const { onMove } = renderOverlay({ overlay: makeOverlay({ id: "d-1" }) });
    (lastRndProps().onDragStop as DragCb)({}, { x: 120.6, y: 60.4 });
    expect(onMove).toHaveBeenCalledWith("d-1", 121, 60);
  });

  it("renders at full opacity when idle", () => {
    renderOverlay();
    expect((lastRndProps().style as React.CSSProperties).opacity).toBe(1);
  });

  it("shows 85% opacity while dragging", () => {
    renderOverlay();
    act(() => {
      (lastRndProps().onDrag as DragCb)({}, { x: 10, y: 10 });
    });
    expect((lastRndProps().style as React.CSSProperties).opacity).toBe(0.85);
  });
});

describe("<SignatureOverlay /> — resize behavior", () => {
  it("selects the overlay when a resize starts", () => {
    const { onSelect } = renderOverlay({
      overlay: makeOverlay({ id: "r-1" }),
      selected: true,
    });
    (lastRndProps().onResizeStart as StartCb)({}, {});
    expect(onSelect).toHaveBeenCalledWith("r-1");
  });

  it("dispatches resize with the committed position and offset dimensions", () => {
    const { onResize } = renderOverlay({
      overlay: makeOverlay({ id: "r-1" }),
      selected: true,
    });
    (lastRndProps().onResizeStop as ResizeCb)(
      {},
      "bottomRight",
      { offsetWidth: 150, offsetHeight: 70 },
      {},
      { x: 10.2, y: 20.8 },
    );
    expect(onResize).toHaveBeenCalledWith("r-1", 10, 21, 150, 70);
  });
});

describe("<SignatureOverlay /> — unselected visual state", () => {
  it("shows no delete control when unselected", () => {
    renderOverlay({ selected: false });
    expect(queryDeleteButton()).not.toBeInTheDocument();
  });

  it("shows no resize-handle markers when unselected", () => {
    renderOverlay({ selected: false });
    expect(
      getOverlayBody().querySelectorAll("[data-overlay-handle]").length,
    ).toBe(0);
  });

  it("does not paint a dashed border when unselected", () => {
    renderOverlay({ selected: false });
    expect(getOverlayBody().style.border).not.toContain("dashed");
  });
});

describe("<SignatureOverlay /> — selected visual state", () => {
  it("renders the delete control when selected", () => {
    renderOverlay({ selected: true });
    expect(queryDeleteButton()).toBeInTheDocument();
  });

  it("renders 8 resize-handle markers when selected", () => {
    renderOverlay({ selected: true });
    expect(
      getOverlayBody().querySelectorAll("[data-overlay-handle]").length,
    ).toBe(8);
  });

  it("paints a dashed selection border when selected", () => {
    renderOverlay({ selected: true });
    expect(getOverlayBody().style.border).toContain("dashed");
  });
});

describe("<SignatureOverlay /> — delete behavior", () => {
  it("calls onDelete with the overlay id when the × is clicked", () => {
    const { onDelete } = renderOverlay({
      overlay: makeOverlay({ id: "del-1" }),
      selected: true,
    });
    fireEvent.click(queryDeleteButton()!);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("del-1");
  });

  it("delete click does not trigger move or resize", () => {
    const { onMove, onResize } = renderOverlay({
      overlay: makeOverlay({ id: "del-1" }),
      selected: true,
    });
    fireEvent.click(queryDeleteButton()!);
    expect(onMove).not.toHaveBeenCalled();
    expect(onResize).not.toHaveBeenCalled();
  });

  it("delete click does not merely deselect (no onSelect)", () => {
    const { onSelect, onDelete } = renderOverlay({
      overlay: makeOverlay({ id: "del-1" }),
      selected: true,
    });
    fireEvent.click(queryDeleteButton()!);
    expect(onDelete).toHaveBeenCalledWith("del-1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("delete button class matches the react-rnd cancel selector", () => {
    renderOverlay({ selected: true });
    // The cancel prop tells react-draggable which element must NOT start a drag.
    // If it stops matching the button's class, a delete press starts a drag.
    const cancel = lastRndProps().cancel as string;
    expect(cancel.startsWith(".")).toBe(true);
    const cancelClass = cancel.slice(1);
    expect(queryDeleteButton()!).toHaveClass(cancelClass);
  });

  it("delete button stacks above re-resizable's handles (regression: zIndex tie)", () => {
    // The topRight resize handle overlaps the × exactly; a zIndex tie let the
    // handle swallow the click and start a resize instead of deleting.
    expect(OVERLAY_DELETE_Z_INDEX).toBeGreaterThan(RE_RESIZABLE_HANDLE_Z_INDEX);
    renderOverlay({ selected: true });
    expect(queryDeleteButton()!.style.zIndex).toBe(String(OVERLAY_DELETE_Z_INDEX));
  });
});
