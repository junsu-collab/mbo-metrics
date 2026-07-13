import { X } from "lucide-react";
import { useAppStore, useSettings } from "../../store/useAppStore";
import { useUiStore } from "../../store/useUiStore";
import type { Task } from "../../types";
import { taskValues } from "../../lib/calc";
import ImportanceSlider from "./ImportanceSlider";

interface Props {
  task: Task;
  memberName: string;
  mboId: string;
  globalIndex: number;
  multiTask: boolean;
  rawValue: number;
  displayPct: number;
}

export default function TaskRow({ task, memberName, mboId, globalIndex, multiTask, rawValue, displayPct }: Props) {
  const settings = useSettings();
  const updateTaskCoef = useAppStore((s) => s.updateTaskCoef);
  const setTaskPRatio = useAppStore((s) => s.setTaskPRatio);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const showFormulas = useUiStore((s) => s.showFormulas);

  const { dif, rep } = taskValues(task, settings);
  const k = dif.coef * rep.coef;

  return (
    <>
      <tr className="border-t border-line align-top">
        <td className="px-4 py-3 align-middle">
          <b className="font-semibold text-ink">{task.taskName || "(무제 업무)"}</b>
          {showFormulas && (
            <div className="mt-0.5 font-mono text-xs text-muted">
              난이도 {dif.coef.toFixed(2)} × 기여도 {rep.coef.toFixed(2)} = W {k.toFixed(2)}
            </div>
          )}
        </td>
        <td className="px-2 py-3 text-center">
          <select
            className="m-select w-full max-w-[116px] text-xs"
            value={task.difficultyId}
            onChange={(e) => updateTaskCoef(memberName, task.uid, { difficultyId: e.target.value })}
          >
            {settings.difficulty.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ×{d.coef.toFixed(2)}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-3 text-center">
          <select
            className="m-select w-full max-w-[116px] text-xs"
            value={task.reportId}
            onChange={(e) => updateTaskCoef(memberName, task.uid, { reportId: e.target.value })}
          >
            {settings.report.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ×{r.coef.toFixed(2)}
              </option>
            ))}
          </select>
        </td>
        <td className="px-2 py-3">
          <button className="m-icon-btn" title="삭제" onClick={() => deleteTask(memberName, globalIndex)}>
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </td>
      </tr>
      {multiTask && (
        <tr>
          <td className="px-4 pb-3"></td>
          <td colSpan={2} className="px-2 pb-3">
            <ImportanceSlider
              value={rawValue}
              displayPct={displayPct}
              onChange={(v) => setTaskPRatio(memberName, mboId, task.uid, v)}
            />
          </td>
          <td className="px-2 pb-3"></td>
        </tr>
      )}
    </>
  );
}
