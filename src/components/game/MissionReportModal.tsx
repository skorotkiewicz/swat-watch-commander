// Mission Report Modal - Final results of a mission
import type { MissionResult } from "../../types/game";

interface Props {
  result: MissionResult;
  onClose: () => void;
}

export function MissionReportModal({ result, onClose }: Props) {
  const { mission, success, outcome, casualties, injuries, rewards } = result;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Success/Failure Header */}
        <div className={`p-8 text-center ${success ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
          <div
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {success ? (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Success Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Failure Icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <h2
            className={`text-3xl font-black italic uppercase tracking-tighter ${
              success ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {success ? "Mission Accomplished" : "Mission Failed"}
          </h2>
          <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">
            {mission.title}
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Outcome Text */}
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800">
            <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">
              Final SITREP
            </h3>
            <p className="text-slate-200 leading-relaxed italic">"{outcome}"</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Casualties & Injuries */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">
                  Unit Status
                </h3>
                <div className="space-y-2">
                  {casualties.length === 0 && injuries.length === 0 && (
                    <p className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> No Casualties
                      Reported
                    </p>
                  )}
                  {casualties.map((name) => (
                    <p
                      key={name}
                      className="text-red-500 text-xs font-bold flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> KIA: {name}
                    </p>
                  ))}
                  {injuries.map((name) => (
                    <p
                      key={name}
                      className="text-amber-500 text-xs font-bold flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> WIA: {name}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div className="space-y-4">
              <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">
                Post-Action Rewards
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Budget</span>
                  <span
                    className={`text-sm font-black ${success ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {success ? `+$${rewards.budget.toLocaleString()}` : "$0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Reputation</span>
                  <span
                    className={`text-sm font-black ${success ? "text-cyan-400" : "text-red-400"}`}
                  >
                    {success ? `+${rewards.reputation}` : "-10"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">XP Gain</span>
                  <span className="text-xs font-black text-purple-400">
                    +{success ? rewards.experience : Math.floor(rewards.experience / 4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {result.aar && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs text-indigo-400 font-black uppercase tracking-widest">
                  COMMAND DEBRIEFING (AAR)
                </h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Tactical</p>
                    <p className="text-sm font-black text-white">{result.aar.tacticalSoundness}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Safety</p>
                    <p className="text-sm font-black text-white">{result.aar.civilianSafety}%</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-indigo-100/80 leading-relaxed font-serif italic border-l-2 border-indigo-500/30 pl-4">
                "{result.aar.debriefing}"
              </p>
            </div>
          )}
        </div>

        <div className="p-8 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 border border-slate-700"
          >
            Acknowledge & Finalize
          </button>
        </div>
      </div>
    </div>
  );
}
