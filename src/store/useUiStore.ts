import { create } from "zustand";

const LS_KEY = "mbo_ui_prefs";

interface UiPrefs {
  showFormulas: boolean;
}

function readPrefs(): UiPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (raw && typeof raw.showFormulas === "boolean") return raw;
  } catch {
    /* ignore */
  }
  return { showFormulas: false };
}

function writePrefs(prefs: UiPrefs): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

interface UiState extends UiPrefs {
  toggleFormulas: () => void;
}

/** 집계 패널의 W/S 계산 수식 표시 여부. 기본 숨김, 전역 토글로 일괄 전환. */
export const useUiStore = create<UiState>((set, get) => ({
  ...readPrefs(),
  toggleFormulas: () => {
    const next = !get().showFormulas;
    writePrefs({ showFormulas: next });
    set({ showFormulas: next });
  },
}));
