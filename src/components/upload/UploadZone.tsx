"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAppState } from "@/store/useAppState";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

type DragState = "idle" | "valid" | "invalid";

function dragValidity(event: React.DragEvent<HTMLDivElement>): DragState {
  const items = event.dataTransfer?.items;
  if (!items || items.length === 0) return "valid";
  // Mark the drag as invalid only when the browser tells us a non-PDF
  // type. Empty type (common cross-OS) is treated as "valid" — the real
  // check runs on drop against file metadata.
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "file") continue;
    if (item.type && item.type !== "application/pdf") {
      return "invalid";
    }
  }
  return "valid";
}

export function UploadZone() {
  const { state, dispatch } = useAppState();
  const { loadFile } = usePdfDocument();
  const [dragState, setDragState] = useState<DragState>("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadError = state.ui.uploadError;
  const showError = uploadError !== null;

  const openPicker = () => fileInputRef.current?.click();

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragState(dragValidity(event));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // dragover fires constantly during a drag; keep state in sync without
    // an unnecessary re-render when validity hasn't changed.
    const next = dragValidity(event);
    if (next !== dragState) setDragState(next);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragState("idle");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragState("idle");
    const file = event.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    // Reset so the same file can be re-selected and re-fire onChange.
    event.target.value = "";
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const borderColor = showError
    ? "var(--color-danger)"
    : dragState === "invalid"
      ? "var(--color-danger)"
      : dragState === "valid"
        ? "var(--color-accent)"
        : "var(--color-border)";

  const backgroundColor =
    showError || dragState === "invalid"
      ? "rgba(220, 38, 38, 0.06)"
      : dragState === "valid"
        ? "var(--color-overlay-bg)"
        : "var(--color-surface)";

  return (
    <section
      className="flex flex-1 items-center justify-center px-6 py-12"
      aria-labelledby="upload-zone-heading"
    >
      <div className="w-full max-w-xl">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a PDF — drop a file or click to browse"
          aria-describedby="upload-constraints"
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex w-full flex-col items-center justify-center
            gap-4 rounded-lg border-2 border-dashed px-8 py-16 text-center
            transition-colors cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{ backgroundColor, borderColor }}
        >
          <Upload
            aria-hidden="true"
            className="h-10 w-10"
            style={{ color: "var(--color-text-muted)" }}
          />

          <h1
            id="upload-zone-heading"
            className="text-lg font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Drop your PDF here
          </h1>

          <p style={{ color: "var(--color-text-muted)" }}>
            or{" "}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openPicker();
              }}
              className="rounded px-3 py-1.5 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-surface)",
              }}
            >
              Browse files
            </button>
          </p>

          <p
            id="upload-constraints"
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            PDF files only · Max 25 MB
          </p>
        </div>

        {/* Inline error below the zone (UX-DR1). Dismissible — clearing it
            returns the zone to its default (non-red) state. The zone stays
            active after an error so the user can retry without a refresh. */}
        {showError && uploadError ? (
          <ErrorBanner
            message={uploadError}
            onDismiss={() => dispatch({ type: "UPLOAD_ERROR_CLEAR" })}
            className="mt-4"
          />
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </section>
  );
}
