"use client";

import { AppProvider } from "@/context/AppState";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
