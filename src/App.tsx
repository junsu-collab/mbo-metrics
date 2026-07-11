import { useState } from "react";
import Header from "./components/Header";
import InputPanel from "./components/input/InputPanel";
import ResultPanel from "./components/result/ResultPanel";
import SettingsModal from "./components/modals/SettingsModal";
import SimulatorModal from "./components/modals/SimulatorModal";
import AllTasksModal from "./components/modals/AllTasksModal";
import Toast from "./components/Toast";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [allTasksOpen, setAllTasksOpen] = useState(false);

  return (
    <>
      <Header onOpenSettings={() => setSettingsOpen(true)} onOpenSim={() => setSimOpen(true)} />
      <div className="grid min-h-[calc(100vh-57px)] grid-cols-1 lg:grid-cols-[minmax(520px,560px)_1fr]">
        <InputPanel />
        <ResultPanel onOpenAllTasks={() => setAllTasksOpen(true)} />
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {simOpen && <SimulatorModal onClose={() => setSimOpen(false)} />}
      {allTasksOpen && <AllTasksModal onClose={() => setAllTasksOpen(false)} />}

      <Toast />
    </>
  );
}
