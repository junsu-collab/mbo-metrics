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

  return <div className={"toast" + (show ? " show" : "")}>{message}</div>;
}
