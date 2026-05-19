---
title: "Brief–PRD Reconciliation: SignStack MVP 1"
created: 2026-05-18
source-brief: _bmad-output/planning-artifacts/briefs/brief-signstack-2026-05-18/brief.md
source-prd: _bmad-output/planning-artifacts/prds/prd-signstack-2026-05-18/prd.md
---

# Brief–PRD Reconciliation: SignStack MVP 1

## Scope Item Coverage (Brief "In Scope" → PRD FRs)

| Brief Scope Item | PRD Coverage | Status |
|---|---|---|
| PDF upload — single PDF from device | FR-1 (file picker + drag-and-drop), FR-2 (validation), FR-3 (session replacement) | COVERED |
| PDF rendering — all pages via pdfjs-dist | FR-4 (full-document rendering), FR-5 (page identification) | COVERED |
| Signature creation — drawn (canvas) or typed (styled text) | FR-6 (entry point), FR-7 (drawn), FR-8 (typed), FR-9 (clear/redo), FR-10 (confirmation) | COVERED |
| Signature overlay — draggable and resizable on any page | FR-11 (placement), FR-12 (multiple overlays), FR-13 (drag), FR-14 (resize), FR-15 (removal) | COVERED |
| Export — signed PDF with signature embedded via pdf-lib | FR-16 (trigger), FR-17 (embedding), FR-18 (download), FR-19 (content preservation) | COVERED |
| Local processing — all client-side, no data transmitted | FR-20 (enforcement), NFR-PV1, NFR-PV2 | COVERED |

All six In Scope items are represented by at least one FR. **No gaps.**

---

## Non-Goals (Permanent) — Brief §"Non-Goals" → PRD §5

| Brief Non-Goal | PRD §5 Coverage | Status |
|---|---|---|
| Cryptographic digital signatures (eIDAS, ESIGN Act) | "A cryptographic signing platform" — explicitly listed | COVERED |
| Native AcroForm field editing | "A PDF form editor" — explicitly listed | COVERED |
| AI document analysis | "An AI-assisted tool" — explicitly listed | COVERED |
| Enterprise workflow orchestration (multi-party routing, audit logging) | "A multi-party workflow tool" — explicitly listed | COVERED |

All four permanent non-goals are present in PRD §5. **No gaps.**

---

## Deferred Items — Brief "Out of Scope for MVP 1" → PRD §6.2

| Brief Deferred Item | PRD §6.2 Entry | Status |
|---|---|---|
| Text box overlays (Phase 2) | Listed | COVERED |
| Date field overlays (Phase 2) | Listed | COVERED |
| Checkmark overlays (Phase 2) | Listed | COVERED |
| Multiple PDF upload (Phase 3) | Listed as "Multiple PDF upload (Phase 3)" | COVERED |
| PDF combining or reordering (Phase 3) | Listed as "PDF page reordering" and "PDF merging" | COVERED |
| User authentication or accounts (post-MVP) | Listed as "User accounts / authentication (post-MVP)" | COVERED |
| Cloud storage or sync (post-MVP) | Listed as "Cloud storage (non-goal — conflicts with privacy model)" | COVERED |
| Email invitations or multi-party workflows (post-MVP) | Listed as "Email invitations / multi-party workflow (post-MVP)" | COVERED |
| Payments or subscription management (post-MVP) | Listed as "Payments / subscription (post-MVP)" | COVERED |
| Mobile-native app (post-MVP) | Listed as "Mobile-native app / mobile-optimized layout (post-MVP)" | COVERED |

All ten deferred items are present in PRD §6.2. **No gaps.**

---

## Success Criteria — Brief → PRD §7

| Brief Success Criterion | PRD §7 Coverage | Status |
|---|---|---|
| Upload → sign → export in under 2 minutes, no instruction | SM-1: median time-to-export ≤ 2 minutes | COVERED |
| Zero PDF content transmitted (verifiable via network inspector) | SM-3: zero bytes transmitted, automated network inspection in CI | COVERED |
| Exported PDF opens correctly in Adobe Reader, macOS Preview, browser PDF viewers | FR-18 consequences + SM-2: ≥95% export success across major PDF viewers | COVERED |
| Core signing flow works on Chrome, Firefox, Safari (desktop) | SM-4: cross-browser completion rate on Chrome 110+, Firefox 110+, Safari 16+ | COVERED |
| Return usage rate (longer-term signal) | SM-5: return usage within 30 days, baseline only | COVERED |
| Completion rate — users who start and export | SM-1/SM-2 together proxy completion; no explicit "completion rate" metric | PARTIAL GAP — see §Gaps below |
| Qualitative: user-reported trust in the privacy model | Not captured as a metric in §7 | GAP — see §Gaps below |

---

## Technical Constraints — Brief → PRD or addendum.md

The brief's Technical Constraints name seven pre-selected packages/tools:

