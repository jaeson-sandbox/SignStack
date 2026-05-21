import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom doesn't ship browser graphics primitives that pdfjs-dist references
// at module-eval time (DOMMatrix, Path2D, ImageData). A no-op class is enough
// to let `react-pdf` / `pdfjs-dist` modules load in jsdom; tests that only
// exercise our wrapper code (e.g. pdfWorker assertion) don't actually invoke
// these constructors. Tests that render real PDFs must run in a real browser.
type AnyCtor = new (...args: unknown[]) => unknown;
const g = globalThis as unknown as Record<string, unknown>;
if (typeof g.DOMMatrix === 'undefined') {
  g.DOMMatrix = class {} as unknown as AnyCtor;
}
if (typeof g.Path2D === 'undefined') {
  g.Path2D = class {} as unknown as AnyCtor;
}
if (typeof g.ImageData === 'undefined') {
  g.ImageData = class {} as unknown as AnyCtor;
}

afterEach(() => {
  cleanup();
});
