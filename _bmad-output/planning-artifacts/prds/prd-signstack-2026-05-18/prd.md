---
title: "PRD: SignStack — MVP 1 (Visual PDF Signing)"
status: final
created: 2026-05-18
updated: 2026-05-18
---

# PRD: SignStack — MVP 1 (Visual PDF Signing)

## 0. Document Purpose

This PRD defines requirements for SignStack MVP 1. Its primary audiences are the UX designer (for interaction and screen design), the architect (for technical decisions), and the epics/stories author (for implementation breakdown). It is anchored to the approved Product Brief (`_bmad-output/planning-artifacts/briefs/brief-signstack-2026-05-18/brief.md`) and does not re-derive decisions made there.

The document uses Glossary-anchored vocabulary throughout (§3). Features are grouped in §4 with globally numbered FRs nested under each feature. Cross-cutting NFRs appear in §8. Inline `[ASSUMPTION: A-N]` tags are indexed in §10. Technical implementation choices (stack, library names, font candidates) live in `addendum.md` — the PRD references them at the category level only. Note: Tailwind CSS (styling) and Vitest (testing) are pre-selected tools captured in `addendum.md`.

## 1. Vision

SignStack is a privacy-focused, browser-based tool that lets anyone sign a PDF visually — without creating an account, without uploading their document to a server, and without installing software. Every operation happens locally in the user's browser.

MVP 1 delivers one complete workflow: upload a PDF, create a Signature (drawn or typed), place it as a resizable Overlay on any page, and export the Signed Document. The Signature is embedded into the page content, not attached as a metadata layer — the output is a standard PDF any viewer can open.

The product's privacy guarantee is structural: the architecture does not include a server for Document processing. The architecture structurally prevents Document content from leaving the user's device.

## 2. Target User

### 2.1 Primary Persona

**The Solo Signer.** A freelancer, contractor, remote worker, or individual who frequently receives PDFs requiring a signature. They are comfortable in a browser, not seeking workflow orchestration, and value privacy enough to choose a tool on that basis. They want to open a page, sign the document, and send it back — in one sitting, with no friction.

### 2.2 Jobs To Be Done

- **Functional:** Sign a PDF and produce a file I can email back.
- **Functional:** Avoid creating an account or subscription to complete a one-off task.
- **Functional:** Sign on a device I'm already using (laptop, desktop) without installing software.
- **Emotional:** Feel confident my document content is not stored somewhere I don't control.
- **Social:** Send back a signed document that looks professional and opens cleanly for the recipient.

### 2.3 Non-Users (MVP 1)

- Anyone needing cryptographic certificate-based digital signatures for legal/compliance purposes.
- Anyone managing multi-party signing workflows or routing documents for approval.
- Anyone needing to fill out PDF form fields (Phase 2) or combine multiple PDFs (Phase 3).

### 2.4 Key User Journeys

**UJ-1. Freelancer signs a contract and returns it.**

- **Persona + context:** Alex, a freelance designer, receives a client contract as a PDF email attachment. They need to sign and return it the same day.
- **Entry state:** Unauthenticated. Alex opens SignStack in a browser tab. No account, no prior session.
- **Path:**
  1. Alex drags the PDF onto the upload area (or clicks to browse). The Document loads and all pages render.
  2. Alex clicks "Add Signature," draws their signature on the canvas, and confirms.
  3. Alex drags the Overlay onto the signature line on page 3 and resizes it to fit.
  4. Alex clicks "Download Signed PDF." The browser downloads the Signed Document.
  5. Alex attaches the downloaded file to an email and sends it.
- **Climax:** The Signed Document downloads. Alex opens it locally to confirm the signature appears correctly.
- **Resolution:** Alex closes the tab. No account created, no document retained anywhere, no follow-up required.
- **Edge case:** The signature line is on page 5 of a 10-page document. Alex scrolls to page 5, places the Overlay, confirms alignment, then exports. The other 9 pages export unmodified.

**UJ-2. User corrects a misplaced signature before export.**

- **Persona + context:** Same as UJ-1, but Alex placed the Overlay in the wrong position.
- **Entry state:** Alex has placed a Signature Overlay and it is misaligned.
- **Path:**
  1. Alex sees the Overlay is on the wrong line.
  2. Alex drags the Overlay to the correct position, or removes it and re-places.
  3. Alex re-examines alignment and confirms.
  4. Alex exports.
