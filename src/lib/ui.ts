export const btnBase =
  "inline-flex items-center justify-center gap-1 rounded-lg border font-semibold transition-colors";

export const btn = `${btnBase} border-line-2 bg-white text-ink px-3.5 py-2 text-[13px] hover:border-accent hover:text-accent`;

export const btnPrimary = `${btnBase} border-accent bg-accent text-white px-3.5 py-2 text-[13px] hover:bg-accent-mid`;

export const btnGhost = `${btnBase} border-dashed border-line-2 bg-transparent text-ink px-3.5 py-2 text-[13px] hover:border-accent hover:text-accent`;

export const btnGhostDanger =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-[#e05a5a44] bg-transparent px-3 py-2 text-[12px] font-semibold text-[#e05a5a] transition-colors hover:border-[#e05a5a] hover:bg-[#e05a5a18]";

export const btnSm = `${btnBase} border-line-2 bg-white text-ink px-2.5 py-1.5 text-xs hover:border-accent hover:text-accent`;
