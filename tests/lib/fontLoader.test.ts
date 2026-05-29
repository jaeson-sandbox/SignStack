import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface FakeLink {
  rel: string;
  href: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

interface Harness {
  createdLinks: FakeLink[];
  appendedNodes: FakeLink[];
  setFontsLoadBehavior: (impl: () => Promise<unknown>) => void;
}

function installHarness(): Harness {
  const createdLinks: FakeLink[] = [];
  const appendedNodes: FakeLink[] = [];
  let fontsLoad: () => Promise<unknown> = () => Promise.resolve();

  const original = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "link") {
      const link: FakeLink = {
        rel: "",
        href: "",
        onload: null,
        onerror: null,
      };
      createdLinks.push(link);
      return link as unknown as HTMLLinkElement;
    }
    return original(tag);
  });

  vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
    appendedNodes.push(node as unknown as FakeLink);
    return node;
  });

  // jsdom does not implement document.fonts; install a tiny stub.
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      load: (font: string) => fontsLoad().then(() => [font]),
    },
  });

  return {
    createdLinks,
    appendedNodes,
    setFontsLoadBehavior: (impl) => {
      fontsLoad = impl;
    },
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadSignatureFonts — singleton + happy path", () => {
  it("calls twice and returns the same promise reference (idempotent)", async () => {
    installHarness();
    const { loadSignatureFonts } = await import("@/lib/signature/fontLoader");

    const p1 = loadSignatureFonts();
    const p2 = loadSignatureFonts();

    expect(p1).toBe(p2);
  });

  it("appends one <link> with rel=stylesheet pointing at Google Fonts", async () => {
    const harness = installHarness();
    const { loadSignatureFonts } = await import("@/lib/signature/fontLoader");

    loadSignatureFonts();

    expect(harness.createdLinks).toHaveLength(1);
    expect(harness.createdLinks[0].rel).toBe("stylesheet");
    expect(harness.createdLinks[0].href).toContain("fonts.googleapis.com");
    expect(harness.createdLinks[0].href).toContain("Caveat");
    expect(harness.createdLinks[0].href).toContain("Dancing+Script");
    expect(harness.createdLinks[0].href).toContain("Pinyon+Script");
    expect(harness.appendedNodes).toHaveLength(1);
  });

  it("resolves after link.onload fires AND document.fonts.load resolves", async () => {
    const harness = installHarness();
    const { loadSignatureFonts } = await import("@/lib/signature/fontLoader");

    const promise = loadSignatureFonts();
    // Trigger the load callback.
    harness.createdLinks[0].onload?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves cleanly when link.onerror fires (graceful degradation)", async () => {
    const harness = installHarness();
    const { loadSignatureFonts } = await import("@/lib/signature/fontLoader");

    const promise = loadSignatureFonts();
    harness.createdLinks[0].onerror?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves even if document.fonts.load rejects (silent fallback)", async () => {
    const harness = installHarness();
    harness.setFontsLoadBehavior(() => Promise.reject(new Error("nope")));
    const { loadSignatureFonts } = await import("@/lib/signature/fontLoader");

    const promise = loadSignatureFonts();
    harness.createdLinks[0].onload?.();

    await expect(promise).resolves.toBeUndefined();
  });
});
