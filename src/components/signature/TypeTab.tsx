"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loadSignatureFonts } from "@/lib/signature/fontLoader";
import {
  DEFAULT_TYPED_FONT_STYLE,
  TYPED_FONT_FAMILIES,
  TYPED_FONT_LABELS,
  TYPED_FONT_STYLES,
  type TypedFontStyle,
} from "@/lib/signature/typedFonts";
import { renderTypedSignatureToPng } from "@/lib/signature/typedSignatureRenderer";
import { TypedPreview } from "./TypedPreview";

interface TypeTabProps {
  /** Fired whenever the input transitions between "ready to capture"
   * (non-empty trimmed text) and "not ready". */
  onCanCaptureChange: (canCapture: boolean) => void;
}

/**
 * Imperative handle exposed to SignatureModal so it can capture on
 * confirm without lifting all of TypeTab's local state.
 */
export interface TypeTabHandle {
  /** Returns the rendered PNG data URL, or null if no text. */
  capture(): string | null;
}

export const TypeTab = forwardRef<TypeTabHandle, TypeTabProps>(
  function TypeTab({ onCanCaptureChange }, ref) {
    const [text, setText] = useState("");
    const [fontStyle, setFontStyle] = useState<TypedFontStyle>(
      DEFAULT_TYPED_FONT_STYLE,
    );
    const [fontsReady, setFontsReady] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Kick off the deferred Google Fonts load on first Type-tab mount.
    // The loader is a singleton — second mount during the same session
    // hits the cached resolved promise immediately.
    useEffect(() => {
      let cancelled = false;
      void loadSignatureFonts().then(() => {
        if (!cancelled) setFontsReady(true);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    // Auto-focus the input on tab activation.
    useEffect(() => {
      inputRef.current?.focus();
    }, []);

    // Report capture-readiness up to the modal. canCapture requires
    // both non-empty text AND fonts loaded (avoids a confusing
    // system-font-fallback PNG if the user clicks confirm during load).
    const trimmedLength = text.trim().length;
    useEffect(() => {
      onCanCaptureChange(trimmedLength > 0 && fontsReady);
    }, [trimmedLength, fontsReady, onCanCaptureChange]);

    useImperativeHandle(
      ref,
      () => ({
        capture: () => {
          const trimmed = text.trim();
          if (trimmed.length === 0) return null;
          return renderTypedSignatureToPng({
            text: trimmed,
            fontFamily: TYPED_FONT_FAMILIES[fontStyle],
          });
        },
      }),
      [text, fontStyle],
    );

    const onStyleClick = useCallback((style: TypedFontStyle) => {
      setFontStyle(style);
    }, []);

    return (
      <div
        role="tabpanel"
        id="signature-tabpanel-type"
        aria-labelledby="signature-tab-type"
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Your name
          </span>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Alex Johnson"
            className="rounded border px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
            id="typed-style-label"
          >
            Style
          </span>
          <div
            role="radiogroup"
            aria-labelledby="typed-style-label"
            className="flex gap-2"
          >
            {TYPED_FONT_STYLES.map((style) => (
              <StyleButton
                key={style}
                style={style}
                isActive={fontStyle === style}
                onSelect={onStyleClick}
              />
            ))}
          </div>
        </div>

        <TypedPreview
          text={text}
          fontStyle={fontStyle}
          fontsReady={fontsReady}
        />
      </div>
    );
  },
);

interface StyleButtonProps {
  style: TypedFontStyle;
  isActive: boolean;
  onSelect: (style: TypedFontStyle) => void;
}

function StyleButton({ style, isActive, onSelect }: StyleButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={() => onSelect(style)}
      className="rounded border px-3 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{
        backgroundColor: isActive
          ? "var(--color-accent)"
          : "var(--color-surface)",
        color: isActive
          ? "var(--color-surface)"
          : "var(--color-text-primary)",
        borderColor: isActive
          ? "var(--color-accent)"
          : "var(--color-border)",
      }}
    >
      {TYPED_FONT_LABELS[style]}
    </button>
  );
}
