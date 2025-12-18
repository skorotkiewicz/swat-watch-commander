// Mission Control Panel - Active mission management and decision making
import { useState } from "react";
import type { Mission, MissionEvent, MissionOption, Officer } from "../../types/game";
import { OfficerCard } from "./OfficerCard";

interface Props {
  mission: Mission;
  events: MissionEvent[];
  officers: Officer[];
  isLoading: boolean;
  onGenerateEvent: () => void;
  onMakeDecision: (eventId: string, option: MissionOption) => void;
  onBack: () => void;
}

export function MissionControlPanel({
  mission,
  events,
  officers,
  isLoading,
  onGenerateEvent,
  onMakeDecision,
  onBack,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customDirective, setCustomDirective] = useState("");
  const assignedOfficers = officers.filter((o) => mission.assignedOfficers.includes(o.id));
  const latestEvent = events.filter((e) => !e.resolved).slice(-1)[0];
  const resolvedEvents = events.filter((e) => e.resolved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to HQ
          </button>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-400 font-semibold">MISSION IN PROGRESS</span>
          </div>
        </div>

        {/* Mission Header */}
        <div className="bg-slate-900/80 rounded-2xl border border-amber-500/30 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full mb-3 inline-block">
                {mission.priority} PRIORITY
              </span>
              <h1 className="text-3xl font-bold text-white mb-2">{mission.title}</h1>
              <p className="text-slate-400 mb-4">{mission.description}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-cyan-400">
                  <span className="text-slate-500">Location:</span> {mission.location}
                </span>
                <span className="text-cyan-400">
                  <span className="text-slate-500">Type:</span> {mission.type}
                </span>
                <span className="text-cyan-400">
                  <span className="text-slate-500">Risk:</span> {mission.riskLevel}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Team */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-4">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Deployed Team ({assignedOfficers.length})
              </h2>
              <div className="space-y-3">
                {assignedOfficers.map((officer) => (
                  <OfficerCard key={officer.id} officer={officer} compact />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Mission Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Timeline */}
            {resolvedEvents.length > 0 && (
              <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-4">
                <h2 className="text-lg font-bold text-white mb-4">Mission Timeline</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {resolvedEvents.map((event) => (
                    <div key={event.id} className="border-l-2 border-slate-700 pl-4 py-2">
                      <p className="text-slate-300 text-sm">{event.description}</p>
                      {event.outcome && (
                        <p className="text-emerald-400 text-sm mt-1 italic">→ {event.outcome}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Event / Decision */}
            {latestEvent ? (
              <div className="bg-slate-900/80 rounded-2xl border border-cyan-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      latestEvent.type === "Combat"
                        ? "bg-red-500 animate-pulse"
                        : latestEvent.type === "Decision"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-cyan-500"
                    }`}
                  />
                  <span className="text-sm font-semibold uppercase text-slate-400">
                    {latestEvent.type}
                  </span>
                </div>

                <p className="text-white text-lg mb-6 leading-relaxed">{latestEvent.description}</p>

                {latestEvent.options && latestEvent.options.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                      Choose Your Action:
                    </h3>
                    {latestEvent.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedOption(option.id)}
                        disabled={isLoading}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedOption === option.id
                            ? "bg-cyan-500/20 border-cyan-400"
                            : "bg-slate-800/50 border-slate-700 hover:border-cyan-500/50"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white">{option.label}</p>
                            <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                            {option.requiredSpecialization && (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                                Recommended: {option.requiredSpecialization}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-xs font-semibold ${
                                option.riskLevel > 7
                                  ? "text-red-400"
                                  : option.riskLevel > 4
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                              }`}
                            >
                              Risk: {option.riskLevel}/10
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}

                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                        Commander's Directive (Custom):
                      </h3>
                      <div className="space-y-3">
                        <textarea
                          value={customDirective}
                          onChange={(e) => {
                            setCustomDirective(e.target.value);
                            if (e.target.value.trim()) {
                              setSelectedOption("custom");
                            } else if (selectedOption === "custom") {
                              setSelectedOption(null);
                            }
                          }}
                          placeholder="Type your own tactical order here... (e.g., 'Breach through the kitchen window after throwing a flashbang')"
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all placeholder:text-slate-500 h-24 resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOption === "custom") {
                          if (customDirective.trim()) {
                            onMakeDecision(latestEvent.id, {
                              id: "custom",
                              label: "Custom Directive",
                              description: customDirective.trim(),
                              riskLevel: 5, // AI will assess
                            });
                            setCustomDirective("");
                            setSelectedOption(null);
                          }
                        } else if (selectedOption) {
                          const option = latestEvent.options?.find((o) => o.id === selectedOption);
                          if (option) {
                            onMakeDecision(latestEvent.id, option);
                            setSelectedOption(null);
                          }
                        }
                      }}
                      disabled={
                        (selectedOption !== "custom" && !selectedOption) ||
                        (selectedOption === "custom" && !customDirective.trim()) ||
                        isLoading
                      }
                      className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Execute Decision"
                      )}
                    </button>
                  </div>
                )}

                {(!latestEvent.options || latestEvent.options.length === 0) && (
                  <div
                    className={`p-4 rounded-xl ${
                      latestEvent.type === "Success"
                        ? "bg-emerald-500/20 border border-emerald-500/50"
                        : latestEvent.type === "Failure"
                          ? "bg-red-500/20 border border-red-500/50"
                          : "bg-slate-800/50"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        latestEvent.type === "Success"
                          ? "text-emerald-400"
                          : latestEvent.type === "Failure"
                            ? "text-red-400"
                            : "text-white"
                      }`}
                    >
                      {latestEvent.type === "Success"
                        ? "Mission Complete!"
                        : latestEvent.type === "Failure"
                          ? "Mission Failed"
                          : "Awaiting further developments..."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-6 text-center">
                <p className="text-slate-400 mb-4">
                  Team has arrived at the location. Awaiting situation report...
                </p>
                <button
                  type="button"
                  onClick={onGenerateEvent}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none flex items-center justify-center gap-2 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Getting SITREP...
                    </>
                  ) : (
                    "Get Situation Report"
                  )}
                </button>
              </div>
            )}

            {/* Continue Mission Button */}
            {latestEvent?.resolved && mission.status === "In Progress" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onGenerateEvent}
                  disabled={isLoading}
                  className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold rounded-xl transition-all flex items-center gap-2 mx-auto"
                >
                  {isLoading ? "Processing..." : "Continue Mission →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
