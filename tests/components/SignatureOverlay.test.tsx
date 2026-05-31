import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
      // Render children inside a div so the <img> is queryable.
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

function lastRndProps(): Record<string, unknown> {
  const last = rndProps[rndProps.length - 1];
  if (!last) throw new Error("Rnd was not rendered");
  return last;
}

describe("<SignatureOverlay /> — image rendering", () => {
  it("renders an img sourced from the overlay's own snapshotted data URL", () => {
    render(
      <SignatureOverlay
        overlay={makeOverlay({ dataUrl: "data:image/png;base64,OWN_SIG" })}
      />,
    );
    const img = screen.getByRole("img", { name: /signature/i });
    expect(img).toHaveAttribute("src", "data:image/png;base64,OWN_SIG");
  });

  it("renders each overlay with its own image (not a shared session signature)", () => {
    // Two overlays with different snapshotted dataUrls must show different srcs.
    const { unmount } = render(
      <SignatureOverlay
        overlay={makeOverlay({ id: "a", dataUrl: "data:image/png;base64,DRAWN" })}
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
      />,
    );
    expect(screen.getByRole("img", { name: /signature/i })).toHaveAttribute(
      "src",
      "data:image/png;base64,TYPED",
    );
  });

  it("marks the image as non-draggable and non-interactive (display-only)", () => {
    render(<SignatureOverlay overlay={makeOverlay()} />);
    const img = screen.getByRole("img", { name: /signature/i });
    expect(img).toHaveAttribute("draggable", "false");
    expect(img.style.pointerEvents).toBe("none");
  });
});

describe("<SignatureOverlay /> — position and size from overlay state", () => {
  it("passes overlay x/y as the Rnd position", () => {
    render(<SignatureOverlay overlay={makeOverlay({ x: 123, y: 456 })} />);
    expect(lastRndProps().position).toEqual({ x: 123, y: 456 });
  });

  it("passes overlay width/height as the Rnd size", () => {
    render(<SignatureOverlay overlay={makeOverlay({ width: 220, height: 95 })} />);
    expect(lastRndProps().size).toEqual({ width: 220, height: 95 });
  });
});

describe("<SignatureOverlay /> — display-only behavior (no drag/resize)", () => {
  it("disables dragging", () => {
    render(<SignatureOverlay overlay={makeOverlay()} />);
    expect(lastRndProps().disableDragging).toBe(true);
  });

  it("disables resizing", () => {
    render(<SignatureOverlay overlay={makeOverlay()} />);
    expect(lastRndProps().enableResizing).toBe(false);
  });

  it("registers no drag or resize callbacks (display-only)", () => {
    render(<SignatureOverlay overlay={makeOverlay()} />);
    const props = lastRndProps();
    expect(props.onDragStop).toBeUndefined();
    expect(props.onResizeStop).toBeUndefined();
    expect(props.onDrag).toBeUndefined();
    expect(props.onResize).toBeUndefined();
  });

  it("does not render a selection border or delete control (unselected state)", () => {
    render(<SignatureOverlay overlay={makeOverlay()} />);
    // No delete / close affordance in the display-only story.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
