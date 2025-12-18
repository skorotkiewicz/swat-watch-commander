// Game Setup Screen - New Game Creation
import { useState } from "react";

interface Props {
  onStart: (commanderName: string, squadName: string) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [commanderName, setCommanderName] = useState("");
  const [squadName, setSquadName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commanderName.trim() && squadName.trim()) {
      onStart(commanderName.trim(), squadName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-xl w-full">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-2xl shadow-cyan-500/30">
            <svg
              className="w-14 h-14 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 mb-3 tracking-tight">
            SWAT WATCH
          </h1>
          <h2 className="text-2xl font-bold text-white/90 mb-2">COMMANDER</h2>
          <p className="text-cyan-400/70 text-lg">Tactical Command Simulation</p>
        </div>

        {/* Setup Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 shadow-2xl shadow-black/50"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="commanderName"
                className="block text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wider"
              >
                Commander Name
              </label>
              <input
                id="commanderName"
                type="text"
                value={commanderName}
                onChange={(e) => setCommanderName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200"
                placeholder="Enter your name, Commander"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="squadName"
                className="block text-sm font-semibold text-cyan-300 mb-3 uppercase tracking-wider"
              >
                Squad Designation
              </label>
              <input
                id="squadName"
                type="text"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200"
                placeholder="e.g., Alpha Team, Unit 7"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!commanderName.trim() || !squadName.trim()}
            className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40 disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none"
          >
            BEGIN COMMAND
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-600 text-sm mt-8">
          Powered by Local LLM • All decisions are AI-generated
        </p>
      </div>
    </div>
  );
}
