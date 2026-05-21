"use client";

// Co-locate the worker setup with the module that actually uses <Document> /
// <Page>. react-pdf's README is explicit: setting workerSrc in a sibling module
// can be overwritten by react-pdf's own default during bundler chunk evaluation.
// pdfWorker.ts is idempotent — subsequent imports are no-ops.
import "@/lib/pdf/pdfWorker";

import { useCallback, useMemo, useState } from "react";
import { Document } from "react-pdf";
import { useAppState } from "@/store/useAppState";
import { PDF_DOCUMENT_OPTIONS } from "@/lib/pdf/pdfOptions";
import { PDFPageRenderer } from "./PDFPageRenderer";

// Structural-only — avoids importing PDFDocumentProxy from top-level pdfjs-dist
// (5.7.x), whose type shape diverges from react-pdf's nested pdfjs-dist (5.4.x)
// and would fail type-check against react-pdf's onLoadSuccess signature.
type DocumentLoadInfo = { numPages: number };

// Matches the UX spec's ~A4-width scroll area.
const CONTAINER_WIDTH_PX = 794;

export function PDFScrollArea() {
  const { state, dispatch } = useAppState();
  const { file, arrayBuffer } = state.document;
  const [numPages, setNumPages] = useState<number | null>(null);

  // react-pdf compares the `file` prop with === — memoize so a new object on
  // every render doesn't trigger a full re-parse.
  const fileProp = useMemo(
    () => (arrayBuffer ? { data: new Uint8Array(arrayBuffer) } : null),
    [arrayBuffer],
  );

  const handleLoadSuccess = useCallback(
    (pdf: DocumentLoadInfo) => {
      setNumPages(pdf.numPages);
      // Re-dispatch DOCUMENT_LOADED so the reducer's pageCount reflects what
      // pdfjs actually parsed (initial dispatch in usePdfDocument used 0 as
      // a placeholder). file / arrayBuffer refs are unchanged, so consumers
      // memoized on them are unaffected.
      if (file && arrayBuffer) {
        dispatch({
          type: "DOCUMENT_LOADED",
          payload: { file, arrayBuffer, pageCount: pdf.numPages },
        });
      }
    },
    [dispatch, file, arrayBuffer],
  );

  if (!fileProp) return null;

  return (
    <main
      className="flex-1 overflow-y-auto px-6 py-8"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div
        className="mx-auto flex flex-col gap-6"
        style={{ width: CONTAINER_WIDTH_PX }}
      >
        <Document
          file={fileProp}
          options={PDF_DOCUMENT_OPTIONS}
          onLoadSuccess={handleLoadSuccess}
        >
          {numPages !== null
            ? Array.from({ length: numPages }, (_, index) => (
                <PDFPageRenderer
                  key={index + 1}
                  pageNumber={index + 1}
                  containerWidth={CONTAINER_WIDTH_PX}
                />
              ))
            : null}
        </Document>
      </div>
    </main>
  );
}
