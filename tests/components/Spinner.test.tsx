import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Spinner } from "@/components/shared/Spinner";

afterEach(() => cleanup());

describe("<Spinner />", () => {
  it("exposes a status role so the loading state is announced", () => {
    render(<Spinner label="Loading your PDF…" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the label as visible text (loading is not purely visual)", () => {
    render(<Spinner label="Loading your PDF…" />);
    expect(screen.getByText("Loading your PDF…")).toBeInTheDocument();
  });

  it("forwards className for layout at the call site", () => {
    render(<Spinner label="Loading…" className="my-layout" />);
    expect(screen.getByRole("status").className).toContain("my-layout");
  });
});