- **Climax:** Overlay is repositioned without a full restart.
- **Resolution:** Corrected Signed Document downloaded.

## 3. Glossary

*All domain nouns used in §4 FRs, §2 User Journeys, and §7 Success Metrics must use these terms exactly. Introducing a synonym anywhere in this PRD is a discipline violation.*

- **Document** — The PDF file selected by the user for signing. ("File" is acceptable only when referring to the OS-level file system operation, e.g., file picker.) One Document per session in MVP 1.
- **Page** — A single rendered page of the Document.
- **Signature** — The user-created visual artifact (Drawn Signature or Typed Signature) to be embedded into the Document. In this product, Signature always means a visual element, never a cryptographic construct.
- **Drawn Signature** — A Signature created by the user drawing with a pointer device on the Signature Canvas.
- **Typed Signature** — A Signature created by the user entering text and selecting a Font Style.
- **Font Style** — One of three visual presentations available for a Typed Signature: Clean, Script, or Formal.
- **Signature Canvas** — The drawing surface presented to the user during Drawn Signature creation.
- **Overlay** — A positioned, draggable, resizable UI element displaying the Signature on a Page. Multiple Overlays may exist across Pages. An Overlay exists in the editor session only; it becomes permanent upon Export via Embedding.
- **Export** — The user action that produces and downloads the Signed Document.
- **Signed Document** — The output PDF file with all Overlays Embedded into their respective Pages as page content.
- **Embedding** — The process of rendering each Overlay's visual position and size into the page content of the Signed Document at Export time. Embedding is destructive and irreversible; the Overlay's appearance becomes part of the page.
- **Local Processing** — All Document operations (parsing, rendering, Embedding, Export) occur in the user's browser without transmitting Document content to any server.
- **Visual Signature** — Used in user-facing copy and disclaimers as a synonym for Signature, to explicitly contrast with Cryptographic Signature.
- **Cryptographic Signature** — A certificate-based digital signature providing legal/compliance-grade non-repudiation. SignStack does not produce, validate, or reference these.
- **AcroForm** — A PDF standard defining interactive form fields. SignStack does not read, detect, map to, or edit AcroForm fields.

## 4. Features

### 4.1 PDF Upload

**Description:** The entry point to the application. The user selects a local PDF file. The Document is loaded into browser memory. No file content is transmitted. A clear upload affordance is presented on the initial screen. Realizes UJ-1 (step 1), UJ-2.

**Functional Requirements:**

#### FR-1: Local PDF file selection

The user can select a PDF file from their local filesystem via a file picker dialog or drag-and-drop onto the upload area.

**Consequences (testable):**
- Activating the upload area opens the OS file picker filtered to `.pdf` files.
- Dragging a `.pdf` file onto the upload area triggers Document load.
- Dragging a non-PDF file onto the upload area displays an error message and does not load a Document.
- No network request is made during or after file selection.

**Out of Scope:**
- URL-based PDF loading.
- Multiple file selection (Phase 3).

#### FR-2: File validation

The system validates the selected file before rendering begins.

**Consequences (testable):**
- Files with a non-PDF MIME type or lacking the `%PDF` header are rejected with a user-visible error message.
- Files exceeding 25 MB are rejected with a user-visible error message citing the limit. [ASSUMPTION: A-9 — validate against pdf-lib memory constraints in architecture phase. See OQ-3.]
- Valid files proceed to rendering without further prompts.

#### FR-3: Session replacement

The user can load a new Document, replacing the current session.

**Consequences (testable):**
- If a Document is already loaded, uploading a new file replaces it. All Overlays associated with the previous Document are discarded.
- [ASSUMPTION: A-2] The user is not prompted to confirm before replacement in MVP 1.

**Notes:** Revisit the replace-without-confirm decision if user research shows accidental replacements are common.

**Error States:**
- File picker cancelled: no change to current state.
- Drag-and-drop of a non-PDF: error banner, current Document unchanged.
- File exceeds 25 MB: error banner with size limit, current Document unchanged.
- PDF fails to parse (corrupt or encrypted): error banner with user guidance to try another file.

---

### 4.2 PDF Rendering

**Description:** Once loaded, the Document is rendered page by page in the browser. The user can scroll through all Pages. Rendering is client-side. Realizes UJ-1 (steps 1–3), UJ-2.

