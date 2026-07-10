import { memberTotal } from "@/lib/calc";
import type { MemberData, Settings } from "@/types";

export interface RankedMember {
  name: string;
  total: number;
}

export function simRanking(members: Record<string, MemberData>, settings: Settings): RankedMember[] {
  return Object.keys(members)
    .map((n) => ({ name: n, total: memberTotal(members[n], settings) }))
    .sort((a, b) => b.total - a.total);
}

/** 스피어만 순위상관계수(ρ) — 체감 순위(gutOrder) vs 산식 순위(ranking) */
export function computeRho(gutOrder: string[], ranking: RankedMember[]) {
  const n = gutOrder.length;
  const crank: Record<string, number> = {};
  ranking.forEach((m, i) => (crank[m.name] = i + 1));
  let sumd2 = 0;
  let exact = 0;
  gutOrder.forEach((name, i) => {
    const gr = i + 1;
    const cr = crank[name] ?? gr;
    sumd2 += (cr - gr) ** 2;
    if (cr === gr) exact++;
  });
  const rho = n < 2 ? 1 : 1 - (6 * sumd2) / (n * (n * n - 1));
  return { rho, exact, n };
}

export function rhoDescription(rho: number): string {
  if (rho >= 0.9) return "매우 높은 일치도 · 계수가 잘 맞습니다";
  if (rho >= 0.7) return "높은 일치도";
  if (rho >= 0.4) return "보통 일치도 · 계수 조정을 시도해보세요";
  if (rho >= 0) return "낮은 일치도 · 계수 재검토 필요";
  return "역상관 · 체감 순위와 반대 경향";
}

export function reconcileGutOrder(stored: string[], memberNames: string[]): string[] {
  const next = stored.filter((n) => memberNames.includes(n));
  memberNames.forEach((n) => {
    if (!next.includes(n)) next.push(n);
  });
  return next;
}
