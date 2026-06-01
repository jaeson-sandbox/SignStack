import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useKeyboardOverlay } from "@/hooks/useKeyboardOverlay";
import type { AppAction, Overlay } from "@/types";

function makeOverlay(partial: Partial<Overlay> = {}): Overlay {
  return {
    id: partial.id ?? "ov-1",
    pageIndex: partial.pageIndex ?? 0,
    dataUrl: partial.dataUrl ?? "data:image/png;base64,FAKE",
    x: partial.x ?? 100,
    y: partial.y ?? 100,
    width: partial.width ?? 200,
    height: partial.height ?? 80,
  };
}

interface HarnessProps {
  selectedOverlay: Overlay | null;
  pageDimPx?: { width: number; height: number } | null;
  isModalOpen?: boolean;
  dispatch: React.Dispatch<AppAction>;
}

function Harness({
  selectedOverlay,
  pageDimPx = { width: 794, height: 1028 },
  isModalOpen = false,
  dispatch,
}: HarnessProps) {
  useKeyboardOverlay({ selectedOverlay, pageDimPx, isModalOpen, dispatch });
  return null;
}

function press(key: string, opts: { shiftKey?: boolean } = {}) {
  fireEvent.keyDown(window, { key, shiftKey: opts.shiftKey ?? false });
}

afterEach(() => {
  cleanup();
});

describe("useKeyboardOverlay — nudge", () => {
  it("ArrowRight nudges +1px x via OVERLAY_MOVED", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 100 })} dispatch={dispatch} />);

    press("ArrowRight");

    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 101, y: 100 },
    });
  });

  it("ArrowLeft nudges -1px x", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 100 })} dispatch={dispatch} />);
    press("ArrowLeft");
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 99, y: 100 },
    });
  });

  it("ArrowUp nudges -1px y", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 100 })} dispatch={dispatch} />);
    press("ArrowUp");
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 100, y: 99 },
    });
  });

  it("ArrowDown nudges +1px y", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 100 })} dispatch={dispatch} />);
    press("ArrowDown");
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 100, y: 101 },
    });
  });

  it("Shift+ArrowUp nudges 8px", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 100 })} dispatch={dispatch} />);
    press("ArrowUp", { shiftKey: true });
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 100, y: 92 },
    });
  });
});

describe("useKeyboardOverlay — clamping", () => {
  it("does not dispatch when already at the left edge and pressing ArrowLeft", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 0, y: 100 })} dispatch={dispatch} />);
    press("ArrowLeft");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not dispatch at the top edge pressing ArrowUp", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 0 })} dispatch={dispatch} />);
    press("ArrowUp");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not dispatch at the right edge pressing ArrowRight", () => {
    const dispatch = vi.fn();
    // maxX = 794 - 200 = 594
    render(<Harness selectedOverlay={makeOverlay({ x: 594, y: 100 })} dispatch={dispatch} />);
    press("ArrowRight");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not dispatch at the bottom edge pressing ArrowDown", () => {
    const dispatch = vi.fn();
    // maxY = 1028 - 80 = 948
    render(<Harness selectedOverlay={makeOverlay({ x: 100, y: 948 })} dispatch={dispatch} />);
    press("ArrowDown");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("partially clamps an 8px nudge near the right edge", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ x: 591, y: 100 })} dispatch={dispatch} />);
    press("ArrowRight", { shiftKey: true });
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_MOVED",
      payload: { id: "ov-1", x: 594, y: 100 },
    });
  });

  it("does not nudge when page dimensions are unknown", () => {
    const dispatch = vi.fn();
    render(
      <Harness
        selectedOverlay={makeOverlay({ x: 100, y: 100 })}
        pageDimPx={null}
        dispatch={dispatch}
      />,
    );
    press("ArrowRight");
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("useKeyboardOverlay — delete", () => {
  it("Delete dispatches OVERLAY_DELETED for the selected overlay", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ id: "del-me" })} dispatch={dispatch} />);
    press("Delete");
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_DELETED",
      payload: { id: "del-me" },
    });
  });

  it("Backspace dispatches OVERLAY_DELETED", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay({ id: "del-me" })} dispatch={dispatch} />);
    press("Backspace");
    expect(dispatch).toHaveBeenCalledWith({
      type: "OVERLAY_DELETED",
      payload: { id: "del-me" },
    });
  });
});

describe("useKeyboardOverlay — guards", () => {
  it("does nothing when no overlay is selected (no listener attached)", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={null} dispatch={dispatch} />);
    press("ArrowRight");
    press("Delete");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does nothing while the signature modal is open", () => {
    const dispatch = vi.fn();
    render(
      <Harness
        selectedOverlay={makeOverlay()}
        isModalOpen
        dispatch={dispatch}
      />,
    );
    press("ArrowRight");
    press("Delete");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ignores keys while focus is in a text input (does not hijack typing)", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowRight" });
    fireEvent.keyDown(input, { key: "Backspace" });
    document.body.removeChild(input);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("ignores non-handled keys (e.g. a letter)", () => {
    const dispatch = vi.fn();
    render(<Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />);
    press("a");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("detaches the listener after the selection clears", () => {
    const dispatch = vi.fn();
    const { rerender } = render(
      <Harness selectedOverlay={makeOverlay()} dispatch={dispatch} />,
    );
    rerender(<Harness selectedOverlay={null} dispatch={dispatch} />);
    press("ArrowRight");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
