import { create } from "zustand";

interface ToastState {
  message: string;
  visible: boolean;
  show: (message: string) => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  message: "",
  visible: false,
  show: (message) => {
    set({ message, visible: true });
    clearTimeout(timer);
    timer = setTimeout(() => set({ visible: false }), 1900);
  },
}));

export function toast(message: string) {
  useToastStore.getState().show(message);
}
