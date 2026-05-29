import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SignatureModal } from "@/components/signature/SignatureModal";
import { AppProvider } from "@/store/AppProvider";
import { useAppState } from "@/store/useAppState";

// jsdom's <canvas> 2D context can't run signature_pad reliably (no real path
// math), so the modal tests stub react-signature-canvas with a tiny class that
// exposes the same surface (isEmpty / clear / toDataURL + onEnd prop) and lets
// the test simulate a stroke. The pure helper test
// (tests/lib/captureDrawnSignature.test.ts) does not use this mock.
const { mountedInstances } = vi.hoisted(() => ({
  mountedInstances: [] as FakeSignatureCanvas[],
}));

// Story 4.4: mock the font loader so TypeTab doesn't try to hit Google Fonts.
// Resolved synchronously — tests can ignore the loading state.
vi.mock("@/lib/signature/fontLoader", () => ({
  loadSignatureFonts: () => Promise.resolve(),
}));

// Story 4.4: mock the typed renderer so the confirm flow returns a known URL
// without needing a working canvas backend.
vi.mock("@/lib/signature/typedSignatureRenderer", () => ({
  renderTypedSignatureToPng: ({
    text,
    fontFamily,
  }: {
    text: string;
    fontFamily: string;
  }) => `data:image/png;base64,FAKE_TYPED|${text}|${fontFamily}`,
}));

interface FakeSignatureCanvas {
  _isEmpty: boolean;
  isEmpty(): boolean;
  clear(): void;
  toDataURL(type?: string): string;
  _simulateStroke(): void;
  props: { onEnd?: () => void };
}

vi.mock("react-signature-canvas", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  class FakeSignatureCanvasImpl extends React.Component<{ onEnd?: () => void }> {
    _isEmpty = true;

    constructor(props: { onEnd?: () => void }) {
      super(props);
      mountedInstances.push(this as unknown as FakeSignatureCanvas);
    }

    isEmpty() {
      return this._isEmpty;
    }

    clear() {
      this._isEmpty = true;
    }

    toDataURL() {
      return "data:image/png;base64,FAKE_DRAWN_SIGNATURE";
    }

    _simulateStroke() {
      this._isEmpty = false;
      this.props.onEnd?.();
    }

    render() {
      return null;
    }
  }

  return {
    default: FakeSignatureCanvasImpl,
    SignatureCanvas: FakeSignatureCanvasImpl,
  };
});

function OpenButton() {
  const { dispatch } = useAppState();
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "SIGNATURE_MODAL_OPEN" })}
    >
      open-modal-trigger
    </button>
  );
}

function SignatureProbe() {
  const { state } = useAppState();
  return (
    <div data-testid="signature-probe">
      {state.signature.dataUrl ?? "no-signature"}|{state.signature.type ?? "no-type"}|
      {state.ui.isSignatureModalOpen ? "open" : "closed"}
    </div>
  );
}

function renderModal() {
  return render(
    <AppProvider>
      <OpenButton />
      <SignatureModal />
      <SignatureProbe />
    </AppProvider>,
  );
}

function openModal() {
  fireEvent.click(screen.getByRole("button", { name: "open-modal-trigger" }));
}

function getLatestCanvas(): FakeSignatureCanvas {
  const last = mountedInstances[mountedInstances.length - 1];
  if (!last) throw new Error("no SignatureCanvas mounted");
  return last;
}

function simulateStroke() {
  act(() => {
    getLatestCanvas()._simulateStroke();
  });
}

beforeEach(() => {
  mountedInstances.length = 0;
});

