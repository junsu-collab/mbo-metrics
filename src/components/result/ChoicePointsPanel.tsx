"use client";

import { useAppStore } from "@/store/useAppStore";
import type { MboItem, MemberData } from "@/types";

interface Props {
  choiceItems: MboItem[];
  member: MemberData;
  choiceTarget: number;
}

export function ChoicePointsPanel({ choiceItems, member, choiceTarget }: Props) {
  const setCategoryPts = useAppStore((s) => s.setCategoryPts);

  const choiceTotal = choiceItems.reduce((sum, x) => sum + (member.categoryPts?.[x.id] ?? 0), 0);
  const ok = choiceTotal === choiceTarget;

  return (
    <div
      className={`mb-3 overflow-visible rounded-[10px] border px-3.5 py-2.5 shadow-[var(--shadow)] ${
        ok ? "border-green/30 bg-green-soft" : "border-warn-bright/40 bg-warn-soft"
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-[11.5px] font-semibold">
        <span>
          선택 항목 배점{" "}
          <span className="ml-1 text-[10.5px] font-normal text-muted">
            (합계 {choiceTarget}점 · 10점 단위)
          </span>
        </span>
        <span className={`font-mono text-[11.5px] font-bold ${ok ? "text-green" : "text-warn"}`}>
          합계 {choiceTotal} / {choiceTarget}점 {ok ? "✓" : "!"}
        </span>
      </div>
      <div className="flex flex-row items-center gap-2">
        {choiceItems.map((x) => {
          const v = member.categoryPts?.[x.id] ?? 0;
          return (
            <div key={x.id} className="flex flex-1 flex-col gap-0.5 text-[11px]">
              <span className="truncate text-[10.5px] text-muted">{x.label}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={choiceTarget}
                  step={10}
                  value={v}
                  onChange={(e) => {
                    let val = Math.round((parseInt(e.target.value) || 0) / 10) * 10;
                    val = Math.max(0, Math.min(choiceTarget, val));
                    setCategoryPts(x.id, val);
                  }}
                  className="w-full rounded-md border border-line-2 px-1.5 py-1 text-center font-mono text-[13px] font-bold transition-colors focus:border-transparent focus:outline-2 focus:outline-accent"
                />
                <span className="flex-shrink-0 text-[11px] text-muted">점</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
