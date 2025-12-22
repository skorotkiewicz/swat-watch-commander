// 🍕 Morale Boost Panel - Team fun events!
import type { MoraleEvent, Officer } from "../../types/game";

interface Props {
  events: MoraleEvent[];
  officers: Officer[];
  budget: number;
  onHostEvent: (eventId: string) => void;
  isLoading?: boolean;
}

export function MoraleBoostPanel({ events, officers, budget, onHostEvent, isLoading }: Props) {
  const averageMorale =
    officers.length > 0
      ? Math.round(
          officers.filter((o) => o.status !== "KIA").reduce((sum, o) => sum + o.morale, 0) /
            officers.filter((o) => o.status !== "KIA").length,
        )
      : 0;

  const getMoraleStatus = (morale: number) => {
    if (morale >= 80)
      return { label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500" };
    if (morale >= 60) return { label: "Good", color: "text-lime-400", bg: "bg-lime-500" };
    if (morale >= 40) return { label: "Fair", color: "text-amber-400", bg: "bg-amber-500" };
    if (morale >= 20) return { label: "Low", color: "text-orange-400", bg: "bg-orange-500" };
    return { label: "Critical", color: "text-red-400", bg: "bg-red-500" };
  };

  const moraleStatus = getMoraleStatus(averageMorale);

  return (
    <div className="space-y-6">
      {/* Header with Morale Gauge */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-lime-500 decoration-4 underline-offset-8">
          Squad Morale Center
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">
              Squad Morale
            </p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${moraleStatus.bg} transition-all duration-500`}
                  style={{ width: `${averageMorale}%` }}
                />
              </div>
              <span className={`font-black ${moraleStatus.color}`}>{averageMorale}%</span>
            </div>
            <p className={`text-[10px] font-bold uppercase mt-1 ${moraleStatus.color}`}>
              {moraleStatus.label}
            </p>
          </div>
        </div>
      </div>

      {/* Low Morale Officers Warning */}
      {officers.some((o) => o.morale < 40 && o.status !== "KIA") && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <h3 className="text-orange-400 font-black uppercase text-sm mb-2 flex items-center gap-2">
            <span>⚠️</span> Officers Need Attention
          </h3>
          <div className="flex flex-wrap gap-2">
            {officers
              .filter((o) => o.morale < 40 && o.status !== "KIA")
              .map((o) => (
                <span
                  key={o.id}
                  className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-bold"
                >
                  {o.name} ({o.morale}%)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Morale Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
            <p className="text-slate-500 font-medium">No morale events available.</p>
            <p className="text-xs text-slate-600 mt-1">Advance the day to unlock new events!</p>
          </div>
        ) : (
          events.map((event) => {
            const canAfford = budget >= event.cost;
            return (
              <div
                key={event.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all ${canAfford ? "border-slate-800 hover:border-lime-500/50" : "border-slate-800/50 opacity-60"}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-4xl">{event.icon}</div>
                  <div className="text-right">
                    {event.cost > 0 ? (
                      <span
                        className={`text-sm font-bold ${canAfford ? "text-emerald-400" : "text-red-400"}`}
                      >
                        ${event.cost.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-cyan-400">FREE</span>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-lg text-white uppercase tracking-tight mb-2">
                  {event.title}
                </h3>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{event.description}</p>

                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-4">
                  <span>⏱️ {event.duration}</span>
                  <span className="text-lime-400">+{event.moraleBoost}% Morale</span>
                </div>

                <button
                  type="button"
                  onClick={() => onHostEvent(event.id)}
                  disabled={!canAfford || isLoading}
                  className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                    canAfford
                      ? "bg-gradient-to-r from-lime-600 to-green-500 hover:from-lime-500 hover:to-green-400 text-white shadow-lg shadow-lime-500/20"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {!canAfford ? "Cannot Afford" : "Host Event"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Fun Tips */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
          💡 Commander's Tip
        </h4>
        <p className="text-xs text-slate-400 italic">
          {averageMorale < 50
            ? "Your squad morale is suffering. Consider hosting a team event to boost spirits before the next mission!"
            : averageMorale < 75
              ? "Morale is decent, but there's room for improvement. A pizza party never hurts!"
              : "Excellent morale! Your squad is ready for anything. Keep up the great work, Commander!"}
        </p>
      </div>
    </div>
  );
}
