// Custom hook for managing game state
import { useCallback, useState } from "react";
import * as llmService from "../services/llmService";
import type { GameState, LogEntry, Mission, MissionEvent } from "../types/game";

const INITIAL_STATE: GameState = {
  commanderName: "",
  squadName: "",
  officers: [],
  activeMissions: [],
  completedMissions: [],
  failedMissions: [],
  reputation: 50,
  budget: 100000,
  day: 1,
  currentMissionEvents: [],
  gameLog: [],
};

const STORAGE_KEY = "swat-commander-save";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.activeMissions =
          parsed.activeMissions?.map((m: Mission) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })) || [];
        parsed.completedMissions =
          parsed.completedMissions?.map((m: Mission) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })) || [];
        parsed.currentMissionEvents =
          parsed.currentMissionEvents?.map((e: MissionEvent) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })) || [];
        parsed.gameLog =
          parsed.gameLog?.map((l: LogEntry) => ({
            ...l,
            timestamp: new Date(l.timestamp),
          })) || [];
        return parsed;
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save game state to localStorage whenever it changes
  const saveState = useCallback((newState: GameState) => {
    setGameState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setGameState((prev) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        type,
        message,
      };
      const newState = {
        ...prev,
        gameLog: [entry, ...prev.gameLog].slice(0, 100), // Keep last 100 logs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Initialize new game
  const startNewGame = useCallback(
    (commanderName: string, squadName: string) => {
      const newState: GameState = {
        ...INITIAL_STATE,
        commanderName,
        squadName,
        gameLog: [
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: "Info",
            message: `Commander ${commanderName} has taken command of ${squadName}. Recruiting officers...`,
          },
        ],
      };
      saveState(newState);
    },
    [saveState],
  );

  // Generate and recruit new officer
  const recruitOfficer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const existingNames = gameState.officers.map((o) => o.name);
      const officer = await llmService.generateOfficer(existingNames);

      const newState = {
        ...gameState,
        officers: [...gameState.officers, officer],
        budget: gameState.budget - 5000, // Recruitment cost
      };
      saveState(newState);
      addLog("Success", `Recruited ${officer.name} (${officer.specialization}) to the squad!`);
      return officer;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to recruit officer";
      setError(msg);
      addLog("Error", msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [gameState, saveState, addLog]);

  // Dismiss officer
  const dismissOfficer = useCallback(
    async (officerId: string, reason: string) => {
      const officer = gameState.officers.find((o) => o.id === officerId);
      if (!officer) return;

      setIsLoading(true);
      try {
        const dialogue = await llmService.generateDismissalDialogue(officer, reason);

        const newState = {
          ...gameState,
          officers: gameState.officers.filter((o) => o.id !== officerId),
        };
        saveState(newState);
        addLog("Warning", `Dismissed ${officer.name}: ${reason}`);
        return dialogue;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to dismiss officer";
        setError(msg);
        // Still dismiss even if dialogue fails
        const newState = {
          ...gameState,
          officers: gameState.officers.filter((o) => o.id !== officerId),
        };
        saveState(newState);
        addLog("Warning", `Dismissed ${officer.name}: ${reason}`);
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, saveState, addLog],
  );

  // Generate new mission
  const generateMission = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mission = await llmService.generateMission(gameState.reputation, gameState.day);

      const newState = {
        ...gameState,
        activeMissions: [...gameState.activeMissions, mission],
      };
      saveState(newState);
      addLog("Mission", `New mission available: ${mission.title} (${mission.priority} priority)`);
      return mission;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate mission";
      setError(msg);
      addLog("Error", msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [gameState, saveState, addLog]);

  // Assign officers to mission
  const assignOfficersToMission = useCallback(
    (missionId: string, officerIds: string[]) => {
      const newState = {
        ...gameState,
        activeMissions: gameState.activeMissions.map((m) =>
          m.id === missionId
            ? { ...m, assignedOfficers: officerIds, status: "In Progress" as const }
            : m,
        ),
        officers: gameState.officers.map((o) =>
          officerIds.includes(o.id) ? { ...o, status: "On Mission" as const } : o,
        ),
      };
      saveState(newState);
      addLog("Info", "Officers deployed to mission");
    },
    [gameState, saveState, addLog],
  );

  // Generate mission event
  const generateMissionEvent = useCallback(
    async (missionId: string) => {
      const mission = gameState.activeMissions.find((m) => m.id === missionId);
      if (!mission) return;

      const officers = gameState.officers.filter((o) => mission.assignedOfficers.includes(o.id));
      const previousEvents = gameState.currentMissionEvents.filter(
        (e) => e.missionId === missionId,
      );

      setIsLoading(true);
      setError(null);
      try {
        const event = await llmService.generateMissionEvent(mission, officers, previousEvents);

        const newState = {
          ...gameState,
          currentMissionEvents: [...gameState.currentMissionEvents, event],
        };
        saveState(newState);
        return event;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to generate event";
        setError(msg);
        addLog("Error", msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, saveState, addLog],
  );

  // Make decision on event
  const makeDecision = useCallback(
    async (eventId: string, optionId: string) => {
      const event = gameState.currentMissionEvents.find((e) => e.id === eventId);
      if (!event || !event.options) return;

      const option = event.options.find((o) => o.id === optionId);
      if (!option) return;

      const mission = gameState.activeMissions.find((m) => m.id === event.missionId);
      if (!mission) return;

      const officers = gameState.officers.filter((o) => mission.assignedOfficers.includes(o.id));

      setIsLoading(true);
      setError(null);
      try {
        const result = await llmService.resolveDecision(mission, event, option, officers);

        // Update officers based on casualties/injuries
        let updatedOfficers = gameState.officers.map((o) => {
          if (
            result.casualties.some((name: string) => o.name.includes(name) || name.includes(o.name))
          ) {
            return { ...o, status: "KIA" as const, health: 0 };
          }
          if (
            result.injuries.some((name: string) => o.name.includes(name) || name.includes(o.name))
          ) {
            return {
              ...o,
              isInjured: true,
              status: "Injured" as const,
              health: Math.max(10, o.health - 30),
              injuryDays: Math.floor(Math.random() * 5) + 3,
            };
          }
          return o;
        });

        // Update event as resolved
        const updatedEvents = gameState.currentMissionEvents.map((e) =>
          e.id === eventId ? { ...e, resolved: true, outcome: result.outcome } : e,
        );

        let newState: GameState = {
          ...gameState,
          officers: updatedOfficers,
          currentMissionEvents: updatedEvents,
        };

        // If mission complete, move to appropriate list and free officers
        if (result.missionComplete) {
          const completedMission = {
            ...mission,
            status: result.success ? ("Completed" as const) : ("Failed" as const),
          };

          // Update officer stats
          updatedOfficers = updatedOfficers.map((o) => {
            if (mission.assignedOfficers.includes(o.id) && o.status !== "KIA") {
              return {
                ...o,
                status: o.isInjured ? ("Injured" as const) : ("Available" as const),
                experience: Math.min(100, o.experience + (result.success ? 10 : 3)),
                morale: Math.min(100, Math.max(0, o.morale + (result.success ? 5 : -10))),
                missionsCompleted: o.missionsCompleted + 1,
              };
            }
            return o;
          });

          newState = {
            ...newState,
            officers: updatedOfficers,
            activeMissions: gameState.activeMissions.filter((m) => m.id !== mission.id),
            completedMissions: result.success
              ? [...gameState.completedMissions, completedMission]
              : gameState.completedMissions,
            failedMissions: !result.success
              ? [...gameState.failedMissions, completedMission]
              : gameState.failedMissions,
            reputation: Math.min(
              100,
              Math.max(
                0,
                gameState.reputation + (result.success ? mission.rewards.reputation : -10),
              ),
            ),
            currentMissionEvents: updatedEvents.filter((e) => e.missionId !== mission.id),
          };

          addLog(
            result.success ? "Success" : "Error",
            result.success
              ? `Mission ${mission.title} completed successfully!`
              : `Mission ${mission.title} failed.`,
          );
        }

        saveState(newState);

        // Log casualties/injuries
        result.casualties.forEach((name: string) => {
          addLog("Error", `Officer ${name} was killed in action.`);
        });
        result.injuries.forEach((name: string) => {
          addLog("Warning", `Officer ${name} was injured.`);
        });

        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to resolve decision";
        setError(msg);
        addLog("Error", msg);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [gameState, saveState, addLog],
  );

  // Advance day
  const advanceDay = useCallback(() => {
    const newState = {
      ...gameState,
      day: gameState.day + 1,
      budget: gameState.budget + 10000, // Daily budget
      officers: gameState.officers.map((o) => {
        if (o.isInjured && o.injuryDays > 0) {
          const newInjuryDays = o.injuryDays - 1;
          if (newInjuryDays <= 0) {
            return {
              ...o,
              isInjured: false,
              injuryDays: 0,
              status: "Available" as const,
              health: Math.min(100, o.health + 20),
            };
          }
          return { ...o, injuryDays: newInjuryDays, health: Math.min(100, o.health + 5) };
        }
        // Recover morale
        return { ...o, morale: Math.min(100, o.morale + 2) };
      }),
    };
    saveState(newState);
    addLog("Info", `Day ${newState.day} begins. Budget replenished.`);
  }, [gameState, saveState, addLog]);

  // Decline mission
  const declineMission = useCallback(
    (missionId: string) => {
      const mission = gameState.activeMissions.find((m) => m.id === missionId);
      if (!mission) return;

      const newState = {
        ...gameState,
        activeMissions: gameState.activeMissions.filter((m) => m.id !== missionId),
        reputation: Math.max(0, gameState.reputation - 5),
      };
      saveState(newState);
      addLog("Warning", `Declined mission: ${mission.title}. Reputation decreased.`);
    },
    [gameState, saveState, addLog],
  );

  // Reset game
  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(INITIAL_STATE);
  }, []);

  return {
    gameState,
    isLoading,
    error,
    startNewGame,
    recruitOfficer,
    dismissOfficer,
    generateMission,
    assignOfficersToMission,
    generateMissionEvent,
    makeDecision,
    advanceDay,
    declineMission,
    resetGame,
    clearError: () => setError(null),
  };
}
