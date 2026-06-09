import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  /** The error text to display. */
  message: string;
  /** When provided, a × dismiss button is shown and calls this on click. */
  onDismiss?: () => void;
  /** Extra classes for positioning/sizing at the call site. */
  className?: string;
}

/**
 * Reusable inline error display (Story 7.1). Presentational only — it takes a
 * message and an optional dismiss handler and owns no state, so the same
 * component serves upload errors, export errors, and PDF-load failures without
 * duplicating the red-banner markup.
 *
 * `role="alert"` gives it an implicit assertive aria-live region, so screen
 * readers announce the message as soon as it appears (NFR-A1 / UX-DR13).
 */
export function ErrorBanner({ message, onDismiss, className }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
        className ?? ""
      }`}
      style={{
        borderColor: "var(--color-danger)",
        backgroundColor: "rgba(220, 38, 38, 0.06)",
        color: "var(--color-danger)",
      }}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1 break-words">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="-mr-1 shrink-0 rounded p-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{ color: "var(--color-danger)" }}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