| Constraint | PRD or Addendum Coverage | Status |
|---|---|---|
| Next.js App Router (TypeScript) | Referenced in Platform section (deployment/SSG); detail deferred to addendum.md per §0 | NOTED IN PRD / ADDENDUM |
| pdfjs-dist / react-pdf | Referenced in FR-4 description and §4.2 | COVERED |
| pdf-lib | Referenced in §4.5 description and FR-17 | COVERED |
| react-signature-canvas | Referenced in FR-7 (A-5 assumption) | COVERED |
| react-rnd | Referenced in NFR-A3 note | COVERED |
| Tailwind CSS | Not mentioned in PRD or noted as being in addendum.md | GAP — see §Gaps below |
| Vitest | Not mentioned in PRD or noted as being in addendum.md | GAP — see §Gaps below |
| Deployment: Vercel or Cloudflare Pages (static, CDN) | Mentioned in Platform section | COVERED |

---

## Resolved Open Questions — Brief → PRD

| Brief Open Question | PRD Coverage | Status |
|---|---|---|
| Typed signature font styles: Clean / Script / Formal | FR-8 consequences: "Font Style options are: Clean, Script, and Formal. Exactly three options in MVP 1." Also in Glossary definition of Font Style. | COVERED |
| Legal disclaimer in UI and README | FR-21: persistent disclaimer in UI. FR-21 consequences note: "The disclaimer is present in the README." | COVERED |

Both resolved open questions are fully represented. **No gaps.**

---

## Qualitative Ideas — Brief → PRD

| Brief Qualitative Idea | PRD Coverage | Status |
|---|---|---|
| Privacy-first framing as structural (not policy-based) guarantee | §1 Vision, §4.6 intro, NFR-PV1, SM-C2 | COVERED |
| Trust signals — privacy guarantee visible, not alarming | "Aesthetic and Tone" section: "Trust signals: The privacy guarantee should be visually prominent without being alarming." | COVERED |
| No account, zero onboarding friction | §2.2 JTBD, §2.3 Non-Users, UJ-1 | COVERED |
| Right-sized for the use case (not DocuSign) | §2.3, §5 Non-Goals | COVERED |
| Copy tone: direct, no enterprise jargon | "Aesthetic and Tone" section: explicit copy guidance with examples | COVERED |
| Anti-patterns: no dark patterns, prompts that slow user | "Aesthetic and Tone" section: "Avoid dark patterns, modal stacking, or prompts that slow the user down." | COVERED |

All qualitative ideas from the brief are captured in the PRD. **No gaps.**

---

## Gaps Found

### GAP-1 (Minor): Completion rate metric not explicit in §7
**Brief:** "Completion rate: users who start a signing session and export."
**PRD §7:** SM-1 (time to export) and SM-2 (export success rate) together approximate completion, but neither defines it as "percentage of users who started a session and completed an export." A distinct SM for funnel completion rate (sessions that reach Export / total sessions that loaded a Document) should be added or SM-1 should be reframed to encompass it.

### GAP-2 (Minor): Qualitative trust metric not captured in §7
**Brief:** "Qualitative: user-reported trust in the privacy model."
**PRD §7:** No success metric corresponds to this. A qualitative SM — e.g., a post-export survey item, NPS proxy, or usability-test observation — should be added, even if deferred to post-launch research. Omitting it entirely loses the brief's intent to track user-perceived trust, not just technical compliance.

### GAP-3 (Minor): Tailwind CSS not acknowledged in PRD or noted as being in addendum.md
**Brief Technical Constraints:** Tailwind CSS is listed as a pre-selected constraint.
**PRD:** Not referenced anywhere, and §0 only says "technical implementation choices live in addendum.md" without confirming Tailwind is one of them. Either add a note to the Platform section or confirm it is in addendum.md.

### GAP-4 (Minor): Vitest not acknowledged in PRD or noted as being in addendum.md
**Brief Technical Constraints:** Vitest is listed as the pre-selected test runner.
**PRD:** Not referenced. Same resolution as GAP-3 — either note in PRD or confirm in addendum.md.

### GAP-5 (Low): No explicit "export with zero Overlays" success path in brief — PRD extends it; no gap from brief perspective, but FR-16 introduces a new behavior
**FR-16 consequences:** "The control is available whether or not any Overlays have been placed (exporting with zero Overlays produces the original Document unchanged)." This behavior is not mentioned in the brief. It is a reasonable extension, not a contradiction, but it is an addition the brief author should be aware of in case the intent was to require at least one Overlay before Export is enabled.
**Recommendation:** PM to confirm: should Export be disabled/hidden until at least one Overlay is placed, or is pass-through export acceptable?

---

## Summary

| Check | Result |
|---|---|
| All In Scope items → at least one FR | PASS (6/6) |
| All permanent Non-Goals → PRD §5 | PASS (4/4) |
| All Deferred items → PRD §6.2 | PASS (10/10) |
| Success Criteria → PRD §7 | PARTIAL — 2 gaps (completion rate, qualitative trust) |
| Technical Constraints → PRD or addendum.md | PARTIAL — 2 gaps (Tailwind, Vitest not acknowledged) |
| Resolved open questions → PRD | PASS (2/2) |
| Qualitative ideas (tone, trust, privacy framing) → PRD | PASS |

**Total actionable gaps: 4** (GAP-1 through GAP-4). GAP-5 is a clarification request, not a gap.
