import type { Officer } from "../../types/game";

interface Props {
  officer: Officer;
  dialogue: string;
  onConfirm: () => void;
}

export function DismissalModal({ officer, dialogue, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="h-40 bg-gradient-to-b from-red-900/40 to-slate-900 flex items-center justify-center relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-black border-4 border-red-900/50 flex items-center justify-center text-4xl mb-4">
              🚫
            </div>
            <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          </div>
        </div>

        <div className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Termination of Service
            </h2>
            <p className="text-red-400 font-bold tracking-widest uppercase text-xs">
              Dismissal Interview
            </p>
          </div>

          <div className="h-px w-full bg-slate-800" />

          <div className="space-y-4">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 italic">
              <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                {dialogue}
              </p>
            </div>

            <div className="text-slate-400">
              <p className="font-bold text-white text-xl">{officer.name}</p>
              <p className="text-sm uppercase tracking-widest font-medium opacity-60">
                {officer.rank} • {officer.specialization}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-red-500 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-900/20"
            >
              Confirm Dismissal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
