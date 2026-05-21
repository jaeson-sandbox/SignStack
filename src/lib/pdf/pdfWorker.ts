"use client";

import { pdfjs } from "react-pdf";

// react-pdf v10 re-exports `pdfjs` from its nested pdfjs-dist (5.4.296),
// and on module load sets `pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.mjs'`
// — a bare relative URL that won't resolve under a Next.js public path.
// We override it with the worker copy in `public/`, which was copied from
// `node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
// to guarantee the worker version matches react-pdf's bundled pdfjs API.
// Resolves R-1 (pdfjs-dist version mismatch) and R-6 from docs/baseline-verification.md.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
