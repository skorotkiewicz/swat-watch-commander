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
  availableEvents: [],
  suspectsInCustody: [],
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
        if (parsed.availableEvents === undefined) parsed.availableEvents = [];
        if (parsed.suspectsInCustody === undefined) parsed.suspectsInCustody = [];
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
  const [isAdvancingDay, setIsAdvancingDay] = useState(false);
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

  const startNewGame = useCallback(async (commanderName: string, squadName: string) => {
    setIsLoading(true);
    try {
      const initialEvent = await llmService.generateCommunityEvent(50);
      const newState: GameState = {
        ...INITIAL_STATE,
        commanderName,
        squadName,
        availableEvents: [initialEvent],
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
    } catch (_error) {
      console.error("Failed to generate initial event", _error);
      const newState: GameState = {
        ...INITIAL_STATE,
        commanderName,
        squadName,
      };
      setGameState(newState);
    } finally {
      setIsLoading(false);
    }
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

            // Capture Suspect Logic
            if (result.success && Math.random() > 0.4) {
              llmService
                .generateSuspect(mission)
                .then((suspectData) => {
                  const suspect = {
                    ...suspectData,
                    id: crypto.randomUUID(),
                    status: "Custody",
                  };
                  setGameState((s) => ({
                    ...s,
                    suspectsInCustody: [...s.suspectsInCustody, suspect],
                  }));
                  addLog("Info", `SUSPECT APPREHENDED: ${suspect.name} is now in custody.`);
                })
                .catch(console.error);
            }
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

  const advanceDay = useCallback(async () => {
    setIsAdvancingDay(true);

    // Give some time for animation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setGameState((prev) => {
      const scheduledEvents = prev.availableEvents.filter((e) => e.status === "Scheduled");

      let eventBudgetReward = 0;
      let eventReputationReward = 0;

      scheduledEvents.forEach((event) => {
        eventBudgetReward += event.rewards.budget;
        eventReputationReward += event.rewards.reputation;
      });

      const totalSalaries = prev.officers
        .filter((o) => o.status !== "KIA")
        .reduce((acc, o) => acc + o.salary, 0);

      const cityFunding = 10000;
      const netBudgetChange = cityFunding + eventBudgetReward - totalSalaries;

      const updatedOfficers = prev.officers.map((o) => {
        // Reset status for officers who were on mission or event
        let status = o.status;
        if (status === "On Mission" || status === "On Event") {
          status = "Available" as const;
        }

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
        return { ...o, status, morale: Math.min(100, o.morale + 2) };
      });

      return {
        ...prev,
        day: prev.day + 1,
        budget: prev.budget + netBudgetChange,
        reputation: Math.min(100, prev.reputation + eventReputationReward),
        missionsAttemptedToday: 0,
        activeMissions: prev.activeMissions.filter((m) => m.status === "In Progress"),
        availableEvents: [], // Clear old events
        officers: updatedOfficers,
      };
    });

    // Generate new missions and events for the new day
    try {
      const newEvent = await llmService.generateCommunityEvent(gameState.reputation);
      setGameState((prev) => ({
        ...prev,
        availableEvents: [newEvent],
      }));
    } catch (_error) {
      console.error("Failed to generate new day event", _error);
    }

    addLog("Info", "New shift rotation begins. Payroll processed. Dispatch radio refreshed.");
    setIsAdvancingDay(false);
  }, [gameState.reputation, addLog]);

  const generateCommunityEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const event = await llmService.generateCommunityEvent(gameState.reputation);
      setGameState((prev) => ({
        ...prev,
        availableEvents: [...prev.availableEvents, event],
      }));
    } catch (_error) {
      setError("Failed to generate community event");
    } finally {
      setIsLoading(false);
    }
  }, [gameState.reputation]);

  const scheduleEvent = useCallback(
    (eventId: string, officerIds: string[]) => {
      setGameState((prev) => ({
        ...prev,
        availableEvents: prev.availableEvents.map((e) =>
          e.id === eventId
            ? { ...e, status: "Scheduled" as const, assignedOfficers: officerIds }
            : e,
        ),
        officers: prev.officers.map((o) =>
          officerIds.includes(o.id) ? { ...o, status: "On Event" as const } : o,
        ),
      }));
      addLog("Info", "Officers assigned to community event.");
    },
    [addLog],
  );

  const cancelEvent = useCallback(
    (eventId: string) => {
      setGameState((prev) => {
        const event = prev.availableEvents.find((e) => e.id === eventId);
        if (!event) return prev;
        return {
          ...prev,
          availableEvents: prev.availableEvents.map((e) =>
            e.id === eventId ? { ...e, status: "Available" as const, assignedOfficers: [] } : e,
          ),
          officers: prev.officers.map((o) =>
            event.assignedOfficers.includes(o.id) ? { ...o, status: "Available" as const } : o,
          ),
        };
      });
      addLog("Info", "Community event cancelled.");
    },
    [addLog],
  );

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

  const exportSave = useCallback(() => {
    const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `swat-save-day-${gameState.day}-${gameState.squadName.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog("Success", "Tactical data exported to external storage.");
  }, [gameState, addLog]);

  const importSave = useCallback(
    (jsonString: string) => {
      try {
        const parsed = JSON.parse(jsonString);
        // Basic validation - check for required top-level keys
        if (!parsed.commanderName || !parsed.squadName || !Array.isArray(parsed.officers)) {
          throw new Error("Invalid save file format.");
        }

        // Convert date strings back to Date objects
        const hydrated = {
          ...parsed,
          activeMissions:
            parsed.activeMissions?.map((m: any) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })) || [],
          completedMissions:
            parsed.completedMissions?.map((m: any) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })) || [],
          failedMissions:
            parsed.failedMissions?.map((m: any) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            })) || [],
          currentMissionEvents:
            parsed.currentMissionEvents?.map((e: any) => ({
              ...e,
              timestamp: new Date(e.timestamp),
            })) || [],
          gameLog:
            parsed.gameLog?.map((l: any) => ({
              ...l,
              timestamp: new Date(l.timestamp),
            })) || [],
        };

        setGameState(hydrated);
        addLog("Success", "External tactical data synchronized. Squad status updated.");
      } catch (_e) {
        setError("Failed to import save file. The file may be corrupted or invalid.");
      }
    },
    [addLog],
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
    isAdvancingDay,
    scheduleEvent,
    cancelEvent,
    generateCommunityEvent,
    exportSave,
    importSave,
    createCustomMission: async (description: string) => {
      setIsLoading(true);
      try {
        const mission = await llmService.generateCustomMission(
          description,
          gameState.reputation,
          gameState.officers.length,
        );
        setGameState((prev) => ({
          ...prev,
          activeMissions: [...prev.activeMissions, mission],
          missionsAttemptedToday: prev.missionsAttemptedToday + 1,
        }));
        addLog("Mission", `New custom directive received and processed: ${mission.title}`);
      } catch (err) {
        setError("Failed to process custom mission directive.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    interrogateSuspect: async (suspectId: string, history: any[], message: string) => {
      const suspect = gameState.suspectsInCustody.find((s) => s.id === suspectId);
      if (!suspect) return;
      setIsLoading(true);
      try {
        const response = await llmService.interrogateSuspect(
          suspect,
          gameState.commanderName,
          history,
          message,
        );
        return response;
      } catch (err) {
        setError("Interrogation failed.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    resolveInterrogation: async (suspectId: string, history: any[]) => {
      const suspect = gameState.suspectsInCustody.find((s) => s.id === suspectId);
      if (!suspect) return;
      setIsLoading(true);
      try {
        const result = await llmService.resolveInterrogation(suspect, history);

        let unlockedMission: Mission | null = null;
        if (result.success && result.unlockedMission) {
          unlockedMission = {
            id: crypto.randomUUID(),
            title: result.unlockedMission.title,
            description: result.unlockedMission.description,
            type: result.unlockedMission.type,
            priority: "High",
            location: result.unlockedMission.location,
            estimatedDuration: "2-4 hours",
            requiredOfficers: Math.max(2, Math.floor(gameState.officers.length * 0.6)),
            requiredSpecializations: [],
            riskLevel: result.unlockedMission.riskLevel,
            rewards: {
              experience: 150,
              reputation: result.reputationBonus,
              budget: result.unlockedMission.rewardBudget,
            },
            briefing: `INTEL-DRIVEN OPERATION: Based on the interrogation of ${suspect.name}, we have a breakthrough. ${result.unlockedMission.description}`,
            status: "Available",
            assignedOfficers: [],
            createdAt: new Date(),
          };
        }

        setGameState((prev) => ({
          ...prev,
          suspectsInCustody: prev.suspectsInCustody.map((s) =>
            s.id === suspectId
              ? {
                  ...s,
                  status: result.success ? "Charged" : "Released",
                  intelRevealed: result.success ? result.intel : undefined,
                }
              : s,
          ),
          activeMissions: unlockedMission
            ? [...prev.activeMissions, unlockedMission]
            : prev.activeMissions,
          reputation: prev.reputation + result.reputationBonus,
          budget: prev.budget + result.budgetBonus,
        }));

        addLog(
          result.success ? "Success" : "Warning",
          `Interrogation of ${suspect.name} concluded. ${result.intel}${unlockedMission ? " NEW INTEL LEAD ADDED TO DISPATCH." : ""}`,
        );

        if (!result.success && result.reputationBonus < 0) {
          addLog("Error", `Department reputation took a hit due to failed interrogation tactics.`);
        }

        return result;
      } catch (err) {
        setError("Failed to resolve interrogation.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    releaseSuspect: (suspectId: string) => {
      setGameState((prev) => {
        const suspect = prev.suspectsInCustody.find((s) => s.id === suspectId);
        if (!suspect) return prev;

        const reputationChange = suspect.status === "Interrogated" ? 0 : -2;
        addLog("Warning", `${suspect.name} has been released due to lack of evidence.`);

        return {
          ...prev,
          suspectsInCustody: prev.suspectsInCustody.map((s) =>
            s.id === suspectId ? { ...s, status: "Released" as const } : s,
          ),
          reputation: Math.max(0, prev.reputation + reputationChange),
        };
      });
    },
    chargeSuspect: (suspectId: string) => {
      setGameState((prev) => {
        const suspect = prev.suspectsInCustody.find((s) => s.id === suspectId);
        if (!suspect) return prev;

        const budgetCost = 1000;
        const reputationGain = 5;
        addLog("Success", `Official charges filed against ${suspect.name}. Processing for trial.`);

        return {
          ...prev,
          suspectsInCustody: prev.suspectsInCustody.map((s) =>
            s.id === suspectId ? { ...s, status: "Charged" as const } : s,
          ),
          budget: Math.max(0, prev.budget - budgetCost),
          reputation: Math.min(100, prev.reputation + reputationGain),
        };
      });
    },
    processTrial: async (suspectId: string) => {
      const suspect = gameState.suspectsInCustody.find((s) => s.id === suspectId);
      if (!suspect || suspect.status !== "Charged") return;

      setIsLoading(true);
      try {
        const result = await llmService.generateTrialOutcome(suspect, gameState.commanderName);

        setGameState((prev) => ({
          ...prev,
          suspectsInCustody: prev.suspectsInCustody.map((s) =>
            s.id === suspectId
              ? {
                  ...s,
                  status: "Sentenced" as const,
                  trialVerdict: result.verdict,
                  trialSentence: result.sentence,
                }
              : s,
          ),
          reputation: Math.min(100, Math.max(0, prev.reputation + result.reputationImpact)),
          budget: prev.budget + result.budgetImpact,
        }));

        addLog(
          result.verdict === "Guilty" ? "Success" : "Warning",
          `TRIAL CONCLUDED: ${suspect.name} - Verdict: ${result.verdict}. Sentence: ${result.sentence}`,
        );
      } catch (err) {
        setError("Legal proceedings failed.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    archiveSuspect: (suspectId: string) => {
      setGameState((prev) => ({
        ...prev,
        suspectsInCustody: prev.suspectsInCustody.filter((s) => s.id !== suspectId),
      }));
      addLog("Info", "Suspect case file archived and moved to long-term storage.");
    },
  };
}
