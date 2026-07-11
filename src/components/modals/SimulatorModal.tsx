import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Minus, X } from "lucide-react";
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
    <div ref={trackRef} className="relative flex h-5 flex-1 items-center">
      <div className="absolute left-0 right-0 h-1 rounded-full bg-line-strong" />
      {rangeLo != null && rangeHi != null && (
        <div
          className="absolute h-1 rounded-full border border-line-strong bg-primary-soft"
          style={{ left: (rangeLo * 100).toFixed(2) + "%", width: ((rangeHi - rangeLo) * 100).toFixed(2) + "%" }}
        />
      )}
      <div className="absolute left-0 h-1 rounded-full opacity-50" style={{ background: color, width: pct }} />
      <div
        onMouseDown={startDrag}
        className="absolute h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-[2.5px] border-white shadow-md active:cursor-grabbing"
        style={{ background: color, left: pct }}
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
          const d = pickCoef(simDiff, t.difficultyId, t.difficultyLabelSnap ?? t.diffLabel, t.difficultyCoefSnap ?? t.diffCoef);
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
    rho >= 0.7 ? "높은 일치도 · 대체로 잘 맞습니다" :
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

  const setGroupCoef = (list: CoefItem[], set: (l: CoefItem[]) => void, i: number, ratio: number) => {
    let v = D_MIN + ratio * (D_MAX - D_MIN);
    const vMin = i > 0 ? list[i - 1].coef + 0.01 : D_MIN;
    const vMax = i < list.length - 1 ? list[i + 1].coef - 0.01 : D_MAX;
    v = Math.max(vMin, Math.min(vMax, Math.round(v * 100) / 100));
    set(list.map((x, j) => (j === i ? { ...x, coef: v } : x)));
  };

  const frac = (v: number) => (v - D_MIN) / (D_MAX - D_MIN);

  const renderGroup = (list: CoefItem[], set: (l: CoefItem[]) => void) =>
    list.map((item, i) => {
      const lo = i > 0 ? list[i - 1].coef : D_MIN;
      const hi = i < list.length - 1 ? list[i + 1].coef : D_MAX;
      return (
        <div className="mb-2.5 flex items-center gap-2.5" key={item.id}>
          <span className="min-w-[120px] text-xs text-ink-2">{item.label}</span>
          <span className="min-w-[36px] text-right font-mono text-[13px] font-bold text-primary">{item.coef.toFixed(2)}</span>
          <DragSlider
            fraction={frac(item.coef)}
            rangeLo={frac(lo)}
            rangeHi={frac(hi)}
            color="var(--color-primary)"
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

  const grpLabel = "mb-2 mt-3.5 border-b border-line pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-muted";

  return (
    <div className="m-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="m-modal max-w-[780px]">
        <div className="m-modal-header">
          <span className="m-mark">SIM</span>
          <h2 className="flex-1 text-base font-bold">팀 순위 시뮬레이터</h2>
          <button className="m-x" aria-label="닫기" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        <div className="m-modal-body">
          {/* ρ 미터 */}
          <div className="mb-4 rounded-2xl border border-line bg-canvas-2 p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="min-w-[160px] shrink-0">
                <div className="mb-1.5 font-mono text-[10px] tracking-wide text-muted">체감 일치도 · 순위 상관도 ρ</div>
                <div className="font-mono text-4xl font-extrabold leading-none tracking-[-2px] tabular-nums text-ink">{rho.toFixed(2)}</div>
                <div className="mt-1.5 text-xs leading-snug text-muted">{rhoDesc}</div>
              </div>
              <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#e05a5a_0%,#e8b96a_50%,#4fd4a0_100%)] transition-all duration-500"
                    style={{ width: rhoPct + "%" }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-muted-2">
                  <span>−1</span>
                  <span>0</span>
                  <span>+1</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {exact > 0 ? (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      {exact}명 완전 일치
                    </span>
                  ) : (
                    <span className="rounded-full border border-line px-2 py-0.5 font-mono text-xs font-semibold text-muted">완전 일치 없음</span>
                  )}
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-xs font-semibold text-muted">{n}명 중 비교</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div>
              <h4 className="mb-2.5 text-xs font-bold text-ink-2">계수·가중치 조정</h4>
              <div>
                <div className={grpLabel + " mt-0"}>난이도 계수</div>
                {renderGroup(simDiff, setSimDiff)}
                <div className={grpLabel}>기여도 계수</div>
                {renderGroup(simReport, setSimReport)}
                <div className={grpLabel}>평가 가중치 (전체 일괄)</div>
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="min-w-[120px] text-xs text-ink-2">팀장</span>
                  <span className="min-w-[120px] font-mono text-[13px] font-bold text-primary">
                    {simWL}% <span className="text-xs font-medium text-brand-violet">· 팀원 {100 - simWL}%</span>
                  </span>
                  <DragSlider fraction={simWL / 100} color="var(--color-primary)" onRatio={(ratio) => setSimWL(Math.round(ratio * 100))} />
                </div>
              </div>

              <h4 className="mb-2.5 mt-5 text-xs font-bold text-ink-2">내 체감 순위</h4>
              <p className="mb-2 rounded-lg border border-line bg-canvas px-2.5 py-2 text-xs leading-relaxed text-muted">
                화살표 버튼으로 실제 체감하는 순위를 배치하세요. 위 계수를 조절해 산식 순위와의 상관도(ρ)를 높이는 게 목표입니다.
              </p>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                {gut.map((name, i) => (
                  <div className="grid grid-cols-[32px_1fr_auto_auto] items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0" key={name}>
                    <span className="text-center font-mono text-muted">{i + 1}</span>
                    <b className="font-semibold">{name}</b>
                    <button
                      className="m-focus flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-30"
                      disabled={i === 0}
                      aria-label={`${name} 순위 위로`}
                      onClick={() => moveGut(i, -1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                    <button
                      className="m-focus flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 transition hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-30"
                      disabled={i === gut.length - 1}
                      aria-label={`${name} 순위 아래로`}
                      onClick={() => moveGut(i, 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2.5 text-xs font-bold text-ink-2">산식 순위 (실시간)</h4>
              <div>
                {ranking.map((m, i) => {
                  const cr = i + 1;
                  const gr = gut.indexOf(m.name) + 1;
                  const d = gr - cr;
                  return (
                    <div
                      className={
                        "mb-2 grid grid-cols-[36px_1fr_78px] items-center gap-3 rounded-2xl border bg-surface px-3.5 py-2.5 " +
                        (i === 0 ? "border-primary shadow-sm shadow-primary/20" : "border-line")
                      }
                      key={m.name}
                    >
                      <div className="text-center font-mono text-xl font-bold text-primary">{cr}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {m.name}
                          <span className="rounded-md bg-canvas-2 px-2 py-0.5 font-mono text-xs font-semibold text-muted">체감 {gr}위</span>
                          {d > 0 ? (
                            <span className="flex items-center font-mono text-xs font-bold text-emerald-600">
                              <ArrowUp className="h-3 w-3" strokeWidth={2.75} />
                              {d}
                            </span>
                          ) : d < 0 ? (
                            <span className="flex items-center font-mono text-xs font-bold text-orange-600">
                              <ArrowDown className="h-3 w-3" strokeWidth={2.75} />
                              {-d}
                            </span>
                          ) : (
                            <Minus className="h-3 w-3 text-muted" strokeWidth={2.75} />
                          )}
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-soft">
                          <i
                            className="block h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: ((m.total / max) * 100).toFixed(1) + "%" }}
                          />
                        </div>
                      </div>
                      <div className="text-right font-mono text-base font-bold tabular-nums text-primary">{m.total.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="m-modal-foot">
          <button className="m-btn" onClick={onReset}>
            저장값으로 되돌리기
          </button>
          <button className="m-btn m-btn-primary" onClick={onApply}>
            이 계수로 저장
          </button>
        </div>
      </div>
    </div>
  );
}
