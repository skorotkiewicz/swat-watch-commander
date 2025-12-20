import { useEffect, useState } from "react";

interface Props {
  day: number;
  squadName: string;
}

export function AdvanceDayOverlay({ day, squadName }: Props) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/20 to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/40 to-transparent" />
      </div>

      <div
        className={`transition-all duration-1000 transform ${showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <div className="text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse" />
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 border border-white/10">
              <span className="text-4xl font-black italic text-white">SWAT</span>
            </div>
          </div>

          <div className="space-y-2 px-6">
            <h2 className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">
              Shift Rotation
            </h2>
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter text-white uppercase">
              Day {day}
            </h1>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm">
              {squadName} / Tactical Division
            </p>
          </div>

          <div className="flex gap-2 justify-center pt-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <div className="max-w-xs mx-auto pt-8 px-6">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic opacity-60">
              "Tactical rotation in progress. Equipment checked. Intelligence briefed. Processing
              payroll and community engagement reports..."
            </p>
          </div>
        </div>
      </div>

      {/* Scanning lines effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="h-[2px] w-full bg-cyan-500/50 absolute animate-scan" />
      </div>
    </div>
  );
}
