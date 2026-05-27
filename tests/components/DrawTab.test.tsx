import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DrawTab, INK_COLOR_HEX } from "@/components/signature/DrawTab";

// Same mock pattern as SignatureModal tests — jsdom can't drive signature_pad.
const { mountedInstances } = vi.hoisted(() => ({
  mountedInstances: [] as Array<{ props: { penColor?: string; onEnd?: () => void } }>,
}));

vi.mock("react-signature-canvas", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  class FakeSignatureCanvas extends React.Component<{
    penColor?: string;
    onEnd?: () => void;
  }> {
    _empty = true;
    constructor(props: { penColor?: string; onEnd?: () => void }) {
      super(props);
      mountedInstances.push(this);
    }
    isEmpty() {
      return this._empty;
    }
    clear() {
      this._empty = true;
    }
    toDataURL() {
      return "data:image/png;base64,FAKE";
    }
    render() {
      return null;
    }
  }
  return { default: FakeSignatureCanvas, SignatureCanvas: FakeSignatureCanvas };
});

beforeEach(() => {
  mountedInstances.length = 0;
});

describe("<DrawTab /> — react-signature-canvas wiring", () => {
  it("passes a literal hex color to penColor (Canvas 2D ignores var() expressions)", () => {
    // Regression guard for the post-4.3-merge bug where penColor was
    // 'var(--color-ink)'. Canvas 2D silently rejects invalid color strings,
    // so strokes registered but nothing visible appeared.
    render(<DrawTab onEmptyChange={() => {}} />);

    const instance = mountedInstances.at(-1);
    expect(instance).toBeDefined();
    expect(instance!.props.penColor).toBe(INK_COLOR_HEX);
    // Belt and suspenders: must match #RRGGBB, must NOT be a var() expression.
    expect(instance!.props.penColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(instance!.props.penColor).not.toMatch(/^var\(/);
  });

  it("renders the Clear button and the Draw tabpanel", () => {
    render(<DrawTab onEmptyChange={() => {}} />);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^clear$/i })).toBeInTheDocument();
  });

  it("Clear notifies parent that the canvas is empty (onEmptyChange(true))", () => {
    const onEmptyChange = vi.fn();
    render(<DrawTab onEmptyChange={onEmptyChange} />);

    fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));

    expect(onEmptyChange).toHaveBeenCalledWith(true);
  });
});