describe("<SignatureModal /> — shell", () => {
  it("renders nothing when isSignatureModalOpen is false", () => {
    renderModal();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Signature")).not.toBeInTheDocument();
  });

  it("renders dialog with title, scrim, and correct ARIA when open", () => {
    renderModal();
    openModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "signature-modal-title");
    expect(screen.getByText("Create Signature")).toHaveAttribute(
      "id",
      "signature-modal-title",
    );
  });

  it("clicking the × close button closes the modal", () => {
    renderModal();
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Cancel closes the modal", () => {
    renderModal();
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pressing Escape closes the modal", () => {
    renderModal();
    openModal();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("<SignatureModal /> — tabs", () => {
  it("renders both Draw and Type tabs with Draw active by default", () => {
    renderModal();
    openModal();

    const drawTab = screen.getByRole("tab", { name: "Draw" });
    const typeTab = screen.getByRole("tab", { name: "Type" });
    expect(drawTab).toHaveAttribute("aria-selected", "true");
    expect(typeTab).toHaveAttribute("aria-selected", "false");
    // Draw tabpanel marker: the Clear button only exists in the Draw tab.
    expect(screen.getByRole("button", { name: /^clear$/i })).toBeInTheDocument();
    // Type tab's "Your name" label is absent (Type tab not active).
    expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
  });

  it("clicking the Type tab switches the active tab and tabpanel", () => {
    renderModal();
    openModal();

    fireEvent.click(screen.getByRole("tab", { name: "Type" }));

    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Draw" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    // Type tabpanel content visible: the "Your name" input.
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    // Draw tab's Clear button is no longer rendered.
    expect(
      screen.queryByRole("button", { name: /^clear$/i }),
    ).not.toBeInTheDocument();
  });

  it("active tab persists across close/reopen (component stays mounted)", () => {
    renderModal();
    openModal();

    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openModal();
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });
});

describe("<SignatureModal /> — drawn signature flow", () => {
  it("Use Signature is disabled on first open (canvas empty)", () => {
    renderModal();
    openModal();

    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();
  });

  it("Use Signature enables after a stroke ends with non-empty canvas", () => {
    renderModal();
    openModal();
    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();

    simulateStroke();

    expect(screen.getByRole("button", { name: /use signature/i })).toBeEnabled();
  });

  it("Clear re-disables Use Signature and wipes the canvas", () => {
    renderModal();
    openModal();
    simulateStroke();
    expect(screen.getByRole("button", { name: /use signature/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /^clear$/i }));

    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();
    expect(getLatestCanvas().isEmpty()).toBe(true);
  });

  it("clicking Use Signature dispatches SIGNATURE_CREATED with type 'drawn' and closes the modal", () => {
    renderModal();
    openModal();
    simulateStroke();

    fireEvent.click(screen.getByRole("button", { name: /use signature/i }));

    const probe = screen.getByTestId("signature-probe");
    expect(probe).toHaveTextContent("data:image/png;base64,FAKE_DRAWN_SIGNATURE");
    expect(probe).toHaveTextContent("|drawn|");
    expect(probe).toHaveTextContent("|closed");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("on reopen, the canvas resets and Use Signature is disabled again", () => {
    renderModal();
    openModal();
    simulateStroke();
    fireEvent.click(screen.getByRole("button", { name: /use signature/i }));

    // Reopen — new SignatureCanvas instance mounted; Use Signature disabled.
    openModal();
    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();
  });
});

describe("<SignatureModal /> — typed signature flow", () => {
  it("Use Signature is disabled when Type tab is empty", () => {
    renderModal();
    openModal();

    fireEvent.click(screen.getByRole("tab", { name: "Type" }));

    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();
  });

  it("Use Signature enables after typing (fonts mocked to resolve immediately)", async () => {
    renderModal();
    openModal();

    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });

    // Microtask flush so TypeTab's font-load + canCapture effect fires.
    await act(async () => {});

    expect(screen.getByRole("button", { name: /use signature/i })).toBeEnabled();
  });

  it("clicking Use Signature dispatches SIGNATURE_CREATED with type 'typed' and closes the modal", async () => {
    renderModal();
    openModal();

    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /use signature/i }));

    const probe = screen.getByTestId("signature-probe");
    // The mock renderer encodes both text and font into the URL, so we can
    // assert it actually called the renderer with the right inputs.
    expect(probe).toHaveTextContent(
      "data:image/png;base64,FAKE_TYPED|Alex|'Dancing Script', cursive",
    );
    expect(probe).toHaveTextContent("|typed|");
    expect(probe).toHaveTextContent("|closed");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("switching font style does not clear the text", async () => {
    renderModal();
    openModal();
    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });
    await act(async () => {});

    fireEvent.click(screen.getByRole("radio", { name: "Clean" }));

    expect(screen.getByLabelText(/your name/i)).toHaveValue("Alex");
  });

  it("clearing the text re-disables Use Signature", async () => {
    renderModal();
    openModal();
    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alex" },
    });
    await act(async () => {});
    expect(screen.getByRole("button", { name: /use signature/i })).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "" },
    });

    expect(screen.getByRole("button", { name: /use signature/i })).toBeDisabled();
  });
});
