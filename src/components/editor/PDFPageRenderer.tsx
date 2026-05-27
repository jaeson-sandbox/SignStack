"use client";

import { useRef } from "react";
import { Page } from "react-pdf";
import type { PageMeasurementInput } from "@/lib/pdf/pageDimensions";

interface PDFPageRendererProps {
  pageNumber: number;
  containerWidth: number;
  /**
   * Fired once react-pdf finishes painting the canvas. Receives the full
   * `PageCallback` from react-pdf (narrowed to `PageMeasurementInput`) so
   * the parent can pull both rendered-px and intrinsic-pt dimensions from
   * the same object — no second `getPage()` round-trip, no DOM read.
   */
  onRenderSuccess?: (page: PageMeasurementInput) => void;
}

export function PDFPageRenderer({
  pageNumber,
  containerWidth,
  onRenderSuccess,
}: PDFPageRendererProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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
        onRenderSuccess={onRenderSuccess}
      />
    </div>
  );
}
