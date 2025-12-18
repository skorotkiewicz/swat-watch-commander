// Main Game Dashboard - HQ View
import { useState } from "react";
import type { GameState, Mission } from "../../types/game";
import { MissionCard } from "./MissionCard";
import { OfficerCard } from "./OfficerCard";

interface Props {
  gameState: GameState;
  isLoading: boolean;
  onRecruitOfficer: (specialization?: string) => void;
  onDismissOfficer: (id: string, reason: string) => void;
  onGenerateMission: () => void;
  onDeclineMission: (id: string) => void;
  onAcceptMission: (missionId: string, officerIds: string[]) => void;
  onAdvanceDay: () => void;
  onResetGame: () => void;
  onViewActiveMission: (mission: Mission) => void;
  onUpgradeGear: (officerId: string, type: "armorLevel" | "weaponLevel" | "utilityLevel") => void;
  onHonorFallen: (officerId: string) => void;
}

export function Dashboard({
  gameState,
  isLoading,
  onRecruitOfficer,
  onDismissOfficer,
  onGenerateMission,
  onDeclineMission,
  onAcceptMission,
  onAdvanceDay,
  onResetGame,
  onViewActiveMission,
  onUpgradeGear,
  onHonorFallen,
}: Props) {
  const [activeTab, setActiveTab] = useState<"squad" | "missions" | "logs">("missions");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);
  const [recruitSpec, setRecruitSpec] = useState<string | undefined>(undefined);

  const handleMissionClick = (mission: Mission) => {
    if (mission.status === "In Progress") {
      onViewActiveMission(mission);
    } else {
      setSelectedMission(mission);
      setSelectedOfficerIds([]);
    }
  };

  const toggleOfficerSelection = (id: string) => {
    setSelectedOfficerIds((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id],
    );
  };

  const handleDeploy = () => {
    if (selectedMission && selectedOfficerIds.length > 0) {
      onAcceptMission(selectedMission.id, selectedOfficerIds);
      setSelectedMission(null);
      setSelectedOfficerIds([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold">
              SW
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{gameState.squadName}</h1>
              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
                Commander {gameState.commanderName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Status
              </p>
              <p className="text-sm font-bold text-white">Day {gameState.day}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Budget
              </p>
              <p className="text-sm font-bold text-emerald-400">
                ${gameState.budget.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Dispatch
              </p>
              <p className="text-sm font-bold text-white">
                {gameState.missionsAttemptedToday}/{gameState.maxMissionsPerDay} Briefs
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                Reputation
              </p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${gameState.reputation}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-white">{gameState.reputation}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAdvanceDay}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-all"
            >
              Advance Day
            </button>
            <button
              type="button"
              onClick={onResetGame}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Reset Game"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6">
        {/* Sidebar Tabs */}
        <nav className="w-64 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("missions")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "missions" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🎯</span> Missions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("squad")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "squad" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>👥</span> Squad Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "logs" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>📜</span> Radio Log
          </button>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
              <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">
                Unit Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Officers</span>
                  <span className="font-bold">{gameState.officers.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Available</span>
                  <span className="text-emerald-400 font-bold">
                    {gameState.officers.filter((o) => o.status === "Available").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">On Mission</span>
                  <span className="text-amber-400 font-bold">
                    {gameState.officers.filter((o) => o.status === "On Mission").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">KIA</span>
                  <span className="text-red-500 font-bold">
                    {gameState.officers.filter((o) => o.status === "KIA").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Daily Payroll</span>
                  <span className="text-red-400 font-bold">
                    -$
                    {gameState.officers
                      .filter((o) => o.status !== "KIA")
                      .reduce((acc, o) => acc + o.salary, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">City Funding</span>
                  <span className="text-emerald-400 font-bold">+$10,000</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-auto pr-2">
          {activeTab === "missions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-cyan-500 decoration-4 underline-offset-8">
                  Operational Briefings
                </h2>
                <button
                  type="button"
                  onClick={onGenerateMission}
                  disabled={
                    isLoading || gameState.missionsAttemptedToday >= gameState.maxMissionsPerDay
                  }
                  className="group flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <span className="group-hover:animate-pulse">📻</span>
                  )}
                  Monitor Radio
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {gameState.activeMissions.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-medium">No active deployments or alerts.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Generate a new mission from the dispatch center.
                    </p>
                  </div>
                ) : (
                  gameState.activeMissions.map((m) => (
                    <MissionCard
                      key={m.id}
                      mission={m}
                      onAccept={() => handleMissionClick(m)}
                      onDecline={() => onDeclineMission(m.id)}
                      onViewDetails={() => onViewActiveMission(m)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "squad" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-cyan-500 decoration-4 underline-offset-8">
                  Unit Roster
                </h2>
                <div className="flex gap-3">
                  <select
                    value={recruitSpec || ""}
                    onChange={(e) => setRecruitSpec(e.target.value || undefined)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  >
                    <option value="">Random Spec</option>
                    <option value="Assault">Assault</option>
                    <option value="Sniper">Sniper</option>
                    <option value="Breacher">Breacher</option>
                    <option value="Medic">Medic</option>
                    <option value="Negotiator">Negotiator</option>
                    <option value="Tech Specialist">Tech Specialist</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRecruitOfficer(recruitSpec)}
                    disabled={isLoading || gameState.budget < 5000}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? "Recruiting..." : "Recruit ($5k)"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {gameState.officers.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-medium">
                      Squad is empty. Recruit new officers to begin operations.
                    </p>
                  </div>
                ) : (
                  gameState.officers.map((o) => (
                    <OfficerCard
                      key={o.id}
                      officer={o}
                      showActions
                      onDismiss={() => onDismissOfficer(o.id, "Performance issues")}
                      onUpgradeGear={onUpgradeGear}
                      onHonorFallen={() => onHonorFallen(o.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6 h-full flex flex-col">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-cyan-500 decoration-4 underline-offset-8">
                Incident History
              </h2>
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 flex-1 overflow-auto p-4 font-mono text-sm">
                <div className="space-y-2">
                  {gameState.gameLog.length === 0 ? (
                    <p className="text-slate-600 italic">Radio silence...</p>
                  ) : (
                    gameState.gameLog.map((log) => (
                      <div key={log.id} className="flex gap-4 group">
                        <span className="text-slate-600 flex-shrink-0">
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>
                        <span
                          className={`font-bold ${log.type === "Error" ? "text-red-500" : log.type === "Warning" ? "text-amber-500" : log.type === "Success" ? "text-emerald-400" : log.type === "Mission" ? "text-cyan-400" : "text-slate-400"}`}
                        >
                          {log.type.toUpperCase()}:
                        </span>
                        <span className="text-slate-200">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deployment Modal */}
      {selectedMission && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-4xl w-full max-h-[90vh] flex flex-col rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                  Team Deployment Prep
                </h3>
                <p className="text-slate-400 text-sm">{selectedMission.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="text-slate-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
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

            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Target Details
                </h4>
                <div className="space-y-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                      Objective
                    </p>
                    <p className="text-slate-200 font-medium">{selectedMission.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                        Risk Level
                      </p>
                      <p className="text-slate-200 font-bold">{selectedMission.riskLevel}/10</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                        Personnel Needed
                      </p>
                      <p className="text-slate-200 font-bold">{selectedMission.requiredOfficers}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                      Required Specialists
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedMission.requiredSpecializations.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                  <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest mb-1">
                    Commander's Disclaimer
                  </p>
                  <p className="text-xs text-amber-200/70 leading-relaxed italic">
                    Deploying units is a final order. Ensure the team is balanced for the mission
                    profile. Casualties or failure will impact squad reputation significantly.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                    Personnel Management ({selectedOfficerIds.length}/
                    {selectedMission.requiredOfficers})
                  </h4>
                  <span className="text-[10px] text-slate-500 italic">Available units only</span>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[40vh] pr-2">
                  {gameState.officers
                    .filter((o) => o.status === "Available" || selectedOfficerIds.includes(o.id))
                    .map((o) => (
                      <OfficerCard
                        key={o.id}
                        officer={o}
                        compact
                        selected={selectedOfficerIds.includes(o.id)}
                        onSelect={() => toggleOfficerSelection(o.id)}
                      />
                    ))}
                  {gameState.officers.filter((o) => o.status === "Available").length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      No available units for deployment.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Cancel Deployment
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={selectedOfficerIds.length === 0}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 disabled:opacity-50 disabled:grayscale rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 transition-all transform active:scale-95"
              >
                Confirm Launch Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
