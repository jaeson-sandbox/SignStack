"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppState } from "@/store/useAppState";

type SignatureTab = "draw" | "type";

// Standard focusable-element selector for the focus trap.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SignatureModal() {
  const { state, dispatch } = useAppState();
  // Local — survives close/reopen because this component stays mounted.
  // Spec: "Remembers last-used tab in local state (Draw default on first open)."
  const [activeTab, setActiveTab] = useState<SignatureTab>("draw");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Element that had focus before the modal opened — restored on close.
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isOpen = state.ui.isSignatureModalOpen;

  const close = useCallback(() => {
    dispatch({ type: "SIGNATURE_MODAL_CLOSE" });
  }, [dispatch]);

  // Focus management: snapshot the trigger on open, focus the first focusable
  // inside the dialog. On close, restore focus to the snapshot.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Defer one frame so the dialog's children are in the DOM.
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
          <div
            role="tabpanel"
            id="signature-tabpanel-draw"
            aria-labelledby="signature-tab-draw"
            className="flex h-56 items-center justify-center rounded-md text-sm"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text-muted)",
            }}
          >
            Drawing canvas coming in Story 4.3.
          </div>
        ) : (
          <div
            role="tabpanel"
            id="signature-tabpanel-type"
            aria-labelledby="signature-tab-type"
            className="flex h-56 items-center justify-center rounded-md text-sm"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text-muted)",
            }}
          >
            Typed signature input coming in Story 4.4.
          </div>
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
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded px-3 py-1.5 text-sm font-medium opacity-50 cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-surface)",
            }}
          >
            Use Signature
          </button>
        </footer>
      </div>
    </div>
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
