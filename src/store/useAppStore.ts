import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";
import type { AppState, MboItem, CoefItem, MemberData, Settings, Task, YearData } from "../types";
import { defaults } from "../lib/defaults";
import { migrateMember, migrateSettings, migrateYears } from "../lib/migrate";
import { clone } from "../lib/utils";

const LS_KEY = "mbo_metrics_v1_0";

interface Actions {
  setCurrentMember: (name: string | null) => void;
  addMember: (name: string) => void;
  deleteMember: (name: string) => void;
  addTask: (task: Task) => void;
  deleteTask: (memberName: string, index: number) => void;
  updateTaskCoef: (memberName: string, uid: string, patch: { difficultyId?: string; reportId?: string }) => void;
  setTaskPRatio: (memberName: string, mboId: string, uid: string, value: number) => void;
  setCategoryScore: (memberName: string, mboId: string, key: "leader" | "member", value: number | null) => void;
  setCategoryPts: (memberName: string, mboId: string, value: number) => void;
  updateSettings: (settings: Settings) => void;
  applySim: (difficulty: CoefItem[], report: CoefItem[], wLeader: number) => void;
  setGutOrder: (order: string[]) => void;
  addYear: (year: string) => void;
  switchYear: (year: string) => void;
  importMember: (member: MemberData) => void;
  importAll: (blob: { years: Record<string, YearData>; currentYear?: string | null }) => void;
}

type Store = AppState & Actions;

function newYearData(set?: Settings): YearData {
  return { members: {}, current: null, settings: set || defaults(), gutOrder: [] };
}

function cur(s: AppState): YearData | undefined {
  return s.currentYear ? s.years[s.currentYear] : undefined;
}

/** 현재 연도에 선택 팀원이 없으면 첫 팀원으로 보정 (vanilla applyYearContext). */
function ensureCurrent(yd: YearData | undefined): void {
  if (!yd) return;
  if (!yd.current || !yd.members[yd.current]) {
    const names = Object.keys(yd.members);
    yd.current = names.length ? names[0] : null;
  }
}

// ── localStorage: vanilla와 동일한 raw {years,currentYear} 형식으로 저장/복원 ──
function readInitial(): AppState {
  const thisYear = String(new Date().getFullYear());
  let raw: unknown = null;
  try {
    raw = JSON.parse(localStorage.getItem(LS_KEY) || "null");
  } catch {
    raw = null;
  }

  let years: Record<string, YearData> = {};
  let currentYear: string | null = null;

  const r = raw as { years?: Record<string, YearData>; currentYear?: string | null; state?: AppState } | null;
  if (r && r.years && Object.keys(r.years).length) {
    years = r.years;
    currentYear = r.currentYear || Object.keys(r.years)[0];
  } else if (r && r.state && r.state.years && Object.keys(r.state.years).length) {
    // 혹시 zustand 래핑 형식으로 저장된 경우도 복원
    years = r.state.years;
    currentYear = r.state.currentYear || Object.keys(r.state.years)[0];
  } else {
    // 구버전(v2/v1)에서 마이그레이션 → 올해 평가로 편입
    let mig: { members?: Record<string, MemberData>; current?: string | null; settings?: Settings; gutOrder?: string[] } | null = null;
    try {
      mig = JSON.parse(localStorage.getItem("mbo_metrics_v2") || "null");
    } catch {
      mig = null;
    }
    if (!(mig && mig.members)) {
      try {
        const v1 = JSON.parse(localStorage.getItem("mbo_metrics_v1") || "null");
        if (v1 && v1.members) mig = { members: v1.members };
      } catch {
        /* ignore */
      }
    }
    years = {};
    years[thisYear] =
      mig && mig.members
        ? { members: mig.members, current: mig.current || null, settings: mig.settings || defaults(), gutOrder: mig.gutOrder || [] }
        : newYearData();
    currentYear = thisYear;
  }

  migrateYears(years);
  if (!currentYear || !years[currentYear]) currentYear = Object.keys(years)[0] || null;
  ensureCurrent(cur({ years, currentYear }));
  return { years, currentYear };
}

/** raw {years,currentYear} 형식을 유지하는 커스텀 storage. */
const rawStorage: PersistStorage<AppState> = {
  getItem: (): StorageValue<AppState> => ({ state: readInitial(), version: 0 }),
  setItem: (_name, value: StorageValue<AppState>) => {
    const { years, currentYear } = value.state;
    localStorage.setItem(LS_KEY, JSON.stringify({ years, currentYear }));
  },
  removeItem: () => localStorage.removeItem(LS_KEY),
};

