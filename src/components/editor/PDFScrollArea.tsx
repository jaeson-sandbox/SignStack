"use client";

// Co-locate the worker setup with the module that actually uses <Document> /
// <Page>. react-pdf's README is explicit: setting workerSrc in a sibling module
// can be overwritten by react-pdf's own default during bundler chunk evaluation.
// pdfWorker.ts is idempotent — subsequent imports are no-ops.
import "@/lib/pdf/pdfWorker";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document } from "react-pdf";
import { useAppState } from "@/store/useAppState";
import { PDF_DOCUMENT_OPTIONS } from "@/lib/pdf/pdfOptions";
import {
  extractPageDimensions,
  type PageMeasurementInput,
} from "@/lib/pdf/pageDimensions";
import { overlaysForPage } from "@/lib/overlay/overlaySelectors";
import { SignatureOverlay } from "@/components/overlay/SignatureOverlay";
import type { Overlay } from "@/types";
import { PDFPageRenderer } from "./PDFPageRenderer";

// Structural-only — avoids importing PDFDocumentProxy from top-level pdfjs-dist
// (5.7.x), whose type shape diverges from react-pdf's nested pdfjs-dist (5.4.x)
// and would fail type-check against react-pdf's onLoadSuccess signature.
type DocumentLoadInfo = { numPages: number };

// Matches the UX spec's ~A4-width scroll area.
const CONTAINER_WIDTH_PX = 794;
// US-Letter-ish default height in CSS pixels at the container width above.
// Replaced per-page with the real height once the page renders.
const ESTIMATED_PAGE_HEIGHT_PX = 1056;
// IntersectionObserver tuning. rootMargin preloads pages ahead of the viewport
// so the ±1 active window gets a head start on rendering as the user scrolls.
const OBSERVER_ROOT_MARGIN = "200px 0px";
const OBSERVER_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 1.0];
// Active window = currentVisiblePageIndex ± ACTIVE_WINDOW_RADIUS.
// 1 keeps the current page + immediate neighbors rendered, matching the
// AC ("first 2 pages on mount; pages 7–9 when on page 8").
const ACTIVE_WINDOW_RADIUS = 1;

export function PDFScrollArea() {
  const { state, dispatch } = useAppState();
  const { file, arrayBuffer } = state.document;
  const [numPages, setNumPages] = useState<number | null>(null);
  // Per-page rendered heights captured from onRenderSuccess (local — Story 3.4
  // will dispatch these into the reducer for coordinate mapping).
  const [pageHeights, setPageHeights] = useState<Map<number, number>>(
    () => new Map(),
  );
  // Per-page IntersectionObserver ratios — driven entirely by the observer.
  const [pageRatios, setPageRatios] = useState<Map<number, number>>(
    () => new Map(),
  );

  const scrollRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pageElsRef = useRef<Map<number, HTMLElement>>(new Map());

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
      // pdfjs actually parsed (initial dispatch in usePdfDocument used 0 as a
      // placeholder). file / arrayBuffer refs are unchanged.
      if (file && arrayBuffer) {
        dispatch({
          type: "DOCUMENT_LOADED",
          payload: { file, arrayBuffer, pageCount: pdf.numPages },
        });
      }
    },
    [dispatch, file, arrayBuffer],
  );

  // Set up the IntersectionObserver once numPages is known and the scroll
  // container is mounted. Re-creates only when numPages changes (i.e. new doc).
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || numPages === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setPageRatios((prev) => {
          const next = new Map(prev);
          for (const entry of entries) {
            const idxAttr = (entry.target as HTMLElement).dataset.pageIndex;
            if (idxAttr === undefined) continue;
            next.set(Number(idxAttr), entry.intersectionRatio);
          }
          return next;
        });
      },
      {
        root: scrollEl,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: OBSERVER_THRESHOLDS,
      },
    );
    observerRef.current = observer;
    // Pick up any page elements that registered before the observer existed.
    pageElsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [numPages]);

  // Stable callback ref for each PageSlot to register/unregister its element.
  const registerPageEl = useCallback(
    (pageIndex: number, el: HTMLElement | null) => {
      const prev = pageElsRef.current.get(pageIndex);
      if (prev === el) return;
      if (prev && observerRef.current) observerRef.current.unobserve(prev);

      if (el) {
        pageElsRef.current.set(pageIndex, el);
        if (observerRef.current) observerRef.current.observe(el);
      } else {
        pageElsRef.current.delete(pageIndex);
      }
    },
    [],
  );

  const handlePageRendered = useCallback(
    (pageIndex: number, page: PageMeasurementInput) => {
      const dims = extractPageDimensions(page);
      // Dispatch both dimension flavors — these feed Story 4.1's coordinate
      // mapper. Reducer uses setMapEntry, so re-dispatching with identical
      // values is idempotent.
      dispatch({
        type: "PAGE_DIMENSIONS_SET",
        payload: {
          pageIndex,
          widthPx: dims.widthPx,
          heightPx: dims.heightPx,
        },
      });
      dispatch({
        type: "PAGE_INTRINSIC_SET",
        payload: {
          pageIndex,
          widthPt: dims.widthPt,
          heightPt: dims.heightPt,
        },
      });
      // Local placeholder-height cache so swapping a rendered page back to
      // a placeholder (when it scrolls out of the active window) preserves
      // scroll position without re-measuring from the DOM.
      setPageHeights((prev) => {
        if (prev.get(pageIndex) === dims.heightPx) return prev;
        const next = new Map(prev);
        next.set(pageIndex, dims.heightPx);
        return next;
      });
    },
    [dispatch],
  );

  // The page with the largest non-zero intersection ratio. null if nothing
  // has been observed yet (initial mount before the observer fires).
  const mostVisiblePageIndex = useMemo(() => {
    let bestIdx: number | null = null;
    let bestRatio = 0;
    pageRatios.forEach((ratio, idx) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [pageRatios]);

  // Sync the most-visible page into global state — guarded so we only dispatch
  // when it actually changes (avoids a render loop).
  useEffect(() => {
    if (mostVisiblePageIndex === state.currentVisiblePageIndex) return;
    dispatch({
      type: "CURRENT_PAGE_CHANGED",
      payload: { pageIndex: mostVisiblePageIndex },
    });
  }, [mostVisiblePageIndex, state.currentVisiblePageIndex, dispatch]);

  // Center the active window on the most-visible page. Before the observer
  // ever fires (page-load), fall back to 0 so pages 0..ACTIVE_WINDOW_RADIUS
  // render — satisfies AC1 ("first 2 pages active on mount").
  const activeCenter = mostVisiblePageIndex ?? 0;
  const isActive = useCallback(
    (pageIndex: number) =>
      Math.abs(pageIndex - activeCenter) <= ACTIVE_WINDOW_RADIUS,
    [activeCenter],
  );

  if (!fileProp) return null;

  return (
    <main
      ref={scrollRef}
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
                <PageSlot
                  key={index}
                  pageIndex={index}
                  totalPages={numPages}
                  containerWidth={CONTAINER_WIDTH_PX}
                  active={isActive(index)}
                  measuredHeightPx={pageHeights.get(index) ?? null}
                  pageOverlays={overlaysForPage(state.overlays, index)}
                  registerEl={registerPageEl}
                  onPageRendered={handlePageRendered}
                />
              ))
            : null}
        </Document>
      </div>
    </main>
  );
}