**Functional Requirements:**

#### FR-4: Full-document page rendering

All Pages of the Document are rendered in a vertically scrollable view.

**Consequences (testable):**
- All pages of a valid Document render without error.
- Pages render at sufficient resolution to read standard-size body text (12pt equivalent).
- Page order matches the original Document.
- Rendering does not require any network request beyond the initial app bundle load.

#### FR-5: Page identification

Each Page is visually identifiable by page number.

**Consequences (testable):**
- A page number indicator is visible on or immediately adjacent to each rendered Page. Exact placement is a UX decision.

**Out of Scope:**
- Thumbnail navigation strip (post-MVP).
- Page reordering (Phase 3).

**Feature-specific NFRs:**
- Rendering of a 20-page, 10 MB Document must begin displaying the first page within 3 seconds on a modern desktop browser.

---

### 4.3 Signature Creation

**Description:** Before placing an Overlay, the user creates a Signature. The creation experience presents two paths: draw on a canvas, or type text and select a Font Style. The user can clear and start over. The completed Signature is held in session memory for placement as an Overlay. [ASSUMPTION: A-3] One Signature is active per session; placing a new Overlay reuses the same Signature. Realizes UJ-1 (step 2).

**Functional Requirements:**

#### FR-6: Signature creation entry point

The user can initiate Signature creation from the editor. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- A clearly labelled "Add Signature" (or equivalent) control is visible in the editor when a Document is loaded.
- Activating it opens the Signature creation experience.
- Signature creation is not accessible before a Document is loaded.

#### FR-7: Drawn Signature

The user can draw a Signature using a pointer device on the Signature Canvas. Realizes UJ-1.

**Consequences (testable):**
- A Signature Canvas is presented with a draw path tab/mode selected.
- Pointer movement while the pointer button/touch is active traces a continuous stroke on the canvas.
- Strokes accumulate; lifting and re-pressing the pointer starts a new stroke without clearing prior strokes.
- The drawn result is visually distinct from a blank canvas (system detects a non-empty drawing for validation purposes).
- [ASSUMPTION: A-5] Mouse and trackpad input are the primary targets; touch/stylus input is supported by the underlying library but not specifically QA-tested for MVP 1. See OQ-2.

#### FR-8: Typed Signature

The user can type their name and select a Font Style to create a Typed Signature. Realizes UJ-1.

**Consequences (testable):**
- A text input and Font Style selector are presented.
- Font Style options are exactly: Clean, Script, and Formal.
- The typed text is rendered in the selected Font Style as a live preview.
- Changing the Font Style updates the preview without clearing the typed text.
- An empty text input cannot be confirmed as a Signature.

#### FR-9: Signature clear and start over

The user can clear the current Signature and start over within the creation experience.

**Consequences (testable):**
- A clear/reset control is visible in the Signature creation experience.
- Activating it clears the Signature Canvas (for Drawn) or text input (for Typed).
- The user can immediately begin a new attempt.

#### FR-10: Signature confirmation

The user confirms the Signature to exit creation and proceed to placement. Realizes UJ-1.

**Consequences (testable):**
- A confirmation control ("Use Signature," "Apply," or equivalent) is available.
- Confirming with a blank canvas (no strokes) or empty text input is prevented with a user-visible prompt.
- Upon confirmation, the Signature is stored in session memory and the Signature creation experience closes.
- The Overlay for this Signature becomes available for placement on any Page.

---

### 4.4 Signature Overlay

**Description:** After Signature creation, the user places the Signature as an Overlay on any Page. The Overlay is draggable and resizable. Multiple Overlays may be placed on the same or different Pages. Overlays can be removed before Export. The Overlay's visual state determines how the Signature will be Embedded. Realizes UJ-1 (step 3), UJ-2 (full journey).

**Functional Requirements:**

#### FR-11: Overlay placement

The user can place the Signature as an Overlay on any Page. Realizes UJ-1.

**Consequences (testable):**
- After Signature confirmation, an Overlay appears on the current Page (or the first Page if no Page is in focus) at a default position and size.
- [ASSUMPTION: A-4] The default position is near the bottom-right of the Page. Exact default is a UX decision.
- The Overlay displays the Signature visually.
- The Overlay is visible above the rendered Page content.

#### FR-12: Multiple Overlays

The user can place more than one Overlay across Pages.