export const useAppStore = create<Store>()(
  persist(
    immer((set) => ({
      years: {},
      currentYear: null,

      setCurrentMember: (name) =>
        set((s) => {
          const yd = cur(s);
          if (yd) yd.current = name || null;
        }),

      addMember: (name) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          if (!yd.members[name])
            yd.members[name] = { name, tasks: [], categoryScores: {}, taskPRatios: {}, categoryPts: {} };
          yd.current = name;
        }),

      deleteMember: (name) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          delete yd.members[name];
          const names = Object.keys(yd.members);
          yd.current = names.length ? names[0] : null;
        }),

      addTask: (task) =>
        set((s) => {
          const yd = cur(s);
          if (!yd || !yd.current) return;
          const m = yd.members[yd.current];
          if (m) m.tasks.push(task);
        }),

      deleteTask: (memberName, index) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          const m = yd.members[memberName];
          if (!m) return;
          const t = m.tasks[index];
          if (t && t.uid) Object.values(m.taskPRatios).forEach((wmap) => delete wmap[t.uid]);
          m.tasks.splice(index, 1);
        }),

      updateTaskCoef: (memberName, uid, patch) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          const m = yd.members[memberName];
          if (!m) return;
          const t = m.tasks.find((x) => x.uid === uid);
          if (!t) return;
          if (patch.difficultyId) {
            const d = yd.settings.difficulty.find((x) => x.id === patch.difficultyId);
            if (d) {
              t.difficultyId = d.id;
              t.difficultyLabelSnap = d.label;
              t.difficultyCoefSnap = d.coef;
            }
          }
          if (patch.reportId) {
            const rp = yd.settings.report.find((x) => x.id === patch.reportId);
            if (rp) {
              t.reportId = rp.id;
              t.reportLabelSnap = rp.label;
              t.reportCoefSnap = rp.coef;
            }
          }
        }),

      setTaskPRatio: (memberName, mboId, uid, value) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          const m = yd.members[memberName];
          if (!m) return;
          if (!m.taskPRatios[mboId]) m.taskPRatios[mboId] = {};
          m.taskPRatios[mboId][uid] = value;
        }),

      setCategoryScore: (memberName, mboId, key, value) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          const m = yd.members[memberName];
          if (!m) return;
          if (!m.categoryScores[mboId]) m.categoryScores[mboId] = { leader: null, member: null };
          m.categoryScores[mboId][key] = value;
        }),

      setCategoryPts: (memberName, mboId, value) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          const m = yd.members[memberName];
          if (!m) return;
          m.categoryPts[mboId] = value;
        }),

      updateSettings: (settings) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          migrateSettings(settings);
          yd.settings = settings;
        }),

      applySim: (difficulty, report, wLeader) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          yd.settings.difficulty = difficulty.map((x) => ({ ...x }));
          yd.settings.report = report.map((x) => ({ ...x }));
          yd.settings.defaultWLeader = wLeader;
          yd.settings.defaultWMember = 100 - wLeader;
        }),

      setGutOrder: (order) =>
        set((s) => {
          const yd = cur(s);
          if (yd) yd.gutOrder = order.slice();
        }),

      addYear: (year) =>
        set((s) => {
          if (s.years[year]) {
            s.currentYear = year;
            ensureCurrent(s.years[year]);
            return;
          }
          const years = Object.keys(s.years).sort((a, b) => +b - +a);
          const latest = years[0];
          const inherit = latest ? clone(s.years[latest].settings) : defaults();
          s.years[year] = newYearData(inherit);
          s.currentYear = year;
        }),

      switchYear: (year) =>
        set((s) => {
          if (!s.years[year]) return;
          s.currentYear = year;
          ensureCurrent(s.years[year]);
        }),

      importMember: (member) =>
        set((s) => {
          const yd = cur(s);
          if (!yd) return;
          migrateMember(member);
          if (!member.categoryScores) member.categoryScores = {};
          yd.members[member.name] = member;
          yd.current = member.name;
        }),

      importAll: (blob) =>
        set((s) => {
          const years = blob.years;
          migrateYears(years);
          s.years = years;
          s.currentYear = blob.currentYear && years[blob.currentYear] ? blob.currentYear : Object.keys(years).sort((a, b) => +b - +a)[0];
          ensureCurrent(cur(s));
        }),
    })),
    {
      name: LS_KEY,
      storage: rawStorage,
      partialize: (s) => ({ years: s.years, currentYear: s.currentYear }) as AppState,
    }
  )
);

// ── 파생 상태 selector 훅 ──
const EMPTY_MEMBERS: Record<string, MemberData> = {};

export const useCurrentYearData = (): YearData | undefined =>
  useAppStore((s) => (s.currentYear ? s.years[s.currentYear] : undefined));

export const useSettings = (): Settings =>
  useAppStore((s) => (s.currentYear ? s.years[s.currentYear]?.settings : undefined) ?? DEFAULT_SETTINGS);

export const useMembers = (): Record<string, MemberData> =>
  useAppStore((s) => (s.currentYear ? s.years[s.currentYear]?.members : undefined) ?? EMPTY_MEMBERS);

export const useCurrentMemberName = (): string | null =>
  useAppStore((s) => (s.currentYear ? s.years[s.currentYear]?.current ?? null : null));

export const useGutOrder = (): string[] =>
  useAppStore(useShallow((s) => (s.currentYear ? s.years[s.currentYear]?.gutOrder ?? [] : [])));

export const useYearKeys = (): string[] => useAppStore(useShallow((s) => Object.keys(s.years)));

export const useCurrentYear = (): string | null => useAppStore((s) => s.currentYear);

const DEFAULT_SETTINGS: Settings = defaults();

// 컴포넌트 밖에서 스냅샷이 필요할 때
export function snapshot(): AppState {
  const s = useAppStore.getState();
  return { years: s.years, currentYear: s.currentYear };
}

export type { MboItem };
