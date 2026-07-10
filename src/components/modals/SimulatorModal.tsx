"use client";

import { useEffect, useMemo, useState } from "react";

import { clone } from "@/lib/calc";
import { computeRho, reconcileGutOrder, rhoDescription, simRanking } from "@/lib/simulator";
import { btn, btnPrimary } from "@/lib/ui";
import { selectSettings, selectYearData } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import { useUiStore } from "@/store/useUiStore";
import type { Settings } from "@/types";

import { CoefficientSlider } from "../shared/CoefficientSlider";
import { RankBar } from "../shared/RankBar";
import { Modal } from "../shared/Modal";

const SCALE_MIN = 0.8;
const SCALE_MAX = 1.3;

/**
 * 열려 있을 때만 마운트된다(SimulatorModal에서 open일 때만 렌더).
 * simSet의 초기값은 마운트 시점의 커밋된 settings 스냅샷 — 열 때마다 새로 마운트되므로
 * effect로 재동기화할 필요가 없다.
 */
function SimulatorModalContent() {
  const closeModal = useUiStore((s) => s.closeModal);
  const settings = useAppStore(selectSettings);
  const yearData = useAppStore(selectYearData);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setGutOrder = useAppStore((s) => s.setGutOrder);

  const [simSet, setSimSet] = useState<Settings>(() => clone(settings));

  const members = useMemo(() => yearData?.members ?? {}, [yearData?.members]);
  const memberNames = useMemo(() => Object.keys(members), [members]);
  const gutOrder = useMemo(
    () => reconcileGutOrder(yearData?.gutOrder ?? [], memberNames),
    [yearData?.gutOrder, memberNames]
  );

  // 체감 순위가 한 번도 설정된 적 없으면 현재 산식 순위로 1회 시드 (외부 store 동기화)
  useEffect(() => {
    if (yearData && (!yearData.gutOrder || !yearData.gutOrder.length)) {
      setGutOrder(simRanking(yearData.members, settings).map((x) => x.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ranking = useMemo(() => simRanking(members, simSet), [members, simSet]);
  const { rho, exact, n } = useMemo(() => computeRho(gutOrder, ranking), [gutOrder, ranking]);
  const crank = useMemo(() => {
    const map: Record<string, number> = {};
    ranking.forEach((m, i) => (map[m.name] = i + 1));
    return map;
  }, [ranking]);
  const maxTotal = Math.max(1, ranking[0]?.total ?? 1);

  function updateCoef(kind: "difficulty" | "report", index: number, value: number) {
    setSimSet((d) => ({
      ...d,
      [kind]: d[kind].map((item, i) => (i === index ? { ...item, coef: value } : item)),
    }));
  }

  function moveGut(index: number, dir: -1 | 1) {
    const next = gutOrder.slice();
    const j = index + dir;
    [next[index], next[j]] = [next[j], next[index]];
    setGutOrder(next);
  }

  function handleApply() {
    updateSettings(simSet);
    toast("계수 적용 · 전체 업무 점수·가중치 갱신됨");
    closeModal();
  }

  function handleReset() {
    setSimSet(clone(settings));
    toast("저장값으로 되돌림");
  }

  const rhoPct = Math.max(0, Math.min(100, ((rho + 1) / 2) * 100));

  return (
    <Modal
      open
      onClose={closeModal}
      title="팀 순위 시뮬레이터"
      mark="SIM"
      wide
      footer={
        <>
          <button onClick={handleReset} className={btn}>
            저장값으로 되돌리기
          </button>
          <button onClick={handleApply} className={btnPrimary}>
            이 계수로 저장
          </button>
        </>
      }
    >
      <div className="mb-[18px] rounded-[14px] p-5 px-6 text-[#e8ecf4]" style={{ background: "linear-gradient(135deg,#1a1e2e 0%,#222840 100%)" }}>
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[160px] flex-shrink-0">
            <div className="mb-1.5 font-mono text-[10px] tracking-wide text-[#6b7590]">체감 일치도 · 순위 상관도 ρ</div>
            <div className="text-[52px] font-extrabold leading-none tracking-tighter tabular-nums text-white">
              {rho.toFixed(2)}
            </div>
            <div className="mt-1.5 text-[11.5px] leading-snug text-[#7a85a0]">{rhoDescription(rho)}</div>
          </div>
          <div className="flex min-w-[200px] flex-1 flex-col gap-2">
            <div className="h-2 overflow-hidden rounded-md bg-white/[.07]">
              <div
                className="h-full rounded-md transition-[width] duration-300"
                style={{ width: `${rhoPct}%`, background: "linear-gradient(90deg,#e05a5a 0%,#e8b96a 50%,#4fd4a0 100%)" }}
              />
            </div>
            <div className="flex justify-between px-px font-mono text-[10px] text-[#4a5470]">
              <span>−1</span>
              <span>0</span>
              <span>+1</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {exact > 0 ? (
                <span className="rounded-full border border-[#4fd4a040] bg-[#1c8c5f2e] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#4fd4a0]">
                  ✓ {exact}명 완전 일치
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#8a90a8]">
                  완전 일치 없음
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#8a90a8]">
                {n}명 중 비교
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[320px_1fr]">
        <div>
          <h4 className="m-0 mb-2.5 text-[12.5px] font-bold text-ink-2">계수·가중치 조정</h4>
          <div className="mb-3.5 mt-3.5 border-b border-line pb-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted">
            난이도 계수
          </div>
          {simSet.difficulty.map((item, i) => {
            const lo = i > 0 ? simSet.difficulty[i - 1].coef : SCALE_MIN;
            const hi = i < simSet.difficulty.length - 1 ? simSet.difficulty[i + 1].coef : SCALE_MAX;
            return (
              <CoefficientSlider
                key={item.id}
                label={item.label}
                valueDisplay={item.coef.toFixed(2)}
                value={item.coef}
                min={SCALE_MIN}
                max={SCALE_MAX}
                clampMin={i > 0 ? lo + 0.01 : SCALE_MIN}
                clampMax={i < simSet.difficulty.length - 1 ? hi - 0.01 : SCALE_MAX}
                highlightMin={lo}
                highlightMax={hi}
                onChange={(v) => updateCoef("difficulty", i, v)}
              />
            );
          })}

          <div className="mb-3.5 mt-3.5 border-b border-line pb-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted">
            기여도 계수
          </div>
          {simSet.report.map((item, i) => {
            const lo = i > 0 ? simSet.report[i - 1].coef : SCALE_MIN;
            const hi = i < simSet.report.length - 1 ? simSet.report[i + 1].coef : SCALE_MAX;
            return (
              <CoefficientSlider
                key={item.id}
                label={item.label}
                valueDisplay={item.coef.toFixed(2)}
                value={item.coef}
                min={SCALE_MIN}
                max={SCALE_MAX}
                clampMin={i > 0 ? lo + 0.01 : SCALE_MIN}
                clampMax={i < simSet.report.length - 1 ? hi - 0.01 : SCALE_MAX}
                highlightMin={lo}
                highlightMax={hi}
                onChange={(v) => updateCoef("report", i, v)}
              />
            );
          })}

          <div className="mb-3.5 mt-3.5 border-b border-line pb-1.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-muted">
            평가 가중치 (전체 일괄)
          </div>
          <CoefficientSlider
            label="팀장"
            valueDisplay={
              <>
                {simSet.defaultWLeader}%{" "}
                <span className="text-[11px] font-medium text-member">· 팀원 {simSet.defaultWMember}%</span>
              </>
            }
            value={simSet.defaultWLeader}
            min={0}
            max={100}
            clampMin={0}
            clampMax={100}
            step={1}
            onChange={(v) => setSimSet((d) => ({ ...d, defaultWLeader: v, defaultWMember: 100 - v }))}
          />

          <h4 className="m-0 mb-2 mt-5 text-[12.5px] font-bold text-ink-2">내 체감 순위</h4>
          <p className="m-0 mb-2 rounded-md border border-line bg-paper px-2.5 py-1.5 text-[11.5px] leading-relaxed text-muted">
            ▲▼로 실제 체감하는 순위를 배치하세요. 위 계수를 조절해 산식 순위와의 상관도(ρ)를 높이는 게 목표입니다.
          </p>
          <div className="overflow-hidden rounded-[10px] border border-line bg-white">
            {gutOrder.map((name, i) => (
              <div
                key={name}
                className="grid grid-cols-[32px_1fr_50px_50px] items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0"
              >
                <span className="text-center font-mono text-muted">{i + 1}</span>
                <b className="font-semibold">{name}</b>
                <button
                  disabled={i === 0}
                  onClick={() => moveGut(i, -1)}
                  className="h-[26px] rounded-md border border-line bg-white text-[11px] text-ink-2 transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  disabled={i === gutOrder.length - 1}
                  onClick={() => moveGut(i, 1)}
                  className="h-[26px] rounded-md border border-line bg-white text-[11px] text-ink-2 transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="m-0 mb-2.5 text-[12.5px] font-bold text-ink-2">산식 순위 (실시간)</h4>
          <div>
            {ranking.map((m, i) => (
              <RankBar
                key={m.name}
                rank={i + 1}
                gutRank={gutOrder.indexOf(m.name) + 1 || crank[m.name]}
                name={m.name}
                total={m.total}
                max={maxTotal}
                isTop={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function SimulatorModal() {
  const open = useUiStore((s) => s.modal === "sim");
  return open ? <SimulatorModalContent /> : null;
}
