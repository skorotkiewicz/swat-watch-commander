// SWAT Watch Commander Game Types

export interface Officer {
  id: string;
  name: string;
  rank: "Rookie" | "Officer" | "Senior Officer" | "Sergeant" | "Lieutenant";
  specialization: "Assault" | "Sniper" | "Breacher" | "Medic" | "Negotiator" | "Tech Specialist";
  experience: number; // 0-100
  morale: number; // 0-100
  health: number; // 0-100
  skills: {
    marksmanship: number;
    tactics: number;
    fitness: number;
    leadership: number;
    composure: number;
  };
  missionsCompleted: number;
  isInjured: boolean;
  injuryDays: number;
  status: "Available" | "On Mission" | "Injured" | "On Leave" | "KIA";
  salary: number;
  backstory?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type:
    | "Hostage Rescue"
    | "High-Risk Warrant"
    | "Active Shooter"
    | "Barricaded Suspect"
    | "VIP Protection"
    | "Drug Raid"
    | "Bomb Threat";
  priority: "Low" | "Medium" | "High" | "Critical";
  location: string;
  estimatedDuration: string;
  requiredOfficers: number;
  requiredSpecializations: string[];
  riskLevel: number; // 1-10
  rewards: {
    experience: number;
    reputation: number;
    budget: number;
  };
  briefing: string;
  status: "Available" | "In Progress" | "Completed" | "Failed" | "Declined";
  assignedOfficers: string[];
  timeLimit?: number; // in minutes
  createdAt: Date;
}

export interface MissionEvent {
  id: string;
  missionId: string;
  timestamp: Date;
  description: string;
  type: "Info" | "Decision" | "Combat" | "Casualty" | "Success" | "Failure";
  options?: MissionOption[];
  resolved: boolean;
  outcome?: string;
}

export interface MissionOption {
  id: string;
  label: string;
  description: string;
  riskLevel: number; // 1-10
  requiredSpecialization?: string;
}

export interface MissionResult {
  mission: Mission;
  success: boolean;
  outcome: string;
  casualties: string[];
  injuries: string[];
  rewards: {
    experience: number;
    reputation: number;
    budget: number;
  };
}

export interface GameState {
  commanderName: string;
  squadName: string;
  officers: Officer[];
  activeMissions: Mission[];
  completedMissions: Mission[];
  failedMissions: Mission[];
  reputation: number; // 0-100
  budget: number;
  day: number;
  currentMissionEvents: MissionEvent[];
  gameLog: LogEntry[];
  lastMissionResult?: MissionResult | null;
  missionsAttemptedToday: number;
  maxMissionsPerDay: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "Info" | "Warning" | "Error" | "Success" | "Mission";
  message: string;
}
