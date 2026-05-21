// Module-level constant so the reference is stable across renders.
// react-pdf re-parses the document when the `<Document options>` prop
// changes identity (=== check), so we never want this object recreated.
//
// Local-asset-only policy (FR-20 / NFR-PV1): both URLs point inside
// `public/`, served from the app's own origin — no CDN, no third-party
// host. The standard_fonts directory is a checked-in copy of the nested
// react-pdf pdfjs-dist build to keep API↔assets version-matched
// (see docs/baseline-verification.md § R-1).
export const PDF_DOCUMENT_OPTIONS = Object.freeze({
  standardFontDataUrl: "/standard_fonts/",
});
