// 🎭 SOUL ENGINE - Making AI content feel human
// The difference between "content" and "story" is the quiet moments,
// the specific details, the relationships, the things that linger.

import type { Mission, Officer } from "../types/game";

// Personal details that make officers feel like real people
export interface OfficerSoul {
  // Family & Relationships
  familyStatus: "single" | "married" | "divorced" | "widowed" | "complicated";
  hasKids: boolean;
  kidsDetails?: string; // "Twin girls, age 7. Always asks him to bring back his badge."
  significantOther?: string; // "Maria - ER nurse at St. Vincent's. They met on a call."

  // Personal quirks that emerge in dialogue
  coffeeOrder?: string; // "Black, two sugars, in the chipped blue mug"
  nervousHabit?: string; // "Taps his wedding ring against his thigh"
  superstition?: string; // "Always enters a room left foot first"
  carryItem?: string; // "Daughter's hair tie around his wrist"

  // History with squad
  closestFriend?: string; // Another officer's ID
  rivalry?: string; // Someone they butt heads with
  mentorOf?: string; // Rookie they're training
  mentoredBy?: string; // Who trained them

  // Psychological depth
  biggestFear: string;
  whatKeepsThemUp: string; // "The Marlowe case. The kid in the closet."
  whyTheyJoined: string; // Not "to serve" but the real reason
  secretTheyKeep: string; // Something only they know

  // Grounding details
  favoriteSong?: string;
  carTheyDrive?: string;
  neighborhoodTheyLiveIn?: string;
  weekendRoutine?: string;
}

// Moments that happen between missions - the quiet that defines us
export interface QuietMoment {
  id: string;
  type:
    | "memory" // Someone remembers something
    | "tradition" // Squad ritual
    | "conversation" // Two officers talking
    | "solitude" // Someone alone with thoughts
    | "artifact" // An object with meaning
    | "absence"; // Missing someone who's gone;
  description: string;
  involvedOfficers: string[];
  tone: "warm" | "melancholic" | "tense" | "hopeful" | "grieving";
  triggeredBy?: string; // What caused this moment
}

// Relationships that have weight and history
export interface Relationship {
  officer1Id: string;
  officer2Id: string;
  type: "friends" | "rivals" | "mentor-mentee" | "romantic" | "complicated" | "estranged";
  history: string; // "Went through academy together. Marcus saved his life in the parking garage incident."
  currentTension?: string; // Unresolved issues
  sharedMemory: string; // A moment they both reference
  insideJoke?: string;
}

// Things that linger - consequences that don't vanish
export interface LingeringConsequence {
  id: string;
  originEvent: string; // What caused this
  affectedOfficerId: string;
  type:
    | "guilt" // They made a choice that haunts them
    | "grief" // They lost someone
    | "trauma" // PTSD symptoms
    | "doubt" // Questioning their purpose
    | "growth" // Changed for the better
    | "bond"; // Forged connection through hardship
  manifestation: string; // How it shows up in behavior
  healingProgress: number; // 0-100
  triggered_by: string[]; // What brings it back
}

