"use client";

import { exportAllExcel } from "@/lib/excel";
import { getYearsList, useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import { useUiStore } from "@/store/useUiStore";

export function Header() {
  const years = useAppStore(getYearsList);
  const currentYear = useAppStore((s) => s.currentYear);
  const yearData = useAppStore((s) => (s.currentYear ? s.years[s.currentYear] : undefined));
  const addYear = useAppStore((s) => s.addYear);
  const switchYear = useAppStore((s) => s.switchYear);
  const openModal = useUiStore((s) => s.openModal);

  function handleNewYear() {
    const input = window.prompt(`새 평가 연도를 입력하세요 (예: ${new Date().getFullYear()})`);
    if (input === null) return;
    const yr = input.trim();
    if (!/^\d{4}$/.test(yr)) {
      toast("네 자리 연도를 입력하세요");
      return;
    }
    const existed = years.includes(yr);
    const latest = years[0];
    addYear(yr);
    toast(
      existed
        ? `${yr}년으로 전환`
        : `${yr}년 평가 생성 · 계수는 ${latest ? latest + "년" : "기본값"} 기준 복제`
    );
  }

  function handleOpenSim() {
    if (!yearData || Object.keys(yearData.members).length < 2) {
      toast("팀원이 2명 이상이어야 순위를 비교할 수 있습니다");
      return;
    }
    openModal("sim");
  }

  function handleAllExcel() {
    if (!yearData || !currentYear) return;
    const ok = exportAllExcel(yearData.members, yearData.settings, currentYear);
    if (!ok) {
      toast("등록된 팀원이 없습니다");
      return;
    }
    toast(`${currentYear}년 종합순위 (${Object.keys(yearData.members).length}명) 저장`);
  }

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-panel px-6 py-3.5 shadow-[var(--shadow)]">
      <span className="rounded-[7px] bg-accent px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-white">
        MBO
      </span>
      <h1 className="m-0 text-base font-bold tracking-tight">
        뉴스디자인팀 업무평가 <span className="text-accent">Metrics</span>
      </h1>
      <span className="max-w-[340px] truncate rounded-md border border-line bg-paper px-2.5 py-0.5 font-mono text-[11px] text-muted">
        항목 점수 = (항목 W합계 × S ÷ 기준 상한) × 배점
      </span>
      <span className="flex-1" />
      <div className="flex items-center gap-1.5 rounded-[9px] border border-line-2 bg-white py-1 pl-2.5 pr-1.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-wide text-muted">
          평가 연도
        </span>
        <select
          value={currentYear ?? ""}
          onChange={(e) => switchYear(e.target.value)}
          className="cursor-pointer border-none bg-transparent px-1 py-0.5 text-sm font-bold text-accent outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <button
          onClick={handleNewYear}
          title="새 평가연도 추가"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-line bg-paper text-[15px] font-bold leading-none text-accent transition-colors hover:border-accent hover:bg-accent-soft"
        >
          ＋
        </button>
      </div>
      <button
        onClick={handleAllExcel}
        title="이 연도 전체 팀원 순위 엑셀"
        className="rounded-lg border border-accent bg-accent-soft px-3.5 py-2 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
      >
        ⤓ 종합순위
      </button>
      <button
        onClick={handleOpenSim}
        className="rounded-lg border border-accent bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-mid"
      >
        📊 순위 시뮬레이터
      </button>
      <button
        onClick={() => openModal("settings")}
        className="rounded-lg border border-line-2 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        ⚙ 설정
      </button>
    </header>
  );
}
