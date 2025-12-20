import { useState } from "react";
import { AdvanceDayOverlay } from "./components/game/AdvanceDayOverlay";
import { Dashboard } from "./components/game/Dashboard";
import { DismissalModal } from "./components/game/DismissalModal";
import { FuneralModal } from "./components/game/FuneralModal";
import { MissionControlPanel } from "./components/game/MissionControlPanel";
import { MissionReportModal } from "./components/game/MissionReportModal";
import { SetupScreen } from "./components/game/SetupScreen";
import { useGameState } from "./hooks/useGameState";
import * as llmService from "./services/llmService";
import type { Mission, Officer } from "./types/game";

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
    upgradeGear,
    rehireLastOfficer,
    honorFallen,
    resetGame,
    clearMissionResult,
    clearError,
    isAdvancingDay,
    scheduleEvent,
    cancelEvent,
    exportSave,
    importSave,
  } = useGameState();

  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [funeralOfficer, setFuneralOfficer] = useState<Officer | null>(null);
  const [funeralEulogy, setFuneralEulogy] = useState<string>("");
  const [isFuneralLoading, setIsFuneralLoading] = useState(false);

  const [dismissalOfficer, setDismissalOfficer] = useState<Officer | null>(null);
  const [dismissalDialogue, setDismissalDialogue] = useState<string>("");
  const [isDismissalLoading, setIsDismissalLoading] = useState(false);

  // Find the current mission in progress if viewing
  const currentMission = gameState.activeMissions.find((m) => m.id === activeMissionId);
  const missionEvents = gameState.currentMissionEvents.filter(
    (e) => e.missionId === activeMissionId,
  );

  const handleHonorFallen = async (officerId: string) => {
    const officer = gameState.officers.find((o) => o.id === officerId);
    if (!officer) return;

    setIsFuneralLoading(true);
    try {
      const eulogy = await llmService.generateFuneralEulogy(officer, "SWAT Team");
      setFuneralOfficer(officer);
      setFuneralEulogy(eulogy);
    } catch (err) {
      console.error("Failed to generate eulogy", err);
      // Fallback
      setFuneralOfficer(officer);
      setFuneralEulogy(`${officer.name} served with honor and distinction. End of watch.`);
    } finally {
      setIsFuneralLoading(false);
    }
  };

  const handleDismissOfficer = async (officerId: string, reason: string) => {
    const officer = gameState.officers.find((o) => o.id === officerId);
    if (!officer) return;

    setIsDismissalLoading(true);
    try {
      const dialogue = await dismissOfficer(officerId, reason);
      if (dialogue) {
        setDismissalOfficer(officer);
        setDismissalDialogue(dialogue);
      }
    } catch (err) {
      console.error("Failed to dismiss officer", err);
    } finally {
      setIsDismissalLoading(false);
    }
  };

  // 1. Setup Screen
  if (!gameState.commanderName) {
    return <SetupScreen onStart={startNewGame} onImport={importSave} />;
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
        onMakeDecision={(eventId, option) => {
          makeDecision(eventId, option);
        }}
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
        onDismissOfficer={handleDismissOfficer}
        onGenerateMission={generateMission}
        onDeclineMission={declineMission}
        onAcceptMission={(missionId, officerIds) => {
          assignOfficersToMission(missionId, officerIds);
          setActiveMissionId(missionId);
        }}
        onAdvanceDay={advanceDay}
        onResetGame={resetGame}
        onViewActiveMission={(mission: Mission) => setActiveMissionId(mission.id)}
        onUpgradeGear={upgradeGear}
        onHonorFallen={handleHonorFallen}
        onRehireLastOfficer={rehireLastOfficer}
        onScheduleEvent={scheduleEvent}
        onCancelEvent={cancelEvent}
        onExportSave={exportSave}
        onImportSave={importSave}
      />

      {/* Advance Day Transition */}
      {isAdvancingDay && <AdvanceDayOverlay day={gameState.day} squadName={gameState.squadName} />}

      {/* Funeral Modal */}
      {funeralOfficer && (
        <FuneralModal
          officer={funeralOfficer}
          eulogy={funeralEulogy}
          onConfirm={() => {
            honorFallen(funeralOfficer.id);
            setFuneralOfficer(null);
            setFuneralEulogy("");
          }}
        />
      )}

      {/* Dismissal Modal */}
      {dismissalOfficer && (
        <DismissalModal
          officer={dismissalOfficer}
          dialogue={dismissalDialogue}
          onConfirm={() => {
            setDismissalOfficer(null);
            setDismissalDialogue("");
          }}
        />
      )}

      {/* Loading Overlay for Actions */}
      {(isFuneralLoading || isDismissalLoading) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white font-bold animate-pulse uppercase tracking-widest text-xs">
              {isFuneralLoading ? "Preparing Memorial Service..." : "Processing Termination..."}
            </p>
          </div>
        </div>
      )}

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
