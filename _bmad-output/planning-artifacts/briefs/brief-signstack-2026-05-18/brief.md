---
title: "Product Brief: SignStack"
status: approved
created: 2026-05-18
updated: 2026-05-18
---

# Product Brief: SignStack

## Executive Summary

SignStack is a privacy-focused, browser-based PDF toolkit that lets people sign, fill out, and combine PDFs without uploading their documents to a cloud service. Every operation runs locally in the user's browser — no account, no server, no trace.

The first version delivers one thing well: visual PDF signing. Users upload a PDF, place a handwritten or typed signature anywhere on any page, resize and reposition it, and export a clean signed PDF — all in their browser, entirely offline-capable, with zero document data leaving their device.

The long-term product expands into text, date, and checkmark overlays (Phase 2) and multi-PDF combining and reordering (Phase 3), building a complete lightweight document toolkit for individuals and small teams who need to get documents signed and filled without subscribing to heavyweight enterprise software.

## The Problem

Signing a PDF is a routine task, but the options for doing it are either expensive, privacy-invasive, or friction-heavy.

**The dominant tools require too much:**
- Adobe Acrobat requires a subscription for full signing capability.
- DocuSign, HelloSign, and similar platforms require account creation and upload documents to their servers — appropriate for business workflow orchestration, but disproportionate for an individual who just needs to sign a lease, a freelance contract, or an NDA.
- Browser-based workarounds (Google Docs import/export, online PDF editors) are clunky, degrade formatting, and still involve uploading to a third party.

**The privacy gap is real:**
People routinely sign sensitive documents — employment agreements, medical releases, financial contracts. Uploading these to a cloud service requires accepting terms of service and trusting third-party data handling policies. Users who handle sensitive documents often have no practical alternative that preserves their privacy.

**The underserved user:**
Freelancers, contractors, small business owners, and privacy-conscious individuals need a fast, local, free way to sign PDFs. They are not running a multi-party signing workflow. They just need to sign the document and send it back.

## The Solution

SignStack runs entirely in the browser. No document upload. No account required.

**MVP 1 — Visual PDF Signing:**
1. User uploads a PDF from their device.
2. The PDF is rendered page by page in the browser.
3. User creates a signature — either drawn with a mouse/touchpad or typed in a chosen style.
4. The signature is placed as a draggable, resizable overlay on any page.
5. User exports the finished PDF with the signature embedded into the page content.

The result is a signed PDF indistinguishable from one signed in a desktop application — because the signature is embedded as a visual element, not attached as a metadata annotation.

**Phase 2 — Form Fill-Out:**
The same overlay model extends to text boxes, date fields, and checkmarks. Users fill out forms by placing visual overlays on top of existing PDF designs and exporting. No native form-field detection required.

**Phase 3 — PDF Combining:**
Users upload multiple PDFs, reorder pages or documents, and export a single merged PDF.

## What Makes This Different

**Local-first is the core differentiator.**
SignStack's privacy guarantee is structural, not policy-based. The browser never sends PDF content to a server because the architecture does not include a server for document processing. This is meaningfully different from services that claim privacy through policy.

**No account required.**
Zero onboarding friction. Open the app, sign the PDF, done.

**Right-sized for the use case.**
SignStack does not try to be DocuSign. It serves the individual who needs to sign a document and return it — not the business managing multi-party signing workflows. This focus keeps the product fast and simple.

**[ASSUMPTION] Competitive landscape:** Most direct browser-based competitors either upload documents to their servers or have significant UX friction. The local-first browser approach with a clean UI is the opening. This assumption should be validated with lightweight competitive research before the PRD is finalized.

## Who This Serves

**Primary: The Solo Signer**
A freelancer, contractor, remote worker, or individual who frequently receives PDFs that need a signature and wants to handle it locally, fast, and without creating accounts. They are comfortable in a browser, not looking for workflow orchestration, and value privacy enough to choose a tool on that basis.

Representative scenarios:
- Signing a freelance contract and returning it to a client.
- Signing a lease, NDA, or release form.
- Initialing a multi-page agreement before emailing it back.

**Secondary: The Privacy-Conscious Small Business**
A small team or solo operator who handles documents with sensitive content (financial, legal, medical-adjacent) and prefers not to route them through third-party cloud services. They value the local-first guarantee for compliance or preference reasons.

