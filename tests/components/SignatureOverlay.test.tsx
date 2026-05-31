import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// react-rnd pulls in react-draggable + re-resizable, which do real DOM/measure
// work that is noisy and non-deterministic in jsdom. We stub it with a thin
// component that records the props it received, so the test can assert the
// display-only configuration (disableDragging / enableResizing=false) and the
// position/size derived from overlay state — without exercising drag internals.
const { rndProps } = vi.hoisted(() => ({
  rndProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("react-rnd", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    Rnd: (props: Record<string, unknown>) => {
      rndProps.push(props);
      // Render children inside a div so the overlay chrome is queryable.
      return React.createElement(
        "div",
        { "data-testid": "rnd-stub" },
        props.children as React.ReactNode,
      );
    },
  };
});

import { SignatureOverlay } from "@/components/overlay/SignatureOverlay";
import type { Overlay } from "@/types";

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
}

function renderOverlay(opts: RenderOpts = {}) {
  const onSelect = opts.onSelect ?? vi.fn();
  const onDelete = opts.onDelete ?? vi.fn();
  render(
    <SignatureOverlay
      overlay={opts.overlay ?? makeOverlay()}
      selected={opts.selected ?? false}
      onSelect={onSelect}
      onDelete={onDelete}
    />,
  );
  return { onSelect, onDelete };
}

function lastRndProps(): Record<string, unknown> {
  const last = rndProps[rndProps.length - 1];
  if (!last) throw new Error("Rnd was not rendered");
  return last;
}

function getOverlayBody(): HTMLElement {
  return screen.getByRole("button", { name: /signature overlay/i });
}

function queryDeleteButton(): HTMLElement | null {
  return screen.queryByRole("button", { name: /delete signature/i });
}

describe("<SignatureOverlay /> — image rendering", () => {
  it("renders an img sourced from the overlay's own snapshotted data URL", () => {
    renderOverlay({
      overlay: makeOverlay({ dataUrl: "data:image/png;base64,OWN_SIG" }),
    });
    const img = screen.getByRole("img", { name: /signature/i });
    expect(img).toHaveAttribute("src", "data:image/png;base64,OWN_SIG");
  });

  it("renders each overlay with its own image (not a shared session signature)", () => {
    const { unmount } = render(
      <SignatureOverlay
        overlay={makeOverlay({ id: "a", dataUrl: "data:image/png;base64,DRAWN" })}
        selected={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
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
      />,
    );
    expect(screen.getByRole("img", { name: /signature/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,TYPED",
    );
  });

  it("marks the image as non-draggable and non-interactive (clicks fall through to the body)", () => {
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

describe("<SignatureOverlay /> — display-only behavior (no drag/resize)", () => {
  it("disables dragging", () => {
    renderOverlay();
    expect(lastRndProps().disableDragging).toBe(true);
  });

  it("disables resizing", () => {
    renderOverlay();
    expect(lastRndProps().enableResizing).toBe(false);
  });

  it("registers no drag or resize callbacks (display-only)", () => {
    renderOverlay();
    const props = lastRndProps();
    expect(props.onDragStop).toBeUndefined();
    expect(props.onResizeStop).toBeUndefined();
    expect(props.onDrag).toBeUndefined();
    expect(props.onResize).toBeUndefined();
  });
});

describe("<SignatureOverlay /> — unselected visual state", () => {
  it("shows no delete control when unselected", () => {
    renderOverlay({ selected: false });
    expect(queryDeleteButton()).not.toBeInTheDocument();
  });

  it("shows no resize handles when unselected", () => {
    renderOverlay({ selected: false });
    const body = getOverlayBody();
    expect(body.querySelectorAll("[data-overlay-handle]").length).toBe(0);
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
    const handles = Array.from(
      getOverlayBody().querySelectorAll<HTMLElement>("[data-overlay-handle]"),
    );
    expect(handles).toHaveLength(8);
  });

  it("paints a dashed selection border when selected", () => {
    renderOverlay({ selected: true });
    expect(getOverlayBody().style.border).toContain("dashed");
  });
});

describe("<SignatureOverlay /> — selection behavior", () => {
  it("calls onSelect with the overlay id when the body is pressed", () => {
    const onSelect = vi.fn();
    renderOverlay({ overlay: makeOverlay({ id: "sel-1" }), onSelect });

    fireEvent.mouseDown(getOverlayBody());

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("sel-1");
  });

  it("stops propagation on body press so the page deselect handler doesn't fire", () => {
    const pageMouseDown = vi.fn();
    const onSelect = vi.fn();
    render(
      <div onMouseDown={pageMouseDown}>
        <SignatureOverlay
          overlay={makeOverlay({ id: "sel-1" })}
          selected={false}
          onSelect={onSelect}
          onDelete={vi.fn()}
        />
      </div>,
    );

    fireEvent.mouseDown(getOverlayBody());

    expect(onSelect).toHaveBeenCalledWith("sel-1");
    expect(pageMouseDown).not.toHaveBeenCalled();
  });
});

describe("<SignatureOverlay /> — delete behavior", () => {
  it("calls onDelete with the overlay id when the × is clicked", () => {
    const onDelete = vi.fn();
    renderOverlay({
      overlay: makeOverlay({ id: "del-1" }),
      selected: true,
      onDelete,
    });

    fireEvent.click(queryDeleteButton()!);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("del-1");
  });

  it("delete click does not also trigger onSelect", () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    renderOverlay({
      overlay: makeOverlay({ id: "del-1" }),
      selected: true,
      onSelect,
      onDelete,
    });

    const del = queryDeleteButton()!;
    fireEvent.mouseDown(del);
    fireEvent.click(del);

    expect(onDelete).toHaveBeenCalledWith("del-1");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("delete press stops propagation so the page deselect handler doesn't fire", () => {
    const pageMouseDown = vi.fn();
    render(
      <div onMouseDown={pageMouseDown}>
        <SignatureOverlay
          overlay={makeOverlay({ id: "del-1" })}
          selected
          onSelect={vi.fn()}
          onDelete={vi.fn()}
        />
      </div>,
    );

    fireEvent.mouseDown(queryDeleteButton()!);

    expect(pageMouseDown).not.toHaveBeenCalled();
  });
});
