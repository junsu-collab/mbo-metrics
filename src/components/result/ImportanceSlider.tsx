interface Props {
  value: number; // 0~100, 10 단위 raw 슬라이더 값
  displayPct: number; // 정규화 후 표시 %
  onChange: (v: number) => void;
}

/** 항목 내 업무 중요도 슬라이더 (10% 스냅). */
export default function ImportanceSlider({ value, displayPct, onChange }: Props) {
  return (
    <div className="weight-row">
      <span className="w-label">중요도</span>
      <input
        type="range"
        className="w-slider"
        min={0}
        max={100}
        step={10}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <span className="w-val">{displayPct}%</span>
    </div>
  );
}
