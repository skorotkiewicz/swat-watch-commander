import { useState } from "react";
import type { CommunityEvent, Officer } from "../../types/game";
import { OfficerCard } from "./OfficerCard";

interface Props {
  events: CommunityEvent[];
  officers: Officer[];
  onScheduleEvent: (eventId: string, officerIds: string[]) => void;
  onCancelEvent: (eventId: string) => void;
  isLoading: boolean;
}

export function CommunityEvents({
  events,
  officers,
  onScheduleEvent,
  onCancelEvent,
  isLoading,
}: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const availableOfficers = officers.filter(
    (o) => o.status === "Available" || (selectedEvent?.assignedOfficers.includes(o.id) ?? false),
  );

  const toggleOfficerSelection = (id: string) => {
    setSelectedOfficerIds((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id],
    );
  };

  const handleSchedule = () => {
    if (selectedEventId && selectedOfficerIds.length > 0) {
      onScheduleEvent(selectedEventId, selectedOfficerIds);
      setSelectedEventId(null);
      setSelectedOfficerIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase underline decoration-emerald-500 decoration-4 underline-offset-8">
          Community & Charity Events
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
            <p className="text-slate-500 font-medium">No community events scheduled today.</p>
            <p className="text-xs text-slate-600 mt-1">Check back after the next shift rotation.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`relative overflow-hidden group bg-slate-900 rounded-3xl border transition-all duration-500 ${event.status === "Scheduled" ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-slate-800 hover:border-slate-700 shadow-xl"}`}
            >
              {event.status === "Scheduled" && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest z-10 animate-pulse">
                  Scheduled
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded uppercase tracking-widest mb-2 inline-block">
                      {event.type}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">{event.title}</h3>
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed italic">
                  "{event.description}"
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-black uppercase mb-1">
                      Requirement
                    </p>
                    <p className="text-sm font-bold text-white">
                      {event.requirements.minOfficers}+ Officers
                      {event.requirements.requiredSpecialization && (
                        <span className="block text-[10px] text-cyan-400 mt-0.5">
                          Needs {event.requirements.requiredSpecialization}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] text-emerald-500 font-black uppercase mb-1">Reward</p>
                    <p className="text-sm font-bold text-emerald-400">
                      ${event.rewards.budget.toLocaleString()} / +{event.rewards.reputation} Rep
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {event.status === "Available" ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setSelectedOfficerIds([]);
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:grayscale text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <span>🤝</span>
                      )}
                      Assign Officers
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onCancelEvent(event.id)}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 font-bold rounded-xl transition-all border border-red-500/20"
                    >
                      Cancel Engagement
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-slate-900 max-w-2xl w-full max-h-[80vh] flex flex-col rounded-3xl border border-emerald-500/30 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                  Event Assignment
                </h3>
                <p className="text-slate-400 text-sm">{selectedEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-xs text-emerald-200/70 italic leading-relaxed">
                Hosting community events builds squad morale and significant public trust. While on
                event duty, officers are unavailable for tactical calls until the next shift
                rotation.
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                    Select Personnel ({selectedOfficerIds.length}/
                    {selectedEvent.requirements.minOfficers}+ min)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[40vh] pr-2">
                  {availableOfficers.map((o) => (
                    <OfficerCard
                      key={o.id}
                      officer={o}
                      compact
                      selected={selectedOfficerIds.includes(o.id)}
                      onSelect={() => toggleOfficerSelection(o.id)}
                    />
                  ))}
                  {availableOfficers.length === 0 && (
                    <p className="col-span-full text-xs text-slate-500 italic text-center py-4">
                      No available units for event duty.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSchedule}
                disabled={
                  isLoading || selectedOfficerIds.length < selectedEvent.requirements.minOfficers
                }
                className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                )}
                Confirm Engagement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
