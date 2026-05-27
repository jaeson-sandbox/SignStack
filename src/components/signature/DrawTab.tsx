"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import type { SignatureCanvasLike } from "@/lib/signature/captureDrawnSignature";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 200;
// Guideline sits at 70% of the canvas height — gives the user a baseline
// to "sign on" without dominating the canvas surface (UX spec § Draw Tab).
const GUIDELINE_TOP_PERCENT = 70;
// Must be a literal CSS color string. The Canvas 2D API silently ignores
// invalid `strokeStyle` values (including `var(...)` expressions) which is
// what caused the "drawing produces no visible stroke" bug post-merge of
// the first 4.3 attempt. Keep this in sync with --color-ink in globals.css.
// Regression-guarded by tests/components/DrawTab.test.tsx.
export const INK_COLOR_HEX = "#1E1B4B";

interface DrawTabProps {
  /** Fired after every stroke end and after Clear. Parent uses this to
   * enable / disable the modal's Use Signature button. */
  onEmptyChange: (isEmpty: boolean) => void;
}

/**
 * The handle exposed to the parent via ref. Intentionally narrow: only
 * what SignatureModal needs to capture and reset the signature. Wider
 * methods (toData, fromData, getTrimmedCanvas, …) stay encapsulated
 * inside DrawTab so the rest of the app can't accidentally couple to
 * `react-signature-canvas`'s API.
 */
export interface DrawTabHandle {
  /** Returns the underlying canvas instance for `captureDrawnSignature`. */
  getCanvas(): SignatureCanvasLike | null;
  /** Wipes all strokes and notifies the parent the canvas is empty again. */
  clear(): void;
}

export const DrawTab = forwardRef<DrawTabHandle, DrawTabProps>(
  function DrawTab({ onEmptyChange }, ref) {
    const sigRef = useRef<SignatureCanvas | null>(null);

    const handleEnd = useCallback(() => {
      const sig = sigRef.current;
      if (!sig) return;
      onEmptyChange(sig.isEmpty());
    }, [onEmptyChange]);

    const handleClear = useCallback(() => {
      sigRef.current?.clear();
      onEmptyChange(true);
    }, [onEmptyChange]);

    useImperativeHandle(
      ref,
      () => ({
        getCanvas: () => sigRef.current,
        clear: handleClear,
      }),
      [handleClear],
    );

    return (
      <div
        role="tabpanel"
        id="signature-tabpanel-draw"
        aria-labelledby="signature-tab-draw"
      >
        <div
          className="relative rounded-md overflow-hidden border"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            margin: "0 auto",
          }}
        >
          <SignatureCanvas
            ref={sigRef}
            penColor={INK_COLOR_HEX}
            onEnd={handleEnd}
            canvasProps={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              "aria-label": "Draw your signature",
              style: {
                display: "block",
                touchAction: "none",
              },
            }}
          />
          {/* Baseline guideline — purely visual, no interaction. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 right-4 border-t"
            style={{
              top: `${GUIDELINE_TOP_PERCENT}%`,
              borderColor: "var(--color-border)",
            }}
          />
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            className="rounded px-3 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-bg)",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    );
  },
);
