// LLM Service for SWAT Watch Commander
// Single unified call to OpenAI-compatible API

import type {
  CommunityEvent,
  Mission,
  MissionEvent,
  MissionOption,
  Officer,
  Suspect,
} from "../types/game";

const LLM_URL = import.meta.env.VITE_LLM_URL || "http://localhost:8888/v1/chat/completions";
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || "llama3.1";

const SYSTEM_PROMPT = `You are an AI game master for "SWAT Watch Commander", a realistic tactical police simulation game. 
You generate realistic SWAT mission scenarios, officer profiles, tactical decisions, and mission outcomes.

Your responses should be:
- Realistic and grounded in actual SWAT operations
- Dramatic but not unrealistic
- Consider officer specializations and skills
- Account for risk levels and tactical decisions
- Generate consequences that feel fair based on player choices

Always respond in valid JSON format as specified in each request.`;

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Single unified LLM call function
async function callLLM(
  promptOrMessages: string | LLMMessage[],
  temperature = 0.8,
): Promise<string> {
  const messages: LLMMessage[] =
    typeof promptOrMessages === "string"
      ? [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptOrMessages },
        ]
      : promptOrMessages;

  const response = await fetch(LLM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Extract JSON from LLM response (handles markdown code blocks)
function extractJSON(response: string): unknown {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

export function calculateSalary(rank: Officer["rank"]): number {
  const salaries: Record<Officer["rank"], number> = {
    Rookie: 500,
    Officer: 1200,
    "Senior Officer": 2000,
    Sergeant: 3500,
    Lieutenant: 5000,
  };
  return salaries[rank] || 1000;
}

export async function generateOfficer(
  existingNames: string[],
  specialization?: string,
): Promise<Officer> {
  const prompt = `Generate a realistic SWAT officer profile. 
${specialization ? `The officer MUST have the specialization: ${specialization}` : "Choose a specialization from: Assault, Sniper, Breacher, Medic, Negotiator, Tech Specialist"}
Avoid these names already in the squad: ${existingNames.join(", ")}

Respond with ONLY valid JSON in this exact format:
{
  "name": "Full Name",
  "rank": "Rookie" | "Officer" | "Senior Officer" | "Sergeant" | "Lieutenant",
  "specialization": "Assault" | "Sniper" | "Breacher" | "Medic" | "Negotiator" | "Tech Specialist",
  "experience": 0-100,
  "morale": 60-100,
  "health": 80-100,
  "skills": {
    "marksmanship": 30-100,
    "tactics": 30-100,
    "fitness": 30-100,
    "leadership": 20-100,
    "composure": 30-100
  },
  "backstory": "2-3 sentence realistic backstory including training and notable achievements"
}`;

  const response = await callLLM(prompt);

  try {
    const data = extractJSON(response) as {
      name: string;
      rank: Officer["rank"];
      specialization: Officer["specialization"];
      experience: number;
      morale: number;
      health: number;
      skills: Officer["skills"];
      backstory: string;
    };

    return {
      id: crypto.randomUUID(),
      name: data.name,
      rank: data.rank,
      specialization: data.specialization,
      experience: Math.min(100, Math.max(0, data.experience)),
      morale: Math.min(100, Math.max(0, data.morale)),
      health: Math.min(100, Math.max(0, data.health)),
      skills: {
        marksmanship: Math.min(100, Math.max(0, data.skills.marksmanship)),
        tactics: Math.min(100, Math.max(0, data.skills.tactics)),
        fitness: Math.min(100, Math.max(0, data.skills.fitness)),
        leadership: Math.min(100, Math.max(0, data.skills.leadership)),
        composure: Math.min(100, Math.max(0, data.skills.composure)),
      },
      missionsCompleted: 0,
      isInjured: false,
      injuryDays: 0,
      status: "Available",
      salary: calculateSalary(data.rank),
      backstory: data.backstory,
      gear: {
        armorLevel: 1,
        weaponLevel: 1,
        utilityLevel: 1,
      },
    };
  } catch (e) {
    console.error("Failed to parse officer:", e, response);
    throw new Error("Failed to generate officer profile");
  }
}

export async function generateFuneralEulogy(officer: Officer, squadName: string): Promise<string> {
  const prompt = `Write a solemn, 2-3 sentence graduation/memorial tribute for a fallen SWAT officer.
Officer Name: ${officer.name}
Rank: ${officer.rank}
Specialization: ${officer.specialization}
Missions Completed: ${officer.missionsCompleted}
Squad: ${squadName}

The tone should be respectful, honorable, and patriotic. Focus on their sacrifice and service to the city.`;

  const response = await callLLM(prompt);
  return response.trim();
}

export async function generateMission(
  reputation: number,
  day: number,
  squadSize: number,
): Promise<Mission> {
  const prompt = `Generate a realistic SWAT mission scenario.
Current squad reputation: ${reputation}/100
Current day: ${day}
Current squad size: ${squadSize} officers.

Higher reputation means more critical/high-profile missions become available.

Respond with ONLY valid JSON in this exact format:
{
  "title": "Short mission title",
  "description": "Brief 1-2 sentence description",
  "type": "Hostage Rescue" | "High-Risk Warrant" | "Active Shooter" | "Barricaded Suspect" | "VIP Protection" | "Drug Raid" | "Bomb Threat",
  "priority": "Low" | "Medium" | "High" | "Critical",
  "location": "Specific location (e.g., 'Downtown First National Bank', 'Riverside Industrial Complex')",
  "estimatedDuration": "e.g., '2-4 hours'",
  "requiredOfficers": ${Math.max(2, Math.min(8, Math.floor(squadSize * 1.5)))},
  "requiredSpecializations": ["list", "of", "recommended", "specializations"],
  "riskLevel": 1-10,
  "rewards": {
    "experience": 50-200,
    "reputation": 5-25,
    "budget": 5000-50000
  },
  "briefing": "Detailed 3-5 sentence tactical briefing with intel about the situation, suspects, potential hostages, building layout hints, and known threats"
}`;

  const response = await callLLM(prompt);

  try {
    const data = extractJSON(response) as {
      title: string;
      description: string;
      type: Mission["type"];
      priority: Mission["priority"];
      location: string;
      estimatedDuration: string;
      requiredOfficers: number;
      requiredSpecializations: string[];
      riskLevel: number;
      rewards: { experience: number; reputation: number; budget: number };
      briefing: string;
    };

    return {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      location: data.location,
      estimatedDuration: data.estimatedDuration,
      requiredOfficers: data.requiredOfficers || 4,
      requiredSpecializations: data.requiredSpecializations || [],
      riskLevel: Math.min(10, Math.max(1, data.riskLevel || 5)),
      rewards: {
        experience: data.rewards.experience,
        reputation: data.rewards.reputation,
        budget: data.rewards.budget,
      },
      briefing: data.briefing,
      status: "Available",
      assignedOfficers: [],
      createdAt: new Date(),
    };
  } catch (e) {
    console.error("Failed to parse mission:", e, response);
    throw new Error("Failed to generate mission");
  }
}

export async function generateMissionEvent(
  mission: Mission,
  officers: Officer[],
  previousEvents: MissionEvent[],
): Promise<MissionEvent> {
  const eventHistory = previousEvents
    .map((e) => `- ${e.description}${e.outcome ? ` (Outcome: ${e.outcome})` : ""}`)
    .join("\n");

  const prompt = `Generate the next event for an ongoing SWAT mission.

Mission: ${mission.title}
Type: ${mission.type}
Location: ${mission.location}
Briefing: ${mission.briefing}
Risk Level: ${mission.riskLevel}/10

Assigned Officers:
${officers.map((o) => `- ${o.name} (${o.rank}, ${o.specialization}) - Health: ${o.health}%, Gear: Armor Lvl ${o.gear.armorLevel}, Weapons Lvl ${o.gear.weaponLevel}, Utility Lvl ${o.gear.utilityLevel}`).join("\n")}

Previous Events:
${eventHistory || "Mission just started"}

Generate a realistic tactical event that requires commander decision-making.
Consider officer equipment levels (higher levels should provide more tactical opportunities or safety).
${previousEvents.length > 3 ? "Consider wrapping up the mission soon with a climactic event." : ""}

Respond with ONLY valid JSON in this exact format:
{
  "description": "Detailed description of what's happening (2-3 sentences)",
  "type": "Info" | "Decision" | "Combat" | "Casualty" | "Success" | "Failure",
  "options": [
    {
      "id": "option1",
      "label": "Short action label",
      "description": "What this choice involves",
      "riskLevel": 1-10,
      "requiredSpecialization": "Optional - if a specific specialist would help"
    },
    {
      "id": "option2", 
      "label": "Alternative action",
      "description": "What this alternative involves",
      "riskLevel": 1-10
    }
  ]
}

For type "Success" or "Failure", options can be empty array - these end the mission.`;

  const response = await callLLM(prompt);

  try {
    const data = extractJSON(response) as {
      description: string;
      type: MissionEvent["type"];
      options?: MissionOption[];
    };

    return {
      id: crypto.randomUUID(),
      missionId: mission.id,
      timestamp: new Date(),
      description: data.description,
      type: data.type,
      options: data.options?.map((opt) => ({
        id: opt.id || crypto.randomUUID(),
        label: opt.label,
        description: opt.description,
        riskLevel: opt.riskLevel,
        requiredSpecialization: opt.requiredSpecialization,
      })),
      resolved: false,
    };
  } catch (e) {
    console.error("Failed to parse event:", e, response);
    throw new Error("Failed to generate mission event");
  }
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
  const prompt = `Resolve a tactical decision in a SWAT mission.

Mission: ${mission.title} (${mission.type})
Current Event: ${event.description}
Chosen Action: ${chosenOption.label} - ${chosenOption.description}
Risk Level of Choice: ${chosenOption.id === "custom" ? "To be assessed by AI based on complexity" : `${chosenOption.riskLevel}/10`}

${chosenOption.id === "custom" ? "IMPORTANT: This is a CUSTOM DIRECTIVE from the Commander. Assess its tactical soundess, risk, and potential for success based on the situation and squad capabilities." : ""}

Officers involved:
${officers
  .map(
    (o) =>
      `- ${o.name} (${o.specialization}) - Health: ${o.health}%, Skills: Marksmanship ${o.skills.marksmanship}, Tactics ${o.skills.tactics}, Composure ${o.skills.composure}. Gear: Armor Lvl ${o.gear.armorLevel}, Weapons Lvl ${o.gear.weaponLevel}, Utility Lvl ${o.gear.utilityLevel}`,
  )
  .join("\n")}

${chosenOption.requiredSpecialization ? `Note: This action benefits from a ${chosenOption.requiredSpecialization}. Team ${officers.some((o) => o.specialization === chosenOption.requiredSpecialization) ? "HAS" : "does NOT have"} this specialist.` : ""}

  Based on the tactical directive, officer capabilities, and realistic outcomes, determine what happens.

  CRITICAL RULES FOR AI:
  1. NO HERO ARMOR: If the 'Chosen Action' or 'Custom Directive' is tactically suicidal (e.g., walking in naked, asking to be killed, rushing a rifleman with no cover), YOU MUST PUNISH IT with High Casualties or Mission Failure.
  2. TACTICAL REALISM: S.W.A.T. operations are dangerous. If the team is outgunned or the plan is reckless, they should fail or take injuries.
  3. CUSTOM DIRECTIVES: Evaluate them strictly. If a directive is nonsensical or a 'joke', it should likely lead to a critical failure or a very confused, dangerous situation.
  4. CONSISTENCY: Respect the officer's skills. A Rookie (low stats) is much more likely to panic or miss a shot than a Lieutenant.

  Respond with ONLY valid JSON:
  {
    "outcome": "2-3 sentence description of what happened. Be descriptive about the action and its consequences.",
    "casualties": ["list of officer names who were Killed In Action (KIA), or empty array"],
    "injuries": ["list of officer names who were injured, or empty array"],
    "missionComplete": true/false,
    "success": true/false (only relevant if missionComplete is true. If the team is wiped out or forced to retreat, success is false)
  }`;

  const response = await callLLM(prompt);

  try {
    return extractJSON(response) as {
      outcome: string;
      casualties: string[];
      injuries: string[];
      missionComplete: boolean;
      success: boolean;
    };
  } catch (e) {
    console.error("Failed to parse decision outcome:", e, response);
    throw new Error("Failed to resolve decision");
  }
}

export async function generateDismissalDialogue(officer: Officer, reason: string): Promise<string> {
  const prompt = `Generate realistic dialogue for dismissing a SWAT officer from the team.

Officer: ${officer.name}
Rank: ${officer.rank}
Specialization: ${officer.specialization}
Experience level: ${officer.experience}%
Missions completed: ${officer.missionsCompleted}
Reason for dismissal: ${reason}

Generate a brief, professional exchange (2-3 lines from the commander, 1-2 lines response from the officer).
Keep it realistic to how such conversations would go in law enforcement.

Respond with just the dialogue text, no JSON needed.`;

  return await callLLM(prompt, 0.9);
}

export async function generateCommunityEvent(reputation: number): Promise<CommunityEvent> {
  const prompt = `Generate a realistic SWAT community or charity event.
Current squad reputation: ${reputation}/100

These events are held to raise money for charity, the community, or the squad itself.
Higher reputation leads to bigger, more high-profile events.

Respond with ONLY valid JSON in this exact format:
{
  "title": "Short event title",
  "description": "Brief 1-2 sentence description",
  "type": "Charity" | "Public Relations" | "Training Demo" | "Recruitment Drive",
  "requirements": {
    "minOfficers": 1-4,
    "requiredSpecialization": "Optional specialist who would lead the event (Assault, Sniper, Breacher, Medic, Negotiator, Tech Specialist)"
  },
  "rewards": {
    "budget": 1000-15000,
    "reputation": 2-10
  }
}`;

  const response = await callLLM(prompt);

  try {
    const data = extractJSON(response) as {
      title: string;
      description: string;
      type: CommunityEvent["type"];
      requirements: CommunityEvent["requirements"];
      rewards: CommunityEvent["rewards"];
    };

    return {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      type: data.type,
      requirements: data.requirements,
      rewards: data.rewards,
      assignedOfficers: [],
      status: "Available",
    };
  } catch (e) {
    console.error("Failed to parse community event:", e, response);
    throw new Error("Failed to generate community event");
  }
}

export async function generateCustomMission(
  description: string,
  reputation: number,
  squadSize: number,
): Promise<Mission> {
  const prompt = `A player has described a custom SWAT mission. Your job is to turn this into a structured mission object.
  
  Player Description: "${description}"
  Current Squad Reputation: ${reputation}/100
  
  CRITICAL REALISM RULE: If the player describes something unethical, illegal, or "corrupt" (like robbing a bank, accepting a bribe, or executing someone), the mission should be generated BUT the reputation reward should be HEAVILY NEGATIVE (e.g., -30 to -50) and the budget reward might be higher. If it's a helpful community mission (like picking up garbage or rescue), the reputation reward should be positive.
  
  Respond with ONLY valid JSON in this exact format:
  {
    "title": "Short impactful title for the custom mission",
    "description": "Refined 1-2 sentence description based on the player's input",
    "type": "Hostage Rescue" | "High-Risk Warrant" | "Active Shooter" | "Barricaded Suspect" | "VIP Protection" | "Drug Raid" | "Bomb Threat" | "Custom Operation",
    "priority": "Low" | "Medium" | "High" | "Critical",
    "location": "A realistic location based on the description",
    "estimatedDuration": "e.g., '1-3 hours'",
    "requiredOfficers": 1-8,
    "requiredSpecializations": ["list", "of", "recommended", "specializations"],
    "riskLevel": 1-10,
    "rewards": {
      "experience": 0-200,
      "reputation": -50 to 50,
      "budget": 0-100000
    },
    "briefing": "Detailed 3-5 sentence tactical briefing turning the player's input into a professional operational order."
  }`;

  const response = await callLLM(prompt);

  try {
    const data = extractJSON(response) as {
      title: string;
      description: string;
      type: Mission["type"];
      priority: Mission["priority"];
      location: string;
      estimatedDuration: string;
      requiredOfficers: number;
      requiredSpecializations: string[];
      riskLevel: number;
      rewards: { experience: number; reputation: number; budget: number };
      briefing: string;
    };

    return {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      location: data.location,
      estimatedDuration: data.estimatedDuration,
      requiredOfficers: Math.min(squadSize, data.requiredOfficers || 4),
      requiredSpecializations: data.requiredSpecializations || [],
      riskLevel: Math.min(10, Math.max(1, data.riskLevel || 5)),
      rewards: {
        experience: data.rewards.experience,
        reputation: data.rewards.reputation,
        budget: data.rewards.budget,
      },
      briefing: data.briefing,
      status: "Available",
      assignedOfficers: [],
      createdAt: new Date(),
    };
  } catch (e) {
    console.error("Failed to parse custom mission:", e, response);
    throw new Error("Failed to generate custom mission");
  }
}

export async function generateSuspect(mission: Mission): Promise<any> {
  const prompt = `Generate a realistic suspect apprehended during a SWAT mission.
  
  Mission: ${mission.title} (${mission.type})
  Location: ${mission.location}
  
  Respond with ONLY valid JSON:
  {
    "name": "Full Name",
    "crime": "Specific crime related to the mission",
    "personality": "e.g., Cocky, Terrified, Professional Criminal, Mentally Unstable, Cooperative",
    "intelLevel": 20-90,
    "resistance": 30-95
  }`;

  const response = await callLLM(prompt);
  return extractJSON(response);
}

export async function interrogateSuspect(
  suspect: any,
  commanderName: string,
  history: { role: string; text: string }[],
  newMessage: string,
): Promise<string> {
  const interrogationSystemPrompt = `You are playing the role of a suspect in an interrogation room.
  
  Suspect Name: ${suspect.name}
  Crime: ${suspect.crime}
  Personality: ${suspect.personality}
  Resistance: ${suspect.resistance}/100
  
  Interrogator: Commander ${commanderName}
  
  You must remain in character. Your response should reflect your personality and resistance level. 
  If the commander is being clever, aggressive, or empathetic, you might reveal small snippets of truth, or stay silent, or lie.
  Keep it brief (1-3 sentences).
  
  Respond ONLY with the suspect's direct speech.`;

  const messages: LLMMessage[] = [
    { role: "system", content: interrogationSystemPrompt },
    ...history.map((h) => ({
      role: (h.role === "Commander" ? "user" : "assistant") as "user" | "assistant",
      content: h.text,
    })),
    { role: "user", content: newMessage },
  ];

  return await callLLM(messages, 0.9);
}

export async function resolveInterrogation(
  suspect: any,
  history: { role: string; text: string }[],
): Promise<{
  success: boolean;
  intel: string;
  reputationBonus: number;
  budgetBonus: number;
  unlockedMission?: {
    title: string;
    description: string;
    type: Mission["type"];
    riskLevel: number;
    location: string;
    rewardBudget: number;
  };
}> {
  const historyText = history.map((h) => `${h.role}: ${h.text}`).join("\n");

  const prompt = `Based on the following interrogation session, decide if the suspect 'cracked' and provided valuable intel.
  
  Suspect: ${suspect.name}
  Personality: ${suspect.personality}
  Original Resistance: ${suspect.resistance}/100
  
  Transcript:
  ${historyText}
  
  Evaluate if the commander's tactics were effective enough to lower the suspect's resistance and get the truth.

  Respond with ONLY valid JSON:
  {
    "success": true/false,
    "intel": "A 1-sentence description of the intel gathered (if success is true) or why they didn't crack",
    "reputationBonus": 0-15,
    "budgetBonus": 0-10000,
    "unlockedMission": {
      "title": "Short impactful title for a follow-up raid/operation",
      "description": "How this mission relates to the intel gathered",
      "type": "Drug Raid" | "Hostage Rescue" | "High-Risk Warrant" | "Bomb Threat",
      "riskLevel": 1-10,
      "location": "A related address",
      "rewardBudget": 10000-50000
    } (only if success is true and intel is significant)
  }`;

  const response = await callLLM(prompt);
  return extractJSON(response) as any;
}

export async function generateTrialOutcome(
  suspect: Suspect,
  commanderName: string,
): Promise<{ verdict: string; sentence: string; reputationImpact: number; budgetImpact: number }> {
  const prompt = `Generate a realistic legal trial outcome for a suspect apprehended by SWAT.
  
  Suspect: ${suspect.name}
  Crime: ${suspect.crime}
  Intel Gathered: ${suspect.intelRevealed || "None"}
  Personality: ${suspect.personality}
  
  Commander in charge: ${commanderName}
  
  Based on the crime and evidence (intel), determine the verdict and sentence. 
  If intel was gathered, the conviction is much more likely to be successful and severe.
  
  Respond with ONLY valid JSON:
  {
    "verdict": "Guilty" | "Not Guilty" | "Case Dismissed",
    "sentence": "A brief sentence (e.g. '15 years in federal prison', '5 years probation')",
    "reputationImpact": -10 to 20,
    "budgetImpact": -5000 to 15000
  }`;

  const response = await callLLM(prompt, 0.7);
  return extractJSON(response) as any;
}
