import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore, useMembers, useSettings, useGutOrder } from "../../store/useAppStore";
import type { CoefItem, MemberData } from "../../types";
import { getP } from "../../lib/calc";
import { clone } from "../../lib/utils";
import { toast } from "../../store/useToastStore";

const D_MIN = 0.8;
const D_MAX = 1.3;

function pickCoef(list: CoefItem[], id: string, snapLabel: string | undefined, snapVal: number | undefined): { label: string; coef: number } {
  const f = list.find((x) => x.id === id);
  if (f) return { label: f.label, coef: f.coef };
  return { label: snapLabel ?? "", coef: snapVal ?? 0 };
}

/** 드래그 슬라이더 (vanilla buildGroup 재현). fraction 0~1 위치, 이동 시 onRatio 호출. */
function DragSlider({
  fraction,
  rangeLo,
  rangeHi,
  color,
  onRatio,
}: {
  fraction: number;
  rangeLo?: number;
  rangeHi?: number;
  color: string;
  onRatio: (ratio: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = (fraction * 100).toFixed(2) + "%";

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const move = (ev: MouseEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      let ratio = (ev.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      onRatio(ratio);
    };
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  };

  return (
    <div ref={trackRef} style={{ position: "relative", flex: 1, height: 20, display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--line)" }} />
      {rangeLo != null && rangeHi != null && (
        <div
          style={{
            position: "absolute",
            height: 4,
            borderRadius: 2,
            background: "var(--accent-soft)",
            border: "1px solid var(--line-2)",
            left: (rangeLo * 100).toFixed(2) + "%",
            width: ((rangeHi - rangeLo) * 100).toFixed(2) + "%",
          }}
        />
      )}
      <div style={{ position: "absolute", left: 0, height: 4, borderRadius: 2, background: color, opacity: 0.5, width: pct }} />
      <div
        onMouseDown={startDrag}
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: color,
          border: "2.5px solid #fff",
          cursor: "grab",
          transform: "translateX(-50%)",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
          left: pct,
        }}
      />
    </div>
  );
}

export default function SimulatorModal({ onClose }: { onClose: () => void }) {
  const members = useMembers();
  const settings = useSettings();
  const storedGut = useGutOrder();
  const applySim = useAppStore((s) => s.applySim);
  const setGutOrder = useAppStore((s) => s.setGutOrder);

  const [simDiff, setSimDiff] = useState<CoefItem[]>(() => clone(settings.difficulty));
  const [simReport, setSimReport] = useState<CoefItem[]>(() => clone(settings.report));
  const [simWL, setSimWL] = useState<number>(() => settings.defaultWLeader);
  const [gut, setGut] = useState<string[]>([]);
  const [tooFew, setTooFew] = useState(false);

  const computeTotal = useMemo(() => {
    return (m: MemberData): number => {
      const wl = simWL / 100;
      const wm = (100 - simWL) / 100;
      const imp = Math.max(...simDiff.map((d) => d.coef), 0.0001);
      const rep = Math.max(...simReport.map((r) => r.coef), 0.0001);
      const ceil = imp * rep * 5;
      return settings.mbo.reduce((tot, mboItem) => {
        const tasks = m.tasks.filter((t) => t.mboId === mboItem.id);
        if (!tasks.length) return tot;
        const ss = m.categoryScores && m.categoryScores[mboItem.id];
        if (!ss || ss.leader == null || ss.member == null) return tot;
        const conv = ss.leader * wl + ss.member * wm;
        const pRatios = getP(m, mboItem.id, tasks);
        const weightedW = tasks.reduce((s, t, i) => {
          const d = pickCoef(simDiff, t.diffId, t.diffLabelSnap ?? t.diffLabel, t.diffCoefSnap ?? t.diffCoef);
          const r = pickCoef(simReport, t.reportId, t.reportLabelSnap ?? t.reportLabel, t.reportCoefSnap ?? t.reportCoef);
          return s + d.coef * r.coef * pRatios[i];
        }, 0);
        const effPts = m.categoryPts && m.categoryPts[mboItem.id] != null ? m.categoryPts[mboItem.id] : mboItem.pts;
        return tot + ((weightedW * conv) / ceil) * effPts;
      }, 0);
    };
  }, [simDiff, simReport, simWL, settings.mbo]);

  const ranking = useMemo(
    () =>
      Object.keys(members)
        .map((n) => ({ name: n, total: computeTotal(members[n]) }))
        .sort((a, b) => b.total - a.total),
    [members, computeTotal]
  );

  // 초기화: 2명 미만이면 닫기, gut 순서 세팅
  useEffect(() => {
    const names = Object.keys(members);
    if (names.length < 2) {
      toast("팀원이 2명 이상이어야 순위를 비교할 수 있습니다");
      setTooFew(true);
      onClose();
      return;
    }
    let g = storedGut && storedGut.length ? storedGut.slice() : ranking.map((x) => x.name);
    g = g.filter((n) => names.includes(n));
    names.forEach((n) => {
      if (!g.includes(n)) g.push(n);
    });
    setGut(g);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (tooFew) return null;

  const max = ranking.length ? Math.max(1, ranking[0].total) : 1;
  const crank: Record<string, number> = {};
  ranking.forEach((m, i) => (crank[m.name] = i + 1));

  const n = ranking.length;
  let sumd2 = 0;
  let exact = 0;
  gut.forEach((name, i) => {
    const gr = i + 1;
    const cr = crank[name] || gr;
    sumd2 += (cr - gr) ** 2;
    if (cr === gr) exact++;
  });
  const rho = n < 2 ? 1 : 1 - (6 * sumd2) / (n * (n * n - 1));
  const rhoPct = Math.max(0, Math.min(100, ((rho + 1) / 2) * 100));
  const rhoDesc =
    rho >= 0.9 ? "매우 높은 일치도 · 계수가 잘 맞습니다" :
    rho >= 0.7 ? "높은 일치도" :
    rho >= 0.4 ? "보통 일치도 · 계수 조정을 시도해보세요" :
    rho >= 0 ? "낮은 일치도 · 계수 재검토 필요" :
    "역상관 · 체감 순위와 반대 경향";

  const moveGut = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= gut.length) return;
    const next = gut.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setGut(next);
    setGutOrder(next);
  };

  const setGroupCoef = (
    list: CoefItem[],
    set: (l: CoefItem[]) => void,
    i: number,
    ratio: number
  ) => {
    let v = D_MIN + ratio * (D_MAX - D_MIN);
    const vMin = i > 0 ? list[i - 1].coef + 0.01 : D_MIN;
    const vMax = i < list.length - 1 ? list[i + 1].coef - 0.01 : D_MAX;
    v = Math.max(vMin, Math.min(vMax, Math.round(v * 100) / 100));
    set(list.map((x, j) => (j === i ? { ...x, coef: v } : x)));
  };

  const frac = (v: number) => (v - D_MIN) / (D_MAX - D_MIN);

  const renderGroup = (list: CoefItem[], set: (l: CoefItem[]) => void, color: string) =>
    list.map((item, i) => {
      const lo = i > 0 ? list[i - 1].coef : D_MIN;
      const hi = i < list.length - 1 ? list[i + 1].coef : D_MAX;
      return (
        <div className="slider-row" key={item.id} style={{ alignItems: "center" }}>
          <span className="sl-lab">{item.label}</span>
          <span className="sl-val">{item.coef.toFixed(2)}</span>
          <DragSlider
            fraction={frac(item.coef)}
            rangeLo={frac(lo)}
            rangeHi={frac(hi)}
            color={color}
            onRatio={(ratio) => setGroupCoef(list, set, i, ratio)}
          />
        </div>
      );
    });

  const onApply = () => {
    applySim(simDiff, simReport, simWL);
    onClose();
    toast("계수 적용 · 전체 업무 점수·가중치 갱신됨");
  };
  const onReset = () => {
    setSimDiff(clone(settings.difficulty));
    setSimReport(clone(settings.report));
    setSimWL(settings.defaultWLeader);
    toast("저장값으로 되돌림");
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide">
        <header>
          <span className="mark" style={{ background: "var(--accent)" }}>
            SIM
          </span>
          <h2>팀 순위 시뮬레이터</h2>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="body">
          <div className="sim-meter">
            <div className="sim-meter-top">
              <div className="sim-meter-left">
                <div className="rlbl">체감 일치도 · 순위 상관도 ρ</div>
                <div className="rho">{rho.toFixed(2)}</div>
                <div className="rho-sub">{rhoDesc}</div>
              </div>
              <div className="sim-meter-right">
                <div className="sim-rho-track">
                  <div className="sim-rho-fill" style={{ width: rhoPct + "%" }} />
                </div>
                <div className="sim-rho-scale">
                  <span>−1</span>
                  <span>0</span>
                  <span>+1</span>
                </div>
                <div className="sim-exact-badges">
                  {exact > 0 ? (
                    <span className="sim-exact-badge match">✓ {exact}명 완전 일치</span>
                  ) : (
                    <span className="sim-exact-badge">완전 일치 없음</span>
                  )}
                  <span className="sim-exact-badge">{n}명 중 비교</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sim-grid">
            <div className="sim-col">
              <h4>계수·가중치 조정</h4>
              <div>
                <div className="grp">난이도 계수</div>
                {renderGroup(simDiff, setSimDiff, "var(--accent)")}
                <div className="grp">기여도 계수</div>
                {renderGroup(simReport, setSimReport, "var(--accent)")}
                <div className="grp">평가 가중치 (전체 일괄)</div>
                <div className="slider-row">
                  <span className="sl-lab">팀장</span>
                  <span className="sl-val" style={{ minWidth: 120 }}>
                    {simWL}%{" "}
                    <span style={{ color: "var(--member)", fontSize: 11, fontWeight: 500 }}>· 팀원 {100 - simWL}%</span>
                  </span>
                  <DragSlider
                    fraction={simWL / 100}
                    color="var(--leader)"
                    onRatio={(ratio) => setSimWL(Math.round(ratio * 100))}
                  />
                </div>
              </div>

              <h4 style={{ marginTop: 20 }}>내 체감 순위</h4>
              <p className="hint">▲▼로 실제 체감하는 순위를 배치하세요. 위 계수를 조절해 산식 순위와의 상관도(ρ)를 높이는 게 목표입니다.</p>
              <div className="gut-list">
                {gut.map((name, i) => (
                  <div className="gutrow" key={name}>
                    <span className="gi">{i + 1}</span>
                    <b>{name}</b>
                    <button disabled={i === 0} onClick={() => moveGut(i, -1)}>
                      ▲
                    </button>
                    <button disabled={i === gut.length - 1} onClick={() => moveGut(i, 1)}>
                      ▼
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="sim-col">
              <h4>산식 순위 (실시간)</h4>
              <div className="sim-rank">
                {ranking.map((m, i) => {
                  const cr = i + 1;
                  const gr = gut.indexOf(m.name) + 1;
                  const d = gr - cr;
                  return (
                    <div className={"rank-row " + (i === 0 ? "top" : "")} key={m.name}>
                      <div className="rk">{cr}</div>
                      <div>
                        <div className="nm">
                          {m.name} <span className="guttag">체감 {gr}위</span>{" "}
                          {d > 0 ? (
                            <span className="disp up">▲{d}</span>
                          ) : d < 0 ? (
                            <span className="disp dn">▼{-d}</span>
                          ) : (
                            <span className="disp eq">＝</span>
                          )}
                        </div>
                        <div className="bar">
                          <i style={{ width: ((m.total / max) * 100).toFixed(1) + "%" }} />
                        </div>
                      </div>
                      <div className="sc">{m.total.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="foot">
          <button className="btn" onClick={onReset}>
            저장값으로 되돌리기
          </button>
          <button className="btn primary" onClick={onApply}>
            이 계수로 저장
          </button>
        </div>
      </div>
    </div>
  );
}
