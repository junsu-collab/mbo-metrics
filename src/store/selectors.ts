import { defaults } from "@/lib/defaults";
import type { AppStoreState } from "@/store/useAppStore";
import type { MemberData, Settings, YearData } from "@/types";

// 모듈 로드시 1회만 생성 — selectSettings의 fallback으로 매 렌더 새 객체를 반환하지 않기 위함
// (zustand의 useSyncExternalStore는 selector가 매번 새 참조를 반환하면 무한 렌더 루프에 빠진다)
const FALLBACK_SETTINGS = defaults();

export function selectYearData(s: AppStoreState): YearData | undefined {
  return s.currentYear ? s.years[s.currentYear] : undefined;
}

export function selectSettings(s: AppStoreState): Settings {
  return selectYearData(s)?.settings ?? FALLBACK_SETTINGS;
}

export function selectCurrentMemberName(s: AppStoreState): string | null {
  return selectYearData(s)?.current ?? null;
}

export function selectCurrentMember(s: AppStoreState): MemberData | undefined {
  const yd = selectYearData(s);
  return yd?.current ? yd.members[yd.current] : undefined;
}
