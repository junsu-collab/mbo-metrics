import { useEffect, useState } from "react";
import { useToastStore } from "../store/useToastStore";

export default function Toast() {
  const message = useToastStore((s) => s.message);
  const seq = useToastStore((s) => s.seq);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!seq) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1900);
    return () => clearTimeout(t);
  }, [seq]);

  return (
    <div
      className={
        "fixed bottom-7 left-1/2 z-[9999] -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-white shadow-xl transition-all duration-200 " +
        (show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")
      }
    >
      {message}
    </div>
  );
}
