import { useMemo, useState } from "react";
import { useAppStore, useMembers, useSettings } from "../../store/useAppStore";
import type { Task } from "../../types";
import { groupBySimilarity } from "../../lib/similarity";
import { toast } from "../../store/useToastStore";

interface RowTask extends Task {
  _member: string;
}

export default function AllTasksModal({ onClose }: { onClose: () => void }) {
  const members = useMembers();
  const settings = useSettings();
  const updateTaskCoef = useAppStore((s) => s.updateTaskCoef);

  const [query, setQuery] = useState("");
  const [groupSimilar, setGroupSimilar] = useState(true);
  const [edits, setEdits] = useState<Record<string, { diffId: string; reportId: string }>>({});
  const [savedUid, setSavedUid] = useState<string | null>(null);

  const allTasks = useMemo<RowTask[]>(() => {
    const out: RowTask[] = [];
    Object.entries(members).forEach(([name, m]) => {
      (m.tasks || []).forEach((t) => out.push({ ...t, _member: name }));
    });
    return out;
  }, [members]);

  const q = query.trim().toLowerCase();
  const filtered = allTasks.filter((t) => t.taskName && (!q || t.taskName.toLowerCase().includes(q)));

  const sel = (t: RowTask) => edits[t.uid + "@" + t._member] || { diffId: t.diffId, reportId: t.reportId };
  const setSel = (t: RowTask, patch: { diffId?: string; reportId?: string }) =>
    setEdits((prev) => ({ ...prev, [t.uid + "@" + t._member]: { ...sel(t), ...patch } }));

  const onSave = (t: RowTask) => {
    const cur = sel(t);
    updateTaskCoef(t._member, t.uid, { diffId: cur.diffId, reportId: cur.reportId });
    setSavedUid(t.uid + "@" + t._member);
    setTimeout(() => setSavedUid(null), 1500);
    toast(`"${t.taskName}" 계수 업데이트됨`);
  };

  const rowEl = (t: RowTask) => {
    const cur = sel(t);
    const key = t.uid + "@" + t._member;
    return (
      <div className="grid grid-cols-[1fr_130px_160px_28px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition hover:bg-primary-soft" key={key}>
        <div className="truncate font-semibold text-ink" title={t.taskName}>
          {t.taskName}
          <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-2">{t._member}</span>
        </div>
        <select className="m-select py-1 text-[12px]" value={cur.diffId} onChange={(e) => setSel(t, { diffId: e.target.value })}>
          {settings.difficulty.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <select className="m-select py-1 text-[12px]" value={cur.reportId} onChange={(e) => setSel(t, { reportId: e.target.value })}>
          {settings.report.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          className={
            "flex h-[26px] w-[26px] items-center justify-center rounded-md border bg-surface text-[13px] transition " +
            (savedUid === key ? "border-emerald-500 text-emerald-600" : "border-line text-muted hover:border-primary hover:text-primary")
          }
          title="저장"
          onClick={() => onSave(t)}
        >
          {savedUid === key ? "✔" : "✓"}
        </button>
      </div>
    );
  };

  let body: React.ReactNode;
  if (!filtered.length) {
    body = <div className="py-10 text-center text-[13px] text-muted">조건에 맞는 업무가 없습니다</div>;
  } else if (groupSimilar) {
    body = groupBySimilarity(filtered).map((g, gi) => (
      <div className="mb-4" key={gi}>
        <div className="mb-2 border-b border-line pb-2 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted">
          {g.label}
          {g.items.length > 1 && <span className="font-normal"> ({g.items.length}개)</span>}
        </div>
        {g.items.map(({ task }) => rowEl(task as RowTask))}
      </div>
    ));
  } else {
    body = filtered.map((t) => rowEl(t));
  }

  return (
    <div className="m-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="m-modal max-w-[780px]">
        <div className="m-modal-header">
          <span className="m-mark">ALL</span>
          <h2 className="flex-1 text-base font-bold">
            모든 업무 <span className="text-[13px] font-normal text-muted">({filtered.length}개)</span>
          </h2>
          <button className="m-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 pb-2.5 pt-3.5">
            <input
              type="text"
              placeholder="업무명 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="m-input min-w-[160px] flex-1 py-2"
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" className="accent-primary" checked={groupSimilar} onChange={(e) => setGroupSimilar(e.target.checked)} /> 유사 업무 묶기
            </label>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3.5">{body}</div>
        </div>
      </div>
    </div>
  );
}
