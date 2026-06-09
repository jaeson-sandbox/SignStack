import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DisclaimerBar } from "@/components/shared/DisclaimerBar";

afterEach(() => cleanup());

describe("<DisclaimerBar />", () => {
  it("is a contentinfo landmark so screen readers announce it in page structure (AC3)", () => {
    render(<DisclaimerBar />);
    // <footer role="contentinfo"> — exposed as the contentinfo landmark.
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("states the privacy guarantee in plain language (local-first, no upload)", () => {
    render(<DisclaimerBar />);
    const bar = screen.getByRole("contentinfo");
    expect(bar).toHaveTextContent(/entirely in your browser/i);
    expect(bar).toHaveTextContent(/never uploaded to a server/i);
  });

  it("keeps the FR-21 visual-vs-cryptographic legal disclaimer", () => {
    render(<DisclaimerBar />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /visual signatures, not certificate-based digital signatures/i,
    );
  });
});
