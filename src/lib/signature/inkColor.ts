/**
 * Literal hex for the signature ink color. Mirrors --color-ink from
 * `globals.css`. Lives as a literal because the Canvas 2D API silently
 * ignores `var(...)` expressions (the bug from Story 4.3's first pass)
 * — both DrawTab and the typed renderer must pass a real color string.
 *
 * Keep in sync with --color-ink in src/app/globals.css.
 */
export const DEFAULT_INK_HEX = "#1E1B4B";
