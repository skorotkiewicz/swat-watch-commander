// Officer Card Component
import type { Officer } from "../../types/game";

interface Props {
  officer: Officer;
  selected?: boolean;
  onSelect?: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
  compact?: boolean;
  onUpgradeGear?: (officerId: string, type: "armorLevel" | "weaponLevel" | "utilityLevel") => void;
  onHonorFallen?: (officer: Officer) => void;
}

const specializationColors: Record<string, string> = {
  Assault: "from-red-500 to-orange-600",
  Sniper: "from-purple-500 to-indigo-600",
  Breacher: "from-amber-500 to-yellow-600",
  Medic: "from-emerald-500 to-green-600",
  Negotiator: "from-cyan-500 to-blue-600",
  "Tech Specialist": "from-pink-500 to-rose-600",
};

const statusColors: Record<string, string> = {
  Available: "bg-emerald-500",
  "On Mission": "bg-amber-500",
  "On Event": "bg-emerald-400",
  Injured: "bg-red-500",
  "On Leave": "bg-slate-500",
  KIA: "bg-black",
};

const rankBadges: Record<string, string> = {
  Rookie: "★",
  Officer: "★★",
  "Senior Officer": "★★★",
  Sergeant: "★★★★",
  Lieutenant: "★★★★★",
};

export function OfficerCard({
  officer,
  selected,
  onSelect,
  onDismiss,
  showActions = false,
  compact = false,
  onUpgradeGear,
  onHonorFallen,
}: Props) {
  const gradientClass =
    specializationColors[officer.specialization] || "from-slate-500 to-slate-600";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        disabled={officer.status !== "Available"}
        className={`
          p-3 rounded-xl border transition-all duration-200 text-left w-full
          ${
            selected
              ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/20"
              : officer.status === "Available"
                ? "bg-slate-800/50 border-slate-700 hover:border-cyan-500/50"
                : "bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed"
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center font-bold text-white text-sm`}
          >
            {officer.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{officer.name}</p>
            <p className="text-xs text-cyan-400">{officer.specialization}</p>
          </div>
          <div className="text-right">
            <div className={`w-2 h-2 rounded-full ${statusColors[officer.status]} ml-auto mb-1`} />
            <p className="text-xs text-slate-500">{officer.status}</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`
      bg-slate-900/80 rounded-2xl border overflow-hidden transition-all duration-300
      ${
        selected
          ? "border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]"
          : "border-slate-700/50 hover:border-cyan-500/30"
      }
    `}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${gradientClass} p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
              {officer.rank}
            </p>
            <h3 className="text-xl font-bold text-white">{officer.name}</h3>
          </div>
          <span className="text-white/90 text-lg" title={officer.rank}>
            {rankBadges[officer.rank]}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 bg-white/20 rounded-full text-white text-xs font-medium">
            {officer.specialization}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              officer.status === "Available"
                ? "bg-emerald-500/30 text-emerald-300"
                : officer.status === "On Mission"
                  ? "bg-amber-500/30 text-amber-300"
                  : officer.status === "On Event"
                    ? "bg-emerald-400/30 text-emerald-200"
                    : officer.status === "Injured"
                      ? "bg-red-500/30 text-red-300"
                      : officer.status === "KIA"
                        ? "bg-black/50 text-white"
                        : "bg-slate-500/30 text-slate-300"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusColors[officer.status]}`} />
            {officer.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        {/* Status bars */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500 mb-1">Health</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  officer.health > 70
                    ? "bg-emerald-500"
                    : officer.health > 30
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${officer.health}%` }}
              />
            </div>
            <p className="text-xs font-bold text-white mt-1">{officer.health}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Morale</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  officer.morale > 70
                    ? "bg-cyan-500"
                    : officer.morale > 30
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${officer.morale}%` }}
              />
            </div>
            <p className="text-xs font-bold text-white mt-1">{officer.morale}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">XP</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${officer.experience}%` }}
              />
            </div>
            <p className="text-xs font-bold text-white mt-1">{officer.experience}%</p>
          </div>
        </div>

        {/* Skills */}
        <div className="pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Skills</p>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(officer.skills).map(([skill, value]) => (
              <div key={skill} className="text-center">
                <div className="w-full h-1 bg-slate-800 rounded-full mb-1">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${value}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 capitalize">{skill.slice(0, 4)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Backstory */}
        {officer.backstory && (
          <div className="pt-1">
            <p className="text-[11px] text-slate-400 italic line-clamp-2 leading-relaxed">
              "{officer.backstory}"
            </p>
          </div>
        )}

        {/* Tactical Gear */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              Tactical Gear
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["armorLevel", "weaponLevel", "utilityLevel"] as const).map((type) => {
              const level = officer.gear[type];
              const cost = level * 1000;

              const GearIcon = () => {
                if (type === "armorLevel") {
                  return (
                    <svg
                      className="w-4 h-4 text-cyan-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Armor</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  );
                }
                if (type === "weaponLevel") {
                  return (
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <title>Weapon</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10l5 5m0-5l-5 5m-5-5l12 12"
                      />
                      <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    </svg>
                  );
                }
                return (
                  <svg
                    className="w-4 h-4 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Utility</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                );
              };

              return (
                <div key={type} className="bg-slate-950/50 rounded-lg p-2 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <GearIcon />
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-cyan-400" : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {onUpgradeGear && level < 3 && officer.status === "Available" && (
                    <button
                      type="button"
                      onClick={() => onUpgradeGear(officer.id, type)}
                      className="w-full mt-1 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase rounded border border-slate-700 transition-colors"
                    >
                      Up (${(cost / 1000).toFixed(0)}k)
                    </button>
                  )}
                  {level === 3 && (
                    <div className="w-full mt-1 py-1 text-center text-[8px] font-black text-cyan-500 uppercase">
                      Elite
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <div className="flex gap-3">
            <span className="text-slate-500">
              Missions:{" "}
              <span className="text-white font-semibold">{officer.missionsCompleted}</span>
            </span>
            <span className="text-slate-500">
              Daily:{" "}
              <span className="text-red-400 font-semibold">${officer.salary.toLocaleString()}</span>
            </span>
          </div>
          {officer.isInjured && (
            <span className="text-red-400">Recovery: {officer.injuryDays} days</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            {onSelect && officer.status === "Available" && (
              <button
                type="button"
                onClick={onSelect}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                  selected
                    ? "bg-cyan-500 text-white"
                    : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                }`}
              >
                {selected ? "Selected" : "Select for Mission"}
              </button>
            )}
            {onDismiss && officer.status === "Available" && (
              <button
                type="button"
                onClick={onDismiss}
                className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium text-sm transition-all"
              >
                Dismiss
              </button>
            )}
            {onHonorFallen && officer.status === "KIA" && (
              <button
                type="button"
                onClick={() => onHonorFallen(officer)}
                className="flex-1 px-3 py-2 bg-white text-black hover:bg-slate-200 rounded-lg font-black uppercase tracking-tighter text-xs transition-all animate-pulse"
              >
                Arrange Funeral
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
