"use client";

import { useMemo, useRef, useState } from "react";

import { getSuggestions, type TaskSuggestion } from "@/lib/autocomplete";
import { exportAllBackup, exportMemberJson, readAllBackup, readMemberJson } from "@/lib/backup";
import { btn } from "@/lib/ui";
import { selectCurrentMember, selectCurrentMemberName, selectSettings, selectYearData } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";

import { TaskAutocomplete } from "./TaskAutocomplete";

export function TaskForm() {
  const settings = useAppStore(selectSettings);
  const yearData = useAppStore(selectYearData);
  const currentMemberName = useAppStore(selectCurrentMemberName);
  const currentMember = useAppStore(selectCurrentMember);
  const addTask = useAppStore((s) => s.addTask);
  const importMember = useAppStore((s) => s.importMember);
  const importAll = useAppStore((s) => s.importAll);

  const [taskName, setTaskName] = useState("");
  const [mboIdState, setMboId] = useState(
    () => settings.mbo.find((x) => x.label === "뉴스그래픽 범위와 완성도")?.id || settings.mbo[0]?.id || ""
  );
  const [diffIdState, setDiffId] = useState(
    () => settings.difficulty.find((x) => x.label === "일반")?.id || settings.difficulty[0]?.id || ""
  );
  const [reportIdState, setReportId] = useState(() => settings.report[0]?.id || "");
  const [jsonScope, setJsonScope] = useState<"member" | "all">("member");
  const [acOpen, setAcOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const fileRef = useRef<HTMLInputElement>(null);

  // 선택된 id가 설정 변경으로 사라졌으면 렌더링 시점에 기본값으로 보정 (state 동기화 effect 대신 파생값 사용)
  const mboId = settings.mbo.find((x) => x.id === mboIdState)
    ? mboIdState
    : settings.mbo.find((x) => x.label === "뉴스그래픽 범위와 완성도")?.id || settings.mbo[0]?.id || "";
  const diffId = settings.difficulty.find((x) => x.id === diffIdState)
    ? diffIdState
    : settings.difficulty.find((x) => x.label === "일반")?.id || settings.difficulty[0]?.id || "";
  const reportId = settings.report.find((x) => x.id === reportIdState) ? reportIdState : settings.report[0]?.id || "";

  const suggestions = useMemo(
    () => getSuggestions(taskName, currentMemberName, yearData?.members ?? {}),
    [taskName, currentMemberName, yearData]
  );

  const mboItem = settings.mbo.find((x) => x.id === mboId);
  const difItem = settings.difficulty.find((x) => x.id === diffId);
  const repItem = settings.report.find((x) => x.id === reportId);
  const k = (difItem?.coef ?? 0) * (repItem?.coef ?? 0);
  const effPts = mboItem ? currentMember?.categoryPts?.[mboItem.id] ?? mboItem.pts : 0;

  function handlePick(item: TaskSuggestion) {
    setTaskName(item.taskName);
    if (item.diffId && settings.difficulty.find((d) => d.id === item.diffId)) setDiffId(item.diffId);
    if (item.reportId && settings.report.find((r) => r.id === item.reportId)) setReportId(item.reportId);
    setAcOpen(false);
    setActiveIdx(-1);
    toast(`"${item.taskName}" 자동완성 · ${item.from}의 설정 적용됨`);
  }

  function handleAddTask() {
    if (!currentMemberName) {
      toast("먼저 팀원을 추가하세요 (다른 팀원 입력)");
      return;
    }
    const name = taskName.trim();
    if (!name) {
      toast("업무명을 입력하세요");
      return;
    }
    if (!mboItem || !difItem || !repItem) return;
    addTask({
      taskName: name,
      mboId: mboItem.id,
      mboLabelSnap: mboItem.label,
      mboPtsSnap: mboItem.pts,
      diffId: difItem.id,
      diffLabelSnap: difItem.label,
      diffCoefSnap: difItem.coef,
      reportId: repItem.id,
      reportLabelSnap: repItem.label,
      reportCoefSnap: repItem.coef,
    });
    setTaskName("");
    toast(`"${name}" 추가됨 · W ${k.toFixed(2)} · 우측에서 항목 S 입력`);
  }

  function handleExport() {
    if (jsonScope === "all") {
      const { years, currentYear } = useAppStore.getState();
      const ok = exportAllBackup(years, currentYear);
      if (!ok) {
        toast("백업할 데이터가 없습니다");
        return;
      }
      toast(`백업 저장 · ${Object.keys(years).length}개 연도 전체 백업`);
    } else {
      if (!currentMember) {
        toast("내보낼 팀원이 없습니다");
        return;
      }
      exportMemberJson(currentMember);
      toast(`MBO_${currentMember.name}.json 저장`);
    }
  }

  async function handleImportFile(file: File) {
    try {
      if (jsonScope === "all") {
        const backup = await readAllBackup(file);
        const curN = Object.keys(useAppStore.getState().years).length;
        const yrs = Object.keys(backup.years).sort((a, b) => Number(b) - Number(a));
        if (
          !window.confirm(
            `이 브라우저의 모든 데이터(${curN}개 연도)를 백업 파일 내용(${yrs.length}개 연도: ${yrs.join(
              ", "
            )})으로 완전히 교체합니다.\n계속할까요?`
          )
        ) {
          return;
        }
        importAll(backup);
        toast(`복원 완료 · ${yrs.length}개 연도`);
      } else {
        const member = await readMemberJson(file);
        importMember(member);
        toast(`${member.name} 불러옴 · ${member.tasks.length} 업무`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "가져오기에 실패했습니다");
    }
  }

  const selectCls =
    "w-full rounded-lg border border-line-2 bg-white px-2.5 py-2 transition-colors focus:border-accent focus:outline-2 focus:outline-accent";
  const labelCls = "mb-1 block text-[11.5px] font-semibold text-ink-2";

  return (
    <>
      <fieldset className="mb-3.5 rounded-[10px] border border-line bg-white p-3.5 px-4 shadow-[var(--shadow)]">
        <legend className="rounded px-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-accent">
          업무 정의
        </legend>
        <div>
          <label htmlFor="taskName" className={labelCls}>
            업무명
          </label>
          <div className="relative">
            <input
              id="taskName"
              type="text"
              autoComplete="off"
              placeholder="예: 고품질 AI 인포그래픽 제작"
              value={taskName}
              onChange={(e) => {
                setTaskName(e.target.value);
                setAcOpen(true);
                setActiveIdx(-1);
              }}
              onKeyDown={(e) => {
                if (!acOpen || !suggestions.length) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && activeIdx >= 0) {
                  e.preventDefault();
                  handlePick(suggestions[activeIdx]);
                } else if (e.key === "Escape") {
                  setAcOpen(false);
                  setActiveIdx(-1);
                }
              }}
              onBlur={() => setTimeout(() => setAcOpen(false), 120)}
              className={selectCls}
            />
            {acOpen && (
              <TaskAutocomplete items={suggestions} query={taskName} activeIndex={activeIdx} onPick={handlePick} />
            )}
          </div>
        </div>
        <div className="mt-2.5">
          <label htmlFor="mboSel" className={labelCls}>
            MBO 항목 (배점)
          </label>
          <select id="mboSel" value={mboId} onChange={(e) => setMboId(e.target.value)} className={selectCls}>
            {settings.mbo.map((item) => {
              const ep = currentMember?.categoryPts?.[item.id] ?? item.pts;
              return (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.choice ? ` [선택 ${ep}점]` : ` · ${ep}점`}
                </option>
              );
            })}
          </select>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="diffSel" className={labelCls}>
              난이도 계수
            </label>
            <select id="diffSel" value={diffId} onChange={(e) => setDiffId(e.target.value)} className={selectCls}>
              {settings.difficulty.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} · ×{d.coef.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="reportSel" className={labelCls}>
              기여도 계수
            </label>
            <select id="reportSel" value={reportId} onChange={(e) => setReportId(e.target.value)} className={selectCls}>
              {settings.report.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} · ×{r.coef.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="mb-3.5 rounded-lg border border-accent/20 bg-accent-soft px-3.5 py-2.5 text-xs leading-relaxed text-ink-2">
        수행결과(S·1~5점)는 MBO 항목마다 한 번 입력합니다. 오른쪽 각 항목 블록에서 팀장·팀원 점수를 선택하세요. 같은
        항목에 업무가 여러 개면 중요도 슬라이더로 각 업무의 반영 비중을 조정할 수 있습니다.
      </div>

      <div className="mb-3.5 rounded-[10px] border border-[#37383c] bg-[#1b1c1e] px-4 py-3.5 font-mono text-xs leading-[1.9] text-[#f7f7f8]">
        <span className="text-[#70737c]">이 업무의 W =</span>{" "}
        <span className="text-[#4f95ff]">{(difItem?.coef ?? 0).toFixed(2)}</span>
        <span className="mx-0.5 text-[#5a5c63]">×</span>
        <span className="text-[#4f95ff]">{(repItem?.coef ?? 0).toFixed(2)}</span>{" "}
        <span className="text-[#5a5c63]">=</span>{" "}
        <span className="text-sm font-bold text-white">{k.toFixed(2)}</span>
        <div className="mt-2 border-t border-dashed border-[#37383c] pt-2 text-[11px] text-[#989ba2]">
          W = 난이도 × 기여도. 점수는{" "}
          <b className="text-[#69a5ff]">{mboItem?.label}</b> 항목(배점 {effPts})에서 같은 항목 업무들의{" "}
          <b>가중 합계</b>로 환산됩니다.
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          onClick={handleAddTask}
          className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          ＋ 업무 등록
        </button>
        <div className="inline-flex overflow-hidden rounded-lg border border-line-2 bg-white">
          <button
            type="button"
            onClick={() => setJsonScope("member")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              jsonScope === "member" ? "bg-accent text-white" : "text-muted hover:text-accent"
            }`}
          >
            현재 팀원
          </button>
          <button
            type="button"
            onClick={() => setJsonScope("all")}
            className={`border-l border-line-2 px-3 py-2 text-xs font-semibold transition-colors ${
              jsonScope === "all" ? "bg-accent text-white" : "text-muted hover:text-accent"
            }`}
          >
            전체 팀원
          </button>
        </div>
        <button onClick={handleExport} className={btn}>
          JSON 내보내기
        </button>
        <button onClick={() => fileRef.current?.click()} className={btn}>
          JSON 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-2.5 rounded-lg border border-line bg-paper px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        <b>현재 팀원</b>은 선택된 팀원 1명만, <b>전체 팀원</b>은 모든 연도·팀원·계수·업무를 하나의 파일로 백업합니다.
        ⚠ 전체 불러오기 시 현재 브라우저의 모든 데이터가 파일 내용으로 교체됩니다.
      </div>
    </>
  );
}
