import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { AppProvider } from "@/store/AppProvider";
import { useAppState } from "@/store/useAppState";

// Tiny spy component that re-renders whatever it reads from context so the
// test can assert the dispatched action's effect — no jest.fn / dispatch mock
// needed because we're testing through the real reducer.
function ModalStateProbe() {
  const { state } = useAppState();
  return (
    <div data-testid="modal-open">
      {state.ui.isSignatureModalOpen ? "open" : "closed"}
    </div>
  );
}

// Seeds an export error through the real reducer so the toolbar's dismissible
// ErrorBanner can be exercised end-to-end (no dispatch mock).
function ExportErrorSeeder() {
  const { dispatch } = useAppState();
  return (
    <button
      type="button"
      onClick={() =>
        dispatch({
          type: "EXPORT_ERROR",
          payload: { message: "Export failed. Try again." },
        })
      }
    >
      seed-export-error
    </button>
  );
}

describe("<EditorToolbar />", () => {
  it("renders the SignStack wordmark and both action buttons", () => {
    render(
      <AppProvider>
        <EditorToolbar />
      </AppProvider>,
    );
    expect(screen.getByText("SignStack")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add signature/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download signed pdf/i })).toBeInTheDocument();
  });

  it("clicking Add Signature dispatches SIGNATURE_MODAL_OPEN (flips ui.isSignatureModalOpen true)", () => {
    render(
      <AppProvider>
        <EditorToolbar />
        <ModalStateProbe />
      </AppProvider>,
    );
    expect(screen.getByTestId("modal-open")).toHaveTextContent("closed");

    fireEvent.click(screen.getByRole("button", { name: /add signature/i }));

    expect(screen.getByTestId("modal-open")).toHaveTextContent("open");
  });

  it("Download Signed PDF button stays disabled (regression guard — wired in Epic 6)", () => {
    render(
      <AppProvider>
        <EditorToolbar />
      </AppProvider>,
    );
    const download = screen.getByRole("button", { name: /download signed pdf/i });
    expect(download).toBeDisabled();
    expect(download).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a dismissible export error banner and clears it on dismiss", () => {
    render(
      <AppProvider>
        <EditorToolbar />
        <ExportErrorSeeder />
      </AppProvider>,
    );
    // No error banner before an export error exists.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "seed-export-error" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Export failed. Try again.",
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss error/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
