"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

export function UploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <section
      className="flex flex-1 items-center justify-center px-6 py-12"
      aria-labelledby="upload-zone-heading"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF — drop a file or click to browse"
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex w-full max-w-xl flex-col items-center justify-center
          gap-4 rounded-lg border-2 border-dashed bg-surface
          px-8 py-16 text-center transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
          ${
            isDragOver
              ? "border-accent bg-overlay-bg"
              : "border-[color:var(--color-border)]"
          }
        `}
        style={{
          backgroundColor: isDragOver
            ? "var(--color-overlay-bg)"
            : "var(--color-surface)",
          borderColor: isDragOver
            ? "var(--color-accent)"
            : "var(--color-border)",
        }}
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
            disabled
            aria-disabled="true"
            className="rounded px-3 py-1.5 font-medium"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-surface)",
              opacity: 0.95,
            }}
          >
            Browse files
          </button>
        </p>

        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          PDF files only · Max 25 MB
        </p>
      </div>
    </section>
  );
}
