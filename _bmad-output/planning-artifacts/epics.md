---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-signstack-2026-05-18/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/architecture.md
status: complete
---

# SignStack — Epic and Story Breakdown

## Overview

This document decomposes SignStack MVP 1 requirements into 7 epics and 22 stories. Every story is sized for a single Claude Code implementation session and one PR. Stories are sequentially ordered so each builds only on previously completed work. Phase 2 (text/date/checkmark overlays) and Phase 3 (combine PDFs) appear only as out-of-scope callouts within relevant stories.

---

## Requirements Inventory

### Functional Requirements

FR-1: User can select a local PDF via file picker (`.pdf` filter) or drag-and-drop onto the upload area. No network request is made during or after selection.
FR-2: System validates the selected file before rendering — rejects non-PDF MIME types, files missing the `%PDF` header, and files exceeding 25 MB. Each rejection shows a user-visible error message.
FR-3: User can load a new Document, which replaces the current session without a confirmation prompt. All Overlays from the prior Document are discarded.
FR-4: All Pages of the Document render in a vertically scrollable view at sufficient resolution to read 12pt text.
FR-5: Each rendered Page shows a visible page number indicator.
FR-6: A clearly labelled "Add Signature" control is visible in the editor when a Document is loaded. It is not accessible before a Document is loaded.
FR-7: User can draw a Signature on the Signature Canvas using a pointer device. Strokes accumulate; canvas must detect a non-empty drawing.
FR-8: User can type their name and select a Font Style (Clean, Script, Formal) to create a Typed Signature. A live preview updates as the user types or changes style.
FR-9: User can clear the current Signature (canvas or text input) and start over without closing the creation experience.
FR-10: User can confirm a non-empty Signature. Confirmation stores it in session memory and closes the creation experience.
FR-11: After Signature confirmation, an Overlay appears on the current Page at a default bottom-right position. The Overlay displays the Signature visually.
FR-12: User can place more than one Overlay across Pages. Each Overlay is independent.
FR-13: User can reposition an Overlay by dragging it. The Overlay is clamped to its Page bounds.
FR-14: User can resize an Overlay using 8 resize handles. Aspect ratio is not locked by default. A minimum size (40×20px) prevents collapse.
FR-15: User can remove an Overlay at any time before Export. Removal does not affect the session Signature or other Overlays.
FR-16: An "Export" / "Download Signed PDF" control is visible in the editor. It is available whether or not Overlays have been placed.
FR-17: At Export time, all Overlays are Embedded into their respective Pages as page content. Screen coordinates are mapped to PDF coordinate space.
FR-18: The Signed Document is delivered as a browser file download named `{original-name}-signed.pdf`. The output is a valid PDF.
FR-19: Export preserves all original Document content. Pages without Overlays are visually identical to the originals.
FR-20: All Document operations occur client-side. Zero bytes of Document content are transmitted to any server during any session.
FR-21: The product UI displays a persistent disclaimer: "SignStack adds a visual signature to your PDF. It does not create a cryptographic digital signature."

### Non-Functional Requirements

NFR-P1: First page of the Document renders within 3 seconds of upload for a Document ≤ 20 pages and ≤ 10 MB on a modern desktop browser.
NFR-P2: Export completes within 5 seconds for a Document ≤ 20 pages with ≤ 5 Overlays.
NFR-P3: Application bundle loads and is interactive within 5 seconds on a broadband connection (initial visit, no cache).
NFR-B1: Full feature parity on Chrome 110+, Firefox 110+, and Safari 16+ desktop.
NFR-B2: Application does not crash on Microsoft Edge (Chromium) desktop.
NFR-PV1: Zero bytes of Document content transmitted to any server during any session.
NFR-PV2: No third-party analytics or telemetry may access Document content or metadata.
NFR-A1: All UI controls outside the Signature Canvas meet WCAG 2.1 AA (4.5:1 contrast, keyboard accessible, labelled).
NFR-A2: The Typed Signature path provides a fully keyboard-accessible alternative to the Drawn Signature canvas.
NFR-A3: The Overlay can be repositioned via keyboard (arrow-key nudge) in addition to drag.
NFR-R1: The application functions offline after the initial page load.
NFR-R2: A failed Export surfaces a user-visible error message without crashing the browser tab.

### Additional Requirements (Architecture)

- AD-1: No API routes. All PDF-processing components use `'use client'` and dynamic import with `ssr: false`. `src/app/api/` must not exist.
- AD-2: react-pdf v10 + pdfjs-dist v5. Worker `workerSrc` path must be verified from installed package before implementing PDF rendering (v5 path differs from v4).
- AD-3: Coordinate mapping centralized in `src/lib/pdf/coordinateMapper.ts`. Variables holding pixels end with `Px`; PDF points end with `Pt`.
- AD-4: Both Drawn and Typed Signatures are converted to PNG data URLs before pdf-lib embedding.
- AD-5: React Context + useReducer for all state. Full typed `AppState` / `AppAction` shape defined in `src/types/index.ts` and `src/store/`.
- AD-6: Keyboard nudge via document-level `keydown` handler in `src/hooks/useKeyboardOverlay.ts`. Active only when an Overlay is selected and modal is closed.
- AD-7: Google Fonts (Caveat, Dancing Script, Pinyon Script) loaded on-demand when the user first opens the Type tab. Not in the initial bundle.
- AD-8: 25 MB hard limit. Lazy page rendering via `IntersectionObserver` — render pages only as they approach the viewport.
- AD-9: Touch/stylus input supported at library level only; not explicitly QA-tested for MVP 1.
- AD-10: Overlay default placement: most-visible page in viewport, bottom-right quadrant, inset 5% from each edge, 200px wide.
- AD-11: `vitest.config.ts` does not yet exist. The first story that writes tests must create it.
- AGENTS.md: All agents must read `node_modules/next/dist/docs/`, react-pdf v10 README, pdfjs-dist v5 CHANGELOG, and Tailwind v4 README before writing any code.
- Tailwind v4: CSS-based `@theme` configuration in `globals.css`. No `tailwind.config.js` or `tailwind.config.ts`.
- react-signature-canvas 1.1.0-alpha.2 is an alpha release. Verify API against installed package source before implementing DrawTab.

### UX Design Requirements

UX-DR1: UploadZone — full viewport-width drop target; drag-over-valid state (blue border + light blue tint); drag-over-invalid state (red border + light red tint); loading spinner while PDF processes; inline error message below zone on failure; zone stays active after error.
UX-DR2: EditorToolbar — 48px sticky top bar; logo left; `+ Add Signature` center; `↓ Download Signed PDF` right; both buttons always visible; no overflow menu.
UX-DR3: PDFScrollArea — centered, max-width ~794px; pages as white cards with `--shadow-card`; 24px gap between pages; standard vertical scroll.
UX-DR4: Page number captions — centered below each page in muted text (12px, `--color-text-muted`).
UX-DR5: SignatureModal — centered with dark scrim; Draw/Type tabs; remembers last-used tab within session; Escape closes; Tab cycles within modal (focus trap); `×` in top-right closes.
UX-DR6: DrawTab — horizontal guideline at bottom third of canvas; `Clear` button; `Use Signature` disabled when canvas empty, enabled on first stroke.
UX-DR7: TypeTab — text input auto-focused; font style picker (Clean / Script / Formal); live preview at 32px in selected font; Default style: Script; `Use Signature` disabled when input empty.
UX-DR8: TypedPreview — renders text in selected Google Font (Caveat / Dancing Script / Pinyon Script); shows loading indicator while fonts fetch; falls back gracefully if fonts fail.
UX-DR9: SignatureOverlay — unselected: signature image only, no border, `move` cursor; selected: 1.5px dashed blue border + 8×8px solid blue resize handles (4 corners + 4 edges) + red-on-hover `×` delete icon top-right; dragging: 85% opacity; minimum 40×20px; maximum = page dimensions.
UX-DR10: DisclaimerBar — full-width, white background, top border; 🔒 icon + "Local only ·" label + full disclaimer text; 12px `--color-text-muted`; always visible in all app states.
UX-DR11: Design tokens — all colors, spacing (8px grid: 8/16/24/32/48/64px), typography, shadow, and border-radius values defined via CSS `@theme` in `globals.css`.
UX-DR12: Upload error handling — non-PDF drag: red border + inline message; size exceeded: inline message with limit; parse failure: inline message with guidance; all dismissible, zone stays active.
UX-DR13: Export error handling — inline near Export button; toast/banner style; session state preserved so user can retry.
UX-DR14: Overlay hover state — cursor changes to `move` on hover (unselected); subtle border hint on hover.
UX-DR15: Modal keyboard — Escape closes modal; Enter on `Use Signature` confirms; Tab cycles through all focusable controls within modal only.

---

## FR Coverage Map

| FR | Epic | Story | Description |
|----|------|-------|-------------|
| FR-1 | Epic 2 | 2.1 | PDF file selection: file picker + drag-drop |
| FR-2 | Epic 2 | 2.1 | File validation: MIME, header, 25 MB limit |
| FR-3 | Epic 2 | 2.1 | Session replacement on new Document load |
| FR-4 | Epic 3 | 3.2, 3.3 | Full-document page rendering, scrollable |
| FR-5 | Epic 3 | 3.3 | Page number captions |
| FR-6 | Epic 4 | 4.2 | Signature creation entry point (Add Signature button) |
| FR-7 | Epic 4 | 4.3 | Drawn Signature on canvas |
| FR-8 | Epic 4 | 4.4 | Typed Signature with Font Style selector |
| FR-9 | Epic 4 | 4.3, 4.4 | Clear and start over in both creation paths |
| FR-10 | Epic 4 | 4.3, 4.4 | Signature confirmation; stores in session memory |
| FR-11 | Epic 5 | 5.1, 5.2 | Overlay placement at default position after confirmation |
| FR-12 | Epic 6 | 6.2 | Multiple Overlays across Pages |
| FR-13 | Epic 5 | 5.4 | Overlay drag; clamped to page bounds |
| FR-14 | Epic 5 | 5.4 | Overlay resize; 8 handles; minimum size |
| FR-15 | Epic 5 | 5.3, 5.5 | Overlay removal via button and keyboard |
| FR-16 | Epic 6 | 6.1 | Export trigger button |
| FR-17 | Epic 6 | 6.1 | Overlay embedding via pdf-lib with coordinate mapping |
| FR-18 | Epic 6 | 6.1 | Signed Document download; correct filename |
| FR-19 | Epic 6 | 6.1 | Original content preservation; page count unchanged |
| FR-20 | Epic 1 | 1.2 + arch | No network requests carrying Document content (structural) |
| FR-21 | Epic 1 | 1.2; Epic 7 | 7.2 Persistent disclaimer visible in all states |

---

## Epic List

### Epic 1: Project Foundation
Establishes the working development environment, app shell, design system, and typed state architecture so all subsequent stories have a clean, verified foundation to build on.
**FRs covered:** FR-20 (structural), FR-21 (disclaimer shell)
**Stories:** 1.1, 1.2, 1.3

### Epic 2: PDF Upload and Validation
Users can select a local PDF file (via file picker or drag-and-drop), receive clear validation feedback, and have the Document loaded into session memory — all without any network activity.
**FRs covered:** FR-1, FR-2, FR-3
**Stories:** 2.1

### Epic 3: PDF Rendering
Users see their PDF rendered page-by-page in a scrollable editor. Pages load lazily for performance. The system captures page dimensions needed for coordinate mapping.
**FRs covered:** FR-4, FR-5; NFR-P1
**Stories:** 3.1, 3.2, 3.3, 3.4

### Epic 4: Signature Creation
Users create a Signature — either drawn on a canvas or typed with a font style — and confirm it for placement. The coordinate conversion utility that enables embedding is also established here.
**FRs covered:** FR-6, FR-7, FR-8, FR-9, FR-10
**Stories:** 4.1, 4.2, 4.3, 4.4

### Epic 5: Signature Overlay
Users place, move, resize, and delete Signature Overlays on any page. Keyboard nudge and delete complete accessibility requirements.
**FRs covered:** FR-11, FR-13, FR-14, FR-15; NFR-A3
**Stories:** 5.1, 5.2, 5.3, 5.4, 5.5

### Epic 6: PDF Export
Users export the Signed Document. All Overlays are embedded into the PDF at correct positions. Multiple overlays across multiple pages are supported. The "Add Another" flow completes the multi-signature UX.
**FRs covered:** FR-12, FR-16, FR-17, FR-18, FR-19; NFR-P2, NFR-R2
**Stories:** 6.1, 6.2

### Epic 7: Polish and Documentation
Error states, loading states, accessibility audit, WCAG 2.1 AA compliance, and README with legal disclaimer complete the MVP 1 deliverable.
**FRs covered:** FR-21 (full); NFR-A1, NFR-A2, NFR-R2, NFR-PV1
**Stories:** 7.1, 7.2, 7.3

---

## Standard Development Workflow (applies to every story)

Claude Code executes this sequence for every story without exception:

1. `git status` — if dirty, stop and explain before proceeding
2. `git checkout main && git pull` — always branch from up-to-date main
3. `git checkout -b {branch-name}`
4. Implement only the current story — no adjacent refactors or speculative additions
5. **Commit early and often** — after each logical unit (a file created, a function written, a hook complete), not just at PR creation time
6. `npm run lint && npm run build` — fix all failures before creating the PR
7. `npm test` — run when tests exist for this story; all must pass
8. `git push -u origin {branch-name}`
9. `gh pr create --title "{pr-title}" --body "..."` — PR body must include: summary, ACs completed, manual test steps, checks run, screenshots if UI changed, risks/follow-ups
10. **Do not merge the PR** — wait for explicit user approval before merging

---

## Epic 1: Project Foundation

**Goal:** Verified toolchain, app shell with design tokens, and typed state architecture. Every subsequent story builds on this base.

