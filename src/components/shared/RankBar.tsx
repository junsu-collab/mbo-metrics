interface Props {
  rank: number;
  gutRank: number;
  name: string;
  total: number;
  max: number;
  isTop: boolean;
}

export function RankBar({ rank, gutRank, name, total, max, isTop }: Props) {
  const d = gutRank - rank;
  const disp =
    d > 0 ? (
      <span className="font-mono text-[11px] font-bold text-green">▲{d}</span>
    ) : d < 0 ? (
      <span className="font-mono text-[11px] font-bold text-warn">▼{-d}</span>
    ) : (
      <span className="font-mono text-[11px] font-bold text-muted">＝</span>
    );

  return (
    <div
      className={`mb-2 grid grid-cols-[36px_1fr_78px] items-center gap-3 rounded-[11px] border bg-white px-3.5 py-2.5 transition-shadow hover:shadow-[var(--shadow)] ${
        isTop ? "border-accent shadow-[0_2px_14px_rgba(26,54,196,.12)]" : "border-line"
      }`}
    >
      <div className="text-center font-mono text-xl font-bold text-accent">{rank}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {name}
          <span className="rounded-md bg-[#f1f1f0] px-1.5 py-px font-mono text-[10.5px] font-semibold text-muted">
            체감 {gutRank}위
          </span>
          {disp}
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-accent-soft">
          <div className="h-full rounded bg-accent transition-[width] duration-300" style={{ width: `${(total / max) * 100}%` }} />
        </div>
      </div>
      <div className="text-right font-mono text-[15px] font-bold text-accent tabular-nums">{total.toFixed(1)}</div>
    </div>
  );
}
