"use client";

import { Plus, Download, Loader2 } from "lucide-react";
import { useAppState } from "@/store/useAppState";
import { useExport } from "@/hooks/useExport";

export function EditorToolbar() {
  const { state, dispatch } = useAppState();
  const { exportSignedPdf } = useExport({
    document: state.document,
    overlays: state.overlays,
    dispatch,
  });

  const { isExporting, exportError } = state.ui;
  const hasDocument = state.document.arrayBuffer !== null;
  const canExport = hasDocument && !isExporting;

  const openSignatureModal = () => {
    dispatch({ type: "SIGNATURE_MODAL_OPEN" });
  };

  return (
    <header
      className="sticky top-0 z-10 flex h-12 items-center px-6 border-b"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="flex-1 font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        SignStack
      </div>

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={openSignatureModal}
          className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-surface)",
          }}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add Signature
        </button>
      </div>

      <div className="relative flex flex-1 justify-end">
        <button
          type="button"
          onClick={() => void exportSignedPdf()}
          disabled={!canExport}
          aria-disabled={!canExport}
          aria-busy={isExporting}
          className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            canExport ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-surface)",
          }}
        >
          {isExporting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="h-4 w-4" />
          )}
          {isExporting ? "Exporting…" : "Download Signed PDF"}
        </button>
        {exportError ? (
          <p
            role="alert"
            className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs"
            style={{ color: "var(--color-danger)" }}
          >
            {exportError}
          </p>
        ) : null}
      </div>
    </header>
  );
}
