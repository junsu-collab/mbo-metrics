import { useAppStore, useSettings } from "../../store/useAppStore";
import type { MemberData } from "../../types";

export default function ChoicePointsPanel({ member }: { member: MemberData }) {
  const settings = useSettings();
  const setCategoryPts = useAppStore((s) => s.setCategoryPts);

  const choiceItems = settings.mbo.filter((x) => x.choice);
  const choiceTarget = settings.choiceTarget ?? 40;
  const choiceTotal = choiceItems.reduce((s, x) => s + (member.categoryPts[x.id] != null ? member.categoryPts[x.id] : 0), 0);
  const choiceOk = choiceTotal === choiceTarget;

  return (
    <div className={"choice-panel " + (choiceOk ? "ok" : "warn")}>
      <div className="choice-head">
        <span>
          선택 항목 배점 <span className="choice-rule">(합계 {choiceTarget}점 · 10점 단위)</span>
        </span>
        <span className={"choice-total " + (choiceOk ? "ok" : "err")}>
          합계 {choiceTotal} / {choiceTarget}점 {choiceOk ? "✓" : "!"}
        </span>
      </div>
      <div className="choice-rows">
        {choiceItems.map((x) => {
          const v = member.categoryPts[x.id] != null ? member.categoryPts[x.id] : 0;
          return (
            <div className="choice-row" key={x.id}>
              <span className="choice-lbl">{x.label}</span>
              <div className="choice-input-wrap">
                <input
                  type="number"
                  min={0}
                  max={choiceTarget}
                  step={10}
                  value={v}
                  placeholder="0"
                  onChange={(e) => {
                    let val = Math.round((parseInt(e.target.value) || 0) / 10) * 10;
                    val = Math.max(0, Math.min(40, val));
                    setCategoryPts(member.name, x.id, val);
                  }}
                />
                <span className="choice-unit">점</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
