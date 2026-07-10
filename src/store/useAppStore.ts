import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { clone } from "@/lib/calc";
import { defaults, uid } from "@/lib/defaults";
import { migrateMember, migrateSettings } from "@/lib/migrate";
import { createLegacyCompatStorage, LS_KEY, newYearData } from "@/store/storage";
import type {
  AllBackup,
  MemberData,
  PersistedState,
  Settings,
  Task,
  YearData,
} from "@/types";

interface AppActions {
  hydrate: () => void;

  addMember: (name: string) => void;
  deleteMember: (name: string) => void;
  switchMember: (name: string) => void;

  addTask: (task: Omit<Task, "uid">) => void;
  deleteTask: (taskUid: string) => void;
  updateTaskCoefForMember: (
    memberName: string,
    taskUid: string,
    patch: { diffId?: string; reportId?: string }
  ) => void;

  setCategoryScore: (mboId: string, key: "leader" | "member", value: number | null) => void;
  setCategoryPts: (mboId: string, value: number) => void;
  setTaskPRatio: (mboId: string, taskUid: string, value: number) => void;

  updateSettings: (settings: Settings) => void;
  resetSettings: () => void;

  addYear: (year: string) => void;
  switchYear: (year: string) => void;
  setGutOrder: (order: string[]) => void;

  importMember: (member: MemberData) => void;
  importAll: (backup: AllBackup) => void;
}

export type AppStoreState = PersistedState & { hydrated: boolean } & AppActions;

function ensureMemberDraft(yd: YearData, name: string) {
  if (!yd.members[name]) {
    yd.members[name] = { name, tasks: [], categoryScores: {}, taskPRatios: {}, categoryPts: {} };
  }
  yd.current = name;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    immer((set) => ({
      years: {},
      currentYear: null,
      hydrated: false,

      hydrate: () => {
        useAppStore.persist.rehydrate();
      },

      addMember: (name) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          ensureMemberDraft(d.years[cy], name);
        }),

      deleteMember: (name) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          const yd = d.years[cy];
          delete yd.members[name];
          const names = Object.keys(yd.members);
          yd.current = names.length ? names[0] : null;
        }),

      switchMember: (name) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          d.years[cy].current = name || null;
        }),

      addTask: (task) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy] || !d.years[cy].current) return;
          const yd = d.years[cy];
          const m = yd.members[yd.current as string];
          if (!m) return;
          m.tasks.push({ ...task, uid: uid() });
        }),

      deleteTask: (taskUid) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy] || !d.years[cy].current) return;
          const yd = d.years[cy];
          const m = yd.members[yd.current as string];
          if (!m) return;
          m.tasks = m.tasks.filter((t) => t.uid !== taskUid);
          Object.values(m.taskPRatios).forEach((wmap) => {
            delete wmap[taskUid];
          });
        }),

      updateTaskCoefForMember: (memberName, taskUid, patch) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          const s = d.years[cy].settings;
          const m = d.years[cy].members[memberName];
          if (!m) return;
          const t = m.tasks.find((x) => x.uid === taskUid);
          if (!t) return;
          if (patch.diffId) {
            const dObj = s.difficulty.find((x) => x.id === patch.diffId);
            if (dObj) {
              t.diffId = dObj.id;
              t.diffLabelSnap = dObj.label;
              t.diffCoefSnap = dObj.coef;
            }
          }
          if (patch.reportId) {
            const rObj = s.report.find((x) => x.id === patch.reportId);
            if (rObj) {
              t.reportId = rObj.id;
              t.reportLabelSnap = rObj.label;
              t.reportCoefSnap = rObj.coef;
            }
          }
        }),

      setCategoryScore: (mboId, key, value) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy] || !d.years[cy].current) return;
          const yd = d.years[cy];
          const m = yd.members[yd.current as string];
          if (!m) return;
          if (!m.categoryScores[mboId]) m.categoryScores[mboId] = { leader: null, member: null };
          m.categoryScores[mboId][key] = value;
        }),

      setCategoryPts: (mboId, value) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy] || !d.years[cy].current) return;
          const yd = d.years[cy];
          const m = yd.members[yd.current as string];
          if (!m) return;
          m.categoryPts[mboId] = value;
        }),

      setTaskPRatio: (mboId, taskUid, value) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy] || !d.years[cy].current) return;
          const yd = d.years[cy];
          const m = yd.members[yd.current as string];
          if (!m) return;
          if (!m.taskPRatios[mboId]) m.taskPRatios[mboId] = {};
          m.taskPRatios[mboId][taskUid] = value;
        }),

      updateSettings: (settings) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          const next = clone(settings);
          migrateSettings(next);
          d.years[cy].settings = next;
        }),

      resetSettings: () =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          d.years[cy].settings = defaults();
        }),

      addYear: (year) =>
        set((d) => {
          if (d.years[year]) {
            d.currentYear = year;
            return;
          }
          const existing = Object.keys(d.years).sort((a, b) => Number(b) - Number(a));
          const latest = existing[0];
          const inherit = latest ? clone(d.years[latest].settings) : defaults();
          d.years[year] = newYearData(inherit);
          d.currentYear = year;
        }),

      switchYear: (year) =>
        set((d) => {
          if (d.years[year]) d.currentYear = year;
        }),

      setGutOrder: (order) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          d.years[cy].gutOrder = order;
        }),

      importMember: (member) =>
        set((d) => {
          const cy = d.currentYear;
          if (!cy || !d.years[cy]) return;
          const cloned = clone(member);
          migrateMember(cloned);
          if (!cloned.categoryScores) cloned.categoryScores = {};
          d.years[cy].members[cloned.name] = cloned;
          d.years[cy].current = cloned.name;
        }),

      importAll: (backup) =>
        set((d) => {
          const years = clone(backup.years);
          Object.values(years).forEach((yd) => {
            if (!yd.settings) yd.settings = defaults();
            if (!yd.members) yd.members = {};
            if (!yd.gutOrder) yd.gutOrder = [];
          });
          d.years = years;
          const yrs = Object.keys(years).sort((a, b) => Number(b) - Number(a));
          d.currentYear = backup.currentYear && years[backup.currentYear] ? backup.currentYear : yrs[0];
        }),
    })),
    {
      name: LS_KEY,
      storage: createLegacyCompatStorage(),
      skipHydration: true,
      partialize: (state) => ({ years: state.years, currentYear: state.currentYear }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

export function getYearsList(state: AppStoreState): string[] {
  return Object.keys(state.years).sort((a, b) => Number(b) - Number(a));
}
