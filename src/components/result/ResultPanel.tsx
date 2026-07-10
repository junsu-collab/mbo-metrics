"use client";

import { maxWS, memberSlots, memberTotal } from "@/lib/calc";
import { exportMemberExcel } from "@/lib/excel";
import { selectCurrentMember, selectCurrentMemberName, selectSettings } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import { useUiStore } from "@/store/useUiStore";

import { CategoryCard } from "./CategoryCard";
import { ChoicePointsPanel } from "./ChoicePointsPanel";
import { TotalCard } from "./TotalCard";

export function ResultPanel() {
  const settings = useAppStore(selectSettings);
  const memberName = useAppStore(selectCurrentMemberName);
  const member = useAppStore(selectCurrentMember);
  const openModal = useUiStore((s) => s.openModal);

  if (!member || !memberName) {
    return (
      <>
        <TotalCard name={memberName ?? "—"} total={0} count={0} />
        <div className="rounded-xl border border-line bg-white p-10 text-center text-muted">
          <div className="mb-2.5 text-[32px] opacity-35">👤</div>
          <div className="mb-1.5 text-[13.5px] font-semibold text-ink-2">팀원을 선택하거나 추가하세요</div>
          <div className="text-xs leading-relaxed">
            좌측 상단에서 <b className="text-accent">＋ 팀원 추가</b>로 시작할 수 있습니다.
          </div>
        </div>
      </>
    );
  }

  const total = memberTotal(member, settings);
  const choiceItems = settings.mbo.filter((x) => x.choice);
  const choicePanel = (
    <ChoicePointsPanel choiceItems={choiceItems} member={member} choiceTarget={settings.choiceTarget ?? 40} />
  );

  if (!member.tasks.length) {
    return (
      <>
        <TotalCard name={memberName} total={0} count={0} />
        {choicePanel}
        <div className="rounded-xl border border-line bg-white p-10 text-center text-muted">
          <div className="mb-2.5 text-[32px] opacity-35">📋</div>
          <div className="mb-1.5 text-[13.5px] font-semibold text-ink-2">등록된 업무가 없습니다</div>
          <div className="text-xs leading-relaxed">
            좌측에서 업무를 정의하고
            <br />
            <b className="text-accent">＋ 업무 등록</b>을 눌러주세요.
          </div>
        </div>
      </>
    );
  }

  const categories = memberSlots(member, settings).filter((r) => r.n > 0);
  const ceil = maxWS(settings);

  function handleExcel() {
    if (!member || !memberName) return;
    const ok = exportMemberExcel(memberName, member, settings);
    if (!ok) {
      toast("내보낼 업무가 없습니다");
      return;
    }
    toast(`MBO_${memberName}.xlsx 저장`);
  }

  return (
    <>
      <TotalCard name={memberName} total={total} count={member.tasks.length} />
      <div className="mb-3 flex items-center justify-between rounded-[9px] border border-line bg-white px-3 py-2">
        <strong className="text-[13px] text-ink-2">등록된 업무 리스트</strong>
        <div className="flex gap-1.5">
          <button
            onClick={() => openModal("allTasks")}
            className="rounded-lg border border-line-2 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            ☰ 모든 업무
          </button>
          <button
            onClick={handleExcel}
            className="rounded-lg border border-line-2 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            ⤓ 엑셀로 내보내기
          </button>
        </div>
      </div>
      {choicePanel}
      {categories.map((r) => (
        <CategoryCard
          key={r.mbo.id}
          result={r}
          member={member}
          memberName={memberName}
          settings={settings}
          ceil={ceil}
        />
      ))}
    </>
  );
}
