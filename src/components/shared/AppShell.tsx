"use client";

import dynamic from "next/dynamic";
import { useAppState } from "@/store/useAppState";
import { UploadZone } from "@/components/upload/UploadZone";
import { DisclaimerBar } from "@/components/shared/DisclaimerBar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";

// PDFScrollArea owns react-pdf + the pdfjs worker config. Dynamic import with
// ssr:false keeps the entire react-pdf module graph (which references browser
// globals like DOMMatrix at module scope) out of Next's prerender pass.
const PDFScrollArea = dynamic(
  () =>
    import("@/components/editor/PDFScrollArea").then((mod) => mod.PDFScrollArea),
  { ssr: false },
);

export function AppShell() {
  const { state } = useAppState();
  const hasDocument = state.document.arrayBuffer !== null;

  if (!hasDocument) {
    return (
      <>
        <UploadZone />
        <DisclaimerBar />
      </>
    );
  }

  return (
    <>
      <EditorToolbar />
      <PDFScrollArea />
      <DisclaimerBar />
    </>
  );
}
