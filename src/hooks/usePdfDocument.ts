"use client";

import { useCallback } from "react";
import { useAppState } from "@/store/useAppState";
import {
  validateFileMetadata,
  validatePdfHeader,
} from "@/lib/pdf/pdfValidator";

const READ_FAILED_MESSAGE =
  "This file could not be read. Please try again or choose a different file.";

export interface UsePdfDocument {
  loadFile: (file: File) => Promise<void>;
}

export function usePdfDocument(): UsePdfDocument {
  const { dispatch } = useAppState();

  const loadFile = useCallback(
    async (file: File) => {
      const metadata = validateFileMetadata(file);
      if (!metadata.ok) {
        dispatch({
          type: "UPLOAD_ERROR",
          payload: { message: metadata.message },
        });
        return;
      }

      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer();
      } catch {
        dispatch({
          type: "UPLOAD_ERROR",
          payload: { message: READ_FAILED_MESSAGE },
        });
        return;
      }

      const header = validatePdfHeader(arrayBuffer);
      if (!header.ok) {
        dispatch({
          type: "UPLOAD_ERROR",
          payload: { message: header.message },
        });
        return;
      }

      // Page count is a placeholder until rendering (Story 3.x) determines
      // the real count. DOCUMENT_LOADED also clears uploadError.
      dispatch({
        type: "DOCUMENT_LOADED",
        payload: { file, arrayBuffer, pageCount: 0 },
      });
    },
    [dispatch],
  );

  return { loadFile };
}
