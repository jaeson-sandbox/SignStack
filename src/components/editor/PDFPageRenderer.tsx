"use client";

import { Page } from "react-pdf";

interface PDFPageRendererProps {
  pageNumber: number;
  containerWidth: number;
}

export function PDFPageRenderer({
  pageNumber,
  containerWidth,
}: PDFPageRendererProps) {
  return (
    <div
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
      />
    </div>
  );
}
