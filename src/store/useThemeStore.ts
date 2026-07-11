import { create } from "zustand";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

/** 테마 상태. 실제 소스는 html.dark 클래스 + localStorage. */
export const useThemeStore = create<ThemeState>((set) => ({
  theme: currentTheme(),
  toggle: () =>
    set(() => {
      const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("mbo_theme", next);
      } catch {
        /* ignore */
      }
      return { theme: next };
    }),
}));
