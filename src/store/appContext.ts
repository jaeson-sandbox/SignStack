"use client";

import { createContext } from "react";
import type { AppAction, AppState } from "@/types";

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue | null>(null);
