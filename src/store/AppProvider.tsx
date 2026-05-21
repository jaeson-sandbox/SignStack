"use client";

import { useMemo, useReducer, type ReactNode } from "react";
import { AppContext } from "./appContext";
import { appReducer, initialState } from "./appReducer";

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
