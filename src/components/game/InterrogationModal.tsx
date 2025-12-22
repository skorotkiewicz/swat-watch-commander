import { useEffect, useRef, useState } from "react";
import type { InterrogationMessage, Suspect } from "../../types/game";

interface Props {
  suspect: Suspect;
  onInterrogate: (message: string, history: InterrogationMessage[]) => Promise<string | undefined>;
  onResolve: (history: InterrogationMessage[]) => Promise<any>;
  onClose: () => void;
  isLoading: boolean;
}

export function InterrogationModal({
  suspect,
  onInterrogate,
  onResolve,
  onClose,
  isLoading,
}: Props) {
  const [messages, setMessages] = useState<InterrogationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isResolved, setIsResolved] = useState(false);
  const [resolution, setResolution] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isResolved) return;

    const commanderMsg: InterrogationMessage = { role: "Commander", text: input };
    const newMessages = [...messages, commanderMsg];
    setMessages(newMessages);
    setInput("");

    const response = await onInterrogate(input, messages);
    if (response) {
      setMessages([...newMessages, { role: "Suspect", text: response }]);
    }
  };

  const handleEndInterrogation = async () => {
    if (messages.length < 2 || isLoading || isResolved) return;
    const result = await onResolve(messages);
    if (result) {
      setResolution(result);
      setIsResolved(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-6 backdrop-blur-md">
      <div className="bg-slate-900 max-w-2xl w-full h-[80vh] flex flex-col rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                Interrogation Room B
              </h3>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Subject: {suspect.name} • Crime: {suspect.crime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center text-2xl">
                👤
              </div>
              <p className="text-slate-400 text-sm italic">
                The suspect sits in silence. The recording lamp is red.
                <br />
                Begin the interrogation.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "Commander" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-lg ${
                  m.role === "Commander"
                    ? "bg-cyan-600 text-white rounded-br-none"
                    : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">
                  {m.role}
                </div>
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-700">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {isResolved && resolution && (
            <div className="p-6 bg-slate-950 border-2 border-cyan-500/50 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${resolution.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                >
                  {resolution.success ? "✓" : "✗"}
                </div>
                <div>
                  <h4 className="font-bold text-lg">
                    {resolution.success ? "Suspect Cracked" : "Interrogation Failed"}
                  </h4>
                  <p className="text-slate-400 text-xs">{resolution.intel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">Reputation</p>
                  <p className="text-emerald-400 font-bold">+{resolution.reputationBonus}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">Budget</p>
                  <p className="text-emerald-400 font-bold">+${resolution.budgetBonus}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-all"
              >
                Close File
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {!isResolved && (
          <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your question or tactic..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20"
              >
                Send
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Resistance: <span className="text-red-400">{suspect.resistance}%</span>
              </p>
              <button
                type="button"
                onClick={handleEndInterrogation}
                disabled={messages.length < 2 || isLoading}
                className="text-[10px] text-slate-400 hover:text-red-400 font-black uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <span>⏹</span> End Session & Finalize Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
