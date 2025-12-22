// LLM Service for generating dynamic content
import type {
  CommunityEvent,
  EvidenceItem,
  InterrogationMessage,
  Mission,
  MissionEvent,
  MissionOption,
  NewsStory,
  Officer,
  Suspect,
} from "../types/game";

const LLM_URL = import.meta.env.VITE_LLM_URL || "http://localhost:11434/api/chat";
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || "unfiltered-llm";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a specialized AI game engine for "S.W.A.T. Watch Commander", a grit-focused tactical management sim.
Your job is to generate realistic, consequences-driven scenarios, dialogue, and outcomes for a SWAT team.
The tone is serious, professional, and gritty. Decisions should have weight.
When asked to provide JSON, provide ONLY the JSON block without any preamble OR markdown code blocks.`;

function extractJSON(response: string): unknown {
  // Find the first '{' to start our extraction
  const firstBrace = response.indexOf("{");
  if (firstBrace === -1) throw new Error("No JSON block found in LLM response");

  // Attempt to find the shortest valid JSON object starting from firstBrace
  // This is more robust than greedy matching if the AI adds text after the JSON
  let lastBrace = response.indexOf("}", firstBrace);
  while (lastBrace !== -1) {
    const candidate = response.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_e) {
      // Not a complete object yet, find next closing brace
      lastBrace = response.indexOf("}", lastBrace + 1);
    }
  }

  // Fallback: search for markdown blocks if bracing fails
  const segments = response.split("```json");
  if (segments.length > 1) {
    try {
      const content = segments[1].split("```")[0].trim();
      return JSON.parse(content);
    } catch (_e) {}
  }

  throw new Error("Could not extract valid JSON from LLM response");
}

async function callLLM(
  promptOrMessages: string | LLMMessage[],
  temperature = 0.8,
): Promise<string> {
  const isChatUrl = LLM_URL.includes("/chat");

  const body: any = {
    model: LLM_MODEL,
    temperature,
    max_tokens: 2048,
    stream: false,
  };

  if (isChatUrl) {
    body.messages =
      typeof promptOrMessages === "string"
        ? [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: promptOrMessages },
          ]
        : promptOrMessages;
  } else {
    // Fallback for /api/generate or similar
    body.prompt =
      typeof promptOrMessages === "string"
        ? `${SYSTEM_PROMPT}\n\nUser: ${promptOrMessages}`
        : promptOrMessages.map((m) => `${m.role}: ${m.content}`).join("\n");
  }

  const response = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  try {
    // Try parsing as a single object first
    const data = JSON.parse(text);
    return data.message?.content || data.choices?.[0]?.message?.content || data.response || "";
  } catch (_e) {
    // If multiple JSON objects are present (NDJSON stream incorrectly returned as a single body)
    // take the first valid one
    const firstLine = text.split("\n")[0];
    try {
      const data = JSON.parse(firstLine);
      return data.message?.content || data.choices?.[0]?.message?.content || data.response || "";
    } catch (_inner) {
      throw new Error("Failed to parse LLM response body.");
    }
  }
}

export async function generateOfficer(
  existingNames?: string[],
  specialization?: string,
): Promise<Officer> {
  const prompt = `Generate a new SWAT officer profile.
  ${specialization ? `Specialization requested: ${specialization}` : ""}
  ${existingNames ? `Avoid these names: ${existingNames.join(", ")}` : ""}
  Respond with ONLY valid JSON:
  {
    "name": "Full Name",
    "rank": "Rookie" or "Officer",
    "specialization": "Point Man", "Breacher", "Medic", "Sniper", or "Shield",
    "background": "Brief 1-sentence background",
    "skills": { "marksmanship": 30-70, "tactics": 30-70, "composure": 30-70 },
    "morale": 80-100
  }`;

  const response = await callLLM(prompt);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    health: 100,
    status: "Available",
    experience: 0,
    missionsCompleted: 0,
    injuryDays: 0,
    salary: calculateSalary(data.rank),
    gear: { armorLevel: 1, weaponLevel: 1, utilityLevel: 1 },
    // 🎮 NEW FUN FEATURES
    medals: [],
    killCount: 0,
    livesaved: 0,
  };
}

export function calculateSalary(rank: Officer["rank"]): number {
  switch (rank) {
    case "Rookie":
      return 3500;
    case "Officer":
      return 4500;
    case "Senior Officer":
      return 5500;
    case "Sergeant":
      return 7000;
    case "Lieutenant":
      return 9000;
    default:
      return 4000;
  }
}