**Consequences (testable):**
- After placing one Overlay, the user can add another. [PENDING OQ-1: whether "add another" reuses the session Signature or re-opens Signature creation is an unresolved UX question — see OQ-1.]
- Overlays on different Pages are independent; moving one does not affect others.
- Each Page may have zero or more Overlays.

#### FR-13: Overlay drag

The user can reposition an Overlay by dragging it. Realizes UJ-2.

**Consequences (testable):**
- Clicking and dragging an Overlay moves it to the pointer position.
- The Overlay remains within the bounds of its Page (clamped at Page edges).
- Releasing the pointer sets the Overlay's new position.

#### FR-14: Overlay resize

The user can resize an Overlay using resize handles.

**Consequences (testable):**
- Resize handles are visible on the Overlay when it is selected/focused.
- Dragging a resize handle changes the Overlay's dimensions.
- [ASSUMPTION: A-6] Aspect ratio is not locked by default. Exact behavior is a UX decision (see OQ-5).
- A minimum Overlay size prevents collapse to zero dimensions (implementation-defined minimum).

#### FR-15: Overlay removal

The user can remove an Overlay before Export. Realizes UJ-2.

**Consequences (testable):**
- A remove/delete control is accessible on or near each Overlay.
- Removing an Overlay does not affect the Signature in session memory (a new Overlay can be placed after removal).
- Removing an Overlay does not affect other Overlays on other Pages.

---

### 4.5 PDF Export

**Description:** The user exports the Signed Document. All Overlays are Embedded into their respective Pages. The original Document content is preserved. The output is downloaded as a standard PDF file. All Export operations are client-side. Realizes UJ-1 (step 4), UJ-2.

**Functional Requirements:**

#### FR-16: Export trigger

The user can initiate Export. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- An "Export" or "Download Signed PDF" control is visible in the editor.
- The control is not actionable before a Document is loaded (disabled or hidden — UX decision).
- The control is available whether or not any Overlays have been placed (exporting with zero Overlays produces a clean copy of the original Document).

#### FR-17: Overlay embedding

At Export time, all Overlays are Embedded into their respective Pages as page content. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- The Signature is drawn onto each Page at the Overlay's position and size, scaled from screen coordinates to PDF coordinate space.
- The resulting Signed Document page contains the Signature as page content, not as an annotation layer.
- Pages with no Overlays are passed through unmodified.
- The Embedding operation runs entirely client-side with no network requests.

#### FR-18: Signed Document download

The Signed Document is delivered to the user as a downloaded file. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- The browser initiates a file download for the Signed Document.
- [ASSUMPTION: A-7] The default filename appends `-signed` to the original Document filename (e.g., `contract.pdf` → `contract-signed.pdf`). Exact convention is a UX decision (see OQ-6).
- The downloaded file is a valid PDF (passes standard PDF validation).
- The downloaded file opens in Adobe Reader, macOS Preview, and Chromium-based browser PDF viewers with the Signature visually present.

**Notes:** The disclaimer requirement for the README (that SignStack creates Visual Signatures, not Cryptographic Signatures) is captured as an engineering/documentation task, not a runtime FR.

#### FR-19: Original content preservation

The Export preserves all original Document content.

**Consequences (testable):**
- Page count of the Signed Document matches the original Document.
- Pages without Overlays are visually identical to the originals when viewed in a PDF viewer.
- Embedded fonts, images, and vector content in the original Document are not visually degraded.

**Feature-specific NFRs:**
- Export of a 20-page Document with up to 5 Overlays completes within 5 seconds on a modern desktop browser.

---

### 4.6 Privacy Guarantee and Disclaimer

**Description:** SignStack's core value proposition is that Document content never leaves the user's browser. This is enforced architecturally (no server-side Document processing) and surfaced visibly to the user via a persistent disclaimer. The disclaimer also covers the Visual Signature vs. Cryptographic Signature distinction. Realized across all features.

**Session Data Lifecycle:**
The following data exists in session memory and nowhere else: Document bytes (parsed from the uploaded file), rendered Page images (generated client-side), the Signature (drawn strokes or typed text), and Overlay position/size values. All session data is cleared on page refresh, tab close, or when a new Document is loaded. No data is written to localStorage, IndexedDB, or any persistent store in MVP 1. This is both the privacy guarantee and the no-persistence contract for the architect.

