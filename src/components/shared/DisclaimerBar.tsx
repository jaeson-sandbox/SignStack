import { Lock } from "lucide-react";

export function DisclaimerBar() {
  return (
    <footer
      role="contentinfo"
      className="w-full border-t px-6 py-3"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-muted)",
        fontSize: "var(--font-size-xs)",
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
        <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <p>
          <span className="font-medium">Private by design ·</span>{" "}
          Your PDF is opened, signed, and exported entirely in your browser —
          it is never uploaded to a server or stored anywhere. SignStack adds
          visual signatures, not certificate-based digital signatures.
        </p>
      </div>
    </footer>
  );
}
