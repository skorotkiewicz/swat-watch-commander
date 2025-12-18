import { useState } from "react";
import { Dashboard } from "./components/game/Dashboard";
import { MissionControlPanel } from "./components/game/MissionControlPanel";
import { MissionReportModal } from "./components/game/MissionReportModal";
import { SetupScreen } from "./components/game/SetupScreen";
import { useGameState } from "./hooks/useGameState";

function App() {
  const {
    gameState,
    isLoading,
    error,
    startNewGame,
    recruitOfficer,
    dismissOfficer,
    generateMission,
    assignOfficersToMission,
    generateMissionEvent,
    makeDecision,
    advanceDay,
    declineMission,
    resetGame,
    clearMissionResult,
    clearError,
  } = useGameState();

  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

  // Find the current mission in progress if viewing
  const currentMission = gameState.activeMissions.find((m) => m.id === activeMissionId);
  const missionEvents = gameState.currentMissionEvents.filter(
    (e) => e.missionId === activeMissionId,
  );

  // 1. Setup Screen
  if (!gameState.commanderName) {
    return <SetupScreen onStart={startNewGame} />;
  }

  // 2. Mission Control Panel
  if (activeMissionId && currentMission) {
    return (
      <MissionControlPanel
        mission={currentMission}
        events={missionEvents}
        officers={gameState.officers}
        isLoading={isLoading}
        onGenerateEvent={() => generateMissionEvent(activeMissionId)}
        onMakeDecision={makeDecision}
        onBack={() => setActiveMissionId(null)}
      />
    );
  }

  // 3. HQ Dashboard
  return (
    <div className="relative">
      {/* Scanline Effect Layer */}
      <div className="scanline" />

      <Dashboard
        gameState={gameState}
        isLoading={isLoading}
        onRecruitOfficer={recruitOfficer}
        onDismissOfficer={dismissOfficer}
        onGenerateMission={generateMission}
        onDeclineMission={declineMission}
        onAcceptMission={(missionId, officerIds) => {
          assignOfficersToMission(missionId, officerIds);
          setActiveMissionId(missionId);
        }}
        onAdvanceDay={advanceDay}
        onResetGame={resetGame}
        onViewActiveMission={(mission) => setActiveMissionId(mission.id)}
      />

      {/* Mission Report Modal */}
      {gameState.lastMissionResult && (
        <MissionReportModal
          result={gameState.lastMissionResult}
          onClose={() => {
            clearMissionResult();
            setActiveMissionId(null);
          }}
        />
      )}

      {/* Global Error Notification */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-red-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-red-400 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <p className="font-bold uppercase tracking-widest text-[10px] opacity-70">
                Comm Error
              </p>
              <p className="font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="ml-4 p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay for background tasks like recruiting */}
      {isLoading && !activeMissionId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900 border border-cyan-500/30 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-cyan-500 border-t-transparent animate-spin rounded-full" />
            <p className="font-black italic uppercase tracking-tighter text-cyan-400 animate-pulse">
              Processing Tactical Data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