**Functional Requirements:**

#### FR-20: Local processing enforcement

All Document operations occur client-side. Realized across all features.

**Consequences (testable):**
- No network request carrying Document content is made at any point during the session (verifiable via browser DevTools Network panel).
- The application functions correctly without a network connection after the initial page load.

#### FR-21: Visual Signature disclaimer

The product UI displays a persistent disclaimer that SignStack creates Visual Signatures, not Cryptographic Signatures.

**Consequences (testable):**
- A disclaimer is visible in the UI without user interaction. [ASSUMPTION: A-10] Displayed as persistent inline text near the Export control. Exact placement and wording is a UX decision (see OQ-4).
- Disclaimer uses plain language, e.g.: "SignStack adds a visual signature to your PDF. It does not create a cryptographic digital signature."

**Notes:** README disclaimer (engineering/documentation) is a launch-gate task tracked separately, not a runtime FR.

---

## 5. Non-Goals (Explicit)

*MVP 1 is not, and will never be (permanent non-goals):*

- **A cryptographic signing platform.** No PKI, no certificate chains, no legally binding digital signatures, no compliance-grade audit trails (eIDAS, ESIGN Act).
- **A PDF form editor.** No AcroForm field detection, reading, or editing. Phase 2 annotation elements sit on top of the visual design; they are not wired to underlying field definitions.
- **A cloud document service.** No server-side storage, no user accounts, no document history, no cloud sync. The privacy guarantee is structural and permanent.
- **A multi-party workflow tool.** No email invitations, no approval routing, no shared document links.
- **An AI-assisted tool.** No document analysis, auto-detection, or AI suggestions.
- **An enterprise workflow orchestration platform.** Multi-party routing, approval chains, audit logging — not the product.

---

## 6. MVP Scope

### 6.1 In Scope

- Single PDF upload (file picker and drag-and-drop)
- Client-side PDF page rendering (all pages, vertically scrollable)
- Signature creation: Drawn (canvas) and Typed (Clean, Script, Formal Font Styles)
- Signature Overlay: drag, resize, remove
- Multiple Overlays across multiple Pages
- PDF Export with Embedding (client-side, no server)
- Persistent Visual Signature disclaimer in UI
- Desktop browser support: Chrome 110+, Firefox 110+, Safari 16+

### 6.2 Out of Scope for MVP

*Items marked (Non-goal — §5) are permanent; items marked with a phase are deferred.*

- Cryptographic digital signatures (Non-goal — §5)
- Native AcroForm field editing (Non-goal — §5)
- Cloud storage / server-side processing (Non-goal — §5)
- Email invitations / multi-party workflow (Non-goal — §5)
- AI document analysis (Non-goal — §5)
- Text box overlays (Phase 2)
- Date field overlays (Phase 2)
- Checkmark overlays (Phase 2)
- Multiple PDF upload (Phase 3)
- PDF page reordering (Phase 3)
- PDF merging (Phase 3)
- User accounts / authentication (post-MVP)
- Document history / save-draft (post-MVP) `[NOTE FOR PM: revisit if user research shows frequent mid-session abandonment]`
- Payments / subscription (post-MVP)
- Mobile-native app / mobile-optimized layout (post-MVP)
- Signature library / saved signatures across sessions (post-MVP)
- Thumbnail navigation strip (post-MVP)

---

## 7. Success Metrics

*Each SM cross-references the FR(s) it validates. Counter-metrics define what not to optimize.*

**Primary**

- **SM-1: Time to export** — Median time from Document upload to first Export download ≤ 2 minutes, measured via usability testing or session analytics. Validates FR-1, FR-4, FR-6, FR-10, FR-11, FR-16.

- **SM-2: Export success rate** — ≥ 95% of Export attempts produce a Signed Document that opens without error in at least one major PDF viewer. Validates FR-17, FR-18, FR-19.

- **SM-3: Privacy compliance** — Zero bytes of Document content transmitted during any session (verifiable via automated network inspection in CI or browser DevTools). Validates FR-20.

**Secondary**

- **SM-4: Signing flow completion rate** — Percentage of sessions that progress from Document upload to at least one successful Export. Baseline measurement for MVP 1 launch; no target set until baseline is established. Validates FR-1 through FR-18 (end-to-end flow, covers FR-7, FR-8, FR-13, FR-14, FR-15).

