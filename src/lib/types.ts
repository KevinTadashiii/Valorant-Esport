export type PlayerRole =
  | "Duelist"
  | "Initiator"
  | "Controller"
  | "Sentinel"
  | "Flex";

export type EconomyState = "Full" | "Force" | "Eco";

export interface PlayerStats {
  aim: number; // 1-100: Raw fragging capability
  utility: number; // 1-100: Utility/skill usage efficiency
  morale: number; // 1-100: Affects performance when trailing in score
  discipline: number; // 1-100: Affects probability of negative random events
}

export interface Contract {
  salary: number; // Salary per period/week
  buyout: number; // Buyout value for transfer to another team
  isLoaned: boolean; // Loan status
  duration: number; // Remaining contract duration
}

export interface Player {
  id: string;
  name: string;
  alias: string; // In-game name (IGN)
  role: PlayerRole;
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
  economyA: EconomyState;
  economyB: EconomyState;
  matchLog: string[]; // Narrative text log from round simulation
  isFinished?: boolean;
  winner?: Team;
}

export interface GameEvent {
  id: string;
  type: "SCANDAL" | "VOLUNTARY_TRANSFER" | "GENERAL";
  title: string;
  description: string;
  affectedPlayerId?: string;
  affectedTeamId?: string;
  timestamp: Date | string;
}

export interface RoundSimulationResult {
  roundWinner: "teamA" | "teamB";
  scoreA: number;
  scoreB: number;
  currentRound: number;
  logs: string[];
  isMatchOver: boolean;
  matchWinner?: "teamA" | "teamB";
}

export interface MarketActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface BuyoutResult {
  buyerTeam: Team;
  sellerTeam?: Team;
  player: Player;
  feePaid: number;
}

export interface LoanResult {
  borrowerTeam: Team;
  lendingTeam?: Team;
  player: Player;
  feePaid: number;
  duration: number;
}

export interface TerminationResult {
  team: Team;
  terminatedPlayer: Player;
  penaltyPaid: number;
  moralePenaltyApplied: number;
}

export interface RosterActionResult {
  team: Team;
  message: string;
}

export interface TransferListingResult {
  team: Team;
  player: Player;
  message: string;
}
