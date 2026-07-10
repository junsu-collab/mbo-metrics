"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/useAppStore";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    useAppStore.persist.rehydrate();
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs text-muted">
        불러오는 중…
      </div>
    );
  }

  return <>{children}</>;
}
