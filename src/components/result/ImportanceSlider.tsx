interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function ImportanceSlider({ value, onChange }: Props) {
  return (
    <div className="mt-1.5 flex items-center gap-2 rounded-md bg-paper px-2 py-1.5">
      <span className="min-w-[32px] font-mono text-[10px] font-semibold uppercase tracking-wide text-muted">
        중요도
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={10}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="h-[3px] flex-1 accent-accent"
      />
      <span className="min-w-[32px] text-right font-mono text-[11px] font-bold text-accent">{value}%</span>
    </div>
  );
}
