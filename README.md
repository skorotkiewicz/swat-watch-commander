# 🚔 SWAT Watch Commander

**SWAT Watch Commander** is a high-stakes, tactical squad management simulation where you take command of an elite police unit. Powered by a Large Language Model (LLM) acting as a dynamic "Game Master," every mission, every encounter, and every consequence is unique.

<p align="center">
  <img src="screenshot_hq.png" width="48%" />
  <img src="screenshot_mission.png" width="48%" />
</p>

## 🎖️ The Simulation
You don't just click buttons; you manage lives. Recruitment, tactical gear investment, departmental economics, and life-or-death decision-making all fall under your command.

### Key Features
- **Dynamic Mission Generator**: No two missions are the same. A local LLM generates high-fidelity scenarios from high-rise hostage rescues to high-risk warrants.
- **Persistent Squad Progression**: Officers gain experience, rank up from Rookie to Lieutenant, and increase their skills.
- **Tactical Gear System**: Invest your budget into Elite Armor, Weapons, and Utility gear to increase your squad's survival rate.
- **Economic Realism**: Manage daily city funding against officer payroll. You can't just throw bodies at a problem—every casualty and every dismissal has a cost.
- **Narrative Resolution**: Decisions are resolved by the AI Game Master, factoring in officer skills, equipment levels, and tactical risk.

## 👮‍♂️ Legend of the Force
> "My best officer is Lieutenant Elena Rodriguez. 17 missions. 17 successes. She's the backbone of this department." — *Commander's Log*

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with custom premium aesthetics.
- **State Management**: Custom React Hooks with LocalStorage persistence.
- **AI Backend**: OpenAI-compatible API (supports local models like Llama 3, Mistral, or Gemini via local proxy).

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- A running LLM API (local or cloud) compatible with the OpenAI spec.

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/skorotkiewicz/swat-watch-commander.git
   cd swat-watch-commander
   ```
2. Install dependencies:
   ```bash
   bun install # or npm install
   ```
3. Configure your environment:
   Create a `.env` file in the root directory:
   ```env
   VITE_LLM_URL=https://api.your-provider.com/v1/chat/completions
   VITE_LLM_MODEL=gpt-4o # Or any OpenAI-compatible model
   ```
4. Run the development server:
   ```bash
   bun dev # or npm run dev
   ```

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).

---
*Built with passion by the SWAT Fans.*
