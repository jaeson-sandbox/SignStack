import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock the font loader so tests don't try to talk to Google Fonts.
const { fontLoadController } = vi.hoisted(() => ({
  fontLoadController: { resolve: (() => {}) as () => void },
}));

vi.mock("@/lib/signature/fontLoader", () => ({
  loadSignatureFonts: () =>
    new Promise<void>((resolve) => {
      fontLoadController.resolve = resolve;
    }),
}));

// Mock the renderer so the test can verify capture() returns a deterministic
// data URL without needing a working canvas backend.
vi.mock("@/lib/signature/typedSignatureRenderer", () => ({
  renderTypedSignatureToPng: ({
    text,
    fontFamily,
  }: {
    text: string;
    fontFamily: string;
  }) => `data:image/png;base64,FAKE_TYPED|${text}|${fontFamily}`,
}));

import { TypeTab, type TypeTabHandle } from "@/components/signature/TypeTab";

beforeEach(() => {
  fontLoadController.resolve = () => {};
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("<TypeTab /> — render + interactions", () => {
  it("renders the name input, all three style buttons, and the preview", () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Clean" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Script" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Formal" })).toBeInTheDocument();
    expect(
      screen.getByLabelText(/typed signature preview/i),
    ).toBeInTheDocument();
  });

  it("auto-focuses the input on mount", () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);
    expect(screen.getByLabelText(/your name/i)).toHaveFocus();
  });

  it("defaults to Script style (most signature-like)", () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "Script" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Clean" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Formal" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("clicking a style button switches the active style", () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);

    fireEvent.click(screen.getByRole("radio", { name: "Clean" }));

    expect(screen.getByRole("radio", { name: "Clean" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Script" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("preview shows 'Loading fonts…' until fontLoader resolves, then 'Preview' placeholder", async () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);

    // Before fonts resolve: loading indicator visible.
    expect(screen.getByText(/loading fonts/i)).toBeInTheDocument();

    // Resolve fonts.
    await act(async () => {
      fontLoadController.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText(/loading fonts/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("preview shows the typed text after fonts load and the user types", async () => {
    render(<TypeTab onCanCaptureChange={() => {}} />);

    await act(async () => {
      fontLoadController.resolve();
    });

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex Johnson" },
    });

    // The preview region shows the typed text. (We query within the labeled
    // region to scope past the input itself.)
    const preview = screen.getByLabelText(/typed signature preview/i);
    expect(preview).toHaveTextContent("Alex Johnson");
  });
});

describe("<TypeTab /> — canCapture reporting", () => {
  it("reports false initially (no text, fonts not loaded)", () => {
    const onCanCaptureChange = vi.fn();
    render(<TypeTab onCanCaptureChange={onCanCaptureChange} />);
    expect(onCanCaptureChange).toHaveBeenLastCalledWith(false);
  });

  it("stays false while fonts are loading even if text is typed", () => {
    const onCanCaptureChange = vi.fn();
    render(<TypeTab onCanCaptureChange={onCanCaptureChange} />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });

    // Last call should still be false (fonts unresolved).
    expect(onCanCaptureChange).toHaveBeenLastCalledWith(false);
  });

  it("flips to true once fonts load AND non-empty text exists", async () => {
    const onCanCaptureChange = vi.fn();
    render(<TypeTab onCanCaptureChange={onCanCaptureChange} />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });

    await act(async () => {
      fontLoadController.resolve();
    });

    await waitFor(() => {
      expect(onCanCaptureChange).toHaveBeenLastCalledWith(true);
    });
  });

  it("flips back to false when text is cleared", async () => {
    const onCanCaptureChange = vi.fn();
    render(<TypeTab onCanCaptureChange={onCanCaptureChange} />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });
    await act(async () => {
      fontLoadController.resolve();
    });
    await waitFor(() =>
      expect(onCanCaptureChange).toHaveBeenLastCalledWith(true),
    );

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "" },
    });
    expect(onCanCaptureChange).toHaveBeenLastCalledWith(false);
  });

  it("treats whitespace-only text as empty", async () => {
    const onCanCaptureChange = vi.fn();
    render(<TypeTab onCanCaptureChange={onCanCaptureChange} />);

    await act(async () => {
      fontLoadController.resolve();
    });
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "   " },
    });
    expect(onCanCaptureChange).toHaveBeenLastCalledWith(false);
  });
});

describe("<TypeTab /> — capture()", () => {
  it("returns null when text is empty", () => {
    const ref = createRef<TypeTabHandle>();
    render(<TypeTab ref={ref} onCanCaptureChange={() => {}} />);
    expect(ref.current?.capture()).toBeNull();
  });

  it("returns null when text is whitespace only", () => {
    const ref = createRef<TypeTabHandle>();
    render(<TypeTab ref={ref} onCanCaptureChange={() => {}} />);
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "   " },
    });
    expect(ref.current?.capture()).toBeNull();
  });

  it("returns the rendered data URL with trimmed text in the selected font", () => {
    const ref = createRef<TypeTabHandle>();
    render(<TypeTab ref={ref} onCanCaptureChange={() => {}} />);

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "  Alex  " },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Clean" }));

    expect(ref.current?.capture()).toBe(
      "data:image/png;base64,FAKE_TYPED|Alex|'Caveat', cursive",
    );
  });
});
