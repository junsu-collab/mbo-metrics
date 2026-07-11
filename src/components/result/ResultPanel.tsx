import { useMembers, useSettings, useCurrentMemberName } from "../../store/useAppStore";
import { memberSlots, memberTotal } from "../../lib/calc";
import { exportExcel } from "../../lib/excel";
import { toast } from "../../store/useToastStore";
import ChoicePointsPanel from "./ChoicePointsPanel";
import CategoryCard from "./CategoryCard";

interface Props {
  onOpenAllTasks: () => void;
}

export default function ResultPanel({ onOpenAllTasks }: Props) {
  const members = useMembers();
  const settings = useSettings();
  const current = useCurrentMemberName();
  const m = current ? members[current] : undefined;

  const total = m ? memberTotal(m, settings) : 0;
  const taskCount = m?.tasks.length ?? 0;
  const categories = m ? memberSlots(m, settings).filter((r) => r.n > 0) : [];

  const onExcel = () => {
    if (!m) {
      toast("내보낼 업무가 없습니다");
      return;
    }
    exportExcel(m, settings, toast);
  };

  return (
    <section className="panel right">
      <p className="eyebrow">집계 · RESULT</p>
      <div className="totcard">
        <div className="totcard-left">
          <div className="who">{current || "—"}</div>
          <div className="totcard-score-row">
            <span className="big">{total.toFixed(2)}</span>
            <span className="unit">점</span>
          </div>
        </div>
        <div className="cnt">
          <span className="cnt-badge">{taskCount} 업무</span>
        </div>
      </div>
      <div className="toolbar">
        <strong style={{ fontSize: 13 }}>등록된 업무 리스트</strong>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn sm" onClick={onOpenAllTasks}>
            ☰ 모든 업무
          </button>
          <button className="btn sm" onClick={onExcel}>
            ⤓ 엑셀로 내보내기
          </button>
        </div>
      </div>

      <div>
        {!m ? (
          <div className="empty">
            <div className="empty-icon">👤</div>
            <div className="empty-title">팀원을 선택하거나 추가하세요</div>
            <div className="empty-desc">
              좌측 상단에서 <b>＋ 팀원 추가</b>로 시작할 수 있습니다.
            </div>
          </div>
        ) : (
          <>
            <ChoicePointsPanel member={m} />
            {taskCount === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-title">등록된 업무가 없습니다</div>
                <div className="empty-desc">
                  좌측에서 업무를 정의하고
                  <br />
                  <b>＋ 업무 등록</b>을 눌러주세요.
                </div>
              </div>
            ) : (
              categories.map((r) => <CategoryCard key={r.mbo.id} result={r} memberName={m.name} />)
            )}
          </>
        )}
      </div>
    </section>
  );
}
