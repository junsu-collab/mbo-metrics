import { create } from "zustand";

interface ToastState {
  message: string;
  seq: number;
  toast: (m: string) => void;
}

/** vanilla toast()와 동일: 메시지 갱신 시 1.9초간 노출. seq로 동일 메시지 재트리거 보장. */
export const useToastStore = create<ToastState>((set) => ({
  message: "",
  seq: 0,
  toast: (m) => set((s) => ({ message: m, seq: s.seq + 1 })),
}));

export const toast = (m: string) => useToastStore.getState().toast(m);
