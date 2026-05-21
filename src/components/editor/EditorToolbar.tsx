"use client";

import { Plus, Download } from "lucide-react";

export function EditorToolbar() {
  return (
    <header
      className="sticky top-0 z-10 flex h-12 items-center px-6 border-b"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="flex-1 font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        SignStack
      </div>

      <div className="flex flex-1 justify-center">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium opacity-50 cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-surface)",
          }}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add Signature
        </button>
      </div>

      <div className="flex flex-1 justify-end">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium opacity-50 cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "var(--color-surface)",
          }}
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Download Signed PDF
        </button>
      </div>
    </header>
  );
}
