/**
 * Shared font-family constants for typed signatures. Both `TypeTab.tsx`
 * (UI) and `typedSignatureRenderer.ts` (PNG rasterizer) read from these
 * tables so they cannot drift on family names.
 *
 * The CSS family strings are intentionally written as
 * `'Family Name', cursive` — the comma + generic fallback lets the
 * browser render with a sensible fallback while the Google Font is
 * still loading or if the load fails entirely.
 */

export type TypedFontStyle = "clean" | "script" | "formal";

export const TYPED_FONT_STYLES: readonly TypedFontStyle[] = [
  "clean",
  "script",
  "formal",
];

export const TYPED_FONT_FAMILIES: Record<TypedFontStyle, string> = {
  clean: "'Caveat', cursive",
  script: "'Dancing Script', cursive",
  formal: "'Pinyon Script', cursive",
};

export const TYPED_FONT_LABELS: Record<TypedFontStyle, string> = {
  clean: "Clean",
  script: "Script",
  formal: "Formal",
};

/** Default font style on first Type-tab activation (most signature-like). */
export const DEFAULT_TYPED_FONT_STYLE: TypedFontStyle = "script";
