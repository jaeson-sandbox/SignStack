"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "@/store/useAppState";
import { useOverlays } from "@/hooks/useOverlays";
import { captureDrawnSignature } from "@/lib/signature/captureDrawnSignature";
import { resolveSignaturePlacement } from "@/lib/signature/signaturePlacement";
import { DrawTab, type DrawTabHandle } from "./DrawTab";
import { TypeTab, type TypeTabHandle } from "./TypeTab";

type SignatureTab = "draw" | "type";

// Standard focusable-element selector for the focus trap.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SignatureModal() {
  const { state, dispatch } = useAppState();
  const { addOverlay } = useOverlays();
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
  const existingSignatureDataUrl = state.signature.dataUrl;
  const hasExistingSignature = existingSignatureDataUrl !== null;
  // True when the user has drawn/typed something new this open. Reuse mode is
  // when this is false but a session signature already exists (Story 6.2).
  const hasNewInput =
    activeTab === "draw" ? !drawnIsEmpty : typedCanCapture;
  // Use Signature is enabled when there's something to place: new input, or an
  // existing session signature to reuse.
  const canConfirm = hasNewInput || hasExistingSignature;

  const close = useCallback(() => {
    dispatch({ type: "SIGNATURE_MODAL_CLOSE" });
  }, [dispatch]);

  const handleConfirm = useCallback(() => {
    // Capture freshly drawn/typed input only when there is some; otherwise the
    // user is reusing the existing session signature (Story 6.2 "Add Another").
    let captured: { dataUrl: string; type: "drawn" | "typed" } | null = null;
    if (hasNewInput) {
      if (activeTab === "draw") {
        const canvas = drawTabRef.current?.getCanvas();
        const drawn = canvas ? captureDrawnSignature(canvas) : null;
        if (drawn) captured = { dataUrl: drawn, type: "drawn" };
      } else {
        const typed = typeTabRef.current?.capture() ?? null;
        if (typed) captured = { dataUrl: typed, type: "typed" };
      }
    }

    const decision = resolveSignaturePlacement(
      captured?.dataUrl ?? null,
      existingSignatureDataUrl,
    );
    if (!decision) return;

    // Only a freshly created signature updates the session signature. Reuse
    // leaves state.signature (and every previously placed overlay) untouched.
    if (decision.isNewSignature && captured) {
      dispatch({
        type: "SIGNATURE_CREATED",
        payload: { dataUrl: captured.dataUrl, type: captured.type },
      });
    }

    // Place the overlay on the currently most-visible page. If the page hasn't
    // been measured yet (not rendered), skip — only reachable before the page
    // the user is on has rendered, which doesn't happen for a scrolled-to page.
    const pageIndex = state.currentVisiblePageIndex ?? 0;
    const pageDimPx = state.document.pageDimensionsPx.get(pageIndex);
    if (pageDimPx) {
      void addOverlay(pageIndex, pageDimPx, decision.dataUrl);
    }

    dispatch({ type: "SIGNATURE_MODAL_CLOSE" });
  }, [
    activeTab,
    hasNewInput,
    existingSignatureDataUrl,
    dispatch,
    state,
    addOverlay,
  ]);

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

        {/* Story 6.2 — reuse the current session signature. Shown only after a
            signature exists. Type-agnostic: a drawn OR typed signature is just a
            PNG data URL, so we preview the image directly (we don't store the
            typed text/font). Pressing Use Signature with no new drawing/typing
            places this signature again on the current page. */}
        {hasExistingSignature && existingSignatureDataUrl ? (
          <div
            className="mb-4 flex items-center gap-3 rounded-md border p-3"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element --
                In-memory PNG data URL, not a network/file asset — next/image has
                nothing to optimize. Same rationale as SignatureOverlay (AD-4). */}
            <img
              src={existingSignatureDataUrl}
              alt="Current signature"
              className="h-12 rounded border bg-white object-contain"
              style={{ borderColor: "var(--color-border)", maxWidth: 200 }}
            />
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Your current signature. Press{" "}
              <span style={{ color: "var(--color-text-primary)" }}>
                Use Signature
              </span>{" "}
              to place it again, or create a new one below.
            </p>
          </div>
        ) : null}

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
            // Enabled when there's something to place: new input (Draw: strokes
            // exist; Type: text exists AND fonts loaded) OR an existing session
            // signature to reuse (Story 6.2).
            disabled={!canConfirm}
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
