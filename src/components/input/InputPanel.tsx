import { useEffect, useRef, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { useAppStore, useMembers, useSettings, useCurrentMemberName, snapshot } from "../../store/useAppStore";
import type { Task } from "../../types";
import { uid } from "../../lib/defaults";
import { taskValues } from "../../lib/calc";
import { download, ymd6 } from "../../lib/utils";
import { toast } from "../../store/useToastStore";
import MemberSelector from "./MemberSelector";
import TaskAutocomplete from "./TaskAutocomplete";

/** settings 목록에서 선택 유지, 없으면 label 우선순위로 기본값 선택 (vanilla fillSelects). */
function pickId<T extends { id: string; label: string }>(list: T[], keep: string | undefined, preferLabel?: string): string {
  if (keep && list.some((x) => x.id === keep)) return keep;
  if (preferLabel) {
    const byLabel = list.find((x) => x.label === preferLabel);
    if (byLabel) return byLabel.id;
  }
  return list[0]?.id ?? "";
}

export default function InputPanel() {
  const settings = useSettings();
  const members = useMembers();
  const current = useCurrentMemberName();
  const addTask = useAppStore((s) => s.addTask);
  const importMember = useAppStore((s) => s.importMember);
  const importAll = useAppStore((s) => s.importAll);

  const [taskName, setTaskName] = useState("");
  const [mboId, setMboId] = useState(() => pickId(settings.mbo, undefined, "뉴스그래픽 범위와 완성도"));
  const [difficultyId, setDifficultyId] = useState(() => pickId(settings.difficulty, undefined, "일반"));
  const [reportId, setReportId] = useState(() => pickId(settings.report, undefined));
  const [jsonScope, setJsonScope] = useState<"member" | "all">("member");
  const fileRef = useRef<HTMLInputElement>(null);

  // 설정 변경으로 선택 id가 사라지면 기본값으로 보정
  useEffect(() => {
    setMboId((v) => pickId(settings.mbo, v, "뉴스그래픽 범위와 완성도"));
    setDifficultyId((v) => pickId(settings.difficulty, v, "일반"));
    setReportId((v) => pickId(settings.report, v));
  }, [settings]);

  const mbo = settings.mbo.find((x) => x.id === mboId);
  const dif = settings.difficulty.find((x) => x.id === difficultyId);
  const rep = settings.report.find((x) => x.id === reportId);
  const k = (dif?.coef ?? 0) * (rep?.coef ?? 0);

  const onAddTask = () => {
    const n = (current || "").trim();
    if (!n) {
      toast("먼저 팀원을 추가하세요");
      return;
    }
    const name = taskName.trim();
    if (!name) {
      toast("업무명을 입력하세요");
      return;
    }
    if (!mbo || !dif || !rep) return;
    const t: Task = {
      uid: uid(),
      taskName: name,
      mboId: mbo.id,
      mboLabelSnap: mbo.label,
      mboPtsSnap: mbo.pts,
      difficultyId: dif.id,
      difficultyLabelSnap: dif.label,
      difficultyCoefSnap: dif.coef,
      reportId: rep.id,
      reportLabelSnap: rep.label,
      reportCoefSnap: rep.coef,
    };
    addTask(t);
    const { dif: d, rep: r } = taskValues(t, settings);
    toast(`"${name}" 추가됨 · W ${(d.coef * r.coef).toFixed(2)} · 우측에서 항목 S 입력`);
    setTaskName("");
  };

  const onExport = () => {
    if (jsonScope === "all") {
      const snap = snapshot();
      const yrs = Object.keys(snap.years);
      if (!yrs.length) {
        toast("백업할 데이터가 없습니다");
        return;
      }
      const blob = { kind: "newsdesign-all", ver: 3, exportedAt: new Date().toISOString(), years: snap.years, currentYear: snap.currentYear };
      const fname = `뉴디_${ymd6()}.json`;
      download(JSON.stringify(blob, null, 2), "application/json", fname);
      toast(`${fname} 저장 · ${yrs.length}개 연도 전체 백업`);
    } else {
      const n = current;
      if (!n || !members[n]) {
        toast("내보낼 팀원이 없습니다");
        return;
      }
      download(JSON.stringify(members[n], null, 2), "application/json", `MBO_${n}.json`);
      toast(`MBO_${n}.json 저장`);
    }
  };

  const onImportFile = (file: File) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const o = JSON.parse(String(e.target?.result));
        if (jsonScope === "all") {
          if (!o.years || typeof o.years !== "object" || !Object.keys(o.years).length) throw 0;
          const yrs = Object.keys(o.years).sort((a, b) => +b - +a);
          const curN = Object.keys(snapshot().years).length;
          if (!window.confirm(`이 브라우저의 모든 데이터(${curN}개 연도)를 백업 파일 내용(${yrs.length}개 연도: ${yrs.join(", ")})으로 완전히 교체합니다.\n계속할까요?`)) return;
          importAll(o);
          toast(`복원 완료 · ${yrs.length}개 연도`);
        } else {
          if (!o.name || !Array.isArray(o.tasks)) throw 0;
          importMember(o);
          toast(`${o.name} 불러옴 · ${o.tasks.length} 업무`);
        }
      } catch {
        toast(jsonScope === "all" ? "전체 백업 JSON 형식이 올바르지 않습니다" : "JSON 형식이 올바르지 않습니다");
      }
    };
    r.readAsText(file);
  };

  return (
    <section className="border-b border-line bg-surface px-6 py-6 lg:border-b-0 lg:border-r">
      <p className="m-eyebrow">
        입력 · INPUT
        <span className="h-px flex-1 bg-line" />
      </p>
      <MemberSelector />

      <fieldset className="mb-3.5 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <legend className="px-1.5 font-mono text-xs font-bold uppercase tracking-wide text-primary">업무 정의</legend>
        <div>
          <label className="m-label" htmlFor="taskName">
            업무명
          </label>
          <TaskAutocomplete
            value={taskName}
            onChange={setTaskName}
            onPick={({ difficultyId: d, reportId: rId }) => {
              if (d && settings.difficulty.some((x) => x.id === d)) setDifficultyId(d);
              if (rId && settings.report.some((x) => x.id === rId)) setReportId(rId);
            }}
          />
        </div>
        <div className="mt-2.5">
          <label className="m-label" htmlFor="mboSel">
            MBO 항목 (배점)
          </label>
          <select id="mboSel" className="m-input cursor-pointer" value={mboId} onChange={(e) => setMboId(e.target.value)}>
            {settings.mbo.map((item) => {
              const effPts = current && members[current]?.categoryPts?.[item.id] != null ? members[current].categoryPts[item.id] : item.pts;
              const tag = item.choice ? ` [선택 ${effPts}점]` : ` · ${effPts}점`;
              return (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {tag}
                </option>
              );
            })}
          </select>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <div>
            <label className="m-label" htmlFor="difficultySel">
              난이도 계수
            </label>
            <select id="difficultySel" className="m-input cursor-pointer" value={difficultyId} onChange={(e) => setDifficultyId(e.target.value)}>
              {settings.difficulty.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} · ×{d.coef.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="m-label" htmlFor="reportSel">
              기여도 계수
            </label>
            <select id="reportSel" className="m-input cursor-pointer" value={reportId} onChange={(e) => setReportId(e.target.value)}>
              {settings.report.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} · ×{r.coef.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="mb-3 overflow-x-auto rounded-lg bg-[#1a1e2e] px-4 py-3.5 font-mono text-xs leading-relaxed text-white/90">
        <span className="text-muted-2">이 업무의 W =</span> <span className="text-emerald-300">{(dif?.coef ?? 0).toFixed(2)}</span>
        <span className="mx-1 text-muted">×</span>
        <span className="text-emerald-300">{(rep?.coef ?? 0).toFixed(2)}</span> <span className="mx-1 text-muted">=</span>{" "}
        <span className="text-sm font-bold text-white">{k.toFixed(2)}</span>
        <div className="mt-2 border-t border-white/10 pt-2 text-xs text-white/50">
          W = 난이도 × 기여도. 점수는 <b className="text-emerald-300">{mbo?.label}</b> 항목(배점 {mbo?.pts})에서 같은 항목 업무들의{" "}
          <b className="text-white/80">W합계</b>로 환산됩니다.
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button className="m-btn m-btn-secondary w-full" onClick={onAddTask}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          업무 등록
        </button>
        <div className="flex items-stretch gap-2">
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-line bg-surface" role="group" aria-label="JSON 적용 범위">
            <button
              type="button"
              className={
                "whitespace-nowrap px-2.5 text-xs font-semibold transition " +
                (jsonScope === "member" ? "bg-primary text-white" : "text-muted hover:text-primary")
              }
              onClick={() => setJsonScope("member")}
            >
              현재 팀원
            </button>
            <button
              type="button"
              className={
                "whitespace-nowrap border-l border-line px-2.5 text-xs font-semibold transition " +
                (jsonScope === "all" ? "bg-primary text-white" : "text-muted hover:text-primary")
              }
              onClick={() => setJsonScope("all")}
            >
              전체 팀원
            </button>
          </div>
          <button className="m-btn m-btn-sm flex-1 whitespace-nowrap" onClick={onExport}>
            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
            JSON 저장
          </button>
          <button className="m-btn m-btn-sm flex-1 whitespace-nowrap" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
            JSON 열기
          </button>
        </div>
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileRef}
          onChange={(e) => {
            if (e.target.files?.[0]) onImportFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-2.5 rounded-lg border border-line bg-canvas px-3 py-2.5 text-xs leading-relaxed text-muted">
        <b className="text-ink-2">현재 팀원</b>은 선택된 팀원 1명만, <b className="text-ink-2">전체 팀원</b>은 모든 연도·팀원·계수·업무를 하나의 파일로 백업합니다. ⚠ 전체 불러오기 시 현재 브라우저의 모든 데이터가 파일 내용으로 교체됩니다.
      </div>
    </section>
  );
}
