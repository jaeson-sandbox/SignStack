"use client";

import { useCallback } from "react";
import type { AppAction, DocumentState, Overlay } from "@/types";
import { planOverlayDraws, signedFilename } from "@/lib/pdf/exportPlan";
import { embedOverlaysIntoPdf } from "@/lib/pdf/pdfExporter";
import { downloadBytes } from "@/lib/browser/downloadBlob";

interface UseExportArgs {
  document: DocumentState;
  overlays: Overlay[];
  dispatch: React.Dispatch<AppAction>;
}

/** Shown to the user on any export failure — pdf-lib internals stay hidden. */
const EXPORT_ERROR_MESSAGE =
  "Could not export the signed PDF. Please try again.";

/**
 * Orchestration shell for Story 6.1: read the original PDF bytes, plan the
 * overlay draws (pure), embed them via pdf-lib (shell), and trigger a browser
 * download — dispatching EXPORT_START / EXPORT_SUCCESS / EXPORT_ERROR around it.
 *
 * The decisions all live in the pure core (`planOverlayDraws`,
 * `signedFilename`); this hook only sequences the side effects.
 *
 * Bytes are read fresh from the `File` (not `state.document.arrayBuffer`):
 * react-pdf is handed a `Uint8Array` view over that same buffer, and pdfjs can
 * transfer/detach it to its worker. The `File` is immutable and always
 * re-readable, so this avoids any coupling with react-pdf's lifecycle.
 */
export function useExport({ document, overlays, dispatch }: UseExportArgs): {
  exportSignedPdf: () => Promise<void>;
} {
  const exportSignedPdf = useCallback(async (): Promise<void> => {
    const { file, arrayBuffer, pageDimensionsPx, pageIntrinsicPt } = document;
    // Nothing loaded — the button is disabled in this state, but guard anyway.
    if (!file && !arrayBuffer) return;

    dispatch({ type: "EXPORT_START" });
    try {
      const pdfBytes = file
        ? new Uint8Array(await file.arrayBuffer())
        : new Uint8Array(arrayBuffer as ArrayBuffer);
      const plans = planOverlayDraws(
        overlays,
        pageDimensionsPx,
        pageIntrinsicPt,
      );
      const signedBytes = await embedOverlaysIntoPdf(pdfBytes, plans);
      downloadBytes(signedBytes, signedFilename(file?.name ?? "document.pdf"));
      dispatch({ type: "EXPORT_SUCCESS" });
    } catch {
      dispatch({
        type: "EXPORT_ERROR",
        payload: { message: EXPORT_ERROR_MESSAGE },
      });
    }
  }, [document, overlays, dispatch]);

  return { exportSignedPdf };
}
