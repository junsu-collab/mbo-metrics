// 저장 구조는 vanilla(mbo_metrics_1_0.html)의 store 형태를 1:1로 타입화한 것이다.
// 기존 JSON 백업 파일을 그대로 불러올 수 있어야 하므로 필드명을 그대로 유지한다.

/** MBO 항목 (배점 기반) */
export interface MboItem {
  id: string;
  label: string;
  pts: number;
  fixed?: boolean;
  choice?: boolean;
}

/** 난이도·기여도 계수 단계 */
export interface CoefItem {
  id: string;
  label: string;
  coef: number;
  def?: string;
}

/** 등록된 업무 1건. *Snap 필드는 계수 단계가 삭제돼도 값을 복원하기 위한 스냅샷. */
export interface Task {
  uid: string;
  taskName: string;
  mboId: string;
  diffId: string;
  reportId: string;
  mboLabelSnap?: string;
  mboPtsSnap?: number;
  diffLabelSnap?: string;
  diffCoefSnap?: number;
  reportLabelSnap?: string;
  reportCoefSnap?: number;
  // 구버전 마이그레이션 대상 필드 (읽기 전용 호환)
  mboLabel?: string;
  mboPts?: number;
  diffLabel?: string;
  diffCoef?: number;
  reportLabel?: string;
  reportCoef?: number;
  leaderScore?: number | null;
  memberScore?: number | null;
  // "모든 업무" 모달에서 임시로 부여
  _member?: string;
}

export interface CategoryScore {
  leader: number | null;
  member: number | null;
}

export interface MemberData {
  name: string;
  tasks: Task[];
  categoryScores: Record<string, CategoryScore>;
  categoryPts: Record<string, number>;
  taskPRatios: Record<string, Record<string, number>>;
  // 구버전 키 (마이그레이션에서 흡수)
  taskWeights?: Record<string, Record<string, number>>;
  slotPts?: Record<string, number>;
  slotScores?: Record<string, CategoryScore>;
}

export interface Settings {
  mbo: MboItem[];
  difficulty: CoefItem[];
  report: CoefItem[];
  defaultWLeader: number;
  defaultWMember: number;
  choiceTarget: number;
}

export interface YearData {
  members: Record<string, MemberData>;
  current: string | null;
  settings: Settings;
  gutOrder: string[];
}

/** localStorage / 전체 백업의 최상위 구조 */
export interface AppState {
  years: Record<string, YearData>;
  currentYear: string | null;
}

/** 항목(MBO) 1개 계산 결과 */
export interface CategoryResult {
  pts: number;
  status: "ok" | "noscore" | "empty";
  n: number;
  weightedW: number;
  conv: number | null;
  ratio: number;
  mbo: MboItem;
  effPts: number;
  tasks: Task[];
  pRatios: number[];
}
