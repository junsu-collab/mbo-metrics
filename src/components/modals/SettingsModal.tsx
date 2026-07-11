import { useState } from "react";
import { useAppStore, useSettings } from "../../store/useAppStore";
import type { CoefItem, MboItem, Settings } from "../../types";
import { defaults, uid } from "../../lib/defaults";
import { clone } from "../../lib/utils";
import { toast } from "../../store/useToastStore";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const updateSettings = useAppStore((s) => s.updateSettings);

  const init = () => clone(settings);
  const [diff, setDiff] = useState<CoefItem[]>(() => init().difficulty);
  const [report, setReport] = useState<CoefItem[]>(() => init().report);
  const [mboFixed, setMboFixed] = useState<MboItem[]>(() => init().mbo.filter((x) => x.fixed || !x.choice));
  const [mboChoice, setMboChoice] = useState<MboItem[]>(() => init().mbo.filter((x) => x.choice));
  const [wLeader, setWLeader] = useState<number>(() => settings.defaultWLeader);
  const [choiceTarget, setChoiceTarget] = useState<number>(() => settings.choiceTarget ?? 40);

  const wMember = 100 - wLeader;

  const loadFrom = (s: Settings) => {
    setDiff(s.difficulty);
    setReport(s.report);
    setMboFixed(s.mbo.filter((x) => x.fixed || !x.choice));
    setMboChoice(s.mbo.filter((x) => x.choice));
    setWLeader(s.defaultWLeader);
    setChoiceTarget(s.choiceTarget ?? 40);
  };

  const onReset = () => {
    if (!window.confirm("모든 계수를 문서 기본값으로 되돌릴까요? (등록된 업무 데이터는 유지됩니다)")) return;
    loadFrom(clone(defaults()));
    toast("기본값으로 초기화 (저장하려면 적용 누르기)");
  };

  const onSave = () => {
    const def = defaults();
    const collectMbo = (list: MboItem[], isChoice: boolean): MboItem[] =>
      list.map((item) => {
        const orig = def.mbo.find((x) => x.id === item.id);
        const obj: MboItem = { id: item.id, label: item.label.trim() || "(무제)", pts: +item.pts || 0 };
        if (orig?.fixed) obj.fixed = true;
        else if (orig?.choice || isChoice) obj.choice = true;
        else obj.fixed = true;
        return obj;
      });
    const next: Settings = {
      mbo: [...collectMbo(mboFixed, false), ...collectMbo(mboChoice, true)],
      difficulty: diff.map((d) => ({ id: d.id, label: d.label.trim() || "(무제)", coef: +d.coef || 0, def: d.def })),
      report: report.map((r) => ({ id: r.id, label: r.label.trim() || "(무제)", coef: +r.coef || 0, def: r.def })),
      defaultWLeader: Math.min(100, Math.max(0, wLeader || 0)),
      defaultWMember: Math.min(100, Math.max(0, wMember || 0)),
      choiceTarget: Math.max(10, Math.round((choiceTarget || 40) / 10) * 10),
    };
    if (next.defaultWLeader + next.defaultWMember !== 100) next.defaultWMember = 100 - next.defaultWLeader;
    updateSettings(next);
    onClose();
    toast("계수 적용됨 · 점수 재계산 완료");
  };

  const coefRows = (list: CoefItem[], set: (l: CoefItem[]) => void) =>
    list.map((item, i) => (
      <div className="mb-2 grid grid-cols-[100px_1fr_80px] items-center gap-2" key={item.id}>
        <input
          type="text"
          className="rounded-lg border border-line px-2.5 py-2 text-[13px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={item.label}
          onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
        />
        <span className="truncate rounded-lg border border-line bg-canvas px-2.5 py-2 text-[11.5px] text-muted" title={item.def || ""}>
          {item.def || ""}
        </span>
        <input
          type="number"
          step={0.01}
          className="rounded-lg border border-line px-2.5 py-2 text-center font-mono text-[13px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={item.coef}
          onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, coef: parseFloat(e.target.value) } : x)))}
        />
      </div>
    ));

  const mboRows = (list: MboItem[], set: (l: MboItem[]) => void) =>
    list.map((item, i) => (
      <div className="mb-2 grid grid-cols-[1fr_92px_36px] items-center gap-2" key={item.id}>
        <input
          type="text"
          className="rounded-lg border border-line px-2.5 py-2 text-[13px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={item.label}
          onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
        />
        {item.choice ? (
          <span className="flex h-8 items-center justify-center rounded-lg border border-dashed border-line bg-canvas font-mono text-[11.5px] text-muted">
            자율
          </span>
        ) : (
          <input
            type="number"
            step={1}
            className="rounded-lg border border-line px-2.5 py-2 text-center font-mono text-[13px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={item.pts}
            onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, pts: parseInt(e.target.value) || 0 } : x)))}
          />
        )}
        <button
          className="m-icon-btn"
          title="삭제"
          onClick={() => {
            if (list.length <= 1) {
              toast("최소 1개 단계는 있어야 합니다");
              return;
            }
            set(list.filter((_, j) => j !== i));
          }}
        >
          ✕
        </button>
      </div>
    ));

  const addRowBtn = (label: string, onClick: () => void, mt = false) => (
    <button
      className={
        "w-full rounded-xl border border-dashed border-line px-3.5 py-2 text-xs text-muted transition hover:border-primary hover:bg-primary-soft hover:text-primary " +
        (mt ? "mt-2.5" : "mt-1")
      }
      onClick={onClick}
    >
      {label}
    </button>
  );

  const cHead = (withDef: boolean) => (
    <div
      className={
        "mb-1.5 grid gap-2 px-0.5 font-mono text-[10.5px] tracking-wide text-muted " +
        (withDef ? "grid-cols-[100px_1fr_80px]" : "grid-cols-[1fr_92px_36px]")
      }
    >
      {withDef ? (
        <>
          <span>단계 이름</span>
          <span>단계 정의</span>
          <span className="text-center">계수(×)</span>
        </>
      ) : (
        <>
          <span>항목 이름</span>
          <span className="text-center">배점</span>
          <span></span>
        </>
      )}
    </div>
  );

  const block = "mb-5 border-b border-line pb-5 last:mb-0 last:border-b-0 last:pb-0";

  return (
    <div className="m-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="m-modal">
        <div className="m-modal-header">
          <span className="m-mark">SET</span>
          <h2 className="flex-1 text-base font-bold">설정</h2>
          <button className="m-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="m-modal-body">
          <div className="rounded-lg bg-primary-soft px-3 py-2 text-[11.5px] leading-relaxed text-ink-2">
            계수를 바꾸면 모든 팀원의 항목 점수가 즉시 재계산됩니다.
          </div>

          <div className={block + " mt-4"}>
            <h3 className="mb-1 text-[13px] font-bold text-ink">난이도 계수</h3>
            <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted">
              기본값: 단순 0.95 · 일반 1.00 · 복합 1.05 · 전문 1.10 · 전략 1.15. 계수 범위는 좁게 유지하는 게 좋습니다. 점수 간 변별력은 계수보다 항목 배점으로 조정하세요.
            </p>
            {cHead(true)}
            {coefRows(diff, setDiff)}
          </div>

          <div className={block}>
            <h3 className="mb-1 text-[13px] font-bold text-ink">기여도 계수</h3>
            <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted">초기값: 낮음 1.00 · 보통 1.10 · 높음 1.20</p>
            {cHead(true)}
            {coefRows(report, setReport)}
          </div>

          <div className={block}>
            <h3 className="mb-1 text-[13px] font-bold text-ink">MBO 항목 배점</h3>
            <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted">
              공통 항목 배점은 고정, 선택 항목 배점은 합계 내에서 자율 조정
            </p>
            {cHead(false)}
            <div className="mb-1 border-b border-dashed border-line pb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
              공통 항목
            </div>
            {mboRows(mboFixed, setMboFixed)}
            {addRowBtn("＋ 공통 추가", () => setMboFixed([...mboFixed, { id: uid(), label: "", pts: 0, fixed: true }]))}
            <div className="mb-1 mt-2.5 border-b border-dashed border-line pb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
              선택 항목
            </div>
            {mboRows(mboChoice, setMboChoice)}
            {addRowBtn("＋ 선택 추가", () => setMboChoice([...mboChoice, { id: uid(), label: "", pts: 0, choice: true }]))}
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2.5 py-2 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <label className="flex-1 text-[11.5px] text-muted">선택 항목 합계 배점 목표</label>
              <input
                type="number"
                min={10}
                max={200}
                step={10}
                className="w-16 rounded-md border border-line px-2 py-1.5 text-center font-mono text-[13px] font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={choiceTarget}
                onChange={(e) => setChoiceTarget(parseInt(e.target.value) || 0)}
              />
              <span className="text-[11.5px] text-muted">점</span>
            </div>
          </div>

          <div className={block}>
            <h3 className="mb-1 text-[13px] font-bold text-ink">수행평가(S) 가중치 · 전역</h3>
            <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted">
              팀장과 팀원의 수행점수를 합산할 때 적용하는 비율입니다. 전체 팀원·항목에 동일하게 적용되며, 팀장 70% · 팀원 30%를 권장합니다.
            </p>
            <div className="mb-2 flex items-center gap-3">
              <div className="min-w-[72px] font-mono text-[12.5px] font-bold text-primary">
                팀장 <span className="text-lg">{wLeader}</span>%
              </div>
              <input
                type="range"
                className="h-1.5 flex-1 cursor-pointer accent-primary"
                min={0}
                max={100}
                step={5}
                value={wLeader}
                onChange={(e) => setWLeader(+e.target.value)}
              />
              <div className="min-w-[72px] text-right font-mono text-[12.5px] font-bold text-brand-violet">
                팀원 <span className="text-lg">{wMember}</span>%
              </div>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
              <div className="rounded-l-full bg-primary transition-all" style={{ width: wLeader + "%" }} />
              <div className="flex-1 rounded-r-full bg-brand-violet transition-all" />
            </div>
          </div>
        </div>
        <div className="m-modal-foot">
          <button className="m-btn" onClick={onReset}>
            문서 기본값으로 초기화
          </button>
          <button className="m-btn m-btn-primary" onClick={onSave}>
            저장하고 적용
          </button>
        </div>
      </div>
    </div>
  );
}
