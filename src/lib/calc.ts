import type {
  CategoryResult,
  CoefficientItem,
  MboItem,
  MemberData,
  Settings,
  Task,
} from "@/types";

/**
 * 점수 엔진 (항목 가중 평균 환산, v4.2)
 *   W = 난이도계수 × 기여도계수                         ← 업무별
 *   S = 수행환산점(팀장70%+팀원30%, 1~5)                  ← MBO 항목당 1번
 *   항목 점수 = (항목 업무들의 W합계 × S ÷ 기준 상한) × 항목 배점
 *   P = 업무 중요도 비중 (항목 내 합계 = 1, 미설정 시 균등 배분)
 *   기준 상한 = 난이도 최대 × 기여도 최대 × 5 (동적 산출)
 */

function resolveMbo(list: MboItem[], id: string, snapLabel?: string, snapPts?: number): MboItem {
  const f = list.find((x) => x.id === id);
  if (f) return f;
  return { id, label: snapLabel ?? "(삭제된 단계)", pts: snapPts ?? 0 };
}

function resolveCoef(
  list: CoefficientItem[],
  id: string,
  snapLabel?: string,
  snapCoef?: number
): CoefficientItem {
  const f = list.find((x) => x.id === id);
  if (f) return f;
  return { id, label: snapLabel ?? "(삭제된 단계)", coef: snapCoef ?? 0 };
}

export function taskValues(t: Task, s: Settings) {
  const mbo = resolveMbo(s.mbo, t.mboId, t.mboLabelSnap, t.mboPtsSnap);
  const dif = resolveCoef(s.difficulty, t.diffId, t.diffLabelSnap, t.diffCoefSnap);
  const rep = resolveCoef(s.report, t.reportId, t.reportLabelSnap, t.reportCoefSnap);
  return { mbo, dif, rep };
}

export function maxWS(s: Settings): number {
  const imp = Math.max(...s.difficulty.map((d) => d.coef), 0.0001);
  const rep = Math.max(...s.report.map((r) => r.coef), 0.0001);
  return imp * rep * 5;
}

export function taskW(t: Task, s: Settings): number {
  const { dif, rep } = taskValues(t, s);
  return dif.coef * rep.coef;
}

/**
 * 항목 내 업무 비중 배열 반환 (정규화된 0~1값, 합계 = 1).
 * member.taskPRatios[mboId] = {uid: rawPct(0~100), ...}
 * 저장 안 된 경우 균등 배분.
 */
export function getP(m: MemberData, mboId: string, tasks: Task[]): number[] {
  if (!tasks.length) return [];
  const wmap = m.taskPRatios?.[mboId] ?? {};
  const raws = tasks.map((t) => (wmap[t.uid] != null ? +wmap[t.uid] : null));
  const hasAny = raws.some((v) => v != null);
  const vals = hasAny ? raws.map((v) => (v != null ? v : 0)) : tasks.map(() => 100 / tasks.length);
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum > 0 ? vals.map((v) => v / sum) : tasks.map(() => 1 / tasks.length);
}

/** 항목 S(수행환산점). 미입력이면 null. */
export function categoryConv(m: MemberData, mboId: string, s: Settings): number | null {
  const ss = m.categoryScores?.[mboId];
  if (!ss || ss.leader == null || ss.member == null) return null;
  const wl = (s.defaultWLeader ?? 70) / 100;
  const wm = (s.defaultWMember ?? 30) / 100;
  return ss.leader * wl + ss.member * wm;
}

/** 항목 1개 결과. status: ok | noscore(업무 있음·S 없음) | empty(업무 0) */
export function categoryResult(m: MemberData, mboItem: MboItem, s: Settings): CategoryResult {
  const tasks = m.tasks.filter((t) => t.mboId === mboItem.id);
  const pts = m.categoryPts?.[mboItem.id] != null ? m.categoryPts[mboItem.id] : mboItem.pts;
  if (!tasks.length) {
    return {
      pts: 0,
      status: "empty",
      n: 0,
      weightedW: 0,
      conv: null,
      ratio: 0,
      mbo: mboItem,
      effPts: pts,
      tasks,
      pRatios: [],
    };
  }
  const conv = categoryConv(m, mboItem.id, s);
  const pRatios = getP(m, mboItem.id, tasks);
  const weightedW = tasks.reduce((acc, t, i) => acc + taskW(t, s) * pRatios[i], 0);
  if (conv == null) {
    return {
      pts: 0,
      status: "noscore",
      n: tasks.length,
      weightedW,
      conv: null,
      ratio: 0,
      mbo: mboItem,
      effPts: pts,
      tasks,
      pRatios,
    };
  }
  const ratio = (weightedW * conv) / maxWS(s);
  return {
    pts: ratio * pts,
    status: "ok",
    n: tasks.length,
    weightedW,
    conv,
    ratio,
    mbo: mboItem,
    effPts: pts,
    tasks,
    pRatios,
  };
}

export function memberSlots(m: MemberData, s: Settings): CategoryResult[] {
  return s.mbo.map((mboItem) => categoryResult(m, mboItem, s));
}

export function memberTotal(m: MemberData | undefined, s: Settings): number {
  if (!m) return 0;
  return memberSlots(m, s).reduce((sum, r) => sum + r.pts, 0);
}

export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}
