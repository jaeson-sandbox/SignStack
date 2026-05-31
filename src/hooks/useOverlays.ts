"use client";

import { useCallback } from "react";
import { useAppState } from "@/store/useAppState";
import { createOverlay } from "@/store/appReducer";
import { computeDefaultOverlayRect } from "@/lib/overlay/overlayPlacement";

/**
 * Load the aspect ratio (height/width) of a PNG data URL by decoding it via
 * an Image element. Falls back to 0.4 on load error so the caller never
 * rejects and always gets a usable ratio.
 *
 * NOT pure — uses the DOM Image API. Lives here as the imperative shell
 * boundary for image-dimension probing so the pure placement helper stays
 * free of DOM dependencies.
 */
function loadAspectRatio(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 0.4;
      resolve(ratio);
    };
    img.onerror = () => resolve(0.4);
    img.src = dataUrl;
  });
}

/**
 * Hook that exposes `addOverlay` — the imperative entry point for placing a
 * new signature overlay on a page at the default bottom-right position.
 *
 * Functional core: `computeDefaultOverlayRect` (pure, tested in isolation).
 * Imperative shell: `loadAspectRatio` (DOM Image) + dispatch (context side-effect).
 */
export function useOverlays() {
  const { dispatch } = useAppState();

  /**
   * Place a new overlay at the default bottom-right inset position on the
   * given page. The signature PNG is probed for its aspect ratio so the
   * overlay height is proportional to the drawn or typed signature.
   *
   * @param pageIndex   0-based page index.
   * @param pageDimPx   Rendered pixel dimensions of that page.
   * @param dataUrl     PNG data URL of the signature (drawn or typed).
   */
  const addOverlay = useCallback(
    async (
      pageIndex: number,
      pageDimPx: { width: number; height: number },
      dataUrl: string,
    ): Promise<void> => {
      const aspectRatio = await loadAspectRatio(dataUrl);
      const rect = computeDefaultOverlayRect(pageDimPx, aspectRatio);
      dispatch({
        type: "OVERLAY_ADDED",
        payload: createOverlay({ pageIndex, dataUrl, ...rect }),
      });
    },
    [dispatch],
  );

  return { addOverlay };
}
