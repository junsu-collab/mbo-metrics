import * as XLSX from "xlsx";
import type { MemberData, Settings } from "../types";
import { maxWS, memberSlots, memberTotal, taskValues } from "./calc";

/** 개인 업무 상세 엑셀 (vanilla exportExcel와 동일 컬럼) */
export function exportExcel(member: MemberData, s: Settings, toast: (m: string) => void): void {
  const m = member;
  if (!m || !m.tasks.length) {
    toast("내보낼 업무가 없습니다");
    return;
  }
  const n = m.name;
  const ceil = maxWS(s);
  const head = [
    "팀원", "MBO 항목", "항목 배점", "업무명", "중요도%", "난이도", "난이도 계수", "기여도", "기여도 계수",
    "업무 W", "항목 팀장S", "항목 팀원S", "항목 S환산", "항목 W합계", "기준 상한", "항목 비율%", "항목 점수",
  ];
  const rows: (string | number)[][] = [];
  memberSlots(m, s)
    .filter((r) => r.n > 0)
    .forEach((r) => {
      const ss = (m.categoryScores && m.categoryScores[r.mbo.id]) || { leader: null, member: null };
      r.tasks.forEach((t, i) => {
        const { dif, rep } = taskValues(t, s);
        const k = dif.coef * rep.coef;
        const first = i === 0;
        const wPct = Math.round((r.pRatios[i] || 0) * 100);
        rows.push([
          n, first ? r.mbo.label : "", first ? r.mbo.pts : "", t.taskName,
          wPct,
          dif.label, dif.coef, rep.label, rep.coef, +k.toFixed(3),
          first ? (ss.leader ?? "미입력") : "", first ? (ss.member ?? "미입력") : "",
          first ? (r.conv != null ? +r.conv.toFixed(3) : "미평가") : "",
          first ? +r.weightedW.toFixed(3) : "", first ? +ceil.toFixed(2) : "",
          first ? (r.status === "ok" ? +(r.ratio * 100).toFixed(1) : "—") : "",
          first ? (r.status === "ok" ? +r.pts.toFixed(2) : 0) : "",
        ] as (string | number)[]);
      });
    });
  rows.push([]);
  rows.push([n, "개인 종합 점수(기준 상한 100)", "", "", "", "", "", "", "", "", "", "", "", "", "", "", +memberTotal(m, s).toFixed(2)]);

  const ws = XLSX.utils.aoa_to_sheet([head, ...rows]);
  ws["!cols"] = head.map((h, i) => ({ wch: i === 1 ? 24 : i === 3 ? 26 : i === 4 ? 7 : h.length < 6 ? 8 : 11 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, n.slice(0, 28));
  XLSX.writeFile(wb, `MBO_${n}.xlsx`);
  toast(`MBO_${n}.xlsx 저장`);
}

/** 연도 단위 전체 팀원 종합 순위 엑셀 */
export function exportAllExcel(
  members: Record<string, MemberData>,
  s: Settings,
  year: string,
  toast: (m: string) => void
): void {
  const names = Object.keys(members);
  if (!names.length) {
    toast("등록된 팀원이 없습니다");
    return;
  }
  const ranked = names
    .map((n) => ({ n, tasks: members[n].tasks.length, total: memberTotal(members[n], s) }))
    .sort((a, b) => b.total - a.total);
  const head = ["순위", "팀원", "업무 수", "종합 점수"];
  const body = ranked.map((m, i) => [i + 1, m.n, m.tasks, +m.total.toFixed(2)]);
  const title = `${year}년 뉴스디자인팀 업무평가 종합순위`;
  const aoa: (string | number)[][] = [
    [title],
    [`총 ${ranked.length}명 · 생성 ${new Date().toLocaleDateString("ko-KR")}`],
    [],
    head,
    ...body,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 12 }];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${year} 종합순위`);
  XLSX.writeFile(wb, `MBO_${year}_종합순위.xlsx`);
  toast(`${year}년 종합순위 (${ranked.length}명) 저장`);
}
