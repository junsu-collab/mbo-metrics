import { Check } from "lucide-react";
import { useAppStore, useSettings } from "../../store/useAppStore";
import { choiceTargetFromMbo } from "../../lib/calc";
import type { MemberData } from "../../types";

export default function ChoicePointsPanel({ member }: { member: MemberData }) {
  const settings = useSettings();
  const setCategoryPts = useAppStore((s) => s.setCategoryPts);

  const choiceItems = settings.mbo.filter((x) => x.choice);
  const choiceTarget = choiceTargetFromMbo(settings.mbo);
  const choiceTotal = choiceItems.reduce((s, x) => s + (member.categoryPts[x.id] != null ? member.categoryPts[x.id] : 0), 0);
  const choiceOk = choiceTotal === choiceTarget;

  return (
    <div
      className={
        "mb-3 rounded-2xl border p-4 " +
        (choiceOk
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          : "border-amber-200 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10")
      }
    >
      <div className="mb-2.5 flex items-center justify-between text-xs font-semibold text-ink-2">
        <span>
          선택 항목 배점 <span className="ml-1 font-normal text-muted">(합계 {choiceTarget}점 · 10점 단위)</span>
        </span>
        <span
          className={
            "flex items-center gap-1 font-mono " + (choiceOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")
          }
        >
          합계 {choiceTotal} / {choiceTarget}점 {choiceOk ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : "!"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        {choiceItems.map((x) => {
          const v = member.categoryPts[x.id] != null ? member.categoryPts[x.id] : 0;
          return (
            <div className="flex flex-1 flex-col gap-1" key={x.id}>
              <span className="truncate text-xs text-muted">{x.label}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={choiceTarget}
                  step={10}
                  value={v}
                  placeholder="0"
                  className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-center font-mono text-sm font-bold text-ink transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onChange={(e) => {
                    let val = Math.round((parseInt(e.target.value) || 0) / 10) * 10;
                    val = Math.max(0, Math.min(choiceTarget, val));
                    setCategoryPts(member.name, x.id, val);
                  }}
                />
                <span className="shrink-0 text-xs text-muted">점</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