---

### Story 1.1: Project Workflow and Baseline Verification

As a developer,
I want the project toolchain verified and Vitest configured,
So that subsequent stories have a working, tested baseline to build on.

**Product Value:** Catches broken tooling before any feature work begins. Proves the PR workflow functions end-to-end.

**Technical Context:**
- `vitest.config.ts` does not yet exist — this story creates it
- `jsdom` is installed; configure Vitest to use it as the test environment
- Write one trivial passing test to prove the runner works
- Verify `npm run lint`, `npm run build`, and `npm test` all pass cleanly
- Verify `gh auth status` is authenticated — if not, stop and report
- **Read before coding:** `node_modules/next/dist/docs/`, react-pdf v10 README, pdfjs-dist v5 CHANGELOG, Tailwind v4 docs. Document any version-specific findings in the PR body.

**Acceptance Criteria:**

Given the project is checked out on a clean main branch,
When the developer runs `npm run lint`,
Then ESLint exits with zero errors and zero warnings.

Given the project is checked out on a clean main branch,
When the developer runs `npm run build`,
Then Next.js produces a successful static build with no TypeScript errors.

Given `vitest.config.ts` is created with jsdom environment,
When the developer runs `npm test`,
Then Vitest discovers and passes at least one test in `tests/`.

Given the developer runs `gh auth status`,
Then the output confirms an authenticated GitHub account — if not authenticated, the story is blocked until resolved.

**Files Likely to Change:**
- `vitest.config.ts` — create; configure jsdom, test file pattern `tests/**/*.test.{ts,tsx}`
- `tests/lib/baseline.test.ts` — create; one trivial assertion (`expect(1 + 1).toBe(2)`)

**Implementation Notes:**
- Vitest 4.x configuration syntax may differ from v2/v3 — read installed package docs
- Set `globals: true` in Vitest config to avoid importing `describe`/`it`/`expect` in every test file
- Do not modify any `src/` files in this story

**Manual Verification Steps:**
1. Run `npm run lint` → exits 0
2. Run `npm run build` → exits 0, no TypeScript errors
3. Run `npm test` → 1 test passes
4. Run `gh auth status` → shows authenticated account

**Test Ideas:**
- `baseline.test.ts`: `expect(true).toBe(true)` — proves runner works

**Out of Scope:**
- Any application code
- Coverage configuration (defer to later)
- CI/CD pipeline (deferred)

**Depends On:** Nothing — this is the first story.

**Branch:** `infra/project-baseline-verification`
**PR Title:** `infra: verify project toolchain and configure Vitest`

---

### Story 1.2: App Shell and Upload Surface

As a user,
I want to see the SignStack interface when I open the app,
So that I understand immediately what the tool does and how to start.

**Product Value:** The first thing every user sees. Establishes design system tokens and the persistent privacy disclaimer.

**Technical Context:**
- Tailwind v4 uses CSS `@theme` directive — no `tailwind.config.js`. Read Tailwind v4 docs before authoring any CSS.
- `src/app/globals.css`: `@import "tailwindcss"` + `@theme` block with all design tokens from UX spec
- `src/app/layout.tsx`: root layout; viewport metadata; renders children
- `src/app/page.tsx`: renders `<UploadZone />` and `<DisclaimerBar />`; no state yet
- `src/components/upload/UploadZone.tsx`: visual shell only — styled drop zone with placeholder text, browse button (non-functional), upload icon; no file handling logic
- `src/components/shared/DisclaimerBar.tsx`: full-width bottom bar with lock icon and disclaimer text
- No PDF logic, no state wiring, no file handling in this story

**Acceptance Criteria:**

Given the app is running via `next dev`,
When a user opens `http://localhost:3000`,
Then they see a centered upload zone with "Drop your PDF here" copy and a browse button, and the disclaimer bar at the bottom.

Given the upload zone is rendered,
When a user drags a file over it,
Then the drop zone border changes to blue and the background tints blue (drag-over visual state only — no file handling).

Given any viewport,
When the disclaimer bar is rendered,
Then it shows the lock icon, "Local only ·" label, and full disclaimer text at 12px in muted color.

