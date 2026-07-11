import { useAppStore, useMembers, useSettings } from "../../store/useAppStore";
import type { CategoryResult } from "../../types";
import { getP, maxWS, taskValues } from "../../lib/calc";
import { toast } from "../../store/useToastStore";
import TaskRow from "./TaskRow";

const SCORE_OPTS = [1, 2, 3, 4, 5];

export default function CategoryCard({ result, memberName }: { result: CategoryResult; memberName: string }) {
  const settings = useSettings();
  const members = useMembers();
  const setCategoryScore = useAppStore((s) => s.setCategoryScore);
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
      return `${t.taskName || "(무제)"} 난이도 ${dif.label} 기여도 ${rep.label} 중요도 ${wPct}%`;
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
    <div className={"category " + (r.status === "noscore" ? "category-warn" : "")}>
      <div className="category-head">
        <div className="category-name">
          <span className="pill">{r.mbo.label}</span>
          <span className="category-n">{r.n} 업무</span>
        </div>
        <div className="category-sub">
          {r.status === "ok" ? (
            <>
              <span className="category-pts">{r.pts.toFixed(1)}</span>
              <span className="category-cap">/ {r.effPts}</span>
            </>
          ) : (
            <>
              <span className="badge-no">미평가</span>
              <span className="category-cap">/ {r.effPts}</span>
            </>
          )}
        </div>
      </div>
      <div className="category-s">
        <label>
          <span className="s-tag leader">팀장</span>
          {scoreSelect("leader", ss.leader)}
        </label>
        <label>
          <span className="s-tag member">팀원</span>
          {scoreSelect("member", ss.member)}
        </label>
        <span className="s-note">{note}</span>
      </div>
      <table className="tasks">
        <thead>
          <tr>
            <th>업무</th>
            <th style={{ textAlign: "center", width: 178 }}>난이도</th>
            <th style={{ textAlign: "center", width: 178 }}>기여도</th>
            <th style={{ width: 36 }}></th>
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
          <tr className="w-total-row">
            <td colSpan={4}>
              {multiTask && (
                <>
                  <span className="w-total-label">중요도 합계</span>
                  <span className="w-total-val">{totalPct}%</span>
                </>
              )}
              <button className="copy-category-btn" title="클립보드 복사" onClick={onCopy}>
                📋
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