export async function generateMission(
  reputation: number,
  day: number,
  squadSize: number,
): Promise<Mission> {
  const prompt = `Generate a SWAT mission briefing. Squad Size: ${squadSize}, Reputation: ${reputation}, Day: ${day}.
  Respond with ONLY valid JSON:
  {
    "title": "Mission Name",
    "description": "2-3 sentence overview",
    "type": "Hostage Rescue", "Active Shooter", "High-Risk Warrant", "Barricaded Suspect", or "Bomb Threat",
    "priority": "Low", "Medium", "High", or "Critical",
    "location": "A specific city location",
    "estimatedDuration": "Duration",
    "requiredOfficers": 2-8,
    "requiredSpecializations": ["Point Man", "Breacher", etc],
    "riskLevel": 1-10,
    "rewards": { "experience": 50-200, "reputation": 5-20, "budget": 5000-25000 },
    "briefing": "Detailed technical briefing"
  }`;

  const response = await callLLM(prompt, 0.7);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    assignedOfficers: [],
    status: "Available",
    createdAt: new Date(),
    rewards: {
      experience: data.rewards?.experience ?? 100,
      reputation: data.rewards?.reputation ?? 5,
      budget: data.rewards?.budget ?? 10000,
    },
    requiredSpecializations: data.requiredSpecializations || [],
  };
}

export async function generateMissionEvent(
  mission: Mission,
  officers?: Officer[],
  previousEvents?: MissionEvent[],
): Promise<MissionEvent> {
  const prompt = `Tactical event for: ${mission.title}. Unit: ${officers?.map((o) => o.name).join(", ")}. History: ${previousEvents?.map((e) => e.description).join(" -> ")}.
  Respond with ONLY valid JSON:
  {
    "description": "Situation description",
    "type": "Decision", "Combat", or "Info",
    "options": [ { "id": "uuid", "label": "Label", "description": "Desc", "riskLevel": 1-10, "requiredSpecialization": "Spec" } ]
  }`;

  const response = await callLLM(prompt, 0.8);
  const data = extractJSON(response) as any;

  return {
    id: crypto.randomUUID(),
    missionId: mission.id,
    timestamp: new Date(),
    description: data.description,
    type: data.type,
    options: data.options?.map((opt: any) => ({ ...opt, id: opt.id || crypto.randomUUID() })),
    resolved: false,
  };
}

export async function resolveDecision(
  mission: Mission,
  event: MissionEvent,
  chosenOption: MissionOption,
  officers: Officer[],
): Promise<{
  outcome: string;
  casualties: string[];
  injuries: string[];
  missionComplete: boolean;
  success: boolean;
}> {
  const prompt = `Resolve: ${chosenOption.label} in ${mission.title}. Team: ${officers.map((o) => `${o.name} (${o.morale}% morale)`).join(", ")}. Situation: ${event.description}.
  Respond with ONLY valid JSON:
  {
    "outcome": "2-3 sentences",
    "casualties": [],
    "injuries": [],
    "missionComplete": true/false,
    "success": true/false
  }`;

  const response = await callLLM(prompt);
  return extractJSON(response) as any;
}

export async function generateDismissalDialogue(
  officer: Officer,
  _reason: string,
): Promise<string> {
  const prompt = `Dialogue for dismissing ${officer.name}. Reason: ${_reason}. Brief exchange.`;
  return await callLLM(prompt, 0.9);
}

export async function generateCommunityEvent(reputation: number): Promise<CommunityEvent> {
  const prompt = `SWAT community event. Reputation: ${reputation}. 
  Respond with ONLY valid JSON: { "title": "Name", "description": "Desc", "type": "PR", "rewards": { "budget": 1000, "reputation": 5 } }`;

  const response = await callLLM(prompt);
  const data = extractJSON(response) as any;

  return { ...data, id: crypto.randomUUID(), status: "Available", assignedOfficers: [] };
}

export async function generateFuneralEulogy(officer: Officer, squadName: string): Promise<string> {
  const prompt = `Funeral eulogy for ${officer.name} (${officer.rank}) of ${squadName}. Short and moving.`;
  return await callLLM(prompt, 0.6);
}

export async function generateSuspect(mission: Mission): Promise<Partial<Suspect>> {
  const prompt = `Suspect from ${mission.title}. Respond with ONLY JSON: { "name": "Name", "crime": "Crime", "personality": "Desc", "intelLevel": 50, "resistance": 50 }`;
  const response = await callLLM(prompt, 0.7);
  return extractJSON(response) as any;
}

