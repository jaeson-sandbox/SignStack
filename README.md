# SignStack

**Sign PDFs visually, entirely in your browser.** SignStack lets you open a PDF, draw or type a signature, place it on any page, and download a signed copy — without an account, without uploading your file anywhere, and without installing software.

> **Important:** SignStack creates **visual signatures** (an image placed on top of your PDF). It does **not** create certificate-based cryptographic digital signatures and provides no legal/compliance-grade non-repudiation. See [Legal & signature disclaimer](#legal--signature-disclaimer).

---

## What it does

- **Open a PDF** — drag and drop or browse (PDFs up to 25 MB).
- **Create a signature** — draw it freehand, or type your name and pick a handwriting-style font.
- **Place it on the page** — the signature lands on the page you're viewing.
- **Sign multiple pages** — place signatures on one or many pages of the same document.
- **Adjust overlays** — move, resize, or delete any placed signature.
- **Keyboard editing** — nudge a selected overlay with the arrow keys (1px, or 8px with **Shift**), and remove it with **Delete** / **Backspace**.
- **Copy and paste** — duplicate a selected overlay with **Ctrl/Cmd + C** and **Ctrl/Cmd + V** (same page offsets the copy; another page reuses the position).
- **Reuse a signature** — place the same signature again across pages without redrawing it.
- **Export a signed PDF** — download a new `*-signed.pdf` with your signatures embedded; the original is left untouched.

## Privacy guarantee

SignStack is built so your document never leaves your device:

- **No upload.** The PDF is read into browser memory only. No file content is sent to any server.
- **Local processing.** Parsing, rendering, signing, and export all happen client-side in your browser.
- **No persistence.** Nothing is written to `localStorage`, `IndexedDB`, or cookies. Your document, signature, and overlay data live in memory for the current session only and are cleared on page refresh, tab close, or when you load a new file.
- **No accounts.** There is no sign-up, login, tracking, or analytics.

You can confirm this yourself: open your browser's DevTools **Network** panel while using the app — no request carries your document's contents.

## Legal & signature disclaimer

**SignStack adds visual signatures to PDFs. It does not create certificate-based digital signatures.**

- A SignStack signature is a **visual annotation** — an image drawn on top of the PDF. It is **not** backed by a cryptographic certificate, PKI, or digital signature standard.
- It provides **no cryptographic integrity, identity verification, or non-repudiation**, and is **not** a legally binding digital/electronic signature in the sense defined by frameworks such as eIDAS or the U.S. ESIGN Act.
- **You are responsible** for determining whether a visual signature is acceptable for your specific use case. If your situation requires a certificate-based digital signature, use a dedicated digital-signing service instead.

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org/) 20.9 or newer (the Next.js 16 minimum). The project is developed on Node 24, which is recommended.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server at `http://localhost:3000`. |
| `npm run build` | Create an optimized production build. |
| `npm start` | Serve the production build (run `npm run build` first). |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the test suite once (Vitest). |
| `npm run test:watch` | Run the tests in watch mode. |

## Tech stack

- **[Next.js](https://nextjs.org/)** (App Router) + **[React](https://react.dev/)** — UI and app shell.
- **[TypeScript](https://www.typescriptlang.org/)** — typed throughout.
- **[react-pdf](https://github.com/wojtekmaj/react-pdf)** / **[PDF.js](https://mozilla.github.io/pdf.js/)** (`pdfjs-dist`) — in-browser PDF rendering.
- **[pdf-lib](https://pdf-lib.js.org/)** — embedding signatures and generating the exported PDF.
- **[react-signature-canvas](https://github.com/agilgur5/react-signature-canvas)** — the freehand drawing canvas.
- **[react-rnd](https://github.com/bokuweb/react-rnd)** — drag and resize for placed overlays.
- **[Tailwind CSS](https://tailwindcss.com/)** — styling via design tokens.
- **[Vitest](https://vitest.dev/)** + **[Testing Library](https://testing-library.com/)** — unit and component tests.

## Browser support

SignStack targets modern desktop browsers:

| Browser | Status |
| --- | --- |
| Chrome 110+ | Supported (primary) |
| Microsoft Edge (Chromium) | Supported |
| Firefox 110+ | Supported |
| Safari 16+ (desktop) | Supported |

> **Verification note:** This build has been exercised primarily in Chrome on Windows. Edge, Firefox, and Safari are supported targets per the project's compatibility goals but have not been exhaustively verified in every environment. If you hit a browser-specific issue, please report it.

## Known limitations

- **Desktop-first.** There is no mobile-optimized layout yet. The page should not break at tablet widths, but small-screen/touch ergonomics are not a goal for this release.
- **25 MB PDF limit.** Larger files are rejected with an on-screen message.
- **Single session, in memory.** Your work is not saved. Refreshing, closing the tab, or loading a new file clears everything. There is no cloud storage, history, or account sync.
- **Visual signatures only.** No certificate-based / cryptographic digital signatures (see the disclaimer above).
- **No form-field editing.** SignStack does not detect or fill PDF form (AcroForm) fields, and there are no text-box, date, or checkmark overlays yet.
- **No OCR or text search**, and **no page rotation or PDF merging/combining.**

## Accessibility

SignStack aims for WCAG 2.1 AA for UI controls outside the freehand drawing canvas:

- **Keyboard navigable** — upload, toolbar, the signature modal (with a focus trap and `Escape` to close), the typed-signature path, and overlay editing are usable without a mouse.
- **Visible focus states** — interactive controls show a clear focus ring.
- **Contrast** — text and UI colors are tuned to meet AA contrast ratios.
- **Announcements** — errors are surfaced through live regions so screen readers announce them.

The freehand drawing canvas has inherent accessibility limits; the **typed-signature** path is the fully keyboard-accessible alternative.

## Project status

MVP 1 — visual PDF signing — is feature-complete: upload, draw/type signatures, multi-page placement, overlay editing (move/resize/delete/keyboard/copy-paste), signature reuse, and signed-PDF export, with error/loading/empty-state and accessibility polish. Form-fill overlays (text, date, checkmark) and other enhancements are planned for later phases and are not part of this release.
