import { downloadFile, ymd6 } from "@/lib/download";
import type { AllBackup, MemberData, YearData } from "@/types";

export function exportMemberJson(member: MemberData) {
  downloadFile(JSON.stringify(member, null, 2), "application/json", `MBO_${member.name}.json`);
}

export function readMemberJson(file: File): Promise<MemberData> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const o = JSON.parse(e.target?.result as string);
        if (!o.name || !Array.isArray(o.tasks)) throw new Error("invalid");
        resolve(o as MemberData);
      } catch {
        reject(new Error("JSON 형식이 올바르지 않습니다"));
      }
    };
    r.onerror = () => reject(new Error("파일을 읽을 수 없습니다"));
    r.readAsText(file);
  });
}

export function exportAllBackup(years: Record<string, YearData>, currentYear: string | null) {
  const yrs = Object.keys(years);
  if (!yrs.length) return false;
  const blob: AllBackup = {
    kind: "newsdesign-all",
    ver: 3,
    exportedAt: new Date().toISOString(),
    years,
    currentYear,
  };
  downloadFile(JSON.stringify(blob, null, 2), "application/json", `뉴디_${ymd6()}.json`);
  return true;
}

export function readAllBackup(file: File): Promise<AllBackup> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => {
      try {
        const o = JSON.parse(e.target?.result as string);
        if (!o.years || typeof o.years !== "object" || !Object.keys(o.years).length) {
          throw new Error("invalid");
        }
        resolve(o as AllBackup);
      } catch {
        reject(new Error("전체 백업 JSON 형식이 올바르지 않습니다"));
      }
    };
    r.onerror = () => reject(new Error("파일을 읽을 수 없습니다"));
    r.readAsText(file);
  });
}
