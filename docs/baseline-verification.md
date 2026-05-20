# Project Baseline Verification

**Story:** 1.1 — `infra/project-baseline-verification`
**Date verified:** 2026-05-19
**Verifier:** Claude Code (Opus 4.7)
**Source of truth:** Installed source under `node_modules/`. Do not trust training data — APIs in this repo's stack have all shifted recently.

This document captures the package versions, APIs, and constraints that downstream stories must build against. Re-verify (re-read the relevant `node_modules` files) before writing any feature code that touches one of these libraries.

---

## Runtime environment

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | v24.15.0 | Satisfies `pdfjs-dist` (>=22.13.0 \|\| >=24) and Next 16 (>=20.9.0). |
| npm | 11.12.1 | |
| TypeScript | ^5 | Next 16 requires >=5.1.0. |

## Package versions (locked)

From `package.json` and confirmed against installed `node_modules/*/package.json`:

| Package | Installed | Notes |
| --- | --- | --- |
| `next` | 16.2.6 | Turbopack default, async request APIs, see breaking changes below. |
| `react` / `react-dom` | 19.2.4 | |
| `pdfjs-dist` (top-level) | 5.7.284 | Hoisted, ESM (`build/pdf.mjs`). |
| `pdfjs-dist` (nested under react-pdf) | 5.4.296 | **Version mismatch — see Risk R-1.** |
| `react-pdf` | 10.4.1 | Pins its own `pdfjs-dist@5.4.296`. |
| `pdf-lib` | 1.17.1 | |
| `react-signature-canvas` | 1.1.0-alpha.2 | Alpha — uses legacy `signature_pad@^2.3.2`. |
| `react-rnd` | 10.5.3 | |
| `tailwindcss` | ^4 | CSS-based `@theme` config in `globals.css`. |
| `vitest` | 4.1.6 | Configured this story. |
| `@vitejs/plugin-react` | 6.0.2 | Added this story (required for TSX component tests). |
| `@testing-library/react` | 16.3.2 | |
| `@testing-library/jest-dom` | 6.9.1 | |
| `jsdom` | 29.1.1 | Vitest environment. |

---

## Test setup (added this story)

| File | Purpose |
| --- | --- |
| `vitest.config.ts` | jsdom env, globals on, `@/*` alias, `tests/**/*.{test,spec}.{ts,tsx}` test discovery, `vitest.setup.ts` setup. |
| `vitest.setup.ts` | Imports `@testing-library/jest-dom/vitest`, runs `cleanup()` after each test. |
| `tests/smoke.test.ts` | Baseline smoke test — arithmetic + jsdom DOM globals. Confirms the pipeline works end to end. |

`npm test` runs Vitest once; `npm run test:watch` for the watch loop.

---

## API findings

### Next.js 16 (`next@16.2.6`)

- **Turbopack is the default** for `next dev` and `next build`. The legacy `--turbopack` flag is no longer needed and the scripts in `package.json` already omit it. If a Webpack-only feature surfaces, opt out per-command with `next build --webpack`, not via config.
- **Async request APIs.** `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are async-only in v16. No sync fallback. Anywhere we touch these (we do not yet — we have no API routes by design), `await` is mandatory.
- **`next/dynamic` with `ssr: false`.** Per `docs/01-app/02-guides/lazy-loading.md`: `ssr: false` works **only inside Client Components**. If a Server Component needs to lazy-load a PDF-heavy Client Component, the `dynamic(..., { ssr: false })` call must live inside a Client Component wrapper, not the Server Component itself. This is the pattern the architecture mandates for all PDF surfaces (`react-pdf`, `pdf-lib`, `react-signature-canvas`, `react-rnd`).
- **TypeScript >= 5.1**, **Node >= 20.9**, browser baseline Chrome/Edge/Firefox 111+, Safari 16.4+. The PRD's browser-support claim aligns with this.

### `pdfjs-dist@5.7.284`

- Main entry: `build/pdf.mjs` (ESM).
- Worker file: `build/pdf.worker.mjs` and `build/pdf.worker.min.mjs`.
- v5 ships ESM only; the legacy `pdf.worker.js` UMD worker no longer exists. Worker must be referenced as a `.mjs` URL.
- Worker is set via `pdfjs.GlobalWorkerOptions.workerSrc = '<url>'`. We do **not** set this in app code yet (Story 2.2 will).

### `react-pdf@10.4.1`

- Re-exports `pdfjs` from its **nested** `pdfjs-dist@5.4.296`: `export { pdfjs, Document, Outline, Page, Thumbnail, ... }` (see `dist/index.js`).
- On module load, `react-pdf` already sets `pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs'` (a bare relative URL that will fail at runtime in a Next.js app). The app **must** override this before rendering any `<Document>`.
- Recommended pattern (for Story 2.2): `import { pdfjs } from 'react-pdf'; pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';` and copy the worker file from `node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs` into `public/`. Using the nested copy guarantees API↔worker version alignment.
- `<Document file={...} />` accepts a `File`, a URL string, a `{ data: Uint8Array }` object, or a `{ url: string }` object. Note: equality is `===`, so memoize the prop in state/`useMemo`.