interface PageSlotProps {
  pageIndex: number;
  totalPages: number;
  containerWidth: number;
  active: boolean;
  measuredHeightPx: number | null;
  /** Overlays whose pageIndex matches this page (already filtered). */
  pageOverlays: Overlay[];
  registerEl: (pageIndex: number, el: HTMLElement | null) => void;
  onPageRendered: (pageIndex: number, page: PageMeasurementInput) => void;
}

function PageSlot({
  pageIndex,
  totalPages,
  containerWidth,
  active,
  measuredHeightPx,
  pageOverlays,
  registerEl,
  onPageRendered,
}: PageSlotProps) {
  const pageNumber = pageIndex + 1;
  const slotHeight = measuredHeightPx ?? ESTIMATED_PAGE_HEIGHT_PX;

  const elCallback = useCallback(
    (el: HTMLDivElement | null) => registerEl(pageIndex, el),
    [registerEl, pageIndex],
  );

  const handleRendered = useCallback(
    (page: PageMeasurementInput) => onPageRendered(pageIndex, page),
    [onPageRendered, pageIndex],
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {/* position: relative establishes the positioning context for the
          absolutely-positioned react-rnd overlays. The container is always
          `containerWidth` wide and shrink-wraps to the rendered canvas (or
          placeholder) height, so overlay px coordinates map 1:1. */}
      <div
        ref={elCallback}
        data-page-index={pageIndex}
        className="relative"
        style={{ width: containerWidth }}
      >
        {active ? (
          <PDFPageRenderer
            pageNumber={pageNumber}
            containerWidth={containerWidth}
            onRenderSuccess={handleRendered}
          />
        ) : (
          <div
            className="rounded-md"
            style={{
              height: slotHeight,
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
            aria-label={`Page ${pageNumber} placeholder`}
          />
        )}
        {/* Each overlay carries its own snapshotted dataUrl, so a placed
            signature keeps its image even after the session signature is
            replaced. An overlay can only have been placed on a measured page,
            so its coordinates are valid against this container whether the page
            is active or a height-preserving placeholder. */}
        {pageOverlays.map((overlay) => (
          <SignatureOverlay key={overlay.id} overlay={overlay} />
        ))}
      </div>
      <p
        className="text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        Page {pageNumber} of {totalPages}
      </p>
    </div>
  );
}
