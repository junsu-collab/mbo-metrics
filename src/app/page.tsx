"use client";

import { Header } from "@/components/Header";
import { MemberSelector } from "@/components/input/MemberSelector";
import { TaskForm } from "@/components/input/TaskForm";
import { ResultPanel } from "@/components/result/ResultPanel";
import { AllTasksModal } from "@/components/modals/AllTasksModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SimulatorModal } from "@/components/modals/SimulatorModal";

export default function Home() {
  return (
    <>
      <Header />
      <div className="grid min-h-[calc(100vh-55px)] grid-cols-1 md:grid-cols-[minmax(520px,560px)_1fr]">
        <section className="border-b border-line bg-panel px-6 py-5 shadow-[2px_0_12px_rgba(0,0,0,.04)] md:border-b-0 md:border-r">
          <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-muted after:h-px after:flex-1 after:bg-line">
            입력 · INPUT
          </p>
          <MemberSelector />
          <TaskForm />
        </section>
        <section className="bg-paper px-6 py-5">
          <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-muted after:h-px after:flex-1 after:bg-line">
            집계 · RESULT
          </p>
          <ResultPanel />
        </section>
      </div>
      <SettingsModal />
      <SimulatorModal />
      <AllTasksModal />
    </>
  );
}
