"use client";

import { useRef } from "react";

interface Props {
  label: React.ReactNode;
  valueDisplay: React.ReactNode;
  value: number;
  min: number;
  max: number;
  clampMin: number;
  clampMax: number;
  highlightMin?: number;
  highlightMax?: number;
  step?: number;
  thumbColor?: string;
  onChange: (v: number) => void;
}

/** 공유 스케일 커스텀 드래그 슬라이더 — 순위 시뮬레이터의 계수/가중치 조정용 */
export function CoefficientSlider({
  label,
  valueDisplay,
  value,
  min,
  max,
  clampMin,
  clampMax,
  highlightMin,
  highlightMax,
  step = 0.01,
  thumbColor = "var(--accent)",
  onChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = (v: number) => `${(((v - min) / (max - min)) * 100).toFixed(2)}%`;

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    const move = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect();
      let ratio = (ev.clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      let v = min + ratio * (max - min);
      v = Math.max(clampMin, Math.min(clampMax, v));
      v = Math.round(v / step) * step;
      onChange(+v.toFixed(4));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="min-w-[130px] text-xs">{label}</span>
      <span className="min-w-9 text-right font-mono text-[13px] font-bold text-accent">{valueDisplay}</span>
      <div ref={trackRef} className="relative flex h-5 flex-1 items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full bg-line" />
        {highlightMin != null && highlightMax != null && (
          <div
            className="absolute h-1 rounded-full border border-line-2 bg-accent-soft"
            style={{ left: pct(highlightMin), width: `${(((highlightMax - highlightMin) / (max - min)) * 100).toFixed(2)}%` }}
          />
        )}
        <div className="absolute left-0 h-1 rounded-full opacity-50" style={{ width: pct(value), background: thumbColor }} />
        <div
          onPointerDown={handlePointerDown}
          className="absolute h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border-[2.5px] border-white shadow-[0_1px_4px_rgba(0,0,0,.2)] active:cursor-grabbing"
          style={{ left: pct(value), background: thumbColor }}
        />
      </div>
    </div>
  );
}
