"use client";

import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { AppContext } from "./appContext";
import { appReducer, initialState } from "./appReducer";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    // Dynamic import keeps react-pdf out of the server prerender pass
    // (it references DOMMatrix at module scope). The pdfWorker module's
    // top-level side effect sets pdfjs.GlobalWorkerOptions.workerSrc the
    // first time it evaluates in the browser, before any <Document> mounts.
    // See src/lib/pdf/pdfWorker.ts (resolves R-1, R-6).
    void import("@/lib/pdf/pdfWorker");
  }, []);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
