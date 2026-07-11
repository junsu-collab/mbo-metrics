import { create } from "zustand";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  items: ToastItem[];
  toast: (m: string) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

/** 스택형 토스트. 항목마다 독립적으로 2.4초 후 자동 제거, 수동 닫기도 가능. */
export const useToastStore = create<ToastState>((set) => ({
  items: [],
  toast: (m) => {
    const id = ++seq;
    set((s) => ({ items: [...s.items, { id, message: m }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 2400);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export const toast = (m: string) => useToastStore.getState().toast(m);
