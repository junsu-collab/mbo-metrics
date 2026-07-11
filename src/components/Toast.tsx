import { Info, X } from "lucide-react";
import { useToastStore } from "../store/useToastStore";

export default function Toast() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex w-[min(340px,calc(100vw-2.5rem))] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="m-toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-3 text-[13px] leading-snug text-ink shadow-lg"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
          <span className="flex-1">{t.message}</span>
          <button
            className="m-focus shrink-0 rounded-md p-0.5 text-muted-2 transition hover:bg-canvas hover:text-ink"
            aria-label="닫기"
            onClick={() => dismiss(t.id)}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        </div>
      ))}
    </div>
  );
}
