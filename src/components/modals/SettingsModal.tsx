"use client";

import { useState } from "react";

import { clone } from "@/lib/calc";
import { defaults, uid } from "@/lib/defaults";
import { btn, btnPrimary } from "@/lib/ui";
import { selectSettings } from "@/store/selectors";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/store/useToastStore";
import { useUiStore } from "@/store/useUiStore";
import type { CoefficientItem, MboItem } from "@/types";

import { Modal } from "../shared/Modal";

const inputCls =
  "w-full rounded-md border border-line-2 px-2 py-1.5 transition-colors focus:border-transparent focus:outline-2 focus:outline-accent";

/**
 * 열려 있을 때만 마운트된다(SettingsModal에서 open일 때만 렌더).
 * draft state는 매번 새로 마운트되며 그 시점의 커밋된 settings로 초기화되므로
 * "열 때마다 초기화" 를 effect 없이 마운트 자체로 구현한다.
 */
function SettingsModalContent() {
  const closeModal = useUiStore((s) => s.closeModal);
  const settings = useAppStore(selectSettings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [draft, setDraft] = useState(() => clone(settings));

  const fixedItems = draft.mbo.filter((x) => x.fixed || !x.choice);
  const choiceItems = draft.mbo.filter((x) => x.choice);

  function updateMbo(id: string, patch: Partial<MboItem>) {
    setDraft((d) => ({ ...d, mbo: d.mbo.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }
  function removeMbo(id: string, group: "fixed" | "choice") {
    const list = group === "fixed" ? fixedItems : choiceItems;
    if (list.length <= 1) {
      toast("최소 1개 단계는 있어야 합니다");
      return;
    }
    setDraft((d) => ({ ...d, mbo: d.mbo.filter((x) => x.id !== id) }));
  }
  function addMbo(isChoice: boolean) {
    const item: MboItem = isChoice
      ? { id: uid(), label: "", pts: 0, choice: true }
      : { id: uid(), label: "", pts: 0, fixed: true };
    setDraft((d) => ({ ...d, mbo: [...d.mbo, item] }));
  }

  function updateCoef(kind: "difficulty" | "report", id: string, patch: Partial<CoefficientItem>) {
    setDraft((d) => ({ ...d, [kind]: d[kind].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }

  function handleWeightChange(leader: number) {
    setDraft((d) => ({ ...d, defaultWLeader: leader, defaultWMember: 100 - leader }));
  }

  function handleSave() {
    updateSettings(draft);
    toast("계수 적용됨 · 점수 재계산 완료");
    closeModal();
  }

  function handleReset() {
    if (!window.confirm("모든 계수를 문서 기본값으로 되돌릴까요? (등록된 업무 데이터는 유지됩니다)")) return;
    setDraft(defaults());
    toast("기본값으로 초기화 (저장하려면 적용 누르기)");
  }

  return (
    <Modal
      open
      onClose={closeModal}
      title="설정"
      mark="SET"
      footer={
        <>
          <button onClick={handleReset} className={btn}>
            문서 기본값으로 초기화
          </button>
          <button onClick={handleSave} className={btnPrimary}>
            저장하고 적용
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-md bg-accent-soft px-3 py-2 text-xs text-ink-2">
        계수를 바꾸면 모든 팀원의 항목 점수가 즉시 재계산됩니다.
      </div>

      <SBlock title="난이도 계수" desc="기본값: 단순 0.95 · 일반 1.00 · 복합 1.05 · 전문 1.10 · 전략 1.15. 계수 범위는 좁게 유지하는 게 좋습니다. 점수 간 변별력은 계수보다 항목 배점으로 조정하세요.">
        <CHead withDef />
        {draft.difficulty.map((item) => (
          <CoefRow key={item.id} item={item} onChange={(patch) => updateCoef("difficulty", item.id, patch)} />
        ))}
      </SBlock>

      <SBlock title="기여도 계수" desc="초기값: 낮음 1.00 · 보통 1.10 · 높음 1.20">
        <CHead withDef />
        {draft.report.map((item) => (
          <CoefRow key={item.id} item={item} onChange={(patch) => updateCoef("report", item.id, patch)} />
        ))}
      </SBlock>

      <SBlock title="MBO 항목 배점" desc="원칙상 팀장 조정 불가.">
        <CHead />
        <div className="mb-1 border-b border-dashed border-line pb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
          공통 항목
        </div>
        {fixedItems.map((item) => (
          <MboRow key={item.id} item={item} onChange={(patch) => updateMbo(item.id, patch)} onRemove={() => removeMbo(item.id, "fixed")} />
        ))}
        <button
          onClick={() => addMbo(false)}
          className="mt-1 w-full rounded-lg border border-dashed border-line-2 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
        >
          ＋ 공통 추가
        </button>
        <div className="mb-1 mt-2.5 border-b border-dashed border-line pb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted">
          선택 항목
        </div>
        {choiceItems.map((item) => (
          <MboRow key={item.id} item={item} onChange={(patch) => updateMbo(item.id, patch)} onRemove={() => removeMbo(item.id, "choice")} />
        ))}
        <button
          onClick={() => addMbo(true)}
          className="mt-1 w-full rounded-lg border border-dashed border-line-2 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
        >
          ＋ 선택 추가
        </button>
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-green/30 bg-green-soft px-2.5 py-2 text-xs">
          <label className="flex-1 text-[11.5px] text-muted">선택 항목 합계 배점 목표</label>
          <input
            type="number"
            min={10}
            max={200}
            step={10}
            value={draft.choiceTarget}
            onChange={(e) => setDraft((d) => ({ ...d, choiceTarget: +e.target.value || 40 }))}
            className="w-16 rounded-md border border-line-2 px-2 py-1 text-center font-mono text-[13px] font-bold"
          />
          <span className="text-[11.5px] text-muted">점</span>
        </div>
      </SBlock>

      <SBlock
        title="수행평가(S) 가중치 · 전역"
        desc="팀장과 팀원의 수행점수를 합산할 때 적용하는 비율입니다. 전체 팀원·항목에 동일하게 적용되며, 팀장 70% · 팀원 30%를 권장합니다."
        last
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="min-w-[72px] text-left font-mono text-[12.5px] font-bold text-leader">
            팀장 <span className="text-lg font-bold">{draft.defaultWLeader}</span>%
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={draft.defaultWLeader}
            onChange={(e) => handleWeightChange(+e.target.value)}
            className="h-1.5 flex-1 accent-leader"
          />
          <div className="min-w-[72px] text-right font-mono text-[12.5px] font-bold text-member">
            팀원 <span className="text-lg font-bold">{draft.defaultWMember}</span>%
          </div>
        </div>
        <div className="flex h-2 overflow-hidden rounded-lg">
          <div className="rounded-l-lg bg-leader transition-[width]" style={{ width: `${draft.defaultWLeader}%` }} />
          <div className="flex-1 rounded-r-lg bg-member transition-[width]" style={{ width: `${draft.defaultWMember}%` }} />
        </div>
      </SBlock>
    </Modal>
  );
}

export function SettingsModal() {
  const open = useUiStore((s) => s.modal === "settings");
  return open ? <SettingsModalContent /> : null;
}

function SBlock({
  title,
  desc,
  children,
  last,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`mb-[22px] pb-[22px] ${last ? "" : "border-b border-line"}`}>
      <h3 className="m-0 mb-1 text-[13px] font-bold">{title}</h3>
      <p className="m-0 mb-2.5 text-[11.5px] leading-relaxed text-muted">{desc}</p>
      {children}
    </div>
  );
}

function CHead({ withDef }: { withDef?: boolean }) {
  return (
    <div
      className={`mb-1.5 grid gap-2 px-0.5 font-mono text-[10.5px] tracking-wide text-muted ${
        withDef ? "grid-cols-[100px_1fr_80px]" : "grid-cols-[1fr_92px_30px]"
      }`}
    >
      <span>단계 이름</span>
      {withDef && <span>단계 정의</span>}
      <span className="text-center">{withDef ? "계수(×)" : "배점"}</span>
      {!withDef && <span />}
    </div>
  );
}

function CoefRow({
  item,
  onChange,
}: {
  item: CoefficientItem;
  onChange: (patch: Partial<CoefficientItem>) => void;
}) {
  return (
    <div className="mb-1.5 grid grid-cols-[100px_1fr_80px] items-center gap-2">
      <input value={item.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} />
      <span
        title={item.def || ""}
        className="truncate rounded-md border border-line-2 bg-paper px-2 py-1.5 text-[11.5px] text-muted"
      >
        {item.def || ""}
      </span>
      <input
        type="number"
        step={0.01}
        value={item.coef}
        onChange={(e) => onChange({ coef: +e.target.value || 0 })}
        className={`${inputCls} text-center font-mono`}
      />
    </div>
  );
}

function MboRow({
  item,
  onChange,
  onRemove,
}: {
  item: MboItem;
  onChange: (patch: Partial<MboItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-1.5 grid grid-cols-[1fr_92px_30px] items-center gap-2">
      <input value={item.label} onChange={(e) => onChange({ label: e.target.value })} className={inputCls} />
      {item.choice ? (
        <span className="flex h-8 w-full items-center justify-center rounded-md border border-dashed border-line-2 bg-paper font-mono text-[11.5px] text-muted">
          자율
        </span>
      ) : (
        <input
          type="number"
          step={1}
          value={item.pts}
          onChange={(e) => onChange({ pts: +e.target.value || 0 })}
          className={`${inputCls} text-center font-mono`}
        />
      )}
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-sm text-muted transition-colors hover:border-danger hover:text-danger"
      >
        ✕
      </button>
    </div>
  );
}
