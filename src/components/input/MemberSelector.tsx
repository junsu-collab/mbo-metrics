"use client";

import { btnGhostDanger } from "@/lib/ui";
import { useAppStore } from "@/store/useAppStore";
import { selectCurrentMemberName, selectYearData } from "@/store/selectors";
import { toast } from "@/store/useToastStore";

export function MemberSelector() {
  const yearData = useAppStore(selectYearData);
  const current = useAppStore(selectCurrentMemberName);
  const addMember = useAppStore((s) => s.addMember);
  const deleteMember = useAppStore((s) => s.deleteMember);
  const switchMember = useAppStore((s) => s.switchMember);

  const members = yearData?.members ?? {};
  const names = Object.keys(members);

  function handleAdd() {
    const input = window.prompt("새 팀원 이름을 입력하세요");
    if (input === null) return;
    const n = input.trim();
    if (!n) {
      toast("이름이 비어 있습니다");
      return;
    }
    addMember(n);
    toast(`${n} 추가됨`);
  }

  function handleDelete() {
    if (!current) {
      toast("선택된 팀원이 없습니다");
      return;
    }
    if (!window.confirm(`"${current}"의 모든 업무 데이터를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    deleteMember(current);
    toast(`"${current}" 삭제됨`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-[160px] flex-1">
        <label htmlFor="memberSel" className="mb-1 block text-[11.5px] font-semibold text-ink-2">
          평가 대상 팀원
        </label>
        <select
          id="memberSel"
          value={current ?? ""}
          onChange={(e) => switchMember(e.target.value)}
          className="w-full rounded-lg border border-line-2 bg-white px-2.5 py-2 text-ink transition-colors focus:border-accent focus:outline-2 focus:outline-accent"
        >
          {names.length === 0 && <option value="">— 팀원 없음 —</option>}
          {names.map((n) => {
            const m = members[n];
            const taskCnt = (m.tasks || []).length;
            const mboCnt = yearData!.settings.mbo.filter((mbo) => {
              const cs = m.categoryScores?.[mbo.id];
              return (
                (m.tasks || []).some((t) => t.mboId === mbo.id) ||
                (cs && (cs.leader != null || cs.member != null))
              );
            }).length;
            return (
              <option key={n} value={n}>
                {n} [{taskCnt} 업무 / {mboCnt} 항목]
              </option>
            );
          })}
        </select>
      </div>
      <div className="flex items-stretch gap-1.5">
        <button
          onClick={handleAdd}
          className="flex h-[38px] items-center rounded-lg border border-dashed border-line-2 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        >
          ＋ 팀원 추가
        </button>
        <button onClick={handleDelete} className={`${btnGhostDanger} h-[38px]`}>
          － 팀원 삭제
        </button>
      </div>
    </div>
  );
}
