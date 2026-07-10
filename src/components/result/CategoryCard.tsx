"use client";

import { getP } from "@/lib/calc";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import type { CategoryResult, MemberData, Settings } from "@/types";

import { TaskRow } from "./TaskRow";

interface Props {
  result: CategoryResult;
  member: MemberData;
  memberName: string;
  settings: Settings;
  ceil: number;
}

const scoreOptions = [1, 2, 3, 4, 5];

export function CategoryCard({ result: r, member, memberName, settings, ceil }: Props) {
  const setCategoryScore = useAppStore((s) => s.setCategoryScore);

  const ss = member.categoryScores?.[r.mbo.id] ?? { leader: null, member: null };
  const multiTask = r.tasks.length > 1;

  const note =
    r.conv != null
      ? `W합계 ${r.weightedW.toFixed(2)} × S ${r.conv.toFixed(2)} ÷ 기준 상한 ${ceil.toFixed(2)} = ${(r.ratio * 100).toFixed(0)}%`
      : "팀장·팀원 점수를 모두 입력해야 항목 점수가 계산됩니다";

  function handleCopy() {
    if (!r.tasks.length) {
      toast("복사할 업무가 없습니다");
      return;
    }
    const pRatios = getP(member, r.mbo.id, r.tasks);
    const parts = r.tasks.map((t, i) => {
      const dif = settings.difficulty.find((d) => d.id === t.diffId);
      const rep = settings.report.find((x) => x.id === t.reportId);
      const wPct = Math.round((pRatios[i] || 0) * 100);
      return `${t.taskName || "(무제)"} '난이도 ${dif?.label ?? ""}', '기여도 ${rep?.label ?? ""}', '중요도 ${wPct}%'`;
    });
    const text = parts.join(" | ");
    navigator.clipboard
      .writeText(text)
      .then(() => toast("클립보드에 복사됨"))
      .catch(() => toast("클립보드 복사 실패"));
  }

  return (
    <div
      className={`mb-3 overflow-hidden rounded-xl border bg-white shadow-[var(--shadow)] ${
        r.status === "noscore" ? "border-warn-bright/50 shadow-[0_0_0_1px_rgba(255,146,0,.3)_inset]" : "border-line"
      }`}
    >
      <div
        className="flex items-center justify-between border-b border-line px-3.5 py-2.5"
        style={{ background: "linear-gradient(to right,var(--panel),var(--paper))" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold tracking-tight text-ink">{r.mbo.label}</span>
          <span className="rounded-full border border-line bg-paper px-1.5 py-px font-mono text-[10px] text-muted">
            {r.n} 업무
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          {r.status === "ok" ? (
            <>
              <span className="text-[22px] font-bold leading-none text-accent tabular-nums">{r.pts.toFixed(1)}</span>
              <span className="font-mono text-[11px] text-muted">/ {r.effPts}</span>
            </>
          ) : (
            <>
              <span className="rounded-md border border-warn-bright/40 bg-warn-soft px-2 py-0.5 text-[10.5px] font-bold text-warn">
                미평가
              </span>
              <span className="font-mono text-[11px] text-muted">/ {r.effPts}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-paper px-3.5 py-2.5">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-leader/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-leader">
            팀장
          </span>
          <select
            value={ss.leader ?? ""}
            onChange={(e) => setCategoryScore(r.mbo.id, "leader", e.target.value === "" ? null : +e.target.value)}
            className="rounded-md border border-line-2 bg-white px-2 py-1 text-[12.5px] transition-colors focus:border-transparent focus:outline-2 focus:outline-accent"
          >
            <option value="">—</option>
            {scoreOptions.map((v) => (
              <option key={v} value={v}>
                {v}점
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs">
          <span className="rounded-full bg-member/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-member">
            팀원
          </span>
          <select
            value={ss.member ?? ""}
            onChange={(e) => setCategoryScore(r.mbo.id, "member", e.target.value === "" ? null : +e.target.value)}
            className="rounded-md border border-line-2 bg-white px-2 py-1 text-[12.5px] transition-colors focus:border-transparent focus:outline-2 focus:outline-accent"
          >
            <option value="">—</option>
            {scoreOptions.map((v) => (
              <option key={v} value={v}>
                {v}점
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-right font-mono text-[10px] leading-relaxed text-muted">{note}</span>
      </div>

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="bg-paper px-2.5 py-2 text-left font-mono text-[10.5px] uppercase tracking-wide text-ink-2">
              업무
            </th>
            <th className="w-[178px] bg-paper px-2.5 py-2 text-center font-mono text-[10.5px] uppercase tracking-wide text-ink-2">
              난이도
            </th>
            <th className="w-[178px] bg-paper px-2.5 py-2 text-center font-mono text-[10.5px] uppercase tracking-wide text-ink-2">
              기여도
            </th>
            <th className="w-9 bg-paper px-2.5 py-2" />
          </tr>
        </thead>
        <tbody>
          {r.tasks.map((t, i) => (
            <TaskRow
              key={t.uid}
              task={t}
              memberName={memberName}
              mboId={r.mbo.id}
              settings={settings}
              showSlider={multiTask}
              wPct={Math.round((r.pRatios[i] || 0) * 100)}
            />
          ))}
          <tr className="bg-paper">
            <td colSpan={4} className="border-t border-dashed border-line-2 px-3 py-1.5">
              {multiTask && (
                <>
                  <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                    중요도 합계
                  </span>
                  <span className="font-mono text-[11.5px] font-bold text-accent">
                    {Math.round(r.pRatios.reduce((sum, w) => sum + w, 0) * 100)}%
                  </span>
                </>
              )}
              <button
                onClick={handleCopy}
                title="클립보드 복사"
                className="float-right rounded-md border border-line px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
              >
                📋
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
