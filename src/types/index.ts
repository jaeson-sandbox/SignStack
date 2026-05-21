export interface DocumentState {
  file: File | null;
  arrayBuffer: ArrayBuffer | null;
  pageCount: number;
  /** 0-based page index → rendered pixel dimensions */
  pageDimensionsPx: Map<number, { width: number; height: number }>;
  /** 0-based page index → PDF intrinsic point dimensions */
  pageIntrinsicPt: Map<number, { width: number; height: number }>;
}

export interface SignatureState {
  dataUrl: string | null;
  type: "drawn" | "typed" | null;
}

export interface Overlay {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UIState {
  isSignatureModalOpen: boolean;
  isExporting: boolean;
  uploadError: string | null;
  exportError: string | null;
}

export interface AppState {
  document: DocumentState;
  signature: SignatureState;
  overlays: Overlay[];
  selectedOverlayId: string | null;
  /** 0-based index of the page with the largest viewport intersection ratio. */
  currentVisiblePageIndex: number | null;
  ui: UIState;
}

export type AppAction =
  | {
      type: "DOCUMENT_LOADED";
      payload: { file: File; arrayBuffer: ArrayBuffer; pageCount: number };
    }
  | { type: "DOCUMENT_CLEARED" }
  | {
      type: "PAGE_DIMENSIONS_SET";
      payload: { pageIndex: number; widthPx: number; heightPx: number };
    }
  | {
      type: "PAGE_INTRINSIC_SET";
      payload: { pageIndex: number; widthPt: number; heightPt: number };
    }
  | {
      type: "SIGNATURE_CREATED";
      payload: { dataUrl: string; type: "drawn" | "typed" };
    }
  | { type: "SIGNATURE_MODAL_OPEN" }
  | { type: "SIGNATURE_MODAL_CLOSE" }
  | { type: "OVERLAY_ADDED"; payload: Overlay }
  | { type: "OVERLAY_MOVED"; payload: { id: string; x: number; y: number } }
  | {
      type: "OVERLAY_RESIZED";
      payload: { id: string; x: number; y: number; width: number; height: number };
    }
  | { type: "OVERLAY_DELETED"; payload: { id: string } }
  | { type: "OVERLAY_SELECTED"; payload: { id: string | null } }
  | { type: "CURRENT_PAGE_CHANGED"; payload: { pageIndex: number | null } }
  | { type: "EXPORT_START" }
  | { type: "EXPORT_SUCCESS" }
  | { type: "EXPORT_ERROR"; payload: { message: string } }
  | { type: "UPLOAD_ERROR"; payload: { message: string } }
  | { type: "UPLOAD_ERROR_CLEAR" };
