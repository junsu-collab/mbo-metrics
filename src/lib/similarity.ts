import type { MemberData, Task } from "@/types";

export interface OwnedTask {
  task: Task;
  memberName: string;
}

const lvCache = new Map<string, number>();

function levenshtein(a: string, b: string): number {
  const key = a < b ? a + "|" + b : b + "|" + a;
  const cached = lvCache.get(key);
  if (cached != null) return cached;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i ? (j ? 0 : i) : j))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const r = dp[m][n];
  lvCache.set(key, r);
  return r;
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  const maxLen = Math.max(la.length, lb.length);
  return maxLen ? 1 - levenshtein(la, lb) / maxLen : 1;
}

export function collectAllTasks(members: Record<string, MemberData>): OwnedTask[] {
  const tasks: OwnedTask[] = [];
  Object.entries(members).forEach(([name, m]) => {
    (m.tasks || []).forEach((task) => tasks.push({ task, memberName: name }));
  });
  return tasks;
}

export interface TaskGroup {
  label: string;
  items: OwnedTask[];
}

export function groupBySimilarity(tasks: OwnedTask[], threshold = 0.72): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const assigned = new Set<number>();
  tasks.forEach((t, i) => {
    if (assigned.has(i)) return;
    const group: TaskGroup = { label: t.task.taskName, items: [t] };
    assigned.add(i);
    tasks.forEach((t2, j) => {
      if (i === j || assigned.has(j)) return;
      const la = t.task.taskName.toLowerCase();
      const lb = t2.task.taskName.toLowerCase();
      const sharePrefix = la.length >= 2 && lb.length >= 2 && la.slice(0, 2) === lb.slice(0, 2);
      if (sharePrefix && similarity(t.task.taskName, t2.task.taskName) >= threshold) {
        group.items.push(t2);
        assigned.add(j);
      }
    });
    groups.push(group);
  });
  const singles = groups.filter((g) => g.items.length === 1);
  const multi = groups.filter((g) => g.items.length > 1);
  if (singles.length > 1) {
    multi.push({ label: "기타", items: singles.flatMap((g) => g.items) });
    return multi;
  }
  return groups;
}