## MVP 1 Scope

### In Scope

| Capability | Description |
|-----------|-------------|
| PDF upload | Single PDF upload from the user's device |
| PDF rendering | All pages rendered in the browser via pdfjs-dist |
| Signature creation | Drawn (canvas) or typed (styled text) signature |
| Signature overlay | Draggable and resizable overlay on any page |
| Export | Download signed PDF with signature embedded into page content via pdf-lib |
| Local processing | All operations client-side; no document data transmitted |

### Explicitly Out of Scope for MVP 1 (Deferred)

The following are planned for later phases, not permanent exclusions:

- Text box overlays (Phase 2)
- Date field overlays (Phase 2)
- Checkmark overlays (Phase 2)
- Multiple PDF upload (Phase 3)
- PDF combining or reordering (Phase 3)
- User authentication or accounts (post-MVP)
- Cloud storage or sync (post-MVP)
- Email invitations or multi-party workflows (post-MVP)
- Payments or subscription management (post-MVP)
- Mobile-native app (post-MVP; responsive web acceptable)

## Non-Goals (Permanent)

These are explicitly outside the product's intended scope regardless of phase:

- **Cryptographic digital signatures:** SignStack produces visually signed PDFs, not legally binding digital signatures with certificate chains. Users who need compliance-grade signing (eIDAS, ESIGN Act audit trails) should use a purpose-built platform.
- **Native AcroForm field editing:** Reading and editing existing PDF form fields is out of scope. Phase 2 overlays are placed on top of the visual design, not wired to underlying field definitions.
- **AI document analysis:** Conflicts with the local-first privacy guarantee and is out of scope.
- **Enterprise workflow orchestration:** Multi-party routing, approval chains, audit logging — not the product.

## Roadmap

### Phase 2 — Form Fill-Out Overlays
Extends the overlay model with three new overlay types:
- **Text box:** Freeform typed text placed anywhere on a page.
- **Date field:** A date picker that renders the selected date as text.
- **Checkmark:** A togglable checkmark symbol.

All three follow the same drag/resize/embed pattern as Phase 1 signatures. Export embeds all overlays into the PDF. Success criteria to be defined in the Phase 2 PRD iteration.

### Phase 3 — PDF Combining
- Upload multiple PDFs.
- View and reorder pages or full documents.
- Merge into a single exported PDF.

Success criteria to be defined in the Phase 3 PRD iteration.

### Parking Lot (Future / Unscheduled)
- User accounts and document history (opt-in).
- Monetization model (not yet defined — not in scope for any current phase).
- Collaboration / multi-party signing workflows.

## Technical Constraints

The stack is pre-selected. These constraints are foundational to the architecture:

- **Next.js App Router (TypeScript)** — application framework.
- **pdfjs-dist / react-pdf** — client-side PDF rendering. No server-side rendering.
- **pdf-lib** — client-side PDF writing and overlay embedding. No server-side processing.
- **react-signature-canvas** — drawn signature capture.
- **react-rnd** — draggable/resizable overlay component.
- **Tailwind CSS** — styling.
- **Vitest** — testing.
- **Deployment:** Hosted static web app (e.g., Vercel or Cloudflare Pages). Document processing remains client-side regardless of hosting; the app bundle itself is served from a CDN. No document data is transmitted to the host.

## Success Criteria

**MVP 1 Launch:**
- A user can upload a PDF, place a signature, and export a signed PDF in under 2 minutes with no instruction.
- Zero PDF content is transmitted to any server (verifiable via network inspector).
- The exported PDF opens correctly in Adobe Reader, macOS Preview, and browser PDF viewers with the signature visually present.
- Core signing flow works on Chrome, Firefox, and Safari (desktop).

**Longer-term signals (to be refined in PRD):**
- Return usage rate: users who come back to sign another document.
- Completion rate: users who start a signing session and export.
- Qualitative: user-reported trust in the privacy model.

## Open Questions

1. **Typed signature rendering:** What font styles will be offered for typed signatures? Cursive-style web fonts are the common approach. Needs a UX decision before the PRD is finalized.
2. **Legal disclaimer:** Should the product UI surface a disclaimer that visual signatures are not legally equivalent to cryptographic digital signatures? Recommended yes, but needs an explicit decision.
