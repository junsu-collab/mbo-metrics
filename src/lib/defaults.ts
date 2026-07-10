import type { Settings } from "@/types";

/** 문서 기본 계수 (8장 운영 초기값) */
export function defaults(): Settings {
  return {
    mbo: [
      { id: "mbo1", label: "제작안정성", pts: 10, fixed: true },
      { id: "mbo2", label: "조직강화기여", pts: 10, fixed: true },
      { id: "mbo3", label: "뉴스그래픽 범위와 완성도", pts: 40, fixed: true },
      { id: "mbo4", label: "디자인 개발", pts: 0, choice: true },
      { id: "mbo5", label: "빅이벤트 지원", pts: 0, choice: true },
      { id: "mbo6", label: "선거방송 대응", pts: 0, choice: true },
    ],
    difficulty: [
      { id: "d1", label: "단순", coef: 0.95, def: "매뉴얼에 따른 반복" },
      { id: "d2", label: "일반", coef: 1.0, def: "적정 수준의 실무" },
      { id: "d3", label: "복합", coef: 1.05, def: "다각적 접근 활용" },
      { id: "d4", label: "전문", coef: 1.1, def: "고도의 지식과 스킬 요구" },
      { id: "d5", label: "전략", coef: 1.15, def: "독자 판단 및 방향 설정" },
    ],
    report: [
      { id: "r1", label: "낮음", coef: 1.0, def: "미보고" },
      { id: "r2", label: "보통", coef: 1.1, def: "주간업무보고 1~2회" },
      { id: "r3", label: "높음", coef: 1.2, def: "주간업무보고 3회 이상" },
    ],
    defaultWLeader: 70,
    defaultWMember: 30,
    choiceTarget: 40,
  };
}

export function uid(): string {
  return "u" + Math.random().toString(36).slice(2, 8);
}
