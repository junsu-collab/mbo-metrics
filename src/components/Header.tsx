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
    <header>
      <span className="mark">MBO</span>
      <h1>
        뉴스디자인팀 업무평가 <span style={{ color: "var(--accent)" }}>Metrics</span>
      </h1>
      <span className="sub" title="항목 점수 = (항목 W합계 × S ÷ 기준 상한) × 배점">
        항목 점수 = (항목 W합계 × S ÷ 기준 상한) × 배점
      </span>
      <span className="spacer" />
      <div className="yearbox">
        <span className="ylabel">평가 연도</span>
        <select value={currentYear ?? ""} onChange={(e) => switchYear(e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <button id="btnNewYear" title="새 평가연도 추가" onClick={onNewYear}>
          ＋
        </button>
      </div>
      <button id="btnAllExcel" title="이 연도 전체 팀원 순위 엑셀" onClick={onAllExcel}>
        ⤓ 종합순위
      </button>
      <button id="btnSim" onClick={onOpenSim}>
        📊 순위 시뮬레이터
      </button>
      <button id="btnSettings" onClick={onOpenSettings}>
        ⚙ 설정
      </button>
    </header>
  );
}
