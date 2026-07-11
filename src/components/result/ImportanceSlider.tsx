interface Props {
  value: number; // 0~100, 10 단위 raw 슬라이더 값
  displayPct: number; // 정규화 후 표시 %
  onChange: (v: number) => void;
}

/** 항목 내 업무 중요도 슬라이더 (10% 스냅). */
export default function ImportanceSlider({ value, displayPct, onChange }: Props) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-canvas px-2 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">중요도</span>
      <input
        type="range"
        className="h-1 flex-1 cursor-pointer accent-primary"
        min={0}
        max={100}
        step={10}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <span className="min-w-[34px] text-right font-mono text-[11px] font-bold text-primary">{displayPct}%</span>
    </div>
  );
}
