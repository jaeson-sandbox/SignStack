/**
 * Pure, deterministic PDF upload validation.
 *
 * Per architecture AD-8, validation runs in this order so we avoid
 * loading oversized files into memory:
 *   1. file.size  ≤ 25 MB
 *   2. MIME type  (application/pdf, or .pdf extension when MIME is empty)
 *   3. %PDF header in the first 4 bytes of the ArrayBuffer
 *   4. pdfjs-dist parse (handled by the renderer in a later story)
 */

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type ValidationErrorCode = "TOO_LARGE" | "WRONG_TYPE" | "BAD_HEADER";

export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationErrorCode; message: string };

const ERROR_MESSAGES: Record<ValidationErrorCode, string> = {
  TOO_LARGE: "This file exceeds the 25 MB limit.",
  WRONG_TYPE: "This file is not a PDF. Please select a PDF file.",
  BAD_HEADER:
    "This file could not be read as a PDF. It may be corrupt or mislabeled.",
};

function fail(code: ValidationErrorCode): ValidationResult {
  return { ok: false, code, message: ERROR_MESSAGES[code] };
}

function hasPdfExtension(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

/**
 * Cheap pre-flight checks that need only the File metadata.
 * Call before reading the ArrayBuffer so oversized files are rejected
 * without ever being loaded into memory.
 */
export function validateFileMetadata(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return fail("TOO_LARGE");
  }

  if (file.type) {
    if (file.type !== "application/pdf") {
      return fail("WRONG_TYPE");
    }
  } else if (!hasPdfExtension(file.name)) {
    // Some browsers / OSes report an empty MIME on drag-and-drop;
    // fall back to the extension in that case.
    return fail("WRONG_TYPE");
  }

  return { ok: true };
}

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46] as const; // "%PDF"

/**
 * Checks that the first 4 bytes match the %PDF magic.
 * Runs after metadata validation passes.
 */
export function validatePdfHeader(buffer: ArrayBuffer): ValidationResult {
  if (buffer.byteLength < PDF_HEADER.length) {
    return fail("BAD_HEADER");
  }
  const head = new Uint8Array(buffer, 0, PDF_HEADER.length);
  for (let i = 0; i < PDF_HEADER.length; i++) {
    if (head[i] !== PDF_HEADER[i]) {
      return fail("BAD_HEADER");
    }
  }
  return { ok: true };
}
