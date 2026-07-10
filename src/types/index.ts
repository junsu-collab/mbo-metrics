/** 계수 단계 공통 필드 (난이도/기여도) */
export interface CoefficientItem {
  id: string;
  label: string;
  coef: number;
  def?: string;
}

/** MBO 항목 (공통 배점 고정 or 선택 배점 자율) */
export interface MboItem {
  id: string;
  label: string;
  pts: number;
  fixed?: boolean;
  choice?: boolean;
}

/** 업무 1건. *_Snap 필드는 등록 당시 계수 스냅샷(단계가 삭제돼도 표시 유지) */
export interface Task {
  uid: string;
  taskName: string;
  mboId: string;
  mboLabelSnap?: string;
  mboPtsSnap?: number;
  diffId: string;
  diffLabelSnap?: string;
  diffCoefSnap?: number;
  reportId: string;
  reportLabelSnap?: string;
  reportCoefSnap?: number;
  /** 구버전 마이그레이션용 레거시 필드 */
  leaderScore?: number;
  memberScore?: number;
}

/** MBO 항목별 수행점수(S) 원자값. 팀장/팀원 모두 입력돼야 계산됨 */
export interface CategoryScore {
  leader: number | null;
  member: number | null;
}

export interface MemberData {
  name: string;
  tasks: Task[];
  /** mboId -> {leader, member} */
  categoryScores: Record<string, CategoryScore>;
  /** mboId -> 선택 항목 배점 (팀원별 자율 배분) */
  categoryPts: Record<string, number>;
  /** mboId -> {taskUid -> 0~100 중요도 슬라이더 원값} */
  taskPRatios: Record<string, Record<string, number>>;
}

export interface Settings {
  mbo: MboItem[];
  difficulty: CoefficientItem[];
  report: CoefficientItem[];
  defaultWLeader: number;
  defaultWMember: number;
  choiceTarget: number;
}

export interface YearData {
  members: Record<string, MemberData>;
  settings: Settings;
  current: string | null;
  gutOrder: string[];
}

/** localStorage(mbo_metrics_v1_0)에 저장되는 최상위 구조 */
export interface PersistedState {
  years: Record<string, YearData>;
  currentYear: string | null;
}

/** 전체 팀원 백업 파일(exportAll) 구조 */
export interface AllBackup {
  kind: "newsdesign-all";
  ver: number;
  exportedAt: string;
  years: Record<string, YearData>;
  currentYear: string | null;
}

export type CategoryStatus = "ok" | "noscore" | "empty";

/** categoryResult()의 반환값 — MBO 항목 1개의 계산 결과 */
export interface CategoryResult {
  pts: number;
  status: CategoryStatus;
  n: number;
  weightedW: number;
  conv: number | null;
  ratio: number;
  mbo: MboItem;
  effPts: number;
  tasks: Task[];
  pRatios: number[];
}
