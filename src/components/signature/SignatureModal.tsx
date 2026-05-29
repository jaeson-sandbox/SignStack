"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "@/store/useAppState";
import { captureDrawnSignature } from "@/lib/signature/captureDrawnSignature";
import { DrawTab, type DrawTabHandle } from "./DrawTab";
import { TypeTab, type TypeTabHandle } from "./TypeTab";

type SignatureTab = "draw" | "type";

// Standard focusable-element selector for the focus trap.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SignatureModal() {
  const { state, dispatch } = useAppState();
  // Local — survives close/reopen because this component stays mounted.
  // Spec: "Remembers last-used tab in local state (Draw default on first open)."
  const [activeTab, setActiveTab] = useState<SignatureTab>("draw");
  // Tracks whether the drawn canvas has strokes; gates Use Signature
  // when activeTab === "draw". Reset to true on every open.
  const [drawnIsEmpty, setDrawnIsEmpty] = useState(true);
  // Tracks whether the typed input has capturable text (non-empty AND
  // fonts loaded); gates Use Signature when activeTab === "type".
  const [typedCanCapture, setTypedCanCapture] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Element that had focus before the modal opened — restored on close.
  const previousFocusRef = useRef<HTMLElement | null>(null);
  // Imperative handles into the tab components so the modal can capture
  // on confirm and clear on reopen. Each handle is intentionally narrow.
  const drawTabRef = useRef<DrawTabHandle | null>(null);
  const typeTabRef = useRef<TypeTabHandle | null>(null);

  const isOpen = state.ui.isSignatureModalOpen;

  const close = useCallback(() => {
    dispatch({ type: "SIGNATURE_MODAL_CLOSE" });
  }, [dispatch]);

  const handleConfirm = useCallback(() => {
    let dataUrl: string | null = null;
    let signatureType: "drawn" | "typed" | null = null;

    if (activeTab === "draw") {
      const canvas = drawTabRef.current?.getCanvas();
      if (canvas) {
        dataUrl = captureDrawnSignature(canvas);
        signatureType = "drawn";
      }
    } else {
      dataUrl = typeTabRef.current?.capture() ?? null;
      signatureType = "typed";
    }

    if (!dataUrl || !signatureType) return;
    dispatch({
      type: "SIGNATURE_CREATED",
      payload: { dataUrl, type: signatureType },
    });
    dispatch({ type: "SIGNATURE_MODAL_CLOSE" });
  }, [activeTab, dispatch]);

  // Reset transient draw-tab state whenever the modal flips false → true.
  // Uses React's "store previous input" pattern (set state during render when
  // an input changes) instead of useEffect — avoids the set-state-in-effect
  // anti-pattern and the extra render it would cause.
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setDrawnIsEmpty(true);
      setTypedCanCapture(false);
    }
  }

  // Focus management: snapshot the trigger on open, focus the first focusable
  // inside the dialog. On close, restore focus to the snapshot. The canvas
  // clear() is a DOM side-effect so it lives here, not in render.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      drawTabRef.current?.clear();
      // Defer focus a frame to be safe across browsers.
      requestAnimationFrame(() => {
        const first =
          dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        first?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Keyboard handling while open: Escape closes; Tab/Shift+Tab cycle within
  // the dialog so focus can't escape to the toolbar or page controls.
  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      // Scrim. No onClick — scrim click does NOT close (story spec is silent;
      // erring on the side of preventing accidental drawing-loss in 4.3/4.4).
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-modal-title"
        className="w-full max-w-2xl rounded-lg p-6 shadow-lg"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2
            id="signature-modal-title"
            className="text-lg font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Create Signature
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div
          role="tablist"
          aria-label="Signature creation mode"
          className="mb-4 flex gap-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <TabButton
            id="signature-tab-draw"
            controls="signature-tabpanel-draw"
            label="Draw"
            isActive={activeTab === "draw"}
            onSelect={() => setActiveTab("draw")}
          />
          <TabButton
            id="signature-tab-type"
            controls="signature-tabpanel-type"
            label="Type"
            isActive={activeTab === "type"}
            onSelect={() => setActiveTab("type")}
          />
        </div>

        {activeTab === "draw" ? (
          <DrawTab ref={drawTabRef} onEmptyChange={setDrawnIsEmpty} />
        ) : (
          <TypeTab
            ref={typeTabRef}
            onCanCaptureChange={setTypedCanCapture}
          />
        )}

        <footer
          className="mt-6 flex items-center justify-end gap-2 border-t pt-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            type="button"
            onClick={close}
            className="rounded px-3 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            Cancel
          </button>
          <UseSignatureButton
            // In Draw tab: disabled until strokes exist.
            // In Type tab: disabled until text exists AND fonts have loaded
            // (TypeTab's canCapture combines both conditions).
            disabled={
              activeTab === "draw" ? drawnIsEmpty : !typedCanCapture
            }
            onConfirm={handleConfirm}
          />
        </footer>
      </div>
    </div>
  );
}

interface UseSignatureButtonProps {
  disabled: boolean;
  onConfirm: () => void;
}

function UseSignatureButton({ disabled, onConfirm }: UseSignatureButtonProps) {
  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={disabled}
      aria-disabled={disabled}
      className={`rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        backgroundColor: "var(--color-accent)",
        color: "var(--color-surface)",
      }}
    >
      Use Signature
    </button>
  );
}

interface TabButtonProps {
  id: string;
  controls: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}

function TabButton({ id, controls, label, isActive, onSelect }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-controls={controls}
      aria-selected={isActive}
      onClick={onSelect}
      className="-mb-px px-2 py-2 text-sm font-medium border-b-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{
        color: isActive
          ? "var(--color-text-primary)"
          : "var(--color-text-muted)",
        borderColor: isActive ? "var(--color-accent)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
