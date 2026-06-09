import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

afterEach(() => cleanup());

describe("<ErrorBanner />", () => {
  it("renders the message inside an alert region", () => {
    render(<ErrorBanner message="Something went wrong." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong.");
  });

  it("is an assertive, atomic live region so screen readers announce it (Story 7.2)", () => {
    render(<ErrorBanner message="Announce me." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("aria-atomic", "true");
  });

  it("renders no dismiss button when onDismiss is omitted", () => {
    render(<ErrorBanner message="No dismiss here." />);
    expect(
      screen.queryByRole("button", { name: /dismiss error/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a dismiss button that calls onDismiss when clicked", () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Dismiss me." onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss error/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("forwards className for positioning at the call site", () => {
    render(
      <ErrorBanner message="Positioned." className="absolute custom-pos" />,
    );
    expect(screen.getByRole("alert").className).toContain("custom-pos");
  });
});
