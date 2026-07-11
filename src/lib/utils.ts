export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

/** 파일 다운로드 트리거 */
export function download(data: string, type: string, name: string): void {
  const b = new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
}

/** YYMMDD 문자열 (전체 백업 파일명용) */
export function ymd6(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
}
