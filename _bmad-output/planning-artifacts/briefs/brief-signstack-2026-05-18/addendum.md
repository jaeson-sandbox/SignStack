# Addendum — SignStack Product Brief

## Technical Stack (Pre-selected)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js App Router (TypeScript) |
| Styling | Tailwind CSS |
| PDF Rendering | react-pdf / pdfjs-dist |
| PDF Writing | pdf-lib |
| Signature Drawing | react-signature-canvas |
| Drag/Resize Overlay | react-rnd |
| Testing | Vitest |

**Rationale for local-first stack:** pdf-lib runs entirely in the browser via WebAssembly/JS; pdfjs-dist renders PDFs client-side. No server-side PDF processing is needed for MVP 1 or Phase 2. This directly enables the privacy guarantee.

## Overlay Architecture Note (for Architecture phase)

Phase 2 text/date/checkmark overlays follow the same pattern as MVP 1 signature overlays: positioned canvas/DOM elements during editing, flattened into PDF content (via pdf-lib) at export time. No AcroForm field detection or editing is in scope initially.

## Definitions Glossary

- **Visual signing:** Embedding a visible image (drawn) or text-rendered-as-image (typed) into the PDF page content. Does not imply cryptographic integrity, certificate chains, or legal digital signature compliance.
- **Text fill-out overlays:** User-placed text boxes, date fields, and checkmarks rendered as visual elements and embedded into the PDF during export. Does not imply reading, mapping to, or editing existing AcroForm fields.
- **Local-first:** All PDF parsing, rendering, and export operations occur in the user's browser. No document content is transmitted to any server.

## Explicitly Deferred Capabilities

The following were raised in scoping and explicitly excluded:

| Capability | Deferred To | Reason |
|-----------|-------------|--------|
| Cryptographic digital signatures (PKI) | Never (non-goal) | Out of product scope entirely |
| Native AcroForm field editing | Future (unscheduled) | Complexity; not needed for visual overlay use case |
| AI document analysis | Never (non-goal) | Privacy conflict; out of scope |
| Authentication / accounts | Post-MVP | Not needed for local-first single-user tool |
| Cloud storage | Post-MVP | Privacy conflict with local-first principle |
| Email invitations / workflow routing | Post-MVP | Collaboration feature; out of MVP scope |
| Payments / monetization | Post-MVP | Not defined yet |
| Multi-user / collaboration | Post-MVP | Single-user tool for MVP |
