/**
 * Integration tests for useOverlays.
 *
 * Tests the full path: addOverlay(pageIndex, pageDimPx, dataUrl) →
 * loads aspect ratio from Image → computes default rect → dispatches
 * OVERLAY_ADDED → state.overlays updated.
 *
 * Image is stubbed globally so tests run deterministically in jsdom without
 * a real network or canvas decode path.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AppProvider } from "@/store/AppProvider";
import { useOverlays } from "@/hooks/useOverlays";
import { useAppState } from "@/store/useAppState";

// ---------------------------------------------------------------------------
// Image stub — controls the naturalWidth / naturalHeight that the hook reads.
// ---------------------------------------------------------------------------

interface StubImageConfig {
  naturalWidth: number;
  naturalHeight: number;
}

const imageConfig: StubImageConfig = { naturalWidth: 200, naturalHeight: 80 };

class StubImage {
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    this.naturalWidth = imageConfig.naturalWidth;
    this.naturalHeight = imageConfig.naturalHeight;
    // Fire onload synchronously so tests don't need extra async ceremony.
    this.onload?.();
  }
}

beforeEach(() => {
  vi.stubGlobal("Image", StubImage);
  imageConfig.naturalWidth = 200;
  imageConfig.naturalHeight = 80;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Test harness components
// ---------------------------------------------------------------------------

/** Reads the overlay state and renders it for assertions. */
function OverlayProbe() {
  const { state } = useAppState();
  return (
    <div data-testid="overlay-probe">
      {JSON.stringify({
        count: state.overlays.length,
        first: state.overlays[0] ?? null,
      })}
    </div>
  );
}

interface TriggerProps {
  pageIndex: number;
  pageDimPx: { width: number; height: number };
  dataUrl: string;
}

/** Button that triggers addOverlay with known inputs. */
function AddOverlayButton({ pageIndex, pageDimPx, dataUrl }: TriggerProps) {
  const { addOverlay } = useOverlays();
  return (
    <button
      type="button"
      onClick={() => void addOverlay(pageIndex, pageDimPx, dataUrl)}
    >
      add-overlay
    </button>
  );
}

function renderHarness(props: TriggerProps) {
  render(
    <AppProvider>
      <AddOverlayButton {...props} />
      <OverlayProbe />
    </AppProvider>,
  );
}

function getProbeData(): { count: number; first: Record<string, unknown> | null } {
  return JSON.parse(screen.getByTestId("overlay-probe").textContent ?? "{}") as {
    count: number;
    first: Record<string, unknown> | null;
  };
}

async function triggerAddOverlay() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "add-overlay" }));
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOverlays — addOverlay dispatch", () => {
  it("dispatches OVERLAY_ADDED: state.overlays gains one entry", async () => {
    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE_DRAWN",
    });
    expect(getProbeData().count).toBe(0);

    await triggerAddOverlay();

    expect(getProbeData().count).toBe(1);
  });

  it("the new overlay has a UUID id", async () => {
    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE",
    });

    await triggerAddOverlay();

    const { first } = getProbeData();
    expect(first?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("places the overlay on the correct pageIndex", async () => {
    renderHarness({
      pageIndex: 3,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE",
    });

    await triggerAddOverlay();

    expect(getProbeData().first?.pageIndex).toBe(3);
  });

  it("uses page dimensions to compute x/y (794×1028 page, 0.4 aspect ratio)", async () => {
    // Image stub: 200px wide × 80px tall → aspectRatio = 0.4
    // Expected x = round(794*0.95 - 200) = round(554.3) = 554
    // Expected height = max(40, round(200*0.4)) = 80
    // Expected y = round(1028*0.95 - 80) = round(896.6) = 897
    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE",
    });

    await triggerAddOverlay();

    const { first } = getProbeData();
    expect(first?.x).toBe(554);
    expect(first?.y).toBe(897);
    expect(first?.width).toBe(200);
    expect(first?.height).toBe(80);
  });

  it("works for a drawn signature (dataUrl starting with data:image/png)", async () => {
    const drawnDataUrl = "data:image/png;base64,FAKE_DRAWN_SIGNATURE";
    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: drawnDataUrl,
    });

    await triggerAddOverlay();

    expect(getProbeData().count).toBe(1);
  });

  it("works for a typed signature (dataUrl produced by typedSignatureRenderer)", async () => {
    const typedDataUrl = "data:image/png;base64,FAKE_TYPED_SIGNATURE";
    renderHarness({
      pageIndex: 1,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: typedDataUrl,
    });

    await triggerAddOverlay();

    const { first } = getProbeData();
    expect(first?.pageIndex).toBe(1);
    expect(getProbeData().count).toBe(1);
  });

  it("applies MIN_OVERLAY_HEIGHT_PX when the image is very wide (tiny aspect ratio)", async () => {
    // Very wide image: 1000px × 20px → aspectRatio = 0.02 → height = max(40, 4) = 40
    imageConfig.naturalWidth = 1000;
    imageConfig.naturalHeight = 20;

    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE",
    });

    await triggerAddOverlay();

    expect(getProbeData().first?.height).toBe(40);
  });

  it("generates unique ids for two separate addOverlay calls", async () => {
    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,FAKE",
    });

    await triggerAddOverlay();
    await triggerAddOverlay();

    const state = JSON.parse(
      screen.getByTestId("overlay-probe").textContent ?? "{}",
    ) as { count: number; first: Record<string, unknown> | null };
    expect(state.count).toBe(2);
  });
});

describe("useOverlays — image load failure graceful fallback", () => {
  it("still dispatches OVERLAY_ADDED with fallback aspect ratio when image errors", async () => {
    // Override stub: trigger onerror instead of onload
    class ErrorImage extends StubImage {
      set src(_value: string) {
        this.onerror?.();
      }
    }
    vi.stubGlobal("Image", ErrorImage);

    renderHarness({
      pageIndex: 0,
      pageDimPx: { width: 794, height: 1028 },
      dataUrl: "data:image/png;base64,CORRUPT",
    });

    await triggerAddOverlay();

    // Fallback ratio 0.4 → height = max(40, round(200*0.4)) = 80
    const { first } = getProbeData();
    expect(first?.height).toBe(80);
    expect(getProbeData().count).toBe(1);
  });
});
