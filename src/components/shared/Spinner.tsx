import { Loader2 } from "lucide-react";

interface SpinnerProps {
  /** Visible, screen-reader-announced status text (loading is never purely
   *  visual — the label is part of the role="status" live region). */
  label: string;
  /** Extra classes for layout at the call site. */
  className?: string;
}

/**
 * Reusable loading indicator (Story 7.1). Presentational only.
 *
 * `role="status"` makes it a polite live region; the visible `label` is read
 * by screen readers when it appears, so loading state is conveyed without
 * relying on the spinning glyph alone (NFR-A1).
 */
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 ${
        className ?? ""
      }`}
    >
      <Loader2
        aria-hidden="true"
        className="h-6 w-6 animate-spin"
        style={{ color: "var(--color-text-muted)" }}
      />
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
