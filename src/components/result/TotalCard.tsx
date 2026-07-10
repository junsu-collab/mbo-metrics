interface Props {
  name: string;
  total: number;
  count: number;
}

export function TotalCard({ name, total, count }: Props) {
  return (
    <div
      className="mb-3.5 flex items-end justify-between rounded-2xl px-[22px] pb-[18px] pt-4 text-white shadow-[0_4px_20px_rgba(26,54,196,.22)]"
      style={{ background: "linear-gradient(135deg,var(--accent) 0%,var(--accent-mid) 100%)" }}
    >
      <div className="flex flex-col gap-0.5">
        <div className="text-[15px] font-semibold leading-tight opacity-75">{name || "—"}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[52px] font-extrabold leading-none tracking-tighter tabular-nums">
            {total.toFixed(2)}
          </span>
          <span className="text-[15px] font-medium opacity-70">점</span>
        </div>
      </div>
      <div className="self-start text-right font-mono text-[11.5px] opacity-75">
        <span className="rounded-full bg-white/15 px-2 py-0.5">{count} 업무</span>
      </div>
    </div>
  );
}
