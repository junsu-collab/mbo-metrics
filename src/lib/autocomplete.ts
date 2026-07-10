import type { MemberData } from "@/types";

export interface TaskSuggestion {
  taskName: string;
  diffId?: string;
  reportId?: string;
  diffLabel?: string;
  repLabel?: string;
  from: string;
}

/** 다른 팀원이 이미 등록한 업무명 중 검색어를 포함하는 상위 6개를 제안 */
export function getSuggestions(
  query: string,
  currentMemberName: string | null,
  members: Record<string, MemberData>
): TaskSuggestion[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  const seen = new Map<string, TaskSuggestion>();
  Object.entries(members).forEach(([name, m]) => {
    if (name === currentMemberName || !m.tasks) return;
    m.tasks.forEach((t) => {
      if (!t.taskName) return;
      const tl = t.taskName.toLowerCase();
      if (tl.includes(lower) && !seen.has(t.taskName)) {
        seen.set(t.taskName, {
          taskName: t.taskName,
          diffId: t.diffId,
          reportId: t.reportId,
          diffLabel: t.diffLabelSnap,
          repLabel: t.reportLabelSnap,
          from: name,
        });
      }
    });
  });
  return [...seen.values()].slice(0, 6);
}
