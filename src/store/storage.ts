import type { PersistStorage } from "zustand/middleware";

import { defaults } from "@/lib/defaults";
import { migrateAll, migrateYearData } from "@/lib/migrate";
import type { PersistedState, Settings, YearData } from "@/types";

function newYearData(set?: Settings): YearData {
  return { members: {}, current: null, settings: set ?? defaults(), gutOrder: [] };
}

interface LegacyMember {
  members?: Record<string, YearData["members"][string]>;
  current?: string | null;
  settings?: Settings;
  gutOrder?: string[];
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * localStorage(name)에서 상태를 읽는다. 기존 v1.0 HTML 앱이 쓴 원시 JSON
 * ({years, currentYear}, 조피 envelope 없음)을 그대로 읽을 수 있도록
 * 구버전 마이그레이션 경로를 그대로 이식했다.
 */
function loadState(name: string): PersistedState {
  const raw = safeParse<PersistedState>(localStorage.getItem(name));
  const thisYear = String(new Date().getFullYear());
  let state: PersistedState;

  if (raw && raw.years && Object.keys(raw.years).length) {
    state = { years: raw.years, currentYear: raw.currentYear || Object.keys(raw.years)[0] };
  } else {
    let mig: LegacyMember | null = safeParse<LegacyMember>(localStorage.getItem("mbo_metrics_v2"));
    if (!(mig && mig.members)) {
      const v1 = safeParse<LegacyMember>(localStorage.getItem("mbo_metrics_v1"));
      if (v1 && v1.members) mig = { members: v1.members };
    }
    const years: Record<string, YearData> = {};
    years[thisYear] =
      mig && mig.members
        ? {
            members: mig.members,
            current: mig.current ?? null,
            settings: mig.settings ?? defaults(),
            gutOrder: mig.gutOrder ?? [],
          }
        : newYearData();
    state = { years, currentYear: thisYear };
  }

  Object.values(state.years).forEach((yd) => migrateYearData(yd));
  migrateAll(state.years);
  return state;
}

export function createLegacyCompatStorage(): PersistStorage<PersistedState> {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return { state: loadState(name), version: 0 };
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(name, JSON.stringify(value.state));
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    },
  };
}

export const LS_KEY = "mbo_metrics_v1_0";
export { newYearData };
