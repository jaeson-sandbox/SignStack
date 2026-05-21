import type { AppAction, AppState, Overlay } from "@/types";

export const initialState: AppState = {
  document: {
    file: null,
    arrayBuffer: null,
    pageCount: 0,
    pageDimensionsPx: new Map(),
    pageIntrinsicPt: new Map(),
  },
  signature: {
    dataUrl: null,
    type: null,
  },
  overlays: [],
  selectedOverlayId: null,
  currentVisiblePageIndex: null,
  ui: {
    isSignatureModalOpen: false,
    isExporting: false,
    uploadError: null,
    exportError: null,
  },
};

function setMapEntry<V>(map: Map<number, V>, key: number, value: V): Map<number, V> {
  const next = new Map(map);
  next.set(key, value);
  return next;
}

/**
 * Mint a fresh overlay with a UUID id. Call this at the dispatch site
 * so the reducer stays fully deterministic (pure).
 */
export function createOverlay(partial: Omit<Overlay, "id">): Overlay {
  return { id: crypto.randomUUID(), ...partial };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "DOCUMENT_LOADED": {
      const { file, arrayBuffer, pageCount } = action.payload;
      return {
        ...state,
        document: {
          file,
          arrayBuffer,
          pageCount,
          pageDimensionsPx: new Map(),
          pageIntrinsicPt: new Map(),
        },
        overlays: [],
        selectedOverlayId: null,
        currentVisiblePageIndex: null,
        ui: { ...state.ui, uploadError: null },
      };
    }

    case "DOCUMENT_CLEARED": {
      return initialState;
    }

    case "PAGE_DIMENSIONS_SET": {
      const { pageIndex, widthPx, heightPx } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pageDimensionsPx: setMapEntry(state.document.pageDimensionsPx, pageIndex, {
            width: widthPx,
            height: heightPx,
          }),
        },
      };
    }

    case "PAGE_INTRINSIC_SET": {
      const { pageIndex, widthPt, heightPt } = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          pageIntrinsicPt: setMapEntry(state.document.pageIntrinsicPt, pageIndex, {
            width: widthPt,
            height: heightPt,
          }),
        },
      };
    }

    case "SIGNATURE_CREATED": {
      const { dataUrl, type } = action.payload;
      return {
        ...state,
        signature: { dataUrl, type },
      };
    }

    case "SIGNATURE_MODAL_OPEN": {
      return { ...state, ui: { ...state.ui, isSignatureModalOpen: true } };
    }

    case "SIGNATURE_MODAL_CLOSE": {
      return { ...state, ui: { ...state.ui, isSignatureModalOpen: false } };
    }

    case "OVERLAY_ADDED": {
      return { ...state, overlays: [...state.overlays, action.payload] };
    }

    case "OVERLAY_MOVED": {
      const { id, x, y } = action.payload;
      return {
        ...state,
        overlays: state.overlays.map((o) => (o.id === id ? { ...o, x, y } : o)),
      };
    }

    case "OVERLAY_RESIZED": {
      const { id, x, y, width, height } = action.payload;
      return {
        ...state,
        overlays: state.overlays.map((o) =>
          o.id === id ? { ...o, x, y, width, height } : o,
        ),
      };
    }

    case "OVERLAY_DELETED": {
      const { id } = action.payload;
      return {
        ...state,
        overlays: state.overlays.filter((o) => o.id !== id),
        selectedOverlayId: state.selectedOverlayId === id ? null : state.selectedOverlayId,
      };
    }

    case "OVERLAY_SELECTED": {
      return { ...state, selectedOverlayId: action.payload.id };
    }

    case "CURRENT_PAGE_CHANGED": {
      return { ...state, currentVisiblePageIndex: action.payload.pageIndex };
    }

    case "EXPORT_START": {
      return {
        ...state,
        ui: { ...state.ui, isExporting: true, exportError: null },
      };
    }

    case "EXPORT_SUCCESS": {
      return { ...state, ui: { ...state.ui, isExporting: false, exportError: null } };
    }

    case "EXPORT_ERROR": {
      return {
        ...state,
        ui: { ...state.ui, isExporting: false, exportError: action.payload.message },
      };
    }

    case "UPLOAD_ERROR": {
      return {
        ...state,
        ui: { ...state.ui, uploadError: action.payload.message },
      };
    }

    case "UPLOAD_ERROR_CLEAR": {
      return { ...state, ui: { ...state.ui, uploadError: null } };
    }

    default: {
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}
