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
      <div className="crow" key={item.id}>
        <input type="text" value={item.label} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
        <span className="cdef" title={item.def || ""}>
          {item.def || ""}
        </span>
        <input
          className="cval"
          type="number"
          step={0.01}
          value={item.coef}
          onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, coef: parseFloat(e.target.value) } : x)))}
        />
      </div>
    ));

  const mboRows = (list: MboItem[], set: (l: MboItem[]) => void) =>
    list.map((item, i) => (
      <div className="crow no-def" key={item.id}>
        <input type="text" value={item.label} onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
        {item.choice ? (
          <span className="cval-auto">자율</span>
        ) : (
          <input
            className="cval"
            type="number"
            step={1}
            value={item.pts}
            onChange={(e) => set(list.map((x, j) => (j === i ? { ...x, pts: parseInt(e.target.value) || 0 } : x)))}
          />
        )}
        <button
          className="rm"
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

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header>
          <span className="mark" style={{ background: "var(--accent)" }}>
            SET
          </span>
          <h2>전체 설정</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="body">
          <div className="note">계수를 바꾸면 모든 팀원의 항목 점수가 즉시 재계산됩니다.</div>

          <div className="sblock" style={{ marginTop: 18 }}>
            <h3>난이도 계수</h3>
            <p className="desc">
              기본값: 단순 0.95 · 일반 1.00 · 복합 1.05 · 전문 1.10 · 전략 1.15. 계수 범위는 좁게 유지하는 게 좋습니다. 점수 간 변별력은 계수보다 항목 배점으로 조정하세요.
            </p>
            <div className="chead with-def">
              <span>단계 이름</span>
              <span>단계 정의</span>
              <span style={{ textAlign: "center" }}>계수(×)</span>
              <span></span>
            </div>
            {coefRows(diff, setDiff)}
          </div>

          <div className="sblock">
            <h3>기여도 계수</h3>
            <p className="desc">초기값: 낮음 1.00 · 보통 1.10 · 높음 1.20</p>
            <div className="chead with-def">
              <span>단계 이름</span>
              <span>단계 정의</span>
              <span style={{ textAlign: "center" }}>계수(×)</span>
              <span></span>
            </div>
            {coefRows(report, setReport)}
          </div>

          <div className="sblock">
            <h3>MBO 항목 배점</h3>
            <p className="desc">원칙상 팀장 조정 불가.</p>
            <div className="chead">
              <span>항목 이름</span>
              <span style={{ textAlign: "center" }}>배점</span>
              <span></span>
            </div>
            <div className="mbo-group-label">공통 항목</div>
            {mboRows(mboFixed, setMboFixed)}
            <button className="addrow" onClick={() => setMboFixed([...mboFixed, { id: uid(), label: "", pts: 0, fixed: true }])}>
              ＋ 공통 추가
            </button>
            <div className="mbo-group-label" style={{ marginTop: 10 }}>
              선택 항목
            </div>
            {mboRows(mboChoice, setMboChoice)}
            <button className="addrow" onClick={() => setMboChoice([...mboChoice, { id: uid(), label: "", pts: 0, choice: true }])}>
              ＋ 선택 추가
            </button>
            <div className="choice-target-row">
              <label>선택 항목 합계 배점 목표</label>
              <input type="number" min={10} max={200} step={10} value={choiceTarget} onChange={(e) => setChoiceTarget(parseInt(e.target.value) || 0)} />
              <span>점</span>
            </div>
          </div>

          <div className="sblock">
            <h3>수행평가(S) 가중치 · 전역</h3>
            <p className="desc">
              팀장과 팀원의 수행점수를 합산할 때 적용하는 비율입니다. 전체 팀원·항목에 동일하게 적용되며, 팀장 70% · 팀원 30%를 권장합니다.
            </p>
            <div className="weight-split">
              <div className="ws-label leader">
                팀장 <span className="ws-val">{wLeader}</span>%
              </div>
              <input
                type="range"
                className="ws-slider"
                min={0}
                max={100}
                step={5}
                value={wLeader}
                onChange={(e) => setWLeader(+e.target.value)}
              />
              <div className="ws-label member">
                팀원 <span className="ws-val">{wMember}</span>%
              </div>
            </div>
            <div className="ws-bar">
              <div className="ws-bar-leader" style={{ width: wLeader + "%" }} />
              <div className="ws-bar-member" style={{ width: wMember + "%" }} />
            </div>
          </div>
        </div>
        <div className="foot">
          <button className="btn" onClick={onReset}>
            문서 기본값으로 초기화
          </button>
          <button className="btn primary" onClick={onSave}>
            저장하고 적용
          </button>
        </div>
      </div>
    </div>
  );
}
