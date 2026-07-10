"use client";

import type { TaskSuggestion } from "@/lib/autocomplete";

function highlight(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <b className="text-accent">{text.slice(i, i + q.length)}</b>
      {text.slice(i + q.length)}
    </>
  );
}

interface Props {
  items: TaskSuggestion[];
  query: string;
  activeIndex: number;
  onPick: (item: TaskSuggestion) => void;
}

export function TaskAutocomplete({ items, query, activeIndex, onPick }: Props) {
  if (!items.length) return null;
  return (
    <ul className="absolute left-0 right-0 top-[calc(100%+3px)] z-[999] m-0 list-none rounded-[10px] border border-accent bg-panel p-1 shadow-[0_6px_24px_rgba(0,102,255,.15)]">
      {items.map((it, i) => (
        <li
          key={it.taskName}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(it);
          }}
          className={`cursor-pointer rounded-md px-3 py-2 text-[13px] leading-snug transition-colors ${
            i === activeIndex ? "bg-accent-soft" : "hover:bg-accent-soft"
          }`}
        >
          {highlight(it.taskName, query)}
          <div className="mt-0.5 font-mono text-[11px] text-muted">
            난이도 {it.diffLabel || "—"} · 기여도 {it.repLabel || "—"} · {it.from}
          </div>
        </li>
      ))}
    </ul>
  );
}
