import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UploadZone } from "@/components/upload/UploadZone";
import { AppProvider } from "@/store/AppProvider";

function renderUploadZone() {
  return render(
    <AppProvider>
      <UploadZone />
    </AppProvider>,
  );
}

function getHiddenFileInput(): HTMLInputElement {
  // The input is hidden (className "hidden") and not exposed via role,
  // so query by type. There is exactly one file input on the page.
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement | null;
  if (!input) throw new Error("file input not found");
  return input;
}

async function selectFileViaPicker(file: File) {
  const input = getHiddenFileInput();
  // Drive the change directly — fireEvent.change handles writing files
  // to the FileList for type=file inputs in jsdom.
  fireEvent.change(input, { target: { files: [file] } });
}

describe("<UploadZone /> — upload validation wiring", () => {
  it("renders the default copy", () => {
    renderUploadZone();
    expect(screen.getByText("Drop your PDF here")).toBeInTheDocument();
    expect(screen.getByText("PDF files only · Max 25 MB")).toBeInTheDocument();
  });

  it("shows an inline error when a non-PDF is selected", async () => {
    renderUploadZone();
    const docx = new File(["not a pdf"], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    await selectFileViaPicker(docx);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "This file is not a PDF. Please select a PDF file.",
    );
    // The error now appears in a dismissible banner below the zone (UX-DR1);
    // the empty-state helper text stays visible.
    expect(
      screen.getByText("PDF files only · Max 25 MB"),
    ).toBeInTheDocument();
  });

  it("shows an inline error when the file lacks a %PDF header", async () => {
    renderUploadZone();
    // .pdf name + application/pdf MIME, but the bytes are nonsense — the
    // header check rejects it after the ArrayBuffer is read.
    const fake = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00])], "fake.pdf", {
      type: "application/pdf",
    });
    await selectFileViaPicker(fake);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "This file could not be read as a PDF. It may be corrupt or mislabeled.",
    );
  });

  it("clears the error when a subsequent valid PDF is selected", async () => {
    renderUploadZone();

    // First: bad file -> error appears.
    const bad = new File(["x"], "bad.docx", { type: "text/plain" });
    await selectFileViaPicker(bad);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    // Then: a valid PDF -> error clears, helper text returns.
    const validBytes = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37,
    ]);
    const valid = new File([validBytes], "valid.pdf", {
      type: "application/pdf",
    });
    await selectFileViaPicker(valid);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByText("PDF files only · Max 25 MB")).toBeInTheDocument();
  });

  it("dismissing the error banner clears it and keeps the zone active", async () => {
    renderUploadZone();
    const bad = new File(["x"], "bad.txt", { type: "text/plain" });
    await selectFileViaPicker(bad);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss error/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    // Zone stays active for retry: the drop target and helper remain.
    expect(screen.getByText("Drop your PDF here")).toBeInTheDocument();
    expect(screen.getByText("PDF files only · Max 25 MB")).toBeInTheDocument();
  });
});
