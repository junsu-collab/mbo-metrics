import { create } from "zustand";

export type ModalKind = "settings" | "sim" | "allTasks" | null;

interface UiState {
  modal: ModalKind;
  openModal: (m: ModalKind) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  modal: null,
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),
}));
