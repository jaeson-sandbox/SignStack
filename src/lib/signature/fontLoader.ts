/**
 * Deferred Google Fonts loader for the Type tab (architecture AD-7).
 *
 * Module-level singleton: the first call starts the load; subsequent
 * callers receive the same `Promise<void>` reference. Resolves cleanly
 * on any failure — the preview falls back to system fonts and the user
 * can still complete the flow.
 *
 * Permitted under NFR-PV1: the network request is for font files, not
 * document content. Privacy follow-up to consider: self-hosting these
 * three fonts under `public/fonts/` to remove the third-party hop.
 *
 * This is the ONLY module in the app allowed to touch `document.head`
 * or `document.fonts` for signature fonts.
 */

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Caveat&family=Dancing+Script&family=Pinyon+Script&display=swap";

const FONT_FAMILY_NAMES = ["Caveat", "Dancing Script", "Pinyon Script"];

let cached: Promise<void> | null = null;

export function loadSignatureFonts(): Promise<void> {
  if (cached) return cached;

  cached = new Promise<void>((resolve) => {
    // SSR / non-browser guard. Story 4.4's TypeTab is 'use client', but
    // this is belt-and-suspenders against future callers.
    if (typeof document === "undefined") {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONTS_HREF;

    link.onload = async () => {
      // `display=swap` declares @font-face but defers the binary fetch
      // until the font is actually used. `document.fonts.load(...)` forces
      // the fetch so the preview shows the real font on first paint.
      try {
        await Promise.all(
          FONT_FAMILY_NAMES.map((name) =>
            document.fonts.load(`16px '${name}'`),
          ),
        );
      } catch {
        // Fall through silently — preview will use the cursive fallback.
      }
      resolve();
    };

    link.onerror = () => {
      // Stylesheet failed to load (offline, blocked, etc.). Resolve so
      // the UI can show its loading-complete state with system fonts.
      resolve();
    };

    document.head.appendChild(link);
  });

  return cached;
}
