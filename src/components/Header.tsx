import { useAppStore, useMembers, useSettings, useCurrentYear } from "../store/useAppStore";
import { useYearKeys } from "../store/useAppStore";
import { exportAllExcel } from "../lib/excel";
import { toast } from "../store/useToastStore";

interface Props {
  onOpenSettings: () => void;
  onOpenSim: () => void;
}

export default function Header({ onOpenSettings, onOpenSim }: Props) {
  const yearKeys = useYearKeys();
  const currentYear = useCurrentYear();
  const members = useMembers();
  const settings = useSettings();
  const switchYear = useAppStore((s) => s.switchYear);
  const addYear = useAppStore((s) => s.addYear);

  const years = [...yearKeys].sort((a, b) => +b - +a);

  const onNewYear = () => {
    const thisYear = String(new Date().getFullYear());
    const inp = window.prompt("새 평가 연도를 입력하세요 (예: " + thisYear + ")");
    if (inp === null) return;
    const yr = String(inp).trim();
    if (!/^\d{4}$/.test(yr)) {
      toast("네 자리 연도를 입력하세요");
      return;
    }
    const exists = !!useAppStore.getState().years[yr];
    addYear(yr);
    if (exists) toast(yr + "년으로 전환");
    else {
      const latest = years[0];
      toast(yr + "년 평가 생성 · 계수는 " + (latest ? latest + "년" : "기본값") + " 기준 복제");
    }
  };

  const onAllExcel = () => {
    if (!currentYear) return;
    exportAllExcel(members, settings, currentYear, toast);
  };

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-surface px-6 py-3 shadow-sm">
      <span className="m-mark">MBO</span>
      <h1 className="m-0 text-base font-bold tracking-tight">
        뉴스디자인팀 업무평가 <span className="text-primary">Metrics</span>
      </h1>
      <span
        className="hidden max-w-[340px] truncate rounded-md border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-muted xl:inline-block"
        title="항목 점수 = (항목 W합계 × S ÷ 기준 상한) × 배점"
      >
        항목 점수 = (항목 W합계 × S ÷ 기준 상한) × 배점
      </span>
      <span className="flex-1" />
      <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface py-1 pl-3 pr-1.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-muted">평가 연도</span>
        <select
          className="cursor-pointer border-none bg-transparent px-1 py-0.5 text-sm font-bold text-primary outline-none"
          value={currentYear ?? ""}
          onChange={(e) => switchYear(e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-canvas text-[15px] font-bold leading-none text-primary transition hover:border-primary hover:bg-primary-soft"
          title="새 평가연도 추가"
          onClick={onNewYear}
        >
          ＋
        </button>
      </div>
      <button
        className="m-btn m-btn-sm border-primary bg-primary-soft text-primary hover:bg-primary hover:text-white"
        title="이 연도 전체 팀원 순위 엑셀"
        onClick={onAllExcel}
      >
        ⤓ 종합순위
      </button>
      <button className="m-btn m-btn-sm m-btn-primary" onClick={onOpenSim}>
        📊 순위 시뮬레이터
      </button>
      <button className="m-btn m-btn-sm" onClick={onOpenSettings}>
        ⚙ 설정
      </button>
    </header>
  );
}