export async function generateCustomMission(
  description: string,
  reputation: number,
  squadSize: number,
): Promise<Mission> {
  const prompt = `Convert to mission: "${description}". Squad: ${squadSize}, Rep: ${reputation}.
  Respond with ONLY valid JSON { "title": "...", "description": "...", "type": "...", "priority": "...", "location": "...", "estimatedDuration": "...", "requiredOfficers": 4, "requiredSpecializations": [], "riskLevel": 5, "rewards": { "experience": 100, "reputation": 5, "budget": 10000 }, "briefing": "..." }`;

  const response = await callLLM(prompt, 0.6);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    assignedOfficers: [],
    status: "Available",
    createdAt: new Date(),
    rewards: {
      experience: data.rewards?.experience ?? 100,
      reputation: data.rewards?.reputation ?? 5,
      budget: data.rewards?.budget ?? 10000,
    },
    requiredSpecializations: data.requiredSpecializations || [],
  };
}

export async function interrogateSuspect(
  suspect: Suspect,
  commanderName: string,
  history: InterrogationMessage[],
  newMessage: string,
): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: `You are ${suspect.name} (${suspect.personality}, resistance ${suspect.resistance}/100). Hostile/evasive unless broken. Being interrogated by ${commanderName}.`,
    },
    ...history.map((h) => ({
      role: h.role === "Commander" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    })),
    { role: "user", content: newMessage },
  ];
  return await callLLM(messages, 0.8);
}

export async function resolveInterrogation(
  suspect: Suspect,
  history: InterrogationMessage[],
): Promise<{
  cracked: boolean;
  intel?: string;
  summary: string;
  reputationBonus: number;
  budgetBonus: number;
  unlockedMission?: any;
}> {
  const historyText = history.map((h) => `${h.role}: ${h.text}`).join("\n");
  const prompt = `Review the following interrogation transcript for ${suspect.name} (Crime: ${suspect.crime}, Resistance: ${suspect.resistance}/100).
Determine if the suspect "cracked" based on the commander's lines and the suspect's responses.

Transcript:
${historyText}

Respond with ONLY valid JSON:
{
  "cracked": true/false,
  "intel": "Specific information revealed by the suspect (if cracked, else empty)",
  "summary": "1-2 sentence summary of the suspect's behavior and the interrogation outcome",
  "reputationBonus": -5 to 10 based on tactics,
  "budgetBonus": 0 to 2000 if they reveal financial leads,
  "unlockedMission": null or a mission object if they revealed a hideout/cache
}`;

  const response = await callLLM(prompt, 0.6);
  return extractJSON(response) as any;
}

export async function generateTrialOutcome(suspect: Suspect, commanderName: string): Promise<any> {
  const prompt = `Trial for ${suspect.name} (${suspect.crime}). Commander: ${commanderName}. 
  Respond with ONLY JSON: { "verdict": "Guilty", "sentence": "...", "reputationImpact": 5, "budgetImpact": 1000 }`;

  const response = await callLLM(prompt, 0.5);
  return extractJSON(response) as any;
}

export async function generateEvidence(mission: Mission): Promise<EvidenceItem> {
  const prompt = `Evidence from ${mission.title}. Respond with ONLY JSON: { "name": "Item", "description": "Desc" }`;
  const response = await callLLM(prompt, 0.7);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    status: "Stored",
    sourceMissionId: mission.id,
    timestamp: new Date(),
  };
}

export async function generateNewsStory(
  mission: Mission,
  success: boolean,
  outcome: string,
): Promise<NewsStory> {
  const prompt = `News report: ${mission.title}, Success: ${success}. Outcome: ${outcome}. 
  Respond with ONLY JSON: { "headline": "...", "content": "...", "sentiment": "Positive/Neutral/Negative" }`;

  const response = await callLLM(prompt, 0.8);
  const data = extractJSON(response) as any;

  return { ...data, id: crypto.randomUUID(), sourceMissionId: mission.id, timestamp: new Date() };
}

export async function analyzeEvidence(evidence: EvidenceItem): Promise<string> {
  const prompt = `Forensic report for ${evidence.name}. Short and technical.`;
  return await callLLM(prompt, 0.5);
}

export async function generateAAR(
  mission: Mission,
  outcome: string,
  casualties: string[],
  injuries: string[],
): Promise<any> {
  const prompt = `After-Action Review for ${mission.title}. Cas: ${casualties.length}, Inj: ${injuries.length}. Result: ${outcome}. 
  Respond with ONLY JSON: { "efficiency": 80, "tacticalSoundness": 80, "civilianSafety": 90, "debriefing": "..." }`;

  const response = await callLLM(prompt, 0.6);
  return extractJSON(response) as any;
}

