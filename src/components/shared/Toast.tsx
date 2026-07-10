"use client";

import { useToastStore } from "@/store/useToastStore";

export function Toast() {
  const { message, visible } = useToastStore();
  return (
    <div
      className={`fixed bottom-7 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white shadow-[0_4px_20px_rgba(0,0,0,.28)] transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } pointer-events-none`}
    >
      {message}
    </div>
  );
}
