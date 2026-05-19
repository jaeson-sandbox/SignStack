# Addendum — SignStack PRD

## Source Inputs

- **Product Brief (approved):** `_bmad-output/planning-artifacts/briefs/brief-signstack-2026-05-18/brief.md`

## Technical Stack (for Architecture phase)

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js App Router (TypeScript) | Application shell and routing |
| PDF Rendering | react-pdf / pdfjs-dist | Client-side page rendering |
| PDF Writing | pdf-lib | Embedding overlays into PDF content at export |
| Signature Drawing | react-signature-canvas | Canvas-based drawn signature capture |
| Drag/Resize | react-rnd | Overlay positioning and sizing |
| Styling | Tailwind CSS | UI styling |
| Testing | Vitest | Unit and integration testing |
| Deployment | Static hosting (Vercel / Cloudflare Pages) | CDN-served app bundle |

**Key architectural implication:** pdf-lib and pdfjs-dist both run in the browser via WebAssembly/JS. The export pipeline is: pdfjs-dist renders pages for display → user places Overlays → on export, pdf-lib reads the original PDF bytes, draws Signature images at Overlay coordinates scaled to PDF coordinate space, and produces the output PDF bytes → browser triggers a file download. No server involved.

## Font Candidates for Typed Signatures

Three MVP 1 styles to source as web fonts:

| Style Name | Character | Suggested Font |
|-----------|-----------|---------------|
| Clean | Simple, legible handwriting | Caveat or Patrick Hand |
| Script | Flowing cursive | Dancing Script or Great Vibes |
| Formal | Classic signature look | Pinyon Script or Alex Brush |

Final font selections are a UX decision. These are candidates only.

## Rejected / Deferred Alternatives

### Save-draft / autosave
Rejected for MVP 1. Adds state management complexity and creates questions about where state lives (localStorage? IndexedDB?) without clear user value for a single short session. Revisit in post-MVP if user research shows frequent abandonment mid-session.

### Signature library (multiple saved signatures)
Deferred. A user might want to reuse a signature across documents. For MVP 1, the Signature is created once per session and persists in memory during that session only. Library would require localStorage and a management UI.

### PDF page thumbnail navigation
Deferred to post-MVP. MVP 1 renders pages in a scrollable list. Thumbnail strip navigation is a UX enhancement for long documents.

### Print-to-PDF as export alternative
Out of scope. Print quality and embedding fidelity are outside the product's control.

## Competitive Context (brief-level assumption, not validated)
The brief flags as an assumption that most browser-based PDF signing tools upload documents to servers. This should be validated before or during UX research. If a strong local-first competitor already exists, the positioning needs refinement. This does not affect MVP 1 scope.

## Accessibility Notes for Architecture
- The Signature Canvas (react-signature-canvas) has limited inherent accessibility. For MVP 1, the Typed Signature path provides an accessible alternative to drawing. Full canvas accessibility (ARIA roles, keyboard drawing) is a post-MVP enhancement.
- Drag/resize Overlay (react-rnd) should have keyboard fallback for positioning. Architecture should evaluate whether react-rnd supports keyboard nudge or if a position-input fallback (numeric X/Y fields) is needed.