// The soul prompts - designed to elicit human content
export const SOUL_PROMPTS = {
  // Generate officer with actual humanity
  officerWithSoul: (existingOfficers: Officer[]) => `
Create a SWAT officer who feels like a real person, not a character sheet.

Existing team members: ${existingOfficers.map((o) => o.name).join(", ") || "None yet"}

DON'T give me:
- Generic motivations ("wanted to make a difference")
- Perfect heroes or pure villains
- Backstories that read like resumes
- Cookie-cutter family situations

DO give me:
- Specific, concrete details (not "has a family" but "his ex-wife texts him photos of their son's little league games that he misses")
- Contradictions (a sniper who's afraid of heights, a negotiator who can't talk to his own daughter)
- Quiet wounds (the case that didn't make the news but changed him)
- Small human moments (what's in his locker, what song he hums, what he orders at the diner after a late shift)
- A reason he's STILL here after seeing what he's seen

The best characters aren't defined by their strengths.
They're defined by what costs them sleep.

Respond with JSON including standard officer fields plus:
{
  "soul": {
    "familyStatus": "...",
    "kidsDetails": "...", // be specific
    "significantOther": "...", // include how they met
    "coffeeOrder": "...",
    "nervousHabit": "...",
    "superstition": "...",
    "carryItem": "...", // something they always have
    "biggestFear": "...", // be specific, not generic
    "whatKeepsThemUp": "...", // a specific memory
    "whyTheyJoined": "...", // the real reason, not the resume reason
    "secretTheyKeep": "...",
    "favoriteSong": "...",
    "weekendRoutine": "..."
  }
}`,

  // Generate a quiet moment after a mission
  quietMoment: (mission: Mission, officers: Officer[], outcome: string) => `
The mission "${mission.title}" just ended. ${outcome}

Now generate the QUIET MOMENT - what happens after the action stops.
Not the debrief. Not the report. The human part.

Officers present: ${officers.map((o) => `${o.name} (${o.specialization})`).join(", ")}

This could be:
- Two officers in the parking lot, not quite ready to go home
- Someone sitting in their car, hands still shaking, staring at nothing
- A phone call to check that their kid is sleeping safe
- Looking at a photo in a locker
- The weight of a triggr not pulled, or one that was
- Coffee that goes cold because no one feels like drinking it
- Someone humming a song their mother used to sing
- The silence in the van on the drive back

Make it SPECIFIC. Not "he thought about his family" but "he pulled up the photo of his daughter's gap-toothed smile and just stared at it for three red lights."

The soul is in the details. The pause before the sigh. The text message typed and deleted.

Respond with:
{
  "moment": "2-3 sentences of this specific quiet moment",
  "whoIsInvolved": ["officer names"],
  "whatItReveals": "what this tells us about them",
  "tone": "warm/melancholic/tense/hopeful/grieving"
}`,

  // Generate relationship history between two officers
  relationshipHistory: (officer1: Officer, officer2: Officer) => `
Create the HISTORY between these two officers.

${officer1.name} - ${officer1.specialization}, ${officer1.rank}
${officer2.name} - ${officer2.specialization}, ${officer2.rank}

Don't tell me they're "friends" or "partners." 
Tell me about the night in the hospital waiting room.
The argument in the parking lot that neither will mention.
The time one covered for the other.
The stupid bet they made years ago that one never paid up.
What they call each other when no one's listening.

Relationships aren't labels. They're accumulated moments.

Respond with:
{
  "type": "friends/rivals/mentor-mentee/complicated/estranged",
  "howTheyMet": "Specific moment, not just 'at the academy'",
  "sharedMemory": "A specific moment they both carry",
  "currentDynamic": "How they are NOW, not just history",
  "unsaidThing": "Something between them never spoken",
  "insideJoke": "Something that makes sense only to them",
  "ifOneOfThemDied": "What the other would carry forever"
}`,

  // Generate lingering consequence from a traumatic event
  lingeringConsequence: (officer: Officer, event: string) => `
Officer ${officer.name} was involved in: "${event}"

Now generate how this LINGERS. Not "they were affected."
Show me the specific ways it shows up.

PTSD isn't a montage. It's:
- A song on the radio that makes you pull over
- A smell that stops you in a grocery store
- A word your kid says that hits different now
- Checking the locks three times, then once more
- The dream that wakes you, and worse, the nights without dreams
- What you order now that you didn't before
- The route you drive to avoid the street
- The colleague you can't look in the eye

What specifically haunts ${officer.name}?
What small ordinary thing is now impossible?
What do they do at 3 AM when sleep won't come?

Respond with:
{
  "trigger": "Specific sensory trigger",
  "avoidance": "What they now avoid",
  "ritual": "New behavior developed to cope",
  "nightVersion": "What happens when it's dark and quiet",
  "whatNobodyKnows": "The part they hide",
  "smallProgress": "One tiny sign of healing, if any"
}`,

  // Add soul to a completed mission narrative
  missionWithSoul: (mission: Mission, officers: Officer[], events: string[]) => `
This mission happened: "${mission.title}"
Team: ${officers.map((o) => o.name).join(", ")}
Events: ${events.join(" → ")}

Now tell this story with SOUL. Not a report. Not a summary.
Include:

- The moment before entry, what each person was thinking
- A small detail that wouldn't be in any report (a child's drawing on the fridge, a dog that didn't bark, the smell of someone's dinner getting cold)
- The decision that didn't feel like a decision at the time
- What the sounds were, not just "gunfire" but "three shots, pause, one more"
- A fragment of conversation, half a sentence, the thing someone said
- What nobody said but everybody was thinking
- The drive back, what was on the radio, who spoke first
- Something someone will remember in 20 years

The difference between "we cleared the house" and literature
is the specific weight of a specific door in a specific hand.

Respond with a 4-6 paragraph narrative that a real person would want to read.`,
};

// Export for use in llmService
export default SOUL_PROMPTS;
