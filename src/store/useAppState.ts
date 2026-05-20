"use client";

import { useContext } from "react";
import { AppContext, type AppContextValue } from "./appContext";

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error("useAppState must be used within an <AppProvider>");
  }
  return ctx;
}