// 🎰 RANDOM DAILY EVENT GENERATOR
import type { Medal, MoraleEvent, Nemesis, RandomEvent } from "../types/game";

export async function generateRandomEvent(
  day: number,
  reputation: number,
  budget: number,
  officerCount: number,
  luckyStreak: number,
  unluckyStreak: number,
): Promise<RandomEvent> {
  const eventTypes = ["Windfall", "Disaster", "Opportunity", "Drama", "Chaos", "Morale"];

  // Bias events based on streaks
  let biasedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  if (luckyStreak >= 3 && Math.random() > 0.6) biasedType = "Disaster"; // Pride before fall
  if (unluckyStreak >= 3 && Math.random() > 0.6) biasedType = "Windfall"; // Silver lining

  const prompt = `Generate a RANDOM DAILY EVENT for a SWAT team. Day: ${day}, Reputation: ${reputation}, Budget: $${budget}, Officers: ${officerCount}.
  
  Event type: ${biasedType}
  
  Be CREATIVE and FUN! Examples:
  - Windfall: "Anonymous donor gives $50k", "City council appreciates work, bonus granted"
  - Disaster: "Budget cuts incoming!", "Officer caught on camera jaywalking, PR nightmare"
  - Opportunity: "Intel on a high-value target, limited window", "Celebrity ride-along offer"
  - Drama: "Two officers have beef", "Rookie challenges veteran to marksmanship contest"
  - Chaos: "Donut shop got robbed (not by us)", "Someone released a goat in the precinct"
  - Morale: "Surprise birthday party", "Team bonding opportunity"
  
  Respond with ONLY valid JSON:
  {
    "title": "Catchy title",
    "description": "2-3 fun sentences describing what happened",
    "type": "${biasedType}",
    "effects": {
      "budgetChange": -10000 to 50000 (or null),
      "reputationChange": -10 to 15 (or null),
      "moraleChange": -15 to 20 (or null)
    },
    "choices": [
      { "id": "choice1", "label": "Option A", "effects": { ... }, "risk": 0-100 },
      { "id": "choice2", "label": "Option B", "effects": { ... }, "risk": 0-100 }
    ] or null if no choice needed
  }`;

  const response = await callLLM(prompt, 0.95);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    resolved: false,
    choices: data.choices?.map((c: any) => ({ ...c, id: c.id || crypto.randomUUID() })),
  };
}

// 💀 NEMESIS SYSTEM - Generate a nemesis from a released suspect
export async function generateNemesis(
  suspectName: string,
  originalCrime: string,
  daysAtLarge: number,
): Promise<Partial<Nemesis>> {
  const prompt = `A released suspect has returned as a NEMESIS hunting the SWAT team!
  
  Original Name: ${suspectName}
  Original Crime: ${originalCrime}
  Days at large: ${daysAtLarge}
  
  Generate their villain arc. Be DRAMATIC and MEMORABLE!
  
  Respond with ONLY valid JSON:
  {
    "alias": "Cool villain name or nickname",
    "grudgeLevel": 1-10,
    "signature": "Their calling card or MO (e.g., 'leaves chess pieces at crime scenes')",
    "backstory": "2 sentences about their grudge and what they've been doing"
  }`;

  const response = await callLLM(prompt, 0.9);
  return extractJSON(response) as any;
}

// Generate nemesis-related mission
export async function generateNemesisMission(nemesis: Nemesis): Promise<Mission> {
  const prompt = `Generate a REVENGE MISSION involving nemesis "${nemesis.alias || nemesis.name}".
  
  Nemesis Details:
  - Grudge Level: ${nemesis.grudgeLevel}/10
  - Signature: ${nemesis.signature}
  - Encounters: ${nemesis.encounterCount}
  
  Make it PERSONAL and HIGH STAKES!
  
  Respond with ONLY valid JSON:
  {
    "title": "Mission Name (reference the nemesis)",
    "description": "Personal stakes description",
    "type": "High-Risk Warrant",
    "priority": "Critical",
    "location": "A dramatic location",
    "estimatedDuration": "2-4 hours",
    "requiredOfficers": 4-6,
    "requiredSpecializations": ["Assault", "Sniper"],
    "riskLevel": 7-10,
    "rewards": { "experience": 200, "reputation": 15, "budget": 25000 },
    "briefing": "Detailed briefing about confronting the nemesis"
  }`;

  const response = await callLLM(prompt, 0.8);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    assignedOfficers: [],
    status: "Available",
    createdAt: new Date(),
    rewards: data.rewards || { experience: 200, reputation: 15, budget: 25000 },
    requiredSpecializations: data.requiredSpecializations || [],
  };
}

