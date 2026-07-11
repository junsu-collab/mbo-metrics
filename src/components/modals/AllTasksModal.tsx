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
      <div className="at-row" key={key}>
        <div className="at-name" title={t.taskName}>
          {t.taskName}
        </div>
        <select className="at-diff" value={cur.diffId} onChange={(e) => setSel(t, { diffId: e.target.value })}>
          {settings.difficulty.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <select className="at-rep" value={cur.reportId} onChange={(e) => setSel(t, { reportId: e.target.value })}>
          {settings.report.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button className={"at-save" + (savedUid === key ? " saved" : "")} title="저장" onClick={() => onSave(t)}>
          {savedUid === key ? "✔" : "✓"}
        </button>
      </div>
    );
  };

  let body: React.ReactNode;
  if (!filtered.length) {
    body = <div className="at-empty">조건에 맞는 업무가 없습니다</div>;
  } else if (groupSimilar) {
    body = groupBySimilarity(filtered).map((g, gi) => (
      <div className="at-group" key={gi}>
        <div className="at-group-hd">
          {g.label}
          {g.items.length > 1 && <span style={{ fontWeight: 400 }}> ({g.items.length}개)</span>}
        </div>
        {g.items.map(({ task }) => rowEl(task as RowTask))}
      </div>
    ));
  } else {
    body = filtered.map((t) => rowEl(t));
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide" style={{ maxWidth: 780 }}>
        <header>
          <span className="mark" style={{ background: "var(--accent)" }}>
            ALL
          </span>
          <h2>
            모든 업무{" "}
            <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>({filtered.length}개)</span>
          </h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="body" style={{ padding: 0 }}>
          <div
            style={{
              padding: "14px 20px 10px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="업무명 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: "7px 11px", border: "1px solid var(--line-2)", borderRadius: 8, fontSize: 13 }}
            />
            <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <input type="checkbox" checked={groupSimilar} onChange={(e) => setGroupSimilar(e.target.checked)} /> 유사 업무 묶기
            </label>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "14px 20px" }}>{body}</div>
        </div>
      </div>
    </div>
  );
}