Given the Tailwind v4 `@theme` tokens are defined in `globals.css`,
When the app renders,
Then primary buttons use `--color-accent` (#2563EB) and the page background uses `--color-bg` (#F5F5F4).

**Files Likely to Change:**
- `src/app/globals.css` — create; Tailwind v4 import + all design tokens
- `src/app/layout.tsx` — create or replace; metadata, viewport, font-free root layout
- `src/app/page.tsx` — create or replace; renders UploadZone + DisclaimerBar
- `src/components/upload/UploadZone.tsx` — create; visual shell
- `src/components/shared/DisclaimerBar.tsx` — create

**Implementation Notes:**
- System font stack only — no Google Font imports in layout (signature fonts load on demand later)
- UX spec design tokens: `--color-accent: #2563EB`, `--color-bg: #F5F5F4`, `--color-surface: #FFFFFF`, `--color-text-primary: #111827`, `--color-text-muted: #6B7280`, `--color-danger: #DC2626`, `--color-overlay-border: #2563EB`, `--color-ink: #1E1B4B`; spacing 8/16/24/32/48/64px; radii 4/8/12px
- `UploadZone` is a `'use client'` component (needs drag events)
- `DisclaimerBar` can be a server component — no interactivity

**Manual Verification Steps:**
1. `next dev` → open localhost:3000
2. Upload zone centered on page with correct copy
3. Disclaimer bar pinned to bottom, visible, correct text
4. Drag any file over the zone → blue border/tint appears (no file processing)
5. Inspect computed CSS — accent color is #2563EB

**Test Ideas:** Visual only at this stage — no unit tests needed for pure markup components.

**Out of Scope:**
- File handling, PDF loading, state wiring (Story 2.1)
- Editor layout (Story 3.2)
- Error states (Story 7.1)

**Depends On:** Story 1.1 (verified toolchain)

**Branch:** `story/app-shell-upload-surface`
**PR Title:** `feat: app shell, design tokens, upload zone, and disclaimer bar`

---

### Story 1.3: Core Domain Types and Reducer State Shape

As a developer,
I want the complete typed state shape and reducer defined,
So that all subsequent stories can dispatch actions and consume state without redefining types.

**Product Value:** Eliminates type drift between stories. The reducer is testable in isolation without any UI or PDF library dependencies.

**Technical Context:**
- `src/types/index.ts` — all shared interfaces: `DocumentState`, `SignatureState`, `Overlay`, `AppState`, `AppAction`
- `src/store/appReducer.ts` — pure function `(AppState, AppAction) => AppState`
- `src/store/appContext.ts` — React Context + Provider wrapping `useReducer`
- `src/store/useAppState.ts` — `useContext` wrapper hook
- `src/app/page.tsx` — wrap with `<AppProvider>` (no behavior change visible to user)
- The full `AppState` and `AppAction` shapes are defined in the Architecture document (AD-5); implement exactly as specified

**Acceptance Criteria:**

Given `AppState` is defined,
When TypeScript compiles the project,
Then all action types and state fields are correctly typed with zero `any` usage.

Given the reducer handles `DOCUMENT_LOADED`,
When the action is dispatched with a file, arrayBuffer, and pageCount,
Then state reflects the new document and clears prior overlays.

Given the reducer handles `OVERLAY_ADDED`,
When the action is dispatched with page index and position,
Then the new overlay appears in `state.overlays` with a unique UUID id.

Given the reducer handles `OVERLAY_DELETED`,
When the action is dispatched with an overlay id,
Then that overlay is removed from `state.overlays` and other overlays are unchanged.

Given the reducer handles `DOCUMENT_CLEARED`,
When the action is dispatched,
Then overlays, signature, and document fields all reset to their initial values.

**Files Likely to Change:**
- `src/types/index.ts` — create
- `src/store/appReducer.ts` — create
- `src/store/appContext.ts` — create
- `src/store/useAppState.ts` — create
- `src/app/page.tsx` — wrap with AppProvider
- `tests/lib/appReducer.test.ts` — create; unit tests for all action types

**Implementation Notes:**
- Use `crypto.randomUUID()` for overlay IDs — never sequential integers
- `Map<number, {...}>` for `pageDimensionsPx` and `pageIntrinsicPt` — keyed by 0-based page index
- Initial state: all nulls/empty arrays/false; `isSignatureModalOpen: false`, `isExporting: false`
- All action type strings in SCREAMING_SNAKE_CASE
- `AppProvider` in `page.tsx` must not break the existing upload zone render

**Manual Verification Steps:**
1. `npm run build` — no TypeScript errors
2. `npm test` — all reducer unit tests pass
3. Open app — upload zone still renders correctly (no regression)

**Test Ideas:**
- `DOCUMENT_LOADED` sets document fields correctly
- `DOCUMENT_LOADED` clears previous overlays
- `OVERLAY_ADDED` generates unique IDs for each call
- `OVERLAY_DELETED` removes only the targeted overlay
- `OVERLAY_MOVED` updates x/y of correct overlay
- `OVERLAY_RESIZED` updates width/height of correct overlay
- `DOCUMENT_CLEARED` resets to initial state
- `UPLOAD_ERROR` sets `ui.uploadError` string
- `UPLOAD_ERROR_CLEAR` clears `ui.uploadError`

**Out of Scope:**
- Any UI that reads from state (that comes in later stories)
- PDF loading or validation (Story 2.1)

**Depends On:** Story 1.2

**Branch:** `story/core-domain-types-reducer`
**PR Title:** `feat: typed AppState, AppAction, and reducer with unit tests`

---

## Epic 2: PDF Upload and Validation

**Goal:** Users can load a local PDF into session memory via file picker or drag-and-drop. Invalid files are rejected with clear messages. All processing is local — zero network activity.

---

### Story 2.1: PDF Upload and Validation

As a user,
I want to drag-and-drop or browse for a local PDF file,
So that my document loads into the app without ever leaving my device.

**Product Value:** The entry point to the entire signing flow. Without this, nothing else runs.

**Technical Context:**
- `src/lib/pdf/pdfValidator.ts` — validation logic: size check (`file.size`), MIME check (`file.type`), `%PDF` header check (read first 4 bytes of ArrayBuffer), returns typed result
- `src/hooks/usePdfDocument.ts` — orchestrates file → validate → `file.arrayBuffer()` → dispatch `DOCUMENT_LOADED` or `UPLOAD_ERROR`
- `src/components/upload/UploadZone.tsx` — wire drag-drop events and file input to `usePdfDocument`; implement all visual states from UX-DR1
- File picker must filter to `.pdf` extension
- Drag-and-drop: `dragover`, `dragenter`, `dragleave`, `drop` events on the entire zone
- On valid load: dispatch `DOCUMENT_LOADED` (file, arrayBuffer, pageCount=0 placeholder until rendering)
- On invalid: dispatch `UPLOAD_ERROR` with specific message; zone stays active
- **Privacy check:** No `fetch`, `XMLHttpRequest`, or `navigator.sendBeacon` calls anywhere in this story

**Acceptance Criteria:**

Given a valid PDF file under 25 MB,
When the user drops it onto the upload zone,
Then `DOCUMENT_LOADED` is dispatched and the zone no longer shows an error.

Given a non-PDF file (e.g. `.docx`),
When the user drops it onto the zone,
Then an inline error "This file is not a PDF. Please select a PDF file." appears and the zone remains active.

Given a PDF file over 25 MB,
When the user drops it onto the zone,
Then an inline error "This file exceeds the 25 MB limit." appears and the zone remains active.

Given a file with a `.pdf` extension but missing the `%PDF` header,
When the user drops it onto the zone,
Then an inline error appears indicating the file could not be read.

Given the file picker is opened,
When the OS dialog appears,
Then it filters to `.pdf` files by default.

Given a valid PDF is loaded via file picker,
When `file.arrayBuffer()` resolves,
Then `DOCUMENT_LOADED` is dispatched with the correct `File` object and `ArrayBuffer`.

Given any file operation,
When DevTools Network panel is open,
Then zero network requests are made carrying file content.

**Files Likely to Change:**
- `src/lib/pdf/pdfValidator.ts` — create
- `src/hooks/usePdfDocument.ts` — create
- `src/components/upload/UploadZone.tsx` — wire events, all visual states
- `tests/lib/pdfValidator.test.ts` — create

**Implementation Notes:**
- Validation order: size → MIME → `%PDF` header → pass to pdfjs (pdfjs catches encrypted/corrupt)
- `%PDF` header check: `new Uint8Array(arrayBuffer.slice(0, 4))` → compare to `[0x25, 0x50, 0x44, 0x46]`
- Do not call `file.arrayBuffer()` before size and MIME checks pass (avoid loading oversized files)
- `UploadZone` drag-over state: set via React state, not CSS `:hover`
- The `DOCUMENT_LOADED` `pageCount` field can be 0 at this stage — rendering (Story 3.2) will determine actual page count

**Manual Verification Steps:**
1. Drag a valid PDF → zone loads, no error
2. Drag a `.jpg` → red border + "not a PDF" message; zone stays active
3. Create a fake PDF (rename `.txt` to `.pdf`) with no `%PDF` header → error message
4. Browse files → OS dialog shows PDF filter
5. DevTools Network → no requests on file drop

**Test Ideas:**
- `pdfValidator`: returns error for `file.size > 25 * 1024 * 1024`
- `pdfValidator`: returns error for non-PDF MIME type
- `pdfValidator`: returns error for missing `%PDF` header
- `pdfValidator`: returns success for valid mock PDF bytes

**Out of Scope:**
- PDF rendering (Story 3.2)
- Session replacement UI confirmation (per A-2, no confirmation prompt needed)
- Multiple file selection (Phase 3)

**Depends On:** Story 1.3 (state shape and reducer)

**Branch:** `story/pdf-upload-validation`
**PR Title:** `feat: PDF upload, drag-drop, file validation, and error states`

---

## Epic 3: PDF Rendering

**Goal:** Uploaded PDFs render page-by-page in a scrollable editor. Pages load lazily. The system stores the rendered and intrinsic dimensions needed for coordinate mapping.

---

### Story 3.1: PDF Viewer Worker Setup and Verification

As a developer,
I want the pdfjs-dist v5 worker correctly configured,
So that react-pdf v10 can render PDF pages without errors in all three target browsers.

**Product Value:** Unblocks all PDF rendering stories. Worker misconfiguration causes silent failures that are hard to debug mid-story.

**Technical Context:**
- pdfjs-dist v5 changed the worker path/API relative to v4. The exact `workerSrc` must be read from the installed package.
- Read `node_modules/pdfjs-dist/CHANGELOG.md` and `node_modules/react-pdf/README.md` before writing any code
- `src/lib/pdf/pdfWorker.ts` — configure `GlobalWorkerOptions.workerSrc`; this module is imported once at app startup
- Import this module in `src/app/page.tsx` (client side only) or in the `PDFScrollArea` component
- The worker file path in pdfjs-dist v5 may be `pdf.worker.min.mjs` — **verify before hardcoding**
- Must use `new URL('...', import.meta.url).toString()` pattern for webpack/Next.js bundler compatibility

**Acceptance Criteria:**

Given `pdfWorker.ts` is imported in a `'use client'` component,
When the component mounts in Chrome 110+, Firefox 110+, and Safari 16+,
Then the browser console shows no worker-related errors.

Given the worker is configured,
When a PDF is loaded and rendered (even a single page),
Then no "Setting up fake worker failed" or "worker is not loaded" errors appear in console.

Given the module is imported,
When `npm run build` runs,
Then no bundler errors or warnings about missing worker files appear.

**Files Likely to Change:**
- `src/lib/pdf/pdfWorker.ts` — create
- `src/app/page.tsx` — import pdfWorker (or the component that uses it imports it)

**Implementation Notes:**
- Do not hardcode the worker path — derive it from the installed package using `import.meta.url`
- If react-pdf v10 provides its own worker setup mechanism, prefer that over manual configuration
- This story has no visible UI change — it is infrastructure only
- Test by temporarily adding a minimal `<Document>` render in a test component; remove after verification

**Manual Verification Steps:**
1. Load the app in Chrome → console shows no worker errors
2. Load the app in Firefox → no worker errors
3. Load the app in Safari → no worker errors
4. `npm run build` → no bundler warnings about worker

**Test Ideas:** Integration only (browser console check). No unit tests for this story.

**Out of Scope:**
- Actual page rendering (Story 3.2)
- react-pdf `<Document>` or `<Page>` component integration (Story 3.2)

**Depends On:** Story 2.1 (document loaded into state)

**Branch:** `story/pdf-viewer-worker-setup`
**PR Title:** `feat: configure pdfjs-dist v5 worker for react-pdf v10`

---

### Story 3.2: Render First PDF Page and Editor Layout

As a user,
I want to see my PDF render in the editor after uploading,
So that I can confirm my document loaded correctly before signing.

**Product Value:** The first critical success moment — the user sees their actual document rendered in the browser.

**Technical Context:**
- `src/components/editor/EditorToolbar.tsx` — 48px sticky top bar; logo left; `+ Add Signature` (disabled/greyed, no action yet); `↓ Download Signed PDF` (disabled, no action yet)
- `src/components/editor/PDFScrollArea.tsx` — `'use client'`; dynamic import with `ssr: false`; uses react-pdf v10 `<Document>` and `<Page>` components; renders all pages in a scrollable container
- `src/components/editor/PDFPageRenderer.tsx` — wraps a single react-pdf `<Page>`; receives `pageNumber` (1-based) and `containerWidth`
- `src/app/page.tsx` — conditional render: if `state.document.arrayBuffer` is null → show `UploadZone`; else → show editor (EditorToolbar + PDFScrollArea + DisclaimerBar)
- Target: first page renders within 3 seconds for ≤ 10 MB / ≤ 20 page documents (NFR-P1)
- react-pdf v10 API **must be read from installed package** before implementing — `<Document>` and `<Page>` props may differ from v7/v8

**Acceptance Criteria:**

Given a valid PDF is loaded via upload,
When `state.document.arrayBuffer` is non-null,
Then the editor layout replaces the upload screen without a full page reload.

Given the editor is shown,
When the PDF renders,
Then the first page is visible within 3 seconds for a ≤ 10 MB document on a modern desktop.

Given the editor is shown,
When the toolbar renders,
Then the logo is on the left, `+ Add Signature` in the center, and `↓ Download Signed PDF` on the right.

Given the PDF scroll area renders,
When pages display,
Then each page appears as a white card with a subtle shadow against the light-gray background.

Given a multi-page document,
When the user scrolls,
Then all pages are present in the DOM (or placeholders for lazy rendering in Story 3.3).

**Files Likely to Change:**
- `src/components/editor/EditorToolbar.tsx` — create
- `src/components/editor/PDFScrollArea.tsx` — create
- `src/components/editor/PDFPageRenderer.tsx` — create
- `src/app/page.tsx` — add conditional render (upload vs editor)

**Implementation Notes:**
- `PDFScrollArea` must be dynamically imported with `ssr: false` — it uses browser-only APIs
- Pass `arrayBuffer` to react-pdf `<Document file={...}>` — verify prop name in v10
- `containerWidth` for `<Page>` should be the scroll area's rendered width (~794px)
- Dispatch `DOCUMENT_LOADED` with correct `pageCount` once `onDocumentLoadSuccess` fires (react-pdf callback — verify name in v10)
- Use `'use client'` on all editor components

**Manual Verification Steps:**
1. Upload a PDF → editor appears (no upload zone)
2. First page visible within 3 seconds
3. Scroll through multi-page document — all pages present
4. Toolbar visible with three sections
5. DevTools → no unhandled promise rejections

**Test Ideas:** Visual/integration only — no unit tests for rendering components.

**Out of Scope:**
- Lazy rendering (Story 3.3)
- Page number captions (Story 3.3)
- Signature/overlay functionality (Epics 4–5)
- Keyboard overlay support (Story 5.5)

**Depends On:** Story 3.1 (worker configured)

**Branch:** `story/render-first-pdf-page`
**PR Title:** `feat: editor layout and PDF page rendering via react-pdf v10`

---

### Story 3.3: Page Navigation and Lazy Rendering

As a user,
I want all pages visible when I scroll through my PDF,
So that I can find the right page to place my signature without slowdowns.

**Product Value:** Enables the multi-page signing flow. Lazy rendering keeps the app fast on large documents.

**Technical Context:**
- `PDFScrollArea` uses `IntersectionObserver` to detect which pages are near the viewport
- Only pages within a ±1 page buffer of the viewport are actively rendered; others show a placeholder div of the correct height
- Page number captions: `"Page N of M"` centered below each page in 12px muted text
- `currentVisiblePageIndex` tracked in `PDFScrollArea` local state (for overlay placement in Story 5.1)
- Estimated page height before render: use a fixed placeholder height (e.g. 1056px for A4) until first render; update after `onRenderSuccess`

**Acceptance Criteria:**

Given a 20-page document,
When the user opens the editor,
Then only the first 2 pages actively render on mount; pages 3–20 show height-preserving placeholders.

Given the user scrolls to page 8,
When page 8 enters the viewport,
Then pages 7–9 render and far-off pages may unrender.

Given any page renders,
When it appears in the editor,
Then a "Page N of M" caption is visible centered below it in muted text.

Given the first page renders,
When the render completes,
Then it is visible within 3 seconds (NFR-P1 maintained).

**Files Likely to Change:**
- `src/components/editor/PDFScrollArea.tsx` — add IntersectionObserver logic, page placeholders
- `src/components/editor/PDFPageRenderer.tsx` — add `onRenderSuccess` callback for dimension capture

**Implementation Notes:**
- `IntersectionObserver` root: the scroll container; rootMargin: `"200px 0px"` (preload ahead)
- Page placeholder: `<div style={{ height: estimatedHeightPx, width: containerWidth }} />`
- `currentVisiblePageIndex`: the page with the largest intersection ratio — used in Story 5.1

**Manual Verification Steps:**
1. Upload a 10+ page PDF → only first pages rendered initially (DevTools Elements → react-pdf canvases visible for page 1-2 only)
2. Scroll to page 5 → page 5 renders
3. Page number captions visible below each page
4. No visible performance lag scrolling through a 20-page document

**Test Ideas:** Integration only (IntersectionObserver requires jsdom setup); defer browser testing to manual verification.

**Out of Scope:**
- Thumbnail navigation (post-MVP)
- Zoom controls (post-MVP)
- Page jump / page picker (post-MVP)

**Depends On:** Story 3.2

**Branch:** `story/page-navigation-lazy-rendering`
**PR Title:** `feat: lazy page rendering with IntersectionObserver and page captions`

---

### Story 3.4: Rendered Page Measurement

As a developer,
I want rendered page pixel dimensions and PDF intrinsic point dimensions stored in state,
So that coordinate mapping (Story 4.1) has accurate data to convert overlay positions to PDF space.

**Product Value:** Invisible to the user but critical — without accurate dimensions, embedded signatures appear at wrong positions.

**Technical Context:**
- On each `onRenderSuccess` (react-pdf v10 callback — verify name): capture the rendered canvas pixel width and height → dispatch `PAGE_DIMENSIONS_SET`
- PDF intrinsic dimensions (in points): access via `pdfjs-dist`'s `PDFPageProxy.getViewport({ scale: 1 })` → width and height in points → dispatch `PAGE_INTRINSIC_SET`
- Both maps are keyed by 0-based page index
- `PDFPageProxy` is accessible from react-pdf's `onLoadSuccess` at the page level (verify in v10 API)
- `scale: 1` returns native PDF dimensions in points (1 point = 1/72 inch)

**Acceptance Criteria:**

Given a PDF with pages of known dimensions (e.g. standard Letter: 612×792 pt),
When page 1 finishes rendering,
Then `state.document.pageDimensionsPx[0]` contains the rendered pixel width and height.

Given the same page,
When `PAGE_INTRINSIC_SET` is dispatched,
Then `state.document.pageIntrinsicPt[0]` contains `{ width: 612, height: 792 }` for a Letter-size page.

Given a multi-page document with different page sizes,
When all pages have rendered,
Then each page index has its own entry in both maps.

**Files Likely to Change:**
- `src/components/editor/PDFPageRenderer.tsx` — add callbacks to capture and dispatch dimensions
- `src/store/appReducer.ts` — handle `PAGE_DIMENSIONS_SET` and `PAGE_INTRINSIC_SET` (may already be stubbed from Story 1.3)

**Implementation Notes:**
- If react-pdf v10 exposes `PDFPageProxy` differently, adapt accordingly — read v10 API docs
- Log captured dimensions to console during development for verification; remove before PR
- Both dispatches should fire once per page after first render

**Manual Verification Steps:**
1. Upload a standard Letter PDF → open React DevTools or add a debug overlay → confirm `pageDimensionsPx[0]` and `pageIntrinsicPt[0]` are populated
2. For A4 PDF (595×842 pt) → verify intrinsic dimensions match
3. `npm run build` → no TypeScript errors on Map usage

**Test Ideas:**
- Reducer test: `PAGE_DIMENSIONS_SET` populates correct page index in Map
- Reducer test: `PAGE_INTRINSIC_SET` populates correct page index in Map
- Reducer test: existing dimensions for other pages are unchanged

**Out of Scope:**
- Coordinate conversion (Story 4.1 — uses these values)
- Any overlay positioning logic

**Depends On:** Story 3.3

**Branch:** `story/rendered-page-measurement`
**PR Title:** `feat: capture and store rendered page pixel and PDF point dimensions`

---

## Epic 4: Coordinate System and Signature Creation

**Goal:** The coordinate conversion utility is established and tested. Users can create a Signature via two paths (drawn or typed) and confirm it for placement as an Overlay.

---

### Story 4.1: Coordinate Conversion Utility

As a developer,
I want a tested coordinate conversion module,
So that Overlay pixel positions can be precisely transformed to PDF point space for embedding.

**Product Value:** The most failure-prone part of the export pipeline. Centralizing and testing it prevents incorrect signature placement.

**Technical Context:**
- `src/lib/pdf/coordinateMapper.ts` — single exported function (or class with static methods)
- Inputs: overlay `{ x, y, width, height }` (all in screen pixels), `renderedPageDimensionsPx: { width, height }`, `pdfPageIntrinsicPt: { width, height }`
- Outputs: `{ xPt, yPt, widthPt, heightPt }` — all in PDF points
- Formula:
  - `scaleFactor = renderedPageDimensionsPx.width / pdfPageIntrinsicPt.width`
  - `xPt = overlay.x / scaleFactor`
  - `widthPt = overlay.width / scaleFactor`
  - `heightPt = overlay.height / scaleFactor`
  - `yPt = pdfPageIntrinsicPt.height - (overlay.y / scaleFactor) - heightPt`  ← Y-axis flip (PDF origin is bottom-left)
- All input/output variable names follow the `Px`/`Pt` suffix convention (AD-3)

**Acceptance Criteria:**

Given a rendered page of 612px wide representing a 612pt wide PDF page (scale 1.0),
When the overlay is at `{ x: 100, y: 100, width: 200, height: 50 }`,
Then the output is `{ xPt: 100, yPt: 642, widthPt: 200, heightPt: 50 }`.
(yPt = 792 - 100 - 50 = 642)

Given a rendered page of 816px wide representing a 612pt wide PDF page (scale 4/3),
When the overlay is at `{ x: 408, y: 528, width: 204, height: 68 }`,
Then the output is `{ xPt: 306, yPt: 543, widthPt: 153, heightPt: 51 }`.

Given any valid input,
When `xPt` and `yPt` are within the page bounds,
Then the output coordinates are within `[0, pageWidthPt]` and `[0, pageHeightPt]`.

**Files Likely to Change:**
- `src/lib/pdf/coordinateMapper.ts` — create
- `tests/lib/coordinateMapper.test.ts` — create; multiple test cases covering scale factor variations and Y-axis flip

**Implementation Notes:**
- No external dependencies — pure math functions only
- Add JSDoc only if the Y-flip formula warrants explanation (it does)
- Test with fractional pixel values (ensure no integer truncation errors)

**Manual Verification Steps:**
1. `npm test` → all `coordinateMapper.test.ts` cases pass
2. Manually verify Y-flip: an overlay at top of page (y=0) should produce `yPt ≈ pageHeightPt - overlayHeightPt` (near top in PDF space = near max yPt)

**Test Ideas:**
- Scale factor 1.0 — pixels and points are equal; Y-flip only
- Scale factor 4/3 — typical rendering at 96 DPI for 72 DPI PDF
- Overlay at page origin `{ x:0, y:0 }` → PDF origin bottom-left
- Overlay at bottom-right corner → PDF top-right area
- Zero-size overlay edge case

**Out of Scope:**
- pdf-lib integration (Story 6.1)
- Any UI

**Depends On:** Story 3.4 (data this utility consumes is now in state)

**Branch:** `story/coordinate-conversion-utility`
**PR Title:** `feat: screen-to-PDF coordinate mapper with unit tests`

---

### Story 4.2: Signature Creation Modal Shell

As a user,
I want to click "Add Signature" and see a modal appear,
So that I can begin creating my signature in a focused, distraction-free interface.

**Product Value:** Opens the signature creation flow. The modal shell — tabs, close behavior, focus trap — must be correct before the drawing and typing content is added in the next two stories.

**Technical Context:**
- `src/components/signature/SignatureModal.tsx` — modal shell; title "Create Signature"; `×` close button; Draw / Type tabs (empty content areas for now); Cancel and `Use Signature` buttons (disabled — no signature yet); dark scrim behind modal
- Wire `EditorToolbar`'s `+ Add Signature` button to dispatch `SIGNATURE_MODAL_OPEN`
- `SignatureModal` renders when `state.ui.isSignatureModalOpen === true`
- Close via `×`, Cancel button, or Escape key → dispatch `SIGNATURE_MODAL_CLOSE`
- Focus trap: Tab key must not leave the modal while open
- Remembers last-used tab in local state (Draw default on first open)
- `Use Signature` is always disabled in this story (no signature content yet)

**Acceptance Criteria:**

Given the editor is showing a loaded document,
When the user clicks `+ Add Signature`,
Then the signature modal opens centered on screen with a dark scrim.

Given the modal is open,
When the user presses Escape,
Then the modal closes and focus returns to the `+ Add Signature` button.

Given the modal is open,
When the user presses Tab repeatedly,
Then focus cycles only through controls within the modal — it does not reach toolbar or page controls.

Given the modal is open,
When the user clicks the `×` button or Cancel,
Then the modal closes without dispatching `SIGNATURE_CREATED`.

Given the modal is open,
When Draw and Type tabs are visible,
Then clicking each tab switches the active tab (content area is empty in this story).

**Files Likely to Change:**
- `src/components/signature/SignatureModal.tsx` — create
- `src/components/editor/EditorToolbar.tsx` — wire Add Signature button to dispatch

**Implementation Notes:**
- Focus trap implementation: on modal open, `ref.current?.focus()` on first focusable element; intercept Tab/Shift+Tab keydown to wrap within modal
- Scrim: `position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50`
- Modal: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 51`
- `ARIA: role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title

**Manual Verification Steps:**
1. Click `+ Add Signature` → modal opens with scrim
2. Press Escape → modal closes
3. Tab through modal → focus stays within modal
4. Click × → modal closes
5. No ARIA errors in browser accessibility tools

**Test Ideas:**
- Reducer: `SIGNATURE_MODAL_OPEN` sets `isSignatureModalOpen: true`
- Reducer: `SIGNATURE_MODAL_CLOSE` sets `isSignatureModalOpen: false`

**Out of Scope:**
- Drawn signature canvas (Story 4.3)
- Typed signature input (Story 4.4)
- `Use Signature` button being enabled (Stories 4.3, 4.4)

**Depends On:** Story 1.3 (modal open/close actions in reducer)

**Branch:** `story/signature-modal-shell`
**PR Title:** `feat: signature creation modal shell with tabs, focus trap, and keyboard close`

---

### Story 4.3: Drawn Signature Creation

As a user,
I want to draw my signature with my mouse or trackpad on a canvas,
So that I can capture a handwritten-style signature for my documents.

**Product Value:** One of the two core signature creation paths. Many users will prefer this over typed for a more authentic look.

**Technical Context:**
- `src/components/signature/DrawTab.tsx` — wraps `react-signature-canvas` (v1.1.0-alpha.2 — **verify API against installed source before coding**)
- Canvas with a horizontal guideline at bottom-third (a thin gray `<div>` or canvas line)
- `Clear` button → calls canvas `.clear()` method
- `Use Signature` button in `SignatureModal` becomes enabled when canvas is non-empty (detect via `.isEmpty()` method — verify API)
- `src/hooks/useSignature.ts` — `captureDrawnSignature(canvasRef): string` → calls `canvasRef.current.toDataURL('image/png')` → returns PNG data URL
- On `Use Signature`: capture PNG → dispatch `SIGNATURE_CREATED({ dataUrl, type: 'drawn' })` → dispatch `SIGNATURE_MODAL_CLOSE`
- Ink color: `#1E1B4B` (`--color-ink`)

**Acceptance Criteria:**

Given the Draw tab is active,
When the user draws strokes on the canvas,
Then a continuous ink stroke appears in `--color-ink` color.

Given the user has drawn strokes,
When the canvas is non-empty,
Then the `Use Signature` button becomes enabled.

Given the user clicks `Clear`,
When the canvas clears,
Then the `Use Signature` button disables again (canvas is empty).

Given the user clicks `Use Signature` with a non-empty canvas,
When the action dispatches,
Then `state.signature.dataUrl` is a non-null PNG data URL and `state.signature.type === 'drawn'`.

Given the modal closes after confirmation,
When the editor is visible,
Then focus returns to the `+ Add Signature` button.

**Files Likely to Change:**
- `src/components/signature/DrawTab.tsx` — create
- `src/hooks/useSignature.ts` — create (drawn capture function)
- `src/components/signature/SignatureModal.tsx` — wire `Use Signature` enabled state from DrawTab

**Implementation Notes:**
- `react-signature-canvas` 1.1.0-alpha.2: read installed source at `node_modules/react-signature-canvas/` before using any API
- Canvas background: transparent (so PNG captures ink on transparent background)
- Guideline: absolutely positioned thin gray horizontal line at 70% of canvas height
- Touch events are supported by the library (AD-9) — do not block them; do not add touch-specific code

**Manual Verification Steps:**
1. Open modal → Draw tab active → empty canvas with guideline
2. Draw strokes → ink appears in dark blue/black
3. `Use Signature` enabled only after strokes; disabled initially and after Clear
4. Confirm → modal closes → `state.signature.dataUrl` non-null (verify via React DevTools)

**Test Ideas:**
- `useSignature.captureDrawnSignature`: given a mocked canvas ref with `toDataURL`, returns the data URL
- Reducer: `SIGNATURE_CREATED` sets `dataUrl` and `type` correctly

**Out of Scope:**
- Typed signature (Story 4.4)
- Overlay placement (Story 5.1 — signature goes to state here; placement is next epic)

**Depends On:** Story 4.2

**Branch:** `story/drawn-signature-creation`
**PR Title:** `feat: drawn signature canvas with clear, validation, and PNG capture`

---

### Story 4.4: Typed Signature Creation

As a user,
I want to type my name and choose a font style,
So that I can create a clean, professional-looking typed signature without drawing.

**Product Value:** The primary path for most users. Typed signatures with Google Fonts produce signatures that look professional and are often preferred over hand-drawn on a trackpad.

**Technical Context:**
- `src/components/signature/TypeTab.tsx` — text input (auto-focused on tab activation); font style picker (Clean / Script / Formal buttons); passes selection to `TypedPreview`
- `src/components/signature/TypedPreview.tsx` — renders the preview at 32px in the selected font; shows a loading indicator while fonts are fetching
- `src/lib/signature/fontLoader.ts` — dynamically injects Google Fonts `<link>` on first Type tab activation; tracks load state; falls back gracefully on failure
- `src/lib/signature/typedSignatureRenderer.ts` — renders text to an offscreen `<canvas>` using the selected font family at a large size (e.g. 64px for quality); returns `canvas.toDataURL('image/png')`
- Default font style: Script (Dancing Script)
- Font families: Clean → `'Caveat'`; Script → `'Dancing Script'`; Formal → `'Pinyon Script'`
- `Use Signature` enabled only when text input is non-empty
- On confirm: `typedSignatureRenderer(text, fontFamily)` → PNG data URL → `SIGNATURE_CREATED`

**Acceptance Criteria:**

Given the user activates the Type tab for the first time,
When the tab becomes active,
Then a font loading request is made to Google Fonts and a loading indicator shows while fonts load.

Given fonts are loaded and the user types their name,
When text appears in the input,
Then the preview updates live in the selected font style.

Given the user types text and clicks a different font style,
When the style changes,
Then the preview re-renders in the new font without clearing the text.

Given the text input is empty,
When the `Use Signature` button is rendered,
Then it is disabled.

Given the user has typed a name and confirms,
When `Use Signature` is clicked,
Then `state.signature.dataUrl` is a valid PNG data URL of the text rendered in the selected font.

**Files Likely to Change:**
- `src/components/signature/TypeTab.tsx` — create
- `src/components/signature/TypedPreview.tsx` — create
- `src/lib/signature/fontLoader.ts` — create
- `src/lib/signature/typedSignatureRenderer.ts` — create
- `src/hooks/useSignature.ts` — add typed capture function

**Implementation Notes:**
- Font loading: inject `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Pinyon+Script&display=swap">` on first Type tab open only
- `document.fonts.ready` or `link.onload` to detect font load completion
- Offscreen canvas size: 600px wide × 120px tall at 64px font gives good resolution for the PNG
- Fill style for ink: `#1E1B4B` (`--color-ink`)
- The network request for Google Fonts is for the font stylesheet/files — **not Document content** — and is permitted under NFR-PV1

**Manual Verification Steps:**
1. Open modal → click Type tab → loading indicator appears briefly, then fonts available
2. Type name → preview updates in Script style immediately
3. Click Clean → preview changes to Caveat font
4. Click Formal → preview changes to Pinyon Script
5. Clear input → Use Signature disables
6. Confirm → React DevTools show `signature.type === 'typed'` and non-null `dataUrl`

**Test Ideas:**
- `typedSignatureRenderer`: given text and font family, returns a string starting with `data:image/png`
- `fontLoader`: calling twice returns the same promise (singleton)

**Out of Scope:**
- Custom font uploads (post-MVP)
- More than 3 font styles (Phase 2+)

**Depends On:** Story 4.2 (modal shell)

**Branch:** `story/typed-signature-creation`
**PR Title:** `feat: typed signature with Google Fonts, font style picker, and live preview`

---

## Epic 5: Signature Overlay

**Goal:** After creating a Signature, users can place it as a draggable, resizable Overlay on any page, select and delete it, and nudge it with the keyboard.

---

### Story 5.1: Overlay State Model and Default Placement Logic

As a developer,
I want overlay state and default placement logic tested in isolation,
So that the overlay rendering story (5.2) can rely on correct state without debugging both at once.

**Product Value:** Clean separation between state logic and rendering. The reducer overlay actions are the foundation every overlay story builds on.

**Technical Context:**
- All reducer overlay actions (`OVERLAY_ADDED`, `OVERLAY_MOVED`, `OVERLAY_RESIZED`, `OVERLAY_DELETED`, `OVERLAY_SELECTED`) were stubbed in Story 1.3; implement them fully now
- `src/hooks/useOverlays.ts` — `addOverlay(pageIndex, pageDimensionsPx, signature)` helper: computes default position (bottom-right, 5% inset, 200px wide × proportional height) → dispatches `OVERLAY_ADDED`
- After `SIGNATURE_CREATED` dispatches and modal closes, `SignatureModal` (or a parent) calls `addOverlay` using the `currentVisiblePageIndex` from `PDFScrollArea`
- `currentVisiblePageIndex` must be passed down or made available via context
- Default size: 200px wide; height = 200 × (signatureHeight / signatureWidth) from PNG dimensions, minimum 40px

**Acceptance Criteria:**

Given `OVERLAY_ADDED` is dispatched,
When the reducer processes it,
Then `state.overlays` contains one entry with a UUID id, the correct page index, and the correct default position.

Given a page of 794×1028px rendered dimensions and 5% inset rule,
When `addOverlay` computes the default position,
Then `x ≈ 794 * 0.95 - 200 = 555`, `y ≈ 1028 * 0.95 - height`.

Given `OVERLAY_SELECTED` is dispatched with an id,
When the reducer processes it,
Then `state.selectedOverlayId === id`.

Given `OVERLAY_DELETED` is dispatched,
When the reducer processes it,
Then the overlay is removed from `state.overlays` and `state.selectedOverlayId` is set to null if it matched.

**Files Likely to Change:**
- `src/store/appReducer.ts` — implement overlay action handlers fully
- `src/hooks/useOverlays.ts` — create; default placement computation
- `src/components/signature/SignatureModal.tsx` — call `addOverlay` after confirmation
- `tests/lib/appReducer.test.ts` — add tests for overlay actions

**Implementation Notes:**
- PNG dimensions for aspect ratio: create a temporary `Image` object, set `src = dataUrl`, read `naturalWidth`/`naturalHeight` on load
- `currentVisiblePageIndex` — expose from `PDFScrollArea` via a Context value or prop drilling through `page.tsx`

**Manual Verification Steps:**
1. Upload PDF → create and confirm a signature
2. React DevTools → `state.overlays` has one entry with UUID, pageIndex, x, y, width, height

**Test Ideas:**
- Default x/y computation for standard page dimensions
- `OVERLAY_SELECTED` sets `selectedOverlayId`
- Selecting a different overlay clears previous selection
- `OVERLAY_DELETED` also clears `selectedOverlayId` if the deleted overlay was selected

**Out of Scope:**
- Visual rendering of overlays (Story 5.2)

**Depends On:** Story 4.3 or 4.4 (either signature path must work first)

**Branch:** `story/overlay-state-default-placement`
**PR Title:** `feat: overlay state model, default placement logic, and reducer tests`

---

### Story 5.2: Signature Overlay Display

As a user,
I want to see my signature appear on the page after I confirm it,
So that I can verify its appearance and position before moving it.

**Product Value:** The second critical success moment — the user sees their signature sitting on their document for the first time.

**Technical Context:**
- `src/components/overlay/SignatureOverlay.tsx` — wraps `react-rnd`; renders the signature PNG as an `<img>` or `<canvas>` within the rnd container; initial render: no border, no handles (unselected state per UX-DR9)
- `PDFScrollArea` renders `<SignatureOverlay>` for each overlay whose `pageIndex` matches the current page being rendered
- `react-rnd` position is initialized from `overlay.x`, `overlay.y`, `overlay.width`, `overlay.height`
- At this stage: overlay is visible and positioned correctly; no drag/resize interaction yet (that's Story 5.4)
- Cursor: `move` on hover (per UX-DR9)

**Acceptance Criteria:**

Given a signature is created and confirmed,
When the editor renders,
Then the signature image appears at the correct default position on the correct page.

Given the overlay is rendered,
When the user does not click it,
Then no border or resize handles are visible (unselected state).

Given a page with an overlay,
When the editor renders,
Then the overlay appears above the page content (higher z-index than page canvas).

Given overlays on multiple pages,
When each page renders,
Then each page shows only its own overlays.

**Files Likely to Change:**
- `src/components/overlay/SignatureOverlay.tsx` — create
- `src/components/editor/PDFScrollArea.tsx` — render overlays per page
- `src/components/editor/PDFPageRenderer.tsx` — accept and render overlay children

**Implementation Notes:**
- react-rnd v10.5.3: read installed README before using — prop names and defaults may have changed
- `<img src={overlay.signature.dataUrl} />` inside the rnd container; `width: 100%; height: 100%; object-fit: fill`
- `position="absolute"` on the rnd component relative to the page container
- `disableDragging={true}` and `enableResizing={false}` for now — Story 5.4 enables these

**Manual Verification Steps:**
1. Upload PDF → create drawn or typed signature → confirm
2. Signature appears on the visible page at bottom-right area
3. Signature matches what was drawn/typed (visually)
4. Scroll to other pages → no overlays appear on pages without them

**Test Ideas:** Visual only.

**Out of Scope:**
- Selection, drag, resize, delete (Stories 5.3–5.5)
- Multiple overlay display is covered but multi-overlay UX is Story 6.2

**Depends On:** Story 5.1

**Branch:** `story/signature-overlay-display`
**PR Title:** `feat: render signature overlay on PDF page using react-rnd`

---

### Story 5.3: Overlay Select and Delete Behavior

As a user,
I want to click an overlay to select it and delete it with the × button,
So that I can remove a misplaced signature and try again.

**Product Value:** Enables the correction flow (UJ-2). Users need to be able to undo a placement.

**Technical Context:**
- Click on `SignatureOverlay` → dispatch `OVERLAY_SELECTED` → show selected visual state: 1.5px dashed blue border + 8 resize handles (styled `<div>` elements at corners and edges) + `×` delete icon top-right
- `×` delete icon: 20×20px touch target; red on hover; click → dispatch `OVERLAY_DELETED`
- Click on empty page space → dispatch `OVERLAY_SELECTED(null)` → overlay returns to unselected visual state
- Handle `×` click: stop propagation so it doesn't also trigger page-level deselect
- `selectedOverlayId` drives which overlay shows the selected state

**Acceptance Criteria:**

Given an unselected overlay,
When the user clicks it,
Then it shows a blue dashed border, 8 resize handles, and a × icon.

Given a selected overlay,
When the user clicks the empty page area,
Then the overlay returns to unselected state (no border, no handles).

Given a selected overlay,
When the user clicks the × icon,
Then the overlay is removed from the page and from `state.overlays`.

Given a deleted overlay,
When the editor renders,
Then the signature is still in `state.signature` (session Signature persists; only this Overlay is gone).

**Files Likely to Change:**
- `src/components/overlay/SignatureOverlay.tsx` — add selected/unselected visual states, × button
- `src/components/editor/PDFPageRenderer.tsx` — add click handler for page-level deselect

**Implementation Notes:**
- 8 resize handle `<div>`s: absolute positioned at `top-0 left-0`, `top-0 right-0`, `bottom-0 left-0`, `bottom-0 right-0`, `top-0 left-1/2`, `bottom-0 left-1/2`, `top-1/2 left-0`, `top-1/2 right-0`; each 8×8px solid `--color-accent`
- react-rnd may provide resize handle slots — check v10.5.3 API; if so, use those instead of custom divs

**Manual Verification Steps:**
1. Click overlay → blue dashed border + handles + × appear
2. Click page → overlay returns to no-border state
3. Click × → overlay disappears; signature still in state
4. Can place a new overlay after deletion

**Test Ideas:**
- Reducer: `OVERLAY_SELECTED` with null clears selection

**Out of Scope:**
- Drag and resize (Story 5.4)
- Keyboard delete (Story 5.5)

**Depends On:** Story 5.2

**Branch:** `story/overlay-select-delete`
**PR Title:** `feat: overlay select/deselect and delete with visual selection state`

---

### Story 5.4: Overlay Drag and Resize

As a user,
I want to drag my signature overlay to the right position and resize it to fit the signature line,
So that my signature lands precisely where it needs to go.

**Product Value:** The core overlay interaction. Most users will drag the overlay into position immediately after placement.

**Technical Context:**
- Enable react-rnd dragging: `onDragStop` → dispatch `OVERLAY_MOVED` with new `{ x, y }`
- Enable react-rnd resizing: `onResizeStop` → dispatch `OVERLAY_RESIZED` with new `{ x, y, width, height }`
- Bounds: clamp to page dimensions — react-rnd `bounds` prop (set to the page container ref)
- Minimum size: `minWidth={40} minHeight={20}` on react-rnd
- Maximum size: page width × page height (react-rnd `maxWidth`/`maxHeight`)
- Aspect ratio: not locked by default (`lockAspectRatio={false}`)
- Dragging visual state: 85% opacity (UX-DR9)
- During drag: `OVERLAY_SELECTED` for the dragged overlay (should already be selected if user clicked first)

**Acceptance Criteria:**

Given a selected overlay,
When the user drags it to a new position,
Then the overlay moves with the pointer and stops within page bounds.

Given the user drags to the page edge,
When the overlay reaches the edge,
Then it does not go outside the page boundary.

Given a selected overlay,
When the user drags a corner resize handle,
Then both dimensions change simultaneously.

Given the user resizes below 40×20px,
When the resize handle is released,
Then the overlay snaps to the minimum 40×20px size.

Given the overlay is being dragged,
When it is in motion,
Then the overlay shows 85% opacity.

**Files Likely to Change:**
- `src/components/overlay/SignatureOverlay.tsx` — enable drag/resize, add opacity during drag, add bounds/min/max constraints

**Implementation Notes:**
- react-rnd `bounds` prop: reference the page container div (pass as ref)
- `onDrag` (during drag): set local dragging state for opacity
- `onDragStop`: dispatch `OVERLAY_MOVED`
- `onResizeStop`: dispatch `OVERLAY_RESIZED` with all four values (position may shift during resize from left/top handles)

**Manual Verification Steps:**
1. Drag overlay across page → moves with mouse
2. Drag to page edge → stops at boundary
3. Resize using each of the 8 handles
4. Resize to very small → bounces to 40×20px minimum
5. During drag → overlay is visibly semi-transparent

**Test Ideas:**
- Reducer: `OVERLAY_MOVED` updates x/y of correct overlay; other overlays unchanged

**Out of Scope:**
- Snap-to-grid (post-MVP)
- Keyboard nudge (Story 5.5)

**Depends On:** Story 5.3

**Branch:** `story/overlay-drag-resize`
**PR Title:** `feat: overlay drag and resize with bounds clamping and minimum size`

---

### Story 5.5: Keyboard Nudge and Delete

As a keyboard user,
I want to move and delete a selected overlay using keyboard shortcuts,
So that I can position signatures precisely without relying only on mouse drag.

**Product Value:** Completes NFR-A3 (keyboard overlay repositioning). Also makes fine-tuning faster for power users.

**Technical Context:**
- `src/hooks/useKeyboardOverlay.ts` — `useEffect` adds `keydown` listener to `window` when `selectedOverlayId` is non-null AND `isSignatureModalOpen` is false; removes listener on cleanup
- Arrow keys: nudge selected overlay 1px in the direction
- Shift + Arrow: nudge 8px
- `Delete` or `Backspace`: delete selected overlay
- All nudges clamped to page bounds (use `pageDimensionsPx` for the overlay's page from state)
- Hook consumed in `PDFScrollArea` or `page.tsx` (wherever `selectedOverlayId` is accessible)

**Acceptance Criteria:**

Given an overlay is selected and the modal is closed,
When the user presses `ArrowRight`,
Then the overlay moves 1px to the right (clamped to page bounds).

Given an overlay is selected,
When the user presses `Shift+ArrowUp`,
Then the overlay moves 8px upward.

Given an overlay is at the left page edge,
When the user presses `ArrowLeft`,
Then the overlay does not move beyond the page boundary.

Given an overlay is selected,
When the user presses `Delete` or `Backspace`,
Then the overlay is removed (same behavior as clicking ×).

Given the signature modal is open,
When the user presses `Delete`,
Then the modal input is not affected — keyboard handler is inactive while modal is open.

**Files Likely to Change:**
- `src/hooks/useKeyboardOverlay.ts` — create
- `src/components/editor/PDFScrollArea.tsx` or `src/app/page.tsx` — mount hook

**Implementation Notes:**
- `e.preventDefault()` on arrow keys to prevent page scroll when an overlay is selected
- Only prevent default when the event target is not an input/textarea (to avoid breaking modal inputs — but modal will be closed when this hook is active anyway)
- Nudge dispatches `OVERLAY_MOVED` with updated `x`/`y`

**Manual Verification Steps:**
1. Click overlay to select → press arrow keys → overlay nudges 1px per press
2. Hold Shift + arrow → 8px nudge
3. Nudge to edge → stops at page boundary
4. Press Delete → overlay removed
5. Open signature modal → arrow keys don't trigger overlay movement

**Test Ideas:**
- `useKeyboardOverlay`: no listener attached when `selectedOverlayId` is null
- Nudge computation: 1px and 8px deltas; boundary clamp

**Out of Scope:**
- Numeric position input fallback (post-MVP; arrow nudge is sufficient for NFR-A3 MVP 1)

**Depends On:** Story 5.4

**Branch:** `story/keyboard-nudge-delete`
**PR Title:** `feat: keyboard arrow nudge and delete for selected overlay (NFR-A3)`

---

## Epic 6: PDF Export

**Goal:** Users export the Signed Document. All overlays are embedded at correct positions via pdf-lib. Multiple overlays across multiple pages are supported.

---

### Story 6.1: Export Signed PDF

As a user,
I want to click "Download Signed PDF" and receive a signed PDF file,
So that I can send the completed document without any server involvement.

**Product Value:** The climax of the entire user journey. This is what the product exists to do.

**Technical Context:**
- `src/lib/pdf/pdfExporter.ts` — the embedding pipeline:
  1. `PDFDocument.load(state.document.arrayBuffer)` via pdf-lib
  2. For each overlay in `state.overlays`:
     a. Get page: `pdfDoc.getPage(overlay.pageIndex)`
     b. Embed PNG: `pdfDoc.embedPng(state.signature.dataUrl)` (convert data URL to `Uint8Array` first)
     c. Map coordinates: `coordinateMapper.screenToPdf(overlay, pageDimensionsPx, pageIntrinsicPt)`
     d. Draw: `page.drawImage(pdfImage, { x: xPt, y: yPt, width: widthPt, height: heightPt })`
  3. Serialize: `const bytes = await pdfDoc.save()`
  4. Download: `Blob` → `URL.createObjectURL` → programmatic anchor click → `URL.revokeObjectURL`
- `src/hooks/useExport.ts` — wraps the pipeline; dispatches `EXPORT_START`, `EXPORT_SUCCESS`, `EXPORT_ERROR`
- Wire `↓ Download Signed PDF` button in `EditorToolbar` to `useExport`
- Filename: `{original-filename-without-extension}-signed.pdf`
- Export with zero overlays: produces a clean copy of the original (valid behavior per FR-16)
- Target: ≤ 5s for 20-page document with 5 overlays (NFR-P2)

**Acceptance Criteria:**

Given a loaded document with one overlay,
When the user clicks `↓ Download Signed PDF`,
Then the browser initiates a file download named `{original-name}-signed.pdf`.

Given the downloaded file,
When opened in any standard PDF viewer,
Then the signature appears at the correct position on the correct page.

Given the downloaded file,
When pages without overlays are inspected,
Then they are visually identical to the original.

Given the export operation runs,
When DevTools Network is open,
Then zero network requests are made carrying PDF bytes.

Given the export operation runs on a 20-page document with 5 overlays,
When it completes,
Then the download initiates within 5 seconds.

Given export is triggered with no overlays,
When the download completes,
Then the output is a valid clean copy of the original PDF.

**Files Likely to Change:**
- `src/lib/pdf/pdfExporter.ts` — create
- `src/hooks/useExport.ts` — create
- `src/components/editor/EditorToolbar.tsx` — wire Download button

**Implementation Notes:**
- PNG data URL to Uint8Array: `const base64 = dataUrl.split(',')[1]; const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))`
- pdf-lib `embedPng` expects `Uint8Array`; alternatively `embedPng` may accept a data URL directly — check pdf-lib 1.17.1 docs
- All pdf-lib calls are synchronous-ish but `pdfDoc.save()` returns a Promise — `await` it
- Wrap in try/catch; on error dispatch `EXPORT_ERROR`
- `isExporting: true` during export → show loading state on button

**Manual Verification Steps:**
1. Upload PDF → create and position signature → click Download
2. Browser downloads `{name}-signed.pdf`
3. Open in Preview (macOS) / Acrobat / Chrome PDF viewer → signature visible at correct position
4. Multi-page PDF → signature on correct page; other pages unchanged
5. DevTools Network → no requests carrying PDF data

**Test Ideas:**
- `coordinateMapper` integration: given known overlay + page dimensions, output matches expected PDF coords
- `pdfExporter`: given mocked state, produces a Blob (jsdom may not support full pdf-lib — mock if needed)

**Out of Scope:**
- Multiple different signatures per session (MVP 1 uses one session Signature for all overlays)
- Signature reuse UX / Add Another flow (Story 6.2)

**Depends On:** Story 5.4 (overlays with correct positions in state), Story 4.1 (coordinate mapper)

**Branch:** `story/export-signed-pdf`
**PR Title:** `feat: PDF export pipeline with pdf-lib coordinate mapping and browser download`

---

### Story 6.2: Add Another Overlay and Multi-Page Signing

As a user,
I want to add signatures to multiple pages by clicking "Add Signature" again,
So that I can initial every page that requires a signature in one session.

**Product Value:** Enables multi-page contracts and initialing flows — a very common real-world use case.

**Technical Context:**
- OQ-1 resolution: when `state.signature.dataUrl` is non-null, clicking `+ Add Signature` re-opens the modal pre-populated with the existing session Signature
  - Draw tab: shows the existing signature PNG as a preview (non-editable canvas preview)
  - Type tab: shows the existing text in the previously used font (or best approximation)
  - User clicks `Use Signature` to reuse, or draws/types a new one (which replaces the session Signature)
- If reusing: `SIGNATURE_MODAL_CLOSE` + call `addOverlay` with current session `dataUrl`
- If replacing: `SIGNATURE_CREATED` updates `state.signature`; then `addOverlay`
- `EditorToolbar` button label: `+ Add Signature` always (UX spec allows "Add Another" but the PRD allows keeping same label — keep same label for simplicity)
- Existing overlays retain their current `dataUrl` snapshot regardless of whether a new Signature is created (A-3)

**Acceptance Criteria:**

Given a signature has already been created and placed,
When the user clicks `+ Add Signature` again,
Then the modal opens with a preview of the existing session Signature.

Given the modal opens with an existing Signature,
When the user clicks `Use Signature` without modification,
Then a new overlay is placed on the most-visible page using the existing `dataUrl`.

Given two overlays on different pages,
When the user clicks `↓ Download Signed PDF`,
Then the downloaded PDF has both signatures embedded at their correct positions on their correct pages.

Given a multi-page export,
When the PDF is opened in a viewer,
Then all signed pages contain the correct signature and all unsigned pages are unmodified.

**Files Likely to Change:**
- `src/components/signature/SignatureModal.tsx` — pre-populate with existing session Signature when `state.signature.dataUrl` is non-null
- `src/components/signature/DrawTab.tsx` — show existing signature as non-interactive preview
- `src/components/editor/EditorToolbar.tsx` — no label change needed
- `src/hooks/useOverlays.ts` — handle reuse vs. replace logic

**Implementation Notes:**
- Draw tab pre-populate: render existing `dataUrl` PNG in the canvas area with a "Click Clear to start fresh" hint; `Use Signature` is immediately enabled
- The existing overlays are unaffected when a new Signature is created (they captured `dataUrl` at placement time — verify this is stored per-overlay if needed, or if all overlays reference session Signature at export time)
- **Architecture note:** If overlays store only position/size and `state.signature.dataUrl` is the single source of truth, replacing the Signature updates the visual for all overlays. If this is undesirable, overlays must snapshot `dataUrl` at creation time. Implement the snapshot approach (each overlay stores its own `dataUrl`) for cleaner multi-signature behavior.

**Manual Verification Steps:**
1. Upload multi-page PDF → create signature → place on page 1
2. Click `+ Add Signature` → modal opens with existing signature preview
3. Click `Use Signature` → second overlay placed on current visible page
4. Scroll to another page → place third overlay
5. Download → all three signatures at correct positions on correct pages

**Test Ideas:**
- Reducer: overlay `OVERLAY_ADDED` with `dataUrl` snapshot stores correctly per overlay

**Out of Scope:**
- Different signatures per overlay in the same session (post-MVP — for MVP 1, user creates one Signature and all overlays use it)
- Signature library / saved signatures across sessions (post-MVP)

**Depends On:** Story 6.1

**Branch:** `story/add-another-overlay-multi-page`
**PR Title:** `feat: add-another overlay flow and multi-page export verification`

---

## Epic 7: Polish and Documentation

**Goal:** Error states, loading states, WCAG 2.1 AA compliance, and README complete the MVP 1 deliverable.

---

### Story 7.1: Error, Loading, and Empty State Polish

As a user,
I want clear feedback when something goes wrong or is loading,
So that I'm never left wondering if the app is working or broken.

**Product Value:** The difference between a prototype and a product. Users need to trust the tool, and trust requires clear feedback.

**Technical Context:**
- `src/components/shared/ErrorBanner.tsx` — reusable inline error display; receives `message: string`; dismissible via × button; reads from `state.ui.uploadError` and `state.ui.exportError`
- PDF loading state: show spinner in PDFScrollArea while `state.document.arrayBuffer` is non-null but pages haven't begun rendering; dismiss on first `PAGE_DIMENSIONS_SET`
- Font loading state: already handled in TypeTab (Story 4.4) — verify it's correct
- Export loading state: `isExporting: true` → Download button shows spinner/disabled; `isExporting: false` → re-enabled
- Export with zero overlays: the export proceeds normally (clean copy); optionally add a subtle notice "No signatures placed — downloading original"
- Verify all upload error paths (non-PDF, too large, corrupt) show correct inline messages per UX-DR12
- Verify export error shows inline near the Download button per UX-DR13

**Acceptance Criteria:**

Given a non-PDF file is dragged onto the zone,
When the error renders,
Then the message is specific and the zone border is red.

Given the user clicks × on an error banner,
When dismissed,
Then the error message disappears and the zone returns to default state.

Given Export encounters an error,
When the error renders,
Then it appears inline near the Download button and the session state is preserved.

Given Export is in progress,
When `isExporting` is true,
Then the Download button is disabled and shows a loading indicator.

Given a PDF is loading (arrayBuffer non-null, no pages rendered yet),
When the editor shows,
Then a loading indicator is visible in the page scroll area.

**Files Likely to Change:**
- `src/components/shared/ErrorBanner.tsx` — create or enhance
- `src/components/editor/EditorToolbar.tsx` — export loading state on Download button
- `src/components/editor/PDFScrollArea.tsx` — PDF loading indicator
- `src/components/upload/UploadZone.tsx` — verify all error states are correct

**Implementation Notes:**
- Dismiss: dispatch `UPLOAD_ERROR_CLEAR` or `EXPORT_ERROR_CLEAR` (add this action if not in reducer)
- Do not use `alert()` for any error

**Manual Verification Steps:**
1. Drop non-PDF → red border + specific error; dismiss → zone resets
2. Drop oversized file → size error message
3. Click Download → button disables; after export → re-enables
4. Simulate export error (temporarily corrupt the flow) → inline error near button; session preserved

**Test Ideas:**
- Reducer: `UPLOAD_ERROR_CLEAR` sets `ui.uploadError: null`

**Out of Scope:**
- Toast notification system (inline banners are sufficient for MVP 1)
- Retry logic for export (user can click Download again)

**Depends On:** Story 6.1

**Branch:** `story/error-loading-empty-state-polish`
**PR Title:** `feat: error banners, loading states, and empty state polish`

---

### Story 7.2: Privacy Disclaimer and Accessibility Polish

As a user with accessibility needs,
I want all controls to be keyboard-navigable and screen-reader friendly,
So that I can use SignStack without a mouse.

**Product Value:** NFR-A1 and NFR-A2 compliance. Also strengthens the privacy trust signal via a properly announced, always-visible disclaimer.

**Technical Context:**
- Audit all interactive controls: upload zone, Add Signature, Download, modal tabs, Draw/Type controls, Use Signature/Cancel, overlay × button, font style buttons
- ARIA: `role="dialog"` + `aria-modal="true"` on modal (may already exist from Story 4.2); `aria-label` on icon-only buttons; `aria-live` region for error messages
- Contrast: verify all text/background combinations meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large/UI components) against `--color-text-muted` on `--color-surface`
- `DisclaimerBar`: add `role="contentinfo"` or ensure it is in the `<footer>` landmark
- Keyboard flow: Tab from toolbar → page area → disclaimer bar — no focus traps outside modal
- Focus management: after modal closes (Use Signature or Cancel), focus returns to `+ Add Signature` button
- Typed Signature path fully keyboard-accessible (NFR-A2): Tab to Type tab → Tab to text input → Tab to font style buttons → Tab to Use Signature — all reachable without mouse

**Acceptance Criteria:**

Given any interactive control in the app,
When the user navigates with Tab,
Then all interactive controls receive a visible focus indicator.

Given the font style picker in the Type tab,
When the user navigates via Tab and activates with Enter/Space,
Then a font style is selected without a mouse.

Given the disclaimer bar is rendered,
When a screen reader reads the page,
Then the disclaimer text is announced as part of the page's landmark structure.

Given any inline error message,
When it appears,
Then `aria-live="polite"` or `aria-live="assertive"` causes a screen reader to announce it automatically.

Given the signature modal closes,
When focus is returned,
Then the `+ Add Signature` button has focus (verifiable with keyboard or DevTools).

Given all text in the app,
When evaluated against WCAG 2.1 AA contrast ratios,
Then all normal text is ≥ 4.5:1 and all UI components are ≥ 3:1.

**Files Likely to Change:**
- `src/components/shared/DisclaimerBar.tsx` — landmark role
- `src/components/signature/SignatureModal.tsx` — focus return on close; ARIA attributes
- `src/components/signature/TypeTab.tsx` — font style buttons keyboard accessible
- `src/components/shared/ErrorBanner.tsx` — `aria-live` region
- `src/components/upload/UploadZone.tsx` — keyboard accessible (Enter to browse)
- `src/app/globals.css` — focus ring style if not already defined

**Manual Verification Steps:**
1. Tab through entire app with no mouse — reach every control
2. Use VoiceOver (macOS) or NVDA — disclaimer announced; errors announced on appearance
3. Open modal → Tab through all controls → close → focus on Add Signature
4. Font style picker → Tab to Clean → Enter → style changes
5. Browser accessibility tree (DevTools Accessibility panel) → no missing labels

**Test Ideas:** Manual/browser accessibility audit. No unit tests.

**Out of Scope:**
- Full canvas accessibility / ARIA drawing (post-MVP — typed path is the accessible alternative)
- Mobile-optimized layout (post-MVP)

**Depends On:** Story 7.1

**Branch:** `story/privacy-disclaimer-accessibility-polish`
**PR Title:** `feat: WCAG 2.1 AA accessibility audit and privacy disclaimer polish`

---

### Story 7.3: README and Documentation

As a developer or first-time visitor,
I want a clear README explaining what SignStack is and how to run it,
So that I can set up the project locally and understand its legal disclaimer.

**Product Value:** Required for MVP 1 launch. The README is both a developer guide and the legal disclaimer surface required by FR-21 notes and the Product Brief.

**Technical Context:**
- `README.md` — overwrite the existing placeholder content
- Sections: Project description, Privacy guarantee, **Legal disclaimer** (SignStack adds visual signatures — does not create cryptographic digital signatures), Local setup (`npm install && npm run dev`), Tech stack overview, Browser support, Known limitations (no mobile optimization, 25 MB limit, single session)
- The legal disclaimer text is mandated by FR-21 Notes: "SignStack adds visual signatures to PDFs. It does not create certificate-based digital signatures."

**Acceptance Criteria:**

Given the README is written,
When a developer follows the setup instructions,
Then `npm install && npm run dev` brings up the app at `localhost:3000`.

Given the README is written,
When a user reads it,
Then the legal disclaimer is prominently visible and clearly distinguishes visual from cryptographic signatures.

Given the README is written,
When a reader looks for browser support,
Then Chrome 110+, Firefox 110+, and Safari 16+ desktop are listed.

**Files Likely to Change:**
- `README.md` — overwrite

**Implementation Notes:**
- Keep it concise — product description, disclaimer, setup, limitations
- No screenshots required for MVP 1 README (add post-launch)
- Do not reference BMAD or internal planning artifacts in the README

**Manual Verification Steps:**
1. Follow README setup steps on a clean checkout → app runs
2. Legal disclaimer visible and accurate
3. Known limitations listed (25 MB, desktop-first, single session)

**Test Ideas:** None — documentation only.

**Out of Scope:**
- Demo video / GIF (post-MVP)
- Contributing guide (post-MVP)
- GitHub Pages deployment (post-MVP)

**Depends On:** Story 7.2 (all features complete before documenting)

**Branch:** `story/readme-documentation`
**PR Title:** `docs: README with legal disclaimer, setup instructions, and known limitations`

---

## Roadmap Context (Out of Scope for MVP 1)

The following are referenced in Phase 2 and Phase 3 of the Product Brief and are documented here so the team can reason about architectural fit while building MVP 1. **None of these are MVP 1 work — MVP 1 remains visual PDF signing only.** No story in this section may be implemented until MVP 1 ships and the relevant phase is formally opened (own PRD iteration, own architecture pass).

### Guardrail: native PDF text is not edited

True editing of existing PDF text (parsing the content stream, mutating glyphs, reflowing layout, replacing fonts) is **explicitly out of roadmap scope** at every phase below. If a user needs to visually alter existing text, the answer is:

- Phase 2's text-box overlay (place new text over the original), or
- A future whiteout/replacement-overlay workflow (a filled rectangle plus a text overlay on top — still purely additive, never touches the source content stream).

This guardrail exists because native PDF text mutation needs a font-substitution + reflow engine (or risks producing visually broken files), and that complexity is not aligned with SignStack's "local, browser-first, simple" identity. Reconsider only if the overlay workflow proves insufficient in practice.

---

## Phase 2 — Fill-Out Overlay Tools (post-MVP 1)

**Status:** Not started. Do not implement until MVP 1 ships and Phase 2 is formally opened.

**Premise:** The MVP 1 overlay model (drag, resize, delete, embed via `pdf-lib`) generalizes from "signature image" to "any addressable content." Phase 2 reuses that model for text, date, and checkmark overlays — no new infrastructure, only new overlay types and editors.

**Architectural prerequisites already in place from MVP 1:**
- `Overlay` interface (`src/types/index.ts`) — will grow a discriminator union: `type: "signature" | "text" | "date" | "checkmark"` plus per-type payload.
- Coordinate mapper (Story 4.1) — Phase 2 reuses the same screen-px → PDF-pt conversion.
- React-rnd-based overlay component (Story 5.4) — generalize so children render per overlay type.
- pdf-lib export pipeline (Story 6.1) — extend to call `page.drawText` or `page.drawImage` based on overlay type.

### Future Story P2.1: Add Text Box Overlay

As a user filling out a form,
I want to drop a text box on the current PDF page and type into it,
So that I can fill blank fields without re-creating the document.

**Product Value:** Closes the most common form-fill use case (rental applications, intake forms, invoices). Removes the need to print → handwrite → scan.

**Scope:**
- User adds a text box via a Phase-2 toolbar entry (e.g., `+ Text`); it lands on `state.currentVisiblePageIndex` with a default size at the bottom-right quadrant (mirrors Story 5.1's signature placement).
- Text box uses the **same Overlay model** as signatures — `id`, `pageIndex`, `x`, `y`, `width`, `height` — plus a discriminator and `text: string`.
- Selection, move, resize, delete: identical to signature overlay (Story 5.4 / Story 5.5 keyboard nudge / Story 5.3 delete).
- Inline editing: double-click (or single-click when already selected) opens a contenteditable / `<textarea>` inside the overlay.
- Text content stored in app state (`overlays[].text`).
- Export via `pdf-lib`'s `page.drawText(text, { x, y, font, size, color })` — font is a single bundled `StandardFonts.Helvetica` (or user-selectable later).

**Out of scope (this story):**
- Editing native PDF text or AcroForm fields.
- Multi-font / rich-text formatting.
- OCR or AI extraction.
- Server-side processing.
- Font selection (defer to a follow-up story).

**Architectural notes:**
- Adds a new action: `OVERLAY_TEXT_EDITED { id, text }`. No new reducer cases for move/resize/delete — they're shared.
- Coordinate conversion (screen px → PDF pt) reuses `coordinateMapper.ts` unchanged.
- Font baseline matters: pdf-lib's `drawText` y is the baseline, not the top — the existing y-flip in `coordinateMapper` will need a baseline adjustment specific to text. Document this in the Phase 2 architecture pass.

**Depends on:** MVP 1 shipped (Epics 4, 5, 6 complete).

---

### Future Story P2.2: Add Date Overlay

As a user filling out a form,
I want to drop a date stamp on the current PDF page,
So that I can fill the "Date" line without manually typing today's date for the Nth time.

**Product Value:** Tiny ergonomic win that shows up on almost every signable form.

**Scope:**
- User adds a date overlay via a Phase-2 toolbar entry (e.g., `+ Date`).
- Same Overlay model + discriminator (`type: "date"`) + payload `{ isoDate: string; format: "MM/DD/YYYY" | "YYYY-MM-DD" | "DD MMM YYYY" }`.
- Default value: today's local date.
- Inline editor: small popover with a date input + format selector.
- Move / resize / delete: same as signature overlay.
- Export via `pdf-lib`'s `page.drawText` (rendered as formatted string).

**Out of scope:** time-of-day, timezone selection, locale-aware month names beyond a fixed list, signed/tamper-evident timestamps.

**Architectural notes:**
- Date formatting is a pure utility (`src/lib/format/date.ts`). No external date library required — Intl APIs cover MVP needs.
- Reuses the same `OVERLAY_TEXT_EDITED`-style action (or introduces `OVERLAY_DATE_EDITED { id, isoDate, format }`); decide during the Phase 2 architecture pass.

**Depends on:** P2.1 (establishes the overlay-type discriminator pattern).

---

### Future Story P2.3: Add Checkmark Overlay

As a user filling out a checkbox,
I want to drop a checkmark on the current PDF page,
So that I can mark "yes" on a printed form without printing it.

**Product Value:** Required to fully cover the form-fill use case (no form is complete without checkboxes).

**Scope:**
- User adds a checkmark via a Phase-2 toolbar entry (e.g., `+ Check`).
- Same Overlay model + discriminator (`type: "checkmark"`) — no editable payload, the checkmark is a fixed glyph.
- Default size: small square (~24×24 px), positioned at the page's default placement quadrant.
- Move / delete: same as signature overlay. Resize allowed but uniformly scaled.
- Render: a centered checkmark glyph (Unicode `✓` or an SVG path embedded in a `<canvas>` → PNG).
- Export via `pdf-lib`'s `page.drawText("✓", ...)` **or** `page.drawSvgPath(...)` — decide during the Phase 2 architecture pass based on font availability.

**Out of scope:** alternate marks (X, dot, filled square — defer until requested), color picker.

**Architectural notes:**
- If `drawText("✓", ...)` is used, ensure the standard font set (`standardFontDataUrl` from Story 3.2) covers the codepoint. The Foxit / Liberation fonts mirrored under `public/standard_fonts/` cover U+2713; verify at implementation time.

**Depends on:** P2.1.

---

### Future Story P2.4: Export Fill-Out Overlays

As a user finishing a filled-out form,
I want the downloaded PDF to contain all my text, date, and checkmark overlays,
So that the recipient sees the completed document, not the blank original.

**Product Value:** Closes the Phase 2 loop — without export, the overlays are local-only and worthless.

**Scope:**
- Extend `pdfExporter.ts` to switch on `overlay.type` and call the appropriate `pdf-lib` primitive (`drawImage` for signatures, `drawText` for text/date/checkmark).
- Reuse the same `coordinateMapper.ts` (screen px → PDF pt) for all overlay types. Text baseline adjustment per P2.1.
- Output filename and download flow unchanged from MVP 1's Story 6.1.
- Add tests for each overlay-type export branch where practical.

**Out of scope:** any visual change to the editor (already covered by P2.1–P2.3).

**Architectural notes:**
- Export is the only place where Phase 2 logic differs from MVP 1's per-overlay-type loop. Keep the switch isolated to `pdfExporter.ts` — overlay components stay type-agnostic where possible.

**Depends on:** P2.1, P2.2, P2.3.

---

## Future Story: Copy Existing PDF Text (post-MVP 1)

**Status:** Not started. Independent of Phase 2 (can land before, after, or in parallel once MVP 1 ships).

As a user reviewing a PDF in SignStack,
I want to select visible PDF text with the mouse and copy it (Ctrl+C),
So that I can paste it elsewhere the same way I can in Chrome's built-in PDF viewer.

**Product Value:** Removes a major friction surfaced by anyone who opens a PDF expecting browser-default behavior. Today SignStack silently fails this expectation — selectable text isn't selectable because the text layer is disabled.

**Scope:**
- Re-enable react-pdf's **text layer** (currently `renderTextLayer={false}` in `PDFPageRenderer.tsx`) for pages where the PDF actually contains selectable text.
- Native browser selection + Ctrl+C must work end-to-end — no custom selection model, no custom clipboard handler unless react-pdf's text layer proves insufficient.
- If a page has no selectable text (scanned / image-only PDF), do **not** claim copying is available — the text layer simply renders nothing and selection silently does nothing, matching Chrome's behavior.
- Must not interfere with signature overlay selection / dragging (Story 5.x).
- Must not interfere with future Phase 2 text-box overlay selection / dragging.

**Out of scope:**
- True editing of existing PDF text. (See "Guardrail: native PDF text is not edited" above.)
- OCR for scanned PDFs.
- AI text extraction or summarization.
- Server-side text extraction.
- Native PDF text mutation.
- Selection across pages.

**Architectural notes:**
- **Prefer react-pdf's text layer** before introducing any custom text extraction. It uses pdfjs's structured text data and renders an invisible-but-selectable HTML overlay aligned with the canvas. This is the same mechanism Chrome's PDF viewer uses.
- Re-enabling it requires importing `react-pdf/dist/Page/TextLayer.css` (deferred in Story 3.2) and re-rendering pages — no new dependencies.
- **Interaction order matters.** Browser text selection and react-rnd drag are both `mousedown` consumers. Likely solution: a small editor-mode model — `"select" | "sign" | "text" | "copy"` — where:
  - In `copy` mode, the text layer is enabled and overlay components ignore `mousedown` events (pointer-events: none on overlay handles).
  - In `sign` / `text` / `select` modes, the text layer is disabled or `pointer-events: none`, and overlays own the gestures.
  - Default mode is `select` (today's behavior).
- Editor-mode state lives on `AppState` (e.g. `state.ui.editorMode`). Single source of truth.
- **Do not introduce a separate PDF parsing pipeline** (e.g. directly calling `pdfjs.getDocument().getPage().getTextContent()`) unless react-pdf's text layer proves insufficient. The text layer already does this internally; reimplementing it would duplicate work and risk diverging from pdfjs's positioning math.
- Local-first / browser-only: no network egress, no clipboard upload, no analytics on copied content. Standard browser clipboard APIs only.

**Depends on:** MVP 1 shipped. Loose dependency on Phase 2 — if Phase 2's text-box overlay lands first, the editor-mode model should be designed jointly so `text` (place a text box) and `copy` (select existing text) coexist cleanly.

---

## Competitive Differentiation Ideas (post-MVP 1)

**Status:** Direction-setting notes, not stories yet. None of these are MVP 1 work.

**Premise:** SignStack should not try to beat DocuSign at enterprise agreement workflows (recipient verification, envelope routing, integrations, contract lifecycle management). The stronger direction is a **lightweight, local-first, privacy-first PDF utility toolkit** that does a small number of things very well, on the user's device, without an account. The ideas below are roadmap-shaping bets that reinforce that identity; promote them to concrete stories when MVP 1 ships and the priority of each is clear.

### 1. Local-First Privacy Mode

- Make the "never leaves the browser" promise visually unmistakable in the UI (the current footer disclaimer is a baseline, not the ceiling).
- Add a prominent **"No upload"** trust indicator (e.g., a badge on the toolbar with a tooltip explaining what does and doesn't leave the device).
- Add an explicit **"Clear document from memory"** action that drops the in-memory `ArrayBuffer`, overlays, and signature, returning the user to the upload surface.
- Add a privacy technical note to `README.md` explaining the architecture (no API routes, no analytics on document content, etc.).

### 2. Offline / PWA Mode

- Ship SignStack as a Progressive Web App so it works fully after the first load — sign, fill, and export without a network connection.
- Cache the app bundle, the pdfjs worker, and `public/standard_fonts/` via a service worker.
- No cloud dependency at any point. Reinforces the privacy promise.

### 3. Smart Form Assist (no accounts, no AI)

- Detect likely blank lines / boxes in the rendered PDF visually or structurally (e.g., long horizontal underscores, square outlines, repeated whitespace gaps).
- Suggest places where the user might want a text box, date, signature, or checkmark — one-click placement.
- **Local-first.** No AI / server processing in the initial cut; heuristic-based detection only. Promote to an ML-assisted version only if heuristics prove insufficient and a local model fits the bundle / latency budget.

### 4. Reusable Local Templates

- Let the user save the overlay layout from the current document as a named "template" — same overlays at the same positions on the same page indexes.
- Apply a saved template to a fresh upload that shares the same form layout (e.g., the same apartment application month after month).
- Store templates **locally** in browser storage (IndexedDB) for the early version; explicit "Export template" / "Import template" JSON for cross-device transfer. Never cloud-synced.

### 5. PDF Utility Toolkit

A consolidated direction that groups several utilities under one local-first roof:

- Combine PDFs (Phase 3 stub below).
- Split PDFs.
- Reorder pages.
- **Rotate pages** (see the dedicated future story below).
- Extract pages.
- **Copy existing selectable PDF text** (see the dedicated future story above).
- **Text / date / checkmark overlays** (Phase 2 stories above).

These all reuse the existing pdfjs / pdf-lib pipeline and the local-first architecture. Promotable to a unified "Utilities" surface in the editor when more than one is built.

### 6. Trust / Verification Panel

- Surface a small panel summarizing exactly what SignStack changed in the exported PDF — e.g., **"Added 1 visual signature on page 2; added 1 text box on page 1."**
- Make it explicit that this is **not** a cryptographic / certificate-based digital signature — same disclaimer language as the footer, surfaced at the moment of export so the user is reminded right before sharing.
- Optional follow-up: a "verify what this PDF claims" mode for received documents — read pdf-lib's metadata and surface any visual-signature overlays detected.

---

## Epic: OCR and Searchable PDFs (post-MVP 1)

**Status:** Not started. Future epic — evaluate **after** MVP 1 ships, Phase 2 (fill-out overlays), Phase 3 (combine PDFs), and the Copy Existing PDF Text story are all stable. Do not add OCR dependencies during MVP 1.

**Product intent:** SignStack should eventually help users **search text inside PDFs** — including scanned / image-only PDFs — while preserving the local-first / browser-first privacy promise. This fits the lightweight PDF utility toolkit direction (Competitive Differentiation #5) and addresses a real gap: most signing tools focus on sending documents for signatures, but users also need lightweight private utilities like "find that clause" in a scanned contract.

**Positioning:** Future differentiator. Reinforces the "local-first PDF toolkit" identity without copying DocuSign's enterprise workflow surface.

### Future Story OCR.1: OCR Scanned PDFs Locally

As a user opening a scanned PDF,
I want SignStack to extract the page text for me,
So that I can copy or search content from documents I'd otherwise have to retype.

**Scope:**
- User can run OCR on scanned / image-only PDF pages from an explicit "Extract text (OCR)" action — not automatic on upload.
- OCR operates on rendered page images (canvas → image data).
- OCR runs **locally in the browser** wherever practical.
- Extracted text is associated with its page number (and, where the OCR engine provides them, per-word bounding boxes for future highlighting).
- User can copy the OCR-derived text.
- User can search the OCR-derived text (see OCR.2).

**Out of scope (initial):**
- Server-side OCR.
- Cloud upload of any kind.
- AI summarization.
- **Embeddings, semantic search, vector databases, RAG.** Explicitly deferred — see roadmap note below.
- Handwritten-text recognition guarantees (best-effort only).
- Perfect layout reconstruction (multi-column, tables, headers/footers).

### Future Story OCR.2: Search Extracted PDF Text

As a user reviewing a PDF,
I want to search across the document's text,
So that I can jump to the page that mentions what I'm looking for.

**Scope:**
- User can search across text extracted from the current PDF.
- Search covers **both**:
  - native selectable PDF text (via the Copy Existing PDF Text story's text-layer infrastructure), and
  - OCR-derived text for scanned / image-only pages (OCR.1).
- Results show page number + matched snippet (a few words of context on each side).
- Clicking a result jumps to that page.
- If exact text coordinates are available (e.g., from pdfjs's text layer or per-word OCR bboxes), highlight the match in place.
- If coordinates are not available, jump to the page and show the snippet in a side panel.

**Out of scope (initial):**
- Semantic search.
- Natural-language question answering.
- AI chat over the document.
- Cloud indexing.
- Account-based document libraries (cross-document search across a user's history).

### Future Story OCR.3: Local OCR / Text Data Management

As a user concerned about privacy,
I want to know what extracted text is stored locally and be able to clear it,
So that I stay in control of the by-product data SignStack generates.

**Scope:**
- UI shows whether OCR / search data exists for the current document.
- User can clear OCR / search data for the current document.
- User can clear **all** locally stored OCR / search data (across documents, if persistence is enabled).
- UI clearly explains that extracted text is stored locally if persistence is enabled (and that it's session-only if not).
- No analytics. No uploads of document text. Same privacy invariants as the rest of the app.

### Architecture notes (OCR epic)

- **Prefer browser-local OCR** — the initial bet is on something like Tesseract-WASM running in a Web Worker. Server-side OCR would break the privacy invariant.
- Treat the OCR engine as an **optional lazy-loaded module**, not part of the initial app bundle. Users who never run OCR shouldn't pay the bundle cost.
- Keep OCR / search code in its own folder (e.g. `src/lib/ocr/`, `src/lib/search/`) — **separate from MVP signing / export code**. No cross-imports beyond the public interfaces.
- **Do not add OCR dependencies during MVP 1.** Any future dependency must be justified by an explicit tradeoff analysis: bundle size, browser support, OCR accuracy, privacy implications, runtime perf.
- Use **Web Workers** for OCR runs to avoid blocking the UI thread.
- Index by `{ documentHash, pageIndex, chunkIndex }`. Start with **exact keyword search only** (string `includes` or simple FTS, no analyzers).
- **Do not add embeddings / semantic search / vector DBs** until exact OCR search is shipped, used, and its limitations are concretely understood. Semantic search adds large model dependencies, complex caching, and a privacy-claim audit; not worth it until the simple path proves valuable.
- Keep the trust message simple: **documents and extracted text stay on the user's device.**

### Roadmap note (OCR epic)

OCR and exact text search are post-MVP 1 ideas. Evaluate **after** visual signing (Epics 1–7), fill-out overlays (Phase 2), combine PDFs (Phase 3), and Copy Existing PDF Text are working. **Semantic search, embeddings, vector search, and RAG-style features are intentionally deferred and should not be planned until OCR / exact-keyword search is proven valuable.** The order matters: a working dumb feature beats a half-built smart one.

---

## Future Story: Rotate PDF Pages (post-MVP 1)

**Status:** Future PDF utility story. Part of the PDF utility toolkit direction (Competitive Differentiation #5). Implement after MVP signing / export is complete and the coordinate mapping pipeline is stable.

As a user with a scanned or wrong-way-up PDF,
I want to rotate individual pages (or all pages) before exporting,
So that the document reads correctly without leaving the browser.

**Product Value:** Common ergonomic fix for scanned-on-a-phone documents and forms that were saved sideways. Currently the user's only recourse is another tool.

**Scope:**
- User can rotate an individual page **90° clockwise**.
- User can rotate an individual page **90° counterclockwise** if practical.
- User can rotate **all pages** in a document if practical (one click).
- Rotation is **previewed live** in the editor (the rendered page reflects the rotation immediately).
- Rotation is **preserved in the exported PDF** (the downloaded file opens in the rotated orientation in any viewer).
- Rotation must compose correctly with the existing page-rendering, page-measurement, coordinate-mapping, and overlay-export models.
- If overlays exist on a rotated page, **export must remain visually correct** — an overlay placed in the top-right of a page must still appear in the user-visible top-right after rotation, in both the editor and the exported PDF.

**Out of scope (initial):**
- Arbitrary-angle rotation (only 90° increments).
- Deskewing scanned pages.
- Auto-detecting page orientation.
- OCR-based rotation detection.
- Server-side PDF processing.

**Architecture notes:**
- **Prefer pdf-lib's page rotation support** during export (`page.setRotation(degrees(...))`) over re-rasterizing the page.
- Store rotation as **page-level document state** — likely `pageRotationsByIndex: Map<number, 0 | 90 | 180 | 270>` on `DocumentState`. New reducer action `PAGE_ROTATED { pageIndex, degrees }`.
- **Rendering must account for rotation** so the preview matches the exported file. react-pdf's `<Page>` accepts a `rotate` prop — use it.
- **Coordinate mapping must account for rotation** before this feature ships with overlays. The `coordinateMapper.ts` from Story 4.1 needs an extension that takes the page rotation into account when converting screen-px overlay coordinates to PDF-pt; otherwise overlays on rotated pages will be placed incorrectly in the exported file.
- Keep the feature **local-first / browser-first** like every other PDF utility.

**Depends on:** MVP 1 shipped (Story 4.1's coordinate mapper, Story 6.1's export pipeline). Best implemented after the coordinate mapper is stable and well-tested with non-rotated pages.

**Roadmap note:** Page rotation is part of the future PDF utility toolkit alongside combine, split, reorder, and extract pages (Competitive Differentiation #5). It is **not** part of MVP 1 visual signing.

---

## Optional Cloud Export Integrations (post-MVP 1)

**Status:** Future optional integrations. Not part of the MVP 1 core privacy model. **Files never leave the device by default** — cloud paths only activate when the user explicitly chooses a cloud export action.

**Premise:** SignStack is local-first and browser-first by default. Cloud integrations are **optional convenience features**, not the default path and not the marketing pitch. The privacy promise evolves only as far as: *"Documents stay on your device unless you choose to export to an external service."* Local download remains the primary export path; every cloud integration is an opt-in alternative gated behind explicit user action.

### Future Story: Export Signed PDF to Google Drive

As a user who works across devices,
I want to save my completed / signed PDF directly to Google Drive,
So that I can access it from my phone or another computer without manually moving files — while keeping SignStack local-first by default.

**Product Value:** Removes the "now download → switch device → re-upload" friction for users who already live in Google Drive. Adds a convenience path without weakening the local-first default.

**Scope:**
- After SignStack generates the exported signed PDF (Story 6.1's existing flow), the editor offers a **"Save to Google Drive"** action alongside the existing local download.
- Upload only occurs after **explicit user action** — a button click on the post-export surface, never automatic, never on a timer, never as a side effect of another action.
- User sees a clear **confirmation step** before upload begins (file name, destination, "this will leave your device" reminder).
- User can choose or confirm the destination **filename** (default: `{original-name}-signed.pdf` to match Story 6.1's local filename).
- Where practical, user can choose a Drive **folder** (default: root or a SignStack-suggested folder).
- The uploaded file is the **final exported PDF**, not the original source PDF, unless the user explicitly requests otherwise.
- **Local download remains the primary / default export path** — the cloud button is an alternative, not a replacement. If the user just wants the file, the existing one-click download still works exactly as it does in MVP 1.

**Out of scope (initial):**
- Auto-sync (any time the document changes, push to Drive).
- Background uploads (anything that happens without a visible user action).
- A cloud-based document library (SignStack listing or browsing the user's Drive contents).
- Storing PDFs on SignStack-controlled servers.
- Uploading original / unsigned documents by default.
- Sharing-permissions management (who can view, comment, edit on the Drive file).
- Multi-user / collaboration workflows.
- Google Docs conversion (uploading as a `.gdoc` instead of `.pdf`).
- Editing files directly inside Google Drive (no embed, no Drive-side mutation).
- Enterprise admin controls (domain-wide policies, audit logs, etc.).

**Acceptance criteria (for the future story):**
- Given a generated signed PDF, when the user clicks **"Save to Google Drive,"** then the Google authorization flow opens.
- Given Google authorization succeeds, when the user confirms filename / folder where practical, then the final PDF uploads to the user's Drive.
- Given upload completes, when the response is received, then the user sees clear success feedback (and ideally a deep link to the file in Drive).
- Given upload fails (network error, revoked auth, quota exceeded, etc.), when the failure is detected, then the user sees an actionable error message **and the local download path remains available and unaffected.**
- Given the user has not clicked the cloud-export button, then **no upload happens** — no preflight, no telemetry, no metadata leakage. The cloud code path is silent until invoked.

**Architectural notes:**
- Requires **Google OAuth 2.0 + Drive API** integration. Do **not** add the Google SDK, OAuth client ID, environment variables, or any related config during MVP 1.
- Treat the Drive integration as an **optional, lazy-loaded module** (e.g. `src/lib/cloud/googleDrive/`) — separate from the MVP signing / export core. Users who never click the cloud button shouldn't pay the bundle, runtime, or audit cost.
- Keep **export generation local** in every path. The shape stays: `pdfExporter.ts` produces a `Uint8Array` / `Blob`; the cloud module accepts that blob and uploads it. The cloud module never reaches into pdf-lib or pdfjs directly.
- UI copy must be explicit that cloud export is **optional and user-initiated**. The cloud button should not be the visually-primary action; the local download stays primary.
- The privacy promise updates to: **"Documents stay on your device unless you choose to export to an external service."** Update the footer disclaimer, the README, and the Trust / Verification Panel (Competitive Differentiation #6) consistently when this story ships.
- **Do not add Google dependencies during MVP 1.** No `googleapis`, no `gapi`, no OAuth client ID, no env vars, no Drive SDK shim.
- **Do not add environment variables, OAuth config, API routes, or Drive SDK dependencies** until this story is formally opened with its own architecture pass.
- **Before implementation, evaluate the transport model:**
  - Option A — **browser-only direct upload** via Google Identity Services + Drive API (OAuth 2.0 token in the browser, multipart upload from the SPA). Stays consistent with the no-backend architecture. Preferred if feasible.
  - Option B — **minimal backend callback** to handle the OAuth code-exchange and proxy the upload. Adds a server. **Revisit the architecture and privacy model first** — a backend changes the "no API routes" guarantee (AD-1, AD-10) and needs an explicit decision, not an incidental one.
  - Choose A unless a concrete blocker is identified. If B is needed, write it down in the story's architectural notes and revisit `docs/baseline-verification.md` + architecture.md before any code lands.

**Depends on:** MVP 1 shipped (Story 6.1's local export pipeline exists and is stable). Optional but ideally lands after the Trust / Verification Panel (Competitive Differentiation #6) so the export-time copy is consistent across local and cloud paths.

**Roadmap note:** Google Drive export is a **future convenience integration.** It is **not** part of MVP 1 and must not compromise the local-first default workflow. Future cloud destinations (Dropbox, OneDrive, iCloud Drive, S3) would each be their own story under this same "Optional Cloud Export Integrations" header, reusing the same `Blob`-in / external-upload-out pattern.

---

## Phase 3 — Combine PDFs (post-Phase 2)

**Status:** Not started. Requires its own PRD iteration and architecture pass.

Multi-document upload, page reordering across documents, and pdf-lib-based merge and export. Out of scope until Phase 2 ships and Phase 3 is formally opened.

---

## Post-MVP (no phase commitment)

User accounts, signature library, save-draft, mobile-optimized layout, thumbnail navigation, payments, cloud storage. These are not on any roadmap — listed only to make it explicit that they are **not** what SignStack is becoming.
