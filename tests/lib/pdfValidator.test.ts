import { describe, expect, it } from "vitest";
import {
  MAX_FILE_SIZE_BYTES,
  validateFileMetadata,
  validatePdfHeader,
} from "@/lib/pdf/pdfValidator";

function makeFile({
  name = "doc.pdf",
  type = "application/pdf",
  size = 1024,
}: {
  name?: string;
  type?: string;
  size?: number;
} = {}): File {
  const file = new File([new Uint8Array(0)], name, { type });
  // jsdom's File honors the bytes you pass in for .size, so override
  // it explicitly to simulate larger files without allocating memory.
  Object.defineProperty(file, "size", { value: size, configurable: true });
  return file;
}

function bufferOf(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

describe("validateFileMetadata — size", () => {
  it("rejects files larger than 25 MB with TOO_LARGE", () => {
    const result = validateFileMetadata(makeFile({ size: MAX_FILE_SIZE_BYTES + 1 }));
    expect(result).toEqual({
      ok: false,
      code: "TOO_LARGE",
      message: "This file exceeds the 25 MB limit.",
    });
  });

  it("accepts files exactly at the 25 MB limit", () => {
    const result = validateFileMetadata(makeFile({ size: MAX_FILE_SIZE_BYTES }));
    expect(result).toEqual({ ok: true });
  });
});

describe("validateFileMetadata — MIME / extension", () => {
  it("accepts application/pdf", () => {
    const result = validateFileMetadata(
      makeFile({ name: "report.pdf", type: "application/pdf" }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects non-PDF MIME with WRONG_TYPE", () => {
    const result = validateFileMetadata(
      makeFile({ name: "resume.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    );
    expect(result).toEqual({
      ok: false,
      code: "WRONG_TYPE",
      message: "This file is not a PDF. Please select a PDF file.",
    });
  });

  it("accepts an empty MIME if the filename ends with .pdf (drag-drop fallback)", () => {
    const result = validateFileMetadata(makeFile({ name: "x.pdf", type: "" }));
    expect(result).toEqual({ ok: true });
  });

  it("rejects an empty MIME when the filename does not end with .pdf", () => {
    const result = validateFileMetadata(makeFile({ name: "mystery", type: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_TYPE");
  });

  it("treats the .pdf extension case-insensitively", () => {
    const result = validateFileMetadata(makeFile({ name: "REPORT.PDF", type: "" }));
    expect(result).toEqual({ ok: true });
  });
});

describe("validatePdfHeader", () => {
  it("accepts a buffer starting with %PDF", () => {
    // 0x25 0x50 0x44 0x46 = "%PDF"
    const buf = bufferOf([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(validatePdfHeader(buf)).toEqual({ ok: true });
  });

  it("rejects a buffer with the wrong magic", () => {
    const buf = bufferOf([0x00, 0x00, 0x00, 0x00]);
    const result = validatePdfHeader(buf);
    expect(result).toEqual({
      ok: false,
      code: "BAD_HEADER",
      message:
        "This file could not be read as a PDF. It may be corrupt or mislabeled.",
    });
  });

  it("rejects a buffer shorter than 4 bytes", () => {
    const buf = bufferOf([0x25, 0x50]);
    const result = validatePdfHeader(buf);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("BAD_HEADER");
  });

  it("rejects a near-miss header (only first byte matches)", () => {
    const buf = bufferOf([0x25, 0x50, 0x44, 0x47]); // "%PDG"
    const result = validatePdfHeader(buf);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("BAD_HEADER");
  });
});
