"use client";

import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import type { Overlay } from "@/types";

interface SignatureOverlayProps {
  /**
   * The overlay to render. x/y/width/height are in rendered page pixels;
   * dataUrl is the signature PNG snapshotted at placement time.
   */
  overlay: Overlay;
  /** Whether this overlay is the currently selected one. */
  selected: boolean;
  /** Called with the overlay id when the overlay body is clicked. */
  onSelect: (id: string) => void;
  /** Called with the overlay id when the × delete control is clicked. */
  onDelete: (id: string) => void;
}

// 8 resize-handle positions (4 corners + 4 edge midpoints). Decorative in
// Story 5.3 — they mark the selected state per UX-DR9; Story 5.4 wires them to
// react-rnd's actual resize behavior. pointerEvents:none keeps them from
// stealing the selection click in the meantime.
const HANDLE_POSITIONS: ReadonlyArray<React.CSSProperties> = [
  { top: -4, left: -4 }, // top-left
  { top: -4, left: "calc(50% - 4px)" }, // top-center
  { top: -4, right: -4 }, // top-right
  { top: "calc(50% - 4px)", left: -4 }, // middle-left
  { top: "calc(50% - 4px)", right: -4 }, // middle-right
  { bottom: -4, left: -4 }, // bottom-left
  { bottom: -4, left: "calc(50% - 4px)" }, // bottom-center
  { bottom: -4, right: -4 }, // bottom-right
];

/**
 * Visual display + selection/delete chrome for a single signature overlay
 * (Stories 5.2–5.3).
 *
 * Presentational: it dispatches nothing. Selection and deletion are reported
 * up via `onSelect` / `onDelete`; the parent (`PDFScrollArea`) owns the
 * dispatch. Dragging and resizing remain disabled — Story 5.4 enables them, at
 * which point the decorative handles below become live.
 *
 * The image comes from `overlay.dataUrl` (snapshotted per overlay), so each
 * placed signature keeps its own image even after the session signature is
 * replaced.
 *
 * Must be rendered inside a `position: relative` page container — react-rnd
 * positions its container absolutely relative to the nearest positioned
 * ancestor.
 */
export function SignatureOverlay({
  overlay,
  selected,
  onSelect,
  onDelete,
}: SignatureOverlayProps) {
  return (
    <Rnd
      position={{ x: overlay.x, y: overlay.y }}
      size={{ width: overlay.width, height: overlay.height }}
      disableDragging
      enableResizing={false}
      // zIndex keeps the signature above the page canvas (5.2 AC3). Selected
      // overlays sit slightly higher so their chrome is never occluded.
      style={{ cursor: "move", zIndex: selected ? 11 : 10 }}
    >
      {/* Selection click target. mousedown (not click) so it composes with
          react-draggable in Story 5.4; stopPropagation prevents the page-level
          deselect handler from firing for clicks on the overlay. */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Signature overlay"
        aria-pressed={selected}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect(overlay.id);
        }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          cursor: "move",
          border: selected
            ? "1.5px dashed var(--color-overlay-border)"
            : "1.5px solid transparent",
          backgroundColor: selected ? "var(--color-overlay-bg)" : "transparent",
          boxSizing: "border-box",
        }}
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
            // Clicks fall through to the wrapper, which owns selection.
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {selected ? (
          <>
            {HANDLE_POSITIONS.map((pos, i) => (
              <div
                key={i}
                aria-hidden="true"
                data-overlay-handle
                style={{
                  position: "absolute",
                  width: 8,
                  height: 8,
                  backgroundColor: "var(--color-accent)",
                  // Decorative until Story 5.4 makes resize live.
                  pointerEvents: "none",
                  ...pos,
                }}
              />
            ))}

            <button
              type="button"
              aria-label="Delete signature"
              onMouseDown={(e) => {
                // Don't let the delete press reach the select handler.
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(overlay.id);
              }}
              className="signature-overlay-delete"
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                borderRadius: "9999px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-overlay-border)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: 0,
                lineHeight: 0,
              }}
            >
              <X aria-hidden="true" width={12} height={12} />
            </button>
          </>
        ) : null}
      </div>
    </Rnd>
  );
}
