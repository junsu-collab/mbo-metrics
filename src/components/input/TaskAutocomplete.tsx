import { useEffect, useMemo, useRef, useState } from "react";
import { useMembers, useCurrentMemberName } from "../../store/useAppStore";
import { toast } from "../../store/useToastStore";

interface Suggestion {
  taskName: string;
  diffId?: string;
  reportId?: string;
  diffLabel?: string;
  repLabel?: string;
  from: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: { diffId?: string; reportId?: string }) => void;
}

export default function TaskAutocomplete({ value, onChange, onPick }: Props) {
  const members = useMembers();
  const current = useCurrentMemberName();
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = value.trim();
    if (!q) return [];
    const lower = q.toLowerCase();
    const seen = new Map<string, Suggestion>();
    Object.entries(members).forEach(([name, m]) => {
      if (name === current || !m.tasks) return;
      m.tasks.forEach((t) => {
        if (!t.taskName) return;
        const tl = t.taskName.toLowerCase();
        if (tl.includes(lower) && !seen.has(t.taskName)) {
          seen.set(t.taskName, {
            taskName: t.taskName,
            diffId: t.diffId,
            reportId: t.reportId,
            diffLabel: t.diffLabelSnap ?? t.diffLabel,
            repLabel: t.reportLabelSnap ?? t.reportLabel,
            from: name,
          });
        }
      });
    });
    return [...seen.values()].slice(0, 6);
  }, [value, members, current]);

  useEffect(() => {
    setActiveIdx(-1);
  }, [suggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const applyItem = (it: Suggestion) => {
    onChange(it.taskName);
    onPick({ diffId: it.diffId, reportId: it.reportId });
    setOpen(false);
    setActiveIdx(-1);
    toast(`"${it.taskName}" 자동완성 · ${it.from}의 설정 적용됨`);
  };

  const highlight = (text: string, q: string) => {
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, i)}
        <b>{text.slice(i, i + q.length)}</b>
        {text.slice(i + q.length)}
      </>
    );
  };

  const listOpen = open && suggestions.length > 0;

  return (
    <div className="ac-wrap" ref={wrapRef}>
      <input
        type="text"
        id="taskName"
        placeholder="예: 고품질 AI 인포그래픽 제작"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!listOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            applyItem(suggestions[activeIdx]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setActiveIdx(-1);
          }
        }}
      />
      <ul className={"ac-list" + (listOpen ? " open" : "")}>
        {suggestions.map((it, i) => (
          <li
            key={it.taskName}
            className={"ac-item" + (i === activeIdx ? " active" : "")}
            onMouseDown={(e) => {
              e.preventDefault();
              applyItem(it);
            }}
          >
            {highlight(it.taskName, value.trim())}
            <div className="ac-meta">
              난이도 {it.diffLabel || "—"} · 기여도 {it.repLabel || "—"} · {it.from}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