### `pdf-lib@1.17.1`

APIs needed for the export pipeline are all present (verified against `cjs/api/PDFDocument.d.ts` and `cjs/api/PDFPage.d.ts`):

- `PDFDocument.load(pdf: string | Uint8Array | ArrayBuffer, options?: LoadOptions): Promise<PDFDocument>`
- `PDFDocument.create(options?: CreateOptions): Promise<PDFDocument>`
- `pdfDoc.embedPng(png: string | Uint8Array | ArrayBuffer): Promise<PDFImage>`
- `pdfDoc.embedJpg(...)` available if we ever need it.
- `pdfDoc.embedFont(font: StandardFonts | string | Uint8Array | ArrayBuffer, options?): Promise<PDFFont>`
- `pdfDoc.copyPages(srcDoc: PDFDocument, indices: number[]): Promise<PDFPage[]>`
- `page.drawImage(image: PDFImage, options?: PDFPageDrawImageOptions): void`
- `page.drawText(text: string, options?: PDFPageDrawTextOptions): void`
- `page.getSize(): { width, height }`, `page.getWidth()`, `page.getHeight()`
- `pdfDoc.save(options?: SaveOptions): Promise<Uint8Array>`

Coordinate origin is bottom-left (PDF user-space units = points). The architecture's coordinate-mapping formula (with Y-flip) holds.

### `react-signature-canvas@1.1.0-alpha.2`

From `dist/index.d.ts`:

- Default export and named export: `SignatureCanvas` (a `React.Component`).
- Props extend `SignaturePad.SignaturePadOptions` plus `canvasProps?` and `clearOnResize?`.
- Instance methods we will use:
  - `getCanvas(): HTMLCanvasElement`
  - `getTrimmedCanvas(): HTMLCanvasElement` — strips transparent margins, ideal source for export.
  - `isEmpty(): boolean`
  - `clear(): void`
  - `toDataURL(...)` — bound straight from `signature_pad`.
  - `fromDataURL(...)`
- **Caveats:**
  - This is a pre-release (`alpha.2`). The maintained 1.x line still uses `signature_pad@^2.3.2`; mainline `signature_pad` is on v4/v5. Behavior and prop names may drift before the stable 1.1.0 release — pin the version and re-verify if we ever upgrade.
  - The component is React-19-compatible per its `peerDependencies` (`0.14 - 19`).
  - Must be rendered inside a Client Component; relies on canvas/DOM.

### `react-rnd@10.5.3`

From `lib/index.d.ts` (component `Rnd`):

- Position model: `position?: { x: number; y: number }` (controlled) or `default?: { x, y, width, height }` (uncontrolled initial).
- Size model: `size?: { width: string | number; height: string | number }`.
- Drag/resize callbacks we need:
  - `onDragStop(e, data)` — `data` includes `{ x, y, deltaX, deltaY, lastX, lastY, node }`.
  - `onResizeStop(e, dir, elementRef, delta, position)` — `delta` is `{ width, height }`, `position` is the new `{ x, y }`.
  - `onResize` and `onDrag` fire during interaction (useful for live preview but throttled callers required).
- Constraints: `bounds?: string | Element` (use a container ref string selector or element), `minWidth`, `minHeight`, `maxWidth`, `maxHeight`, `lockAspectRatio?: boolean | number`, `enableResizing?: ResizeEnable | boolean`, `dragAxis?: 'x'|'y'|'both'|'none'`.
- Dependencies: `re-resizable`, `react-draggable`. Peer accepts `react >=16.3.0` — React 19 works.

### `pdf-lib` ↔ canvas pipeline

