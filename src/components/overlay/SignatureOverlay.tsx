"use client";

import { useState } from "react";
import {
  Rnd,
  type RndDragCallback,
  type RndResizeCallback,
  type RndResizeStartCallback,
  type ResizeEnable,
} from "react-rnd";
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
  /** Called with the overlay id when the overlay is selected (drag/resize start). */
  onSelect: (id: string) => void;
  /** Called with the overlay id when the × delete control is clicked. */
  onDelete: (id: string) => void;
  /** Called on drag stop with the committed top-left position (rounded px). */
  onMove: (id: string, x: number, y: number) => void;
  /** Called on resize stop with the committed rect (rounded px). */
  onResize: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
}

/** Class on the react-rnd root — used by the page deselect handler to tell an
 *  overlay click (anywhere inside, including react-rnd's resize handles) from a
 *  click on bare page space. */
export const OVERLAY_RND_CLASS = "signature-overlay-rnd";
/** Class on the delete button — react-rnd `cancel` target so a delete press
 *  never starts a drag. */
const OVERLAY_DELETE_CLASS = "signature-overlay-delete";

const MIN_WIDTH_PX = 40;
const MIN_HEIGHT_PX = 20;

// re-resizable renders its corner/edge handles with zIndex 1 (its `edgeBase`
// style) AFTER our children in DOM order, so the topRight handle — positioned
// at the exact top-right corner where the delete × lives — would win a z-index
// tie and swallow delete clicks (starting a resize instead). Stacking the
// delete control above the handles keeps it clickable. Must stay > 1.
export const OVERLAY_DELETE_Z_INDEX = 20;

// Enable all 8 resize handles when selected.
const ALL_RESIZE_HANDLES: ResizeEnable = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
};

// 8 visible handle markers (4 corners + 4 edge midpoints), UX-DR9. These are
// decorative (pointerEvents:none) — react-rnd renders its own transparent hit
// zones at the same corners/edges, so grabbing a visible square resizes.
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
 * Visual display + selection / delete / drag / resize for a single signature
 * overlay (Stories 5.2–5.4).
 *
 * Presentational: it dispatches nothing. Selection, deletion, move, and resize
 * are reported up via callbacks; the parent (`PDFScrollArea`) owns the dispatch.
 *
 * Interaction model:
 * - Dragging is always enabled; starting a drag selects the overlay.
 * - Resizing (8 handles) is enabled only while selected.
 * - `bounds="parent"` clamps both drag and resize to the page container, which
 *   is exactly the page rect — so it doubles as the page-dimension max.
 * - The delete button is a react-rnd `cancel` target so pressing it never
 *   starts a drag.
 *
 * The image comes from `overlay.dataUrl` (snapshotted per overlay). Must be
 * rendered inside a `position: relative` page container — react-rnd positions
 * its container absolutely relative to the nearest positioned ancestor.
 */
export function SignatureOverlay({
  overlay,
  selected,
  onSelect,
  onDelete,
  onMove,
  onResize,
}: SignatureOverlayProps) {
  // Local-only: drives the 85% drag opacity (UX-DR9). Not app state — it's
  // ephemeral interaction feedback, so it lives here, not in the reducer.
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart: RndDragCallback = () => {
    onSelect(overlay.id);
  };

  const handleDrag: RndDragCallback = () => {
    // onDrag fires only on actual movement, so a plain click never dims.
    if (!isDragging) setIsDragging(true);
  };

  const handleDragStop: RndDragCallback = (_event, data) => {
    setIsDragging(false);
    onMove(overlay.id, Math.round(data.x), Math.round(data.y));
  };

  const handleResizeStart: RndResizeStartCallback = () => {
    onSelect(overlay.id);
  };

  const handleResizeStop: RndResizeCallback = (
    _event,
    _direction,
    ref,
    _delta,
    position,
  ) => {
    onResize(
      overlay.id,
      Math.round(position.x),
      Math.round(position.y),
      ref.offsetWidth,
      ref.offsetHeight,
    );
  };

  return (
    <Rnd
      className={OVERLAY_RND_CLASS}
      position={{ x: overlay.x, y: overlay.y }}
      size={{ width: overlay.width, height: overlay.height }}
      bounds="parent"
      minWidth={MIN_WIDTH_PX}
      minHeight={MIN_HEIGHT_PX}
      lockAspectRatio={false}
      disableDragging={false}
      enableResizing={selected ? ALL_RESIZE_HANDLES : false}
      cancel={`.${OVERLAY_DELETE_CLASS}`}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      style={{
        // zIndex keeps the signature above the page canvas (5.2 AC3); selected
        // overlays sit higher so their chrome is never occluded.
        zIndex: selected ? 11 : 10,
        cursor: "move",
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <div
        aria-label="Signature overlay"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
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
            // Let drag/resize gestures fall through to react-rnd.
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
                  // Visual only — react-rnd's own hit zones do the resizing.
                  pointerEvents: "none",
                  ...pos,
                }}
              />
            ))}

            <button
              type="button"
              aria-label="Delete signature"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(overlay.id);
              }}
              className={OVERLAY_DELETE_CLASS}
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
                // Stack above re-resizable's corner handles (zIndex 1) so the ×
                // wins the overlapping top-right corner and stays clickable.
                zIndex: OVERLAY_DELETE_Z_INDEX,
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
