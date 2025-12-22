// 🎰 Random Event Modal - Fun daily surprises!
import type { RandomEvent } from "../../types/game";

interface Props {
  event: RandomEvent;
  onResolve: (choiceId?: string) => void;
  onDismiss: () => void;
}

export function RandomEventModal({ event, onResolve, onDismiss }: Props) {
  const getEventEmoji = (type: string) => {
    switch (type) {
      case "Windfall":
        return "💰";
      case "Disaster":
        return "🔥";
      case "Opportunity":
        return "🎯";
      case "Drama":
        return "🎭";
      case "Chaos":
        return "🌪️";
      case "Morale":
        return "🍕";
      default:
        return "🎲";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "Windfall":
        return "from-emerald-600 to-teal-500";
      case "Disaster":
        return "from-red-600 to-orange-500";
      case "Opportunity":
        return "from-cyan-600 to-blue-500";
      case "Drama":
        return "from-purple-600 to-pink-500";
      case "Chaos":
        return "from-amber-600 to-yellow-500";
      case "Morale":
        return "from-lime-600 to-green-500";
      default:
        return "from-slate-600 to-slate-500";
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "Windfall":
        return "border-emerald-500/50";
      case "Disaster":
        return "border-red-500/50";
      case "Opportunity":
        return "border-cyan-500/50";
      case "Drama":
        return "border-purple-500/50";
      case "Chaos":
        return "border-amber-500/50";
      case "Morale":
        return "border-lime-500/50";
      default:
        return "border-slate-500/50";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div
        className={`bg-slate-900 rounded-3xl border-2 ${getBorderColor(event.type)} max-w-lg w-full overflow-hidden shadow-2xl animate-scaleIn`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${getEventColor(event.type)} p-6 text-center`}>
          <div className="text-6xl mb-3 animate-bounce">{getEventEmoji(event.type)}</div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-lg">
            {event.title}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-1">
            Daily Event • {event.type}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{event.description}</p>

          {/* Effects Preview */}
          {(event.effects.budgetChange ||
            event.effects.reputationChange ||
            event.effects.moraleChange) && (
            <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Effects
              </h4>
              <div className="flex flex-wrap gap-3">
                {event.effects.budgetChange && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${event.effects.budgetChange > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {event.effects.budgetChange > 0 ? "+" : ""}$
                    {event.effects.budgetChange.toLocaleString()}
                  </span>
                )}
                {event.effects.reputationChange && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${event.effects.reputationChange > 0 ? "bg-cyan-500/20 text-cyan-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {event.effects.reputationChange > 0 ? "+" : ""}
                    {event.effects.reputationChange}% Rep
                  </span>
                )}
                {event.effects.moraleChange && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${event.effects.moraleChange > 0 ? "bg-lime-500/20 text-lime-400" : "bg-red-500/20 text-red-400"}`}
                  >
                    {event.effects.moraleChange > 0 ? "+" : ""}
                    {event.effects.moraleChange}% Morale
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Choices or Accept */}
          {event.choices && event.choices.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Your Response
              </h4>
              {event.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onResolve(choice.id)}
                  className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {choice.label}
                    </span>
                    {choice.risk && choice.risk > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded ${choice.risk > 50 ? "bg-red-500/20 text-red-400" : choice.risk > 25 ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"}`}
                      >
                        {choice.risk}% Risk
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {choice.effects.budgetChange && (
                      <span
                        className={`text-[10px] ${choice.effects.budgetChange > 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {choice.effects.budgetChange > 0 ? "+" : ""}$
                        {choice.effects.budgetChange.toLocaleString()}
                      </span>
                    )}
                    {choice.effects.reputationChange && (
                      <span
                        className={`text-[10px] ${choice.effects.reputationChange > 0 ? "text-cyan-400" : "text-red-400"}`}
                      >
                        {choice.effects.reputationChange > 0 ? "+" : ""}
                        {choice.effects.reputationChange}% Rep
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onResolve()}
                className={`flex-1 py-3 bg-gradient-to-r ${getEventColor(event.type)} hover:opacity-90 text-white font-black uppercase tracking-widest rounded-xl transition-all`}
              >
                Acknowledge
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl transition-all"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
