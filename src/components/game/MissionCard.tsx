// Mission Card Component
import type { Mission } from "../../types/game";

interface Props {
  mission: Mission;
  onAccept?: () => void;
  onDecline?: () => void;
  onViewDetails?: () => void;
  showActions?: boolean;
}

const priorityColors: Record<string, { bg: string; text: string; glow: string }> = {
  Low: { bg: "bg-slate-500", text: "text-slate-300", glow: "" },
  Medium: { bg: "bg-amber-500", text: "text-amber-300", glow: "" },
  High: { bg: "bg-orange-500", text: "text-orange-300", glow: "shadow-orange-500/20" },
  Critical: { bg: "bg-red-500", text: "text-red-300", glow: "shadow-red-500/30 animate-pulse" },
};

const typeIcons: Record<string, string> = {
  "Hostage Rescue": "🎯",
  "High-Risk Warrant": "📋",
  "Active Shooter": "⚠️",
  "Barricaded Suspect": "🏠",
  "VIP Protection": "👤",
  "Drug Raid": "💊",
  "Bomb Threat": "💣",
};

export function MissionCard({
  mission,
  onAccept,
  onDecline,
  onViewDetails,
  showActions = true,
}: Props) {
  const priority = priorityColors[mission.priority];
  const icon = typeIcons[mission.type] || "📍";

  return (
    <div
      className={`
      bg-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden
      hover:border-cyan-500/30 transition-all duration-300
      ${mission.priority === "Critical" ? "ring-1 ring-red-500/30" : ""}
    `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 ${priority.bg} text-white text-xs font-bold rounded uppercase ${priority.glow} shadow-lg`}
                >
                  {mission.priority}
                </span>
                <span className="text-xs text-slate-500">{mission.type}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{mission.title}</h3>
              <p className="text-sm text-slate-400">{mission.description}</p>
            </div>
          </div>

          {/* Risk indicator */}
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">RISK</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-4 rounded-sm ${
                    i < mission.riskLevel
                      ? mission.riskLevel > 7
                        ? "bg-red-500"
                        : mission.riskLevel > 4
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs font-bold mt-1 ${
                mission.riskLevel > 7
                  ? "text-red-400"
                  : mission.riskLevel > 4
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {mission.riskLevel}/10
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Location</p>
            <p className="text-white">{mission.location}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Est. Duration</p>
            <p className="text-white">{mission.estimatedDuration}</p>
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Required Team</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-lg">
              {mission.requiredOfficers} Officers
            </span>
            {mission.requiredSpecializations.map((spec) => (
              <span
                key={spec}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Briefing</p>
          <p className="text-slate-300 text-sm leading-relaxed">{mission.briefing}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">
              <span className="text-slate-500">XP:</span> +{mission.rewards.experience}
            </span>
            <span className="text-cyan-400">
              <span className="text-slate-500">Rep:</span> +{mission.rewards.reputation}
            </span>
            <span className="text-emerald-400">
              <span className="text-slate-500">Fund:</span> $
              {mission.rewards.budget.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && mission.status === "Available" && (
        <div className="p-4 pt-0 flex gap-2">
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25"
            >
              Accept Mission
            </button>
          )}
          {onDecline && (
            <button
              type="button"
              onClick={onDecline}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all duration-200"
            >
              Decline
            </button>
          )}
        </div>
      )}

      {mission.status === "In Progress" && (
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={onViewDetails}
            className="w-full px-4 py-3 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            View Mission Progress
          </button>
        </div>
      )}
    </div>
  );
}
