"use client";

import { useCallback, useRef } from "react";
import { Page } from "react-pdf";

interface PDFPageRendererProps {
  pageNumber: number;
  containerWidth: number;
  /**
   * Fired with the rendered wrapper height (px) once react-pdf paints the
   * page canvas. Used by the lazy renderer to replace the default
   * placeholder height with the page's real height so the scrollbar
   * doesn't jump when the page swaps in/out.
   */
  onRenderSuccess?: (renderedHeightPx: number) => void;
}

export function PDFPageRenderer({
  pageNumber,
  containerWidth,
  onRenderSuccess,
}: PDFPageRendererProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleRenderSuccess = useCallback(() => {
    if (!onRenderSuccess) return;
    // Wait one frame so layout reflects the canvas's painted height.
    requestAnimationFrame(() => {
      if (wrapperRef.current) {
        onRenderSuccess(wrapperRef.current.clientHeight);
      }
    });
  }, [onRenderSuccess]);

  return (
    <div
      ref={wrapperRef}
      className="overflow-hidden rounded-md"
      style={{
        backgroundColor: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Page
        pageNumber={pageNumber}
        width={containerWidth}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderSuccess={handleRenderSuccess}
      />
    </div>
  );
}
