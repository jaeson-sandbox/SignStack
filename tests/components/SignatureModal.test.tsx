import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SignatureModal } from "@/components/signature/SignatureModal";
import { AppProvider } from "@/store/AppProvider";
import { useAppState } from "@/store/useAppState";

// Test helper: button rendered into the test tree that dispatches OPEN so the
// modal lights up through the real reducer (no dispatch mock needed).
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

function renderModal() {
  return render(
    <AppProvider>
      <OpenButton />
      <SignatureModal />
    </AppProvider>,
  );
}

function openModal() {
  fireEvent.click(screen.getByRole("button", { name: "open-modal-trigger" }));
}

describe("<SignatureModal />", () => {
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

    // The Escape handler is attached to window, so dispatch there.
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders both Draw and Type tabs with Draw active by default", () => {
    renderModal();
    openModal();

    const drawTab = screen.getByRole("tab", { name: "Draw" });
    const typeTab = screen.getByRole("tab", { name: "Type" });
    expect(drawTab).toHaveAttribute("aria-selected", "true");
    expect(typeTab).toHaveAttribute("aria-selected", "false");
    // Draw tabpanel is the one that's currently visible.
    expect(
      screen.getByText(/drawing canvas coming in story 4\.3/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/typed signature input coming in story 4\.4/i),
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByText(/typed signature input coming in story 4\.4/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/drawing canvas coming in story 4\.3/i),
    ).not.toBeInTheDocument();
  });

  it("Use Signature button is disabled (Stories 4.3 / 4.4 enable it)", () => {
    renderModal();
    openModal();

    const useBtn = screen.getByRole("button", { name: /use signature/i });
    expect(useBtn).toBeDisabled();
    expect(useBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("active tab persists across close/reopen (component stays mounted)", () => {
    renderModal();
    openModal();

    // Switch to Type.
    fireEvent.click(screen.getByRole("tab", { name: "Type" }));
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Close.
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Reopen — Type should still be the active tab.
    openModal();
    expect(screen.getByRole("tab", { name: "Type" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText(/typed signature input coming in story 4\.4/i),
    ).toBeInTheDocument();
  });
});
