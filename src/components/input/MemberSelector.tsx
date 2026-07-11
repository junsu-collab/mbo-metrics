import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { useAppStore, useMembers, useSettings, useCurrentMemberName } from "../../store/useAppStore";
import { toast } from "../../store/useToastStore";

function memberStats(m: { tasks?: unknown[]; categoryScores?: Record<string, { leader: number | null; member: number | null }> }, mboList: { id: string }[]) {
  const taskCnt = (m.tasks || []).length;
  const mboCnt = mboList.filter((mbo) => {
    const cs = m.categoryScores && m.categoryScores[mbo.id];
    return (m.tasks || []).some((t: any) => t.mboId === mbo.id) || (cs && (cs.leader != null || cs.member != null));
  }).length;
  return { taskCnt, mboCnt };
}

export default function MemberSelector() {
  const members = useMembers();
  const settings = useSettings();
  const current = useCurrentMemberName();
  const setCurrentMember = useAppStore((s) => s.setCurrentMember);
  const addMember = useAppStore((s) => s.addMember);
  const deleteMember = useAppStore((s) => s.deleteMember);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const names = Object.keys(members);
  const filtered = useMemo(() => names.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase())), [names, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

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
    setOpen(false);
  };

  const onDelete = (name: string) => {
    if (!window.confirm(`"${name}"의 모든 업무 데이터를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;
    deleteMember(name);
    toast(`"${name}" 삭제됨`);
  };

  const currentStats = current && members[current] ? memberStats(members[current], settings.mbo) : null;

  return (
    <div className="relative mb-4" ref={rootRef}>
      <label className="m-label">평가 대상 팀원</label>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          "m-focus flex w-full items-center gap-2.5 rounded-lg border bg-surface px-3.5 py-2.5 text-left transition " +
          (open ? "border-brand-violet shadow-sm" : "border-line hover:border-brand-violet/40")
        }
      >
        {current ? (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-violet text-[13px] font-bold text-white">
              {current.slice(0, 1)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-brand-violet">{current}</span>
              <span className="text-xs text-muted">
                {currentStats?.taskCnt ?? 0} 업무 · {currentStats?.mboCnt ?? 0} 항목
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-muted">{names.length === 0 ? "등록된 팀원이 없습니다" : "팀원을 선택하세요"}</span>
        )}
        <ChevronDown className={"h-4 w-4 shrink-0 text-muted-2 transition-transform " + (open ? "rotate-180" : "")} strokeWidth={2.25} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
          <div className="border-b border-line p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름으로 검색"
              className="m-input py-1.5 text-[13px]"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted">
                {names.length === 0 ? "등록된 팀원이 없습니다" : "검색 결과가 없습니다"}
              </div>
            ) : (
              filtered.map((n) => {
                const { taskCnt, mboCnt } = memberStats(members[n], settings.mbo);
                const active = n === current;
                return (
                  <div
                    key={n}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setCurrentMember(n);
                      setOpen(false);
                    }}
                    className={
                      "group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition " +
                      (active ? "bg-brand-violet-soft" : "hover:bg-canvas")
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                          (active ? "bg-brand-violet text-white" : "bg-canvas text-muted-2")
                        }
                      >
                        {n.slice(0, 1)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className={"truncate text-[13px] font-medium " + (active ? "text-brand-violet" : "text-ink-2")}>{n}</span>
                        <span className="text-[10px] text-muted">
                          {taskCnt} 업무 · {mboCnt} 항목
                        </span>
                      </span>
                    </div>
                    <span
                      role="button"
                      aria-label={`${n} 삭제`}
                      title="팀원 삭제"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n);
                      }}
                      className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg text-muted-2 transition hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-500/10"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              onClick={onNew}
              className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-primary transition hover:bg-primary-soft"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              새 팀원 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
