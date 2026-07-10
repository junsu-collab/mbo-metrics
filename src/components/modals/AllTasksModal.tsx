"use client";

import { useMemo, useState } from "react";

import { collectAllTasks, groupBySimilarity, type OwnedTask } from "@/lib/similarity";
import { selectYearData } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import { useUiStore } from "@/store/useUiStore";
import type { Settings } from "@/types";

import { Modal } from "../shared/Modal";

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}

function AllTaskRow({ ot, settings }: { ot: OwnedTask; settings: Settings }) {
  const updateTaskCoefForMember = useAppStore((s) => s.updateTaskCoefForMember);
  const [diffId, setDiffId] = useState(ot.task.diffId);
  const [reportId, setReportId] = useState(ot.task.reportId);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateTaskCoefForMember(ot.memberName, ot.task.uid, { diffId, reportId });
    setSaved(true);
    toast(`"${ot.task.taskName}" 계수 업데이트됨`);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="grid grid-cols-[1fr_130px_160px_28px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors hover:bg-accent-soft">
      <div className="truncate font-semibold" title={ot.task.taskName}>
        {ot.task.taskName}
      </div>
      <select
        value={diffId}
        onChange={(e) => setDiffId(e.target.value)}
        className="cursor-pointer rounded-md border border-line-2 bg-white px-1.5 py-1 text-xs"
      >
        {settings.difficulty.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
      <select
        value={reportId}
        onChange={(e) => setReportId(e.target.value)}
        className="cursor-pointer rounded-md border border-line-2 bg-white px-1.5 py-1 text-xs"
      >
        {settings.report.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        title="저장"
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-md border text-[13px] transition-colors ${
          saved ? "border-green text-green" : "border-line text-muted hover:border-accent hover:text-accent"
        }`}
      >
        {saved ? "✔" : "✓"}
      </button>
    </div>
  );
}

export function AllTasksModal() {
  const open = useUiStore((s) => s.modal === "allTasks");
  const closeModal = useUiStore((s) => s.closeModal);
  const yearData = useAppStore(selectYearData);

  const [search, setSearch] = useState("");
  const [groupSimilar, setGroupSimilar] = useState(true);

  const settings = yearData?.settings;
  const allTasks = useMemo(() => collectAllTasks(yearData?.members ?? {}), [yearData?.members]);
  const filtered = useMemo(
    () => allTasks.filter((t) => t.task.taskName && (!search || t.task.taskName.toLowerCase().includes(search.toLowerCase()))),
    [allTasks, search]
  );
  const groups = useMemo(() => (groupSimilar ? groupBySimilarity(filtered) : null), [groupSimilar, filtered]);

  if (!open || !settings) return null;

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={
        <>
          모든 업무 <span className="text-[13px] font-normal text-muted">({filtered.length}개)</span>
        </>
      }
      mark="ALL"
      wide
    >
      <div className="-mx-[22px] -mt-5 mb-3.5 flex flex-wrap items-center gap-2 border-b border-line px-[22px] pb-2.5 pt-3.5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업무명 검색…"
          className="min-w-[160px] flex-1 rounded-lg border border-line-2 px-2.5 py-1.5 text-[13px]"
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={groupSimilar} onChange={(e) => setGroupSimilar(e.target.checked)} />
          유사 업무 묶기
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted">조건에 맞는 업무가 없습니다</div>
      ) : groups ? (
        groups.map((g) => (
          <div key={g.label + g.items.length} className="mb-4.5">
            <div className="mb-2 border-b border-line pb-1 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted">
              {highlight(g.label, search)}
              {g.items.length > 1 && <span className="font-normal"> ({g.items.length}개)</span>}
            </div>
            {g.items.map((ot) => (
              <AllTaskRow key={ot.task.uid} ot={ot} settings={settings} />
            ))}
          </div>
        ))
      ) : (
        filtered.map((ot) => <AllTaskRow key={ot.task.uid} ot={ot} settings={settings} />)
      )}
    </Modal>
  );
}
