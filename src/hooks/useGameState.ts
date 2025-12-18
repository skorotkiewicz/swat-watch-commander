// Custom hook for managing game state
import { useCallback, useEffect, useState } from "react";
import * as llmService from "../services/llmService";
import type { GameState, LogEntry, Mission, MissionEvent, MissionOption } from "../types/game";

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
  lastMissionResult: null,
  missionsAttemptedToday: 0,
  maxMissionsPerDay: 5,
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
        parsed.failedMissions =
          parsed.failedMissions?.map((m: Mission) => ({
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

        // Migration for existing saves
        if (parsed.missionsAttemptedToday === undefined) parsed.missionsAttemptedToday = 0;
        if (parsed.maxMissionsPerDay === undefined) parsed.maxMissionsPerDay = 5;
        if (parsed.officers) {
          parsed.officers = parsed.officers.map((o: any) => ({
            ...o,
            salary: o.salary || llmService.calculateSalary(o.rank),
            gear: o.gear || { armorLevel: 1, weaponLevel: 1, utilityLevel: 1 },
          }));
        }

        return parsed;
      } catch {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist state to localStorage on every change
  useEffect(() => {
    if (gameState.commanderName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
    };
    setGameState((prev) => ({
      ...prev,
      gameLog: [entry, ...prev.gameLog].slice(0, 100),
    }));
  }, []);

  const startNewGame = useCallback((commanderName: string, squadName: string) => {
    const newState: GameState = {
      ...INITIAL_STATE,
      commanderName,
      squadName,
      gameLog: [
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          type: "Info",
          message: `Commander ${commanderName} has taken command of ${squadName}.`,
        },
      ],
    };
    setGameState(newState);
  }, []);

  const recruitOfficer = useCallback(
    async (specialization?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const existingNames = gameState.officers.map((o) => o.name);
        const officer = await llmService.generateOfficer(existingNames, specialization);

        setGameState((prev) => ({
          ...prev,
          officers: [...prev.officers, officer],
          budget: prev.budget - 5000,
        }));
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
    },
    [gameState.officers, addLog],
  );

  const dismissOfficer = useCallback(
    async (officerId: string, reason: string) => {
      const officer = gameState.officers.find((o) => o.id === officerId);
      if (!officer) return;

      setIsLoading(true);
      try {
        const dialogue = await llmService.generateDismissalDialogue(officer, reason);
        setGameState((prev) => ({
          ...prev,
          officers: prev.officers.filter((o) => o.id !== officerId),
          lastDismissedOfficer: officer,
        }));
        addLog("Warning", `Dismissed ${officer.name}: ${reason}`);
        return dialogue;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to dismiss officer";
        setError(msg);
        setGameState((prev) => ({
          ...prev,
          officers: prev.officers.filter((o) => o.id !== officerId),
          lastDismissedOfficer: officer,
        }));
        addLog("Warning", `Dismissed ${officer.name}: ${reason}`);
      } finally {
        setIsLoading(false);
      }
    },
    [gameState.officers, addLog],
  );

  const rehireLastOfficer = useCallback(() => {
    if (!gameState.lastDismissedOfficer) return;

    const officer = gameState.lastDismissedOfficer;
    setGameState((prev) => ({
      ...prev,
      officers: [...prev.officers, officer],
      lastDismissedOfficer: null,
    }));
    addLog("Success", `Re-hired ${officer.name}! Welcome back to the squad.`);
  }, [gameState.lastDismissedOfficer, addLog]);

  const generateMission = useCallback(async () => {
    if (gameState.missionsAttemptedToday >= gameState.maxMissionsPerDay) {
      throw new Error(
        "Dispatch is currently overloaded. Advance the day to receive new briefings.",
      );
    }

    setIsLoading(true);
    setError(null);
    try {
      const mission = await llmService.generateMission(
        gameState.reputation,
        gameState.day,
        gameState.officers.length,
      );
      setGameState((prev) => ({
        ...prev,
        activeMissions: [...prev.activeMissions, mission],
        missionsAttemptedToday: prev.missionsAttemptedToday + 1,
      }));
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
  }, [
    gameState.reputation,
    gameState.day,
    gameState.missionsAttemptedToday,
    gameState.maxMissionsPerDay,
    addLog,
  ]);

  const assignOfficersToMission = useCallback(
    (missionId: string, officerIds: string[]) => {
      setGameState((prev) => ({
        ...prev,
        activeMissions: prev.activeMissions.map((m) =>
          m.id === missionId
            ? { ...m, assignedOfficers: officerIds, status: "In Progress" as const }
            : m,
        ),
        officers: prev.officers.map((o) =>
          officerIds.includes(o.id) ? { ...o, status: "On Mission" as const } : o,
        ),
      }));
      addLog("Info", "Officers deployed to mission");
    },
    [addLog],
  );

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
        setGameState((prev) => ({
          ...prev,
          currentMissionEvents: [...prev.currentMissionEvents, event],
        }));
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
    [gameState.activeMissions, gameState.officers, gameState.currentMissionEvents, addLog],
  );

  const makeDecision = useCallback(
    async (eventId: string, option: MissionOption) => {
      const event = gameState.currentMissionEvents.find((e) => e.id === eventId);
      if (!event) return;

      const mission = gameState.activeMissions.find((m) => m.id === event.missionId);
      if (!mission) return;

      const officers = gameState.officers.filter((o) => mission.assignedOfficers.includes(o.id));

      setIsLoading(true);
      setError(null);
      try {
        const result = await llmService.resolveDecision(mission, event, option, officers);

        setGameState((prev) => {
          let updatedOfficers = prev.officers.map((o) => {
            if (
              result.casualties.some(
                (name: string) => name.trim().toLowerCase() === o.name.trim().toLowerCase(),
              )
            ) {
              return { ...o, status: "KIA" as const, health: 0 };
            }
            if (
              result.injuries.some(
                (name: string) => name.trim().toLowerCase() === o.name.trim().toLowerCase(),
              )
            ) {
              const injuryDays = Math.floor(Math.random() * 5) + 3;
              return {
                ...o,
                isInjured: true,
                status: "Injured" as const,
                health: Math.max(10, o.health - 30),
                injuryDays,
              };
            }
            return o;
          });

          const updatedEvents = prev.currentMissionEvents.map((e) =>
            e.id === eventId ? { ...e, resolved: true, outcome: result.outcome } : e,
          );

          let nextState: GameState = {
            ...prev,
            officers: updatedOfficers,
            currentMissionEvents: updatedEvents,
          };

          if (result.missionComplete) {
            const completedMission = {
              ...mission,
              status: result.success ? ("Completed" as const) : ("Failed" as const),
            };

            updatedOfficers = updatedOfficers.map((o) => {
              if (mission.assignedOfficers.includes(o.id) && o.status !== "KIA") {
                const newExp = Math.min(100, o.experience + (result.success ? 10 : 3));
                let newRank = o.rank;

                // Promotion Logic
                if (newExp >= 95 && o.rank !== "Lieutenant") newRank = "Lieutenant";
                else if (newExp >= 75 && ["Rookie", "Officer", "Senior Officer"].includes(o.rank))
                  newRank = "Sergeant";
                else if (newExp >= 50 && ["Rookie", "Officer"].includes(o.rank))
                  newRank = "Senior Officer";
                else if (newExp >= 25 && o.rank === "Rookie") newRank = "Officer";

                if (newRank !== o.rank) {
                  addLog("Success", `PROMOTION: ${o.name} has been promoted to ${newRank}!`);
                }

                return {
                  ...o,
                  status: o.isInjured ? ("Injured" as const) : ("Available" as const),
                  experience: newExp,
                  rank: newRank,
                  salary: llmService.calculateSalary(newRank),
                  morale: Math.min(100, Math.max(0, o.morale + (result.success ? 5 : -10))),
                  missionsCompleted: o.missionsCompleted + 1,
                };
              }
              return o;
            });

            nextState = {
              ...nextState,
              officers: updatedOfficers,
              activeMissions: prev.activeMissions.filter((m) => m.id !== mission.id),
              completedMissions: result.success
                ? [...prev.completedMissions, completedMission]
                : prev.completedMissions,
              failedMissions: !result.success
                ? [...prev.failedMissions, completedMission]
                : prev.failedMissions,
              reputation: Math.min(
                100,
                Math.max(0, prev.reputation + (result.success ? mission.rewards.reputation : -10)),
              ),
              budget: result.success ? prev.budget + mission.rewards.budget : prev.budget,
              currentMissionEvents: updatedEvents.filter((e) => e.missionId !== mission.id),
              lastMissionResult: {
                mission: completedMission,
                success: result.success,
                outcome: result.outcome,
                casualties: result.casualties,
                injuries: result.injuries,
                rewards: mission.rewards,
              },
            };
          }
          return nextState;
        });

        if (result.missionComplete) {
          addLog(
            result.success ? "Success" : "Error",
            result.success
              ? `Mission ${mission.title} completed brilliantly. Reward: $${mission.rewards.budget.toLocaleString()}`
              : `Mission ${mission.title} failed. Heavy consequences for the department.`,
          );
        }

        result.casualties.forEach((name: string) => {
          addLog("Error", `Officer ${name} was KIA.`);
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
    [gameState.currentMissionEvents, gameState.activeMissions, gameState.officers, addLog],
  );

  const advanceDay = useCallback(() => {
    setGameState((prev) => {
      const totalSalaries = prev.officers
        .filter((o) => o.status !== "KIA")
        .reduce((acc, o) => acc + o.salary, 0);

      const cityFunding = 10000;
      const netBudgetChange = cityFunding - totalSalaries;

      return {
        ...prev,
        day: prev.day + 1,
        budget: prev.budget + netBudgetChange,
        missionsAttemptedToday: 0,
        // Clear unaccepted sessions, keep active ones
        activeMissions: prev.activeMissions.filter((m) => m.status === "In Progress"),
        officers: prev.officers.map((o) => {
          if (o.isInjured && o.injuryDays > 0) {
            const newDays = o.injuryDays - 1;
            return {
              ...o,
              injuryDays: newDays,
              isInjured: newDays > 0,
              status: newDays > 0 ? ("Injured" as const) : ("Available" as const),
              health: Math.min(100, o.health + (newDays > 0 ? 5 : 20)),
            };
          }
          return { ...o, morale: Math.min(100, o.morale + 2) };
        }),
      };
    });
    addLog("Info", "New shift rotation begins. Payroll processed. Dispatch radio refreshed.");
  }, [addLog]);

  const declineMission = useCallback(
    (missionId: string) => {
      setGameState((prev) => {
        const mission = prev.activeMissions.find((m) => m.id === missionId);
        if (!mission) return prev;
        return {
          ...prev,
          activeMissions: prev.activeMissions.filter((m) => m.id !== missionId),
          reputation: Math.max(0, prev.reputation - 5),
        };
      });
      addLog("Warning", "Mission declined. Public trust decreased.");
    },
    [addLog],
  );

  const clearMissionResult = useCallback(() => {
    setGameState((prev) => ({ ...prev, lastMissionResult: null }));
  }, []);

  const upgradeGear = useCallback(
    (officerId: string, type: "armorLevel" | "weaponLevel" | "utilityLevel") => {
      setGameState((prev) => {
        const officer = prev.officers.find((o) => o.id === officerId);
        if (!officer || officer.status === "KIA") return prev;

        const currentLevel = officer.gear[type];
        if (currentLevel >= 3) return prev;

        const cost = currentLevel * 1000;
        if (prev.budget < cost) {
          setError(
            `Insufficient funds for ${type.replace("Level", "")} upgrade. Need $${cost.toLocaleString()}.`,
          );
          return prev;
        }

        const typeName = type.replace("Level", "");
        return {
          ...prev,
          budget: prev.budget - cost,
          officers: prev.officers.map((o) =>
            o.id === officerId ? { ...o, gear: { ...o.gear, [type]: currentLevel + 1 } } : o,
          ),
          gameLog: [
            {
              id: crypto.randomUUID(),
              timestamp: new Date(),
              type: "Success" as const,
              message: `Upgraded ${officer.name}'s ${typeName} to Level ${currentLevel + 1}.`,
            },
            ...prev.gameLog,
          ].slice(0, 100),
        };
      });
    },
    [],
  );

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
    upgradeGear,
    rehireLastOfficer,
    honorFallen: (officerId: string) => {
      setGameState((prev) => ({
        ...prev,
        officers: prev.officers.filter((o) => o.id !== officerId),
      }));
    },
    resetGame,
    clearMissionResult,
    clearError: () => setError(null),
  };
}
