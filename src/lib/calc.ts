import type { CategoryResult, CoefItem, MboItem, MemberData, Settings, Task } from "../types";

// ===== 점수 엔진 (vanilla v4.2와 수식·소수점까지 동일) =====
//   W = 난이도 계수 × 기여도 계수                      ← 업무별
//   S = 수행환산점(팀장 wL% + 팀원 wM%, 1~5)          ← MBO 항목당 1번
//   항목 점수 = (항목 업무들의 W합계 × S ÷ 기준 상한) × 항목 배점
//   P = 업무 중요도 비중 (항목 내 합계 = 1, 미설정 시 균등 배분)
//   기준 상한 = 난이도 최대 × 기여도 최대 × 5

/** 계수 해석 (id 우선, 없으면 스냅샷 값으로 폴백) */
function resolve(
  list: Array<CoefItem | MboItem>,
  id: string | undefined,
  snapLabel: string | undefined,
  snapVal: number | undefined,
  key: "coef" | "pts"
): { label: string; coef: number; pts: number } {
  const f = list.find((x) => x.id === id) as (CoefItem & MboItem) | undefined;
  if (f) {
    return {
      label: f.label ?? "",
      coef: Number(f.coef ?? 0),
      pts: Number(f.pts ?? 0),
    };
  }
  const val = snapVal ?? 0;
  return {
    label: snapLabel ?? "(삭제된 단계)",
    coef: key === "coef" ? val : 0,
    pts: key === "pts" ? val : 0,
  };
}

export interface TaskValues {
  mbo: { label: string; pts: number };
  dif: { label: string; coef: number };
  rep: { label: string; coef: number };
}

export function taskValues(t: Task, s: Settings): TaskValues {
  const mbo = resolve(s.mbo, t.mboId, t.mboLabelSnap ?? t.mboLabel, t.mboPtsSnap ?? t.mboPts, "pts");
  const dif = resolve(s.difficulty, t.difficultyId, t.difficultyLabelSnap ?? t.diffLabel, t.difficultyCoefSnap ?? t.diffCoef, "coef");
  const rep = resolve(s.report, t.reportId, t.reportLabelSnap ?? t.reportLabel, t.reportCoefSnap ?? t.reportCoef, "coef");
  return { mbo, dif, rep };
}

/** 기준 상한 = 난이도 최대 × 기여도 최대 × 5 (동적 산출) */
export function maxWS(s: Settings): number {
  const imp = Math.max(...s.difficulty.map((d) => d.coef), 0.0001);
  const rep = Math.max(...s.report.map((r) => r.coef), 0.0001);
  return imp * rep * 5;
}

/** 선택 항목 배점 합계 = 100 - 공통(고정) 항목 배점 합계 */
export function choiceTargetFromMbo(mbo: MboItem[]): number {
  const fixedSum = mbo.filter((x) => !x.choice).reduce((sum, x) => sum + (Number(x.pts) || 0), 0);
  return Math.max(0, 100 - fixedSum);
}

export function taskW(t: Task, s: Settings): number {
  const { dif, rep } = taskValues(t, s);
  return dif.coef * rep.coef;
}

/** 항목 내 업무 비중 배열 (정규화된 0~1값, 합계=1). 미설정 시 균등 배분. */
export function getP(m: MemberData, mboId: string, tasks: Task[]): number[] {
  if (!tasks.length) return [];
  const wmap = (m.taskPRatios && m.taskPRatios[mboId]) || {};
  const raws = tasks.map((t) => (wmap[t.uid] != null ? +wmap[t.uid] : null));
  const hasAny = raws.some((v) => v != null);
  const vals = hasAny ? raws.map((v) => (v != null ? v : 0)) : tasks.map(() => 100 / tasks.length);
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum > 0 ? vals.map((v) => v / sum) : tasks.map(() => 1 / tasks.length);
}

/** 항목 S(수행환산점). 미입력이면 null. */
export function categoryConv(m: MemberData, mboId: string, s: Settings): number | null {
  const ss = m.categoryScores && m.categoryScores[mboId];
  if (!ss || ss.leader == null || ss.member == null) return null;
  const wl = (s.defaultWLeader ?? 70) / 100;
  const wm = (s.defaultWMember ?? 30) / 100;
  return ss.leader * wl + ss.member * wm;
}

/** 항목 1개 결과. status: ok | noscore(업무 있음·S 없음) | empty(업무 0) */
export function categoryResult(m: MemberData, mboItem: MboItem, s: Settings): CategoryResult {
  const tasks = m.tasks.filter((t) => t.mboId === mboItem.id);
  const pts = m.categoryPts && m.categoryPts[mboItem.id] != null ? m.categoryPts[mboItem.id] : mboItem.pts;
  if (!tasks.length) {
    return { pts: 0, status: "empty", n: 0, weightedW: 0, conv: null, ratio: 0, mbo: mboItem, effPts: pts, tasks, pRatios: [] };
  }
  const conv = categoryConv(m, mboItem.id, s);
  const pRatios = getP(m, mboItem.id, tasks);
  const weightedW = tasks.reduce((sum, t, i) => sum + taskW(t, s) * pRatios[i], 0);
  if (conv == null) {
    return { pts: 0, status: "noscore", n: tasks.length, weightedW, conv: null, ratio: 0, mbo: mboItem, effPts: pts, tasks, pRatios };
  }
  const ratio = (weightedW * conv) / maxWS(s);
  return { pts: ratio * pts, status: "ok", n: tasks.length, weightedW, conv, ratio, mbo: mboItem, effPts: pts, tasks, pRatios };
}

export function memberSlots(m: MemberData, s: Settings): CategoryResult[] {
  return s.mbo.map((mboItem) => categoryResult(m, mboItem, s));
}

export function memberTotal(m: MemberData | undefined, s: Settings): number {
  if (!m) return 0;
  return memberSlots(m, s).reduce((sum, r) => sum + r.pts, 0);
}
