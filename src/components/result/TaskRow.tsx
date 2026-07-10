"use client";

import { taskValues } from "@/lib/calc";
import { useAppStore } from "@/store/useAppStore";
import type { CoefficientItem, Settings, Task } from "@/types";

import { ImportanceSlider } from "./ImportanceSlider";

interface Props {
  task: Task;
  memberName: string;
  mboId: string;
  settings: Settings;
  showSlider: boolean;
  wPct: number;
}

export function TaskRow({ task, memberName, mboId, settings, showSlider, wPct }: Props) {
  const updateTaskCoefForMember = useAppStore((s) => s.updateTaskCoefForMember);
  const setTaskPRatio = useAppStore((s) => s.setTaskPRatio);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const { dif, rep } = taskValues(task, settings);
  const k = dif.coef * rep.coef;

  const selectCls =
    "w-full max-w-[170px] rounded-md border border-line-2 bg-white px-1.5 py-1 text-[11.5px] transition-colors focus:border-transparent focus:outline-2 focus:outline-accent";

  const renderOptions = (list: CoefficientItem[]) =>
    list.map((c) => (
      <option key={c.id} value={c.id}>
        {c.label} ×{c.coef.toFixed(2)}
      </option>
    ));

  return (
    <tr>
      <td className="border-b border-line px-2.5 py-2 align-top">
        <b>{task.taskName || "(무제 업무)"}</b>
        <div className="mt-0.5 font-mono text-[10.5px] leading-snug text-muted">
          난이도 {dif.coef.toFixed(2)} × 기여도 {rep.coef.toFixed(2)} = W {k.toFixed(2)}
        </div>
        {showSlider && (
          <ImportanceSlider value={wPct} onChange={(v) => setTaskPRatio(mboId, task.uid, v)} />
        )}
      </td>
      <td className="border-b border-line px-2.5 py-2 text-center align-top">
        <select
          value={task.diffId}
          onChange={(e) => updateTaskCoefForMember(memberName, task.uid, { diffId: e.target.value })}
          className={selectCls}
        >
          {renderOptions(settings.difficulty)}
        </select>
      </td>
      <td className="border-b border-line px-2.5 py-2 text-center align-top">
        <select
          value={task.reportId}
          onChange={(e) => updateTaskCoefForMember(memberName, task.uid, { reportId: e.target.value })}
          className={selectCls}
        >
          {renderOptions(settings.report)}
        </select>
      </td>
      <td className="border-b border-line px-2.5 py-2 align-top">
        <button
          onClick={() => deleteTask(task.uid)}
          title="삭제"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-sm text-muted transition-colors hover:border-warn hover:bg-[#fff5f5] hover:text-warn"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
