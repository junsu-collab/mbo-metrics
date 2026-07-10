import { defaults } from "@/lib/defaults";
import type { AppStoreState } from "@/store/useAppStore";
import type { MemberData, Settings, YearData } from "@/types";

export function selectYearData(s: AppStoreState): YearData | undefined {
  return s.currentYear ? s.years[s.currentYear] : undefined;
}

export function selectSettings(s: AppStoreState): Settings {
  return selectYearData(s)?.settings ?? defaults();
}

export function selectCurrentMemberName(s: AppStoreState): string | null {
  return selectYearData(s)?.current ?? null;
}

export function selectCurrentMember(s: AppStoreState): MemberData | undefined {
  const yd = selectYearData(s);
  return yd?.current ? yd.members[yd.current] : undefined;
}

export function selectMemberNames(s: AppStoreState): string[] {
  const yd = selectYearData(s);
  return yd ? Object.keys(yd.members) : [];
}