For the typed-signature path the architecture specifies:
1. Render text to an offscreen `<canvas>` with the selected Google font.
2. `canvas.toDataURL('image/png')` → PNG data URL.
3. `pdfDoc.embedPng(dataUrl)` → `PDFImage`.
4. `page.drawImage(image, { x, y, width, height })`.

All four primitives are confirmed available. The trimmed signature canvas path (`getTrimmedCanvas().toDataURL('image/png')`) feeds the same `embedPng → drawImage` flow.

---

## Risks and follow-ups

### R-1 — pdfjs-dist version mismatch (high — must resolve before Story 2.2)

Top-level `pdfjs-dist@5.7.284` is hoisted, but `react-pdf@10.4.1` keeps its own nested `pdfjs-dist@5.4.296`. PDF.js refuses to run when the API and worker versions disagree.

**Decision for Story 2.2:**
- Always import `pdfjs` from `react-pdf`, never from `pdfjs-dist` directly.
- Copy the worker from `node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs` (the nested copy) into `public/pdf.worker.min.mjs` at build time (a `postinstall` script or a checked-in copy that we re-verify on dep bumps).
- Optionally consider pinning the top-level `pdfjs-dist` to whatever react-pdf carries, so it can be hoisted to a single deduped copy.

Out of scope for Story 1.1.

### R-2 — react-signature-canvas is an alpha pre-release

`1.1.0-alpha.2` (with legacy `signature_pad@^2.3.2`) is what react-19-compatible builds exist of. The stable 1.0.x line does not support React 19. Pin the alpha until a stable release lands and re-verify on bump.

### R-3 — Next 16 / Turbopack + Node-only modules

Turbopack is default in v16. Anything in `src/lib/pdf/*` or `src/lib/signature/*` that accidentally imports a Node module (e.g., `fs`, `canvas` via pdfjs's optional dependency) will fail to build for the browser bundle. Always import `pdfjs` from `react-pdf` (which already excludes Node-only branches via its `browser` field) rather than from `pdfjs-dist` directly. If a third-party dep pulls in `fs`/`canvas`, fix at the import site rather than papering over with `turbopack.resolveAlias`.

### R-4 — `pdfjs-dist` optional `@napi-rs/canvas`

`pdfjs-dist@5.x` declares `@napi-rs/canvas` as an `optionalDependencies` entry. It is a Node-only canvas backend. It must never end up in the client bundle. The `react-pdf → pdfjs-dist` import chain handles this correctly; importing `pdfjs-dist` directly may not.

### R-5 — `ssr: false` is Client-Component-only

A Server Component cannot use `dynamic(..., { ssr: false })`. Architecture's "PDFScrollArea, SignatureModal, etc. all dynamic-imported with `ssr: false`" must be done from a Client Component wrapper (the `'use client'` page or layout segment). Document this in any story that introduces a new PDF surface.

### R-6 — `react-pdf` auto-sets a broken `workerSrc` on import

`react-pdf/dist/index.js` line 12 sets `pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs'` (a bare URL that won't resolve under a Next.js public path). We must override this **before** the first `<Document>` renders. Story 2.2 should do this in a module-scope side effect or a `useEffect` of the first PDF-consuming component.

---

## Acceptance criteria for Story 1.1

- [x] `package.json` versions captured and confirmed against `node_modules`.
- [x] Vitest config (`vitest.config.ts`) and setup (`vitest.setup.ts`) exist and run.
- [x] `npm test` script added and passes against a smoke test (`tests/smoke.test.ts` — 2 tests green).
- [x] `@vitejs/plugin-react` added (required for TSX component tests in later stories).
- [x] API surfaces for `react-pdf`, `pdfjs-dist`, `pdf-lib`, `react-signature-canvas`, `react-rnd`, and `next/dynamic` verified against installed source.
- [x] Risks/follow-ups documented (R-1 through R-6).
- [x] No feature code added.

## Out of scope (deferred to later stories)

- PDF worker setup (`public/pdf.worker.min.mjs` + `pdfjs.GlobalWorkerOptions.workerSrc` override) — Story 2.2.
- App state shape / reducers — Story 1.2+.
- Any UI, upload, render, signature, overlay, or export code — Epics 2-5.
- Resolving R-1 (the pdfjs-dist version mismatch) — Story 2.2 implementation will lock in the chosen worker source.