- **SM-5: Cross-browser completion rate** — The full signing flow (upload → create → place → export) completes without a runtime error on Chrome 110+, Firefox 110+, and Safari 16+ desktop. Validates FR-4, FR-17.

- **SM-6: Return usage** — Percentage of users who complete a second Export within 30 days of their first. A proxy for "the tool worked well enough to come back." Baseline measurement only for MVP 1 launch.

- **SM-7: User-reported trust (qualitative)** — Users who complete a session and are surveyed express confidence that their document was not transmitted. No numeric target for MVP 1; qualitative signal only. References §2.2 emotional JTBD.

**Counter-metrics (do not optimize)**

- **SM-C1: Do not optimize for session duration.** A short session is a success. Flag for review if median session duration (SM-1 baseline) exceeds 4 minutes, as this may indicate friction, not engagement. Users who sign and leave in 90 seconds are the goal outcome.

- **SM-C2: Do not trade privacy for capability.** No feature requiring server-side Document processing may be introduced to justify a performance or capability gain. The privacy guarantee is not a trade-off knob. Treat any violation of SM-3 as a blocker, not a trade-off.

- **SM-C3: Do not narrow file compatibility to game SM-2.** Rejecting valid-but-unusual PDFs to avoid Export failures is worse than a failed Export. Export success rate must be measured against a broad input corpus, not a filtered one.

---

## 8. Cross-Cutting NFRs

### Performance

- **NFR-P1:** First page of the Document renders within 3 seconds of upload for a Document ≤ 20 pages and ≤ 10 MB on a modern desktop (Chrome/Firefox/Safari, ≥ 8 GB RAM, broadband).
- **NFR-P2:** Export (Embedding + download initiation) completes within 5 seconds for a Document ≤ 20 pages with ≤ 5 Overlays under the same conditions.
- **NFR-P3:** Application bundle loads and is interactive within 5 seconds on a broadband connection (initial visit, no cache).

### Browser Compatibility

- **NFR-B1:** Full feature parity on Chrome 110+, Firefox 110+, and Safari 16+ (desktop). All FRs must pass on all three browsers.
- **NFR-B2:** The application does not crash or produce incorrect output on Microsoft Edge (Chromium-based) desktop, though it is not a primary QA target.

### Privacy

- **NFR-PV1:** Zero bytes of Document content are transmitted to any server during any session. This is both a functional requirement (FR-20) and a system-wide NFR — no feature added in this or any subsequent phase may violate it without an explicit product-level scope change.
- **NFR-PV2:** No third-party analytics, telemetry, or tracking scripts may access Document content or metadata.

### Accessibility

- **NFR-A1:** All UI controls outside the Signature Canvas meet WCAG 2.1 AA standards (upload, navigation, Font Style selector, Export button, disclaimer, Overlay controls).
- **NFR-A2:** The Typed Signature path provides a fully keyboard-accessible alternative to the Drawn Signature canvas for MVP 1. Full canvas accessibility is post-MVP.
- **NFR-A3:** The Overlay can be repositioned via keyboard (arrow-key nudge or a numeric position input fallback) in addition to drag. `[NOTE FOR ARCHITECT: Verify drag/resize library keyboard support; a fallback position-input control may be required.]`

### Reliability

- **NFR-R1:** The application functions offline after the initial page load (all rendering and Export operations require no network).
- **NFR-R2:** A failed Export (e.g., unrecoverable error processing a malformed input PDF) surfaces a user-visible error message with guidance, without crashing the browser tab.

---

## 9. Open Questions

1. **OQ-1 — Signature reuse UX:** When the user wants to place a second Overlay (e.g., initial on page 2 after signing page 5), does the system reuse the Signature already in session memory, or re-open Signature creation? Reuse is simpler; re-open gives more control. UX decision before implementation. Blocks FR-12 consequence.

2. **OQ-2 — Touch/stylus QA scope:** The Signature Canvas library supports touch events. Should MVP 1 explicitly QA-test stylus input on tablets? This affects QA scope but not architecture. Recommendation: explicitly support touch on the canvas; do not commit to mobile-optimized layout.

3. **OQ-3 — File size limit validation:** 25 MB is the assumed hard limit. Architecture phase must validate this against in-browser memory usage for large PDFs. The limit may need adjustment.

