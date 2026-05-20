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
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <p>
          <span className="font-medium">Local only ·</span>{" "}
          SignStack adds visual signatures to PDFs. It does not create
          certificate-based digital signatures.
        </p>
      </div>
    </footer>
  );
}
