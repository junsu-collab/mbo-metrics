import { defaults, uid } from "@/lib/defaults";
import type { MemberData, Settings, YearData } from "@/types";

/** settings에 누락된 플래그/def 필드를 defaults()로 보완 — load() 시 1회만 호출 */
export function migrateSettings(s: Settings | undefined): void {
  if (!s) return;
  const def = defaults();
  if (s.mbo) {
    const defMbo = def.mbo;
    s.mbo.forEach((item) => {
      const orig = defMbo.find((x) => x.id === item.id);
      if (!orig) return;
      if (orig.fixed && !item.fixed) item.fixed = true;
      if (orig.choice && !item.choice) item.choice = true;
    });
  }
  if (s.difficulty) {
    const defD = def.difficulty;
    s.difficulty.forEach((item) => {
      if (!item.def) {
        const orig = defD.find((x) => x.id === item.id);
        if (orig?.def) item.def = orig.def;
      }
    });
  }
  if (s.report) {
    const defR = def.report;
    s.report.forEach((item) => {
      if (!item.def) {
        const orig = defR.find((x) => x.id === item.id);
        if (orig?.def) item.def = orig.def;
      }
    });
  }
}

type LegacyMemberData = MemberData & {
  taskWeights?: Record<string, Record<string, number>>;
  slotPts?: Record<string, number>;
  slotScores?: MemberData["categoryScores"];
};

/** 기존(구 공식) 데이터 마이그레이션: 업무별 팀장/팀원 점수를 항목별 평균내어 새 S 초기값으로 이전 */
export function migrateMember(m: LegacyMemberData | undefined | null): void {
  if (!m || !Array.isArray(m.tasks)) return;
  m.tasks.forEach((t) => {
    if (!t.uid) t.uid = uid();
  });
  if (!m.taskPRatios) m.taskPRatios = {};
  if (!m.categoryPts) m.categoryPts = {};

  if (m.taskWeights) {
    Object.assign(m.taskPRatios, m.taskWeights);
    delete m.taskWeights;
  }
  if (m.slotPts) {
    Object.assign(m.categoryPts, m.slotPts);
    delete m.slotPts;
  }
  if (m.slotScores && !m.categoryScores) {
    m.categoryScores = m.slotScores;
    delete m.slotScores;
  }
  if (m.categoryScores) return; // 이미 새 구조

  m.categoryScores = {};
  const bucket: Record<string, typeof m.tasks> = {};
  m.tasks.forEach((t) => {
    if (t.leaderScore == null && t.memberScore == null) return;
    (bucket[t.mboId] = bucket[t.mboId] || []).push(t);
  });
  Object.keys(bucket).forEach((id) => {
    const arr = bucket[id];
    const avg = (k: "leaderScore" | "memberScore") =>
      Math.round(arr.reduce((sum, t) => sum + (+(t[k] ?? 0) || 0), 0) / arr.length);
    m.categoryScores[id] = {
      leader: Math.min(5, Math.max(1, avg("leaderScore"))),
      member: Math.min(5, Math.max(1, avg("memberScore"))),
    };
  });
}

export function migrateYearData(yd: YearData): void {
  if (!yd.settings) yd.settings = defaults();
  if (!yd.members) yd.members = {};
  if (!yd.gutOrder) yd.gutOrder = [];
  migrateSettings(yd.settings);
  Object.values(yd.members).forEach((m) => migrateMember(m));
}

export function migrateAll(years: Record<string, YearData>): void {
  Object.values(years).forEach(migrateYearData);
}
