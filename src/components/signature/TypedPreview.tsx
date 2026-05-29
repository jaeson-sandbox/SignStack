"use client";

import {
  TYPED_FONT_FAMILIES,
  type TypedFontStyle,
} from "@/lib/signature/typedFonts";

interface TypedPreviewProps {
  text: string;
  fontStyle: TypedFontStyle;
  fontsReady: boolean;
}

const PREVIEW_HEIGHT_PX = 96;
const PREVIEW_FONT_SIZE_PX = 32;

export function TypedPreview({ text, fontStyle, fontsReady }: TypedPreviewProps) {
  const trimmed = text.trim();
  const hasText = trimmed.length > 0;

  const fontFamily = TYPED_FONT_FAMILIES[fontStyle];

  return (
    <div
      aria-live="polite"
      aria-label="Typed signature preview"
      className="mt-3 flex items-center justify-center rounded-md border px-4"
      style={{
        height: PREVIEW_HEIGHT_PX,
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        fontFamily,
        fontSize: PREVIEW_FONT_SIZE_PX,
        color: hasText
          ? "var(--color-ink)"
          : "var(--color-text-muted)",
        overflow: "hidden",
      }}
    >
      {!fontsReady ? (
        <span
          className="text-sm"
          style={{
            fontFamily: "var(--font-ui)",
            color: "var(--color-text-muted)",
          }}
        >
          Loading fonts…
        </span>
      ) : hasText ? (
        trimmed
      ) : (
        <span style={{ fontFamily }}>Preview</span>
      )}
    </div>
  );
}
