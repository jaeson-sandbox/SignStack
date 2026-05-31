"use client";

import { Rnd } from "react-rnd";
import type { Overlay } from "@/types";

interface SignatureOverlayProps {
  /**
   * The overlay to render. x/y/width/height are in rendered page pixels;
   * dataUrl is the signature PNG snapshotted at placement time.
   */
  overlay: Overlay;
}

/**
 * Visual display of a single signature overlay on a PDF page (Story 5.2).
 *
 * Display-only: dragging and resizing are disabled here — Story 5.4 enables
 * them. The component is a thin imperative-shell wrapper around react-rnd; it
 * holds no logic and dispatches nothing. Position/size are controlled directly
 * from overlay state so later stories (keyboard nudge, drag) re-render cleanly.
 *
 * The image comes from `overlay.dataUrl` (snapshotted per overlay), so each
 * placed signature keeps its own image even after the session signature is
 * replaced.
 *
 * Must be rendered inside a `position: relative` page container — react-rnd
 * positions its container absolutely relative to the nearest positioned
 * ancestor.
 */
export function SignatureOverlay({ overlay }: SignatureOverlayProps) {
  return (
    <Rnd
      position={{ x: overlay.x, y: overlay.y }}
      size={{ width: overlay.width, height: overlay.height }}
      disableDragging
      enableResizing={false}
      // zIndex keeps the signature above the page canvas (AC3); cursor hints
      // at the future move interaction (UX-DR9 unselected state).
      style={{ cursor: "move", zIndex: 10 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element --
          The source is an in-memory PNG data URL, not a network/file asset, so
          next/image's optimizer has nothing to optimize and its layout model
          (fill / intrinsic sizing) fights react-rnd's absolute positioning.
          A plain <img> is the architecture-sanctioned choice (AD-4 / Story 5.2). */}
      <img
        src={overlay.dataUrl}
        alt="Signature"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
          // No interaction yet — keep the native image drag/select out of the way.
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </Rnd>
  );
}
