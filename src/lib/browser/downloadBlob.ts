/**
 * Imperative shell for triggering a browser file download from in-memory bytes
 * (Story 6.1). This is the Blob + anchor-click + revoke dance the CLAUDE.md
 * guidelines name as a canonical "shell" responsibility.
 *
 * The actual save side effect is injected (`BlobSaver`) so the Blob assembly —
 * the only part with a testable decision (mime type, filename pass-through) —
 * can be unit-tested with a fake saver, while the untestable anchor/DOM dance
 * runs only in the real browser. No real downloads happen in tests.
 */

/** Performs the actual save of an assembled Blob under `filename`. */
export type BlobSaver = (blob: Blob, filename: string) => void;

/**
 * Default saver: create an object URL, click a hidden `<a download>`, then
 * revoke. The anchor is appended to the DOM before clicking for Firefox, which
 * ignores synthetic clicks on detached anchors.
 */
const saveViaAnchor: BlobSaver = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Wrap `bytes` in a Blob of `mimeType` and hand it to `save` under `filename`.
 * Defaults to a real anchor download; pass a fake `save` in tests.
 */
export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  mimeType: string = "application/pdf",
  save: BlobSaver = saveViaAnchor,
): void {
  // Copy into a fresh Uint8Array (inferred Uint8Array<ArrayBuffer>) so the
  // Blob part is not the SharedArrayBuffer-capable Uint8Array<ArrayBufferLike>
  // that the DOM Blob constructor type rejects.
  save(new Blob([new Uint8Array(bytes)], { type: mimeType }), filename);
}