// 🏆 MEDAL AWARD GENERATOR
export async function generateMedal(
  officerName: string,
  achievement: string,
  missionTitle?: string,
): Promise<Medal> {
  const prompt = `Award a MEDAL to officer "${officerName}" for: "${achievement}"${missionTitle ? ` during mission "${missionTitle}"` : ""}.
  
  Be creative with medal names! Examples:
  - "Distinguished Service Cross"
  - "The Iron Shield"
  - "Purple Heart"
  - "Civilian Guardian Award"
  - "The Negotiator's Ribbon"
  
  Respond with ONLY valid JSON:
  {
    "name": "Medal Name",
    "description": "What they did to earn it (1 sentence)",
    "icon": "Single emoji representing the medal",
    "rarity": "Bronze", "Silver", "Gold", "Platinum", or "Legendary"
  }`;

  const response = await callLLM(prompt, 0.85);
  const data = extractJSON(response) as any;

  return {
    ...data,
    id: crypto.randomUUID(),
    awardedDate: new Date(),
  };
}

// 🍕 MORALE BOOST EVENT GENERATOR
export async function generateMoraleEvents(): Promise<MoraleEvent[]> {
  return [
    {
      id: crypto.randomUUID(),
      title: "Pizza Party",
      description: "Order pizzas for the whole squad. Nothing boosts morale like carbs and cheese!",
      type: "Pizza Party",
      cost: 500,
      moraleBoost: 15,
      duration: "2 hours",
      icon: "🍕",
    },
    {
      id: crypto.randomUUID(),
      title: "HQ BBQ",
      description: "Fire up the grill behind the precinct. Burgers, dogs, and brotherhood.",
      type: "BBQ",
      cost: 1000,
      moraleBoost: 20,
      duration: "4 hours",
      icon: "🍔",
    },
    {
      id: crypto.randomUUID(),
      title: "Tactical Training Day",
      description: "Live-fire exercises at the range. Competitive but bonding.",
      type: "Training Day",
      cost: 2000,
      moraleBoost: 25,
      duration: "Full day",
      icon: "🎯",
    },
    {
      id: crypto.randomUUID(),
      title: "Awards Ceremony",
      description: "Formal ceremony to recognize achievements. Dress uniforms required.",
      type: "Awards Ceremony",
      cost: 3000,
      moraleBoost: 30,
      duration: "Evening",
      icon: "🏆",
    },
    {
      id: crypto.randomUUID(),
      title: "Squad Day Off",
      description: "Give the team a well-deserved break. Happy officers work better.",
      type: "Day Off",
      cost: 0,
      moraleBoost: 35,
      duration: "Full day",
      icon: "🏖️",
    },
    {
      id: crypto.randomUUID(),
      title: "Escape Room Challenge",
      description: "Team building exercise at a local escape room. Ironic for a SWAT team.",
      type: "Team Building",
      cost: 1500,
      moraleBoost: 22,
      duration: "3 hours",
      icon: "🔐",
    },
  ];
}

// Generate officer nickname based on achievements
export async function generateNickname(
  officerName: string,
  specialization: string,
  killCount: number,
  livesSaved: number,
  missionsCompleted: number,
): Promise<string> {
  const prompt = `Generate a BADASS NICKNAME for SWAT officer "${officerName}".
  
  Stats:
  - Specialization: ${specialization}
  - Kills: ${killCount}
  - Lives Saved: ${livesSaved}
  - Missions: ${missionsCompleted}
  
  Examples: "The Ghost", "Deadeye", "Doc", "Breaker", "Ice Man", "The Wall"
  
  Respond with ONLY the nickname in quotes, nothing else.`;

  const response = await callLLM(prompt, 0.9);
  return response.replace(/['"]/g, "").trim();
}

const llmService = {
  generateOfficer,
  calculateSalary,
  generateMission,
  generateMissionEvent,
  resolveDecision,
  generateDismissalDialogue,
  generateCommunityEvent,
  generateFuneralEulogy,
  generateSuspect,
  generateCustomMission,
  interrogateSuspect,
  resolveInterrogation,
  generateTrialOutcome,
  generateEvidence,
  generateNewsStory,
  analyzeEvidence,
  generateAAR,
  // 🎮 NEW FUN FEATURES
  generateRandomEvent,
  generateNemesis,
  generateNemesisMission,
  generateMedal,
  generateMoraleEvents,
  generateNickname,
};

export default llmService;
