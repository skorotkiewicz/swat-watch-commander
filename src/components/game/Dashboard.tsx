// Main Game Dashboard - HQ View
import { useState } from "react";
import type { GameState, InterrogationMessage, Mission, Suspect } from "../../types/game";
import { CommunityEvents } from "./CommunityEvents";
import { InterrogationModal } from "./InterrogationModal";
import { MissionCard } from "./MissionCard";
import { MoraleBoostPanel } from "./MoraleBoostPanel";
import { NemesisPanel } from "./NemesisPanel";
import { OfficerCard } from "./OfficerCard";
import { RandomEventModal } from "./RandomEventModal";

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
  onRehireLastOfficer?: () => void;
  onScheduleEvent: (eventId: string, officerIds: string[]) => void;
  onCancelEvent: (eventId: string) => void;
  onExportSave: () => void;
  onImportSave: (json: string) => void;
  onGenerateCustomMission: (description: string) => void;
  onInterrogate?: (
    suspectId: string,
    history: InterrogationMessage[],
    message: string,
  ) => Promise<string | undefined>;
  onResolveInterrogation?: (suspectId: string, history: InterrogationMessage[]) => Promise<any>;
  onReleaseSuspect: (id: string) => void;
  onChargeSuspect: (id: string) => void;
  onProcessTrial: (id: string) => void;
  onArchiveSuspect: (id: string) => void;
  onRecruitCI: (id: string) => void;
  onAnalyzeEvidence: (id: string) => void;
  onFileEvidence: (id: string) => void;
  onPursueLead: (id: string) => void;
  onDismissNews: (id: string) => void;
  // 🎮 NEW FUN FEATURES
  onResolveRandomEvent: (choiceId?: string) => void;
  onDismissRandomEvent: () => void;
  onHostMoraleEvent: (eventId: string) => void;
  onCreateNemesis: (suspectId: string) => void;
  onTriggerNemesisMission: (nemesisId: string) => void;
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
  onRehireLastOfficer,
  onScheduleEvent,
  onCancelEvent,
  onExportSave,
  onImportSave,
  onGenerateCustomMission,
  onInterrogate,
  onResolveInterrogation,
  onReleaseSuspect,
  onChargeSuspect,
  onProcessTrial,
  onArchiveSuspect,
  onRecruitCI,
  onAnalyzeEvidence,
  onFileEvidence,
  onPursueLead,
  onDismissNews,
  // 🎮 NEW FUN FEATURES
  onResolveRandomEvent,
  onDismissRandomEvent,
  onHostMoraleEvent,
  onCreateNemesis,
  onTriggerNemesisMission,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    | "squad"
    | "missions"
    | "logs"
    | "events"
    | "custody"
    | "evidence"
    | "news"
    | "map"
    | "morale"
    | "nemesis"
  >("missions");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);
  const [recruitSpec, setRecruitSpec] = useState<string | undefined>(undefined);
  const [customDirective, setCustomDirective] = useState("");
  const [activeInterrogationSuspect, setActiveInterrogationSuspect] = useState<Suspect | null>(
    null,
  );

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
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 active:scale-95 border border-white/10"
            >
              Advance Shift
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
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "map" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🗺️</span> City Map
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
          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "events" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🤝</span> Community
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custody")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "custody" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🚔</span> Custody{" "}
            {gameState.suspectsInCustody.length > 0 && (
              <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {gameState.suspectsInCustody.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evidence")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "evidence" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🔦</span> Evidence
            {gameState.evidenceLocker.filter((e) => e.status === "Stored").length > 0 && (
              <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {gameState.evidenceLocker.filter((e) => e.status === "Stored").length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "news" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>📰</span> News
            {gameState.recentNews.length > 0 && (
              <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {gameState.recentNews.length}
              </span>
            )}
          </button>

          {/* 🎮 NEW FUN TABS */}
          <button
            type="button"
            onClick={() => setActiveTab("morale")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "morale" ? "bg-lime-500 text-white shadow-lg shadow-lime-500/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>🍕</span> Morale
            {gameState.moraleEvents.length > 0 && (
              <span className="ml-auto bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {gameState.moraleEvents.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("nemesis")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "nemesis" ? "bg-red-700 text-white shadow-lg shadow-red-700/20" : "hover:bg-slate-900 border border-transparent hover:border-slate-800"}`}
          >
            <span>💀</span> Nemesis
            {gameState.nemeses.filter((n) => n.status === "At Large" || n.status === "Plotting")
              .length > 0 && (
              <span className="ml-auto bg-red-500/40 px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                {
                  gameState.nemeses.filter(
                    (n) => n.status === "At Large" || n.status === "Plotting",
                  ).length
                }
              </span>
            )}
          </button>

          {gameState.lastDismissedOfficer && onRehireLastOfficer && (
            <button
              type="button"
              onClick={onRehireLastOfficer}
              className="mt-2 flex flex-col items-start gap-1 px-4 py-3 rounded-xl font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="group-hover:rotate-[-15deg] transition-transform">🔄</span>
                <span>Undo Dismissal</span>
              </div>
              <span className="text-[10px] opacity-70 font-medium">
                Re-hire {gameState.lastDismissedOfficer.name}
              </span>
            </button>
          )}

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
                  <span className="text-slate-400">On Event</span>
                  <span className="text-emerald-400 font-bold">
                    {gameState.officers.filter((o) => o.status === "On Event").length}
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

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between px-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={onExportSave}
                  className="p-2 text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/5 rounded-lg transition-all"
                  title="Export Strategy Log"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Export</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
                <label
                  className="p-2 text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/5 rounded-lg transition-all cursor-pointer"
                  title="Import Strategy Log"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <title>Import</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"
                    />
                  </svg>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          if (content) onImportSave(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "CRITICAL WARNING: This will permanently PURGE all tactical data. Proceed?",
                    )
                  ) {
                    onResetGame();
                  }
                }}
                className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                title="Emergency Purge HQ"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Purge</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
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

              {/* Custom Mission Input */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-4 items-end">
                <div className="flex-1">
                  <label
                    htmlFor="custom-mission"
                    className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2"
                  >
                    Custom Operational Directive
                  </label>
                  <input
                    id="custom-mission"
                    type="text"
                    value={customDirective}
                    onChange={(e) => setCustomDirective(e.target.value)}
                    placeholder="Describe a custom mission (e.g. 'Rub a bank', 'Clean up city central')..."
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
                <button
                  type="button"
                  disabled={!customDirective.trim() || isLoading}
                  onClick={() => {
                    onGenerateCustomMission(customDirective);
                    setCustomDirective("");
                  }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-sm rounded-xl transition-all disabled:opacity-50 border border-slate-700"
                >
                  Process Directive
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
                      onDismiss={() => {
                        const reason = prompt(
                          "Enter reason for dismissal (e.g., Performance issues, Budget cuts, Misconduct):",
                        );
                        if (reason) onDismissOfficer(o.id, reason);
                      }}
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

          {activeTab === "events" && (
            <CommunityEvents
              events={gameState.availableEvents}
              officers={gameState.officers}
              onScheduleEvent={onScheduleEvent}
              onCancelEvent={onCancelEvent}
              isLoading={isLoading}
            />
          )}

          {activeTab === "custody" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-red-600 decoration-4 underline-offset-8">
                Holding Cells
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.suspectsInCustody.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-medium">No suspects in custody.</p>
                  </div>
                ) : (
                  gameState.suspectsInCustody.map((s) => (
                    <div
                      key={s.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-red-500/50 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-lg text-white uppercase tracking-tight">
                            {s.name}
                          </h3>
                          <p className="text-xs text-red-400 font-bold uppercase tracking-widest">
                            {s.crime}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                            s.status === "Custody"
                              ? "bg-red-500/20 text-red-400"
                              : s.status === "Interrogated"
                                ? "bg-amber-500/20 text-amber-400"
                                : s.status === "Charged"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : s.status === "Sentenced"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className="text-slate-500 text-[10px]">Personality</span>
                          <span className="text-slate-300">{s.personality}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className="text-slate-500 text-[10px]">Resistance</span>
                          <span className="text-red-500">{s.resistance}%</span>
                        </div>
                        {s.intelRevealed && (
                          <div className="pt-2 border-t border-slate-800 mt-2">
                            <span className="text-[10px] text-cyan-500 font-bold uppercase block mb-1">
                              Revealed Intel
                            </span>
                            <p className="text-xs text-slate-300 italic leading-relaxed">
                              "{s.intelRevealed}"
                            </p>
                          </div>
                        )}
                        {(s.trialVerdict || s.trialSentence) && (
                          <div className="pt-2 border-t border-purple-900/50 mt-2 bg-purple-500/5 p-2 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-purple-400 font-bold uppercase">
                                Trial Outcome
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${s.trialVerdict === "Guilty" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
                              >
                                {s.trialVerdict}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 font-medium">
                              Sentence: {s.trialSentence}
                            </p>
                          </div>
                        )}
                      </div>
                      {s.status === "Custody" && (
                        <button
                          type="button"
                          onClick={() => setActiveInterrogationSuspect(s)}
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2"
                        >
                          Begin Interrogation
                        </button>
                      )}
                      {s.status === "Charged" && (
                        <button
                          type="button"
                          onClick={() => onProcessTrial(s.id)}
                          className="w-full py-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-2"
                        >
                          Send to Trial
                        </button>
                      )}
                      {s.status === "Custody" ||
                      s.status === "Interrogated" ||
                      s.status === "Charged" ? (
                        <div className="flex gap-2">
                          {s.status !== "Charged" && (
                            <button
                              type="button"
                              onClick={() => onChargeSuspect(s.id)}
                              className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white border border-blue-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                              Charge
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onReleaseSuspect(s.id)}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Release
                          </button>
                          {/* 💀 Nemesis Option - for dangerous suspects */}
                          {(s.resistance >= 60 || s.intelLevel >= 50) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `⚠️ WARNING: ${s.name} is a dangerous individual. Releasing them may create a NEMESIS who will return for revenge. Proceed?`,
                                  )
                                ) {
                                  onCreateNemesis(s.id);
                                }
                              }}
                              className="flex-1 py-2 bg-red-900/20 hover:bg-red-700 text-red-400 hover:text-white border border-red-700/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                              title="Release this dangerous suspect and they may return as a nemesis"
                            >
                              💀 Release
                            </button>
                          )}
                        </div>
                      ) : s.status === "Sentenced" || s.status === "Released" ? (
                        <button
                          type="button"
                          onClick={() => onArchiveSuspect(s.id)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Archive Case File
                        </button>
                      ) : s.status === "CI" ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                            Informant Status: ACTIVE
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Subject is providing leads from within criminal circles. Use with
                            caution.
                          </p>
                        </div>
                      ) : null}

                      {s.intelRevealed && s.status !== "CI" && s.status !== "Sentenced" && (
                        <button
                          type="button"
                          onClick={() => onRecruitCI(s.id)}
                          className="w-full mt-2 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Recruit as Informant
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "evidence" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-cyan-500 decoration-4 underline-offset-8">
                Evidence Locker
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameState.evidenceLocker.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-medium">Locker is empty.</p>
                  </div>
                ) : (
                  gameState.evidenceLocker.map((e) => (
                    <div
                      key={e.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white uppercase tracking-tight">{e.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase ${e.status === "Analyzed" ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"}`}
                        >
                          {e.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4 flex-1">{e.description}</p>
                      {e.analysisReport && (
                        <div className="mb-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                          <p className="text-[10px] text-cyan-500 font-bold uppercase mb-1">
                            Forensic Report
                          </p>
                          <p className="text-[10px] text-slate-300 italic leading-relaxed">
                            "{e.analysisReport}"
                          </p>
                        </div>
                      )}
                      {e.status === "Analyzed" && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => onFileEvidence(e.id)}
                            className="py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            File Case
                          </button>
                          <button
                            type="button"
                            onClick={() => onPursueLead(e.id)}
                            disabled={isLoading}
                            className="py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Pursue Lead
                          </button>
                        </div>
                      )}
                      {e.status === "Stored" && (
                        <button
                          type="button"
                          onClick={() => onAnalyzeEvidence(e.id)}
                          disabled={isLoading}
                          className="w-full py-2 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-500 hover:text-white border border-cyan-600/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          {isLoading ? "Analyzing..." : "Analyze ($500)"}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "news" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-amber-500 decoration-4 underline-offset-8">
                Press Coverage
              </h2>
              <div className="space-y-4">
                {gameState.recentNews.length === 0 ? (
                  <div className="py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
                    <p className="text-slate-500 font-medium">No news reports.</p>
                  </div>
                ) : (
                  gameState.recentNews.map((n) => (
                    <div
                      key={n.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all relative overflow-hidden group"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1 h-full ${n.sentiment === "Positive" ? "bg-emerald-500" : n.sentiment === "Negative" ? "bg-red-500" : "bg-slate-500"}`}
                      />
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${n.sentiment === "Positive" ? "bg-emerald-500/20 text-emerald-400" : n.sentiment === "Negative" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"}`}
                          >
                            {n.sentiment}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDismissNews(n.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded"
                        >
                          <svg
                            className="w-3 h-3 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            role="img"
                            aria-label="Dismiss News"
                          >
                            <title>Dismiss News</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <h3 className="text-lg font-black text-white italic tracking-tight mb-2">
                        {n.headline}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
                        "{n.content}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "map" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-indigo-500 decoration-4 underline-offset-8">
                Metropolitan Crime Map
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gameState.districts.map((d) => (
                  <div
                    key={d.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                          {d.name}
                        </h3>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${d.status === "Critical" ? "bg-red-500/20 text-red-400" : d.status === "Rising" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                          Crime Level
                        </p>
                        <p
                          className={`text-2xl font-black ${d.crimeLevel > 70 ? "text-red-500" : d.crimeLevel > 40 ? "text-amber-500" : "text-emerald-500"}`}
                        >
                          {d.crimeLevel}%
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                      <div
                        className={`h-full transition-all duration-1000 ${d.crimeLevel > 70 ? "bg-red-500" : d.crimeLevel > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${d.crimeLevel}%` }}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className="text-slate-500">Patrol Presence</span>
                        <span className="text-slate-300">Minimum</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                        <span className="text-slate-500">Response Time</span>
                        <span className="text-slate-300">4-8 Mins</span>
                      </div>
                    </div>

                    {d.crimeLevel > 80 && (
                      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl animate-pulse">
                        <p className="text-[10px] text-red-500 font-black uppercase mb-1">
                          Intelligence Alert
                        </p>
                        <p className="text-xs text-red-200">
                          Major criminal activity detected. A High-Value Target may be operating in
                          this sector.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🍕 MORALE TAB */}
          {activeTab === "morale" && (
            <MoraleBoostPanel
              events={gameState.moraleEvents}
              officers={gameState.officers}
              budget={gameState.budget}
              onHostEvent={onHostMoraleEvent}
              isLoading={isLoading}
            />
          )}

          {/* 💀 NEMESIS TAB */}
          {activeTab === "nemesis" && (
            <NemesisPanel
              nemeses={gameState.nemeses}
              onTriggerMission={onTriggerNemesisMission}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>

      {/* 🎰 RANDOM EVENT MODAL */}
      {gameState.pendingRandomEvent && (
        <RandomEventModal
          event={gameState.pendingRandomEvent}
          onResolve={onResolveRandomEvent}
          onDismiss={onDismissRandomEvent}
        />
      )}

      {/* Interrogation Modal */}
      {activeInterrogationSuspect && onInterrogate && onResolveInterrogation && (
        <InterrogationModal
          suspect={activeInterrogationSuspect}
          onInterrogate={(msg, hist) => onInterrogate(activeInterrogationSuspect.id, hist, msg)}
          onResolve={(hist) => onResolveInterrogation(activeInterrogationSuspect.id, hist)}
          onClose={() => setActiveInterrogationSuspect(null)}
          isLoading={isLoading}
        />
      )}

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
