import { describe, expect, it } from "vitest";
import { pdfjs } from "react-pdf";
// Side-effect import — must run before the assertion.
import "@/lib/pdf/pdfWorker";

describe("pdfWorker side-effect", () => {
  it("overrides react-pdf's default workerSrc with /pdf.worker.min.mjs", () => {
    // react-pdf sets workerSrc = 'pdf.worker.mjs' (a broken bare URL) on
    // its own import; pdfWorker.ts must override that with the public-path
    // worker copy. If this assertion ever fails, react-pdf would silently
    // fall back to the broken default at runtime.
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
  });
});
