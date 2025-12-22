// SWAT Watch Commander Game Types

export interface Gear {
  armorLevel: number; // 1-3
  weaponLevel: number; // 1-3
  utilityLevel: number; // 1-3
}

export interface Officer {
  id: string;
  name: string;
  nickname?: string; // Earned through heroic acts
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
  status: "Available" | "On Mission" | "On Event" | "Injured" | "On Leave" | "KIA";
  salary: number;
  backstory?: string;
  gear: Gear;
  medals: string[]; // Array of medal IDs
  killCount: number;
  livesaved: number;
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
  districtId?: string;
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
  aar?: {
    efficiency: number;
    tacticalSoundness: number;
    civilianSafety: number;
    debriefing: string;
  };
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: "Charity" | "Public Relations" | "Training Demo" | "Recruitment Drive";
  requirements: {
    minOfficers: number;
    requiredSpecialization?: string;
  };
  rewards: {
    budget: number;
    reputation: number;
  };
  assignedOfficers: string[];
  status: "Available" | "Scheduled" | "Completed";
}

export interface Suspect {
  id: string;
  name: string;
  crime: string;
  personality: string;
  intelLevel: number; // 0-100, how much they know
  resistance: number; // 0-100, how hard they are to crack
  status: "Custody" | "Interrogated" | "Released" | "Charged" | "Sentenced" | "Archived" | "CI";
  intelRevealed?: string;
  trialVerdict?: string;
  trialSentence?: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  sourceMissionId: string;
  suspectId?: string;
  status: "Stored" | "Analyzed";
  analysisReport?: string;
}

export interface District {
  id: string;
  name: string;
  crimeLevel: number; // 0-100
  status: "Stable" | "Rising" | "Critical";
  activeKingpin?: string;
}

export interface NewsStory {
  id: string;
  headline: string;
  content: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  sourceMissionId?: string;
  timestamp: Date;
}

export interface InterrogationMessage {
  role: "Commander" | "Suspect";
  text: string;
}

// 🏆 MEDALS & ACHIEVEMENTS
export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  rarity: "Bronze" | "Silver" | "Gold" | "Platinum" | "Legendary";
  awardedDate: Date;
  missionId?: string;
}

// 🎰 RANDOM DAILY EVENTS
export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type:
    | "Windfall" // Good fortune - money, gear, recruits
    | "Disaster" // Bad luck - budget cuts, scandals
    | "Opportunity" // Time-limited bonus mission
    | "Drama" // Officer drama, rivalries
    | "Chaos" // Wild card events
    | "Morale"; // Team bonding events
  effects: {
    budgetChange?: number;
    reputationChange?: number;
    moraleChange?: number; // applied to all officers
    officerAffected?: string; // specific officer ID
    bonusMission?: Partial<Mission>;
  };
  choices?: RandomEventChoice[];
  resolved: boolean;
}

export interface RandomEventChoice {
  id: string;
  label: string;
  effects: RandomEvent["effects"];
  risk?: number; // 0-100 chance of backfiring
}

// 💀 NEMESIS SYSTEM - Released suspects return for revenge
export interface Nemesis {
  id: string;
  originalSuspectId: string;
  name: string;
  alias?: string;
  grudgeLevel: number; // 1-10, how much they hate you
  encounterCount: number;
  lastEncounter: Date;
  status: "At Large" | "Plotting" | "Captured" | "Eliminated";
  signature: string; // Their calling card or MO
  backstory: string;
}

// 🍕 MORALE BOOST EVENTS
export interface MoraleEvent {
  id: string;
  title: string;
  description: string;
  type: "Pizza Party" | "BBQ" | "Training Day" | "Awards Ceremony" | "Day Off" | "Team Building";
  cost: number;
  moraleBoost: number;
  duration: string;
  icon: string;
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
  lastDismissedOfficer?: Officer | null;
  availableEvents: CommunityEvent[];
  suspectsInCustody: Suspect[];
  evidenceLocker: EvidenceItem[];
  recentNews: NewsStory[];
  districts: District[];
  // 🎮 NEW FUN FEATURES
  nemeses: Nemesis[];
  pendingRandomEvent?: RandomEvent | null;
  moraleEvents: MoraleEvent[];
  totalMedalsAwarded: number;
  squadMotto?: string;
  luckyStreak: number; // consecutive successful missions
  unluckyStreak: number; // consecutive failed missions
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: "Info" | "Warning" | "Error" | "Success" | "Mission";
  message: string;
}
