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
    <section className="bg-canvas px-6 py-6">
      <p className="m-eyebrow">
        집계 · RESULT
        <span className="h-px flex-1 bg-line" />
      </p>

      {/* 총점 카드 */}
      <div className="mb-4 flex items-end justify-between rounded-3xl bg-gradient-to-br from-primary to-primary-strong p-7 text-white shadow-lg shadow-primary/25">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
            {current || "—"} · 종합 점수
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-6xl font-bold leading-none tabular-nums">{total.toFixed(2)}</span>
            <span className="text-lg font-medium text-white/70">점</span>
          </div>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{taskCount} 업무</span>
      </div>

      {/* 툴바 */}
      <div className="mb-3 flex items-center justify-between">
        <strong className="text-sm font-bold text-ink-2">등록된 업무 리스트</strong>
        <div className="flex gap-2">
          <button className="m-btn m-btn-sm" onClick={onOpenAllTasks}>
            ☰ 모든 업무
          </button>
          <button className="m-btn m-btn-sm" onClick={onExcel}>
            ⤓ 엑셀로 내보내기
          </button>
        </div>
      </div>

      <div>
        {!m ? (
          <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center text-muted">
            <div className="mb-2.5 text-3xl opacity-40">👤</div>
            <div className="mb-1.5 text-sm font-semibold text-ink-2">팀원을 선택하거나 추가하세요</div>
            <div className="text-xs leading-relaxed">
              좌측 상단에서 <b className="text-primary">＋ 팀원 추가</b>로 시작할 수 있습니다.
            </div>
          </div>
        ) : (
          <>
            <ChoicePointsPanel member={m} />
            {taskCount === 0 ? (
              <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center text-muted">
                <div className="mb-2.5 text-3xl opacity-40">📋</div>
                <div className="mb-1.5 text-sm font-semibold text-ink-2">등록된 업무가 없습니다</div>
                <div className="text-xs leading-relaxed">
                  좌측에서 업무를 정의하고
                  <br />
                  <b className="text-primary">＋ 업무 등록</b>을 눌러주세요.
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