4. **OQ-4 — Disclaimer placement:** Three candidate placements: (a) persistent inline text near the Export button, (b) one-time dismissible modal on Document load, (c) footer text always visible. Option (a) is assumed (A-10). UX to decide.

5. **OQ-5 — Aspect ratio lock on resize:** Should the Overlay preserve the Signature's aspect ratio during resize by default? Locking prevents distortion; unlocking gives more placement control. UX decision. Assumed unlocked (A-6).

6. **OQ-6 — Export filename convention:** The assumed default is appending `-signed` to the original filename (A-7). Confirm or choose an alternative (e.g., user-editable name, timestamp suffix). UX decision.

---

## 10. Assumptions Index

All `[ASSUMPTION: A-N]` tags from this document:

- **A-1** (§4.3 FR-6) — Signature creation is not accessible before a Document is loaded. No "prepare signature before upload" flow.
- **A-2** (§4.1 FR-3) — One Document per session. Loading a new Document silently discards all Overlays without a confirmation prompt in MVP 1.
- **A-3** (§4.3 intro) — One Signature is active per session. All Overlays placed in a session use the same Signature. If the user creates a new Signature, existing Overlays retain their displayed appearance until Export; whether pre-existing Overlays update to the new Signature is a UX/implementation decision.
- **A-4** (§4.4 FR-11) — Default Overlay position is near the bottom-right of the Page. Subject to UX refinement.
- **A-5** (§4.3 FR-7) — Touch/stylus input on the Signature Canvas is supported by the underlying library and not intentionally blocked, but is not a primary QA target for MVP 1.
- **A-6** (§4.4 FR-14) — Overlay aspect ratio is not locked by default. UX may override (see OQ-5).
- **A-7** (§4.5 FR-18) — Export filename convention is `{original-name}-signed.pdf`. Subject to UX decision (see OQ-6).
- **A-8** (§1 / Product Brief) — Competitive landscape: most browser-based PDF signing tools upload documents to servers. Not validated; confirm before launch positioning is finalized.
- **A-9** (§4.1 FR-2) — 25 MB Document size limit. Needs architecture validation (see OQ-3).
- **A-10** (§4.6 FR-21) — Disclaimer is persistent inline text near the Export control, not a modal. Subject to OQ-4 resolution.

---

## Information Architecture (MVP 1)

*Three surfaces. No routing required for MVP 1 — the app is a single-page experience.*

| Surface | Description |
|---------|-------------|
| **Upload Screen** | Initial state. Prominent PDF upload area (drag-and-drop zone + browse button). Disclaimer visible. No Document loaded. |
| **Editor** | Post-upload state. Rendered PDF pages in a scrollable panel. Signature Overlay controls visible. Export control visible. Disclaimer visible. "Add Signature" / "Add Another" control available. |
| **Signature Creation** | Modal or side panel. Drawn tab (Signature Canvas) and Typed tab (text input + Font Style selector). Clear and Confirm controls. Accessible from within the Editor. |

*Navigation:* Upload Screen → Editor (on successful Document load). Editor → Signature Creation (on "Add Signature"). Signature Creation → Editor (on Confirm or Cancel). Editor → Export (download trigger). No back-navigation to Upload Screen without page refresh in MVP 1.

*Error surfaces:* All upload errors (invalid file type, size exceeded, parse failure) display inline in the Upload Screen. Export failures display inline in the Editor near the Export control.

---

## Aesthetic and Tone

- **Visual:** Clean, minimal, high-contrast. The UI should not compete with the Document content. The PDF rendering surface is the focal point.
- **Trust signals:** The privacy guarantee should be visually prominent without being alarming. The disclaimer is informational, not a warning.
- **Copy tone:** Direct, matter-of-fact, no enterprise jargon. "Download Signed PDF" not "Execute Document Finalization." "Add Signature" not "Initiate Signing Workflow."
- **Anti-references:** Avoid dark patterns, modal stacking, or prompts that slow the user down. The fastest path to Export wins.

---

## Platform

- **MVP 1:** Desktop web. Chrome 110+, Firefox 110+, Safari 16+.
- **Responsive web:** The layout should not break at tablet-width viewports, but mobile-optimized layout is not a deliverable for MVP 1.
- **No native app:** Not in scope for any current phase.
- **Deployment:** Static web app (Next.js static export or SSG). Hosted on CDN. No server-side rendering of Document content. See `addendum.md` for hosting options.
