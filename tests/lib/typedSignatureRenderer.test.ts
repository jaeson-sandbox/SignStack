import { describe, expect, it, vi } from "vitest";
import {
  buildFontSpec,
  computeCanvasHeight,
  computeCanvasWidth,
  renderTypedSignatureToPng,
} from "@/lib/signature/typedSignatureRenderer";

describe("computeCanvasWidth", () => {
  it("adds 16px padding on each side of the text width", () => {
    expect(computeCanvasWidth(100)).toBe(132);
  });

  it("ceils a fractional text width", () => {
    expect(computeCanvasWidth(100.4)).toBe(133);
  });

  it("never returns less than 1 (canvas with width 0 is degenerate)", () => {
    expect(computeCanvasWidth(0)).toBe(32);
    // Even with a paradoxically negative measured width, never < 1.
    expect(computeCanvasWidth(-1000)).toBe(1);
  });
});

describe("computeCanvasHeight", () => {
  it("scales by 1.4 line-height and adds bottom padding", () => {
    // 64px font → ceil(64 * 1.4) + 16 = 90 + 16 = 106.
    expect(computeCanvasHeight(64)).toBe(106);
  });

  it("ceils fractional results", () => {
    // 30px font → ceil(30 * 1.4) + 16 = ceil(42) + 16 = 58.
    expect(computeCanvasHeight(30)).toBe(58);
  });
});

describe("buildFontSpec", () => {
  it("builds the standard `${size}px ${family}` canvas font string", () => {
    expect(buildFontSpec("'Caveat', cursive", 64)).toBe(
      "64px 'Caveat', cursive",
    );
  });
});

describe("renderTypedSignatureToPng", () => {
  // jsdom's CanvasRenderingContext2D has limited rasterization, but it does
  // accept the API calls. We replace document.createElement('canvas') with a
  // controlled fake so we can assert the exact font + fillText calls and
  // return a deterministic data URL.

  interface FakeCtx {
    font: string;
    fillStyle: string;
    textBaseline: string;
    measureText: (text: string) => { width: number };
    fillText: (text: string, x: number, y: number) => void;
    fillTextCalls: Array<[string, number, number]>;
  }

  interface FakeCanvas {
    width: number;
    height: number;
    ctx: FakeCtx;
    toDataURL: (mime: string) => string;
  }

  function installFakeCanvas(): {
    canvas: FakeCanvas;
    restore: () => void;
  } {
    const fillTextCalls: Array<[string, number, number]> = [];
    const ctx: FakeCtx = {
      font: "",
      fillStyle: "",
      textBaseline: "",
      measureText: (text: string) => ({ width: text.length * 10 }),
      fillText: (text: string, x: number, y: number) => {
        fillTextCalls.push([text, x, y]);
      },
      fillTextCalls,
    };
    const canvas: FakeCanvas = {
      width: 0,
      height: 0,
      ctx,
      toDataURL: (mime: string) =>
        `data:${mime};base64,FAKE_${canvas.width}x${canvas.height}`,
    };

    const original = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "canvas") {
          return {
            get width() {
              return canvas.width;
            },
            set width(v: number) {
              canvas.width = v;
            },
            get height() {
              return canvas.height;
            },
            set height(v: number) {
              canvas.height = v;
            },
            getContext: () => ctx,
            toDataURL: (mime: string) => canvas.toDataURL(mime),
          } as unknown as HTMLCanvasElement;
        }
        return original(tag);
      });

    return {
      canvas,
      restore: () => spy.mockRestore(),
    };
  }

  it("returns a PNG data URL after drawing the text in the requested font", () => {
    const { canvas, restore } = installFakeCanvas();

    try {
      const url = renderTypedSignatureToPng({
        text: "Alex",
        fontFamily: "'Caveat', cursive",
        fontSizePx: 64,
        color: "#1E1B4B",
      });

      expect(url.startsWith("data:image/png;base64,")).toBe(true);
      expect(canvas.ctx.font).toBe("64px 'Caveat', cursive");
      expect(canvas.ctx.fillStyle).toBe("#1E1B4B");
      // Text "Alex" → 4 chars × 10 = 40 → width 40+32 = 72.
      expect(canvas.width).toBe(72);
      // 64 × 1.4 = 89.6 → ceil 90, + 16 padding = 106.
      expect(canvas.height).toBe(106);
      // fillText called once with our text at the expected origin.
      expect(canvas.ctx.fillTextCalls).toEqual([["Alex", 16, 72]]);
    } finally {
      restore();
    }
  });

  it("defaults to 64px size and the standard ink color", () => {
    const { canvas, restore } = installFakeCanvas();

    try {
      renderTypedSignatureToPng({
        text: "x",
        fontFamily: "'Dancing Script', cursive",
      });

      expect(canvas.ctx.font).toBe("64px 'Dancing Script', cursive");
      expect(canvas.ctx.fillStyle).toBe("#1E1B4B");
    } finally {
      restore();
    }
  });
});
