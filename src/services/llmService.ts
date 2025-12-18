// LLM Service for SWAT Watch Commander
// Single unified call to OpenAI-compatible API

import type { Mission, MissionEvent, MissionOption, Officer } from "../types/game";

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
async function callLLM(prompt: string, temperature = 0.8): Promise<string> {
  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

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
Risk Level of Choice: ${chosenOption.riskLevel}/10

Officers involved:
${officers
  .map(
    (o) =>
      `- ${o.name} (${o.specialization}) - Health: ${o.health}%, Skills: Marksmanship ${o.skills.marksmanship}, Tactics ${o.skills.tactics}, Composure ${o.skills.composure}. Gear: Armor Lvl ${o.gear.armorLevel}, Weapons Lvl ${o.gear.weaponLevel}, Utility Lvl ${o.gear.utilityLevel}`,
  )
  .join("\n")}

${chosenOption.requiredSpecialization ? `Note: This action benefits from a ${chosenOption.requiredSpecialization}. Team ${officers.some((o) => o.specialization === chosenOption.requiredSpecialization) ? "HAS" : "does NOT have"} this specialist.` : ""}

Based on the risk level, officer capabilities, and realistic tactical outcomes, determine what happens.
Higher risk choices have higher chance of casualties but potentially better outcomes.
Consider officer skills and equipment (higher armor reduces injury risk, better weapons improve success) when determining success.

Respond with ONLY valid JSON:
{
  "outcome": "2-3 sentence description of what happened",
  "casualties": ["list of officer names who were KIA, or empty array"],
  "injuries": ["list of officer names who were injured, or empty array"],
  "missionComplete": true/false,
  "success": true/false (only relevant if missionComplete is true)
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
