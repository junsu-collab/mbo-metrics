export function downloadFile(data: string | Blob, type: string, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ymd6(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
}
