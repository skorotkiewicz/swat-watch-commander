// 💀 Nemesis Panel - Track your sworn enemies!
import type { Nemesis } from "../../types/game";

interface Props {
  nemeses: Nemesis[];
  onTriggerMission: (nemesisId: string) => void;
  isLoading?: boolean;
}

export function NemesisPanel({ nemeses, onTriggerMission, isLoading }: Props) {
  const getGrudgeColor = (level: number) => {
    if (level >= 8) return "text-red-500";
    if (level >= 5) return "text-orange-400";
    return "text-amber-400";
  };

  const getStatusBadge = (status: Nemesis["status"]) => {
    switch (status) {
      case "At Large":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Plotting":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Captured":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Eliminated":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const activeNemeses = nemeses.filter((n) => n.status !== "Captured" && n.status !== "Eliminated");
  const archivedNemeses = nemeses.filter(
    (n) => n.status === "Captured" || n.status === "Eliminated",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-red-600 decoration-4 underline-offset-8">
          Nemesis Registry
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-2xl animate-pulse">💀</span>
          <span className="text-[10px] font-bold uppercase text-slate-500">
            {activeNemeses.length} Active Threat{activeNemeses.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Warning Banner */}
      {activeNemeses.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="text-4xl animate-pulse">⚠️</div>
          <div>
            <h3 className="text-red-400 font-black uppercase text-sm mb-1">
              Active Threats Detected
            </h3>
            <p className="text-xs text-slate-400">
              {activeNemeses.length} former suspect{activeNemeses.length !== 1 ? "s have" : " has"}{" "}
              sworn revenge against your squad. Hunt them down before they strike!
            </p>
          </div>
        </div>
      )}

      {/* Active Nemeses */}
      <div className="space-y-4">
        {activeNemeses.length === 0 && archivedNemeses.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
            <div className="text-6xl mb-4 opacity-30">💀</div>
            <p className="text-slate-500 font-medium">No nemeses... yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Release a dangerous suspect and they might return with a vengeance!
            </p>
          </div>
        ) : (
          activeNemeses.map((nemesis) => (
            <div
              key={nemesis.id}
              className="bg-slate-900 border border-red-500/30 rounded-2xl overflow-hidden hover:border-red-500/60 transition-all group"
            >
              {/* Nemesis Header */}
              <div className="bg-gradient-to-r from-red-900/50 to-slate-900 p-4 border-b border-red-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">💀</span>
                      <h3 className="font-black text-xl text-white uppercase tracking-tight">
                        {nemesis.alias || nemesis.name}
                      </h3>
                    </div>
                    {nemesis.alias && (
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Formerly: {nemesis.name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded border text-[10px] font-black uppercase ${getStatusBadge(nemesis.status)}`}
                  >
                    {nemesis.status}
                  </span>
                </div>
              </div>

              {/* Nemesis Details */}
              <div className="p-4 space-y-4">
                {/* Grudge Level Meter */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-bold mb-2">
                    <span className="text-slate-500">Grudge Level</span>
                    <span className={getGrudgeColor(nemesis.grudgeLevel)}>
                      {nemesis.grudgeLevel}/10
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${nemesis.grudgeLevel >= 8 ? "bg-red-500" : nemesis.grudgeLevel >= 5 ? "bg-orange-500" : "bg-amber-500"}`}
                      style={{ width: `${nemesis.grudgeLevel * 10}%` }}
                    />
                  </div>
                </div>

                {/* Signature */}
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                  <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Calling Card</p>
                  <p className="text-xs text-slate-300 italic">"{nemesis.signature}"</p>
                </div>

                {/* Backstory */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Intel</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{nemesis.backstory}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-[10px] uppercase font-bold">
                  <div>
                    <span className="text-slate-500">Encounters: </span>
                    <span className="text-white">{nemesis.encounterCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Last Seen: </span>
                    <span className="text-white">
                      {new Date(nemesis.lastEncounter).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {nemesis.status === "At Large" && (
                  <button
                    type="button"
                    onClick={() => onTriggerMission(nemesis.id)}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isLoading ? "Generating Intel..." : "🎯 Hunt Them Down"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Archived Section */}
      {archivedNemeses.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-black uppercase text-slate-600 mb-4 flex items-center gap-2">
            <span>📁</span> Archived ({archivedNemeses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {archivedNemeses.map((nemesis) => (
              <div
                key={nemesis.id}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-3 opacity-60"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-400">
                      {nemesis.alias || nemesis.name}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(nemesis.status)}`}
                    >
                      {nemesis.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {nemesis.encounterCount} encounter{nemesis.encounterCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
