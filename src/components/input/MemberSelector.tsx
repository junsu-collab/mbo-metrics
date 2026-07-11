import { useAppStore, useMembers, useSettings, useCurrentMemberName } from "../../store/useAppStore";
import { toast } from "../../store/useToastStore";

export default function MemberSelector() {
  const members = useMembers();
  const settings = useSettings();
  const current = useCurrentMemberName();
  const setCurrentMember = useAppStore((s) => s.setCurrentMember);
  const addMember = useAppStore((s) => s.addMember);
  const deleteMember = useAppStore((s) => s.deleteMember);

  const names = Object.keys(members);

  const onNew = () => {
    const name = window.prompt("새 팀원 이름을 입력하세요");
    if (name === null) return;
    const n = name.trim();
    if (!n) {
      toast("이름이 비어 있습니다");
      return;
    }
    addMember(n);
    toast(`${n} 추가됨`);
  };

  const onDelete = () => {
    if (!current) {
      toast("선택된 팀원이 없습니다");
      return;
    }
    if (!window.confirm(`"${current}"의 모든 업무 데이터를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;
    deleteMember(current);
    toast(`"${current}" 삭제됨`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-[160px] flex-1">
        <label className="m-label" htmlFor="memberSel">
          평가 대상 팀원
        </label>
        <select
          id="memberSel"
          className="m-input cursor-pointer"
          value={current ?? ""}
          onChange={(e) => setCurrentMember(e.target.value || null)}
        >
          {names.length === 0 ? (
            <option value="">— 팀원 없음 —</option>
          ) : (
            names.map((n) => {
              const m = members[n];
              const taskCnt = (m.tasks || []).length;
              const mboCnt = settings.mbo.filter((mbo) => {
                const cs = m.categoryScores && m.categoryScores[mbo.id];
                return (m.tasks || []).some((t) => t.mboId === mbo.id) || (cs && (cs.leader != null || cs.member != null));
              }).length;
              return (
                <option key={n} value={n}>
                  {n} [{taskCnt} 업무 / {mboCnt} 항목]
                </option>
              );
            })
          )}
        </select>
      </div>
      <div className="flex items-stretch gap-1.5">
        <button className="m-btn m-btn-sm m-btn-ghost" onClick={onNew}>
          ＋ 팀원 추가
        </button>
        <button className="m-btn m-btn-sm m-btn-ghost m-btn-danger" onClick={onDelete}>
          － 팀원 삭제
        </button>
      </div>
    </div>
  );
}
