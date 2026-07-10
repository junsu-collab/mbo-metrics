"use client";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  mark?: string;
  wide?: boolean;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, mark = "SET", wide, headerExtra, footer, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,.18)] ${
          wide ? "w-[min(780px,95vw)]" : "w-[min(620px,95vw)]"
        }`}
      >
        <header className="flex flex-shrink-0 items-center gap-3 rounded-t-2xl border-b border-line bg-panel px-[22px] py-4">
          <span className="rounded-md bg-accent px-[9px] py-1 font-mono text-[11px] font-bold tracking-wide text-white">
            {mark}
          </span>
          <h2 className="m-0 flex-1 text-base font-bold">{title}</h2>
          {headerExtra}
          <button
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line bg-white text-sm text-muted transition-colors hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-[22px] py-5">{children}</div>
        {footer && (
          <div className="flex flex-shrink-0 justify-between rounded-b-2xl border-t border-line bg-paper px-[22px] py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
