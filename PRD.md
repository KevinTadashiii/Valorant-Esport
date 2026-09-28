# Product Requirements Document (PRD) — Tactical Esports Manager Simulator

## 1. Project Overview

A web-based esports team management simulator game (inspired by the competitive CS2/Valorant ecosystem). The game focuses purely on UI/UX architecture and mathematical calculations (no interactive 3D graphics). The player acts as a Manager/Coach who builds a dream team, manages the transfer market, handles probabilistic random events, and runs tactical match simulations until one team reaches a score of 13.

## 2. Tech Stack & Engineering Standards

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode must be enabled)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI (Radix UI)
- **State Management:** Zustand (for global game state, roster, economy, and progress)
- **Icons:** Lucide React
- **Architecture Pattern:** Separation of Concerns (strict separation between UI Components, Game Engine/Logic, and Global State).

## 3. Core Data Structures

The following fundamental data structures must be implemented in the interface file (e.g., `src/lib/types.ts`):

```typescript
// Base types for player statistics
export interface PlayerStats {
  aim: number; // 1–100: Raw fragging capability
  utility: number; // 1–100: Utility/skill usage efficiency
  morale: number; // 1–100: Affects performance when trailing in score
  discipline: number; // 1–100: Affects probability of triggering negative random events
}

export interface Contract {
  salary: number; // Salary per period/week
  buyout: number; // Termination value for transfer to another team
  isLoaned: boolean; // Loan status
  duration: number; // Remaining contract duration
}

export interface Player {
  id: string;
  name: string;
  alias: string; // In-game name (IGN)
  role: "Duelist" | "Initiator" | "Controller" | "Sentinel" | "Flex";
  stats: PlayerStats;
  contract: Contract;
  isSuspended?: boolean;
  suspensionMatches?: number;
  isTransferListed?: boolean;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  roster: Player[]; // Maximum 5 starting players
  bench: Player[]; // Reserve players
  winRate?: number; // Team win-rate ratio
}

export interface MatchState {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  currentRound: number;
  economyA: "Full" | "Force" | "Eco";
  economyB: "Full" | "Force" | "Eco";
  matchLog: string[]; // Narrative text log from round simulation
  isFinished?: boolean;
  winner?: Team;
  overtime?: {
    roundsPlayed: number;
    scoreAOvertime: number;
    scoreBOvertime: number;
  };
}
```

## 4. Core Game Mechanics (Backend/Logic)

The following logic modules must be isolated within the `src/lib/engine/` directory:

### A. Roster & Market Management (`marketEngine.ts`)

- **Buyout:** Validates the buyer team's budget. If sufficient, deducts the buyout cost from the buyer's budget, removes the player from the seller team (if provided), and moves the player to the buyer team's bench.
- **Loan:** Borrows a player at a low upfront cost while deducting from the regular budget. Sets `isLoaned` to `true`.
- **Terminate:** Unilateral contract termination. Requires the team to pay a severance penalty and triggers a morale reduction on remaining roster players by a specified percentage.
- **Roster Swap / Move:** Supports swapping starter and bench players, moving players between roster and bench, with validation that the roster never exceeds the maximum limit (5).

### B. Dynamic Stochastic Events (`eventEngine.ts`)

- **Event Trigger:** Executed synchronously on every time-step iteration (week transition or post-match).
- **External Scandals:** Probability is triggered when a player's `discipline` stat is below 50. Requires a weighted random generator. Mutation effects: `morale` decreases, and the player is suspended for N matches. Parameters (threshold, probability, suspension duration) should be configurable rather than hardcoded.
- **Voluntary Transfer (Farewell):** Probability is triggered when the team's win rate is below 40% and the player's average hard stats (aim + utility) are in the top percentile. Forces the player's status to `Transfer Listed`. The win-rate check should reference the team's `winRate` field directly, not compute a derived ratio from match scores.

### C. Round Simulation Engine (`roundSimulator.ts`)

> **Status: Not yet implemented.** This module is the core gameplay loop and must be built before UI integration.

- **Win Condition:** The first team to reach a score of 13 wins (MR24 format). If the score is tied 12-12, overtime begins: the first team to lead by 2 rounds wins.
- **Probabilistic System:** Uses a layered weighted-probability algorithm:
  1. **Economy Phase:** Determine an economy modifier. A team with a "Full Buy" against an "Eco" opponent gains a +40% win probability bonus for the current round.
  2. **Stat Comparison:** Aggregate and compare the `aim` and `utility` values of the five active roster players on each team.
  3. **Stochastic Roll:** Generate a random number (0–100), apply economy and stat-comparison modifiers, then determine the round outcome (Team A or Team B wins).
  4. **Log Generation:** Produce a descriptive string per round phase for feeding into the UI state (e.g., "Player A gets an entry kill", "Team B wins the round with a retake").

## 5. UI/UX Architecture

Client-side interface implemented with Shadcn/UI to create a managerial dashboard aesthetic.

- **`/dashboard`**: Aggregate view of team metrics, remaining budget, starting roster, and a notification log panel for stochastic events.
- **`/market`**: Complex data grid table with filtering and sorting (by Role, Value, Stats). Integration of `[Buy Out]` and `[Loan]` actions.
- **`/team`**: Tactical management panel. Supports drag-and-drop actions to move players between Bench and Starter. Integration of `[Terminate Contract]` action.
- **`/match`**: Match simulation execution screen.
  - Scoreboard header (Team A vs Team B).
  - Conditional visual indicators for each team's economy status.
  - Terminal or `ScrollArea` component rendering the `matchLog` array reactively and sequentially (e.g., with timed iterations or a "Next Round" button trigger).

## 6. Implementation Notes

- **Build incrementally.** Do not attempt to construct the application monolithically in a single session. Wait for user authorization before moving between development phases (Initialization → Data Structures → Engine Logic → UI Components).
- **Synchronize data with Zustand global state** before rendering React components.
- **Prioritize type safety** in TypeScript. Avoid `any` types.
- The stochastic event thresholds (scandal probability, transfer win-rate cutoff, suspension duration) should be exposed as configurable constants or parameters, not hard-coded literals.
