import { useAppStore, useSettings } from "../../store/useAppStore";
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

  const { dif, rep } = taskValues(task, settings);
  const k = dif.coef * rep.coef;

  return (
    <tr>
      <td>
        <b>{task.taskName || "(무제 업무)"}</b>
        <div className="breakdown">
          난이도 {dif.coef.toFixed(2)} × 기여도 {rep.coef.toFixed(2)} = W {k.toFixed(2)}
        </div>
        {multiTask && (
          <ImportanceSlider
            value={rawValue}
            displayPct={displayPct}
            onChange={(v) => setTaskPRatio(memberName, mboId, task.uid, v)}
          />
        )}
      </td>
      <td style={{ textAlign: "center" }}>
        <select
          className="task-diff-sel"
          value={task.diffId}
          onChange={(e) => updateTaskCoef(memberName, task.uid, { diffId: e.target.value })}
        >
          {settings.difficulty.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label} ×{d.coef.toFixed(2)}
            </option>
          ))}
        </select>
      </td>
      <td style={{ textAlign: "center" }}>
        <select
          className="task-rep-sel"
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
      <td>
        <button className="delx" title="삭제" onClick={() => deleteTask(memberName, globalIndex)}>
          ✕
        </button>
      </td>
    </tr>
  );
}
