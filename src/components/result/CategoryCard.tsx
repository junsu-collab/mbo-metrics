import { Copy } from "lucide-react";
import { useAppStore, useMembers, useSettings } from "../../store/useAppStore";
import { useUiStore } from "../../store/useUiStore";
import type { CategoryResult } from "../../types";
import { getP, maxWS, taskValues } from "../../lib/calc";
import { toast } from "../../store/useToastStore";
import TaskRow from "./TaskRow";

const SCORE_OPTS = [1, 2, 3, 4, 5];

export default function CategoryCard({ result, memberName }: { result: CategoryResult; memberName: string }) {
  const settings = useSettings();
  const members = useMembers();
  const setCategoryScore = useAppStore((s) => s.setCategoryScore);
  const showFormulas = useUiStore((s) => s.showFormulas);
  const member = members[memberName];

  const r = result;
  const id = r.mbo.id;
  const ss = member?.categoryScores[id] || { leader: null, member: null };
  const ceil = maxWS(settings);
  const multiTask = r.tasks.length > 1;

  const note =
    r.conv != null
      ? `W합계 ${r.weightedW.toFixed(2)} × S ${r.conv.toFixed(2)} ÷ 기준 상한 ${ceil.toFixed(2)} = ${(r.ratio * 100).toFixed(0)}%`
      : `팀장·팀원 점수를 모두 입력해야 항목 점수가 계산됩니다`;

  const totalPct = Math.round(r.pRatios.reduce((s, w) => s + w, 0) * 100);

  const onCopy = () => {
    if (!r.tasks.length) {
      toast("복사할 업무가 없습니다");
      return;
    }
    const pRatios = getP(member, id, r.tasks);
    const parts = r.tasks.map((t, i) => {
      const { dif, rep } = taskValues(t, settings);
      const wPct = Math.round(pRatios[i] * 100);
      return `${t.taskName || "(무제)"} '난이도 ${dif.label}', '기여도 ${rep.label}', '중요도 ${wPct}%'`;
    });
    const text = parts.join(" | ");
    navigator.clipboard.writeText(text).then(
      () => toast("클립보드에 복사됨"),
      () => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("클립보드에 복사됨");
      }
    );
  };

  const scoreSelect = (key: "leader" | "member", selected: number | null) => (
    <select
      className="m-select py-1 text-xs"
      value={selected ?? ""}
      onChange={(e) => setCategoryScore(memberName, id, key, e.target.value === "" ? null : +e.target.value)}
    >
      <option value="">—</option>
      {SCORE_OPTS.map((v) => (
        <option key={v} value={v}>
          {v}점
        </option>
      ))}
    </select>
  );

  return (
    <div
      className={
        "mb-3 overflow-hidden rounded-2xl border bg-surface shadow-sm " +
        (r.status === "noscore"
          ? "border-amber-300 ring-1 ring-amber-100 dark:border-amber-500/40 dark:ring-amber-500/10"
          : "border-line")
      }
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-ink">{r.mbo.label}</span>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">{r.n} 업무</span>
        </div>
        <div className="flex items-baseline gap-1">
          {r.status === "ok" ? (
            <>
              <span className="font-mono text-2xl font-bold tabular-nums text-primary">{r.pts.toFixed(1)}</span>
              <span className="text-xs font-medium text-muted">/ {r.effPts}</span>
            </>
          ) : (
            <>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">미평가</span>
              <span className="ml-1 text-xs font-medium text-muted">/ {r.effPts}</span>
            </>
          )}
        </div>
      </div>

      {/* S 점수 행 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-canvas/60 px-4 py-3">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">팀장</span>
          {scoreSelect("leader", ss.leader)}
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="rounded-md bg-brand-violet-soft px-2 py-0.5 text-xs font-bold text-brand-violet">팀원</span>
          {scoreSelect("member", ss.member)}
        </label>
        {showFormulas && <span className="ml-auto text-right font-mono text-xs leading-snug text-muted">{note}</span>}
      </div>

      {/* 업무 테이블 */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-t border-line text-left font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-2 font-medium">업무</th>
            <th className="w-[184px] px-2 py-2 text-center font-medium">난이도</th>
            <th className="w-[184px] px-2 py-2 text-center font-medium">기여도</th>
            <th className="w-10 px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {r.tasks.map((t, ti) => {
            const wPct = Math.round((r.pRatios[ti] || 0) * 100);
            const raw = member?.taskPRatios?.[id]?.[t.uid];
            const globalIndex = member.tasks.findIndex((x) => x.uid === t.uid);
            return (
              <TaskRow
                key={t.uid}
                task={t}
                memberName={memberName}
                mboId={id}
                globalIndex={globalIndex}
                multiTask={multiTask}
                rawValue={raw != null ? raw : wPct}
                displayPct={wPct}
              />
            );
          })}
          <tr className="border-t border-line bg-canvas/60">
            <td colSpan={4} className="px-4 py-2">
              <div className="flex items-center gap-2">
                {multiTask && (
                  <>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">중요도 합계</span>
                    <span className="font-mono text-xs font-bold text-primary">{totalPct}%</span>
                  </>
                )}
                <button
                  className="m-focus ml-auto flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:border-primary hover:bg-primary-soft hover:text-primary"
                  title="클립보드 복사"
                  onClick={onCopy}
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
